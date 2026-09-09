#!/usr/bin/env python3
"""Regression check for the LCI Excel workbook export."""

from __future__ import annotations

import io
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from upscaling_pipeline_tool.xlsx_renderer import _flow_rows, render_lci_workbook_xlsx


PROJECT = {
    "scaleUp": {
        "basis": {
            "targetProduct": "octocrylene",
            "targetAmount": "1000",
            "targetUnit": "kg/year",
        }
    },
    "links": [{"from": "G1", "to": "G2"}],
    "dataReadiness": {
        "categories": [
            {
                "name": "MFA",
                "items": [
                    {"name": "Input amounts", "level": "critical", "ok": True, "note": "covered"},
                    {"name": "Waste fates", "level": "important", "ok": False, "note": "needs review"},
                ],
            }
        ]
    },
    "ruleChecks": [
        {
            "severity": "medium",
            "target": "G2",
            "title": "Mapping pending",
            "recommendation": "Choose provider datasets.",
        }
    ],
    "lcaBridge": {
        "schemaVersion": "lca-bridge-v0.1",
        "status": "draft_mapping_only",
        "openLcaCompatibility": {
            "directImport": False,
            "reason": "Needs database-specific UUIDs and provider mapping.",
            "nextStep": "Map flows before JSON-LD generation.",
        },
        "referenceProduct": {
            "rawName": "octocrylene",
            "amount": {"value": 1.0, "unit": "kg", "kg": 1.0},
        },
        "foregroundProcesses": [
            {
                "processId": "G1",
                "processName": "G1 - reaction",
                "task": "reaction",
                "selectedUnit": "reactor",
                "blocks": ["B1"],
                "phenomena": ["CR"],
                "exchanges": [
                    {
                        "id": "B1:S1",
                        "groupId": "G1",
                        "blockId": "B1",
                        "rawName": "benzophenone",
                        "canonicalName": "benzophenone",
                        "amount": {"value": 2.0, "unit": "kg", "kg": 2.0, "basis": "as entered", "status": "mass_kg_convertible"},
                        "phase": "L",
                        "fate": "fresh input",
                        "lcaRole": "technosphere_input",
                        "openLcaHint": {"flowType": "PRODUCT_FLOW", "providerNeeded": True},
                        "candidateQueries": ["market for benzophenone"],
                        "status": "estimated",
                    },
                    {
                        "id": "B1:S2",
                        "groupId": "G1",
                        "blockId": "B1",
                        "rawName": "crude product",
                        "canonicalName": "product",
                        "amount": {"value": 1.5, "unit": "kg", "kg": 1.5, "basis": "as entered", "status": "mass_kg_convertible"},
                        "fate": "intermediate",
                        "destinationGroup": "G2",
                        "lcaRole": "foreground_intermediate",
                        "openLcaHint": {"flowType": "PRODUCT_FLOW", "providerNeeded": False},
                    },
                ],
            }
        ],
        "mappingCandidates": [
            {
                "mappingStatus": "unmapped",
                "canonicalName": "benzophenone",
                "lcaRole": "technosphere_input",
                "openLcaHint": {"flowType": "PRODUCT_FLOW", "providerNeeded": True},
                "candidateQueries": ["market for benzophenone"],
                "occurrences": [{"groupId": "G1", "blockId": "B1", "rawName": "benzophenone"}],
            }
        ],
        "utilityPlaceholders": [
            {
                "groupId": "G1",
                "task": "reaction",
                "eventType": "heating",
                "dataStatus": "missing",
                "missing": ["duty_kJ"],
                "candidateQueries": ["steam production"],
            }
        ],
        "readiness": {
            "issues": ["1 external/waste/emission mapping candidate(s) still need openLCA/ecoinvent dataset choices."]
        },
    },
}


def main() -> None:
    separated_flows = _flow_rows([
        {"_processId": "G1", "canonicalName": "solvent", "lcaRole": "technosphere_input", "amount": {"kg": 2, "unit": "kg", "basis": "per batch"}},
        {"_processId": "G2", "canonicalName": "solvent", "lcaRole": "technosphere_input", "amount": {"kg": 3, "unit": "kg", "basis": "per batch"}},
    ])
    assert len(separated_flows) == 3, "Flow summary must not sum the same name across different foreground processes"
    assert separated_flows[0][:5] == ["process_id", "direction", "canonical_name", "lca_role", "amount_basis"]

    data = render_lci_workbook_xlsx(PROJECT)
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = set(archive.namelist())
        required = {
            "[Content_Types].xml",
            "_rels/.rels",
            "xl/workbook.xml",
            "xl/_rels/workbook.xml.rels",
            "xl/styles.xml",
            "xl/worksheets/sheet1.xml",
            "xl/worksheets/sheet10.xml",
        }
        missing = required - names
        assert not missing, f"Missing workbook parts: {sorted(missing)}"
        for name in required:
            ET.fromstring(archive.read(name))
        workbook_xml = archive.read("xl/workbook.xml").decode("utf-8")
        for sheet in ("README", "LCI Coverage", "Processes", "Exchanges", "Flows", "OpenLCA Mapping", "Validation"):
            assert sheet in workbook_xml, f"Workbook missing {sheet} sheet"
        coverage_xml = archive.read("xl/worksheets/sheet2.xml").decode("utf-8")
        assert "Technosphere inputs" in coverage_xml
        assert "<autoFilter" in coverage_xml
        assert 'state="frozen"' in coverage_xml
        exchanges_xml = archive.read("xl/worksheets/sheet4.xml").decode("utf-8")
        assert "benzophenone" in exchanges_xml
        assert "technosphere_input" in exchanges_xml
        mapping_xml = archive.read("xl/worksheets/sheet7.xml").decode("utf-8")
        assert "total_kg_where_available" in mapping_xml
        styles_xml = archive.read("xl/styles.xml").decode("utf-8")
        assert "wrapText" in styles_xml
    print("LCI Excel export regression check passed.")


if __name__ == "__main__":
    main()
