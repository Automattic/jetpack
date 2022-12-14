#!/usr/bin/env bash

cd "$( dirname "${BASH_SOURCE[0]}" )/.."
. tools/includes/chalk-lite.sh
. tools/includes/version-compare.sh
. .github/versions.sh

EXIT=0

# Print a documentation reference.
#
# @param $1 Anchor.
function doclink {
	blue "  See https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#$1"
}

# Print the bullet to start a check.
#
# Note a newline is not included. Follow this
# with `success`, `failure`, `warning`, or the like.
#
# @param $1 Text.
function checking {
	printf "* %-40s ... " "$1"
}

# Print a failure.
#
# Sets EXIT=1 too.
#
# @param $1 Short failure message.
# @param $2 Doc link anchor. Pass an empty string to print no link.
# @param $3... Optional extra lines of text to print before the anchor.
function failure {
	EXIT=1
	red "${BOLD}$1"
	shift
	local LINK="$1"
	shift
	if [[ $# -gt 0 ]]; then
		printf "  %s\n" "" "$@" ""
	fi
	if [[ -n "$LINK" ]]; then
		doclink "$LINK"
	fi
}

# Print a warning.
#
# Sets LINK, but ignore that.
#
# @param $1 Short failure message.
# @param $2 Doc link anchor. Pass an empty string to print no link.
# @param $3... Optional extra lines of text to print before the anchor.
function warning {
	yellow "${BOLD}$1"
	shift
	local LINK="$1"
	shift
	if [[ $# -gt 0 ]]; then
		printf "  %s\n" "$@"
	fi
	if [[ -n "$LINK" ]]; then
		doclink "$LINK"
	fi
}

# Compare a version with a range.
#
# This prints a result text.
#
# @param $1 Program name.
# @param $2 Binary.
# @param $3 Link anchor.
# @param $4 Version to compare.
# @param $5 Minimum allowed version.
# @param $6 Recommended version.
# @param $7 Maximum allowed version. Use "X.Y.9999999" for a last component to allow any "X.Y" but not "X.Y+1"
# @param $8 Set 'true' if exceeding the maximum version is an error.
function version_range {
	local NAME="$1"
	local BIN="$2"
	local ANCHOR="$3"
	local VER="$4"
	local MINVER="$5"
	local RECVER="$6"
	local MAXVER="$7"
	local MAXFATAL="${8:-false}"

	if [[ -z "$VER" ]]; then
		failure 'unknown' "$ANCHOR" "$NAME version from $BIN could not be determined. Output was:" "" "  $($BIN --version 2>&1)"
	elif version_compare "$VER" "$MAXVER"; then
		if ! $MAXFATAL; then
			if version_compare "$MINVER" "${MAXVER%.9999999}"; then
				warning "ok (version $VER)" "$ANCHOR" "$NAME at $BIN is version $VER. We've only tested with $NAME ${MAXVER%.9999999}."
			else
				warning "ok (version $VER)" "$ANCHOR" "$NAME at $BIN is version $VER. We've only tested with $NAME up to ${MAXVER%.9999999}."
			fi
		elif [[ "${MAXVER%.9999999}" == "$MAXVER" ]]; then
			failure "too new" "$ANCHOR" "$NAME at $BIN is version $VER. Only $MINVER to $MAXVER are supported."
		elif version_compare "$MINVER" "${MAXVER%.9999999}"; then
			failure "too new" "$ANCHOR" "$NAME at $BIN is version $VER. Only ${MAXVER%.9999999}.x is supported."
		else
			failure "too new" "$ANCHOR" "$NAME at $BIN is version $VER. Only $MINVER to ${MAXVER%.9999999}.x is supported."
		fi
	elif version_compare "$VER" "$RECVER"; then
		success "ok (version $VER)"
	elif version_compare "$VER" "$MINVER"; then
		warning "ok (version $VER)" "$ANCHOR" "$NAME at $BIN is version $VER. Version $RECVER or later is recommended."
	else
		if [[ "$MINVER" == "$RECVER" ]]; then
			failure "too old" "$ANCHOR" "$NAME at $BIN is version $VER. Version $MINVER or later is required."
		else
			failure "too old" "$ANCHOR" "$NAME at $BIN is version $VER. Version $MINVER or later is required; $RECVER or later is recommended."
		fi
	fi
}

if color_supported; then
	BOLD=$'\e[1m'
	CS=$'\e[3;36m'
	CE=$'\e[0m'
else
	BOLD=
	CS='`'
	CE='`'
fi

jetpackGreen "${BOLD}Jetpack development environment check"
jetpackGreen "${BOLD}====================================="
echo ""
echo "Monorepo path: $PWD"

echo ""
echo "Shell tools"
echo "==========="
echo ""

checking 'Usable version of bash'
if [[ -n "${BASH_VERSINFO}" && -n "${BASH_VERSINFO[0]}" && ${BASH_VERSINFO[0]} -ge 4 ]]; then
	success "ok (version $BASH_VERSION)"
else
	failure "too old" '' "Bash at $BASH is $BASH_VERSION. Version 4 or later is required." "If you're on Mac OS, you can install an updated version of bash with ${CS}brew install bash${CE}"
fi

checking "Standard tools are available"
MISSING=()
for tool in cat chmod cp diff find fold mkdir mv rm sed tail; do
	if [[ -z "$(command -v $tool)" ]]; then
		MISSING+=( "$tool" )
	fi
done
if [[ ${#MISSING[@]} -gt 0 ]]; then
	failure 'no' '' "The following standard tools are missing: ${MISSING[*]}"
else
	success 'yes'
fi

checking "If sed accepts -E"
if [[ "$(sed -n -E 's/x([abc])y/X\1Y/gp' <<<"xay xby xcy" 2>/dev/null)" == "XaY XbY XcY" ]]; then
	success 'yes'
else
	failure 'no'
	echo ""
	die "Exiting early as later checks depend on ${CS}sed -E${CE}."
fi

checking 'Usable version of jq'
BIN="$(command -v jq)"
JQOK=false
if [[ -z "$BIN" ]]; then
	failure "no jq found" ''
else
	VER="$(jq --version 2>/dev/null | sed -n -E 's/^jq-([0-9]+\.[0-9]+([.-][0-9a-zA-Z.-]+)?)$/\1/p')"
	if [[ -z "$VER" ]]; then
		failure 'unknown' '' "jq version from $BIN could not be determined. Output was:" "" "  $(jq --version 2>&1)"
	elif version_compare "$VER" "1.6"; then
		success "ok (version $VER)"
		JQOK=true
	else
		failure "too old" '' "jq at $BIN is version $VER. Version 1.6 or later is required."
	fi
fi

if ! $JQOK; then
	echo ""
	die "Exiting early as later checks depend on jq."
fi

echo ""
echo "PHP tools"
echo "========="
echo ""

checking 'Usable version of PHP'
BIN="$(command -v php)"
if [[ -z "$BIN" ]]; then
	failure "no php found" 'php'
else
	VER="$(php -r 'echo PHP_VERSION;')"
	if php -r "exit( version_compare( PHP_VERSION, '$MAX_PHP_VERSION.9999999', '>=' ) ? 0 : 1 );"; then
		warning "ok (version $VER)" 'php' "PHP at $BIN is version $VER. We've only tested with PHP up to $MAX_PHP_VERSION."
	elif php -r "exit( version_compare( PHP_VERSION, '$PHP_VERSION', '>=' ) ? 0 : 1 );"; then
		success "ok (version $VER)"
	elif php -r "exit( version_compare( PHP_VERSION, '$MIN_PHP_VERSION', '>=' ) ? 0 : 1 );"; then
		warning "ok (version $VER)" 'php' "Version $PHP_VERSION or later is recommended."
	else
		failure 'too old' 'php' "PHP at $BIN is version $VER. Version $MIN_PHP_VERSION or later is required; $PHP_VERSION or later is recommended."
	fi
fi

checking 'Usable version of Composer'
BIN="$(command -v composer)"
if [[ -z "$BIN" ]]; then
	failure "no composer found" 'composer'
else
	VER="$(composer --version 2>/dev/null | sed -n -E 's/^Composer( version)? ([0-9]+\.[0-9]+\.[0-9a-zA-Z.-]+) [0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}.*/\2/p')"
	VX="$(sed -E 's/^([0-9]+\.[0-9]+)\..*/\1/' <<<"$COMPOSER_VERSION")"
	version_range 'Composer' "$BIN" 'composer' "$VER" "$COMPOSER_VERSION" "$COMPOSER_VERSION" "$VX.9999999" true
fi

checking 'Required extensions are installed'
MISSING_EXTENSIONS=()
BIN="$(command -v php)"
if [[ -z "$BIN" ]]; then
	failure "no php found, skipping check" 'php'
else
	for extension in mbstring xml libxml; do
		if php -r "exit( in_array( '$extension', get_loaded_extensions() ) ? 1 : 0 );"; then
			MISSING_EXTENSIONS+=( "$extension" )
		fi
	done
	if [[ ${#MISSING_EXTENSIONS[@]} -gt 0 ]]; then
		failure 'no' '' "The following extensions are not installed: ${MISSING_EXTENSIONS[*]}"
	else
		success 'yes'
	fi
fi

echo ""
echo "JavaScript tools"
echo "================"
echo ""

checking 'Usable version of Node.js'
BIN="$(command -v node)"
if [[ -z "$BIN" ]]; then
	failure "no node found" 'nodejs'
else
	VER="$(node --version 2>/dev/null | sed -n -E 's/^v([0-9]+\.[0-9]+\.[0-9a-zA-Z.-]+)$/\1/p')"
	# We have multiple allowed major versions of node. Pick the right one for the version of node installed.
	VM="$(jq -r --arg ver "${VER%%.*}" '.engines.node | split( " || " )[] | sub( "^\\^"; "" ) | select( sub( "\\..*"; "" ) == $ver )' package.json)"
	if [[ -z "$VM" ]]; then
		VM="$(jq -r --arg ver "${NODE_VERSION%%.*}" '.engines.node | split( " || " )[] | sub( "^\\^"; "" ) | select( sub( "\\..*"; "" ) == $ver )' package.json)"
	fi
	VX="$(sed -E 's/^([0-9]+)\..*/\1/' <<<"$NODE_VERSION")"
	version_range 'Node' "$BIN" 'nodejs' "$VER" "$VM" "$NODE_VERSION" "$VX.9999999"
fi

checking 'Usable version of pnpm'
BIN="$(command -v pnpm)"
if [[ -z "$BIN" ]]; then
	failure "no pnpm found" 'pnpm'
else
	VER="$(pnpm --version 2>/dev/null | sed -n -E 's/^([0-9]+\.[0-9]+\.[0-9a-zA-Z.-]+)$/\1/p')"
	VM="$(jq -r '.engines.pnpm | sub( "^\\^"; "" )' package.json)"
	VX="$(sed -E 's/^([0-9]+)\..*/\1/' <<<"$PNPM_VERSION")"
	version_range 'Pnpm' "$BIN" 'pnpm' "$VER" "$VM" "$PNPM_VERSION" "$VX.9999999"
fi

checking '[optional] nvm is available'
# NVM is weird.
BIN="$([[ -f ~/.nvm/nvm.sh ]] && source ~/.nvm/nvm.sh && command -v nvm)"
if [[ -z "$BIN" ]]; then
	warning "no" 'nodejs'
else
	success "yes" # Probably.
fi

echo ""
echo "Tools for contributing"
echo "======================"
echo ""

checking 'Usable version of git'
BIN="$(command -v git)"
if [[ -z "$BIN" ]]; then
	failure "no git found" ''
else
	VER="$(git --version 2>/dev/null | sed -n -E 's/^git version ([0-9]+\.[0-9]+\.[0-9a-zA-Z.-]+)$/\1/p')"
	# Git 2.28 added `git init -b`, which we recommend in some places.
	GITVER=2.28.0
	version_range 'Git' "$BIN" '' "$VER" "0" "$GITVER" "9999999"

	checking 'If this is a git checkout'
	GIT_DIR="$(git rev-parse --git-dir 2>/dev/null)"
	OK=false
	if [[ -d .git && "$GIT_DIR" == '.git' ]]; then
		success 'yes'
		OK=true
	elif [[ -f .git && -d "$GIT_DIR" ]]; then
		success 'yes (as a submodule)'
		OK=true
	elif [[ -d "$GIT_DIR" ]]; then
		failure 'unknown' 'clone-the-repository' "It seems to be in a git repo, but it's not clearly a Jetpack monorepo checkout."
	else
		failure "no" 'clone-the-repository'
	fi
	if $OK; then
		checking 'If the repo is checked out using ssh'
		URL="$(git remote get-url --push origin 2>/dev/null)"
		if [[ -z "$URL" ]]; then
			failure 'unknown' 'clone-the-repository' 'No origin was found'
		elif [[ "$URL" == 'git@github.com:'* ]]; then
			success 'yes'
		else
			failure 'no' 'clone-the-repository' "Origin is \"$URL\", expected something beginning with \"git@github.com:\"."
		fi
	fi
fi

echo ""
echo "Installation"
echo "============"
echo ""

checking 'Command jetpack is available'
BIN="$(command -v jetpack)"
if [[ -z "$BIN" ]]; then
	warning "no" 'jetpack-cli' "If you don't make the Jetpack CLI available, you'll need to run ${CS}pnpm jetpack${CE} where docs and such say ${CS}jetpack${CE}."
else
	success "yes"
fi

checking 'If JS modules are installed'
if [[ ! -d node_modules ]]; then
	failure 'no' '' "Run ${CS}pnpm install${CE}."
else
	success 'yes'
fi

checking 'If PHP modules are installed'
if [[ ! -d vendor ]]; then
	failure 'no' '' "Run ${CS}jetpack install --root${CE}."
else
	success 'yes'
fi

echo ""
echo "Docker"
echo "======"
echo ""

checking '[optional] Docker is available'
BIN="$(command -v docker)"
if [[ -z "$BIN" ]]; then
	warning "no" 'docker-supported-recommended'
else
	success "yes"

	checking '[optional] Docker-compose is available'
	BIN="$(command -v docker-compose)"
	if [[ -z "$BIN" ]]; then
		warning "no" 'docker-supported-recommended'
	else
		VER="$(docker-compose --version 2>/dev/null | sed -n -E 's/^docker-compose version ([0-9]+\.[0-9]+\.[0-9a-zA-Z.-]+), .*/\1/p')"
		if [[ -z "$VER" ]]; then
			warning "yes (version unknown)"
		elif version_compare "$VER" "1.28"; then
			success "yes (version $VER)"
		else
			warning "yes (version $VER)" '' "Docker-compose at $BIN is version $VER. Version 1.28 or later is recommended."
		fi
	fi

	checking '[optional] Docker is running'
	if docker info &>/dev/null; then
		success 'yes'
	else
		warning 'no'
	fi
fi

echo ""

exit $EXIT
