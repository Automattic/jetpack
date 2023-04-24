# Jetpack CRM Tests

## Directories

### `tests/php`

These are where our PHPUnit tests live (or any libraries that extend PHPUnit like WorDBless).

These tests are part of the default Jetpack tech stack.

### `tests/codecept`

These are where our old Codeception tests live. We have chosen to keep our old tests from before we migrated into the monorepo to make sure we do not break anything.

The expectations for these tests are that they will be replaced in the future with other PHPUnit / E2E tests that follows the tech stack of the rest of the monorepo.
