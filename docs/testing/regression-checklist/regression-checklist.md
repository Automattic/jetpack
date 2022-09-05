# Regression checklist
This is the "global" checklist, that might be used for beta testing.
NOTE: it might become outdated, so it could be a good idea to generate this file via test-suites files.

## Global

### Environments

- Multisite
- Subdirectory
- Single site
- Subdirectory
- Subdomain

### WP versions

- Current version
- Current -1
- With Gutenberg plugin
- Classic editor (? I don’t think we still support this actually)

### PHP versions(Low)

- 5.6 - current

### Hosting providers(High)

- Bluehost
- Atomic/Pressable
- VIP

### Protocols (Low)

- http
- https

## Connection

- [ ] In-place connection with free plan
- [ ] In-place connection with paid plan
- [ ] In-place connection with product purchase
- [ ] Classic connection. Use Safari, or set a constant JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME to true
- [ ] Disconnect/reconnect connection
- [ ] Secondary user connection
- [ ] Connection on multisite

## Sync

- [ ] Site changes registered in Calypso’s Activity Log

## Features

- [ ] Jetpack Social: Connect and share a post
- [ ] SSO login
- [ ] Stats registers views
- [ ] Stats registers views in AMP views
- [ ] Lazy loading
- [ ] Site accelerator (make sure that images and core files are served from WPCOM)
- [ ] Infinite scroll

## Products

- [ ] Backups and Restores
- [ ] Security scan
- [ ] Search

## Other services/plugins relying on Jetpack

- [ ] Woo onboarding
- [ ] Woo analytics

## Blocks

Test using Core’s block editor and latest Gutenberg plugin.

- [ ] Tiled Gallery
- [ ] Business Hours
- [ ] Calendly
- [ ] Form
- [ ] Contact Info
- [ ] Eventbrite
- [ ] Google calendar
- [ ] Mailchimp
- [ ] Map
- [ ] OpenTable
- [ ] Pinterest
- [ ] Podcast player
- [ ] Star rating
- [ ] Recurring Payments
- [ ] Repeat Visitor
- [ ] Revue
- [ ] Simple Payments
- [ ] Slideshow
