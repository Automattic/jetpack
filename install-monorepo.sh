#!/usr/bin/env bash

set -o pipefail

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

# Check if we're on a Mac or Linux, bail if we're not.
OS="$(uname)"
if [[ "$OS" == "Linux" ]]; then
	ON_LINUX=1
	sudo apt install build-essential
elif [[ "$OS" != "Darwin" ]]; then
	abort "Installer script is only supported on macOS and Linux."
fi

# Check of Homebrew and nvm are installed
echo "Checking if Homebrew is installed..."
if [[ -z "$(command -v brew)" ]]; then
    echo "Installing Homebrew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	if [[ ON_LINUX ]]; then # Add homebrew to PATH
		echo 'eval "$(/home/ubuntu/.linuxbrew/bin/brew shellenv)"' >> /home/ubuntu/.profile
		eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
		PATH=/home/linuxbrew/.linuxbrew/bin:$PATH
		hash -r 
	fi
else
	echo "Updating brew"
    brew update
	# Brew can be finicky on MacOS
	if [ $? -ne 0 ]; then
		 echo "Reinstalling Homebrew"
   	 	/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	fi
else
    echo FAIL
fi
fi

echo "Checking if NVM is installed..."
if [[ -z "$(command -v nvm)" ]]; then
    echo "Installing nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && export NVM_DIR=$HOME/.nvm && source $NVM_DIR/nvm.sh
else
	echo "Updating nvm"
    nvm update
fi

# Install and use the correct version of Node.js
echo "Installing Node.js"
nvm install && nvm use

# Install our requirements
echo "Installing Bash"
brew install bash

echo "Checking if jq is installed..."
if [[ -z "$(command -v jq)" ]]; then
	echo "Installing jq"
	brew install jq
fi

echo "Checking if pnmp is installed..."
if [[ -z "$(command -v pnpm)" ]]; then
	echo "Installing pnpm"
	curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm
fi 

echo "Installing and linking PHP 8.0"
source .github/versions.sh && brew install php@$PHP_VERSION
brew link php@8.0

echo "Checking composer..."
if [[ -z "$(command -v composer)" ]]; then
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

	php composer-setup.php --version=2.1.8 --quiet
	RESULT=$?
	rm composer-setup.php
	sudo mv composer.phar /usr/local/bin/composer
fi 

# Setup the Jetpack CLI
echo "Setting up the Jetpack CLI"
pnpm install && pnpm cli-setup
pnpm jetpack cli link # I don't know why we have to do this twice, but it works.
jetpack install --root

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

echo "Installation complete. You may run tools/check-development-environment.sh to make sure everything installed correctly."