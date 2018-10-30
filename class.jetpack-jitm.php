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
	 * Initializes the class, or returns the singleton
	 *
	 * @return Jetpack_JITM | false
	 */
	static function init() {
		/**
		 * Filter to turn off all just in time messages
		 *
		 * @since 3.7.0
		 * @since 5.4.0 Correct docblock to reflect default arg value
		 *
		 * @param bool false Whether to show just in time messages.
		 */
		if ( ! apply_filters( 'jetpack_just_in_time_msgs', false ) ) {
			return false;
		}

		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_JITM;
		}

		return self::$instance;
	}

	/**
	 * Jetpack_JITM constructor.
	 */
	private function __construct() {
		if ( ! Jetpack::is_active() || Jetpack::is_development_mode() ) {
			return;
		}
		add_action( 'current_screen', array( $this, 'prepare_jitms' ) );
	}

	/**
	 * Get's the Jetpack emblem
	 *
	 * @return string The Jetpack emblem
	 */
	function get_emblem() {
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
		if ( ! in_array( $screen->id, array(
			'jetpack_page_stats',
			'jetpack_page_akismet-key-config',
			'admin_page_jetpack_modules'
		) ) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
			add_action( 'admin_notices', array( $this, 'ajax_message' ) );
			add_action( 'edit_form_top', array( $this, 'ajax_message' ) );
		}
	}

	/**
	 * A special filter for WooCommerce, to set a message based on local state.
	 *
	 * @param $message string The current message
	 *
	 * @return array The new message
	 */
	static function jitm_woocommerce_services_msg( $content ) {
		if ( ! function_exists( 'wc_get_base_location' ) ) {
			return $content;
		}

		$base_location = wc_get_base_location();

		switch ( $base_location['country'] ) {
			case 'US':
				$content->message = esc_html__( 'New free service: Show USPS shipping rates on your store! Added bonus: print shipping labels without leaving WooCommerce.', 'jetpack' );
				break;
			case 'CA':
				$content->message = esc_html__( 'New free service: Show Canada Post shipping rates on your store!', 'jetpack' );
				break;
			default:
				$content->message = '';
		}

		return $content;
	}

	/**
	 * A special filter for WooCommerce Call To Action button
	 *
	 * @param $CTA string The existing CTA
	 *
	 * @return string The new CTA
	 */
	static function jitm_jetpack_woo_services_install( $CTA ) {
		return wp_nonce_url( add_query_arg( array(
			'wc-services-action' => 'install'
		), admin_url( 'admin.php?page=wc-settings' ) ), 'wc-services-install' );
	}

	/**
	 * A special filter for WooCommerce Call To Action button
	 *
	 * @param $CTA string The existing CTA
	 *
	 * @return string The new CTA
	 */
	static function jitm_jetpack_woo_services_activate( $CTA ) {
		return wp_nonce_url( add_query_arg( array(
			'wc-services-action' => 'activate'
		), admin_url( 'admin.php?page=wc-settings' ) ), 'wc-services-install' );
	}

	/**
	 * Injects the dom to show a JITM inside of
	 */
	function ajax_message() {
		$message_path = $this->get_message_path();
		$query_string = _http_build_query( $_GET, '', ',' );
		$current_screen = wp_unslash( $_SERVER['REQUEST_URI'] );
		?>
		<div class="jetpack-jitm-message"
		     data-nonce="<?php echo wp_create_nonce( 'wp_rest' ) ?>"
		     data-message-path="<?php echo esc_attr( $message_path ) ?>"
		     data-query="<?php echo urlencode_deep( $query_string ) ?>"
		     data-redirect="<?php echo urlencode_deep( $current_screen ) ?>"
		></div>
		<?php
	}

	/**
	 * Get's the current message path for display of a JITM
	 *
	 * @return string The message path
	 */
	function get_message_path() {
		$screen = get_current_screen();

		return 'wp:' . $screen->id . ':' . current_filter();
	}

	/**
	 * Function to enqueue jitm css and js
	 */
	function jitm_enqueue_files() {
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
		wp_register_style(
			'jetpack-jitm-css',
			plugins_url( "css/jetpack-admin-jitm{$min}.css", JETPACK__PLUGIN_FILE ),
			false,
			JETPACK__VERSION .
			'-201243242'
		);
		wp_style_add_data( 'jetpack-jitm-css', 'rtl', 'replace' );
		wp_style_add_data( 'jetpack-jitm-css', 'suffix', $min );
		wp_enqueue_style( 'jetpack-jitm-css' );

		wp_enqueue_script(
			'jetpack-jitm-new',
			Jetpack::get_file_url_for_environment( '_inc/build/jetpack-jitm.min.js', '_inc/jetpack-jitm.js' ),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);
		wp_localize_script( 'jetpack-jitm-new', 'jitm_config', array(
			'api_root'               => esc_url_raw( rest_url() ),
			'activate_module_text'   => esc_html__( 'Activate', 'jetpack' ),
			'activated_module_text'  => esc_html__( 'Activated', 'jetpack' ),
			'activating_module_text' => esc_html__( 'Activating', 'jetpack' ),
		) );
	}

	/**
	 * Dismisses a JITM feature class so that it will no longer be shown
	 *
	 * @param $id string The id of the JITM that was dismissed
	 * @param $feature_class string The feature class of the JITM that was dismissed
	 *
	 * @return bool Always true
	 */
	function dismiss( $id, $feature_class ) {
		JetpackTracking::record_user_event( 'jitm_dismiss_client', array(
			'jitm_id' => $id,
			'feature_class' => $feature_class,
		) );


		$hide_jitm = Jetpack_Options::get_option( 'hide_jitm' );
		if ( ! is_array( $hide_jitm ) ) {
			$hide_jitm = array();
		}

		if ( isset( $hide_jitm[ $feature_class ] ) ) {
			if ( ! is_array( $hide_jitm[ $feature_class ] ) ) {
				$hide_jitm[ $feature_class ] = array( 'last_dismissal' => 0, 'number' => 0 );
			}
		} else {
			$hide_jitm[ $feature_class ] = array( 'last_dismissal' => 0, 'number' => 0 );
		}

		$number = $hide_jitm[ $feature_class ]['number'];

		$hide_jitm[ $feature_class ] = array( 'last_dismissal' => time(), 'number' => $number + 1 );

		Jetpack_Options::update_option( 'hide_jitm', $hide_jitm );

		return true;
	}

	/**
	 * Asks the wpcom API for the current message to display keyed on query string and message path
	 *
	 * @param $message_path string The message path to ask for
	 * @param $query string The query string originally from the front end
	 *
	 * @return array The JITM's to show, or an empty array if there is nothing to show
	 */
	function get_messages( $message_path, $query ) {
		// custom filters go here
		add_filter( 'jitm_woocommerce_services_msg', array( 'Jetpack_JITM', 'jitm_woocommerce_services_msg' ) );
		add_filter( 'jitm_jetpack_woo_services_install', array( 'Jetpack_JITM', 'jitm_jetpack_woo_services_install' ) );
		add_filter( 'jitm_jetpack_woo_services_activate', array(
			'Jetpack_JITM',
			'jitm_jetpack_woo_services_activate'
		) );

		$user = wp_get_current_user();

		// unauthenticated or invalid requests just bail
		if ( ! $user ) {
			return array();
		}

		require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-client.php' );

		$site_id = Jetpack_Options::get_option( 'id' );

		// build our jitm request
		$path = add_query_arg( array(
			'external_user_id' => urlencode_deep( $user->ID ),
			'query_string'     => urlencode_deep( $query ),
			'mobile_browser'   => jetpack_is_mobile( 'smart' ) ? 1 : 0,
		), sprintf( '/sites/%d/jitm/%s', $site_id, $message_path ) );

		// attempt to get from cache
		$envelopes = get_transient( 'jetpack_jitm_' . substr( md5( $path ), 0, 31 ) );

		// if something is in the cache and it was put in the cache after the last sync we care about, use it
		$use_cache = false;

		/** This filter is documented in class.jetpack.php */
		if ( apply_filters( 'jetpack_just_in_time_msg_cache', false ) ) {
			$use_cache = true;
		}

		if ( $use_cache ) {
			$last_sync  = (int) get_transient( 'jetpack_last_plugin_sync' );
			$from_cache = $envelopes && $last_sync > 0 && $last_sync < $envelopes['last_response_time'];
		} else {
			$from_cache = false;
		}

		// otherwise, ask again
		if ( ! $from_cache ) {
			$wpcom_response = Jetpack_Client::wpcom_json_api_request_as_blog(
				$path,
				'2',
				array(
					'user_id'    => $user->ID,
					'user_roles' => implode( ',', $user->roles ),
				),
				null,
				'wpcom'
			);

			// silently fail...might be helpful to track it?
			if ( is_wp_error( $wpcom_response ) ) {
				return array();
			}

			$envelopes = json_decode( $wpcom_response['body'] );

			if ( ! is_array( $envelopes ) ) {
				return array();
			}

			$expiration = isset( $envelopes[0] ) ? $envelopes[0]->ttl : 300;

			// do not cache if expiration is 0 or we're not using the cache
			if ( 0 != $expiration && $use_cache ) {
				$envelopes['last_response_time'] = time();

				set_transient( 'jetpack_jitm_' . substr( md5( $path ), 0, 31 ), $envelopes, $expiration );
			}
		}

		$hidden_jitms = Jetpack_Options::get_option( 'hide_jitm' );
		unset( $envelopes['last_response_time'] );

		foreach ( $envelopes as $idx => &$envelope ) {

			$dismissed_feature = isset( $hidden_jitms[ $envelope->feature_class ] ) && is_array( $hidden_jitms[ $envelope->feature_class ] ) ? $hidden_jitms[ $envelope->feature_class ] : null;

			// if the this feature class has been dismissed and the request has not passed the ttl, skip it as it's been dismissed
			if ( is_array( $dismissed_feature ) && ( time() - $dismissed_feature['last_dismissal'] < $envelope->expires || $dismissed_feature['number'] >= $envelope->max_dismissal ) ) {
				unset( $envelopes[ $idx ] );
				continue;
			}

			JetpackTracking::record_user_event( 'jitm_view_client', array(
				'jitm_id' => $envelope->id,
			) );

			$normalized_site_url      = Jetpack::build_raw_urls( get_home_url() );
			$envelope->url            = 'https://jetpack.com/redirect/?source=jitm-' . $envelope->id . '&site=' . $normalized_site_url . '&u=' . $user->ID;
			$envelope->jitm_stats_url = Jetpack::build_stats_url( array( 'x_jetpack-jitm' => $envelope->id ) );

			if ( $envelope->CTA->hook ) {
				$envelope->url = apply_filters( 'jitm_' . $envelope->CTA->hook, $envelope->url );
				unset( $envelope->CTA->hook );
			}

			if ( isset( $envelope->content->hook ) ) {
				$envelope->content = apply_filters( 'jitm_' . $envelope->content->hook, $envelope->content );
				unset( $envelope->content->hook );
			}

			// no point in showing an empty message
			if ( empty( $envelope->content->message ) ) {
				unset( $envelopes[ $idx ] );
				continue;
			}

			switch ( $envelope->content->icon ) {
				case 'jetpack':
					$envelope->content->icon = '<div class="jp-emblem">' . Jetpack::get_jp_emblem() . '</div>';
					break;
				case 'woocommerce':
					$envelope->content->icon = '<div class="jp-emblem"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 168 100" xml:space="preserve" enable-background="new 0 0 168 100" width="50" height="30"><style type="text/css">
					.st0{clip-path:url(#SVGID_2_);enable-background:new    ;}
					.st1{clip-path:url(#SVGID_4_);}
					.st2{clip-path:url(#SVGID_6_);}
					.st3{clip-path:url(#SVGID_8_);fill:#8F567F;}
					.st4{clip-path:url(#SVGID_10_);fill:#FFFFFE;}
					.st5{clip-path:url(#SVGID_12_);fill:#FFFFFE;}
					.st6{clip-path:url(#SVGID_14_);fill:#FFFFFE;}
				</style><g><defs><polygon id="SVGID_1_" points="83.8 100 0 100 0 0.3 83.8 0.3 167.6 0.3 167.6 100 "/></defs><clipPath id="SVGID_2_"><use xlink:href="#SVGID_1_" overflow="visible"/></clipPath><g class="st0"><g><defs><rect id="SVGID_3_" width="168" height="100"/></defs><clipPath id="SVGID_4_"><use xlink:href="#SVGID_3_" overflow="visible"/></clipPath><g class="st1"><defs><path id="SVGID_5_" d="M15.6 0.3H152c8.6 0 15.6 7 15.6 15.6v52c0 8.6-7 15.6-15.6 15.6h-48.9l6.7 16.4L80.2 83.6H15.6C7 83.6 0 76.6 0 67.9v-52C0 7.3 7 0.3 15.6 0.3"/></defs><clipPath id="SVGID_6_"><use xlink:href="#SVGID_5_" overflow="visible"/></clipPath><g class="st2"><defs><rect id="SVGID_7_" width="168" height="100"/></defs><clipPath id="SVGID_8_"><use xlink:href="#SVGID_7_" overflow="visible"/></clipPath><rect x="-10" y="-9.7" class="st3" width="187.6" height="119.7"/></g></g></g></g></g><g><defs><path id="SVGID_9_" d="M8.4 14.5c1-1.3 2.4-2 4.3-2.1 3.5-0.2 5.5 1.4 6 4.9 2.1 14.3 4.4 26.4 6.9 36.4l15-28.6c1.4-2.6 3.1-3.9 5.2-4.1 3-0.2 4.9 1.7 5.6 5.7 1.7 9.1 3.9 16.9 6.5 23.4 1.8-17.4 4.8-30 9-37.7 1-1.9 2.5-2.9 4.5-3 1.6-0.1 3 0.3 4.3 1.4 1.3 1 2 2.3 2.1 3.9 0.1 1.2-0.1 2.3-0.7 3.3 -2.7 5-4.9 13.2-6.6 24.7 -1.7 11.1-2.3 19.8-1.9 26.1 0.1 1.7-0.1 3.2-0.8 4.5 -0.8 1.5-2 2.4-3.7 2.5 -1.8 0.1-3.6-0.7-5.4-2.5C52.4 66.7 47.4 57 43.7 44.1c-4.4 8.8-7.7 15.3-9.9 19.7 -4 7.7-7.5 11.7-10.3 11.9 -1.9 0.1-3.5-1.4-4.8-4.7 -3.5-9-7.3-26.3-11.3-52C7.1 17.3 7.5 15.8 8.4 14.5"/></defs><clipPath id="SVGID_10_"><use xlink:href="#SVGID_9_" overflow="visible"/></clipPath><rect x="-2.7" y="-0.6" class="st4" width="90.6" height="86.4"/></g><g><defs><path id="SVGID_11_" d="M155.6 25.2c-2.5-4.3-6.1-6.9-11-7.9 -1.3-0.3-2.5-0.4-3.7-0.4 -6.6 0-11.9 3.4-16.1 10.2 -3.6 5.8-5.3 12.3-5.3 19.3 0 5.3 1.1 9.8 3.3 13.6 2.5 4.3 6.1 6.9 11 7.9 1.3 0.3 2.5 0.4 3.7 0.4 6.6 0 12-3.4 16.1-10.2 3.6-5.9 5.3-12.4 5.3-19.4C159 33.4 157.9 28.9 155.6 25.2zM147 44.2c-0.9 4.5-2.7 7.9-5.2 10.1 -2 1.8-3.9 2.5-5.5 2.2 -1.7-0.3-3-1.8-4-4.4 -0.8-2.1-1.2-4.2-1.2-6.2 0-1.7 0.2-3.4 0.5-5 0.6-2.8 1.8-5.5 3.6-8.1 2.3-3.3 4.7-4.8 7.1-4.2 1.7 0.3 3 1.8 4 4.4 0.8 2.1 1.2 4.2 1.2 6.2C147.5 40.9 147.3 42.6 147 44.2z"/></defs><clipPath id="SVGID_12_"><use xlink:href="#SVGID_11_" overflow="visible"/></clipPath><rect x="109.6" y="6.9" class="st5" width="59.4" height="71.4"/></g><g><defs><path id="SVGID_13_" d="M112.7 25.2c-2.5-4.3-6.1-6.9-11-7.9 -1.3-0.3-2.5-0.4-3.7-0.4 -6.6 0-11.9 3.4-16.1 10.2 -3.5 5.8-5.3 12.3-5.3 19.3 0 5.3 1.1 9.8 3.3 13.6 2.5 4.3 6.1 6.9 11 7.9 1.3 0.3 2.5 0.4 3.7 0.4 6.6 0 12-3.4 16.1-10.2 3.5-5.9 5.3-12.4 5.3-19.4C116 33.4 114.9 28.9 112.7 25.2zM104.1 44.2c-0.9 4.5-2.7 7.9-5.2 10.1 -2 1.8-3.9 2.5-5.5 2.2 -1.7-0.3-3-1.8-4-4.4 -0.8-2.1-1.2-4.2-1.2-6.2 0-1.7 0.2-3.4 0.5-5 0.6-2.8 1.8-5.5 3.6-8.1 2.3-3.3 4.7-4.8 7.1-4.2 1.7 0.3 3 1.8 4 4.4 0.8 2.1 1.2 4.2 1.2 6.2C104.6 40.9 104.4 42.6 104.1 44.2z"/></defs><clipPath id="SVGID_14_"><use xlink:href="#SVGID_13_" overflow="visible"/></clipPath><rect x="66.7" y="6.9" class="st6" width="59.4" height="71.4"/></g></svg></div>';
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

add_action( 'init', array( 'Jetpack_JITM', 'init' ) );
