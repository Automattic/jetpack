<?php
/**
 * Module Name: Notifications
 * Module Description: Monitor and manage your site's activity with Notifications in your Toolbar and on WordPress.com.
 * Sort Order: 1
 * First Introduced: 1.9
 * Requires Connection: Yes
 */

if ( !defined( 'JETPACK_NOTES__CACHE_BUSTER' ) ) define( 'JETPACK_NOTES__CACHE_BUSTER', JETPACK__VERSION . '-' . gmdate( 'oW' ) );

Jetpack_Sync::sync_options( __FILE__,
	'home',
	'blogname',
	'siteurl',
	'permalink_structure',
	'category_base',
	'tag_base',
	'comment_moderation',
	'default_comment_status',
	'thread_comments',
	'thread_comments_depth'
);

class Jetpack_Notifications {
	var $jetpack = false;

	/**
	 * Singleton
	 * @static
	 */
	function &init() {
		static $instance = array();

		if ( !$instance ) {
			$instance[0] = new Jetpack_Notifications;
		}

		return $instance[0];
	}

	function Jetpack_Notifications() {
		$this->jetpack = Jetpack::init();

		add_action( 'init', array( &$this, 'action_init' ) );
	}

	function wpcom_static_url($file) {
		$i = hexdec( substr( md5( $file ), -1 ) ) % 2;
		$http = is_ssl() ? 'https' : 'http';
		$url = $http . '://s' . $i . '.wp.com' . $file;
		return $url;
	}

	// return the major version of Internet Explorer the viewer is using or false if it's not IE
	public static function get_internet_explorer_version() {
		static $version;
		if ( isset( $version ) ) {
			return $version;
		}

		preg_match( '/MSIE (\d+)/', $_SERVER['HTTP_USER_AGENT'], $matches );
		$version = empty( $matches[1] ) ? null : $matches[1];
		if ( empty( $version ) || !$version ) {
			return false;
		}
		return $version;
	}

	public static function current_browser_is_supported() {
		static $supported;

		if ( isset( $supported ) ) {
			return $supported;
		}

		$ie_version = self::get_internet_explorer_version();
		if ( false === $ie_version ) {
			return $supported = true;
		}

		if ( $ie_version < 8 ) {
			return $supported = false;
		}

		return $supported = true;
	}

	function action_init() {
		//syncing must wait until after init so
		//post types that support comments
		$filt_post_types = array();
		$all_post_types = get_post_types();
		foreach ( $all_post_types as $post_type ) {
			if ( post_type_supports( $post_type, 'comments' ) ) {
				$filt_post_types[] = $post_type;
			}
		}

		Jetpack_Sync::sync_posts( __FILE__, array(
			'post_types' => $filt_post_types,
			'post_stati' => array( 'publish' ),
		) );
		Jetpack_Sync::sync_comments( __FILE__, array(
			'post_types' => $filt_post_types,
			'post_stati' => array( 'publish' ),
			'comment_stati' => array( 'approve', 'approved', '1', 'hold', 'unapproved', 'unapprove', '0', 'spam', 'trash' ),
		) );

		if ( defined( 'DOING_AJAX' ) && DOING_AJAX )
			return;
		
		if ( !has_filter( 'show_admin_bar', '__return_true' ) && !is_user_logged_in() )
			return;

		if ( !self::current_browser_is_supported() )
			return;

		add_action( 'admin_bar_menu', array( &$this, 'admin_bar_menu'), 120 );
		add_action( 'wp_head', array( &$this, 'styles_and_scripts'), 120 );
		add_action( 'admin_head', array( &$this, 'styles_and_scripts') );
	}

	function styles_and_scripts() {
		wp_enqueue_style( 'notes-admin-bar-rest', $this->wpcom_static_url( '/wp-content/mu-plugins/notes/admin-bar-rest.css' ), array(), JETPACK_NOTES__CACHE_BUSTER );
		wp_enqueue_style( 'noticons', $this->wpcom_static_url( '/i/noticons/noticons.css' ), array(), JETPACK_NOTES__CACHE_BUSTER );

		$this->print_js();

		// attempt to use core or plugin libraries if registered
		if ( wp_script_is( 'mustache', 'registered' ) ) {
			if ( !wp_script_is( 'mustache', 'queue' ) ) {
				wp_enqueue_script( 'mustache' );
			}
		}
		else {
			wp_enqueue_script( 'mustache', $this->wpcom_static_url( '/wp-content/js/mustache.js' ), null, JETPACK_NOTES__CACHE_BUSTER );
		}

		if ( wp_script_is( 'underscore', 'registered' ) ) {
			if ( !wp_script_is( 'underscore', 'queue' ) ) {
				wp_enqueue_script( 'underscore' );
			}
		}
		else {
			wp_enqueue_script( 'underscore', $this->wpcom_static_url( '/wp-content/js/underscore.js' ), null, JETPACK_NOTES__CACHE_BUSTER );
		}
		if ( wp_script_is( 'backbone', 'registered' ) ) {
			if ( !wp_script_is( 'backbone', 'queue' ) ) {
				wp_enqueue_script( 'backbone' );
			}
		}
		else {
			wp_enqueue_script( 'backbone', $this->wpcom_static_url( '/wp-content/js/backbone.js' ), array( 'jquery', 'underscore' ), JETPACK_NOTES__CACHE_BUSTER );
		}

		wp_enqueue_script( 'notes-postmessage', $this->wpcom_static_url( '/wp-content/js/postmessage.js' ), array(), JETPACK_NOTES__CACHE_BUSTER );
		wp_enqueue_script( 'notes-rest-common', $this->wpcom_static_url( '/wp-content/mu-plugins/notes/notes-rest-common.js' ), array( 'backbone', 'mustache', 'jquery.spin' ), JETPACK_NOTES__CACHE_BUSTER );
		wp_enqueue_script( 'notes-admin-bar-rest', $this->wpcom_static_url( '/wp-content/mu-plugins/notes/admin-bar-rest.js' ), array( 'jquery', 'underscore', 'backbone', 'jquery.spin' ), JETPACK_NOTES__CACHE_BUSTER );
	}

	function admin_bar_menu() {
		global $wp_admin_bar, $current_blog;

		if ( !is_object( $wp_admin_bar ) )
			return;

		$classes = 'wpnt-loading wpn-read';
		$wp_admin_bar->add_menu( array(
			'id'     => 'notes',
			'title'  => '<span id="wpnt-notes-unread-count" class="' . esc_attr( $classes ) . '">
					<span class="noticon noticon-notification"></span>
					</span>',
			'meta'   => array(
				'html'  => '<div id="wpnt-notes-panel" style="display:none"><div class="wpnt-notes-panel-header"><span class="wpnt-notes-header">' . __('Notifications', 'jetpack') . '</span><span class="wpnt-notes-panel-link"></span></div></div>',
				'class' => 'menupop',
			),
			'parent' => 'top-secondary',
		) );
	}

	function print_js() {
		$link_accounts_url = is_user_logged_in() && !Jetpack::is_user_connected() ? Jetpack::admin_url() : false;
?>
<script type="text/javascript">
/* <![CDATA[ */
	var wpNotesIsJetpackClient = true;
<?php if ( $link_accounts_url ) : ?>
	var wpNotesLinkAccountsURL = '<?php print $link_accounts_url; ?>';
<?php endif; ?>
/* ]]> */
</script>
<?php
	}

}

Jetpack_Notifications::init();
