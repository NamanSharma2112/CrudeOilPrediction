#!/usr/bin/env bash
# Read and write the generated-data branch ("data") used by the scheduled jobs.
#
#   data-branch.sh pull <dir>
#       Copy the branch's current files into <dir> (empty if the branch is new).
#
#   data-branch.sh push <dir> <message> <path>...
#       Replace only <path>... on the branch with the copies in <dir>, keeping
#       every other file. The branch is rewritten as a single commit so model
#       binaries never pile up in history. If another job updated the branch in
#       the meantime, the push is refused (--force-with-lease) and retried on
#       top of the new contents, so concurrent jobs never drop each other's files.
#
# Env: DATA_REMOTE (git URL; defaults to this repo via GITHUB_TOKEN), DATA_BRANCH.
set -euo pipefail

branch="${DATA_BRANCH:-data}"
remote="${DATA_REMOTE:-https://x-access-token:${GITHUB_TOKEN:?GITHUB_TOKEN or DATA_REMOTE must be set}@github.com/${GITHUB_REPOSITORY:?}.git}"
cmd="${1:?usage: data-branch.sh pull <dir> | push <dir> <message> <path>...}"
dir="${2:?missing <dir>}"

# Clone the branch into $1 (or init an empty repo) and print the commit it was at.
checkout_branch() {
  local into="$1"
  if git ls-remote --exit-code --heads "$remote" "$branch" >/dev/null 2>&1; then
    git clone --quiet --depth 1 --branch "$branch" "$remote" "$into" 2>/dev/null
    git -C "$into" rev-parse HEAD
  else
    git init --quiet "$into"
    echo ""
  fi
}

case "$cmd" in
  pull)
    mkdir -p "$dir"
    tmp="$(mktemp -d)"
    sha="$(checkout_branch "$tmp/repo")"
    if [ -n "$sha" ]; then
      rm -rf "$tmp/repo/.git"
      cp -a "$tmp/repo/." "$dir/"
      echo "Pulled $branch@${sha:0:7} into $dir"
    else
      echo "Branch $branch does not exist yet; starting empty"
    fi
    rm -rf "$tmp"
    ;;

  push)
    msg="${3:?missing <message>}"
    shift 3
    [ "$#" -gt 0 ] || { echo "push: name at least one path to publish" >&2; exit 64; }

    for attempt in 1 2 3 4 5; do
      tmp="$(mktemp -d)"
      repo="$tmp/repo"
      sha="$(checkout_branch "$repo")"

      for path in "$@"; do
        rm -rf "${repo:?}/$path"
        if [ -e "$dir/$path" ]; then
          mkdir -p "$(dirname "$repo/$path")"
          cp -a "$dir/$path" "$repo/$path"
        fi
      done
      cat > "$repo/README.md" <<'EOF'
# Generated data (do not edit)

Written by the scheduled GitHub Actions workflows on `main`:
`retrain.yml` (models/), `forecast.yml` (forecasts.json) and
`market.yml` (market.json, history-*.json). Each run rewrites this branch
as a single commit. The deployed dashboard reads these files.
EOF

      (
        cd "$repo"
        git checkout --quiet --orphan "publish-$$"
        git add -A
        git -c user.name="github-actions[bot]" \
            -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
            commit --quiet -m "$msg"
      )
      if git -C "$repo" push --quiet --force-with-lease="refs/heads/$branch:$sha" \
           "$remote" "HEAD:refs/heads/$branch" 2>/dev/null; then
        rm -rf "$tmp"
        echo "Published $* to $branch (attempt $attempt)"
        exit 0
      fi
      rm -rf "$tmp"
      echo "Branch $branch moved during publish; retrying ($attempt/5)"
      sleep $((attempt * 5))
    done
    echo "Could not publish to $branch after 5 attempts" >&2
    exit 1
    ;;

  *)
    echo "unknown command: $cmd" >&2
    exit 64
    ;;
esac
