# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2023-08-07
### Added
- AI Assistant: Add options parameter to request function on useAiSuggestions hook [#32198]
- AI Client: add @wordpress/compose dependency [#32228]
- AI Client: Add clear button in AI Control component [#32274]
- AI Client: Add keyboard shortcut to AIControl [#32239]
- AI Client: add onError() response support [#32223]
- AI Client: Export types [#32209]
- AI Client: Start supporting request options on requestSuggestion callback. [#32303]
- AI Control: introduce AiStatusIndicator component [#32258]

### Changed
- AI Client: complete/update/improve doc [#32311]
- AI Client: rename the prop name of the requesting state of the AiStatusIndicator component [#32279]

### Fixed
- AI Client: Fix wrong disabled state condition. [#32210]

## [0.1.1] - 2023-08-01
### Added
- Add AI Client icon components [#32079]
- AI Assistant: add function calling feature. [#32161]
- AI Client: add AI Assistant data context. [#32129]
- AI Client: add useAiContext() react hook. [#32145]
- AI Client: add useAiSuggestions() react custom hook. [#32022]
- AI Client: introduce AI Control component. [#32163]
- AI Client: introduce withAiDataProvider HOC. [#32142]

### Changed
- AI Client: add Icon suffix to icon components. [#32173]
- AI Client: handle properly passing the post_id parameter to endpoint. [#32104]
- AI Client: replace using CSS modules with the regular way. [#32171]

### Removed
- AI Client: remove unused image library [#32127]

## 0.1.0 - 2023-07-25
### Added
- Add Jetpack AI Client [#30855]
- AI Client: add askQuestion() lib [#31964]
- AI Client: export SuggestionsEventSource updated library [#31944]
- AI Client: update and expose JWT library [#31924]

### Changed
- AI Client: stop using smart document visibility handling on the fetchEventSource library, so it does not restart the completion when changing tabs. [#32004]
- Updated package dependencies. [#31468]
- Updated package dependencies. [#31659]
- Updated package dependencies. [#31785]

[0.1.2]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.0...v0.1.1
