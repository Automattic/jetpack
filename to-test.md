## 7.4

### Blocks

#### Business Hours

We've made some changes to the display of the Business Hours block.
- Try to view a Business Blocks block that was created before the update; is it still displayed nicely?
- When adding a new block, are the opening hours displayed nicely?

#### Memberships

Following feedback from our Beta testers (thank you!), we've made several changes to the Memberships block. If you have a paid plan on your testing site, we'd recommend that you give the block another try, and let us know of any issues you may find when creating a button:
- What's the button creation process like?
- Can you personalize the button?

If you don't have a paid plan on your site, try adding the block and go through the flow of upgrading your site; do things work as expected?

### Tiled Galleries

We've made some changes to the editing experience when creating Tiled Galleries in the block editor. To test those changes, try the following:

- Add a Tiled Gallery block, and make sure it is displayed nicely in the editor and on the frontend.
- Try editing old posts with tiled gallery blocks. When opening the post in the editor, you should see no block invalidation error.
- Those old posts should look nice on the front end as well.
- Try creating a Tiled Gallery block with a lot of large images.
- Reload the editor with a very small viewport (mobile view).
- All images should load nicely, and faster.
- Scale up the viewport; depending on the browser and if you look at the Network tab in your browser dev tools, you will likely see more requests fired for larger assets as the viewport width increases.

### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticible and report anything you see.

**Thank you for all your help!**
