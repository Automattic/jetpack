<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Jetpack_Options;
use Jetpack_Search_Options;

/**
 * The React initial state.
 */
class Initial_State {
	/**
	 * Connection Manager
	 *
	 * @var Connection_Manager
	 */
	protected $connection_manager;

	/**
	 * Constructor
	 */
	public function __construct() {
		// TODO: chanage the slug?
		$this->connection_manager = new Connection_Manager( 'jetpack-search' );
	}

	/**
	 * Render JS for the initial state
	 *
	 * @return string - JS string.
	 */
	public function render() {
		return 'var JETPACK_SEARCH_DASHBOARD_INITIAL_STATE=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->get_initial_state() ) ) . '"));';
	}

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	public function get_initial_state() {
		return array(
			'siteData'        => array(
				'WP_API_root'       => esc_url_raw( rest_url() ),
				'WP_API_nonce'      => wp_create_nonce( 'wp_rest' ),
				'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
				'purchaseToken'     => $this->get_purchase_token(),
				/**
				 * Whether promotions are visible or not.
				 *
				 * @since 4.8.0
				 *
				 * @param bool $are_promotions_active Status of promotions visibility. True by default.
				 */
				'showPromotions'    => apply_filters( 'jetpack_show_promotions', true ),
				'adminUrl'          => esc_url( admin_url() ),
				'blogId'            => Jetpack_Options::get_option( 'id', 0 ),
				'version'           => defined( 'JETPACK_SEARCH_PACKAGE_VERSION' ) ? JETPACK_SEARCH_PACKAGE_VERSION : 'dev',
				'calypsoSlug'       => ( new Status() )->get_site_suffix(),
			),
			'userData'        => array(
				'currentUser' => $this->current_user_data(),
			),
			'jetpackSettings' => array(
				'search'                 => Jetpack_Search_Options::is_module_enabled(),
				'instant_search_enabled' => Jetpack_Search_Options::is_instant_enabled(),
			),
		);
	}

	/**
	 * Gather data about the current user.
	 *
	 * @since 4.1.0
	 *
	 * @return array
	 */
	protected function current_user_data() {
		$current_user      = wp_get_current_user();
		$is_user_connected = $this->connection_manager->is_user_connected( $current_user->ID );
		$is_master_user    = $is_user_connected && (int) $current_user->ID && (int) Jetpack_Options::get_option( 'master_user' ) === (int) $current_user->ID;
		$dotcom_data       = $this->connection_manager->get_connected_user_data();

		// Add connected user gravatar to the returned dotcom_data.
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

	/**
	 * Gets a purchase token that is used for Jetpack logged out visitor checkout.
	 * The purchase token should be appended to all CTA url's that lead to checkout.
	 *
	 * @since 9.8.0
	 * @return string|boolean
	 */
	protected function get_purchase_token() {
		if ( ! $this->current_user_can_purchase() ) {
			return false;
		}

		$purchase_token = Jetpack_Options::get_option( 'purchase_token', false );

		if ( $purchase_token ) {
			return $purchase_token;
		}
		// If the purchase token is not saved in the options table yet, then add it.
		Jetpack_Options::update_option( 'purchase_token', $this->generate_purchase_token(), true );
		return Jetpack_Options::get_option( 'purchase_token', false );
	}

	/**
	 * Generates a purchase token that is used for Jetpack logged out visitor checkout.
	 *
	 * @since 9.8.0
	 * @return string
	 */
	protected function generate_purchase_token() {
		return wp_generate_password( 12, false );
	}

	/**
	 * Determine if the current user is allowed to make Jetpack purchases without
	 * a WordPress.com account
	 *
	 * @return boolean True if the user can make purchases, false if not
	 */
	public function current_user_can_purchase() {
		// The site must be site-connected to Jetpack (no users connected).
		if ( ! $this->connection_manager->is_site_connection() ) {
			return false;
		}

		// Make sure only administrators can make purchases.
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		return true;
	}
}
