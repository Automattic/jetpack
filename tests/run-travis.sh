#!/bin/bash

function run_cmd {
	echo "Running command \`$@\`"

	if $@; then
		# Everything is fine
		:
	else
		exit 1
	fi
}
function run_packages_tests {
	echo "Running \`$WP_TRAVISCI\` for Packages:"
	export WP_TRAVISCI_PACKAGES="composer phpunit"
	export PACKAGES='./packages/**/tests/php'
	for PACKAGE in $PACKAGES
	do
		if [ -d "$PACKAGE" ]; then
			cd "$PACKAGE/../.."
			export NAME=$(basename $(pwd))

			if [ ! -e tests/php/travis-can-run.sh ] || tests/php/travis-can-run.sh; then
				echo "Running \`$WP_TRAVISCI_PACKAGES\` for package \`$NAME\` "

				if $WP_TRAVISCI_PACKAGES; then
					# Everything is fine
					:
				else
					exit 1
				fi
			fi
			cd ../..
		fi
	done
}

function print_build_info {
	echo
	echo "--------------------------------------------"
	echo "Running \`$WP_TRAVISCI\` with:"
	echo " - $(phpunit --version)"
	echo " - WordPress branch: $WP_BRANCH"
	if [ "master" == "$WP_BRANCH" ]; then
		echo " - Because WordPress is in master branch, will also attempt to test multisite."
	fi
	echo "--------------------------------------------"
	echo
}

function run_php_compatibility {
	if ./vendor/bin/phpcs -i | grep -q 'PHPCompatibilityWP'; then
		# PHPCompatibilityWP is installed
		:
	else
		echo "Skipping PHP:Compatibility checks, PHPCompatibilityWP is not installed (PHP is too old?)"
		return
	fi

	export PHPCOMP_EXEC="composer phpcs:compatibility ."
	export PHPCS_CHECK_EXEC="./vendor/bin/phpcs --version | grep -e PHP_CodeSniffer"
	echo "Running PHP:Compatibility checks:"
	echo "PHP Compatibility command: \`$PHPCOMP_EXEC\` "

	if $PHPCS_CHECK_EXEC; then
		# Everything is fine
		:
	else
		exit 1
	fi

	if $PHPCOMP_EXEC; then
		# Everything is fine
		:
	else
		exit 1
	fi
}

function run_coverage_tests {
	export PHPUNIT=$(which phpunit)
	export BACKEND_CMD="phpdbg -qrr $PHPUNIT --coverage-clover $GITHUB_WORKSPACE/coverage/backend-clover.xml"
	export LEGACY_SYNC_CMD="phpdbg -qrr $PHPUNIT --group=legacy-full-sync --coverage-clover $GITHUB_WORKSPACE/coverage/legacy-sync-clover.xml"
	export MULTISITE_CMD="phpdbg -qrr $PHPUNIT -c tests/php.multisite.xml --coverage-clover $GITHUB_WORKSPACE/coverage/multisite-clover.xml"

	print_build_info


	cd "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/jetpack"


	run_cmd $BACKEND_CMD
	export LEGACY_FULL_SYNC=1
	run_cmd $LEGACY_SYNC_CMD
	unset LEGACY_FULL_SYNC
	export WP_MULTISITE=1
	run_cmd $MULTISITE_CMD
	unset WP_MULTISITE


	echo "Running code coverage for packages:"
	export PACKAGES='./packages/**/tests/php'
	for PACKAGE in $PACKAGES
	do
		if [ -d "$PACKAGE" ]; then
			cd "$PACKAGE/../.."
			export NAME=$(basename $(pwd))
			composer install
			export PACKAGE_CMD="phpdbg -d memory_limit=2048M -d max_execution_time=900 -qrr ./vendor/bin/phpunit --coverage-clover $GITHUB_WORKSPACE/coverage/packages/$NAME-clover.xml"

			echo "Running \`$PACKAGE_CMD\` for package \`$NAME\` "
			run_cmd $PACKAGE_CMD
			cd ../..
		fi
	done


}

function run_parallel_lint {
	echo "Running PHP lint:"
	if ./bin/parallel-lint.sh; then
		# Everything is fine
		:
	else
		exit 1
	fi
}

echo "Travis CI command: $WP_TRAVISCI"

if [[ "$DO_COVERAGE" == "true" && -x "$(command -v phpdbg)" ]]; then
		run_coverage_tests
		exit 0
fi

if [ "$WP_TRAVISCI" == "phpunit" ]; then

	if [ "" != "$PHP_LINT" ]; then
		run_parallel_lint
	fi

	# Run package tests only for the latest WordPress branch, because the
	# tests are independent of the version.
	if [ "latest" == "$WP_BRANCH" ]; then
		run_packages_tests
	fi

	if [ "previous" == "$WP_BRANCH" ]; then
		run_php_compatibility
	fi


	# Run a external-html group tests
	if [ "$TRAVIS_EVENT_TYPE" == "cron" ]; then
		export WP_TRAVISCI="phpunit --group external-http"
	elif [[ "$TRAVIS_EVENT_TYPE" == "api" && ! -z $PHPUNIT_COMMAND_OVERRIDE ]]; then
		export WP_TRAVISCI="${PHPUNIT_COMMAND_OVERRIDE}"
	fi

  if [ "$LEGACY_FULL_SYNC" == "1" ]; then
    export WP_TRAVISCI="phpunit --group=legacy-full-sync"
  fi

	print_build_info

	# WP_BRANCH = master | latest | previous
	cd "/tmp/wordpress-$WP_BRANCH/src/wp-content/plugins/jetpack"

	if [ "$WP_BRANCH" == "master" ]; then
		# Test multi WP in addition to single, but only in master branch mode.
		if WP_MULTISITE=1 $WP_TRAVISCI -c tests/php.multisite.xml; then
			# Everything is fine
			:
		else
			exit 1
		fi
		:
	fi

	# Test single WP
	if $WP_TRAVISCI; then
		# Everything is fine
		:
	else
		exit 1
	fi

else
	# Run linter/tests
	if $WP_TRAVISCI; then
		# Everything is fine
		:
	else
		exit 1
	fi
fi

exit 0
