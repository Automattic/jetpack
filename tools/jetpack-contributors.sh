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
		usage: $0 [options] <directory>

		Most options accepted by \`composer require\` are accepted to pass on
		to composer while updating dependencies.
	EOH
	exit 1
}

if [[ -z $1 ]]; then
    echo 'No branch detected'
    exit
fi

git checkout jetpack/branch-$1 && git checkout master
git checkout jetpack/branch-$2 && git checkout master 
git log --format='%an' --no-merges jetpack/branch-$1..jetpack/branch-$2 |
sort |
uniq |
sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/, /g' |
pbcopy
echo 'Copied to your clipboard!' 

exit