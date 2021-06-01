# Automattic\Jetpack\Changelog\KeepAChangelogParser test fixture file

## Changelog object
  ~~~~~~~~json object
  {
      "__class__": "Automattic\\Jetpack\\Changelog\\Changelog",
      "prologue": "",
      "epilogue": "",
      "entries": [
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.4",
              "link": null,
              "timestamp": "2021-03-30T00:00:00+0000",
              "prologue": "Only headings H1 and H3 have content, H2 should not appear.",
              "epilogue": "",
              "changes": [
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-03-30T00:00:00+0000",
                      "subheading": "H1",
                      "author": "",
                      "content": "A."
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-03-30T00:00:00+0000",
                      "subheading": "H2",
                      "author": "",
                      "content": ""
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-03-30T00:00:00+0000",
                      "subheading": "H3",
                      "author": "",
                      "content": "B."
                  }
              ]
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.3",
              "link": null,
              "timestamp": "2021-02-23T00:00:00+0000",
              "prologue": "Only heading H1 has content, H2 should not appear.",
              "epilogue": "",
              "changes": [
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "H1",
                      "author": "",
                      "content": ""
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "H1",
                      "author": "",
                      "content": "A."
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "H1",
                      "author": "",
                      "content": ""
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "H2",
                      "author": "",
                      "content": ""
                  }
              ]
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.2",
              "link": null,
              "timestamp": "2021-02-23T00:00:00+0000",
              "prologue": "A mix of empty and non-empty changes.",
              "epilogue": "",
              "changes": [
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": ""
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": "A."
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": ""
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": "B."
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": ""
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": "C."
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": ""
                  }
              ]
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.1",
              "link": null,
              "timestamp": "2021-02-23T00:00:00+0000",
              "prologue": "Only empty changes.",
              "epilogue": "",
              "changes": [
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-23T00:00:00+0000",
                      "subheading": "HHH",
                      "author": "XXX",
                      "content": ""
                  }
              ]
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.0",
              "link": null,
              "timestamp": "2021-02-23T00:00:00+0000",
              "prologue": "No changes at all.",
              "epilogue": "",
              "changes": []
          }
      ]
  }
  ~~~~~~~~

## Expected output from `format()`
  ~~~~~~~~markdown format-output
  ## 1.0.4 - 2021-03-30

  Only headings H1 and H3 have content, H2 should not appear.

  ### H1
  - A.

  ### H3
  - B.

  ## 1.0.3 - 2021-02-23

  Only heading H1 has content, H2 should not appear.

  ### H1
  - A.

  ## 1.0.2 - 2021-02-23

  A mix of empty and non-empty changes.

  - A.
  - B.
  - C.

  ## 1.0.1 - 2021-02-23

  Only empty changes.

  ## 1.0.0 - 2021-02-23

  No changes at all.

  ~~~~~~~~
