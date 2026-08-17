<?php
/**
 * Block Editor - Newsletter styles.
 *
 * Proof of concept for NL-840: mount the WooCommerce email editor's global
 * styles panel in the Jetpack newsletter sidebar, outside the email editor.
 *
 * The panel is driven entirely by the `email-editor/editor` JS store, so all
 * this needs to do is hand the editor the same three things the WooCommerce
 * email editor hands it: the base email theme, the block editor features
 * derived from that theme, and the ID of the global styles record to edit.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Newsletter_Styles;

use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

const EXTENSION_NAME = 'newsletter-styles';

/**
 * The slug of the newsletter template registered below.
 */
const NEWSLETTER_TEMPLATE_SLUG = 'newsletter';

require_once __DIR__ . '/newsletter-editor-page.php';

/**
 * The post name the WooCommerce email editor stores its user theme under.
 *
 * Kept in sync with `Automattic\WooCommerce\EmailEditor\Engine\User_Theme`.
 */
const USER_THEME_POST_NAME = 'wp-global-styles-woocommerce-email';

/**
 * Register the extension.
 *
 * @return void
 */
function register_extension() {
	Jetpack_Gutenberg::set_extension_available( EXTENSION_NAME );
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_extension' );

/**
 * Whether the WooCommerce email editor's PHP package is loaded.
 *
 * True on WordPress.com, where it is vendored under
 * `wp-content/lib/woocommerce-email-editor/`, and on any site running
 * WooCommerce. False in a bare Jetpack development environment, which is why
 * the fallbacks below exist.
 *
 * @return bool
 */
function has_email_editor_package() {
	return class_exists( '\Automattic\WooCommerce\EmailEditor\Email_Editor_Container' )
		&& class_exists( '\Automattic\WooCommerce\EmailEditor\Engine\Theme_Controller' )
		&& class_exists( '\Automattic\WooCommerce\EmailEditor\Engine\User_Theme' );
}

/**
 * The base email theme, as raw theme.json data.
 *
 * This is the theme the panel layers user edits on top of — deliberately the
 * base, not the merged theme, matching what the email editor itself passes as
 * `editor_theme`.
 *
 * @return array|null Raw theme data, or null when it cannot be resolved.
 */
function get_base_email_theme() {
	if ( ! has_email_editor_package() ) {
		return get_development_email_theme();
	}

	$container        = \Automattic\WooCommerce\EmailEditor\Email_Editor_Container::container();
	$theme_controller = $container->get( \Automattic\WooCommerce\EmailEditor\Engine\Theme_Controller::class );

	return $theme_controller->get_base_theme()->get_raw_data();
}

/**
 * A stand-in email theme for development environments without the package.
 *
 * The email editor's own base theme.json ships an empty color palette and
 * relies on site style sync to fill it, so do the same here rather than
 * present the panel with no colors to offer.
 *
 * @return array|null
 */
function get_development_email_theme() {
	$theme_file = __DIR__ . '/dev-email-theme.json';
	if ( ! file_exists( $theme_file ) ) {
		return null;
	}

	$theme = wp_json_file_decode( $theme_file, array( 'associative' => true ) );
	if ( ! is_array( $theme ) ) {
		return null;
	}

	$palette = wp_get_global_settings( array( 'color', 'palette' ) );
	if ( ! empty( $palette['theme'] ) ) {
		$theme['settings']['color']['palette'] = $palette['theme'];
	}

	return $theme;
}

/**
 * The ID of the global styles record the panel should edit.
 *
 * Always the email editor's own user theme post, never the site's global
 * styles — pointing at the wrong record is the failure this proof of concept
 * is meant to rule out.
 *
 * @return int|null
 */
function get_global_styles_post_id() {
	if ( has_email_editor_package() ) {
		$container  = \Automattic\WooCommerce\EmailEditor\Email_Editor_Container::container();
		$user_theme = $container->get( \Automattic\WooCommerce\EmailEditor\Engine\User_Theme::class );

		return $user_theme->get_user_theme_post()->ID;
	}

	return ensure_development_user_theme_post();
}

/**
 * Create the user theme post in development environments without the package.
 *
 * Mirrors `User_Theme::ensure_theme_post()` so the record the panel writes to
 * locally is the same one WordPress.com would render from.
 *
 * @return int|null
 */
function ensure_development_user_theme_post() {
	$post = get_page_by_path( USER_THEME_POST_NAME, OBJECT, 'wp_global_styles' );
	if ( $post instanceof \WP_Post ) {
		return $post->ID;
	}

	$post_id = wp_insert_post(
		array(
			'post_name'    => USER_THEME_POST_NAME,
			'post_title'   => __( 'Custom Email Styles', 'jetpack' ),
			'post_type'    => 'wp_global_styles',
			'post_status'  => 'publish',
			'post_content' => wp_json_encode(
				array(
					'version'                     => 3,
					'isGlobalStylesUserThemeJSON' => true,
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
			),
		),
		true
	);

	return is_wp_error( $post_id ) ? null : $post_id;
}

/**
 * Register a newsletter template so the site editor has something to attach
 * email styles to.
 *
 * Jetpack ships no newsletter template today — the only email templates on a
 * site come from the WooCommerce email editor package. Design's suggested
 * placement assumes one exists, so the spike registers a minimal stand-in to
 * find out what the site editor does with it.
 *
 * @return void
 */
function register_newsletter_template() {
	if ( ! function_exists( 'register_block_template' ) ) {
		return;
	}

	register_block_template(
		'jetpack//' . NEWSLETTER_TEMPLATE_SLUG,
		array(
			'title'       => __( 'Newsletter', 'jetpack' ),
			'description' => __( 'The layout used when a post is sent to subscribers by email.', 'jetpack' ),
			'content'     => '<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} --><main class="wp-block-group"><!-- wp:post-title /--><!-- wp:post-content /--></main><!-- /wp:group -->',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_newsletter_template' );

/**
 * Whether the current admin screen is one the panel is demoed on.
 *
 * The post editor is where the newsletter sidebar lives. The site editor is the
 * second placement design asked about, and is a different editor shell — proving
 * the panel survives both is the point of the spike.
 *
 * @return bool
 */
function is_supported_screen() {
	$screen = get_current_screen();
	if ( ! $screen ) {
		return false;
	}

	return 'post' === $screen->post_type || 'site-editor' === $screen->base;
}

/**
 * Hand the editor everything the styles store needs.
 *
 * @return void
 */
function enqueue_editor_config() {
	if ( ! is_admin() ) {
		return;
	}

	if ( ! is_supported_screen() ) {
		return;
	}

	$global_styles_post_id = get_global_styles_post_id();
	$theme                 = get_base_email_theme();

	if ( ! $global_styles_post_id || ! is_array( $theme ) ) {
		return;
	}

	$config = array(
		// `getPaletteColors()` reads the palette out of the store's own editor
		// settings, so these have to carry the email theme's features rather
		// than the site's.
		'editorSettings'     => array( '__experimentalFeatures' => $theme['settings'] ?? array() ),
		'theme'              => $theme,
		'urls'               => array(),
		'userEmail'          => wp_get_current_user()->user_email,
		'globalStylesPostId' => (int) $global_styles_post_id,
	);

	// Not `wp_localize_script()`: that casts every value to a string, and the
	// store hands `globalStylesPostId` straight to core-data's `canUser()` and
	// `getEditedEntityRecord()`, which need a real integer.
	wp_add_inline_script(
		'jetpack-blocks-editor',
		'window.JetpackNewsletterStyles = '
			. wp_json_encode( $config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT )
			. ';',
		'before'
	);
}
// `enqueue_block_assets`, not `enqueue_block_editor_assets`: Jetpack registers
// the `jetpack-blocks-editor` handle on the former at priority 10, and the
// latter fires before it — `wp_add_inline_script()` on an unregistered handle
// silently does nothing. Priority 11 is the convention other extensions that
// attach data to this handle already follow.
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\enqueue_editor_config', 11 );
