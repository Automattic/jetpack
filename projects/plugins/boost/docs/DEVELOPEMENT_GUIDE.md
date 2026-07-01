# Development guide

## Table of contents

* [Prerequisite](#prerequisite)
* [Development Environment - Boost specific information](#development-environment---boost-specific-information)
	* [Setting up your environment](#setting-up-your-environment)
	* [Build the project](#build-the-project)
	* [PHP unit tests](#php-unit-tests)
	* [JavaScript unit tests and e2e tests](#javascript-e2e-tests)
	* [Linting Jetpack Boost's PHP code](#linting-jetpack-boost-php-code)
	* [Linting Jetpack Boost's JavaScript code](#linting-jetpack-boost-javascript-code)
* [Debugging Concatenate JS/CSS exclusions](#debugging-concatenate-jscss-exclusions)

# Prerequisite

If you have not yet done so, please review first all of the [Jetpack Monorepo documentation](https://github.com/Automattic/jetpack/tree/trunk/docs) documentation. It does provide all the required information to get you started and acquainted with the different processes.

The following sections will just highlight some additional tips information specific to Jetpack Boost.

# Development Environment - Boost specific information

## Setting up your environment

Because Jetpack Boost as some feature which requires connection to WordPress.com, it is highly recommended that you are running your WordPress site using the [Docker setup](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md) with the [Jurassic Tube Tunneling Service](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md#jurassic-tube-tunneling-service) or [Ngrok](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md#using-ngrok-with-jetpack).

If not, you might need as a prerequisite to bypass the Jetpack connection.

## Build the project

You may also need building the Image CDN Jetpack Package dependency using the following command:

  ```sh
  jetpack build packages/image_cdn
  ```

You may need to do this only once.


## PHP unit tests

You can run the tests locally:

```sh
cd projects/plugins/boost
composer test-php
```

Or you might also choose to run them inside Docker if you are using it as your development environment:

```sh
jetpack docker exec -- sh -c "composer -d wp-content/plugins/boost test-php"
```

## JavaScript e2e tests

Please refer to the Jetpack Boost e2e tests specific [documentation](../tests/e2e/README.md).

## Linting Jetpack Boost PHP code

Note that the following 3 commands need to be run from the root directory of the Jetpack Monorepo project.

To check coding standards issues on the Jetpack Boost PHP code base run:

  ```sh
  composer phpcs:lint ./projects/plugins/boost
  ```

To automatically fix some coding standards issues on the Jetpack Boost PHP code base run:

  ```sh
  composer phpcs:fix ./projects/plugins/boost
  ```

To check for PHP code compatibility run:

  ```sh
  composer phpcs:compatibility ./projects/plugins/boost
  ```

## Linting Jetpack Boost JavaScript code
The following commands need to be run from the `projects/plugins/boost` directory.

To check syntax and style in the all the TypeScript and Svelte files that Jetpack Boost relies on, you can run:

  ```sh
  pnpm lint
  ``` 


To automatically fix some JavaScript related issues, you can run:

  ```sh
  pnpm lint:fix
  ``` 


# Debugging Concatenate JS/CSS exclusions

When concatenation breaks a page, you can test whether excluding a specific script or style handle fixes it — without editing the saved exclude lists — by appending one of these GET parameters to the page URL:

* `jb-minify-js-excludes` — comma-separated script handles to additionally exclude from JS concatenation for that request.
* `jb-minify-css-excludes` — comma-separated style handles to additionally exclude from CSS concatenation for that request.

For example: `https://example.com/some-page/?jb-minify-js-excludes=jquery-core,my-plugin-script`.

Notes:

* The parameters only work for logged-in users with the `manage_options` capability (administrators); for everyone else they are ignored.
* Handles may only contain alphanumerics, dashes, underscores and dots; anything else is discarded. Case is preserved, so enter the handle exactly as registered (handles are matched case-sensitively).
* Nothing is persisted — the merged exclude list only applies to the current request. To make an exclusion permanent, add it in Boost's Advanced Settings.
* This does not interact with Boost's Page Cache: logged-in users are never served cached pages, nor are their page views written to the cache.
