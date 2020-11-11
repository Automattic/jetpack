#!/bin/bash

# Set defaults.
CLEAN_LOCK=0 # Used to trigger if composer.lock and the vendor folder should be deleted.
PACKAGE='' # Used to store the package name passed in the args.
COMMAND='' # Used to store the command requested. Valid: "help", "phpunit", "mutation"

## Add functions.
# This function fires if no package name is passed in the command line and will run all packages.
function run_packages_tests {
	command=$1;
	echo "Running $command for all packages:"
	export PACKAGES='./packages/**'
	for P in $PACKAGES
	do
		if [ -d "$P" ]; then
			folder="$(basename $P)"
			result="run_package_test $command $folder"

			if $result; then
				# Everything is fine
				:
			else
				exit 1
			fi
		fi
	done
	exit;
}

# This function runs a particular package.
function run_package_test {
	command=$1;
	package=$2;

	if [ -f "./packages/$package/phpunit.xml.dist" ]; then
			echo "Running $command for package \`$package\` "
			cd "./packages/$package"
			if [ 1 == $CLEAN_LOCK ]; then
				rm composer.lock
				rm -rf vendor
			fi
			composer install
			cd "../.."
			case $command in
				phpunit)
					result="yarn docker:compose exec wordpress phpunit --configuration=/var/www/html/wp-content/plugins/jetpack/packages/$package/phpunit.xml.dist"
					;;
				mutation)
					result="yarn docker:compose exec -w /var/www/html/wp-content/plugins/jetpack/packages/$package/ wordpress bash -c /usr/local/bin/infection"
					;;
				special) # This only exists to help for when we need to run a command on all packages.
					# Below is an example command.
					#echo "EXECUTING SPECIAL COMMAND!"
					#yarn docker:compose exec -w /var/www/html/wp-content/plugins/jetpack/packages/$package/ wordpress sed -i -e '$ainfection.json.dist export-ignore' .gitattributes
					result="echo Completed!" # Some kind of "result" is needed to prevent looping over the same package.
					;;
				*)
					echo "Unexpected command argument sent to run_package_test. Aborting."
					exit 1;
					;;
			esac
			if $result; then
				# Everything is fine
				:
			else
				exit 1
			fi
			else
				echo "There are no tests for $package."
		fi
}

# Displays usage information.
function display_usage {
	echo "This script is a runner for executing various tests on packages."
	echo "Usage: ./tests/package-runner.sh COMMAND [PACKAGE] [--clean-lock]"
	echo
	echo "COMMAND is one of the following:"
	echo "    phpunit  -- Runs the PHPUnit tests."
	echo "    mutation -- Runs PHP mutation testing."
	echo
	echo "PACKAGE is any composer package developed in the packages folder. The package should already have a valid phpunit.xml.dist file."
	echo
	echo "--clean-lock will delete the existing composer.lock file from the package to ensure up to date dependencies within that package."
}


# Actual execution logic.
if [ $# -lt 1 ]; then
        display_usage;
        exit 1
fi

for arg in "$@"
do
	case $arg in
		-c|--clean-lock)
			CLEAN_LOCK=1
			shift
			;;
	  --help|--usage)
	  	COMMAND="help"
	  	shift
	  	;;
		*)
			COMMAND="$1"
			PACKAGE="$2"
			;;
	esac
done

case $COMMAND in
	help)
		display_usage;
		exit;
	;;
	phpunit|mutation|special)
		if [ -f "./packages/$PACKAGE/phpunit.xml.dist"  ]; then
			run_package_test "$COMMAND" "$PACKAGE"
		else
			echo "You did not specify a package. Running all of them can take a long amount of time."
			echo "Do you wish to run tests for all packages?"
			select yn in Yes No; do
			case $yn in
				Yes) run_packages_tests "$COMMAND";;
				No) exit;;
			esac
		done
	fi
	;;
esac

exit;
