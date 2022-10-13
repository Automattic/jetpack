<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * List of /site core REST API endpoints used in Jetpack's dashboard.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Stats\WPCOM_Stats;

/**
 * This is the endpoint class for `/site` endpoints.
 */
class Jetpack_Core_API_Site_Endpoint {
	/**
	 * Returns commonly used WP_Error indicating failure to fetch data
	 *
	 * @return WP_Error that denotes our inability to fetch the requested data
	 */
	private static function get_failed_fetch_error() {
		return new WP_Error(
			'failed_to_fetch_data',
			esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Returns the result of `/sites/%s/features` endpoint call.
	 *
	 * @return object $features has 'active' and 'available' properties each of which contain feature slugs.
	 *                  'active' is a simple array of slugs that are active on the current plan.
	 *                  'available' is an object with keys that represent feature slugs and values are arrays
	 *                     of plan slugs that enable these features
	 */
	public static function get_features() {
		// Make the API request.
		$request  = sprintf( '/sites/%d/features', Jetpack_Options::get_option( 'id' ) );
		$response = Client::wpcom_json_api_request_as_blog( $request, '1.1' );

		// Bail if there was an error or malformed response.
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return self::get_failed_fetch_error();
		}

		// Decode the results.
		$results = json_decode( $response['body'], true );

		// Bail if there were no results or plan details returned.
		if ( ! is_array( $results ) ) {
			return self::get_failed_fetch_error();
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
	 * Returns the result of `/sites/%s/purchases` endpoint call.
	 *
	 * @return array of site purchases.
	 */
	public static function get_purchases() {
		// Make the API request.
		$request  = sprintf( '/sites/%d/purchases', Jetpack_Options::get_option( 'id' ) );
		$response = Client::wpcom_json_api_request_as_blog( $request, '1.1' );

		// Bail if there was an error or malformed response.
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return self::get_failed_fetch_error();
		}

		if ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return self::get_failed_fetch_error();
		}

		// Decode the results.
		$results = json_decode( $response['body'], true );

		// Bail if there were no results or purchase details returned.
		if ( ! is_array( $results ) ) {
			return self::get_failed_fetch_error();
		}

		return rest_ensure_response(
			array(
				'code'    => 'success',
				'message' => esc_html__( 'Site purchases correctly received.', 'jetpack' ),
				'data'    => wp_remote_retrieve_body( $response ),
			)
		);
	}

	/**
	 * Returns the result of `/sites/%d/products` endpoint call.
	 *
	 * @return array of site products.
	 */
	public static function get_products() {
		$url      = sprintf( '/sites/%d/products?locale=%s&type=jetpack', Jetpack_Options::get_option( 'id' ), get_user_locale() );
		$response = Client::wpcom_json_api_request_as_blog( $url, '1.1' );

		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return self::get_failed_fetch_error();
		}

		$results = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $results ) ) {
			return self::get_failed_fetch_error();
		}

		return rest_ensure_response(
			array(
				'code'    => 'success',
				'message' => esc_html__( 'Site products correctly received.', 'jetpack' ),
				'data'    => $results,
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
		$benefits = array();

		/*
		 * We get different benefits from Stats:
		 * - this year's visitors
		 * - Followers (only if subs module is active)
		 * - Sharing counts (not currently supported in Jetpack -- https://github.com/Automattic/jetpack/issues/844 )
		 */
		$stats = null;
		if ( function_exists( 'convert_stats_array_to_object' ) ) {
				$stats = convert_stats_array_to_object(
					( new WPCOM_Stats() )->get_stats( array( 'fields' => 'stats' ) )
				);
		}
		$has_stats = null !== $stats && ! is_wp_error( $stats );

		// Yearly visitors.
		if ( $has_stats && $stats->stats->visitors > 0 ) {
			$benefits[] = array(
				'name'        => 'jetpack-stats',
				'title'       => esc_html__( 'Site Stats', 'jetpack' ),
				'description' => esc_html__( 'Visitors tracked by Jetpack', 'jetpack' ),
				'value'       => absint( $stats->stats->visitors ),
			);
		}

		// Protect blocked logins.
		if ( Jetpack::is_module_active( 'protect' ) ) {
			$protect = get_site_option( 'jetpack_protect_blocked_attempts' );
			if ( $protect > 0 ) {
				$benefits[] = array(
					'name'        => 'protect',
					'title'       => esc_html__( 'Brute force protection', 'jetpack' ),
					'description' => esc_html__( 'The number of malicious login attempts blocked by Jetpack', 'jetpack' ),
					'value'       => absint( $protect ),
				);
			}
		}

		// Number of followers.
		if ( $has_stats && $stats->stats->followers_blog > 0 && Jetpack::is_module_active( 'subscriptions' ) ) {
			$benefits[] = array(
				'name'        => 'subscribers',
				'title'       => esc_html__( 'Subscribers', 'jetpack' ),
				'description' => esc_html__( 'People subscribed to your updates through Jetpack', 'jetpack' ),
				'value'       => absint( $stats->stats->followers_blog ),
			);
		}

		// VaultPress backups.
		if ( Jetpack::is_plugin_active( 'vaultpress/vaultpress.php' ) && class_exists( 'VaultPress' ) ) {
			$vaultpress = new VaultPress();
			if ( $vaultpress->is_registered() ) {
				$data = json_decode( base64_decode( $vaultpress->contact_service( 'plugin_data' ) ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
				if ( $data && $data->features->backups && ! empty( $data->backups->stats ) && $data->backups->stats->revisions > 0 ) {
					$benefits[] = array(
						'name'        => 'jetpack-backup',
						'title'       => esc_html__( 'Jetpack Backup', 'jetpack' ),
						'description' => esc_html__( 'The number of times Jetpack has backed up your site and kept it safe', 'jetpack' ),
						'value'       => absint( $data->backups->stats->revisions ),
					);
				}
			}
		}

		// Number of forms sent via a Jetpack contact form.
		if ( Jetpack::is_module_active( 'contact-form' ) ) {
			$contact_form_count = array_sum( get_object_vars( wp_count_posts( 'feedback' ) ) );
			if ( $contact_form_count > 0 ) {
				$benefits[] = array(
					'name'        => 'contact-form-feedback',
					'title'       => esc_html__( 'Contact Form Feedback', 'jetpack' ),
					'description' => esc_html__( 'Form submissions stored by Jetpack', 'jetpack' ),
					'value'       => absint( $contact_form_count ),
				);
			}
		}

		// Number of images in the library if Photon is active.
		if ( Jetpack::is_module_active( 'photon' ) ) {
			$photon_count = array_reduce(
				get_object_vars( wp_count_attachments( array( 'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp' ) ) ),
				function ( $i, $j ) {
					return $i + $j;
				}
			);
			if ( $photon_count > 0 ) {
				$benefits[] = array(
					'name'        => 'image-hosting',
					'title'       => esc_html__( 'Image Hosting', 'jetpack' ),
					'description' => esc_html__( 'Super-fast, mobile-ready images served by Jetpack', 'jetpack' ),
					'value'       => absint( $photon_count ),
				);
			}
		}

		// Number of VideoPress videos on the site.
		if ( Jetpack::is_module_active( 'videopress' ) ) {
			$videopress_attachments = wp_count_attachments( 'video/videopress' );
			if (
				isset( $videopress_attachments->{'video/videopress'} )
				&& $videopress_attachments->{'video/videopress'} > 0
			) {
				$benefits[] = array(
					'name'        => 'video-hosting',
					'title'       => esc_html__( 'Video Hosting', 'jetpack' ),
					'description' => esc_html__( 'Ad-free, lightning-fast videos delivered by Jetpack', 'jetpack' ),
					'value'       => absint( $videopress_attachments->{'video/videopress'} ),
				);
			}
		}

		// Number of active Publicize connections.
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
					'title'       => esc_html__( 'Jetpack Social', 'jetpack' ),
					'description' => esc_html__( 'Live social media site connections, powered by Jetpack', 'jetpack' ),
					'value'       => absint( $number_of_connections ),
				);
			}
		}

		// Total number of shares.
		if ( $has_stats && $stats->stats->shares > 0 ) {
			$benefits[] = array(
				'name'        => 'sharing',
				'title'       => esc_html__( 'Sharing', 'jetpack' ),
				'description' => esc_html__( 'The number of times visitors have shared your posts with the world using Jetpack', 'jetpack' ),
				'value'       => absint( $stats->stats->shares ),
			);
		}

		if ( Jetpack::is_module_active( 'search' ) && ! class_exists( 'Automattic\\Jetpack\\Search_Plugin\\Jetpack_Search_Plugin' ) ) {
			$benefits[] = array(
				'name'        => 'search',
				'title'       => esc_html__( 'Search', 'jetpack' ),
				'description' => esc_html__( 'Help your visitors find exactly what they are looking for, fast', 'jetpack' ),
			);
		}

		// Finally, return the whole list of benefits.
		return rest_ensure_response(
			array(
				'code'    => 'success',
				'message' => esc_html__( 'Site benefits correctly received.', 'jetpack' ),
				'data'    => wp_json_encode( $benefits ),
			)
		);
	}
}
