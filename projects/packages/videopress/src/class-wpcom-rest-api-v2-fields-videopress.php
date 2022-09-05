<?php
/**
 * REST API endpoint for managing VideoPress metadata.
 *
 * @package automattic/jetpack
 * @since-jetpack 9.3.0
 * @since 0.1.3
 */

namespace Automattic\Jetpack\VideoPress;

use Jetpack_Options;
use WP_REST_Controller;

/**
 * VideoPress wpcom api v2 endpoint
 */
class WPCOM_REST_API_V2_Fields_VideoPress extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'extend_media_fields' ) );
	}

	/**
	 * Register the route.
	 */
	public function extend_media_fields() {
		register_rest_field(
			'attachment',
			'jetpack_videopress_guid',
			array(
				'get_callback' => array( $this, 'videopress_get_guid' ),
				'schema'       => array(
					'$schema'     => 'http://json-schema.org/draft-04/schema#',
					'title'       => 'jetpack_videopress_guid',
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
					'description' => __( 'Unique VideoPress ID', 'jetpack-videopress-pkg' ),
				),
			)
		);
	}

	/**
	 * Return the VideoPress GUID for a given attachment.
	 *
	 * @param array $attachment  - The attachment object.
	 *
	 * @return string The VideoPress GUID.
	 */
	public function videopress_get_guid( $attachment ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
		} else {
			$blog_id = Jetpack_Options::get_option( 'id' );
		}

		if ( ! isset( $blog_id ) ) {
			return '';
		}

		$post_id = absint( $attachment['id'] );
		if ( $post_id ) {
			return '';
		}

		$videopress_guid = get_post_meta( $post_id, 'videopress_guid', true );
		if ( ! $videopress_guid ) {
			return '';
		}

		return $videopress_guid;
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( 'Automattic\Jetpack\VideoPress\WPCOM_REST_API_V2_Fields_VideoPress' );
}
