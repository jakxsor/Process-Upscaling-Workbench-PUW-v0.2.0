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


def render_pyflowsheet_svg(project: dict[str, Any]) -> dict[str, Any]:
    """Render the current project as SVG with pyflowsheet.

    The app treats this renderer as an optional technical PFD backend. It returns
    a compact error instead of raising when pyflowsheet is unavailable.
    """

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
