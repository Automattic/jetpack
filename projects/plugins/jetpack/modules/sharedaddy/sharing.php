<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Set up Sharing functionality and management in wp-admin.
 *
 * @package automattic/jetpack
 */

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move classes to appropriately-named class files.

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Sharing_Likes\Post_Sharing_Switch;
use Automattic\Jetpack\Sharing_Likes\Settings\Post_Handler;
use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config;
use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! defined( 'WP_SHARING_PLUGIN_URL' ) ) {
	define( 'WP_SHARING_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
	define( 'WP_SHARING_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

/**
 * Utilities to manage sharing settings from wp-admin.
 */
class Sharing_Admin {

	/**
	 * The services configuration UI.
	 *
	 * @var Services_Config
	 */
	private $services_config;

	/**
	 * Constructor.
	 * Hook into WordPress to add our functionality.
	 */
	public function __construct() {
		require_once WP_SHARING_PLUGIN_DIR . 'sharing-service.php';

		$this->services_config = new Services_Config();

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonces are handled in process_requests.
		if ( isset( $_GET['page'] ) && $_GET['page'] === 'sharing' ) {
			add_action( 'admin_init', array( $this, 'admin_init' ) );
		}

		// Insert our CSS and JS
		add_action( 'load-settings_page_sharing', array( $this, 'sharing_head' ) );

		// Catch AJAX
		add_action( 'wp_ajax_sharing_save_services', array( $this->services_config, 'ajax_save_services' ) );
		add_action( 'wp_ajax_sharing_save_options', array( $this->services_config, 'ajax_save_options' ) );
		add_action( 'wp_ajax_sharing_new_service', array( $this->services_config, 'ajax_new_service' ) );
		add_action( 'wp_ajax_sharing_delete_service', array( $this->services_config, 'ajax_delete_service' ) );
	}

	/**
	 * Enqueue scripts and styles on the sharing settings page.
	 *
	 * @return void
	 */
	public function sharing_head() {
		wp_enqueue_script(
			'sharing-js',
			Assets::get_file_url_for_environment(
				'_inc/build/sharedaddy/admin-sharing.min.js',
				'modules/sharedaddy/admin-sharing.js'
			),
			array( 'jquery', 'jquery-ui-draggable', 'jquery-ui-droppable', 'jquery-ui-sortable', 'jquery-form' ),
			JETPACK__VERSION,
			false
		);

		// admin-sharing.js reads this before it submits, so leaving it undefined breaks service removal.
		wp_add_inline_script(
			'sharing-js',
			'var sharing_loading_icon = ' . wp_json_encode( admin_url( '/images/loading.gif' ), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
			'before'
		);

		/**
		 * Filters the switch that if set to true allows Jetpack to use minified assets. Defaults to true
		 * if the SCRIPT_DEBUG constant is not set or set to false. The filter overrides it.
		 *
		 * @since 6.2.0
		 *
		 * @param boolean $var should Jetpack use minified assets.
		 */
		$postfix = apply_filters( 'jetpack_should_use_minified_assets', true ) ? '.min' : '';
		if ( is_rtl() ) {
			wp_enqueue_style( 'sharing-admin', WP_SHARING_PLUGIN_URL . 'admin-sharing-rtl' . $postfix . '.css', false, JETPACK__VERSION );
		} else {
			wp_enqueue_style( 'sharing-admin', WP_SHARING_PLUGIN_URL . 'admin-sharing' . $postfix . '.css', false, JETPACK__VERSION );
		}
		wp_enqueue_style( 'sharing', WP_SHARING_PLUGIN_URL . 'sharing.css', false, JETPACK__VERSION );

		wp_enqueue_style( 'social-logos' );
		wp_enqueue_script( 'sharing-js-fe', WP_SHARING_PLUGIN_URL . 'sharing.js', array(), 4, false );
		add_thickbox();
	}

	/**
	 * Load the process that handles saving changes on the sharing settings page.
	 *
	 * @return void
	 */
	public function admin_init() {
		$this->services_config->process_requests();
	}

	/**
	 * Save changes to sharing settings.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::process_requests() instead.
	 *
	 * @return void
	 */
	public function process_requests() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::process_requests' );
	}

	/**
	 * Register Sharing settings menu page in Settings > Sharing.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page::register_menu() instead.
	 *
	 * @return void
	 */
	public function subscription_menu() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page::register_menu' );
	}

	/**
	 * Save changes to sharing services via AJAX.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_save_services() instead.
	 *
	 * @return void
	 */
	public function ajax_save_services() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_save_services' );
	}

	/**
	 * Create a new custom sharing service via AJAX.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_new_service() instead.
	 *
	 * @return void
	 */
	public function ajax_new_service() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_new_service' );
	}

	/**
	 * Delete a sharing service via AJAX.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_delete_service() instead.
	 *
	 * @return void
	 */
	public function ajax_delete_service() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_delete_service' );
	}

	/**
	 * Save changes to sharing settings via AJAX.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_save_options() instead.
	 *
	 * @return void
	 */
	public function ajax_save_options() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_save_options' );
	}

	/**
	 * Display a preview of a sharing service.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::output_preview() instead.
	 *
	 * @param object $service Sharing service object.
	 *
	 * @return void
	 */
	public function output_preview( $service ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::output_preview' );
	}

	/**
	 * Display a specific sharing service.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::output_service() instead.
	 *
	 * @param string $id            Service unique ID.
	 * @param object $service       Sharing service.
	 * @param bool   $show_dropdown Display a dropdown. Not in use at the moment.
	 *
	 * @return void
	 */
	public function output_service( $id, $service, $show_dropdown = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::output_service' );
	}

	/**
	 * Display admin UI within a Jetpack header and footer.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page::render() instead.
	 *
	 * @return void
	 */
	public function wrapper_admin_page() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page::render' );
	}

	/**
	 * Sharing settings inner page structure.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page::render() instead.
	 *
	 * @return void
	 */
	public function management_page() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page::render' );
	}

	/**
	 * Check if we should encourage to use the site editor instead of the legacy sharing settings.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Environment instead.
	 *
	 * @return bool
	 */
	public function should_use_site_editor() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Environment' );
		return false;
	}

	/**
	 * Display services admin UI for settings.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::render() instead.
	 *
	 * @return void
	 */
	public function services_config_display() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::render' );
	}

	/**
	 * Display sharing block admin UI for settings.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Section::render() instead.
	 *
	 * @return void
	 */
	public function sharing_block_display() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Section::render' );
	}

	/**
	 * Display the "Go to the site editor" prompt.
	 *
	 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Section::render() instead.
	 *
	 * @return void
	 */
	public function site_editor_prompt_display() {
		_deprecated_function( __METHOD__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Section::render' );
	}
}

/**
 * Callback to get the value for the jetpack_sharing_enabled field.
 *
 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Post_Sharing_Switch::get_value() instead.
 *
 * @param array $post The post object.
 *
 * @return bool
 */
function jetpack_post_sharing_get_value( array $post ) {
	_deprecated_function( __FUNCTION__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Post_Sharing_Switch::get_value' );
	return Post_Sharing_Switch::get_value( $post );
}

/**
 * Callback to set sharing_disabled post_meta when the
 * jetpack_sharing_enabled field is updated.
 *
 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Post_Sharing_Switch::update_value() instead.
 *
 * @param bool    $enable_sharing Should sharing be enabled on this post.
 * @param WP_Post $post_object    The post object.
 *
 * @return int|bool
 */
function jetpack_post_sharing_update_value( $enable_sharing, $post_object ) {
	_deprecated_function( __FUNCTION__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Post_Sharing_Switch::update_value' );
	return Post_Sharing_Switch::update_value( $enable_sharing, $post_object );
}

/**
 * Add Sharing post_meta to the REST API Post response.
 *
 * @deprecated 16.3 Use Automattic\Jetpack\Sharing_Likes\Post_Sharing_Switch::register_rest_field() instead.
 */
function jetpack_post_sharing_register_rest_field() {
	_deprecated_function( __FUNCTION__, 'jetpack-16.3', 'Automattic\Jetpack\Sharing_Likes\Post_Sharing_Switch::register_rest_field' );
	Post_Sharing_Switch::register_rest_field();
}

Post_Sharing_Switch::init();

/**
 * Initialize sharing settings in WP Admin.
 *
 * @return void
 */
function sharing_admin_init() {
	global $sharing_admin;

	$sharing_admin = new Sharing_Admin();

	// load-jetpack.php registers the screen everywhere else, but does not run on
	// WordPress.com Simple, where this file is the only Sharing code loaded.
	if ( ( new Host() )->is_wpcom_simple() ) {
		Settings_Page::init();
		Post_Handler::init();
	}
}

add_action( 'init', 'sharing_admin_init' );
