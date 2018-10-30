<?php

/**
 * General Gutenberg editor specific functionality
 */
class Jetpack_Gutenberg {
	/**
	 * Check if Gutenberg editor is available
	 *
	 * @since 6.7.0
	 *
	 * @return bool
	 */
	public static function is_gutenberg_available() {
		return function_exists( 'register_block_type' );
	}

	/**
	 * Load Gutenberg assets
	 *
	 * @since 6.7.0
	 *
	 * @return void
	 */
	public static function enqueue_block_assets() {
		if ( ! self::should_load_blocks() ) {
			return;
		}

		$rtl = is_rtl() ? '.rtl' : '';

		/**
		 * Filter to enable serving blocks via CDN
		 *
		 * CDN cache is busted once a day or when Jetpack version changes. To customize it:
		 *   add_filter( 'jetpack_gutenberg_cdn_cache_buster', function( $version ) { return time(); }, 10, 1 );
		 *
		 * @since 6.5.0
		 *
		 * @param bool false Whether to load Gutenberg blocks from CDN
		 */
		if ( apply_filters( 'jetpack_gutenberg_cdn', false ) ) {
			$cdn_base    = 'https://s0.wp.com/wp-content/mu-plugins/jetpack/_inc/blocks';
			$view_script = "$cdn_base/view.js";
			$view_style  = "$cdn_base/view$rtl.css";

			/**
			 * Filter to modify cache busting for Gutenberg block assets loaded from CDN
			 *
			 * @since 6.5.0
			 *
			 * @param string
			 */
			$version = apply_filters( 'jetpack_gutenberg_cdn_cache_buster', sprintf( '%s-%s', gmdate( 'd-m-Y' ), JETPACK__VERSION ) );
		} else {
			$view_script = plugins_url( '_inc/blocks/view.js', JETPACK__PLUGIN_FILE );
			$view_style  = plugins_url( "_inc/blocks/view$rtl.css", JETPACK__PLUGIN_FILE );
			$version     = Jetpack::is_development_version() && file_exists( JETPACK__PLUGIN_DIR . '_inc/blocks/view.js' )
				? filemtime( JETPACK__PLUGIN_DIR . '_inc/blocks/view.js' )
				: JETPACK__VERSION;
		}

		wp_enqueue_script(
			'jetpack-blocks-view',
			$view_script,
			array(
				'wp-element',
				'wp-i18n',
			),
			$version
		);

		Jetpack::setup_wp_i18n_locale_data();

		wp_enqueue_style( 'jetpack-blocks-view', $view_style, array(), $version );
	}

	/**
	 * Load Gutenberg editor assets
	 *
	 * @since 6.7.0
	 *
	 * @return void
	 */
	public static function enqueue_block_editor_assets() {
		if ( ! self::should_load_blocks() ) {
			return;
		}

		$rtl = is_rtl() ? '.rtl' : '';

		/** This filter is already documented above */
		if ( apply_filters( 'jetpack_gutenberg_cdn', false ) ) {
			$cdn_base      = 'https://s0.wp.com/wp-content/mu-plugins/jetpack/_inc/blocks';
			$editor_script = "$cdn_base/editor.js";
			$editor_style  = "$cdn_base/editor$rtl.css";

			/** This filter is already documented above */
			$version = apply_filters( 'jetpack_gutenberg_cdn_cache_buster', sprintf( '%s-%s', gmdate( 'd-m-Y' ), JETPACK__VERSION ) );
		} else {
			$editor_script = plugins_url( '_inc/blocks/editor.js', JETPACK__PLUGIN_FILE );
			$editor_style  = plugins_url( "_inc/blocks/editor$rtl.css", JETPACK__PLUGIN_FILE );
			$version       = Jetpack::is_development_version() && file_exists( JETPACK__PLUGIN_DIR . '_inc/blocks/editor.js' )
				? filemtime( JETPACK__PLUGIN_DIR . '_inc/blocks/editor.js' )
				: JETPACK__VERSION;
		}

		wp_enqueue_script(
			'jetpack-blocks-editor',
			$editor_script,
			array(
				'lodash',
				'wp-api-fetch',
				'wp-blocks',
				'wp-components',
				'wp-compose',
				'wp-data',
				'wp-date',
				'wp-edit-post',
				'wp-editor',
				'wp-element',
				'wp-hooks',
				'wp-i18n',
				'wp-keycodes',
				'wp-plugins',
				'wp-token-list',
				'wp-url',
			),
			$version
		);

		wp_localize_script(
			'jetpack-blocks-editor',
			'Jetpack_Block_Assets_Base_Url',
			plugins_url( '_inc/blocks/', JETPACK__PLUGIN_FILE )
		);

		$jp_react_page = new Jetpack_React_Page();
		wp_localize_script(
			'jetpack-blocks-editor',
			'Jetpack_Initial_State',
			$jp_react_page->get_initial_state()
		);

		Jetpack::setup_wp_i18n_locale_data();

		wp_enqueue_style( 'jetpack-blocks-editor', $editor_style, array(), $version );
	}

	/**
	 * Check whether conditions indicate Gutenberg blocks should be loaded
	 *
	 * Loading blocks is enabled by default and may be disabled via filter:
	 *   add_filter( 'jetpack_gutenberg', '__return_false' );
	 *
	 * @since 6.7.0
	 *
	 * @return bool
	 */
	public static function should_load_blocks() {
		if ( ! Jetpack::is_active() ) {
			return false;
		}
		/**
		 * Filter to disable Gutenberg blocks
		 *
		 * @since 6.5.0
		 *
		 * @param bool true Whether to load Gutenberg blocks
		 */
		return (bool) apply_filters( 'jetpack_gutenberg', true );
	}
}
