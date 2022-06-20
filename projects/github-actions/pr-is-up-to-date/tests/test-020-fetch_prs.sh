#!/bin/bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source "$BASE/tests/funcs.sh"

test_init_repo
test_make_commits ROOT X1 X2 X3 X4 A B C PR1
test_make_commits B PR2.1 PR2
test_make_commits X3 PR3.1 PR3
test_make_commits X3 PR4.1 PR4.2
test_make_merge PR4.3 PR4.2 C
test_make_commits PR4.3 PR4
test_make_commits X3 PR5.1 PR5.2
test_make_merge PR5 PR5.2 C
test_make_branch main C
test_make_pr 1 PR1
test_make_pr 2 PR2
test_make_pr 3 PR3
test_make_pr 4 PR4
test_make_pr 5 PR5
test_make_tag tagB B

TAGS=( tagB )

test_begin "Fetching PR descended from main"
init_repo
fetch_prs 1
assert_commits pulls/1 PR1 C B

test_begin "Fetching PR descended from the tag"
init_repo
fetch_prs 2
assert_commits pulls/2 PR2 PR2.1 B

test_begin "Fetching PR descended from an ancestor"
init_repo
fetch_prs 3
assert_commits pulls/3 PR3 PR3.1

test_begin "Fetching a PR merged with main plus more commits"
init_repo
fetch_prs 4
assert_commits pulls/4 PR4 PR4.3 C B PR4.2

test_begin "Fetching a PR merged with main"
init_repo
fetch_prs 5
assert_commits pulls/5 PR5 C B PR5.2

test_begin "Fetching PR that doesn't exist"
init_repo
if fetch_prs 999; then
	testfail 'Expected `fetch_prs 999` to fail'
fi
