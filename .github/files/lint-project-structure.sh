#!/usr/bin/env bash

set -eo pipefail
shopt -s dotglob

cd "$(dirname "${BASH_SOURCE[0]}")"/../..
BASE=$PWD
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"
. "$BASE/.github/versions.sh"

EXIT=0
declare -A OKFILES
for F in README.md .gitkeep .gitignore; do
	OKFILES[$F]=1
done

declare -A PROJECT_PREFIXES=(
	['github-actions']='Action'
	['packages']='Package'
	['plugins']='Plugin'
	['js-packages']='JS Package'
)

declare -A PKG_VENDOR_DIR_CACHE=()
while IFS=$'\t' read -r PKG VENDOR; do
	PKG_VENDOR_DIR_CACHE["$PKG=dev-trunk"]="$VENDOR"
done < <( jq -r '[ .name, if .type == "jetpack-library" then "jetpack_vendor" else "vendor" end ] | @tsv' "$BASE"/projects/packages/*/composer.json )

PACKAGES=$(jq -nc 'reduce inputs as $in ({}; .[ $in.name ] |= ( $in.extra["mirror-repo"] | type == "string" ) )' "$BASE"/projects/packages/*/composer.json)
JSPACKAGES='{}'
for PROJECT in "$BASE"/projects/js-packages/*/.; do
	JSPACKAGES=$(jq -c --slurpfile c "$PROJECT/composer.json" --slurpfile p "$PROJECT/package.json" '.[ $p[0].name ] |= ( $c[0].extra["mirror-repo"] | type == "string" ) and $c[0].extra["npmjs-autopublish"]' <<<"$JSPACKAGES")
done

# Check that `@dev`, `dev-foo`, and `1.2.x-dev` style deps are used appropraitely.
#
# - $1: What is being checked.
# - $2: Path to the composer.json to check.
# - $3: 'require' or 'require-dev', which to check.
# - $4: true or false, whether explicit git refs are allowed.
function check_composer_no_dev_deps {
	local SLUG="$1" FILE="$2" WHICH="$3" GITREFOK="$4"
	local RE WHAT
	if $GITREFOK; then
		RE='^(@dev|dev-[^#]*|[^@# ]*-dev([@ ][^#]*)?)$'
		WHAT="a release version or specific git commit"
	else
		RE='^(@dev(#.*)?|dev-.*|[^@# ]*-dev([@# ].*)?)$'
		WHAT="a release version"
	fi
	local PKG VER TMP LINE
	TMP="$(jq -r --arg which "$WHICH" --arg re "$RE" --argjson packages "$PACKAGES" '.[$which] // {} | to_entries[] | select( .key | in($packages) | not ) | select( .value | test( $re ) ) | [ .key, .value ] | @tsv' "$FILE")"
	[[ -n "$TMP" ]] || return 0
	while IFS=$'\t' read -r PKG VER; do
		LINE=$(jq --stream --arg which "$WHICH" --arg pkg "$PKG" 'if length == 1 then .[0][:-1] else .[0] end | if . == [$which,$pkg] then input_line_number else empty end' "$FILE" | head -n 1)
		EXIT=1
		echo "::error file=$FILE,line=$LINE::$SLUG must depend on $WHAT of \`$PKG\`, not \`$VER\`, to avoid lock file errors every time $PKG is updated."
	done <<<"$TMP"
}

# - projects/ should generally contain directories. But certain files are ok.
for PROJECT in projects/*; do
	if [[ ! -d "$PROJECT" ]]; then
		if [[ -n "${OKFILES[${PROJECT#projects/}]}" ]]; then
			debug "Ignoring file $PROJECT"
		else
			EXIT=1
			echo "::error file=$PROJECT::Project directories should not contain normal files."
		fi
	fi
done

for PROJECT in projects/*/*; do
	SLUG="${PROJECT#projects/}"
	TYPE="${SLUG%/*}"

	# - projects/*/ should also generally contain directories. But certain files are ok.
	if [[ ! -d "$PROJECT" ]]; then
		if [[ -n "${OKFILES[${SLUG#*/}]}" ]]; then
			debug "Ignoring file $PROJECT"
		else
			EXIT=1
			echo "::error file=$PROJECT::Project directories should not contain normal files."
		fi
		continue
	fi

	debug "Checking project $SLUG"

	# - package.json for js modules should look like a library to renovate.
	if [[ "$PROJECT" == projects/js-packages/* && -e "$PROJECT/package.json" ]]; then
		! IFS= read -r INDEX < <( ls -- "$PROJECT"/index.{js,jsx,cjs,mjs,ts,tsx,d.ts} 2>/dev/null )
		if [[ -n "$INDEX" ]] && ! jq -e '.private // .main // .exports' "$PROJECT/package.json" >/dev/null; then
			echo "::error file=$PROJECT/package.json::$SLUG appears to be a library (it has ${INDEX#$PROJECT/}), but does not specify \`.main\` or \`.exports\` in package.json. This will confuse renovate."
		fi
	fi

	# - package.json homepage, if set, should make sense.
	if [[ -e "$PROJECT/package.json" ]] && jq -e '.homepage' "$PROJECT/package.json" >/dev/null; then
		HP="$(jq -r '.homepage' "$PROJECT/package.json")"
		if [[ "$TYPE" != "plugins" && ( "$HP" == "https://jetpack.com" || "$HP" == "https://jetpack.com/"* ) ]]; then
			EXIT=1
			LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["homepage"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
			echo "::error file=$PROJECT/package.json$LINE::Homepage set to \"jetpack.com\" only makes sense for plugins. Something like \"https://github.com/Automattic/jetpack/tree/HEAD/$PROJECT/#readme\" would make more sense."
		fi
		if [[ "$HP" =~ ^https://github.com/Automattic/jetpack($|\.git|/?[?#]) ]]; then
			EXIT=1
			LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["homepage"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
			echo "::error file=$PROJECT/package.json$LINE::Homepage should not be set to the root of the monorepo. Something like \"https://github.com/Automattic/jetpack/tree/HEAD/$PROJECT/#readme\" would make more sense."
		fi
		if [[ "$HP" == "https://github.com/Automattic/jetpack/tree/"* && "$HP" != "https://github.com/Automattic/jetpack/tree/HEAD/$PROJECT/"* ||
			"$HP" == "https://github.com/Automattic/jetpack/blob/"* && "$HP" != "https://github.com/Automattic/jetpack/blob/HEAD/$PROJECT/"*
		]]; then
			EXIT=1
			LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["homepage"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
			echo "::error file=$PROJECT/package.json$LINE::Homepage should be set to somewhere within the package. Something like \"https://github.com/Automattic/jetpack/tree/HEAD/$PROJECT/#readme\" would make more sense."
		fi
		if [[ "$HP" == "https://github.com/Automattic/"* && ! "$HP" =~ ^https://github.com/Automattic/jetpack($|[/?#]) ]]; then
			EXIT=1
			LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["homepage"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
			echo "::error file=$PROJECT/package.json$LINE::Homepage should probably not point to a mirror repo. Pointing to the monorepo, like \"https://github.com/Automattic/jetpack/tree/HEAD/$PROJECT/#readme\", would make navigation from npmjs.com easier."
		fi
	fi

	# - package.json bugs.url, if set, should make sense.
	if [[ -e "$PROJECT/package.json" ]] && jq -e '.bugs.url' "$PROJECT/package.json" >/dev/null; then
		URL="$(jq -r '.bugs.url' "$PROJECT/package.json")"
		URL2="https://github.com/Automattic/jetpack/labels/[${PROJECT_PREFIXES[$TYPE]:-Prefix}] $(sed -E 's/(^|-)([a-z])/\1\u\2/g;s/-/ /g' <<<"${SLUG##*/}")"
		if [[ "$URL" == "https://github.com/Automattic/jetpack/issues" && "$SLUG" != "plugins/jetpack" ]]; then
			EXIT=1
			LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["bugs","url"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
			echo "::error file=$PROJECT/package.json$LINE::Setting the project's bug URL to the raw issues list makes no sense. Target the project's label instead, i.e. \"$URL2\"."
		fi
		if [[ "$URL" == "https://github.com/Automattic/jetpack/labels/"* && "${URL,,}" != "${URL2,,}" ]]; then
			EXIT=1
			LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["bugs","url"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
			printf -v URL3 "%b" "$(sed -E 's/\\/\\\\/g;s/%([0-9a-fA-F]{2})/\\x\1/g' <<<"$URL")"
			if [[ "${URL3,,}" == "${URL2,,}" ]]; then
				echo "::error file=$PROJECT/package.json$LINE::The \`.bugs.url\` gets (brokenly) passed through \`encodeURI\` by \`npm bugs\`, so it should not be encoded in package.json. Sigh. Try \"$URL2\" instead."
			else
				echo "::error file=$PROJECT/package.json$LINE::The \`.bugs.url\` appears to be pointing to the wrong label. Try \"$URL2\" instead."
			fi
		fi
		if [[ "$URL" == "https://github.com/Automattic/"* && "$URL" != "https://github.com/Automattic/jetpack/"* ]]; then
			EXIT=1
			LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["bugs","url"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
			echo "::error file=$PROJECT/package.json$LINE::Bug tracking is disabled in the mirror repos. Point to the monorepo label \"$URL2\" instead."
		fi
	fi

	# - package.json repository, if set, should make sense.
	if [[ -e "$PROJECT/package.json" ]] && jq -e '.repository' "$PROJECT/package.json" >/dev/null; then
		JSON="$(jq 'if .repository | type == "string" then { url: .repository } else .repository end' "$PROJECT/package.json")"
		LINE2=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["repository"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
		if ! jq -e '.type == "git"' <<<"$JSON" >/dev/null; then
			EXIT=1
			LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["repository","type"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
			echo "::error file=$PROJECT/package.json${LINE:-$LINE2}::Set \`.repository.type\` to \"git\", as the monorepo is a git repository."
		fi
		URL="$(jq -r '.url' <<<"$JSON")"

		# Published packages need to point to the mirror repo. Unpublished packages can point to mirror or monorepo.
		declare -A OKURLS=()
		MIRROR=$( jq -r '.extra["mirror-repo"]' "$PROJECT/composer.json" )
		OKURLS["git+https://github.com/$MIRROR.git"]=''
		if jq -e '.extra["npmjs-autopublish"]' "$PROJECT/composer.json" >/dev/null; then
			ERR1="Set \`.repository.url\` for published packages to point to the mirror repo in npm's canonical format, i.e. \"git+https://github.com/$MIRROR.git\"."
		else
			OKURLS["https://github.com/$MIRROR"]=''
			OKURLS["https://github.com/$MIRROR.git"]=''
			OKURLS["https://github.com/Automattic/jetpack"]="$PROJECT"
			OKURLS["https://github.com/Automattic/jetpack.git"]="$PROJECT"
			OKURLS["git+https://github.com/Automattic/jetpack.git"]="$PROJECT"
			ERR1="Set \`.repository.url\` to point to the monorepo or mirror repo, e.g. \"https://github.com/Automattic/jetpack\" or \"git+https://github.com/$MIRROR.git\"."
		fi

		if [[ ! -v OKURLS["$URL"] ]]; then
			EXIT=1
			LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["repository","url"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
			echo "::error file=$PROJECT/package.json${LINE:-$LINE2}::$ERR1"
		elif [[ -z "${OKURLS["$URL"]}" ]]; then
			if jq -e 'has( "directory" )' <<<"$JSON" &>/dev/null; then
				EXIT=1
				LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["repository","directory"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
				echo "::error file=$PROJECT/package.json${LINE:-$LINE2}::When \`.repository.url\` is set to the mirror repo, \`.repository.directory\` should not be set."
			fi
		else
			TMP="$(jq -r '.directory' <<<"$JSON")"
			if [[ "$TMP" != "${OKURLS["$URL"]}" ]]; then
				EXIT=1
				LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["repository","directory"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json")
				echo "::error file=$PROJECT/package.json${LINE:-$LINE2}::Set \`.repository.directory\` to point to the project's path within the specified repo, i.e. \"${OKURLS["$URL"]}\"."
			fi
		fi
	fi

	# - should have only one of jsconfig.json or tsconfig.json.
	# @todo Having neither is ok in some cases. Can we determine when one is needed to flag that it should be added?
	if [[ -e "$PROJECT/jsconfig.json" && -e "$PROJECT/tsconfig.json" ]]; then
		EXIT=1
		echo "::error file=$PROJECT/jsconfig.json::The project should have either jsconfig.json or tsconfig.json, not both. Keep tsconfig if the project uses TypeScript, or jsconfig if the project is JS-only."
		echo "::error file=$PROJECT/tsconfig.json::The project should have either jsconfig.json or tsconfig.json, not both. Keep tsconfig if the project uses TypeScript, or jsconfig if the project is JS-only."
	fi

	# - We want to use @babel/preset-typescript (and fork-ts-checker-webpack-plugin or tsc for definition files) rather than ts-loader.
	if [[ -e "$PROJECT/package.json" ]] && jq -e '.dependencies["ts-loader"] // .devDependencies["ts-loader"] // .optionalDependencies["ts-loader"]' "$PROJECT/package.json" >/dev/null; then
		EXIT=1
		LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["dependencies","ts-loader"] or . == ["devDependencies","ts-loader"] or . == ["optionalDependencies","ts-loader"] then ",line=\( input_line_number )" else empty end' "$PROJECT/package.json" | head -1)
		echo "::error file=$PROJECT/package.json${LINE}::For consistency we've settled on using \`@babel/preset-typescript\` (and \`fork-ts-checker-webpack-plugin\` or \`tsgo\` for definition files) rather than \`ts-loader\`. Please switch to that."
	fi

	# - certain tsconfig options should not be used directly.
	if [[ -e "$PROJECT/tsconfig.json" ]]; then
		# tsconfig.json files may have comments. Strip those.
		JSON=$( sed 's#^[ \t]*//.*##' "$PROJECT/tsconfig.json" );
		if ! jq -e <<< "$JSON" &>/dev/null; then
			EXIT=1
			# Inline comments are messy; it's easier to hint rather than strip them.
			inline_comment_hint=$(grep -q '//' "$PROJECT/tsconfig.json" && echo ' Perhaps there are inline comments?' || true)
			echo "::error file=$PROJECT/tsconfig.json::Unable to parse tsconfig.json.$inline_comment_hint"
		else
			if jq -e '.compilerOptions // {} | has( "noEmit" )' <<<"$JSON" >/dev/null; then
				EXIT=1
				LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["compilerOptions","noEmit"] then ",line=\( input_line_number )" else empty end' <<<"$JSON")
				echo "::error file=$PROJECT/tsconfig.json${LINE}::Don't set noEmit directly. Extend tsconfig.base.json if you want it false, or tsconfig.tsc.json or tsconfig.tsc-declaration-only.json if you want it true."
			fi
			if jq -e '.compilerOptions // {} | has( "module" )' <<<"$JSON" >/dev/null; then
				EXIT=1
				LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["compilerOptions","module"] then ",line=\( input_line_number )" else empty end' <<<"$JSON")
				echo "::error file=$PROJECT/tsconfig.json${LINE}::Don't set module directly. Our base configs already set correct values."
			fi
			if jq -e '.compilerOptions // {} | has( "moduleResolution" )' <<<"$JSON" >/dev/null; then
				EXIT=1
				LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["compilerOptions","moduleResolution"] then ",line=\( input_line_number )" else empty end' <<<"$JSON")
				echo "::error file=$PROJECT/tsconfig.json${LINE}::Don't set moduleResolution directly. Our base configs already set correct values."
			fi
		fi
	fi

	# - if the project has any php files, a phan config should exist.
	if [[ -n "$( git ls-files ":!$PROJECT/.phan/*" "$PROJECT/*.php" )" ]]; then
		if [[ ! -e "$PROJECT/.phan/config.php" ]]; then
			EXIT=1
			echo "::error file=$PROJECT/.phan/config.php::Project $SLUG has PHP files but does not contain .phan/config.php. Refer to Static Analysis in docs/monorepo.md."
		fi
	fi

	# - composer.json must exist.
	if [[ ! -e "$PROJECT/composer.json" ]]; then
		EXIT=1
		echo "::error file=$PROJECT/composer.json::Project $SLUG does not contain composer.json."
		continue
	fi

	### All tests depending on composer.json must go below here.

	# - composer.json must include a monorepo .repositories entry.
	if ! jq --arg type "$TYPE" -e '.repositories[]? | select( .type == "path" and ( .url == "../../packages/*" or $type == "packages" and .url == "../*" ) )' "$PROJECT/composer.json" >/dev/null; then
		EXIT=1
		echo "::error file=$PROJECT/composer.json::$PROJECT/composer.json should have a \`repositories\` entry pointing to \`../../packages/*\`."
	fi

	# - Changelogger's changes-dir must have a .gitkeep.
	# - Changelogger's changes-dir must be production-excluded.
	CHANGES_DIR="$(jq -r '.extra.changelogger["changes-dir"] // "changelog"' "$PROJECT/composer.json")"
	if [[ ! -e "$PROJECT/$CHANGES_DIR/.gitkeep" ]]; then
		EXIT=1
		echo "::error file=$PROJECT/$CHANGES_DIR/.gitkeep::Project $SLUG should have a file at $CHANGES_DIR/.gitkeep so that $CHANGES_DIR does not get removed when releasing."
	fi
	if [[ "$(git check-attr production-exclude -- $PROJECT/$CHANGES_DIR/file)" != *": production-exclude: set" ]]; then
		EXIT=1
		echo "::error file=$PROJECT/.gitattributes::Files in $PROJECT/$CHANGES_DIR/ must have git attribute production-exclude."
	fi

	# - Packages must have a dev-trunk branch-alias.
	if [[ "$TYPE" == "packages" ]] && ! jq -e '.extra["branch-alias"]["dev-trunk"]' "$PROJECT/composer.json" >/dev/null; then
		EXIT=1
		echo "::error file=$PROJECT/composer.json::Package $SLUG should set \`.extra.branch-alias.dev-trunk\` in composer.json."
	fi

	# - Packages must set `.require.php`.
	if [[ "$TYPE" == "packages" ]] && ! jq -e '.require.php // null' "$PROJECT/composer.json" >/dev/null; then
		EXIT=1
		LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["require"] then ",line=\( input_line_number )" else empty end' "$PROJECT/composer.json")
		echo "::error file=$PROJECT/composer.json$LINE::Package $SLUG should set \`.require.php\` in composer.json (probably to \">=$MIN_PHP_VERSION\")."
	fi

	SUGGESTION="You might add this with \`composer config autoloader-suffix '$(printf "%s" "$SLUG" | md5sum | sed -e 's/[[:space:]]*-$//')_$(sed -e 's/[^0-9a-zA-Z]/_/g' <<<"${SLUG##*/}")ⓥversion'\` in the appropriate directory."

	# - If vendor/autoload.php or vendor/autoload_packages.php is production-included, composer.json must set .config.autoloader-suffix.
	if [[ -n "$(git check-attr production-include -- "$PROJECT/vendor/autoload.php" "$PROJECT/vendor/autoload_packages.php" | sed -n 's/: production-include: \(unspecified\|unset\)$//;t;s/: production-include: .*//p')" ]] &&
		! jq -e '.config["autoloader-suffix"]' "$PROJECT/composer.json" >/dev/null
	then
		EXIT=1
		echo "---" # Bracket message containing newlines for better visibility in GH's logs.
		echo "::error file=$PROJECT/composer.json::Since $SLUG production-includes an autoloader, $PROJECT/composer.json must set .config.autoloader-suffix.%0AThis avoids spurious changes with every build, cf. https://github.com/Automattic/jetpack-production/commits/trunk/vendor/autoload.php?after=a59e4613559b9822cfc9db88524f09b669f32296+0.%0A${SUGGESTION}"
		echo "---"
	fi

	# - If vendor/autoload_packages.php is production-included and .config.autoloader-suffix is set, it must contain ⓥ.
	# - Require that the first part of .config.autoloader-suffix is long enough.
	if jq -e '.config["autoloader-suffix"]' "$PROJECT/composer.json" >/dev/null; then
		LINE=$(grep --line-number --max-count=1 '^		"autoloader-suffix":' "$PROJECT/composer.json" || true)
		if [[ -n "$LINE" ]]; then
			LINE=",line=${LINE%%:*}"
		fi
		if [[ -n "$(git check-attr production-include -- "$PROJECT/vendor/autoload_packages.php" | sed -n 's/: production-include: \(unspecified\|unset\)$//;t;s/: production-include: .*//p')" ]] &&
			! jq -e '.config["autoloader-suffix"] | contains( "ⓥ" )' "$PROJECT/composer.json" >/dev/null
		then
			EXIT=1
			echo "---" # Bracket message containing newlines for better visibility in GH's logs.
			echo "::error file=$PROJECT/composer.json$LINE::When the Jetpack Autoloader is production-included, .config.autoloader-suffix must contain \"ⓥ\" (\\u24e5) to avoid https://github.com/Automattic/jetpack/issues/19472.%0A$SUGGESTION"
			echo "---"
		fi
		if jq -e '.config["autoloader-suffix"] | split( "ⓥ" )[0] | length < 32' "$PROJECT/composer.json" >/dev/null; then
			EXIT=1
			echo "::error file=$PROJECT/composer.json$LINE::When set, the part of .config.autoloader-suffix (before the \"ⓥ\" (\\u24e5), if any) must be at least 32 characters.%0A$SUGGESTION"
		fi
	fi

	# - `@dev`, `dev-foo`, or `1.x-dev` type deps are only allowed in certain cases.
	git ls-files --error-unmatch "$PROJECT/composer.lock" &>/dev/null && HAS_LOCK=true || HAS_LOCK=false
	if [[ "$TYPE" == "packages" ]]; then
		check_composer_no_dev_deps "Project $SLUG" "$PROJECT/composer.json" require false
	elif $HAS_LOCK; then
		check_composer_no_dev_deps "Project $SLUG" "$PROJECT/composer.json" require true
	fi
	if $HAS_LOCK; then
		check_composer_no_dev_deps "Project $SLUG" "$PROJECT/composer.json" require-dev true
	fi

	# - Packages setting textdomain must have type set to "jetpack-library".
	if [[ "$TYPE" == "packages" ]] && jq -e '.extra["textdomain"] and .type != "jetpack-library"' "$PROJECT/composer.json" >/dev/null; then
		EXIT=1
		LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["type"] then ",line=\( input_line_number )" else empty end' "$PROJECT/composer.json")
		echo "::error file=$PROJECT/composer.json$LINE::Package $SLUG uses i18n (i.e. it sets \`.extra.textdomain\`), but does not set \`.type\` to \`jetpack-library\` in composer.json.%0AThis will prevent it from being translated when used in plugins."
	fi

	# - If it's being published to npmjs, it should have certain metadata fields.
	# - If it's being published to npmjs, its non-dev deps should also be published.
	if jq -e '.extra["npmjs-autopublish"]' "$PROJECT/composer.json" >/dev/null; then
		if ! jq -e '.repository' "$PROJECT/package.json" >/dev/null; then
			EXIT=1
			JSON="$(jq --tab --arg dir "$PROJECT" -n '{ type: "git", url: "https://github.com/Automattic/jetpack.git", directory: $dir }')"
			echo "---" # Bracket message containing newlines for better visibility in GH's logs.
			echo "::error file=$PROJECT/package.json::Package $SLUG is published to npmjs but does not specify \`.repository\`.%0A\`\`\`%0A\"repository\": ${JSON//$'\n'/%0A},%0A\`\`\`"
			echo "---"
		fi
		if ! jq -e '.homepage' "$PROJECT/package.json" >/dev/null; then
			EXIT=1
			echo "---" # Bracket message containing newlines for better visibility in GH's logs.
			echo "::error file=$PROJECT/package.json::Package $SLUG is published to npmjs but does not specify \`.homepage\`.%0A\`\`\`%0A\"homepage\": \"https://github.com/Automattic/jetpack/tree/HEAD/$PROJECT/#readme\",%0A\`\`\`"
			echo "---"
		fi
		if ! jq -e '.bugs.url' "$PROJECT/package.json" >/dev/null; then
			EXIT=1
			URL2="https://github.com/Automattic/jetpack/labels/[${PROJECT_PREFIXES[$TYPE]:-Prefix}] $(sed -E 's/(^|-)([a-z])/\1\u\2/g;s/-/ /g' <<<"${SLUG##*/}")"
			JSON="$(jq --tab --arg url "$URL2" -n '{ url: $url }')"
			echo "---" # Bracket message containing newlines for better visibility in GH's logs.
			echo "::error file=$PROJECT/package.json::Package $SLUG is published to npmjs but does not specify \`.bugs.url\`.%0A\`\`\`%0A\"bugs\": ${JSON//$'\n'/%0A},%0A\`\`\`"
			echo "---"
		fi
		if jq -e '.private' "$PROJECT/package.json" >/dev/null; then
			EXIT=1
			LINE=$(jq --stream 'if length == 1 then .[0][:-1] else .[0] end | if . == ["private"] then input_line_number else empty end' "$PROJECT/package.json" | head -n 1)
			echo "::error file=$PROJECT/package.json,line=$LINE::Package $SLUG is published to npmjs but is marked as private."
		fi

		for WHICH in dependencies peerDependencies; do
			TMP=$(jq -r --arg which "$WHICH" --argjson packages "$JSPACKAGES" '.[$which] // {} | to_entries[] | select( .key | in( $packages ) ) | select( $packages[.key] | not ) | [ .key ] | @tsv' "$PROJECT/package.json")
			if [[ -n "$TMP" ]]; then
				EXIT=1
				while IFS=$'\t' read -r PKG; do
					LINE=$(jq --stream --arg which "$WHICH" --arg pkg "$PKG" 'if length == 1 then .[0][:-1] else .[0] end | if . == [$which,$pkg] then input_line_number else empty end' "$PROJECT/package.json" | head -n 1)
					echo "::error file=$PROJECT/package.json,line=$LINE::$SLUG is published and depends on \`$PKG\`, but \`$PKG\` is not being published."
				done <<<"$TMP"
			fi
		done

	fi

	# - If a package is published (i.e. it has a mirror-repo), all its non-dev deps should also be published.
	if [[ "$TYPE" == "packages" ]] && jq -e '.extra["mirror-repo"]' "$PROJECT/composer.json" >/dev/null; then
		# shellcheck disable=SC2043
		for WHICH in require; do
			TMP=$(jq -r --arg which "$WHICH" --argjson packages "$PACKAGES" '.[$which] // {} | to_entries[] | select( .key | in( $packages ) ) | select( $packages[.key] | not ) | [ .key ] | @tsv' "$PROJECT/composer.json")
			if [[ -n "$TMP" ]]; then
				EXIT=1
				while IFS=$'\t' read -r PKG; do
					LINE=$(jq --stream --arg which "$WHICH" --arg pkg "$PKG" 'if length == 1 then .[0][:-1] else .[0] end | if . == [$which,$pkg] then input_line_number else empty end' "$PROJECT/composer.json" | head -n 1)
					echo "::error file=$PROJECT/composer.json,line=$LINE::$SLUG is published (i.e. it has a mirror repo set) and depends on \`$PKG\`, but \`$PKG\` is not being published."
				done <<<"$TMP"
			fi
		done
	fi

	# - Plugins can only depend on published packages.
	if [[ "$TYPE" == "plugins" ]]; then
		# shellcheck disable=SC2043
		for WHICH in require; do
			TMP=$(jq -r --arg which "$WHICH" --argjson packages "$PACKAGES" '.[$which] // {} | to_entries[] | select( .key | in( $packages ) ) | select( $packages[.key] | not ) | [ .key ] | @tsv' "$PROJECT/composer.json")
			if [[ -n "$TMP" ]]; then
				EXIT=1
				while IFS=$'\t' read -r PKG; do
					LINE=$(jq --stream --arg which "$WHICH" --arg pkg "$PKG" 'if length == 1 then .[0][:-1] else .[0] end | if . == [$which,$pkg] then input_line_number else empty end' "$PROJECT/composer.json" | head -n 1)
					echo "::error file=$PROJECT/composer.json,line=$LINE::$SLUG depends on \`$PKG\`, but \`$PKG\` is not being published."
				done <<<"$TMP"
			fi
		done
	fi

	# - Only plugins can use non-semver versioning.
	# - Changelog header should not mention semver if project does not use semver.
	if jq -e '( .extra.changelogger.versioning // "semver" ) != "semver"' "$PROJECT/composer.json" >/dev/null; then
		if [[ "$TYPE" != "plugins" ]]; then
			EXIT=1
			LINE=$(jq --stream -r 'if length == 1 then .[0][:-1] else .[0] end | if . == ["extra","changelogger","versioning"] then ",line=\( input_line_number )" else empty end' "$PROJECT/composer.json")
			echo "::error file=$PROJECT/composer.json$LINE::Project $SLUG needs to use semver (only plugins may use other versioning methods)."
		else
			LINE=$(sed '/^##/ q' "$PROJECT/CHANGELOG.md" | grep --line-number --max-count=1 'semver\.org' || true)
			if [[ -n "$LINE" ]]; then
				EXIT=1
				echo "::error file=$PROJECT/CHANGELOG.md,line=${LINE%%:*}::Changelog should not mention semver when project does not use semver."
			fi
		fi
	fi

	# - Plugin non-dev composer dependencies need to be production-included.
	if [[ "$TYPE" == "plugins" && -e "$PROJECT/composer.lock" ]]; then
		HAS_COMPOSER_PLUGIN=false
		if composer -d "$PROJECT" info --locked automattic/jetpack-composer-plugin &>/dev/null; then
			HAS_COMPOSER_PLUGIN=true
		fi
		while IFS=$'\t' read -r PKG VER; do
			VENDOR=vendor
			if $HAS_COMPOSER_PLUGIN; then
				if [[ -z "${PKG_VENDOR_DIR_CACHE["$PKG=$VER"]}" ]]; then
					if composer -d "$PROJECT" info --locked --format=json "$PKG" | jq -e '.type == "jetpack-library"' &>/dev/null; then
						PKG_VENDOR_DIR_CACHE["$PKG=$VER"]=jetpack_vendor
					else
						PKG_VENDOR_DIR_CACHE["$PKG=$VER"]=vendor
					fi
				fi
				VENDOR=${PKG_VENDOR_DIR_CACHE["$PKG=$VER"]}
			fi
			if [[ "$(git check-attr production-include -- "$PROJECT/$VENDOR/$PKG/file")" != *": production-include: set" ]]; then
				EXIT=1
				echo "---"
				echo "::error file=$PROJECT/.gitattributes::Non-dev composer dependency $PKG is not being production-included. Either make it a dev dependency, or add a line like%0A/$VENDOR/$PKG/**    production-include%0Ain \`.gitattributes\`."
				echo "---"
			fi
		done < <( composer -d "$PROJECT" info --locked --no-dev --format=json | jq -r 'if type == "object" then .locked[] | [ .name, .version ] | @tsv else empty end' )
	fi

	# - `.extra.dependencies.test-only` must refer to dev dependencies.
	if jq -e '.extra.dependencies["test-only"] // empty' "$PROJECT/composer.json" >/dev/null; then
		while IFS=$'\t' read -r LINE DEP; do
			if [[ ! -e "projects/$DEP/composer.json" ]]; then
				EXIT=1
				echo "::error file=$PROJECT/composer.json,line=${LINE}::Dependency \"$DEP\" does not exist in the monorepo."
			elif [[ "$DEP" == packages/* ]]; then
				N=$( jq -r .name "projects/$DEP/composer.json" )
				if ! jq -e --arg N "$N" '.["require-dev"][$N]' "$PROJECT/composer.json" &>/dev/null; then
					EXIT=1
					echo "::error file=$PROJECT/composer.json,line=${LINE}::Project \"$DEP\" ($N) is not a dev dependency of $SLUG."
				fi
			elif [[ "$DEP" == js-packages/* ]]; then
				N=$( jq -r .name "projects/$DEP/package.json" 2>/dev/null || true )
				if ! jq -e --arg N "$N" '.devDependencies[$N]' "$PROJECT/package.json" &>/dev/null; then
					EXIT=1
					echo "::error file=$PROJECT/composer.json,line=${LINE}::Project \"$DEP\" ($N) is not a dev dependency of $SLUG."
				fi
			else
				EXIT=1
				echo "::error file=$PROJECT/composer.json,line=${LINE}::Dependency \"$DEP\" is neither a package nor a js-package."
			fi
		done < <( jq --stream -r 'if length == 2 and .[0][:-1] == ["extra","dependencies","test-only"] then [input_line_number,.[1]] | @tsv else empty end' "$PROJECT/composer.json" )
	fi

	# - No direct use of WorDBless.
	if jq -e '.require["automattic/wordbless"] // .["require-dev"]["automattic/wordbless"]' "$PROJECT/composer.json" >/dev/null; then
		while IFS=$'\t' read -r LINE; do
			EXIT=1
			echo "::error file=$PROJECT/composer.json,line=${LINE}::Do not use \`automattic/wordbless\` directly; use \`automattic/jetpack-test-environment\` instead. See #41057 for details."
		done < <( jq --stream -r 'if length == 2 and ( .[0] == ["require","automattic/wordbless"] or .[0] == ["require-dev","automattic/wordbless"] ) then [input_line_number] | @tsv else empty end' "$PROJECT/composer.json" )
	fi

	# - Must use yoast/phpunit-polyfills with automattic/phpunit-select-config.
	if jq -e '.require["automattic/phpunit-select-config"] // .["require-dev"]["automattic/phpunit-select-config"]' "$PROJECT/composer.json" >/dev/null &&
		! jq -e '.require["yoast/phpunit-polyfills"] // .["require-dev"]["yoast/phpunit-polyfills"]' "$PROJECT/composer.json" >/dev/null
	then
		while IFS=$'\t' read -r LINE; do
			EXIT=1
			echo "::error file=$PROJECT/composer.json,line=${LINE}::We require \`yoast/phpunit-polyfills\` to get the correct version of PHPUnit. Please add it, or remove other PHPUnit-related packages if you're not using PHPUnit for testing."
		done < <( jq --stream -r 'if length == 2 and ( .[0] == ["require","automattic/phpunit-select-config"] or .[0] == ["require-dev","automattic/phpunit-select-config"] ) then [input_line_number] | @tsv else empty end' "$PROJECT/composer.json" )
	fi

	# - Plugins shouldn't have redundant wp-plugin-slug and beta-plugin-slug.
	if [[ "$TYPE" == "plugins" ]] && jq -e '.extra["wp-plugin-slug"] and .extra["beta-plugin-slug"] and .extra["wp-plugin-slug"] == .extra["beta-plugin-slug"]' "$PROJECT/composer.json" > /dev/null; then
		EXIT=1
		LINE=$(jq --stream 'if length == 1 then .[0][:-1] else .[0] end | if . == ["extra","beta-plugin-slug"] then input_line_number else empty end' "$PROJECT/composer.json" | head -n 1)
		echo "::error file=$PROJECT/composer.json,line=$LINE::There is no need to set both \`wp-plugin-slug\` and \`beta-plugin-slug\` to the same value. Delete \`beta-plugin-slug\` if the plugin is on wporg (or will be soon), or \`wp-plugin-slug\` otherwise."
	fi

done

# - Monorepo root composer.json must also use dev deps appropriately.
debug "Checking monorepo root composer.json"
check_composer_no_dev_deps "Monorepo root" "composer.json" require true
check_composer_no_dev_deps "Monorepo root" "composer.json" require-dev true

# - Composer name fields should not be repeated.
debug "Checking for duplicate composer.json names"
DUPS="$(jq -rn 'reduce inputs as $i ({}; .[$i.name] |= ( . // [] ) + [ input_filename ]) | to_entries[] | .key as $key | .value | select( length > 1 ) | ( [ .[] | capture("^projects/(?<s>.*)/composer\\.json$").s ] | .[-1] |= "and " + . | join( if length > 2 then ", " else " " end ) ) as $slugs | .[] | [ ., $key, $slugs ] | @tsv' projects/*/*/composer.json)"
if [[ -n "$DUPS" ]]; then
	while IFS=$'\t' read -r FILE KEY SLUGS; do
		LINE=$(grep --line-number --max-count=1 '^	"name":' "$FILE" || true)
		if [[ -n "$LINE" ]]; then
			LINE=",line=${LINE%%:*}"
		fi
		EXIT=1
		echo "::error file=$FILE$LINE::Name $KEY is in use in composer.json by $SLUGS. They must be deduplicated."
	done <<<"$DUPS"
fi

# - package.json name fields should not be repeated.
debug "Checking for duplicate package.json names"
DUPS="$(jq -rn 'reduce inputs as $i ({}; if $i.name then .[$i.name] |= ( . // [] ) + [ input_filename ] else . end) | to_entries[] | .key as $key | .value | select( length > 1 ) | ( [ .[] | capture("^projects/(?<s>.*)/package\\.json$").s ] | .[-1] |= "and " + . | join( if length > 2 then ", " else " " end ) ) as $slugs | .[] | [ ., $key, $slugs ] | @tsv' projects/*/*/package.json projects/*/*/tests/e2e/package.json)"
if [[ -n "$DUPS" ]]; then
	while IFS=$'\t' read -r FILE KEY SLUGS; do
		LINE=$(grep --line-number --max-count=1 '^	"name":' "$FILE" || true)
		if [[ -n "$LINE" ]]; then
			LINE=",line=${LINE%%:*}"
		fi
		EXIT=1
		echo "::error file=$FILE$LINE::Name $KEY is in use in package.json by $SLUGS. They must be deduplicated."
	done <<<"$DUPS"
fi

# - Text domains from plugins should not be used in packages.
debug "Checking package textdomain usage vs plugin slugs"
PLUGDOMAINS="$(jq -n 'reduce inputs as $i ({}; .[$i.extra["wp-plugin-slug"] // $i.extra["beta-plugin-slug"] // ""] = ( input_filename | sub("^projects/(?<slug>.*)/composer\\.json$";"\(.slug)"))) | .[""] |= empty' projects/plugins/*/composer.json)"
for FILE in projects/packages/*/composer.json; do
	DIR="${FILE%/composer.json}"
	SLUG="${DIR#projects/}"
	DOM="$(jq -r '.extra.textdomain // ""' "$FILE")"
	if [[ -n "$DOM" ]]; then
		USEDBY="$(jq --argjson plugdom "$PLUGDOMAINS" --arg dom "$DOM" -rn '$plugdom[$dom] // ""')"
		if [[ -n "$USEDBY" ]]; then
			EXIT=1
			LINE=$(jq --stream 'if length == 1 then .[0][:-1] else .[0] end | if . == ["extra","textdomain"] then input_line_number else empty end' "$FILE")
			echo "::error file=$FILE,line=$LINE::Package $SLUG may not use textdomain $DOM, that domain belongs to plugin $USEDBY."
		fi
	fi
done

# - Text domains in phpcs config should match composer.json.
debug "Checking package textdomain usage in phpcs config"
for FILE in $(git -c core.quotepath=off ls-files 'projects/*/**/.phpcs.dir.xml'); do
	DOM="$(php -r '$doc = new DOMDocument(); $doc->load( $argv[1] ); $xpath = new DOMXPath( $doc ); echo $xpath->evaluate( "string(//rule[@ref=\"WordPress.WP.I18n\"]/properties/property[@name=\"text_domain\"]/element/@value)" );' "$FILE")"
	[[ -z "$DOM" ]] && continue
	DIR="$FILE"
	while ! [[ "$DIR" =~ ^projects/[^/]*/[^/]*$ ]]; do
		DIR="${DIR%/*}"
	done
	SLUG="${DIR#projects/}"
	if [[ "$SLUG" == plugins/* ]]; then
		WHAT='`.extra.wp-plugin-slug` or `.extra.beta-plugin-slug`'
		DOM2="$(jq -r '.extra["wp-plugin-slug"] // .extra["beta-plugin-slug"] // ""' "$DIR/composer.json")"
	else
		WHAT='`.extra.textdomain`'
		DOM2="$(jq -r '.extra.textdomain // ""' "$DIR/composer.json")"
	fi
	if [[ "$DOM" != "$DOM2" ]]; then
		EXIT=1
		LINE=$(grep --line-number --max-count=1 'name="text_domain"' "$FILE" || true)
		if [[ -n "$LINE" ]]; then
			LINE=",line=${LINE%%:*}"
		fi
		if [[ -z "$DOM2" ]]; then
			echo "::error file=$FILE$LINE::PHPCS config sets textdomain \"$DOM\", but $SLUG's composer.json does not set $WHAT."
		else
			echo "::error file=$FILE$LINE::PHPCS config sets textdomain \"$DOM\", but $SLUG's composer.json sets domain \"$DOM2\"."
		fi
	fi
done

# - Text domains in block.json should match composer.json.
debug "Checking textdomain usage in block.json"
for FILE in $(git -c core.quotepath=off ls-files 'projects/packages/**/block.json' 'projects/plugins/**/block.json'); do
	[[ "$FILE" == projects/packages/blocks/tests/php/fixtures/* ]] && continue  # Ignore test fixtures

	DOM="$(jq -r '.textdomain' "$FILE")"
	DIR="$FILE"
	while ! [[ "$DIR" =~ ^projects/[^/]*/[^/]*$ ]]; do
		DIR="${DIR%/*}"
	done
	SLUG="${DIR#projects/}"
	if [[ "$SLUG" == plugins/* ]]; then
		WHAT='`.extra.wp-plugin-slug` or `.extra.beta-plugin-slug`'
		DOM2="$(jq -r '.extra["wp-plugin-slug"] // .extra["beta-plugin-slug"] // ""' "$DIR/composer.json")"
	else
		WHAT='`.extra.textdomain`'
		DOM2="$(jq -r '.extra.textdomain // ""' "$DIR/composer.json")"
	fi
	if [[ "$DOM" != "$DOM2" ]]; then
		EXIT=1
		LINE=$(jq --stream 'if length == 1 then .[0][:-1] else .[0] end | if . == ["textdomain"] then input_line_number - 1 else empty end' package.json)
		if [[ -n "$LINE" ]]; then
			LINE=",line=${LINE%%:*}"
		fi
		if [[ -z "$DOM2" ]]; then
			echo "::error file=$FILE$LINE::block.json sets textdomain \"$DOM\", but $SLUG's composer.json does not set $WHAT."
		else
			echo "::error file=$FILE$LINE::block.json sets textdomain \"$DOM\", but $SLUG's composer.json sets domain \"$DOM2\"."
		fi
	fi
done

# - In phpcs config, `<rule ref="Standard.Category.Sniff.Message"><severity>0</severity></rule>` doesn't do what you think.
debug "Checking for bad message exclusions in phpcs configs"
for FILE in $(git -c core.quotepath=off ls-files .phpcs.config.xml .phpcs.xml.dist .github/files/php-linting-phpcs.xml .github/files/phpcompatibility-dev-phpcs.xml '*/.phpcs.dir.xml' '*/.phpcs.dir.phpcompatibility.xml'); do
	while IFS=$'\t' read -r LINE REF; do
		EXIT=1
		echo "::error file=$FILE,line=$LINE::PHPCS config attempts to set severity 0 for the sniff message \"$REF\". To exclude a single message from a sniff, use \`<rule ref=\"${REF%.*}\"><exclude name=\"$REF\"/></rule>\` instead."
	done < <( php -- "$FILE" <<-'PHPDOC'
		<?php
		$doc = new DOMDocument();
		$doc->load( $argv[1] );
		$xpath = new DOMXPath( $doc );
		function has_message( $v ) {
			return count( explode(".", $v[0]->value) ) >= 4;
		}
		$xpath->registerNamespace("php", "http://php.net/xpath");
		$xpath->registerPHPFunctions( "has_message" );
		foreach ( $xpath->evaluate( "//rule[php:function(\"has_message\", @ref)][severity[normalize-space(.)=\"0\"]]" ) as $node ) {
			echo "{$node->getLineNo()}\t{$node->getAttribute("ref")}\n";
		}
		PHPDOC
	)
done

# - Make sure .phpcs.dir.phpcompatibility.xml has corresponding .phpcs.dir.xml.
#   (This isn't perfect, since it doesn't catch anything except the Jetpack-Compat-* stuff, but in most cases that's all we have in .phpcs.dir.phpcompatibility.xml anyway)
debug "Checking that .phpcs.dir.phpcompatibility.xml has corresponding .phpcs.dir.xml"
for FILE in $(git -c core.quotepath=off ls-files '*/.phpcs.dir.phpcompatibility.xml'); do
	DIR=${FILE%/.phpcs.dir.phpcompatibility.xml}
	if [[ ! -f "$DIR/.phpcs.dir.xml" ]]; then
		EXIT=1
		echo "::error file=$FILE::There should be a file \`$DIR/.phpcs.dir.xml\` corresponding to this file, so local phpcs runs behave appropriately."
		continue
	fi
	if grep -q '<rule ref="\./\.phpcs\.dir\.phpcompatibility\.xml" */>' "$DIR/.phpcs.dir.xml"; then
		# Probably ok if the .dir.xml includes the .dir.phpcompatibility.xml.
		continue
	fi
	while IFS= read -r LINE; do
		LINE2=${LINE/Jetpack-Compat-NoWP/Jetpack-NoWP}
		RE=$( sed 's! */>$!!' <<<"$LINE2" )
		if ! grep --fixed-strings -q "$RE" "$DIR/.phpcs.dir.xml"; then
			EXIT=1
			echo "::error file=$DIR/.phpcs.dir.xml::File should contain \`$LINE2\` to match \`$FILE\`."
		fi
	done < <( grep -o '<rule ref="Jetpack-Compat-[^"]*" */>' "$FILE" )
done

# - .nvmrc should match .github/versions.sh.
debug "Checking .nvmrc vs versions.sh"
if [[ "$(<.nvmrc)" != "$NODE_VERSION" ]]; then
	EXIT=1
	echo "::error file=.nvmrc::Version in .nvmrc must be $NODE_VERSION, to match .github/versions.sh."
fi

# - package.json engines should be satisfied by .github/versions.sh.
debug "Checking .github/versions.sh vs package.json engines"
RANGE="$(jq -r '.engines.node' package.json)"
if ! pnpm semver --range "$RANGE" "$NODE_VERSION" &>/dev/null; then
	EXIT=1
	LINE=$(jq --stream 'if length == 1 then .[0][:-1] else .[0] end | if . == ["engines","node"] then input_line_number - 1 else empty end' package.json)
	echo "::error file=package.json,line=$LINE::Node version $NODE_VERSION in .github/versions.sh does not satisfy requirement $RANGE from package.json"
fi
RANGE="$(jq -r '.engines.pnpm' package.json)"
if ! pnpm semver --range "$RANGE" "$PNPM_VERSION" &>/dev/null; then
	EXIT=1
	LINE=$(jq --stream 'if length == 1 then .[0][:-1] else .[0] end | if . == ["engines","pnpm"] then input_line_number - 1 else empty end' package.json)
	echo "::error file=package.json,line=$LINE::Pnpm version $PNPM_VERSION in .github/versions.sh does not satisfy requirement $RANGE from package.json"
fi
if jq -e 'has( "packageManager" )' package.json &>/dev/null; then
	EXIT=1
	LINE=$(jq --stream 'if length == 1 then .[0][:-1] else .[0] end | if . == ["packageManager"] then input_line_number - 1 else empty end' package.json)
	echo "::error file=package.json,line=$LINE::package.json .packageManager is replaced by .devEngines.packageManager. Please do not re-add it."
fi
if ! jq -e '.devEngines.packageManager.name == "pnpm" and .devEngines.packageManager.version' package.json &>/dev/null; then
	EXIT=1
	LINE=$(jq --stream 'if length == 1 then .[0][:-1] else .[0] end | if . == ["devEngines","packageManager"] then input_line_number - 1 else empty end' package.json)
	echo "::error file=package.json,line=$LINE::package.json .devEngines.packageManager should be set to a pnpm version compatible with \"$PNPM_VERSION\"."
else
	RANGE="$(jq -r '.devEngines.packageManager.version' package.json)"
	if ! pnpm semver --range "$RANGE" "$PNPM_VERSION" &>/dev/null; then
		EXIT=1
		LINE=$(jq --stream 'if length == 1 then .[0][:-1] else .[0] end | if . == ["devEngines","packageManager"] then input_line_number - 1 else empty end' package.json)
		echo "::error file=package.json,line=$LINE::Pnpm version $PNPM_VERSION in .github/versions.sh does not satisfy requirement $RANGE from package.json"
	fi
fi

# - Check for incorrect next-version tokens.
debug "Checking for incorrect next-version tokens."
RE='[^$]\$next[-_]version\$\|\$next[-_]version\$[^$]\|\$\$next_version\$\$'
while IFS= read -r FILE; do
	EXIT=1
	while IFS=: read -r LINE COL X; do
		X=${X/#[^$]/}
		X=${X/%[^$]/}
		echo "::error file=$FILE,line=$LINE,col=$COL::You probably mean \`\$\$next-version\$\$\` here rather than \`$X\`."
	done < <( git grep -h --line-number --column -o "$RE" "$FILE" )
done < <( git -c core.quotepath=off grep -l "$RE" )

# - Check for `random(` in scss files.
debug "Checking for SCSS random."
while IFS= read -r FILE; do
	EXIT=1
	while IFS=: read -r LINE COL X; do
		X=${X%(}
		echo "::error file=$FILE,line=$LINE,col=$COL::Do not use SCSS \`$X()\`. It means that every build will have different CSS, dirtying the diffs (and making for redudant Simple deploys if this gets into a relevant plugin)."
	done < <( git grep -h --line-number --column -o '\(random\|unique-id\)\s*(' "$FILE" )
done < <( git -c core.quotepath=off grep -l '\(random\|unique-id\)\s*(' '*.sass' '*.scss' )

# - package.json name fields must be prefixed or already registered.
debug "Checking for bad package.json names"
mapfile -t pkg_json_files < <(git -c core.quotepath=off ls-files package.json '*/package.json')
while IFS=$'\t' read -r FILE NAME; do
	# Ignore this one
	[[ "$FILE" == "tools/cli/skeletons/common/package.json" ]] && continue

	LINE=$(grep --line-number --max-count=1 '^	"name":' "$FILE" || true)
	if [[ -n "$LINE" ]]; then
		LINE=",line=${LINE%%:*}"
	fi

	J=$( curl -sS "https://registry.npmjs.com/$( jq -rn --arg V "$NAME" '$V | @uri' )" )
	if ! jq -e '.maintainers' <<<"$J" &>/dev/null; then
		EXIT=1
		echo "::error file=$FILE$LINE::Name $NAME is not published and not scoped. If it is not supposed to be published to npmjs, then if possible omit the \"name\" field entirely or otherwise rename it like \"@automattic/$NAME\" or manually publish a dummy version. If it will be published, rename it like \"@automattic/$NAME\" or manually publish a dummy version."
	elif ! jq -e '.maintainers[] | select( .name == "matticbot" or .name == "npm" )' <<<"$J" &>/dev/null; then
		EXIT=1
		echo "::error file=$FILE$LINE::Name $NAME is not owned by us (\`matticbot\`) or the NPM security account (\`npm\`). If this is not supposed to be published to npmjs, then if possible omit the \"name\" field entirely or otherwise rename it like \"@automattic/$NAME\". If it will be published, either add \`matticbot\` as a maintainer if we can or you'll have to rename (e.g. like \"@automattic/$NAME\")."
	fi
done < <( jq -r '.name // empty | select( startswith( "@automattic/" ) | not ) | [ input_filename, . ] | @tsv' "${pkg_json_files[@]}" )

# - Check for old GPL text.
debug "Checking for references to the FSF's old addresses"
while IFS= read -r X; do
	EXIT=1
	ADDR=${X##*:}
	X=${X%:*}
	COL=${X##*:}
	X=${X%:*}
	LINE=${X##*:}
	FILE=${X%:*}
	if [[ "$ADDR" = 675*Massachusetts ]]; then
		MOVED='675 Massachusetts Ave in 1995'
	elif [[ "$ADDR" = 59*Temple ]]; then
		MOVED='59 Temple Place in 2005'
	else
		MOVED='51 Franklin Street in 2024'
	fi
	echo "---" # Bracket message containing newlines for better visibility in GH's logs.
	echo "::error file=$FILE,line=$LINE,col=$COL::The Free Software Foundation moved out of $MOVED. The recommended text for the GPL license notice is now%0A    You should have received a copy of the GNU General Public License%0A    along with this program; if not, see <https://www.gnu.org/licenses/>."
	echo "---"
done < <( git grep --line-number --column -o '675\s\+Massachusetts\|59\s\+Temple\|51\s\+Franklin' ':!.github/files/lint-project-structure.sh' ':!*/changelog/*' )

# - Unexpected packages in monorepo root.
debug "Checking for unexpected JS packages in monorepo root"
TMP=$( shopt -u dotglob; printf "%s\n" node_modules/* node_modules/@*/* | sed 's!^node_modules/!!' | grep -v '^@[^/]*$' | grep -E --line-regexp -v 'eslint|husky|jetpack-cli|jetpack-js-tools|stylelint|@\*/\*' || true )
if [[ -n "$TMP" ]]; then
	EXIT=1
	echo "::error::Unexpected packages are installed in the monorepo root node_modules. This is likely to lead to phantom dependencies! Whatever you did that resulted in this is probably wrong. Ask for help in Slack #jetpack-monorepo.%0A%0APackages found are: ${TMP//$'\n'/ }"
fi
if [[ -d node_modules/.pnpm/node_modules ]]; then
	EXIT=1
	echo '::error::Packages are unexpectedly hoisted into node_modules/.pnpm/node_modules. This is likely to lead to phantom dependencies! Whatever you did that resulted in this is probably wrong. Ask for help in Slack #jetpack-monorepo.'
fi

# - Obsolete pnpm trustPolicyExclude.
debug "Checking for obsolete pnpm trustPolicyExclude"
"$BASE/tools/js-tools/check-obsolete-pnpm-trust-policy-exclude.mjs" || EXIT=1

# - pnpm lockfile bug: https://github.com/pnpm/pnpm/issues/12228
debug "Checking for pnpm lockfile bug https://github.com/pnpm/pnpm/issues/12228"
if grep -q '@pnpm/exe' "$BASE/pnpm-lock.yaml"; then
	EXIT=1
	echo '::error file=pnpm-lock.yaml::Please regenerate the pnpm lockfile (e.g. `git checkout $( git merge-base HEAD trunk ) pnpm-lock.yaml && pnpm dedupe`) to avoid [a bug in pnpm](https://href.li/?https://github.com/pnpm/pnpm/issues/12228).'
fi

debug "Finished"

exit $EXIT
