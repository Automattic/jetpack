#!/bin/sh

grn=$'\e[1;32m'
red=$'\e[1;31m'
ylw=$'\e[1;33m'
white=$'\e[0m'
cyn=$'\e[1;36m'

SUPPORT_BASE_URL=https://github.com/Automattic/jetpack/blob/master/docs/development-environment-cli-support.md

function output { printf $white"$@";  }
function success { printf $grn"$@";  }
function danger { printf $red"$@";  }
function info { printf $cyn"$@";  }
function warning { printf $ylw"$@";  }

function command_exists_as_alias {
	alias $1 2>/dev/null >/dev/null
}

function version_gt() { test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"; }

function node_version_is_proper {
	REQUIRED=`cat .nvmrc`
	version_gt `node -v |cut -b 2-` $REQUIRED
}

function command_is_available {
	which -s $1 || command_exists_as_alias $1 || type $1 >/dev/null 2>/dev/null
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
	docker_is_running && docker image ls | grep jetpack_wordpress >>/dev/null
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
	$1 $2 && success " SUCCESS\n"
	$1 $2 || danger " FAILED. Check $(support_url "$1" "$2" )\n"
}

function check {
	output "* $1 $2":
	$1 $2 && success " SUCCESS\n"
	$1 $2 || output " NOPE. Check $(support_url "$1" "$2" )\n"
}

main() {
	output "Jetpack development environment checking\n\n"
	output "\nChecking under $PWD\n\n"
	output "Tools for development, linting, unit testing\n"
	output "============================================ \n\n"

	assert command_is_available php
	assert command_is_available phpunit
	assert command_is_available composer
	assert vendor_dir_is_available

	output "\n\nJavaScript tooling\n"
	output "======================\n\n"

	assert command_is_available node
	assert node_version_is_proper
	assert command_is_available yarn
	check  nvm_is_available || check command_is_available n
	assert node_modules_are_available

	output "\nJetpack Development Environment\n"
	output "=================================\n\n"

	assert command_is_available docker
	check  docker_is_running
	check  docker_images_are_available
	check  docker_containers_are_available
	check  docker_containers_are_running

	output "\n\nTools for contributing\n"
	output "==========================\n\n"

	assert command_is_available git
	assert is_git_dir
	assert repo_origin_scheme_is_git
	assert repo_is_up_to_date

	# Clean terminal colors
	echo $white

}

## Run main only if not source by another file
(return 0 2>/dev/null) || main
