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

**Thank you for all your help!**
