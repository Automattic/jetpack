#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )/.."
. tools/includes/chalk-lite.sh
. .github/versions.sh

SUPPORT_BASE_URL=https://github.com/Automattic/jetpack/blob/master/docs/development-environment-cli-support.md

function output { printf "$@";  }

function command_exists_as_alias {
	alias $1 2>/dev/null >/dev/null
}

function version_gt() { test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"; }

function node_version_is_proper {
	version_gt `node -v |cut -b 2-` $NODE_VERSION
}

function which {
	type "$1" >>/dev/null 2>&1
}

function command_is_available {
	which $1 || command_exists_as_alias $1 || type $1 >/dev/null 2>/dev/null
}

function nvm_is_available {
	[ -f ~/.nvm/nvm.sh ] && source ~/.nvm/nvm.sh && command_is_available nvm
}

function docker_is_running {
	docker info >/dev/null 2>&1
}

function repo_is_up_to_date {
	git fetch origin >/dev/null
	git diff -s --exit-code master origin/master
}

function node_modules_are_available {
	[ -d node_modules ]
}

function vendor_dir_is_available {
	[ -d vendor ]
}

function is_git_dir {
	[ -d .git ]
}

function repo_origin_scheme_is_git {
	git remote -v | grep 'git@' >/dev/null
}

function docker_containers_are_running {
	docker_is_running && docker ps | grep jetpack_wordpress >>/dev/null \
		&& docker ps| grep jetpack_mysql >>/dev/null
}

function docker_containers_are_available {
	docker_is_running && docker ps -a | grep jetpack_wordpress >>/dev/null \
		&& docker ps -a | grep jetpack_mysql >>/dev/null
}

function docker_images_are_available {
	docker_is_running && docker image ls | grep automattic/jetpack-wordpress-dev >>/dev/null
}

function bash_version_is_proper {
	bash tools/includes/check-osx-bash-version.sh 2>/dev/null
}

function support_url {
	if [ -z $2 ]; then
		slug=`echo $1 | tr _ -`
		echo "$SUPPORT_BASE_URL#$slug"
	else
		slug=`echo $1-$2 | tr _ -`
		echo "$SUPPORT_BASE_URL#$slug"
	fi
}

function assert {
	output "* $1 $2":
	$1 $2 && success " SUCCESS" || error <<-EOM 2>&1
		 FAILED.
		    Check $(support_url "$1" "$2" )
	EOM
}

function check {
	output "* $1 $2":
	$1 $2 && success " SUCCESS" || output " NOPE.\n\tCheck $(support_url "$1" "$2" )\n"
}

main() {
	output "Jetpack development environment check\n\n"
	output "\nChecking under $PWD\n\n"

	output "Tools for development, linting, unit testing PHP\n"
	output "================================================ \n\n"

	assert command_is_available php
	assert command_is_available phpunit
	assert command_is_available composer
	assert vendor_dir_is_available

	output "\n\nTools for development, linting, unit testing JavaScript"
	output   "\n=======================================================\n\n"

	assert command_is_available node
	assert node_version_is_proper
	assert command_is_available pnpm
	check  nvm_is_available || check command_is_available n
	assert node_modules_are_available

	output "\n\nTools used by scripts"
	output   "\n=====================\n\n"

	assert bash_version_is_proper
	assert command_is_available jq

	output "\n\nDocker Development Environment"
	output   "\n==============================\n\n"

	check  command_is_available docker
	check  command_is_available docker-compose
	check  docker_is_running
	check  docker_images_are_available
	check  docker_containers_are_available
	check  docker_containers_are_running

	output "\n\nTools for contributing"
	output   "\n======================\n\n"

	assert command_is_available git
	assert is_git_dir
	assert repo_origin_scheme_is_git
	assert repo_is_up_to_date
	check command_is_available jetpack
}

## Run main only if not source by another file
(return 0 2>/dev/null) || main
