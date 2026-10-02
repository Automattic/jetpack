# wpcom-proxy

REST proxy to the WordPress.com API for Jetpack packages: one route, an endpoint allowlist with a capability per entry, a blog-signed forward and a short cache.

A product that shows WordPress.com data in wp-admin declares the endpoints it needs; the package registers the route, checks the capability, forwards the request signed as the connected blog, caches successful reads for five minutes and returns WordPress.com's status and body as they came.

## Usage

```php
use Automattic\Jetpack\WPCOM_Proxy\Proxy_Controller;

( new Proxy_Controller(
	'jetpack/v4/videopress',
	array(
		'stats' => array(
			'capability' => 'view_stats',
			'pattern'    => '(?:video-plays|video/[0-9]+)',
		),
	),
	'jetpack_videopress_proxy_'
) )->register_hooks();
```

This registers `GET /jetpack/v4/videopress/proxy/v<version>/stats/video-plays` and `.../stats/video/<id>`, forwarded to `https://public-api.wordpress.com/<base>/v<version>/sites/<blog id>/stats/...`. The base follows the version: `rest` for 1.x, `wpcom` for 2.

Call `register_hooks()` on every request where the route or the cache cleanup must exist, before `rest_api_init`.

### The table

Keys are the top-level prefixes the route accepts, lowercase. A request is only routed, and the blog token only forwarded, when its first path segment is a key. Per entry:

| Field | Required | Meaning |
| --- | --- | --- |
| `capability` | yes | Capability that reads the group. `manage_options` always reads. A missing value admits administrators only. |
| `pattern` | no | Regex the sub-path must match in full, for a group that exposes specific endpoints only. Anchored in the route regex and re-checked on the request param. |
| `writes` | no | Sub-paths reachable with `POST`, the only write method. A matcher ending in `/` covers everything under it; otherwise it covers that endpoint only. |
| `cache_bust` | no | A successful `POST` to the group clears the matching read cache. |
| `path` | no | `printf` template with `%d` for the blog id, for an endpoint outside `/sites/<id>/`, such as `/upgrades?site=%d`. Such a group takes no sub-path. |

### Options

The fourth constructor argument takes `connection_slug` (the plugin slug handed to the connection manager), `cache_ttl` (seconds, default 300) and `api_timeout` (seconds, default 20).

### Requests and responses

Query params pass through, except WordPress routing params and the proxy's own: `endpoint`, `version`, `force_refresh` and `site`. `force_refresh` skips the cache in both directions. Errors are never cached, and an error from WordPress.com keeps its status and body. A site without a connection gets `no_connection` with a 403; a transport failure, `api_error` with a 500; an unreadable success, `api_error` with a 502; a write outside `writes`, `rest_read_only` with a 405.

Cached reads live in transients under the prefix the product passes, keyed by path, version and params in any order. The prefix joins `jetpack_stats_transient_cleanup_prefixes`, so the Stats package's cron sweeps expired entries where WordPress would not.

### Extending the controller

Three protected seams, for a product with a need beyond the table: `request()` (the transport, by default the blog-signed call behind the connection gate), `prepare_body()` (the body of a write, forwarded untouched by default) and `extract_forwarded_headers()` (response headers to pass back, none by default). Override them in a subclass; the group's table entry travels in `$opts['config']`, so a product can key its behaviour on fields of its own.

## Security

The table is the boundary. Every entry needs a capability, reads are the default, and the blog token never travels outside the table. Cached responses are stored in the options table like any transient; give each product its own prefix so two tables with different capabilities never share an entry.

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## License

wpcom-proxy is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
