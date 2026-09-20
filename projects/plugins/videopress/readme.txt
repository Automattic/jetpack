=== Jetpack VideoPress  ===
Contributors: automattic, retrofox, oskosk, thehenridev, renatoagds, lhkowalski, nunyvega, leogermani, cgastrell
Tags: video, video-hosting, video-player, cdn, video-streaming
Requires at least: 7.0
Tested up to: 7.1
Stable tag: 3.5
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
The finest video hosting for WordPress. Drag and drop videos through the WordPress editor and keep the focus on your content, not the ads.

== Description ==

### AD-FREE, CUSTOMIZABLE VIDEO PLAYER FOR WORDPRESS

With an immersive design, VideoPress is ideal for videographers, creators, filmmakers, educators, and bloggers seeking to upload high-quality videos with ease.

= Built for WordPress =

Take advantage of full integration with the best video hosting plugin created specifically for WordPress. Bring your ideas to the screen and save time by managing your videos in the same interface as your website. You can drag and drop videos directly into WordPress, and manage them in the media library.

= Ad-free videos offer a better experience =

Tired of video companies sending your customers to their app to view videos? Or worse, showing inappropriate ads to your site visitors? Our customizable video player for WordPress keeps people on your site so the spotlight is all yours. With VideoPress, you can avoid intrusive ads or imposing player branding.

= High-quality, lightning-fast video hosting =

Take the complexity out of self-hosting videos. VideoPress offers fully-hosted videos and a CDN to ensure instant video speed for your audience around the globe. With our powerful and reliable hosting infrastructure, you can provide your audience with fast-motion videos with 60 FPS and full 4K resolution.

= A complete video experience from the WordPress Editor =

With the [Jetpack VideoPress Block](https://jetpack.com/support/jetpack-videopress/add-video-block-editor/), adding videos to your content has never been easier. This powerful tool lets you effortlessly insert videos straight from the WordPress Editor and comes packed with advanced features like subtitles, captions, chapters, private videos, and poster images.

* Adaptive Streaming – Videos play back faster by automatically adjusting video quality based on bandwidth and display size. The viewer can still choose the quality they’d like in the menu.
* Reliable Global Hosting and Video CDN – Built on WordPress.com’s world-class cloud infrastructure, your videos are stored in multiple servers across the globe to ensure quick delivery no matter where your audience is.
* Subtitles, Captions, and Chapters – Simply upload your text tracks via the VideoPress block and they will be available on the video as soon as you publish.
* Progress Bar Color Match – The VideoPress seekbar now adapts its color to match the scenes in your videos. This makes your content really pop.
* Optimized for mobile – Switch between mobile and desktop without missing a beat.
* Picture-in-picture – Pop out the video from the web browser for easier viewing.
* Unlimited Logins – Work with a team? We don’t charge per seat, so everyone that works on your site can have their own login.
* High-Resolution Videos Up to 4K – Watch crisp images on any display and screen size. We’ve added video display for 1440p, 60 FPS, and full 4K resolution.
* Ad-free video - Keep the spotlight on your content, not on ads you can’t control.

= Your one-stop solution for video management =

[The VideoPress Dashboard](https://jetpack.com/support/jetpack-videopress/the-jetpack-videopress-dashboard/) is a centralized space to upload and manage your video library. Filter your library by rating or privacy setting, view your library in multiple ways, and upload local videos to your Jetpack cloud library.

== Installation ==

### Installation

1. To begin, click on the Plugins link in the left hand sidebar, then click Add New.
2. Search for VideoPress. The latest version will be in the search results. Click the Install Now button.
3. Next, click the Activate button. After activating, you will be prompted to set up VideoPress.


 == WITH 💚 BY JETPACK  ==

== Frequently Asked Questions ==

### Is Jetpack VideoPress free?
Jetpack VideoPress is free to try. You get free video hosting for WordPress for one video with a file size of up to 1 GB.

To get unlimited videos with a total storage of up to 1 TB, upgrade to the paid plan.


### Is Jetpack VideoPress included in a Jetpack plan?
Jetpack’s video player for WordPress is included in the Jetpack Complete plan. It is not currently included in any other plan.

### Is there a storage limit?
The free plan has a limit of 1 video and 1 GB.

The paid plan has a storage limit of 1 TB.

###Is there a file size limit?
The file size limit is 5 GB. However, on slower networks, there is a chance the network will time out before being able to upload larger videos to a WordPress site.


== Screenshots ==
1. Add and manage your videos from your VideoPress library.
2. Browse through your videos and edit their details.
3. Upload your local videos to VideoPress.
4. Edit your video details, cover image, and privacy from your VideoPress library.

== Changelog ==
### 3.5 - 2026-09-18
#### Added
- Add a "Learn more" support link to the admin page.
- Add a setting to render players in the page from one shared player script instead of one frame per video.
- Add a site-wide setting to turn off player preloading for every embed.
- Connection: Surface SSL certificate verification failures reported by WordPress.com as a connection error notice.
- Invite the first upload with a dropzone when the video library is empty.
- My Jetpack: Allow the Automattic for Agencies banner to be dismissed.
- With the inline player setting on, show each video's poster and load the player only when it is played.
- With the shared player setting on, the block editor previews video blocks with the same shared player instead of one frame per block.

#### Changed
- Boost: Wait up to four minutes for slow speed tests in My Jetpack instead of timing out after two.
- Charts: follow the WordPress admin color scheme for chart series colors.
- Charts: update chart grid, axis and label colors immediately when the theme changes.
- Connection: Show every connection error in one notice, each with the account it affects, and link to Site Health when a firewall is blocking WordPress.com.
- Dashboard: Display video library thumbnails in a 16:9 aspect ratio.
- Dashboard: Open the file picker directly from the welcome modal's Upload a video button, then land on the Library to follow the upload's progress.
- Hide the VideoPress sidebar item when VideoPress is not active.
- My Jetpack: Restyle dashboard notices to match the WordPress design system.
- My Jetpack: Show the dashboard in the new rounded admin page frame.
- My Jetpack: Show the Jetpack menu notification badge when a connection error is detected.
- Sidebar: sort Jetpack menu items alphabetically, pinning My Jetpack to the top and external links and Settings to the bottom.
- Update package dependencies.
- Update package dependencies.
- Update package dependencies.
- VideoPress: refine the welcome modal type scale, match the upload dropzone text to the design system's empty state, and drop the duplicate header Upload button while the empty-library dropzone is showing.

#### Fixed
- Activity Log: Fix the page overlapping the admin menu in right-to-left languages.
- Activity Log: honor the module setting, so the page can be turned off.
- Admin dashboards: Keep the page header and content in view when the wp-admin menu is taller than the window.
- Avoid free-plan limits and upgrade prompts when site features cannot be loaded.
- Charts: Fix unreadable axis labels in forced-colors mode.
- Charts: keep chart tooltips under sticky and fixed page elements.
- Charts: Place line and area chart date ticks on the site's time zone boundaries, name the hour in tooltips on hourly data, and read hour labels in the site's own locale rather than a forced 12-hour clock.
- Charts: Restore keyboard focus after dismissing line chart tooltips.
- Charts: Stop the first and last dates on a chart's horizontal axis from being cut off.
- Connection: Fix a stale connection error notice that could persist on healthy sites.
- Connection: Hide connection error notices from users who cannot fix the connection.
- Dashboard: Continue the wp-admin menu color behind the page frame on WordPress.com and third-party admin color schemes.
- Dashboard: Keep the video editor footer at the bottom of the page.
- Dashboard: Make the welcome=1 review parameter reopen the welcome modal after it has been dismissed.
- Fix selecting thumbnail frames from private videos and prefer browser-compatible video renditions.
- Fix the dashboard rendering blank on WordPress 7.0.x, where the welcome modal crashed on the missing public ThemeProvider export.
- Fix the VideoPress block failing to load in the editor on WordPress.com-hosted sites.
- JITM: Fix missing messages and a console error on sites without the Jetpack plugin active.
- Keep admin icons colored after the @wordpress/icons 16 update, which draws them as strokes.
- Keep keyboard focus on the first or last data point when an arrow key reaches the end of the views trends chart, return focus to the chart when Escape closes a tooltip, stop a focused chart from swallowing keys it does not use such as Page Down, and close the tooltip when the series it describes is hidden.
- My Jetpack: Keep the Automattic for Agencies banner hidden after dismissing it and switching tabs.
- My Jetpack: Show the right product status as soon as fresher plan data is available, instead of reusing an earlier lookup.
- My Jetpack: Stop repeating the partner lookup request on every page load.
- Playlist block: Wrap long unbroken video titles and decode HTML entities in titles on the front end.
- Say when a video upload failed because of a Jetpack connection problem, instead of only "Upload failed".
- Say when a video upload from the Video block failed because of a Jetpack connection problem, instead of only "Failed to upload your video".
- Show the Jetpack connection error notice on the VideoPress dashboard again.
- Status: Detect a site served on any 127.0.0.0/8 loopback address, or on 0.0.0.0, as a local site.
- Stop the dashboard frame from flashing while loading and when switching admin pages.

