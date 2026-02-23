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

				// Re-add core's registration only when Gutenberg isn't providing it
				if ( ! defined( 'IS_GUTENBERG_PLUGIN' ) || ! IS_GUTENBERG_PLUGIN ) {
					// `wp-build` currently removes `wp_default_script_modules` from `wp_default_scripts`.
					// Re-add the core hook so script modules work in vanilla wp-admin (no Gutenberg plugin).
					if ( function_exists( 'wp_default_script_modules' ) ) {
						add_action( 'wp_default_scripts', 'wp_default_script_modules', 0 );
					}
				}
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
		add_action( 'admin_menu', array( $this, 'add_admin_submenu' ), self::MENU_PRIORITY );
		add_action( 'admin_menu', array( __CLASS__, 'redirect_dashboard_url_cross_variant' ), 1 );

		// Flag to enable the wp-build-based dashboard.
		$is_wp_build_enabled = apply_filters( 'jetpack_forms_alpha', false );

		if ( $is_wp_build_enabled ) {
			self::load_wp_build();
		}

		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );

		// Removed all admin notices on the Jetpack Forms admin page.
		if ( self::get_admin_query_page() === self::ADMIN_SLUG ) {
			remove_all_actions( 'admin_notices' );
		}
	}

	/**
	 * Redirect dashboard URLs when the wp-build flag has changed since the link was generated.
	 *
	 * Email links may point to the legacy or wp-build dashboard. If the flag has toggled,
	 * the requested page may not exist. This redirects to the correct variant.
	 */
	public static function redirect_dashboard_url_cross_variant() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';

		if ( $page !== self::ADMIN_SLUG && $page !== self::FORMS_WPBUILD_ADMIN_SLUG ) {
			return;
		}

		$is_wp_build_enabled = apply_filters( 'jetpack_forms_alpha', false );

		// Legacy URL requested but wp-build is now active → redirect to wp-build.
		if ( $page === self::ADMIN_SLUG && $is_wp_build_enabled ) {
			// The hash is never sent to the server. "inbox" used as default tab so we end up specifically in the responses
			// route, where the client-side router will handle the redirect to the correct status in its beforeLoad hook.
			$redirect = self::get_forms_admin_url( 'inbox' );
			wp_safe_redirect( $redirect );
			exit;
		}

		// WP-Build URL requested but legacy is now active → redirect to legacy.
		if ( $page === self::FORMS_WPBUILD_ADMIN_SLUG && ! $is_wp_build_enabled ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$p                = isset( $_GET['p'] ) ? rawurldecode( sanitize_text_field( wp_unslash( $_GET['p'] ) ) ) : '';
			$tab              = 'inbox';
			$post_id          = null;
			$has_mark_as_spam = false;

			// Check if mark_as_spam is a separate query parameter (old email format).
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if ( isset( $_GET['mark_as_spam'] ) ) {
				$has_mark_as_spam = true;
			}

			if ( $p !== '' ) {
				// Parse path like /responses/inbox?responseIds=["2879"] or /responses/inbox?responseIds=["2879"]&mark_as_spam or /forms.
				if ( preg_match( '#^/responses/(inbox|spam|trash)(?:\?responseIds=\["(\d+)"\])?(.*)$#', $p, $m ) ) {
					$tab     = $m[1];
					$post_id = ! empty( $m[2] ) ? absint( $m[2] ) : null;

					// Check if mark_as_spam parameter is present inside the path.
					if ( ! empty( $m[3] ) && strpos( $m[3], 'mark_as_spam' ) !== false ) {
						$has_mark_as_spam = true;
					}
				} elseif ( preg_match( '#^/forms#', $p ) ) {
					$tab = 'forms';
				}
			}

			$redirect = self::get_forms_admin_url( $tab, $post_id );

			// Add mark_as_spam parameter if it was present in the original URL (either format).
			if ( $has_mark_as_spam ) {
				$redirect .= '&mark_as_spam';
			}

			wp_safe_redirect( $redirect );
			exit;
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
	 * Register the dashboard admin submenu Forms under Jetpack menu.
	 */
	public function add_admin_submenu() {

		if ( apply_filters( 'jetpack_forms_alpha', false ) ) {

			// `jetpack_forms_jetpack_forms_responses_wp_admin_render_page` is the callback generated by WP build script.
			$callback = function_exists( 'jetpack_forms_jetpack_forms_responses_wp_admin_render_page' )
				? 'jetpack_forms_jetpack_forms_responses_wp_admin_render_page'
				: array( $this, 'render_dashboard' );

			Admin_Menu::add_menu(
				/** "Jetpack Forms" and "Forms" are product names, do not translate. */
				'Jetpack Forms',
				'Forms',
				'edit_pages',
				self::FORMS_WPBUILD_ADMIN_SLUG,
				$callback,
				10
			);

			return;
		}

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
	 * @param int|null    $post_id Post ID of response to open in the forms responses page.
	 *
	 * @return string
	 */
	public static function get_forms_admin_url( $tab = null, $post_id = null ) {
		$is_wp_build_enabled = apply_filters( 'jetpack_forms_alpha', false );
		$url                 = admin_url( 'admin.php' );

		$url .= $is_wp_build_enabled
			? '?page=' . self::FORMS_WPBUILD_ADMIN_SLUG
			: '?page=' . self::ADMIN_SLUG;

		if ( $is_wp_build_enabled ) {
			$path = self::get_forms_admin_path_wp_build( $tab, $post_id );
			$url .= '&p=' . rawurlencode( $path );
		} else {
			$suffix = self::get_forms_admin_suffix_legacy( $tab, $post_id );

			if ( $suffix !== '' ) {
				$url .= $suffix;
			}
		}

		/**
		 * Filters the Forms admin page URL.
		 *
		 * @module contact-form
		 * @since 7.8.0
		 *
		 * @param string      $url The Forms admin page URL.
		 * @param string|null $tab Tab to open in the forms admin page.
		 * @param int|null $post_id Post ID of response to open in the forms responses page.
		 *
		 * @return string The filtered Forms admin page URL.
		 */
		return apply_filters( 'jetpack_forms_admin_url', $url, $tab, $post_id );
	}

	/**
	 * WP-Build path for the forms admin URL.
	 *
	 * @param string|null $tab    Tab to open.
	 * @param int|null    $post_id Post ID of response.
	 * @return string URL path (e.g. '/', '/responses/inbox', '/forms').
	 */
	private static function get_forms_admin_path_wp_build( $tab, $post_id ) {
		$post_id      = ! empty( $post_id ) ? absint( $post_id ) : null;
		$response_ids = ! empty( $post_id ) ? '?responseIds=["' . $post_id . '"]' : '';

		$path_map = array(
			'inbox'           => '/responses/inbox',
			'spam'            => '/responses/spam',
			'trash'           => '/responses/trash',
			'forms'           => '/forms',
			'responses/inbox' => '/responses/inbox',
		);

		if ( $tab !== null && $tab !== '' && isset( $path_map[ $tab ] ) ) {
			return $path_map[ $tab ] . $response_ids;
		}

		if ( ! empty( $post_id ) ) {
			return '/responses/inbox?responseIds=["' . $post_id . '"]';
		}

		return '/';
	}

	/**
	 * Legacy (hash-based) URL suffix for the forms admin page.
	 *
	 * @param string|null $tab    Tab to open.
	 * @param int|null    $post_id Post ID of response.
	 * @return string URL suffix (e.g. '#/responses?status=inbox&r=123', or '#/forms').
	 */
	private static function get_forms_admin_suffix_legacy( $tab, $post_id ) {
		$post_id    = ! empty( $post_id ) ? absint( $post_id ) : null;
		$valid_tabs = array( 'spam', 'inbox', 'trash' );
		$r_param    = ! empty( $post_id ) ? '&r=' . $post_id : '';

		if ( in_array( $tab, $valid_tabs, true ) ) {
			return '#/responses?status=' . $tab . $r_param;
		}

		if ( $tab === 'forms' ) {
			return '#/forms';
		}

		if ( ! empty( $post_id ) ) {
			return '#/responses?status=inbox' . $r_param;
		}

		return '';
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

		if ( ! $screen || ! isset( $screen->id ) ) {
			return false;
		}

		$forms_admin_screens = array(
			'jetpack_page_' . self::ADMIN_SLUG,
			'jetpack_page_' . self::FORMS_WPBUILD_ADMIN_SLUG,
		);

		return in_array( $screen->id, $forms_admin_screens, true );
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
	 * @deprecated 7.9.0 Use Dashboard::get_forms_admin_url() instead.
	 *
	 * @param string $screen_id Screen ID.
	 * @return string Admin URL.
	 */
	public static function get_admin_url( $screen_id ) {
		_deprecated_function( __METHOD__, 'jetpack-7.9.0', 'Dashboard::get_forms_admin_url' );

		if ( 'edit-jetpack_form' === $screen_id ) {
			return self::get_forms_admin_url( 'forms' );
		}

		if ( 'edit-feedback' === $screen_id ) {
			return self::get_forms_admin_url( 'inbox' );
		}

		return self::get_forms_admin_url();
	}
}
