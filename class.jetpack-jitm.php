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
	 * @return Jetpack_JITM
	 */
	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_JITM;
		}

		return self::$instance;
	}

	/**
	 * Jetpack_JITM constructor.
	 */
	private function __construct() {
		if ( ! Jetpack::is_active() ) {
			return;
		}
		add_action( 'current_screen', array( $this, 'prepare_jitms' ) );
	}

	/**
	 * Get's the Jetpack emblem
	 *
	 * @return string The Jetpack emblem
	 */
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
		add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
		add_action( 'admin_notices', array( $this, 'ajax_message' ) );
		add_action( 'edit_form_top', array( $this, 'ajax_message' ) );
	}

	/**
	 * A special filter for WooCommerce, to set a message based on local state.
	 *
	 * @param $message string The current message
	 *
	 * @return string The new message
	 */
	static function jitm_woocommerce_services_msg( $message ) {
		if ( ! function_exists( 'wc_get_base_location' ) ) {
			return '';
		}

		$base_location = wc_get_base_location();

		switch ( $base_location['country'] ) {
			case 'US':
				return __( 'New free service: Show USPS shipping rates on your store! Added bonus: print shipping labels without leaving WooCommerce.', 'jetpack' );
				break;
			case 'CA':
				return __( 'New free service: Show Canada Post shipping rates on your store!', 'jetpack' );
				break;
			default:
				return '';
		}
	}

	/**
	 * A special filter for WooCommerce Call To Action button
	 *
	 * @param $CTA string The existing CTA
	 *
	 * @return string The new CTA
	 */
	static function jitm_jetpack_woo_services_install( $CTA ) {
		return wp_nonce_url( add_query_arg( array( 'wc-services-action' => 'install' ), '/wp-admin/admin.php?page=wc-settings' ), 'wc-services-install' );
	}

	/**
	 * A special filter for WooCommerce Call To Action button
	 *
	 * @param $CTA string The existing CTA
	 *
	 * @return string The new CTA
	 */
	static function jitm_jetpack_woo_services_activate( $CTA ) {
		return wp_nonce_url( add_query_arg( array( 'wc-services-action' => 'activate' ), '/wp-admin/admin.php?page=wc-settings' ), 'wc-services-install' );
	}

	/**
	 * Injects the dom to show a JITM inside of
	 */
	function ajax_message() {
		$message_path = $this->get_message_path();
		$query_string = _http_build_query($_GET, '', ',');

		?>
		<div class="jetpack-jitm-message"
		     data-nonce="<?php echo wp_create_nonce( 'wp_rest' ) ?>"
		     data-message-path="<?php echo esc_attr( $message_path ) ?>"
		     data-query="<?php echo urlencode_deep( $query_string ) ?>"
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
		$wp_styles = new WP_Styles();
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
		wp_enqueue_style( 'jetpack-jitm-css', plugins_url( "css/jetpack-admin-jitm{$min}.css", JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION . '-201243242' );
		$wp_styles->add_data( 'jetpack-jitm-css', 'rtl', true );

		wp_enqueue_script( 'jetpack-jitm-new', plugins_url( '_inc/jetpack-jitm.js', JETPACK__PLUGIN_FILE ), array( 'jquery' ), JETPACK__VERSION, true );
		wp_localize_script('jetpack-jitm-new', 'jitm_config', array(
				'api_root' => esc_url_raw( rest_url() ),
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
		// todo: track dismissal of id and feature class?
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
	static function get_messages( $message_path, $query ) {
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
			'force'                => 'wpcom',
			'external_user_id'     => urlencode_deep( $user->ID ),
			'user_roles'           => urlencode_deep( implode( ',', $user->roles ) ),
			'query_string'         => urlencode_deep( $query ),
		), sprintf( '/sites/%d/jitm/%s', $site_id, $message_path ) );

		// attempt to get from cache
		$envelopes  = get_transient( 'jetpack_jitm_' . $path );
		$from_cache = false;

		// if something is in the cache and it was put in the cache after the last heartbeat, use it
		if ( $envelopes && Jetpack_Options::get_option( 'last_heartbeat', time() ) < $envelopes['response_time'] ) {
			$from_cache = true;
		}

		// otherwise, ask again
		if ( ! $from_cache ) {
			$from_cache     = false;
			$wpcom_response = Jetpack_Client::wpcom_json_api_request_as_blog(
				$path,
				'1.1',
				array(
					'user_id'    => $user->ID,
					'user_roles' => implode( ',', $user->roles ),
				)
			);

			// silently fail...might be helpful to track it?
			if ( is_wp_error( $wpcom_response ) ) {
				return array();
			}

			$envelopes = json_decode( $wpcom_response['body'] );

			if ( ! is_array( $envelopes ) ) {
				return array();
			}

			$expiration                 = isset( $envelopes[0] ) ? $envelopes[0]->ttl : 300;
			$envelopes['response_time'] = time();

			set_transient( 'jetpack_jitm_' . $path, $envelopes, $expiration );
		}

		$hidden_jitms = Jetpack_Options::get_option( 'hide_jitm' );
		unset( $envelopes['response_time'] );

		foreach ( $envelopes as $idx => &$envelope ) {

			$dismissed_feature = isset( $hidden_jitms[ $envelope->feature_class ] ) && is_array( $hidden_jitms[ $envelope->feature_class ] ) ? $hidden_jitms[ $envelope->feature_class ] : null;

			// if the this feature class has been dismissed and the request has not expired from the cache, skip it as it's been dismissed
			if ( is_array( $dismissed_feature ) && $from_cache && time() - $dismissed_feature['last_dismissal'] < $expiration + 60 ) {
				unset( $envelopes[ $idx ] );
				continue;
			}

			$normalized_site_url      = Jetpack::build_raw_urls( get_home_url() );
			$envelope->url            = 'https://jetpack.com/redirect/?source=jitm-' . $envelope->id . '&site=' . $normalized_site_url;
			$envelope->jitm_stats_url = Jetpack::build_stats_url( array( 'x_jetpack-jitm' => $envelope->id ) );

			if ( $envelope->CTA->hook ) {
				$envelope->url = apply_filters( 'jitm_' . $envelope->CTA->hook, $envelope->url ) ;
				unset( $envelope->CTA->hook );
			}

			if ( isset( $envelope->content->hook ) ) {
				$envelope->content->message = esc_html( apply_filters( 'jitm_' . $envelope->content->hook, $envelope->content->message ) );
				unset( $envelope->content->hook );
			}

			// no point in showing an empty message
			if ( empty( $envelope->content->message ) ) {
				return array();
			}

			switch ( $envelope->content->icon ) {
				case 'jetpack':
					$envelope->content->icon = '<div class="jp-emblem">' . Jetpack::get_jp_emblem() . '</div>';
					break;
				case 'woocommerce':
					$envelope->content->icon = "<div class=\"jp-emblem\"><svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" id=\"Layer_1\" x=\"0\" y=\"0\" viewBox=\"0 0 24 24\" enable-background=\"new 0 0 24 24\" xml:space=\"preserve\">
 					<path d=\"M18,8h-2V7c0-1.105-0.895-2-2-2H4C2.895,5,2,5.895,2,7v10h2c0,1.657,1.343,3,3,3s3-1.343,3-3h4c0,1.657,1.343,3,3,3s3-1.343,3-3h2v-5L18,8z M7,18.5c-0.828,0-1.5-0.672-1.5-1.5s0.672-1.5,1.5-1.5s1.5,0.672,1.5,1.5S7.828,18.5,7,18.5z M4,14V7h10v7H4z M17,18.5c-0.828,0-1.5-0.672-1.5-1.5s0.672-1.5,1.5-1.5s1.5,0.672,1.5,1.5S17.828,18.5,17,18.5z\" />
 				</svg></div>";
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
