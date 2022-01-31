## 10.6

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Instant Search

In this release, we've continued to make progress towards a Jetpack Search plugin. This involved making changes to the Search feature as it is packaged in the Jetpack plugin, so it's worth testing it still works as advertized. Try the following:

1. Purchase a Search plan.
2. Go to Jetpack > Settings > Performance and toggle the feature on and off.
3. Go to Jetpack > Search and toggle the feature on and off.
4. Click the link there to go and customize the search page.
5. Check that your changes still look good on the site's frontend.
6. In Appearance > Widgets, add widgets to the Jetpack Search Sidebar area, and ensure those widgets appear when you view the Search results on your site's frontend.

### Pay with PayPal Block

In this release we've fixed some bugs with this block. It's a good opportunity to test it again. You'll need to purchase a paid bundle first, such as the Complete plan. Then, head to Posts > Add New and try adding a Pay with PayPal block. Let us know if you run into any issues with the layout in the editor, currencies, or layout on the site's frontend.

### Tiled Gallery Block

We've made changes to the Tiled Gallery block to ensure it can be used from the mobile apps as well. You'll want to make sure it can still be used from the block editor on the web (no need to test on mobile for this release specifically):

1. Look for posts that were published in the past and that included tiled galleries; edit those posts, and ensure you can edit the galleries without any errors.
2. Try publishing new posts with one or more tiled galleries.

### Widget Visibility

We've fixed some issues with the Widget Visibility feature. Could you try the following?

- Install the Classic Widgets plugin, then head to Appearance > Widgets and try using the Widget Visibility button appearing below each widget.
- Head to Appearance > Customize > Widgets and do the same thing.
- Deactivate the Classic Widgets plugin, then head to Appearance > Widgets; you should see the Visibility button for legacy widgets, and the Visibility rules in the "Advanced" panel for each block.

**Thank you for all your help!**
