<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-classic-theme-helper
 */

namespace Automattic\Jetpack\Classic_Theme_Helper;

use WP_Error;

/**
 * Classic Theme Helper Loader.
 */
class Main {

	const PACKAGE_VERSION = '0.9.3';

	/**
	 * Modules to include.
	 *
	 * @var array
	 */
	public $modules = array(
		'custom-content-types.php',
		'responsive-videos.php',
		'site-breadcrumbs.php',
		'social-menu.php',
		'jetpack-color.php',
		'content-options.php',
	);

	/** Holds the singleton instance of the Loader
	 *
	 * @var Main
	 */
	public static $instance = null;

	/**
	 * Initialize the Loader.
	 */
	public static function init() {
		if ( ! self::$instance ) {
			self::$instance = new Main();
			self::$instance->load_modules();
			// TODO Commenting below since we still load them from theme-tools module
			add_action( 'init', array( __CLASS__, 'jetpack_load_theme_tools' ), 30 );
			// phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			// add_action( 'after_setup_theme', array( __CLASS__, 'jetpack_load_theme_compat' ), -1 );
		}

		return self::$instance;
	}

	/**
	 * Load modules.
	 */
	public function load_modules() {

		// Filter the modules to include.
		// $since = 0.1.0
		// @param array $modules Array of modules to include.
		$modules = apply_filters( 'jetpack_classic_theme_helper_modules', $this->modules );
		foreach ( $modules as $module ) {
			require_once __DIR__ . '/' . $module;
		}
	}

	/**
	 * Conditionally require the Tonesque lib depending on theme support.
	 */
	public static function jetpack_load_theme_tools() {
		if ( current_theme_supports( 'tonesque' ) ) {
			require_once __DIR__ . '/../_inc/lib/tonesque.php';
		}
	}

	/**
	 * Load theme compat file if it exists.
	 */
	public static function jetpack_load_theme_compat() {

		/**
		 * Filter theme compat files.
		 *
		 * Themes can add their own compat files here if they like. For example:
		 *
		 * add_filter( 'jetpack_theme_compat_files', 'mytheme_jetpack_compat_file' );
		 * function mytheme_jetpack_compat_file( $files ) {
		 *     $files['mytheme'] = locate_template( 'jetpack-compat.php' );
		 *     return $files;
		 * }
		 *
		 * @since 0.2.0
		 *
		 * @param array Associative array of theme compat files to load.
		 */
		$compat_files = apply_filters(
			'jetpack_theme_compat_files',
			array(
				'twentyfourteen'  => __DIR__ . '/compat/twentyfourteen.php',
				'twentyfifteen'   => __DIR__ . '/compat/twentyfifteen.php',
				'twentysixteen'   => __DIR__ . '/compat/twentysixteen.php',
				'twentynineteen'  => __DIR__ . '/compat/twentynineteen.php',
				'twentytwenty'    => __DIR__ . '/compat/twentytwenty.php',
				'twentytwentyone' => __DIR__ . '/compat/twentytwentyone.php',
			)
		);

		self::jetpack_require_compat_file( get_stylesheet(), $compat_files );

		if ( is_child_theme() ) {
			self::jetpack_require_compat_file( get_template(), $compat_files );
		}
	}

	/**
	 * Requires a file once, if the passed key exists in the files array.
	 *
	 * @param string $key The key to check.
	 * @param array  $files Array of files to check in.
	 * @return void|WP_Error
	 */
	private static function jetpack_require_compat_file( $key, $files ) {
		if ( ! is_string( $key ) ) {
			return new WP_Error( 'key_not_string', 'The specified key is not actually a string.', compact( 'key' ) );
		}

		if ( array_key_exists( $key, $files ) && is_readable( $files[ $key ] ) ) {
			require_once $files[ $key ];
		}
	}
}

Main::init();
