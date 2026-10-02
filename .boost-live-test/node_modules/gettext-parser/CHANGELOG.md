# Change Log

## [1.4.0] - 2018-02-19
- Fixed catastrophic backtracking vulnerability in line folding regex (thx @davisjam).
- Added sort option for PO compilation (thx @AlexMost).

## [1.3.0] - 2017-08-03
- Added line folding length option to `po.compile` (thx @SleepWalker).
- Updated code to use new buffer API.

## [1.2.2] - 2017-01-11
- Use semistandard coding style.
- Removed unreachable code (thx @jelly).
- Replace grunt with npm scripts.
- Replace jshint with eslint.

## [1.2.1] - 2016-11-26
- Fix typo in readme (thx @TimKam).
- New project maintainer.

## [1.2.0] - 2016-06-13
- Fix compilation of plurals when msgstr only contains one element (thx @maufl).
- Fix example in readme (thx @arthuralee).

## [1.1.2] - 2015-10-07
- Update dependencies.

## [1.1.1] - 2015-06-04
- Fixed hash table location value in compiled mo files

## [1.1.0] - 2015-01-21
- Added `po.createParseStream` method for parsing PO files from a Stream source
- Updated documentation

## [1.0.0] - 2015-01-21
- Bumped version to 1.0.0 to be compatible with semver
- Changed tests from nodeunit to mocha
- Unified code style in files and added jshint task to check it
- Added Grunt support to check style and run tests on `npm test`

## [0.2.0] - 2013-12-30
- Removed node-iconv dependency
- Fixed a global variable leak (`line` was not defined in `pocompiler._addPOString`)
- Some code maintenance (applied jshint rules, added "use strict" statements)
- Updated e-mail address in .travis.yml
- Added CHANGELOG file

[1.4.0]: https://github.com/smhg/gettext-parser/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/smhg/gettext-parser/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/smhg/gettext-parser/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/smhg/gettext-parser/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/smhg/gettext-parser/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/smhg/gettext-parser/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/smhg/gettext-parser/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/smhg/gettext-parser/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/smhg/gettext-parser/compare/v0.2.0...v1.0.0
[0.2.0]: https://github.com/smhg/gettext-parser/compare/v0.1.10...v0.2.0