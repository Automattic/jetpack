<?php
/**
 * Plugin Name:     Newspack Blocks
 * Plugin URI:      https://newspack.blog/
 * Description:     A collection of blocks for news publishers.
 * Author:          Automattic
 * Author URI:      https://newspack.blog/
 * Text Domain:     newspack-blocks
 * Domain Path:     /languages
 * Version:         1.0.0-alpha.28
 *
 * @package         Newspack_Blocks
 */

define( 'NEWSPACK_BLOCKS__BLOCKS_DIRECTORY', 'dist/' );
define( 'NEWSPACK_BLOCKS__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'NEWSPACK_BLOCKS__VERSION', '1.0.0-alpha.28' );

require_once 'class-newspack-blocks.php';
require_once 'class-newspack-blocks-api.php';

// REST Controller for Articles Block.
require_once 'class-wp-rest-newspack-articles-controller.php';

/**
 * Registers Articles block routes.
 */
function newspack_articles_block_register_rest_routes() {
	$articles_controller = new WP_REST_Newspack_Articles_Controller();
	$articles_controller->register_routes();
}
add_action( 'rest_api_init', 'newspack_articles_block_register_rest_routes' );
add_action( 'enqueue_block_editor_assets', array( 'Newspack_Blocks', 'enqueue_block_editor_assets' ) );
add_action( 'wp_enqueue_scripts', array( 'Newspack_Blocks', 'enqueue_block_styles_assets' ) );

/**
 * Load language files
 *
 * @action plugins_loaded
 */
function newspack_blocks_plugin_textdomain() {
	load_plugin_textdomain( 'newspack-blocks', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}
add_action( 'plugins_loaded', 'newspack_blocks_plugin_textdomain' );

/**
 * Add global variable for theme supports detection.
 *
 * @action enqueue_block_editor_assets
 */
function newspack_blocks_post_subtitle_detection() {
	wp_localize_script(
		'newspack-blocks-editor',
		'newspackIsPostSubtitleSupported',
		array(
			'post_subtitle' => get_theme_support( 'post-subtitle' ),
		)
	);
}
add_action( 'enqueue_block_editor_assets', 'newspack_blocks_post_subtitle_detection' );
