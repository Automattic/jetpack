<?php
/**
 * Verbum Gutenberg Editor
 *
 * @package automattic/jetpack-mu-plugins
 */

declare( strict_types = 1 );

/**
 * Verbum_Gutenberg_Editor is responsible for loading the Gutenberg editor for comments.
 *
 * This loads the isolated editor, and sets up the editor to be used for Verbum_Comments.
 *
 * @see https://github.com/Automattic/isolated-block-editor
 */
class Verbum_Gutenberg_Editor {
	/**
	 * Class constructor
	 */
	public function __construct() {
		define( 'VERBUM_USING_GUTENBERG', true );

		// Override the placeholder text
		add_filter(
			'write_your_story',
			function () {
				return __( 'Write a comment...', 'jetpack-mu-wpcom' );
			},
			9999
		);
		add_filter( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Enqueue the assets for the Gutenberg editor
	 */
	public function enqueue_assets() {
		$vbe_cache_buster = filemtime( ABSPATH . '/widgets.wp.com/verbum-block-editor/build_meta.json' );

		wp_enqueue_style(
			'verbum-gutenberg-css',
			'https://widgets.wp.com/verbum-block-editor/block-editor.css',
			array(),
			$vbe_cache_buster
		);
	}
}
