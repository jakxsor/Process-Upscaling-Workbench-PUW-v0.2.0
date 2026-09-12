#!/usr/bin/env python3
"""Regression check for editable PowerPoint flowsheet export."""

from __future__ import annotations

import io
import sys
import zipfile
from pathlib import Path

from pptx import Presentation

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from upscaling_pipeline_tool.pptx_renderer import render_flowsheet_pptx


payload = {
    "flowsheet": {
        "title": "Generated Process Flowsheet",
        "basis": "test basis",
        "width": 1000,
        "height": 620,
        "productGroupId": "G2",
        "feedBox": {"x": 30, "y": 120, "w": 150, "h": 120},
        "productBox": {"x": 820, "y": 140, "w": 140, "h": 90},
        "groups": [
            {
                "id": "G1",
                "unitNumber": 1,
                "task": "reaction and hold under nitrogen",
                "selectedUnit": "stirred tank reactor with condenser",
                "category": "reactor",
                "subcategory": "reactor",
                "x": 220,
                "y": 120,
                "w": 190,
                "h": 160,
                "totalOutputKg": 10,
                "inputStreams": [{"name": "ethyl acetate solvent", "quantity": "12", "unit": "kg"}],
                "outputStreams": [{"name": "reaction slurry intermediate", "quantity": "8", "unit": "kg"}],
            },
            {
                "id": "G2",
                "unitNumber": 2,
                "task": "filtration and product isolation",
                "selectedUnit": "pressure nutsche filter dryer",
                "category": "separation",
                "subcategory": "filter",
                "x": 560,
                "y": 120,
                "w": 190,
                "h": 160,
                "totalOutputKg": 8,
                "outputStreams": [{"name": "final product", "quantity": "5.2", "unit": "kg", "fate": "product"}],
            },
        ],
        "forwardLinks": [
            {"from": "G1", "to": "G2", "directStreams": [{"name": "reaction slurry intermediate", "quantity": "8", "unit": "kg"}]}
        ],
        "auxiliaryLinks": [
            {"from": "G1", "to": "G2", "kind": "waste", "directStreams": [{"name": "mother liquor", "quantity": "2", "unit": "kg"}]}
        ],
        "recycleLinks": [
            {"from": "G2", "to": "G1", "directStreams": [{"name": "recovered solvent", "quantity": "1", "unit": "kg"}]}
        ],
    }
}


body = render_flowsheet_pptx(payload)
assert body.startswith(b"PK"), "PowerPoint export should be an OOXML zip package"
deck = Presentation(io.BytesIO(body))
assert len(deck.slides) == 1, "PowerPoint export should reopen with one slide"
assert len(deck.slides[0].shapes) > 10, "PowerPoint export should retain editable native shapes"
roundtrip = io.BytesIO()
deck.save(roundtrip)
assert len(Presentation(io.BytesIO(roundtrip.getvalue())).slides) == 1, "PowerPoint export should survive a save round trip"
with zipfile.ZipFile(io.BytesIO(body)) as zf:
    slide = zf.read("ppt/slides/slide1.xml").decode("utf-8")

assert "Legend Panel" in slide, "PowerPoint export should include an editable legend panel"
assert "Process" in slide and "Recycle" in slide and "Vent/VOC" in slide, "Legend should include line meanings"
assert "Reactor" in slide and "Separation" in slide, "Legend should include unit categories"
assert '<a:tailEnd type="triangle"/>' in slide, "Connector arrowheads should point at the line endpoint"
assert "reaction..." in slide or "reaction slurry" in slide, "Process stream label should be included as editable text"

print("Flowsheet PowerPoint export regression check passed.")
