## 9.1

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Blocks

We've made changes and fixed bugs for multiple blocks in this release. Give them a try, and see that they still work for you:

- Donations Block -- you can try editing a Donations Block that was created with a previous version of Jetpack.
- WhatsApp Block
- Form Block -- try using commas, brackets, or backslashes in field labels and value, and ensure that doesn't break the block.
- Pay with PayPal block -- we've made some changes to the way currencies are displayed, in the editor and on the frontend. We've also improved how the block looks outside of WordPress standard views (in subscription emails for example). Like with the Donations block, try editing existing posts with Pay with PayPal blocks, and ensure that the blocks can be updated with no issues.

You can give those blocks a try with the AMP plugin active, to ensure that those blocks are accessible in AMP views as well.

### Dashboard

We've made some changes to the display of the Backup and Scan cards in the Jetpack dashboard, to better reflect the status of your site. This shoyuld work whether you use WordPress in a single or multisite setup, and if you use VaultPress or Jetpack Backups.

You can find detailed testing instructions [here](https://github.com/Automattic/jetpack/pull/17288).

### Lazy Images

This release refactored the JavaScript used for Lazy Images/Deferred Image Loading and resolved an issue where printing could result
in images not loading.

Steps to test:
- Create a post with several images.
- Verify lazy loading still works.
- Reload, and clear the browser's file cache. Do not trigger loading of images on the reloaded page.
- Attempt to print. Probably you'll get an alert about images not being loaded yet, and the print preview may show the same message rather than the post's content.
- Wait for images to finish loading, and try printing again. There should be no alert and the print should print the post as expected.
- Reload, scroll down to trigger lazy loading of all images, and try printing. Again, if all the images finished loading there should be no alert and normal print output.

**Thank you for all your help!**
