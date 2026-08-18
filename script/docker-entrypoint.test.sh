#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT HUP INT TERM

mkdir -p "$test_dir/bin" "$test_dir/static"

cat > "$test_dir/bin/curl" <<'EOF'
#!/bin/sh
set -eu

output=
if [ -n "${MOCK_CURL_ARGS_FILE:-}" ]; then
    printf '%s\n' "$@" > "$MOCK_CURL_ARGS_FILE"
fi

while [ "$#" -gt 0 ]; do
    if [ "$1" = "--output" ]; then
        output=$2
        shift 2
    else
        shift
    fi
done

: "${output:?mock curl did not receive --output}"
printf '%s\n' "${MOCK_FRONTEND_BODY:-<!doctype html><html><body>test</body></html>}" > "$output"
EOF
chmod +x "$test_dir/bin/curl"

PATH="$test_dir/bin:$PATH" \
    MOCK_CURL_ARGS_FILE="$test_dir/curl-args" \
    CODEXTRACE_STATIC_DIR="$test_dir/static" \
    CODEXTRACE_FRONTEND_URL="https://example.test/frontend.html" \
    "$repo_dir/script/docker-entrypoint.sh" \
    sh -c 'test -s "$CODEXTRACE_STATIC_DIR/index.html"' test --headless

grep -q '<!doctype html>' "$test_dir/static/index.html"
grep -q '^--connect-timeout$' "$test_dir/curl-args"
grep -q '^--max-time$' "$test_dir/curl-args"
if grep -q '^--retry-all-errors$' "$test_dir/curl-args"; then
    echo "entrypoint uses curl retry-all-errors" >&2
    exit 1
fi

if PATH="$test_dir/bin:$PATH" \
    MOCK_FRONTEND_BODY="not html" \
    CODEXTRACE_STATIC_DIR="$test_dir/static" \
    CODEXTRACE_FRONTEND_URL="https://example.test/frontend.html" \
    "$repo_dir/script/docker-entrypoint.sh" true --headless; then
    echo "entrypoint accepted an invalid frontend" >&2
    exit 1
fi
