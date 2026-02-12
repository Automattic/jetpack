<?php
/**
 * A class that adds a link to the WordPress.com Reader to the admin bar.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Connection\Urls;
use Automattic\Jetpack\Modules;
use WP_Admin_Bar;

/**
 * Add a link to the WordPress.com Reader to the admin bar.
 */
class Reader_Link {
	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the Reader Link functionality.
	 *
	 * This method sets up all necessary hooks for the Reader menu item
	 * and its associated styles. It can be called multiple times safely
	 * as it will only initialize once.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		$instance = new self();
		add_action( 'admin_bar_menu', array( $instance, 'add_reader_menu' ), 11 );
		add_action( 'wp_enqueue_scripts', array( $instance, 'enqueue_stylesheet' ) );
		add_action( 'admin_enqueue_scripts', array( $instance, 'enqueue_stylesheet' ) );
	}

	/**
	 * Enqueue the stylesheet used to display the Reader icon.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function enqueue_stylesheet() {
		$build_path = dirname( __DIR__ ) . '/build/reader-link.css';
		if ( ! file_exists( $build_path ) ) {
			return;
		}

		$asset_file = dirname( __DIR__ ) . '/build/reader-link.asset.php';
		$version    = file_exists( $asset_file )
			? include $asset_file
			: array( 'version' => filemtime( $build_path ) );

		wp_enqueue_style(
			'jetpack-newsletter-reader-link',
			plugins_url( '../build/reader-link.css', __FILE__ ),
			array(),
			$version['version'] ?? filemtime( $build_path )
		);
	}

	/**
	 * Add the Reader menu.
	 *
	 * Hook into 'admin_bar_menu' to add to the wp-admin bar.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar core object.
	 */
	public function add_reader_menu( $wp_admin_bar ) {
		$wp_admin_bar->add_menu(
			array(
				'id'     => 'reader',
				'title'  => '<span class="ab-icon" title="' . __( 'Read the blogs and topics you follow', 'jetpack-newsletter' ) . '" aria-hidden="true"></span>' .
							'<span class="ab-label">' . __( 'Reader', 'jetpack-newsletter' ) . '</span>',
				'href'   => Urls::maybe_add_origin_site_id( 'https://wordpress.com/reader' ),
				'meta'   => array(
					'class' => 'wp-admin-bar-reader',
				),
				'parent' => 'top-secondary',
			)
		);
	}

	/**
	 * Activate the wpcom-reader module when a site is first connected to WordPress.com.
	 *
	 * Only activates on truly fresh connections. If modules were previously initialized
	 * (e.g., the user disconnected and reconnected), we respect their prior module choices.
	 *
	 * @since $$next-version$$
	 */
	public static function activate_on_connection() {
		if ( \Jetpack_Options::get_option( 'active_modules_initialized' ) ) {
			return;
		}

		( new Modules() )->activate( 'wpcom-reader', false, false );
	}
}
