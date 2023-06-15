<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Guide;

use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Analytics;

class Image_Guide implements Pluggable {

	public function setup() {

		if ( is_admin() ) {
			add_filter( 'jetpack_boost_js_constants', array( $this, 'can_resize_images' ) );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$override = isset( $_GET['jb-debug-ig'] );

		if ( is_admin() || is_user_logged_in() || current_user_can( 'manage_options' ) ) {
			Image_Guide_Proxy::init();
		}

		// Show the UI only when the user is logged in, with sufficient permissions and isn't looking at the dashboard.
		if ( true !== $override && ( is_admin() || ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) ) {
			return;
		}

		// Enqueue the tracks library.
		add_action( 'wp_enqueue_scripts', array( Analytics::class, 'init_tracks_scripts' ) );

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		/**
		 * The priority determines where the admin bar menu item is placed.
		 */
		add_action( 'admin_bar_menu', array( $this, 'add_to_adminbar' ), 500 );
	}

	public function can_resize_images( $constants ) {
		if ( ! isset( $constants['site'] ) ) {
			$constants['site'] = array();
		}
		$constants['site']['canResizeImages'] = wp_image_editor_supports( array( 'methods' => array( 'resize' ) ) );
		return $constants;
	}

	public static function get_slug() {
		return 'image_guide';
	}

	public function enqueue_assets() {
		wp_enqueue_script( 'jetpack-boost-guide', plugins_url( 'dist/guide.js', __FILE__ ), array(), JETPACK_BOOST_VERSION, true );
		wp_enqueue_style( 'jetpack-boost-guide', plugins_url( 'dist/guide.css', __FILE__ ), array(), JETPACK_BOOST_VERSION, 'screen' );

		wp_localize_script(
			'jetpack-boost-guide',
			'jetpackBoostAnalytics',
			array(
				'tracksData' => Analytics::get_tracking_data(),
			)
		);
		wp_localize_script(
			'jetpack-boost-guide',
			'jbImageGuide',
			array(
				'proxyNonce' => wp_create_nonce( Image_Guide_Proxy::NONCE_ACTION ),
				'ajax_url'   => admin_url( 'admin-ajax.php' ),
			)
		);
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
				'id'     => 'jetpack-boost-guide',
				'parent' => null,
				'group'  => null,
				'title'  => __( 'Jetpack Boost', 'jetpack-boost' ),
				'href'   => admin_url( 'admin.php?page=' . Admin::MENU_SLUG ),
				'meta'   => array(
					'target' => '_self',
					'class'  => 'jetpack-boost-guide',
				),
			)
		);
	}

	public static function is_available() {
		return true;
	}
}
