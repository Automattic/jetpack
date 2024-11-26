## Jetpack 14.1

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`
	- To test Breve further in the document please enable the feature with the following snippet: `add_filter( 'breve_enabled', '__return_true' );`

## Growth Bundle 
 
In this release, we are introducing a new Growth bundle that includes Stats, Social, and Newsletter paid features. 

#### Test functionality 
   
You need a site with the Jetpack Growth plan for this test. Make sure all features that come with Growth are working correctly and are not hidden behind paywalls or overlays. 

- Go to the Stats page and ensure you can see all available stats with no upgrade overlays.
- Go to `/wp-admin/admin.php?page=jetpack-social` and ensure you don't see any upsells and that all features are available.
- Go to `/wp-admin/admin.php?page=jetpack#/newsletter` and activate Newsletter. Make sure you see no upsells and that all features are available.

#### Bundle interstitials (including Growth) 
  
In My Jetpack, visit the following paths to make sure the bundle interstitials look good and the CTA's go to checkout with the correct item in the cart:

- `/wp-admin/admin.php?page=my-jetpack#/add-security`
- `/wp-admin/admin.php?page=my-jetpack#/add-growth`
- `/wp-admin/admin.php?page=my-jetpack#/add-complete`

Note: The images on the interstitials may be updated in the future, they've not been designed yet and we wanted to get this into the testing period so we shipped with existing images.

#### Bundle recommendations (including Growth) 
 
On a new testing site, connect your account via the welcome banner in My Jetpack. Fill out the survey with the options "Grow my audience" and "Create quality content". You should see the Growth bundle as the first recommendation.

- Ensure the Purchase and Learn More CTAs work correctly.
- If you'd like, you can also play around with the survey to test the Complete and Security bundles too.

#### Make sure Creator is no longer promoted in the plugin

The Growth bundle is replacing the Creator product. Make sure you don't see any Creator upsells, ads, or promotions in the plugin.
 
## Ensure list-to-table AI transform works as expected 
  
- Create a new post and create a top-level list (this will not work for sublists). 
- On the top level list click the AI Assistant icon. 
- There should now be an option "Turn list into table" in the menu. 
- Upon clicking this option the block should be converted to an AI Assistant block, and the list will be turned into a table. 
- If you click the trash icon ("Discard") the original list should be restored. 
- Bring up the AI Assistant menu again. Click "Accept" after converting the list and your original list should be replaced by the table. 
 
## Verify Slideshow block works as expected in Row and Column blocks 
  
- Add a Row block to a post. 
- Add a Slideshow block inside the Row block. 
- Add a few images to the Slideshow. 
- Visit the post in the frontend and make sure the Slideshow works properly. 
- Test the multiple Slideshow blocks inside a Row and inside Columns, and make sure it also works properly in the different scenarios. 

### And More!

Other particularly noteworthy changes in 14.0 include:

- Support for Bluesky in Jetpack Social.
- Related Posts block can now be used on non-post CPTs.

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
