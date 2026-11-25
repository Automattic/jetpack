<?php
/**
 * WordPress.com content-sharing consent in SEO Settings.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/** Provides another interface to the platform's existing consent setting. */
class Data_Sharing {
	/**
	 * Register only where the platform owns this setting.
	 *
	 * @return void
	 */
	public static function register_routes() {
		if ( ! ( new Host() )->is_wpcom_platform() ) {
			return;
		}
		register_rest_route(
			Dashboard_Data::REST_NAMESPACE,
			'/seo/data-sharing',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'permission_callback' => array( Dashboard_Data::class, 'permission_check' ),
					'callback'            => array( __CLASS__, 'get_status' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'permission_callback' => array( Dashboard_Data::class, 'permission_check' ),
					'callback'            => array( __CLASS__, 'save' ),
					'args'                => array(
						'prevent_sharing' => array(
							'type'     => 'boolean',
							'required' => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Read the preference and the visibility restriction independently.
	 *
	 * @return array
	 */
	public static function get_status() {
		$locked = ! Ai_Crawlers::search_engines_allowed() || Ai_Crawlers::is_crawl_restricted_subdomain() || ( new Status() )->is_coming_soon();
		return array(
			'prevent_sharing' => Ai_Crawlers::has_data_sharing_opt_out(),
			'locked'          => $locked,
			'privacy_url'     => Ai_Crawlers::privacy_settings_url(),
		);
	}

	/**
	 * Send only consent through the same platform path as Settings > Reading.
	 *
	 * @param \WP_REST_Request $request Consent request.
	 * @return array|\WP_Error
	 */
	public static function save( $request ) {
		if ( self::get_status()['locked'] ) {
			return new \WP_Error( 'seo_sharing_visibility_locked', __( 'Sharing is prevented by your site visibility settings.', 'jetpack-seo' ), array( 'status' => 409 ) );
		}
		$host    = new Host();
		$site_id = $host->get_wpcom_site_id();
		if ( ! $site_id ) {
			return new \WP_Error( 'seo_sharing_not_connected', __( 'Connect this site to WordPress.com before changing the sharing preference.', 'jetpack-seo' ), array( 'status' => 409 ) );
		}
		$method = $host->is_wpcom_simple() ? 'wpcom_json_api_request_as_blog' : 'wpcom_json_api_request_as_user';
		$result = Client::$method(
			'/sites/' . $site_id . '/site-visibility',
			'v2',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json' ),
			),
			wp_json_encode( array( 'wpcom_data_sharing_opt_out' => $request['prevent_sharing'] ), JSON_UNESCAPED_SLASHES ),
			'wpcom'
		);
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		if ( 200 !== wp_remote_retrieve_response_code( $result ) ) {
			return new \WP_Error( 'seo_sharing_save_failed', __( 'Unable to save the sharing preference. Please try again.', 'jetpack-seo' ), array( 'status' => 502 ) );
		}
		// Atomic's platform request updates the local option from another request.
		wp_cache_delete( 'wpcom_data_sharing_opt_out', 'options' );
		wp_cache_delete( 'alloptions', 'options' );
		wp_cache_delete( 'notoptions', 'options' );
		return self::get_status();
	}
}
