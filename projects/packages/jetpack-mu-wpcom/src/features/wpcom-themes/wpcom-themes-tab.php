<?php
/**
 * Lists WordPress.com themes as a tab on the core Add Themes screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;
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
 * The theme tier the tab lists, as `/wpcom/v2/themes` names it. Empty lists every tier.
 */
const WPCOM_THEMES_TAB_TIER = 'partner';

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
 * @return bool
 */
function wpcom_themes_tab_enabled() {
	return Feature_Flags::is_enabled( WPCOM_THEMES_TAB_FLAG );
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
		$theme = wpcom_themes_tab_find_theme( $args->theme );

		return null === $theme ? $result : (object) array(
			'info'   => array(
				'page'    => 1,
				'pages'   => 1,
				'results' => 1,
			),
			'themes' => array( wpcom_themes_tab_to_api_theme( $theme ) ),
		);
	}

	if ( ! isset( $args->browse ) || WPCOM_THEMES_TAB !== $args->browse ) {
		return $result;
	}

	$page    = isset( $args->page ) ? max( 1, (int) $args->page ) : 1;
	$catalog = wpcom_themes_tab_get_catalog( $page );

	return (object) array(
		'info'   => array(
			'page'    => $page,
			'pages'   => (int) ceil( $catalog['found'] / WPCOM_THEMES_TAB_PER_PAGE ),
			'results' => $catalog['found'],
		),
		'themes' => array_map( 'wpcom_themes_tab_to_api_theme', $catalog['themes'] ),
	);
}
add_filter( 'themes_api', 'wpcom_themes_tab_serve_themes_api', 10, 3 );

/**
 * Shapes a catalog theme the way wp_ajax_query_themes() and the `tmpl-theme` template read it.
 *
 * @param array $theme A theme from wpcom_themes_tab_get_catalog().
 * @return object
 */
function wpcom_themes_tab_to_api_theme( array $theme ) {
	return (object) array(
		'slug'           => $theme['slug'],
		'name'           => $theme['name'],
		'version'        => $theme['version'],
		'author'         => array( 'display_name' => $theme['author'] ),
		'description'    => $theme['description'],
		'screenshot_url' => $theme['screenshot_url'],
		'preview_url'    => $theme['preview_url'],
		'rating'         => 0,
		'num_ratings'    => 0,
		'requires'       => false,
		'requires_php'   => false,
	);
}

/**
 * The transient caching one page of the catalog.
 *
 * @param int $page Page number.
 * @return string
 */
function wpcom_themes_tab_cache_key( $page ) {
	return 'wpcom_themes_tab_v1_' . WPCOM_THEMES_TAB_TIER . '_' . $page;
}

/**
 * One page of the themes the tab lists, cached.
 *
 * @param int $page Page number.
 * @return array{themes: array[], found: int} Empty when WordPress.com cannot be read.
 */
function wpcom_themes_tab_get_catalog( $page = 1 ) {
	$cache_key = wpcom_themes_tab_cache_key( $page );
	$cached    = get_transient( $cache_key );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	$catalog = wpcom_themes_tab_fetch_catalog( $page );
	if ( null === $catalog ) {
		// Cache the miss briefly, so an outage costs one request per five minutes, not one per view.
		$catalog = array(
			'themes' => array(),
			'found'  => 0,
		);
		set_transient( $cache_key, $catalog, 5 * MINUTE_IN_SECONDS );

		return $catalog;
	}

	set_transient( $cache_key, $catalog, 6 * HOUR_IN_SECONDS );

	return $catalog;
}

/**
 * A theme the tab lists, found by slug across the catalog's pages.
 *
 * Only the tab's tier is searched, so a preview link for a WordPress.org theme that WordPress.com
 * also offers in another tier (Twenty Twenty-Five, say) still goes to WordPress.org.
 *
 * @param string $slug Theme slug.
 * @return array|null
 */
function wpcom_themes_tab_find_theme( $slug ) {
	$page = 1;
	do {
		$catalog = wpcom_themes_tab_get_catalog( $page );
		foreach ( $catalog['themes'] as $theme ) {
			if ( $theme['slug'] === $slug ) {
				return $theme;
			}
		}
	} while ( ++$page <= ceil( $catalog['found'] / WPCOM_THEMES_TAB_PER_PAGE ) );

	return null;
}

/**
 * Reads one page of themes from `/wpcom/v2/themes`.
 *
 * @param int $page Page number.
 * @return array{themes: array[], found: int}|null Null on any failure.
 */
function wpcom_themes_tab_fetch_catalog( $page ) {
	if ( ! method_exists( Client::class, 'wpcom_json_api_request_as_blog' ) ) {
		return null;
	}

	$path = add_query_arg(
		array_filter(
			array(
				'tier'   => WPCOM_THEMES_TAB_TIER,
				'number' => WPCOM_THEMES_TAB_PER_PAGE,
				'page'   => $page,
			)
		),
		'/themes'
	);

	$response = Client::wpcom_json_api_request_as_blog( $path, '2', array(), null, 'wpcom' );
	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return null;
	}

	$body = json_decode( wp_remote_retrieve_body( $response ), true );
	if ( ! is_array( $body ) || ! is_array( $body['themes'] ?? null ) ) {
		return null;
	}

	$themes = array();
	foreach ( $body['themes'] as $theme ) {
		// `id` is the bare directory name; `stylesheet` can carry a `pub/` prefix for WordPress.com's own themes.
		if ( ! is_array( $theme ) || empty( $theme['id'] ) || ! is_string( $theme['id'] ) ) {
			continue;
		}

		$themes[] = array(
			'slug'           => $theme['id'],
			'name'           => (string) ( $theme['name'] ?? $theme['id'] ),
			'author'         => (string) ( $theme['author'] ?? '' ),
			'description'    => (string) ( $theme['description'] ?? '' ),
			'version'        => (string) ( $theme['version'] ?? '' ),
			'screenshot_url' => (string) ( $theme['screenshot'] ?? '' ),
			'preview_url'    => (string) ( $theme['demo_uri'] ?? '' ),
		);
	}

	return array(
		'themes' => $themes,
		'found'  => (int) ( $body['found'] ?? count( $themes ) ),
	);
}
