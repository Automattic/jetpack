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
	sudo apt install build-essential
elif [[ "$OS" != "Darwin" ]]; then
	abort "Installer script is only supported on macOS and Linux."
fi

# Check of Homebrew and nvm are installed
echo "Checking if Homebrew is installed..."
if ! type brew &> /dev/null; then
    echo "Installing Homebrew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	if [[ ON_LINUX ]]; then # Add homebrew to PATH
		eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
		hash -r 
	fi
else
	echo "Updating brew"
    brew update
fi

echo "Checking if NVM is installed..."
if ! command -v nvm &> /dev/null ; then
    echo "Installing nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
	source ~/.nvm/nvm.sh
	export NVM_DIR="$HOME/.nvm"
	[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
	[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
	
else
	echo "Updating nvm"
    nvm update
fi

# Install our requirements
echo "Installing Bash"
brew install bash

echo "Installing jq"
brew install jq

echo "Installing Node.js"
nvm install && nvm use

echo "Installing pnpm"
curl -f https://get.pnpm.io/v6.16.js | node - add --global pnp

echo "Installing PHP"
source .github/versions.sh && brew install php@$PHP_VERSION

echo "Installing Composer"
if ! composer -v &> /dev/null; then
	EXPECTED_CHECKSUM="$(php -r 'copy("https://composer.github.io/installer.sig", "php://stdout");')"
	php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
	ACTUAL_CHECKSUM="$(php -r "echo hash_file('sha384', 'composer-setup.php');")"

	if [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]
	then
		>&2 echo 'ERROR: Invalid installer checksum'
		rm composer-setup.php
		exit 1
	fi

	php composer-setup.php --quiet
	RESULT=$?
	rm composer-setup.php
	echo "$RESULT"
	mv composer.phar /usr/local/bin/composer
fi 
# Setup the Jetpack CLI
echo "Setting up the Jetpack CLI"
pnpm install && pnpm cli-setup