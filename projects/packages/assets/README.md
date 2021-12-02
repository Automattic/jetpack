# Jetpack Asset Management

A package containing functionality to improve loading of assets (scripts, etc).

Includes manipulation of paths, enqueuing async scripts, and DNS resource hinting.

### Usage
`::add_resource_hint( $urls, $type )` -- Adds domains (string or array) to the WordPress' resource hinting. Accepts type of dns-prefetch (default), preconnect, prefetch, or prerender. 

### Testing

```bash
$ composer run phpunit
```
