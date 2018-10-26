<?php
/**
 * Helper function to register a Jetpack Gutenberg block
 *
 * @params $type sting  The type will be prefixed with jetpack/
 * @param $args array   Arguments that are passed into the register_block_type
 *
 * @since 6.7.0
 *
 * @return void
 */
function jetpack_register_block( $type, $args = array() ) {

	Jetpack_Gutenberg::add_block( $type, $args );
}

/**
 * General Gutenberg editor specific functionality
 */
class Jetpack_Gutenberg {

	public static $blocks = array();

	public static function add_block( $type, $args ) {
		self::$blocks[ $type ] = $args;
	}

	public static function load_blocks() {
		if ( ! self::is_gutenberg_available() ) {
			return;
		}

		if ( ! self::should_load_blocks() ) {
			return;
		}

		foreach ( self::$blocks as $type => $args ) {
			register_block_type(
				'jetpack/' . $type,
				$args
			);
		}
	}

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

	public static function load_assets_as_required( $type ) {
		// Enqueue styles
		$style_relative_path = '_inc/blocks/' . $type . '/view' . ( is_rtl() ? '.rtl' : '' ) . '.css';
		if ( self::block_has_asset( $style_relative_path ) ) {
			$style_version = self::get_asset_version( $style_relative_path );
			$view_style    = plugins_url( $style_relative_path, JETPACK__PLUGIN_FILE );
			wp_enqueue_style( 'jetpack-block-' . $type, $view_style, array(), $style_version );
		}

		// Enqueue script
		$script_relative_path = '_inc/blocks/' . $type . '/view.js';
		if ( self::block_has_asset( $script_relative_path ) ) {
			$script_version = self::get_asset_version( $script_relative_path );
			$view_script    = plugins_url( $script_relative_path, JETPACK__PLUGIN_FILE );
			wp_enqueue_script( 'jetpack-block-' . $type, $view_script, array(), $script_version );
		}
	}

	public static function block_has_asset( $file ) {
		return file_exists( JETPACK__PLUGIN_DIR . $file );
	}

	public static function get_asset_version( $file ) {
		return Jetpack::is_development_version() && self::block_has_asset( $file )
			? filemtime( JETPACK__PLUGIN_DIR . $file )
			: JETPACK__VERSION;
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
}
