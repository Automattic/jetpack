# Cache API Guide

## Intro

The Cache module uses WordPress actions to allow third party developers access to the cache on a site. They will be able to delete cache files for specific posts, or URLs or even delete the entire cache.

This will allow a developer to use this functionality without needing to check if Boost is installed or not.

## Accessing the API

Use the `do_action` command to fire the hook you want. The actions are loaded early, but it's safer to wait until after "init" to use them.

## Actions

### Delete the entire cache

Action hook: `jetpack_boost_clear_page_cache_all`

Usage:
```php
do_action( 'jetpack_boost_clear_page_cache_all' );
```

### Delete the homepage and paged archives. Deletes the static page and posts page if that is enabled.

Action hook: `jetpack_boost_clear_page_cache_home`

Usage:
```php
do_action( 'jetpack_boost_clear_page_cache_home' );
```

### Delete the cache for a specific URL

Action hook: `jetpack_boost_clear_page_cache_url`

Parameter: the URL of the cache page to be deleted

Usage:
```php
do_action( 'jetpack_boost_clear_page_cache_url', 'https://example.com/' );
```

### Delete the cache for a specific post, including paged comments

Action hook: `jetpack_boost_clear_page_cache_post`

Parameter: the post_id of the post to clear

Usage:
```php
do_action( 'jetpack_boost_clear_page_cache_post', 15 );
```
