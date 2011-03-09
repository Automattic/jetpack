<?php
/**
 * "Learn More" information blocks for all modules live in this file.
 * 
 * jetpack_module_more_info_<module-slug> hooks are for pre-connection information
 * jetpack_module_more_info_connected_<module-slug> hooks are used once the user
 * 		is connected to show them links to admin panels, usage info etc.
 */

// Gravatar Hovercards
function grofiles_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://blog.gravatar.com/2010/10/06/gravatar-hovercards-on-wordpress-com/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/hovercard.jpg' ) ?>" alt="<?php _e( 'Gravatar Hovercard', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><?php _e( 'Gravatar Hovercards', 'jetpack' ) ?></h4>
	<h5><?php _e( "What&#8217;s a Hovercard?", 'jetpack' ) ?></h5>
	<p><?php _e( 'Hovercards enhance plain Gravatar images with information about a person: name, bio, pictures, their contact info, and other services they use on the web like Twitter, Facebook, or LinkedIn.', 'jetpack' ); ?></p>
	<p><?php _e( 'Hovercards offer a great way to show your internet presence and help people find your own blog.', 'jetpack' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_gravatar-hovercards', 'grofiles_more_info' );

function grofiles_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://blog.gravatar.com/2010/10/06/gravatar-hovercards-on-wordpress-com/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/hovercard.jpg' ) ?>" alt="<?php _e( 'Gravatar Hovercard', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><?php _e( 'Gravatar Hovercards', 'jetpack' ) ?></h4>
	<h5><?php _e( "What&#8217;s a Hovercard?", 'jetpack' ) ?></h5>
	<p><?php _e( 'Hovercards enhance plain Gravatar images with information about a person: name, bio, pictures, their contact info, and other services.', 'jetpack' ); ?></p>
	<p><?php _e( 'To see hovercards, look at any blog post on your blog that has comments. If the commenter has a hovercard associated with their gravatar, mouse over their image and the hovercard will appear. To turn hovercards off, click the Deactivate button above.', 'jetpack' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_gravatar-hovercards', 'grofiles_more_info_connected' );

function grofiles_load_more_link() {
	echo '<a class="button more-info-link" href="http://blog.gravatar.com/2010/10/06/gravatar-hovercards-on-wordpress-com/">' . __( "Learn More", 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_gravatar-hovercards', 'grofiles_load_more_link' );


// Shortcodes
function jetpack_shortcodes_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/shortcodes/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/shortcodes.gif' ) ?>" alt="<?php _e( 'Shortcode Embeds', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><?php _e( 'Shortcode Embeds', 'jetpack' ) ?></h4>
	<p><?php _e( 'Shortcodes allow you to easily and safely embed media from other places in your site. With just one simple code, you can tell WordPress to embed YouTube, Flickr, and other media.', 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_shortcodes', 'jetpack_shortcodes_more_info' );

function jetpack_shortcodes_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/shortcodes/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/shortcodes.gif' ) ?>" alt="<?php _e( 'Shortcode Embeds', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><?php _e( 'Shortcode Embeds', 'jetpack' ) ?></h4>
	<p><?php _e( 'Shortcodes allow you to easily and safely embed media from other places in your site. With just one simple code, you can tell WordPress to embed YouTube, Flickr, and other media.', 'jetpack' ) ?></p>
	<p><?php _e( 'Enter a shortcode directly into the Post/Page editor to embed media. For specific instructions follow the links below.', 'jetpack' ) ?></p>
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

	$available = '';
	foreach ( $codes as $code => $url ) {
		$available[] = '<a href="' . $url . '" target="_blank">[' . $code . ']</a>';

	}
	?>
	<p><?php echo wp_sprintf( __( 'Available shortcodes are: %l.', 'jetpack' ), $available ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_shortcodes', 'jetpack_shortcodes_more_info_connected' );

function jetpack_shortcodes_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://en.support.wordpress.com/shortcodes/">' . __( "Learn More" , 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_shortcodes', 'jetpack_shortcodes_load_more_link' );


// Shortlinks
function wpme_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://wp.me/sf2B5-shorten">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/shortlinks.gif' ) ?>" alt="<?php _e( 'WP.me Shortlinks', 'jetpack' ) ?>" width="300" height="154" />
		</a>
	</div>

	<h4><?php _e( 'WP.me Shortlinks' , 'jetpack' ); ?></h4>
	<p><?php _e( "Instead of typing or copy-pasting long URLs, you can now get a short and simple link to your posts and pages. This uses the super compact wp.me domain name, and gives you a unique URL you can use that will be safe and reliable.", 'jetpack' ) ?></p>
	<p><?php _e( "It&#8217;s perfect for use on Twitter, Facebook, and cell phone text messages where every character counts.", 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_shortlinks', 'wpme_more_info' );

function wpme_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://wp.me/sf2B5-shorten">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/shortlinks.gif' ) ?>" alt="<?php _e( 'WP.me Shortlinks', 'jetpack' ) ?>" width="300" height="154" />
		</a>
	</div>

	<h4><?php _e( 'WP.me Shortlinks' , 'jetpack' ); ?></h4>
	<p><?php _e( "Instead of typing or copy-pasting long URLs, you can now get a short and simple link to your posts and pages. This uses the super compact wp.me domain name, and gives you a unique URL you can use that will be safe and reliable.", 'jetpack' ) ?></p>
	<p><?php _e( "To use shortlinks, go to any already published post (or publish something new!). A 'Get Shortlink' button will be visible under the Post title. When you click it, a dialog box will appear with the shortlink and you can copy and paste to Twitter, Facebook or wherever your heart desires.", 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_shortlinks', 'wpme_more_info_connected' );

function wpme_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://wp.me/sf2B5-shorten">' . __( "Learn More", 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_shortlinks', 'wpme_load_more_link' );


// WordPress.com Stats
function stats_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/stats/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/stats.gif' ) ?>" alt="<?php _e( 'WordPress.com Stats', 'jetpack' ) ?>" width="300" height="144" />
		</a>
	</div>

	<h4><?php _e( 'WordPress.com Stats' , 'jetpack' ); ?></h4>
	<p><?php _e( 'There are many plugins and services that provide statistics, but data can be overwhelming. WordPress.com Stats makes the most popular metrics easy to understand through a clear and attractive interface.', 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_stats', 'stats_more_info' );

function stats_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/stats/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/stats.gif' ) ?>" alt="<?php _e( 'WordPress.com Stats', 'jetpack' ) ?>" width="300" height="144" />
		</a>
	</div>

	<h4><?php _e( 'WordPress.com Stats' , 'jetpack' ); ?></h4>
	<p><?php _e( 'There are many plugins and services that provide statistics, but data can be overwhelming. WordPress.com Stats makes the most popular metrics easy to understand through a clear and attractive interface.', 'jetpack' ) ?></p>
	<p><?php printf( __( 'You can <a href="%s">view your stats dashboard here</a>.', 'jetpack' ), admin_url( 'admin.php?page=stats' ) ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_stats', 'stats_more_info_connected' );

function stats_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://en.support.wordpress.com/stats/">' . __( "Learn More", 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_stats', 'stats_load_more_link' );


// Latex
function latex_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://support.wordpress.com/latex/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/latex.gif' ) ?>" alt="<?php _e( 'LaTeX', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><?php _e( 'LaTeX' , 'jetpack' ); ?></h4>
	<p><?php printf( __( '<a href="%s" target="_blank">LaTeX</a> is a powerful markup language for writing complex mathematical equations, formulas, etc.', 'jetpack' ), 'http://www.latex-project.org/' ) ?></p>
	<p><?php _e( 'Jetpack combines the power of LaTeX and the simplicity of WordPress to give you the ultimate in math blogging platforms.', 'jetpack' ) ?></p>
	<p><?php _e( 'Wow, that sounds nerdy.', 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_latex', 'latex_more_info' );

function latex_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://support.wordpress.com/latex/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/latex.gif' ) ?>" alt="<?php _e( 'LaTeX', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><?php _e( 'LaTeX' , 'jetpack' ); ?></h4>
	<p><?php printf( __( '<a href="%s" target="_blank">LaTeX</a> is a powerful markup language for writing complex mathematical equations, formulas, etc.', 'jetpack' ), 'http://www.latex-project.org/' ) ?></p>
	<p><?php printf( __( 'Use <code>$latex your latex code here$</code> or <code>[latex]your latex code here[/latex]</code> to include LaTeX in your posts and comments. There are <a href="%s" target="_blank">all sorts of options</a> available.', 'jetpack' ), 'http://support.wordpress.com/latex/' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_latex', 'latex_more_info_connected' );

function latex_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://support.wordpress.com/latex/">' . __( "Learn More", 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_latex', 'latex_load_more_link' );


// Twitter Widget
function jptwitter_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/widgets/twitter-widget/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/twitter.png' ) ?>" alt="<?php _e( 'Twitter', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><?php _e( 'Twitter Widget' , 'jetpack' ); ?></h4>
	<p><?php _e( "The Twitter Widget shows your latest tweets within a sidebar on your theme. It&#8217;s an easy way to add more activity to your site.", 'jetpack' ) ?></p>
	<p><?php _e( 'There are also a number of customization options. Change the number of displayed tweets, filter out replies, and include retweets.', 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_twitter-widget', 'jptwitter_more_info' );

function jptwitter_more_info_connected() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/widgets/twitter-widget/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/twitter.png' ) ?>" alt="<?php _e( 'Twitter', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><?php _e( 'Twitter Widget' , 'jetpack' ); ?></h4>
	<p><?php _e( 'The Twitter Widget shows your latest tweets within a sidebar on your theme.', 'jetpack' ) ?></p>
	<p><?php printf( __( 'To use the Twitter Widget, go to Appearance &#8594; <a href="%s">Widgets</a>. The Twitter widget is listed as &#8220;Twitter&nbsp;(Jetpack)&#8221;; drag it into one of your sidebars and configure away.', 'jetpack' ), admin_url( 'widgets.php' ) ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_twitter-widget', 'jptwitter_more_info_connected' );

function jptwitter_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://en.blog.wordpress.com/2009/03/26/twitter-widget/">' . __( "Learn More", 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_twitter-widget', 'jptwitter_load_more_link' );


// Sharedaddy
function sharedaddy_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/sharing/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/sharedaddy.gif' ) ?>" alt="<?php _e( 'Twitter', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>
	<h4><?php _e( 'Sharedaddy' , 'jetpack' ); ?></h4>
	<p><?php _e( 'Share your posts with Twitter, Facebook, and a host of other services. You can configure services to appear as icons, text, or both. Some services have additional options to display smart buttons, such as Twitter, which will update the number of times the post has been shared.', 'jetpack' ); ?></p>

	<p><?php _e( 'The following services are included: Twitter, Facebook, Reddit, StumbleUpon, PressThis, Digg, Print, and Email.' , 'jetpack' ); ?></p>
	
	<p><?php _e( 'Additionally you can define your own custom services.', 'jetpack' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_sharedaddy', 'sharedaddy_more_info' );

function sharedaddy_more_info_connected() { ?>
	<div class="jp-info-img">
		<embed type="application/x-shockwave-flash" src="http://s0.videopress.com/player.swf?v=1.02" height="190" wmode="transparent" seamlesstabbing="true" allowfullscreen="true" allowscriptaccess="always" overstretch="true" flashvars="guid=WV0JOwY2"></embed>
	</div>

	<h4><?php _e( 'Sharedaddy' , 'jetpack' ); ?></h4>
	<p><?php printf( __( 'Change Sharedaddy settings from your dashboard <a href="%s">Settings > Sharing</a> menu.', 'jetpack' ), 'options-general.php?page=sharing' ); ?></p>
	<p><?php _e( 'Drag and drop sharing services into the enabled section to have them show up on your site, and drag them into the hidden section to have them hidden behind a button.', 'jetpack' ); ?>
	<p><?php printf( __( 'Full details can be found on the <a href="%s">Sharedaddy support page</a>. This video also gives a swish run-down of how to use Sharedaddy. Watch it in HD for extra snazz!', 'jetpack' ), 'http://support.wordpress.com/sharing/' ); ?></p>
<?php
}
add_action( 'jetpack_module_more_info_connected_sharedaddy', 'sharedaddy_more_info_connected' );

function sharedaddy_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://support.wordpress.com/sharing/">' . __( "Learn More", 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_sharedaddy', 'sharedaddy_load_more_link' );


// After The Deadline
function jpatd_more_info() { ?>
	<div class="jp-info-img">
		<a href="http://en.support.wordpress.com/proofreading/">
			<img class="jp-info-img" src="<?php echo plugins_url( basename( dirname( dirname( __FILE__ ) ) ) . '/_inc/images/after-the-deadline.gif' ) ?>" alt="<?php _e( 'After the Deadline', 'jetpack' ) ?>" width="300" height="155" />
		</a>
	</div>

	<h4><?php _e( 'After the Deadline' , 'jetpack' ); ?></h4>

	<p><?php _e( 'After the Deadline can check your spelling, grammar, and style when you publish with WordPress.', 'jetpack' ) ?></p>
	<p><?php _e( 'After the Deadline also provides a number of customization options. You can edit the phrase ignore list and enable extra options.', 'jetpack' ) ?></p>
<?php
}
add_action( 'jetpack_module_more_info_after-the-deadline', 'jpatd_more_info' );

function jpatd_load_more_link( $description ) {
	echo '<a class="button more-info-link" href="http://en.support.wordpress.com/proofreading/">' . __( "Learn More", 'jetpack' ) . '</a>';
}
add_filter( 'jetpack_learn_more_button_after-the-deadline', 'jpatd_load_more_link' );