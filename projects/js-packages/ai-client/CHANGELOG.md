# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.26.3] - 2025-02-24
### Changed
- Update package dependencies. [#41955]

### Fixed
- Prevent Chrome AI requests from incrementing request count. [#41900]

## [0.26.2] - 2025-02-17
### Added
- Add translation support using Chrome's Gemini AI mini. [#41724]

## [0.26.1] - 2025-02-11
### Changed
- Update dependencies. [#38958]

## [0.26.0] - 2025-02-10
### Added
- Add shared components from ai-assistant-plugin [#41078]

### Changed
- Updated package dependencies. [#41491] [#41577]

## [0.25.7] - 2025-01-27
### Changed
- Internal updates.

## [0.25.6] - 2025-01-20
### Changed
- Updated package dependencies. [#41099]

## [0.25.5] - 2025-01-06
### Changed
- Updated package dependencies. [#40798] [#40810] [#40811] [#40841]

### Fixed
- AI Client: Add style parameter to first logo generator so it doesn't fall in a DALL-E situation. [#40807]
- Jetpack AI: Switch tracking data to camel_case to maintain Tracks' required property format. [#40774]

## [0.25.4] - 2024-12-30
### Added
- AI Client: Add thumbs feedback on AI Assistant. [#40728]

### Changed
- AI Client: Move prompt types and update thumbs feedback event. [#40746]

## [0.25.3] - 2024-12-23
### Added
- Jetpack AI: Add thumbs up/down component to AI logo generator. [#40610]

## [0.25.2] - 2024-12-16
### Changed
- Updated package dependencies. [#40564]

### Fixed
- Fixed lints following ESLint rule changes for TS. [#40584]

## [0.25.1] - 2024-12-09
### Changed
- AI Assistant: Add disclaimer to image generation modals. [#40397]
- Updated package dependencies. [#40363]

## [0.25.0] - 2024-11-25
### Added
- AI Client: split disabled prop to allow disabling input and action button separately. [#40210]

### Changed
- AI Client: fix prompt cursor to text when editable. [#40247]
- Updated package dependencies. [#40288]

## [0.24.3] - 2024-11-18
### Changed
- AI Client: add effect on AiModalInputPrompt to update/set prompt on prop update. [#40113]

## [0.24.2] - 2024-11-11
### Changed
- Updated package dependencies. [#39999] [#40000]

## [0.24.1] - 2024-11-04
### Added
- Enable test coverage. [#39961]

### Fixed
- Jetpack AI: Fix for the "Generate with AI" for images text box triggering P2 keyboard shortcuts. [#39964]

## [0.24.0] - 2024-10-29
### Added
- AI Client: export image generator hook constants [#39917]

## [0.23.0] - 2024-10-28
### Changed
- AI Client: Decouple prompt input as component and export it for reusability. [#39864]
- AI Client: Make reload handler prop optional. [#39848]

### Fixed
- AI Client: Fix initial state being mapped even when fetch fails. [#39846]

## [0.22.0] - 2024-10-21
### Changed
- AI Client: Add types for AI assistant feature payload data branch featuresControl. [#39826]

## [0.21.0] - 2024-10-14
### Added
- AI Client: Add image styles 'auto' and 'none' to the logo generator. Order styles so those are on top in the dropdown selector. [#39689]
- AI Client: Add prompt processing and style guess function for logo generator [#39712]

### Changed
- AI Client: Change plans limit to use and accept new 3000 value. [#39705]
- AI Client: Change upgrade copy edit and redirect URL. [#39671]
- AI Client: If site details show empty or default, do not trigger a logo generation, use empty placeholders. [#39536]
- AI Client: Remove provision of image styles via flag prop and internal definition, take it from ai-assistant-feature payload now. [#39589]
- Updated package dependencies. [#39669] [#39707]

## [0.20.1] - 2024-10-07
### Changed
- Updated package dependencies. [#39594]

## [0.20.0] - 2024-09-30
### Added
- AI Client: add support for showStyleSelector on logo generator and use-image-generator [#39530]

## [0.19.0] - 2024-09-23
### Changed
- AI Client: Don't send a default style to jetpack-ai-image endpoint, default is handled in backend and we need to not send it until we're ready for it to be a user option. [#39494]
- Jetpack AI: Point upgrade links and buttons to checkout instead of product interstitial. [#39469]
- Logo generator: Get selection from the prompt's document rather than the global `window`. [#39364]

## [0.18.1] - 2024-09-10
### Changed
- Updated package dependencies. [#39302]

## [0.18.0] - 2024-09-09
### Added
- AI Client: add placeholders for Logo Generator modal commponents [#39244]

### Changed
- AI Logo generator: add over quota notice, handle disabling tiers on checkout [#39149]
- Updated package dependencies. [#39176]

## [0.17.0] - 2024-09-02
### Added
- AI Client: Add FeaturesControl to ai-assistant-feature response parsing. [#39168]
- Jetpack AI: Support fair usage messaging on the Extension AI Control component. [#39103]

## [0.16.4] - 2024-08-26
### Changed
- Updated package dependencies. [#39004]

## [0.16.3] - 2024-08-21
### Fixed
- Revert recent SVG image optimizations. [#38981]

## [0.16.2] - 2024-08-19
### Changed
- Update dependencies. [#38861] [#38662] [#38665] [#38893]

### Fixed
- Lossless image optimization for images (should improve performance with no visible changes). [#38750]

## [0.16.1] - 2024-08-05
### Changed
- AI Logo Generator: fix UI issues. [#38590]
- Fixup versions [#38612]

### Fixed
- AI Logo Generator: fix multiple feature requests error + retry handling. [#38630]
- AI Logo Generator: fix small UI issues. [#38676]
- AI Logo Generator: fix upgrade URLs so they work on any site type. [#38598]
- AI Logo Generator: update upgrade message. [#38690]

## [0.16.0] - 2024-07-29
### Added
- AI Logo Generator: support placement property on the generator modal, for tracking purposes. [#38574]

### Fixed
- AI Logo Generator: make the initial prompt update when the site name and description are fully laoded from store. [#38491]
- AI Logo Generator: provide the saved media ID on the save logo callback. [#38552]

## [0.15.0] - 2024-07-22
### Added
- Jetpack AI: Add logo generator codebase to the ai-client package. [#38391]

### Changed
- Update and export askQuestionSync. [#38344]

## [0.14.6] - 2024-07-15
### Added
- AI Client: Filter suggestions starting with llama artifacts [#38208]

## [0.14.5] - 2024-07-08
### Changed
- Updated package dependencies. [#38132]

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
- Updated package dependencies. [#36095] [#36143]

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
- Updated package dependencies. [#31468] [#31659] [#31785]

[0.26.3]: https://github.com/Automattic/jetpack-ai-client/compare/v0.26.2...v0.26.3
[0.26.2]: https://github.com/Automattic/jetpack-ai-client/compare/v0.26.1...v0.26.2
[0.26.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.26.0...v0.26.1
[0.26.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.25.7...v0.26.0
[0.25.7]: https://github.com/Automattic/jetpack-ai-client/compare/v0.25.6...v0.25.7
[0.25.6]: https://github.com/Automattic/jetpack-ai-client/compare/v0.25.5...v0.25.6
[0.25.5]: https://github.com/Automattic/jetpack-ai-client/compare/v0.25.4...v0.25.5
[0.25.4]: https://github.com/Automattic/jetpack-ai-client/compare/v0.25.3...v0.25.4
[0.25.3]: https://github.com/Automattic/jetpack-ai-client/compare/v0.25.2...v0.25.3
[0.25.2]: https://github.com/Automattic/jetpack-ai-client/compare/v0.25.1...v0.25.2
[0.25.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.25.0...v0.25.1
[0.25.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.24.3...v0.25.0
[0.24.3]: https://github.com/Automattic/jetpack-ai-client/compare/v0.24.2...v0.24.3
[0.24.2]: https://github.com/Automattic/jetpack-ai-client/compare/v0.24.1...v0.24.2
[0.24.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.24.0...v0.24.1
[0.24.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.23.0...v0.24.0
[0.23.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.22.0...v0.23.0
[0.22.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.20.1...v0.21.0
[0.20.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.20.0...v0.20.1
[0.20.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.19.0...v0.20.0
[0.19.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.18.1...v0.19.0
[0.18.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.18.0...v0.18.1
[0.18.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.16.4...v0.17.0
[0.16.4]: https://github.com/Automattic/jetpack-ai-client/compare/v0.16.3...v0.16.4
[0.16.3]: https://github.com/Automattic/jetpack-ai-client/compare/v0.16.2...v0.16.3
[0.16.2]: https://github.com/Automattic/jetpack-ai-client/compare/v0.16.1...v0.16.2
[0.16.1]: https://github.com/Automattic/jetpack-ai-client/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/Automattic/jetpack-ai-client/compare/v0.14.6...v0.15.0
[0.14.6]: https://github.com/Automattic/jetpack-ai-client/compare/v0.14.5...v0.14.6
[0.14.5]: https://github.com/Automattic/jetpack-ai-client/compare/v0.14.4...v0.14.5
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
