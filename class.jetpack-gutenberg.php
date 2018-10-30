<?php
/**
 * Handle the registration and use of all blocks available in Jetpack for the block editor, aka Gutenberg.
 *
 * @package Jetpack
 */

/**
 * Helper function to register a Jetpack Gutenberg block
 *
 * @param string $type Slug of the block. Will be prefixed with jetpack/.
 * @param array  $args Arguments that are passed into the register_block_type.
 *
 * @see register_block_type
 *
 * @since 6.7.0
 *
 * @return void
 */
function jetpack_register_block( $type, $args = array() ) {
	$type = sanitize_title_with_dashes( $type );
	Jetpack_Gutenberg::add_block( $type, $args );
}

/**
 * General Gutenberg editor specific functionality
 */
class Jetpack_Gutenberg {

	/**
	 * Array of blocks we will be registering.
	 *
	 * @var array $blocks Array of blocks we will be registering.
	 */
	public static $blocks = array();

	/**
	 * Add a block to the list of blocks to be registered.
	 *
	 * @param string $type Slug of the block.
	 * @param array  $args Arguments that are passed into the register_block_type.
	 */
	public static function add_block( $type, $args ) {
		self::$blocks[ $type ] = $args;
	}

	/**
	 * Register all Jetpack blocks available.
	 *
	 * @return void|WP_Block_Type|false The registered block type on success, or false on failure.
	 */
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

	/**
	 * Only enqueue block assets when needed.
	 *
	 * @param string $type slug of the block.
	 *
	 * @return void
	 */
	public static function load_assets_as_required( $type ) {
		$type = sanitize_title_with_dashes( $type );
		// Enqueue styles.
		$style_relative_path = '_inc/blocks/' . $type . '/view' . ( is_rtl() ? '.rtl' : '' ) . '.css';
		if ( self::block_has_asset( $style_relative_path ) ) {
			$style_version = self::get_asset_version( $style_relative_path );
			$view_style    = plugins_url( $style_relative_path, JETPACK__PLUGIN_FILE );
			wp_enqueue_style( 'jetpack-block-' . $type, $view_style, array(), $style_version );
		}

		// Enqueue script.
		$script_relative_path = '_inc/blocks/' . $type . '/view.js';
		if ( self::block_has_asset( $script_relative_path ) ) {
			$script_version = self::get_asset_version( $script_relative_path );
			$view_script    = plugins_url( $script_relative_path, JETPACK__PLUGIN_FILE );
			wp_enqueue_script( 'jetpack-block-' . $type, $view_script, array(), $script_version, false );
		}
	}

	/**
	 * Check if an asset exists for a block.
	 *
	 * @param string $file Path of the file we are looking for.
	 *
	 * @return bool $block_has_asset Does the file exist.
	 */
	public static function block_has_asset( $file ) {
		return file_exists( JETPACK__PLUGIN_DIR . $file );
	}

	/**
	 * Get the version number to use when loading the file. Allows us to bypass cache when developing.
	 *
	 * @param string $file Path of the file we are looking for.
	 *
	 * @return string $script_version Version number.
	 */
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
		$beta = defined( 'JETPACK_BETA_BLOCKS' ) && JETPACK_BETA_BLOCKS ? '-beta' : '';

		$editor_script = plugins_url( "_inc/blocks/editor{$beta}.js", JETPACK__PLUGIN_FILE );
		$editor_style  = plugins_url( "_inc/blocks/editor{$beta}{$rtl}.css", JETPACK__PLUGIN_FILE );

		$version       = Jetpack::is_development_version() && file_exists( JETPACK__PLUGIN_DIR . '_inc/blocks/editor.js' )
			? filemtime( JETPACK__PLUGIN_DIR . '_inc/blocks/editor.js' )
			: JETPACK__VERSION;

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
			$version,
			false
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
