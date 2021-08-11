# Jetpack PostList Package

Enhance the classic view of the Admin section of your WordPress site.

## How to use

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-post-list).

1. Use composer to add the package to your project:
```bash
composer add automattic/jetpack-post-list
```

2. Then you need to initialize it on the `plugins_loaded` hook:
```php
add_action( 'plugins_loaded', 'load_posts_list' );

function load_posts_list() {
	Automattic\Jetpack\PostList\Admin::init();
}
```

3. You need to build its assets before using it.
To do that, you need to run the following commands:
```bash
cd vendor/automattic/jetpack-post-list
pnpm build-all
```
## Development

```bash
jetpack build packages/post-list
```

... watching changes 👀

```bash
jetpack watch packages/post-list
```
