<?php

namespace Automattic\Jetpack_Boost\Features\Image_Guide;

use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Contracts\Feature;

class Image_Guide implements Feature {

	public function setup() {
		// Show the UI only when the user is logged in, with sufficient permissions and isn't looking at the dashboard.
		if ( is_admin() || ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		/**
		 * The priority determines where the admin bar menu item is placed.
		 */
		add_action( 'admin_bar_menu', array( $this, 'add_to_adminbar' ), 500 );
	}

	public static function get_slug() {
		return 'image-guide';
	}

	public function setup_trigger() {
		return 'init';
	}

	public function enqueue_assets() {
		wp_enqueue_script( 'jetpack-boost-image-guide', plugins_url( 'dist/guide.js', __FILE__ ), array(), JETPACK_BOOST_VERSION, true );
		wp_enqueue_style( 'jetpack-boost-image-guide', plugins_url( 'dist/guide.css', __FILE__ ), array(), JETPACK_BOOST_VERSION, 'screen' );
	}

	/**
	 * @param \WP_Admin_Bar $bar
	 */
	public function add_to_adminbar( $bar ) {
		// Disable in Admin Dashboard
		if ( is_admin() ) {
			return;
		}

		$bar->add_menu(
			array(
				'id'     => 'jetpack-boost-image-guide',
				'parent' => null,
				'group'  => null,
				'title'  => __( 'Jetpack Boost', 'jetpack-boost' ),
				'href'   => admin_url( 'admin.php?page=' . Admin::MENU_SLUG ),
				'meta'   => array(
					'target' => '_self',
					'class'  => 'jetpack-boost-image-guide',
				),
			)
		);
	}
}
