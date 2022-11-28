## Jetpack 11.6

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Jetpack Form Block

The Form Block received several updates and bug fixes in this version. To test, try the following:

- Make sure the testing site has Jetpack connected to your account.
- Create a post and add a Form block to it. 
- Test much of the existing functionality as well as any new Form block features:
  - Try the new "Explore Forms Patterns" button when adding the block.
  - Try updating placeholder text.
  - Make sure the new form submission confirmation text styling looks good
  - After submitting forms, check out wp-admin -> Feedback and check out the new layout to make sure things look good.

### SEO

There have been some new changes to SEO options available in the editor. One allows you to set a post or page as "noindex", meaning search engine's shouldn't crawl that page. To test:

- Make sure SEO and Sitemaps features are turned on in: /wp-admin/admin.php?page=jetpack#/traffic
- Create a new test post or page and publish it without using the new "Hide page from search engines" checkbox feature.
- Examine the published post source on the frontend and make sure there is not any `<meta name='robots' content='noindex'`... or similar.
	- If there is, double check your "Search engine visibility" in Reading settings: /wp-admin/options-reading.php
- Now edit the same post and check the "Hide page from search engines" checkbox and save the post.
- Refresh the post on the frontend to examine that it has a `<meta name="robots" content="noindex" />` tag.
- Using a plugin like "WP Crontrol" or wp-cli commands, run the jp_sitemap_cron_hook event.
- Examine your Jetpack sitemap for the now non-indexed post, it should be absent from the freshly generated sitemap.
- Setting the Jetpack SEO options should work equally from both the Jetpack sidebar menu and the pre-publish panel

We also have a new meta field in the SEO module that allows a custom value for the <title> tag to be specified at the post level.

- Before beginning the test, make sure the SEO module is enabled by navigating to "Jetpack > Settings" and searching for "SEO". Turn this module on by clicking on the toggle:
- Open an individual post on the front end of the site and take note of the page title displaying in the HTML/browser tab. This should be the default HTML title.
- In the post editor, click on the Jetpack icon in the upper right-hand corner, this will show Jetpack-specific settings in the post editor sidebar.
- Under "SEO title", set a custom title and then choose "Update" to update the post.
- Refresh the post on the front-end of the site and confirm that the <title> tag and browser tab now display your custom title.

Other notes for the new meta field that you can check out:

- If you have the Jetpack social connections module enabled, you should also see the og:title meta tag updated to contain your custom title string.
- There were some small modifications to how the custom SEO description is fetched, please check that adding custom SEO descriptions still work as expected for posts and pages.
- Change a post status to "Draft", then in the editor click "Publish". The sidebar should be presented with both SEO Page Title and SEO Description fields.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack/blob/jetpack/branch-11.6/projects/plugins/jetpack/CHANGELOG.md). Please feel free to test any and all functionality mentioned! 

**Thank you for all your help!**
