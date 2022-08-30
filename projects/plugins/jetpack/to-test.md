## Jetpack 11.3

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Gallery Blocks & Carousel

There have been several changes made to the Gallery blocks and Carousel. In particular, we improved the way Carousel works with reusable Gallery blocks [[#25441](https://github.com/Automattic/jetpack/pull/25441)]. To test, try the following:

- On a Jetpack connected site, make sure Carousel is enabled in the Media section of the Writing tab in Jetpack Settings.
- Create a new post and add a standard Gallery block and make sure it is using the Carousel by setting the 'Link to - media file' in the block settings.
- Check the post and see if the carousel is showing up when an image is clicked on.
- Duplicate the gallery and save it as a reusable block. 
- Test if the reusable gallery is still opening a carousel.
- Repeat the test using Tiled Gallery block.
- Switch between a few themes and verify consistent behavior in each theme.

Improvement was made to Gallery block and Carousel when images style is set to rounded and a custom URL is used [[#65350](https://github.com/Automattic/wp-calypso/issues/65350)]. To test, try the following:

- On a Jetpack connected site, make sure Carousel is enabled in the Media section of the Writing tab in Jetpack Settings.
- Create a new post and add a standard Gallery block and make sure it is using the Carousel by setting the 'Link to - media file' in the block settings.
- Set each image style to rounded.
- Add a custom link to some images.
- View the post and click the white space between the images (the part where the corner of the image has been cut off). 
- Note it opens a carousel view for images with no custom URL and the appropriate link if the image has a custom URL.
- Switch between a few themes and verify consistent behavior in each theme.


### Payments Buttons

A new Payments Buttons block was added that acts as a container for several Payment Button blocks [[#25297](https://github.com/Automattic/jetpack/pull/25297)]. Note that testing this requires a pid plan and Stripe connection.

- On a Jetpack connected site, create a new post and add a Payments Buttons block.
- If you don't have a paid plan, you will be asked to upgrade.
- You will be asked to connect to Stripe.
- Select the Payment Buttons block and try adding several Payment Button block inside it.
- Make sure you can select different plans for each button.
- Make sure you can change the width of each button.
- View the post and confirm Payment Blocks look as intended.


### Google documents, spreadsheets and slideshows

We are adding support for Google documents, spreadsheets and slideshows. [[#24628](https://github.com/Automattic/jetpack/pull/24628)]. Please note these blocks are still in beta so testing them requires enabling JETPACK_BETA_BLOCKS constant in the site Settings. To test, try the following:

- On a Jetpack connected site create a new post.
- Search for Google blocks and add each block to your post.
- Populate the blocks with links to publicly available documents.
- Try adding a link to a private document. You should see a warning.
- Publish the post and view the front end. Documents should be available to users.

**Thank you for all your help!**
