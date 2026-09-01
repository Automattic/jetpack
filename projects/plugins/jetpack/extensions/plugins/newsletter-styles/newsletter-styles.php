<?php
/**
 * Newsletter email design.
 *
 * Proof of concept for NL-839: a dedicated wp-admin screen running the
 * WooCommerce email editor against a Jetpack newsletter template, so email
 * design is edited once, site-wide, rather than per post.
 *
 * This file holds the pieces the screen depends on — the template, the base
 * email theme, and the global styles record. The screen itself is in
 * `newsletter-editor-page.php`.
 *
 * Earlier revisions of this branch also mounted the styles panel on its own in
 * the post editor's newsletter sidebar. Design ruled that out: newsletter
 * design is set up once, so a per-post surface reads wrong. See NL-836.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Newsletter_Styles;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

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
 * Whether this proof of concept is switched on for the current site.
 *
 * Off unless `JETPACK_NEWSLETTER_STYLES_DEV` is defined. The constant carries
 * its own scope so that no site identifier has to live in the codebase:
 *
 *   true                  Enabled everywhere. Fine for a single-site local
 *                         development environment.
 *   123 | array( 1, 2 )   Enabled only for those blog IDs. Use this anywhere a
 *                         request can reach a site whose data matters, so that
 *                         visiting an unrelated site cannot switch it on.
 *
 * Scoping matters more than usual here: this registers a newsletter template
 * and an admin screen, and opening that screen resolves the email styles
 * record, which the email editor package *creates* if it is missing
 * (`User_Theme::ensure_theme_post()`). None of that should happen to a site
 * that did not ask for it.
 *
 * @return bool
 */
function is_enabled() {
	if ( ! defined( 'JETPACK_NEWSLETTER_STYLES_DEV' ) || ! JETPACK_NEWSLETTER_STYLES_DEV ) {
		return false;
	}

	if ( true === JETPACK_NEWSLETTER_STYLES_DEV ) {
		return true;
	}

	$allowed_blog_ids = array_map( 'intval', (array) JETPACK_NEWSLETTER_STYLES_DEV );

	return in_array( (int) get_current_blog_id(), $allowed_blog_ids, true );
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
		return is_enabled() ? get_development_email_theme() : null;
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

	// Never create the record on a site that has not opted in — see is_enabled().
	return is_enabled() ? ensure_development_user_theme_post() : null;
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
 * Register a newsletter template for the design screen to edit.
 *
 * Jetpack ships no newsletter template today — the only email templates on a
 * site come from the WooCommerce email editor package. This registers a minimal
 * stand-in so there is something to attach email styles to.
 *
 * Note the template still appears in the site editor's template list. Declaring
 * `post_types` is not enough on its own: core only filters on it when a query
 * names a post type, and the site editor browses without one. WooCommerce keeps
 * its email templates out by also exposing `post_types` on the REST response,
 * which the site editor filters on client-side — see
 * `Engine\Templates\Templates::register_post_types_to_api()` and the upstream
 * fix in WordPress/wordpress-develop#7530. Out of scope here; tracked in NL-839.
 *
 * @return void
 */
function register_newsletter_template() {
	if ( ! is_enabled() || ! function_exists( 'register_block_template' ) ) {
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
