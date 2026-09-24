## Jetpack 16.3

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Premium Analytics (new Stats v2 dashboard)

Jetpack 16.3 ships the new Stats v2 dashboard. The Jetpack plugin has no toggle for it yet, so switch it on by hand as described in the setup below.

**Setup**

- Use a Jetpack-connected site with the Stats module active and a few days of views.
- Switch on the dashboard: run `wp option update jetpack_premium_analytics_enabled 1`. You get the customer preview, which has only the Traffic, Insights and Subscribers tabs.
- To also see the Ads and Store tabs:
  - Run `wp option delete jetpack_premium_analytics_enabled`.
  - Add a mu-plugin containing `add_filter( 'jetpack_premium_analytics_enabled', '__return_true' );`.
  - Turn on the Subscriptions module (for the Subscribers tab), the WordAds module (for Ads) and WooCommerce (for Store).
- In wp-admin, open **Stats v2** in the sidebar. It sits next to the existing Stats menu.

**1. First visit and date controls**

1. Open Stats v2 for the first time. Confirm a welcome modal appears. Click outside it: it should stay open, and "Take a quick tour" should run the tour.
2. In preview mode, confirm only the Traffic, Insights and Subscribers tabs show, and that a feedback banner appears.
3. Open the page options menu (⋯) and select Customize. Confirm the date controls hide while customizing. Leave customize mode.
4. Open the date picker. Confirm it offers "Month to date", "Year to date" and a custom range calendar.
5. Pick "Year to date" and compare with the previous year. Confirm the comparison starts on 1 January.
6. In any table, click a cell that sets the period. Confirm the date control is highlighted.
7. Confirm the date control in widget headers is the same height as the controls beside it, and that a dialog's focus ring isn't cut off by its footer.

**2. Charts**

1. On Traffic, hover the Traffic summary chart. Confirm each tooltip row reads value, then metric, then date.
2. Pick a period with a comparison. Confirm the legend shows a Comparison period item, the selected metric's legend item can't be switched off, and the Visitors swatch is solid.
3. Switch the chart to bars. Confirm the legend swatches are square and the value axis starts at zero.
4. Pick a short period with very few views (for example, today). Confirm: the axis doesn't repeat 0 and 1; the bars still draw when every day has the same value; an empty period draws an empty chart instead of breaking.

**3. Traffic, Insights and post details**

1. Open Insights. Confirm the page title reads "Site insights" and shows: Views over years (a table, where the daily heatmap used to be); Monthly posting activity (one mini calendar per month for the last 12 months); All-time stats, the leaderboards and the post cards, with tidy labels and number formatting.
2. Tab into the calendars and move with the arrow keys. Confirm the focus moves cell by cell and the labels stay readable. Switch the site language, reload, and confirm the weekday and month labels are translated.
3. Back on Traffic, open the Posts & Pages report (View all on the posts widget). Confirm thumbnails show.
4. Compare two periods on an author's posts. Confirm no post is listed as "0 (-100%)".
5. Click a post to open its detail page. Confirm: an All-time traffic card shows; the date picker offers every period plus a custom range; clicking a period in All-time traffic scrolls back to the top; the breadcrumb returns to the report you came from.
6. Repeat for a page and, if you have one, a video.

**4. Subscribers and Ads**

This section needs every tab: use the "To see every tab" setup above. The Ads tab also needs a plan that includes WordAds. When you finish, remove the mu-plugin again.

1. Subscribers: Confirm the tab has no date control of its own. The date range now sits on the Subscriber summary chart.
2. Subscriber highlights shows All-time stats.
3. Latest emails sent shows opens and clicks next to their rates.
4. Ads (only shows with WordAds active; real earnings data needs a site running WordAds): Confirm the chart follows the selected period and has a line/bar toggle.
5. Hover it: ads served, average CPM and revenue show together.
6. In the Earnings History widget, statuses are badges and pending statuses are one word with the reason beside them. Negative amounts are not red.
7. If the site has adjustments, a note links to the Adjustments tab of the report.
8. Open the full Earnings history report. Confirm it shows payment status, sponsored content and adjustments, and a dash (not 0) where there's no Ads Served count.

### Locations map in Premium Analytics ([#51808](https://github.com/Automattic/jetpack/pull/51808))

**Setup:** a Jetpack-connected site with the new Stats v2 dashboard (switch it on as described in the Premium Analytics setup above), with location stats for the period you pick. Go to Stats v2 → Traffic tab.

1. Scroll to the Top locations widget and select View all.
2. On the Countries tab, confirm a world map draws above the table, shaded for the countries the table lists.
3. Switch to Regions. Confirm the map still shades whole countries (regions sum back up), and that hovering a country lists its regions in the tooltip, capped at 10 with an "…and N more locations" line.
4. Still on Regions, add the Country filter and pick any country from your own results. Confirm the map switches from the world map to that country's regions map. Clear the filter and confirm the world map returns.
5. On Cities, add the Country filter and pick any country from your results. Confirm the map zooms to that country instead of staying worldwide.
6. Repeat step 4 with a second country if your data has one. Google supplies a regions map for most countries but matches region names for only some, so an unshaded map with the region outlines drawn is expected for some countries and is not a regression. A few small territories (Taiwan, Singapore and similar) have no regions map at all and fall back to the world map: also expected.
7. Switch tabs and confirm the country filter resets. Use the browser Back button from a filtered tab and confirm the map is not left scoped to that country.
8. Select Hide map. Confirm the map collapses, the control reads Show map, and the choice carries across the tabs. It is per-visit only, so a reload resets it.
9. Pick a date range with no data. Confirm the map draws empty next to the table's "No results" instead of erroring.
10. Regression pass on the widget, whose map moved into shared code: back on the Traffic dashboard, set Top locations to Countries, Regions and Cities in turn, and in Countries mode drill into a country and return with All locations. Confirm it behaves as before this release.

### Search: AI Search upgrade prompt and real error messages ([#52274](https://github.com/Automattic/jetpack/pull/52274))

**Setup:** Any Jetpack-connected site set up with Jetpack Search Free. Step 3 needs a paid Jetpack Search plan.

Before this release: the editor showed no upgrade prompt for the block, and asking a question on the published page showed "There was an error while generating the answer. Please try again later." with an `invalid_ask_response` / 500 response.

1. Add a new Jetpack AI Search block to a page. Confirm the editor shows an upgrade prompt, then publish the page.
2. Visit the page where the block was published. Confirm the Ask box still renders. Submit a question and confirm the proxy returns the upstream `ai_search_inactive` error and status, rather than `invalid_ask_response` / 500.
3. Upgrade to a paid Jetpack Search plan and confirm the editor shows the normal block preview and a published Ask box can answer a question.

### Search: Instant Search scroll listener fix ([#51913](https://github.com/Automattic/jetpack/pull/51913))

No UI change. This fixes a listener that accumulated on every search, so the symptom is stray extra page loads after several searches.

**Setup:** a site with Jetpack Search active and Instant Search enabled, with enough posts that a common term returns more than one page of results. Open the browser console before you start.

1. Open the search overlay and run a search that returns several pages.
2. Scroll near the bottom of the results. Confirm the next page auto-loads, and that the Load more button still works.
3. Without closing the overlay, run a second search that returns only a handful of results, so the load-more control disappears.
4. Scroll the short result list. Confirm nothing extra loads and no further requests fire.
5. Repeat steps 1 to 4 three or four times in one overlay session. Confirm each search still loads exactly one extra page per scroll, and never two or more.

### VideoPress: load the player once per page ([#52242](https://github.com/Automattic/jetpack/pull/52242), [#52244](https://github.com/Automattic/jetpack/pull/52244))

1. Activate VideoPress
2. Upload a video
3. Add the same video 6 times to a post and publish it
4. When viewing the post publicly inspect the network tab and filter for videopress and JS. You should see 6 requests for the same `videopress-main-routes.min.js` modules.
5. Go to VideoPress > Settings, and activate the toggle "Load the player once per page instead of once per video".
6. Go back to the post and inspect the network tab and use the same filtering, you should see no requests for `videopress-main-routes.min.js` and a single request for `inline-player.js`. From this point, hitting play should play the video.

### Charts: readable axis labels in high-contrast mode ([#52268](https://github.com/Automattic/jetpack/pull/52268))

In the Jetpack plugin, test the shared chart on the Stats card on My Jetpack, a bar chart of the last seven days of views.

**Setup:** a connected site with Stats active and at least a few days of views, so the chart draws bars.

1. Open My Jetpack and find the Stats card with the bar chart.
2. In Chrome DevTools, open Rendering and set "Emulate CSS media feature forced-colors" to active and "prefers-color-scheme" to dark. The date labels and the view counts on the axes should be white on black and easy to read, with grey gridlines and axis lines. Before this release they were dark grey on black.
3. Switch prefers-color-scheme to light. The labels should be black on white.
4. With the emulation switched off again, the chart should look exactly as it did before.

On Windows you can use a High Contrast theme instead of the DevTools emulation.

### VideoPress: "Learn more" link on the admin page ([#52111](https://github.com/Automattic/jetpack/pull/52111))

1. Open the VideoPress admin page
2. Confirm the subtitle ends with "Learn more"
3. Click it. It opens https://jetpack.com/support/jetpack-videopress/ in a new tab

### Turning features off hides their menu items ([#49591](https://github.com/Automattic/jetpack/pull/49591), [#52156](https://github.com/Automattic/jetpack/pull/52156))

_Test on a single-site install, not on multisite._

1. In My Jetpack, turn Activity Log off. Its sidebar entry disappears. Turn it back on and the entry returns.
2. Go to Jetpack → Modules and turn off one of these: Social (the Publicize module), Jetpack AI or VideoPress. Its item disappears from the Jetpack menu. Turn it back on and confirm the item returns.

### Forms ([#52099](https://github.com/Automattic/jetpack/pull/52099), [#52249](https://github.com/Automattic/jetpack/pull/52249))

1. Create a post and insert a Form block. In the template picker, double-click a template such as Contact Form. Go to Jetpack → Forms. Only one new "Contact Form" was created.
2. In Jetpack → Forms, click Responses. Click Jetpack → Forms in the sidebar again. It opens on Responses.
3. Click Forms, then reopen Jetpack → Forms from the sidebar. It opens on Forms.

**Thank you for all your help!**
