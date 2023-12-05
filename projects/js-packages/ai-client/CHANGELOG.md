# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2023-12-03
### Changed
- Updated the prompt shadow for a better sense of depth. [#34362]
- Updated package dependencies. [#34411] [#34427]

## [0.2.0] - 2023-11-20
### Changed
- Include built JavaScript code in addition to TypeScript. [#34118]

## [0.1.16] - 2023-11-14
### Changed
- Updated package dependencies. [#34093]

## [0.1.15] - 2023-11-13
### Changed
- Prevented dispatching the `done` event for JETPACK_AI_ERROR. [#34051]
- Ensured the unclear prompt error is dispatched only once per request. [#34025]

## [0.1.14] - 2023-11-03

## [0.1.13] - 2023-10-23
### Changed
- Updated package dependencies. [#33687]

### Removed
- AI Client: Remove obsolete blockListBlockWithAiDataProvider() HOC component. [#33726]

## [0.1.12] - 2023-10-16
### Changed
- Updated package dependencies. [#33584]

## [0.1.11] - 2023-10-10
### Changed
- Updated package dependencies. [#33428]

## [0.1.10] - 2023-09-28
### Added
- AI Client: Add keyboard shortcut text next to Stop action [#33271]

## [0.1.9] - 2023-09-25
### Added
- Export GuidelineMessage for use in other blocks. [#33180]

## [0.1.8] - 2023-09-19
### Added
- AI Client: Add support for the jetpack-ai role on the prompt messages. [#33052]
- AI Client: add `model` param to request helpers [#33083]
- AI Client: Emit specific error for large context error on SuggestionsEventSource [#33157]
- AI Client: Introduce blockListBlockWithAiDataProvider() function [#33025]

### Changed
- AI Client: Move showGuideLine to AIControl component props [#33084]

### Fixed
- AI Client: check media record ref of the useMediaRecording() hook before to remove the listeners [#33013]

## [0.1.7] - 2023-09-11
### Added
- AI Client: add and expose reset() from useAiSuggestions() hook [#32886]
- AI Client: introduce audio duration display component [#32825]

## [0.1.6] - 2023-09-04
### Added
- AI Client: add play and pause icons [#32788]
- AI Client: add player stop button icon [#32728]
- AI Client: create blob audio data. Introduce onDone() callback [#32791]
- AI Client: improve useMediaRecorder() timeslice recording option [#32805]
- AI Client: introduce useMediaRecording() hook [#32767]

### Changed
- AI Client: minor change in useMediaRecording() hook example [#32769]
- Updated package dependencies. [#32803]

### Removed
- Remove unnecessary files from mirror repo and published package. [#32674]

### Fixed
- AI Client: fix mic icon visual issue in Safari [#32787]

## [0.1.5] - 2023-08-28
### Added
- AI Client: add mic icon [#32665]

### Changed
- AI Assistant: Change messages to turn content optional and start supporting a context property. [#32495]
- AI Extension: Add showClearButton prop to AIControl component and fix names [#32682]
- AI Extension: Specify input background color [#32628]
- Updated package dependencies. [#32605]

## [0.1.4] - 2023-08-14
### Added
- AI Client: Add border-box in AIControl. [#32419]
- AI Client: Export AiStatusIndicator. [#32397]
- AI Client: Import base styles in the AI status indicator component. [#32396]
- AI Control: Forward ref to consumer. [#32400]
- AI Control: Import jetpack-base-styles. [#32376]

### Changed
- AI Client: Expose stopSuggestion function on useAiSuggestions hook so the consumer can stop a suggestion in the middle. [#32382]

### Removed
- AI Client: Remove redundant switch case [#32405]

## [0.1.3] - 2023-08-09
### Added
- AI Client: Introduce disabled prop in AI Control. [#32326]
- AI Control: Add guideline message. [#32358]

### Changed
- AI Client: handle token fetching errors by dispatching an event from the SuggestionsEventSource class. [#32350]
- AI Client: tweak layout and styles to make AI Control mobile friendly. [#32362]
- AI Control: clean up props. [#32360]
- Updated package dependencies. [#32166]

### Fixed
- AI Client: fix TS type definition issue [#32330]

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

[0.2.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.16...v0.2.0
[0.1.16]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.15...v0.1.16
[0.1.15]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.14...v0.1.15
[0.1.14]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.13...v0.1.14
[0.1.13]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.12...v0.1.13
[0.1.12]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.11...v0.1.12
[0.1.11]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.10...v0.1.11
[0.1.10]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.9...v0.1.10
[0.1.9]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.1.0...v0.1.1
