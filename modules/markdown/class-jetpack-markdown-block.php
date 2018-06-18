<?php
/*
Description: Jetpack markdown block for Gutenberg
Version: 0.1
Author: Fernando Espinosa
*/

add_action( 'init', array( 'Jetpack_Markdown_Block', 'register_block_types' ) );
add_action( 'enqueue_block_editor_assets', array( 'Jetpack_Markdown_Block', 'enqueue_block_editor_assets' ) );

class Jetpack_Markdown_Block {

	public static function register_block_types() {
		register_block_type(
			'jetpack/markdown-block'
		);
	}

	public static function enqueue_block_editor_assets() {
		wp_register_script(
			'jetpack-markdown-block',
			plugins_url( '_inc/build/modules-markdown-block.js', JETPACK__PLUGIN_FILE ),
			array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-components' )
		);
		wp_enqueue_script( 'jetpack-markdown-block' );

		wp_register_style(
			'jetpack-markdown-block',
			plugins_url( 'assets/css/jetpack-markdown-block.css', __FILE__ ),
			array( 'wp-edit-blocks' )
		);
		wp_enqueue_style( 'jetpack-markdown-block' );
	}

}
