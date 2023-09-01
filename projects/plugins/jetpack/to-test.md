## Jetpack 12.5

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Newsletter

The Newsletter settings are moved from the Discussion settings to their own dedicated page.
- Go to "Jetpack settings → Newsletter"
- Ensure all toggles work
- Go to "Discussion" settings and confirm newsletter settings aren't there anymore

### SEO and Sharing Changes

There are a lot of small tweaks to the SEO and sharing modules that should be tested:
* Enable SEO tools in Jetpack -> Settings -> Traffic
* Draft a new post
* Open the Jetpack sidebar in the editor
* Confirm the SEO tools textareas width looks okay.
* Confirm that the "hide page from search engines" is now a toggle (instead of a checkbox)
* Confirm that the Like and Sharing options in post are now also toggles.

### My Jetpack

The My Jetpack menu item in wp-admin has been moved to the top of the sub-menu list. Poke around and make sure things look good and links go where they're supposed to!

### AI Assistant

There were many tweaks and back-end changes to the AI assistant. To test it out: 
- Add a paragraph block to a post or page
- From the block toolbar, select the sparkling AI Assistant button.
- Try a few of the options and make sure they work and make sense.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
