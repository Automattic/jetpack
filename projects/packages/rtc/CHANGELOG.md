# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2026-04-09
### Added
- Initial version. [#47713]

### Changed
- Add RTC-specific pixel beacons (`pinghub.rtc.*`) alongside existing shared beacons for dedicated RTC dashboarding, and add new beacons for JWT fetch latency/errors and send drops. [#47772]
- Disable RTC in site editor [#47681]
- Move RTC notices (welcome notice, room-limit enforcement, join requests) from jetpack-mu-wpcom into the rtc package. [#47964]
- Multiplex all PingHub rooms over a single WebSocket connection per editing session, reducing connection count from N to 1. [#47994]
- Update package dependencies. [#47874] [#47890]

### Fixed
- Avoid endless PingHub reconnection loop on persistent WebSocket or JWT fetch errors [#47864]
- Defer reconnect backoff reset until WebSocket connection has been stable for 30 seconds [#47901]
- Disable RTC for super admins who are not members of the blog to prevent exposing their presence during support sessions. [#47867]
- Inline the keepalive Web Worker as a Blob URL so it works on sites that load scripts from a different origin. [#48024]
- PingHub: support root/comment entity type so collaborative notes sync in real time over WebSockets [#47833]
- Skip attachment entities in PingHub provider to avoid excessive WebSocket connections on media-heavy sites [#47917]
