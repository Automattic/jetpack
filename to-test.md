## 5.3

### PHP 7.1 fixes: Interact with your site in Calypso

This version refactors our API, which fixes the issues we were having with PHP 7.1.x

- Navigate to Calypso and interact with your site in as many ways as you can think of.
- Look for network errors, settings not saving properly, or notices saying that it can't communicate with your site.
- It's important that we test this thoroughly in both PHP 7.1.x and older PHP versions.

### Sitemaps fixes

We've done a significant refactor to the Sitemaps feature. All Sitemap items should be displaying properly now, whether the text is encoded or not.

- Enable Sitemaps
- Verify that the following Sitemaps are displaying your posts/images correctly at the following URLs
- yoursite.com/sitemap.xml
- yoursite.com/news-sitemap.xml
- yoursite.com/image-sitemap-1.xml

### Preview site in Calypso

You may now preview your Jetpack site in Calypso.  To test it:
- Go to https://wordpess.com/view/ and pick your site
- Try clicking a few links, see if your site works correctly
- See if the preview toolbar in Calypso gets an updated URL as you navigate
- There should be no admin bar inside the preview

### Added Likes and Monitor to Jumpstart features

We've added a couple features to the Jumpstart suite.

- Click "Reset Options" link in the footer
- When you see the Jumpstart prompt, refresh the page
- Click "Activate Recommended Features", and verify that Likes and Monitor have been activated.

### WordAds

There were some new options added to the Ads feature this release.

- Enable Jetpack Ads module
- Enable Display second ad below post
- - Check to see that 2nd unit appears below post
- Enable options under Enable below post ads on
- - Check below post ads do/don't display under appropriate type of page
- Enable AdBlock Plus extension
- - Check Allow some non-intrusive advertising in Adblock Plus Options
- - Check that some non-obtrusive ads are in the regular spots.

### Admin UI Improvements

- Make sure that Site Verification does not look active when it is indeed inactive
- Log in as an unconnected secondary user. The notice that asks you to connect has been styled differently, and should look much nicer.
- View the stats area in the dashboard for a new site or a site that does not have any views. You should see a nice welcome message instead of a depressing empty chart.
- Look around in the plans, settings, and dashboard areas for any design regressions

### Jetpack Connection improvements

There were a few small changes to the connection process that is aimed at fixing some common connection issues.

- Cycle your connection a few times.  Make sure it's running smoothly
- Do so with a brand new site, if possible

### WordPress.com Toolbar

- Visit site's front end and open up My Sites menu.
- You should see a Comments field in Manage section.
- Some CSS was updated. Make sure the styles still look ok

### WordPress.com Theme updating

- Add a free and premium Jetpack theme
- Downgrade them by manually editing the style.css
- Try updating them in update-core.php page and in themes

### Jetpack Sync

The site should now fully sync on every Jetpack connection.

- Disconnect jetpack
- Update an option such as Site Title or Site Description.
- Connect the site. Check that the option was saved right away and reflects correctly in Calypso

### Contact Forms

Contact form submission emails have been fixed for sites hosted on SiteGround.

- Submit a contact form on a site hosted on siteground
- Verify you got the email
- Test with other hosts as well.