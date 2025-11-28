<?php
/**
 * Jetpack forms dashboard.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Handles the Jetpack Forms dashboard.
 */
class Dashboard {
	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	const ADMIN_SLUG = 'jetpack-forms-wp-admin';

	/**
	 * Initialize the dashboard.
	 *
	 * Note: Menu registration and script loading is handled in jetpack-forms-page.php
	 */
	public function init() {
		// Dashboard initialization is now handled in jetpack-forms-page.php
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
		$base_url = get_admin_url() . 'admin.php?page=' . self::ADMIN_SLUG;

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
		return $screen && $screen->id === 'jetpack_page_' . self::ADMIN_SLUG;
	}
}
