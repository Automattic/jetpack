## 6.2

### AMP

We now allow Jetpack features to work on AMP pages, and prevent Jetpack features from rendering to the front end at all.

To test:

* Install amp-wp from Automattic/amp-wp master branch.
* Activate AMP in your site's plugins list
* To test Legacy AMP, add `?amp=1` to any post URL, e.g. http://example.com/2018/03/23/a-post/?amp=1.
* Expect to see that all Jetpack features work (or be hidden if broken) in this mode.
* To text Canonical AMP:
    * Use this code snippet. This will set the home page to use "canonical amp", which the the preferred way of using AMP after 1.0:
        ```
	function add_amp_theme_support() {
	    add_theme_support( 'amp' );
	}

	add_action( 'plugins_loaded', 'add_amp_theme_support' );
        ```
    * Expect all Jetpack features to work (or be hidden if broken) in this mode.
    * Now try using various Jetpack features and make sure they don't break validation (or simply break).
 

#### Screenshots

##### Legacy AMP

| Before  | After |
| ------------- | ------------- |
| <a target="_blank" href="https://user-images.githubusercontent.com/51896/40072400-91c49dc4-5828-11e8-91ad-38da1d92aca0.png"><img src="https://user-images.githubusercontent.com/51896/40072400-91c49dc4-5828-11e8-91ad-38da1d92aca0.png" alt="goldsounds ngrok io_2018_03_23_another-amp-post__amp 1" style="max-width:50%;"></a>  | <a target="_blank" href="https://user-images.githubusercontent.com/51896/40072460-c97f89f4-5828-11e8-9817-2b92a2b8bb65.png"><img src="https://user-images.githubusercontent.com/51896/40072460-c97f89f4-5828-11e8-9817-2b92a2b8bb65.png" alt="goldsounds ngrok io_2018_03_23_another-amp-post__amp 1 1" style="max-width:100%;"></a>  |

##### Canonical AMP

| Before  | After |
| ------------- | ------------- |
| ![goldsounds ngrok io_2018_03_23_another-amp-post_ ipad](https://user-images.githubusercontent.com/51896/40073029-8be896f6-582a-11e8-81e5-9cbb6f9c8435.png) | ![goldsounds ngrok io_2018_03_23_another-amp-post_ ipad 1](https://user-images.githubusercontent.com/51896/40073045-986d9a34-582a-11e8-9213-2b5a8e4481bc.png) |

### Contact Form

We fixed scrolling/height for very large contact forms.

* With Firefox
* Insert this shortcode in the html editor
    ```
    [contact-form][contact-field label="Name" type="name" required="1"][contact-field label="Email" type="email" required="1"][contact-field label="Website" type="url"][contact-field label="Message" type="textarea"][contact-field label="date" type="date"][contact-field label="multiple" type="checkbox-multiple" options="hi,one,two"][contact-field label="whatever" type="textarea"][contact-field label="Keep going..." type="text"][contact-field label="check" type="checkbox"][contact-field label="drop" type="select" options="whatever,yo,ma"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][contact-field label="" type="text"][/contact-form]
    ```
* Switch back to visual.
* Click to edit the form
* Expect to be able to scroll all the way down.


### Content Options

We now exclude CPTs like Portfolio and Testimonial when we toggle content/excerpt via the Blog Display option.

To test:

* Check a CPT archive page and check if you have the option to switch between content and excerpt (you shouldn't be able to).
* Check a Post archive page and check if you have the option to switch between content and excerpt (you should be able to).

### Shortcodes

We fixed the Facebook shortcode in wp-admin.

To Test:

* Paste a facebook post link in wp-admin editor, like https://www.facebook.com/WordPresscom/posts/10154113693553980
* You should see an facebook embed in the post editor.
* Make sure selective refresh still works for the facebook widget in the customizer.

We also added a Gutenberg block for the `[vr]` shortcode.

To test:

* Install Gutenberg
* Edit a post in Gutenberg
* Add a "VR Image" block to any post
* Paste in the URL of any 360' image, e.g. https://en-blog.files.wordpress.com/2016/12/regents_park.jpg
* Save the post.
* Visit the post and expect to be able to navigate the 360 image.

### Related Posts

We stopped attempting to fetch related posts for unpublished posts.

* Open the Javascript console
* Write a draft with Gutenberg. 
* Confirm that there's no failing request in the background receiving a HTTP status 400 as response.

### Sharing

Fixed an issue that resulted in wrong URLs for sharing via WhatsApp.

* Add the WhatsApp sharing button
* Attempt to share a post via WhatsApp
* Confirm that the URL that you get in the message is working properly by visiting it.

### Tiled Galleries

We now use Photon if active when a Tiled Gallery links to media file.

To test:

* Create a Gallery with the link set to Media File.
* Disable Carousel (via the old modules page `page=jetpack_module`).
* View page and see the URL.

### Widget visibility

We fixed some styling issues for Microsoft Edge.

To test:

* In MS Edge, open wp-admin/widgets.php and look at a widget's Visibility settings.
* Open wp-admin/widgets.php, click "Manage with Live Preview" to open the Customizer, and look at a widget's Visibility settings.
* Expect to see the red crosses align properly vertically.

### Widgets

#### Cookies and Consent Widget

The `.widget` CSS class used for targetting the Cookies and Consent widget was removed since .widget is not used in every theme.

To test:

* Apply one of the themes that don't use the `.widget` class like Graphene or Kahuna.
* Add the Cookie & Consent Widget to the footer widget area.
* View the site from the front-end. 
* Expect the banner to always float at the bottom of the viewport when scrolling down.

Also, we fixed the positioning for themes that set a specific margin for forms.

* Install and activate Storefront theme.
* Enable the cookie widget.
* Verify the margins are consistent within the widget. Previously the vertical alignment was not balanced.

We added a "top" option for the cookie widget position. The existing bottom of the screen position is the default.

To test:

* Add a Cookies & Consent Widget.
* Test both the top and bottom for existing and new instances of the widget. Test with and without the admin bar present.

#### Twitter Timeline Widget

Usage of Widget Ids for the Twitter Timeline Widget is being deprecated. This is because Twitter is deprecating Widget IDs in July 2018.

To test: 

* Before checking out this feature, if you have the chance, with Jetpack 6.1.1, try to add a Twitter Timeline of type `widget-id` to a sidebar (the only way to create a Twitter Widget right now is at https://twitter.com/settings/widgets/new: create a widget, edit it, and copy the ID from the URL).
* After updating to this 6.2 Beta again, make sure that the widget will display a deprecation notice, only visible to admins.
* In the Customizer or in the Widgets dashboard, make sure there is no "Widget Type" selector anymore.
 

**Thank you for all your help!**

