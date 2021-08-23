## 10.0

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Carousel

Additional bug fixes and improvements have been made to the Jetpack Carousel module for galleries. Updates include:

- A "Display colorized slide backgrounds" option has been added which will show a subtle color background behind a slide based upon the average color of that particular image. You can find this optional setting toggle in `Jetpack > Settings > Writing` under the Media options.
- When zooming in on an image, the footer controls will be hidden until the view is returned to normal or the image is swiped/tapped.
- Added a smooth scroll behavior when opening/closing the icon buttons in the footer of the Carousel.

### Instant Search

Bug fixes were made to Jetpack Search, a paid upgrade to the Jetpack plugin that provides higher quality results and an improved search experience. Of note, when [opening the Search Overlay from a link](https://jetpack.com/support/search/install-search-on-your-site/#add-overlay-link) the search query is now correctly set in the URL so the "Showing popular results" header appears as expected.

### WordPress 5.8 Compatibility

WordPress 5.8 released on July 20th, 2021! As with prior releases, we've continued to watch for and resolve compatibility issues. When testing with WordPress 5.8 and Jetpack 10.0, be sure to give the following a try:

- Jetpack blocks (in the editor and the Full Site Editing interface, such as the site footer).
- Jetpack widgets (especially using the new block-based widgets editor).
- Any and all feedback is welcome!

**Thank you for all your help!**
