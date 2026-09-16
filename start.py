#!/usr/bin/env python3
"""One-command launcher for the Process Upscaling Workbench."""

from __future__ import annotations

import argparse
import os
import socket
import sys
import threading
import time
import webbrowser
from http.server import ThreadingHTTPServer


def find_free_port(host: str, preferred: int) -> int:
    """Return the preferred port when available, otherwise ask the OS for one."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            probe.bind((host, preferred))
            return preferred
        except OSError:
            pass
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.bind((host, 0))
        return int(probe.getsockname()[1])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Launch the Process Upscaling Workbench and open it in a browser.")
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"), help="Host interface for the local server.")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8787")), help="Preferred local server port.")
    parser.add_argument("--no-browser", action="store_true", help="Start the server without opening a browser tab.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        from upscaling_pipeline_tool.app import AppHandler
    except ImportError as exc:
        print(f"Could not import the app: {exc}", file=sys.stderr)
        print("Install optional package dependencies, then run again:", file=sys.stderr)
        print(f"  {sys.executable} -m pip install -r upscaling_pipeline_tool/requirements.txt", file=sys.stderr)
        return 1

    port = find_free_port(args.host, args.port)
    url = f"http://{args.host}:{port}"
    server = ThreadingHTTPServer((args.host, port), AppHandler)

    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()

    print(f"Process Upscaling Workbench running at {url}", flush=True)
    if port != args.port:
        print(f"Preferred port {args.port} was busy, so port {port} was used.", flush=True)
    print("Press Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        server.shutdown()
        server.server_close()
        time.sleep(0.1)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
