## 9.5

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Dashboard

This release introduces a new banner, appearing in the main dashboard and on the Plugins page once you've connected Jetpack to WordPress.com. To test, try the following:

* On a new site visit wp-admin. Verify that the dashboard banner displays.
* Do one of the following:
    * Select some options and click continue. If you chose store, verify that you are taken to the WooCommerce prompt. If not, verify that you are taken to the Monitor prompt. Return to the wp-admin dashboard and verify that the dashboard banner does not display.
    * Dismiss the banner and reload the page, verifying that it does not display.

### Tiled Galleries

Tiled Galleries now work without the need of jQuery. To test that the galleries still work, try the following:

1. Follow [instructions to set up tiled galleries](https://jetpack.com/support/tiled-galleries/).
2. Create 2 new posts:
    - One using a classic block, and a tiled gallery in that block
    - One using a Tiled Gallery block
3. Ensure that in both scenarios, tiled galleries still work, regardless of the gallery type (square, circle, colunmns...) you choose.

**Thank you for all your help!**
