# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.21.3] - 2021-05-25
### Changed
- Performance: If no Full Sync is in process early return before we update options.

### Fixed
- Janitorial: avoid PHP notices in some edge-cases
- Update Meta Module so get_object_by_id returns all meta values.

## [1.21.2] - 2021-04-27
### Added
- Added the password-checker package the the Sync package composer.json file.

### Changed
- Updated package dependencies.

### Fixed
- Sync: removed references to the JETPACK__PLUGIN_DIR constant.
- Sync Checksums : updated postmeta range query performance #19337.

## [1.21.1] - 2021-03-30
### Added
- Composer alias for dev-master, to improve dependencies
- Implement a 60 second back-off for non-200 respones, if no retry-after header is present in the response.
- Impose a max limit of 2MB on post meta values that are synced.
- Impose a max limit of 5MB on post_content that can be synced.

### Changed
- Sync: Use the new Password_Checker package instead of Jetpack_Password_Checker.
- Update package dependencies.
- Use the Heartbeat package to generate the stats array

### Fixed
- Migrate locks to update_option to avaoid memcache inconsistencies that can be introduced by delete_option usage.
- Update Sync Queue so that serialize is wrapped to catch errors

## [1.21.0] - 2021-02-23

- General: update WordPress version requirements to WP 5.6
- Update Checksums to support blacklisted taxonomies.
- Refactor Jetpack callables into the plugin using existing filter jetpack_sync_callable_whitelist
- Wrap call_user_func in is_callable so that we don't trigger warnings for callables that don't exist.
- Sync: Trigger initial sync on jetpack_site_registered
- Update Comments checksum field to comment_date_gmt. We cannot use comment_content directly due to charset/filters.
- Deprecate jetpack_json_wrap
- Remove Sync's usage of wp_startswith

## [1.20.2] - 2021-02-08

- Update dependencies to latest stable

## [1.20.1] - 2021-01-28

- Update dependencies to latest stable

## [1.20.0] - 2021-01-26

- Sync Concurrency / Race Conditions
- Sync: Prevent an PHP warning
- Jetpack Sync: Checksums: Use a better way to fetch and validate fields against table
- Add mirror-repo information to all current composer packages
- Full Sync :: Reduce Concurrency.
- Monorepo: Reorganize all projects
- Various PHPCS and Cleanup

## [1.19.4] - 2021-01-18

- Update dependencies to latest stable

## [1.19.3] - 2021-01-18

- Full Sync :: Reduce Concurrency.

## [1.19.2] - 2020-12-21

- Update the do_full_sync function to early return if we are in SYNC READ ONLY mode.
- Return an empty array if the specified range is empty. (It was returning the checksum for the WHOLE dataset).

## [1.19.1] - 2020-12-17

## [1.19.0] - 2020-12-17

- sync: Improve sync checksum algorithm and endpoints
- wp_get_environment_type as callable.
- Disallow amp_validated_url as it is not site content but instead validation errors for amp mark-up.
- Whitelist (allow) jetpack_sync_settings_* options to be synced
- Re-order Sync default option whitelist (allowlist)

## [1.18.1] - 2020-11-24

- Version packages for release

## [1.18.0] - 2020-11-24

- Migrate jetpack_published_post to wp_after_insert_post hook
- Check  value to determine if we should enable sync after an action enqueuement.
- General: update minimum required version to WordPress 5.5
- Fix remaining phpcs warnings in most of requirelist
- Update access of comment_status_to_approval_value to allow extension.
- Update get_term Replicastore function to handle term_taxonomy_id option
- Update get_terms to utilize ensure_taxonomy so that the Taxonomy is registered.
- Addtion of note on explict return of null instead of false if option not found.
- Alignment of comment_status_to_approval_value function. Addition of post-trashed status and cleanup of cases.
- Alignment with implemenations. Call ensure_taxonomy to ensure Taxonomies have been initialized.
- Call ensure_taxonomy within get_object_terms so that the taxonomy is registered before action is performed.
- Updated PHPCS: Packages and Debugger

## [1.17.2] - 2020-11-05

- Update dependencies to latest stable

## [1.17.1] - 2020-10-29

- Update dependencies to latest stable

## [1.17.0] - 2020-10-27

- WPCOM Block Editor: Update meta key name
- Resolve PHP Warning with array_filter usage in sync of action_links.
- Sync: Seperate theme data ( name, version, slug and uri) from theme support data
- Replaced intval() with (int) as part of issue #17432.
- Replaced strval() with type casting (string) as part of issue #17432.
- Replaced floatval() with type cast (float) as part of issue #17432.
- Make XMLRPC methods available for blog token

## [1.16.4] - 2020-10-14

- Update dependencies to latest stable

## [1.16.3] - 2020-10-09

- Update dependencies to latest stable

## [1.16.2] - 2020-10-06

- Update dependencies to latest stable

## [1.16.1] - 2020-10-01

- Update dependencies to latest stable

## [1.16.0] - 2020-09-29

- Publicize: Allow publishing a post as a Twitter thread.
- props @jmdodd - filter out set_object_terms actions that don't perform any update. Includes unit tests.
- Sort Arrays by keys before generating callable checksums
- Packages: avoid PHPCS warnings
- Adding 'review' to whitelisted comment types
- Disable Sync sending on Backup API Requests
- Sync: stop trying to check for edit_comment capability
- Added options to sync wc whitelist
- Sync: Improve theme support syncing

## [1.15.1] - 2020-09-09

- Update dependencies to latest stable

## [1.15.0] - 2020-08-26

- Sync: add Creative Mail configuration option to synced options
- Extend sync_status endpoint with optional debug_details field
- REST API endpoints: expand management endpoints
- Sync: Fix nonce action string in theme edit sync
- WP 5.5 Compat: Align Jetpack and Core's plugin autoupdates
- use current user token to updateRole request
- Resolve Sync Errors from empty edge case and WP.com returning concurrent_request_error
- Rework Sender to properly return state during do_full_sync

## [1.14.4] - 2020-08-10

- WP 5.5 Compat: Align Jetpack and Core's plugin autoupdates

## [1.14.3] - 2020-08-10

- Update dependencies to latest stable

## [1.14.2] - 2020-08-10

- Update dependencies to latest stable

## [1.14.1] - 2020-08-10

- Resolve Sync Errors from empty edge case and WP.com returning concurrent_request_error

## [1.14.0] - 2020-07-28

- Core Compat: Site Environment
- Unit Tests: fix tests according to changes in Core
- Utilize the blog token vs master user token to send sync actions.

## [1.13.2] - 2020-07-06

- Update dependencies to latest stable

## [1.13.1] - 2020-07-01

- Update dependencies to latest stable

## [1.13.0] - 2020-06-30

- Block Flamingo Plugin post types in Jetpack Sync
- Explicit single execution of do_full_sync from cron
- Update  to reference the property defined in the Jetpack Connection Manager class
- PHPCS: Clean up the packages
- WordAds: Add consent support for California Consumer Privacy Act (CCPA)
- Sync: Add additional support for theme_support_whitelist

## [1.12.4] - 2020-06-02

- Revert "Fix `jetpack sync start` CLI command (#16010)"

## [1.12.3] - 2020-06-01

- Update dependencies to latest stable

## [1.12.2] - 2020-06-01

- Fix `jetpack sync start` CLI command

## [1.12.1] - 2020-05-29

- Sync: Add additional support for theme_support_whitelist

## [1.12.0] - 2020-05-26

- Update ReplicaStore to call clean_comment_cache when comments are upserted or a reset is perofrmed.
- Store the list of active plugins that uses connection in an option
- Jetpack Sync :: Alternate non-blocking flow
- Settings - Writing: add a toggle to Carousel so users can hide comment area
- Sender needs to load consistently utilizing  logic
- Always delete items from the queue even if the buffer is no longer checked out.
- Update the  hook of Sync's Comment module to not send meta actions when the comment_type is not whitelisted.
- Sync Comments apply whitelist to all actions

## [1.11.0] - 2020-04-28

- Correct inline documentation "Array" type
- Filter out blacklisted post_types for deleted_post actions.
- Publicize: Add jetpack_publicize_options
- Blacklisting Post Types from Sync
- Comments: update default comment type
- Jetpack Sync: Split `jetpack_post_meta_batch_delete` in action to be called in chunks of 100 items, compared to all at once.
- Update Sync limits based on analysis of data loss events.

## [1.10.0] - 2020-03-31

- Update dependencies to latest stable

## [1.9.0] - 2020-03-31

- Debugger: Add sync health progress bar
- Add main network WPCOM blog ID to sync functions
- Masterbar: send wpcom user ID to wpcom when attempting to log…
- Sync: a better readme

## [1.8.0] - 2020-02-25

- Minileven: add options back  as they still exist on sites
- Sync: add queue size to actions
- Mobile Theme: remove feature

## [1.7.6] - 2020-02-14

- get_sync_status does not properly account for unexpected states.

## [1.7.5] - 2020-02-14

- Empty Helper function for checkin handler
- Sync Health: fix excessive data loss reports
- Initial Sync Health Status Class and Data Loss Handler
- Stop REST API Log entries from being synced

## [1.7.4+vip] - 2020-02-14

- Empty Helper function for checkin handler

## [1.7.4] - 2020-01-23

- Sync Chunk Keys need to be unique

## [1.7.3] - 2020-01-20

- Sync: ensure we run the initial sync on new connections

## [1.7.2] - 2020-01-17

- Sync Package: use Full_Sync_Immediately by default
- Adding new managed WordPress hosts to be identified in class-functions.php.

## [1.7.1] - 2020-01-14

- Packages: Various improvements for wp.com or self-contained consumers

## [1.7.0] - 2020-01-14

- Trying to add deterministic initialization.

## [1.6.3] - 2020-01-07

- Fix git history.

## [1.6.2] - 2019-12-31

- Sync: Remove DEFAULT_SYNC_MODULES legacy map
- Connection: Loose Comparison for Port Number in Signatures

## [1.6.1] - 2019-12-13

- tweak default sync settings

## [1.6.0] - 2019-12-02

- Sync: Full Sync: Send immediately.

## [1.5.1] - 2019-11-26

- Marked the xmlrpc_api_url method as deprecated.

## [1.5.0] - 2019-11-25

- Remove sync settings cache

## [1.4.0] - 2019-11-19

- Full Sync: Don't allow more than one request to enqueue
- Sync: Update Max Int

## [1.3.4] - 2019-11-08

- Packages: Use classmap instead of PSR-4

## [1.3.3] - 2019-11-08

- Deprecate Jetpack::is_development_mode() in favor of the packaged Status()-&gt;is_development_mode()

## [1.3.2] - 2019-11-01

- Full Sync updates to allow full enqueuing of chunks.

## [1.3.1] - 2019-10-29

- PHPCS: Rest of the packages

## [1.3.0] - 2019-10-29

- Sync: Checkout Endpoint: Add `pop` argument 😱

## [1.2.1] - 2019-10-28

- Sync: Add Settings to enable/disable the sender for a particular queue

## [1.2.0] - 2019-10-24

- Sync: Fix how we enqueue term_relationships on full sync 🏝
- WP 5.3: Use modern wp_timezone
- Check for last_error when enqueuing IDs

## [1.1.1] - 2019-10-23

- Use spread operator instead of func_get_args

## [1.1.0] - 2019-10-07

- Sync: Ensure a post object is returned
- PHPCS: Sync Functions
- Sync: Bail initial sync if there is an ongoing full sync

## [1.0.2] - 2019-09-25

- Sync: Only allow white listed comment types to be inserted.
- Sync: Move sync_object XML-RPC method from connection to sync
- Sync: do not sync comments made via Action Scheduler
- Docs: Unify usage of @package phpdoc tags

## [1.0.1] - 2019-09-14

## 1.0.0 - 2019-09-14

- Packages: Move sync to a classmapped package

[1.21.3]: https://github.com/Automattic/jetpack-sync/compare/v1.21.2...v1.21.3
[1.21.2]: https://github.com/Automattic/jetpack-sync/compare/v1.21.1...v1.21.2
[1.21.1]: https://github.com/Automattic/jetpack-sync/compare/v1.21.0...v1.21.1
[1.21.0]: https://github.com/Automattic/jetpack-sync/compare/v1.20.2...v1.21.0
[1.20.2]: https://github.com/Automattic/jetpack-sync/compare/v1.20.1...v1.20.2
[1.20.1]: https://github.com/Automattic/jetpack-sync/compare/v1.20.0...v1.20.1
[1.20.0]: https://github.com/Automattic/jetpack-sync/compare/v1.19.4...v1.20.0
[1.19.4]: https://github.com/Automattic/jetpack-sync/compare/v1.19.3...v1.19.4
[1.19.3]: https://github.com/Automattic/jetpack-sync/compare/v1.19.2...v1.19.3
[1.19.2]: https://github.com/Automattic/jetpack-sync/compare/v1.19.1...v1.19.2
[1.19.1]: https://github.com/Automattic/jetpack-sync/compare/v1.19.0...v1.19.1
[1.19.0]: https://github.com/Automattic/jetpack-sync/compare/v1.18.1...v1.19.0
[1.18.1]: https://github.com/Automattic/jetpack-sync/compare/v1.18.0...v1.18.1
[1.18.0]: https://github.com/Automattic/jetpack-sync/compare/v1.17.2...v1.18.0
[1.17.2]: https://github.com/Automattic/jetpack-sync/compare/v1.17.1...v1.17.2
[1.17.1]: https://github.com/Automattic/jetpack-sync/compare/v1.17.0...v1.17.1
[1.17.0]: https://github.com/Automattic/jetpack-sync/compare/v1.16.4...v1.17.0
[1.16.4]: https://github.com/Automattic/jetpack-sync/compare/v1.16.3...v1.16.4
[1.16.3]: https://github.com/Automattic/jetpack-sync/compare/v1.16.2...v1.16.3
[1.16.2]: https://github.com/Automattic/jetpack-sync/compare/v1.16.1...v1.16.2
[1.16.1]: https://github.com/Automattic/jetpack-sync/compare/v1.16.0...v1.16.1
[1.16.0]: https://github.com/Automattic/jetpack-sync/compare/v1.15.1...v1.16.0
[1.15.1]: https://github.com/Automattic/jetpack-sync/compare/v1.15.0...v1.15.1
[1.15.0]: https://github.com/Automattic/jetpack-sync/compare/v1.14.4...v1.15.0
[1.14.4]: https://github.com/Automattic/jetpack-sync/compare/v1.14.3...v1.14.4
[1.14.3]: https://github.com/Automattic/jetpack-sync/compare/v1.14.2...v1.14.3
[1.14.2]: https://github.com/Automattic/jetpack-sync/compare/v1.14.1...v1.14.2
[1.14.1]: https://github.com/Automattic/jetpack-sync/compare/v1.14.0...v1.14.1
[1.14.0]: https://github.com/Automattic/jetpack-sync/compare/v1.13.2...v1.14.0
[1.13.2]: https://github.com/Automattic/jetpack-sync/compare/v1.13.1...v1.13.2
[1.13.1]: https://github.com/Automattic/jetpack-sync/compare/v1.13.0...v1.13.1
[1.13.0]: https://github.com/Automattic/jetpack-sync/compare/v1.12.4...v1.13.0
[1.12.4]: https://github.com/Automattic/jetpack-sync/compare/v1.12.3...v1.12.4
[1.12.3]: https://github.com/Automattic/jetpack-sync/compare/v1.12.2...v1.12.3
[1.12.2]: https://github.com/Automattic/jetpack-sync/compare/v1.12.1...v1.12.2
[1.12.1]: https://github.com/Automattic/jetpack-sync/compare/v1.12.0...v1.12.1
[1.12.0]: https://github.com/Automattic/jetpack-sync/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/Automattic/jetpack-sync/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/Automattic/jetpack-sync/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/Automattic/jetpack-sync/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/Automattic/jetpack-sync/compare/v1.7.6...v1.8.0
[1.7.6]: https://github.com/Automattic/jetpack-sync/compare/v1.7.5...v1.7.6
[1.7.5]: https://github.com/Automattic/jetpack-sync/compare/v1.7.4+vip...v1.7.5
[1.7.4+vip]: https://github.com/Automattic/jetpack-sync/compare/v1.7.4...v1.7.4+vip
[1.7.4]: https://github.com/Automattic/jetpack-sync/compare/v1.7.3...v1.7.4
[1.7.3]: https://github.com/Automattic/jetpack-sync/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/Automattic/jetpack-sync/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/Automattic/jetpack-sync/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/Automattic/jetpack-sync/compare/v1.6.3...v1.7.0
[1.6.3]: https://github.com/Automattic/jetpack-sync/compare/v1.6.2...v1.6.3
[1.6.2]: https://github.com/Automattic/jetpack-sync/compare/v1.6.1...v1.6.2
[1.6.1]: https://github.com/Automattic/jetpack-sync/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/Automattic/jetpack-sync/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/Automattic/jetpack-sync/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Automattic/jetpack-sync/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Automattic/jetpack-sync/compare/v1.3.4...v1.4.0
[1.3.4]: https://github.com/Automattic/jetpack-sync/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/Automattic/jetpack-sync/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/Automattic/jetpack-sync/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/Automattic/jetpack-sync/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-sync/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/Automattic/jetpack-sync/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/jetpack-sync/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Automattic/jetpack-sync/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-sync/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/Automattic/jetpack-sync/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Automattic/jetpack-sync/compare/v1.0.0...v1.0.1
