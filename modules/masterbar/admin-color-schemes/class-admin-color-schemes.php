<?php
/**
 * Admin color schemes file.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

/**
 * Unifies admin color scheme selection across WP.com sites.
 */
class Admin_Color_Schemes {

	/**
	 * Admin_Color_Schemes constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_admin_color_meta' ) );
	}

	/**
	 * Makes admin_color available in users REST API endpoint.
	 */
	public function register_admin_color_meta() {
		register_meta(
			'user',
			'admin_color',
			array(
				'default'       => 'fresh',
				'description'   => __('Slug of the admin color scheme.', 'jetpack'),
				'single'        => true,
				'show_in_rest'  => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_users' );
				},
			)
		);
	}
}
