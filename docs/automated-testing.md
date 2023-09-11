# Automated testing overview for Jetpack Monorepo

Types of tests

- PHPUnit tests for plugins and packages
- Javascript tests for React components
- Javascript tests for Gutenberg blocks
- E2E tests for plugins

- [PHPUnit tests](#phpunit-tests)
  - [Unit tests](#unit-tests)
  - [Integration tests](#integration-tests)
- [Javascript tests](#javascript-tests)
  - [React components](#react-components)
  - [Gutenberg blocks](#gutenberg-blocks)
- [E2E tests](#e2e-tests)

Refer to [Monorepo docs](/docs/monorepo.md#Testing) for information on how tests are integrated into monorepo pipelines.

## PHPUnit tests

These tests are used to test both plugins and packages code. Depending on developer need, they could act as a unit tests by mocking any external dependencies and apis and testing units in isolation, or they could be used as integration tests, with real WordPress installation and database.

### Unit tests

Unit tests are used to test individual units of code, such as a function or a class. They are meant to be run in isolation, without any external dependencies. They are fast and easy to write. This is a preferred approach to PHP testing, that leads to decoupled and testable code.

Refer to PHPUnit [documentation](https://phpunit.readthedocs.io/en/9.5/writing-tests-for-phpunit.html) for more details on how to write tests. Also, there are various examples in the repo such as [here](/projects/packages/a8c-mc-stats/tests/php/test_Stats.php).

Note: Jetpack monorepo is using a bit different code style to one that used in documentation examples.

### Integration tests

Integration tests are used to test code that interacts with external dependencies, such as WordPress functions, APIs, and database. They are slower than unit tests, but still much faster than E2E tests.

There are normally two reasons why you would choose integration over unit tests:

- Code is highly coupled with WordPress and it's not possible to test it in isolation.
- You want to test how the units interact with each other, to verify that public APIs work as expected.

Normally, integration tests for packages rely on various mocking solutions available:

- [brain/monkey](https://packagist.org/packages/brain/monkey) - For mocking and stubbing WordPress functions and classes.
- [automattic/wordbless](https://packagist.org/packages/automattic/wordbless) is used to pull in WordPress for testing. As name implies, it's a lightweight version of WordPress, without database and other limitations.

There are a lot of examples on how to use these tools in the `/projects/packages` folder, such as [here](/projects/packages/connection/tests/php/test_Manager_integration.php).

## Javascript tests

Monorepo provides support for `jest` as testing framework, and `@testing-library/react` as a testing library for React components.

### React components

There are examples scattered through the monorepo such as [connection-status-card](/projects/js-packages/connection/components/connection-status-card/test/component.jsx) card. Refer to [documentation](https://testing-library.com/docs/react-testing-library/intro) for more details.

### Gutenberg blocks

The [official core documentation](https://developer.wordpress.org/block-editor/contributors/code/testing-overview/) covers quite a lot of basics and would a good starting point for anyone starting with Gutenberg tests. There are multiple types of tests one can write for a block:

- [`validate` tests](/projects/plugins/jetpack/extensions/shared/test/block-fixtures.md) - Tests that verify expected block output.
- `edit` tests - Tests for edit handlers.
- `controls` tests - Tests for block controls.

Subscriptions block has a good example of how to write these types of tests. Refer to [subscriptions block tests](/projects/plugins/jetpack/extensions/blocks/subscriptions/test) for more details.

## E2E Tests

E2E tests are browser based tests that simulate user interactions and behavior. They are used to test user flows end to end, but also could be used as more functional tests for cases where unit and integration tests are not enough. Good example is a gutenberg block tests, where we want to test how block behaves in the editor, and how it renders on the front end.

E2E [documentation](/tools/e2e-commons/README.md) goes into details on how setup them and how to write your first test.
