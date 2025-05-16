# Search

Tools to assist with enabling cloud search for Jetpack sites. The search package provides a search interface for the [Elasticsearch](https://www.elastic.co/elasticsearch/) search engine.

This package currently supports three modes:

- Classic Search – Uses the 1.0 API and will be gradually deprecated. It integrates via standard WordPress hooks, replacing the backend search logic while preserving the theme’s existing search display.
- Inline Search – Uses the 1.3 API. Like Classic Search, it integrates via standard hooks to replace the backend logic without altering the theme’s front-end output.
- Instant Search – Uses the 1.3 API and provides a dynamic, standalone UI with search-as-you-type functionality.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-search is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
