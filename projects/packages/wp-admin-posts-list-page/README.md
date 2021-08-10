# Jetpack WPAdminPostsListPage Package

Enhance the classic view of the Admin section of your WordPress site.

## How to use

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-wp-admin-posts-list-page).

1. Use composer to add the package to your project:
```bash
composer add automattic/jetpack-wp-admin-posts-list-page
```

2. Then you need to initialize it on the `plugins_loaded` hook:
```php
add_action( 'plugins_loaded', 'load_wp_admin_posts_list_page' );

function load_wp_admin_posts_list_page() {
	Automattic\Jetpack\WPAdminPostsListPage\Admin::init();
}
```

3. You need to build its assets before using it.
To do that, you need to run the following commands:
```bash
cd vendor/automattic/jetpack-wp-admin-posts-list-page
pnpm build-all
```
## Development

```bash
jetpack build packages/wp-admin-posts-list-page
```

... watching changes 👀

```bash
jetpack watch packages/wp-admin-posts-list-page
```
