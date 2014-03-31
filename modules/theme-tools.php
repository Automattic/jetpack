<?php
/*
 * Load code specific to themes or theme tools
 * This file is special, and is not an actual `module` as such.
 * It is included by ./module-extras.php
 */

function jetpack_load_theme_tools() {
	if ( current_theme_supports( 'social-links' ) ) {
		require_once( JETPACK__PLUGIN_DIR . 'modules/theme-tools/social-links.php' );
	}

	if ( current_theme_supports( 'tonesque' ) ) {
		jetpack_require_lib( 'tonesque' );
	}

	require_once( JETPACK__PLUGIN_DIR . 'modules/theme-tools/random-redirect.php' );
}
add_action( 'init', 'jetpack_load_theme_tools', 30 );

// Featured Content has an internal check for theme support in the constructor.
// This could already be defined by Twenty Fourteen if it's loaded first.
// Be sure to not load this on the plugin page in case another plugin is activating
// with the same class name in an attempt to override Jetpack's Featured_Content
if ( ! class_exists( 'Featured_Content' ) && isset( $GLOBALS['pagenow'] ) && 'plugins.php' !== $GLOBALS['pagenow'] ) {
	require_once( JETPACK__PLUGIN_DIR . 'modules/theme-tools/featured-content.php' );
}

/**
 * INFINITE SCROLL
 */

/**
 * Load theme's infinite scroll annotation file, if present in the IS plugin.
 * The `setup_theme` action is used because the annotation files should be using `after_setup_theme` to register support for IS.
 *
 * As released in Jetpack 2.0, a child theme's parent wasn't checked for in the plugin's bundled support, hence the convoluted way the parent is checked for now.
 *
 * @uses is_admin, wp_get_theme, get_theme, get_current_theme, apply_filters
 * @action setup_theme
 * @return null
 */
function jetpack_load_infinite_scroll_annotation() {
	if ( is_admin() && isset( $_GET['page'] ) && 'jetpack' == $_GET['page'] ) {
		$theme = function_exists( 'wp_get_theme' ) ? wp_get_theme() : get_theme( get_current_theme() );

		if ( ! is_a( $theme, 'WP_Theme' ) && ! is_array( $theme ) )
			return;

		$customization_file = apply_filters( 'infinite_scroll_customization_file', dirname( __FILE__ ) . "/infinite-scroll/themes/{$theme['Stylesheet']}.php", $theme['Stylesheet'] );

		if ( is_readable( $customization_file ) ) {
			require_once( $customization_file );
		}
		elseif ( ! empty( $theme['Template'] ) ) {
			$customization_file = dirname( __FILE__ ) . "/infinite-scroll/themes/{$theme['Template']}.php";

			if ( is_readable( $customization_file ) )
				require_once( $customization_file );
		}
	}
}
add_action( 'setup_theme', 'jetpack_load_infinite_scroll_annotation' );

/**
 * Prevent IS from being activated if theme doesn't support it
 *
 * @param bool $can_activate
 * @filter jetpack_can_activate_infinite-scroll
 * @return bool
 */
function jetpack_can_activate_infinite_scroll( $can_activate ) {
	return (bool) current_theme_supports( 'infinite-scroll' );
}
add_filter( 'jetpack_can_activate_infinite-scroll', 'jetpack_can_activate_infinite_scroll' );

// Custom Post Types - we don't want a module card for these (yet)
require_once( JETPACK__PLUGIN_DIR . 'modules/custom-post-types/comics.php' );
require_once( JETPACK__PLUGIN_DIR . 'modules/custom-post-types/testimonial.php' );
require_once( JETPACK__PLUGIN_DIR . 'modules/custom-post-types/nova.php' );

/**
 * Load theme compat file if it exists.
 *
 * A theme could add its own compat files here if they like. For example:
 *
 * add_filter( 'jetpack_theme_compat_files', 'mytheme_jetpack_compat_file' );
 * function mytheme_jetpack_compat_file( $files ) {
 *     $files['mytheme'] = locate_template( 'jetpack-compat.php' );
 *     return $files;
 * }
 */
function jetpack_load_theme_compat() {
	$compat_files = apply_filters( 'jetpack_theme_compat_files', array(
		'twentyfourteen' => JETPACK__PLUGIN_DIR . 'modules/theme-tools/compat/twentyfourteen.php',
	) );

	_jetpack_require_compat_file( get_stylesheet(), $compat_files );

	if ( is_child_theme() ) {
		_jetpack_require_compat_file( get_template(), $compat_files );
	}
}
add_action( 'after_setup_theme', 'jetpack_load_theme_compat', -1 );


/**
 * Requires a file once, if the passed key exists in the files array.
 *
 * @access private
 * @param string $key
 * @param array $files
 * @return void
 */
function _jetpack_require_compat_file( $key, $files ) {
	if ( array_key_exists( $key, $files ) && is_readable( $files[ $key ] ) ) {
		require_once $files[ $key ];
	}
}
