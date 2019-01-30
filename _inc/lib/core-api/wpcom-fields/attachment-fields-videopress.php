<?php

/**
 * Add per-attachment VideoPress data.
 *
 * { # Attachment Object
 *   ...
 *   jetpack_videopress: (object) VideoPress metadata for the specified attachment
 *   ...
 * }
 *
 * @since 7.1.0
 */
class WPCOM_REST_API_V2_Attachment_VideoPress_Field extends WPCOM_REST_API_V2_Field_Controller {
	protected $object_type = 'attachment';
	protected $field_name  = 'jetpack_videopress';

	/**
	 * Defines data structure and what elements are visible in which contexts
	 */
	public function get_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => $this->field_name,
			'type'       => 'object|null',
			'context'    => array( 'view', 'edit' ),
			'default'    => null,
		);
	}

	/**
	 * Getter: Retrieve current VideoPress data for a given attachment.
	 *
	 * @param mixed           $object Response from the attachment endpoint
	 * @param WP_REST_Request $request
	 * @return object
	 */
	public function get( $object, $request ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
		} else {
			$blog_id = Jetpack_Options::get_option( 'id' );
		}

		$post_id = absint( $object['id'] );

		$videopress_data = $this->get_videopress_data( $post_id, $blog_id );

		if ( ! $videopress_data || is_wp_error( $videopress_data ) ) {
			return null;
		}

		return $videopress_data;
	}

	/**
	 * Get VideoPress data for a given attachment.
	 *
	 * This is pulled out into a separate method to support unit test mocking.
	 *
	 * @param int $attachment_id Attachment ID
	 * @param int $blog_id       Blog ID
	 *
	 * @return object
	 */
	function get_videopress_data( $attachment_id, $blog_id ) {
		$videopress_id = video_get_info_by_blogpostid( $blog_id, $attachment_id )->guid;
		return videopress_get_video_details( $videopress_id );
	}

	/**
	 * Setter: It does nothing since `jetpack_videopress` is a read-only field.
	 *
	 * @param mixed           $value The new value for the field.
	 * @param WP_Post         $object The attachment object
	 * @param WP_REST_Request $request
	 * @return null
	 */
	public function update( $value, $object, $request ) {
		return null;
	}

	/**
	 * Permission Check for the field's getter. Delegate the responsibility to the
	 * attachment endpoint, so it always returns true.
	 *
	 * @param mixed           $object Response from the attachment endpoint
	 * @param WP_REST_Request $request
	 * @return true
	 */
	public function get_permission_check( $object, $request ) {
		return true;
	}

	/**
	 * Permission Check for the field's setter. Delegate the responsibility to the
	 * attachment endpoint, so it always returns true.
	 *
	 * @param mixed           $value The new value for the field.
	 * @param WP_Post         $object The attachment object
	 * @param WP_REST_Request $request
	 * @return true
	 */
	public function update_permission_check( $value, $object, $request ) {
		return true;
	}
}

if (
	( method_exists( 'Jetpack', 'is_module_active' ) && Jetpack::is_module_active( 'videopress' ) ) ||
	( defined( 'IS_WPCOM' ) && IS_WPCOM )
) {
	wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Attachment_VideoPress_Field' );
}
