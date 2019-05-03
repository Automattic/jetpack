## 7.3

- Setup new sites and connections. The default set of features have changed. Does the text during the setup flow match what is being activated?
- New membership block! Add a membership block, connect it to your Stripe account, add some amounts, etc. Bonus if you make a small donation to yourself. Requires JETPACK_BETA_BLOCKS constant set to true.
- Check out the new about Automattic page at Jetpack->About Jetpack in wp-admin.
- Visit WordPress.com and edit your site's posts using the Block Editor. Try interacting with adding media, opting in and out of the block editor, try the help buttons.
- In the Block Editor, we've added new Likes and Sharing controls in the setting panel. Enable Likes, did it work? Requires Likes or Sharing to be enabled.
- While still in the Block Editor, add regular core image blocks, select multiple blocks, and transform them into a Tiled Gallery or Slideshow. Transform a Tiled Gallery/Slideshow to core image blocks.
- Speaking of Tiled Galleries, we've added responsive image support. On the front end, make sure srcset values are set. You should see much faster load times for new tiled galleries.
- We're not done in the Block Editor, open a post with an old shortcode style Simple Payments button. Transform it to a block and it should retain the existing settings.  
- With the WordPress 5.2 RC, check out the Tools->Site Health section. Do you see the Jetpack tests (hopefully under the Passed section) and undre the Debug Data?
- Use the Social Icons and have a Stack Overflow account, add it and make sure the Stack Overflow icon looks good.
- Have a multisite? Connect and disconnect some subsites from Network Admin. Any oddities?


### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticible and report anything you see.

**Thank you for all your help!**
