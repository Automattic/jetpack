<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Set up Sharing functionality and management in wp-admin.
 *
 * @package automattic/jetpack
 */

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move classes to appropriately-named class files.

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config;

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
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::process_requests() instead.
	 *
	 * @return void
	 */
	public function process_requests() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Register Sharing settings menu page in Settings > Sharing.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page::register_menu() instead.
	 *
	 * @return void
	 */
	public function subscription_menu() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Save changes to sharing services via AJAX.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_save_services() instead.
	 *
	 * @return void
	 */
	public function ajax_save_services() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Create a new custom sharing service via AJAX.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_new_service() instead.
	 *
	 * @return void
	 */
	public function ajax_new_service() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Delete a sharing service via AJAX.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_delete_service() instead.
	 *
	 * @return void
	 */
	public function ajax_delete_service() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Save changes to sharing settings via AJAX.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::ajax_save_options() instead.
	 *
	 * @return void
	 */
	public function ajax_save_options() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Display a preview of a sharing service.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::output_preview() instead.
	 *
	 * @param object $service Sharing service object.
	 *
	 * @return void
	 */
	public function output_preview( $service ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Display a specific sharing service.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::output_service() instead.
	 *
	 * @param string $id            Service unique ID.
	 * @param object $service       Sharing service.
	 * @param bool   $show_dropdown Display a dropdown. Not in use at the moment.
	 *
	 * @return void
	 */
	public function output_service( $id, $service, $show_dropdown = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Display admin UI within a Jetpack header and footer.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page::render() instead.
	 *
	 * @return void
	 */
	public function wrapper_admin_page() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Sharing settings inner page structure.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page::render() instead.
	 *
	 * @return void
	 */
	public function management_page() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Check if we should encourage to use the site editor instead of the legacy sharing settings.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Environment instead.
	 *
	 * @return bool
	 */
	public function should_use_site_editor() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
		return false;
	}

	/**
	 * Display services admin UI for settings.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Services_Config::render() instead.
	 *
	 * @return void
	 */
	public function services_config_display() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Display sharing block admin UI for settings.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Section::render() instead.
	 *
	 * @return void
	 */
	public function sharing_block_display() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}

	/**
	 * Display the "Go to the site editor" prompt.
	 *
	 * @deprecated $$next-version$$ Use Automattic\Jetpack\Sharing_Likes\Settings\Sharing_Section::render() instead.
	 *
	 * @return void
	 */
	public function site_editor_prompt_display() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$' );
	}
}

/**
 * Callback to get the value for the jetpack_sharing_enabled field.
 *
 * When the sharing_disabled post_meta is unset, we follow the global setting in Sharing.
 * When it is set to 1, we disable sharing on the post, regardless of the global setting.
 * It is not possible to enable sharing on a post if it is disabled globally.
 *
 * @param array $post The post object.
 *
 * @return bool
 */
function jetpack_post_sharing_get_value( array $post ) {
	if ( ! isset( $post['id'] ) ) {
		return false;
	}

	// if sharing IS disabled on this post, enabled=false, so negate the meta
	return ! get_post_meta( $post['id'], 'sharing_disabled', true );
}

/**
 * Callback to set sharing_disabled post_meta when the
 * jetpack_sharing_enabled field is updated.
 *
 * When the sharing_disabled post_meta is unset, we follow the global setting in Sharing.
 * When it is set to 1, we disable sharing on the post, regardless of the global setting.
 * It is not possible to enable sharing on a post if it is disabled globally.
 *
 * @param bool    $enable_sharing Should sharing be enabled on this post.
 * @param WP_Post $post_object    The post object.
 *
 * @return int|bool
 */
function jetpack_post_sharing_update_value( $enable_sharing, $post_object ) {
	if ( $enable_sharing ) {
		// delete the override if we want to enable sharing
		return delete_post_meta( $post_object->ID, 'sharing_disabled' );
	} else {
		return update_post_meta( $post_object->ID, 'sharing_disabled', true );
	}
}

/**
 * Add Sharing post_meta to the REST API Post response.
 *
 * @action rest_api_init
 * @uses register_rest_field
 * @link https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/
 */
function jetpack_post_sharing_register_rest_field() {
	$post_types = get_post_types( array( 'public' => true ) );
	foreach ( $post_types as $post_type ) {
		register_rest_field(
			$post_type,
			'jetpack_sharing_enabled',
			array(
				'get_callback'    => 'jetpack_post_sharing_get_value',
				'update_callback' => 'jetpack_post_sharing_update_value',
				'schema'          => array(
					'description' => __( 'Are sharing buttons enabled?', 'jetpack' ),
					'type'        => 'boolean',
				),
			)
		);

		/**
		 * Ensures all public internal post-types support `sharing`
		 * This feature support flag is used by the REST API and Gutenberg.
		 */
		add_post_type_support( $post_type, 'jetpack-sharing-buttons' );
	}
}

// Add Sharing post_meta to the REST API Post response.
add_action( 'rest_api_init', 'jetpack_post_sharing_register_rest_field' );

// Some CPTs (e.g. Jetpack portfolios and testimonials) get registered with
// restapi_theme_init because they depend on theme support, so let's also hook to that
add_action( 'restapi_theme_init', 'jetpack_post_likes_register_rest_field', 20 );

/**
 * Initialize sharing settings in WP Admin.
 *
 * @return void
 */
function sharing_admin_init() {
	global $sharing_admin;

	$sharing_admin = new Sharing_Admin();
}

add_action( 'init', 'sharing_admin_init' );
