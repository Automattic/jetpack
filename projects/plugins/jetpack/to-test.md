## Jetpack 14.8

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Tiled Gallery Block

Updates have been made to prevent block validation warnings (in the editor and in the browser console). Thorough testing of the Tiled Gallery block is recommended, though the issues fixed primarily affected multisites (including Simple sites). Here are some steps to follow:

* Create a Tiled Gallery. Set link type to anything, with carousel enabled (`/wp-admin/admin.php?page=jetpack#writing`).
* There should be no block validation issues. Both in the editor and front-end, behavior should be as expected.
* On the front-end you should be able to click on the post title then press tab to tab onto the images, and click enter to open them in Carousel - image markup (in the Tiled Gallery, not for Carousel images) should include tabindex of 0, role of button, and an aria-label. In the editor the image markup should not include an `aria-label`, `role` or `tabindex`.
* Disable Carousel, and images on the front-end should have no `tabindex`, `aria-label` or `role`. If link is set to "none", you won't be able to click on the images (it won't do anything). For any of the other link options, the link should work. There should still be no `aria-label`, `tabindex` or `role` - as the image is no longer the clickable element but instead is wrapped in an anchor tag.
* Ensure general functionality works as expected, as before.
* Duplicate a post or page with a Tiled Gallery block (to duplicate, enable the option to copy posts from `/wp-admin/admin.php?page=jetpack#writing`). On saving, there should be no block validation errors.
* Make sure custom links work, and adding them (and saving then refreshing the page) does not result in any layout issues, and the links remain (front-end as well).

Ideally testing would also be done both before and after updating to the new Jetpack version to ensure there are no block validation issues due to the update. If testing updating the version and using an existing Tiled Gallery, make sure to refresh the editor page with the block. You may need to resave the post and refresh to ensure that changes are applied, but subsequent page refreshes should show no issues in the editor or console.

### Multi-Step Form block

This is a beta block that could use some rigorous testing. This includes:

* Creating, editing, updating, and removing steps, fields, and the block itself.
* Navigating between steps, both with the mouse and the keyboard.
* Validation and submission
* Design should inherit site theme styles and be responsive.

Feel free to push its limits, trying the following:

* Large numbers of steps
* Large numbers of fields per step
* Language support (including RTL)

### Forms block changes

Things to test include the following:

* The File Upload field (beta) is nearly ready to go live.
* The Integrations panel (Forms block toolbar -> Integrations) has seen a bunch of UX improvements.
* The Feedback menu item should be fully removed (along with any references). It has been replaced by Jetpack -> Forms.
* New error validation UX on the frontend validates right away when unfocusing a field, instead of on form submit.
* There's now an Undo option in all FOrms inbox trash and spam actions.
* Removing items from the Options field is now possible with a little "X" next to each line.

**Thank you for all your help!**
