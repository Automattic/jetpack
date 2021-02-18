# Parser text fixture file

## Changelog file
  ~~~~~~~~markdown changelog
  ## 1.0 – 2021-02-18
  
  - Stuff.
  
  ~~~~~~~~

## Expected exception from `parse()`
  ~~~~~~~~text parse-exception
  InvalidArgumentException
  Invalid heading: ## 1.0 – 2021-02-18
  ~~~~~~~~
