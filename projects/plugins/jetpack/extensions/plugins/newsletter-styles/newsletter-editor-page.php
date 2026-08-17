<?php
/**
 * NL-840 proof of concept, option C: the whole WooCommerce email editor as its
 * own admin screen, editing the Jetpack newsletter template.
 *
 * `ExperimentalEmailEditor` mounts core's private `Editor` provider inside its
 * own `SlotFillProvider`, includes `FullscreenMode`, and mutates global editor
 * settings. It is an application, not a panel — so it cannot be nested inside
 * the post or site editor and needs a screen of its own.
 *
 * The asset bootstrapping here mirrors the package's own `Assets_Manager`,
 * which is the reference implementation for standing up this editor outside
 * WooCommerce.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Newsletter_Styles;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

const EDITOR_PAGE_SLUG = 'jetpack-newsletter-editor';

/**
 * The container the editor mounts into.
 */
const EDITOR_ELEMENT_ID = 'jetpack-newsletter-email-editor';

/**
 * Register the editor screen.
 *
 * Hidden from the menu with a null parent: the spike is about whether the
 * editor runs at all, not about where the entry point belongs.
 *
 * @return void
 */
function register_editor_page() {
	add_submenu_page(
		'', // phpcs:ignore WordPress.Security.NonceVerification -- Not a form handler.
		__( 'Newsletter email design', 'jetpack' ),
		__( 'Newsletter email design', 'jetpack' ),
		'edit_theme_options',
		EDITOR_PAGE_SLUG,
		__NAMESPACE__ . '\render_editor_page'
	);
}
add_action( 'admin_menu', __NAMESPACE__ . '\register_editor_page' );

/**
 * Whether the current request is the editor screen.
 *
 * @return bool
 */
function is_editor_page() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only screen check.
	return isset( $_GET['page'] ) && EDITOR_PAGE_SLUG === $_GET['page'];
}

/**
 * The template the editor edits.
 *
 * Core re-namespaces plugin-registered templates under the active theme, so the
 * ID we registered (`jetpack//newsletter`) is not the ID the editor and the
 * REST API use. Resolve it rather than hardcoding either form.
 *
 * @return string|null
 */
function get_newsletter_template_id() {
	$template = get_block_template( 'jetpack//' . NEWSLETTER_TEMPLATE_SLUG, 'wp_template' );

	if ( $template instanceof \WP_Block_Template ) {
		return $template->id;
	}

	return null;
}

/**
 * Stand up everything the editor bundle needs on this screen.
 *
 * Mirrors `Automattic\WooCommerce\EmailEditor\Engine\Assets_Manager`.
 *
 * @return void
 */
function enqueue_editor_page_assets() {
	if ( ! is_editor_page() ) {
		return;
	}

	// Jetpack registers `jetpack-blocks-editor` on `enqueue_block_assets`, and
	// the block type assets come from `enqueue_block_editor_assets`. Neither
	// fires on a plain admin page, so fire them here.
	do_action( 'enqueue_block_assets' );
	do_action( 'enqueue_block_editor_assets' );

	wp_enqueue_style( 'wp-edit-post' );
	wp_enqueue_style( 'wp-format-library' );
	wp_enqueue_global_styles_css_custom_properties();
	wp_enqueue_media();

	$template_id = get_newsletter_template_id();
	if ( ! $template_id ) {
		return;
	}

	$context = new \WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );

	// Without these the editor warns about missing block categories and titles.
	wp_add_inline_script(
		'wp-blocks',
		sprintf( 'wp.blocks.setCategories( %s );', wp_json_encode( get_block_categories( $context ), JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) ),
		'after'
	);
	wp_add_inline_script(
		'wp-blocks',
		sprintf( 'wp.blocks.unstable__bootstrapServerSideBlockDefinitions( %s );', wp_json_encode( get_block_editor_server_block_settings(), JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) )
	);

	$theme                 = get_base_email_theme();
	$global_styles_post_id = get_global_styles_post_id();

	if ( ! is_array( $theme ) || ! $global_styles_post_id ) {
		return;
	}

	$config = array(
		'elementId'          => EDITOR_ELEMENT_ID,
		'postId'             => $template_id,
		'postType'           => 'wp_template',
		'editorSettings'     => array( '__experimentalFeatures' => $theme['settings'] ?? array() ),
		'theme'              => $theme,
		'urls'               => array( 'back' => admin_url( 'admin.php?page=jetpack' ) ),
		'userEmail'          => wp_get_current_user()->user_email,
		'globalStylesPostId' => (int) $global_styles_post_id,
	);

	wp_add_inline_script(
		'jetpack-blocks-editor',
		'window.JetpackNewsletterEmailEditor = '
			. wp_json_encode( $config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT )
			. ';',
		'before'
	);
}
add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\enqueue_editor_page_assets' );

/**
 * Render the mount point.
 *
 * @return void
 */
function render_editor_page() {
	if ( ! get_newsletter_template_id() ) {
		echo '<div class="wrap"><p>' . esc_html__( 'The newsletter template could not be found.', 'jetpack' ) . '</p></div>';
		return;
	}

	printf(
		'<div id="%s" class="block-editor block-editor__container hide-if-no-js"></div>',
		esc_attr( EDITOR_ELEMENT_ID )
	);
}
