<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- Feature entry file, named after the feature, also holds the WPCOM_My_Jetpack bootstrap class.
/**
 * A lightweight My Jetpack page for WordPress.com Simple sites.
 *
 * The My Jetpack package doesn't run on Simple without the `my-jetpack` sticker, so this page lists
 * what the site's Jetpack menu already holds. It keeps the top-level Jetpack link on one stable page
 * until the Simple approach for My Jetpack proper is settled.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Admin_UI\Admin_Menu;

require_once __DIR__ . '/../../common/class-wpcom-wp-build-page.php';

/**
 * Registers the page and its wp-build assets, unless the real My Jetpack claimed the slug.
 */
class WPCOM_My_Jetpack extends WPCOM_WP_Build_Page {

	/**
	 * Where the rest of Jetpack links My Jetpack, and first in the Jetpack menu's sort.
	 */
	const MENU_SLUG = 'my-jetpack';

	/**
	 * As declared in routes/wpcom-my-jetpack/package.json.
	 */
	const WP_BUILD_PAGE = 'wpcom-my-jetpack';

	/**
	 * Matches the real My Jetpack, so the Jetpack menu's top link works for anyone who can see the menu.
	 */
	const CAPABILITY = 'edit_posts';

	/**
	 * Global the page's boot script reads get_initial_state() from.
	 */
	const INITIAL_STATE_VAR = 'wpcomMyJetpackInitialState';

	/**
	 * The page title.
	 *
	 * @return string
	 */
	public static function get_page_title() {
		return __( 'My Jetpack', 'jetpack-mu-wpcom' );
	}

	/**
	 * The menu entry's label.
	 *
	 * @return string
	 */
	public static function get_menu_title() {
		return __( 'My Jetpack', 'jetpack-mu-wpcom' );
	}

	/**
	 * The state the page's boot script reads.
	 *
	 * @return array
	 */
	public static function get_initial_state() {
		$domain = wp_parse_url( home_url(), PHP_URL_HOST );
		$plan   = null;

		if ( current_user_can( 'manage_options' ) && ! get_option( 'wpcom_is_staging_site' ) ) {
			$plan = array(
				'name' => function_exists( 'wpcom_get_current_plan_name' ) ? wpcom_get_current_plan_name() : null,
				'url'  => "https://wordpress.com/plans/$domain",
			);
		}

		return array(
			'tools' => static::get_tools(),
			'plan'  => $plan,
		);
	}

	/**
	 * Gets the tools to list: the visible Jetpack menu items, in menu order.
	 *
	 * @return array[] Tools with `title`, `description`, `icon`, `url` and `external` keys.
	 */
	public static function get_tools() {
		global $submenu;

		// This runs at enqueue, before admin_head drops the items admin-ui hides.
		if ( method_exists( Admin_Menu::class, 'remove_hidden_menu_items' ) ) {
			Admin_Menu::remove_hidden_menu_items();
		}

		$domain = wp_parse_url( home_url(), PHP_URL_HOST );
		$tools  = array();

		foreach ( $submenu['jetpack'] ?? array() as $item ) {
			if ( static::MENU_SLUG === $item[2] || str_contains( $item[4] ?? '', 'hide-if-js' ) ) {
				continue;
			}

			$host = wp_parse_url( $item[2], PHP_URL_HOST );
			if ( $host ) {
				$url = $item[2];
			} elseif ( str_contains( $item[2], '.php' ) ) {
				$url = admin_url( $item[2] );
			} else {
				$url = admin_url( 'admin.php?page=' . $item[2] );
			}

			$tools[] = array_merge(
				array(
					// Everything from the first span on is a count badge or similar, not the title.
					'title' => wp_strip_all_tags( preg_replace( '#<span\b.*$#s', '', $item[0] ) ),
				),
				static::describe_tool( str_replace( $domain, '', $item[2] ) ),
				array(
					'url'      => $url,
					'external' => $host && $host !== $domain,
				)
			);
		}

		return $tools;
	}

	/**
	 * Gets a tool's one-line description and the key of its icon in the page's script.
	 *
	 * A tool missing from this list still shows, with its title and the Jetpack mark.
	 *
	 * @param string $slug The menu item's slug, without the site's domain.
	 * @return array The `description` and `icon`.
	 */
	public static function describe_tool( $slug ) {
		$tools = array(
			'activity-log'       => array( 'activity-log', __( 'See every change made to this site', 'jetpack-mu-wpcom' ) ),
			'akismet'            => array( 'akismet', __( 'Filter spam from comments and forms', 'jetpack-mu-wpcom' ) ),
			'backup'             => array( 'backup', __( 'Restorable copies of your site', 'jetpack-mu-wpcom' ) ),
			'advertising'        => array( 'blaze', __( 'Promote posts across WordPress.com and Tumblr', 'jetpack-mu-wpcom' ) ),
			'forms'              => array( 'forms', __( 'Collect and review form responses', 'jetpack-mu-wpcom' ) ),
			'wordpress.com/earn' => array( 'monetize', __( 'Earn from ads, donations and paid content', 'jetpack-mu-wpcom' ) ),
			'newsletter'         => array( 'newsletter', __( 'Send your posts to subscribers', 'jetpack-mu-wpcom' ) ),
			'podcast'            => array( 'podcast', __( 'Publish your posts as a podcast feed', 'jetpack-mu-wpcom' ) ),
			'scan'               => array( 'scan', __( 'Check your site for malware and threats', 'jetpack-mu-wpcom' ) ),
			'search'             => array( 'search', __( 'Fast, relevant search for your visitors', 'jetpack-mu-wpcom' ) ),
			'seo'                => array( 'seo', __( 'Titles and descriptions for search engines', 'jetpack-mu-wpcom' ) ),
			'social'             => array( 'social', __( 'Share posts to your social accounts', 'jetpack-mu-wpcom' ) ),
			'marketing/traffic'  => array( 'traffic', __( 'Analytics and site verification', 'jetpack-mu-wpcom' ) ),
			'videopress'         => array( 'videopress', __( 'Ad-free video hosting', 'jetpack-mu-wpcom' ) ),
		);

		foreach ( $tools as $needle => $tool ) {
			if ( str_contains( $slug, $needle ) ) {
				return array(
					'description' => $tool[1],
					'icon'        => $tool[0],
				);
			}
		}

		return array(
			'description' => '',
			'icon'        => '',
		);
	}
}

add_action( 'init', array( WPCOM_My_Jetpack::class, 'init' ) );
