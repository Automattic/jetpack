# Cache API Guide

## Intro

The Cache module uses WordPress actions to allow third party developers access to the cache on a site. They will be able to delete cache files for specific posts, or URLs or even delete the entire cache.

This will allow a developer to use this functionality without needing to check if Boost is installed or not.

## Accessing the API

The API uses actions and filters to access or modify the behavior of the cache. Use the `do_action` or `apply_filters` commands to fire the hook you want. They are loaded early, but it's safer to wait until after "init" to use them.

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

## Filters

### Modify the cache bypass filters

Filter hook: `jetpack_boost_cache_bypass_patterns`

Parameter: an array of regex patterns that define URLs that bypass caching

Usage:
```php
add_filter( 'jetpack_boost_cache_bypass_patterns', function( $patterns ) {
    array_walk( $patterns, function( &$item ) {
        $item = strtolower( $item );
    } );

    return $patterns;
} );
```

### Override if the current request is cacheable

Filter hook: `jetpack_boost_cache_request_cacheable`

Parameters: cacheable, URL

Usage:
```php
add_filter( 'jetpack_boost_cache_request_cacheable', function( $cacheable, $url ) {
    if ( stripos( $url, 'shop' ) !== false ) {
        $cacheable = false;
    }

    return $cacheable;
}, 10, 2 );
```

### Modify the list of content types the plugin should not cache

Filter hook: `jetpack_boost_cache_accept_headers`

Parameter: An array of content types in type/subtype format. If a browser accepts a content type listed here the page will not be cached

Usage:
```php
add_filter( 'jetpack_boost_cache_accept_headers', function( $accept_headers ) {
    array_walk( $accept_headers, function( &$item ) {
        $item = strtolower( $item );
    } );

    return $accept_headers;
} );
```
