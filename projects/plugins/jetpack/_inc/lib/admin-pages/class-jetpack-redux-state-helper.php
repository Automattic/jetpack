<?php
/**
 * A utility class that generates the initial state for Redux in wp-admin.
 * Modularized from `class.jetpack-react-page.php`.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Blaze;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_History;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Plugin_Storage as Connection_Plugin_Storage;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use Automattic\Jetpack\Identity_Crisis;
use Automattic\Jetpack\Image_CDN\Image_CDN_Core;
use Automattic\Jetpack\Image_CDN\Image_CDN_Image;
use Automattic\Jetpack\IP\Utils as IP_Utils;
use Automattic\Jetpack\Licensing;
use Automattic\Jetpack\Licensing\Endpoints as Licensing_Endpoints;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Partner;
use Automattic\Jetpack\Partner_Coupon as Jetpack_Partner_Coupon;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * Responsible for populating the initial Redux state.
 */
class Jetpack_Redux_State_Helper {
	/**
	 * Generate minimal state for React to fetch its own data asynchronously after load
	 * This can improve user experience, reducing time spent on server requests before serving the page
	 * e.g. used by React Disconnect Dialog on plugins page where the full initial state is not needed
	 */
	public static function get_minimal_state() {
		return array(
			'pluginBaseUrl'        => plugins_url( '', JETPACK__PLUGIN_FILE ),
			/* This filter is documented in class.jetpack-connection-banner.php */
			'preConnectionHelpers' => apply_filters( 'jetpack_pre_connection_prompt_helpers', false ),
			'registrationNonce'    => wp_create_nonce( 'jetpack-registration-nonce' ),
			'WP_API_root'          => esc_url_raw( rest_url() ),
			'WP_API_nonce'         => wp_create_nonce( 'wp_rest' ),
		);
	}

	/**
	 * Generate the initial state array to be used by the Redux store.
	 */
	public static function get_initial_state() {
		global $is_safari;

		// Load API endpoint base classes and endpoints for getting the module list fed into the JS Admin Page.
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-xmlrpc-consumer-endpoint.php';
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-module-endpoints.php';
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-site-endpoints.php';

		$module_list_endpoint = new Jetpack_Core_API_Module_List_Endpoint();
		$modules              = $module_list_endpoint->get_modules();

		// Preparing translated fields for JSON encoding by transforming all HTML entities to
		// respective characters.
		foreach ( $modules as $slug => $data ) {
			$modules[ $slug ]['name']              = html_entity_decode( $data['name'], ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 );
			$modules[ $slug ]['description']       = html_entity_decode( $data['description'], ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 );
			$modules[ $slug ]['short_description'] = html_entity_decode( $data['short_description'], ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 );
			$modules[ $slug ]['long_description']  = html_entity_decode( $data['long_description'], ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 );
		}

		// "mock" a block module in order to get it searchable in the settings.
		$modules['blocks']['module']                    = 'blocks';
		$modules['blocks']['additional_search_queries'] = esc_html_x( 'blocks, block, gutenberg', 'Search terms', 'jetpack' );

		// Collecting roles that can view site stats.
		$stats_roles   = array();
		$enabled_roles = Stats_Options::get_option( 'roles' );

		if ( ! function_exists( 'get_editable_roles' ) ) {
			require_once ABSPATH . 'wp-admin/includes/user.php';
		}
		foreach ( get_editable_roles() as $slug => $role ) {
			$stats_roles[ $slug ] = array(
				'name'    => translate_user_role( $role['name'] ),
				'canView' => is_array( $enabled_roles ) ? in_array( $slug, $enabled_roles, true ) : false,
			);
		}

		// Get information about current theme.
		$current_theme = wp_get_theme();

		// Get all themes that Infinite Scroll provides support for natively.
		$inf_scr_support_themes = array();
		foreach ( Jetpack::glob_php( JETPACK__PLUGIN_DIR . 'modules/infinite-scroll/themes' ) as $path ) {
			if ( is_readable( $path ) ) {
				$inf_scr_support_themes[] = basename( $path, '.php' );
			}
		}

		// Get last post, to build the link to Customizer in the Related Posts module.
		$last_post = get_posts( array( 'posts_per_page' => 1 ) );
		$last_post = isset( $last_post[0] ) && $last_post[0] instanceof WP_Post
			? get_permalink( $last_post[0]->ID )
			: get_home_url();

		$current_user_data = jetpack_current_user_data();

		/**
		 * Adds information to the `connectionStatus` API field that is unique to the Jetpack React dashboard.
		 */
		$connection_status = array(
			'isInIdentityCrisis' => Identity_Crisis::validate_sync_error_idc_option(),
			'sandboxDomain'      => JETPACK__SANDBOX_DOMAIN,

			/**
			 * Filter to add connection errors
			 * Format: array( array( 'code' => '...', 'message' => '...', 'action' => '...' ), ... )
			 *
			 * @since 8.7.0
			 *
			 * @param array $errors Connection errors.
			 */
			'errors'             => apply_filters( 'react_connection_errors_initial_state', array() ),
		);

		$connection_status = array_merge( REST_Connector::connection_status( false ), $connection_status );

		$host = new Host();

		$speed_score_history = new Speed_Score_History( wp_parse_url( get_site_url(), PHP_URL_HOST ) );

		return array(
			'WP_API_root'                 => esc_url_raw( rest_url() ),
			'WP_API_nonce'                => wp_create_nonce( 'wp_rest' ),
			'registrationNonce'           => wp_create_nonce( 'jetpack-registration-nonce' ),
			'purchaseToken'               => self::get_purchase_token(),
			'partnerCoupon'               => Jetpack_Partner_Coupon::get_coupon(),
			'pluginBaseUrl'               => plugins_url( '', JETPACK__PLUGIN_FILE ),
			'connectionStatus'            => $connection_status,
			'connectedPlugins'            => Connection_Plugin_Storage::get_all(),
			'connectUrl'                  => false == $current_user_data['isConnected'] // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
				? Jetpack::init()->build_connect_url( true, false, false )
				: '',
			'dismissedNotices'            => self::get_dismissed_jetpack_notices(),
			'isDevVersion'                => Jetpack::is_development_version(),
			'currentVersion'              => JETPACK__VERSION,
			'is_gutenberg_available'      => true,
			'getModules'                  => $modules,
			'rawUrl'                      => ( new Status() )->get_site_suffix(),
			'adminUrl'                    => esc_url( admin_url() ),
			'siteTitle'                   => (string) htmlspecialchars_decode( get_option( 'blogname' ), ENT_QUOTES ),
			'stats'                       => array(
				// data is populated asynchronously on page load.
				'data'  => array(
					'general' => false,
					'day'     => false,
					'week'    => false,
					'month'   => false,
				),
				'roles' => $stats_roles,
			),
			'aff'                         => Partner::init()->get_partner_code( Partner::AFFILIATE_CODE ),
			'partnerSubsidiaryId'         => Partner::init()->get_partner_code( Partner::SUBSIDIARY_CODE ),
			'settings'                    => self::get_flattened_settings(),
			'userData'                    => array(
				'currentUser' => $current_user_data,
			),
			'siteData'                    => array(
				'blog_id'                    => Jetpack_Options::get_option( 'id', 0 ),
				'icon'                       => has_site_icon()
					? apply_filters( 'jetpack_photon_url', get_site_icon_url(), array( 'w' => 64 ) )
					: '',
				'siteVisibleToSearchEngines' => '1' == get_option( 'blog_public' ), // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
				/**
				 * Whether promotions are visible or not.
				 *
				 * @since 4.8.0
				 *
				 * @param bool $are_promotions_active Status of promotions visibility. True by default.
				 */
				'showPromotions'             => apply_filters( 'jetpack_show_promotions', true ),
				'isAtomicSite'               => $host->is_woa_site(),
				'isWoASite'                  => $host->is_woa_site(),
				'isAtomicPlatform'           => $host->is_atomic_platform(),
				'plan'                       => Jetpack_Plan::get(),
				'showBackups'                => Jetpack::show_backups_ui(),
				'showRecommendations'        => Jetpack_Recommendations::is_enabled(),
				/** This filter is documented in my-jetpack/src/class-initializer.php */
				'showMyJetpack'              => My_Jetpack_Initializer::should_initialize(),
				'isMultisite'                => is_multisite(),
				'dateFormat'                 => get_option( 'date_format' ),
				'latestBoostSpeedScores'     => $speed_score_history->latest(),
			),
			'themeData'                   => array(
				'name'      => $current_theme->get( 'Name' ),
				'hasUpdate' => (bool) get_theme_update_available( $current_theme ),
				'support'   => array(
					'infinite-scroll' => current_theme_supports( 'infinite-scroll' ) || in_array( $current_theme->get_stylesheet(), $inf_scr_support_themes, true ),
					'widgets'         => current_theme_supports( 'widgets' ),
					'webfonts'        => (
						// @todo Remove conditional once we drop support for WordPress 6.1
						function_exists( 'wp_theme_has_theme_json' ) ? wp_theme_has_theme_json() : WP_Theme_JSON_Resolver::theme_has_support()
					) && function_exists( 'wp_register_webfont_provider' ) && function_exists( 'wp_register_webfonts' ),
				),
			),
			'jetpackStateNotices'         => array(
				'messageCode'      => Jetpack::state( 'message' ),
				'errorCode'        => Jetpack::state( 'error' ),
				'errorDescription' => Jetpack::state( 'error_description' ),
				'messageContent'   => Jetpack::state( 'display_update_modal' ) ? self::get_update_modal_data() : null,
			),
			'tracksUserData'              => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
			'currentIp'                   => IP_Utils::get_ip(),
			'lastPostUrl'                 => esc_url( $last_post ),
			'externalServicesConnectUrls' => self::get_external_services_connect_urls(),
			'calypsoEnv'                  => Jetpack::get_calypso_env(),
			'products'                    => Jetpack::get_products_for_purchase(),
			'recommendationsStep'         => Jetpack_Core_Json_Api_Endpoints::get_recommendations_step()['step'],
			'isSafari'                    => $is_safari || User_Agent_Info::is_opera_desktop(), // @todo Rename isSafari everywhere.
			'doNotUseConnectionIframe'    => Constants::is_true( 'JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME' ),
			'licensing'                   => array(
				'error'                   => Licensing::instance()->last_error(),
				'showLicensingUi'         => Licensing::instance()->is_licensing_input_enabled(),
				'userCounts'              => Licensing_Endpoints::get_user_license_counts(),
				'activationNoticeDismiss' => Licensing::instance()->get_license_activation_notice_dismiss(),
			),
			'hasSeenWCConnectionModal'    => Jetpack_Options::get_option( 'has_seen_wc_connection_modal', false ),
			'newRecommendations'          => Jetpack_Recommendations::get_new_conditional_recommendations(),
			// Check if WooCommerce plugin is active (based on https://docs.woocommerce.com/document/create-a-plugin/).
			'isWooCommerceActive'         => in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', Jetpack::get_active_plugins() ), true ),
			'useMyJetpackLicensingUI'     => My_Jetpack_Initializer::is_licensing_ui_enabled(),
			'isOdysseyStatsEnabled'       => Stats_Options::get_option( 'enable_odyssey_stats' ),
			'shouldInitializeBlaze'       => Blaze::should_initialize(),
			'isBlazeDashboardEnabled'     => Blaze::is_dashboard_enabled(),
		);
	}

	/**
	 * Gets array of any Jetpack notices that have been dismissed.
	 *
	 * @return mixed|void
	 */
	public static function get_dismissed_jetpack_notices() {
		$jetpack_dismissed_notices = get_option( 'jetpack_dismissed_notices', array() );
		/**
		 * Array of notices that have been dismissed.
		 *
		 * @param array $jetpack_dismissed_notices If empty, will not show any Jetpack notices.
		 */
		$dismissed_notices = apply_filters( 'jetpack_dismissed_notices', $jetpack_dismissed_notices );
		return $dismissed_notices;
	}

	/**
	 * Returns an array of modules and settings both as first class members of the object.
	 *
	 * @return array flattened settings with modules.
	 */
	public static function get_flattened_settings() {
		$core_api_endpoint = new Jetpack_Core_API_Data();
		$settings          = $core_api_endpoint->get_all_options();
		return $settings->data;
	}

	/**
	 * Returns the release post content and image data as an associative array.
	 * This data is used to create the update modal.
	 */
	public static function get_update_modal_data() {
		$post_data = self::get_release_post_data();

		if ( ! isset( $post_data['posts'][0] ) ) {
			return;
		}

		$post = $post_data['posts'][0];

		if ( empty( $post['content'] ) ) {
			return;
		}

		// This allows us to embed videopress videos into the release post.
		add_filter( 'wp_kses_allowed_html', array( __CLASS__, 'allow_post_embed_iframe' ), 10, 2 );
		$content = wp_kses_post( $post['content'] );
		remove_filter( 'wp_kses_allowed_html', array( __CLASS__, 'allow_post_embed_iframe' ), 10, 2 );

		$post_title = isset( $post['title'] ) ? $post['title'] : null;
		$title      = wp_kses( $post_title, array() );

		$post_thumbnail = isset( $post['post_thumbnail'] ) ? $post['post_thumbnail'] : null;
		if ( ! empty( $post_thumbnail ) ) {
			$photon_image = new Image_CDN_Image(
				array(
					'file'   => Image_CDN_Core::cdn_url( $post_thumbnail['URL'] ),
					'width'  => $post_thumbnail['width'],
					'height' => $post_thumbnail['height'],
				),
				$post_thumbnail['mime_type']
			);
			$photon_image->resize(
				array(
					'width'  => 600,
					'height' => null,
					'crop'   => false,
				)
			);
			$post_thumbnail_url = $photon_image->get_raw_filename();
		} else {
			$post_thumbnail_url = null;
		}

		$post_array = array(
			'release_post_content'        => $content,
			'release_post_featured_image' => $post_thumbnail_url,
			'release_post_title'          => $title,
		);

		return $post_array;
	}

	/**
	 * Temporarily allow post content to contain iframes, e.g. for videopress.
	 *
	 * @param string $tags    The tags.
	 * @param string $context The context.
	 */
	public static function allow_post_embed_iframe( $tags, $context ) {
		if ( 'post' === $context ) {
			$tags['iframe'] = array(
				'src'             => true,
				'height'          => true,
				'width'           => true,
				'frameborder'     => true,
				'allowfullscreen' => true,
			);
		}

		return $tags;
	}

	/**
	 * Obtains the release post from the Jetpack release post blog. A release post will be displayed in the
	 * update modal when a post has a tag equal to the Jetpack version number.
	 *
	 * The response parameters for the post array can be found here:
	 * https://developer.wordpress.com/docs/api/1.1/get/sites/%24site/posts/%24post_ID/#apidoc-response
	 *
	 * @return array|null Returns an associative array containing the release post data at index ['posts'][0].
	 *                    Returns null if the release post data is not available.
	 */
	public static function get_release_post_data() {
		if ( Constants::is_defined( 'TESTING_IN_JETPACK' ) && Constants::get_constant( 'TESTING_IN_JETPACK' ) ) {
			return null;
		}

		$release_post_src = add_query_arg(
			array(
				'order_by' => 'date',
				'tag'      => JETPACK__VERSION,
				'number'   => '1',
			),
			'https://public-api.wordpress.com/rest/v1/sites/' . JETPACK__RELEASE_POST_BLOG_SLUG . '/posts'
		);

		$response = wp_remote_get( $release_post_src );

		if ( ! is_array( $response ) ) {
			return null;
		}

		return json_decode( wp_remote_retrieve_body( $response ), true );
	}

	/**
	 * Get external services connect URLs.
	 */
	public static function get_external_services_connect_urls() {
		$connect_urls = array();
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/class.jetpack-keyring-service-helper.php';
		// phpcs:disable
		foreach ( Jetpack_Keyring_Service_Helper::SERVICES as $service_name => $service_info ) {
			// phpcs:enable
			$connect_urls[ $service_name ] = Jetpack_Keyring_Service_Helper::connect_url( $service_name, $service_info['for'] );
		}
		return $connect_urls;
	}

	/**
	 * Gets a purchase token that is used for Jetpack logged out visitor checkout.
	 * The purchase token should be appended to all CTA url's that lead to checkout.
	 *
	 * @since 9.8.0
	 * @return string|boolean
	 */
	public static function get_purchase_token() {
		if ( ! Jetpack::current_user_can_purchase() ) {
			return false;
		}

		$purchase_token = Jetpack_Options::get_option( 'purchase_token', false );

		if ( $purchase_token ) {
			return $purchase_token;
		}
		// If the purchase token is not saved in the options table yet, then add it.
		Jetpack_Options::update_option( 'purchase_token', self::generate_purchase_token(), true );
		return Jetpack_Options::get_option( 'purchase_token', false );
	}

	/**
	 * Generates a purchase token that is used for Jetpack logged out visitor checkout.
	 *
	 * @since 9.8.0
	 * @return string
	 */
	public static function generate_purchase_token() {
		return wp_generate_password( 12, false );
	}
}

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move these functions to some other file.

/**
 * Gather data about the current user.
 *
 * @since 4.1.0
 *
 * @return array
 */
function jetpack_current_user_data() {
	$jetpack_connection = new Connection_Manager( 'jetpack' );

	$current_user      = wp_get_current_user();
	$is_user_connected = $jetpack_connection->is_user_connected( $current_user->ID );
	$is_master_user    = $is_user_connected && (int) $current_user->ID && (int) Jetpack_Options::get_option( 'master_user' ) === (int) $current_user->ID;
	$dotcom_data       = $jetpack_connection->get_connected_user_data();

	// Add connected user gravatar to the returned dotcom_data.
	// Probably we shouldn't do this when $dotcom_data is false, but we have been since 2016 so
	// clients probably expect that by now.
	if ( false === $dotcom_data ) {
		$dotcom_data = array();
	}
	$dotcom_data['avatar'] = ( ! empty( $dotcom_data['email'] ) ?
		get_avatar_url(
			$dotcom_data['email'],
			array(
				'size'    => 64,
				'default' => 'mysteryman',
			)
		)
		: false );

	$current_user_data = array(
		'isConnected' => $is_user_connected,
		'isMaster'    => $is_master_user,
		'username'    => $current_user->user_login,
		'id'          => $current_user->ID,
		'wpcomUser'   => $dotcom_data,
		'gravatar'    => get_avatar_url( $current_user->ID, 64, 'mm', '', array( 'force_display' => true ) ),
		'permissions' => array(
			'admin_page'         => current_user_can( 'jetpack_admin_page' ),
			'connect'            => current_user_can( 'jetpack_connect' ),
			'connect_user'       => current_user_can( 'jetpack_connect_user' ),
			'disconnect'         => current_user_can( 'jetpack_disconnect' ),
			'manage_modules'     => current_user_can( 'jetpack_manage_modules' ),
			'network_admin'      => current_user_can( 'jetpack_network_admin_page' ),
			'network_sites_page' => current_user_can( 'jetpack_network_sites_page' ),
			'edit_posts'         => current_user_can( 'edit_posts' ),
			'publish_posts'      => current_user_can( 'publish_posts' ),
			'manage_options'     => current_user_can( 'manage_options' ),
			'view_stats'         => current_user_can( 'view_stats' ),
			'manage_plugins'     => current_user_can( 'install_plugins' )
									&& current_user_can( 'activate_plugins' )
									&& current_user_can( 'update_plugins' )
									&& current_user_can( 'delete_plugins' ),
		),
	);

	return $current_user_data;
}
