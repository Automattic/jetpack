<?php
/**
 * "Learn More" information blocks for all modules live in this file.
 *
 * jetpack_module_more_info_<module-slug> hooks are for pre-connection information
 * jetpack_module_more_info_connected_<module-slug> hooks are used once the user
 * 		is connected to show them links to admin panels, usage info etc.
 */

// VaultPress (stub)

function vaultpress_jetpack_more_info() {
	if ( function_exists( 'is_multisite' ) && is_multisite() ) {
		$vaultpress_url = 'http://vaultpress.com/jetpack-ms/';
	} else {
		$vaultpress_url = 'http://vaultpress.com/jetpack/';
	}
	?>

	<div class="jp-info-img">
		<a href="<?php echo $vaultpress_url?>">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/vaultpress.png' ) ?>" alt="<?php esc_attr_e( 'VaultPress', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'VaultPress', 'jetpack' ) ?></h4>
<?php	if ( class_exists( 'VaultPress' ) || function_exists( 'vaultpress_contact_service' ) ) : ?>
	<p><?php esc_html_e( 'Your WordPress installation is currently being protected with the world&#8217;s best security, backup, and support.', 'jetpack' ); ?></p>
	<p><?php printf( _x( 'To check your backups, see any security alerts, or check your VaultPress Vitality, visit your %s.', 'Visit your _VaultPress_dashboard_.', 'jetpack' ), '<a href="https://dashboard.vaultpress.com/">' . esc_html__( 'VaultPress dashboard', 'jetpack' ) . '</a>' ); ?></a></p>
<?php	else : ?>
	<p><?php esc_html_e( 'With a monthly subscription, the VaultPress plugin will backup your site&#8217;s content, themes, and plugins in real-time, as well as perform regular security scans for common threats and attacks.', 'jetpack' ); ?></p>
	<p><?php printf( _x( 'View %s.', 'View _Plans_&_Pricing_. (VaultPress)', 'jetpack' ), '<a href="' . $vaultpress_url . '">' . esc_html__( 'Plans & Pricing', 'jetpack' ) . '</a>' ); ?></a></p>
<?php	endif;
}
add_action( 'jetpack_module_more_info_vaultpress', 'vaultpress_jetpack_more_info' );
add_action( 'jetpack_module_more_info_connected_vaultpress', 'vaultpress_jetpack_more_info' );

function vaultpress_jetpack_load_more_link() {
	if ( function_exists( 'is_multisite' ) && is_multisite() ) {
		$vaultpress_url = 'http://vaultpress.com/jetpack-ms/';
	} else {
		$vaultpress_url = 'http://vaultpress.com/jetpack/';
	}

	echo '<a class="button-secondary more-info-link" href="' . $vaultpress_url . '">' . __( "Learn More", 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_vaultpress', 'vaultpress_jetpack_load_more_link' );

// Gravatar Hovercards
function grofiles_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://blog.gravatar.com/2010/10/06/gravatar-hovercards-on-wordpress-com/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/hovercards.png' ) ?>" alt="<?php esc_attr_e( 'Gravatar Hovercard', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Gravatar Hovercards', 'jetpack' ) ?></h4>
	<h5><?php esc_html_e( "What&#8217;s a Hovercard?", 'jetpack' ) ?></h5>
	<p><?php esc_html_e( 'Hovercards enhance plain Gravatar images with information about a person: name, bio, pictures, their contact info, and other services they use on the web like Twitter, Facebook, or LinkedIn.', 'jetpack' ); ?></p>
	<p><?php esc_html_e( 'Hovercards offer a great way to show your internet presence and help people find your own blog.', 'jetpack' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_gravatar-hovercards', 'grofiles_more_info' );

function grofiles_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://blog.gravatar.com/2010/10/06/gravatar-hovercards-on-wordpress-com/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/hovercards.png' ) ?>" alt="<?php esc_attr_e( 'Gravatar Hovercard', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Gravatar Hovercards', 'jetpack' ) ?></h4>
	<h5><?php esc_html_e( "What&#8217;s a Hovercard?", 'jetpack' ) ?></h5>
	<p><?php esc_html_e( 'Hovercards enhance plain Gravatar images with information about a person: name, bio, pictures, their contact info, and other services.', 'jetpack' ); ?></p>
	<p><?php esc_html_e( 'To see hovercards, look at any blog post on your blog that has comments. If the commenter has a hovercard associated with their gravatar, mouse over their image and the hovercard will appear. To turn hovercards off, click the Deactivate button above.', 'jetpack' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_gravatar-hovercards', 'grofiles_more_info_connected' );

function grofiles_load_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://blog.gravatar.com/2010/10/06/gravatar-hovercards-on-wordpress-com/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_gravatar-hovercards', 'grofiles_load_more_link' );


// Shortcodes
function jetpack_shortcodes_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/shortcodes/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/shortcodes.png' ) ?>" alt="<?php esc_attr_e( 'Shortcode Embeds', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Shortcode Embeds', 'jetpack' ) ?></h4>
	<p><?php esc_html_e( 'Shortcodes allow you to easily and safely embed media from other places in your site. With just one simple code, you can tell WordPress to embed YouTube, Flickr, and other media.', 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_shortcodes', 'jetpack_shortcodes_more_info' );

function jetpack_shortcodes_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/shortcodes/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/shortcodes.png' ) ?>" alt="<?php esc_attr_e( 'Shortcode Embeds', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Shortcode Embeds', 'jetpack' ) ?></h4>
	<p><?php esc_html_e( 'Shortcodes allow you to easily and safely embed media from other places in your site. With just one simple code, you can tell WordPress to embed YouTube, Flickr, and other media.', 'jetpack' ) ?></p>
	<p><?php esc_html_e( 'Enter a shortcode directly into the Post/Page editor to embed media. For specific instructions follow the links below.', 'jetpack' ) ?></p>
	<?php
	$codes = array( 'archives' => 'http://support.wordpress.com/archives-shortcode/',
		'audio' => 'http://support.wordpress.com/audio/',
		'bandcamp' => 'http://en.support.wordpress.com/audio/bandcamp/',
		'blip.tv' => 'http://support.wordpress.com/videos/bliptv/',
		'dailymotion' => 'http://support.wordpress.com/videos/dailymotion/',
		'facebook' => 'http://en.support.wordpress.com/facebook-integration/facebook-embeds/',
		'flickr' => 'http://support.wordpress.com/videos/flickr-video/',
		'googlemaps' => 'http://support.wordpress.com/google-maps/',
		'jetpack_subscription_form' => 'http://jetpack.me/support/subscriptions/#display',
		'polldaddy' => 'http://support.polldaddy.com/wordpress-shortcodes/',
		'presentation' => 'http://en.support.wordpress.com/presentations/',
		'scribd' => 'http://support.wordpress.com/scribd/',
		'slideshare' => 'http://support.wordpress.com/slideshows/slideshare/',
		'slideshow' => 'http://en.support.wordpress.com/slideshows/',
		'soundcloud' => 'http://support.wordpress.com/audio/soundcloud-audio-player/',
		'ted' => 'http://en.support.wordpress.com/videos/ted-talks/',
		'twitter-timeline' => 'http://en.support.wordpress.com/widgets/twitter-timeline-widget/#embedding-with-a-shortcode',
		'upcomingevents' => 'http://en.support.wordpress.com/widgets/upcoming-events/#events-list-shortcode',
		'vimeo' => 'http://support.wordpress.com/videos/vimeo/',
		'vine' => 'http://en.support.wordpress.com/videos/vine/',
		'youtube' => 'http://support.wordpress.com/videos/youtube/',
	);

	$codes['wpvideo (VideoPress)'] = 'http://en.support.wordpress.com/videopress/';

	$available = '';
	foreach ( $codes as $code => $url ) {
		$available[] = '<a href="' . $url . '" target="_blank">[' . $code . ']</a>';

	}
	?>
	<p><?php echo wp_sprintf( esc_html__( 'Available shortcodes are: %l.', 'jetpack' ), $available ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_shortcodes', 'jetpack_shortcodes_more_info_connected' );

function jetpack_shortcodes_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/shortcodes/">' . esc_html__( 'Learn More' , 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_shortcodes', 'jetpack_shortcodes_load_more_link' );


// Shortlinks
function wpme_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://wp.me/sf2B5-shorten">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/shortlinks.png' ) ?>" alt="<?php esc_attr_e( 'WP.me Shortlinks', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'WP.me Shortlinks' , 'jetpack' ); ?></h4>
	<p><?php esc_html_e( "Instead of typing or copy-pasting long URLs, you can now get a short and simple link to your posts and pages. This uses the super compact wp.me domain name, and gives you a unique URL you can use that will be safe and reliable.", 'jetpack' ) ?></p>
	<p><?php esc_html_e( "It&#8217;s perfect for use on Twitter, Facebook, and cell phone text messages where every character counts.", 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_shortlinks', 'wpme_more_info' );

function wpme_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://wp.me/sf2B5-shorten">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/shortlinks.png' ) ?>" alt="<?php esc_attr_e( 'WP.me Shortlinks', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'WP.me Shortlinks' , 'jetpack' ); ?></h4>
	<p><?php esc_html_e( "Instead of typing or copy-pasting long URLs, you can now get a short and simple link to your posts and pages. This uses the super compact wp.me domain name, and gives you a unique URL you can use that will be safe and reliable.", 'jetpack' ) ?></p>
	<p><?php esc_html_e( "To use shortlinks, go to any already published post (or publish something new!). A &#8220;Get Shortlink&#8221; button will be visible under the Post title. When you click it, a dialog box will appear with the shortlink and you can copy and paste to Twitter, Facebook or wherever your heart desires.", 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_shortlinks', 'wpme_more_info_connected' );

function wpme_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://wp.me/sf2B5-shorten">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_shortlinks', 'wpme_load_more_link' );


// WordPress.com Stats
function stats_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/stats/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/stats.png' ) ?>" alt="<?php esc_attr_e( 'WordPress.com Stats', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'WordPress.com Stats' , 'jetpack' ); ?></h4>
	<p><?php esc_html_e( 'There are many plugins and services that provide statistics, but data can be overwhelming. WordPress.com Stats makes the most popular metrics easy to understand through a clear and attractive interface.', 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_stats', 'stats_more_info' );

function stats_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/stats/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/stats.png' ) ?>" alt="<?php esc_attr_e( 'WordPress.com Stats', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'WordPress.com Stats' , 'jetpack' ); ?></h4>
	<p><?php esc_html_e( 'There are many plugins and services that provide statistics, but data can be overwhelming. WordPress.com Stats makes the most popular metrics easy to understand through a clear and attractive interface.', 'jetpack' ) ?></p>
	<p><?php printf( __( 'You can <a href="%s">view your stats dashboard here</a>.', 'jetpack' ), admin_url( 'admin.php?page=stats' ) ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_stats', 'stats_more_info_connected' );

function stats_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/stats/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_stats', 'stats_load_more_link' );

// Publicize
function publicize_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/publicize/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/publicize.png' ) ?>" alt="<?php esc_attr_e( 'Publicize', 'jetpack' ) ?>" width="328" height="123" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Publicize' , 'jetpack' ); ?></h4>
	<p><?php esc_html_e( 'Publicize allows you to connect your blog to popular social networking sites and automatically share new posts with your friends.	 You can make a connection for just yourself or for all users on your blog.', 'jetpack' ) ?></p>
	<p><?php esc_html_e( 'Publicize allows you to share your posts on Facebook, Twitter, Tumblr, Yahoo!, and Linkedin.', 'jetpack' ); ?></p>

<?php	if ( 'jetpack_module_more_info_connected_publicize' == current_filter() ) : ?>

	<p><?php printf( __( 'Manage your <a href="%s">Publicize settings</a>.', 'jetpack' ), menu_page_url( 'sharing', false ) ); ?>

<?php	endif; ?>

	<p>&rarr; <a href="http://jetpack.me/support/publicize/"><?php esc_html_e( 'More information on using Publicize.', 'jetpack' ); ?></a></p>
<?php
}

add_action( 'jetpack_module_more_info_publicize', 'publicize_more_info' );
add_action( 'jetpack_module_more_info_connected_publicize', 'publicize_more_info' );

function publicize_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://jetpack.me/support/publicize/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_publicize', 'publicize_load_more_link' );

// Notifications
function notes_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://support.wordpress.com/notifications/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/notes.png' ) ?>" alt="<?php esc_attr_e( 'Notifications', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Notifications' , 'jetpack' ); ?></h4>
	<p><?php esc_html_e( 'Keep up with the latest happenings on all your WordPress sites and interact with other WordPress.com users.', 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_notes', 'notes_more_info' );

function notes_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://support.wordpress.com/notifications/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/notes.png' ) ?>" alt="<?php esc_attr_e( 'Notifications', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Notifications' , 'jetpack' ); ?></h4>
	<p><?php esc_html_e( 'Keep up with the latest happenings on all your WordPress sites and interact with other WordPress.com users.', 'jetpack' ) ?></p>
	<p><?php printf( __( 'You can view your notifications in the Toolbar and <a href="%s">on WordPress.com</a>.', 'jetpack' ), 'http://wordpress.com/#!/notifications/' ); ?></p>
<?php
}
add_filter( 'jetpack_module_more_info_connected_notes', 'notes_more_info_connected' );

function notes_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://support.wordpress.com/notifications/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_notes', 'notes_load_more_link' );


// LaTeX
function latex_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://support.wordpress.com/latex/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/beautifulmath.png' ) ?>" alt="<?php esc_attr_e( 'LaTeX', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><img src="//s0.wp.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -27%" /> Makes Beautiful Math</h4>
	<p><?php printf( esc_html__( '%s is a powerful markup language for writing complex mathematical equations, formulas, etc.', 'jetpack' ), '<a href="http://www.latex-project.org/" target="_blank"><img src="//s0.wp.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" /></a>' ); ?></p>
	<p><?php printf( esc_html__( 'Jetpack combines the power of %s and the simplicity of WordPress to give you the ultimate in math blogging platforms.', 'jetpack' ), '<img src="//s0.wp.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" />' ); ?></p>
	<p><?php esc_html_e( 'Wow, that sounds nerdy.', 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_latex', 'latex_more_info' );

function latex_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://support.wordpress.com/latex/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/beautifulmath.png' ) ?>" alt="<?php esc_attr_e( 'LaTeX', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><img src="//s0.wp.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -27%;" /> Makes Beautiful Math</h4>
	<p><?php printf( esc_html__( '%s is a powerful markup language for writing complex mathematical equations, formulas, etc.', 'jetpack' ), '<a href="http://www.latex-project.org/" target="_blank"><img src="//s0.wp.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" /></a>' ); ?></p>
	<p><?php printf( __( 'Use <code>$latex your latex code here$</code> or <code>[latex]your latex code here[/latex]</code> to include %s in your posts and comments. There are <a href="%s" target="_blank">all sorts of options</a> available.', 'jetpack' ), '<img src="//s0.wp.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" />', 'http://support.wordpress.com/latex/' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_latex', 'latex_more_info_connected' );

function latex_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://support.wordpress.com/latex/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_latex', 'latex_load_more_link' );


// Sharedaddy
function sharedaddy_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/sharing/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/sharing.png' ) ?>" alt="<?php esc_attr_e( 'Sharing', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>
	<h4><?php esc_html_e( 'Sharing' , 'jetpack' ); ?></h4>
	<p><?php esc_html_e( 'Share your posts with Twitter, Facebook, and a host of other services. You can configure services to appear as icons, text, or both. Some services have additional options to display smart buttons, such as Twitter, which will update the number of times the post has been shared.', 'jetpack' ); ?></p>

	<p><?php
		if ( is_multisite() ) {
			esc_html_e( 'The following services are included: Twitter, Facebook, Reddit, StumbleUpon, PressThis, Digg, LinkedIn, Google +1, Print, and Email.' , 'jetpack' );
		} else {
			esc_html_e( 'The following services are included: Twitter, Facebook, Reddit, StumbleUpon, Digg, LinkedIn, Google +1, Print, and Email.' , 'jetpack' );
		}
	?></p>

	<p><?php esc_html_e( 'Additionally you can define your own custom services.', 'jetpack' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_sharedaddy', 'sharedaddy_more_info' );

function sharedaddy_more_info_connected() { ?>
	<div class="jp-info-img">
		<embed type="application/x-shockwave-flash" src="http://s0.videopress.com/player.swf?v=1.02" height="190" wmode="transparent" seamlesstabbing="true" allowfullscreen="true" allowscriptaccess="always" overstretch="true" flashvars="guid=WV0JOwY2"></embed>
	</div>

	<h4><?php esc_html_e( 'Sharing' , 'jetpack' ); ?></h4>
	<?php
	if ( class_exists( 'Sharing_Admin' ) ) {
		?>

		<p><?php printf( __( 'To configure your sharing settings, go to the Settings &rarr; <a href="%s">Sharing</a> menu.', 'jetpack' ), 'options-general.php?page=sharing' ); ?></p>
		<p><?php esc_html_e( 'Drag and drop sharing services into the enabled section to have them show up on your site, and drag them into the hidden section to have them hidden behind a button.', 'jetpack' ); ?>

		<?php
	}
	?>

	<p><?php printf( __( 'Full details can be found on the <a href="%s">Sharing support page</a>. This video also gives a swish run-down of how to use the Sharing feature. Watch it in HD for extra snazz!', 'jetpack' ), 'http://support.wordpress.com/sharing/' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_sharedaddy', 'sharedaddy_more_info_connected' );

function sharedaddy_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://support.wordpress.com/sharing/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_sharedaddy', 'sharedaddy_load_more_link' );


// After The Deadline
function jpatd_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/proofreading/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/spelling.png' ) ?>" alt="<?php esc_attr_e( 'Spelling and Grammar', 'jetpack' ) ?>" width="300" height="150" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Spelling and Grammar' , 'jetpack' ); ?></h4>

	<p><?php printf( __( "The <a href='%s'>After&nbsp;the&nbsp;Deadline</a> Proofreading service improves your writing by using artificial intelligence to find your errors and offer smart suggestions.", 'jetpack' ), 'http://www.afterthedeadline.com/' ); ?></p>
	<p><?php printf( __( 'After the Deadline provides a number of <a href="%s">customization options</a>, which you can edit in your profile.', 'jetpack' ), esc_url( get_edit_profile_url( get_current_user_id() ) ) . '#atd' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_after-the-deadline', 'jpatd_more_info' );

function jpatd_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/proofreading/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_after-the-deadline', 'jpatd_load_more_link' );


// RSS Links Widget, Image Widget, Twitter Widget
function jetpack_widgets_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/widgets.png' ) ?>" alt="<?php esc_attr_e( 'Widgets Screenshot', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<h4><?php esc_html_e( 'Extra Sidebar Widgets' , 'jetpack' ); ?></h4>

	<p><strong><?php esc_html_e( 'The RSS Links Widget ', 'jetpack' ); ?></strong> <?php esc_html_e( "allows you to add links to your blog&#8217;s post and comment RSS feeds in your sidebar. This makes it easy for your readers to stay updated when you post new content or receive new comments.", 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Twitter Widget ', 'jetpack' ); ?></strong> <?php esc_html_e( "shows your latest tweets within a sidebar on your theme. It&#8217;s an easy way to add more activity to your site. There are also a number of customization options.", 'jetpack' ) ?> <strong><?php esc_html_e( 'The Facebook Like Box Widget ', 'jetpack' ); ?></strong> <?php esc_html_e( "shows your Facebook Like Box within a sidebar on your theme. It&#8217;s a great way to let your readers show their support.", 'jetpack' ) ?> <strong><?php esc_html_e( 'The Image Widget ', 'jetpack' ); ?></strong><?php esc_html_e( "allows you to easily add images to widget areas in your theme. It&#8217;s an easy way to add more visual interest to your site.", 'jetpack' ) ?></p>

<?php
}
add_action( 'jetpack_module_more_info_widgets', 'jetpack_widgets_more_info' );

function jetpack_widgets_more_info_connected() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/widgets.png' ) ?>" alt="<?php esc_attr_e( 'Widgets Screenshot', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<h4><?php esc_html_e( 'Extra Sidebar Widgets' , 'jetpack' ); ?></h4>

	<p><strong><?php esc_html_e( 'The RSS Links Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'lets you easily add post and comment RSS feeds to a sidebar on your theme.', 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Twitter Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'shows your latest tweets within a sidebar on your theme.', 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Facebook Like Box Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'shows your Facebook Like Box within a sidebar on your theme.', 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Image Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'lets you easily add images to a sidebar on your theme.', 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Gravatar Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'allows you to pull in your Gravatar image along with some of your Gravatar profile data.', 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Gallery Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'provides you with a simple way to display a photo gallery or slideshow in your blog’s sidebar.', 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Display WordPress Posts Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'lets you display up to ten recent posts from another WordPress.com blog, or a self-hosted WordPress site with Jetpack enabled.', 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Readmill Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'allows your readers to send a book to their device with one click.', 'jetpack' ) ?></p>
	<!--<p><strong><?php esc_html_e( 'The Upcoming Events Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'allows you to use an iCalendar link to display a list of events on your site.', 'jetpack' ) ?></p>-->

	<p><?php esc_html_e( 'Each of these widgets has a number of customization options.', 'jetpack' ); ?>  <?php printf( __( 'To use the widgets, go to Appearance &#8594; <a href="%s">Widgets</a>. Drag them into one of your sidebars and configure away.', 'jetpack' ), admin_url( 'widgets.php' ) ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_widgets', 'jetpack_widgets_more_info_connected' );

function jetpack_widgets_load_more_link( $description ) {
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/widgets/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_widgets', 'jetpack_widgets_load_more_link' );

// Subscriptions
function jetpack_subscriptions_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/subscriptions.png' ) ?>" alt="<?php esc_attr_e( 'Subsriptions Screenshot', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<h4><?php esc_html_e( 'Subscriptions' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'Easily allow any visitor to subscribe to all of your posts via email through a widget in your blog&#8217;s sidebar.  Every time you publish a post, WordPress.com will send a notification to all your subscribers.', 'jetpack' ); ?></p>
	<p><?php esc_html_e( 'When leaving comments, your visitors can also subscribe to a post&#8217;s comments to keep up with the conversation.', 'jetpack' ); ?></p>

<?php

	if ( 'jetpack_module_more_info_connected_subscriptions' == current_filter() )
		printf( '<p>' . __( 'To use the Subscriptions widget, go to Appearance &#8594; <a href="%s">Widgets</a>. Drag the widget labeled &#8220;Blog Subscriptions (Jetpack)&#8221; into one of your sidebars and configure away.', 'jetpack' ) . '</p>', admin_url( 'widgets.php' ) );
		printf( '<p>' . __( 'You can also make changes to your Subscription settings at the bottom of the <a href="%s">Discussion Settings</a> page.', 'jetpack' ) . '</p>', admin_url( 'options-discussion.php#jetpack-subscriptions-settings' ) );
		printf( '<p>' . __( 'To customize the emails sent from your blog to your followers, check the settings at the bottom of the <a href="%s">Reading Settings</a> page.', 'jetpack' ) . '</p>', admin_url( 'options-reading.php#follower-settings' ) );
}
add_action( 'jetpack_module_more_info_subscriptions', 'jetpack_subscriptions_more_info' );
add_action( 'jetpack_module_more_info_connected_subscriptions', 'jetpack_subscriptions_more_info' );

function jetpack_subscriptions_load_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/following/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_subscriptions', 'jetpack_subscriptions_load_more_link' );

// Enhanced Distribution

function jetpack_enhanced_distribution_more_info() { ?>
	<h4><?php esc_html_e( 'Enhanced Distribution' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'Jetpack will automatically take the great published content from your blog or website and share it instantly with third party services like search engines, increasing your reach and traffic.', 'jetpack' ); ?></p>

<?php
}

add_action( 'jetpack_module_more_info_enhanced-distribution', 'jetpack_enhanced_distribution_more_info' );
add_action( 'jetpack_module_more_info_connected_enhanced-distribution', 'jetpack_enhanced_distribution_more_info' );

function jetpack_enhanced_distribution_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://en.wordpress.com/firehose/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_enhanced-distribution', 'jetpack_enhanced_distribution_more_link' );

// JSON API
function jetpack_json_api_more_info() { ?>
	<h4><?php esc_html_e( 'JSON API' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'Jetpack will allow you to authorize applications and services to securely connect to your blog and allow them to use your content in new ways and offer you new functionality.', 'jetpack' ); ?>

	<p><?php _e( "Developers can use WordPress.com's <a href='http://developer.wordpress.com/docs/oauth2/'>OAuth2</a> authentication system and <a href='http://developer.wordpress.com/docs/api/'>WordPress.com REST API</a> to manage and access your site's content.", 'jetpack' ); ?></p>

<?php
}

add_action( 'jetpack_module_more_info_json-api', 'jetpack_json_api_more_info' );
add_action( 'jetpack_module_more_info_connected_json-api', 'jetpack_json_api_more_info' );

function jetpack_json_api_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://jetpack.me/support/json-api/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_json-api', 'jetpack_json_api_more_link' );

// Contact Form: START
function jetpack_contact_form_learn_more_button() {
    echo '<a class="button-secondary more-info-link" href="http://support.wordpress.com/contact-form/">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

function jetpack_contact_form_more_info() {
    echo '<div class="jp-info-img">';
    echo '<a href="http://support.wordpress.com/contact-form/">';
    echo '<img class="jp-info-img" src="' . plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/contactform.png' ) . '" alt="' . esc_attr__( 'Contact Form', 'jetpack' ) . '" width="300" height="150" />';
    echo '</a>';
    echo '</div>';

    echo '<h4>' . esc_html__( 'Contact Form', 'jetpack' ) . '</h4>';

    echo '<p>';
    _e( 'A contact form is a great way to offer your readers the ability to get in touch, without giving out your personal email address.', 'jetpack' );
    echo '</p>';

    echo '<p>';    _e( 'Each contact form can easily be customized to fit your needs. When a user submits your contact form, the feedback will be filtered through <a href="http://akismet.com/">Akismet</a> (if it is active on your site) to make sure it’s not spam. Any legitimate feedback will then be emailed to you, and added to your feedback management area.', 'jetpack' );
    echo '</p>';
}

add_action( 'jetpack_learn_more_button_contact-form', 'jetpack_contact_form_learn_more_button' );
add_action( 'jetpack_module_more_info_contact-form', 'jetpack_contact_form_more_info' );
add_action( 'jetpack_module_more_info_connected_contact-form', 'jetpack_contact_form_more_info' );
// Contact Form: STOP

// Jetpack Comments: START
function jetpack_comments_learn_more_button() {
    echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

function jetpack_comments_more_info() {
?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/comments.png' ) ?>" alt="<?php esc_attr_e( 'Jetpack Comments Screenshot', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<h4><?php esc_html_e( 'Jetpack Comments', 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'Jetpack Comments enables your visitors to use their WordPress.com, Twitter, or Facebook accounts when commenting on your site.', 'jetpack' ); ?></p>

<?php	if ( 'jetpack_module_more_info_connected_comments' == current_filter() ) : ?>

	<p><?php printf(
		__( "Jetpack tries to match your site's color scheme automatically, but you can make manual adjustments at the bottom of the <a href='%s'>Discussion Settings</a> page.", 'jetpack' ),
		admin_url( 'options-discussion.php#jetpack-comments-settings' )
	); ?></p>

<?php	endif; ?>
<?php
}

add_action( 'jetpack_learn_more_button_comments', 'jetpack_comments_learn_more_button' );
add_action( 'jetpack_module_more_info_comments', 'jetpack_comments_more_info' );
add_action( 'jetpack_module_more_info_connected_comments', 'jetpack_comments_more_info' );
// Jetpack Comments: STOP

// Gallery Carousel: START
function jetpack_carousel_learn_more_button() {
    echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

function jetpack_carousel_more_info() {
?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/carousel.png' ) ?>" alt="<?php esc_attr_e( 'Gallery Carousel Screenshot', 'jetpack' ) ?>" width="300" height="188" />
	</div>

	<h4><?php esc_html_e( 'Carousel', 'jetpack' ); ?></h4>

    <p><?php esc_html_e( 'With Carousel active, any standard WordPress galleries you have embedded in posts or pages will launch a gorgeous full-screen photo browsing experience with comments and EXIF metadata.', 'jetpack' ); ?></p>
<?php
}

add_action( 'jetpack_learn_more_button_carousel', 'jetpack_carousel_learn_more_button' );
add_action( 'jetpack_module_more_info_carousel', 'jetpack_carousel_more_info' );
add_action( 'jetpack_module_more_info_connected_carousel', 'jetpack_carousel_more_info' );
// Gallery Carousel: STOP

// Custom CSS: START
function jetpack_custom_css_more_info() {
	?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/custom-css.png' ) ?>" alt="<?php esc_attr_e( 'Custom CSS', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<h4><?php esc_html_e( 'Custom CSS', 'jetpack' ); ?></h4>
	<p><?php esc_html_e( "The Custom CSS editor gives you the ability to add to or replace your theme's CSS, all while supplying syntax coloring, auto-indentation, and immediate feedback on the validity of the CSS you're writing.", 'jetpack' ); ?></p>
	<p><?php printf( __( 'To use the CSS editor, go to Appearance &#8594; <a href="%s">Edit CSS</a>.', 'jetpack' ), admin_url( 'themes.php?page=editcss' ) ); ?></p>

	<?php
}

function jetpack_custom_css_more_button() {
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

add_action( 'jetpack_learn_more_button_custom-css', 'jetpack_custom_css_more_button' );
add_action( 'jetpack_module_more_info_custom-css', 'jetpack_custom_css_more_info' );
// Custom CSS: STOP

// Minileven: START
function jetpack_minileven_more_info() {
	?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/mobile-theme.png' ) ?>" alt="<?php esc_attr_e( 'Mobile Theme', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<h4><?php esc_html_e( 'Mobile Theme', 'jetpack' ); ?></h4>
	<p><?php esc_html_e( "There's a good chance that visitors to your site will be using a smartphone, and it's important to provide them with a great reading experience while on the small screen.", 'jetpack' ); ?></p>
	<p><?php esc_html_e( "Jetpack's mobile theme is optimized for small screens. It uses the header image, background, and widgets from your current theme for a great custom look. Post format support is included, so your photos and galleries will look fantastic on a smartphone.", 'jetpack' ); ?></p>
	<p><?php esc_html_e( 'Visitors on iPhone, Android, Windows Phone, and other mobile devices will automatically see the mobile theme, with the option to view the full site. You can enable or disable the mobile theme by clicking the "Activate" or "Deactive" button above.', 'jetpack' ); ?></p>
	<?php
}

function jetpack_minileven_more_button() {
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

add_action( 'jetpack_learn_more_button_minileven', 'jetpack_minileven_more_button' );
add_action( 'jetpack_module_more_info_minileven', 'jetpack_minileven_more_info' );
// Minileven: STOP

// Infinite Scroll: START
/**
 *
 */
function jetpack_infinite_scroll_more_info() {
	$support_text = sprintf( __( 'If you are a theme author, you can learn about adding support for Infinite Scroll at <a href="%1$s">%1$s</a>.', 'jetpack' ), 'http://jetpack.me/support/infinite-scroll/' );

	?>
	<h4><?php esc_html_e( 'Infinite Scroll', 'jetpack' ); ?></h4>

	<?php if ( ! Jetpack::is_active() || ( Jetpack::is_active() && current_theme_supports( 'infinite-scroll' ) ) ) : ?>
		<p><?php esc_html_e( 'When you write great content, all you really want is people to find it, right?', 'jetpack' ); ?></p>

		<p><?php esc_html_e( "With the Infinite Scroll module and a supported theme, that's exactly what happens. Instead of the old way of navigating down a page by scrolling and then clicking a link to get to the next page, waiting for a page refresh&mdash;the document model of the web&mdash;infinite scrolling pulls the next set of posts automatically into view when the reader approaches the bottom of the page, more like an application.", 'jetpack' ); ?></p>

	<?php else : ?>
		<p><?php echo esc_html( sprintf( __( "At this time, your theme, %s, doesn't support Infinite Scroll. Unlike other Jetpack modules, Infinite Scroll needs information from your theme to function properly.", 'jetpack' ), ( function_exists( 'wp_get_theme' ) ? wp_get_theme()->Name : get_current_theme() ) ) ); ?></p>

		<p><?php esc_html_e( "Until your theme supports Infinite Scroll, you won't be able to activate this module.", 'jetpack' ); ?></p>

		<?php

		if ( current_user_can( 'update_themes' ) ) :
			ob_start();
			theme_update_available( function_exists( 'wp_get_theme' ) ? wp_get_theme() : (object) get_theme( get_current_theme() ) );
			$theme_update_available = ob_get_clean();

			if ( ! empty( $theme_update_available ) ) : ?>
				<p><?php printf( __( 'There is an update available for your theme. You may wish to check if this update adds Infinite Scroll support by visiting the <a href="%s">WordPress Updates</a> page.', 'jetpack' ), esc_url( admin_url( 'update-core.php' ) ) ); ?></p>
			<?php else : ?>
				<p><?php echo $support_text; ?></p>
			<?php endif; ?>
		<?php else : ?>
			<p><?php echo $support_text; ?></p>
		<?php endif; ?>
	<?php endif;
}
add_action( 'jetpack_module_more_info_infinite-scroll', 'jetpack_infinite_scroll_more_info' );

/**
 *
 */
function jetpack_infinite_scroll_more_button() {
	echo '<a class="button more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_infinite-scroll', 'jetpack_infinite_scroll_more_button' );
// Infinite Scroll: STOP


// Post by Email: START
function jetpack_post_by_email_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/post-by-email.png' ) ?>" alt="<?php esc_attr_e( 'Post by Email', 'jetpack' ) ?>" width="300" height="115" />
	</div>

	<h4><?php esc_html_e( 'Post by Email' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'Post by Email is a way of publishing posts on your blog by email. Any email client can be used to send the email, allowing you to publish quickly and easily from devices such as cell phones.', 'jetpack' ); ?></p>

<?php if ( 'jetpack_module_more_info_connected_post-by-email' == current_filter() ) : ?>

	<p><?php printf( __( 'Manage your Post By Email address from your <a href="%s">profile settings</a>.', 'jetpack' ), esc_url( get_edit_profile_url( get_current_user_id() ) . '#post-by-email' ) ); ?>

<?php endif; ?>

	<p>&rarr; <a href="http://jetpack.me/support/post-by-email/"><?php esc_html_e( 'More information on sending emails, attachments, and customizing your posts.', 'jetpack' ); ?></a></p>

<?php
}

function jetpack_post_by_email_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://jetpack.me/support/post-by-email/">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

add_action( 'jetpack_module_more_info_post-by-email', 'jetpack_post_by_email_more_info' );
add_action( 'jetpack_module_more_info_connected_post-by-email', 'jetpack_post_by_email_more_info' );
add_action( 'jetpack_learn_more_button_post-by-email', 'jetpack_post_by_email_more_link' );
// Post by Email: STOP


// Photon: START
/**
 *
 */
function jetpack_photon_more_info() { ?>
	<h4><?php esc_html_e( 'Photon' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( "Give your site a boost by loading images in posts from the WordPress.com content delivery network. We cache your images and serve them from our super-fast network, reducing the burden on your Web host with the click of a button.", 'jetpack' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_photon', 'jetpack_photon_more_info' );

/**
 * Display "Learn More" button for Photon module
 * @uses __
 * @action jetpack_learn_more_button_photon
 * @return string
 */
function jetpack_photon_more_link() {
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_photon', 'jetpack_photon_more_link' );
// Photon: STOP

// Tiled Galleries: START
function jetpack_tiled_gallery_more_info() { ?>
	<h4><?php esc_html_e( 'Tiled Galleries' , 'jetpack' ); ?></h4>

	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/tiled-gallery.png' ) ?>" alt="<?php esc_attr_e( 'Tiled Galleries', 'jetpack' ) ?>" width="300" height="150" />
	</div>

	<p><?php esc_html_e( 'Create elegant magazine-style mosaic layouts for your photos without having to use an external graphic editor.', 'jetpack' ); ?></p>
	<p><?php printf( __( 'When adding a gallery to your post, you now have the option to select a layout style for your images. We\'ve added support for Rectangular, Square, and Circular galleries. By default, galleries will continue to display using the standard thumbnail grid layout. To make the rectangular layout the default for all of your site\'s galleries, head over to <a href="%s">Settings &rarr; Media</a> and check the box next to "Display all your gallery pictures in a cool mosaic."', 'jetpack' ), admin_url( 'options-media.php' ) ); ?></p>
	<p><em><?php esc_html_e( 'Note: Images in tiled galleries require extra-special processing, so they will be served from WordPress.com\'s CDN even if the Photon module is disabled.', 'jetpack' ); ?></em></p>
<?php
}
add_action( 'jetpack_module_more_info_tiled-gallery', 'jetpack_tiled_gallery_more_info' );

function jetpack_tiled_gallery_more_link() {
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_tiled-gallery', 'jetpack_tiled_gallery_more_link' );
// Tiled Galleries: STOP

// Likes: START
function jetpack_likes_more_info() { ?>

	<div class="jp-info-img">
		<a href="http://jetpack.me/support/likes/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/likes.png' ) ?>" alt="<?php esc_attr_e( 'Likes', 'jetpack' ) ?>" width="323" height="69" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Likes' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'Likes allow your readers to show their appreciation for your posts and other published content using their WordPress.com accounts. Your readers will then be able to review their liked posts from WordPress.com.', 'jetpack' ) ?></p>
	<p><?php esc_html_e( 'Displayed below your posts will be how many people have liked your posts and the Gravatars of those who have liked them.', 'jetpack' ); ?></p>

	<p>&rarr; <a href="http://jetpack.me/support/likes/"><?php esc_html_e( 'More information on using Likes.', 'jetpack' ); ?></a></p>

<?php
}
add_action( 'jetpack_module_more_info_likes', 'jetpack_likes_more_info' );

function jetpack_likes_more_link() {
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_likes', 'jetpack_likes_more_link' );
// Likes: STOP

// Google+ Profile: START
function jetpack_gplus_authorship_more_info() { ?>

	<div class="jp-info-img">
		<a href="http://jetpack.me/support/google-plus/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/google-plus.png' ) ?>" alt="<?php esc_attr_e( 'Google+ Profile', 'jetpack' ) ?>" width="350" height="33" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Google+ Profile' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'The Google+ profile module allows you to connect your blog and Google+ accounts.', 'jetpack' ) ?></p>
	<p><?php esc_html_e( 'Displayed below your posts will be a link back to your Google+ profile and a Google+ follow button. A link will also be added to your Google+ profile.', 'jetpack' ); ?></p>

	<p>&rarr; <a href="http://jetpack.me/support/google-plus/"><?php esc_html_e( 'More information on using Google+ Profile.', 'jetpack' ); ?></a></p>

<?php
}
add_action( 'jetpack_module_more_info_gplus-authorship', 'jetpack_gplus_authorship_more_info' );

function jetpack_gplus_authorship_more_link() {
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_gplus-authorship', 'jetpack_gplus_authorship_more_link' );
// Google+ Profile: STOP

// Omnisearch: START
function jetpack_omnisearch_more_info() {
	?>

	<h4><?php esc_html_e( 'Omnisearch' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'Search once, get results from everything! Currently supports searching posts, pages, comments, media, and plugins.', 'jetpack' ); ?></p>

	<p><?php esc_html_e( 'Omnisearch plays nice with other plugins by letting other providers offer results as well.', 'jetpack' ); ?></p>

	<?php if( class_exists( 'Jetpack_Omnisearch' ) && current_user_can( 'edit_posts' ) ): ?>
		<?php echo Jetpack_Omnisearch::get_omnisearch_form(); ?>
	<?php endif; ?>

	<?php
}

function jetpack_omnisearch_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://jetpack.me/support/omnisearch/">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

add_action( 'jetpack_module_more_info_omnisearch',  'jetpack_omnisearch_more_info' );
add_action( 'jetpack_learn_more_button_omnisearch', 'jetpack_omnisearch_more_link' );
// Omnisearch: STOP

// Widget Visibility: START
function jetpack_widget_visibility_more_info() { ?>
	<h4><?php esc_html_e( 'Widget Visibility', 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'Control which pages your widgets appear on with Widget Visibility.', 'jetpack' ); ?></p>
	<p><?php esc_html_e( 'To control visibility, expand the widget and click the Visibility button next to the Save button, and then, choose a set of visibility options.', 'jetpack' ); ?></p>
	<p><?php esc_html_e( 'For example, if you wanted the Archives widget to only appear on category archives and error pages, choose "Show" from the first dropdown and then add two rules: "Page is 404 Error Page" and "Category is All Category Pages."', 'jetpack' ); ?></p>
	<p><?php esc_html_e( 'You can also hide widgets based on the current page. For example, if you don\'t want the Archives widget to appear on search results pages, choose "Hide" and "Page is Search results."', 'jetpack' ); ?></p>
<?php
}

function jetpack_widget_visibility_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://jetpack.me/support/widget-visibility/">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

add_action( 'jetpack_module_more_info_widget-visibility',  'jetpack_widget_visibility_more_info' );
add_action( 'jetpack_learn_more_button_widget-visibility', 'jetpack_widget_visibility_more_link' );
// Widget Visibility: STOP

// VideoPress: START
function jetpack_videopress_more_info() {
	?>
	<h4><?php esc_html_e( 'VideoPress', 'jetpack' ); ?></h4>
	<p><?php _e( 'With the VideoPress module you can easily upload videos to your WordPress site and embed them in your posts and pages. This module requires a WordPress.com account with an active <a href="http://store.wordpress.com/premium-upgrades/videopress/" target="_blank">VideoPress subscription</a>.', 'jetpack' ); ?></p>
	<?php
}
add_action( 'jetpack_module_more_info_videopress', 'jetpack_videopress_more_info' );

function jetpack_videopress_more_link() {
	echo '<a class="button-secondary more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_videopress', 'jetpack_videopress_more_link' );
// VideoPress: STOP

// SSO: START
function jetpack_sso_more_info() { ?>
	<h4><?php esc_html_e( 'Single Sign On' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'With WordPress.com Single Sign On, your users will be able to log in to or register for your WordPress site with the same credentials they use on WordPress.com.  It\'s safe and secure.' , 'jetpack' ); ?></p>
	<p><?php esc_html_e( 'Once enabled, a "Log in with WordPress.com" option will be added to your existing log in form.' , 'jetpack' ); ?></p>

<?php
}

function jetpack_sso_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://jetpack.me/support/sso/">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

add_action( 'jetpack_module_more_info_sso',  'jetpack_sso_more_info' );
add_action( 'jetpack_learn_more_button_sso', 'jetpack_sso_more_link' );
// SSO: STOP

// Monitor: START
function jetpack_monitor_more_info() { ?>
	<h4><?php esc_html_e( 'Monitor' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'Nobody likes downtime, and that\'s why Jetpack Monitor is on the job, keeping tabs on your site by checking it every five minutes. As soon as any downtime is detected, you will receive an email notification alerting you to the issue. That way you can act quickly, to get your site back online again!', 'jetpack' ); ?>

	<p><?php esc_html_e( 'We’ll also let you know as soon as your site is up and running, so you can keep an eye on total downtime.', 'jetpack'); ?></p>

<?php
}
add_action( 'jetpack_module_more_info_monitor', 'jetpack_monitor_more_info' );

function jetpack_monitor_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://jetpack.me/support/monitor/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_monitor', 'jetpack_monitor_more_link' );
// Monitor: STOP

// Related Posts: START
function jetpack_related_posts_more_info() {
	$template = <<<EOT
		<div class="jp-info-img">
			<a href="http://jetpack.me/support/related-posts/">
				<img class="jp-info-img" src="%s" alt="%s" width="300" height="98" />
			</a>
		</div>

		<h4>%s</h4>
		<p>%s</p>
		<p>&rarr; <a href="http://jetpack.me/support/related-posts/">%s</a></p>
EOT;
	printf(
		$template,
		plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/related-posts.png' ),
		esc_attr__( 'Related Posts', 'jetpack' ),
		esc_html__( 'Related Posts', 'jetpack' ),
		esc_html__( '"Related Posts" shows additional relevant links from your site under your posts. If the feature is enabled, links appear underneath your Sharing Buttons and WordPress.com Likes (if you’ve turned these on).', 'jetpack' ),
		esc_html__( 'More information on using Related Posts.', 'jetpack' )
	);
}
add_action( 'jetpack_module_more_info_related-posts', 'jetpack_related_posts_more_info' );

function jetpack_related_posts_more_info_connected() {
	$template = <<<EOT
		<div class="jp-info-img">
			<a href="http://jetpack.me/support/related-posts/">
				<img class="jp-info-img" src="%s" alt="%s" width="300" height="98" />
			</a>
		</div>

		<h4>%s</h4>
		<p>%s</p>
		<p>&rarr; <a href="http://jetpack.me/support/related-posts/">%s</a></p>
		<hr />
		<p><a href="%s#sync-related-posts">%s</a></p>
EOT;
	printf(
		$template,
		plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/screenshots/related-posts.png' ),
		esc_attr__( 'Related Posts', 'jetpack' ),
		esc_html__( 'Related Posts', 'jetpack' ),
		esc_html__( '"Related Posts" shows additional relevant links from your site under your posts. If the feature is enabled, links appear underneath your Sharing Buttons and WordPress.com Likes (if you’ve turned these on).', 'jetpack' ),
		esc_html__( 'More information on using Related Posts.', 'jetpack' ),
		esc_url( Jetpack::admin_url( array( 'page' => 'jetpack-debugger' ) ) ),
		esc_html__( 'This feature uses the WordPress.com infrastructure and requires that your public content be mirrored there. If you see intermittent issues only affecting certain posts, request a reindex of your posts.', 'jetpack' )
	);
}
add_action( 'jetpack_module_more_info_connected_related-posts', 'jetpack_related_posts_more_info_connected' );

function jetpack_related_posts_more_button() {
	echo '<a class="button more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_related-posts', 'jetpack_related_posts_more_button' );
// Related Posts: STOP

// Markdown: START
function jetpack_markdown_more_info() { ?>
	<h4><?php esc_html_e( 'Markdown' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'Markdown lets you compose posts and comments with links, lists, and other styles using regular characters and punctuation marks. Markdown is used by writers and bloggers who want a quick and easy way to write rich text, without having to take their hands off the keyboard, and without learning a lot of complicated codes and shortcuts.', 'jetpack' ); ?></p>

<?php
}
add_action( 'jetpack_module_more_info_markdown', 'jetpack_markdown_more_info' );

function jetpack_markdown_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://en.support.wordpress.com/markdown/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_markdown', 'jetpack_markdown_more_link' );
// Markdown: STOP

// Site Verification Tools: START
function jetpack_verification_tools_more_info() { ?>
	<h4><?php esc_html_e( 'Site Verification Tools' , 'jetpack' ); ?></h4>
	<p><?php esc_html_e( 'Use these tools to verify that you own/control your website with other external services like Google, Bing and Pinterest.', 'jetpack' ); ?></p>
	<p><?php printf( __( "Verifying your site allows you to access advanced features on these other services (e.g. Webmaster tools, or getting a verified badge). We'll just add an invisible %s tag to the source code of your homepage.", 'jetpack' ), '<code>meta</code>' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_verification-tools', 'jetpack_verification_tools_more_info' );

function jetpack_verification_tools_more_link() {
	echo '<a class="button-secondary more-info-link" href="http://support.wordpress.com/webmaster-tools/">' . __( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_verification-tools', 'jetpack_verification_tools_more_link' );
// Site Verification Tools: STOP
