# Jetpack Post List Package

Enhance the classic view of the Admin section of your WordPress site.

## How to use

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-post-list).

Use composer to add the package to your project:
```bash
composer add automattic/jetpack-post-list
```

Then you need to initialize it on the `plugins_loaded` hook:

```php
function init_posts_list() {
	Post_List::init();
}

add_action( 'init', 'init_posts_list_feature' );
```

## Development

### Production
```bash
jetpack build -p packages/post-list
```

### Development
```bash
jetpack build packages/post-list
```

### Development watching mode 👀
```bash
jetpack watch packages/post-list
```
