<?php
/**
 * The newspack blocks.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Newspack_Blocks;

define( 'MU_WPCOM_NEWSPACK_BLOCKS', true );

define( 'NEWSPACK_BLOCKS__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

// Autogenerated by bin/sync-newspack-blocks.sh.
define( 'NEWSPACK_BLOCKS__VERSION', 'v2.0.0' );
// End autogenerated area.

/**
 * Filters block name.
 *
 * @param string $name Block name.
 * @return string
 */
function blog_posts_block_name( $name ) {
	if ( 'newspack-blocks/homepage-articles' === $name ) {
		return 'a8c/blog-posts';
	}

	if ( 'newspack-blocks/carousel' === $name ) {
		return 'a8c/posts-carousel';
	}

	return $name;
}
add_filter( 'newspack_blocks_block_name', __NAMESPACE__ . '\blog_posts_block_name' );

/**
 * Filters block arguments for `register_block_type()`.
 *
 * @param array  $args Arguments to `register_block_type()`.
 * @param string $name Block name.
 * @return array
 */
function newspack_blocks_block_args( $args, $name ) {
	if ( 'homepage-articles' !== $name && 'carousel' !== $name ) {
		return $args;
	}

	$block_prefix = 'homepage-articles' === $name
		? 'blog-posts'
		: 'carousel';

	// Editor script.
	$editor_asset_name = "newspack-block-$block_prefix-editor";
	$editor_filename   = "build/$editor_asset_name/$editor_asset_name";
	$script_data       = require NEWSPACK_BLOCKS__PLUGIN_DIR . "$editor_filename.asset.php";
	wp_register_script(
		"jetpack-mu-wpcom-$editor_asset_name-script",
		plugins_url( "$editor_filename.js", __FILE__ ),
		$script_data['dependencies'],
		$script_data['version'],
		true
	);

	if ( 'homepage-articles' === $name || 'carousel' === $name ) {
		wp_localize_script(
			'blog-posts-block-editor',
			'newspack_blocks_data',
			array(
				'posts_rest_url'          => rest_url( 'newspack-blocks/v1/newspack-blocks-posts' ),
				'specific_posts_rest_url' => rest_url( 'newspack-blocks/v1/newspack-blocks-specific-posts' ),
				// Define URL to core one to make autocomplete working for newspack-blocks installed via ETK.
				'authors_rest_url'        => rest_url() . 'wp/v2/users',
				'custom_taxonomies'       => array(),
			)
		);
	}

	// Editor style.
	wp_register_style(
		"jetpack-mu-wpcom-$editor_asset_name-style",
		plugins_url( $editor_filename . is_rtl() ? 'rtl.css' : 'css', __FILE__ ),
		array(),
		NEWSPACK_BLOCKS__VERSION
	);

	// View script.
	$view_asset_name = "newspack-block-$block_prefix-view";
	$view_filename   = "build/$editor_asset_name/$editor_asset_name";
	$script_data     = require NEWSPACK_BLOCKS__PLUGIN_DIR . "$view_filename.asset.php";
	wp_register_script(
		"jetpack-mu-wpcom-$view_asset_name-script",
		plugins_url( "$view_filename.js", __FILE__ ),
		$script_data['dependencies'],
		$script_data['version'],
		true
	);

	// View style.
	wp_register_style(
		"jetpack-mu-wpcom-$view_asset_name-style",
		plugins_url( $view_filename . is_rtl() ? 'rtl.css' : 'css', __FILE__ ),
		array(),
		NEWSPACK_BLOCKS__VERSION
	);

	$args['editor_script'] = "$block_prefix-editor";
	$args['editor_style']  = "$block_prefix-editor";

	// This fires from newspack-blocks at render time.
	add_action(
		'newspack_blocks_render_post_carousel',
		function () {
			wp_enqueue_style( 'carousel-block-view' );
			wp_enqueue_script( 'carousel-block-view' );
		}
	);

	// This fires from newspack-blocks at render time.
	add_action(
		'newspack_blocks_render_homepage_articles',
		function () {
			wp_enqueue_style( 'blog-posts-block-view' );
			wp_enqueue_script( 'blog-posts-block-view' );
		}
	);

	wp_set_script_translations( $block_prefix . '-editor', 'jetpack-mu-wpcom' );

	return $args;
}
add_filter( 'newspack_blocks_block_args', __NAMESPACE__ . '\newspack_blocks_block_args', 10, 2 );

require_once __DIR__ . '/synced-newspack-blocks/class-newspack-blocks.php';
require_once __DIR__ . '/synced-newspack-blocks/class-newspack-blocks-api.php';
require_once __DIR__ . '/synced-newspack-blocks/blocks/homepage-articles/view.php';

/**
 * Can be used to disable the Post Carousel Block.
 *
 * @since 1.2
 *
 * @param bool true if Post Carousel Block should be disabled, false otherwise.
 */
if ( ! apply_filters( 'a8c_disable_posts_carousel_block', false ) && ! apply_filters( 'a8c_disable_post_carousel_block', false ) ) {
	require_once __DIR__ . '/synced-newspack-blocks/blocks/carousel/view.php';
}

// REST Controller for Articles Block.
require_once NEWSPACK_BLOCKS__PLUGIN_DIR . 'synced-newspack-blocks/blocks/homepage-articles/class-wp-rest-newspack-articles-controller.php';

/**
 * Registers Articles block routes.
 */
function register_rest_routes() {
	$articles_controller = new \WP_REST_Newspack_Articles_Controller();
	$articles_controller->register_routes();
}
add_action( 'rest_api_init', __NAMESPACE__ . '\register_rest_routes' );
