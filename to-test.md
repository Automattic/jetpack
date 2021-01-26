## 9.4

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Blocks

#### Podcast Player Block

In anticipation of further changes to the Podcast Player Block and its integration with other Jetpack blocks, we've made a number of changes to the Podcast Player block. Here is what you can try:

- Insert a new block, and add a podcast
- You should now see skip back / forward buttons that you can use in the editor and on the frontend.

#### Payments Block

We've made a number of changes to the Payments block in order to be able to implement the Premium Content Block (which uses the Payments block button). You'll want to make sure the Payments block still works:

- Try adding a block on a free site, and follow the upgrade prompts.
- Try adding a block on a site with a plan, and follow the prompt to connect to Stripe.
- Try using the block.

### Sharing

In this release, we've removed the jQuery dependency of the Sharing buttons. To test this out, we would recommend the following:

- Add multiple buttons to your site, including the Email sharing button, and hide some behind the "More" button.
- Try using the different button styles
- Ensure that the buttons work well.


**Thank you for all your help!**
