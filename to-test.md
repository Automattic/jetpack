## 8.7

### Autoloader

We've made some changes to the "Autoloader" tool we use to manage Jetpack libraries that are used in multiple plugins on the same site. This change should have no performance impact on sites using multiple plugins that rely on Jetpack libraries. The VaultPress plugin is a good example; you should be able to keep using both VaultPress and Jetpack with no issues. You can also test using a plugin like [this one](https://github.com/Automattic/client-example).

### Blocks

#### Mailchimp, Calendly, Payments, Eventbrite

We've made a number of changes to add more customization options to the buttons offered by the blocks above. To test this, try editing some of you existing blocks, and try creating new ones: you should now see more options to customize the block in the block sidebar, and any changes you make should appear in the block editor and on the frontend.

### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

**Thank you for all your help!**
