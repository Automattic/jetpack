## Jetpack 15.8

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Jetpack Connector

On a test site with WP 7.0, try the following:

1. Make sure Jetpack is not connected but installed and active.
2. Go to Settings->Connectors. The card should be there.
3. Try connecting.
4. Add more connectable plugins (other Jetpack plugins, WooCommerce, A4A, Blaze Ads…) – they should show up in the connector.
5. Confirm that when Woo plugin is active the main logo changes to include Woo. Try adding A4A and confirm the logo change again. 
6. Disconnect only your user account (don’t disconnect the site) – the site should stay in site only connected mode.
7. Reconnect user account.
8. Create another admin user, log in to the site as that user and navigate to the Connectors page. It should show the connected owner and offer to connect your account. Connect it as a different WPcom account. Disconnect the account.
9. Confirm the Connection details modal displays URLs, Blog id, and SSO status.
10. Disconnect the site.

### Forms date filters

After populating some form data, play with the following:

* Set date filter and its operators
* Change locales between US English and something else, and note how date formatting changes in the rows and sidebar.
* Verify dates between row and sidebar are consistent, and sidebar uses a time in addition to just date.

### Components and colors

In efforts to standardize component usage across Jetpack and the wider WordPress ecosystem, a lot of under-the-hood changes have taken place, switching to use @wordpress/components and @wordpress/ui. Please take note of any interfaces that seems particularly inconsistent or broken.

Along with this, the colors have been changed throughout to better match Core.

### WordPress 7.0 compatibility

The next stable release of WordPress has new release date: 20 May 2026. Poke around at some of the new features that need testing. A partial list of features can be found [here](https://make.wordpress.org/core/). Report any compatibility issues you might find!
