#!/bin/bash
set -euo pipefail

if test -n "${YARN_COMMAND:+x}"; then
    echo "$YARN_COMMAND"
    exit 0
fi

if which yarn > /dev/null 2>&1; then
    echo "yarn"
    exit 0
fi

if which corepack > /dev/null 2>&1; then
    echo "corepack yarn"
    exit 0
fi

echo "Yarn not found" >&2
exit 1