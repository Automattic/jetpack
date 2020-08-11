#!/bin/bash

function run_packages_tests {
	echo "Running tests for all packages:"
	export PACKAGES='./packages/**'
	for PACKAGE in $PACKAGES
	do
		if [ -d "$PACKAGE" ]; then
			folder="$(basename $PACKAGE)"
			result="run_package_test $folder"

			if $result; then
				# Everything is fine
				:
			else
				exit 1
			fi
		fi
	done
}

function run_package_test {
	package=$1;

	if [ -f "./packages/$package/phpunit.xml.dist" ]; then
			echo "Running tests for package \`$package\` "
			cd "./packages/$package"
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


if [ -f "./packages/$1/phpunit.xml.dist"  ]; then
	run_package_test "$1"
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


