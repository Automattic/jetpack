#!/usr/bin/env bash

set -eo pipefail
#set -x


cd $(dirname "${BASH_SOURCE[0]}")/..
BASE=$PWD
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

# Check if we're on a Mac or Linux, bail if we're not.
# First check OS.
OS="$(uname)"
if [[ "$OS" == "Linux" ]]; then
	HOMEBREW_ON_LINUX=1
elif [[ "$OS" != "Darwin" ]]; then
	abort "Homebrew is only supported on macOS and Linux."
fi

# Check of Homebrew and nvm are installed
echo "Checking if Homebrew is installed..."
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
	echo "Updating brew"
    brew update
fi

echo "Checking if NVM is installed..."
if ! command -v nvm &> /dev/null ; then
    echo "Installing nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
else
	echo "Updating nvm"
    nvm update
fi

#install Bash
brew install bash

# Instsall JQ
brew install jq 

# Install node inside the Jetpack monorepo to pickup the .nvmrc 