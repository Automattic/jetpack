<?php
/**
 * Register the Social note custom post type.
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Social;

/**
 * Register the Jetpack Social Note custom post type.
 */
class Jetpack_Social_Note {
	/**
	 * Register the Jetpack Social Note custom post type.
	 */
	public static function register() {
		if ( ! defined( 'JETPACK_SOCIAL_NOTES_ENABLED' ) || ! constant( 'JETPACK_SOCIAL_NOTES_ENABLED' ) ) {
			return;
		}

		$args = array(
			'public'       => true,
			'label'        => 'Social Note',
			'show_in_rest' => true,
			'supports'     => array( 'editor', 'thumbnail', 'publicize' ),
			'menu_icon'    => 'dashicons-welcome-write-blog',

		);
		register_post_type( 'jetpack_social_note', $args );
	}
}
