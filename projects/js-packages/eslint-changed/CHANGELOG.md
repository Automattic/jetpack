# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.3] - 2022-07-06
### Changed
- Convert code to ESM. [#24626]
- Remove use of `pnpx` in preparation for pnpm 7.0. [#24210]
- Renaming `master` references to `trunk`. [#24712, #24661]
- Reorder JS imports for `import/order` eslint rule. [#24601]
- Updated package dependencies. [#24045]
- Use `jest` for tests. [#24626]

### Fixed
- Fix debug output. [#24819]
- Fix interaction of `--in-diff-only` (or lack thereof) and listing of files on the command line. [#24626]

## [2.0.2] - 2022-04-18
### Changed
- Update package.json metadata.

### Removed
- Removed eslint from devDependencies
- Remove unneeded dependency on `@babel/preset-react`.

## [2.0.1] - 2022-03-01
### Added
- Add a missing dependency.

### Changed
- General: update required node version to v16.13.2
- Updated package dependencies

### Fixed
- Update tests for eslint 8.8.0.

## [2.0.0] - 2021-12-07
### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- Run ESLint via its node API rather than shelling out, mainly because they dropped the static `getFormatter()` from the API in 8.0. This drops support for ESLint < 7.0.0.
- Updated package dependencies.
- Use Node 16.7.0 in tooling. This shouldn't change the behavior of the code itself.

### Fixed
- Fix tests for addition of `fatalErrorCount` in eslint 7.32.

## [1.0.1] - 2021-08-13
### Added
- Initial release as a project. Added tests.

### Changed
- Updated package dependencies
- Update node version requirement to 14.16.1

## 1.0.0 - unreleased

* Created as a tool within the monorepo.

[2.0.3]: https://github.com/Automattic/eslint-changed/compare/2.0.2...2.0.3
[2.0.2]: https://github.com/Automattic/eslint-changed/compare/2.0.1...2.0.2
[2.0.1]: https://github.com/Automattic/eslint-changed/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/Automattic/eslint-changed/compare/1.0.1...2.0.0
[1.0.1]: https://github.com/Automattic/eslint-changed/compare/1.0.0...1.0.1
