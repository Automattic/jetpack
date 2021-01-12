#!/bin/bash

git_setup()
{
  cat <<- EOF > "$HOME/.netrc"
		machine github.com
			login matticbot
			password $GITHUB_TOKEN
		machine api.github.com
			login matticbot
			password $GITHUB_TOKEN
EOF
  chmod 600 "$HOME/.netrc"

  git config --global user.email "matticbot@users.noreply.github.com"
  git config --global user.name "matticbot"
}

# Halt on error
set -eo pipefail

if [[ -n "$CI" ]]; then
	git_setup
fi

BASE=$(pwd)
CLONE_BASE=$(mktemp -d "${TMPDIR:-/tmp}/jetpack-update-project-mirrors.XXXXXXXX")
MONOREPO_COMMIT_MESSAGE=$(git show -s --format=%B $GITHUB_SHA)
COMMIT_MESSAGE=$( echo "${MONOREPO_COMMIT_MESSAGE}\n\nCommitted via a GitHub action: https://github.com/automattic/jetpack/runs/${GITHUB_RUN_ID}" )
COMMIT_ORIGINAL_AUTHOR="${GITHUB_ACTOR} <${GITHUB_ACTOR}@users.noreply.github.com>"

# Install Yarn generally.
echo "::group::Monorepo setup"
yarn install
echo "::endgroup::"

echo "Cloning projects and pushing to Automattic mirror repos"
EXIT=0

# sync to read-only clones
for project in projects/packages/* projects/plugins/*; do
	PROJECT_DIR="${BASE}/${project}"
	[[ -d "$PROJECT_DIR" ]] || continue # We are only interested in directories (i.e. projects)

	printf "\n\n\e[7m Project: %s \e[0m\n" "$project"

	cd "${PROJECT_DIR}"

	# Read mirror repo from composer.json, if it exists
	if [[ -f "composer.json" ]]; then
		COMPOSER_JSON_EXISTED=true
		GIT_SLUG=$(jq -r '.extra["mirror-repo"] // ( .name | sub( "^automattic/"; "Automattic/" ) )' composer.json)
		if [[ -z "$GIT_SLUG" ]]; then
			echo "::error::Failed to determine mirror repo from composer.json"
			EXIT=1
			continue
		fi
	else
		COMPOSER_JSON_EXISTED=false
		GIT_SLUG="Automattic/jetpack-${project##*/}"
	fi
	echo "Mirror repo: $GIT_SLUG"

	# Check if a remote exists for that project.
	if git ls-remote --exit-code -h "https://github.com/${GIT_SLUG}.git" >/dev/null 2>&1; then
		echo "${GIT_SLUG} exists. Let's clone it."
	else
		echo "${GIT_SLUG} does not exist. Skipping."
		continue
	fi

	## clone, delete files in the clone, and copy (new) files over
	# this handles file deletions, additions, and changes seamlessly

	CLONE_DIR="${CLONE_BASE}/${GIT_SLUG}"
	echo "Clone dir: $CLONE_DIR"

	echo "::group::Cloning ${GIT_SLUG}"
	if git clone --depth 1 "https://$API_TOKEN_GITHUB@github.com/$GIT_SLUG.git" "$CLONE_DIR"; then
		echo "::endgroup::"
	else
		echo "::endgroup::"
		echo "::error::Cloning of ${GIT_SLUG} failed"
		EXIT=1
		continue
	fi

	if [[ -f "package.json" ]]; then
		echo "::group::Building ${GIT_SLUG}"
		if yarn install && yarn build-production-concurrently; then
			echo "::endgroup::"
		else
			echo "::endgroup::"
			echo "::error::Build of ${GIT_SLUG} failed"
			EXIT=1
			continue
		fi
	fi

	echo "Preparing commit"
	cd "$CLONE_DIR"

	# Delete all files except .git
	find . -maxdepth 1 ! \( -name .git -o -name . \) -exec rm -rf {} +
	cp -r "${PROJECT_DIR}/." .

	if [[ "$GIT_SLUG" == 'Automattic/jetpack-production' ]]; then
		./tools/prepare-build-branch.sh
	fi

	# Before we commit any changes, ensure that the repo has the basics we need for any project
	if $COMPOSER_JSON_EXISTED && [[ ! -f "composer.json" ]]; then
		echo "::error::Changes to ${GIT_SLUG}} remove essential parts of the package. They will not be committed."
		EXIT=1
		continue
	fi

	if [[ -n "$(git status --porcelain)" ]]; then
		echo "Committing to $GIT_SLUG"
		git add -A
		if git commit --quiet --author="${COMMIT_ORIGINAL_AUTHOR}" -m "${COMMIT_MESSAGE}" &&
			{ [[ -z "$CI" ]] || git push origin master; } # Only do the actual push from the GitHub Action
		then
			echo "Completed $GIT_SLUG"
		else
			echo "::error::Commit of ${GIT_SLUG} failed"
			EXIT=1
		fi
	else
		echo "No changes, skipping $GIT_SLUG"
	fi
done

exit $EXIT
