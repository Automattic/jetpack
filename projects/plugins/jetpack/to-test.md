## Jetpack 12.1

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Visual refresh
Jetpack 12.1 brings a visual refresh to multiple pages of the admin area. Please visit them in your testing and make sure nothing looks off.

#### Jetpack Debugger:
- Connect Jetpack, scroll down to the bottom menu and click "Debug" (/wp-admin/admin.php?page=jetpack-debugger, not to be confused with the "Jetpack Debug" plugin).
- Confirm the Debug page looks according to the design.
- Optionally use "Jetpack Debug -> Broken Token" to break the blog token.
- Go back to the Debug page and confirm that you see the connection errors, and they look according to the design (design pending).

#### About page:
- Go to About us and see if it matches expected look

#### Section Headers:
- Review the Jetpack dashboard and settings screens, validating the new styles are present.

#### My Plan:
- Go to My Plan
- Try adding/removing products and plans.
- Try deactivating Akismet, Backup, Social

#### Jetpack Settings:
- Go to Jetpack Settings
- Switch between different tabs
- Click toggles
- Expand/collapse sections
- Make sure nothing looks broken.

#### At A Glance Dashboard:
- Visit the At A Glance page
- Make sure nothing looks broken.

### The Markdown block
Jetpack ships with 2 flavors of Markdown. 12.1 makes no changes to the classic Markdown feature available in the classic editor. This classic Markdown feature already supports footnotes. In this release, we're adding support for footnotes to the Markdown Block:

- Start with a site that's connected to WordPress.com or in Offline mode.
- Go to Posts > Add New
- Add a Markdown block
- Add some content to that block. Possibly something quite long.
- In there, add 2 types of footnotes as highlighted in the docs here.
  - If you'd like, you can use the test content provided by Jeremy below.
- Ensure those work well when saving your draft and viewing your changes on the frontend.

````{verbatim}
Once upon a time, there was a man named Jack who loved nothing more than cooking up a delicious meal for his loved ones. One day, he decided to prepare [his famous burgers and fries](https://shakeshack.com/) for his family. He spent hours in the kitchen, carefully selecting the freshest ingredients and crafting each burger with love and care.[^1]

As the scent of sizzling beef filled the air, Jack's family gathered around the kitchen, eagerly awaiting the meal. Finally, the burgers were ready and Jack proudly presented them to his loved ones. They took a bite and immediately their faces lit up with delight. "**This is amazing!**" they exclaimed.

But as they continued to eat, something strange began to happen. Jack's family members started to sprout feathers and wings.[^longnote] Before he could react, they had transformed into a flock of birds and flew out of the open window. Jack stood there, stunned, watching as his loved ones disappeared into the distance.

For days, Jack searched for his family, but they were nowhere to be found. Finally, he gave up and resigned himself to the fact that his cooking had somehow turned his family into birds. But despite his grief, he couldn't help but feel a sense of pride. After all, his cooking had been so delicious that it had caused his loved ones to take flight - *quite literally*.

From that day forward, Jack became known as the "bird chef," renowned throughout the land for his incredible burgers and fries that had the power to transform even the most ordinary person into a magnificent bird. And although he never did find his lost family, he took solace in knowing that they were out there somewhere, soaring through the skies, thanks to the power of his cooking.

[^1]: Check [the recipe here](https://www.myrecipes.com/recipe/classic-burger).

[^longnote]: This gets weird from here.

    I've been using ChatGPT at times to help me come up with random content, and this is what happens. I think this quote from ["Cheating is All You Need"](https://about.sourcegraph.com/blog/cheating-is-all-you-need) is appropriate here:

    > A raw LLM is like a Harvard CS grad who knows a lot about coding and took a magic mushroom about 4 hours ago, so it’s mostly worn off, but not totally.
````

### Jetpack Forms
Jetpack Forms evolve very quickly, and the Form block should get attention from testers in every release. This time there are changes as well. One of them is the update for Forms child blocks to allow any transformation between the blocks:

- Create a post, add a Form block, and select a template
- Select a child block and use the Transform To option to transform the current block into other blocks
- You should be able to transform a child block into any other Form child block

Additionally, when themes do not reset the browser styles, the Jetpack button block will display borders on the frontend. To avoid that, we add our own reset, except when the button uses the "outline" styles, where we do want to show a border:

- Start with a site using the Twenty Twenty Two theme.
- In a new post, add 2 blocks that use the Jetpack button block: the Form block as well as the Revue block are good examples.
- In one of those blocks, use the default "fill" block style, and in the other use the "outline" style.
- On the frontend, the button should not have a border when using the "fill" block style.

Another fix was to avoid the following issue. The "Single Choice" and "Multiple Choice" blocks in Jetpack Form blocks, when added to a form inside a Cover block, used to not obey the background setting set in the editor and display with a white background instead. This release fixes the problem:

- Add a cover block to a page, and a form inside it.
- Add a "Single Choice" or "Multiple Choice" block to the form.
- For form blocks always respect the background setting set in the block's settings, regardless of where they are placed.
- Save changes.
- Observe no issues on front-end as well.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack/blob/monthly/branch-2023-04-25/projects/plugins/jetpack/CHANGELOG.md). Please feel free to test any and all functionality mentioned! 

**Thank you for all your help!**
