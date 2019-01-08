<?php
/**
 * Handles server-side registration and use of all blocks available in Jetpack for the block editor, aka Gutenberg.
 * Works in tandem with client-side block registration via `index.json`
 *
 * @package Jetpack
 */

/**
 * Helper function to register a Jetpack Gutenberg block
 *
 * @param string $slug Slug of the block
 * @param array  $args Arguments that are passed into the register_block_type.
 *
 * @see register_block_type
 *
 * @since 6.7.0
 *
 * @return void
 */
function jetpack_register_block( $slug, $args = array() ) {
	Jetpack_Gutenberg::register_block( $slug, $args );
}

/**
 * Helper function to register a Jetpack Gutenberg plugin
 *
 * @param string $slug Slug of the plugin.
 *
 * @since 6.9.0
 *
 * @return void
 */
function jetpack_register_plugin( $slug ) {
	Jetpack_Gutenberg::register_plugin( $slug );
}

/**
 * Set the reason why an extension (block or plugin) is unavailable
 *
 * @param string $slug Slug of the block
 * @param string $reason A string representation of why the extension is unavailable
 *
 * @since 7.0.0
 *
 * @return void
 */
function set_jetpack_extension_availability( $slug, $reason ) {
	Jetpack_Gutenberg::set_jetpack_extension_availability( $slug, $reason );
}

/**
 * General Gutenberg editor specific functionality
 */
class Jetpack_Gutenberg {

	/**
	 * @var array Extensions whitelist
	 *
	 * Only these extensions can be registered. Used to control availability of beta blocks.
	 */
	private static $extensions = array();

	/**
	 * @var array Extensions availability information
	 *
	 * Keeps track of the reasons why a given extension is unavailable.
	 */
	private static $availability = array();

	/**
	 * @var array Plugin registry
	 *
	 * Since there is no `register_plugin()` counterpart to `register_block_type()` in Gutenberg,
	 * we have to keep track of plugin registration ourselves
	 */
	private static $registered_plugins = array();

	// Classic singleton pattern:
	private static $instance;
	private function __construct() {}
	static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
			self::$instance::init();
		}
		return self::$instance;
	}

	/**
	 * Register a block
	 *
	 * If the block isn't whitelisted, set its unavailability reason instead.
	 * 
	 * @param string $slug Slug of the block.
	 * @param array  $args Arguments that are passed into register_block_type().
	 */
	public static function register_block( $slug, $args ) {
		if ( in_array( $slug, self::$extensions ) ) {
			register_block_type( 'jetpack/' . $slug, $args );
		} else {
			self::set_jetpack_extension_availability( $slug, 'not_whitelisted' );
		}
	}

	/**
	 * Register a plugin
	 *
	 * If the plugin isn't whitelisted, set its unavailability reason instead.
	 * 
	 * @param string $slug Slug of the plugin.
	 */
	public static function register_plugin( $slug ) {
		if ( in_array( $slug, self::$extensions ) ) {
			self::$registered_plugins[] = 'jetpack-' . $slug;
		} else {
			self::set_jetpack_extension_availability( $slug, 'not_whitelisted' );
		}
	}

	/**
	 * Set the reason why an extension (block or plugin) is unavailable
	 *
	 * @param string $slug Slug of the extension.
	 * @param string $reason A string representation of why the extension is unavailable
	 */
	public static function set_jetpack_extension_availability( $slug, $reason ) {
		self::$availability[ $slug ] = $reason;
	}

	/**
	 * Register all Jetpack blocks available.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::is_gutenberg_available() ) {
			return;
		}

		if ( ! self::should_load() ) {
			return;
		}

		/**
		 * Alternative to `JETPACK_BETA_BLOCKS`, set to `true` to load Beta Blocks.
		 *
		 * @since 6.9.0
		 *
		 * @param boolean
		 */
		if ( apply_filters( 'jetpack_load_beta_blocks', $is_availability_endpoint_beta ) ) {
			Jetpack_Constants::set_constant( 'JETPACK_BETA_BLOCKS', true );
		}

		/**
		 * Filter the list of block editor blocks that are available through jetpack.
		 *
		 * This filter is populated by Jetpack_Gutenberg::jetpack_set_available_blocks
		 *
		 * @since 6.8.0
		 *
		 * @param array
		 */
		self::$extensions = self::jetpack_set_available_blocks( array() ); //apply_filters( 'jetpack_set_available_blocks', array() );

		return $response;
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
	 * using the merged contents of `blocks-manifest.json` ( $preset_extensions )
	 * and self::$jetpack_blocks ( $internal_blocks )
	 *
	 * @param $extensions The default list.
	 *
	 * @return array A list of blocks: eg [ 'publicize', 'markdown' ]
	 */
	public static function jetpack_set_available_blocks( $extensions ) {
		$preset_extensions_manifest =  self::preset_exists( 'index' ) ? self::get_preset( 'index' ) : (object) array( 'production' => $extensions );

		$preset_extensions = isset( $preset_extensions_manifest->production ) ? (array) $preset_extensions_manifest->production : array() ;
		$preset_extensions = array_unique( array_merge( $preset_extensions, $extensions ) );

		if ( Jetpack_Constants::is_true( 'JETPACK_BETA_BLOCKS' ) ) {
			$beta_extensions = isset( $preset_extensions_manifest->beta ) ? (array) $preset_extensions_manifest->beta : array();
			return array_unique( array_merge( $preset_extensions, $beta_extensions ) );
		}

		return $preset_extensions;
	}

	/**
	 * @return array A list of block and plugins and their availablity status
	 */
	public static function get_availability() {
		$available_extensions = [];

		foreach( self::$extensions as $extension ) {
			$is_available = WP_Block_Type_Registry::get_instance()->is_registered( 'jetpack/' . $extension ) ||
				in_array( 'jetpack-' . $extension, self::$registered_plugins );

			$available_extensions[ $extension ] = array(
				'available' => $is_available,
			);

			if ( ! $is_available ) {
				if ( $reason = self::$availability[ $extension ] ) {
					$available_extensions[ $extension ][ 'unavailable_reason' ] = $reason;
				} else {
					$available_extensions[ $extension ][ 'unavailable_reason' ] = 'missing_module';
				}
			}
		}
		return $available_extensions;
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
	 * @deprecated
	 * @return bool
	 */
	public static function should_load_blocks() {
		return self::should_load();
	}

	/**
	 * Check whether conditions indicate Gutenberg Extensions (blocks and plugins) should be loaded
	 *
	 * Loading blocks and plugins is enabled by default and may be disabled via filter:
	 *   add_filter( 'jetpack_gutenberg', '__return_false' );
	 *
	 * @since 6.9.0
	 *
	 * @return bool
	 */
	public static function should_load() {
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
				'wp-blob',
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
				'available_blocks' => self::get_availability(),
				'jetpack' => array( 'is_active' => Jetpack::is_active() ),
			)
		);

		Jetpack::setup_wp_i18n_locale_data();

		wp_enqueue_style( 'jetpack-blocks-editor', $editor_style, array(), $version );
	}
}

Jetpack_Gutenberg::get_instance();