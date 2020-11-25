<?php
/**
 * Unifies admin color scheme selection across WP.com sites.
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
		add_action( 'admin_init', array( $this, 'register_admin_color_schemes' ) );
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
				'auth_callback' => array( $this, 'update_admin_color_permissions_check' ),
				'description'   => __( 'Slug of the admin color scheme.', 'jetpack' ),
				'single'        => true,
				'show_in_rest'  => array(
					'schema' => array( 'default' => 'fresh' ),
				),
				'type'          => 'string',
			)
		);
	}

	/**
	 * Permission callback to edit the `admin_color` user meta.
	 *
	 * @param bool   $allowed   Whether the given user is allowed to edit this meta value.
	 * @param string $meta_key  Meta key. In this case `admin_color`.
	 * @param int    $object_id Queried user ID.
	 * @return bool
	 */
	public function update_admin_color_permissions_check( $allowed, $meta_key, $object_id ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return current_user_can( 'edit_user', $object_id );
	}

	/**
	 * Registers new admin color schemes
	 */
	public function register_admin_color_schemes() {

		wp_admin_css_color(
			'aquatic',
			__( 'Aquatic', 'jetpack' ),
			plugins_url( 'colors/aquatic/colors.css', __FILE__ ),
			array( '#135e96', '#007e65', '#043959', '#c5d9ed' ),
			array(
				'base'    => '#c5d9ed',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'classic-blue',
			__( 'Classic Blue', 'jetpack' ),
			plugins_url( 'colors/classic-blue/colors.css', __FILE__ ),
			array( '#135e96', '#b26200', '#dcdcde', '#646970' ),
			array(
				'base'    => '#646970',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'classic-bright',
			__( 'Classic Bright', 'jetpack' ),
			plugins_url( 'colors/classic-bright/colors.css', __FILE__ ),
			array( '#135e96', '#c9256e', '#ffffff', '#e9eff5' ),
			array(
				'base'    => '#646970',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'classic-dark',
			__( 'Classic Dark', 'jetpack' ),
			plugins_url( 'colors/classic-dark/colors.css', __FILE__ ),
			array( '#101517', '#c9356e', '#32373c', '#0073aa' ),
			array(
				'base'    => '#a2aab2',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'contrast',
			__( 'Contrast', 'jetpack' ),
			plugins_url( 'colors/contrast/colors.css', __FILE__ ),
			array( '#101517', '#ffffff', '#1d2327', '#646970' ),
			array(
				'base'    => '#646970',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'nightfall',
			__( 'Nightfall', 'jetpack' ),
			plugins_url( 'colors/nightfall/colors.css', __FILE__ ),
			array( '#00131c', '#043959', '#ffffff', '#646970' ),
			array(
				'base'    => '#646970',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'powder-snow',
			__( 'Powder Snow', 'jetpack' ),
			plugins_url( 'colors/powder-snow/colors.css', __FILE__ ),
			array( '#101517', '#dcdcde', '#2c3338', '#646970' ),
			array(
				'base'    => '#646970',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'sakura',
			__( 'Sakura', 'jetpack' ),
			plugins_url( 'colors/sakura/colors.css', __FILE__ ),
			array( '#005042', '#f2ceda', '#700f3b', '#646970' ),
			array(
				'base'    => '#646970',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);

		wp_admin_css_color(
			'sunset',
			__( 'Sunset', 'jetpack' ),
			plugins_url( 'colors/sunset/colors.css', __FILE__ ),
			array( '#691c1c', '#8a2424', '#ffffff', '#646970' ),
			array(
				'base'    => '#646970',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);

	}
}
