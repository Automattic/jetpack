#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
source "$BASE/tools/includes/chalk-lite.sh"

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
	if ! command -v apt &>/dev/null; then
		die "Installer script requires 'apt' to ensure essentials are installed."
	fi
	sudo apt update
	sudo apt install build-essential
elif [[ "$OS" != "Darwin" ]]; then
	die "Installer script is only supported on macOS and Linux."
fi

# Check for curl and git
if ! command -v git &>/dev/null; then
	die "Installer script requires 'git' to be installed."
fi

if ! command -v curl &>/dev/null; then
	die "Installer script requires 'curl' to be installed"
fi

# Check of Homebrew and nvm are installed
info "Checking if Homebrew is installed..."
if ! command -v brew &>/dev/null; then
	info "Installing Homebrew"
	/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	if [[ -n "$ON_LINUX" ]]; then # Add homebrew to PATH
		echo 'eval "$("/home/linuxbrew/.linuxbrew/bin/brew" shellenv)"' >> "$HOME/.profile"
		eval "$("/home/linuxbrew/.linuxbrew/bin/brew" shellenv)"
		PATH="/home/linuxbrew/.linuxbrew/bin:$PATH"
	fi
else
	info "Updating brew"
	brew update
	# Brew can be finicky on MacOS
	if [[ $? -ne 0 ]]; then
		 echo "Reinstalling Homebrew"
		 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	fi
fi

info "Checking if NVM is installed..."
if ! command -v nvm &>/dev/null; then
	info "Installing nvm"
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && export NVM_DIR=$HOME/.nvm && source $NVM_DIR/nvm.sh  --no-use
else
	info "Updating nvm"
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
fi

# Install and use the correct version of Node.js
info "Installing Node.js"
nvm install && nvm use

# Install our requirements
info "Checking Bash version..."
if [[ -z "${BASH_VERSINFO}" || -z "${BASH_VERSINFO[0]}" || ${BASH_VERSINFO[0]} -lt 4 ]]; then
	brew install bash
fi

info "Checking if jq is installed..."
if ! command -v jq &>/dev/null; then
	info "Installing jq"
	brew install jq
fi

info "Checking if pnpm is installed..."
if ! command -v pnpm &>/dev/null; then
	info "Installing pnpm"
	# Don't use https://get.pnpm.io/install.sh, that doesn't play nice with different shells.
	# And corepack will likely lose pnpm every time nvm installs a new node version.
	curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm
fi
if [[ -z "$( pnpm bin --global )" ]]; then
	info "Setting up pnpm"
	if ! pnpm setup; then
		warn 'pnpm has no bin dir set, and `pnpm setup` failed. Linking the Jetpack CLI may fail.'
	else
		# Try to read PNPM_HOME from the login shell after `pnpm setup`, as pnpm probably changed it.
		P=$( "$SHELL" -i -c 'echo $PNPM_HOME' ) || true
		if [[ -n "$P" ]]; then
			export PNPM_HOME="$P"
			if [[ ":$PATH:" != *":$PNPM_HOME:"* ]]; then
				export PATH="$PNPM_HOME:$PATH"
			fi
		fi
	fi
fi

source .github/versions.sh
info "Installing and linking PHP $PHP_VERSION"
brew install php@$PHP_VERSION
brew link php@$PHP_VERSION

info "Checking composer..."
if ! command -v composer &>/dev/null; then
	info "Installing Composer"
	EXPECTED_CHECKSUM="$(php -r 'copy("https://composer.github.io/installer.sig", "php://stdout");')"
	php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
	ACTUAL_CHECKSUM="$(php -r "echo hash_file('sha384', 'composer-setup.php');")"

	if [[ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]]; then
		rm composer-setup.php
		die 'ERROR: Invalid composer installer checksum'
	fi

	php composer-setup.php --version=$COMPOSER_VERSION --quiet
	RESULT=$?
	rm composer-setup.php
	sudo mkdir -p /usr/local/bin
	sudo mv composer.phar /usr/local/bin/composer
fi

# Setup the Jetpack CLI
info "Setting up the Jetpack CLI"
pnpm install
pnpm jetpack cli link
if ! command -v jetpack &>/dev/null; then
	warn 'Failed to link Jetpack CLI. The `jetpack` command will be unavailable.'
	warn 'Likely this is because `pnpm setup` has not been run successfully. You may use `pnpm jetpack` from within the monorepo checkout instead.'
fi
pnpm jetpack install --root

success "Installation complete. You may need to restart your terminal for changes to take effect. Then you can run tools/check-development-environment.sh to make sure everything installed correctly."

# Reset the terminal so it picks up the changes.
if [[ "$SHELL" == "/bin/zsh" ]]; then
	info "Refreshing terminal"
	exec zsh
elif [[ "$SHELL" == "/bin/bash" ]]; then
	info "Refreshing terminal"
	exec bash
else
	info "Note: You may have to restart your terminal for monorepo tools to work properly."
fi
