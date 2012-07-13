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
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/vaultpress.png' ) ?>" alt="<?php esc_attr_e( 'VaultPress', 'jetpack' ) ?>" width="300" height="155" />
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

	echo '<a class="button more-info-link" href="' . $vaultpress_url . '">' . __( "Learn More", 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_vaultpress', 'vaultpress_jetpack_load_more_link' );

// Gravatar Hovercards
function grofiles_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://blog.gravatar.com/2010/10/06/gravatar-hovercards-on-wordpress-com/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/hovercard.png' ) ?>" alt="<?php esc_attr_e( 'Gravatar Hovercard', 'jetpack' ) ?>" width="320" height="165" />
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
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/hovercard.png' ) ?>" alt="<?php esc_attr_e( 'Gravatar Hovercard', 'jetpack' ) ?>" width="320" height="165" />
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
	echo '<a class="button more-info-link" href="http://blog.gravatar.com/2010/10/06/gravatar-hovercards-on-wordpress-com/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_gravatar-hovercards', 'grofiles_load_more_link' );


// Shortcodes
function jetpack_shortcodes_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/shortcodes/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/shortcodes.png' ) ?>" alt="<?php esc_attr_e( 'Shortcode Embeds', 'jetpack' ) ?>" width="300" height="135" />
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
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/shortcodes.png' ) ?>" alt="<?php esc_attr_e( 'Shortcode Embeds', 'jetpack' ) ?>" width="300" height="135" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Shortcode Embeds', 'jetpack' ) ?></h4>
	<p><?php esc_html_e( 'Shortcodes allow you to easily and safely embed media from other places in your site. With just one simple code, you can tell WordPress to embed YouTube, Flickr, and other media.', 'jetpack' ) ?></p>
	<p><?php esc_html_e( 'Enter a shortcode directly into the Post/Page editor to embed media. For specific instructions follow the links below.', 'jetpack' ) ?></p>
	<?php
	$codes = array( 'archives' => 'http://support.wordpress.com/archives-shortcode/',
		'audio' => 'http://support.wordpress.com/audio/',
		'blip.tv' => 'http://support.wordpress.com/videos/bliptv/',
		'dailymotion' => 'http://support.wordpress.com/videos/dailymotion/',
		'digg' => 'http://support.wordpress.com/digg/',
		'flickr' => 'http://support.wordpress.com/videos/flickr-video/',
		'googlevideo' => 'http://support.wordpress.com/videos/google-video/',
		'scribd' => 'http://support.wordpress.com/scribd/',
		'slide' => 'http://support.wordpress.com/slideshows/slide/',
		'slideshare' => 'http://support.wordpress.com/slideshows/slideshare/',
		'soundcloud' => 'http://support.wordpress.com/audio/soundcloud-audio-player/',
		'vimeo' => 'http://support.wordpress.com/videos/vimeo/',
		'youtube' => 'http://support.wordpress.com/videos/youtube/',
		'polldaddy' => 'http://support.polldaddy.com/wordpress-shortcodes/',
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
	echo '<a class="button more-info-link" href="http://en.support.wordpress.com/shortcodes/">' . esc_html__( 'Learn More' , 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_shortcodes', 'jetpack_shortcodes_load_more_link' );


// Shortlinks
function wpme_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://wp.me/sf2B5-shorten">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/shortlinks.gif' ) ?>" alt="<?php esc_attr_e( 'WP.me Shortlinks', 'jetpack' ) ?>" width="300" height="154" />
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
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/shortlinks.gif' ) ?>" alt="<?php esc_attr_e( 'WP.me Shortlinks', 'jetpack' ) ?>" width="300" height="154" />
		</a>
	</div>

	<h4><?php esc_html_e( 'WP.me Shortlinks' , 'jetpack' ); ?></h4>
	<p><?php esc_html_e( "Instead of typing or copy-pasting long URLs, you can now get a short and simple link to your posts and pages. This uses the super compact wp.me domain name, and gives you a unique URL you can use that will be safe and reliable.", 'jetpack' ) ?></p>
	<p><?php esc_html_e( "To use shortlinks, go to any already published post (or publish something new!). A &#8220;Get Shortlink&#8221; button will be visible under the Post title. When you click it, a dialog box will appear with the shortlink and you can copy and paste to Twitter, Facebook or wherever your heart desires.", 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_shortlinks', 'wpme_more_info_connected' );

function wpme_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://wp.me/sf2B5-shorten">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_shortlinks', 'wpme_load_more_link' );


// WordPress.com Stats
function stats_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/stats/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/stats.gif' ) ?>" alt="<?php esc_attr_e( 'WordPress.com Stats', 'jetpack' ) ?>" width="300" height="144" />
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
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/stats.gif' ) ?>" alt="<?php esc_attr_e( 'WordPress.com Stats', 'jetpack' ) ?>" width="300" height="144" />
		</a>
	</div>

	<h4><?php esc_html_e( 'WordPress.com Stats' , 'jetpack' ); ?></h4>
	<p><?php esc_html_e( 'There are many plugins and services that provide statistics, but data can be overwhelming. WordPress.com Stats makes the most popular metrics easy to understand through a clear and attractive interface.', 'jetpack' ) ?></p>
	<p><?php printf( __( 'You can <a href="%s">view your stats dashboard here</a>.', 'jetpack' ), admin_url( 'admin.php?page=stats' ) ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_stats', 'stats_more_info_connected' );

function stats_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://en.support.wordpress.com/stats/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_stats', 'stats_load_more_link' );


// LaTeX
function latex_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://support.wordpress.com/latex/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/latex.gif' ) ?>" alt="<?php esc_attr_e( 'LaTeX', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><img src="http://l.wordpress.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -27%" /> Makes Beautiful Math</h4>
	<p><?php printf( esc_html__( '%s is a powerful markup language for writing complex mathematical equations, formulas, etc.', 'jetpack' ), '<a href="http://www.latex-project.org/" target="_blank"><img src="http://l.wordpress.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" /></a>' ); ?></p>
	<p><?php printf( esc_html__( 'Jetpack combines the power of %s and the simplicity of WordPress to give you the ultimate in math blogging platforms.', 'jetpack' ), '<img src="http://l.wordpress.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" />' ); ?></p>
	<p><?php esc_html_e( 'Wow, that sounds nerdy.', 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_latex', 'latex_more_info' );

function latex_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://support.wordpress.com/latex/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/latex.gif' ) ?>" alt="<?php esc_attr_e( 'LaTeX', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><img src="http://l.wordpress.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -27%;" /> Makes Beautiful Math</h4>
	<p><?php printf( esc_html__( '%s is a powerful markup language for writing complex mathematical equations, formulas, etc.', 'jetpack' ), '<a href="http://www.latex-project.org/" target="_blank"><img src="http://l.wordpress.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" /></a>' ); ?></p>
	<p><?php printf( __( 'Use <code>$latex your latex code here$</code> or <code>[latex]your latex code here[/latex]</code> to include %s in your posts and comments. There are <a href="%s" target="_blank">all sorts of options</a> available.', 'jetpack' ), '<img src="http://l.wordpress.com/latex.php?latex=%5CLaTeX&amp;bg=transparent&amp;fg=000&amp;s=-1" alt="LaTeX logo" title="LaTeX" style="vertical-align: -25%" />', 'http://support.wordpress.com/latex/' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_latex', 'latex_more_info_connected' );

function latex_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://support.wordpress.com/latex/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_latex', 'latex_load_more_link' );


// Sharedaddy
function sharedaddy_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/sharing/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/sharedaddy.gif' ) ?>" alt="<?php esc_attr_e( 'Sharing', 'jetpack' ) ?>" width="300" height="155" />
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
	echo '<a class="button more-info-link" href="http://support.wordpress.com/sharing/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_sharedaddy', 'sharedaddy_load_more_link' );


// After The Deadline
function jpatd_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/proofreading/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/after-the-deadline.gif' ) ?>" alt="<?php esc_attr_e( 'Spelling and Grammar', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><?php esc_html_e( 'Spelling and Grammar' , 'jetpack' ); ?></h4>

	<p><?php printf( __( "The <a href='%s'>After&nbsp;the&nbsp;Deadline</a> Proofreading service improves your writing by using artificial intelligence to find your errors and offer smart suggestions.", 'jetpack' ), 'http://www.afterthedeadline.com/' ); ?></p>
	<p><?php printf( __( 'After the Deadline provides a number of <a href="%s">customization options</a>, which you can edit in your profile.', 'jetpack' ), esc_url( get_edit_profile_url( get_current_user_id() ) ) . '#atd' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_after-the-deadline', 'jpatd_more_info' );

function jpatd_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://en.support.wordpress.com/proofreading/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_after-the-deadline', 'jpatd_load_more_link' );


// RSS Links Widget, Image Widget, Twitter Widget
function jetpack_widgets_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/widgets.png' ) ?>" alt="<?php esc_attr_e( 'Widgets Screenshot', 'jetpack' ) ?>" width="320" height="119" />
	</div>

	<h4><?php esc_html_e( 'Extra Sidebar Widgets' , 'jetpack' ); ?></h4>
	
	<p><strong><?php esc_html_e( 'The RSS Links Widget ', 'jetpack' ); ?></strong> <?php esc_html_e( "allows you to add links to your blog&#8217;s post and comment RSS feeds in your sidebar. This makes it easy for your readers to stay updated when you post new content or receive new comments.", 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Twitter Widget ', 'jetpack' ); ?></strong> <?php esc_html_e( "shows your latest tweets within a sidebar on your theme. It&#8217;s an easy way to add more activity to your site. There are also a number of customization options.", 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Facebook Like Box Widget ', 'jetpack' ); ?></strong> <?php esc_html_e( "shows your Facebook Like Box within a sidebar on your theme. It&#8217;s a great way to let your readers show their support.", 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Image Widget ', 'jetpack' ); ?></strong><?php esc_html_e( "allows you to easily add images to widget areas in your theme. It&#8217;s an easy way to add more visual interest to your site.", 'jetpack' ) ?></p>

<?php
}
add_action( 'jetpack_module_more_info_widgets', 'jetpack_widgets_more_info' );

function jetpack_widgets_more_info_connected() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/widgets.png' ) ?>" alt="<?php esc_attr_e( 'Widgets Screenshot', 'jetpack' ) ?>" width="320" height="119" />
	</div>

	<h4><?php esc_html_e( 'Extra Sidebar Widgets' , 'jetpack' ); ?></h4>

	<p><strong><?php esc_html_e( 'The RSS Links Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'lets you easily add post and comment RSS feeds to a sidebar on your theme.', 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Twitter Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'shows your latest tweets within a sidebar on your theme.', 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Facebook Like Box Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'shows your Facebook Like Box within a sidebar on your theme.', 'jetpack' ) ?></p>
	<p><strong><?php esc_html_e( 'The Image Widget', 'jetpack' ); ?></strong> <?php esc_html_e( 'lets you easily add images to a sidebar on your theme.', 'jetpack' ) ?></p>

	<p><?php esc_html_e( 'Each of these widgets has a number of customization options.', 'jetpack' ); ?>  <?php printf( __( 'To use the widgets, go to Appearance &#8594; <a href="%s">Widgets</a>. Drag them into one of your sidebars and configure away.', 'jetpack' ), admin_url( 'widgets.php' ) ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_widgets', 'jetpack_widgets_more_info_connected' );

function jetpack_widgets_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://en.support.wordpress.com/widgets/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_widgets', 'jetpack_widgets_load_more_link' );

// Subscriptions
function jetpack_subscriptions_more_info() { ?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/subscriptions.png' ) ?>" alt="<?php esc_attr_e( 'Subsriptions Screenshot', 'jetpack' ) ?>" width="320" height="119" />
	</div>

	<h4><?php esc_html_e( 'Subscriptions' , 'jetpack' ); ?></h4>

	<p><?php esc_html_e( 'Easily allow any visitor to subscribe to all of your posts via email through a widget in your blog&#8217;s sidebar.  Every time you publish a post, WordPress.com will send a notification to all your subscribers.', 'jetpack' ); ?></p>
	<p><?php esc_html_e( 'When leaving comments, your visitors can also subscribe to a post&#8217;s comments to keep up with the conversation.', 'jetpack' ); ?></p>

<?php

	if ( 'jetpack_module_more_info_connected_subscriptions' == current_filter() )
		printf( '<p>' . __( 'To use the Subscriptions widget, go to Appearance &#8594; <a href="%s">Widgets</a>. Drag the widget labeled &#8220;Blog Subscriptions (Jetpack)&#8221; into one of your sidebars and configure away.', 'jetpack' ) . '</p>', admin_url( 'widgets.php' ) );
}
add_action( 'jetpack_module_more_info_subscriptions', 'jetpack_subscriptions_more_info' );
add_action( 'jetpack_module_more_info_connected_subscriptions', 'jetpack_subscriptions_more_info' );

function jetpack_subscriptions_load_more_link() {
	echo '<a class="button more-info-link" href="http://en.support.wordpress.com/following/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
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
	echo '<a class="button more-info-link" href="http://en.wordpress.com/firehose/">' . esc_html__( 'Learn More', 'jetpack' ) . '</a>';
}
add_action( 'jetpack_learn_more_button_enhanced-distribution', 'jetpack_enhanced_distribution_more_link' );

// Contact Form: START
function jetpack_contact_form_learn_more_button() {
    echo '<a class="button more-info-link" href="http://support.wordpress.com/contact-form/">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

function jetpack_contact_form_more_info() {
    echo '<div class="jp-info-img">';
    echo '<a href="http://support.wordpress.com/contact-form/">';
    echo '<img class="jp-info-img" src="' . plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/contact-form.jpg' ) . '" alt="' . esc_attr__( 'Contact Form', 'jetpack' ) . '" width="194" height="148" />';
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
    echo '<a class="button more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

function jetpack_comments_more_info() {
?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/comments.png' ) ?>" alt="<?php esc_attr_e( 'Jetpack Comments Screenshot', 'jetpack' ) ?>" width="320" height="205" />
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
    echo '<a class="button more-info-link" href="#">' . __( 'Learn More', 'jetpack' ) . '</a>';
}

function jetpack_carousel_more_info() {
?>
	<div class="jp-info-img">
		<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/screenshot-6.png' ) ?>" alt="<?php esc_attr_e( 'Gallery Carousel Screenshot', 'jetpack' ) ?>" width="300" height="188" />
	</div>

	<h4><?php esc_html_e( 'Carousel', 'jetpack' ); ?></h4>

    <p>
		With Carousel active, any standard WordPress galleries you have embedded in posts or pages will launch a gorgeous full-screen photo browsing experience with comments and EXIF metadata.
    </p>
<?php
}

add_action( 'jetpack_learn_more_button_carousel', 'jetpack_carousel_learn_more_button' );
add_action( 'jetpack_module_more_info_carousel', 'jetpack_carousel_more_info' );
add_action( 'jetpack_module_more_info_connected_carousel', 'jetpack_carousel_more_info' );
// Gallery Carousel: STOP
