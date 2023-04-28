# Jetpack CRM Tests

## Directories

### `tests/php`

This directory is where PHPUnit tests live (or any libraries that extend PHPUnit like WorDBless).

These tests are part of the default Jetpack tech stack.

### `tests/codeception`

This directory is where our old Codeception tests live. We have chose to keep our old tests from before we migrated to the monorepo to make sure we do not break anything.

The expectations for these tests are that they will be replaced in the future with other PHPUnit / E2E tests that follows the tech stack of the rest of the monorepo.
