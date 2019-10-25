#!/bin/bash

# This is meant to run only if PHP files have been staged. It'll fatal as of now if phpcs-changed can't find php files in the diff.
function phpcschanged {
  # We need three files for phpcs-changed.
  # 1. A file of the combined diff.
  # 2. A file of the phpcs results for the original files.
  # 3. A file of the phpcs results for the revised files.

  # Make a folder for the files.
  mkdir /tmp/jetpack-phpcschanged
  mkdir /tmp/jetpack-phpcschanged/original

  # File 1
  git diff --cached > /tmp/jetpack-phpcschanged/diff.diff

  # File 2. This one is a bit fun to make.

  for file in $( git diff --name-only --cached ); do
	  mkdir -p /tmp/jetpack-phpcschanged/original/$(dirname ${file} ) > /dev/null 2>&1
	  git cat-file -p HEAD:${file} > /tmp/jetpack-phpcschanged/original/${file}
  done

  vendor/bin/phpcs --report=json /tmp/jetpack-phpcschanged/original > /tmp/jetpack-phpcschanged/phpcs-orig.json

  # File 3
  vendor/bin/phpcs --report=json $(git diff --name-only --cached) > /tmp/jetpack-phpcschanged/phpcs-new.json

  # Run the actual change tool!
  vendor/bin/phpcs-changed --diff /tmp/jetpack-phpcschanged/diff.diff --phpcs-orig /tmp/jetpack-phpcschanged/phpcs-orig.json --phpcs-new /tmp/jetpack-phpcschanged/phpcs-new.json

  # Clean up! Clean up! Everybody, everywhere! Clean up! Clean up! Everybody do their share.
 rm -rf /tmp/jetpack-phpcschanged
}

phpcschanged
