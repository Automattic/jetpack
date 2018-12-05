<?php
/**
 * Handles server-side registration and use of all blocks available in Jetpack for the block editor, aka Gutenberg.
 * Works in tandem with client-side block registration via `block-manifest.json`
 *
 * @package Jetpack
 */

/**
 * Helper function to register a Jetpack Gutenberg block
 *
 * @param string $type Slug of the block. Will be prefixed with jetpack/.
 * @param array  $args Arguments that are passed into the register_block_type.
 * @param array  $avalibility Arguments that tells us what kind of avalibility the block has
 *
 * @see register_block_type
 *
 * @since 6.7.0
 *
 * @return void
 */
function jetpack_register_block( $type, $args = array(), $availability = array( 'available' => true ) ) {
	$type = sanitize_title_with_dashes( $type );
	Jetpack_Gutenberg::add_block( $type, $args, $availability );
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
	private static $jetpack_blocks = array();
	private static $blocks_index = array();
	/**
	 * Add a block to the list of blocks to be registered.
	 *
	 * @param string $type Slug of the block.
	 * @param array  $args Arguments that are passed into the register_block_type.
	 */
	public static function add_block( $type, $args, $availability ) {
		self::$jetpack_blocks[ $type ] = array( 'args' => $args, 'availability' => $availability );
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

		if ( Jetpack_Constants::is_true( 'REST_API_REQUEST' ) ) {
			// We defer the loading of the blocks until we have a better scope in reset requests.
			add_filter( 'rest_request_before_callbacks', array( __CLASS__, 'defered_register_blocks' ) );
			return;
		}

		self::register_blocks();
	}

	static function defered_register_blocks( $request ) {
		self::register_blocks();
		return $request;
	}

	static function register_blocks() {
		/**
		 * Filter the list of blocks that are available through jetpack.
		 *
		 * This filter is populated by Jetpack_Gutenberg::jetpack_set_available_blocks
		 *
		 * @since 6.8.0
		 *
		 * @param array
		 */
		self::$blocks_index = apply_filters( 'jetpack_set_available_blocks', array() );
		foreach ( self::$jetpack_blocks as $type => $args ) {
			if ( 'publicize' === $type ) {
				// publicize is not actually a block, it's a gutenberg plugin.
				// We will handle it's registration on the client-side.
				continue;
			}
			if ( isset( $args['availability']['callback'] ) ) {
				$args['availability'] = call_user_func( $args['availability']['callback'] );
				self::$jetpack_blocks[ $type ] = $args; // update this so that we don't have to call it again
			}
			if ( isset( $args['availability']['available'] ) && $args['availability']['available'] && in_array( $type, self::$blocks_index ) ) {
				register_block_type( 'jetpack/' . $type, $args['args'] );
			}
		}
	}

	/**
	 * Return the Gutenberg extensions (blocks and plugins) directory
	 *
	 * @return string The Gutenberg extensions directory
	 */
	public static function get_blocks_directory() {
		/**
		 * Filter to select Gutenberg blocks directory
		 *
		 * @since 6.9
		 *
		 * @param string default: '_inc/blocks/'
		 */
		return apply_filters( 'jetpack_blocks_directory', '_inc/blocks/' );
	}

	/**
	 * Checks for a given .json file in the blocks folder.
	 *
	 * @param $preset The name of the .json file to look for.
	 *
	 * @return bool True if the file is found.
	 */
	public static function preset_exists( $preset ) {
		return file_exists( JETPACK__PLUGIN_DIR . self::get_blocks_directory() . $preset . '.json' );
	}

	/**
	 * Decodes JSON loaded from a preset file in the blocks folder
	 *
	 * @param $preset The name of the .json file to load.
	 *
	 * @return mixed Returns an object if the file is present, or false if a valid .json file is not present.
	 */
	public static function get_preset( $preset ) {
		return json_decode( file_get_contents(  JETPACK__PLUGIN_DIR .self::get_blocks_directory() . $preset . '.json' ) );
	}

	/**
	 * Filters the results of `apply_filter( 'jetpack_set_available_blocks', array() )`
	 * using the merged contents of `blocks-manifest.json` ( $preset_blocks )
	 * and self::$jetpack_blocks ( $internal_blocks )
	 *
	 * @param $blocks The default list.
	 *
	 * @return array A list of blocks: eg [ 'publicize', 'markdown' ]
	 */
	public static function jetpack_set_available_blocks( $blocks ) {
		$preset_blocks_manifest =  self::preset_exists( 'block-manifest' ) ? self::get_preset( 'block-manifest' ) : (object) array( 'blocks' => $blocks );
		$preset_blocks = isset( $preset_blocks_manifest->blocks ) ? (array) $preset_blocks_manifest->blocks : array() ;
		$internal_blocks = array_keys( self::$jetpack_blocks );

		if ( Jetpack_Constants::is_true( 'JETPACK_BETA_BLOCKS' ) ) {
			$beta_blocks = isset( $preset_blocks_manifest->betaBlocks ) ? (array) $preset_blocks_manifest->betaBlocks : array();
			return array_unique( array_merge( $preset_blocks, $beta_blocks, $internal_blocks ) );
		}

		return array_unique( array_merge( $preset_blocks, $internal_blocks ) );
	}

	/**
	 * @return array A list of block-availability information, eg: [ "publicize" => ["available" => true ], "markdown" => [ "available" => false, "unavailable_reason" => 'missing_module' ] ]
	 */
	public static function get_block_availability() {

		if ( ! self::should_load_blocks() ) {
			return array();
		}

		$blocks_availability = array(); // default

		foreach ( self::$jetpack_blocks as $type => $args ) {
			if ( ! in_array( $type,  self::$blocks_index ) ) {
				// Jetpack shouldn't expose blocks that are not in the manifest.
				continue;
			}
			$availability = $args['availability'];
			$available = array(
				'available' => ( isset( $availability['available'] ) ? (bool) $availability['available'] : true ),
			);
			$unavailability_reason = array();
			if ( ! $available['available'] ) {
				$unavailability_reason = array(
					'unavailable_reason' => ( isset( $availability['unavailable_reason'] ) ? $availability['unavailable_reason'] : 'unknown' )
				);
			}
			$blocks_availability[ $type ] = array_merge( $available, $unavailability_reason );
		}

		foreach ( self::$blocks_index as $block ) {
			if ( ! isset( $blocks_availability[ $block ] ) ) {
				$blocks_availability[ $block ] = array( 'available' => false, 'unavailable_reason' => 'missing_module' );
			}
		}

		return $blocks_availability;
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
		if ( ! Jetpack::is_active() && ! Jetpack::is_development_mode() ) {
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
	 * @param array $script_dependencies An array of view-side Javascript dependencies to be enqueued.
	 *
	 * @return void
	 */
	public static function load_assets_as_required( $type, $script_dependencies = array() ) {
		if ( is_admin() ) {
			// A block's view assets will not be required in wp-admin.
			return;
		}

		$type = sanitize_title_with_dashes( $type );
		// Enqueue styles.
		$style_relative_path = self::get_blocks_directory() . $type . '/view' . ( is_rtl() ? '.rtl' : '' ) . '.css';
		if ( self::block_has_asset( $style_relative_path ) ) {
			$style_version = self::get_asset_version( $style_relative_path );
			$view_style    = plugins_url( $style_relative_path, JETPACK__PLUGIN_FILE );
			wp_enqueue_style( 'jetpack-block-' . $type, $view_style, array(), $style_version );
		}

		// Enqueue script.
		$script_relative_path = self::get_blocks_directory() . $type . '/view.js';
		if ( self::block_has_asset( $script_relative_path ) ) {
			$script_version = self::get_asset_version( $script_relative_path );
			$view_script    = plugins_url( $script_relative_path, JETPACK__PLUGIN_FILE );
			wp_enqueue_script( 'jetpack-block-' . $type, $view_script, $script_dependencies, $script_version, false );
		}

		wp_localize_script(
			'jetpack-block-' . $type,
			'Jetpack_Block_Assets_Base_Url',
			plugins_url( self::get_blocks_directory(), JETPACK__PLUGIN_FILE )
		);
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
		$beta = Jetpack_Constants::is_true('JETPACK_BETA_BLOCKS' ) ? '-beta' : '';
		$blocks_dir = self::get_blocks_directory();

		$editor_script = plugins_url( "{$blocks_dir}editor{$beta}.js", JETPACK__PLUGIN_FILE );
		$editor_style  = plugins_url( "{$blocks_dir}editor{$beta}{$rtl}.css", JETPACK__PLUGIN_FILE );

		$version       = Jetpack::is_development_version() && file_exists( JETPACK__PLUGIN_DIR . $blocks_dir . 'editor.js' )
			? filemtime( JETPACK__PLUGIN_DIR . $blocks_dir . 'editor.js' )
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
				'wp-rich-text',
				'wp-token-list',
				'wp-url',
			),
			$version,
			false
		);

		wp_localize_script(
			'jetpack-blocks-editor',
			'Jetpack_Block_Assets_Base_Url',
			plugins_url( $blocks_dir . '/', JETPACK__PLUGIN_FILE )
		);

		wp_localize_script(
			'jetpack-blocks-editor',
			'Jetpack_Editor_Initial_State',
			array(
				'available_blocks' => self::get_block_availability(),
				'jetpack' => array( 'is_active' => Jetpack::is_active() ),
			)
		);

		Jetpack::setup_wp_i18n_locale_data();

		wp_enqueue_style( 'jetpack-blocks-editor', $editor_style, array(), $version );

		// The social-logos styles are used for Publicize service icons
		// TODO: Remove when we ship the icons with the Gutenberg blocks build
		wp_enqueue_style( 'social-logos' );
	}
}
