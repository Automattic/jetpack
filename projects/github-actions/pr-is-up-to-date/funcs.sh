#!/bin/bash

set -eo pipefail

# Execute `git` with logging of commands.
#
# Inputs:
#  $*: Git command and options.
function git {
	printf "\e[32m%s\e[0m\n" "/usr/bin/git $*" >&2
	/usr/bin/git "$@"
}

# Initialize the repo in the current directory.
#
# Inputs:
#  $BRANCH: Base branch, e.g. main.
#  $GITHUB_SERVER_URL: GitHub server URL.
#  $GITHUB_REPOSITORY: GitHub repository slug.
#  ${TAGS[@]}: Tags to check against.
# Outputs:
#  ${TAGS[@]}: Sorted list of tags.
function init_repo {
	echo "::group::Initializing repo"
	git init -q .
	git remote add origin "${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}"
	git config --local gc.auto 0
	echo "::endgroup::"

	echo "::group::Fetching tags"
	gitfetch --depth=1 origin tag "${TAGS[@]}" || die "Failed to fetch specified tags"
	mapfile -t TAGS < <(git tag --list --sort=committerdate "${TAGS[@]}")
	echo "Tags, in order:"
	local TAG
	for TAG in "${TAGS[@]}"; do
		printf " - %s: %s\n" "$TAG" "$(/usr/bin/git rev-parse --verify "$TAG")"
	done
	echo "::endgroup::"

	echo "::group::Fetching $BRANCH"
	echo "Fetching first commit"
	gitfetch --depth=1 origin "$BRANCH"
	local TAG
	for TAG in "${TAGS[@]}"; do
		if ! git merge-base --is-ancestor "$TAG" "origin/$BRANCH"; then
			echo "Fetching commits to $TAG"
			gitfetch --shallow-exclude="$TAG" origin "$BRANCH"
			if ! git merge-base --is-ancestor "$TAG" "origin/$BRANCH"; then
				die "Tag $TAG is not an ancestor of $BRANCH! Aborting."
			fi
		else
			echo "Already have commits to $TAG"
		fi
	done
	echo "::endgroup::"
}

# Execute `git fetch`, with logging and some cleanup.
#
# Note: I've tried including `--filter=tree:0` or `--filter=blob:none`, but git tends to try to
# implicitly fetch later (including blobs and trees) when commits are missing which defeats the purpose.
#
# Inputs:
#  $*: Git fetch options.
function gitfetch {
	git fetch "$@" && git_clean_shallow
}

# Clean up .git/shallow after a shallow fetch.
#
# A shallow fetch will add a graft point to .git/shallow, even if the parent of the graft point exists locally.
# This makes sense for git's specific intention, but it's not what we want.
#
# This function updates .git/shallow to remove any revision where its parent revs exist, and fetches parent
# revs for merge commits where some but not all parent revs exist.
function git_clean_shallow {
	local REV REVS P PP PPM TOFETCH

	[[ -f .git/shallow ]] || return 0

	TOFETCH=()
	mapfile -t REVS < .git/shallow
	rm .git/shallow
	for REV in "${REVS[@]}"; do
		# Read parents. If any are missing, put the rev back in .git/shallow. If not all are missing, queue the missing ones to be fetched.
		mapfile -t PP < <(/usr/bin/git cat-file commit "$REV" 2>/dev/null | sed -n 's/^parent //p')
		PPM=()
		for P in "${PP[@]}"; do
			if ! /usr/bin/git cat-file -e "$P" &>/dev/null; then
				PPM+=( "$P" )
			fi
		done
		if [[ ${#PPM[@]} -gt 0 ]]; then
			echo "$REV" >> .git/shallow
			if [[ ${#PP[@]} -ne ${#PPM[@]} ]]; then
				TOFETCH+=( "${PPM[@]}" )
			fi
		fi
	done

	# If we queued any revs for fetching, fetch them now. Note that'll in turn re-run git_clean_shallow, which should now be able to remove the revs that had them as parents.
	if [[ ${#TOFETCH[@]} -gt 0 ]]; then
		gitfetch --depth=1 origin "${TOFETCH[@]}"
	fi
}

# Print a GitHub error message and exit.
#
# Inputs:
#  $*: Error message.
function die {
	echo "::error::$*"
	exit 1
}

# Fetch one or more PRs.
#
# Inputs:
#  $*: PR numbers to fetch.
#  $BRANCH: Base branch, e.g. main.
function fetch_prs {
	local PR REFS=()
	for PR in "$@"; do
		REFS+=( "+refs/pull/$PR/head:refs/remotes/pulls/$PR" )
	done

	gitfetch --shallow-exclude="$BRANCH" origin "${REFS[@]}"
}

# Test if a PR should be processed.
#
# Inputs:
#  $1: PR number to test.
#  $BRANCH: Base branch, e.g. main.
#  $DEEPENBY: How much to deepen by if we're having to deepen $BRANCH. If empty, it'll deepen by just enough to find the merge base.
#  ${PATHS[@]}: Paths that must be touched.
# Returns: 0 if the PR should be processed, non-zero otherwise.
function should_process_pr {
	local MB PR=$1
	if [[ ${#PATHS[@]} -gt 0 ]]; then
		git rev-parse --verify "pulls/$PR" &>/dev/null || die "PR #$PR has not been fetched"
		MB="$(git merge-base "pulls/$PR" "origin/$BRANCH")"
		# We need to find the merge base in order to diff. If there wasn't one, fetch the needed revs and try again.
		if [[ -z "$MB" ]]; then
			if [[ -z "$DEEPENBY" || $DEEPENBY -lt 1 ]]; then
				echo "::group::Fetching $BRANCH to PR #$PR"
				# We need to fetch $BRANCH down to the PR, and then deepen the PR by 1 to get the actual merge base.
				gitfetch --shallow-exclude="refs/pull/$PR/head" origin "$BRANCH" || die "should_process_pr: Failed to fetch $BRANCH to PR #$PR"
				gitfetch --deepen=1 origin "+refs/pull/$PR/head:refs/remotes/pulls/$PR" || die "should_process_pr: Failed to fetch next revision for PR #$PR"
				echo "::endgroup::"
				MB="$(git merge-base "pulls/$PR" "origin/$BRANCH")"
				[[ -z "$MB" ]] && die "Failed to determine merge base for pulls/$PR and origin/$BRANCH"
			else
				# Keep deepening until we find the merge base. Double the DEEPENBY each time to try to adapt to busier repos.
				while [[ -z "$MB" ]]; do
					echo "::group::Fetching next $DEEPENBY revisions for $BRANCH"
					gitfetch --deepen="$DEEPENBY" origin "$BRANCH" || die "should_process_pr: Failed to fetch next $DEEPENBY revisions for $BRANCH"
					DEEPENBY=$(( DEEPENBY * 2 ))
					echo "::endgroup::"
					MB="$(git merge-base "pulls/$PR" "origin/$BRANCH")"
				done
			fi
		fi
		! git diff --name-only --exit-code "$MB..pulls/$PR" -- "${PATHS[@]}"
		return
	fi

	return 0
}

# Update status on GitHub.
#
# Inputs:
#  $1: Commit hash being updated.
#  $2: JSON data for the status update.
#  $API_TOKEN: GitHub API token for updates.
#  $CI: Does nothing unless this is non-empty.
#  $GITHUB_API_URL: GitHub API URL for updates.
#  $GITHUB_REPOSITORY: GitHub repository for updates.
function update_github_status {
	if [[ -n "$CI" ]]; then
		echo "::group::Setting GitHub status"
		curl -v \
			--url "${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/statuses/${1}" \
			--header "authorization: Bearer $API_TOKEN" \
			--header 'content-type: application/json' \
			--data "$2"
		local R=$?
		echo "::endgroup::"
		return $R
	fi
}

# Process a PR.
#
# Inputs:
#  $1: PR numbers to process.
#  $DATA_FAIL: JSON string to send to GitHub on failure.
#  $DATA_OK: JSON string to send to GitHub on success.
#  $NOTIFY_SUCCESS: `true` or `false`, whether to update the GitHub status on success.
#  ${TAGS[@]}: Tags to check against.
#  (and anything used by update_github_status)
function process_pr {
	local TAG COMMIT PR=$1
	COMMIT="$(git rev-parse --verify "pulls/$PR")"
	[[ -z "$COMMIT" ]] && die "PR #$PR has not been fetched"
	for TAG in "${TAGS[@]}"; do
		if ! git merge-base --is-ancestor "$TAG" "$COMMIT"; then
			printf "\e[1;31mPR #%d is outdated\e[0m\n" "$PR"
			update_github_status "$COMMIT" "$DATA_FAIL"
			return
		fi
	done
	printf "\e[1;32mPR #%d is up to date\e[0m\n" "$PR"
	if $NOTIFY_SUCCESS; then
		update_github_status "$COMMIT" "$DATA_OK"
	fi
}

