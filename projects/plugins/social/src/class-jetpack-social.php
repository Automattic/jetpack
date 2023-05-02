<?php
/**
 * Primary class file for the Jetpack Social plugin.
 *
 * @package automattic/jetpack-social-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

/**
 * Class Jetpack_Social
 */
class Jetpack_Social {
	const JETPACK_PUBLICIZE_MODULE_SLUG           = 'publicize';
	const JETPACK_SOCIAL_ACTIVATION_OPTION        = JETPACK_SOCIAL_PLUGIN_SLUG . '_activated';
	const JETPACK_SOCIAL_SHOW_PRICING_PAGE_OPTION = JETPACK_SOCIAL_PLUGIN_SLUG . '_show_pricing_page';
	const JETPACK_SOCIAL_REVIEW_DISMISSED_OPTION  = JETPACK_SOCIAL_PLUGIN_SLUG . '_review_prompt_dismissed';

	/**
	 * The connection manager used to check if we have a Jetpack connection.
	 *
	 * @var Connection_Manager
	 */
	private $manager = null;

	/**
	 * Constructor.
	 *
	 * @param Connection_Manager $connection_manager The Jetpack connection manager to use.
	 */
	public function __construct( $connection_manager = null ) {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Social', 'jetpack-social' ),
			_x( 'Social', 'The Jetpack Social product name, without the Jetpack prefix', 'jetpack-social' ),
			'manage_options',
			'jetpack-social',
			array( $this, 'plugin_settings_page' ),
			99
		);

		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );

		// Init Jetpack packages
		add_action(
			'plugins_loaded',
			function () {
				$config = new Automattic\Jetpack\Config();
				// Connection package.
				$config->ensure(
					'connection',
					array(
						'slug'     => JETPACK_SOCIAL_PLUGIN_SLUG,
						'name'     => JETPACK_SOCIAL_PLUGIN_NAME,
						'url_info' => JETPACK_SOCIAL_PLUGIN_URI,
					)
				);
				// Sync package.
				$config->ensure( 'sync' );

				// Identity crisis package.
				$config->ensure( 'identity_crisis' );

				if ( ! $this->is_connected() ) {
					return;
				}

				// Publicize package.
				$config->ensure(
					'publicize',
					array(
						'force_refresh' => true,
					)
				);
			},
			1
		);

		// Activate the module as the plugin is activated
		add_action( 'admin_init', array( $this, 'do_plugin_activation_activities' ) );
		add_action( 'activated_plugin', array( $this, 'redirect_after_activation' ) );

		add_action( 'jetpack_heartbeat', array( $this, 'refresh_plan_data' ) );

		add_action(
			'plugins_loaded',
			function () {
				My_Jetpack_Initializer::init();
			}
		);

		$this->manager = $connection_manager ? $connection_manager : new Connection_Manager();

		// Add REST routes
		add_action( 'rest_api_init', array( new Automattic\Jetpack\Social\REST_Settings_Controller(), 'register_rest_routes' ) );

		// Add block editor assets
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_editor_scripts' ) );

		// Add meta tags.
		add_action( 'wp_head', array( new Automattic\Jetpack\Social\Meta_Tags(), 'render_tags' ) );

		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'social_filter_available_modules' ), 10, 1 );

		add_filter( 'plugin_action_links_' . JETPACK_SOCIAL_PLUGIN_FOLDER . '/jetpack-social.php', array( $this, 'add_settings_link' ) );
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Check if we have a paid Jetpack Social plan.
	 */
	/**
	 * Check if the Publicize module is active.
	 *
	 * @return bool
	 */
	public static function is_publicize_active() {
		return ( new Modules() )->is_active( self::JETPACK_PUBLICIZE_MODULE_SLUG );
	}

	/**
	 * Get the version number of the plugin.
	 *
	 * @return string
	 */
	public function get_plugin_version() {
		$plugin_data    = get_plugin_data( JETPACK_SOCIAL_PLUGIN_ROOT_FILE );
		$plugin_version = $plugin_data['Version'];

		return ! empty( $plugin_version ) ? $plugin_version : '';
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {
		$screen = get_current_screen();
		if ( ! empty( $screen ) && 'jetpack_page_jetpack-social' !== $screen->base ) {
			return;
		}

		Assets::register_script(
			'jetpack-social',
			'build/index.js',
			JETPACK_SOCIAL_PLUGIN_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-social',
			)
		);

		Assets::enqueue_script( 'jetpack-social' );
		// Initial JS state including JP Connection data.
		wp_add_inline_script( 'jetpack-social', Connection_Initial_State::render(), 'before' );
		wp_add_inline_script( 'jetpack-social', $this->render_initial_state(), 'before' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render_initial_state() {
		return 'var jetpackSocialInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->initial_state() ) ) . '"));';
	}

	/**
	 * Refresh plan data.
	 */
	public function refresh_plan_data() {
		Current_Plan::refresh_from_wpcom();
	}

	/**
	 * Get the shares data, but cache it so we don't call the API
	 * more than once per request.
	 *
	 * @return array The shares data.
	 */
	public function get_shares_info() {
		global $publicize;
		static $shares_info = null;
		if ( ! $shares_info ) {
			$shares_info = $publicize->get_publicize_shares_info( Jetpack_Options::get_option( 'id' ) );
		}
		return ! is_wp_error( $shares_info ) ? $shares_info : null;
	}

	/**
	 * Get the initial state data for hydrating the React UI.
	 *
	 * @return array
	 */
	public function initial_state() {
		global $publicize;

		$state = array(
			'siteData' => array(
				'adminUrl'          => esc_url( admin_url() ),
				'apiRoot'           => esc_url_raw( rest_url() ),
				'apiNonce'          => wp_create_nonce( 'wp_rest' ),
				'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
				'siteSuffix'        => ( new Status() )->get_site_suffix(),
				'pluginVersion'     => $this->get_plugin_version(),
			),
		);

		if ( $this->is_connected() ) {
			$sig_settings = new Automattic\Jetpack\Publicize\Social_Image_Generator\Settings();

			$state = array_merge(
				$state,
				array(
					'jetpackSettings'              => array(
						'publicize_active'  => self::is_publicize_active(),
						'show_pricing_page' => self::should_show_pricing_page(),
						'showNudge'         => ! $publicize->has_paid_plan( true ),
					),
					'connectionData'               => array(
						'connections' => $publicize->get_all_connections_for_user(), // TODO: Sanitize the array
						'adminUrl'    => esc_url_raw( $publicize->publicize_connections_url( 'jetpack-social-connections-admin-page' ) ),
					),
					'sharesData'                   => $publicize->get_publicize_shares_info( Jetpack_Options::get_option( 'id' ) ),
					'socialImageGeneratorSettings' => array(
						'available'       => $sig_settings->is_available(),
						'enabled'         => $sig_settings->is_enabled(),
						'defaultTemplate' => $sig_settings->get_default_template(),
					),
				)
			);
		}

		return $state;
	}

	/**
	 * Returns a boolean as to whether we have a plan that supports
	 * sharing beyond the free limit.
	 *
	 * It also caches the result to make sure that we don't call the API
	 * more than once a request.
	 *
	 * @returns boolean True if the site has a plan that supports a higher share limit.
	 */
	public function has_paid_plan() {
		static $has_plan = null;
		if ( null === $has_plan ) {
			$has_plan = Current_Plan::supports( 'social-shares-1000', true );
		}
		return $has_plan;
	}

	/**
	 * Checks to see if the current post supports Publicize
	 *
	 * @return boolean True if Publicize is supported
	 */
	public function is_supported_post() {
		$post_type = get_post_type();
		return ! empty( $post_type ) && post_type_supports( $post_type, 'publicize' );
	}

	/**
	 * Enqueue block editor scripts and styles.
	 */
	public function enqueue_block_editor_scripts() {
		global $publicize;

		if (
			! $this->is_connected() ||
			! self::is_publicize_active() ||
			class_exists( 'Jetpack' ) ||
			! $this->is_supported_post()
		) {
			return;
		}

		Assets::register_script(
			'jetpack-social-editor',
			'build/editor.js',
			JETPACK_SOCIAL_PLUGIN_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-social',
			)
		);

		Assets::enqueue_script( 'jetpack-social-editor' );

		$sig_settings = ( new Automattic\Jetpack\Publicize\Social_Image_Generator\Settings() );

		wp_localize_script(
			'jetpack-social-editor',
			'Jetpack_Editor_Initial_State',
			array(
				'siteFragment' => ( new Status() )->get_site_suffix(),
				'social'       => array(
					'adminUrl'                        => esc_url_raw( admin_url( 'admin.php?page=jetpack-social' ) ),
					'sharesData'                      => $publicize->get_publicize_shares_info( Jetpack_Options::get_option( 'id' ) ),
					'reviewRequestDismissed'          => self::is_review_request_dismissed(),
					'dismissReviewRequestPath'        => '/jetpack/v4/social/review-dismiss',
					'connectionRefreshPath'           => '/jetpack/v4/publicize/connection-test-results',
					'resharePath'                     => '/jetpack/v4/publicize/{postId}',
					'publicizeConnectionsUrl'         => esc_url_raw(
						'https://jetpack.com/redirect/?source=jetpack-social-connections-block-editor&site='
					),
					'hasPaidPlan'                     => $publicize->has_paid_plan(),
					'isEnhancedPublishingEnabled'     => $publicize->is_enhanced_publishing_enabled( Jetpack_Options::get_option( 'id' ) ),
					'isSocialImageGeneratorAvailable' => $sig_settings->is_available(),
					'isSocialImageGeneratorEnabled'   => $sig_settings->is_enabled(),
				),
			)
		);

		// Connection initial state is expected when the connection JS package is in the bundle
		wp_add_inline_script( 'jetpack-social-editor', Connection_Initial_State::render(), 'before' );
		// Conditionally load analytics scripts
		// The only component using analytics in the editor at the moment is the review request
		if ( ! in_array( get_post_status(), array( 'publish', 'private', 'trash' ), true ) && self::can_use_analytics() && ! self::is_review_request_dismissed() ) {
			Tracking::register_tracks_functions_scripts( true );
		}
	}

	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
			<div id="jetpack-social-root"></div>
		<?php
	}

	/**
	 * Activate the Publicize module on plugin activation.
	 *
	 * @static
	 */
	public static function plugin_activation() {
		add_option( self::JETPACK_SOCIAL_ACTIVATION_OPTION, true );
	}

	/**
	 * Helper to check that we have a Jetpack connection.
	 */
	private function is_connected() {
		return $this->manager->is_connected() && $this->manager->has_connected_user();
	}

	/**
	 * Runs on admin_init, and does actions required on plugin activation, based on
	 * the activation option.
	 *
	 * This needs to be run after the activation hook, as that results in a redirect,
	 * and we need the sync module's actions and filters to be registered.
	 */
	public function do_plugin_activation_activities() {
		if ( get_option( self::JETPACK_SOCIAL_ACTIVATION_OPTION ) && $this->is_connected() ) {
			$this->calculate_scheduled_shares();
			$this->activate_module();
		}
	}

	/**
	 * Redirect to the plugin settings page after activation.
	 *
	 * @param string $plugin Path to the plugin file relative to the plugins directory.
	 */
	public function redirect_after_activation( $plugin ) {
		if (
			JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH === $plugin &&
			\Automattic\Jetpack\Plugins_Installer::is_current_request_activating_plugin_from_plugins_screen( JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH )
		) {
			wp_safe_redirect( esc_url( admin_url( 'admin.php?page=' . JETPACK_SOCIAL_PLUGIN_SLUG ) ) );
			exit;
		}
	}

	/**
	 * Activates the Publicize module and disables the activation option
	 */
	public function activate_module() {
		delete_option( self::JETPACK_SOCIAL_ACTIVATION_OPTION );
		( new Modules() )->activate( self::JETPACK_PUBLICIZE_MODULE_SLUG, false, false );
	}

	/**
	 * Calls out to WPCOM to calculate the scheduled shares.
	 */
	public function calculate_scheduled_shares() {
		global $publicize;
		$publicize->calculate_scheduled_shares( Jetpack_Options::get_option( 'id' ) );
	}

	/**
	 * Adds module to the list of available modules
	 *
	 * @param array $modules The available modules.
	 * @return array
	 */
	public function social_filter_available_modules( $modules ) {
		return array_merge( array( self::JETPACK_PUBLICIZE_MODULE_SLUG ), $modules );
	}

	/**
	 * Check if the pricing page should be displayed.
	 *
	 * @return bool
	 */
	public static function should_show_pricing_page() {
		return (bool) get_option( self::JETPACK_SOCIAL_SHOW_PRICING_PAGE_OPTION, 1 );
	}

	/**
	 * Check to see if the request to review the plugin has already been dismissed.
	 * This will also return true if Jetpack promotions are disabled via a filter ( allows this prompt to be disabled )
	 *
	 * @return bool
	 */
	public static function is_review_request_dismissed() {
		$saved_as_dismissed         = (bool) get_option( self::JETPACK_SOCIAL_REVIEW_DISMISSED_OPTION, false );
		$jetpack_promotions_enabled = apply_filters( 'jetpack_show_promotions', true );

		return $saved_as_dismissed || ! $jetpack_promotions_enabled;
	}

	/**
	 * Returns whether we are in condition to track to use
	 * Analytics functionality like Tracks, MC, or GA.
	 */
	public static function can_use_analytics() {
		$status     = new Status();
		$connection = new Connection_Manager();
		$tracking   = new Tracking( 'jetpack', $connection );

		return $tracking->should_enable_tracking( new Terms_Of_Service(), $status );
	}

	/**
	 * Add a link to the admin page from the plugins page.
	 *
	 * @param array $actions The plugin actions.
	 * @return array
	 */
	public function add_settings_link( $actions ) {
		return array_merge(
			array( '<a href="' . esc_url( admin_url( 'admin.php?page=' . JETPACK_SOCIAL_PLUGIN_SLUG ) ) . '">' . __( 'Settings', 'jetpack-social' ) . '</a>' ),
			$actions
		);
	}
}
