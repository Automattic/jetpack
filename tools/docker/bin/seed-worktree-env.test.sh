#!/usr/bin/env bash

# Fixture test for seed-worktree-env.sh. Builds a throwaway git repo with real linked worktrees
# and drives the actual script through its no-op / seed / backfill / rejection paths. No Docker,
# no network — just git and plain asserts, so it runs anywhere in a second or two.
#
# It is deliberately standalone (the CLI's jest suite lives in a different project and wouldn't be
# triggered by a change to this script): run it by hand after touching the script —
#
#   tools/docker/bin/seed-worktree-env.test.sh
#
# Exits non-zero if any assertion fails.

set -euo pipefail

# Isolate every git call from the developer's / CI's config, so an inherited commit.gpgsign (which
# dies non-interactively — CI, or gpg behind pinentry with no TTY), core.hooksPath, or template dir
# can't make the fixture's setup commit fail before a single assertion runs.
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null

SUT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/seed-worktree-env.sh"

TMP="$( mktemp -d 2>/dev/null || mktemp -d -t seed-wt )"
trap 'rm -rf "$TMP"' EXIT

fail=0
pass() { printf '  ok   - %s\n' "$1"; }
bad()  { printf '  FAIL - %s\n' "$1"; fail=1; }

# assert_grep FILE ERE MSG — the ERE must match a line in FILE.
assert_grep() {
	if [ -f "$1" ] && grep -qE "$2" "$1"; then pass "$3"; else bad "$3 (expected /$2/ in $1)"; fi
}
# assert_absent FILE ERE MSG — the ERE must NOT match any line in FILE.
assert_absent() {
	if [ -f "$1" ] && grep -qE "$2" "$1"; then bad "$3 (unexpected /$2/ in $1)"; else pass "$3"; fi
}
# assert_rc zero|nonzero MSG — check the last run()'s exit status.
assert_rc() {
	if { [ "$1" = zero ] && [ "$RUN_RC" = 0 ]; } || { [ "$1" = nonzero ] && [ "$RUN_RC" != 0 ]; }; then
		pass "$2"
	else
		bad "$2 (exit $RUN_RC)"
	fi
}

# run WORKTREE_DIR — runs the seeded script from that worktree, capturing output + exit status
# into RUN_OUT / RUN_RC without tripping `set -e`.
run() {
	RUN_OUT="$( cd "$1" && ./tools/docker/bin/seed-worktree-env.sh 2>&1 )" && RUN_RC=0 || RUN_RC=$?
}

# --- a primary repo with the script committed at tools/docker/bin ----------
PRIMARY="$TMP/primary"
mkdir -p "$PRIMARY/tools/docker/bin"
git -C "$PRIMARY" init -q
git -C "$PRIMARY" config user.email test@example.test
git -C "$PRIMARY" config user.name  seed-test
cp "$SUT" "$PRIMARY/tools/docker/bin/seed-worktree-env.sh"
chmod +x "$PRIMARY/tools/docker/bin/seed-worktree-env.sh"
git -C "$PRIMARY" add -A
git -C "$PRIMARY" commit -qm init

add_wt() { git -C "$PRIMARY" worktree add -q "$TMP/$1" -b "br-$1"; }
env_of() { printf '%s/tools/docker/.env' "$TMP/$1"; }

# --- primary checkout is a no-op -------------------------------------------
run "$PRIMARY"
case "$RUN_OUT" in *"Not a linked git worktree"* ) pass "primary checkout is a no-op" ;; * ) bad "primary checkout is a no-op ($RUN_OUT)" ;; esac
assert_absent "$PRIMARY/tools/docker/.env" 'COMPOSE_PROJECT_NAME' "primary .env left unseeded"

# --- a linked worktree seeds a unique name + base ports --------------------
add_wt wt-a
run "$TMP/wt-a"
assert_rc zero "linked worktree seeds (exit 0)"
assert_grep "$( env_of wt-a )" '^COMPOSE_PROJECT_NAME=jetpack_wt-a$' "name derives from the git worktree id"
assert_grep "$( env_of wt-a )" '^PORT_WORDPRESS=8080$'               "base WordPress port lands at 8080"

# --- re-running is idempotent ----------------------------------------------
run "$TMP/wt-a"
case "$RUN_OUT" in *"already fully configured"* ) pass "re-run is a no-op" ;; * ) bad "re-run is a no-op ($RUN_OUT)" ;; esac
if [ "$( grep -c '^COMPOSE_PROJECT_NAME=' "$( env_of wt-a )" )" = 1 ]; then pass "re-run leaves a single name line"; else bad "re-run duplicated the name line"; fi

# --- name-only .env gets its ports backfilled around the sibling -----------
add_wt wt-b
printf 'COMPOSE_PROJECT_NAME=jetpack_beta\n' > "$( env_of wt-b )"
run "$TMP/wt-b"
assert_rc zero "name-only .env backfills (exit 0)"
assert_grep "$( env_of wt-b )" '^COMPOSE_PROJECT_NAME=jetpack_beta$' "hand-set name is kept"
assert_grep "$( env_of wt-b )" '^PORT_WORDPRESS=8081$'              "backfilled port avoids the sibling's 8080"

# --- a name a sibling already uses is refused (concern 1) ------------------
add_wt wt-c
printf 'COMPOSE_PROJECT_NAME=jetpack_beta\n' > "$( env_of wt-c )"
run "$TMP/wt-c"
assert_rc nonzero "duplicate project name is rejected"
case "$RUN_OUT" in *"already uses that name"* ) pass "duplicate-name message is shown" ;; * ) bad "duplicate-name message is shown ($RUN_OUT)" ;; esac

# --- jetpack_dev / empty names are refused (concern 1) ---------------------
add_wt wt-d
printf 'COMPOSE_PROJECT_NAME=jetpack_dev\n' > "$( env_of wt-d )"
run "$TMP/wt-d"
assert_rc nonzero "jetpack_dev is rejected (would drive the primary)"

add_wt wt-empty
printf 'COMPOSE_PROJECT_NAME=\n' > "$( env_of wt-empty )"
run "$TMP/wt-empty"
assert_rc nonzero "empty project name is rejected"

# --- a name Compose would reject (space/uppercase) is refused (concern 1) ---
add_wt wt-badname
printf 'COMPOSE_PROJECT_NAME=jetpack_bad name\n' > "$( env_of wt-badname )"
run "$TMP/wt-badname"
assert_rc nonzero "a Compose-invalid project name (space) is rejected"
case "$RUN_OUT" in *"Docker Compose rejects"* ) pass "Compose-invalid message is shown" ;; * ) bad "Compose-invalid message is shown ($RUN_OUT)" ;; esac

# --- `export NAME=…` is not the plain form both parsers read → treat absent --
add_wt wt-e
printf 'export COMPOSE_PROJECT_NAME=jetpack_exported\n' > "$( env_of wt-e )"
run "$TMP/wt-e"
assert_rc zero "export-only name is treated as absent (exit 0)"
assert_grep "$( env_of wt-e )" '^COMPOSE_PROJECT_NAME=jetpack_wt-e$' "a clean, plain name line both parsers read is written"

# --- an inline comment is not the plain form → the port is reallocated ------
add_wt wt-f
printf 'COMPOSE_PROJECT_NAME=jetpack_feat\nPORT_WORDPRESS=9090 # note\n' > "$( env_of wt-f )"
run "$TMP/wt-f"
assert_rc zero "inline-comment port is reallocated (exit 0)"
# The junk `9090 # note` value must be superseded: both parsers take the LAST assignment, so the
# final PORT_WORDPRESS line must be a clean number and must not be the junk 9090.
last_wp="$( grep '^PORT_WORDPRESS' "$( env_of wt-f )" | tail -n1 )"
case "$last_wp" in
	PORT_WORDPRESS=9090*|*'#'* ) bad "inline-comment port superseded by a clean value ($last_wp)" ;;
	PORT_WORDPRESS=[0-9]* )      pass "inline-comment port superseded by a clean value" ;;
	* )                          bad "inline-comment port superseded by a clean value ($last_wp)" ;;
esac

# --- both parsers strip quotes, so a quoted name they honor must be accepted -
# (Regression guard: treating a quoted value as unreadable would falsely reject a valid name.)
add_wt wt-q
printf 'COMPOSE_PROJECT_NAME="jetpack_quoted"\n' > "$( env_of wt-q )"
run "$TMP/wt-q"
assert_rc zero "quoted name jp honors is accepted, not rejected (exit 0)"
assert_grep "$( env_of wt-q )" '^PORT_WORDPRESS=[0-9]+$' "quoted-name worktree gets its ports backfilled"

# --- both parsers strip quotes on ports too: a quoted numeric port is reused -
add_wt wt-qp
printf 'COMPOSE_PROJECT_NAME=jetpack_qp\nPORT_WORDPRESS="8080"\n' > "$( env_of wt-qp )"
run "$TMP/wt-qp"
assert_rc zero "quoted numeric port is honored (exit 0)"
# 8080 is a clean value once quotes are stripped, so it is reused, not reallocated.
if [ "$( grep '^PORT_WORDPRESS' "$( env_of wt-qp )" | tail -n1 )" = 'PORT_WORDPRESS="8080"' ]; then
	pass "quoted numeric port is reused as-is (no reallocation)"
else
	bad "quoted numeric port is reused as-is (no reallocation)"
fi

# --- a `:` delimiter is envfile-only (dotenv drops it), so it is NOT trusted --
# `jp docker up` (dotenv) would drop this line and land on the primary, so the seeder treats it as
# absent and writes a clean `=` line that BOTH parsers read — keeping jp and jetpack in agreement.
add_wt wt-colon
printf 'COMPOSE_PROJECT_NAME:jetpack_colon\n' > "$( env_of wt-colon )"
run "$TMP/wt-colon"
assert_rc zero "colon-delimited name is treated as absent (exit 0)"
assert_grep "$( env_of wt-colon )" '^COMPOSE_PROJECT_NAME=jetpack_wt-colon$' "a clean = name line both parsers read is written"

# --- a bare non-jetpack_ name jp ignores is rejected (concern 1) ------------
add_wt wt-bare
printf 'COMPOSE_PROJECT_NAME=beta\n' > "$( env_of wt-bare )"
run "$TMP/wt-bare"
assert_rc nonzero "bare non-jetpack_ name is rejected (would drive the primary)"

# --- a valid existing port is reused + base-10 normalized, not reallocated --
add_wt wt-reuse
printf 'COMPOSE_PROJECT_NAME=jetpack_reuse\nPORT_WORDPRESS=08080\n' > "$( env_of wt-reuse )"
run "$TMP/wt-reuse"
assert_rc zero "valid existing port is reused (exit 0)"
assert_grep "$( env_of wt-reuse )" '^COMPOSE_PROJECT_NAME=jetpack_reuse$' "reuse worktree keeps its name"
# All four missing PORT_ keys are backfilled and none collide with the reused 8080.
for k in PORT_PHPMY PORT_INBOX PORT_SMTP PORT_SFTP; do
	assert_grep "$( env_of wt-reuse )" "^${k}=[0-9]+$" "backfill wrote ${k}"
done
if grep -qE '^(PORT_PHPMY|PORT_INBOX|PORT_SMTP|PORT_SFTP)=8080$' "$( env_of wt-reuse )"; then
	bad "no backfilled port collides with the reused 08080/8080"
else
	pass "no backfilled port collides with the reused 08080/8080"
fi

# --- a leading UTF-8 BOM is trimmed like JS .trim(), so the name is kept ----
add_wt wt-bom
printf '\xEF\xBB\xBFCOMPOSE_PROJECT_NAME=jetpack_bom\n' > "$( env_of wt-bom )"
run "$TMP/wt-bom"
assert_rc zero "BOM-prefixed name is read, not treated as absent (exit 0)"
assert_absent "$( env_of wt-bom )" '^COMPOSE_PROJECT_NAME=jetpack_wt-bom$' "BOM-prefixed name is not overridden by a derived one"

# --- an unbalanced quote is NOT stripped, so the Compose-invalid name is caught ---
# (Only a matched surrounding pair is stripped; `jetpack_"x` stays, and dotenv would feed that
# verbatim to Compose. The guard must see the un-stripped value and reject it.)
add_wt wt-uq
printf 'COMPOSE_PROJECT_NAME=jetpack_%sx\n' '"' > "$( env_of wt-uq )"
run "$TMP/wt-uq"
assert_rc nonzero "an unbalanced-quote name is rejected (Compose-invalid)"

# --- sibling reservation covers the union both CLIs might bind --------------
# A fresh repo so the reservation is isolated from ports the cases above already claimed. The
# sibling pins base ports via a colon-space and an export form; without the lenient sibling reader
# the fresh worktree would reuse them, colliding at `up`.
PRIMARY2="$TMP/primary2"
mkdir -p "$PRIMARY2/tools/docker/bin"
git -C "$PRIMARY2" init -q
git -C "$PRIMARY2" config user.email test@example.test
git -C "$PRIMARY2" config user.name  seed-test
cp "$SUT" "$PRIMARY2/tools/docker/bin/seed-worktree-env.sh"
chmod +x "$PRIMARY2/tools/docker/bin/seed-worktree-env.sh"
git -C "$PRIMARY2" add -A
git -C "$PRIMARY2" commit -qm init
git -C "$PRIMARY2" worktree add -q "$TMP/p2-sib"   -b br-p2-sib
git -C "$PRIMARY2" worktree add -q "$TMP/p2-fresh" -b br-p2-fresh
printf 'COMPOSE_PROJECT_NAME: jetpack_p2sib\nPORT_WORDPRESS: 8080\nexport PORT_PHPMY=8282\n' > "$TMP/p2-sib/tools/docker/.env"
run "$TMP/p2-fresh"
assert_rc zero "fresh worktree seeds beside a colon/export sibling (exit 0)"
assert_absent "$TMP/p2-fresh/tools/docker/.env" '^PORT_WORDPRESS=8080$' "colon-space sibling port 8080 is reserved (not reused)"
assert_absent "$TMP/p2-fresh/tools/docker/.env" '^PORT_PHPMY=8282$'    "export sibling port 8282 is reserved (not reused)"

# A colon-space sibling NAME must also feed the duplicate-name guard.
git -C "$PRIMARY2" worktree add -q "$TMP/p2-dupe" -b br-p2-dupe
printf 'COMPOSE_PROJECT_NAME=jetpack_p2sib\n' > "$TMP/p2-dupe/tools/docker/.env"
run "$TMP/p2-dupe"
assert_rc nonzero "a name duplicating a colon-space sibling is rejected"

# --- reaching the primary through a symlinked path is still a no-op ---------
# (Guards the pwd -P handling that resolves --absolute-git-dir's symlink resolution.)
ln -s "$PRIMARY" "$TMP/primary-link"
run "$TMP/primary-link"
case "$RUN_OUT" in *"Not a linked git worktree"* ) pass "symlinked primary path is a no-op" ;; * ) bad "symlinked primary path is a no-op ($RUN_OUT)" ;; esac
assert_absent "$PRIMARY/tools/docker/.env" 'COMPOSE_PROJECT_NAME' "symlinked primary .env left unseeded"

echo
if [ "$fail" = 0 ]; then echo "All seed-worktree-env.sh fixture checks passed."; else echo "seed-worktree-env.sh fixture checks FAILED."; fi
exit "$fail"
