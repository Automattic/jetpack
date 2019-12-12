## 8.0

### Blocks

#### Mailchimp

We've added 2 new options to the existing Mailchimp block. You'll locate them in the block sidebar when adding a block to a post or page.

- If you've defined groups in your [Maichimp Audience settings](https://mailchimp.com/help/create-new-audience-group/), you'll see that option in the block sidebar.
- In your Audience Settings, you can also define custom Audience fields and MERGE tags. You can use those to create a new field for your forms, and you can add info about that field to your block settings in the block editor. This will allow you to track where subscriptions are coming from.

Give that a try, try using the forms you create, and see if the fields are updated accordingly when looking at your subscriber list on Maichimp.com. Bonus points if you also try to sign up when using the AMP plugin on the site!

#### Pinterest

This release introduces **a new Pinterest block**. This block allows you to insert various Pinterest links (pins, boards, profiles) that will be automatically converted into a Pinterest embed in your posts.

To test this, try adding various Pinterest URLs (short and long), and see that they are displayed properly in the editor and on the front-end of your site.

#### Ratings

This release also brings **a new Ratings block** to your site. Rate movies, books, songs, recipes — anything you can put a number on. To get started, go to the block editor and search for "Star" or "Rating".

Play with the different block settings and let us know how it goes.

### Shortcodes

Jetpack includes a Recipe shortcode that allows you to display recipes in your blog posts, with a nice layout and a markup optimized for search engines. In this release, we're introducing 3 new elements to the recipe display:
- A new `cooktime` attribute.
- A new `preptime` attribute.
- A new `rating` attribute.
- A `recipe-nutrition` shortcode to display nutrition information about your recipe.
- A `recipe-image` shortcode that can be used to display a single image anywhere within your recipe.

You can try to use all that data by adding your own recipe to a new blog post. [Here is an example of recipe markup you can paste in the code view, inside a classic block](https://gist.github.com/jeherve/dd9d8e9503d08a69f81e56d2bee516dd).

### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

**Thank you for all your help!**
