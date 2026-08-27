# Jetpack Debug tools

This is a plugin to help developers debug some Jetpack features. 

Once activated, you will see a new Menu item in your admin dashboard called `Jetpack Debug`. Visit this page to activate the modules you want.

## Available Modules

### Broken Token Utilities

This module let's you easily break your Jetpack connection by invalidating or erasing the tokens in many different ways.

It also allows you to inspect the XML-RPC error reporting and validation.

When activated, you'll see two new menu entries under the Jetpack menu:

* Broken Token - to break things
* XML-RPC Errors - to inspect errors

### REST API Tester

REST API tester lets you send custom requests to Jetpack REST API and review the response. JSON responses are validated and auto-formatted.

### Sync Debug Utilities

Adds some debugging to sync

**Note:** This module is not currently being maintained. 

### Data Mocker
The tool allows you to mock data in the database for performance testing.

There are two mockers implemented:
- Options to generate random options.
- Nonces, to create Jetpack Nonces with random timestamps.

#### Adding a Custom Mocker
1. Create a class implementing `Automattic\Jetpack\Debug_Helper\Mocker\Runner_Interface` that mocks the data.
2. Add it into the list in `Automattic\Jetpack\Debug_Helper\Mocker::$runners`.

### Package Provenance

Shows which runtime serves each WordPress package on the current admin screen: WordPress core, the Gutenberg plugin, Jetpack's wp-build-polyfills, or another plugin. A badge in the admin bar (`WP x · GB y`) opens a panel listing every registered `wp-*` script and script module with its provider, the plugin tree the file ships from, and its version.

With the module active, a WP-CLI command predicts the same table for WordPress and Gutenberg versions the site is not running, and checks whether the private-apis copy that would win accepts the module names the site's bundles opt in with:

```
wp jetpack-debug provenance predict --wp=7.0.4,7.1 --gutenberg=off,23.8.0
wp jetpack-debug provenance predict --wp=7.1 --gutenberg=/tmp/gutenberg.zip --format=json
```

`--wp` takes release versions or `trunk` (read from the WordPress/WordPress mirror on GitHub; the running version is read from disk). `--gutenberg` takes `off`, `active`, a release version (downloaded from GitHub Releases), or a path to a plugin zip or directory. Downloads are cached in the system temp directory; `--refresh` bypasses the cache. The command exits with status 1 when any cell rejects an opt-in, so it can gate a script.

To evaluate another checkout (a branch that bumps the bundled `@wordpress/*` packages, say) without switching sites, point `--polyfills` at that checkout's `projects/packages/wp-build-polyfills` and `--plugins` at its built plugins. In the monorepo Docker environment, mount the other worktree through `tools/docker/jetpack-docker-config.yml`:

```
wp jetpack-debug provenance predict --wp=7.0.4,7.1 --gutenberg=off,23.8.0 \
  --polyfills=/usr/local/src/other-worktree/projects/packages/wp-build-polyfills \
  --plugins=/usr/local/src/other-worktree/projects/plugins/jetpack,/usr/local/src/other-worktree/projects/plugins/premium-analytics
```
