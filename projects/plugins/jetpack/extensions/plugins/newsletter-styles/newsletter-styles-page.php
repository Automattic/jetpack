<?php
/**
 * NL-840 proof of concept, option D: the styles panel on an admin screen of its
 * own, with no block editor around it.
 *
 * Option C proved the whole email editor can run outside WooCommerce, but it
 * brings a canvas, an inserter and a publish flow along with it. When the goal
 * is only "let someone restyle their newsletter", the chrome-free `StylesPanel`
 * on a plain admin page is the smaller thing that does the job — and it gives
 * the feature a real menu entry, which the sidebar placements cannot.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Newsletter_Styles;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

const STYLES_PAGE_SLUG = 'jetpack-newsletter-styles';

/**
 * The container the panel mounts into.
 */
const STYLES_ELEMENT_ID = 'jetpack-newsletter-styles-page';

/**
 * Register the styles screen.
 *
 * Hidden from the menu like the option C screen — where the entry point belongs
 * is a design question, not something the spike should answer by planting a
 * menu item.
 *
 * @return void
 */
function register_styles_page() {
	add_submenu_page(
		'',
		__( 'Newsletter styles', 'jetpack' ),
		__( 'Newsletter styles', 'jetpack' ),
		'edit_theme_options',
		STYLES_PAGE_SLUG,
		__NAMESPACE__ . '\render_styles_page'
	);
}
add_action( 'admin_menu', __NAMESPACE__ . '\register_styles_page' );

/**
 * Whether the current request is the styles screen.
 *
 * @return bool
 */
function is_styles_page() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only screen check.
	return isset( $_GET['page'] ) && STYLES_PAGE_SLUG === $_GET['page'];
}

/**
 * Enqueue what the panel needs.
 *
 * Deliberately less than option C: no `enqueue_block_editor_assets`, no block
 * category or server-side block definition bootstrapping, no media library.
 * The panel renders block editor *controls*, so it needs their styles, but it
 * never mounts an editor.
 *
 * @return void
 */
function enqueue_styles_page_assets() {
	if ( ! is_styles_page() ) {
		return;
	}

	// Jetpack dequeues `jetpack-blocks-editor` when WordPress says the screen
	// does not need block editor assets, which is true of any plain admin page.
	// The panel is built from block editor controls, so this screen does need
	// them — say so through the filter core provides rather than re-enqueueing
	// the handle behind Jetpack's back.
	add_filter( 'should_load_block_editor_scripts_and_styles', '__return_true' );

	// Registers and enqueues `jetpack-blocks-editor`, which carries the panel.
	do_action( 'enqueue_block_assets' );

	wp_enqueue_style( 'wp-components' );
	wp_enqueue_style( 'wp-block-editor' );
	wp_enqueue_global_styles_css_custom_properties();

	$theme                 = get_base_email_theme();
	$global_styles_post_id = get_global_styles_post_id();

	if ( ! is_array( $theme ) || ! $global_styles_post_id ) {
		return;
	}

	$config = array(
		'elementId'          => STYLES_ELEMENT_ID,
		'editorSettings'     => array( '__experimentalFeatures' => $theme['settings'] ?? array() ),
		'theme'              => $theme,
		'urls'               => array(),
		'userEmail'          => wp_get_current_user()->user_email,
		'globalStylesPostId' => (int) $global_styles_post_id,
	);

	wp_add_inline_script(
		'jetpack-blocks-editor',
		'window.JetpackNewsletterStylesPage = '
			. wp_json_encode( $config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT )
			. ';',
		'before'
	);
}
add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\enqueue_styles_page_assets' );

/**
 * Render the mount point.
 *
 * @return void
 */
function render_styles_page() {
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Newsletter styles', 'jetpack' ); ?></h1>
		<p><?php esc_html_e( 'Change how your posts look when they are sent to subscribers by email.', 'jetpack' ); ?></p>
		<div id="<?php echo esc_attr( STYLES_ELEMENT_ID ); ?>" class="jetpack-newsletter-styles-page__mount"></div>
	</div>
	<?php
}
