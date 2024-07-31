# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2024-07-29
### Added
- Adds a new component to fetch experiments specifically for authenticated users [#37999]
- Initial version. [#37910]
- Introduce the both the backend layer and frontend components for the ExPlat package. [#37958]

### Changed
- ExPlat: add condition to prevent fetching the experiment assignment if there's not anon id (meaning that Tracks is likely disabled) [#38327]
- Updated package dependencies. [#38132]
