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

	echo '<a class="button-secondary more-info-link" href="' . $vaultpress_url . '" target="_blank">' . __( "Learn More", 'jetpack' ) . '</a>';
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
	echo '<a class="button-secondary more-info-link" href="http://blog.gravatar.com/2010/10/06/gravatar-hovercards-on-wordpress-com/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_gravatar-hovercards', 'grofiles_load_more_link' );

function grofiles_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://blog.gravatar.com/2010/10/06/gravatar-hovercards-on-wordpress-com/" target="_blank">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/hovercards.jpg' ) ?>" alt="<?php esc_attr_e( 'Gravatar Hovercard', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

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
function jetpack_shortcodes_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/shortcodes/" target="_blank">' . esc_html__( 'Learn More' , 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_shortcodes', 'jetpack_shortcodes_load_more_link' );

function jetpack_shortcodes_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/shortcodes/" target="_blank">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/shortcodes.jpg' ) ?>" alt="<?php esc_attr_e( 'Shortcode Embeds', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

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
function wpme_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://wp.me/sf2B5-shorten" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_shortlinks', 'wpme_load_more_link' );

function wpme_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://wp.me/sf2B5-shorten" target="_blank">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/shortlinks.jpg' ) ?>" alt="<?php esc_attr_e( 'WP.me Shortlinks', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

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
function stats_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/stats/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_stats', 'stats_load_more_link' );

function stats_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/stats/" target="_blank">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/stats.jpg' ) ?>" alt="<?php esc_attr_e( 'Site Stats', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<p><?php esc_html_e( 'There are many plugins and services that provide statistics, but data can be overwhelming. Site Stats makes the most popular metrics easy to understand through a clear and attractive interface.', 'jetpack' ) ?></p>
	<p><?php printf( __( 'You can <a href="%s">view your stats dashboard here</a>.', 'jetpack' ), admin_url( 'admin.php?page=stats' ) ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_stats', 'stats_more_info' );

/**
 * Publicize
 */
function publicize_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://jetpack.com/support/publicize/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_publicize', 'publicize_load_more_link' );

function publicize_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/publicize/" target="_blank">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/publicize.jpg' ) ?>" alt="<?php esc_attr_e( 'Publicize', 'jetpack' ) ?>" width="328" height="123" />
		</a>
	</div>

	<p><?php esc_html_e( 'Publicize allows you to connect your blog to popular social networking sites and automatically share new posts with your friends.	 You can make a connection for just yourself or for all users on your blog.', 'jetpack' ) ?></p>
	<p><?php esc_html_e( 'Publicize allows you to share your posts on Facebook, Twitter, Tumblr, Google+, Path, and Linkedin.', 'jetpack' ); ?></p>

<?php	if ( 'jetpack_module_more_info_connected_publicize' == current_filter() ) : ?>

	<p><?php printf( __( 'Manage your <a href="%s">Publicize settings</a>.', 'jetpack' ), menu_page_url( 'sharing', false ) ); ?>

<?php	endif; ?>

	<p>&rarr; <a href="http://jetpack.com/support/publicize/" target="_blank"><?php esc_html_e( 'More information on using Publicize.', 'jetpack' ); ?></a></p>
<?php
}
add_action( 'jetpack_module_more_info_publicize', 'publicize_more_info' );

/**
 * Notifications
 */
function notes_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://support.wordpress.com/notifications/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_notes', 'notes_load_more_link' );

function notes_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://support.wordpress.com/notifications/" target="_blank">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/notes.jpg' ) ?>" alt="<?php esc_attr_e( 'Notifications', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<p><?php esc_html_e( 'Keep up with the latest happenings on all your WordPress sites and interact with other WordPress.com users.', 'jetpack' ) ?></p>
	<p><?php printf( __( 'You can view your notifications in the Toolbar and <a href="%s" target="_blank">on WordPress.com</a>.', 'jetpack' ), 'http://wordpress.com/#!/notifications/' ); ?></p>
<?php
}
add_filter( 'jetpack_module_more_info_notes', 'notes_more_info' );

/**
 * LaTeX
 */
function latex_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://support.wordpress.com/latex/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_latex', 'latex_load_more_link' );

function latex_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://support.wordpress.com/latex/" target="_blank">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/beautifulmath.jpg' ) ?>" alt="<?php esc_attr_e( 'LaTeX', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

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
function sharedaddy_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://support.wordpress.com/sharing/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_sharedaddy', 'sharedaddy_load_more_link' );

function sharedaddy_more_info() { ?>
	<div class="jp-info-img">
		<embed type="application/x-shockwave-flash" src="http://s0.videopress.com/player.swf?v=1.02" height="190" wmode="transparent" seamlesstabbing="true" allowfullscreen="true" allowscriptaccess="always" overstretch="true" flashvars="guid=WV0JOwY2"></embed>
	</div>
	<p><?php esc_html_e( 'Share your posts with Twitter, Facebook, and a host of other services. You can configure services to appear as icons, text, or both. Some services have additional options to display smart buttons, such as Twitter, which will update the number of times the post has been shared.', 'jetpack' ); ?></p>

	<p><?php
		if ( is_multisite() ) {
			esc_html_e( 'The following services are included: Twitter, Facebook, Reddit, PressThis, Digg, LinkedIn, Google +1, Print, and Email.' , 'jetpack' );
		} else {
			esc_html_e( 'The following services are included: Twitter, Facebook, Reddit, Digg, LinkedIn, Google +1, Print, and Email.' , 'jetpack' );
		}
	?></p>

	<?php
	if ( class_exists( 'Sharing_Admin' ) ) {
		?>

		<p><?php printf( __( 'To configure your sharing settings, go to the Settings &rarr; <a href="%s">Sharing</a> menu.', 'jetpack' ), 'options-general.php?page=sharing' ); ?></p>
		<p><?php esc_html_e( 'Drag and drop sharing services into the enabled section to have them show up on your site, and drag them into the hidden section to have them hidden behind a button.', 'jetpack' ); ?>

		<?php
	}
	?>

	<p><?php printf( __( 'Full details can be found on the <a href="%s" target="_blank">Sharing support page</a>. This video also gives a swish run-down of how to use the Sharing feature. Watch it in HD for extra snazz!', 'jetpack' ), 'http://support.wordpress.com/sharing/' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_sharedaddy', 'sharedaddy_more_info' );

/**
 * After The Deadline
 */
function jpatd_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/proofreading/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_after-the-deadline', 'jpatd_load_more_link' );

function jpatd_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/proofreading/" target="_blank">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/spelling.jpg' ) ?>" alt="<?php esc_attr_e( 'Spelling and Grammar', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<?php esc_html_e(
		'The After the Deadline proofreading service improves your writing by using artificial intelligence to
		find spelling and grammatical errors and offers smart suggestions.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_after-the-deadline', 'jpatd_more_info' );

/**
 * Extra Sidebar Widgets
 */
function jetpack_widgets_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/widgets/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_widgets', 'jetpack_widgets_load_more_link' );

function jetpack_widgets_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/widgets.jpg' ) ?>" alt="<?php esc_attr_e( 'Widgets Screenshot', 'jetpack' ) ?>" width="300" height="150" />
	</div>
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
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/following/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_subscriptions', 'jetpack_subscriptions_load_more_link' );

function jetpack_subscriptions_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/subscriptions.jpg' ) ?>" alt="<?php esc_attr_e( 'Subsriptions Screenshot', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<p><?php esc_html_e( 'Easily allow any visitor to subscribe to all of your posts via email through a widget in your blog&#8217;s sidebar.  Every time you publish a post, WordPress.com will send a notification to all your subscribers.', 'jetpack' ); ?></p>
	<p><?php esc_html_e( 'When leaving comments, your visitors can also subscribe to a post&#8217;s comments to keep up with the conversation.', 'jetpack' ); ?></p>

	<p><?php printf(
		__( 'To use the Subscriptions widget, go to Appearance &#8594; <a href="%s">Widgets</a>. Drag the widget labeled &#8220;Blog Subscriptions (Jetpack)&#8221; into one of your sidebars and configure away.', 'jetpack' ),
		admin_url( 'widgets.php' )
	); ?></p>
	<p><?php printf(
		__( 'You can also make changes to your Subscription settings at the bottom of the <a href="%s">Discussion Settings</a> page.', 'jetpack' ),
		admin_url( 'options-discussion.php#jetpack-subscriptions-settings' )
	); ?></p>
	<p><?php printf(
		__( 'To customize the emails sent from your blog to your followers, check the settings at the bottom of the <a href="%s">Reading Settings</a> page.', 'jetpack' ),
		admin_url( 'options-reading.php#follower-settings' )
	); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_subscriptions', 'jetpack_subscriptions_more_info' );

/**
 * Enhanced Distribution
 */
function jetpack_enhanced_distribution_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://en.wordpress.com/firehose/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_enhanced-distribution', 'jetpack_enhanced_distribution_more_link' );

function jetpack_enhanced_distribution_more_info() { ?>
	<p><?php esc_html_e( 'Jetpack will automatically take the great published content from your blog or website and share it instantly with third party services like search engines, increasing your reach and traffic.', 'jetpack' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_enhanced-distribution', 'jetpack_enhanced_distribution_more_info' );


/**
 * Protect
 */
function jetpack_protect_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://jetpack.com/support/protect/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
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
	echo '<a class="button-secondary more-info-link" href="http://jetpack.com/support/json-api/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
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
	echo '<a class="button-secondary more-info-link" href="http://support.wordpress.com/contact-form/" target="_blank">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_contact-form', 'jetpack_contact_form_learn_more_button' );

function jetpack_contact_form_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/contactform.jpg' ) ?>" alt="<?php esc_attr_e( 'Contact Form', 'jetpack' ) ?>" width="300" height="150" />
	</div>

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
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_comments', 'jetpack_comments_learn_more_button' );

function jetpack_comments_more_info() {
?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/comments.jpg' ) ?>" alt="<?php esc_attr_e( 'Comments Screenshot', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<p><?php esc_html_e( 'Comments enables your visitors to use their WordPress.com, Twitter, or Facebook accounts when commenting on your site.', 'jetpack' ); ?></p>

	<p><?php printf(
		__( "Jetpack tries to match your site's color scheme automatically, but you can make manual adjustments at the bottom of the <a href='%s'>Discussion Settings</a> page.", 'jetpack' ),
		admin_url( 'options-discussion.php#jetpack-comments-settings' )
	); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_comments', 'jetpack_comments_more_info' );

/**
 * Carousel
 */
function jetpack_carousel_learn_more_button() {
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_carousel', 'jetpack_carousel_learn_more_button' );

function jetpack_carousel_more_info() {
?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/carousel.jpg' ) ?>" alt="<?php esc_attr_e( 'Gallery Carousel Screenshot', 'jetpack' ) ?>" width="300" height="188" />
	</div>

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
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_custom-css', 'jetpack_custom_css_more_button' );

function jetpack_custom_css_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/custom-css.jpg' ) ?>" alt="<?php esc_attr_e( 'Custom CSS', 'jetpack' ) ?>" width="300" height="150" />
	</div>
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
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_minileven', 'jetpack_minileven_more_button' );

function jetpack_minileven_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/mobile-theme.jpg' ) ?>" alt="<?php esc_attr_e( 'Mobile Theme', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<?php esc_html_e( "There's a good chance that visitors to your site will be using a smartphone,
	and it's important to provide them with a great reading experience while on the small screen.
	Visitors on iPhone, Android, Windows Phone, and other mobile devices will automatically see your site
	optimized for mobile with an option to view the full site. Jetpack's mobile theme uses the header image,
	background, and widgets from your current theme for a beautiful mobile look. Post format support is included,
	so your photos and galleries will also look fantastic.", 'jetpack' );
}
add_action( 'jetpack_module_more_info_minileven', 'jetpack_minileven_more_info' );

/**
 * Infinite Scroll
 */
function jetpack_infinite_scroll_more_button() {
	echo '<a class="button more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
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
	echo '<a class="button-secondary more-info-link" href="http://jetpack.com/support/post-by-email/" target="_blank">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_post-by-email', 'jetpack_post_by_email_more_link' );

function jetpack_post_by_email_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/post-by-email.jpg' ) ?>" alt="<?php esc_attr_e( 'Post by Email', 'jetpack' ) ?>" width="300" height="115" />
	</div>

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
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
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
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_tiled-gallery', 'jetpack_tiled_gallery_more_link' );

function jetpack_tiled_gallery_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/tiled-gallery.jpg' ) ?>" alt="<?php esc_attr_e( 'Tiled Galleries', 'jetpack' ) ?>" width="300" height="150" />
	</div>

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
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_likes', 'jetpack_likes_more_link' );

function jetpack_likes_more_info() { ?>

	<div class="jp-info-img">
		<a href="http://jetpack.com/support/likes/" target="_blank">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/likes.jpg' ) ?>" alt="<?php esc_attr_e( 'Likes', 'jetpack' ) ?>" width="323" height="69" />
		</a>
	</div>

	<p><?php esc_html_e( 'Likes allow your readers to show their appreciation for your posts and other published content using their WordPress.com accounts. Your readers will then be able to review their liked posts from WordPress.com.', 'jetpack' ) ?></p>
	<p><?php esc_html_e( 'Displayed below your posts will be how many people have liked your posts and the Gravatars of those who have liked them.', 'jetpack' ); ?></p>
	<?php if ( current_user_can( 'jetpack_manage_modules' ) ) : ?>
	<p><?php esc_html_e( 'You can turn Likes on by following these steps:', 'jetpack' ); ?></p>
	<ol>
		<li><?php esc_html_e( 'Make sure the module is activated by clicking on "Activate" at the bottom of this page.', 'jetpack' ); ?></li>
		<li><?php esc_html_e( 'Go to Settings > Sharing in your Dashboard.', 'jetpack' ); ?></li>
		<li><?php esc_html_e( 'Ensure that "WordPress.com Likes are…" is set to "On for all posts"', 'jetpack' ); ?></li>
	</ol>
	<?php endif; ?>
	<p>&rarr; <a href="http://jetpack.com/support/likes/" target="_blank"><?php esc_html_e( 'More information on using Likes.', 'jetpack' ); ?></a></p>

<?php
}
add_action( 'jetpack_module_more_info_likes', 'jetpack_likes_more_info' );

/**
 * Omnisearch
 */
function jetpack_omnisearch_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://jetpack.com/support/omnisearch/" target="_blank">' . __( 'Learn More', 'jetpack' ) . '</a>';
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
	echo '<a class="button-secondary more-info-link" href="http://jetpack.com/support/widget-visibility/" target="_blank">' . __( 'Learn More', 'jetpack' ) . '</a>';
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
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
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
	echo '<a class="button-secondary more-info-link" href="http://jetpack.com/support/sso/" target="_blank">' . __( 'Learn More', 'jetpack' ) . '</a>';
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
	echo '<a class="button-secondary more-info-link" href="http://jetpack.com/support/monitor/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
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
	echo '<a class="button more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_related-posts', 'jetpack_related_posts_more_button' );

function jetpack_related_posts_more_info() {
	$template = <<<EOT
		<div class="jp-info-img">
			<a href="http://jetpack.com/support/related-posts/" target="_blank">
				<img class="jp-info-img" src="%s" alt="%s" width="300" height="98" />
			</a>
		</div>

		<p>%s</p>
		<p>&rarr; <a href="http://jetpack.com/support/related-posts/" target="_blank">%s</a></p>
		<hr />
		<p><a href="%s#sync-related-posts">%s</a></p>
EOT;
	printf(
		$template,
		plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/related-posts.jpg' ),
		esc_attr__( 'Related Posts', 'jetpack' ),
		esc_html__( '"Related Posts" shows additional relevant links from your site under your posts. If the feature is enabled, links appear underneath your Sharing Buttons and WordPress.com Likes (if you’ve turned these on).', 'jetpack' ),
		esc_html__( 'More information on using Related Posts.', 'jetpack' ),
		esc_url( Jetpack::admin_url( array( 'page' => 'jetpack-debugger' ) ) ),
		esc_html__( 'This feature uses the WordPress.com infrastructure and requires that your public content be mirrored there. If you see intermittent issues only affecting certain posts, request a reindex of your posts.', 'jetpack' )
	);
}
add_action( 'jetpack_module_more_info_related-posts', 'jetpack_related_posts_more_info' );

/**
 * Markdown
 */
function jetpack_markdown_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/markdown/" target="_blank">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_markdown', 'jetpack_markdown_more_link' );

function jetpack_markdown_more_info() { ?>
	<p><?php esc_html_e( 'Markdown lets you compose posts and comments with links, lists, and other styles using regular characters and punctuation marks. Markdown is used by writers and bloggers who want a quick and easy way to write rich text, without having to take their hands off the keyboard, and without learning a lot of complicated codes and shortcuts.', 'jetpack' ); ?></p>

<?php
}
add_action( 'jetpack_module_more_info_markdown', 'jetpack_markdown_more_info' );

/**
 * Site Verification Tools
 */
function jetpack_verification_tools_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://support.wordpress.com/webmaster-tools/" target="_blank">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_verification-tools', 'jetpack_verification_tools_more_link' );

function jetpack_verification_tools_more_info() { ?>
	<p><?php esc_html_e( 'Use these tools to verify that you own/control your website with other external services like Google, Bing and Pinterest.', 'jetpack' ); ?></p>
	<p><?php printf( __( "Verifying your site allows you to access advanced features on these other services (e.g. Webmaster tools, Google Search Console, or getting a verified badge). We'll just add an invisible %s tag to the source code of your homepage.", 'jetpack' ), '<code>meta</code>' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_verification-tools', 'jetpack_verification_tools_more_info' );

/**
 * Custom Content Types
 */
function jetpack_custom_content_types_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://support.wordpress.com/portfolios/" target="_blank">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_custom-content-types', 'jetpack_custom_content_types_more_link' );

function jetpack_custom_content_types_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/custom-content-types.jpg' ) ?>" alt="<?php esc_attr_e( 'Custom Content Type', 'jetpack' ) ?>" width="300" height="150" />
	</div>

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
	echo '<a class="button-secondary more-info-link" href="http://jetpack.com/support/site-icon" target="_blank">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_site-icon', 'jetpack_site_icon_more_link' );

function jetpack_custom_site_icon() { ?>

	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/site-icon.png' ) ?>" alt="<?php esc_attr_e( 'Site Icon', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<p><?php esc_html_e( 'Site Icon lets you create an icon for your site. This icon will be used as favicon, mobile icon, and Tile on Windows 8 computers.', 'jetpack' ); ?></p>
	<p><?php printf( __( 'To add a new icon to your site, head over to <a href="%s">Settings &rarr; General &rarr; Site Icon</a>, and upload an icon.', 'jetpack' ), admin_url( 'options-general.php#site-icon' ) ); ?></p>

<?php
}
add_action( 'jetpack_module_more_info_site-icon', 'jetpack_custom_site_icon' );

/**
 * Manage
 */
function jetpack_manage_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://jetpack.com/support/site-management/" target="_blank">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_manage', 'jetpack_manage_more_link' );

function jetpack_custom_jetpack_manage() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/images/screenshots/manage.jpg' ) ?>" alt="<?php esc_attr_e( 'Manage all of your WordPress sites, self-hosted or not, from WordPress.com', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<?php esc_html_e(
		'Manage and update this and other WordPress sites from one simple dashboard on WordPress.com. You can update
		plugins, set them to automatically update, and (de)activate them on a per-site basis or in bulk from
		wordpress.com/plugins. You can also use the brand new and mobile-friendly post editor on WordPress.com as well
		as view and activate installed themes and create or edit site menus.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_manage', 'jetpack_custom_jetpack_manage' );

// XML Sitemap: START
function jetpack_xml_sitemap_more_info() {
	esc_html_e(
		'Search engines like Google and Bing use sitemaps to crawl and understand your site making
		it more likely for your content to show up on relevant searches. This feature creates two
		sitemap files that list the URLs of posts and pages in your site with important information about each one.'
		, 'jetpack' );
}
add_action( 'jetpack_module_more_info_sitemaps', 'jetpack_xml_sitemap_more_info' );
// XML Sitemap: STOP
