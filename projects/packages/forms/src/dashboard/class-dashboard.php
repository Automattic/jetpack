<?php
/**
 * Jetpack forms dashboard.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin;
use Automattic\Jetpack\Forms\Jetpack_Forms;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Tracking;

/**
 * Handles the Jetpack Forms dashboard.
 */
class Dashboard {
	/**
	 * Script handle for the JS file we enqueue in the Feedback admin page.
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'jp-forms-dashboard';

	/**
	 * Priority for the dashboard menu.
	 * Needs to be high enough for us to be able to unregister the default edit.php menu item.
	 *
	 * @var int
	 */
	const MENU_PRIORITY = 999;

	/**
	 * Whether the integrations tab is enabled.
	 *
	 * @var bool
	 */
	public static $show_integrations = false;

	/**
	 * Dashboard_View_Switch instance
	 *
	 * @var Dashboard_View_Switch
	 */
	private $switch;

	/**
	 * Creates a new Dashboard instance.
	 *
	 * @param Dashboard_View_Switch|null $switch Dashboard_View_Switch instance to use.
	 */
	public function __construct( ?Dashboard_View_Switch $switch = null ) {
		$this->switch = $switch ?? new Dashboard_View_Switch();

		// Set the integrations tab feature flag
		self::$show_integrations = apply_filters( 'jetpack_forms_enable_integrations_tab', false );
	}

	/**
	 * Initialize the dashboard.
	 */
	public function init() {
		add_action( 'admin_menu', array( $this, 'add_admin_submenu' ), self::MENU_PRIORITY );
		add_action( 'admin_menu', array( $this, 'add_new_admin_submenu' ), self::MENU_PRIORITY );

		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );

		$this->switch->init();
	}

	/**
	 * Load JavaScript for the dashboard.
	 */
	public function load_admin_scripts() {
		if ( ! $this->switch->is_modern_view() && ! $this->switch->is_jetpack_forms_admin_page() ) {
			return;
		}

		Assets::register_script(
			self::SCRIPT_HANDLE,
			'../../dist/dashboard/jetpack-forms-dashboard.js',
			__FILE__,
			array(
				'in_footer'    => true,
				'textdomain'   => 'jetpack-forms',
				'enqueue'      => true,
				'dependencies' => array( 'wp-api-fetch' ),
			)
		);

		if ( Contact_Form_Plugin::can_use_analytics() ) {
			Tracking::register_tracks_functions_scripts( true );
		}

		// Adds Connection package initial state.
		Connection_Initial_State::render_script( self::SCRIPT_HANDLE );

		$api_root = defined( 'IS_WPCOM' ) && IS_WPCOM
			? sprintf( '/wpcom/v2/sites/%s/', esc_url_raw( rest_url() ) )
			: '/wp-json/wpcom/v2/';

		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			'window.jetpackFormsData = ' . wp_json_encode( array( 'apiRoot' => $api_root ) ) . ';',
			'before'
		);
	}

	/**
	 * Register the dashboard admin submenu.
	 */
	public function add_admin_submenu() {
		if ( Jetpack_Forms::is_legacy_menu_item_retired() ) {
			return;
		}

		if ( $this->switch->get_preferred_view() === Dashboard_View_Switch::CLASSIC_VIEW ) {
			// We still need to register the jetpack forms page so it can be accessed manually.
			// NOTE: adding submenu this (parent = '') way DOESN'T SHOW ANYWHERE,
			// it's done just so the page URL doesn't break.
			add_submenu_page(
				'',
				__( 'Form Responses', 'jetpack-forms' ),
				_x( 'Form Responses', 'menu label for form responses', 'jetpack-forms' ),
				'edit_pages',
				'jetpack-forms',
				array( $this, 'render_dashboard' )
			);

			return;
		}

		$is_wpcom = ( new Host() )->is_wpcom_simple();

		// MODERN VIEW -- remove the old submenu and add the new one.
		// Check if Polldaddy/Crowdsignal plugin is active
		if ( ! $is_wpcom && ! is_plugin_active( 'polldaddy/polldaddy.php' ) ) {
			remove_menu_page( 'feedback' );

			add_menu_page(
				__( 'Form Responses', 'jetpack-forms' ),
				_x( 'Feedback', 'post type name shown in menu', 'jetpack-forms' ),
				'edit_pages',
				'jetpack-forms',
				array( $this, 'render_dashboard' ),
				'dashicons-feedback',
				25 // Places 'Feedback' under 'Comments' in the menu
			);
		} else {
			remove_submenu_page( 'feedback', 'edit.php?post_type=feedback' );

			add_submenu_page(
				'feedback',
				__( 'Form Responses', 'jetpack-forms' ),
				_x( 'Form Responses', 'menu label for form responses', 'jetpack-forms' ),
				'edit_pages',
				'jetpack-forms',
				array( $this, 'render_dashboard' ),
				0 // as far top as we can go since responses are the default feedback page.
			);
		}
	}

	/**
	 * Register the NEW dashboard admin submenu Forms under Jetpack menu.
	 */
	public function add_new_admin_submenu() {
		if ( ! $this->switch->is_jetpack_forms_admin_page_available() ) {
			return;
		}

		Admin_Menu::add_menu(
			__( 'Jetpack Forms', 'jetpack-forms' ),
			_x( 'Forms', 'submenu title for Jetpack Forms', 'jetpack-forms' ),
			'edit_pages',
			'jetpack-forms-admin',
			array( $this, 'render_new_dashboard' )
		);
	}

	/**
	 * Render the new dashboard.
	 */
	public function render_new_dashboard() {
		$this->render_dashboard( array( 'renderMigrationPage' => false ) );
	}

	/**
	 * Render the dashboard.
	 *
	 * @param array $extra_config Extra configuration to pass to the dashboard.
	 */
	public function render_dashboard( $extra_config = array() ) {
		if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';
		}

		$ai_feature = \Jetpack_AI_Helper::get_ai_assistance_feature();
		$has_ai     = ! is_wp_error( $ai_feature ) ? $ai_feature['has-feature'] : false;

		$config = array(
			'blogId'                  => get_current_blog_id(),
			'exportNonce'             => wp_create_nonce( 'feedback_export' ),
			'newFormNonce'            => wp_create_nonce( 'create_new_form' ),
			'gdriveConnectSupportURL' => esc_url( Redirect::get_url( 'jetpack-support-contact-form-export' ) ),
			'checkForSpamNonce'       => wp_create_nonce( 'grunion_recheck_queue' ),
			'pluginAssetsURL'         => Jetpack_Forms::assets_url(),
			'siteURL'                 => ( new Status() )->get_site_suffix(),
			'hasFeedback'             => $this->has_feedback(),
			'hasAI'                   => $has_ai,
			'enableIntegrationsTab'   => self::$show_integrations,
			'renderMigrationPage'     => $this->switch->is_jetpack_forms_announcing_new_menu(),
			'dashboardURL'            => $this->switch->get_forms_admin_url(),
		);
		if ( ! empty( $extra_config ) ) {
			$config = array_merge( $config, $extra_config );
		}
		?>
		<div id="jp-forms-dashboard" data-config="<?php echo esc_attr( wp_json_encode( $config, JSON_FORCE_OBJECT ) ); ?>"></div>
		<?php
	}

	/**
	 * Returns true if there are any feedback posts on the site.
	 *
	 * @return boolean
	 */
	private function has_feedback() {
		$posts = new \WP_Query(
			array(
				'post_type'   => 'feedback',
				'post_status' => array( 'publish', 'draft', 'spam', 'trash' ),
			)
		);

		return $posts->found_posts > 0;
	}
}
