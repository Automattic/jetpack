<?php
/**
 * The WordPress.com record for the current site.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Jetpack_Options;
use WP_Error;
use WP_REST_Server;

/**
 * Fetches the site's own record from the WordPress.com `/sites/%d` endpoint and exposes it
 * over `jetpack/v4/site`.
 *
 * @since $$next-version$$
 */
class Site_Data {

	/**
	 * Register the REST route.
	 *
	 * @since $$next-version$$
	 */
	public static function register_rest_routes() {
		register_rest_route(
			'jetpack/v4',
			'/site',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'rest_get_site_data' ),
				'permission_callback' => array( __CLASS__, 'permission_check' ),
			)
		);
	}

	/**
	 * Whether the current user may read the site record.
	 *
	 * Gated on the `jetpack_admin_page` meta capability, mapped by the Jetpack plugin when present
	 * and by {@see Manager::jetpack_admin_page_fallback_cap()} otherwise. The check must stay on the
	 * meta capability so that a `map_meta_cap` filter tightening access is obeyed.
	 *
	 * @since $$next-version$$
	 *
	 * @return true|WP_Error
	 */
	public static function permission_check() {
		if ( current_user_can( 'jetpack_admin_page' ) ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_view_admin',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Fetch the site record from WordPress.com.
	 *
	 * @since $$next-version$$
	 *
	 * @return object|WP_Error
	 */
	public static function get() {
		$site_id = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			return new WP_Error( 'site_id_missing', '', array( 'api_error_code' => 'site_id_missing' ) );
		}

		$args = array( 'headers' => array() );

		// Allow use a store sandbox. Internal ref: PCYsg-IA-p2.
		if ( isset( $_COOKIE ) && isset( $_COOKIE['store_sandbox'] ) ) {
			// Keep only RFC 6265 cookie-octets so the value cannot break out of the Cookie header.
			$secret                    = preg_replace( '/[^\x21-\x7E]|[";,\\\\]/', '', filter_var( wp_unslash( $_COOKIE['store_sandbox'] ) ) );
			$args['headers']['Cookie'] = "store_sandbox=$secret;";
		}

		$response = Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d', $site_id ) . '?force=wpcom', '1.1', $args );
		$body     = wp_remote_retrieve_body( $response );
		$data     = $body ? json_decode( $body ) : null;

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			$error_info = array(
				'api_error_code' => null,
				'api_http_code'  => wp_remote_retrieve_response_code( $response ),
			);

			if ( is_wp_error( $response ) ) {
				$error_info['api_error_code'] = $response->get_error_code() ? wp_strip_all_tags( $response->get_error_code() ) : null;
			} elseif ( $data && ! empty( $data->error ) ) {
				$error_info['api_error_code'] = $data->error;
			}

			return new WP_Error( 'site_data_fetch_failed', '', $error_info );
		}

		// `jetpack-plans` depends on this package, so the reverse dependency cannot be declared.
		if ( class_exists( 'Automattic\\Jetpack\\Current_Plan' ) ) {
			\Automattic\Jetpack\Current_Plan::update_from_sites_response( $response );
		}

		return $data;
	}

	/**
	 * REST callback returning the site record.
	 *
	 * @since $$next-version$$
	 *
	 * @return WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public static function rest_get_site_data() {
		$site_data = self::get();

		if ( ! is_wp_error( $site_data ) ) {
			/**
			 * Fires when the site data was successfully returned from the /sites/%d wpcom endpoint.
			 *
			 * @since $$next-version$$
			 * @since-jetpack 8.7.0
			 */
			do_action( 'jetpack_get_site_data_success' );

			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => esc_html__( 'Site data correctly received.', 'jetpack-connection' ),
					'data'    => wp_json_encode( $site_data, JSON_UNESCAPED_SLASHES ),
				)
			);
		}

		$error_data = $site_data->get_error_data();

		if ( empty( $error_data['api_error_code'] ) ) {
			$error_message = esc_html__( 'Failed fetching site data from WordPress.com. If the problem persists, try reconnecting Jetpack.', 'jetpack-connection' );
		} else {
			/* translators: %s is an error code (e.g. `token_mismatch`) */
			$error_message = sprintf( esc_html__( 'Failed fetching site data from WordPress.com (%s). If the problem persists, try reconnecting Jetpack.', 'jetpack-connection' ), $error_data['api_error_code'] );
		}

		return new WP_Error(
			$site_data->get_error_code(),
			$error_message,
			array(
				'status'         => 400,
				'api_error_code' => empty( $error_data['api_error_code'] ) ? null : $error_data['api_error_code'],
				'api_http_code'  => empty( $error_data['api_http_code'] ) ? null : $error_data['api_http_code'],
			)
		);
	}
}
