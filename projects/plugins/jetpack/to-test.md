## Jetpack 15.0

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Forms: MailPoet integration

Try the following:

1. Go to Jetpack -> Forms -> Integrations and install/activate the MailPoet plugin.
2. After adding a list or two in MailPoet, add a Form block and test the "Manage integrations" feature in the block settings, selecting what list contacts should be added to.
3. Submit a few forms and ensure submissions end up as contacts in the selected MailPoet list, with the email and name fields properly mapped.

### Forms: Dots-style progress indicator

1. Create a new post/page in the block editor
2. Add a "Form" block
3. Add multiple "Form Step" blocks inside the form (at least 3 steps for best testing)
4. Add a "Progress Indicator" block inside the form
5. Select the Progress Indicator block
6. In the block toolbar, click the style picker (should show "Line" and "Dots" options)
7. Choose "Dots" style
8. Expected: Circular dots appear with thin connecting lines, evenly distributed across the form width
9. Navigate between form steps using the step navigation controls
10. Expected: Active step dot is highlighted with primary color, completed steps show checkmark (✓) icons
11. Expected: Progress line fills between dots as you advance through steps

Verify the colors, transitions, animations and overall behavior match what one would expect.

### Social: Add support for Chinese, Japanese, and Korean fonts

1. Ensure the site has a paid plan that gives access to Social features.
2. Go to Jetpack -> Social and enable the Social Image Generator.
3. Click on "Change defaults", and ensure that the font setting shows and can be changed/saved there.
4. Create a post with a Chinese (e.g. simplified: `我会说一点中文`, traditional: `我會說一點中文`), Japanese (e.g. `日本語を少し話せます`) or Korean (e.g. `나는 한국어를 조금 할 줄 알아요`) title.
5. Open the Jetpack sidebar and confirm the Social Image Generator shows the text properly (adjusting the font as needed).

### Blocks

The way JavaScript loaded for some Jetpack blocks has changed. Make sure the following blocks work as expected:

* Jetpack AI Search
* Blogroll
* Cookie Consent
* Donations Form
* Google Docs (Beta)
* Image Compare
* Like
* Mailchimp
* Map
* Nextdoor
* OpenTable
* Podcast Player
* Paid Content
* Recipe (Beta)
* Payment Button
* Repeat Visitor
* Sharing Buttons
* Slideshow
* Subscribe
* Tiled Gallery

**Thank you for all your help!**
