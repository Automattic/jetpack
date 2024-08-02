## Jetpack 13.7

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`
	- To test Breve further in the document please enable the feature with the following snippet: `add_filter( 'breve_enabled', '__return_true' );`

### Jetpack Blocks

Several blocks have been migrated to Jetpack's code.

#### The Timeline block

- Open the editor and insert the Timeline block.
- Add any timeline entry.
- Enable the Alternate items setting of the block.
- Toggle the left/right alignment setting of the block.
- Configure the background color of the block.
- Make sure everything works as expected.
- Make sure the block looks good on your frontend page.

#### The Event Countdown block

- Go to the editor and insert an Event Countdown block.
- Fill in both title and date.
- Preview your changes on frontend.
- Make sure everything works and looks as expected.
- Make sure the celebration shows when countdown finishes.

### Jetpack Dashboard

Jetpack is currently getting ready to switch to React 19 with the next WordPress release, and some work is already merged into the code. Keeping this in mind note any problems that appear in the Jetpack Dashboard. The changes could affect things like popovers, setting toggles, tab switching, etc. 

#### The Jetpack AI card

The Jetpack AI card has been added to the Dashboard. To test it:

- Go to the Jetpack dashboard.
- See the new card is shown at the bottom of the list. It should be in inactive state showing the "Upgrade" button.
- Click the "Upgrade" button, you should land in the interstitial for Jetpack AI.
- Proceed with a purchase. Once finished, go to Jetpack dashboard again.
- See that the card is now active and reads "All features" button.
- Click the "All features" button, you should land in My Jetpack's AI product page.

### AI Assistant

#### The AI Logo Generator

The AI Logo Generator feature has received a lot of improvements in this release. Test its functionality in different scenarios, here's an example:

- Make sure your testing site has a paid tier for Jetpack AI.
- Go to the block editor and add a Site Logo block.
- Look for the AI extension icon on the block toolbar and click on it.
- Confirm the logo generator modal opens.
- If that is the first time you open it, wait for the first logo to be generated.
- If not, confirm you see your history of logos and can generate another one.
- When you have a logo you like, click the "Use on block" button.
- Confirm the logo generator modal will show the confirmation screen with the newly generated logo, don't close it yet.
- Confirm the "Learn more about Jetpack AI" link in the confirmation screen leads you to the Jetpack AI product page on Jetpack.com.
- Confirm the modal can be closed after clicking the link (or the close button, or the X button at the top).
- Confirm the logo block is updated with the new logo.
- Save the post so the new logo is set on the site. There should be a confirmation step on the sidebar, asking you to allow updating the logo.
- Confirm you can click on the AI extension button again and choose a new logo, that will replace the previous one correctly.
- Bonus points for testing it in the site editor.

#### Breve

The Breve proofreader feature has also received various improvements. Here's a simple testing scenario:

- Make sure Breve is enabled, and beta blocks are available, as specified in the "Before you start" section.
- Go to your editor, add text, you can ask the AI Assistant to generate it for you.
- See Breve highlights, hover over them and make sure you can ask for a suggestion.
- When you click the Suggest button, the animation should happen, and you should get your suggestion.
- Try formatting your text using bold, italic, various font colors, etc.
- Highlights should work on these words too.

#### Sidebar

There are now action links for the AI Assistant block. To test:

- Open the editor and insert an AI Assistant block.
- On the block card (header of the block inspector) you should see a link "Discover all features".
- Clicking the link should autosave any changes and land you on My Jetpack's product page for AI.
- If My Jetpack is not available (Testing on Atomic) the link should show as external link and open Jetpack.com/ai on a new page.
- Open Jetpack sidebar and uncollapse the AI Assistant section.
- At the bottom of the section, you should see a link "Learn more about Jetpack AI".
- Link should behave as the above one (link to AI page on My Jetpack or open new tab to Jetpack.com/ai otherwise).

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
