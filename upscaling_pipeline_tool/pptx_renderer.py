"""Native PowerPoint export for the editable flowsheet view.

The generated deck intentionally uses ordinary PowerPoint shapes, connector
segments, and text boxes instead of embedding the SVG as an image. That keeps
the slide editable after export.
"""

from __future__ import annotations

import io
import re
import zipfile
from html import escape
from typing import Any


EMU_PER_INCH = 914400


def _clean(value: Any, default: str = "") -> str:
    text = str(value or "").strip()
    return re.sub(r"\s+", " ", text) if text else default


def _xml(value: Any) -> str:
    return escape(_clean(value), quote=True)


def _color(value: str) -> str:
    return re.sub(r"[^0-9a-fA-F]", "", value or "")[:6].upper() or "172027"


def _float(value: Any, default: float = 0) -> float:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return default
    return result if result == result else default


def _stream_label(stream: dict[str, Any]) -> str:
    name = _clean(stream.get("name"), "stream")
    qty = _clean(stream.get("quantity"))
    unit = _clean(stream.get("unit"))
    return f"{name}{', ' + qty + (' ' + unit if unit else '') if qty else ''}"


def _mass_kg(stream: dict[str, Any]) -> float:
    qty = _clean(stream.get("quantity")).replace(",", ".")
    match = re.search(r"[-+]?\d+(?:\.\d+)?", qty)
    if not match:
        return 0
    value = float(match.group(0))
    unit = _clean(stream.get("unit")).lower()
    if unit in ("kg", "kilogram", "kilograms"):
        return value
    if unit in ("g", "gram", "grams"):
        return value / 1000
    if unit in ("mg", "milligram", "milligrams"):
        return value / 1_000_000
    return 0


def _link_mass_kg(link: dict[str, Any]) -> float:
    return sum(_mass_kg(stream) for stream in link.get("directStreams") or [] if isinstance(stream, dict))


def _clip_words(value: Any, max_chars: int, min_chars: int = 8) -> str:
    text = _clean(value)
    if len(text) <= max_chars:
        return text
    if max_chars < min_chars + 3:
        return ""
    prefix = text[: max_chars - 3]
    cut = max(prefix.rfind(" "), prefix.rfind("/"), prefix.rfind("-"))
    clipped = prefix[:cut].strip() if cut >= min_chars else prefix.strip()
    return f"{clipped}..." if clipped else ""


def _compact_link_label(link: dict[str, Any], kind: str = "process") -> str:
    streams = [item for item in link.get("directStreams") or [] if isinstance(item, dict)]
    if not streams:
        return kind
    stream = streams[0]
    name = _clean(stream.get("name"), "stream")
    qty = _clean(stream.get("quantity"))
    unit = _clean(stream.get("unit"))
    full = f"{name}{', ' + qty + (' ' + unit if unit else '') if qty else ''}"
    return _clip_words(full, 28) or _clip_words(name, 24) or kind


def _category_label(category: Any) -> str:
    labels = {
        "reactor": "Reactor",
        "separation": "Separation",
        "utility": "Utility",
        "storage": "Storage",
        "waste": "Waste",
    }
    return labels.get(_clean(category), "Unit")


class _ShapeWriter:
    def __init__(self, scale: float, x_offset: float, y_offset: float) -> None:
        self.scale = scale
        self.x_offset = x_offset
        self.y_offset = y_offset
        self.next_id = 2
        self.parts: list[str] = []

    def _emu(self, value: float) -> int:
        return int(round(value))

    def map_x(self, px: Any) -> int:
        return self._emu(self.x_offset + _float(px) * self.scale)

    def map_y(self, px: Any) -> int:
        return self._emu(self.y_offset + _float(px) * self.scale)

    def map_len(self, px: Any) -> int:
        return max(1, self._emu(_float(px) * self.scale))

    def _id(self) -> int:
        value = self.next_id
        self.next_id += 1
        return value

    def rect(self, x: Any, y: Any, w: Any, h: Any, *, fill: str, line: str, radius: bool = False, name: str = "Shape") -> None:
        shape_id = self._id()
        prst = "roundRect" if radius else "rect"
        self.parts.append(f"""
          <p:sp>
            <p:nvSpPr><p:cNvPr id="{shape_id}" name="{_xml(name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
            <p:spPr>
              <a:xfrm><a:off x="{self.map_x(x)}" y="{self.map_y(y)}"/><a:ext cx="{self.map_len(w)}" cy="{self.map_len(h)}"/></a:xfrm>
              <a:prstGeom prst="{prst}"><a:avLst/></a:prstGeom>
              <a:solidFill><a:srgbClr val="{_color(fill)}"/></a:solidFill>
              <a:ln w="12700"><a:solidFill><a:srgbClr val="{_color(line)}"/></a:solidFill></a:ln>
            </p:spPr>
            <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
          </p:sp>""")

    def textbox(self, x: Any, y: Any, w: Any, h: Any, text: str, *, size: float = 10, color: str = "172027", bold: bool = False, name: str = "Text", max_lines: int = 4) -> None:
        shape_id = self._id()
        lines = _wrap(text, max(10, int(_float(w) / max(size * 0.45, 4))), max_lines)
        paragraphs = "".join(
            f"""<a:p><a:r><a:rPr lang="en-US" sz="{int(size * 100)}" b="{'1' if bold else '0'}"><a:solidFill><a:srgbClr val="{_color(color)}"/></a:solidFill></a:rPr><a:t>{_xml(line)}</a:t></a:r><a:endParaRPr lang="en-US" sz="{int(size * 100)}"/></a:p>"""
            for line in lines
        ) or "<a:p/>"
        self.parts.append(f"""
          <p:sp>
            <p:nvSpPr><p:cNvPr id="{shape_id}" name="{_xml(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
            <p:spPr>
              <a:xfrm><a:off x="{self.map_x(x)}" y="{self.map_y(y)}"/><a:ext cx="{self.map_len(w)}" cy="{self.map_len(h)}"/></a:xfrm>
              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln>
            </p:spPr>
            <p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0"/><a:lstStyle/>{paragraphs}</p:txBody>
          </p:sp>""")

    def label(self, x: Any, y: Any, w: Any, text: str, *, color: str = "172027", name: str = "Label") -> None:
        if not _clean(text):
            return
        self.rect(x, y, w, 18, fill="FFFFFF", line="D6E0E5", radius=True, name=f"{name} background")
        self.textbox(_float(x) + 6, _float(y) + 3, max(1, _float(w) - 12), 12, text, size=8.3, color=color, bold=True, name=name, max_lines=1)

    def line(self, x1: Any, y1: Any, x2: Any, y2: Any, *, color: str = "172027", width: float = 2.2, arrow: bool = False, dash: bool = False) -> None:
        shape_id = self._id()
        x1e, y1e = self.map_x(x1), self.map_y(y1)
        x2e, y2e = self.map_x(x2), self.map_y(y2)
        off_x, off_y = min(x1e, x2e), min(y1e, y2e)
        ext_x, ext_y = max(1, abs(x2e - x1e)), max(1, abs(y2e - y1e))
        flip_h = ' flipH="1"' if x2e < x1e else ""
        flip_v = ' flipV="1"' if y2e < y1e else ""
        dash_xml = '<a:prstDash val="dash"/>' if dash else ""
        arrow_xml = '<a:tailEnd type="triangle"/>' if arrow else ""
        self.parts.append(f"""
          <p:sp>
            <p:nvSpPr><p:cNvPr id="{shape_id}" name="Connector"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
            <p:spPr>
              <a:xfrm{flip_h}{flip_v}><a:off x="{off_x}" y="{off_y}"/><a:ext cx="{ext_x}" cy="{ext_y}"/></a:xfrm>
              <a:prstGeom prst="line"><a:avLst/></a:prstGeom>
              <a:ln w="{max(6350, int(width * 12700))}" cap="round"><a:solidFill><a:srgbClr val="{_color(color)}"/></a:solidFill>{dash_xml}{arrow_xml}</a:ln>
            </p:spPr>
            <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
          </p:sp>""")


def _wrap(text: Any, width: int, max_lines: int = 2) -> list[str]:
    words = _clean(text).split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if current and len(candidate) > width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines[:max_lines]


def _center(box: dict[str, Any]) -> tuple[float, float]:
    return _float(box.get("x")) + _float(box.get("w")) / 2, _float(box.get("y")) + _float(box.get("h")) / 2


def _port(from_box: dict[str, Any], to_box: dict[str, Any], offset: float = 12) -> tuple[float, float]:
    from_x, from_y = _center(from_box)
    to_x, to_y = _center(to_box)
    dx, dy = to_x - from_x, to_y - from_y
    x, y, w, h = (_float(from_box.get("x")), _float(from_box.get("y")), _float(from_box.get("w")), _float(from_box.get("h")))
    if abs(dx) >= abs(dy):
        return (x + w + offset, from_y) if dx >= 0 else (x - offset, from_y)
    return (from_x, y + h + offset) if dy >= 0 else (from_x, y - offset)


def _route(from_box: dict[str, Any], to_box: dict[str, Any]) -> list[tuple[float, float]]:
    start = _port(from_box, to_box, 10)
    end = _port(to_box, from_box, 14)
    if abs(start[1] - end[1]) < 3 or abs(start[0] - end[0]) < 3:
        return [start, end]
    if abs(start[0] - end[0]) >= abs(start[1] - end[1]):
        mid_x = (start[0] + end[0]) / 2
        return [start, (mid_x, start[1]), (mid_x, end[1]), end]
    mid_y = (start[1] + end[1]) / 2
    return [start, (start[0], mid_y), (end[0], mid_y), end]


def _draw_polyline(writer: _ShapeWriter, points: list[tuple[float, float]], *, color: str, width: float, arrow: bool = True, dash: bool = False) -> None:
    clean_points = [point for index, point in enumerate(points) if index == 0 or point != points[index - 1]]
    for index in range(len(clean_points) - 1):
        x1, y1 = clean_points[index]
        x2, y2 = clean_points[index + 1]
        writer.line(x1, y1, x2, y2, color=color, width=width, arrow=arrow and index == len(clean_points) - 2, dash=dash)


def _label_anchor(points: list[tuple[float, float]]) -> tuple[float, float, float] | None:
    best: tuple[float, float, float] | None = None
    for index in range(len(points) - 1):
        a = points[index]
        b = points[index + 1]
        if abs(a[1] - b[1]) > 1:
            continue
        length = abs(b[0] - a[0])
        if best is None or length > best[2]:
            best = (min(a[0], b[0]) + 6, a[1] - 23, length - 12)
    if best is None or best[2] < 88:
        return None
    return best


def _draw_link_label(writer: _ShapeWriter, points: list[tuple[float, float]], label: str, color: str) -> None:
    anchor = _label_anchor(points)
    if not anchor:
        return
    x, y, available = anchor
    compact = _clip_words(label, max(10, int(available / 5.5)), 8)
    if not compact:
        return
    writer.label(x, y, min(available, max(74, len(compact) * 5.6 + 18)), compact, color=color, name="Stream label")


def _draw_legend(writer: _ShapeWriter, diagram_w: float, diagram_h: float, category_styles: dict[str, tuple[str, str]]) -> None:
    x = 36
    y = max(96, diagram_h - 78)
    writer.rect(x - 10, y - 18, min(790, diagram_w - 52), 58, fill="FFFFFF", line="D6E0E5", radius=True, name="Legend Panel")
    writer.textbox(x, y - 12, 72, 14, "Legend", size=9.5, color="657480", bold=True, name="Legend title")

    line_items = [
        ("Process", "172027", False),
        ("Recycle", "25834A", True),
        ("Waste", "965D00", False),
        ("Vent/VOC", "657480", True),
    ]
    cursor_x = x + 78
    for label, color, dash in line_items:
        writer.line(cursor_x, y - 4, cursor_x + 28, y - 4, color=color, width=2.2, arrow=True, dash=dash)
        writer.textbox(cursor_x + 36, y - 11, 70, 14, label, size=8.2, color=color, bold=True, name=f"Legend {label}")
        cursor_x += 114

    category_items = ["reactor", "separation", "utility", "storage", "waste"]
    cursor_x = x + 78
    for category in category_items:
        fill, line = category_styles[category]
        writer.rect(cursor_x, y + 17, 13, 10, fill=fill, line=line, radius=True, name=f"Legend {_category_label(category)} swatch")
        writer.textbox(cursor_x + 18, y + 15, 72, 14, _category_label(category), size=8.0, color="40515D", bold=True, name=f"Legend {_category_label(category)}")
        cursor_x += 104


def _content_types() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>"""


def _root_rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""


def _presentation_xml(width: int, height: int) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>
  <p:sldSz cx="{width}" cy="{height}" type="custom"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>"""


def _presentation_rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>"""


def _core_props() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Editable process flowsheet</dc:title>
  <dc:creator>Process Upscaling Workbench</dc:creator>
</cp:coreProperties>"""


def _app_props() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Process Upscaling Workbench</Application>
  <Slides>1</Slides>
</Properties>"""


def _slide_xml(shape_tree: str) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      {shape_tree}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>"""


def render_flowsheet_pptx(payload: dict[str, Any]) -> bytes:
    flowsheet = payload.get("flowsheet") if isinstance(payload, dict) else None
    if not isinstance(flowsheet, dict):
        raise ValueError("Missing flowsheet export model.")

    groups = [item for item in flowsheet.get("groups") or [] if isinstance(item, dict)]
    if not groups:
        raise ValueError("No grouped operations available for PowerPoint export.")

    diagram_w = max(900, _float(flowsheet.get("width"), 1880))
    diagram_h = max(620, _float(flowsheet.get("height"), 760))
    slide_w = int(min(22.0, max(13.333, diagram_w / 96)) * EMU_PER_INCH)
    slide_h = int(min(14.0, max(7.5, diagram_h / 96)) * EMU_PER_INCH)
    margin = int(0.28 * EMU_PER_INCH)
    scale = min((slide_w - margin * 2) / diagram_w, (slide_h - margin * 2) / diagram_h)
    writer = _ShapeWriter(scale, (slide_w - diagram_w * scale) / 2, (slide_h - diagram_h * scale) / 2)

    category_styles = {
        "reactor": ("FFF8F7", "CF4B42"),
        "separation": ("F5F9FF", "1671C2"),
        "utility": ("FFFAF0", "B97916"),
        "storage": ("F1FBFA", "0F766E"),
        "waste": ("FAF8F5", "8B7057"),
    }

    writer.rect(0, 0, diagram_w, diagram_h, fill="FFFFFF", line="172027", name="Drawing Border")
    writer.textbox(30, 28, 620, 32, _clean(flowsheet.get("title"), "Generated Process Flowsheet"), size=18, bold=True)
    writer.textbox(30, 62, 980, 28, _clean(flowsheet.get("basis"), "Editable PowerPoint export from declared process links."), size=10.5, color="657480")

    by_id = {_clean(group.get("id")): group for group in groups}
    max_kg = max(0.01, *[_float(group.get("totalOutputKg")) for group in groups])

    def stroke_width(link: dict[str, Any], fallback: float = 2.4) -> float:
        kg = _link_mass_kg(link)
        return min(4.2, max(1.8, (kg / max_kg) * 2.8 + 1.4)) if kg > 0 else fallback

    for link in flowsheet.get("forwardLinks") or []:
        if not isinstance(link, dict):
            continue
        src, dst = by_id.get(_clean(link.get("from"))), by_id.get(_clean(link.get("to")))
        if not src or not dst:
            continue
        points = _route(src, dst)
        _draw_polyline(writer, points, color="172027", width=stroke_width(link), arrow=True)
        _draw_link_label(writer, points, _compact_link_label(link, "process"), "172027")

    for link in flowsheet.get("auxiliaryLinks") or []:
        if not isinstance(link, dict):
            continue
        src, dst = by_id.get(_clean(link.get("from"))), by_id.get(_clean(link.get("to")))
        if not src or not dst:
            continue
        kind = _clean(link.get("kind"), "waste")
        color = "657480" if kind == "vent" else "25834A" if kind == "recovery" else "965D00"
        points = _route(src, dst)
        _draw_polyline(writer, points, color=color, width=2.0, arrow=True, dash=kind in ("vent", "recovery"))
        if kind in ("waste", "vent", "recovery"):
            _draw_link_label(writer, points, _compact_link_label(link, kind), color)

    for link in flowsheet.get("recycleLinks") or []:
        if not isinstance(link, dict):
            continue
        src, dst = by_id.get(_clean(link.get("from"))), by_id.get(_clean(link.get("to")))
        if not src or not dst:
            continue
        s = (_float(src.get("x")) + _float(src.get("w")) * 0.3, _float(src.get("y")) + _float(src.get("h")) + 12)
        e = (_float(dst.get("x")) + _float(dst.get("w")) * 0.7, _float(dst.get("y")) + _float(dst.get("h")) + 16)
        lane = max(_float(src.get("y")) + _float(src.get("h")), _float(dst.get("y")) + _float(dst.get("h"))) + 72
        points = [s, (s[0], lane), (e[0], lane), e]
        _draw_polyline(writer, points, color="25834A", width=2.3, arrow=True, dash=True)
        _draw_link_label(writer, points, f"recycle {_clean(link.get('from'))} to {_clean(link.get('to'))}", "25834A")

    feed_box = flowsheet.get("feedBox")
    if isinstance(feed_box, dict):
        writer.rect(feed_box.get("x"), feed_box.get("y"), feed_box.get("w"), feed_box.get("h"), fill="E9F7ED", line="25834A", radius=True, name="Feed")
        writer.textbox(_float(feed_box.get("x")) + 10, _float(feed_box.get("y")) + 14, _float(feed_box.get("w")) - 20, 22, "FEED / STORAGE", size=10, color="25834A", bold=True)
        feed_streams = [item for item in (groups[0].get("inputStreams") if groups else []) or [] if isinstance(item, dict)]
        for index, stream in enumerate(feed_streams[:3]):
            row_y = _float(feed_box.get("y")) + 40 + index * 22
            writer.label(
                _float(feed_box.get("x")) + 12,
                row_y - 7,
                _float(feed_box.get("w")) - 24,
                _clip_words(_stream_label(stream), 26) or "feed",
                color="172027",
                name="Feed stream",
            )

    product_box = flowsheet.get("productBox")
    if isinstance(product_box, dict):
        writer.rect(product_box.get("x"), product_box.get("y"), product_box.get("w"), product_box.get("h"), fill="E9F7ED", line="25834A", radius=True, name="Product")
        product_group_id = _clean(flowsheet.get("productGroupId"))
        product_group = by_id.get(product_group_id) or groups[-1]
        product_streams = [item for item in product_group.get("outputStreams") or [] if isinstance(item, dict)]
        product_stream = next((stream for stream in product_streams if _clean(stream.get("fate")) == "product"), product_streams[0] if product_streams else None)
        product_label = _clip_words(_clean(product_stream.get("name") if product_stream else "", "PRODUCT").upper(), 22) if product_stream else "PRODUCT"
        product_qty = _clean(product_stream.get("quantity") if product_stream else "")
        product_unit = _clean(product_stream.get("unit") if product_stream else "")
        writer.textbox(_float(product_box.get("x")) + 12, _float(product_box.get("y")) + 20, _float(product_box.get("w")) - 24, 28, product_label, size=13, color="172027", bold=True)
        if product_qty:
            writer.textbox(_float(product_box.get("x")) + 12, _float(product_box.get("y")) + 50, _float(product_box.get("w")) - 24, 18, f"{product_qty} {product_unit}".strip(), size=9.5, color="25834A", bold=True)

    for group in groups:
        fill, line = category_styles.get(_clean(group.get("category")), ("F5F9FF", "1671C2"))
        x, y, w, h = _float(group.get("x")), _float(group.get("y")), _float(group.get("w")), _float(group.get("h"))
        if group.get("concurrent"):
            writer.rect(x - 16, y - 16, w + 16, h + 16, fill="EEF2F4", line="9AA7B0", radius=True, name=f"{_clean(group.get('id'))} concurrent lane")
        writer.rect(x - 8, y - 8, w + 16, h + 16, fill="FFFFFF", line="D6E0E5", radius=True, name=f"{_clean(group.get('id'))} outer")
        writer.rect(x - 8, y - 8, 5, h + 16, fill=line, line=line, radius=True, name=f"{_clean(group.get('id'))} category stripe")
        writer.rect(x + 14, y + h * 0.52, w - 28, h * 0.40, fill=fill, line=line, radius=True, name=f"{_clean(group.get('id'))} label")
        writer.textbox(x + 22, y + 22, w - 44, 34, _category_label(group.get("category")), size=11.5, color=line, bold=True)
        writer.textbox(x + 20, y + h * 0.55, w - 40, 18, f"U{int(_float(group.get('unitNumber'), 0)) or ''} {_clean(group.get('id'))}".strip(), size=10.5, color=line, bold=True)
        writer.textbox(x + 20, y + h * 0.66, w - 40, 26, _clip_words(_clean(group.get("selectedUnit"), "unassigned unit"), 36), size=9.0, color="172027", bold=True)
        task = _clip_words(_clean(group.get("task")), 42)
        if task:
            writer.textbox(x + 20, y + h * 0.82, w - 40, 18, task, size=7.8, color="657480")

    _draw_legend(writer, diagram_w, diagram_h, category_styles)

    pptx = io.BytesIO()
    with zipfile.ZipFile(pptx, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", _content_types())
        zf.writestr("_rels/.rels", _root_rels())
        zf.writestr("ppt/presentation.xml", _presentation_xml(slide_w, slide_h))
        zf.writestr("ppt/_rels/presentation.xml.rels", _presentation_rels())
        zf.writestr("ppt/slides/slide1.xml", _slide_xml("".join(writer.parts)))
        zf.writestr("ppt/slides/_rels/slide1.xml.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>""")
        zf.writestr("docProps/core.xml", _core_props())
        zf.writestr("docProps/app.xml", _app_props())
    return pptx.getvalue()
