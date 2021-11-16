# Automattic\Jetpack\Changelog\KeepAChangelogParser test fixture file

## Changelog file
  ~~~~~~~~markdown changelog
  # Changelog

  ## 1.0.0 - 2021-02-21

  - Lazy continuation is not supported.
  Markdown would consider this line as part of the bullet, but we'll consider it an epilogue.

  ~~~~~~~~

## Changelog object
  ~~~~~~~~json object
  {
      "__class__": "Automattic\\Jetpack\\Changelog\\Changelog",
      "prologue": "# Changelog",
      "epilogue": "",
      "entries": [
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.0",
              "link": null,
              "timestamp": "2021-02-21T00:00:00+0000",
              "prologue": "",
              "epilogue": "Markdown would consider this line as part of the bullet, but we'll consider it an epilogue.\n",
              "changes": [
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-21T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": "Lazy continuation is not supported."
                  }
              ]
          }
      ]
  }
  ~~~~~~~~

## Expected output from `format()`
  ~~~~~~~~markdown format-output
  # Changelog

  ## 1.0.0 - 2021-02-21

  - Lazy continuation is not supported.

  Markdown would consider this line as part of the bullet, but we'll consider it an epilogue.

  ~~~~~~~~
