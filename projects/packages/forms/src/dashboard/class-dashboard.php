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
use Automattic\Jetpack\Tracking;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Handles the Jetpack Forms dashboard.
 */
class Dashboard {

	/**
	 * Load wp-build generated files if available.
	 * This is for the new DataViews-based responses list.
	 */
	public static function load_wp_build() {
		if ( self::get_admin_query_page() === self::FORMS_WPBUILD_ADMIN_SLUG ) {
			$wp_build_index = dirname( __DIR__, 2 ) . '/build/build.php';
			if ( file_exists( $wp_build_index ) ) {
				require_once $wp_build_index;
			}
		}
	}

	/**
	 * Script handle for the JS file we enqueue in the Feedback admin page.
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'jp-forms-dashboard';

	const ADMIN_SLUG = 'jetpack-forms-admin';

	/**
	 * Slug for the wp-admin integrated Responses UI (wp-build page).
	 *
	 * Note: This must be a valid submenu slug (sanitize_key compatible), not a full URL.
	 *
	 * @var string
	 */
	const FORMS_WPBUILD_ADMIN_SLUG = 'jetpack-forms-responses-wp-admin';

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
		$is_wp_build_enabled = apply_filters( 'jetpack_forms_alpha', false );

		if ( $is_wp_build_enabled ) {
			// Load wp-build generated files for the new DataViews-based UI.
			self::load_wp_build();
		}

		add_action( 'admin_menu', array( $this, 'add_new_admin_submenu' ), self::MENU_PRIORITY );

		if ( $is_wp_build_enabled ) {
			add_action( 'admin_menu', array( $this, 'add_forms_wpbuild_submenu' ), self::MENU_PRIORITY );
		}

		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );

		// Removed all admin notices on the Jetpack Forms admin page.
		if ( self::get_admin_query_page() === self::ADMIN_SLUG ) {
			remove_all_actions( 'admin_notices' );
		}
	}

	/**
	 * Get the current query 'page' parameter.
	 *
	 * @return string
	 */
	private static function get_admin_query_page() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
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
				'in_footer'  => true,
				'textdomain' => 'jetpack-forms',
				'enqueue'    => true,
			)
		);

		if ( Contact_Form_Plugin::can_use_analytics() ) {
			Tracking::register_tracks_functions_scripts( true );
		}

		// Adds Connection package initial state.
		Connection_Initial_State::render_script( self::SCRIPT_HANDLE );

		// Preload Forms endpoints needed in dashboard context.
		// Pre-fetch the first inbox page so the UI renders instantly on first load.
		$preload_params = array(
			'context'       => 'edit',
			'fields_format' => 'collection',
			'order'         => 'desc',
			'orderby'       => 'date',
			'page'          => 1,
			'per_page'      => 20,
			'status'        => 'draft,publish',
		);
		\ksort( $preload_params );
		$initial_responses_path        = \add_query_arg( $preload_params, '/wp/v2/feedback' );
		$initial_responses_locale_path = \add_query_arg(
			\array_merge(
				$preload_params,
				array( '_locale' => 'user' )
			),
			'/wp/v2/feedback'
		);
		$filters_path                  = '/wp/v2/feedback/filters';
		$filters_locale_path           = \add_query_arg( array( '_locale' => 'user' ), $filters_path );
		$preload_paths                 = array(
			'/wp/v2/types?context=view',
			'/wp/v2/feedback/config',
			'/wp/v2/feedback/integrations-metadata',
			'/wp/v2/feedback/counts',
			$filters_path,
			$filters_locale_path,
			$initial_responses_path,
			$initial_responses_locale_path,
		);

		// Only preload the Forms list endpoint when centralized form management is enabled.
		if ( Contact_Form_Plugin::has_editor_feature_flag( 'central-form-management' ) ) {
			$forms_preload_params = array(
				'context'               => 'edit',
				'page'                  => 1,
				'jetpack_forms_context' => 'dashboard',
				'order'                 => 'desc',
				'orderby'               => 'modified',
				'per_page'              => 20,
				'status'                => 'publish,draft,pending,future,private',
			);
			ksort( $forms_preload_params );
			$preload_paths[] = add_query_arg( $forms_preload_params, '/wp/v2/jetpack-forms' );
			$preload_paths[] = add_query_arg(
				array_merge(
					$forms_preload_params,
					array( '_locale' => 'user' )
				),
				'/wp/v2/jetpack-forms'
			);
		}
		$preload_data_raw = array_reduce( $preload_paths, 'rest_preload_api_request', array() );

		// Normalize keys to match what apiFetch will request (without domain).
		$preload_data = array();
		foreach ( $preload_data_raw as $key => $value ) {
			$normalized_key                  = preg_replace( '#^https?://[^/]+/wp-json#', '', $key );
			$preload_data[ $normalized_key ] = $value;
		}

		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			sprintf(
				'wp.apiFetch.use( wp.apiFetch.createPreloadingMiddleware( %s ) );',
				wp_json_encode( $preload_data, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP )
			),
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
	 * Register Forms (WP-Build) submenu under Jetpack menu using wp-build page.
	 */
	public function add_forms_wpbuild_submenu() {
		$callback = function_exists( 'jetpack_forms_jetpack_forms_responses_wp_admin_render_page' )
			? 'jetpack_forms_jetpack_forms_responses_wp_admin_render_page'
			: array( $this, 'render_dashboard' );

		Admin_Menu::add_menu(
			'Jetpack Forms',
			'Forms (WP-Build)',
			'edit_pages',
			self::FORMS_WPBUILD_ADMIN_SLUG,
			$callback,
			11
		);
	}

	/**
	 * Render the dashboard.
	 */
	public function render_dashboard() {
		?>
		<div id="jp-forms-dashboard"></div>
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
				'post_type'              => 'feedback',
				'post_status'            => array( 'publish', 'draft', 'spam', 'trash' ),
				'posts_per_page'         => 1,
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				'suppress_filters'       => true,
			)
		);
		return $posts->have_posts();
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

	/**
	 * Returns true if form notes feature is enabled.
	 *
	 * @return boolean
	 */
	public static function is_notes_enabled() {
		/**
		* Enable form notes feature in Jetpack Forms .
		*
		* @module contact-form
		* @since 7.3.0
		*
		* @param bool $enabled Should the form notes feature be enabled? Defaults to false.
		*/
		return apply_filters( 'jetpack_forms_notes_enable', false );
	}

	/**
	 * Get admin URL for given screen ID.
	 *
	 * @param string $screen_id Screen ID.
	 * @return string|null Admin URL or null if not found.
	 */
	public static function get_admin_url( $screen_id ) {
		switch ( $screen_id ) {
			case 'edit-jetpack_form':
				return admin_url( 'admin.php?page=' . self::ADMIN_SLUG . '#/forms' );
			case 'edit-feedback':
				return admin_url( 'admin.php?page=' . self::ADMIN_SLUG . '#/responses' );
		}
		return null;
	}
}
