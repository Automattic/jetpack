# Automattic\Jetpack\Changelog\KeepAChangelogParser test fixture file

## Changelog file
  ~~~~~~~~markdown changelog
  ## 3.0 - 2021-02-18

  - Some text.

  Epilogue (3)?

  #### Lower-level headings are ok.

  # Even H1-level headings are ok, as stupid as that seems.

   ### Indented headings are ok too.

  ## 2.0 - 2021-02-18

  - Some text.

  Epilogue (2)?

  ### Nope.

  ~~~~~~~~

## Expected exception from `parse()`
  ~~~~~~~~text parse-exception
  InvalidArgumentException
  Malformatted changes list near "Epilogue (2)?"
  ~~~~~~~~
