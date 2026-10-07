=== Jetpack VideoPress  ===
Contributors: automattic, retrofox, oskosk, thehenridev, renatoagds, lhkowalski, nunyvega, leogermani, cgastrell
Tags: video, video-hosting, video-player, cdn, video-streaming
Requires at least: 7.0
Tested up to: 7.1
Stable tag: 3.6
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
### 3.7 - 2026-10-07
#### Security
- Playback: Strengthen authorization for private videos.

#### Added
- Add an All Playlists block that lists every Video Playlist published on the site as a grid or a list.
- Add an optional trim and cut editor with preview, undo, and original video restoration. Keep the editor available during processing, reduce background status checks, refresh delayed timeline thumbnails, and allow retrying failed edits.
- Add a setting to turn off sharing for every video on the site.
- Add title and description settings to the Video Playlist block, recorded in a site-wide playlist index.
- Give every video its own page for themes that support it, and add a "Show the video being viewed" option to the video block.
- Library: Edit video details while uploads are in progress.
- Onboarding: Add an introductory video to the first-run welcome modal.
- Video Playlist and Latest Videos Playlist blocks: Add a setting to hide the player. Clicking a video then opens it on VideoPress in a new tab, or reveals the player and plays it.
- Video Playlist block: Show the playlist title as an editable heading above the playlist, with a setting to turn it off.

#### Changed
- Activity Log: Show the connection error notice only when a connection error has been recorded.
- My Jetpack: Show a Features tab in place of the Products tab.
- My Jetpack: Show product cards flat, without a drop shadow.
- Overview: Show the views chart tooltip on the WordPress design system tooltip surface.
- Pricing: Keep focus on information icons when their tooltips open, announce the content to screen readers, and show a focus ring after clicking them.
- Show the ad-free, customizable player as included in the free plan on the VideoPress plan comparison.
- Update package dependencies.
- Use core snackbar notice placement.

#### Removed
- Remove the legacy dashboard. Sites that turned off the modern dashboard no longer get a Jetpack > VideoPress menu.

#### Fixed
- Admin: Keep the Learn more support link up to date through the redirect service.
- Ask before deleting videos, and warn before leaving the page while an upload is running.
- Caption manager: Warn when a private video's preview may not play.
- Connection: Fix reconnecting your WordPress.com account so it no longer disconnects other users and clears the broken-connection notice on the first attempt.
- Connection: Let users without admin access reconnect their own broken account from the connection error notice.
- Connection: Stop Site Health from showing spurious connection failures — remove the redundant outbound HTTP/HTTPS checks, and no longer prompt a reconnect when the WordPress.com connection test is inconclusive.
- Connection: Stop users who cannot set up the site connection from becoming the connection owner when the owner's connection is missing.
- Dashboard: Fix a just-uploaded video briefly showing up a second time as a local video in the Library.
- Dashboard: Keep the views trend chart's comparison lines distinguishable, including for color-blind viewers.
- Keep the editing preview on retained footage when playback reaches a trim or trailing cut.
- Library: Show a loading state until the video library is loaded.
- My Jetpack: Fix the layout of the connection screen for right-to-left languages.
- My Jetpack: stretch the tab content background to the full height of the page.
- Scroll the timeline while dragging cuts beyond the visible area.
- Show an error and stop the Get VideoPress button from staying busy when checkout cannot start.
- Show Jetpack in-dashboard messages on the dashboard again.
- Start new cuts at the playhead, or end there when it is at the end of the video, and keep a gap from existing cuts.
- Upgrade: Send WordPress.com sites to the Business plan instead of an incompatible VideoPress product.
- Video block: Offer an upgrade action when uploads require a paid plan.

