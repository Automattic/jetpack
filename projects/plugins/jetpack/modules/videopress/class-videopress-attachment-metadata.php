<?php
/**
 * Handle the VideoPress metadata properties.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Class Videopress_Attachment_Metadata
 */
class Videopress_Attachment_Metadata {

	/**
	 * Persist the VideoPress metadata information, including rating and display_embed.
	 *
	 * @param string|int $post_id       The post id.
	 * @param string     $guid          VideoPress Guid.
	 * @param string     $post_title    The post title.
	 * @param string     $caption       Video caption.
	 * @param string     $post_excerpt  The post excerpt.
	 * @param string     $rating        The rating.
	 * @param int        $display_embed The display_embed.
	 *
	 * @return bool|\WP_Error
	 */
	public static function persist_metadata( $post_id, $guid, $post_title, $caption, $post_excerpt, $rating, $display_embed ) {
		$post_id = absint( $post_id );

		$args = array(
			'method'  => 'POST',
			'headers' => array( 'content-type' => 'application/json' ),
		);

		$display_embed = (int) $display_embed;

		$values         = self::build_wpcom_api_request_values( $post_title, $caption, $post_excerpt, $rating, $display_embed );
		$endpoint       = 'videos';
		$values['guid'] = $guid;

		$result = Client::wpcom_json_api_request_as_blog( $endpoint, '2', $args, wp_json_encode( $values ), 'wpcom' );

		$validated_result = self::validate_result( $result );
		if ( true !== $validated_result ) {
			return $validated_result;
		}

		// If we are in WPCOM, then we don't need to make anything else since we've already updated the video information.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return true;
		}

		$meta = wp_get_attachment_metadata( $post_id );

		if ( self::is_display_embed_valid( $display_embed ) ) {
			$meta['videopress']['display_embed'] = (bool) $values['display_embed']; // convert it to bool since that's how we store it on wp-admin side.
		}

		if ( isset( $values['rating'] ) ) {
			$meta['videopress']['rating'] = $values['rating'];
		}

		wp_update_attachment_metadata( $post_id, $meta );

		return true;
	}

	/**
	 * Check if the given media item is a VideoPress file.
	 *
	 * @param stdClass $item The media item.
	 *
	 * @return bool
	 */
	public static function is_videopress_media( $item ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return 0 === strpos( $item->mime_type, 'video/' );
		}

		// Else, we are in Jetpack and we need to check if the video is video/videopress.
		return 'video/videopress' === $item->mime_type;
	}

	/**
	 * Check if display_embed has valid values.
	 *
	 * @param mixed $display_embed The input display embed.
	 *
	 * @return bool
	 */
	private static function is_display_embed_valid( $display_embed ) {
		return ( 0 === $display_embed || 1 === $display_embed );
	}

	/**
	 * Validate the response received from WPCOM.
	 *
	 * @param array|\WP_Error $result The result returned by the client.
	 */
	private static function validate_result( $result ) {
		$response_code = isset( $result['response']['code'] ) ? $result['response']['code'] : 500;

		// When Client::wpcom_json_api_request_as_blog is called in WPCOM, bad response codes are not converted to WP_Error.
		// Because of this, we need to manually check the response code to check if the direct API call is 200 (OK).
		if ( 200 === $response_code && ! is_wp_error( $result ) ) {
			return true;
		}

		$error_message = __(
			'There was an issue saving your updates to the VideoPress service. Please try again later.',
			'jetpack'
		);

		$error_code = $response_code;

		if ( is_wp_error( $result ) ) {
			$error_code = $result->get_error_code();
		}

		return new \WP_Error( $error_code, $error_message );
	}

	/**
	 * Build the request values that will be passed to the WPCOM API.
	 *
	 * @param string $post_title The video title.
	 * @param string $caption The video caption.
	 * @param string $post_excerpt The except.
	 * @param string $rating The video rating.
	 * @param string $display_embed The video display_embed.
	 *
	 * @return array
	 */
	private static function build_wpcom_api_request_values( $post_title, $caption, $post_excerpt, $rating, $display_embed ) {
		$values = array();

		// Add the video title & description in, so that we save it properly.
		if ( isset( $post_title ) ) {
			$values['title'] = trim( wp_strip_all_tags( $post_title ) );
		}

		if ( isset( $caption ) ) {
			$values['caption'] = trim( wp_strip_all_tags( $caption ) );
		}

		if ( isset( $post_excerpt ) ) {
			$values['description'] = trim( wp_strip_all_tags( $post_excerpt ) );
		}

		if ( isset( $rating ) ) {
			$values['rating'] = $rating;
		}

		if ( self::is_display_embed_valid( $display_embed ) ) {
			$values['display_embed'] = $display_embed;
		}

		return $values;
	}
}
