<?php
/**
 * Verbum Asset Loader.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

/**
 * Verbum_Asset_Loader is responsible for loading the Verbum Gutenberg editor.
 */
class Verbum_Asset_Loader {

	/**
	 * Load supporting assets for the Verbum Gutenberg editor.
	 */
	public static function load_editor_supporting_assets() {
		$vbe_cache_buster = filemtime( ABSPATH . '/widgets.wp.com/verbum-block-editor/build_meta.json' );

		wp_enqueue_style(
			'verbum-gutenberg-css',
			'https://widgets.wp.com/verbum-block-editor/block-editor.css',
			array(),
			$vbe_cache_buster
		);

		// phpcs:ignore Jetpack.Functions.I18n.TextDomainMismatch
		wp_set_script_translations( 'verbum', 'default', ABSPATH . 'widgets.wp.com/verbum-block-editor/languages/' );
	}

	/**
	 * Load the complete Verbum Gutenberg editor.
	 */
	public static function load_editor() {

		$vbe_cache_buster = filemtime( ABSPATH . '/widgets.wp.com/verbum-block-editor/build_meta.json' );

		wp_enqueue_script(
			'verbum',
			'https://widgets.wp.com/verbum-block-editor/block-editor.min.js',
			array(),
			$vbe_cache_buster,
			true
		);

		self::load_editor_supporting_assets();
	}
}
