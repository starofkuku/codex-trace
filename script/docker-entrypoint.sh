#!/bin/sh
set -eu

download_frontend() {
    static_dir=${CODEXTRACE_STATIC_DIR:-/app/dist}
    frontend_url=${CODEXTRACE_FRONTEND_URL:?CODEXTRACE_FRONTEND_URL is required}
    CODEXTRACE_STATIC_DIR=$static_dir
    export CODEXTRACE_STATIC_DIR

    mkdir -p "$static_dir"
    tmp_file=$(mktemp "$static_dir/.index.html.XXXXXX")
    trap 'rm -f "$tmp_file"' EXIT HUP INT TERM

    echo "Downloading frontend from $frontend_url"
    set -- \
        --fail \
        --location \
        --silent \
        --show-error \
        --retry 3 \
        --retry-connrefused \
        --connect-timeout 10 \
        --max-time 120 \
        --proto '=https' \
        --proto-redir '=https' \
        --output "$tmp_file" \
        "$frontend_url"
    if [ -n "${CODEXTRACE_FRONTEND_PROXY:-}" ]; then
        set -- --proxy "$CODEXTRACE_FRONTEND_PROXY" "$@"
    fi
    curl "$@"

    if [ ! -s "$tmp_file" ] || ! grep -Eiq '<!doctype html|<html' "$tmp_file"; then
        echo "Downloaded frontend is not a valid HTML document" >&2
        exit 1
    fi

    mv "$tmp_file" "$static_dir/index.html"
    trap - EXIT HUP INT TERM
}

# In headless mode Tauri/WebKit is bypassed entirely, so no display is needed.
for arg in "$@"; do
    if [ "$arg" = "--headless" ]; then
        download_frontend
        exec "$@"
    fi
done

: "${DISPLAY:=:99}"
export DISPLAY
exec xvfb-run --auto-servernum --server-args="-screen 0 1024x768x24" "$@"
