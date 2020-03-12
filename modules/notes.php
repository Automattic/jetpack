<?php
/**
 * Module Name: Notifications
 * Module Description: Receive instant notifications of site comments and likes.
 * Sort Order: 13
 * First Introduced: 1.9
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Other
 * Feature: General
 * Additional Search Queries: notification, notifications, toolbar, adminbar, push, comments
 */

if ( !defined( 'JETPACK_NOTES__CACHE_BUSTER' ) ) define( 'JETPACK_NOTES__CACHE_BUSTER', JETPACK__VERSION . '-' . gmdate( 'oW' ) );

class Jetpack_Notifications {
	public $jetpack = false;

	/**
	 * Singleton
	 * @static
	 */
	public static function init() {
		static $instance = array();

		if ( !$instance ) {
			$instance[0] = new Jetpack_Notifications;
		}

		return $instance[0];
	}

	function __construct() {
		$this->jetpack = Jetpack::init();

		add_action( 'init', array( &$this, 'action_init' ) );
	}

	function wpcom_static_url($file) {
		$i = hexdec( substr( md5( $file ), -1 ) ) % 2;
		return 'https://s' . $i . '.wp.com' . $file;
	}

	// return the major version of Internet Explorer the viewer is using or false if it's not IE
	public static function get_internet_explorer_version() {
		static $version;
		if ( isset( $version ) ) {
			return $version;
		}

		$user_agent = isset( $_SERVER['HTTP_USER_AGENT']  ) ? $_SERVER['HTTP_USER_AGENT'] : '';

		preg_match( '/MSIE (\d+)/', $user_agent, $matches );
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
		$is_rtl = is_rtl();

		if ( Jetpack::is_module_active( 'masterbar' ) ) {
			/**
			 * Can be used to force Notifications to display in RTL style.
			 *
			 * @module notes
			 *
			 * @since 4.8.0
			 *
			 * @param bool true Should notifications be displayed in RTL style. Defaults to false.
			 */
			$is_rtl = apply_filters( 'a8c_wpcom_masterbar_enqueue_rtl_notification_styles', false );
		}

		if ( ! $is_rtl ) {
			wp_enqueue_style( 'wpcom-notes-admin-bar', $this->wpcom_static_url( '/wp-content/mu-plugins/notes/admin-bar-v2.css' ), array( 'admin-bar' ), JETPACK_NOTES__CACHE_BUSTER );
		} else {
			wp_enqueue_style( 'wpcom-notes-admin-bar', $this->wpcom_static_url( '/wp-content/mu-plugins/notes/rtl/admin-bar-v2-rtl.css' ), array( 'admin-bar' ), JETPACK_NOTES__CACHE_BUSTER );
		}

		wp_enqueue_style( 'noticons', $this->wpcom_static_url( '/i/noticons/noticons.css' ), array( 'wpcom-notes-admin-bar' ), JETPACK_NOTES__CACHE_BUSTER );

		$this->print_js();

		wp_enqueue_script( 'wpcom-notes-common', $this->wpcom_static_url( '/wp-content/mu-plugins/notes/notes-common-v2.js' ), array( 'jquery', 'underscore', 'backbone', 'mustache' ), JETPACK_NOTES__CACHE_BUSTER, true );
		wp_enqueue_script( 'wpcom-notes-admin-bar', $this->wpcom_static_url( '/wp-content/mu-plugins/notes/admin-bar-v2.js' ), array( 'wpcom-notes-common' ), JETPACK_NOTES__CACHE_BUSTER, true );

		$script_handles = array(
			'mustache',
			'underscore',
			'backbone',
			'jquery',
			'jquery-migrate',
			'jquery-core',
			'wpcom-notes-common',
			'wpcom-notes-admin-bar',
		);

		$is_amp_request = class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request();

		add_filter(
			'script_loader_tag',
			function ( $tag, $handle ) use ( $is_amp_request, $script_handles ) {
				if ( $is_amp_request && in_array( $handle, $script_handles, true ) ) {
					return preg_replace( '/(?<=<script)(?=\s|>)/i', ' data-ampdevmode', $tag );
				}
				if ( 'underscore' === $handle ) {
					return $tag . PHP_EOL . '<script>
						(function(_AtLoad){
							console.log({_AtLoad: _AtLoad});
						})(window._);
					</script>';
				}
				return $tag;
			},
			10,
			2
		);
	}

	function admin_bar_menu() {
		global $wp_admin_bar, $current_blog;

		if ( !is_object( $wp_admin_bar ) )
			return;

		$wpcom_locale = get_locale();

		if ( !class_exists( 'GP_Locales' ) ) {
			if ( defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) && file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				require JETPACK__GLOTPRESS_LOCALES_PATH;
			}
		}

		if ( class_exists( 'GP_Locales' ) ) {
			$wpcom_locale_object = GP_Locales::by_field( 'wp_locale', $wpcom_locale );
			if ( $wpcom_locale_object instanceof GP_Locale ) {
				$wpcom_locale = $wpcom_locale_object->slug;
			}
		}

		$classes = 'wpnt-loading wpn-read';
		$wp_admin_bar->add_menu( array(
			'id'     => 'notes',
			'title'  => '<span id="wpnt-notes-unread-count" class="' . esc_attr( $classes ) . '">
					<span class="noticon noticon-notification"></span>
					</span>',
			'meta'   => array(
				'html'  => '<div id="wpnt-notes-panel2" class="intrinsic-ignore" style="display:none" lang="' . esc_attr( $wpcom_locale ) . '" dir="' . ( is_rtl() ? 'rtl' : 'ltr' ) . '"><div class="wpnt-notes-panel-header"><span class="wpnt-notes-header">' . __( 'Notifications', 'jetpack' ) . '</span><span class="wpnt-notes-panel-link"></span></div></div>',
				'class' => 'menupop',
			),
			'parent' => 'top-secondary',
		) );
	}

	function print_js() {
		$link_accounts_url = is_user_logged_in() && !Jetpack::is_user_connected() ? Jetpack::admin_url() : false;
?>
<script data-ampdevmode type="text/javascript">
/* <![CDATA[ */
	var wpNotesIsJetpackClient = true;
	var wpNotesIsJetpackClientV2 = true;
<?php if ( $link_accounts_url ) : ?>
	var wpNotesLinkAccountsURL = '<?php print $link_accounts_url; ?>';
<?php endif; ?>
/* ]]> */
</script>
<?php
	}

}

Jetpack_Notifications::init();
