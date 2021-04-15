# Automattic\Jetpack\Changelog\KeepAChangelogParser test fixture file

## Changelog file
  ~~~~~~~~markdown changelog
  # Changelog
  Prologue text for the changelog as a whole.

  ## [1.0.6] - 2021-02-07
  ## [1.0.5] - 2021-02-06
  ## [1.0.4] - 2021-02-05
  ## [1.0.3] - 2021-02-04
  ## [1.0.2] - 2021-02-03
  ## [1.0.1] - 2021-02-02
  ## [1.0.0] - 2021-02-01

  [1.0.1]: https://example.org/1.0.1
  [foo]: https://example.org/foo "F'o\"o"
  [1.0.2]:https://example.org/1.0.2  
  [bar]: https://example.org/bar 'Ba\'r'  
  [1.0.3]: https://example.org/1.0.3
  [baz]: https://example.org/baz (B\(a\)z)
  [1.0.4]: https://example.org/1.0.4
  [quux1]: https://example.org/quux "quux"
  [quux2]: https://example.org/quux 'quux'
  [quux3]: https://example.org/quux (quux)
  [1.0.5]: https://example.org/1.0.5
  [quux]: https://example.org/quux
  [1.0.0]: https://example.org/1.0.0
  [1.0.6]: https://example.org/1.0.6

  ~~~~~~~~

## Changelog object
  ~~~~~~~~json object
  {
      "__class__": "Automattic\\Jetpack\\Changelog\\Changelog",
      "prologue": "# Changelog\nPrologue text for the changelog as a whole.",
      "epilogue": "\n[foo]: https://example.org/foo \"F'o\\\"o\"\n[bar]: https://example.org/bar 'Ba\\'r'\n[baz]: https://example.org/baz (B\\(a\\)z)\n[quux1]: https://example.org/quux \"quux\"\n[quux2]: https://example.org/quux 'quux'\n[quux3]: https://example.org/quux (quux)\n[quux]: https://example.org/quux",
      "entries": [
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.6",
              "link": "https://example.org/1.0.6",
              "timestamp": "2021-02-07T00:00:00+0000",
              "prologue": "",
              "epilogue": "",
              "changes": []
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.5",
              "link": "https://example.org/1.0.5",
              "timestamp": "2021-02-06T00:00:00+0000",
              "prologue": "",
              "epilogue": "",
              "changes": []
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.4",
              "link": "https://example.org/1.0.4",
              "timestamp": "2021-02-05T00:00:00+0000",
              "prologue": "",
              "epilogue": "",
              "changes": []
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.3",
              "link": "https://example.org/1.0.3",
              "timestamp": "2021-02-04T00:00:00+0000",
              "prologue": "",
              "epilogue": "",
              "changes": []
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.2",
              "link": "https://example.org/1.0.2",
              "timestamp": "2021-02-03T00:00:00+0000",
              "prologue": "",
              "epilogue": "",
              "changes": []
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.1",
              "link": "https://example.org/1.0.1",
              "timestamp": "2021-02-02T00:00:00+0000",
              "prologue": "",
              "epilogue": "",
              "changes": []
          },
          {
              "__class__": "Automattic\\Jetpack\\Changelog\\ChangelogEntry",
              "version": "1.0.0",
              "link": "https://example.org/1.0.0",
              "timestamp": "2021-02-01T00:00:00+0000",
              "prologue": "",
              "epilogue": "",
              "changes": []
          }
      ]
  }
  ~~~~~~~~

## Expected output from `format()`
  ~~~~~~~~markdown format-output
  # Changelog
  Prologue text for the changelog as a whole.

  ## [1.0.6] - 2021-02-07

  ## [1.0.5] - 2021-02-06

  ## [1.0.4] - 2021-02-05

  ## [1.0.3] - 2021-02-04

  ## [1.0.2] - 2021-02-03

  ## [1.0.1] - 2021-02-02

  ## [1.0.0] - 2021-02-01

  [foo]: https://example.org/foo "F'o\"o"
  [bar]: https://example.org/bar 'Ba\'r'
  [baz]: https://example.org/baz (B\(a\)z)
  [quux1]: https://example.org/quux "quux"
  [quux2]: https://example.org/quux 'quux'
  [quux3]: https://example.org/quux (quux)
  [quux]: https://example.org/quux
  [1.0.6]: https://example.org/1.0.6
  [1.0.5]: https://example.org/1.0.5
  [1.0.4]: https://example.org/1.0.4
  [1.0.3]: https://example.org/1.0.3
  [1.0.2]: https://example.org/1.0.2
  [1.0.1]: https://example.org/1.0.1
  [1.0.0]: https://example.org/1.0.0

  ~~~~~~~~
