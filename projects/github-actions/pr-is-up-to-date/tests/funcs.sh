#!/bin/bash

set -eo pipefail

: "${TESTDIR:?}"
BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source "$BASE/funcs.sh"

# Variables expected in the environment.
GITHUB_SERVER_URL="file://$TESTDIR"
GITHUB_REPOSITORY=repo
BRANCH=main
DATA_FAIL='"FAIL"'
DATA_OK='"OK"'
CI=true

# Git needs these
export GIT_AUTHOR_DATE="1640995200 +0000"
export GIT_AUTHOR_NAME=Test
export GIT_AUTHOR_EMAIL=test@example.com
export GIT_COMMITTER_DATE
export GIT_COMMITTER_NAME=Test
export GIT_COMMITTER_EMAIL=test@example.com

# Variable mapping symbolic names to git hashes
declare -A TEST_COMMITS

# Variable holding GitHub statuses by commit hash.
declare -A TEST_STATUSES

# Override this to do nothing during tests.
function update_github_status {
	TEST_STATUSES[$1]="$2"
	echo "Set GitHub status for $1: $2"
}

# Print an error an exit.
function testfail {
	printf "\e[31mFAIL: %s\e[0m\n" "$*"
	exit 1
}

# Fake the git commit date.
#
# Increments GIT_AUTHOR_DATE and GIT_COMMITTER_DATE so each commit can have a separate timestamp.
# This avoids certain confusion when commits are ordered.
function test_inc_git_date {
	GIT_AUTHOR_DATE="$(( ${GIT_AUTHOR_DATE% +0000} + 1 )) +0000"
	GIT_COMMITTER_DATE="$GIT_AUTHOR_DATE"
}
test_inc_git_date

# Initialize a repository for testing.
#
# Changes the current directory to the new repo.
# Creates a "ROOT" entry in $TEST_COMMITS.
function test_init_repo {
	mkdir "$TESTDIR/repo"
	cd "$TESTDIR/repo"
	git init -b xxx -q .
	git commit --allow-empty -m 'ROOT'
	test_inc_git_date
	TEST_COMMITS[ROOT]="$(git rev-parse HEAD)"
	git checkout -q "${TEST_COMMITS[ROOT]}"
	git branch -D xxx
}

# Create a tree of commits in the test repo
#
# Inputs:
#  $1: Base commit symbol in TEST_COMMITS. Pass the empty string to create a new root.
#  $*: Commit symbols to create, in order.
function test_make_commits {
	[[ "$PWD" == "$TESTDIR/repo" ]] || testfail "test_make_commits: cwd is not $TESTDIR/repo (it's $PWD)"

	if [[ "$1" == "" ]]; then
		shift
		git checkout -q --orphan xxx
		git commit --allow-empty -m "$1"
		test_inc_git_date
		TEST_COMMITS[$1]="$(git rev-parse HEAD)"
		git checkout -q "${TEST_COMMITS[$1]}"
		git branch -D xxx
	else
		[[ -n "${TEST_COMMITS[$1]}" ]] || testfail "test_make_commits: root commit $1 not found"
		git checkout -q "${TEST_COMMITS[$1]}"
	fi
	shift
	while [[ $# -gt 0 ]]; do
		[[ -z "${TEST_COMMITS[$1]}" ]] || testfail "test_make_commits: commit $1 already exists"
		git commit --allow-empty -m "$1" || testfail "test_make_commits: Failed to create commit"
		test_inc_git_date
		TEST_COMMITS[$1]="$(git rev-parse HEAD)"
		shift
	done
}

# Create a merge commit in the repo.
#
# Inputs:
#  $1: Symbol for the merge commit.
#  $*: Commit symbols for the parent commits.
function test_make_merge {
	[[ "$PWD" == "$TESTDIR/repo" ]] || testfail "test_make_merge: cwd is not $TESTDIR/repo (it's $PWD)"

	[[ -z "${TEST_COMMITS[$1]}" ]] || testfail "test_make_merge: commit $1 already exists"
	local NEW=$1
	shift

	[[ -n "${TEST_COMMITS[$1]}" ]] || testfail "test_make_merge: parent commit $2 not found"
	git checkout -q "${TEST_COMMITS[$1]}"
	shift

	local PARENTS=()
	while [[ $# -gt 0 ]]; do
		[[ -n "${TEST_COMMITS[$1]}" ]] || testfail "test_make_merge: parent commit $1 not found"
		PARENTS+=( "${TEST_COMMITS[$1]}" )
		shift
	done

	git merge --no-ff -m "$NEW" "${PARENTS[@]}" || testfail "test_make_merge: failed to create commit"
	test_inc_git_date
	TEST_COMMITS[$NEW]="$(git rev-parse HEAD)"
}

# Create a branch in the test repo
#
# Inputs:
#  $1: Branch name.
#  $2: Commit symbol in TEST_COMMITS.
function test_make_branch {
	[[ "$PWD" == "$TESTDIR/repo" ]] || testfail "test_make_branch: cwd is not $TESTDIR/repo (it's $PWD)"
	[[ -n "${TEST_COMMITS[$2]}" ]] || testfail "test_make_branch: commit $2 not found"
	git branch "$1" "${TEST_COMMITS[$2]}" || testfail "test_make_branch: failed to create branch"
}

# Create a tag in the test repo
#
# Inputs:
#  $1: Tag name.
#  $2: Commit symbol in TEST_COMMITS.
function test_make_tag {
	[[ "$PWD" == "$TESTDIR/repo" ]] || testfail "test_make_tag: cwd is not $TESTDIR/repo (it's $PWD)"
	[[ -n "${TEST_COMMITS[$2]}" ]] || testfail "test_make_tag: commit $2 not found"
	git tag "$1" "${TEST_COMMITS[$2]}" || testfail "test_make_tag: failed to create tag"
}

# Create a PR in the test repo
#
# Inputs:
#  $1: PR number.
#  $2: Commit symbol in TEST_COMMITS.
function test_make_pr {
	[[ "$PWD" == "$TESTDIR/repo" ]] || testfail "test_make_pr: cwd is not $TESTDIR/repo (it's $PWD)"
	[[ -n "${TEST_COMMITS[$2]}" ]] || testfail "test_make_pr: commit $2 not found"
	git update-ref "refs/pull/$1/head" "${TEST_COMMITS[$2]}" || testfail "test_make_pr: failed to create PR ref"
}

# Change to a mirror directory to start actual testing
function test_begin {
	printf "\n\e[1mTEST: %s\e[0m\n" "$*"
	rm -rf "$TESTDIR/ci"
	mkdir "$TESTDIR/ci"
	cd "$TESTDIR/ci"
	reset_statuses
}

# Assert that a status was "set" to GitHub.
#
# Inputs:
#  $1: Commit symbol in TEST_COMMITS.
#  $2: Status. Pass "$DATA_FAIL" or "$DATA_OK" or the empty string.
function assert_status {
	[[ -n "${TEST_COMMITS[$1]}" ]] || testfail "assert_status: commit $1 not found"
	local C="${TEST_COMMITS[$1]}"
	local S="${TEST_STATUSES[$C]}"
	[[ "$S" == "$2" ]] || testfail "assert_status: For $1, expected ${2:-unset} but got ${S:-unset}"
}

# Assert that a given ref corresponds to exactly the specified commits.
#
# Inputs:
#  $1: Git ref.
#  $*: Commit symbol in TEST_COMMITS.
function assert_commits {
	local REF=$1
	shift
	local S EXPECT='' ACTUAL
	for S in "$@"; do
		[[ -n "${TEST_COMMITS[$S]}" ]] || testfail "assert_status: commit $S not found"
		EXPECT+="${TEST_COMMITS[$S]} $S"$'\n'
	done

	ACTUAL="$(git log --topo-order --format='%H %s' "$REF")"$'\n'
	diff -u /dev/fd/3 --label expected /dev/fd/4 --label actual 3<<<"$EXPECT" 4<<<"$ACTUAL"
}

# Reset the statuses array.
function reset_statuses {
	TEST_STATUSES=()
}
