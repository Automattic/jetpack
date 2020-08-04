# Jetpack Lazy Images

Speed up your site and create a smoother viewing experience by loading images as visitors scroll down the screen, instead of all at once.

## Usage

Retrieve device information.

```php
/*
 * Initialize lazy images on the wp action so that conditional
 * tags are safe to use.
 *
 * As an example, this is important if a theme wants to disable lazy images except
 * on single posts, pages, or attachments by short-circuiting lazy images when
 * is_singular() returns false.
 *
 * See: https://github.com/Automattic/jetpack/issues/8888
 */

add_action( 'wp', array( 'Automattic\\Jetpack\\Jetpack_Lazy_Images', 'instance' ) );
```

## Development

In order to develop on this code base you'll have to run the following commands. 
```bash
$ yarn
$ composer install --ignore-platform-reqs
```

### Generate minified JavaScript

The JavaScript file can be minified from the root of the Jetpack repository:

```bash
$ cd ../../
$ yarn build-packages 
```

### Run PHP unit tests

```bash
$ composer phpunit 
```

### Lint PHP source code

The PHP code can be linted from the root of the Jetpack repository:
```bash
$ cd ../../
$ yarn php:compatibility packages/lazy-images
```
