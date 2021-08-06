# Jetpack Boost

Boost your WordPress site's performance, from the creators of Jetpack.

## Prerequisites

-   [Composer](https://getcomposer.org/)
-   [NPM](https://www.npmjs.com/)
-   [Docker](https://www.docker.com/) (To use for local development and integration tests)

### Linux setup

Install composer:

```bash
sudo apt install composer
```

Install nvm:

```bash
sudo apt install curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
```

When you're done:

```bash
nvm install lts/fermium
```

### MacOS setup

```sh
brew install php
brew install nvm
brew install composer
```

## Installation

To build from Jetpack, run the following commands:

```sh
jetpack build plugins/jetpack-boost
```

Execute the following commands to get set up all dependencies.

-   `composer install`
-   `npm install`
-   `npm run build`

### PHP configuration

If you see an error about php missing the `dom` extension when running `composer install`, you should install the `php-xml` package.

On Ubuntu 20.04, run this command:

```bash
sudo apt install php-xml
```

Some other packages you may need to install, depending on your setup:

```bash
sudo apt install php-mbstring unzip
```

## Local environment

You can use any local WordPress server to run the plugin however for local development it is
recommended to use the Docker setup. To do so, please refer to the [Local Development with Docker](./docs/LOCAL_ENVIRONMENT_WITH_DOCKER.md) document.

## Build system

Update SCSS and JS assets in the `/app/assets/src` directory. ES2020 is transpiled down to ES5 on build. CSS is compiled from SCSS, but is not transpiled to accommodate older browsers.

-   `npm run build`: production build.
-   `npm run dev`: dev build & watching for changes.

## Building for WordPress

To generate a plugin zip file that can be installed in WordPress, refer to [Generating a release bundle](./docs/DEVELOPERS.md#generating-a-release-bundle) docs.

## Linting

-   `npm run lint`: lint all PHP and source JS files.
-   `npm run lint:js`: lint all source JS files using `eslint`.
-   `npm run validate`: lint all Svelte source files using `svelte-check`.
-   `npm run lint:php`: lint all PHP files using `phpcs`.

## Linting fixes

-   `npm run lint:fix`: fix lint errors for PHP and source JS files.
-   `npm run lint:js:fix`: fix lint errors for source JS files using `eslint`.
-   `npm run lint:php:fix`: fix lint errors for PHP files using `phpcs`.

## Tests

### PHP unit tests

-   `npm run test`: run all the test suits (At the moment only phpunit).
-   `npm run test:phpunit`: run PHPUnit tests for your local PHP version.
-   `PHP_VERSION=7.3 npm run test:phpunit-specific`: run PHPUnit tests for a specific PHP version (in this example `7.3`) inside a Docker container. The PHP version should be >=7.0.

### Integration tests

Check out the [instructions for setting up and running the integration test suite](./docs/INTEGRATION_TESTS.md).

## Other tools

Coding standards checks will be automatically check using git commit/push hooks
via [Husky](https://github.com/typicode/husky) which will setup the hooks automatically.

## WP Filters Overview

### Critical CSS

-   `jetpack_boost_critical_css_skip_url`: Skip generating critical CSS for a URL. By default, we skip URLs that are 404 pages.

### Render Blocking JS

-   `jetpack_boost_render_blocking_js_exclude_handles`: Provide an array of registered script handles that should not be moved to the end of the document.
-   `jetpack_boost_render_blocking_js_exclude_scripts`: Alter the array and remove any scripts that should not be moved to the end of the document.

### Other documentation

- More in-depth information related to plugin architecture can be found in the [Developer Readme](./docs/DEVELOPERS.md).
- Information related to the integration tests setup can be found in the [Integration Tests Readme](./docs/INTEGRATION_TESTS.md).
