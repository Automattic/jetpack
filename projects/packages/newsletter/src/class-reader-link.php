<?php
/**
 * A class that adds a link to the WordPress.com Reader to the admin bar.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Connection\Urls;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;
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
	 * @since 0.4.0
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
	 * @since 0.4.0
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
	 * @since 0.4.0
	 *
	 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar core object.
	 */
	public function add_reader_menu( $wp_admin_bar ) {
		$reader_menu_settings = array(
			'id'     => 'reader',
			'title'  => '<span class="ab-icon" title="' . __( 'Read the blogs and topics you follow', 'jetpack-newsletter' ) . '" aria-hidden="true"></span>' .
						'<span class="ab-label">' . __( 'Reader', 'jetpack-newsletter' ) . '</span>',
			'href'   => method_exists( Urls::class, 'maybe_add_origin_site_id' )
						? Urls::maybe_add_origin_site_id( 'https://wordpress.com/reader' )
						: 'https://wordpress.com/reader',
			'meta'   => array(
				'class' => 'wp-admin-bar-reader',
			),
			'parent' => 'top-secondary',
		);

		/*
		 * On self-hosted sites, open the Reader link in a new tab
		 * since they're not necessarily logged in to WordPress.com
		 * and may not want to navigate away from their site.
		 */
		if ( ! ( new Host() )->is_wpcom_platform() ) {
			$reader_menu_settings['meta']['target'] = '_blank';
		}

		$wp_admin_bar->add_menu( $reader_menu_settings );
	}

	/**
	 * Activate the wpcom-reader module when a site is first connected to WordPress.com.
	 *
	 * Only activates on truly fresh connections. If modules were previously initialized
	 * (e.g., the user disconnected and reconnected), we respect their prior module choices.
	 *
	 * @since 0.4.0
	 */
	public static function activate_on_connection() {
		if ( \Jetpack_Options::get_option( 'active_modules_initialized' ) ) {
			return;
		}

		( new Modules() )->activate( 'wpcom-reader', false, false );
	}
}
