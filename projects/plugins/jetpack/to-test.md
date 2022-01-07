## 10.5

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Updated Print Media Styles

When printing posts, additional interactive elements not meant for print have been hidden. To test:

- In `Jetpack > Settings > Traffic` enable the Related Posts feature, and in `Jetpack > Settings > Sharing` enable and configure sharing buttons. Also enable Likes for a particular post to test with.
- When printing your test post, you should not see the Like button, "Share this" section, or the list of Related Posts.

### Subscription Form Block Custom Success Message

The success message for the Subscription Form block can now be customized from the editor's block settings:

- Make sure subscriptions are enabled in `Jetpack > Settings > Discussion`.
- In a new test post, add a Subscription Form block and customize the "Success Message Text" from the block settings panel.
- Save your post and test you are able to see the customized success message displayed on the frontend after submitting the form.

### Single Sign On Error Filters

Added filters for customizing error text when a local user cannot be found for a given WordPress.com account, and for when Single Sign On (SSO) is disallowed on a staging site:

- Example: add `add_filter( 'jetpack_sso_unknown_user_notice', function() { return 'Customer error text: we do not know you.'; } );` to a site with SSO enabled. Then try signing into that site with a WordPress.com account not associated with the site - you should be able to see the custom error text.
- The other filter added is `jetpack_sso_disallowed_staging_notice` which can similarly be used to customize error text for staging sites that use SSO. Constant `define( JETPACK_STAGING_MODE, true );` can be used to test staging mode.

**Thank you for all your help!**
