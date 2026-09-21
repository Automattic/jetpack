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
const WPCOM_THEMES_TAB_FLAG = 'wpcom-themes-tab';

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
			'label' => _x( 'WordPress.com', 'Theme Installer tab', 'jetpack-mu-wpcom' ),
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
	if (
		false !== $result
		|| 'query_themes' !== $action
		|| ! isset( $args->browse )
		|| WPCOM_THEMES_TAB !== $args->browse
		|| ! wpcom_themes_tab_enabled()
	) {
		return $result;
	}

	// The whole catalog goes out on page 1; theme.js asks for page 2 when the grid is scrolled.
	$page   = isset( $args->page ) ? (int) $args->page : 1;
	$themes = $page > 1 ? array() : array_map( 'wpcom_themes_tab_to_api_theme', wpcom_themes_tab_get_catalog() );

	return (object) array(
		'info'   => array(
			'page'    => $page,
			'pages'   => 1,
			'results' => count( $themes ),
		),
		'themes' => $themes,
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
		'version'        => '',
		'author'         => array( 'display_name' => $theme['author'] ),
		'description'    => $theme['description'],
		'screenshot_url' => $theme['screenshot_url'],
		'preview_url'    => '',
		'rating'         => 0,
		'num_ratings'    => 0,
		'requires'       => false,
		'requires_php'   => false,
	);
}

/**
 * The themes the tab lists.
 *
 * Placeholder until the WordPress.com themes API is wired in.
 *
 * @return array[]
 */
function wpcom_themes_tab_get_catalog() {
	$themes = array(
		'assembler'        => 'Assembler',
		'twentytwentyfive' => 'Twenty Twenty-Five',
		'jaida'            => 'Jaida',
		'creatio'          => 'Creatio',
		'poesis'           => 'Poesis',
		'course'           => 'Course',
	);

	$catalog = array();
	foreach ( $themes as $slug => $name ) {
		$catalog[] = array(
			'slug'           => $slug,
			'name'           => $name,
			'author'         => 'Automattic',
			'description'    => '',
			'screenshot_url' => "https://s0.wp.com/wp-content/themes/pub/$slug/screenshot.png",
		);
	}

	return $catalog;
}
