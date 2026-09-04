#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

if [[ $# -eq 0 ]]; then
  exec python3 -m upscaling_pipeline_tool.app --port 8787
elif [[ $# -eq 1 && "$1" =~ ^[0-9]+$ ]]; then
  exec python3 -m upscaling_pipeline_tool.app --port "$1"
else
  exec python3 -m upscaling_pipeline_tool.app "$@"
fi
