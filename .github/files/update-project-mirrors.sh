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

if [[ "$GITHUB_REF" =~ ^refs/heads/ ]]; then
	BRANCH=${GITHUB_REF#refs/heads/}
else
	echo "Could not determine branch name from $GITHUB_REF"
	exit 1
fi

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
	FORCE_COMMIT=
	if git clone --branch="$BRANCH" --depth 1 "https://$API_TOKEN_GITHUB@github.com/$GIT_SLUG.git" "$CLONE_DIR"; then
		echo "::endgroup::"
	elif [[ "$BRANCH" != "master" ]] && rm -rf "$CLONE_DIR" && git clone --branch=master --depth 1 "https://$API_TOKEN_GITHUB@github.com/$GIT_SLUG.git" "$CLONE_DIR"; then
		(cd "$CLONE_DIR" && git checkout -b "$BRANCH")
		echo "::endgroup::"
		FORCE_COMMIT=--allow-empty
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

	# Delete all files in the target dir except .git
	find "$CLONE_DIR/." -maxdepth 1 ! \( -name .git -o -name . \) -exec rm -rf {} +

	# Copy standard .github
	cp -r "$BASE/.github/files/mirror-.github" "$CLONE_DIR/.github"

	# Copy only wanted files, based on .gitignore and .gitattributes.
	{
		# Include unignored files by default.
		git ls-files
		# Include ignored files that are tagged as production-include.
		git ls-files --others --ignored --exclude-standard | git check-attr --stdin production-include | sed -n 's/: production-include: \(unspecified\|unset\)$//;t;s/: production-include: .*//p'
	} |
		# Remove all files tagged with production-exclude. This can override production-include.
		git check-attr --stdin production-exclude | sed -n 's/: production-exclude: \(unspecified\|unset\)$//p' |
		# Copy the resulting list of files into the clone.
		xargs cp --parents --target-directory="$CLONE_DIR"

	cd "$CLONE_DIR"

	# Before we commit any changes, ensure that the repo has the basics we need for any project
	if $COMPOSER_JSON_EXISTED && [[ ! -f "composer.json" ]]; then
		echo "::error::Changes to ${GIT_SLUG}} remove essential parts of the package. They will not be committed."
		EXIT=1
		continue
	fi

	if [[ -n "$FORCE_COMMIT" || -n "$(git status --porcelain)" ]]; then
		echo "Committing to $GIT_SLUG"
		git add -A
		if git commit --quiet $FORCE_COMMIT --author="${COMMIT_ORIGINAL_AUTHOR}" -m "${COMMIT_MESSAGE}" &&
			{ [[ -z "$CI" ]] || git push origin "$BRANCH"; } # Only do the actual push from the GitHub Action
		then
			echo "https://github.com/$GIT_SLUG/commit/$(git rev-parse HEAD)"
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
