# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.0.0 - 2026-05-13
### Security
- Rsync: Make it harder for a host-system attacker to attack the rsync proxy. [#47736]

### Added
- Add composer command for running Composer in the monorepo root or a specific project. [#47201]
- Add pnpm command for running pnpm in the monorepo root or a specific project. [#47201]
- Add SSH proxy support for rsync to enable Secure Enclave SSH keys that cannot be forwarded into Docker. [#46867]

### Changed
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Make it explicit that this package has no JS exports by setting `exports` in package.json. [#47283]
- Remove Docker auto-install wrapper for worktrees; husky hooks now use pnpm exec for automatic dependency installation via verifyDepsBeforeRun. [#47354]
- Set `.repository.url` in `package.json` to the mirror repo rather than the monorepo. Required for enabling provenance. [#47149]
- Update legacy Node calls. [#47770]

## 1.1.1 - 2026-02-13
### Fixed
- Git hooks: Resolve hooks directory correctly in Git worktrees. [#47037]

## 1.1.0 - 2026-01-12
### Added
- Add jp init-hooks and jp git-hook commands to run git hooks in Docker container.

### Changed
- Display alpha version number when running from monorepo source to indicate development build.

## 1.0.3 - 2026-01-12
### Changed
- Internal updates.

## 1.0.2 - 2025-09-08
### Changed
- Internal updates.

## 1.0.1 - 2025-05-13
### Changed
- Update dependencies. [#42002]

### Fixed
- Append to existing .env file instead of overwriting it. [#42623]

## 1.0.0 - 2025-01-15
### Added
- Initial version.
