<?php
/**
 * "Learn More" information blocks for all modules live in this file.
 *
 * Each module must include 2 functions:
 * - The first one creates a button where users can find more information about the module.
 * 	It is hooked into `jetpack_learn_more_button_ . $module`
 * - The second creates a information block.
 * 	It is hooked into `jetpack_module_more_info_ . $module`
 */

/**
 *  VaultPress (stub)
 */
function vaultpress_jetpack_load_more_link() {
	if ( function_exists( 'is_multisite' ) && is_multisite() ) {
		$vaultpress_url = 'http://vaultpress.com/jetpack-ms/';
	} else {
		$vaultpress_url = 'http://vaultpress.com/jetpack/';
	}

	echo $vaultpress_url;
}
add_filter( 'jetpack_learn_more_button_vaultpress', 'vaultpress_jetpack_load_more_link' );

function vaultpress_jetpack_more_info() {
	esc_html_e(
		'We keep a daily or real-time backup of your site so that when mistakes or accidents occur, restoring your
		site to any location takes a matter of minutes. Your site’s files are regularly scanned for unauthorized or
		suspicious modifications that could compromise your security and data. In many cases, we can fix them
		automatically (and will notify you). When we can’t, we provide you with expert support.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_vaultpress', 'vaultpress_jetpack_more_info' );

/**
 * Gravatar Hovercards
 */
function grofiles_load_more_link() {
	echo 'https://jetpack.com/support/gravatar-hovercards/';
}
add_filter( 'jetpack_learn_more_button_gravatar-hovercards', 'grofiles_load_more_link' );

function grofiles_more_info() { ?>
	<?php esc_html_e(
		'Hovercards enhance plain Gravatar images with information about a person, including a name,
		bio, pictures, and contact info. Hovercards will appear when you hover over the user image
		associated with a comment on any of your blog posts.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_gravatar-hovercards', 'grofiles_more_info' );

/**
 * Shortcodes
 */
function jetpack_shortcodes_load_more_link() {
	echo 'https://jetpack.com/support/shortcode-embeds/';
}
add_filter( 'jetpack_learn_more_button_shortcodes', 'jetpack_shortcodes_load_more_link' );

function jetpack_shortcodes_more_info() { ?>
	<?php esc_html_e(
		'Shortcodes allow you to easily and safely embed media from other places in your site.
		With one simple code, you can tell your site to embed media from YouTube, Facebook, Flickr, Vimeo, Instagram,
		Google Maps, SlideShare, Vine, SoundCloud, and more. Just enter the appropriate shortcode directly into the
		Post/Page editor and click “Publish.”'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_shortcodes', 'jetpack_shortcodes_more_info' );

/**
 * Shortlinks
 */
function wpme_load_more_link() {
	echo 'http://wp.me/sf2B5-shorten';
}
add_filter( 'jetpack_learn_more_button_shortlinks', 'wpme_load_more_link' );

function wpme_more_info() { ?>
	<?php esc_html_e(
		'Instead of typing or copy-pasting long URLs, you can grab short and simple links to your posts and pages.
		This uses the compact wp.me domain name, and gives you a unique URL that is safe and reliable. It’s perfect
		for use on Twitter, Facebook, and in text messages where every character counts.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_shortlinks', 'wpme_more_info' );

/**
 * Site Stats
 */
function stats_load_more_link() {
	echo 'https://jetpack.com/support/wordpress-com-stats/';
}
add_filter( 'jetpack_learn_more_button_stats', 'stats_load_more_link' );

function stats_more_info() { ?>
	<?php esc_html_e(
		'There are many plugins and services that provide statistics, but data can be overwhelming! Site Stats makes
		the most popular metrics easy to understand through a clear and attractive interface. You can see what visitors
		are reading, where they’re coming from, and what will bring them back -- all in one place.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_stats', 'stats_more_info' );

/**
 * Publicize
 */
function publicize_load_more_link() {
	echo 'https://jetpack.com/support/publicize/';
}
add_filter( 'jetpack_learn_more_button_publicize', 'publicize_load_more_link' );

function publicize_more_info() { ?>
	<?php esc_html_e(
		'Publicize allows you to connect your site to social networks like Facebook, Twitter, Tumblr, Google+, Path,
		and LinkedIn and automatically share new posts with your friends and followers. You can add connections for
		yourself or for all users on your site.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_publicize', 'publicize_more_info' );

/**
 * Notifications
 */
function notes_load_more_link() {
	echo 'https://jetpack.com/support/notifications/';
}
add_filter( 'jetpack_learn_more_button_notes', 'notes_load_more_link' );

function notes_more_info() { ?>
	<?php esc_html_e(
		'Keep up with the latest interactions on all of your WordPress sites and view and reply to comments as soon as
		possible. You can keep the conversation going from the admin bar in your dashboard or right from your mobile
		device so you don’t miss a thing.'
		, 'jetpack' );
}
add_filter( 'jetpack_module_more_info_notes', 'notes_more_info' );

/**
 * LaTeX
 */
function latex_load_more_link() {
	echo 'https://jetpack.com/support/beautiful-math-with-latex/';
}
add_filter( 'jetpack_learn_more_button_latex', 'latex_load_more_link' );

function latex_more_info() { ?>
	<?php printf( esc_html__(
		'%1$s is a powerful markup language for writing complex mathematical equations and formulas.
		Jetpack combines the power of %1$s and the simplicity of WordPress to give you the ultimate
		in math blogging platforms. Use $latex your latex code here$ or [latex]your latex code here[/latex]
		to include  in your posts and comments. Enjoy all sorts of options and embrace your inner nerd.'
		, 'jetpack' )
		, '<a href="http://www.latex-project.org/" target="_blank"><img src="//s0.wp.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" /></a>'
	); ?>
<?php
}
add_action( 'jetpack_module_more_info_latex', 'latex_more_info' );

/**
 * Sharing
 */
function sharedaddy_load_more_link() {
	echo 'https://jetpack.com/support/sharing/';
}
add_filter( 'jetpack_learn_more_button_sharedaddy', 'sharedaddy_load_more_link' );

function sharedaddy_more_info() { ?>
	<?php esc_html_e(
		'Visitors can share your posts with Twitter, Facebook, and a host of other services. You can configure services
		to appear as icons, text, or both. Some services have additional options to display smart buttons, such as
		Twitter, which will update the number of times the post has been shared. We currently support: Twitter,
		Facebook, Reddit, Digg, LinkedIn, Google+, print, and email.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_sharedaddy', 'sharedaddy_more_info' );

/**
 * After The Deadline
 */
function jpatd_load_more_link() {
	echo 'https://jetpack.com/support/spelling-and-grammar/';
}
add_filter( 'jetpack_learn_more_button_after-the-deadline', 'jpatd_load_more_link' );

function jpatd_more_info() { ?>
	<?php esc_html_e(
		'The After the Deadline proofreading service improves your writing by using artificial intelligence to
		find spelling and grammatical errors and offers smart suggestions.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_after-the-deadline', 'jpatd_more_info' );

/**
 * Extra Sidebar Widgets
 */
function jetpack_widgets_load_more_link() {
	echo 'https://jetpack.com/support/extra-sidebar-widgets/';
}
add_filter( 'jetpack_learn_more_button_widgets', 'jetpack_widgets_load_more_link' );

function jetpack_widgets_more_info() { ?>
	<?php esc_html_e(
		'Show your visitors a variety of useful content within your sidebar, including your latest tweets,
		a Facebook like box, custom images, your Gravatar image and profile data, a tiled gallery,
		recent posts from another WordPress site, or popular social icons.
		You can add as many as you like by dragging and dropping and customize each to fit your needs.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_widgets', 'jetpack_widgets_more_info' );

/**
 * Subscriptions
 */
function jetpack_subscriptions_load_more_link() {
	echo 'https://jetpack.com/support/subscriptions/';
}
add_action( 'jetpack_learn_more_button_subscriptions', 'jetpack_subscriptions_load_more_link' );

function jetpack_subscriptions_more_info() { ?>
	<?php esc_html_e(
		'Allow any visitor to subscribe to your site through a widget in your sidebar. Each time you publish new content,
		Jetpack will email a notification to all of your subscribers. When leaving comments, your visitors can also
		subscribe to a post’s comments to keep up with the conversation.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_subscriptions', 'jetpack_subscriptions_more_info' );

/**
 * Enhanced Distribution
 */
function jetpack_enhanced_distribution_more_link() {
	echo 'https://jetpack.com/support/enhanced-distribution/';
}
add_action( 'jetpack_learn_more_button_enhanced-distribution', 'jetpack_enhanced_distribution_more_link' );

function jetpack_enhanced_distribution_more_info() {
	esc_html_e(
		'Jetpack will automatically take your great published content and share it instantly with third-party services
		like search engines, increasing your reach and traffic.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_enhanced-distribution', 'jetpack_enhanced_distribution_more_info' );


/**
 * Protect
 */
function jetpack_protect_more_link() {
	echo 'https://jetpack.com/support/protect/';
}
add_action( 'jetpack_learn_more_button_protect', 'jetpack_protect_more_link' );

function jetpack_protect_more_info() {
	esc_html_e(
		'Most sites will come under attack from automated bots that attempt to log in for malicious purposes
		(such as inserting inappropriate content or modifying yours). With Protect turned on, your site is automatically
		protected from unauthorized access, as we are constantly collecting and identifying malicious IP addresses from
		the millions of sites we protect. (Protect is derived from BruteProtect, and will disable BruteProtect on your
		site if it is currently enabled.)'
		, 'jetpack' );
}

add_action( 'jetpack_module_more_info_protect', 'jetpack_protect_more_info' );

/**
 * JSON API
 */
function jetpack_json_api_more_link() {
	echo 'https://jetpack.com/support/json-api/';
}
add_action( 'jetpack_learn_more_button_json-api', 'jetpack_json_api_more_link' );

function jetpack_json_api_more_info() {
	esc_html_e(
		'Jetpack will allow you to authorize applications and services to securely connect to your site, allow them
		to use your content in new ways, and offer you new functionality. Developers can use WordPress.com\'s OAuth2
		authentication system and WordPress.com REST API to manage and access your site\'s content.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_json-api', 'jetpack_json_api_more_info' );


/**
 * Contact Form
 */
function jetpack_contact_form_learn_more_button() {
	echo 'https://jetpack.com/support/contact-form/';
}
add_action( 'jetpack_learn_more_button_contact-form', 'jetpack_contact_form_learn_more_button' );

function jetpack_contact_form_more_info() { ?>
	<?php esc_html_e(
		'Offer your readers the ability to get in touch without publishing your personal email address.
		You can have multiple forms on your site and customize each one to fit specific needs.
		When a user submits your contact form, their feedback will be emailed to you and added to
		your feedback management area. If you have Akismet active on your site, submissions will be
		automatically filtered for spam. '
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_contact-form', 'jetpack_contact_form_more_info' );


/**
 * Comments
 */
function jetpack_comments_learn_more_button() {
	echo 'https://jetpack.com/support/comments';
}
add_action( 'jetpack_learn_more_button_comments', 'jetpack_comments_learn_more_button' );

function jetpack_comments_more_info() { ?>
	<?php esc_html_e(
		'Comments enables your visitors to use their WordPress.com, Twitter, or Facebook accounts when commenting on
		your site. Jetpack tries to match your site\'s color scheme automatically, but you can make manual adjustments
		at the bottom of the Discussion Settings page.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_comments', 'jetpack_comments_more_info' );

/**
 * Carousel
 */
function jetpack_carousel_learn_more_button() {
	echo 'https://jetpack.com/support/carousel';
}
add_action( 'jetpack_learn_more_button_carousel', 'jetpack_carousel_learn_more_button' );

function jetpack_carousel_more_info() { ?>
	<?php esc_html_e(
		'With Carousel active, any standard WordPress galleries you have embedded in posts or pages will
		launch a full-screen photo browsing experience with comments and EXIF metadata.'
		, 'jetpack' ); ?>
<?php
}
add_action( 'jetpack_module_more_info_carousel', 'jetpack_carousel_more_info' );

/**
 * Custom CSS
 */
function jetpack_custom_css_more_button() {
	echo 'https://jetpack.com/support/custom-css';
}
add_action( 'jetpack_learn_more_button_custom-css', 'jetpack_custom_css_more_button' );

function jetpack_custom_css_more_info() { ?>
	<?php esc_html_e(
		"The Custom CSS editor lets you add to or replace your theme's CSS, while supplying syntax coloring,
		auto-indentation, and immediate feedback on the validity of the CSS you're writing.
		You can also add mobile styles, and we support the CSS preprocessors LESS and Sass."
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_custom-css', 'jetpack_custom_css_more_info' );

/**
 * Mobile Theme
 */
function jetpack_minileven_more_button() {
	echo 'https://jetpack.com/support/mobile-theme';
}
add_action( 'jetpack_learn_more_button_minileven', 'jetpack_minileven_more_button' );

function jetpack_minileven_more_info() { ?>
	<?php esc_html_e(
		"There's a good chance that visitors to your site will be using a smartphone,
		and it's important to provide them with a great reading experience while on the small screen.
		Visitors on iPhone, Android, Windows Phone, and other mobile devices will automatically see your site
		optimized for mobile with an option to view the full site. Jetpack's mobile theme uses the header image,
		background, and widgets from your current theme for a beautiful mobile look. Post format support is included,
		so your photos and galleries will also look fantastic."
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_minileven', 'jetpack_minileven_more_info' );

/**
 * Infinite Scroll
 */
function jetpack_infinite_scroll_more_button() {
	echo 'https://jetpack.com/support/infinite-scroll';
}
add_action( 'jetpack_learn_more_button_infinite-scroll', 'jetpack_infinite_scroll_more_button' );

function jetpack_infinite_scroll_more_info() {
	esc_html_e(
		'With this feature (and a supported theme), you can get your content in front of visitors faster.
		Instead of the old way of scrolling down a page, clicking a link to get to the next page,
		and then waiting for the page to load, infinite scrolling pulls the next set of posts
		automatically into view when the reader approaches the bottom of the page.'
	, 'jetpack' );
}
add_action( 'jetpack_module_more_info_infinite-scroll', 'jetpack_infinite_scroll_more_info' );

/**
 * Post by Email
 */
function jetpack_post_by_email_more_link() {
	echo 'https://jetpack.com/support/post-by-email/';
}
add_action( 'jetpack_learn_more_button_post-by-email', 'jetpack_post_by_email_more_link' );

function jetpack_post_by_email_more_info() { ?>
	<?php esc_html_e(
		'With Post by Email, you can publish posts on your site by sending an email instead of using the post editor.
		Any email client can be used to send the email (such as GMail, Outlook, and Apple Mail), which allows you to
		publish on the go right from your smartphone or tablet.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_post-by-email', 'jetpack_post_by_email_more_info' );

/**
 * Photon
 */
function jetpack_photon_more_link() {
	echo 'https://jetpack.com/support/photon';
}
add_action( 'jetpack_learn_more_button_photon', 'jetpack_photon_more_link' );

function jetpack_photon_more_info() {
	esc_html_e(
		"With Photon activated, we cache your images and serve them from our super-fast, global network,
		reducing the burden on your web host and making your site load faster for your visitors.
		Your images are automatically optimized for different display resolutions to serve the best
		possible image quality at the fastest speed depending on whether a visitor browses your site
		from desktop, tablet, or mobile devices."
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_photon', 'jetpack_photon_more_info' );

/**
 * Tiled Galleries
 */
function jetpack_tiled_gallery_more_link() {
	echo 'https://jetpack.com/support/tiled-galleries/';
}
add_action( 'jetpack_learn_more_button_tiled-gallery', 'jetpack_tiled_gallery_more_link' );

function jetpack_tiled_gallery_more_info() { ?>
	<?php esc_html_e(
		'Create elegant magazine-style mosaic layouts for your photos without having to use an external graphics editor.
		When adding a gallery to your post, you will have the option to select a layout style for your images
		including mosaic, square, and circular layouts. You can also choose to make all galleries display as mosaic by default.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_tiled-gallery', 'jetpack_tiled_gallery_more_info' );

/**
 * Likes
 */
function jetpack_likes_more_link() {
	echo 'https://jetpack.com/support/likes/';
}
add_action( 'jetpack_learn_more_button_likes', 'jetpack_likes_more_link' );

function jetpack_likes_more_info() { ?>
	<?php esc_html_e(
		'Likes allow your readers to show their appreciation for your posts and other published content using their
		WordPress.com accounts. You will see your likes below each post, as well as the Gravatars of the people who
		have liked them. Your readers will also be able to review their liked posts from WordPress.com.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_likes', 'jetpack_likes_more_info' );

/**
 * Omnisearch
 */
function jetpack_omnisearch_more_link() {
	echo 'https://jetpack.com/support/omnisearch/';
}
add_action( 'jetpack_learn_more_button_omnisearch', 'jetpack_omnisearch_more_link' );

function jetpack_omnisearch_more_info() {
	esc_html_e(
		'A search to rule them all: search once, get results from everything! Omnisearch supports searching posts,
		pages, comments, media, and plugins and plays nice with other plugins by letting other providers offer
		results as well.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_omnisearch',  'jetpack_omnisearch_more_info' );

/**
 * Widget Visibility
 */
function jetpack_widget_visibility_more_link() {
	echo 'https://jetpack.com/support/widget-visibility/';
}
add_action( 'jetpack_learn_more_button_widget-visibility', 'jetpack_widget_visibility_more_link' );

function jetpack_widget_visibility_more_info() {
	esc_html_e(
		'Easily control where to show or hide widgets on your site. For any widget on your site,
		you can choose a set of visibility options such as showing them only certain categories,
		only on error pages, or only search results pages. You can also do the reverse and
		choose to hide them on certain pages.'
		, 'jetpack' ); ?>
<?php
}
add_action( 'jetpack_module_more_info_widget-visibility',  'jetpack_widget_visibility_more_info' );

/**
 * VideoPress
 */
function jetpack_videopress_more_link() {
	echo 'https://jetpack.com/support/videopress/';
}
add_action( 'jetpack_learn_more_button_videopress', 'jetpack_videopress_more_link' );

function jetpack_videopress_more_info() {
	esc_html_e(
		'VideoPress was designed specifically for WordPress, making it the easiest way to upload videos to your site.
		Ad-free and unbranded, VideoPress keeps traffic on your site. You get rich stats on how many times a video
		has been played and where it’s been shared. It’s also lightweight and responsive, which means you can add and
		play videos just as well from your phone or tablet.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_videopress', 'jetpack_videopress_more_info' );

/**
 * SSO
 */
function jetpack_sso_more_link() {
	echo 'https://jetpack.com/support/sso/';
}
add_action( 'jetpack_learn_more_button_sso', 'jetpack_sso_more_link' );

function jetpack_sso_more_info() {
	esc_html_e(
		'Your users will be able to log in to or register for your WordPress site with the same credentials they use
		on WordPress.com. Once enabled, a "Log in with WordPress.com" option will be added to your existing login form.
		It\'s safe and secure.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_sso',  'jetpack_sso_more_info' );

/**
 * Monitor
 */
function jetpack_monitor_more_link() {
	echo 'https://jetpack.com/support/monitor/';
}
add_action( 'jetpack_learn_more_button_monitor', 'jetpack_monitor_more_link' );

function jetpack_monitor_more_info() {
	esc_html_e(
		'Nobody likes downtime, and that\'s why Jetpack Monitor is on the job, keeping tabs on your site by checking
		it every five minutes. As soon as any downtime is detected, you will receive an email notification alerting
		you to the issue, so you can act quickly and get your site back online. We’ll let you know as soon as your
		site is up and running again so you can keep an eye on total downtime.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_monitor', 'jetpack_monitor_more_info' );

/**
 * Related Posts
 */
function jetpack_related_posts_more_button() {
	echo 'https://jetpack.com/support/related-posts/';
}
add_action( 'jetpack_learn_more_button_related-posts', 'jetpack_related_posts_more_button' );

function jetpack_related_posts_more_info() {
	esc_html_e(
		'Keep visitors engaged and show them relevant links from your site at the bottom of your posts. Give visitors
		the options to browse more of your content, explore your site further, and transform them into regular readers.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_related-posts', 'jetpack_related_posts_more_info' );

/**
 * Markdown
 */
function jetpack_markdown_more_link() {
	echo 'https://jetpack.com/support/markdown/';
}
add_action( 'jetpack_learn_more_button_markdown', 'jetpack_markdown_more_link' );

function jetpack_markdown_more_info() {
	esc_html_e(
		'Markdown lets you compose posts and comments with links, lists, and other styles using regular characters and
		punctuation marks. Markdown is used by writers and bloggers who want a quick and easy way to write rich text,
		without having to take their hands off the keyboard or learn a lot of complicated codes and shortcuts.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_markdown', 'jetpack_markdown_more_info' );

/**
 * Site Verification Tools
 */
function jetpack_verification_tools_more_link() {
	echo 'https://support.wordpress.com/webmaster-tools/';
}
add_action( 'jetpack_learn_more_button_verification-tools', 'jetpack_verification_tools_more_link' );

function jetpack_verification_tools_more_info() {
	esc_html_e(
		'Use these tools to verify that you own and control your website with external services like Google, Bing,
		and Pinterest. Verifying your site allows you to access advanced features on these other services
		(e.g. Webmaster tools, Google Search Console) or to get a verified badge to display and establish your site’s authenticity.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_verification-tools', 'jetpack_verification_tools_more_info' );

/**
 * Custom Content Types
 */
function jetpack_custom_content_types_more_link() {
	echo 'https://jetpack.com/support/custom-content-types/';
}
add_action( 'jetpack_learn_more_button_custom-content-types', 'jetpack_custom_content_types_more_link' );

function jetpack_custom_content_types_more_info() { ?>
	<?php esc_html_e(
		'This feature allows you to add and organize content that doesn’t necessarily fit into a post or static page.
		For example, the Portfolio type gives you an easy way to manage and showcase projects on your site, while the
		Testimonial type allows you to add, organize, and display customer testimonials. Once created, your custom
		content can be visible at specific URLs, or you may add them with shortcodes.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_custom-content-types', 'jetpack_custom_content_types_more_info' );

/**
 * Site Icon
 */
function jetpack_site_icon_more_link() {
	echo 'https://jetpack.com/support/site-icon';
}
add_action( 'jetpack_learn_more_button_site-icon', 'jetpack_site_icon_more_link' );

function jetpack_custom_site_icon() {
	esc_html_e( 'Site Icon can now be found in WordPress core!', 'jetpack' );
}
add_action( 'jetpack_module_more_info_site-icon', 'jetpack_custom_site_icon' );

/**
 * Manage
 */
function jetpack_manage_more_link() {
	echo 'https://jetpack.com/support/site-management/';
}
add_action( 'jetpack_learn_more_button_manage', 'jetpack_manage_more_link' );

function jetpack_custom_jetpack_manage() { ?>
	<?php esc_html_e(
		'Manage and update this and other WordPress sites from one simple dashboard on WordPress.com. You can update
		plugins, set them to automatically update, and (de)activate them on a per-site basis or in bulk from
		wordpress.com/plugins. You can also use the brand new and mobile-friendly post editor on WordPress.com as well
		as view and activate installed themes and create or edit site menus.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_manage', 'jetpack_custom_jetpack_manage' );

// XML Sitemap: START
function jetpack_sitemaps_more_link() {
	echo 'https://jetpack.com/support/sitemaps/';
}
add_action( 'jetpack_learn_more_button_sitemaps', 'jetpack_sitemaps_more_link' );

function jetpack_xml_sitemap_more_info() {
	esc_html_e(
		'Search engines like Google and Bing use sitemaps to crawl and understand your site making
		it more likely for your content to show up on relevant searches. This feature creates two
		sitemap files that list the URLs of posts and pages in your site with important information about each one.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_sitemaps', 'jetpack_xml_sitemap_more_info' );
// XML Sitemap: STOP
