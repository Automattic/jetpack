## 9.9

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Instant Search

Improvements were made to Jetpack Search, a paid upgrade to the Jetpack plugin that provides higher quality results and an improved search experience.

To test, try:

- Add the Jetpack Search widget to your site.
- Run some test searches and make sure results appear as expected and that there are no design conflicts
- The Instant Search overlay shouldn't appear while typing. The sliding animation has been removed and the overlay should appear faster.
- Make sure searches are paginated properly and that pagination works correctly.

### Carousel

The Jetpack carousel module for galleries has been [updated](https://github.com/Automattic/jetpack/pull/20107) for both mobile and desktop experiences. For testing, try:

* **When viewing the galleries, please test across different web browsers (mobile and desktop)!**
* In `/wp-admin/admin.php?page=jetpack#/writing` make sure the carousel feature is activated.
* Create a new post/page with galleries using: Gallery block (wp:gallery), Tiled Gallery block (wp:jetpack/tiled-gallery), and insert a Classic block and use the `Add Media` toolbar option to create a gallery (a [gallery] shortcode will be generated).
* Add a Gallery widget to one of your site's widget areas.
* On Desktop, make sure the gallery/lightbox functions well. Test leaving comments and viewing the image info (`i`), also try zoom/pan on the image.
* On Mobile, make sure that you are able to swipe between images smoothly, also try double tap to zoom/pan. Also check comments/info.
* Check that the gallery you placed in a widget area functions as expected.
* In `/wp-admin/admin.php?page=jetpack#/performance` toggle "Enable site accelerator / Speed up image load times" (aka Photon). When Photon is enabled, this should provide the best experience for larger dimension images.
* In `/wp-admin/options-media.php` make sure toggling Exif & comment options works as expected. Also try changing the carousel background color and check for any design conflicts.
* Try changing themes (perhaps to an older theme) and look for any conflicts.

You'll want to make sure Carousel works as expected in all scenarios, in different browsers. You can also test things when disabling Jetpack's Site Accelerator under Jetpack > Settings > Performance.

### WordPress 5.8 Compatibility

With WordPress 5.8 releasing in July, feel free to install and activate the WordPress Beta Tester plugin and test the Jetpack 9.9 Beta alongside WordPress 5.8. Things to check would be:
- Jetpack blocks (in the editor and the Full Site Editing interface, such as the site footer).
- Jetpack widgets 
- Any and all feedback is welcome!

**Thank you for all your help!**
