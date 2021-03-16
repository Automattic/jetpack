# Automattic\Jetpack\Changelog\KeepAChangelogParser test fixture file

## Constructor args
  ~~~~~~~~json args
  [
      {
          "bullet": " *",
          "dateFormat": "j F Y",
          "parseAuthors": true,
          "unreleased": "NOT RELEASED"
      }
  ]
  ~~~~~~~~

## Changelog file
  ~~~~~~~~markdown changelog
  ## 1.0 - 18 February 2021

   * Right bullet.
   * Another right bullet.
   * Who did this? (me)
   * Not an author: (me).

  ## 0.9 - NOT RELEASED

  * Wrong bullet.

  ## 0.8 - 2021-02-16

  - Wrong bullet.

  ~~~~~~~~

## Changelog object
  ~~~~~~~~json object
  {
      "__class__": "Automattic\\Jetpack\\Changelog\\Changelog",
      "prologue": "",
      "epilogue": "",
      "entries": [
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0",
              "link": null,
              "timestamp": "2021-02-18T00:00:00+0000",
              "prologue": "",
              "epilogue": "",
              "changes": [
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-18T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": "Right bullet."
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-18T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": "Another right bullet."
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-18T00:00:00+0000",
                      "subheading": "",
                      "author": "me",
                      "content": "Who did this?"
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-18T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": "Not an author: (me)."
                  }
              ]
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "0.9",
              "link": null,
              "timestamp": null,
              "prologue": "* Wrong bullet.",
              "epilogue": "",
              "changes": []
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "0.8",
              "link": null,
              "timestamp": "2021-02-16T00:00:00+0000",
              "prologue": "- Wrong bullet.",
              "epilogue": "",
              "changes": []
          }
      ]
  }
  ~~~~~~~~

## Expected output from `format()`
  ~~~~~~~~markdown format-output
  ## 1.0 - 18 February 2021

   * Right bullet.
   * Another right bullet.
   * Who did this? (me)
   * Not an author: (me).

  ## 0.9 - NOT RELEASED

  * Wrong bullet.

  ## 0.8 - 16 February 2021

  - Wrong bullet.

  ~~~~~~~~
