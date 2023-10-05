## Jetpack 12.7

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### SEO Tools/Sharing Sidebar

There are some new options in the Jetpack sidebar in the block editor. To test:

- Go to Posts > Add New.
- Click on the Jetpack plugin sidebar.
- Click on the "SEO" panel title.
- Click on the button.
- Verify that the module is enabled and working as expected.
- Click on the "Likes and Sharing" panel title.
- Click on the button.
- Verify that the module is enabled and working as expected.

### Jetpack AI Search Block

We've launched and AI Search block, moving it from beta to production! To test, create a new post and add the AI Chat bot. Play around with the block and the sidebar settings and make sure things work in the editor and on the front end.

## Known Issues:

- Button styling can be improved.
- It can sometimes be very slow.
- The search can be very hit or miss depending on keywords used in the question.
- It can only chat with posts & pages reliably. Products are harder to find.

### New Quick Share Options

We've added the quick-share options to the block editor panel. To test:

* Open up a new post, there should not be anything new.
* After publishing you should see the new Quick share Button if our panel is open
* Clicking the icon should open the Quick share dropdown
* Clicking on any of the icons there should work
* Clicking the learn more on the dropdown should open the help modal and close the dropdown.

### Add Forced 2FA Functionality when SSO is enabled

We have a new filter that will allow someone to force 2FA to be enabled when SSO is also enabled. There's no UI for this yet, but it would be good to do some functionality testing. To do so:

* Jetpack connnected + SSO enabled.
* Connect an account that does not have 2fa enabled to the Jetpack site (either cycle the connection or make a new admin user connected to a non-2fa WP.com account.)
* Create a new user with subscriber or contributor role.
* Log out and log back into admin account with regular WP creds (not SSO) This should work.
* Enable flag via `add_filter( 'jetpack_force_2fa', '__return_true' );`
* Log out and log back in with regular WP creds. It should fail.
* Log in with WP.com SSO with an account that has 2fa enabled. It should work.
* Log out and login with the non-2fa WP.com account via SSO. It should fail.
* Add a filter to modify the cap, e.g. `add_filter( 'jetpack_force_2fa_cap, function() { return 'read' } );`
* Verify that the contributor forces SSO.


### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
