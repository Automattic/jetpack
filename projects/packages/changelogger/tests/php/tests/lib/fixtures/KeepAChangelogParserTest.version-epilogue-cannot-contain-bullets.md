# Automattic\Jetpack\Changelog\KeepAChangelogParser test fixture file

## Changelog file
  ~~~~~~~~markdown changelog
  ## 3.0 - 2021-02-18

  - Some text.

  Epilogue (3)?

  * This is ok, it's not the right kind of bullet.

  ## 2.0 - 2021-02-18

  - Some text.

  Epilogue (2)?

   - This is ok, it's not the right kind of bullet.

  ## 1.0 - 2021-02-18

  - Some text.

  Epilogue (1)?

  - Nope.

  ~~~~~~~~

## Expected exception from `parse()`
  ~~~~~~~~text parse-exception
  InvalidArgumentException
  Malformatted changes list near "Epilogue (1)?"
  ~~~~~~~~
