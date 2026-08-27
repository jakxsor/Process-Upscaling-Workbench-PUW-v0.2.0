"""PubChem lookup helpers for pure-component property prefilling."""

import json
import re
import socket
from urllib import error, parse, request


PUBCHEM_USER_AGENT = "upscaling-pipeline-tool/1.0"


def lookup_pubchem(payload):
    mode = str(payload.get("mode", "lookup")).strip().lower()
    name = str(payload.get("name", "")).strip()
    if not name:
        return {"ok": False, "error": "Compound name missing."}
    if len(name) > 160:
        return {"ok": False, "error": "Compound name is too long for lookup."}
    if mode == "search":
        return search_pubchem_candidates(name)

    encoded = parse.quote(name, safe="")
    props = ",".join([
        "MolecularFormula",
        "MolecularWeight",
        "CanonicalSMILES",
        "IsomericSMILES",
        "InChI",
        "InChIKey",
        "XLogP",
        "ExactMass",
        "TPSA",
        "HBondDonorCount",
        "HBondAcceptorCount",
    ])
    prop_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{encoded}/property/{props}/JSON"
    try:
        prop_data = get_json(prop_url, timeout=20)
    except error.HTTPError as exc:
        return {
            "ok": False,
            "error": f"PubChem HTTP {exc.code}: no compound resolved for '{name}'.",
            "suggestions": pubchem_autocomplete(name),
        }
    except (TimeoutError, socket.timeout):
        return {"ok": False, "error": "PubChem lookup timed out."}
    except error.URLError as exc:
        return {"ok": False, "error": f"PubChem connection failed: {exc.reason}"}

    rows = prop_data.get("PropertyTable", {}).get("Properties", [])
    if not rows:
        return {
            "ok": False,
            "error": f"No PubChem compound properties found for '{name}'.",
            "suggestions": pubchem_autocomplete(name),
        }

    row = rows[0]
    cid = row.get("CID")
    experimental = {}
    if cid:
        view_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{cid}/JSON?heading=Experimental+Properties"
        try:
            view_data = get_json(view_url, timeout=20)
            experimental = extract_pubchem_experimental_properties(view_data)
        except Exception:
            experimental = {}

    mapped = map_pubchem_fields(row, experimental)
    return {
        "ok": True,
        "source": "PubChem PUG-REST/PUG-View",
        "query": name,
        "cid": cid,
        "url": f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}" if cid else "",
        "properties": row,
        "experimental": experimental,
        "mapped": mapped,
        "warnings": [
            "Basic molecular properties are structured PubChem fields.",
            "Thermal/phase properties are best-effort PUG-View annotations and should be confirmed before design decisions.",
        ],
    }


def search_pubchem_candidates(name):
    suggestions = pubchem_autocomplete(name)
    return {
        "ok": True,
        "query": name,
        "suggestions": suggestions,
        "message": f"{len(suggestions)} PubChem candidate name{'s' if len(suggestions) != 1 else ''} found.",
    }


def pubchem_autocomplete(name):
    encoded = parse.quote(name, safe="")
    suggestions = []
    try:
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/{encoded}/JSON?limit=12"
        data = get_json(url, timeout=15)
        compounds = data.get("dictionary_terms", {}).get("compound", [])
        for item in compounds:
            if isinstance(item, str):
                term = item
            elif isinstance(item, dict):
                term = item.get("term") or item.get("name") or item.get("title") or ""
            else:
                term = ""
            term = str(term).strip()
            if term and term.lower() not in {entry["name"].lower() for entry in suggestions}:
                suggestions.append({"name": term, "source": "PubChem autocomplete"})
    except Exception:
        suggestions = []

    if suggestions:
        return suggestions[:12]

    try:
        cid_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{encoded}/cids/JSON?name_type=word"
        cid_data = get_json(cid_url, timeout=15)
        cids = (cid_data.get("IdentifierList", {}).get("CID", []) or [])[:8]
        if not cids:
            return []
        cid_csv = ",".join(str(cid) for cid in cids)
        prop_url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid_csv}/property/Title,MolecularFormula/JSON"
        prop_data = get_json(prop_url, timeout=15)
        rows = prop_data.get("PropertyTable", {}).get("Properties", []) or []
        for row in rows:
            title = str(row.get("Title") or "").strip()
            cid = row.get("CID")
            formula = str(row.get("MolecularFormula") or "").strip()
            if title:
                suggestions.append({
                    "name": title,
                    "cid": cid,
                    "formula": formula,
                    "source": "PubChem word search",
                })
    except Exception:
        return suggestions[:12]
    return suggestions[:12]


def get_json(url, timeout):
    req = request.Request(url, headers={"Accept": "application/json", "User-Agent": PUBCHEM_USER_AGENT})
    with request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def extract_pubchem_experimental_properties(data):
    wanted = {
        "Melting Point": "melting_point",
        "Boiling Point": "boiling_point",
        "Vapor Pressure": "vapor_pressure",
        "Solubility": "solubility",
    }
    found = {value: [] for value in wanted.values()}

    def value_to_text(value):
        if not isinstance(value, dict):
            return ""
        strings = value.get("StringWithMarkup")
        if isinstance(strings, list):
            parts = [item.get("String", "") for item in strings if isinstance(item, dict)]
            text = " ".join(part for part in parts if part).strip()
            if text:
                return text
        number = value.get("Number")
        unit = value.get("Unit")
        if number is not None:
            return f"{number} {unit or ''}".strip()
        return ""

    def visit(section):
        if not isinstance(section, dict):
            return
        heading = section.get("TOCHeading", "")
        key = wanted.get(heading)
        if key:
            for info in section.get("Information", []) or []:
                text = value_to_text(info.get("Value", {}))
                if text:
                    found[key].append(text)
        for child in section.get("Section", []) or []:
            visit(child)

    visit(data.get("Record", {}))
    return {key: values[:5] for key, values in found.items() if values}


def map_pubchem_fields(row, experimental):
    mapped = {}
    if row.get("MolecularWeight") is not None:
        mapped["mw"] = str(row.get("MolecularWeight"))
    for target, source_key in (("tm", "melting_point"), ("tb", "boiling_point"), ("pvap", "vapor_pressure")):
        values = experimental.get(source_key) or []
        for value in values:
            converted = pubchem_numeric_property(value, target)
            if converted:
                mapped[target] = converted
                break
    return mapped


def pubchem_numeric_property(text, target):
    match = re.search(r"(?<![A-Za-z])[-+]?\d+(?:\.\d+)?", str(text))
    if not match:
        return ""
    value = float(match.group(0))
    lower = str(text).lower()
    if target in ("tm", "tb") and ("°c" in lower or "deg c" in lower or " c" in lower):
        return f"{value + 273.15:.2f}"
    if target in ("tm", "tb") and ("°f" in lower or "deg f" in lower or " f" in lower):
        return f"{(value - 32) * 5 / 9 + 273.15:.2f}"
    if target in ("tm", "tb"):
        return ""
    if target == "pvap":
        if "mmhg" in lower:
            return f"{value * 133.322:.3g}"
        if "kpa" in lower:
            return f"{value * 1000:.3g}"
    return str(value)
