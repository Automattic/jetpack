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
use Automattic\Jetpack\Tracking;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

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

	const ADMIN_SLUG = 'jetpack-forms-admin';

	/**
	 * Priority for the dashboard menu.
	 * Needs to be high enough for us to be able to unregister the default edit.php menu item.
	 *
	 * @var int
	 */
	const MENU_PRIORITY = 999;

	/**
	 * Initialize the dashboard.
	 */
	public function init() {
		add_action( 'admin_menu', array( $this, 'add_new_admin_submenu' ), self::MENU_PRIORITY );

		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );

		// Removed all admin notices on the Jetpack Forms admin page.
		if ( isset( $_GET['page'] ) && $_GET['page'] === self::ADMIN_SLUG ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			remove_all_actions( 'admin_notices' );
		}
	}

	/**
	 * Load JavaScript for the dashboard.
	 */
	public function load_admin_scripts() {
		if ( ! self::is_jetpack_forms_admin_page() ) {
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

		// Preload Forms endpoints needed in dashboard context.
		$preload_paths = array(
			'/wp/v2/feedback/config',
			'/wp/v2/feedback/config?_locale=user',
			'/wp/v2/feedback/integrations?version=2',
			'/wp/v2/feedback/integrations?version=2&_locale=user',
		);
		$preload_data  = array_reduce( $preload_paths, 'rest_preload_api_request', array() );
		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			'wp.apiFetch.use( wp.apiFetch.createPreloadingMiddleware( ' . wp_json_encode( $preload_data ) . ' ) );',
			'before'
		);
	}

	/**
	 * Register the NEW dashboard admin submenu Forms under Jetpack menu.
	 */
	public function add_new_admin_submenu() {
		Admin_Menu::add_menu(
			/** "Jetpack Forms" and "Forms" are Product names, do not translate. */
			'Jetpack Forms',
			'Forms',
			'edit_pages',
			self::ADMIN_SLUG,
			array( $this, 'render_dashboard' ),
			10
		);
	}

	/**
	 * Render the dashboard.
	 */
	public function render_dashboard() {
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
			'dashboardURL'            => self::get_forms_admin_url(),
			'isMailpoetEnabled'       => Jetpack_Forms::is_mailpoet_enabled(),
		);

		?>
		<div id="jp-forms-dashboard" data-config="<?php echo esc_attr( wp_json_encode( $config, JSON_FORCE_OBJECT ) ); ?>"></div>
		<?php
	}

	/**
	 * Returns true if there are any feedback posts on the site.
	 *
	 * @return boolean
	 */
	public function has_feedback() {
		$posts = new \WP_Query(
			array(
				'post_type'   => 'feedback',
				'post_status' => array( 'publish', 'draft', 'spam', 'trash' ),
			)
		);

		return $posts->found_posts > 0;
	}

	/**
	 * Returns url of forms admin page.
	 *
	 * @param string|null $tab Tab to open in the forms admin page.
	 *
	 * @return string
	 */
	public static function get_forms_admin_url( $tab = null ) {
		$base_url = get_admin_url() . 'admin.php?page=jetpack-forms-admin';

		return self::append_tab_to_url( $base_url, $tab );
	}

	/**
	 * Appends the appropriate tab parameter to the URL based on the view type.
	 *
	 * @param string $url              Base URL to append to.
	 * @param string $tab              Tab to open.
	 *
	 * @return string
	 */
	private static function append_tab_to_url( $url, $tab ) {
		$valid_tabs = array( 'spam', 'inbox', 'trash' );
		if ( ! in_array( $tab, $valid_tabs, true ) ) {
			return $url;
		}

		return $url . '#/responses?status=' . $tab;
	}

	/**
	 * Returns true if the current screen is the Jetpack Forms admin page.
	 *
	 * @return boolean
	 */
	public static function is_jetpack_forms_admin_page() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		$screen = get_current_screen();
		return $screen && $screen->id === 'jetpack_page_jetpack-forms-admin';
	}
}
