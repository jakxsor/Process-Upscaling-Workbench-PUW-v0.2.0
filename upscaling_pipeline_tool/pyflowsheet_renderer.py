"""Optional pyflowsheet renderer for technical process-flow SVG output."""

from __future__ import annotations

import re
from typing import Any


def _clean(value: Any, default: str = "") -> str:
    text = str(value or "").strip()
    return re.sub(r"\s+", " ", text) if text else default


def _short(value: Any, limit: int = 42) -> str:
    text = _clean(value)
    if len(text) <= limit:
        return text
    return text[: max(0, limit - 1)].rstrip() + "…"


def _unit_kind(group: dict[str, Any]) -> str:
    text = f"{group.get('selectedUnit', '')} {group.get('task', '')}".lower()
    if "distill" in text or "short-path" in text:
        return "distillation"
    if any(word in text for word in ("exchanger", "cooler", "heater", "condenser")):
        return "heat_exchanger"
    if any(word in text for word in ("reactor", "reaction", "reflux")):
        return "reactor"
    if any(word in text for word in ("extract", "decanter", "mixer-settler", "wash")):
        return "settler"
    if any(word in text for word in ("dry", "sieve", "adsorb", "bed")):
        return "dryer"
    if any(word in text for word in ("evaporat", "thin-film", "flash")):
        return "evaporator"
    if any(word in text for word in ("tank", "feed", "charge", "storage")):
        return "tank"
    return "blackbox"


def _conditions_line(group: dict[str, Any]) -> str:
    items = group.get("conditionAggregation") or []
    if not isinstance(items, list):
        return ""
    picked = []
    for item in items:
        if not isinstance(item, dict):
            continue
        display = _clean(item.get("display"))
        if display:
            picked.append(display)
        if len(picked) >= 3:
            break
    return " / ".join(picked)


def _mass_line(group: dict[str, Any]) -> str:
    aggr = group.get("mfaAggregation") or []
    if not isinstance(aggr, list):
        return ""
    for role_group in aggr:
        if not isinstance(role_group, dict) or role_group.get("role") != "output":
            continue
        for item in role_group.get("items") or []:
            if not isinstance(item, dict):
                continue
            total = _clean(item.get("total"))
            name = _clean(item.get("name"))
            if total:
                return f"{name}: {total}" if name else total
    return ""


def _port(unit: Any, names: tuple[str, ...]) -> Any:
    for name in names:
        if name in unit.ports:
            return unit[name]
    raise KeyError(f"No compatible port found on {unit.id}; available ports: {', '.join(unit.ports.keys())}")


def _ports(unit: Any, kind: str) -> tuple[Any, Any]:
    if kind == "heat_exchanger":
        return _port(unit, ("TIn", "In")), _port(unit, ("TOut", "Out"))
    if kind == "distillation":
        return _port(unit, ("Feed", "In")), _port(unit, ("Bottom", "LOut", "Top", "VOut", "Out"))
    return _port(unit, ("In", "Feed", "TIn")), _port(unit, ("Out", "Bottom", "LOut", "TOut", "Top"))


def _schedule(group: dict[str, Any]) -> dict[str, Any]:
    schedule = group.get("schedule")
    return schedule if isinstance(schedule, dict) else {}


def _can_overlap(group: dict[str, Any]) -> bool:
    schedule = _schedule(group)
    gid = _clean(group.get("groupId"))
    return (
        _clean(schedule.get("canOverlap")).lower() == "yes"
        or any(word in _clean(schedule.get("dependency")).lower() for word in ("overlap", "parallel", "concurrent"))
        or bool(re.search(r"-P[2-9]\d*$", gid, flags=re.I))
    )


def _duration_label(group: dict[str, Any]) -> str:
    duration = _clean(_schedule(group).get("durationH"))
    return f"{duration} h" if duration else ""


def _svg_text(dwg: Any, text: str, insert: tuple[float, float], *, size: int = 12, weight: str = "400", fill: str = "#172027", anchor: str = "middle") -> Any:
    return dwg.text(text, insert=insert, font_size=size, font_family="Arial, Helvetica, sans-serif", font_weight=weight, fill=fill, text_anchor=anchor)


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


def _path(points: list[tuple[float, float]]) -> str:
    if not points:
        return ""
    parts = [f"M {points[0][0]:.1f} {points[0][1]:.1f}"]
    parts.extend(f"L {x:.1f} {y:.1f}" for x, y in points[1:])
    return " ".join(parts)


def _port_for(node: dict[str, Any], side: str, offset: float = 0) -> tuple[float, float]:
    if side == "left":
        return node["x"] - offset, node["y"] + node["h"] * 0.44
    if side == "right":
        return node["x"] + node["w"] + offset, node["y"] + node["h"] * 0.44
    if side == "top":
        return node["x"] + node["w"] * 0.5, node["y"] - offset
    return node["x"] + node["w"] * 0.5, node["y"] + node["h"] + offset


def _center(node: dict[str, Any]) -> tuple[float, float]:
    return node["x"] + node["w"] / 2, node["y"] + node["h"] / 2


def _side_toward(node: dict[str, Any], other: dict[str, Any]) -> str:
    cx, cy = _center(node)
    ox, oy = _center(other)
    dx, dy = ox - cx, oy - cy
    if abs(dx) >= abs(dy):
        return "right" if dx >= 0 else "left"
    return "bottom" if dy >= 0 else "top"


def _opposite(side: str) -> str:
    return {"right": "left", "left": "right", "top": "bottom", "bottom": "top"}.get(side, "left")


def _segment_hits_rect(a: tuple[float, float], b: tuple[float, float], rect: dict[str, Any], pad: float = 18) -> bool:
    rx, ry = rect["x"] - pad, rect["y"] - pad
    rw, rh = rect["w"] + pad * 2, rect["h"] + pad * 2
    min_x, max_x = sorted((a[0], b[0]))
    min_y, max_y = sorted((a[1], b[1]))
    if abs(a[1] - b[1]) < 0.1:
        y = a[1]
        return ry < y < ry + rh and max_x > rx and min_x < rx + rw
    if abs(a[0] - b[0]) < 0.1:
        x = a[0]
        return rx < x < rx + rw and max_y > ry and min_y < ry + rh
    return False


def _compact_points(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    deduped: list[tuple[float, float]] = []
    for point in points:
        if not deduped or abs(point[0] - deduped[-1][0]) > 0.1 or abs(point[1] - deduped[-1][1]) > 0.1:
            deduped.append(point)
    compacted: list[tuple[float, float]] = []
    for index, point in enumerate(deduped):
        if index == 0 or index == len(deduped) - 1:
            compacted.append(point)
            continue
        prev, nxt = deduped[index - 1], deduped[index + 1]
        same_x = abs(prev[0] - point[0]) < 0.1 and abs(point[0] - nxt[0]) < 0.1
        same_y = abs(prev[1] - point[1]) < 0.1 and abs(point[1] - nxt[1]) < 0.1
        if not same_x and not same_y:
            compacted.append(point)
    return compacted


def _route_score(points: list[tuple[float, float]], obstacles: list[dict[str, Any]]) -> float:
    compacted = _compact_points(points)
    length = sum(abs(b[0] - a[0]) + abs(b[1] - a[1]) for a, b in zip(compacted, compacted[1:]))
    score = length + max(0, len(compacted) - 2) * 18
    for a, b in zip(compacted, compacted[1:]):
        for rect in obstacles:
            if _segment_hits_rect(a, b, rect):
                score += 12000
    return score


def _route_between(src: dict[str, Any], dst: dict[str, Any], nodes: list[dict[str, Any]], *, lane: str = "process") -> list[tuple[float, float]]:
    if lane == "recycle":
        s, e = _port_for(src, "bottom", 12), _port_for(dst, "bottom", 16)
        lane_y = max(node["y"] + node["h"] for node in nodes) + 72
        return _compact_points([s, (s[0], lane_y), (e[0], lane_y), e])
    if lane == "parallel":
        s, e = _port_for(src, "bottom", 12), _port_for(dst, "top", 16)
        bridge_y = max(s[1] + 26, e[1] - 26)
        return _compact_points([s, (s[0], bridge_y), (e[0], bridge_y), e])

    preferred_start = _side_toward(src, dst)
    preferred_end = _opposite(preferred_start)
    side_order = [preferred_start, "right", "bottom", "top", "left"]
    end_order = [preferred_end, "left", "top", "bottom", "right"]
    candidates: list[list[tuple[float, float]]] = []
    for start_side in dict.fromkeys(side_order):
        for end_side in dict.fromkeys(end_order):
            s, e = _port_for(src, start_side, 12), _port_for(dst, end_side, 16)
            mid_x = (s[0] + e[0]) / 2
            mid_y = (s[1] + e[1]) / 2
            candidates.append([s, (mid_x, s[1]), (mid_x, e[1]), e])
            candidates.append([s, (s[0], mid_y), (e[0], mid_y), e])
            top_lane = max(34, min(src["y"], dst["y"]) - 48)
            bottom_lane = max(src["y"] + src["h"], dst["y"] + dst["h"]) + 48
            candidates.append([s, (s[0], top_lane), (e[0], top_lane), e])
            candidates.append([s, (s[0], bottom_lane), (e[0], bottom_lane), e])

    obstacles = [node for node in nodes if node["gid"] not in (src["gid"], dst["gid"])]
    return min((_compact_points(points) for points in candidates), key=lambda points: _route_score(points, obstacles))


def _draw_equipment_symbol(dwg: Any, group: Any, node: dict[str, Any], kind: str, stroke: str) -> None:
    x, y, w, h = node["x"], node["y"], node["w"], node["h"]
    cx = x + w / 2
    sy = y + 12
    sh = 92
    if kind == "reactor":
        left, right = x + 50, x + 128
        top, bottom = sy + 2, sy + sh
        group.add(dwg.path(d=f"M {left} {bottom} L {left} {top + 24} A 39 24 0 0 1 {right} {top + 24} L {right} {bottom} Z", fill="#fff", stroke=stroke, stroke_width=2))
        group.add(dwg.line((cx, sy + 8), (cx, bottom - 10), stroke=stroke, stroke_width=1.6))
        group.add(dwg.rect(insert=(cx - 7, sy), size=(14, 16), rx=3, fill="#fff", stroke=stroke, stroke_width=1.5))
        group.add(dwg.path(d=f"M {cx - 28} {bottom - 14} C {cx - 10} {bottom - 30}, {cx + 6} {bottom - 2}, {cx + 28} {bottom - 16}", fill="none", stroke=stroke, stroke_width=1.5))
        group.add(dwg.path(d=f"M {right + 12} {sy + 38} h 26 v 9 h -26 v 9 h 26 v 9 h -26", fill="none", stroke=stroke, stroke_width=1.4))
    elif kind == "heat_exchanger":
        group.add(dwg.circle(center=(cx, sy + 48), r=34, fill="#fff", stroke=stroke, stroke_width=2))
        group.add(dwg.path(d=f"M {cx - 34} {sy + 48} H {cx - 18} L {cx - 5} {sy + 30} L {cx + 16} {sy + 66} L {cx + 28} {sy + 48} H {cx + 34}", fill="none", stroke=stroke, stroke_width=1.7))
    elif kind == "distillation":
        col_x, top, bottom = cx - 20, sy - 8, sy + 108
        group.add(dwg.path(d=f"M {col_x} {top + 18} A 20 18 0 0 1 {col_x + 40} {top + 18} L {col_x + 40} {bottom - 18} A 20 18 0 0 1 {col_x} {bottom - 18} Z", fill="#fff", stroke=stroke, stroke_width=2))
        for yy in (top + 42, top + 62, top + 82):
            group.add(dwg.line((col_x + 4, yy), (col_x + 36, yy), stroke=stroke, stroke_width=1))
    elif kind in ("settler", "evaporator", "tank"):
        rx = 24
        group.add(dwg.path(d=f"M {x + 34 + rx} {sy + 28} H {x + 142 - rx} A {rx} {rx} 0 0 1 {x + 142 - rx} {sy + 76} H {x + 34 + rx} A {rx} {rx} 0 0 1 {x + 34 + rx} {sy + 28}", fill="#fff", stroke=stroke, stroke_width=2))
        if kind == "settler":
            group.add(dwg.line((x + 84, sy + 28), (x + 84, sy + 76), stroke=stroke, stroke_dasharray="4 3", stroke_width=1.2))
            group.add(dwg.line((x + 46, sy + 52), (x + 120, sy + 52), stroke=stroke, stroke_width=1))
        if kind == "evaporator":
            for xx in range(58, 124, 10):
                group.add(dwg.line((x + xx, sy + 32), (x + xx, sy + 72), stroke=stroke, stroke_width=0.9))
    elif kind == "dryer":
        group.add(dwg.rect(insert=(cx - 18, sy - 4), size=(36, 106), rx=3, fill="#fff", stroke=stroke, stroke_width=2))
        for yy in (sy + 22, sy + 44, sy + 66, sy + 88):
            group.add(dwg.line((cx - 18, yy), (cx + 18, yy), stroke=stroke, stroke_width=1))
    else:
        group.add(dwg.rect(insert=(x + 28, sy + 16), size=(124, 62), rx=5, fill="#fff", stroke=stroke, stroke_width=1.8))


def _svgwrite_pfd(project: dict[str, Any]) -> dict[str, Any]:
    try:
        import svgwrite
    except Exception as exc:  # pragma: no cover - optional package path
        return {"ok": False, "error": f"svgwrite is not installed or could not be imported: {exc}"}

    groups = project.get("groups") or []
    links = project.get("links") or []
    if not isinstance(groups, list) or not groups:
        return {"ok": False, "error": "No grouped operations available for technical rendering."}

    stage = -1
    stage_rows: dict[int, int] = {}
    nodes: list[dict[str, Any]] = []
    by_gid: dict[str, dict[str, Any]] = {}
    base_x, step_x, base_y = 230, 244, 150
    card_w, card_h = 178, 172
    max_stages_per_band = 5

    for index, group in enumerate(groups):
        if not isinstance(group, dict):
            continue
        if index == 0 or not _can_overlap(group):
            stage += 1
        row = stage_rows.get(stage, 0)
        stage_rows[stage] = row + 1
        overlap = row > 0
        band = stage // max_stages_per_band
        column = stage % max_stages_per_band
        x = base_x + column * step_x + (row * 20 if overlap else 0)
        y = base_y + band * 520 + row * 84
        gid = _clean(group.get("groupId"), f"G{index + 1}")
        node = {
            "gid": gid,
            "unit": f"U{index + 1}",
            "group": group,
            "kind": _unit_kind(group),
            "x": x,
            "y": y,
            "w": card_w,
            "h": card_h,
            "stage": stage,
            "overlap": overlap,
            "row": row,
        }
        nodes.append(node)
        by_gid[gid] = node

    max_x = max(node["x"] + node["w"] for node in nodes) + 260
    max_y = max(node["y"] + node["h"] for node in nodes) + 230
    width = max(1280, max_x)
    height = max(720, max_y)
    dwg = svgwrite.Drawing(size=("1280px", "720px"), profile="full")
    dwg.viewbox(0, 0, width, height)
    dwg.add(dwg.rect(insert=(0, 0), size=(width, height), fill="#ffffff"))
    dwg.add(dwg.rect(insert=(18, 18), size=(width - 36, height - 36), fill="none", stroke="#172027", stroke_width=1.2))
    dwg.add(_svg_text(dwg, "Generated Process Flowsheet", (38, 50), size=18, weight="900", anchor="start"))
    dwg.add(_svg_text(dwg, "Technical schematic from grouped blocks, MFA streams, schedule overlap, and process connections.", (38, 70), size=11, fill="#657480", anchor="start"))

    defs = dwg.defs
    for marker_id, color in (("arrow_process", "#172027"), ("arrow_recycle", "#25834a"), ("arrow_waste", "#b97916"), ("arrow_overlap", "#6c7680")):
        marker = dwg.marker(id=marker_id, insert=(12, 6), size=(13, 12), orient="auto", markerUnits="userSpaceOnUse")
        marker.add(dwg.path(d="M 0 0 L 13 6 L 0 12 z", fill=color, stroke=color, stroke_width=0.4))
        defs.add(marker)

    feed = {"x": 42, "y": base_y + 48, "w": 112, "h": 48}
    product = {"x": min(width - 185, nodes[-1]["x"] + nodes[-1]["w"] + 82), "y": nodes[-1]["y"] + 52, "w": 124, "h": 54}

    def add_connection(points: list[tuple[float, float]], color: str, marker: str, dash: str | None = None, width_: float = 2.8) -> None:
        d = _path(points)
        halo = dwg.path(d=d, fill="none", stroke="#ffffff", stroke_width=width_ + 6, stroke_linecap="round", stroke_linejoin="round")
        line = dwg.path(d=d, fill="none", stroke=color, stroke_width=width_, stroke_linecap="round", stroke_linejoin="round", marker_end=f"url(#{marker})")
        if dash:
            line["stroke-dasharray"] = dash
        dwg.add(halo)
        dwg.add(line)

    if nodes:
        s = (feed["x"] + feed["w"] + 12, feed["y"] + feed["h"] / 2)
        e = _port_for(nodes[0], "left", 14)
        mid = (s[0] + e[0]) / 2
        add_connection([s, (mid, s[1]), (mid, e[1]), e], "#172027", "arrow_process")

    rendered = set()
    order_index = {node["gid"]: i for i, node in enumerate(nodes)}
    for link in links if isinstance(links, list) else []:
        if not isinstance(link, dict):
            continue
        from_id, to_id = _clean(link.get("from")), _clean(link.get("to"))
        if from_id not in by_gid or to_id not in by_gid or from_id == to_id:
            continue
        src, dst = by_gid[from_id], by_gid[to_id]
        rendered.add((from_id, to_id))
        if order_index[from_id] > order_index[to_id]:
            lane = max_y - 84 - 18 * len([pair for pair in rendered if order_index[pair[0]] > order_index[pair[1]]])
            s, e = _port_for(src, "bottom", 12), _port_for(dst, "bottom", 16)
            add_connection([s, (s[0], lane), (e[0], lane), e], "#25834a", "arrow_recycle", dash="9 6", width_=2.5)
            dwg.add(_svg_text(dwg, f"recycle {from_id} to {to_id}", ((s[0] + e[0]) / 2, lane - 7), size=10, fill="#25834a"))
        elif dst["stage"] == src["stage"]:
            points = _route_between(src, dst, nodes, lane="parallel")
            add_connection(points, "#6c7680", "arrow_overlap", dash="6 4", width_=2.3)
            dwg.add(_svg_text(dwg, "parallel", ((points[0][0] + points[-1][0]) / 2, min(points[0][1], points[-1][1]) - 8), size=9, fill="#6c7680"))
        else:
            add_connection(_route_between(src, dst, nodes), "#172027", "arrow_process")

    if not rendered and len(nodes) > 1:
        for src, dst in zip(nodes, nodes[1:]):
            add_connection(_route_between(src, dst, nodes), "#172027", "arrow_process")

    s, e = _port_for(nodes[-1], "right", 12), (product["x"] - 16, product["y"] + product["h"] / 2)
    mid_x = (s[0] + e[0]) / 2
    add_connection([s, (mid_x, s[1]), (mid_x, e[1]), e], "#172027", "arrow_process", width_=2.4)

    # Draw waste and vent stubs after the main network, still behind equipment.
    for node in nodes:
        aggr = node["group"].get("mfaAggregation") or []
        waste_items = []
        for role_group in aggr if isinstance(aggr, list) else []:
            role_name = _clean(role_group.get("role")).lower() if isinstance(role_group, dict) else ""
            if isinstance(role_group, dict) and any(token in role_name for token in ("waste", "emission", "loss", "purge")):
                waste_items.extend(item for item in role_group.get("items") or [] if isinstance(item, dict))
        for item_index, item in enumerate(waste_items[:3]):
            s = (node["x"] + node["w"] * (0.24 + item_index * 0.24), node["y"] + node["h"] + 10)
            e = (s[0], min(height - 128, s[1] + 48 + item_index * 22))
            add_connection([s, e], "#b97916", "arrow_waste", width_=2.1)
            label_x = e[0] + (46 if item_index % 2 == 0 else -46)
            anchor = "start" if item_index % 2 == 0 else "end"
            dwg.add(_svg_text(dwg, _short(f"waste: {item.get('name', '')}", 34), (label_x, e[1] + 3), size=9, fill="#b97916", anchor=anchor))

    dwg.add(dwg.rect(insert=(feed["x"], feed["y"]), size=(feed["w"], feed["h"]), rx=24, fill="#fff", stroke="#25834a", stroke_width=1.8))
    dwg.add(_svg_text(dwg, "FEED", (feed["x"] + feed["w"] / 2, feed["y"] + 30), size=12, weight="800", fill="#25834a"))
    dwg.add(dwg.rect(insert=(product["x"], product["y"]), size=(product["w"], product["h"]), rx=5, fill="#e9f7ed", stroke="#25834a", stroke_width=1.8))
    dwg.add(_svg_text(dwg, "PRODUCT", (product["x"] + product["w"] / 2, product["y"] + 32), size=12, weight="800", fill="#25834a"))

    palette = {
        "reactor": ("#cf4b42", "#fff8f7"),
        "heat_exchanger": ("#b97916", "#fffaf0"),
        "distillation": ("#1671c2", "#f5f9ff"),
        "settler": ("#1671c2", "#f5f9ff"),
        "evaporator": ("#1671c2", "#f5f9ff"),
        "dryer": ("#1671c2", "#f5f9ff"),
        "tank": ("#25834a", "#f4fbf6"),
        "blackbox": ("#6c7680", "#f8fafb"),
    }
    for node in nodes:
        stroke, fill = palette.get(node["kind"], palette["blackbox"])
        g = dwg.g(id=f"node_{node['unit']}_{node['gid']}")
        if node["overlap"]:
            g.add(dwg.rect(insert=(node["x"] - 16, node["y"] - 16), size=(node["w"], node["h"]), rx=7, fill="#eef2f4", stroke="#9aa7b0", stroke_width=1, opacity=0.55))
        g.add(dwg.rect(insert=(node["x"], node["y"]), size=(node["w"], node["h"]), rx=6, fill="#fff", stroke="#cdd7dd", stroke_width=1.1))
        g.add(dwg.rect(insert=(node["x"], node["y"]), size=(5, node["h"]), rx=2.5, fill=stroke))
        _draw_equipment_symbol(dwg, g, node, node["kind"], stroke)
        tag_y = node["y"] + 122
        g.add(dwg.rect(insert=(node["x"] + 14, tag_y - 14), size=(node["w"] - 28, 40), rx=3, fill=fill, stroke=stroke, stroke_width=0.8))
        g.add(_svg_text(dwg, f"{node['unit']} {node['gid']}", (node["x"] + node["w"] / 2, tag_y), size=12, weight="900", fill=stroke))
        for line_no, line in enumerate(_wrap(node["group"].get("selectedUnit") or node["group"].get("task"), 27, 2)):
            g.add(_svg_text(dwg, line, (node["x"] + node["w"] / 2, tag_y + 16 + line_no * 12), size=10.5, weight="700"))
        foot = " | ".join(part for part in (_duration_label(node["group"]), _conditions_line(node["group"]), _mass_line(node["group"])) if part)
        if foot:
            g.add(_svg_text(dwg, _short(foot, 40), (node["x"] + node["w"] / 2, node["y"] + node["h"] + 16), size=9.5, fill=stroke))
        if node["overlap"]:
            g.add(_svg_text(dwg, "concurrent", (node["x"] + node["w"] - 12, node["y"] + 14), size=9, weight="800", fill="#6c7680", anchor="end"))
        dwg.add(g)

    legend_y = height - 52
    legend = [("Process", "#172027", None), ("Concurrent/overlap", "#6c7680", "5 4"), ("Recycle", "#25834a", "8 6"), ("Waste", "#b97916", None)]
    for idx, (label, color, dash) in enumerate(legend):
        x = 38 + idx * 168
        line = dwg.line((x, legend_y), (x + 34, legend_y), stroke=color, stroke_width=2.2)
        if dash:
            line["stroke-dasharray"] = dash
        dwg.add(line)
        dwg.add(_svg_text(dwg, label, (x + 42, legend_y + 4), size=10.5, anchor="start"))

    title_x = max(780, width - 470)
    dwg.add(dwg.rect(insert=(title_x, height - 92), size=(430, 54), fill="#fff", stroke="#172027", stroke_width=0.9))
    dwg.add(dwg.line((title_x, height - 65), (title_x + 430, height - 65), stroke="#172027", stroke_width=0.7))
    dwg.add(dwg.line((title_x + 122, height - 92), (title_x + 122, height - 38), stroke="#172027", stroke_width=0.7))
    dwg.add(_svg_text(dwg, "DRAWING", (title_x + 10, height - 74), size=10, weight="800", anchor="start"))
    dwg.add(_svg_text(dwg, "Scale-up support PFD", (title_x + 132, height - 74), size=10, anchor="start"))
    dwg.add(_svg_text(dwg, "BASIS", (title_x + 10, height - 47), size=10, weight="800", anchor="start"))
    dwg.add(_svg_text(dwg, f"{len(nodes)} grouped operations", (title_x + 132, height - 47), size=10, anchor="start"))
    return {"ok": True, "svg": dwg.tostring(), "renderer": "technical-svgwrite-pfd", "unitCount": len(nodes)}


def render_pyflowsheet_svg(project: dict[str, Any]) -> dict[str, Any]:
    """Render the current project as SVG with pyflowsheet.

    The app treats this renderer as an optional technical PFD backend. It returns
    a compact error instead of raising when pyflowsheet is unavailable.
    """

    technical = _svgwrite_pfd(project)
    if technical.get("ok"):
        return technical

    try:
        from pyflowsheet import (
            BlackBox,
            Distillation,
            Flowsheet,
            HeatExchanger,
            StreamFlag,
            SvgContext,
            Vessel,
        )
    except Exception as exc:  # pragma: no cover - depends on local optional package
        return {"ok": False, "error": f"pyflowsheet is not installed or could not be imported: {exc}"}

    groups = project.get("groups") or []
    links = project.get("links") or []
    if not isinstance(groups, list) or not groups:
        return {"ok": False, "error": "No grouped operations available for pyflowsheet rendering."}

    pfd = Flowsheet("UPSCALING-PFD", "Generated process flowsheet", "Generated from the upscaling block model")
    units: dict[str, Any] = {}
    kinds: dict[str, str] = {}
    all_units = []

    top_limit = 5 if len(groups) > 5 else len(groups)
    step_x = 170
    top_y = 170
    lower_y = 390
    start_x = 210
    lower_start = start_x + max(0, top_limit - 2) * step_x

    feed = StreamFlag("FEED", "Feed / storage", position=(20, top_y + 20), size=(70, 40))
    all_units.append(feed)

    for index, group in enumerate(groups):
        if not isinstance(group, dict):
            continue
        gid = _clean(group.get("groupId"), f"G{index + 1}")
        kind = _unit_kind(group)
        label = _short(group.get("selectedUnit") or group.get("task") or gid, 28)
        if index < top_limit:
            pos = (start_x + index * step_x, top_y)
        else:
            lower_index = index - top_limit
            pos = (max(start_x, lower_start - lower_index * step_x), lower_y)

        uid = f"U{index + 1}"
        if kind == "distillation":
            unit = Distillation(uid, label, hasCondenser=False, hasReboiler=False, position=(pos[0] + 35, pos[1] - 70), size=(42, 180))
        elif kind == "heat_exchanger":
            unit = HeatExchanger(uid, label, position=(pos[0] + 20, pos[1] + 10), size=(58, 58))
        elif kind == "reactor":
            unit = Vessel(uid, label, position=(pos[0] + 18, pos[1] - 40), size=(70, 130), capLength=18)
        elif kind in ("settler", "evaporator", "tank"):
            unit = Vessel(uid, label, position=(pos[0], pos[1] + 10), size=(110, 52), capLength=24)
        elif kind == "dryer":
            unit = Vessel(uid, label, position=(pos[0] + 35, pos[1] - 50), size=(46, 145), capLength=14)
        else:
            unit = BlackBox(uid, label, position=(pos[0], pos[1]), size=(110, 66))

        units[gid] = unit
        kinds[gid] = kind
        all_units.append(unit)

        detail = " | ".join(part for part in (f"{gid}: {label}", _conditions_line(group), _mass_line(group), _short(group.get("task"), 36)) if part)
        if detail:
            pfd.callout(_short(detail, 74), (pos[0] - 6, pos[1] + 105))

    product = StreamFlag("PRODUCT", "Product", position=(start_x + max(1, top_limit) * step_x + 80, top_y + 20), size=(70, 40))
    all_units.append(product)
    pfd.addUnits(all_units)

    ordered_ids = [_clean(group.get("groupId"), "") for group in groups if isinstance(group, dict)]
    stream_no = 1

    def connect_stream(name: str, from_unit: Any, from_port: Any, to_port: Any) -> None:
        nonlocal stream_no
        try:
            pfd.connect(name or f"S{stream_no:02d}", from_port, to_port)
            stream_no += 1
        except Exception:
            # pyflowsheet routing can fail for duplicate/invalid ports; skip that
            # one stream and keep the remaining PFD renderable.
            return

    if ordered_ids:
        first = ordered_ids[0]
        if first in units:
            in_port, _ = _ports(units[first], kinds[first])
            connect_stream("S_FEED", feed["Out"], feed["Out"], in_port)

    rendered_pairs: set[tuple[str, str]] = set()
    for link in links if isinstance(links, list) else []:
        if not isinstance(link, dict):
            continue
        from_id = _clean(link.get("from"))
        to_id = _clean(link.get("to"))
        if from_id not in units or to_id not in units or from_id == to_id:
            continue
        _, out_port = _ports(units[from_id], kinds[from_id])
        in_port, _ = _ports(units[to_id], kinds[to_id])
        connect_stream(f"S{stream_no:02d}", units[from_id], out_port, in_port)
        rendered_pairs.add((from_id, to_id))

    if not rendered_pairs and len(ordered_ids) > 1:
        for from_id, to_id in zip(ordered_ids, ordered_ids[1:]):
            if from_id not in units or to_id not in units:
                continue
            _, out_port = _ports(units[from_id], kinds[from_id])
            in_port, _ = _ports(units[to_id], kinds[to_id])
            connect_stream(f"S{stream_no:02d}", units[from_id], out_port, in_port)

    last = ordered_ids[-1] if ordered_ids else ""
    if last in units:
        _, out_port = _ports(units[last], kinds[last])
        connect_stream("S_PRODUCT", units[last], out_port, product["In"])

    try:
        ctx = SvgContext("/tmp/upscaling_pyflowsheet.svg")
        svg = pfd.draw(ctx).render(width=1280, height=680, saveFile=False)
    except Exception as exc:
        return {"ok": False, "error": f"pyflowsheet render failed: {exc}"}
    return {"ok": True, "svg": svg, "renderer": "pyflowsheet", "unitCount": len(units)}
