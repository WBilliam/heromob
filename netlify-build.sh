#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dist="$root/dist"

rm -rf "$dist"
mkdir -p "$dist"

cp -R "$root/public/." "$dist/"
cp -R "$root/components" "$dist/"
cp -R "$root/game" "$dist/"
cp -R "$root/lib" "$dist/"
cp -R "$root/router" "$dist/"
