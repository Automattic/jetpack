<?php
/**
 * Class to control the WPCOM Launchpad Navigator feature.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Class WPCOM_Launchpad_Navigator
 */
class WPCOM_Launchpad_Navigator {
	/**
	 * Class instance.
	 *
	 * @var WPCOM_Launchpad_Navigator
	 */
	private static $instance = null;

	/**
	 * Plugin version.
	 *
	 * @var string
	 */
	private static $version = null;

	/**
	 * Admin Bar details.
	 *
	 * @var array
	 */
	private $admin_bar_asset_details = null;

	/**
	 * Admin Bar asset version.
	 *
	 * @var string
	 */
	private $admin_bar_asset_version = null;

	/**
	 * Editor details.
	 *
	 * @var array
	 */
	private $editor_asset_details = null;

	/**
	 * Editor asset version.
	 *
	 * @var string
	 */
	private $editor_asset_version = null;

	/**
	 * Launchpad_Navigator constructor.
	 */
	public function __construct() {
		$this->version = \Automattic\Jetpack\Jetpack_Mu_Wpcom::PACKAGE_VERSION;

		$build_path = self::get_built_asset_path();

		$this->editor_asset_details = include $build_path . 'launchpad-navigator/wpcom-launchpad-navigator-editor.asset.php';
		$this->editor_asset_version = $this->editor_asset_details['version'];

		$this->admin_bar_asset_details = include $build_path . 'launchpad-navigator/wpcom-launchpad-navigator-admin-bar.asset.php';
		$this->admin_bar_asset_version = $this->admin_bar_asset_details['version'];

		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_scripts' ), 100 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_wp_admin_scripts' ), 100 );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_wp_admin_scripts' ), 100 );
	}

	/**
	 * Gets the singleton instance.
	 *
	 * @return Launchpad_Navigator
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Get the base directory for the jetpack-mu-wpcom package.
	 *
	 * @return string The base directory path.
	 */
	public static function get_plugin_base_directory() {
		return dirname( dirname( dirname( __DIR__ ) ) );
	}

	/**
	 * Get the path to the build directory, or a subdirectory below that.
	 *
	 * @param string $sub_path Optional. Subdirectory to get the path to.
	 * @return string The directory or file path.
	 */
	public static function get_built_asset_path( $sub_path = '' ) {
		return self::get_plugin_base_directory() . '/build/' . $sub_path;
	}

	/**
	 * Enqueue the scripts needed in the editor.
	 */
	public function enqueue_editor_scripts() {
		$script_dependencies = array();
		if ( isset( $this->editor_asset_details['dependencies'] ) && is_array( $this->editor_asset_details['dependencies'] ) ) {
			$script_dependencies = $this->editor_asset_details['dependencies'];
		}

		wp_enqueue_script(
			'wpcom-launchpad-navigator-editor',
			plugins_url( 'build/launchpad-navigator/wpcom-launchpad-navigator-editor.js', self::get_plugin_base_directory() . '/src' ),
			$script_dependencies,
			$this->editor_asset_version,
			true
		);
	}

	/**
	 * Enqueues the WP Admin scripts if we detect they should be used.
	 */
	public function enqueue_wp_admin_scripts() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		if ( ! is_admin() || ! $this->has_admin_bar() || $this->is_site_editor() || $this->is_block_editor() ) {
			return;
		}

		// Enqueue wp-component styles because they're not enqueued in wp-admin outside of the editor.
		if ( function_exists( 'gutenberg_url' ) ) {
			wp_enqueue_style(
				'wp-components',
				gutenberg_url( 'build/components/style' . ( is_rtl() ? '.rtl.css' : '.css' ) ),
				array( 'dashicons' ),
				$this->editor_asset_version
			);
		}

		// Crazy high number inorder to prevent Jetpack removing it
		// https://github.com/Automattic/jetpack/blob/30213ee594cd06ca27199f73b2658236fda24622/projects/plugins/jetpack/modules/masterbar/masterbar/class-masterbar.php#L196.
		add_action(
			'wp_before_admin_bar_render',
			array( $this, 'add_launchpad_navigator_to_admin_bar' ),
			100000
		);

		$script_dependencies = array();
		if ( isset( $this->admin_bar_asset_details['dependencies'] ) && is_array( $this->admin_bar_asset_details['dependencies'] ) ) {
			$script_dependencies = $this->admin_bar_asset_details['dependencies'];
		}

		wp_enqueue_script(
			'wpcom-launchpad-navigator-admin-bar',
			plugins_url( 'build/launchpad-navigator/wpcom-launchpad-navigator-admin-bar.js', self::get_plugin_base_directory() . '/src' ),
			$script_dependencies,
			$this->admin_bar_asset_version,
			true
		);

		wp_localize_script(
			'wpcom-launchpad-navigator-admin-bar',
			'wpcomLaunchpadNavigatorAdminBar',
			array(
				'isLoaded' => true,
			)
		);
	}

	/**
	 * Returns true if the admin bar is set.
	 *
	 * @return bool
	 */
	public function has_admin_bar() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		global $wp_admin_bar;
		return is_object( $wp_admin_bar );
	}

	/**
	 * Returns true if the current screen is the site editor.
	 *
	 * @return bool
	 */
	public function is_site_editor() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		global $current_screen;
		return ( function_exists( 'gutenberg_is_edit_site_page' ) && gutenberg_is_edit_site_page( $current_screen->id ) );
	}

	/**
	 * Returns true if the current screen is the block editor.
	 *
	 * @return bool
	 */
	public function is_block_editor() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';

		global $current_screen;
		return $current_screen->is_block_editor;
	}

	/**
	 * Add the Launchpad Navigator item to the Admin Bar.
	 */
	public function add_launchpad_navigator_to_admin_bar() {
		global $wp_admin_bar;

		$wp_admin_bar->add_menu(
			array(
				'id'     => 'wpcom-launchpad-navigator',
				'title'  => file_get_contents( __DIR__ . '/icon.svg', true ),
				'parent' => 'top-secondary',
				'meta'   => array(
					'html'  => '<div id="wpcom-launchpad-navigator-adminbar" />',
					'class' => 'menupop',
				),
			)
		);
	}
}

add_action( 'init', array( 'WPCOM_Launchpad_Navigator', 'init' ) );
