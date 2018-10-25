<?php


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

	public static function init() {
		add_action( 'enqueue_block_editor_assets', array( 'Jetpack_Gutenberg', 'enqueue_block_editor_assets' ) );
		add_action( 'init', array( __CLASS__, 'load_blocks' ), 1000 );
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

	public static function load_blocks() {
		if ( ! self::is_gutenberg_available() ) {
			return;
		}

		foreach ( self::$blocks as $type => $args ) {
			register_block_type(
				'jetpack/' . $type,
				$args
			);
		}
	}


	public static function get_registed_blocks() {
		return WP_Block_Type_Registry::get_instance()->get_all_registered();
	}

	public static function load_assets_as_required( $type ) {
		// Enqueue styles
		$style_relative_path = '_inc/blocks/' . $type . '/view.' . ( is_rtl() ? '.rtl' : '' ) . 'css';
		if ( self::block_has_styles( $style_relative_path ) ) {
			$style_version = self::get_version( $style_relative_path );
			$view_style    = plugins_url( $style_relative_path, JETPACK__PLUGIN_FILE );
			wp_enqueue_style( 'jetpack-block-' . $type, $view_style, array(), $style_version );
		}

		// Enqueue script
		$script_relative_path = '_inc/blocks/' . $type . '/view.js';
		if ( self::block_has_script( $script_relative_path ) ) {
			$script_version = self::get_version( $script_relative_path );
			$view_script    = plugins_url( $script_relative_path, JETPACK__PLUGIN_FILE );
			wp_enqueue_script( 'jetpack-block-' . $type, $view_script, array(), $script_version );
		}
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

		$editor_script = plugins_url( '_inc/blocks/editor.js', JETPACK__PLUGIN_FILE );
		$editor_style  = plugins_url( "_inc/blocks/editor$rtl.css", JETPACK__PLUGIN_FILE );
		$version       = self::get_version( '_inc/blocks/editor.js' );

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

		Jetpack::setup_wp_i18n_locale_data();

		wp_enqueue_style( 'jetpack-blocks-editor', $editor_style, array(), $version );
		// enqueue all the assets for each block that is loaded.
		foreach ( self::$blocks as $type => $args ) {
			self::load_assets_as_required( $type );
		}
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

	public static function get_version( $file ) {
		return Jetpack::is_development_version() && file_exists( JETPACK__PLUGIN_DIR . $file )
			? filemtime( JETPACK__PLUGIN_DIR . $file )
			: JETPACK__VERSION;
	}

	public static function block_has_script( $file ) {
		return file_exists( JETPACK__PLUGIN_DIR . $file );
	}

	public static function block_has_styles( $file ) {
		return file_exists( JETPACK__PLUGIN_DIR . $file );
	}
}
