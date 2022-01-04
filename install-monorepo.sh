#!/usr/bin/env bash

set -eo pipefail
#set -x

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
OS="$(uname)"
if [[ "$OS" == "Linux" ]]; then
	ON_LINUX=1
elif [[ "$OS" != "Darwin" ]]; then
	abort "Installer script is only supported on macOS and Linux."
fi

# Check of Homebrew and nvm are installed
echo "Checking if Homebrew is installed..."
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	if [[ ON_LINUX ]]; then
		echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> /home/ubuntu/.profile
		eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
	fi
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

# Install our requirements
echo "Installing Bash"
brew install bash

echo "Installing jq"
brew install jq 

echo "Installing pnpm"
npm install -g pnpm

echo "Installing Node.js"
nvm install && nvm use

echo "Installing PHP"
source .github/versions.sh && brew install php@$PHP_VERSION

echo "Installing Composer"
brew install composer

# Setup the Jetpack CLI
echo "Setting up the Jetpack CLI"
pnpm install && pnpm cli-setup