<?php
/**
 * Lists WordPress.com themes as a tab on the core Add Themes screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * The tab's `data-sort` value, which core's theme.js sends to themes_api() as `browse`.
 */
const WPCOM_THEMES_TAB = 'wpcom';

/**
 * Feature flag gating the tab.
 */
const WPCOM_THEMES_TAB_FLAG = 'wpcom-themes-marketplace-tab';

/**
 * Themes per request, which is also the grid's page size.
 */
const WPCOM_THEMES_TAB_PER_PAGE = 100;

/**
 * Registers the feature flag.
 *
 * @return void
 */
function wpcom_themes_tab_register_flag() {
	Feature_Flags::register(
		WPCOM_THEMES_TAB_FLAG,
		array(
			'default'     => false,
			'description' => 'Show WordPress.com themes as a tab on the Add Themes screen.',
			'owner'       => 'jetpack-mu-wpcom',
		)
	);
}
wpcom_themes_tab_register_flag();

/**
 * Whether to show the tab on this site.
 *
 * Atomic only for now: Simple has no Add Themes screen to add a tab to, and this package ships
 * there too, so the host is checked rather than left to the screen's absence.
 *
 * @return bool
 */
function wpcom_themes_tab_enabled() {
	return is_woa_site() && Feature_Flags::is_enabled( WPCOM_THEMES_TAB_FLAG );
}

/**
 * Loads the script that adds the tab.
 *
 * Core hard-codes this screen's tabs with no filter (trac #65979), so the script inserts ours
 * into the markup before core's theme.js reads it on DOM ready.
 *
 * @return void
 */
function wpcom_themes_tab_enqueue_script() {
	if ( ! wpcom_themes_tab_enabled() ) {
		return;
	}

	wp_enqueue_script(
		'wpcom-themes-tab',
		plugins_url( 'js/themes-tab.js', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION,
		array( 'in_footer' => true )
	);
	wp_localize_script(
		'wpcom-themes-tab',
		'wpcomThemesTab',
		array(
			'sort'  => WPCOM_THEMES_TAB,
			'label' => _x( 'Marketplace', 'Theme Installer', 'jetpack-mu-wpcom' ),
		)
	);
}
add_action( 'load-theme-install.php', 'wpcom_themes_tab_enqueue_script' );

/**
 * Whether a request to the Add Themes screen should land on this tab.
 *
 * @param array $query The request's query args.
 * @return bool
 */
function wpcom_themes_tab_is_default_view( array $query ) {
	if ( ! wpcom_themes_tab_enabled() ) {
		return false;
	}

	// An explicit view, a search, an upload or a preview is left as asked for.
	return ! array_intersect( array( 'browse', 'theme', 'search', 'upload' ), array_keys( $query ) );
}

/**
 * Sends a bare Add Themes request to this tab.
 *
 * Core's theme.js routes a bare `theme-install.php` to `popular` and rewrites the URL to match, so
 * the view has to be chosen before that runs rather than by ordering the tabs.
 *
 * @return void
 */
function wpcom_themes_tab_redirect_to_default_view() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reads which view was asked for, nothing more.
	if ( ! wpcom_themes_tab_is_default_view( $_GET ) ) {
		return;
	}

	wp_safe_redirect( admin_url( 'theme-install.php?browse=' . WPCOM_THEMES_TAB ) );
	exit;
}
add_action( 'load-theme-install.php', 'wpcom_themes_tab_redirect_to_default_view' );
/**
 * The shared WordPress.com themes reader, which wpcomsh also uses for core's own tabs.
 *
 * @return WPCom_Themes_Api
 */
function wpcom_themes_tab_api() {
	static $api;
	if ( ! $api ) {
		$api = new WPCom_Themes_Api( new WPCom_Themes_Cache() );
	}

	return $api;
}

/**
 * The shared mapper, which shapes a WordPress.com theme the way core's grid reads it.
 *
 * @return WPCom_Themes_Mapper
 */
function wpcom_themes_tab_mapper() {
	static $mapper;
	if ( ! $mapper ) {
		$mapper = new WPCom_Themes_Mapper();
	}

	return $mapper;
}

/**
 * Every theme the tab lists, in the order WordPress.com returns them.
 *
 * The shared reader fetches and caches the whole catalog, so the tab pages through it here rather
 * than asking for a page at a time.
 *
 * @return array<stdClass>
 */
function wpcom_themes_tab_catalog() {
	return array_values(
		array_filter(
			wpcom_themes_tab_api()->fetch_all_non_delisted_themes(),
			static function ( $theme ) {
				return is_object( $theme ) && ! empty( $theme->id ) && is_string( $theme->id );
			}
		)
	);
}

/**
 * Answers the tab's query in place of the WordPress.org themes API.
 *
 * @param false|object|array $result The result object or array. Default false.
 * @param string             $action The type of information being requested.
 * @param object             $args   Theme API arguments.
 * @return false|object|array
 */
function wpcom_themes_tab_serve_themes_api( $result, $action, $args ) {
	if ( false !== $result || 'query_themes' !== $action || ! wpcom_themes_tab_enabled() ) {
		return $result;
	}

	// A `?theme=<slug>` preview link, loaded directly, looks its theme up by slug rather than by tab.
	if ( ! isset( $args->browse ) && isset( $args->theme ) && is_string( $args->theme ) ) {
		$theme = wpcom_themes_tab_api()->fetch_theme( $args->theme );

		return null === $theme ? $result : (object) array(
			'info'   => array(
				'page'    => 1,
				'pages'   => 1,
				'results' => 1,
			),
			'themes' => array( wpcom_themes_tab_mapper()->map_wpcom_to_wporg( $theme ) ),
		);
	}

	if ( ! isset( $args->browse ) || WPCOM_THEMES_TAB !== $args->browse ) {
		return $result;
	}

	$themes = wpcom_themes_tab_catalog();
	$page   = isset( $args->page ) ? max( 1, (int) $args->page ) : 1;
	$mapper = wpcom_themes_tab_mapper();

	// Only the page core asked for is mapped: mapping reads each theme from disk to say whether it
	// is installed.
	$shown = array_slice( $themes, ( $page - 1 ) * WPCOM_THEMES_TAB_PER_PAGE, WPCOM_THEMES_TAB_PER_PAGE );

	return (object) array(
		'info'   => array(
			'page'    => $page,
			'pages'   => (int) ceil( count( $themes ) / WPCOM_THEMES_TAB_PER_PAGE ),
			'results' => count( $themes ),
		),
		'themes' => array_values( array_map( array( $mapper, 'map_wpcom_to_wporg' ), $shown ) ),
	);
}
add_filter( 'themes_api', 'wpcom_themes_tab_serve_themes_api', 10, 3 );
