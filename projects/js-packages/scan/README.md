# Jetpack Scan Client

JavaScript client for consuming Jetpack Scan services.

## Usage

```
pnpm i @automattic/jetpack-scan
```

### Lib

Abstract classes and utilities are located in `src/lib`:

* `API` – Utility class for interacting with the Scan API.

### React Hooks

State-based wrappers for common functions are available via `src/hooks`:

* `useScan` – React hook for interacting with site security scans - enqueueing scans, checking progress, accessing results, etc.
* `useFixers` – React hook for interacting with threat fixers - enqueuing fixes, checking progress, etc.
* `usePolling` – Abstract hook for repeatedly running an async function until it returns a specified value.

### Strings and Localization

Internationalized strings can be found in `src/strings` and are generated using [@wordpress/i18n](https://developer.wordpress.org/block-editor/packages/packages-i18n/).

To use localized strings from this package, ensure the `@wordpress/i18n` peer dependency is installed, and use [setLocaleData](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/#setlocaledata) prior to using the strings.

## Contribute

We welcome contributions from the community. Please submit your pull requests on the GitHub repository.

## Get Help

If you encounter any issues or have any questions, please open an issue on the GitHub repository.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Scan Client is licensed under the GNU General Public License v2 (or later).
