# Automattic\Jetpack\Changelog\KeepAChangelogParser test fixture file

## Changelog file
  ~~~~~~~~markdown changelog
  ## 2.0 - 2021-02-30

  - That works, because PHP has no strict date parsing.

  ## 1.0 - 2021-02-30 A potato

  - That even works. "A" is parsed as a [military time zone](https://en.wikipedia.org/wiki/List_of_military_time_zones),
    and since PHP found that it happily ignores the "potato". Sigh.

  ## 0.1 - A potato

  - But that fails, it's detected as being relative.

  ~~~~~~~~

## Expected exception from `parse()`
  ~~~~~~~~text parse-exception
  InvalidArgumentException
  Heading has a relative timestamp: ## 0.1 - A potato
  ~~~~~~~~
