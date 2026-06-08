# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2026-06-08
### Added
- Add a Settings tab to the SEO admin page: site visibility (search-engine indexing + XML sitemap), post title structure, front-page description, and site verification. Saves through the existing /jetpack/v4/settings and core /wp/v2/settings REST endpoints — no new package endpoint. [#49256]
- Initialize SEO package under feature flag [#49203]
