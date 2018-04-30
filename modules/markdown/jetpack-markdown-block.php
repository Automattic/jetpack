<?php
/*

Description: Jetpack markdown block for Gutenberg
Version: 0.1
Author: Rene Cabral
*/

add_action( 'init', array( 'Jetpack_Markdown_Block', 'register_block_types' ) );
add_action( 'enqueue_block_editor_assets', array( 'Jetpack_Markdown_Block', 'enqueue_block_editor_assets' ) );





class Jetpack_Markdown_Block {

	public static function register_block_types() {
		register_block_type( 'jetpack/markdown', array(
			'render_callback' => array( __CLASS__, 'render_markdown_block' ),
		) );
	}

	public static function render_markdown_block( $args ) {
		//return '<pre>' . print_r( $args, true ) . '</pre>';
	}

	public static function enqueue_block_editor_assets() {
		wp_enqueue_script(
			'jetpack-markdown-block',
			plugins_url( 'assets/js/jetpack-markdown-block.js', __FILE__ ),
			array( 'wp-blocks', 'wp-element' )
		);
		wp_enqueue_style(
			'jetpack-markdown-block',
			plugins_url( 'assets/css/jetpack-markdown-block.css', __FILE__ ),
			array()
		);

	}

}

