<?php
/**
 * Jetpack forms dashboard.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

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
		$should_load = self::get_admin_query_page() === self::FORMS_WPBUILD_ADMIN_SLUG;

		/**
		 * Filter whether to load the wp-build asset registrations.
		 * Host applications (e.g., CIAB) can return true to opt in.
		 *
		 * @param bool $should_load Whether build.php should be loaded.
		 */
		$should_load = apply_filters( 'jetpack_forms_load_wp_build', $should_load );

		if ( ! $should_load ) {
			return;
		}

		$wp_build_index = dirname( __DIR__, 2 ) . '/build/build.php';

		if ( file_exists( $wp_build_index ) ) {
			require_once $wp_build_index;
		}

		// The remaining setup only applies to the standalone Forms page.
		if ( self::get_admin_query_page() !== self::FORMS_WPBUILD_ADMIN_SLUG ) {
			return;
		}

		// When no route path is specified, redirect to the default view
		// so the client-side router doesn't need a catch-all root route.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['p'] ) ) {
			$default_tab = Contact_Form_Plugin::has_editor_feature_flag( 'central-form-management' )
				? 'forms'
				: 'inbox';

			wp_safe_redirect( self::get_forms_admin_url( $default_tab ) );

			exit;
		}

		// Register polyfills for WP < 7.0 (must run before enqueue).
		WP_Build_Polyfills::register(
			'jetpack-forms',
			array_merge(
				WP_Build_Polyfills::SCRIPT_HANDLES,
				WP_Build_Polyfills::MODULE_IDS
			)
		);
	}

	/**
	 * Fix import map ordering for the wp-build boot script.
	 *
	 * In wp-admin, _wp_footer_scripts (classic scripts) and print_import_map
	 * both hook into admin_print_footer_scripts at priority 10, but
	 * _wp_footer_scripts is registered first. This causes the inline
	 * import("@wordpress/boot") to execute before the import map exists.
	 *
	 * This fix moves the import() call from the classic inline script to a
	 * <script type="module"> printed at priority 20 (after the import map).
	 *
	 * @todo Remove once @wordpress/build ships with the loader.js fix upstream
	 *       (WordPress/gutenberg#76870) and Jetpack updates the dependency.
	 */
	public static function fix_boot_import_map_ordering() {
		$handle = self::FORMS_WPBUILD_ADMIN_SLUG . '-prerequisites';

		add_action(
			'admin_enqueue_scripts',
			static function () use ( $handle ) {
				if ( ! Dashboard::is_jetpack_forms_admin_page() ) {
					return;
				}

				$data = wp_scripts()->get_data( $handle, 'after' );
				if ( empty( $data ) ) {
					return;
				}

				// Find and extract the import("@wordpress/boot") inline script.
				$boot_script = null;
				$remaining   = array();
				foreach ( $data as $line ) {
					if ( strpos( $line, '@wordpress/boot' ) !== false ) {
						$boot_script = $line;
					} else {
						$remaining[] = $line;
					}
				}

				if ( $boot_script === null ) {
					return;
				}

				// Remove from the classic script handle.
				wp_scripts()->add_data( $handle, 'after', $remaining );

				// Re-emit as a module script after the import map.
				add_action(
					'admin_print_footer_scripts',
					static function () use ( $boot_script ) {
						wp_print_inline_script_tag( $boot_script, array( 'type' => 'module' ) );
					},
					20
				);
			},
			PHP_INT_MAX
		);
	}

	/**
	 * Legacy admin slug for the (now-removed) hash-router dashboard.
	 *
	 * Kept so {@see self::redirect_legacy_dashboard_url()} can recognize URLs
	 * generated before the wp-build dashboard became the only variant — for
	 * example email links and out-of-package callers (jitm, creative-mail).
	 *
	 * @var string
	 */
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
		add_action( 'admin_menu', array( __CLASS__, 'redirect_legacy_dashboard_url' ), 1 );

		self::load_wp_build();
		self::fix_boot_import_map_ordering();
	}

	/**
	 * Redirect legacy dashboard URLs to the wp-build dashboard.
	 *
	 * The legacy hash-router dashboard at ?page=jetpack-forms-admin has been removed,
	 * but email links and out-of-package callers (jitm, creative-mail, embed helpers)
	 * may still point at it. Forward those requests to the wp-build dashboard so old
	 * links keep working.
	 */
	public static function redirect_legacy_dashboard_url() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';

		if ( $page !== self::ADMIN_SLUG ) {
			return;
		}

		// The hash is never sent to the server. "inbox" used as default tab so we end up specifically in the responses
		// route, where the client-side router will handle the redirect to the correct status in its beforeLoad hook.
		$redirect = self::get_forms_admin_url( 'inbox' );
		wp_safe_redirect( $redirect );
		exit;
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
	 * Register the dashboard admin submenu Forms under Jetpack menu.
	 */
	public function add_admin_submenu() {
		// `jetpack_forms_jetpack_forms_responses_wp_admin_render_page` is the callback generated by WP build script.
		$callback = function_exists( 'jetpack_forms_jetpack_forms_responses_wp_admin_render_page' )
			? 'jetpack_forms_jetpack_forms_responses_wp_admin_render_page'
			: '__return_null';

		Admin_Menu::add_menu(
			/** "Jetpack Forms" and "Forms" are product names, do not translate. */
			'Jetpack Forms',
			'Forms',
			'edit_pages',
			self::FORMS_WPBUILD_ADMIN_SLUG,
			$callback,
			10
		);
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
	 * Option name for storing classic forms state.
	 */
	const CLASSIC_FORMS_OPTION = 'jetpack_forms_classic_state';

	/**
	 * Classic forms state: site has classic (non-synced) form submissions.
	 */
	const CLASSIC_FORMS_STATE_CLASSIC = 'classic';

	/**
	 * Classic forms state: no classic form submissions detected.
	 */
	const CLASSIC_FORMS_STATE_HIDDEN = 'hidden';

	/**
	 * Classic forms state: user dismissed the classic forms notice.
	 */
	const CLASSIC_FORMS_STATE_DISMISSED = 'dismissed';

	/**
	 * Returns the classic forms state for the current site.
	 *
	 * Returns 'classic' if the site has form submissions (feedback posts) that were not
	 * created by a synced/reusable jetpack_form, 'dismissed' if the user dismissed the
	 * classic forms notice, or 'hidden' otherwise.
	 *
	 * The result is persisted in a WP option so the detection query only runs once per site.
	 * After that, the cached value is returned on every subsequent call. The cache is also
	 * updated eagerly via mark_classic_form_detected() when new classic submissions arrive.
	 *
	 * @since 7.14.0
	 *
	 * @return string 'classic', 'hidden', or 'dismissed'.
	 */
	public function get_classic_forms_state() {
		$state = get_option( self::CLASSIC_FORMS_OPTION );

		if ( $state ) {
			return $state;
		}

		$state = $this->detect_classic_forms();
		update_option( self::CLASSIC_FORMS_OPTION, $state, false );

		return $state;
	}

	/**
	 * Detects whether any feedback posts exist that are not linked to a jetpack_form post,
	 * indicating the site has classic (inline, widget, or template) forms.
	 *
	 * A feedback post is considered "classic" if:
	 * - It has no parent (post_parent = 0), meaning it was created by a form embedded in a
	 *   widget, page template, or other non-post context.
	 * - Its parent exists but is not a jetpack_form post, meaning it was created by a form
	 *   block or shortcode placed directly in a post or page.
	 *
	 * The query uses a LEFT JOIN on the posts table to find feedback posts with no matching
	 * jetpack_form parent. This leverages the primary key index for the join and the
	 * type_status_date index for filtering by post_type, making it efficient even on large
	 * sites. The LIMIT 1 ensures early exit as soon as one classic form is found.
	 *
	 * Note: An alternative approach would be to search post_content for the form block markup
	 * (<!-- wp:jetpack/contact-form) or shortcode ([contact-form]). However, that requires a
	 * full-text scan of the posts table (LIKE '%...%' on a TEXT column) with no usable index,
	 * making it significantly more expensive. The feedback-based approach also better fits the
	 * use case: we only need to surface the "Not seeing all your forms?" prompt when there are
	 * actual submissions that won't appear under any synced form in the dashboard.
	 *
	 * @since 7.14.0
	 *
	 * @return string 'classic' or 'hidden'.
	 */
	private function detect_classic_forms() {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT 1 FROM {$wpdb->posts} AS f
				LEFT JOIN {$wpdb->posts} AS p
					ON p.ID = f.post_parent AND p.post_type = %s
				WHERE f.post_type = 'feedback'
				AND p.ID IS NULL
				LIMIT 1",
				Contact_Form::POST_TYPE
			)
		);

		return $result ? self::CLASSIC_FORMS_STATE_CLASSIC : self::CLASSIC_FORMS_STATE_HIDDEN;
	}

	/**
	 * Eagerly marks the site as having classic forms by setting the option to 'classic'.
	 *
	 * Called when a new form submission is saved that does not belong to a synced jetpack_form.
	 * This avoids re-running the detection query — once a classic submission is observed, the
	 * state is permanently set without needing to scan the database again.
	 *
	 * If the user has already dismissed the classic forms notice, the state is left as
	 * 'dismissed' so the notice does not reappear.
	 *
	 * @since 7.14.0
	 */
	public static function mark_classic_form_detected() {
		$current = get_option( self::CLASSIC_FORMS_OPTION );

		if ( self::CLASSIC_FORMS_STATE_DISMISSED === $current ) {
			return;
		}

		update_option( self::CLASSIC_FORMS_OPTION, self::CLASSIC_FORMS_STATE_CLASSIC, false );
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
		$url  = admin_url( 'admin.php' );
		$url .= '?page=' . self::FORMS_WPBUILD_ADMIN_SLUG;
		$url .= '&p=' . rawurlencode( self::get_forms_admin_path_wp_build( $tab, $post_id ) );

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

		return '/responses/inbox';
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

		return $screen->id === 'jetpack_page_' . self::FORMS_WPBUILD_ADMIN_SLUG;
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
