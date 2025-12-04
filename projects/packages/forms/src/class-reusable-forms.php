<?php
/**
 * Reusable Forms class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

/**
 * Handles Reusable Forms functionality.
 */
class Reusable_Forms {

	/**
	 * Initialize the Reusable Forms feature.
	 */
	public static function init() {
		self::register_post_type();
	}

	/**
	 * Register the jetpack-form custom post type.
	 */
	private static function register_post_type() {
		register_post_type(
			'jetpack-form',
			array(
				'labels'       => array(
					'name'          => __( 'Jetpack Forms', 'jetpack-forms' ),
					'singular_name' => __( 'Jetpack Form', 'jetpack-forms' ),
				),
				'public'       => false,
				'show_ui'      => false,
				'show_in_menu' => false,
				'rewrite'      => false,
				'query_var'    => false,
				'show_in_rest' => false,
			)
		);
	}
}
