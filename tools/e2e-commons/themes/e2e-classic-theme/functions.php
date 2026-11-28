<?php
/**
 * E2E Classic Theme.
 *
 * A minimal classic theme for end-to-end tests that need a site WordPress does
 * not treat as a block theme.
 *
 * ## Do not add a theme.json to this theme
 *
 * That absence is the entire point. `wp_theme_has_theme_json()` is what core
 * checks before enqueueing `wp-includes/css/dist/edit-post/classic.min.css`
 * into the block editor, and that stylesheet gives every `.wp-block` a 28px
 * vertical margin and `margin-inline: auto`. Those two declarations are behind
 * a whole class of editor-only layout bugs that are invisible on a block theme,
 * so specs need a theme that reliably triggers them.
 *
 * For the same reason this theme deliberately does not declare
 * `editor-styles`, `appearance-tools`, or `block-templates` support: each one
 * moves the editor closer to block-theme behavior and away from what this
 * theme exists to reproduce.
 *
 * It is otherwise an ordinary theme, and can grow. If a spec needs a classic
 * theme that registers a sidebar, a nav menu, or a custom image size, add it
 * here rather than reaching for a bundled WordPress theme — those change
 * underneath us on every WordPress release, and one of them gaining a
 * theme.json would silently stop testing what the spec meant to test.
 *
 * @package automattic/jetpack
 */

if ( ! isset( $content_width ) ) {
	$content_width = 800; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Themes are expected to set this global.
}

add_action( 'after_setup_theme', 'e2e_classic_theme_setup' );
add_action( 'wp_enqueue_scripts', 'e2e_classic_theme_enqueue_styles' );

/**
 * Registers the handful of theme supports an ordinary classic theme declares.
 *
 * Anything that would make core treat the site as a block theme is intentionally
 * absent — see the file docblock before adding to this list.
 */
function e2e_classic_theme_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' )
	);
}

/**
 * Enqueues the theme stylesheet.
 */
function e2e_classic_theme_enqueue_styles() {
	wp_enqueue_style(
		'e2e-classic-theme',
		get_stylesheet_uri(),
		array(),
		wp_get_theme()->get( 'Version' )
	);
}
