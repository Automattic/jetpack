#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)

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

# Exit function
function abort {
	echo "$*" >&2
	exit 1
}

# Check if we're on a Mac or Linux, bail if we're not.
OS="$(uname)"
if [[ "$OS" == "Linux" ]]; then
	ON_LINUX=1
	if ! command -v apt &>/dev/null; then
		abort "Installer script requires 'apt' to ensure essentials are installed."
	fi
	sudo apt update
	sudo apt install build-essential
elif [[ "$OS" != "Darwin" ]]; then
	abort "Installer script is only supported on macOS and Linux."
fi

# Check for curl and git
if ! command -v git &>/dev/null; then
	abort "Installer script requires 'git' to be installed."
fi

if ! command -v curl &>/dev/null; then
	abort "Installer script requires 'curl' to be installed"
fi

# Check of Homebrew and nvm are installed
echo "Checking if Homebrew is installed..."
if ! command -v brew &>/dev/null; then
	echo "Installing Homebrew"
	/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	if [[ -n "$ON_LINUX" ]]; then # Add homebrew to PATH
		echo 'eval "$("/home/linuxbrew/.linuxbrew/bin/brew" shellenv)"' >> "$HOME/.profile"
		eval "$("/home/linuxbrew/.linuxbrew/bin/brew" shellenv)"
		PATH="/home/linuxbrew/.linuxbrew/bin:$PATH"
	fi
else
	echo "Updating brew"
	brew update
	# Brew can be finicky on MacOS
	if [[ $? -ne 0 ]]; then
		 echo "Reinstalling Homebrew"
   	 	/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	fi
fi

echo "Checking if NVM is installed..."
if ! command -v nvm &>/dev/null; then
	echo "Installing nvm"
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && export NVM_DIR=$HOME/.nvm && source $NVM_DIR/nvm.sh  --no-use
else
	echo "Updating nvm"
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
fi

# Install and use the correct version of Node.js
echo "Installing Node.js"
nvm install && nvm use

# Install our requirements
echo "Checking Bash version..."
if [[ -z "${BASH_VERSINFO}" || -z "${BASH_VERSINFO[0]}" || ${BASH_VERSINFO[0]} -lt 4 ]]; then
	brew install bash
fi

echo "Checking if jq is installed..."
if ! command -v jq &>/dev/null; then
	echo "Installing jq"
	brew install jq
fi

echo "Checking if pnpm is installed..."
if ! command -v pnpm &>/dev/null; then
	echo "Installing pnpm"
	curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm
fi

source .github/versions.sh
echo "Installing and linking PHP $PHP_VERSION"
brew install php@$PHP_VERSION
brew link php@$PHP_VERSION

echo "Checking composer..."
if ! command -v composer &>/dev/null; then
	echo "Installing Composer"
	EXPECTED_CHECKSUM="$(php -r 'copy("https://composer.github.io/installer.sig", "php://stdout");')"
	php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
	ACTUAL_CHECKSUM="$(php -r "echo hash_file('sha384', 'composer-setup.php');")"

	if [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]
	then
		>&2 echo 'ERROR: Invalid installer checksum'
		rm composer-setup.php
		exit 1
	fi

	php composer-setup.php --version=$COMPOSER_VERSION --quiet
	RESULT=$?
	rm composer-setup.php
	sudo mkdir -p /usr/local/bin
	sudo mv composer.phar /usr/local/bin/composer
fi

# Setup the Jetpack CLI
echo "Setting up the Jetpack CLI"
pnpm install && pnpm cli-setup
pnpm jetpack cli link # I don't know why we have to do this twice, but it works.
jetpack install --root

echo "Installation complete. You may need to restart your terminal for changes to take effect. Then you can run tools/check-development-environment.sh to make sure everything installed correctly."

# Reset the terminal so it picks up the changes.
if [[ "$SHELL" == "/bin/zsh" ]]; then
	echo "Refreshing terminal"
	exec zsh
elif [[ "$SHELL" == "/bin/bash" ]]; then
	echo "Refreshing terminal"
	exec bash
else
	echo "Note: You may have to restart your terminal for monorepo tools to work properly."
fi
