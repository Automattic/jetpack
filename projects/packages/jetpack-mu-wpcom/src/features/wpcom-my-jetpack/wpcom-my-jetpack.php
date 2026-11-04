<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- Feature entry file, named after the feature, also holds the WPCOM_My_Jetpack bootstrap class.
/**
 * A lightweight My Jetpack page for WordPress.com Simple sites.
 *
 * The My Jetpack package doesn't run on Simple without the `my-jetpack` sticker, so this page lists
 * what the site's Jetpack menu already holds. It is a stopgap behind a feature flag: delete it once
 * My Jetpack itself runs on Simple.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Status\Host;

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
	 * Records page views and clicks, to see which tools people reach from here.
	 */
	const ENQUEUE_TRACKS = true;

	/**
	 * Feature flag that turns the page on.
	 */
	const FEATURE_FLAG = 'wpcom-simple-my-jetpack';

	/**
	 * Registers the feature flag, so it is listed wherever flags are read or toggled.
	 *
	 * @return void
	 */
	public static function register_feature_flag() {
		Feature_Flags::register(
			self::FEATURE_FLAG,
			array(
				'default'     => false,
				'description' => 'Show a lightweight My Jetpack page on Simple sites, listing what the Jetpack menu holds.',
				'owner'       => 'jetpack-mu-wpcom',
			)
		);
	}

	/**
	 * Whether this page should claim its slug: with the flag on, and not on P2s, which drop the Jetpack menu.
	 *
	 * @return bool
	 */
	public static function should_register() {
		return Feature_Flags::is_enabled( self::FEATURE_FLAG ) && ! ( new Host() )->is_p2_site();
	}

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
		return array(
			'tools' => static::get_tools(),
		);
	}

	/**
	 * Gets the tools to list: the visible Jetpack menu items, in menu order.
	 *
	 * @return array[] Tools with `title`, `description`, `icon` and `url` keys.
	 */
	public static function get_tools() {
		global $submenu;

		// This runs at enqueue, before admin_head drops the items admin-ui hides.
		if ( method_exists( Admin_Menu::class, 'remove_hidden_menu_items' ) ) {
			Admin_Menu::remove_hidden_menu_items();
		}

		$domain       = wp_parse_url( home_url(), PHP_URL_HOST );
		$descriptions = static::get_descriptions();
		$tools        = array();

		foreach ( $submenu['jetpack'] ?? array() as $item ) {
			if ( static::MENU_SLUG === $item[2] || str_contains( $item[4] ?? '', 'hide-if-js' ) ) {
				continue;
			}

			// Slugs and titles are escaped for wp-admin's menu HTML, and React escapes them again.
			$slug = html_entity_decode( $item[2], ENT_QUOTES, 'UTF-8' );
			$host = wp_parse_url( $slug, PHP_URL_HOST );
			$key  = preg_replace( '/^jetpack-/', '', str_replace( array( 'https://wordpress.com/', "/$domain" ), '', $slug ) );

			// Drops a link in any protocol WordPress doesn't allow, like `javascript:`.
			$url = esc_url_raw( $host ? $slug : admin_url( 'admin.php?page=' . $slug ) );
			if ( '' === $url ) {
				continue;
			}

			$tools[] = array(
				'title'       => static::get_tool_title( $item[0] ),
				'description' => $descriptions[ $key ] ?? '',
				'icon'        => isset( $descriptions[ $key ] ) ? $key : '',
				'url'         => $url,
			);
		}

		return $tools;
	}

	/**
	 * Gets a menu title's text, without the count badges rendered into its spans.
	 *
	 * @param string $title The menu title's HTML.
	 * @return string
	 */
	private static function get_tool_title( $title ) {
		$text = trim( wp_strip_all_tags( preg_replace( '#<span\b[^>]*>.*?</span>#s', '', $title ) ) );

		// A title may wrap its whole name in a span.
		return html_entity_decode( '' !== $text ? $text : wp_strip_all_tags( $title ), ENT_QUOTES, 'UTF-8' );
	}

	/**
	 * Gets each known tool's description. A tool's key also names its icon in the page's script.
	 *
	 * A tool missing from this list still shows, with its title and the Jetpack mark.
	 *
	 * @return string[] Descriptions, keyed by menu slug without its `jetpack-` prefix or WordPress.com address.
	 */
	private static function get_descriptions() {
		return array(
			'activity-log'             => __( 'See every change made to this site', 'jetpack-mu-wpcom' ),
			'akismet-key-config'       => __( 'Filter spam from comments and forms', 'jetpack-mu-wpcom' ),
			'backup'                   => __( 'Restorable copies of your site', 'jetpack-mu-wpcom' ),
			'advertising'              => __( 'Promote posts across WordPress.com and Tumblr', 'jetpack-mu-wpcom' ),
			'forms-admin'              => __( 'Collect and review form responses', 'jetpack-mu-wpcom' ),
			'forms-responses-wp-admin' => __( 'Collect and review form responses', 'jetpack-mu-wpcom' ),
			'earn'                     => __( 'Earn from ads, donations and paid content', 'jetpack-mu-wpcom' ),
			'newsletter'               => __( 'Send your posts to subscribers', 'jetpack-mu-wpcom' ),
			'podcast'                  => __( 'Publish your posts as a podcast feed', 'jetpack-mu-wpcom' ),
			'scan'                     => __( 'Check your site for malware and threats', 'jetpack-mu-wpcom' ),
			'search'                   => __( 'Fast, relevant search for your visitors', 'jetpack-mu-wpcom' ),
			'seo'                      => __( 'Titles and descriptions for search engines', 'jetpack-mu-wpcom' ),
			'social'                   => __( 'Share posts to your social accounts', 'jetpack-mu-wpcom' ),
			'marketing/traffic'        => __( 'Analytics and site verification', 'jetpack-mu-wpcom' ),
			'videopress'               => __( 'Ad-free video hosting', 'jetpack-mu-wpcom' ),
		);
	}

	/**
	 * Tells code that links to My Jetpack's Features screen that this page doesn't have one.
	 *
	 * @param bool $available Whether modules can be managed from My Jetpack.
	 * @return bool
	 */
	public static function filter_modules_management_available( $available ) {
		return $available && ! static::owns_page();
	}
}

WPCOM_My_Jetpack::register_feature_flag();
add_action( 'init', array( WPCOM_My_Jetpack::class, 'init' ) );
add_filter( 'jetpack_my_jetpack_modules_management_available', array( WPCOM_My_Jetpack::class, 'filter_modules_management_available' ) );
