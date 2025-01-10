<?php
/**
 * The newspack blocks.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Newspack_Blocks;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

define( 'NEWSPACK_BLOCKS__BLOCKS_DIRECTORY', Jetpack_Mu_Wpcom::BASE_DIR . 'build/' );
define( 'NEWSPACK_BLOCKS__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'NEWSPACK_BLOCKS__VERSION', 'v4.5.2' );

require_once __DIR__ . '/../../utils.php';
require_once __DIR__ . '/synced-newspack-blocks/class-newspack-blocks.php';
require_once __DIR__ . '/synced-newspack-blocks/class-newspack-blocks-api.php';
require_once __DIR__ . '/synced-newspack-blocks/blocks/homepage-articles/class-wp-rest-newspack-articles-controller.php';

/**
 * Registers Articles block routes.
 */
function register_rest_routes() {
	$articles_controller = new \WP_REST_Newspack_Articles_Controller();
	$articles_controller->register_routes();
}
add_action( 'rest_api_init', __NAMESPACE__ . '\register_rest_routes' );

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
 * Enqueue the data of the newspack blocks.
 *
 * @param string $handle The name of the script to add the data of the newspack blocks to.
 */
function enqueue_newspack_blocks_data( $handle ) {
	$newspack_blocks_data = wp_json_encode(
		array(
			'posts_rest_url'          => rest_url( 'newspack-blocks/v1/newspack-blocks-posts' ),
			'specific_posts_rest_url' => rest_url( 'newspack-blocks/v1/newspack-blocks-specific-posts' ),
			// Define URL to core one to make autocomplete working for newspack-blocks installed via jetpack-mu-wpcom.
			'authors_rest_url'        => rest_url() . 'wp/v2/users',
			'custom_taxonomies'       => array(),
		)
	);

	wp_add_inline_script(
		$handle,
		"window.newspack_blocks_data = window.newspack_blocks_data ?? $newspack_blocks_data;",
		'before'
	);
}

/**
 * Can be used to disable the Blog Posts Block.
 */
$disable_blog_posts_block = apply_filters( 'a8c_disable_blog_posts_block', false );
if ( ! $disable_blog_posts_block ) {
	require_once __DIR__ . '/synced-newspack-blocks/blocks/homepage-articles/view.php';

	add_action(
		'newspack_blocks_render_homepage_articles',
		function () {
			if ( ! is_admin() ) {
				\jetpack_mu_wpcom_enqueue_assets( 'newspack-blocks-blog-posts-view', array( 'js', 'css' ) );
			}
		}
	);

	add_action(
		is_admin() ? 'enqueue_block_assets' : 'enqueue_block_editor_assets',
		function () {
			$handle = \jetpack_mu_wpcom_enqueue_assets( 'newspack-blocks-blog-posts-editor', array( 'js', 'css' ) );
			enqueue_newspack_blocks_data( $handle );
			wp_set_script_translations( $handle, 'jetpack-mu-wpcom' );
		}
	);
}

/**
 * Can be used to disable the Post Carousel Block.
 */
$disable_posts_carousel_block = apply_filters( 'a8c_disable_posts_carousel_block', false ) || apply_filters( 'a8c_disable_post_carousel_block', false );
if ( ! $disable_posts_carousel_block ) {
	require_once __DIR__ . '/synced-newspack-blocks/blocks/carousel/view.php';

	add_action(
		'newspack_blocks_render_post_carousel',
		function () {
			if ( ! is_admin() ) {
				\jetpack_mu_wpcom_enqueue_assets( 'newspack-blocks-carousel-view', array( 'js', 'css' ) );
			}
		}
	);

	add_action(
		is_admin() ? 'enqueue_block_assets' : 'enqueue_block_editor_assets',
		function () {
			$handle = \jetpack_mu_wpcom_enqueue_assets( 'newspack-blocks-carousel-editor', array( 'js', 'css' ) );
			enqueue_newspack_blocks_data( $handle );
			wp_set_script_translations( $handle, 'jetpack-mu-wpcom' );
		}
	);
}
