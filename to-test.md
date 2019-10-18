## 7.8

### Admin Page

We've made some changes to simplify the Jetpack Dashboard interface when your user is not connected to WordPress.com yet. You can check this by adding a new admin (or any other role) user to your site, logging in with that user, and going to Jetpack > Dashboard. You should only see things that you can act on, depending on your role.

### Blocks

We've made some changes to ensure that blocks are properly translated in the block editor. If you switch to a language that offers language packs, like French or Spanish, you should see that Jetpack Blocks will now be translated in the editor.

## Contact Form Block

The Contact Form Block now includes options for showing a custom post-submission message, or to redirect to a different URL.

### Carousel

In this release, we've made some changes to how the Carousel metadata was added to each gallery. To test this:

* In a new post, insert a variety of blocks:
	- A classic block with a gallery
	- A classic block with a tiled gallery
	- A gallery block
	- A Tiled Gallery block
	- A column block with some text
	- A column block with a gallery block in it.
* Publish your post
* When moving your mouse over each block, make sure the cursor only becomes a pointer when the element can be expanded to a Carousel modal.

### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticible and report anything you see.

**Thank you for all your help!**
