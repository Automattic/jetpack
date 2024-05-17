#!/bin/bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source "$BASE/tests/funcs.sh"

test_init_repo
test_make_commits ROOT A B C PR1
test_make_commits A PR2
test_make_branch main C
test_make_pr 1 PR1
test_make_pr 2 PR2
test_make_tag tagA A
test_make_tag tagB B

NOTIFY_SUCCESS=true
TAGS=( tagB )
test_begin "Tag B, NOTIFY_SUCCESS"
init_repo
fetch_prs 1 2
process_pr 1
assert_status PR1 "$DATA_OK"
process_pr 2
assert_status PR2 "$DATA_FAIL"

NOTIFY_SUCCESS=false
TAGS=( tagB )
test_begin "Tag B, no NOTIFY_SUCCESS"
init_repo
fetch_prs 1 2
process_pr 1
assert_status PR1 ""
process_pr 2
assert_status PR2 "$DATA_FAIL"

NOTIFY_SUCCESS=true
TAGS=( tagA )
test_begin "Tag A"
init_repo
fetch_prs 1 2
process_pr 1
assert_status PR1 "$DATA_OK"
process_pr 2
assert_status PR2 "$DATA_OK"

NOTIFY_SUCCESS=true
TAGS=( tagA tagB )
test_begin "Tags A and B"
init_repo
fetch_prs 1 2
process_pr 1
assert_status PR1 "$DATA_OK"
process_pr 2
assert_status PR2 "$DATA_FAIL"

NOTIFY_SUCCESS=true
TAGS=( tagB )
test_begin "Forgot to fetch the PR"
init_repo
fetch_prs 2
if ( process_pr 1 || true ); then
	testfail 'Expected `process_pr 1` to exit'
fi
