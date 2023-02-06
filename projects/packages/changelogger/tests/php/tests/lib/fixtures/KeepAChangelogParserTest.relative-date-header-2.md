# Automattic\Jetpack\Changelog\KeepAChangelogParser test fixture file

## Changelog file
  ~~~~~~~~markdown changelog
  ## 2.0 - now

  ~~~~~~~~

## Expected exception from `parse()`
  ~~~~~~~~text parse-exception
  InvalidArgumentException
  Heading has a relative timestamp: ## 2.0 - now
  ~~~~~~~~
