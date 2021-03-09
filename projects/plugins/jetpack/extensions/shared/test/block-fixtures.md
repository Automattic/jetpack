# Block test fixtures

## Introduction

Block fixture are used to test the block parsing and serialization logic.

Each test is made up of four fixture files:

1. `fixture-name.html`: The initial post content.
2. `fixture-name.parsed.json`: The **expected** output of the PEG parser for
   this content (checked against the **actual** output of both the JS and PHP
   versions of the parser).
3. `fixture-name.json`: The **expected** representation of the block(s) inside
   the post content, along with their attributes and any nested content. The
   contents of this file are compared against the **actual** block object(s).
4. `fixture-name.serialized.html`: The **expected** result of calling
   `serialize` on the parsed block object(s). The contents of this file are
   compared against the **actual** re-serialized post content. This final step
   simulates opening and re-saving a post.

Every block is required to have at least one such set of fixture files to test
the parsing and serialization of that block. Additionally, each deprecation for
a block should also have a fixture.

These fixtures must be named like
`jetpack__blockname{__*,}.{html,json,serialized.html}`. For example, for the
`jetpack/whatsapp-button` block, the following four fixture files must exist:

1. `jetpack__whatsapp-button.html` (or `jetpack__whatsapp-button__specific-test-name.html`). Must
   contain a `<!-- wp:core/image -->` block.
2. `jetpack__whatsapp-button__image.parsed.json` (or `core__image__specific-test-name.parsed.json`).
3. `jetpack__whatsapp-button.json` (or `jetpack__whatsapp-button__specific-test-name.json`).
4. `jetpack__whatsapp-button.serialized.html` (or
   `jetpack__whatsapp-button.serialized.html`).

For each deprecation a fixture should exist with the filename format
`jetpack__whatsapp-button__deprecated-1.html`, with the number relating to the deprecation version.

Ideally all important attributes and features of the block should be tested
this way, for example with a gallery block where adding a  `linkTo` attribute may significantly change the saved content of the block there might be a fixture that has the image tag wrapped in a `<a>` and named `jetpack__tiled-gallery__link-to-attachment.html`.

## Creating fixtures

When adding a new fixtures, only the first file above (1, e.g. `core__image.html`) needs
to be created manually, the other files are generated from this first file.

To create the first file:

1. Create a file with the correct name in this folder.
2. Add the block to an new post in the editor.
3. Toggle the block attributes to desired settings for the test.
4. Switch to the code editor view and copy the block markup.
5. Paste the markup into the file you created at step 1.

Next, to generate files (2) through (4) run the following command from the root of the
jetpack plugin project:

For a single block:

```sh
yarn fixtures:generate `path\to\block\test\validate.js`
```

For all blocks:

```sh
yarn fixtures:generate
```

When using this command, please be sure to manually verify that the
contents of the `.json` and `.serialized.html` files are as expected.

In particular, check that the `isValid` property is `true`, and that
the attributes are serialized correctly.

## Add a deprecation fixture

When adding a fixture for a block deprecation follow the same steps as above but name the new fixture file as `core__image__dreprecated-1.html`) where the number at the end represents the deprecation version. The content of this file should match the saved block content the deprecated version of the block

In the case of deprecations the content of the `.json` and `.serialized.html` files should match the content of the produced by the latest version of the block save method, ie. they should mimic what would happen to a blocks content when a deprecated version is loaded in the editor and migrated to be compatible with the new save method.

## Updating fixtures

The process for updating fixtures for existing tests is similar to that for creating them:

Run the command to regenerate the files:

For a single block:

```sh
yarn fixtures:regenerate `path\to\block\test\validate.js`
```

For all blocks:

```sh
yarn fixtures:regenerate
```

After regenerating fixtures, check the diff (using git/github) to check that the changes were expected
and the block is still valid (`isValid` is `true`).

## Running the tests

The fixture tests will be run as part of running the `fixtures:generate` and `fixtures:regenerate` scripts and also as part of the `yarn test-extensions` test run. They can also be run independently with `yarn fixtures:test`

## Related

See the
[`validate.js`](../../blocks/send-a-message/whatsapp-button/test/validate.js)
for an example of how to run these validations against a block.
