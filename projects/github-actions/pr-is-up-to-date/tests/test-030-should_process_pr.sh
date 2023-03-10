#!/bin/bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source "$BASE/tests/funcs.sh"

function test_make_files {
	mkdir -p a/b/c
	touch a/b/c/bar.txt
	git add a
}

test_init_repo
test_make_commits ROOT X1 X2 X3 X4 X5 A B C PR1
test_make_files
test_make_commits A PR2
test_make_commits X3 PR3.1
test_make_files
test_make_commits PR3.1 PR3
test_make_commits X3 PR4.1
test_make_files
test_make_commits PR4.1 PR4.2
test_make_merge PR4 PR4.2 C
test_make_branch main C
test_make_pr 1 PR1
test_make_pr 2 PR2
test_make_pr 3 PR3
test_make_pr 4 PR4
test_make_tag tagA A

TAGS=( tagA )

test_begin "No paths set"
init_repo
fetch_prs 1 2 3 4
if ! should_process_pr 1; then
	testfail 'Expected `should_process_pr 1` to pass'
fi
if ! should_process_pr 2; then
	testfail 'Expected `should_process_pr 2` to pass'
fi
if ! should_process_pr 3; then
	testfail 'Expected `should_process_pr 3` to pass'
fi
if ! should_process_pr 4; then
	testfail 'Expected `should_process_pr 4` to pass'
fi

PATHS=( xxx 'a/b/c/*.txt' xyz )
test_begin "Paths set"
init_repo
fetch_prs 1 2
if should_process_pr 1; then
	testfail 'Expected `should_process_pr 1` to fail'
fi
if ! should_process_pr 2; then
	testfail 'Expected `should_process_pr 2` to pass'
fi

PATHS=( xxx bar.txt a/b/c/foo.txt xyz )
test_begin "Paths set, but not including the touched path"
init_repo
fetch_prs 1 2
if should_process_pr 1; then
	testfail 'Expected `should_process_pr 1` to fail'
fi
if should_process_pr 2; then
	testfail 'Expected `should_process_pr 2` to fail'
fi

PATHS=( xxx 'a/b/c/*.txt' xyz )
test_begin "Forgot to fetch PR"
init_repo
if ( should_process_pr 1 || true ); then
	testfail 'Expected `should_process_pr 1` to exit'
fi
if ( should_process_pr 2 || true ); then
	testfail 'Expected `should_process_pr 2` to exit'
fi

PATHS=( xxx 'a/b/c/*.txt' xyz )
test_begin "Paths set, outdated PR"
init_repo
fetch_prs 3
if ! should_process_pr 3; then
	testfail 'Expected `should_process_pr 3` to pass'
fi

PATHS=( xxx bar.txt a/b/c/foo.txt xyz )
test_begin "Paths set but not including the touched path, outdated PR"
init_repo
fetch_prs 3
if should_process_pr 3; then
	testfail 'Expected `should_process_pr 3` to fail'
fi

PATHS=( xxx 'a/b/c/*.txt' xyz )
test_begin "Paths set, main-merged PR"
init_repo
fetch_prs 4
if ! should_process_pr 4; then
	testfail 'Expected `should_process_pr 4` to pass'
fi

PATHS=( xxx bar.txt a/b/c/foo.txt xyz )
test_begin "Paths set but not including the touched path, main-merged PR"
init_repo
fetch_prs 4
if should_process_pr 4; then
	testfail 'Expected `should_process_pr 4` to fail'
fi
