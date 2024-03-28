#!/usr/bin/env bash
set -eo pipefail

# Start in the monorepo root folder.
root_dir="$(dirname "${BASH_SOURCE[0]}")/.."
cd "$root_dir"

# Source some helper functions.
source tools/includes/chalk-lite.sh

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0

		Installs all the required tooling for the Jetpack Monorepo.
	EOH
	exit 1
}

# Wrapper to check for a command silently.
#
# $1 - Command to check for
# Returns: 0 if the command exists, non-zero if not.
function has_command {
	command -v "$1" &>/dev/null
	return $?
}

# Check if we're on macOS; bail if we're not.
function do_system {
	if [[ "$(uname)" != "Darwin" ]]; then
		die "Installer script is only supported on macOS."
	fi
	echo "Valid OS: macOS (Darwin)"
}

# Checks for git and curl.
function do_basics {

	# Check for curl and git
	if ! has_command git; then
		echo "git: not found"
		die "Installer script requires git to be installed."
	fi
	echo "git: available"

	if ! has_command curl; then
		echo "curl: not found"
		die "Installer script requires curl to be installed."
	fi
	echo "curl: available"
}

# Checks for, installs, and updates Homebrew.
function do_homebrew {
	if ! has_command brew; then
		echo "brew: not found"
		echo "Installing brew..."
		/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || die "Unable to install brew!"
		HOMEBREW_PREFIX="/opt/homebrew"

		# Add brew env to current script for use later.
		eval "$(${HOMEBREW_PREFIX}/bin/brew shellenv)"

		if ! has_command brew; then
			die "Unable to install brew!"
		fi
		echo "Installed brew."

		# Determine shell RC file.
		# Adapted from Homebrew install script:
		# https://github.com/Homebrew/install/blob/master/install.sh
		case "${SHELL}" in
			*/bash*)
				shell_rcfile="${HOME}/.bash_profile"
				;;
			*/zsh*)
				shell_rcfile="${ZDOTDIR:-"${HOME}"}/.zprofile"
				;;
			*/fish*)
				shell_rcfile="${HOME}/.config/fish/config.fish"
				;;
			*)
				shell_rcfile="${ENV:-"${HOME}/.profile"}"
				;;
		esac

		# Add brew init to shell rc file.
		if ! grep -qs "eval \"\$(${HOMEBREW_PREFIX}/bin/brew shellenv)\"" "${shell_rcfile}"; then
			(echo; echo "eval \"\$(${HOMEBREW_PREFIX}/bin/brew shellenv)\"") >> "${shell_rcfile}"
		fi

	else
		# Run brew updates
		if ! brew update &> /dev/null; then
			die "Unable to update brew!"
		fi
	fi
	export HOMEBREW_NO_AUTO_UPDATE=1
	export HOMEBREW_NO_ENV_HINTS=1
	echo "brew: available"
}

# Checks for, installs, and updates nvm.
function do_nvm {
	# Get latest nvm version.
	# Based on this: https://stackoverflow.com/a/71896712
	good_nvm_version=$(basename $(curl -fs -o/dev/null -w %{redirect_url} https://github.com/nvm-sh/nvm/releases/latest))

	if [[ -f "$HOME"/.nvm/nvm.sh ]] ; then
		# Since nvm is really several shell functions, and isn't in the environment
		# initially, we need to source it.
		if [[ -f "$(brew --prefix nvm)/nvm.sh" ]]; then
			# Sometimes nvm is installed via brew, which is an unsupported install
			# route, and uses a wrapper helper script.
			source "$(brew --prefix nvm)/nvm.sh"
		else
			export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR"/nvm.sh --no-use
		fi

		if [[ v$(nvm --version) != "$good_nvm_version" ]]; then
			echo "nvm: wrong version"
			echo "Updating nvm..."

			# Download latest version
			curl -s -o- "https://raw.githubusercontent.com/nvm-sh/nvm/$good_nvm_version/install.sh" | bash - &>/dev/null &&

			# Source again to get latest shell functions
			source "$NVM_DIR/nvm.sh" --no-use

			# Something's wrong, so abort.
			if [[ "v$(nvm --version)" != "$good_nvm_version" ]]; then
				die "Unable to update nvm!"
			fi
			echo "Updated nvm."
		fi
	else
		echo "nvm: not found"
		info "Installing nvm..."
		curl -s -o- "https://raw.githubusercontent.com/nvm-sh/nvm/$good_nvm_version/install.sh" | bash - &>/dev/null &&

		# Source to get latest shell functions
		export NVM_DIR="$HOME"/.nvm && source "$NVM_DIR"/nvm.sh --no-use

		# Something's wrong, so abort.
		if ! has_command nvm; then
			die "Unable to install nvm!"
		fi
		echo "Installed nvm."
	fi

	echo "nvm: available"
}

# Checks for and installs node.
function do_node {
	good_node_version=$(cat .nvmrc)
	if ! has_command node; then
		echo "node: not found"
		echo "Installing node..."
		nvm install
		# Something's wrong, so abort.
		if ! has_command node; then
			die "Unable to install node!"
		fi
		echo "Node installed."
	elif [[ $(node --version) != v"$good_node_version" ]]; then
		# Install correct version if not yet installed
		if ! nvm list node | grep -q "$good_node_version"; then
			echo "node: needed version not installed"
			echo "Installing correct node version..."
			nvm install
			# Something's wrong, so abort.
			if ! nvm list node | grep -q "$good_node_version"; then
				die "Unable to install needed version of node!"
			fi
			echo "Correct version of node installed."
		fi
	fi
	# Switch node version
	nvm use &> /dev/null
	echo "node: available"
}

function do_bash {
	if [[ -z "${BASH_VERSINFO}" || -z "${BASH_VERSINFO[0]}" || ${BASH_VERSINFO[0]} -lt 4 ]]; then
		echo "bash 4+: not found"
		echo "Installing bash..."
		brew install bash
		if [[ -z "${BASH_VERSINFO}" || -z "${BASH_VERSINFO[0]}" || ${BASH_VERSINFO[0]} -lt 4 ]]; then
			die "Unable to install newer version of 'bash'!"
		fi
		echo "Installed bash."
	fi
	echo "bash 4+: available"
}

function do_jq {
	if ! has_command jq; then
		echo "jq: not found"
		echo "Installing jq..."
		brew install jq &>/dev/null
		if ! has_command jq; then
			die "Unable to install jq!"
		fi
		echo "Installed jq."
	fi
	echo "jq: available"
}

function do_pnpm {
	if ! has_command pnpm; then
		echo "pnpm: not found"
		echo "Installing pnpm..."
		curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION="$PNPM_VERSION" sh - &>/dev/null

		# Make sure pnpm is in one's path
		export PNPM_HOME="$("$SHELL" -i -c 'echo "$PNPM_HOME"')"
		export PATH="$("$SHELL" -i -c 'echo "$PATH"')"
		if ! has_command pnpm; then
			die "Unable to install 'pnpm'!"
		fi
		echo "Installed pnpm."
	fi
	echo "pnpm: available"
}

function do_php {
	if ! has_command php || php -r "exit( version_compare( PHP_VERSION, '$PHP_VERSION', '<' ) ? 0 : 1 );"; then
		echo "PHP $PHP_VERSION: not found"

		# Note that we can't use grep -q, as it's prematurely terminated.
		if ! $(brew list|grep php@$PHP_VERSION >/dev/null); then
			echo "Installing PHP $PHP_VERSION..."
			# Don't hide output, as this can take some time...
			brew install php@"$PHP_VERSION"
		else
			echo "Linking already-installed PHP $PHP_VERSION..."
		fi
		brew link --overwrite php@"$PHP_VERSION" &>/dev/null
		if ! has_command php || [[ $(php -r "echo version_compare(PHP_VERSION,'$PHP_VERSION');") -eq -1 ]]; then
			die "Unable to install PHP $PHP_VERSION!"
		fi
	fi
	echo "PHP $PHP_VERSION: available"
}

function do_composer {
	if ! has_command composer; then
		echo "composer: not found"
		echo "Installing composer..."

		# Note that installing from brew adds various unneeded dependencies (e.g. extra PHP).
		# Largely grabbed from official install script:
		# https://getcomposer.org/doc/faqs/how-to-install-composer-programmatically.md
		EXPECTED_CHECKSUM="$(php -r 'copy("https://composer.github.io/installer.sig", "php://stdout");')"
		php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
		ACTUAL_CHECKSUM="$(php -r "echo hash_file('sha384', 'composer-setup.php');")"

		if [[ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]]; then
			rm composer-setup.php
			die "Invalid composer installer checksum!"
		fi

		php composer-setup.php --quiet --version="$COMPOSER_VERSION"
		RESULT=$?
		rm composer-setup.php
		if [[ $RESULT -ne 0 ]]; then
			die "Unable to install composer!"
			if [[ -f composer.phar ]]; then
				# Clean up.
				rm composer.phar
			fi
		fi
		sudo mkdir -p /usr/local/bin
		sudo mv composer.phar /usr/local/bin/composer
		if ! has_command composer; then
			die "Unable to install composer!"
		fi
		echo "Installed composer."
	fi
	echo "composer: available"
}

function do_monorepo_config {
	echo "Setting up the Jetpack monorepo tooling..."
	pnpm install
	composer install
	pnpm jetpack cli link &>/dev/null
	if ! command -v jetpack &>/dev/null; then
		warn 'Failed to link Jetpack CLI. The `jetpack` command will be unavailable.'
		warn 'You can still use `pnpm jetpack` or set up an alias as desired.'
	fi
}

if [[ $1 ]]; then
	usage
fi

do_system
do_basics
do_homebrew
do_nvm
do_node
do_bash
do_jq

# Get repo-preferred versions
source .github/versions.sh
do_pnpm
do_php
do_composer

echo
do_monorepo_config

echo
echo "Installation complete. You will need to restart your terminal for changes"
echo "to take effect. You can then run ./tools/check-development-environment.sh"
echo "to make sure everything installed correctly."
