# Automattic\Jetpack\Changelog\KeepAChangelogParser test fixture file

## Changelog file
  ~~~~~~~~markdown changelog
  # Changelog
  Prologue text for the changelog as a whole.

  ## [1.0.1] - 2021-02-18

  Prologue text for version 1.0.1.

  ### Changed
  - Stuff.
    Stuff.
    Stuff.
  - And more stuff.
    - This.
    - That.

  ### Fixed
  - A typo. (me)

  Epilogue text.

  ## 1.0.0-alpha - unreleased

  ## [1.0.0] - 2021-02-17

  - Initial release.

  ### Added
  - Everything.
    And then some.

  [1.0.1]: https://example.org/1.0.1
  [1.0.0]: https://example.org/1.0.0

  ~~~~~~~~

## Changelog object
  ~~~~~~~~json object
  {
      "__class__": "Automattic\\Jetpack\\Changelog\\Changelog",
      "prologue": "# Changelog\nPrologue text for the changelog as a whole.",
      "epilogue": "",
      "entries": [
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.1",
              "link": "https://example.org/1.0.1",
              "timestamp": "2021-02-18T00:00:00+0000",
              "prologue": "Prologue text for version 1.0.1.",
              "epilogue": "Epilogue text.\n",
              "changes": [
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-18T00:00:00+0000",
                      "subheading": "Changed",
                      "author": "",
                      "content": "Stuff.\nStuff.\nStuff."
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-18T00:00:00+0000",
                      "subheading": "Changed",
                      "author": "",
                      "content": "And more stuff.\n- This.\n- That."
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-18T00:00:00+0000",
                      "subheading": "Fixed",
                      "author": "",
                      "content": "A typo. (me)"
                  }
              ]
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.0-alpha",
              "link": null,
              "timestamp": null,
              "prologue": "",
              "epilogue": "",
              "changes": []
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.0",
              "link": "https://example.org/1.0.0",
              "timestamp": "2021-02-17T00:00:00+0000",
              "prologue": "",
              "epilogue": "",
              "changes": [
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-17T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": "Initial release."
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-17T00:00:00+0000",
                      "subheading": "Added",
                      "author": "",
                      "content": "Everything.\nAnd then some."
                  }
              ]
          }
      ]
  }
  ~~~~~~~~
