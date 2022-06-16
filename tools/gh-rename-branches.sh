#!/usr/bin/env bash

set -eo pipefail

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)

echo "This script is set to rename the default branch only on test repositories by default. Please open the file and \
insert the correct variable name - REPOSITORIES - in the for loop to run the rename script."
echo -e "If the default branch is not master and no master branch exists, \
no renaming will happen in that particular repository. \n"

echo -e "\033[1mWhat is your GitHub personal access token?\033[0m See here for more: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token >"

read -s -r usertoken

TESTREPOSITORIES=(jetpack-google-analytics-helper jptest-tools jetpack-gh-testing)

# REPOSITORIES=(jetpack-changelogger remove-asset-webpack-plugin jetpack-compat babel-plugin-replace-textdomain \
# i18n-loader-webpack-plugin i18n-check-webpack-plugin jetpack-config action-push-to-mirrors action-pr-is-up-to-date \
# eslint-changed eslint-config-target-es jetpack-analyzer jetpack-always-use-jetpack-open-graph jetpack-error \
# jetpack-shared-extension-utils jetpack-debug-helper jetpack-base-styles jetpack-waf jetpack-a8c-mc-stats \
# jetpack-autoloader jetpack-logo jetpack-device-detection jetpack-roles ignorefile jetpack-google-fonts-provider \
# jetpack-constants jetpack-composer-plugin jetpack-admin-ui jetpack-password-checker jetpack-blocks jetpack-codesniffer \
# action-required-review action-repo-gardening vaultpress jetpack-beta jetpack-plugins-installer jetpack-status \
# jetpack-redirect jetpack-assets jetpack-post-list jetpack-connection jetpack-lazy-images jetpack-tracking \
# jetpack-heartbeat jetpack-options jetpack-licensing jetpack-abtest jetpack-partner jetpack-publicize \
# jetpack-identity-crisis jetpack-wordads jetpack-jitm jetpack-sync jetpack-my-jetpack jetpack-connection-ui \
# jetpack-search jetpack-starter-plugin jetpack-protect-plugin jetpack-search-plugin jetpack-backup \
# jetpack-boost-production jetpack-backup-plugin jetpack-storybook jetpack-production jetpack-social-plugin \
# jetpack-publicize-components)


# Renaming the default branch in a list of given repositories, using CURL

for REPOSITORY in "${TESTREPOSITORIES[@]}"; do
        echo "Renaming master to trunk on ${REPOSITORY}"

        curl \
                -X POST \
                -H "Authorization: token ${usertoken}"  \
                --fail "https://api.github.com/repos/Automattic/${REPOSITORY}/branches/master/rename" \
                -d '{"new_name":"trunk"}'
done

echo "Script execution complete"

# Renaming the default branch in a list of given repositories, using GitHub CLI

# for REPOSITORY in "${TESTREPOSITORIES[@]}"; do
#         echo "Renaming master to trunk on ${REPOSITORY}"

#         gh api \
#                 --method POST \
#                 -H "Accept: application/vnd.github.v3+json" \
#                 "/repos/Automattic/${REPOSITORY}/branches/master/rename" \
#                 -f new_name='trunk'
# done

# echo "Script execution complete"


# For testing - this will share the default branch for each of the repositories in the
# repository list given. Replace REPOSITORIES with the correct repository list variable name.
# Uncomment below lines to test.

# for REPOSITORY in "${TESTREPOSITORIES[@]}"; do
#         echo "The default branch on ${REPOSITORY} is:"

#         curl \
#                 -H "Authorization: token ${usertoken}"  \
#                 -s --fail "https://api.github.com/repos/Automattic/${REPOSITORY}" | jq -r ".default_branch"
# done
