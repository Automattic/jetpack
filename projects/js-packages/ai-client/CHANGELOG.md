# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.14.4] - 2024-06-17
### Changed
- Updated package dependencies. [#37779]

## [0.14.3] - 2024-06-10
### Changed
- AI Featured Image: export generic image generation request function. [#37668]
- Change codebase to use clsx instead of classnames. [#37708]
- Updated package dependencies. [#37669]

## [0.14.2] - 2024-06-03
### Added
- AI Client: Add list-related fixes on MarkdownToHTML conversion. [#37564]
- Jetpack AI: Support upgrade links on the AI Control that will open on a new tab. [#37629]

## [0.14.1] - 2024-05-27
### Changed
- AI Client: Add paragraph tweaks to Markdown conversion libs. [#37461]
- AI Featured Image: add type info. [#37474]

## [0.14.0] - 2024-05-20
### Added
- AI Client: Expose HTML render rules type. [#37386]
- AI Featured Image: Support Stable Diffusion image generation. [#37413]

### Changed
- AI Client: Change default behavior of Message components [#37365]
- Updated package dependencies. [#37379] [#37380]

## [0.13.1] - 2024-05-13
### Added
- AI Client: Add className to AI Control component. [#37322]
- AI Client: Add "try again" prop on Extension AI Control. [#37250]

### Changed
- AI Client: Add event to upgrade handler function of Extension AI Control. [#37224]

## [0.13.0] - 2024-05-06
### Added
- AI Client: Add wrapper ref to AI Control. [#37145]
- AI Featured Image: Support custom user prompt on the image generation. [#37086]

### Changed
- Updated package dependencies. [#37147] [#37148] [#37160]

## [0.12.4] - 2024-04-29
### Added
- AI Client: Export ExtensionAIControl. [#37087]

## [0.12.3] - 2024-04-25
### Changed
- AI Client: Separate AIControl UI from block logic. [#36967]

## [0.12.2] - 2024-04-22
### Added
- AI Client: Add Markdown and HTML conversions. [#36906]

## [0.12.1] - 2024-04-15
### Added
- AI Client: Add callbacks, initial requesting state and change error handling. [#36869]

## [0.12.0] - 2024-04-08
### Added
- Add error rejection in image generation. [#36709]

### Changed
- Updated package dependencies. [#36756] [#36760] [#36761]

### Fixed
- AI Featured Image: handle posts longer than the limit of Dall-e generation prompt. [#36703]

## [0.11.0] - 2024-04-01
### Added
- AI Client: include prompt to generate featured image based on post content. [#36591]
- Support different responses in image hook [#36626]

### Fixed
- AI Client: fix a bug where quick prompts would not work after getting suggested content [#36651]
- AI Client: set request content type as JSON on image generation hook and use rectangular images instead of square images. [#36620]

## [0.10.1] - 2024-03-27
### Changed
- Updated package dependencies. [#36539, #36585]

## [0.10.0] - 2024-03-18
### Added
- Add image generator hook [#36415]

## [0.9.0] - 2024-03-12
### Changed
- Fix typescript errors [#35904]
- Updated package dependencies. [#36325]

### Fixed
- AI Client: Fix audio recording where WebM is not supported (iOS for example). [#36160]

## [0.8.2] - 2024-03-04
### Added
- AI Client: add audio validation hook. [#36043]
- Voice to Content: Close audio stream on hook destruction [#36086]

### Changed
- AI Client: change loading and error state handling on media recording hook. [#36001]
- AI Client: publish audio information on the validation success callback of the audio validation hook. [#36094]
- Updated package dependencies. [#36095]
- Updated package dependencies. [#36143]

### Fixed
- AI Client: fixed transcription request from P2 editor [#36081]

## [0.8.1] - 2024-02-27
### Changed
- AI Client: support audio transcription and transcription post-processing canceling. [#35923]

## [0.8.0] - 2024-02-26
### Added
- Add upgrade message for free tier [#35794]

### Changed
- Updated package dependencies. [#35793]
- Voice to Content: Add audio analyser to media recording hook [#35877]
- Voice to Content: Make transcriptions cancelable and add onProcess callback [#35737]

## [0.7.0] - 2024-02-19
### Added
- AI Client: add support for audio transcriptions. [#35691]
- AI Client: add support for transcription post-processing. [#35734]

### Changed
- AI Client: Update voice to content feature [#35698]
- Make build usable in projects using tsc with `moduleResolution` set to 'nodenext'. [#35453]
- Voice to Content: Add states and refactor duration calculation [#35717]

## [0.6.1] - 2024-02-13
### Changed
- Updated package dependencies. [#35608]

## [0.6.0] - 2024-02-05
### Added
- Jetpack AI: Support floating error messaging on the AI Control component. [#35322]

### Changed
- Updated package dependencies. [#35384]

## [0.5.1] - 2024-01-29
### Changed
- Update dependencies. [#35170]

## [0.5.0] - 2024-01-25
### Changed
- AI Control: Do not call onAccept from the discard handler. A fix has been put in place on #35236. [#35238]

## [0.4.1] - 2024-01-22
### Changed
- Update dependencies. [#35117]

## [0.4.0] - 2024-01-15
### Added
- AI Client: introduce bannerComponent prop, React.Element, to render on top of the AI Control [#34918]

### Fixed
- Jetpack AI: Check for post id type and only include numbers [#34974]

## [0.3.1] - 2024-01-04
### Changed
- Updated package dependencies. [#34815]

## [0.3.0] - 2023-12-20
### Changed
- AI Client: improved usability with new block positioning, prompt and suggestion action buttons. [#34383]
- Updated package dependencies. [#34696]

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

[0.14.4]: https://github.com/Automattic/jetpack-ai-client/compare/v0.14.3...v0.14.4
[0.14.3]: https://github.com/Automattic/jetpack-ai-client/compare/v0.14.2...v0.14.3
[0.14.2]: https://github.com/Automattic/jetpack-ai-client/compare/v0.14.1...v0.14.2
[0.14.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.14.0...v0.14.1
[0.14.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.13.1...v0.14.0
[0.13.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.12.4...v0.13.0
[0.12.4]: https://github.com/Automattic/jetpack-ai-client/compare/v0.12.3...v0.12.4
[0.12.3]: https://github.com/Automattic/jetpack-ai-client/compare/v0.12.2...v0.12.3
[0.12.2]: https://github.com/Automattic/jetpack-ai-client/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.8.2...v0.9.0
[0.8.2]: https://github.com/Automattic/jetpack-ai-client/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.2.1...v0.3.0
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
