## Usage in the Jetpack Monorepo

1. Add `automattic/jetpack-wordpress-dataviews-snapshot` to "requires" in your composer.json.
2. Arrange for the `init.php` file to be required sometime before `wp_loaded` priority 10, something like this.
   ```php
   require_once __DIR__ . '/jetpack_vendor/automattic/jetpack-wordpress-dataviews-snapshot/init.php';
   ```
   This is necessary to register the script handle.
3. In your Webpack configs, find any invocations of the `StandardPlugins()` function and pass it an options object like this.
   ```js
   {
      DependencyExtractionPlugin: {
          requestMap: {
              '@wordpress/dataviews': require(
                  path.join(
                      __dirname,
                      'jetpack_vendor/automattic/jetpack-wordpress-dataviews-snapshot/build/dependency-data.json'
                  )
              ),
          },
      },
   }
   ```
   If you're already passing an options object, merge this into it.
