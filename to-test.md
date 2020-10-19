## 9.1

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Blocks

We've made changes and fixed bugs for multiple blocks in this release. Give them a try, and see that they still work for you:

- 

You can give those blocks a try with the AMP plugin active, to ensure that those blocks are accessible in AMP views as well.

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
