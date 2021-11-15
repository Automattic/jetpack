#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
. "$BASE/tools/includes/check-osx-bash-version.sh"
. "$BASE/tools/includes/chalk-lite.sh"

# This script will obtain the contributor list between two Jetpack branches.
# tldr, we need to run  git fetch origin master:jetpack/branch-$1 && git fetch origin master:jetpack/branch-$2
# then run git log --all --format='%an' --no-merges jetpack/branch-10.2..jetpack/branch-10.3 | sort | uniq | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/, /g' | pbcopy

function usage {
	cat <<-EOH
		usage: $0 [project] [version 1] [version 2]

		* project   - the project you want to get the release branch for, e.g `jetpack`
        * version 1 - the first version you want to compare contributors for. e.g. `10.1`
        * version 2 - the second version you want to compare contributores for, e.g. `10.2` 
	EOH
	exit 1
}

if [[ -z $1 ]]; then
    usage
    exit 1
fi

git log --format='%an' --no-merges $1/branch-$2..$1/branch-$3 | sort | uniq | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/, /g' | sed 's/renovate\[bot\], //'

exit