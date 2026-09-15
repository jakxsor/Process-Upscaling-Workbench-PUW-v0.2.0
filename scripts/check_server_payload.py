#!/usr/bin/env python3
"""Regression checks for the local server's AI-review payload preparation."""

import gzip
import sys
import threading
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from upscaling_pipeline_tool.app import MAX_REQUEST_BYTES, AppHandler, _accepts_gzip, _compact_project_for_review, _decode_json_payload


def check_gzip_serving() -> None:
    """Static files reach a gzip-capable client compressed and byte-identical once inflated."""
    assert _accepts_gzip({"Accept-Encoding": "gzip, deflate, br"})
    assert _accepts_gzip({"Accept-Encoding": "deflate;q=1.0, gzip;q=0.5"})
    assert not _accepts_gzip({"Accept-Encoding": "gzip;q=0"})
    assert not _accepts_gzip({"Accept-Encoding": "identity"})
    assert not _accepts_gzip({})

    class QuietHandler(AppHandler):
        def log_message(self, *args):  # keep the check output to its verdict
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        port = server.server_address[1]

        def fetch(path, headers, method="GET"):
            conn = HTTPConnection("127.0.0.1", port, timeout=10)
            conn.request(method, path, headers=headers)
            resp = conn.getresponse()
            data = resp.read()
            conn.close()
            return resp, data

        plain_resp, plain = fetch("/app.js", {})
        assert plain_resp.status == 200 and plain_resp.getheader("Content-Encoding") is None, "A client without Accept-Encoding must get the raw file"
        assert plain_resp.getheader("Vary") == "Accept-Encoding"

        gz_resp, gz = fetch("/app.js", {"Accept-Encoding": "gzip"})
        assert gz_resp.getheader("Content-Encoding") == "gzip", "A gzip-capable client must get a compressed file"
        assert int(gz_resp.getheader("Content-Length")) == len(gz)
        assert gzip.decompress(gz) == plain, "The compressed file must inflate to the raw file"
        assert len(gz) < len(plain) / 3, f"gzip should cut app.js to under a third of its size, got {len(gz)} of {len(plain)}"

        again_resp, again = fetch("/app.js", {"Accept-Encoding": "gzip"})
        assert again == gz, "The second request should be served from the compression cache unchanged"

        head_resp, head_body = fetch("/app.js", {"Accept-Encoding": "gzip"}, method="HEAD")
        assert head_body == b"" and head_resp.getheader("Content-Encoding") == "gzip" and int(head_resp.getheader("Content-Length")) == len(gz), "HEAD must describe the compressed body"

        small_resp, small = fetch("/favicon.svg", {"Accept-Encoding": "gzip"})
        assert small_resp.status == 200
        if len(small) < 1024:
            assert small_resp.getheader("Content-Encoding") is None, "Tiny files are not worth compressing"

        html_resp, html = fetch("/", {"Accept-Encoding": "gzip"})
        assert html_resp.getheader("Content-Encoding") == "gzip" and b"<!doctype html>" in gzip.decompress(html).lower()
    finally:
        server.shutdown()
        server.server_close()


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

    assert _decode_json_payload(b'{"ok": true}') == {"ok": True}
    for raw in (b"{not-json", b'["array"]', "é".encode("latin-1")):
        try:
            _decode_json_payload(raw)
        except ValueError:
            pass
        else:
            raise AssertionError(f"Invalid payload was accepted: {raw!r}")

    check_gzip_serving()

    print("Server payload regression check passed.")


if __name__ == "__main__":
    main()
