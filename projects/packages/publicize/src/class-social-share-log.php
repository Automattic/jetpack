<?php
/**
 * Register the Social Share Log custom post type.
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Publicize;

/**
 * Register the Social Share Log custom post type.
 *
 * @package automattic/jetpack-social-plugin
 */
class Social_Share_Log {
	const SOCIAL_SHARE_LOG_CPT = 'social_share_log';

	/**
	 * Initialize the custom post type for social share logs.
	 */
	public function init() {
		self::register_cpt();
		self::register_share_log_fields();
	}

	/**
	 * Register the custom post type for social share logs.
	 */
	public function register_cpt() {
		$args = array(
			'public'       => false,
			'show_ui'      => false,
			'label'        => 'Share Logs',
			'show_in_rest' => true,
			'has_archive'  => true,
			'supports'     => array( 'title', 'custom-fields' ),
		);
		register_post_type( self::SOCIAL_SHARE_LOG_CPT, $args );
	}

	/**
	 * Registers the custom fields for the social share log.
	 */
	public function register_share_log_fields() {
		$fields = array( 'status', 'message', 'timestamp', 'service', 'connection_id', 'external_name', 'profile_url', 'enabled' );

		foreach ( $fields as $field ) {
			register_rest_field(
				self::SOCIAL_SHARE_LOG_CPT,
				$field,
				array(
					'get_callback' => array( $this, 'get_share_log_meta' ),
					'schema'       => null,
				)
			);
		}
	}

	/**
	 * Get the meta for the social share log.
	 *
	 * @param array  $post_object The object.
	 * @param string $field_name The field name.
	 * @return mixed
	 */
	public function get_share_log_meta( $post_object, $field_name ) {
		return get_post_meta( $post_object['id'], $field_name, true );
	}
}
