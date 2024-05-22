<?php
/**
 * Authorize_Redirect Webhook handler class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\Webhooks;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Licensing;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Tracking;
use GP_Locales;
use Jetpack_Network;

/**
 * Authorize_Redirect Webhook handler class.
 */
class Authorize_Redirect {
	/**
	 * The Connection Manager object.
	 *
	 * @var \Automattic\Jetpack\Connection\Manager
	 */
	private $connection;

	/**
	 * Constructs the object
	 *
	 * @param \Automattic\Jetpack\Connection\Manager $connection The Connection Manager object.
	 */
	public function __construct( $connection ) {
		$this->connection = $connection;
	}

	/**
	 * Handle the webhook
	 *
	 * This method implements what's in Jetpack::admin_page_load when the Jetpack plugin is not present
	 *
	 * @return never
	 */
	public function handle() {

		add_filter(
			'allowed_redirect_hosts',
			function ( $domains ) {
				$domains[] = 'jetpack.com';
				$domains[] = 'jetpack.wordpress.com';
				$domains[] = 'wordpress.com';
				// Calypso envs.
				$domains[] = 'calypso.localhost';
				$domains[] = 'wpcalypso.wordpress.com';
				$domains[] = 'horizon.wordpress.com';
				return array_unique( $domains );
			}
		);

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$dest_url = empty( $_GET['dest_url'] ) ? null : esc_url_raw( wp_unslash( $_GET['dest_url'] ) );

		if ( ! $dest_url || ( 0 === stripos( $dest_url, 'https://jetpack.com/' ) && 0 === stripos( $dest_url, 'https://wordpress.com/' ) ) ) {
			// The destination URL is missing or invalid, nothing to do here.
			exit;
		}

		// The user is either already connected, or finished the connection process.
		if ( $this->connection->is_connected() && $this->connection->is_user_connected() ) {
			if ( class_exists( '\Automattic\Jetpack\Licensing' ) && method_exists( '\Automattic\Jetpack\Licensing', 'handle_user_connected_redirect' ) ) {
				Licensing::instance()->handle_user_connected_redirect( $dest_url );
			}

			wp_safe_redirect( $dest_url );
			exit;
		} elseif ( ! empty( $_GET['done'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			// The user decided not to proceed with setting up the connection.

			wp_safe_redirect( Admin_Menu::get_top_level_menu_item_url() );
			exit;
		}

		$redirect_args = array(
			'page'     => 'jetpack',
			'action'   => 'authorize_redirect',
			'dest_url' => rawurlencode( $dest_url ),
			'done'     => '1',
		);

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! empty( $_GET['from'] ) && 'jetpack_site_only_checkout' === $_GET['from'] ) {
			$redirect_args['from'] = 'jetpack_site_only_checkout';
		}

		wp_safe_redirect( $this->build_authorize_url( add_query_arg( $redirect_args, admin_url( 'admin.php' ) ) ) );
		exit;
	}

	/**
	 * Create the Jetpack authorization URL.
	 *
	 * @since 2.7.6 Added optional $from and $raw parameters.
	 *
	 * @param bool|string $redirect URL to redirect to.
	 * @param bool|string $from     If not false, adds 'from=$from' param to the connect URL.
	 * @param bool        $raw If true, URL will not be escaped.
	 *
	 * @todo Update default value for redirect since the called function expects a string.
	 *
	 * @return mixed|void
	 */
	public function build_authorize_url( $redirect = false, $from = false, $raw = false ) {

		add_filter( 'jetpack_connect_request_body', array( __CLASS__, 'filter_connect_request_body' ) );
		add_filter( 'jetpack_connect_redirect_url', array( __CLASS__, 'filter_connect_redirect_url' ) );

		$url = $this->connection->get_authorization_url( wp_get_current_user(), $redirect, $from, $raw );

		remove_filter( 'jetpack_connect_request_body', array( __CLASS__, 'filter_connect_request_body' ) );
		remove_filter( 'jetpack_connect_redirect_url', array( __CLASS__, 'filter_connect_redirect_url' ) );

		/**
		 * Filter the URL used when authorizing a user to a WordPress.com account.
		 *
		 * @since jetpack-8.9.0
		 * @since 2.7.6 Added $raw parameter.
		 *
		 * @param string $url Connection URL.
		 * @param bool   $raw If true, URL will not be escaped.
		 */
		return apply_filters( 'jetpack_build_authorize_url', $url, $raw );
	}

	/**
	 * Filters the redirection URL that is used for connect requests. The redirect
	 * URL should return the user back to the My Jetpack page.
	 *
	 * @param string $redirect the default redirect URL used by the package.
	 * @return string the modified URL.
	 */
	public static function filter_connect_redirect_url( $redirect ) {
		$jetpack_admin_page = esc_url_raw( admin_url( 'admin.php?page=my-jetpack' ) );
		$redirect           = $redirect
			? wp_validate_redirect( esc_url_raw( $redirect ), $jetpack_admin_page )
			: $jetpack_admin_page;

		if (
			class_exists( 'Jetpack_Network' )
			&& isset( $_REQUEST['is_multisite'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		) {
			$redirect = Jetpack_Network::init()->get_url( 'network_admin_page' );
		}

		return $redirect;
	}

	/**
	 * Filters the connection URL parameter array.
	 *
	 * @param array $args default URL parameters used by the package.
	 * @return array the modified URL arguments array.
	 */
	public static function filter_connect_request_body( $args ) {
		if (
			Constants::is_defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' )
			&& include_once Constants::get_constant( 'JETPACK__GLOTPRESS_LOCALES_PATH' )
		) {
			$gp_locale      = GP_Locales::by_field( 'wp_locale', get_locale() );
			$args['locale'] = isset( $gp_locale ) && isset( $gp_locale->slug )
				? $gp_locale->slug
				: '';
		}

		$tracking        = new Tracking();
		$tracks_identity = $tracking->tracks_get_identity( $args['state'] );

		$args = array_merge(
			$args,
			array(
				'_ui' => $tracks_identity['_ui'],
				'_ut' => $tracks_identity['_ut'],
			)
		);

		$calypso_env = ( new Host() )->get_calypso_env();

		if ( ! empty( $calypso_env ) ) {
			$args['calypso_env'] = $calypso_env;
		}

		return $args;
	}

	/**
	 * Return Calypso environment value; used for developing Jetpack and pairing
	 * it with different Calypso enrionments, such as localhost.
	 * Copied from Jetpack class.
	 *
	 * @deprecated 2.7.6
	 *
	 * @since 1.37.1
	 *
	 * @return string Calypso environment
	 */
	public static function get_calypso_env() {
		_deprecated_function( __METHOD__, '2.7.6', 'Automattic\\Jetpack\\Status\\Host::get_calypso_env' );

		return ( new Host() )->get_calypso_env();
	}
}
