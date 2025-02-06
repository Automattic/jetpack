#!/usr/bin/env bash

# Quick script to output commits from the most recent full week (Monday to Sunday) that are probably "maintenance" commits.

cd $(dirname "${BASH_SOURCE[0]}")/..
source tools/includes/chalk-lite.sh
source tools/includes/check-osx-bash-version.sh

# Email addresses of people who often author maintenance PRs.
# Note Matticbot is handled separately.
AUTHORS=(
	anomiex@users.noreply.github.com
	jeremy@jeremy.hu
)

# Paths outside of projects/ to ignore.
PATHS=(
	':!.phan/stubs/*'
	:!pnpm-lock.yaml
	:!tools/phpcs-excludelist.json
	:!tools/eslint-excludelist.json
	':!tools/stubs/*-defs.php'
	':!*/composer.lock'
	':!*/changelog/*'
	':!*/CHANGELOG.md'
)

# Projects to NOT ignore.
MAYBE_MAINTENANCE_PROJECTS=(
	github-actions/pr-is-up-to-date
	github-actions/push-to-mirrors
	github-actions/repo-gardening
	github-actions/required-review
	github-actions/test-results-to-slack
	js-packages/babel-plugin-replace-textdomain
	js-packages/eslint-changed
	js-packages/eslint-config-target-es
	js-packages/i18n-check-webpack-plugin
	js-packages/i18n-loader-webpack-plugin
	js-packages/remove-asset-webpack-plugin
	js-packages/storybook
	js-packages/webpack-config
	packages/assets
	packages/autoloader
	packages/changelogger
	packages/codesniffer
	packages/composer-plugin
	packages/ignorefile
	packages/phpcs-filter
	packages/plugins-installer
	plugins/beta
	plugins/debug-helper
	plugins/starter-plugin
)

# This needs to be run on trunk, so fetch it.
info 'Fetching latest trunk...'
git checkout trunk && git pull || die "Failed to check out trunk"

# Add exclusions to PATHS for every project dir not in MAYBE_MAINTENANCE_PROJECTS.
for D in projects/*/*/; do
	EXCLUDE=true
	for P in "${MAYBE_MAINTENANCE_PROJECTS[@]}"; do
		if [[ "$D" == "projects/$P/" ]]; then
			EXCLUDE=false
			break
		fi
	done
	if $EXCLUDE; then
		PATHS+=( ":!$D" )
	fi
done

# Function to reformat a commit title as markdown.
function fmt {
	sed -E -e 's!^(.*) \(#([0-9]+)\)$![\1](https://github.com/Automattic/jetpack/pull/\2)!' -e 's!^!* !'
}

# Function to only print lines that haven't been seen already, by accumulating seen lines in SEEN.
#
# Note that, due to the way pipes and subshells work, we have to run this at
# the top level for the filtering to work right, with the bits generating the
# lines in the subshell.
declare -A SEEN
function seen {
	while IFS= read -r LINE; do
		if [[ -n "$LINE" ]]; then
			[[ -n "${SEEN["$LINE"]}" ]] && continue
			SEEN["$LINE"]=1
		fi
		echo "$LINE"
	done
}

# Figure out which dates to check.
if [[ $1 =~ ^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$ ]]; then
	DS=$1
	if [[ $2 =~ ^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$ ]]; then
		DE=$2
	else
		DE=$(date +%F)
	fi
else
	read -r DS DE < <(php -r '
		$t = new DateTimeImmutable( "00:00:00 UTC" );
		$d = $t->format( "N" ) - 1;
		printf(
			"%s %s\n",
			$t->modify( - ( $d + 7 ) . " days" )->format( "Y-m-d" ),
			$t->modify( -$d . " days" )->format( "Y-m-d" )
		);
	')
fi
echo ''
info "Listing commits from $DS to <$DE"

# Collect stubs and renovate entries for special reporting, and record the lines that would otherwise be printed as "seen" so they don't get printed in other sections.
STUBS=()
RENOVATE=()
while IFS= read -r LINE; do
	SEEN["$(fmt <<<"$LINE")"]=1
	if [[ "$LINE" == 'phan: Update '*' stubs'* ]]; then
		STUBS+=( "$(sed -E -e 's/^phan: Update (.*) stubs/\1/' <<<"$LINE" | fmt | sed -e 's!^\* !!')" )
	else
		RENOVATE+=( "$(sed -E -e 's/^Update (dependency )?//' -e 's/ to .* (\(#[0-9]+\))$/ \1/' <<<"$LINE" | fmt | sed -e 's!^\* !!')" )
	fi
done < <( git log --format='%s' --since "$DS 00:00:00 UTC" --until "$DE 00:00:00 UTC" --author='sysops+ghmatticbot@automattic.com' )

echo ""
info "Commits to paths that are often maintenance"
seen < <( git log --format='%s' --since "$DS 00:00:00 UTC" --until "$DE 00:00:00 UTC" -- "${PATHS[@]}" | fmt )

echo ""
debug "<-- Authors of the above:"
git log --format='%aE' --since "$DS 00:00:00 UTC" --until "$DE 00:00:00 UTC" -- "${PATHS[@]}" | sort -u | sed -e 's/^/  /' | debug
debug " -->"

for AUTHOR in "${AUTHORS[@]}"; do
	echo ""
	info "Other commits by $AUTHOR, who often makes maintenance commits"
	seen < <( git log --format='%s' --since "$DS 00:00:00 UTC" --until "$DE 00:00:00 UTC" --author="$AUTHOR" | fmt )
done

# Print the stubs and renovate lines at the end, if applicable.
if [[ ${#STUBS} -gt 0 || ${#RENOVATE} -gt 0 ]]; then
	echo ""
	info "Automated:"
fi
if [[ ${#STUBS} -gt 0 ]]; then
	P='* Stubs: '
	for R in "${STUBS[@]}"; do
		printf '%s' "$P$R"
		P=', '
	done
	echo ""
fi
if [[ ${#RENOVATE} -gt 0 ]]; then
	P='* Renovate: '
	for R in "${RENOVATE[@]}"; do
		printf '%s' "$P$R"
		P=', '
	done
	echo ""
fi
