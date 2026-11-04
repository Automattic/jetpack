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
	 * Authors and up: Contributors can reach no Jetpack tool on Simple, so the page would only ever be empty for them.
	 */
	const CAPABILITY = 'publish_posts';

	/**
	 * Global the page's boot script reads get_initial_state() from.
	 */
	const INITIAL_STATE_VAR = 'wpcomMyJetpackInitialState';

	/**
	 * Records clicks, to see which tools people reach from here.
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
	 * @return array[] Tools with `title`, `description`, `key`, `section` and `url` keys.
	 */
	public static function get_tools() {
		global $submenu;

		// This runs at enqueue, before admin_head drops hidden items, so an entry stays off this page
		// only if admin-ui hides it or it carries `hide-if-js`.
		if ( method_exists( Admin_Menu::class, 'remove_hidden_menu_items' ) ) {
			Admin_Menu::remove_hidden_menu_items();
		}

		$known = static::get_known_tools();
		$tools = array();

		foreach ( $submenu[ static::PARENT_SLUG ] ?? array() as $item ) {
			if ( static::MENU_SLUG === $item[2] || str_contains( $item[4] ?? '', 'hide-if-js' ) ) {
				continue;
			}

			// Slugs and titles are escaped for wp-admin's menu HTML, and React escapes them again.
			$slug = html_entity_decode( $item[2], ENT_QUOTES, 'UTF-8' );

			// Drops a link in any protocol WordPress doesn't allow, like `javascript:`.
			$url = esc_url_raw( static::get_tool_url( $slug ) );
			if ( '' === $url || isset( $tools[ $url ] ) ) {
				continue;
			}

			$key  = static::get_tool_key( $slug );
			$tool = $known[ $key ] ?? null;

			$tools[ $url ] = array(
				'title'       => static::get_tool_title( $item[0] ),
				'description' => $tool['description'] ?? '',
				'key'         => $key,
				'section'     => $tool['section'] ?? 'more',
				'url'         => $url,
			);
		}

		return array_values( $tools );
	}

	/**
	 * Gets where a menu slug leads, the way wp-admin's sidebar links it.
	 *
	 * @param string $slug The menu slug.
	 * @return string
	 */
	private static function get_tool_url( $slug ) {
		if ( wp_parse_url( $slug, PHP_URL_HOST ) ) {
			return $slug;
		}

		// Only a slug with a page callback goes through admin.php; any other is a path under wp-admin.
		if ( get_plugin_page_hook( $slug, static::PARENT_SLUG ) ) {
			return add_query_arg( 'page', $slug, admin_url( 'admin.php' ) );
		}

		return admin_url( $slug );
	}

	/**
	 * Gets the key a menu slug is known by: the path of a WordPress.com link to this site, or the slug without `jetpack-`.
	 *
	 * @param string $slug The menu slug.
	 * @return string The key, or '' for any other link that leaves wp-admin, so no address reaches Tracks.
	 */
	private static function get_tool_key( $slug ) {
		$domain = wp_parse_url( home_url(), PHP_URL_HOST );

		if ( preg_match( '#^https://wordpress\.com/(.+)/' . preg_quote( $domain, '#' ) . '/?$#', $slug, $matches ) ) {
			$key = $matches[1];
		} elseif ( wp_parse_url( $slug, PHP_URL_HOST ) ) {
			return '';
		} else {
			$key = preg_replace( '/^jetpack-/', '', $slug );
		}

		$aliases = array(
			'forms-admin'              => 'forms',
			'forms-responses-wp-admin' => 'forms',
		);

		return $aliases[ $key ] ?? $key;
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
	 * Gets each known tool's section and description, keyed as get_tool_key() returns.
	 *
	 * The key also names the tool's icon in the page's script. A tool missing here shows under More, with the Jetpack mark.
	 *
	 * @return array[] Tools with `section` and `description` keys.
	 */
	private static function get_known_tools() {
		$tools = array(
			'security' => array(
				'activity-log'       => __( 'See every change made to this site', 'jetpack-mu-wpcom' ),
				'akismet-key-config' => __( 'Filter spam from comments and forms', 'jetpack-mu-wpcom' ),
				'backup'             => __( 'Restorable copies of your site', 'jetpack-mu-wpcom' ),
				'protect'            => __( 'Protect your site from malware and attacks', 'jetpack-mu-wpcom' ),
				'scan'               => __( 'Check your site for malware and threats', 'jetpack-mu-wpcom' ),
			),
			'growth'   => array(
				'advertising'       => __( 'Promote posts across WordPress.com and Tumblr', 'jetpack-mu-wpcom' ),
				'earn'              => __( 'Earn from ads, donations and paid content', 'jetpack-mu-wpcom' ),
				'marketing/traffic' => __( 'Analytics and site verification', 'jetpack-mu-wpcom' ),
				'newsletter'        => __( 'Send your posts to subscribers', 'jetpack-mu-wpcom' ),
				'seo'               => __( 'Titles and descriptions for search engines', 'jetpack-mu-wpcom' ),
				'social'            => __( 'Share posts to your social accounts', 'jetpack-mu-wpcom' ),
			),
			'content'  => array(
				'forms'      => __( 'Collect and review form responses', 'jetpack-mu-wpcom' ),
				'podcast'    => __( 'Publish your posts as a podcast feed', 'jetpack-mu-wpcom' ),
				'search'     => __( 'Fast, relevant search for your visitors', 'jetpack-mu-wpcom' ),
				'videopress' => __( 'Ad-free video hosting', 'jetpack-mu-wpcom' ),
			),
		);

		$known = array();
		foreach ( $tools as $section => $descriptions ) {
			foreach ( $descriptions as $key => $description ) {
				$known[ $key ] = array(
					'section'     => $section,
					'description' => $description,
				);
			}
		}

		return $known;
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
