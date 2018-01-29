#!/bin/bash
# This script can build a new set of release branches, or update an existing release branch.
# It doesn't care which branch you're currently standing on.
#
# Building a new set of release branches: "new" | "-n"
# It takes a parameter "new", which should only be used when preparing a new major release (x.x), not a point release.
#
# The "new" parameter will request a version number. It should be the version format "x.x" (example 4.9)
# It will then create a new (unbuilt) branch with the specific naming convention of "branch-x.x", and push it to the repo.
# It will also create another (built) branch with the specific naming convention of "branch-x.x-built",
#   push it to the repo, and build a production version to it.
#
# Updating an existing built branch: "update" | "-u"
# The "update" parameter will request an existing branch name to build to.
# It will then build Jetpack and commit to that target branch.

# Exit the build in scary red text if error
function exit_build {
    echo -e "${RED}Something went wrong and the build has stopped.  See error above for more details."
    exit 1
}
trap 'exit_build' ERR

# Instructions
function usage {
    echo "usage: $0 [-n new] [-u update <branchname>]"
    echo "  -n      Create new release branches"
    echo "  -u      Update existing release built branch"
    echo "          Can take an extra param that refers to an existing branch."
    echo "          Example: $0 -u master-stable"
    echo "  -h      help"
    exit 1
}

# This creates a new .gitignore file based on master, but removes the items we need for release builds
function create_release_gitignore {
    # Copy .gitignore to temp file
    mv .gitignore .gitignore-tmp

    # Create empty .gitignore
    touch .gitignore

    # Add things to the new .gitignore file, stopping at the things we want to keep.
    while IFS='' read -r line || [[ -n "$line" ]]
    do
        if [ "$line" == "## Things we will need in release branches" ]
        then
            break
        fi
        echo "$line" >> .gitignore
    done < ".gitignore-tmp"

    # Add custom stuff to .gitignore release
    echo "/_inc/client" >> .gitignore

    # Remove old .gitignore
    rm .gitignore-tmp

    git commit .gitignore -m "updated .gitignore"
}

# Remove stuff from .svnignore for releases
function modify_svnignore {
    awk '!/.eslintrc/' .svnignore > temp && mv temp .svnignore
    awk '!/.eslintignore/' .svnignore > temp && mv temp .svnignore
    git commit .svnignore -m "Updated .svnignore"
}

# This function will create a new set of release branches.
# The branch formats will be branch-x.x (unbuilt version) and branch-x-x-built (built)
# These branches will be created off of master.
function create_new_release_branches {

    # Prompt for version number.
    read -p "What version are you releasing? Please write in x.x syntax. Example: 4.9 - " version

    # Declare the new branch names.
    NEW_UNBUILT_BRANCH="branch-$version"
    NEW_BUILT_BRANCH="branch-$version-built"

    # Check if branch already exists, if not, create new branch named "branch-x.x"
    if [[ -n $( git branch -r | grep "$NEW_UNBUILT_BRANCH" ) ]];
    then
        echo "$NEW_UNBUILT_BRANCH already exists.  Exiting..."
        exit 1
    else
        echo ""
        echo "Creating new unbuilt branch $NEW_UNBUILT_BRANCH from current master branch..."
        echo ""
        # reset --hard to remote master in case they have local commits in their repo
        git checkout master && git pull && git reset --hard origin/master

        # Create new branch, push to repo
        git checkout -b $NEW_UNBUILT_BRANCH

        git push -u origin $NEW_UNBUILT_BRANCH
        echo ""
        echo "$NEW_UNBUILT_BRANCH created."
        echo ""
        # Verify you want a built version
        read -n1 -p "Would you like to create a built version of $NEW_UNBUILT_BRANCH as new $NEW_BUILT_BRANCH? [y/N]" reply
        if [[ 'y' == $reply || 'Y' == $reply ]]
        then
            # make sure we're still checked out on the right branch
            git checkout $NEW_UNBUILT_BRANCH

            git checkout -b $NEW_BUILT_BRANCH

            # New .gitignore for release branches
            echo ""
            echo "Creating new .gitignore"
            echo ""
            create_release_gitignore

            # Remove stuff from svnignore
            modify_svnignore

            git checkout $NEW_UNBUILT_BRANCH

            git push -u origin $NEW_BUILT_BRANCH

            # Script will continue on to actually build the plugin onto this new branch...
        else
            # Nothing left to do...
            echo ""
            echo "Ok, all done then."
            exit 1
        fi
    fi
}

# Script parameter, what do you want to do?
# Expected to be "-n", "new", "-u", or "update"
COMMAND=$1

# Current directory and current branch vars
DIR=$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" )
CURRENT_BRANCH=$( git branch | grep -e "^*" | cut -d' ' -f 2 )

TMP_REMOTE_BUILT_VERSION="/tmp/jetpack"
TMP_LOCAL_BUILT_VERSION="/tmp/jetpack2"

# Make sure we don't have uncommitted changes.
if [[ -n $( git status -s --porcelain ) ]]; then
 	echo "Uncommitted changes found."
 	echo "Please deal with them and try again clean."
    exit 1
fi

# Check the command
if [[ 'new' == $COMMAND || '-n' == $COMMAND ]]
then
    create_new_release_branches
elif [[ 'update' = $COMMAND || '-u' = $COMMAND ]]
then
    # It's possible they passed the branch name directly to the script
    if [[ -z $2 ]]
    then
        read -p "What branch are you updating? (enter full branch name): " branch
        UPDATE_BUILT_BRANCH=$branch
    else
        UPDATE_BUILT_BRANCH=$2
    fi
else
    usage
fi


# Cast the branch name that we'll be building to a single var.
if [[ -n $NEW_BUILT_BRANCH ]]
then
    BUILD_TARGET=$NEW_BUILT_BRANCH
elif [[ -n $UPDATE_BUILT_BRANCH ]]
then
    BUILD_TARGET=$UPDATE_BUILT_BRANCH
else
    echo ""
    echo "No target branch specified.  How did you make it this far?"
    exit 1
fi

### This bit is the engine that will build a branch and push to another one ####

# Make sure we're trying to deploy something that exists.
if [[ -z $( git branch -r | grep "$BUILD_TARGET" ) ]]; then
    echo "Branch $BUILD_TARGET not found in git repository."
    echo ""
    exit 1
fi

read -p "You are about to deploy a new production build to the $BUILD_TARGET branch from the $CURRENT_BRANCH branch. Are you sure? [y/N]" -n 1 -r
if [[ $REPLY != "y" && $REPLY != "Y" ]]
then
    exit 1
fi
echo ""

echo "Building Jetpack"

# Checking for yarn
hash yarn 2>/dev/null || {
    echo >&2 "This script requires you to have yarn package manager installed."
    echo >&2 "Please install it following the instructions on https://yarnpkg.com. Aborting.";
    exit 1;
}

# Start clean by removing previously installed dependencies and built files
yarn run distclean
yarn run clean-client
# Clean yarn's cache
yarn cache clean
# Install dependencies
yarn
# Build the Admin Page
NODE_ENV=production yarn run build-client
echo "Done"

# Prep a home to drop our new files in. Just make it in /tmp so we can start fresh each time.
rm -rf TMP_REMOTE_BUILT_VERSION
rm -rf TMP_LOCAL_BUILT_VERSION

echo "Rsync'ing everything over from Git except for .git and npm stuffs."
rsync -r --exclude='*.git*' --exclude=node_modules $DIR/* TMP_LOCAL_BUILT_VERSION
echo "Done!"

echo "Purging paths included in .svnignore"
# check .svnignore
for file in $( cat "$DIR/.svnignore" 2>/dev/null ); do
	# We want to commit changes to to-test.md as well as the testing tips.
	if [[ $file == "to-test.md" || $file == "docs/testing/testing-tips.md" ]]
    then
		continue;
	fi
	rm -rf TMP_LOCAL_BUILT_VERSION/$file
done
echo "Done!"

echo "Pulling latest from $BUILD_TARGET branch"
git clone --depth 1 -b $BUILD_TARGET --single-branch git@github.com:Automattic/jetpack.git TMP_REMOTE_BUILT_VERSION
echo "Done!"

echo "Rsync'ing everything over remote version"
rsync -r --delete TMP_LOCAL_BUILT_VERSION/* TMP_REMOTE_BUILT_VERSION
echo "Done!"

cd TMP_REMOTE_BUILT_VERSION

echo "Finally, Committing and Pushing"
git add .
git commit -am 'New build'
git push origin $BUILD_TARGET
echo "Done! Branch $BUILD_TARGET has been updated."

echo "Cleaning up the mess"
cd $DIR
rm -rf TMP_REMOTE_BUILT_VERSION
rm -rf TMP_LOCAL_BUILT_VERSION
echo "All clean!"
