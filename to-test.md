## 6.3

### Connection

We refreshed the connect splash screen to help new users learn more about Jetpack.

To test:

* Deactivate Jetpack from the plugins menu.
* Activate Jetpack again, see the splash screen.

### Custom Content Types

We fixed compatibility when using Testimonials and a front-end editing plugin.

To test:

* Using the (Front-End Editor feature plugin)[https://wordpress.org/plugins/wp-front-end-editor], confirm no fatals when the testimonial CPT is active.

### Dashboard

We removed the labels reading `PAID` for those paid features that are not enabled yet due to your plan. 

To test:

1. Visit the Jetpack dashboard with a free plan
2. Confirm that you don't see the PAID label next to the dashboard items. Refer to [#9732](https://github.com/Automattic/jetpack/pull/9732) for screenshots.

### General

We added support for displaying geo-location data added to posts and pages with Calypso.

### Lazy Images

We fixed the behaviour when JavaScript is disabled.

To test:

- Add lazy images to a post.
- Load post with JavaScript on.
- Ensure lazy images load once.
- Turn off JavaScript.
- Reload post.
- Ensure that the image loads via the noscript tag and the lazy images image is hidden. In other words, there shouldn't be a large blank spot.

### Markdown

We fixed the way we name the CSS class for `<code>` when attempting to specify a language for a code block.

To test:

1. Enable markdown.
2. Write a test post with a Markdown syntax code block. Something like:
    ```
       ```javascript
          var a = 2;
       ``` 
    ```
3. Preview the post, then view source code of the preview page. The post content should show `<code class="language-javascript">`.

### Protect

We solved an issue related to interaction with bbPress when trying to log in via a bbPress login widget. You would get redirected a few times to log in again after solving the math puzzle.

To test:

1. Install bbPress;
1. Connect Jetpack and let default modules activate, leave bbPress settings to default.
1. Add the bbPress login widget to the sidebar.
1. Add the line define( 'JETPACK_PROTECT__API_HOST', '' ); to wp-config.php, breaking the API connection, which should invoke the math puzzle on login.
1. Try logging in via the bbPress widget.

### Simple Payment

We added support on the Customizer to add Simple Payment Buttons as Sidebar Widgets.

To test:

**Note**: There was a specific call for testing this feature. Refer to p8oabR-ey-p2. 

But here are some steps to give it a try:

1. Create one or more Payment Buttons on the Post/Page editor.
2. Open the Customizer on a site with a Professional plan.
3. Get to 'Widgets' and select a Widget Area.
4. Click on Add Widget.
5. Search on the widget panel for Simple Payment.
6. Select the Simple Payment widget
7. The Simple Payment Customizer should list the available Payment Buttons, and the Customizer Preview should show the item selected by default. All changes should update live on the preview window and the site should only be updated upon publishing.

To **create a new product**, you'll need to:

- click on _Add New_
- fill the form. Using an image is optional, but it should open the media library if clicked.

The widget preview on the customizer should clear out, and display the entered values as they are typed on the form.

- click _Save_

The form should close, and the new SP button should be added to the drop down list. The customizer preview should show the new SP button.

- click _Cancel_

The form should clear and close, and the previously selected SP button should appear on the customizer preview.

To **edit and existing product**, you'll need to:

- Select the desired product from the drop down list
- click on _Edit Selected_

The form should load the product properties, and the widget preview on the customizer should show the correct product, and update the values as they are edited on the form.

- click _Save_

The form should close, preserving the changes on the customizer preview window and the selected item on the product drop down list.

- click _Cancel_

The form should clear and close, and the previously selected SP button should appear on the customizer preview.

To **delete an existing product**, you'll need to:

- Select the desired product from the drop down list.
- click on _Edit Selected_

The form should load the product properties, and the widget preview on the customizer should show the correct product.

- click _Delete_

After confirming the action, the selected product should disappear from the product drop down list. The first product on the list should be selected, and the customizer preview should reflect this change. 

### Sitemap

We fixed the format of the date shown for videos on the video sitemap.

To test:

1. Have a site with a video that would generate a video sitemap.
4. Review sitemap.xml and expect to see the correct format of `2018-06-08T14:51:39Z`

### Stats

We fixed the width of the classic page for Stats in order to look better on wide screens.

1. Visit Site Stats with a wide screen and confirm that everything looks great. Refer to [#9728](https://github.com/Automattic/jetpack/pull/9728) for screenshots.

**Thank you for all your help!**
