#!/bin/bash

set -eo pipefail

BASE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source "$BASE/tests/funcs.sh"

test_init_repo
test_make_commits ROOT X1 X2 X3 X4 A B1 C1 D1
test_make_commits A B2 C2 D2
test_make_commits A B3 C3 D3
test_make_merge E D1 D2
test_make_merge F E D3
test_make_commits F G H I
test_make_commits '' O1 O2 O3
test_make_branch main I
test_make_tag tagA A
test_make_tag tagB1 B1
test_make_tag tagB2 B2
test_make_tag tagB3 B3
test_make_tag tagD1 D1
test_make_tag tagD2 D2
test_make_tag tagD3 D3
test_make_tag tagE E
test_make_tag tagF F
test_make_tag tagG G
test_make_tag tagI I
test_make_tag tagO O3

TAGS=( tagA tagE tagG )
test_begin "Tags A, E, G"
init_repo
assert_commits origin/main I H G F D3 C3 B3 E D2 C2 B2 D1 C1 B1 A

TAGS=( tagI )
test_begin "Tag I"
init_repo
assert_commits origin/main I

TAGS=( tagD1 tagD3 )
test_begin "Tags D1, D3"
init_repo
assert_commits origin/main I H G F D3 C3 B3 E D2 D1

TAGS=( tagD2 tagD3 )
test_begin "Tags D2, D3"
init_repo
assert_commits origin/main I H G F D3 C3 B3 E D2 D1

TAGS=( tagD1 tagD2 )
test_begin "Tags D1, D2"
init_repo
assert_commits origin/main I H G F D3 C3 B3 E D2 C2 B2 D1

TAGS=( tagD1 tagD2 tagD3 )
test_begin "Tags D1, D2, D3"
init_repo
assert_commits origin/main I H G F D3 C3 B3 E D2 C2 B2 D1

TAGS=( tagB1 tagB2 tagB3 )
test_begin "Tags B1, B2, B3"
init_repo
assert_commits origin/main I H G F D3 C3 B3 E D2 C2 B2 D1 C1 B1

TAGS=( tagO )
test_begin "Tag O"
if ( init_repo || true ); then
	testfail 'Expected `init_repo` to exit'
fi

cd "$TESTDIR/repo"
git checkout -q main
git reset --hard tagF

TAGS=( tagA tagI )
test_begin "Tag I with old main"
if ( init_repo || true ); then
	testfail 'Expected `init_repo` to exit'
fi

TAGS=( tagD1 )
test_begin "Tag D1 with old main"
init_repo
assert_commits origin/main F D3 C3 B3 E D2 D1

TAGS=( tagE )
test_begin "Tag E with old main"
init_repo
assert_commits origin/main F D3 E

TAGS=( tagD3 )
test_begin "Tag D3 with old main"
init_repo
assert_commits origin/main F D3 E

TAGS=( tagB1 tagB2 tagB3 )
test_begin "Tags B1, B2, B3 with old main"
init_repo
assert_commits origin/main F D3 C3 B3 E D2 C2 B2 D1 C1 B1
