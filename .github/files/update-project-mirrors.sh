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

yarn_build()
{
	if [[ -f "package.json" ]]; then
		yarn install
		yarn build-production-concurrently
	fi
}

# Halt on error
set -eo pipefail

if [[ -n "$CI" ]]; then
	git_setup
fi

# Install Yarn generally.
yarn install

BASE=$(pwd)
CLONE_BASE=$(mktemp -d "${TMPDIR:-/tmp}/jetpack-update-project-mirrors.XXXXXXXX")
MONOREPO_COMMIT_MESSAGE=$(git show -s --format=%B $GITHUB_SHA)
COMMIT_MESSAGE=$( echo "${MONOREPO_COMMIT_MESSAGE}\n\nCommitted via a GitHub action: https://github.com/automattic/jetpack/runs/${GITHUB_RUN_ID}" )
COMMIT_ORIGINAL_AUTHOR="${GITHUB_ACTOR} <${GITHUB_ACTOR}@users.noreply.github.com>"

echo "Cloning projects and pushing to Automattic mirror repos"

# sync to read-only clones
for project in projects/packages/* projects/plugins/*; do
	[[ -d "$project" ]] || continue # We are only interested in directories (i.e. projects)

	# Only keep the project's name
	NAME=${project##*/}

	PROJECT_DIR="${BASE}/${project}"

	cd "${PROJECT_DIR}"

	echo " Name: $NAME"

	CLONE_DIR="${CLONE_BASE}/${NAME}"
	echo "  Clone dir: $CLONE_DIR"

	if [[ "$NAME" == 'jetpack' ]]; then
		GIT_SLUG='Automattic/jetpack-production'
	else
		GIT_SLUG="Automattic/jetpack-${NAME}";
	fi
	# Check if a remote exists for that project.
	$( git ls-remote --exit-code -h "https://github.com/${GIT_SLUG}.git" >/dev/null 2>&1 ) || continue
	echo "  ${NAME} exists. Let's clone it."

	# clone, delete files in the clone, and copy (new) files over
	# this handles file deletions, additions, and changes seamlessly
	git clone --depth 1 https://$API_TOKEN_GITHUB@github.com/$GIT_SLUG.git $CLONE_DIR

	echo "  Cloning of ${NAME} completed"
	echo "  Building project"
	yarn_build

	cd $CLONE_DIR

	# check if composer.json exists
	COMPOSER_JSON_EXISTED=false
	if [[ -f "composer.json" ]]; then
		COMPOSER_JSON_EXISTED=true
	fi

	find . | grep -v ".git" | grep -v "^\.*$" | xargs rm -rf # delete all files (to handle deletions in monorepo)

	echo "  Copying from ${PROJECT_DIR}/."

	cp -r "${PROJECT_DIR}/." .

	if [[ "$NAME" == 'jetpack' ]]; then
		./tools/prepare-build-branch.sh
	fi

	# Before we commit any changes, ensure that the repo has the basics we need for any project
	if $COMPOSER_JSON_EXISTED && [[ ! -f "composer.json" ]]; then
		echo "  Those changes remove essential parts of the project. They will not be committed."
	elif [[ -n "$(git status --porcelain)" ]]; then

		echo  "  Committing $NAME to $NAME's mirror repository"
		git add -A
		git commit --author="${COMMIT_ORIGINAL_AUTHOR}" -m "${COMMIT_MESSAGE}"
		if [[ -n "$CI" ]]; then # Only do the actual push from the GitHub Action
			git push origin master
		fi
		echo  "  Completed $NAME"
	else
		echo "  No changes, skipping $NAME"
	fi

	cd "${BASE}"
done
