## 7.9

For this round of testing, I would encourage y'all to install [WordPress' Beta Tester plugin]() on your sites, and switch to using WordPress 5.3 Beta. It will allow you to test Jetpack with the upcoming version of WordPress scheduled to be released in a few weeks.

### Blocks

#### AMP

Both the MailChimp and the SlideShow blocks now work well with the AMP plugin.

To test this, try adding either of those blocks to a site where you use the AMP plugin. When visiting your site on an AMP view, you should be able to use the 2 blocks with no issues.

### SSO

When on WordPress 5.3 and with the SSO feature active, you'll want to make sure the login form always looks good, with no layout issues or missing WordPress.com button when logging out / in.

### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticible and report anything you see.

**Thank you for all your help!**
