## Jetpack 15.3

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Forms
The Forms inbox received many visual updates, so extensive smoke testing will be appreciated. Focus on interacting with the controls – removing, recovering and any other smoke test you can think of.

Reference to a state at the moment (might change during testing).

### Social
Related PRs: #45970, #45939

#### Testing Steps:

##### Emoty states updates
- Go to the editor and open Jetpack sidebar
- Confirm that you see the auto-share toggle changed to checkbox with the updated label
- Confirm that the checkbox and the description are visible
- Login as another user (author or admin)
- Go to the editor again
- Confirm that you see the empty state to connect the wp.com account first
- Connect the wp.com account
- Confirm that now you see the empty state to connect the Social media accounts – like in the pull request description

##### Updates to the connections list
- Go to the post editor
- Open Jetpack sidebar
- Confirm that the connection toggles list is replaced with the updated vertical list with icons and labels.
- Confirm that the UI matches the screenshots from the pull request
- Confirm that the label for connections management button is changed to “Add a new account”
- Toggle the connections ON/OFF
- Confirm that it works fine
- Try to share a post with some connections OFF
- Confirm that the post is shared only to the accounts which were enabled.

### Blocks
Related PRs: #45967, #45900, #45776

#### Testing Steps:

##### Video block
- Set up a test site with Jetpack and Gutenberg 21.4 or later
- Connect Jetpack and activate the VideoPress module
- The video block should be accessible with both Jetpack and VideoPress active.

##### Gif block
- Go to posts
- Create a new post and add a gif block
- Type a query and select any other gif than the first one
- Save the post
- The selection of the user should be properly applied

##### Google Sheets and Google Slides block preview
- Ensure beta blocks are enabled
- Create a new post / page
- Add a Google Sheets or Google Slides block to it
- Paste in the share URL of a Google Sheets or Google Slides document
- Save the post / page
- View the post on the front-end and verify the document preview renders.


**Thank you for all your help!**
