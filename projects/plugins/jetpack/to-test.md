## Jetpack 11.1

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Lazy Images [[#24643]](https://github.com/Automattic/jetpack/pull/24643)

We've updated Jetpack's [Lazy Images feature](https://jetpack.com/support/lazy-images/) to be compatible with a recent Safari browser update which enables native lazy loading of images by default. To test, try the following:

- Make sure you are using Safari version 15.4 or later to test with. If you have an iPhone or iPad running iOS 15.4+, this will be the perfect place to test that change.
- On a Jetpack connected site, check that Lazy Images are toggled on in: Jetpack → Settings → Performance
- Create a test post/page with a gallery block. Add enough images for multiple rows and so that you will need to scroll down the page to view all the images (you could also use a spacer block above the gallery).
- In Safari, view your created gallery at multiple viewport widths. Refresh the page a few times and make sure that when you are scrolling down to lazily load images, all of the images load.
- Test with a different theme active on the site.
- Try updating your created gallery/image block settings and make sure that all images still load as expected.
- Give your gallery page a quick look in other browsers (e.g. Chrome, Firefox).

### Contact Form [[#24450]](https://github.com/Automattic/jetpack/pull/24450/)

The [Contact Form](https://jetpack.com/support/jetpack-blocks/contact-form/) has undergone some maintenance cleanup. Verify expected functionality of forms remains by:

- On a Jetpack connected site, add a Jetpack Contact Form block to a new test post.
- Start with any form type and try adding/editing a few form fields. In particular, try adding a multiple checkbox field, with multiple possible entries.
- In the form block settings, specify an email address for new form submission notifications.
- Using a private browsing window, submit some test form responses.
- Make sure you receive email notifications for the test form submissions.
- Try updating more of the form block settings (e.g. confirmation message) and verify that things work as expected.

**Thank you for all your help!**
