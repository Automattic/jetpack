<?php
/**
 * Handles server-side registration and use of all blocks and plugins available in Jetpack for the block editor, aka Gutenberg.
 * Works in tandem with client-side block registration via `index.json`
 *
 * @package Jetpack
 */

/**
 * Helper function to register a Jetpack Gutenberg block
 *
 * @param string $slug Slug of the block.
 * @param array  $args Arguments that are passed into register_block_type.
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
 * @param string $slug Slug of the block.
 * @param string $reason A string representation of why the extension is unavailable.
 *
 * @since 7.0.0
 *
 * @return void
 */
function jetpack_set_extension_unavailability_reason( $slug, $reason ) {
	Jetpack_Gutenberg::set_extension_unavailability_reason( $slug, $reason );
}

/**
 * General Gutenberg editor specific functionality
 */
class Jetpack_Gutenberg {

	/**
	 * Only these extensions can be registered. Used to control availability of beta blocks.
	 *
	 * @var array Extensions whitelist
	 */
	private static $extensions = array();

	/**
	 * Keeps track of the reasons why a given extension is unavailable.
	 *
	 * @var array Extensions availability information
	 */
	private static $availability = array();

	/**
	 * Since there is no `register_plugin()` counterpart to `register_block_type()` in Gutenberg,
	 * we have to keep track of plugin registration ourselves
	 *
	 * @var array Plugin registry
	 */
	private static $registered_plugins = array();

	/**
	 * Prepend the 'jetpack/' prefix to a block name
	 *
	 * @param string $block_name The block name.
	 *
	 * @return string The prefixed block name.
	 */
	private static function prepend_block_prefix( $block_name ) {
		return 'jetpack/' . $block_name;
	}

	/**
	 * Whether two arrays share at least one item
	 *
	 * @param array $a An array.
	 * @param array $b Another array.
	 *
	 * @return boolean True if $a and $b share at least one item
	 */
	protected static function share_items( $a, $b ) {
		return count( array_intersect( $a, $b ) ) > 0;
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
		$prefixed_extensions = array_map( array( __CLASS__, 'prepend_block_prefix' ), self::$extensions );

		// Register the block if it's whitelisted, or if it's a child block, and one of its parents is whitelisted.
		if ( in_array( $slug, self::$extensions, true ) || ( isset( $args['parent'] ) && self::share_items( $args['parent'], $prefixed_extensions ) ) ) {
			register_block_type( 'jetpack/' . $slug, $args );
		} elseif ( ! isset( $args['parent'] ) ) {
			// Don't set availability information for child blocks -- we infer it from their parents.
			self::set_extension_unavailability_reason( $slug, 'not_whitelisted' );
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
		if ( in_array( $slug, self::$extensions, true ) ) {
			self::$registered_plugins[] = 'jetpack-' . $slug;
		} else {
			self::set_extension_unavailability_reason( $slug, 'not_whitelisted' );
		}
	}

	/**
	 * Register a block
	 *
	 * @deprecated 7.0.0 Use register_block() instead
	 *
	 * @param string $slug Slug of the block.
	 * @param array  $args Arguments that are passed into the register_block_type.
	 * @param array  $availability array containing if a block is available and the reason when it is not.
	 */
	public static function register( $slug, $args, $availability ) {
		if ( isset( $availability['available'] ) && ! $availability['available'] ) {
			self::set_extension_unavailability_reason( $slug, $availability['unavailable_reason'] );
		} else {
			self::register_block( $slug, $args );
		}
	}

	/**
	 * Set the reason why an extension (block or plugin) is unavailable
	 *
	 * @param string $slug Slug of the extension.
	 * @param string $reason A string representation of why the extension is unavailable.
	 */
	public static function set_extension_unavailability_reason( $slug, $reason ) {
		self::$availability[ $slug ] = $reason;
	}

	/**
	 * Set up a whitelist of allowed block editor extensions
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
		if ( apply_filters( 'jetpack_load_beta_blocks', false ) ) {
			Jetpack_Constants::set_constant( 'JETPACK_BETA_BLOCKS', true );
		}

		/**
		 * Filter the whitelist of block editor extensions that are available through Jetpack.
		 *
		 * @since 7.0.0
		 *
		 * @param array
		 */
		self::$extensions = apply_filters( 'jetpack_set_available_extensions', self::get_jetpack_gutenberg_extensions_whitelist() );

		/**
		 * Filter the whitelist of block editor plugins that are available through Jetpack.
		 *
		 * @deprecated 7.0.0 Use jetpack_set_available_extensions instead
		 *
		 * @since 6.8.0
		 *
		 * @param array
		 */
		self::$extensions = apply_filters( 'jetpack_set_available_blocks', self::$extensions );

		/**
		 * Filter the whitelist of block editor plugins that are available through Jetpack.
		 *
		 * @deprecated 7.0.0 Use jetpack_set_available_extensions instead
		 *
		 * @since 6.9.0
		 *
		 * @param array
		 */
		self::$extensions = apply_filters( 'jetpack_set_available_plugins', self::$extensions );
	}

	/**
	 * Resets the class to its original state
	 *
	 * Used in unit tests
	 *
	 * @return void
	 */
	public static function reset() {
		self::$extensions         = array();
		self::$availability       = array();
		self::$registered_plugins = array();
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
		 * @since 6.9.0
		 *
		 * @param string default: '_inc/blocks/'
		 */
		return apply_filters( 'jetpack_blocks_directory', '_inc/blocks/' );
	}

	/**
	 * Checks for a given .json file in the blocks folder.
	 *
	 * @param string $preset The name of the .json file to look for.
	 *
	 * @return bool True if the file is found.
	 */
	public static function preset_exists( $preset ) {
		return file_exists( JETPACK__PLUGIN_DIR . self::get_blocks_directory() . $preset . '.json' );
	}

	/**
	 * Decodes JSON loaded from a preset file in the blocks folder
	 *
	 * @param string $preset The name of the .json file to load.
	 *
	 * @return mixed Returns an object if the file is present, or false if a valid .json file is not present.
	 */
	public static function get_preset( $preset ) {
		return json_decode( file_get_contents( JETPACK__PLUGIN_DIR . self::get_blocks_directory() . $preset . '.json' ) );
	}

	/**
	 * Returns a whitelist of Jetpack Gutenberg extensions (blocks and plugins), based on index.json
	 *
	 * @return array A list of blocks: eg [ 'publicize', 'markdown' ]
	 */
	public static function get_jetpack_gutenberg_extensions_whitelist() {
		$preset_extensions_manifest = self::preset_exists( 'index' ) ? self::get_preset( 'index' ) : (object) array();

		$preset_extensions = isset( $preset_extensions_manifest->production ) ? (array) $preset_extensions_manifest->production : array();

		if ( Jetpack_Constants::is_true( 'JETPACK_BETA_BLOCKS' ) ) {
			$beta_extensions = isset( $preset_extensions_manifest->beta ) ? (array) $preset_extensions_manifest->beta : array();
			return array_unique( array_merge( $preset_extensions, $beta_extensions ) );
		}

		return $preset_extensions;
	}

	/**
	 * Get availability of each block / plugin.
	 *
	 * @return array A list of block and plugins and their availablity status
	 */
	public static function get_availability() {

		/**
		 * Fires before Gutenberg extensions availability is computed.
		 *
		 * In the function call you supply, use `jetpack_register_block()` and `jetpack_register_plugin()`, respectively.
		 * Alternatively, use `jetpack_set_extension_unavailability_reason()` if the block or plugin should not be registered but
		 * marked as unavailable.
		 *
		 * @since 7.0.0
		 */
		do_action( 'jetpack_register_gutenberg_extensions' );

		$available_extensions = array();

		foreach ( self::$extensions as $extension ) {
			$is_available = WP_Block_Type_Registry::get_instance()->is_registered( 'jetpack/' . $extension ) ||
				in_array( 'jetpack-' . $extension, self::$registered_plugins, true );

			$available_extensions[ $extension ] = array(
				'available' => $is_available,
			);

			if ( ! $is_available ) {
				$reason = isset( self::$availability[ $extension ] ) ? self::$availability[ $extension ] : 'missing_module';
				$available_extensions[ $extension ]['unavailable_reason'] = $reason;
			}
		}

		$unwhitelisted = array_fill_keys(
			array_diff( array_keys( self::$availability ), self::$extensions ),
			array(
				'available'          => false,
				'unavailable_reason' => 'not_whitelisted',
			)
		);

		return array_merge( $available_extensions, $unwhitelisted );
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
	 * @param array  $script_dependencies An array of view-side Javascript dependencies to be enqueued.
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
		if ( ! self::should_load() ) {
			return;
		}

		$rtl        = is_rtl() ? '.rtl' : '';
		$beta       = Jetpack_Constants::is_true( 'JETPACK_BETA_BLOCKS' ) ? '-beta' : '';
		$blocks_dir = self::get_blocks_directory();

		$editor_script = plugins_url( "{$blocks_dir}editor{$beta}.js", JETPACK__PLUGIN_FILE );
		$editor_style  = plugins_url( "{$blocks_dir}editor{$beta}{$rtl}.css", JETPACK__PLUGIN_FILE );

		$version = Jetpack::is_development_version() && file_exists( JETPACK__PLUGIN_DIR . $blocks_dir . 'editor.js' )
			? filemtime( JETPACK__PLUGIN_DIR . $blocks_dir . 'editor.js' )
			: JETPACK__VERSION;

		if ( method_exists( 'Jetpack', 'build_raw_urls' ) ) {
			$site_fragment = Jetpack::build_raw_urls( home_url() );
		} elseif ( class_exists( 'WPCOM_Masterbar' ) && method_exists( 'WPCOM_Masterbar', 'get_calypso_site_slug' ) ) {
			$site_fragment = WPCOM_Masterbar::get_calypso_site_slug( get_current_blog_id() );
		} else {
			$site_fragment = '';
		}

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
				'jetpack'          => array( 'is_active' => Jetpack::is_active() ),
				'siteFragment'     => $site_fragment,
			)
		);

		Jetpack::setup_wp_i18n_locale_data();

		wp_enqueue_style( 'jetpack-blocks-editor', $editor_style, array(), $version );
	}
}
