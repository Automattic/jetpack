<?php

/**
 * Jetpack just in time messaging through out the admin
 *
 * @since 3.7.0
 */
class Jetpack_JITM {

	/**
	 * @var Jetpack_JITM
	 **/
	private static $instance = null;

	/**
	 * Get user dismissed messages.
	 *
	 * @var array
	 */
	private static $jetpack_hide_jitm = null;

	/**
	 * Whether plugin auto updates are allowed in this WordPress installation or not.
	 *
	 * @var bool
	 */
	private static $auto_updates_allowed = false;

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_JITM;
		}

		return self::$instance;
	}

	private function __construct() {
		if ( ! Jetpack::is_active() || self::is_jitm_dismissed() ) {
			return;
		}
		add_action( 'current_screen', array( $this, 'prepare_jitms' ) );
	}

	function get_emblem()
	{
		return '<div class="jp-emblem">' . Jetpack::get_jp_emblem() . '</div>';
	}

	/**
	 * Prepare actions according to screen and post type.
	 *
	 * @since 3.8.2
	 *
	 * @uses Jetpack_Autoupdate::get_possible_failures()
	 *
	 * @param object $screen
	 */
	function prepare_jitms( $screen ) {
		/*if ( ! current_user_can( 'jetpack_manage_modules' ) ) {
			return;
		}*/
		//todo: if not connected, fall back to old way
		add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
		add_action( 'admin_notices', array( $this, 'ajax_message' ) );
	}

	function ajax_message() {
		$message_path = $this->get_message_path();
		?>
		<div class="jetpack-jitm-message" data-message-path="<?php echo esc_attr( $message_path ) ?>"></div>
		<?php
	}

	function get_message_path() {
		$screen = get_current_screen();

		return 'wp:' . $screen->base . ':' . current_filter();
	}

	function display_jitm_message() {
		$screen = get_current_screen();

		switch ( $screen->base ) {
			case 'edit-comments':
				$this->display_basic_message();
				add_action( 'admin_notices', array( $this, 'akismet_msg' ) );
				break;
			case 'post':

				break;
			case 'update-core':
				add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
				add_action( 'admin_notices', array( $this, 'backups_updates_msg' ) );
				break;
			case 'woocommerce_page_wc-settings':
			case 'edit_shop_order':
			case 'shop_order':
				add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
				add_action( 'admin_notices', array( $this, 'woocommerce_services_msg' ) );
				break;
		}
	}

	/*
	* Function to enqueue jitm css and js
	*/
	function jitm_enqueue_files() {
		$wp_styles = new WP_Styles();
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
		wp_enqueue_style( 'jetpack-jitm-css', plugins_url( "css/jetpack-admin-jitm{$min}.css", JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION . '-201243242' );
		$wp_styles->add_data( 'jetpack-jitm-css', 'rtl', true );

		wp_enqueue_script( 'jetpack-jitm-new', plugins_url( '_inc/jetpack-jitm-new.js', JETPACK__PLUGIN_FILE ), array( 'jquery' ), JETPACK__VERSION, true );
	}

	/**
	 * @param $request WP_REST_Request
	 *
	 * @return array
	 */
	public static function get_messages( $message_path ) {
		require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-client.php' );

		$site_id = Jetpack_Options::get_option( 'id' );

		$path = sprintf( '/sites/%d/jitm/%s', $site_id, $message_path ) . '?force=wpcom';

		//todo: try retrieve from transient first

		$wpcom_response = Jetpack_Client::wpcom_json_api_request_as_blog(
			$path, '1.1',
			array( 'user_id' => get_current_user_id() )
		);

		// silently fail...might be helpful to track it?
		if ( is_wp_error( $wpcom_response ) ) {
			return array();
		}

		// todo: use ttl value to set expiration ...
		// todo: clear transient on dismiss
		$envelopes = json_decode( $wpcom_response['body'] );

		if ( ! is_array( $envelopes ) ) {
			return array();
		}

		$expiration = isset( $envelopes[0] ) ? $envelopes[0]->ttl : 300;
		set_transient( 'jetpack_jitm_' . $path, $wpcom_response, $expiration );

		foreach ( $envelopes as $envelope ) {
			$normalized_site_url      = Jetpack::build_raw_urls( get_home_url() );
			$envelope->url            = 'https://jetpack.com/redirect/?source=jitm-' . $envelope->id . '&site=' . $normalized_site_url;
			$envelope->jitm_stats_url = Jetpack::build_stats_url( array( 'x_jetpack-jitm' => $envelope->id ) );

			switch ( $envelope->content->icon ) {
				case 'jetpack':
					$envelope->content->icon = '<div class="jp-emblem">' . Jetpack::get_jp_emblem() . '</div>';
					break;
				default:
					$envelope->content->icon = '';
					break;
			}

			$jetpack = Jetpack::init();
			$jetpack->stat( 'jitm', $envelope->id . '-viewed-' . JETPACK__VERSION );
			$jetpack->do_stats( 'server_side' );
		}

		return $envelopes;
	}
}
if (
	/**
	 * Filter to turn off all just in time messages
	 *
	 * @since 3.7.0
	 *
	 * @param bool true Whether to show just in time messages.
	 */
	apply_filters( 'jetpack_just_in_time_msgs', false )
) {
	Jetpack_JITM::init();
}
