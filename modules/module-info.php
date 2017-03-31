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
	echo 'https://help.vaultpress.com/get-to-know/';
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
		'Enhance plain Gravatar images with information about a person (including a name,
		bio, pictures, and contact info) when they leave a comment on one of your posts.'
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
		'Easily and safely embed media from YouTube, Facebook, Flickr, Vimeo, Instagram,
		Google Maps, SlideShare, Vine, SoundCloud, and more. Just enter the appropriate shortcode directly into the
		editor and click “Publish.”'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_shortcodes', 'jetpack_shortcodes_more_info' );

/**
 * Shortlinks
 */
function wpme_load_more_link() {
	echo 'http://wp.me/p1moTy-DL';
}
add_filter( 'jetpack_learn_more_button_shortlinks', 'wpme_load_more_link' );

function wpme_more_info() { ?>
	<?php esc_html_e(
		'Grab short and simple links to your posts and pages using the compact wp.me domain name. Perfect
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
		'Simple and concise statistics about your traffic. Jetpack collects data about pageviews, likes, comments,
		locations, and top posts. View them in your dashboard or on WordPress.com.'
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
		'Automatically share and promote newly published posts to Facebook, Twitter, Tumblr, Google+, Path,
		and LinkedIn. You can add connections for yourself or for all users on your site.'
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
		'You will receive instant notifications in your dashboard or your mobile device when somebody comments
		on any of your sites. Reply directly wherever you are to keep the conversation going.'
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
		'Visitors can share your posts with Twitter, Facebook, Reddit, Digg, LinkedIn, Google+, print,
		and email. You can configure services to appear as icons, text, or both and some services like Twitter
		have additional options.'
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
		'Add as many custom widgets as you like by dragging and dropping and customize each to fit your needs,
		including, Twitter streams, Facebook like boxes, custom images, Gravatars, tiled galleries, recent posts,
		or social icons.'
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
		'A widget in your sidebar allows visitors to subscribe to your site so that they receive an email
		each time you publish new content. Your visitors can also subscribe to a post\'s comments to keep up with the conversation.'
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
		'Most sites will come under attack from automated bots that attempt to log in for malicious purposes.
		We protect you automatically from unauthorized access by using data from millions of sites.'
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
		'Authorize applications and services to securely connect to your site. Developers can use WordPress.com\'s OAuth2
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
		'Create simple contact forms without any coding. You can have multiple forms and when
		a user submits it, their feedback will be emailed directly to you. If Akismet is active, submissions will be
		automatically filtered for spam.'
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
		'Allow visitors to use their WordPress.com, Twitter, or Facebook accounts when commenting on
		your site. Jetpack will match your site\'s color scheme automatically (but you can adjust that).'
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
		'With Carousel active, any standard WordPress galleries or single images you have embedded in posts or pages will
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
		"Add to or replace your theme's CSS including mobile styles, LESS, and SaSS.
		Includes syntax coloring, auto-indentation, and immediate CSS validation."
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_custom-css', 'jetpack_custom_css_more_info' );


/**
 * Masterbar
 */
function jetpack_masterbar_more_link() {
	echo 'https://jetpack.com/support/masterbar/';
}
add_action( 'jetpack_learn_more_button_masterbar', 'jetpack_masterbar_more_link' );

function jetpack_masterbar_more_info() {
	esc_html_e(
		"Quickly access your Stats, Notifications, Posts and more on WordPress.com. " .
		"The Toolbar is displayed for any user on the site that is connected to WordPress.com."
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_masterbar', 'jetpack_masterbar_more_info' );

/**
 * Mobile Theme
 */
function jetpack_minileven_more_button() {
	echo 'https://jetpack.com/support/mobile-theme';
}
add_action( 'jetpack_learn_more_button_minileven', 'jetpack_minileven_more_button' );

function jetpack_minileven_more_info() { ?>
	<?php esc_html_e(
		"Automatically optimize your site for mobile. Jetpack's mobile theme uses the header image,
		background, and widgets from your current theme. Post format support means your photos and galleries
		will also look fantastic."
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
		'Infinite scrolling pulls the next set of posts automatically into view when the reader approaches
		the bottom of the page. This helps you reader see more of your content.'
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
		'Publish posts on your site by writing and sending an email from any email client instead of using the post editor.'
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
		"Your images are automatically optimized for different display resolutions to serve the best
		possible image quality. We also cache and serve them from our fast, global network (CDN)."
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
		'When adding an image gallery, you will have the option to create elegant magazine-style mosaic layouts for your photos,
		including mosaic (default), square, and circular layouts.'
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
		'Allow your readers to show their appreciation for your posts and other content. Likes show up
		below each post and your readers will also be able to review their liked posts from WordPress.com.'
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
		'Choose from a set of visibility options for sidebar widgets such as showing them only certain categories,
		only on error pages, or only search results pages. You can also do the reverse and choose to hide them on certain pages.'
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
		'The easiest way to upload ad-free and unbranded videos to your site. You get stats on video
		playback and shares and the player is lightweight and responsive.'
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
		'Your users will be able to log in to your site with their WordPress.com account.
		This includes two-factor authentication making it the safest login mechanism for your site.'
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
		'Jetpack checks your site every five minutes and if any downtime is detected you will receive an email
		notification alerting you to the issue, so you can act quickly and get your site back online.'
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
		'Show visitors related content from your site at the bottom of your posts. This encourages them
		to browse more content, explore your site, and transform them into regular readers.'
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
		'Compose posts and comments with links, lists, and other styles using regular characters and
		punctuation marks. A quick and easy way to format text without needing any HTML or coding.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_markdown', 'jetpack_markdown_more_info' );

/**
 * Site Verification Tools
 */
function jetpack_verification_tools_more_link() {
	echo 'https://jetpack.com/support/site-verification-tools/';
}
add_action( 'jetpack_learn_more_button_verification-tools', 'jetpack_verification_tools_more_link' );

function jetpack_verification_tools_more_info() {
	esc_html_e(
		'Verify your site ownership with services like Google, Bing, Pinterest, and Yandex. This gives you access to
		advanced features on these services and get verification badges.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_verification-tools', 'jetpack_verification_tools_more_info' );

/**
 * SEO Tools
 */
function jetpack_seo_tools_more_link() {
	echo 'https://jetpack.com/support/seo-tools/';
}
add_action( 'jetpack_learn_more_button_seo-tools', 'jetpack_seo_tools_more_link' );

function jetpack_seo_tools_more_info() {
	esc_html_e(
		'Better results on search engines and social media.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_seo-tools', 'jetpack_seo_tools_more_info' );

/**
 * Custom Content Types
 */
function jetpack_custom_content_types_more_link() {
	echo 'https://jetpack.com/support/custom-content-types/';
}
add_action( 'jetpack_learn_more_button_custom-content-types', 'jetpack_custom_content_types_more_link' );

function jetpack_custom_content_types_more_info() { ?>
	<?php esc_html_e(
		'Add and organize content that doesn’t necessarily fit into a post or static page such as portfolios
		or testimonials. Custom	content can be visible at specific URLs, or you may add them with shortcodes.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_custom-content-types', 'jetpack_custom_content_types_more_info' );
// Custom Content Types: STOP

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
		'Automatically create two sitemap files that list the URLs of posts and pages in your site.
		This makes it easier for search engines (like Google) to include your site in relevant search results.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_sitemaps', 'jetpack_xml_sitemap_more_info' );
// XML Sitemap: STOP

/**
 * WordAds
 */
function jetpack_wordads_more_link() {
	echo 'https://wordads.co/';
}
add_action( 'jetpack_learn_more_button_wordads', 'jetpack_wordads_more_link' );

function jetpack_wordads_more_info() {
	esc_html_e(
		'By default ads are shown at the end of every page, post, or the first article on your front page. You can also add them to the top of your site and to any widget area to increase your earnings!'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_wordads', 'jetpack_wordads_more_info' );
// WordAds: STOP

/**
 * Google Analytics
 */
function jetpack_google_analytics_more_link() {
	echo 'https://jetpack.com/support/google-analytics';
}
add_action( 'jetpack_learn_more_button_google-analytics', 'jetpack_google_analytics_more_link' );

function jetpack_google_analytics_more_info() {
	esc_html_e(
		'Track website statistics with Google Analytics for a deeper understanding of your website visitors and customers.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_google-analytics', 'jetpack_google_analytics_more_info' );
