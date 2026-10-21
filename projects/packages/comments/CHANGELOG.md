# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-10-19
### Changed
- Load Jetpack Comments on every site in place of the Verbum comment form. [#53525]
- Update package dependencies. [#53004]

### Fixed
- Fix comments from readers signed in with WordPress.com going to spam or not showing after posting, and Backspace or undo wiping a comment being written. [#53717]
- Fix the comment editor crashing on paragraphs, lists, quotes, and code, and fall back to the plain comment box when a block crashes. [#53658]
- Refuse a signed-in comment posted from another site, so that site cannot sign the reader out, and allow sign-in on sites that send no referrer. [#53772]
- Show the default avatar instead of a broken image on old comments left with an X (Twitter) login. [#53761]

## [0.6.0] - 2026-10-14
### Added
- Add the image block to the comment editor, and list embeds and images in its add block menu. Approved comments show up to four images. [#53527]
- Embeds: Show TikTok videos as players, and posts from X, Bluesky, and Reddit as cards, without the provider's script. [#53526]

### Changed
- Record the plain comment form when a reader reaches for it, not on every page view. [#53491]
- Send the details of a block editor failure to WordPress.com error logs. [#53489]
- Send the details of a sign-in dialog load failure to WordPress.com error logs. [#53530]

### Fixed
- Fix a fatal error on themes that build their own comment form, such as Thesis. [#53550]
- Keep a WordPress.com sign-in when a reader goes back and posts a comment again. [#53531]
- Let a logged-in reader post from a page left open past a day, or after logging in again elsewhere. [#53532]
- Translate the comment box placeholder on non-English sites. [#53492]
- Turn away comments from logged-out readers that arrive without the form's nonce, which only the form's script adds, to stop spam bots that post the form straight from the page. [#53547]

## [0.5.0] - 2026-10-12
### Added
- Add the embed block to the comment editor, for links from the providers WordPress trusts. [#53032]
- Record usage events for the comment form, sign-in, and block editor. [#53387]

### Changed
- Embeds: show a provider's content without its script, and the URL rather than a preview on the edit-comment screen. [#53364]
- Load less code on every page: the sign-in dialog loads when needed, and the comment editor downloads a smaller bundle. [#53375]
- Match core's busy and disabled button states on the submit buttons, and keep theme button styles off the editor toolbar. [#53260]
- Match the updated WordPress.com sign-in contract, and keep returning commenters signed in for 30 days. [#53296]
- Never load on jetpack.wordpress.com, which serves the Verbum comment iframe to Atomic and self-hosted sites. [#53362]
- Record why the block editor failed to load. [#53415]
- Replace the identity menu with one link beside the commenter's name: Change for guests and Log out for anyone signed in. The avatar and name link to a site user's profile, or to a guest's subscriptions where the Newsletter is on. [#53178]
- Skip the WordPress.com account check on guest emails outside WordPress.com, where nothing turns those comments away. [#53377]

### Fixed
- Accept a website without "https://" in the guest comment form, and wait for the email check before submitting. [#53320]
- Fit embeds to the comment thread and hide the textarea resize handle. [#53372]
- Focus the comment editor when a reader clicks the box before it loads, or clicks anywhere in an empty box. [#53391]
- Hide the plain textarea once the editor mounts, even in themes that style it by ID. [#53293]
- Identity: refuse a sign-in code posted from another site, take log-out by POST only, verify TLS on the exchange, and count email checks across sites. [#53343]
- Keep the caret where the reader clicked when the comment editor opens. [#53318]
- Keep the images, embeds, captions, and headings in comments written with the previous editor, as links and text. [#53370]
- Keep the submit button inside the comment box in themes that offset it. [#53294]
- Let a saved guest switch to a WordPress.com sign-in when changing their details. [#53386]
- Load the block editor and sign-in dialog on sites where a plugin combines scripts. [#53436]
- Load the block editor in older Chromium browsers, such as Chrome 109 and Samsung Internet. [#53423]
- Render blocks as plain text in the comment notification emails WordPress sends, instead of showing their raw markup. [#53446]
- Show YouTube and other video players in comments on WordPress.com, and show embeds that need a script, such as TikTok, as links. [#53380]
- Stop turning away logged-out readers' comments when a cached page's form has expired. [#53390]

## [0.4.0] - 2026-10-05
### Added
- Add the block editor to the comment form. [#52971]

### Changed
- Show a Log out link to every recognized commenter, and offer subscriptions only with the comment being posted. [#53155]
- Stop calling guest details a profile, and say they are saved in this browser. [#53160]
- Update package dependencies. [#52999]

### Fixed
- Show the submit row at all times, and stop theme button and field styles clashing with the form. [#53044]

## [0.3.0] - 2026-09-29
### Changed
- Redraw the comment form in the theme's own styles, with a dialog asking new readers for their details when they post. [#52912]

### Removed
- Remove Google and Facebook sign-in from the comment form, and the color scheme setting. [#52912]

## [0.2.0] - 2026-09-21
### Added
- Add WordPress.com, Google and Facebook sign-in to the comment form through a popup. [#52166]

### Changed
- Update package dependencies. [#52187]

## [0.1.3] - 2026-09-15
### Changed
- Update dependencies. [#52269]

## [0.1.2] - 2026-09-08
### Changed
- Update package dependencies. [#51701]

## [0.1.1] - 2026-09-01
### Changed
- Update dependencies. [#51622]

## 0.1.0 - 2026-08-25
### Added
- Add an on-site comment form with a textarea, guest name and email fields, and reply threading when the `jetpack_comments_new_hotness` filter returns true. [#51466]
- Initial version. [#51210]

[0.7.0]: https://github.com/Automattic/jetpack-comments/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Automattic/jetpack-comments/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Automattic/jetpack-comments/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-comments/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-comments/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-comments/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/Automattic/jetpack-comments/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-comments/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-comments/compare/v0.1.0...v0.1.1
