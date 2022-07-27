## Jetpack 11.2

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Slideshow Block

There have been a couple of improvements to the Slideshow block (preventing a gap from displaying underneath the slideshow when a large number of images are present [[#24961](https://github.com/Automattic/jetpack/pull/24961)], and adding CSS to fully support the options to align wide and full [[#25107](https://github.com/Automattic/jetpack/pull/25107)]). To test, try the following:

- On a Jetpack connected site, create a new post and add a Slideshow block.
- To test the changes to the align wide and full options, add a few images of varying heights and widths to the block.
- Additionally, add a Cover block and Gallery block, all three set to 'Align none' from the toolbar.
- In a new window, copy all of the blocks into a second post, and set each block to 'Align Wide'.
- In another new window, copy all of the blocks into a third post, and set each block to 'Align Full'.
- View each of your three posts and verify the Slideshow block follows the same behavior as the Cover block and Gallery block.
- Switch between a few themes and verify each block displays consistent behavior in each theme.
- To test that there is no gap underneath the slideshow with a large number of images, first install the [CoBlocks plugin](https://wordpress.org/plugins/coblocks/) (if you have the ability to install plugins on your test site).
- Add a large number of images (via any method - uploading, media gallery, or Pexels / Google Photos / Openverse) - 40+ ideally.
- Verify that there is no (large) gap between the Slideshow block and the content below, and the slideshow pagination should be visible as well.
- Switch between a few themes and verify the behavior (no large gap) is consistent across themes.


### Form Block

Several improvements have been made to either the Form block or form submissions, so testing this out will help to make sure there are no additional bugs here. One fix is related to checkbox group option color [[#24932](https://github.com/Automattic/jetpack/pull/24932)], another related to preventing removal of the submit button [[#24838](https://github.com/Automattic/jetpack/pull/24838)]. Note that these can't be tested on WoA sites (Pressable is fine), aside from testing line breaks in form submissions [[#25040](https://github.com/Automattic/jetpack/pull/25040)] - only if your WoA test site has a form on it to test with in that case.

- On a Jetpack connected site, create a new post and add a Form block.
- Add a Checkbox Group within the Form block (to do this, you can click on any of the form fields, then click on the toolbar additional options, and 'Insert After' ( or 'Insert Before'), then add a Checkbox Group with several items added).
- Change the text color in the Form block settings (to do this, you need to make sure the parent Form block is selected, instead of any of the form fields, then select Color -> Text from the sidebar).
- Review the text color of the items in the Checkbox Group - the color set in the previous step should be applied correctly.
- To test that the form block submit button cannot be removed, select the Button block within the Form block and verify that the option to remove the block is not present (under the additional options in the toolbar - normally this would be the last item in the dropdown menu).
- If you had existing form blocks on your test site, verify that these changes have also applied to the relevant contact button blocks too.
- Additionally, if you do have a form on your test site, verify that a submission including multiple line breaks respects those line breaks or new lines (you can check the 'Feedback' menu item in your wp-admin dashboard to view any submissions)


### Jetpack Connection

Over the past month, various issues related to the Jetpack connection flow have had fixes. Below are several different connection scenarios. If you can test some, all, or any one of these (or others not mentioned here) that would be really helpful.

- With Jetpack installed and active on your test site (but not connected), try different connection flows. If you have access to the Beta plugin settings on your site, double check that the Release Candidate is active.
	- Some connection flows include via the full-page connection banner that you see immediately after activating the plugin, the connection banner on the plugins page or wp-admin dashboard, and the connection banner on the Jetpack dashboard (`wp-admin/admin.php?page=jetpack#/`)
- [This flow currently doesn't seem to work when testing with the Jetpack Beta Tester plugin, so unless you have access to the site's files via FTP/SSH to copy over the changes in `class.jetpack.php` [here](https://github.com/Automattic/jetpack/pull/25135) it will be difficult to test]. With Jetpack installed and active on your test site (but not connected), install and activate WooCommerce and begin to go through the onboarding flow (no need to add payment details - you can select the 'cash on delivery' option to keep going through the setup flow). You should get as far as activating a theme, and then should be redirected to a Jetpack authorization prompt.
- Using the WordPress app, under 'My Sites' you can click the plus icon to add a new, self-hosted site. Continue to add a site, and once added go to Plugins > Jetpack, then scroll down and select 'Set Up Jetpack'. While the mobile connection flows may differ slightly and some issues may not be on the Jetpack side - there is currently an issue connecting Jetpack via the Stats menu item for example.
- Any other connection or onboarding flows that connect to Jetpack, that you are aware of.

**Thank you for all your help!**
