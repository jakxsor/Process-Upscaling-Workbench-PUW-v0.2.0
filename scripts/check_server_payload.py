#!/usr/bin/env python3
"""Regression checks for the local server's AI-review payload preparation."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from upscaling_pipeline_tool.app import MAX_REQUEST_BYTES, _compact_project_for_review


def main() -> None:
    small = {"blocks": [], "groups": [], "text": "short"}
    prepared, info = _compact_project_for_review(small)
    assert prepared is small and info["compacted"] is False

    large = {
        "exportSchemaVersion": "upscaling-project-v1",
        "text": "protocol " * 30_000,
        "blocks": [{"id": "B1", "groupId": "G1", "text": "reaction", "streams": []}],
        "groups": [{"groupId": "G1", "task": "reaction"}],
        "scaleUp": {"basis": {"targetProduct": "product"}},
        "derivedPreview": "duplicate " * 100_000,
    }
    prepared, info = _compact_project_for_review(large)
    assert info["compacted"] is True
    assert info["textTruncated"] is True
    assert prepared["blocks"][0]["id"] == "B1"
    assert prepared["scaleUp"]["basis"]["targetProduct"] == "product"
    assert "derivedPreview" not in prepared
    assert prepared["_reviewPayload"]["scope"]
    assert prepared["_reviewPayload"]["textTruncated"] is True
    assert MAX_REQUEST_BYTES >= 10 * 1024 * 1024
    print("Server payload regression check passed.")


if __name__ == "__main__":
    main()
