<?php
/**
 * Helper to save the Mailchimp block settings.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\External_Connections;
use Automattic\Jetpack\Status\Host;

/**
 * Class Jetpack_Mailchimp_Helper
 */
class Jetpack_Mailchimp_Helper {
	/**
	 * Saves the Mailchimp audience that block subscribers join, or clears the settings.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $audience Mailchimp list ID, or 'none' to clear the settings.
	 * @return true|WP_Error
	 */
	public static function save_audience( $audience ) {
		$site_id = Connection_Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		if ( $audience === 'none' ) {
			$data = array(
				'follower_list_id' => '0',
				'keyring_id'       => '0',
			);
		} else {
			$connection = External_Connections::get_connection( 'mailchimp' );
			if ( empty( $connection ) ) {
				return new WP_Error( 'mailchimp_not_connected', __( 'Your site is not connected to Mailchimp yet.', 'jetpack' ) );
			}
			$data = array(
				'follower_list_id' => $audience,
				'keyring_id'       => $connection['ID'],
			);
		}

		if ( ( new Host() )->is_wpcom_simple() ) {
			require_lib( 'mailchimp' );
			$response = \MailchimpApi::save_settings( $site_id, $data );
			return is_wp_error( $response ) ? $response : true;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/mailchimp/settings', $site_id ),
			'1.1',
			array( 'method' => 'POST' ),
			$data,
			'rest'
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			$body = json_decode( wp_remote_retrieve_body( $response ), true );
			return new WP_Error(
				$body['error'] ?? 'mailchimp_save_failed',
				$body['message'] ?? __( 'Settings save failed.', 'jetpack' )
			);
		}

		return true;
	}
}
