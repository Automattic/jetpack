#!/bin/bash

set -eo pipefail

source "$GITHUB_WORKSPACE/trunk/.github/files/gh-funcs.sh"

# Based on Automattic/pre-receive-hooks/blob/221f27e6/common/050-stop-underscores.sh
IGNORE_UNDERSCORE_RULE_FOR='bin/wp-cli|bin/wp-cli-wpcom|wp-includes/sodium_compat|wp-content/plugins/glotpress|.phabricator-linter|wp-content/lib/nosara/ThriftSQL.src/ThriftGenerated/|wp-content/lib/aws/vendor/|wp-content/plugins/woocommerce/|wp-content/plugins/woocommerce-payments/|wp-content/plugins/woocommerce-subscriptions/|wp-content/plugins/p2(-wpcom)?|wp-content/lib/google/|wp-content/plugins/woo-gutenberg-products-block/vendor/|/autoload_|/vendor/composer/|wp-content/a8c-plugins/one-offs/a8cmaileditor/'
function check_underscores {
	local FILE="$1"
	if echo "$PREFIX/$FILE" |
		grep '\.php$' |
		egrep -v "${IGNORE_UNDERSCORE_RULE_FOR}" |
		grep _ |
		rev |
		cut -d'/' -f 1 |
		rev |
		grep _ &>/dev/null
	then
		echo '  ❌ Filename contains underscores!'
		failed "$SLUG: File base name \`$( basename "$FILE" )\` (at \`$FILE\`) may not contain underscores"
	fi
}

# Based on Automattic/pre-receive-hooks/blob/221f27e6/common/120-stop-invalid-chars.sh
function check_invalid_chars {
	local FILE="$1"
	local Z=$( LC_ALL=C grep -aP '[^a-zA-Z._0-9/-]' <<<"$FILE" || true )
	if [[ -n "$Z" ]]; then
		echo '  ❌ Filename contains disallowed characters!'
		local snark=
		if [[ "$FILE" =~ @ ]]; then
			snark=$' Yes, it\'s silly `@` is not allowed when many such files already exist, but 🤷.'
		fi
		failed "$SLUG: Filename \`$FILE\` contains disallowed characters. "'Only a-z, A-Z, 0-9, `.`, `_`, `/`, and `-` are allowed.'"$snark"
	fi
}

# Based on Automattic/pre-receive-hooks/blob/221f27e6/common/130-stop-executables.sh
function check_executable {
	local FILE="$1"
	if [[ "$( git ls-files -s "${FILE}" | awk '{ print $1 }' )" == "100755" ]]; then
		echo '  ❌ File cannot be executable!'
		failed "$SLUG: File \`$FILE\` may not be executable"
	fi
}

# Based on Automattic/pre-receive-hooks/blob/221f27e6/common/160-stop-symlinks.sh
function check_symlink {
	local FILE="$1"
	if [[ "$( git ls-files -s "${FILE}" | awk '{ print $1 }' )" == "120000" ]]; then
		echo '  ❌ File cannot be a symlink!'
		failed "$SLUG: File \`$FILE\` may not be a symlink"
	fi
}

# ----

FINISHED=false
OUTPUT=()

function onexit {
	if ! "$FINISHED"; then
		OUTPUT+=( "💣 The testing script exited unexpectedly." )
	fi
	gh_set_output info "$( printf "%s\n" "${OUTPUT[@]}" )"
}
trap "onexit" EXIT

function failed {
	ERRMSG="$1"
	OUTPUT+=( "❌ $ERRMSG" )
	FAILED=1
	EXIT=1
}

# Adapted from projects/github-actions/push-to-mirrors/push-to-mirrors.sh
echo "::group::Fetching commits for Upstream-Ref matching"
cd "$GITHUB_WORKSPACE/commit"
git -c protocol.version=2 fetch --unshallow --filter=tree:0 --no-tags --progress --no-recurse-submodules origin HEAD
# GitHub may not have an up-to-date git
UPSTREAM_REF_SINCE=2024-04-10
ARGS=()
if git log --max-count=1 --since-as-filter='now' &>/dev/null; then
	ARGS+=( --since-as-filter="$UPSTREAM_REF_SINCE" )
else
	ARGS+=( --since="$UPSTREAM_REF_SINCE" )
fi
mapfile -t REFS < <( git log "${ARGS[@]}" --format=%H "${GITHUB_SHA:-HEAD}" || true )
echo "Considering ${#REFS[@]} monorepo commits for Upstream-Ref matching."
# Batch the commits into sets of 3180 to keep each call later under the 128KiB limit on argument length.
# 3180 40-byte shas + 3179 separators + 23 bytes of static text leaves 670 bytes for $GITHUB_REPOSITORY.
# Current max repo name seems to be either 140 or 557 (39 for the owner, 100 for the name, and '/'), depending on whether they've started allowing non-ASCII alphanumerics yet.
UPSTREAM_REGEXES=()
NL=$'\n'
for (( i=0; i<"${#REFS[@]}"; i+=3180 )); do
	UPSTREAM_REGEXES+=( "${NL}Upstream-Ref: $GITHUB_REPOSITORY@($( IFS="|"; echo "${REFS[*]:$i:3180}" ))($|${NL})" )
done
cd "$GITHUB_WORKSPACE"
echo "::endgroup::"

function get_upstream_sha {
	# `git fetch --filter=tree:0` works well here to save downloading a lot of unnecessary data.
	# However, when pushing, git seems to decide it needs to fetch some portion of that data anyway, and does so in an inefficient manner.
	# We can avoid that by making a temporary second `.git` directory and doing the `git fetch --filter=tree:0` into that instead of into the real one,
	# so the real one doesn't wind up with whatever weirdness makes git do the slow data fetch on push.
	local tmpgit
	tmpgit=$( mktemp -d -p . .git-tmp-XXXXXXXX ) || return 1
	if
		cp -a .git/. "$tmpgit/." &&
		GIT_DIR=$tmpgit git -c protocol.version=2 fetch --filter=tree:0 --tags --progress --no-recurse-submodules origin >&2
	then
		local regex
		for regex in "${UPSTREAM_REGEXES[@]}"; do
			local dstsha
			if dstsha=$( GIT_DIR=$tmpgit git rev-parse --verify --quiet ":/$regex" ) &&
				# Fetch the sha into the real .git, not $tmpgit
				git -c protocol.version=2 fetch --no-tags --prune --progress --no-recurse-submodules --depth=1 origin "$dstsha" >&2
			then
				rm -rf "$tmpgit"
				echo "$dstsha"
				return 0
			fi
		done
	fi
	rm -rf "$tmpgit"
	return 1
}

while IFS=$'\t' read -r SRC MIRROR SLUG; do
	if [[ "$SLUG" == jetpack ]]; then
		PREFIX=wp-content/mu-plugins/jetpack-plugin/sun
	elif [[ "$SLUG" == jetpack-mu-wpcom-plugin ]]; then
		PREFIX=wp-content/mu-plugins/jetpack-mu-wpcom-plugin/sun
	else
		echo "Skipping $SLUG, not deployed to wpcom Simple."
		continue
	fi

	cd "$GITHUB_WORKSPACE/build/$MIRROR"

	echo "::group::Initializing $SLUG"
	git init -b "tmp" .
	git config --local gc.auto 0
	git remote add origin "${GITHUB_SERVER_URL}/${MIRROR}"
	if ! UPSTREAM_SHA=$( get_upstream_sha ); then
		echo "::endgroup::"
		echo "Failed to determine mirror repo base sha for $SLUG"
		failed "$SLUG: Failed to determine mirror repo base sha."
		continue
	fi
	git reset --soft "$UPSTREAM_SHA"
	git add -Af
	echo '::endgroup::'

	FAILED=
	echo 'Added files:'
	while IFS= read -r FILE; do
		echo "- $FILE"
		check_underscores "$FILE"
		check_invalid_chars "$FILE"
		# check_executable "$FILE" # Not enabled for wpcom?
		check_symlink "$FILE"
	done < <( git -c core.quotepath=off diff --cached --name-only --no-renames --diff-filter=A )

	echo ''
	echo 'Modified files:'
	while IFS= read -r FILE; do
		echo "- $FILE"
		# check_executable "$FILE" # Not enabled for wpcom?
		check_symlink "$FILE"
	done < <( git -c core.quotepath=off diff --cached --name-only --no-renames --diff-filter=M )

	if [[ -z "$FAILED" ]]; then
		OUTPUT+=( "✅ $SLUG: All good!" )
	fi
done < "$GITHUB_WORKSPACE/build/plugins.tsv"

if [[ ${#OUTPUT[@]} -eq 0 ]]; then
	OUTPUT+=( "✅ No built plugins are deployed to wpcom Simple." )
fi

FINISHED=true
exit $EXIT
