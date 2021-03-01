# Automattic\Jetpack\Changelog\KeepAChangelogParser test fixture file

## Changelog file
  ~~~~~~~~markdown changelog
  This file intentionally uses CRLF newlines, and contains tabs.
  	X	X
  X	X	X
  XX	X	X
  XXX	X	X
  XXXX	X	X
  XXXXX	X	X
  XXXXX	XX	X
  XXXXX	XXX	X
  XXXXX	XXXX	X
  XXXXX	XXXXX	X
  
  ## 1.0 - 2021-02-18
  
  - Some text.
  	And some more text.
  - This one has a CR  without LF in the middle.
  
  ~~~~~~~~

## Expected output from `parse()`
  ~~~~~~~~json parse-output
  {
      "__class__": "Automattic\\Jetpack\\Changelog\\Changelog",
      "prologue": "This file intentionally uses CRLF newlines, and contains tabs.\n    X   X\nX   X   X\nXX  X   X\nXXX X   X\nXXXX    X   X\nXXXXX   X   X\nXXXXX   XX  X\nXXXXX   XXX X\nXXXXX   XXXX    X\nXXXXX   XXXXX   X",
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
                      "content": "Some text.\n  And some more text."
                  },
                  {
                      "__class__": "Automattic\\Jetpack\\Changelog\\ChangeEntry",
                      "significance": null,
                      "timestamp": "2021-02-18T00:00:00+0000",
                      "subheading": "",
                      "author": "",
                      "content": "This one has a CR\nwithout LF in the middle."
                  }
              ]
          }
      ]
  }
  ~~~~~~~~
