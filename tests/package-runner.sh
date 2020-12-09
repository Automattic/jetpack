#!/bin/bash

# Set defaults.
CLEAN_LOCK=0 # Used to trigger if composer.lock and the vendor folder should be deleted.
PACKAGE='' # Used to store the package name passed in the args.

# This function fires if no package name is passed in the command line and will run all packages.
function run_packages_tests {
	echo "Running tests for all packages:"
	export PACKAGES='./packages/**'
	for P in $PACKAGES
	do
		if [ -d "$P" ]; then
			folder="$(basename $P)"
			result="run_package_test $folder"

			if $result; then
				# Everything is fine
				:
			else
				exit 1
			fi
		fi
	done
	exit 0
}

# This function runs a particular package.
function run_package_test {
	package=$1;

	if [ -f "./packages/$package/phpunit.xml.dist" ]; then
			echo "Running tests for package \`$package\` "
			cd "./packages/$package"
			if [ 1 == $CLEAN_LOCK ]; then
				rm composer.lock
				rm -rf vendor
			fi
			composer install
			cd "../.."
			result="yarn docker:compose exec wordpress phpunit --configuration=/var/www/html/wp-content/plugins/jetpack/packages/$package/phpunit.xml.dist"
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

for arg in "$@"
do
	case $arg in
		-c|--clean-lock)
			CLEAN_LOCK=1
			shift
			;;
		*)
			PACKAGE="$1"
			shift
			;;
	esac
done



if [ -f "./packages/$PACKAGE/phpunit.xml.dist"  ]; then
	run_package_test "$PACKAGE"
else
	echo "You did not specify a package. Running all of them can take a good amount of time."
	echo "Do you wish to run tests for all packages?"
	select yn in Yes No; do
	case $yn in
		Yes) run_packages_tests;;
		No) exit;;
	esac
	done
fi


