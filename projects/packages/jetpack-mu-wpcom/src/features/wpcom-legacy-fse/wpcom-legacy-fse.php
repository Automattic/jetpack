<?php
/**
 * Register a8c blocks.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Legacy_FSE;

require_once __DIR__ . '/blocks/navigation-menu/index.php';
require_once __DIR__ . '/blocks/post-content/index.php';
require_once __DIR__ . '/blocks/site-description/index.php';
require_once __DIR__ . '/blocks/site-title/index.php';
require_once __DIR__ . '/blocks/template/index.php';
require_once __DIR__ . '/helpers/index.php';
require_once __DIR__ . '/templates/class-wp-template.php';
require_once __DIR__ . '/templates/class-wp-template-inserter.php';

/**
 * Inserts default full site editing data for current theme on plugin/theme activation.
 *
 * This will populate the default header and footer for current theme, and create
 * About and Contact pages. Nothing will populate if the data already exists, or
 * if the theme is unsupported.
 */
function populate_wp_template_data() {
	if ( ! is_theme_supported() ) {
		return;
	}

	$theme_slug        = normalize_theme_slug( get_theme_slug() );
	$template_inserter = new WP_Template_Inserter( $theme_slug );
	$template_inserter->insert_default_template_data();
	$template_inserter->insert_default_pages();
}
register_activation_hook( __FILE__, __NAMESPACE__ . '\populate_wp_template_data' );
add_action( 'switch_theme', __NAMESPACE__ . '\populate_wp_template_data' );

/**
 * Register wpcom fse template post types.
 */
function wpcom_fse_register_template_post_types() {
	$theme_slug           = normalize_theme_slug( get_stylesheet() );
	$wp_template_inserter = new WP_Template_Inserter( $theme_slug );
	$wp_template_inserter->register_template_post_types();
}

/**
 * Register wpcom fse blocks.
 */
function wpcom_fse_register_blocks() {
	register_block_type(
		'a8c/navigation-menu',
		array(
			'attributes'      => array(
				'className'             => array(
					'type'    => 'string',
					'default' => '',
				),
				'align'                 => array(
					'type'    => 'string',
					'default' => 'wide',
				),
				'textAlign'             => array(
					'type'    => 'string',
					'default' => 'center',
				),
				'textColor'             => array(
					'type' => 'string',
				),
				'customTextColor'       => array(
					'type' => 'string',
				),
				'backgroundColor'       => array(
					'type' => 'string',
				),
				'customBackgroundColor' => array(
					'type' => 'string',
				),
				'fontSize'              => array(
					'type'    => 'string',
					'default' => 'normal',
				),
				'customFontSize'        => array(
					'type' => 'number',
				),
			),
			'render_callback' => __NAMESPACE__ . '\render_navigation_menu_block',
		)
	);

	register_block_type(
		'a8c/post-content',
		array(
			'render_callback' => __NAMESPACE__ . '\render_post_content_block',
		)
	);

	register_block_type(
		'a8c/site-description',
		array(
			'render_callback' => __NAMESPACE__ . '\render_site_description_block',
		)
	);

	register_block_type(
		'a8c/template',
		array(
			'render_callback' => __NAMESPACE__ . '\render_template_block',
		)
	);

	register_block_type(
		'a8c/site-title',
		array(
			'render_callback' => __NAMESPACE__ . '\render_site_title_block',
		)
	);
}

/**
 * Load wpcom FSE.
 */
function load_wpcom_fse() {
	// Bail if FSE should not be active on the site. We do not
	// want to load FSE functionality on non-supported sites!
	if ( ! is_full_site_editing_active() ) {
		return;
	}

	add_action( 'init', __NAMESPACE__ . '\wpcom_fse_register_blocks', 100 );
	add_action( 'init', __NAMESPACE__ . '\wpcom_fse_register_template_post_types' );
}
add_action( 'plugins_loaded', __NAMESPACE__ . '\load_wpcom_fse' );

/**
 * Add front-end CoBlocks gallery block scripts.
 *
 * This function performs the same enqueueing duties as `CoBlocks_Block_Assets::frontend_scripts`,
 * but for dotcom FSE header and footer content. `frontend_scripts` uses
 * `has_block` to determine if gallery blocks are present, and `has_block` is
 * not aware of content sections outside of post_content yet.
 */
function enqueue_coblocks_gallery_scripts() {
	if ( ! defined( 'COBLOCKS_VERSION' ) || ! function_exists( 'CoBlocks' ) || ! is_full_site_editing_active() ) {
		return;
	}

	$template = new WP_Template();
	$header   = $template->get_template_content( 'header' );
	$footer   = $template->get_template_content( 'footer' );

	// Define where the asset is loaded from.
	// @phan-suppress-next-line PhanUndeclaredFunction
	$dir = CoBlocks()->asset_source( 'js' );

	// Define where the vendor asset is loaded from.
	// @phan-suppress-next-line PhanUndeclaredFunction
	$vendors_dir = CoBlocks()->asset_source( 'js', 'vendors' );

	// Masonry block.
	if ( has_block( 'coblocks/gallery-masonry', $header . $footer ) ) {
		wp_enqueue_script(
			'coblocks-masonry',
			$dir . 'coblocks-masonry.min.js',
			array( 'jquery', 'masonry', 'imagesloaded' ),
			COBLOCKS_VERSION,
			true
		);
	}

	// Carousel block.
	if ( has_block( 'coblocks/gallery-carousel', $header . $footer ) ) {
		wp_enqueue_script(
			'coblocks-flickity',
			$vendors_dir . '/flickity.js',
			array( 'jquery' ),
			COBLOCKS_VERSION,
			true
		);
	}
}
add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\enqueue_coblocks_gallery_scripts' );
