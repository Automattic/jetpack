# Jetpack Post List Package

Enhance the classic view of the Admin section of your WordPress site.

## How to Use

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-post-list).

Use composer to add the package to your project:
```bash
composer add automattic/jetpack-post-list
```

Then you need to initialize it on the `admin_init` hook:

```php
add_action( 'admin_init', array( '\Automattic\Jetpack\PostList\Post_List', 'configure' ) );
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

### Development Watching Mode 👀
```bash
jetpack watch packages/post-list
```
