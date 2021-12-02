# Automattic\Jetpack\Changelog\KeepAChangelogParser test fixture file

## Changelog file
  ~~~~~~~~markdown changelog
  ## [1.0] - 2021-02-18

  - Stuff.

  ~~~~~~~~

## Expected exception from `parse()`
  ~~~~~~~~text parse-exception
  InvalidArgumentException
  Heading seems to have a linked version, but link was not found: ## [1.0] - 2021-02-18
  ~~~~~~~~
