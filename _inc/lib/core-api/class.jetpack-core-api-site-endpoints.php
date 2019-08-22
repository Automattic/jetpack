<?php

use Automattic\Jetpack\Connection\Client;

/**
 * This is the endpoint class for `/site` endpoints.
 */
class Jetpack_Core_API_Site_Endpoint {

	/**
	 * Returns the result of `/sites/%s/features` endpoint call.
	 *
	 * @return object $features has 'active' and 'available' properties each of which contain feature slugs.
	 *                  'active' is a simple array of slugs that are active on the current plan.
	 *                  'available' is an object with keys that represent feature slugs and values are arrays
	 *                     of plan slugs that enable these features
	 */
	public static function get_features() {

		// Make the API request
		$request  = sprintf( '/sites/%d/features', Jetpack_Options::get_option( 'id' ) );
		$response = Client::wpcom_json_api_request_as_blog( $request, '1.1' );

		// Bail if there was an error or malformed response
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		// Decode the results
		$results = json_decode( $response['body'], true );

		// Bail if there were no results or plan details returned
		if ( ! is_array( $results ) ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'code'    => 'success',
				'message' => esc_html__( 'Site features correctly received.', 'jetpack' ),
				'data'    => wp_remote_retrieve_body( $response ),
			)
		);
	}

	/**
	 * Check that the current user has permissions to request information about this site.
	 *
	 * @since 5.1.0
	 *
	 * @return bool
	 */
	public static function can_request() {
		return current_user_can( 'jetpack_manage_modules' );
	}


	/**
	 * Gets an array of data that show how Jetpack is currently being used to benefit the site.
	 *
	 * @since 7.7
	 *
	 * @return WP_REST_Response
	 */
	public static function get_benefits() {
		global $wpdb;

		$benefits = array();

		$stats = stats_get_from_restapi( array( 'fields' => 'stats' ) );

		if ( $stats->stats->visitors > 0 ) {
			$benefits[] = array(
				'name'        => 'jetpack-stats',
				'title'       => esc_html__( 'Jetpack Stats' ),
				'description' => esc_html__( 'Visitors tracked by Jetpack this year' ),
				'value'       => $stats->stats->visitors,
			);
		}

		if ( Jetpack::is_module_active( 'protect' ) ) {
			$protect = get_site_option( 'jetpack_protect_blocked_attempts' );
			if ( $protect > 0 ) {
				$benefits[] = array(
					'name'        => 'protect',
					'title'       => esc_html__( 'Brute force protection', 'jetpack' ),
					'description' => esc_html__( 'The number of malicious login attempts blocked by Jetpack' ),
					'value'       => $protect,
				);
			}
		}

		$followers = $stats->stats->followers_blog;
		if ( $followers > 0 ) {
			$benefits[] = array(
				'name'        => 'subscribers',
				'title'       => esc_html__( 'Subscribers' ),
				'description' => esc_html__( 'People subscribed to your updates through Jetpack' ),
				'value'       => $followers,
			);
		}

		if ( Jetpack::is_plugin_active( 'vaultpress/vaultpress.php' ) && class_exists( 'VaultPress' ) ) {
			$vaultpress = new VaultPress();
			if ( $vaultpress->is_registered() ) {
				$data = json_decode( base64_decode( $vaultpress->contact_service( 'plugin_data' ) ) );
				if ( $data->features->backups && $data->backups->stats->revisions > 0 ) {
					$benefits[] = array(
						'name'        => 'jetpack-backup',
						'title'       => esc_html__( 'Jetpack Backup' ),
						'description' => esc_html__( 'The number of times Jetpack has backed up your site and kept it safe' ),
						'value'       => $data->backups->stats->revisions,
					);
				}
			}

			if ( Jetpack::is_module_active( 'contact-form' ) ) {
				$contact_form_count = array_sum( get_object_vars( wp_count_posts( 'feedback' ) ) );
				if ( $contact_form_count > 0 ) {
					$benefits[] = array(
						'name'        => 'contact-form-feedback',
						'title'       => esc_html__( 'Contact Form Feedback' ),
						'description' => esc_html__( 'Form submissions stored by Jetpack' ),
						'value'       => $contact_form_count,
					);
				}
			}

			if ( Jetpack::is_module_active( 'photon' ) ) {
				$photon_count = array_reduce(
					get_object_vars( wp_count_attachments( array( 'image/jpeg', 'image/png', 'image/gif' ) ) ),
					function ( $i, $j ) {
						return $i + $j;
					}
				);
				if ( $photon_count > 0 ) {
					$benefits[] = array(
						'name'        => 'image-hosting',
						'title'       => esc_html__( 'Image Hosting' ),
						'description' => esc_html__( 'Super-fast, mobile-ready images served by Jetpack' ),
						'value'       => $photon_count,
					);
				}
			}

			$videopress_count = $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->posts WHERE post_mime_type = 'video/videopress'" );
			if ( $videopress_count > 0 ) {
				$benefits[] = array(
					'name'        => 'video-hosting',
					'title'       => esc_html__( 'Video Hosting' ),
					'description' => esc_html__( 'Ad-free, lightning-fast videos delivered by Jetpack' ),
					'value'       => $videopress_count,
				);
			}

			if ( Jetpack::is_module_active( 'publicize' ) && class_exists( 'Publicize' ) ) {
				$publicize   = new Publicize();
				$connections = $publicize->get_all_connections();

				$number_of_connections = 0;
				if ( is_array( $connections ) && ! empty( $connections ) ) {
					$number_of_connections = count( $connections );
				}

				if ( $number_of_connections > 0 ) {
					$benefits[] = array(
						'name'        => 'publicize',
						'title'       => esc_html__( 'Publicize' ),
						'description' => esc_html__( 'Live social media site connections, powered by Jetpack' ),
						'value'       => count( $connections ),
					);
				}
			}

			if ( $stats->stats->shares > 0 ) {
				$benefits[] = array(
					'name'        => 'sharing',
					'title'       => esc_html__( 'Sharing' ),
					'description' => esc_html__( 'The number of times visitors have shared your posts with the world using Jetpack' ),
					'value'       => $stats->stats->shares,
				);
			}

			return rest_ensure_response(
				array(
					'code'    => 'success',
					'message' => esc_html__( 'Site benefits correctly received.', 'jetpack' ),
					'data'    => json_encode( $benefits ),
				)
			);
		}
	}
}
