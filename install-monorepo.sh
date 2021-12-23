#!/usr/bin/env bash

set -eo pipefail

cd $(dirname "${BASH_SOURCE[0]}")/..
BASE=$PWD
. "$BASE/jetpack/tools/includes/check-osx-bash-version.sh"
. "$BASE/jetpack/tools/includes/chalk-lite.sh"
. "$BASE/jetpack/tools/includes/plugin-functions.sh"

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 

		Installs all the required tooling for the Jetpack Monorepo. 
	EOH
	exit 1
}

if [[ $1 ]]; then
	usage
fi