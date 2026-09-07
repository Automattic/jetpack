<?php
/**
 * VideoPress Token
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
/**
 * VideoPress token utility class
 */
class VideoPressToken {
	/**
	 * Check if user is connected.
	 *
	 * @return bool
	 * @throws Upload_Exception - If user is not connected.
	 */
	private static function check_connection() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return true;
		}
		if ( ! ( new Connection_Manager() )->has_connected_owner() ) {
			throw new Upload_Exception( __( 'You need to connect Jetpack before being able to upload a video to VideoPress.', 'jetpack-videopress-pkg' ) );
		}
		return true;
	}

	/**
	 * Get current blog id.
	 *
	 * @return string - Blog id.
	 */
	public static function blog_id() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
		} else {
			$blog_id = Jetpack_Options::get_option( 'id' );
		}

		return $blog_id;
	}

	/**
	 * Retrieve a Playback JWT via WPCOM api.
	 *
	 * @param string $guid The VideoPress GUID.
	 * @return string
	 */
	public static function videopress_playback_jwt( $guid ) {
		$blog_id = static::blog_id();

		$args = array(
			'method' => 'POST',
		);

		$endpoint = "sites/{$blog_id}/media/videopress-playback-jwt/{$guid}";

		$result = Client::wpcom_json_api_request_as_blog( $endpoint, 'v2', $args, null, 'wpcom' );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$response = json_decode( $result['body'], true );

		if ( empty( $response['metadata_token'] ) ) {
			return false;
		}

		return $response['metadata_token'];
	}

	/**
	 * Retrieve a One Time Upload Token via WPCOM api.
	 *
	 * @return string
	 * @throws Upload_Exception If token is empty or is had an error.
	 */
	public static function videopress_onetime_upload_token() {
		if ( static::check_connection() ) {
			$blog_id = static::blog_id();

			/*
			 * On WordPress.com the classic `sites/{id}/media/token` (rest/v1.1) endpoint
			 * isn't reachable in-process: `Client::wpcom_json_api_request_as_blog` routes
			 * through `WPCOM_API_Direct`, which only dispatches WP-REST routes. Mint the
			 * one-time token straight from the same primitives that endpoint uses. Mirrors
			 * the IS_WPCOM branches already in this class (`blog_id()`) and its sibling AJAX
			 * playback-JWT handler (`AJAX::request_jwt_from_wpcom()`).
			 */
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				if ( ! class_exists( '\Jetpack_Server_Upload_Token' ) && defined( 'ABSPATH' ) ) {
					// file_exists-guarded so a relocated wpcom mu-plugins file degrades
					// to the friendly exception below instead of a require fatal.
					$upload_token_file = ABSPATH . 'wp-content/mu-plugins/jetpack/class.jetpack-server-upload-token.php';
					if ( file_exists( $upload_token_file ) ) {
						require_once $upload_token_file;
					}
				}
				if ( class_exists( '\Jetpack_Data' ) && class_exists( '\Jetpack_Server_Upload_Token' ) && defined( 'JETPACK__ANY_USER_TOKEN' ) ) {
					// blog_id() types as int|string (the Jetpack-option path), but on
					// WPCOM it's get_current_blog_id() — narrow for the int-typed stubs.
					$wpcom_blog_id = (int) $blog_id;
					$jetpack_token = \Jetpack_Data::get_access_token_by_blog_id_user_id( $wpcom_blog_id, JETPACK__ANY_USER_TOKEN );
					$token         = \Jetpack_Server_Upload_Token::create_token( $wpcom_blog_id, $jetpack_token );
					if ( is_array( $token ) && ! empty( $token['hash'] ) ) {
						return $token['hash'];
					}
				}
				throw new Upload_Exception( __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack-videopress-pkg' ) );
			}

			$args = array(
				'method' => 'POST',
			);

			$endpoint = "sites/{$blog_id}/media/token";
			$result   = Client::wpcom_json_api_request_as_blog( $endpoint, Client::WPCOM_JSON_API_VERSION, $args );

			if ( is_wp_error( $result ) ) {
				throw new Upload_Exception( __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack-videopress-pkg' ) );
			}

			$response = json_decode( $result['body'], true );

			if ( empty( $response['upload_token'] ) ) {
				throw new Upload_Exception( __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack-videopress-pkg' ) );
			}

			return $response['upload_token'];
		}
	}

	/**
	 * Gets the VideoPress Upload JWT
	 *
	 * @return string
	 * @throws Upload_Exception - If user is not connected, if token is empty or failed to obtain.
	 */
	public static function videopress_upload_jwt() {
		if ( static::check_connection() ) {
			$blog_id  = static::blog_id();
			$endpoint = "sites/{$blog_id}/media/videopress-upload-jwt";
			$args     = array( 'method' => 'POST' );
			$result   = Client::wpcom_json_api_request_as_blog( $endpoint, 'v2', $args, null, 'wpcom' );

			if ( is_wp_error( $result ) ) {
				throw new Upload_Exception(
					__( 'Could not obtain a VideoPress upload JWT. Please try again later.', 'jetpack-videopress-pkg' ) .
					'(' . $result->get_error_message() . ')'
				);
			}

			$response = json_decode( $result['body'], true );

			if ( empty( $response['upload_token'] ) ) {
				throw new Upload_Exception( __( 'Could not obtain a VideoPress upload JWT. Please try again later. (empty upload token)', 'jetpack-videopress-pkg' ) );
			}

			return $response['upload_token'];
		}
	}
}
