<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Handles server-side registration and use of all blocks and plugins available in Jetpack for the block editor, aka Gutenberg.
 * Works in tandem with client-side block registration via `index.json`
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status;

/**
 * Wrapper function to safely register a gutenberg block type
 *
 * @deprecated 9.1.0 Use Automattic\\Jetpack\\Blocks::jetpack_register_block instead
 *
 * @see register_block_type
 *
 * @since 6.7.0
 *
 * @param string $slug Slug of the block.
 * @param array  $args Arguments that are passed into register_block_type.
 *
 * @return WP_Block_Type|false The registered block type on success, or false on failure.
 */
function jetpack_register_block( $slug, $args = array() ) {
	_deprecated_function( __METHOD__, '9.1.0', 'Automattic\\Jetpack\\Blocks::jetpack_register_block' );
	return Blocks::jetpack_register_block( $slug, $args );
}

/**
 * Helper function to register a Jetpack Gutenberg plugin
 *
 * @deprecated 7.1.0 Use Jetpack_Gutenberg::set_extension_available() instead
 *
 * @param string $slug Slug of the plugin.
 *
 * @since 6.9.0
 *
 * @return void
 */
function jetpack_register_plugin( $slug ) {
	_deprecated_function( __FUNCTION__, '7.1', 'Jetpack_Gutenberg::set_extension_available' );

	Jetpack_Gutenberg::register_plugin( $slug );
}

/**
 * Set the reason why an extension (block or plugin) is unavailable
 *
 * @deprecated 7.1.0 Use Jetpack_Gutenberg::set_extension_unavailable() instead
 *
 * @param string $slug Slug of the block.
 * @param string $reason A string representation of why the extension is unavailable.
 *
 * @since 7.0.0
 *
 * @return void
 */
function jetpack_set_extension_unavailability_reason( $slug, $reason ) {
	_deprecated_function( __FUNCTION__, '7.1', 'Jetpack_Gutenberg::set_extension_unavailable' );

	Jetpack_Gutenberg::set_extension_unavailability_reason( $slug, $reason );
}

/**
 * General Gutenberg editor specific functionality
 */
class Jetpack_Gutenberg {

	/**
	 * Only these extensions can be registered. Used to control availability of beta blocks.
	 *
	 * @var array Extensions allowed list.
	 */
	private static $extensions = array();

	/**
	 * Keeps track of the reasons why a given extension is unavailable.
	 *
	 * @var array Extensions availability information
	 */
	private static $availability = array();

	/**
	 * A cached array of the fully processed availability data. Keeps track of
	 * reasons why an extension is unavailable or missing.
	 *
	 * @var array Extensions availability information.
	 */
	private static $cached_availability = null;

	/**
	 * Check to see if a minimum version of Gutenberg is available. Because a Gutenberg version is not available in
	 * php if the Gutenberg plugin is not installed, if we know which minimum WP release has the required version we can
	 * optionally fall back to that.
	 *
	 * @param array  $version_requirements An array containing the required Gutenberg version and, if known, the WordPress version that was released with this minimum version.
	 * @param string $slug The slug of the block or plugin that has the gutenberg version requirement.
	 *
	 * @since 8.3.0
	 *
	 * @return boolean True if the version of gutenberg required by the block or plugin is available.
	 */
	public static function is_gutenberg_version_available( $version_requirements, $slug ) {
		global $wp_version;

		// Bail if we don't at least have the gutenberg version requirement, the WP version is optional.
		if ( empty( $version_requirements['gutenberg'] ) ) {
			return false;
		}

		// If running a local dev build of gutenberg plugin GUTENBERG_DEVELOPMENT_MODE is set so assume correct version.
		if ( defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE ) {
			return true;
		}

		$version_available = false;

		// If running a production build of the gutenberg plugin then GUTENBERG_VERSION is set, otherwise if WP version
		// with required version of Gutenberg is known check that.
		if ( defined( 'GUTENBERG_VERSION' ) ) {
			$version_available = version_compare( GUTENBERG_VERSION, $version_requirements['gutenberg'], '>=' );
		} elseif ( ! empty( $version_requirements['wp'] ) ) {
			$version_available = version_compare( $wp_version, $version_requirements['wp'], '>=' );
		}

		if ( ! $version_available ) {
			self::set_extension_unavailable(
				$slug,
				'incorrect_gutenberg_version',
				array(
					'required_feature' => $slug,
					'required_version' => $version_requirements,
					'current_version'  => array(
						'wp'        => $wp_version,
						'gutenberg' => defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : null,
					),
				)
			);
		}

		return $version_available;
	}

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
	 * Remove the 'jetpack/' or jetpack-' prefix from an extension name
	 *
	 * @param string $extension_name The extension name.
	 *
	 * @return string The unprefixed extension name.
	 */
	public static function remove_extension_prefix( $extension_name ) {
		if ( 0 === strpos( $extension_name, 'jetpack/' ) || 0 === strpos( $extension_name, 'jetpack-' ) ) {
			return substr( $extension_name, strlen( 'jetpack/' ) );
		}
		return $extension_name;
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
	 * Register a plugin
	 *
	 * @deprecated 7.1.0 Use Jetpack_Gutenberg::set_extension_available() instead
	 *
	 * @param string $slug Slug of the plugin.
	 */
	public static function register_plugin( $slug ) {
		_deprecated_function( __METHOD__, '7.1', 'Jetpack_Gutenberg::set_extension_available' );

		self::set_extension_available( $slug );
	}

	/**
	 * Set a (non-block) extension as available
	 *
	 * @param string $slug Slug of the extension.
	 */
	public static function set_extension_available( $slug ) {
		self::$availability[ self::remove_extension_prefix( $slug ) ] = true;
	}

	/**
	 * Set the reason why an extension (block or plugin) is unavailable
	 *
	 * @param string $slug Slug of the extension.
	 * @param string $reason A string representation of why the extension is unavailable.
	 * @param array  $details A free-form array containing more information on why the extension is unavailable.
	 */
	public static function set_extension_unavailable( $slug, $reason, $details = array() ) {
		if (
			// Extensions that require a plan may be eligible for upgrades.
			'missing_plan' === $reason
			&& (
				/**
				 * Filter 'jetpack_block_editor_enable_upgrade_nudge' with `true` to enable or `false`
				 * to disable paid feature upgrade nudges in the block editor.
				 *
				 * When this is changed to default to `true`, you should also update `modules/memberships/class-jetpack-memberships.php`
				 * See https://github.com/Automattic/jetpack/pull/13394#pullrequestreview-293063378
				 *
				 * @since 7.7.0
				 *
				 * @param boolean
				 */
				! apply_filters( 'jetpack_block_editor_enable_upgrade_nudge', false )
				/** This filter is documented in _inc/lib/admin-pages/class.jetpack-react-page.php */
				|| ! apply_filters( 'jetpack_show_promotions', true )
			)
		) {
			// The block editor may apply an upgrade nudge if `missing_plan` is the reason.
			// Add a descriptive suffix to disable behavior but provide informative reason.
			$reason .= '__nudge_disabled';
		}

		self::$availability[ self::remove_extension_prefix( $slug ) ] = array(
			'reason'  => $reason,
			'details' => $details,
		);
	}

	/**
	 * Set the reason why an extension (block or plugin) is unavailable
	 *
	 * @deprecated 7.1.0 Use set_extension_unavailable() instead
	 *
	 * @param string $slug Slug of the extension.
	 * @param string $reason A string representation of why the extension is unavailable.
	 */
	public static function set_extension_unavailability_reason( $slug, $reason ) {
		_deprecated_function( __METHOD__, '7.1', 'Jetpack_Gutenberg::set_extension_unavailable' );

		self::set_extension_unavailable( $slug, $reason );
	}

	/**
	 * Set up a list of allowed block editor extensions
	 *
	 * @return void
	 */
	public static function init() {
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
			Constants::set_constant( 'JETPACK_BETA_BLOCKS', true );
		}

		/**
		 * Alternative to `JETPACK_EXPERIMENTAL_BLOCKS`, set to `true` to load Experimental Blocks.
		 *
		 * @since 8.4.0
		 *
		 * @param boolean
		 */
		if ( apply_filters( 'jetpack_load_experimental_blocks', false ) ) {
			Constants::set_constant( 'JETPACK_EXPERIMENTAL_BLOCKS', true );
		}

		/**
		 * Filter the list of block editor extensions that are available through Jetpack.
		 *
		 * @since 7.0.0
		 *
		 * @param array
		 */
		self::$extensions = apply_filters( 'jetpack_set_available_extensions', self::get_available_extensions() );

		/**
		 * Filter the list of block editor plugins that are available through Jetpack.
		 *
		 * @deprecated 7.0.0 Use jetpack_set_available_extensions instead
		 *
		 * @since 6.8.0
		 *
		 * @param array
		 */
		self::$extensions = apply_filters( 'jetpack_set_available_blocks', self::$extensions );

		/**
		 * Filter the list of block editor plugins that are available through Jetpack.
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
		self::$extensions          = array();
		self::$availability        = array();
		self::$cached_availability = null;
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
		return json_decode(
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( JETPACK__PLUGIN_DIR . self::get_blocks_directory() . $preset . '.json' )
		);
	}

	/**
	 * Returns a list of Jetpack Gutenberg extensions (blocks and plugins), based on index.json
	 *
	 * @return array A list of blocks: eg [ 'publicize', 'markdown' ]
	 */
	public static function get_jetpack_gutenberg_extensions_allowed_list() {
		$preset_extensions_manifest = self::preset_exists( 'index' )
			? self::get_preset( 'index' )
			: (object) array();
		$blocks_variation           = self::blocks_variation();

		return self::get_extensions_preset_for_variation( $preset_extensions_manifest, $blocks_variation );
	}

	/**
	 * Returns a list of Jetpack Gutenberg extensions (blocks and plugins), based on index.json
	 *
	 * @deprecated 8.7.0 Use get_jetpack_gutenberg_extensions_allowed_list()
	 *
	 * @return array A list of blocks: eg [ 'publicize', 'markdown' ]
	 */
	public static function get_jetpack_gutenberg_extensions_whitelist() {
		_deprecated_function( __FUNCTION__, 'jetpack-8.7.0', 'Jetpack_Gutenberg::get_jetpack_gutenberg_extensions_allowed_list' );
		return self::get_jetpack_gutenberg_extensions_allowed_list();
	}

	/**
	 * Returns a diff from a combined list of allowed extensions and extensions determined to be excluded
	 *
	 * @param  array $allowed_extensions An array of allowed extensions.
	 *
	 * @return array A list of blocks: eg array( 'publicize', 'markdown' )
	 */
	public static function get_available_extensions( $allowed_extensions = null ) {
		$exclusions         = get_option( 'jetpack_excluded_extensions', array() );
		$allowed_extensions = is_null( $allowed_extensions ) ? self::get_jetpack_gutenberg_extensions_allowed_list() : $allowed_extensions;

		return array_diff( $allowed_extensions, $exclusions );
	}

	/**
	 * Return true if the extension has been registered and there's nothing in the availablilty array.
	 *
	 * @param string $extension The name of the extension.
	 *
	 * @return bool whether the extension has been registered and there's nothing in the availablilty array.
	 */
	public static function is_registered_and_no_entry_in_availability( $extension ) {
		return self::is_registered( 'jetpack/' . $extension ) && ! isset( self::$availability[ $extension ] );
	}

	/**
	 * Return true if the extension has a true entry in the availablilty array.
	 *
	 * @param string $extension The name of the extension.
	 *
	 * @return bool whether the extension has a true entry in the availablilty array.
	 */
	public static function is_available( $extension ) {
		return isset( self::$availability[ $extension ] ) && true === self::$availability[ $extension ];
	}

	/**
	 * Get the availability of each block / plugin, or return the cached availability
	 * if it has already been calculated. Avoids re-registering extensions when not
	 * necessary.
	 *
	 * @return array A list of block and plugins and their availability status.
	 */
	public static function get_cached_availability() {
		if ( null === self::$cached_availability ) {
			self::$cached_availability = self::get_availability();
		}
		return self::$cached_availability;
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
		 * In the function call you supply, use `Blocks::jetpack_register_block()` to set a block as available.
		 * Alternatively, use `Jetpack_Gutenberg::set_extension_available()` (for a non-block plugin), and
		 * `Jetpack_Gutenberg::set_extension_unavailable()` (if the block or plugin should not be registered
		 * but marked as unavailable).
		 *
		 * @since 7.0.0
		 */
		do_action( 'jetpack_register_gutenberg_extensions' );

		$available_extensions = array();

		foreach ( self::$extensions as $extension ) {
			$is_available                       = self::is_registered_and_no_entry_in_availability( $extension ) || self::is_available( $extension );
			$available_extensions[ $extension ] = array(
				'available' => $is_available,
			);

			if ( ! $is_available ) {
				$reason  = isset( self::$availability[ $extension ] ) ? self::$availability[ $extension ]['reason'] : 'missing_module';
				$details = isset( self::$availability[ $extension ] ) ? self::$availability[ $extension ]['details'] : array();
				$available_extensions[ $extension ]['unavailable_reason'] = $reason;
				$available_extensions[ $extension ]['details']            = $details;
			}
		}

		return $available_extensions;
	}

	/**
	 * Check if an extension/block is already registered
	 *
	 * @since 7.2
	 *
	 * @param string $slug Name of extension/block to check.
	 *
	 * @return bool
	 */
	public static function is_registered( $slug ) {
		return WP_Block_Type_Registry::get_instance()->is_registered( $slug );
	}

	/**
	 * Check if Gutenberg editor is available
	 *
	 * @since 6.7.0
	 *
	 * @return bool
	 */
	public static function is_gutenberg_available() {
		return true;
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
		if ( ! Jetpack::is_connection_ready() && ! ( new Status() )->is_offline_mode() ) {
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
	 * @param string $type Slug of the block.
	 * @param array  $script_dependencies Script dependencies. Will be merged with automatically
	 *                                    detected script dependencies from the webpack build.
	 *
	 * @return void
	 */
	public static function load_assets_as_required( $type, $script_dependencies = array() ) {
		if ( is_admin() ) {
			// A block's view assets will not be required in wp-admin.
			return;
		}

		$type = sanitize_title_with_dashes( $type );
		self::load_styles_as_required( $type );
		self::load_scripts_as_required( $type, $script_dependencies );
	}

	/**
	 * Only enqueue block sytles when needed.
	 *
	 * @param string $type Slug of the block.
	 *
	 * @since 7.2.0
	 *
	 * @return void
	 */
	public static function load_styles_as_required( $type ) {
		if ( is_admin() ) {
			// A block's view assets will not be required in wp-admin.
			return;
		}

		// Enqueue styles.
		$style_relative_path = self::get_blocks_directory() . $type . '/view' . ( is_rtl() ? '.rtl' : '' ) . '.css';
		if ( self::block_has_asset( $style_relative_path ) ) {
			$style_version = self::get_asset_version( $style_relative_path );
			$view_style    = plugins_url( $style_relative_path, JETPACK__PLUGIN_FILE );

			// If this is a customizer preview, render the style directly to the preview after autosave.
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if ( is_customize_preview() && ! empty( $_GET['customize_autosaved'] ) ) {
				// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet
				echo '<link rel="stylesheet" id="jetpack-block-' . esc_attr( $type ) . '" href="' . esc_attr( $view_style ) . '?ver=' . esc_attr( $style_version ) . '" media="all">';
			} else {
				wp_enqueue_style( 'jetpack-block-' . $type, $view_style, array(), $style_version );
			}
		}

	}

	/**
	 * Only enqueue block scripts when needed.
	 *
	 * @param string $type Slug of the block.
	 * @param array  $script_dependencies Script dependencies. Will be merged with automatically
	 *                             detected script dependencies from the webpack build.
	 *
	 * @since 7.2.0
	 *
	 * @return void
	 */
	public static function load_scripts_as_required( $type, $script_dependencies = array() ) {
		if ( is_admin() ) {
			// A block's view assets will not be required in wp-admin.
			return;
		}

		// Enqueue script.
		$script_relative_path  = self::get_blocks_directory() . $type . '/view.js';
		$script_deps_path      = JETPACK__PLUGIN_DIR . self::get_blocks_directory() . $type . '/view.asset.php';
		$script_dependencies[] = 'wp-polyfill';
		if ( file_exists( $script_deps_path ) ) {
			$asset_manifest      = include $script_deps_path;
			$script_dependencies = array_unique( array_merge( $script_dependencies, $asset_manifest['dependencies'] ) );
		}

		if ( ! Blocks::is_amp_request() && self::block_has_asset( $script_relative_path ) ) {
			$script_version = self::get_asset_version( $script_relative_path );
			$view_script    = plugins_url( $script_relative_path, JETPACK__PLUGIN_FILE );

			// Enqueue dependencies.
			wp_enqueue_script( 'jetpack-block-' . $type, $view_script, $script_dependencies, $script_version, false );

			// If this is a customizer preview, enqueue the dependencies and render the script directly to the preview after autosave.
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if ( is_customize_preview() && ! empty( $_GET['customize_autosaved'] ) ) {
				// The Map block is dependent on wp-element, and it doesn't appear to to be possible to load
				// this dynamically into the customizer iframe currently.
				if ( 'map' === $type ) {
					echo '<div>' . esc_html_e( 'No map preview available. Publish and refresh to see this widget.', 'jetpack' ) . '</div>';
					echo '<script>';
					echo 'Array.from(document.getElementsByClassName(\'wp-block-jetpack-map\')).forEach(function(element){element.style.display = \'none\';})';
					echo '</script>';
				} else {
					echo '<script id="jetpack-block-' . esc_attr( $type ) . '" src="' . esc_attr( $view_script ) . '?ver=' . esc_attr( $script_version ) . '"></script>';
				}
			}
		}

		wp_localize_script(
			'jetpack-block-' . $type,
			'Jetpack_Block_Assets_Base_Url',
			array(
				'url' => plugins_url( self::get_blocks_directory(), JETPACK__PLUGIN_FILE ),
			)
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

		$status = new Status();

		// Required for Analytics. See _inc/lib/admin-pages/class.jetpack-admin-page.php.
		if ( ! $status->is_offline_mode() && Jetpack::is_connection_ready() ) {
			wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
		}

		$rtl              = is_rtl() ? '.rtl' : '';
		$blocks_dir       = self::get_blocks_directory();
		$blocks_variation = self::blocks_variation();

		if ( 'production' !== $blocks_variation ) {
			$blocks_env = '-' . esc_attr( $blocks_variation );
		} else {
			$blocks_env = '';
		}

		$editor_script = plugins_url( "{$blocks_dir}editor{$blocks_env}.js", JETPACK__PLUGIN_FILE );
		$editor_style  = plugins_url( "{$blocks_dir}editor{$blocks_env}{$rtl}.css", JETPACK__PLUGIN_FILE );

		$editor_deps_path = JETPACK__PLUGIN_DIR . $blocks_dir . "editor{$blocks_env}.asset.php";
		$editor_deps      = array( 'wp-polyfill' );
		if ( file_exists( $editor_deps_path ) ) {
			$asset_manifest = include $editor_deps_path;
			$editor_deps    = $asset_manifest['dependencies'];
		}

		$version = Jetpack::is_development_version() && file_exists( JETPACK__PLUGIN_DIR . $blocks_dir . 'editor.js' )
			? filemtime( JETPACK__PLUGIN_DIR . $blocks_dir . 'editor.js' )
			: JETPACK__VERSION;

		wp_enqueue_script(
			'jetpack-blocks-editor',
			$editor_script,
			$editor_deps,
			$version,
			false
		);

		wp_localize_script(
			'jetpack-blocks-editor',
			'Jetpack_Block_Assets_Base_Url',
			array(
				'url' => plugins_url( $blocks_dir . '/', JETPACK__PLUGIN_FILE ),
			)
		);

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$user                      = wp_get_current_user();
			$user_data                 = array(
				'userid'   => $user->ID,
				'username' => $user->user_login,
			);
			$blog_id                   = get_current_blog_id();
			$is_current_user_connected = true;
		} else {
			$user_data                 = Jetpack_Tracks_Client::get_connected_user_tracks_identity();
			$blog_id                   = Jetpack_Options::get_option( 'id', 0 );
			$is_current_user_connected = ( new Connection_Manager( 'jetpack' ) )->is_user_connected();
		}

		wp_localize_script(
			'jetpack-blocks-editor',
			'Jetpack_Editor_Initial_State',
			array(
				'available_blocks' => self::get_availability(),
				'jetpack'          => array(
					'is_active'                 => Jetpack::is_connection_ready(),
					'is_current_user_connected' => $is_current_user_connected,
					/** This filter is documented in class.jetpack-gutenberg.php */
					'enable_upgrade_nudge'      => apply_filters( 'jetpack_block_editor_enable_upgrade_nudge', false ),
					'is_private_site'           => '-1' === get_option( 'blog_public' ),
				),
				'siteFragment'     => $status->get_site_suffix(),
				'adminUrl'         => esc_url( admin_url() ),
				'tracksUserData'   => $user_data,
				'wpcomBlogId'      => $blog_id,
				'allowedMimeTypes' => wp_get_mime_types(),
			)
		);

		wp_set_script_translations( 'jetpack-blocks-editor', 'jetpack' );

		wp_enqueue_style( 'jetpack-blocks-editor', $editor_style, array(), $version );
	}

	/**
	 * Some blocks do not depend on a specific module,
	 * and can consequently be loaded outside of the usual modules.
	 * We will look for such modules in the extensions/ directory.
	 *
	 * @since 7.1.0
	 */
	public static function load_independent_blocks() {
		if ( self::should_load() ) {
			/**
			 * Look for files that match our list of available Jetpack Gutenberg extensions (blocks and plugins).
			 * If available, load them.
			 */
			foreach ( self::$extensions as $extension ) {
				$extension_file_glob = glob( JETPACK__PLUGIN_DIR . 'extensions/*/' . $extension . '/' . $extension . '.php' );
				if ( ! empty( $extension_file_glob ) ) {
					include_once $extension_file_glob[0];
				}
			}
		}
	}

	/**
	 * Loads PHP components of extended-blocks.
	 *
	 * @since 8.9.0
	 */
	public static function load_extended_blocks() {
		if ( self::should_load() ) {
			$extended_blocks = glob( JETPACK__PLUGIN_DIR . 'extensions/extended-blocks/*' );

			foreach ( $extended_blocks as $block ) {
				$name = basename( $block );
				$path = JETPACK__PLUGIN_DIR . 'extensions/extended-blocks/' . $name . '/' . $name . '.php';

				if ( file_exists( $path ) ) {
					include_once $path;
				}
			}
		}
	}

	/**
	 * Get CSS classes for a block.
	 *
	 * @since 7.7.0
	 *
	 * @param string $slug  Block slug.
	 * @param array  $attr  Block attributes.
	 * @param array  $extra Potential extra classes you may want to provide.
	 *
	 * @return string $classes List of CSS classes for a block.
	 */
	public static function block_classes( $slug, $attr, $extra = array() ) {
		_deprecated_function( __METHOD__, '9.0.0', 'Automattic\\Jetpack\\Blocks::classes' );
		return Blocks::classes( $slug, $attr, $extra );
	}

	/**
	 * Determine whether a site should use the default set of blocks, or a custom set.
	 * Possible variations are currently beta, experimental, and production.
	 *
	 * @since 8.1.0
	 *
	 * @return string $block_varation production|beta|experimental
	 */
	public static function blocks_variation() {
		// Default to production blocks.
		$block_varation = 'production';

		if ( Constants::is_true( 'JETPACK_BETA_BLOCKS' ) ) {
			$block_varation = 'beta';
		}

		/*
		 * Switch to experimental blocks if you use the JETPACK_EXPERIMENTAL_BLOCKS constant.
		 */
		if ( Constants::is_true( 'JETPACK_EXPERIMENTAL_BLOCKS' ) ) {
			$block_varation = 'experimental';
		}

		/**
		 * Allow customizing the variation of blocks in use on a site.
		 *
		 * @since 8.1.0
		 *
		 * @param string $block_variation Can be beta, experimental, and production. Defaults to production.
		 */
		return apply_filters( 'jetpack_blocks_variation', $block_varation );
	}

	/**
	 * Get a list of extensions available for the variation you chose.
	 *
	 * @since 8.1.0
	 *
	 * @param obj    $preset_extensions_manifest List of extensions available in Jetpack.
	 * @param string $blocks_variation           Subset of blocks. production|beta|experimental.
	 *
	 * @return array $preset_extensions Array of extensions for that variation
	 */
	public static function get_extensions_preset_for_variation( $preset_extensions_manifest, $blocks_variation ) {
		$preset_extensions = isset( $preset_extensions_manifest->{ $blocks_variation } )
				? (array) $preset_extensions_manifest->{ $blocks_variation }
				: array();

		/*
		 * Experimental and Beta blocks need the production blocks as well.
		 */
		if (
			'experimental' === $blocks_variation
			|| 'beta' === $blocks_variation
		) {
			$production_extensions = isset( $preset_extensions_manifest->production )
				? (array) $preset_extensions_manifest->production
				: array();

			$preset_extensions = array_unique( array_merge( $preset_extensions, $production_extensions ) );
		}

		/*
		 * Beta blocks need the experimental blocks as well.
		 *
		 * If you've chosen to see Beta blocks,
		 * we want to make all blocks available to you:
		 * - Production
		 * - Experimental
		 * - Beta
		 */
		if ( 'beta' === $blocks_variation ) {
			$production_extensions = isset( $preset_extensions_manifest->experimental )
				? (array) $preset_extensions_manifest->experimental
				: array();

			$preset_extensions = array_unique( array_merge( $preset_extensions, $production_extensions ) );
		}

		return $preset_extensions;
	}

	/**
	 * Validate a URL used in a SSR block.
	 *
	 * @since 8.3.0
	 *
	 * @param string $url      URL saved as an attribute in block.
	 * @param array  $allowed  Array of allowed hosts for that block, or regexes to check against.
	 * @param bool   $is_regex Array of regexes matching the URL that could be used in block.
	 *
	 * @return bool|string
	 */
	public static function validate_block_embed_url( $url, $allowed = array(), $is_regex = false ) {
		if (
			empty( $url )
			|| ! is_array( $allowed )
			|| empty( $allowed )
		) {
			return false;
		}

		$url_components = wp_parse_url( $url );

		// Bail early if we cannot find a host.
		if ( empty( $url_components['host'] ) ) {
			return false;
		}

		// Normalize URL.
		$url = sprintf(
			'%s://%s%s%s',
			isset( $url_components['scheme'] ) ? $url_components['scheme'] : 'https',
			$url_components['host'],
			isset( $url_components['path'] ) ? $url_components['path'] : '/',
			isset( $url_components['query'] ) ? '?' . $url_components['query'] : ''
		);

		if ( ! empty( $url_components['fragment'] ) ) {
			$url = $url . '#' . rawurlencode( $url_components['fragment'] );
		}

		/*
		 * If we're using an allowed list of hosts,
		 * check if the URL belongs to one of the domains allowed for that block.
		 */
		if (
			false === $is_regex
			&& in_array( $url_components['host'], $allowed, true )
		) {
			return $url;
		}

		/*
		 * If we are using an array of regexes to check against,
		 * loop through that.
		 */
		if ( true === $is_regex ) {
			foreach ( $allowed as $regex ) {
				if ( 1 === preg_match( $regex, $url ) ) {
					return $url;
				}
			}
		}

		return false;
	}

	/**
	 * Determines whether a preview of the block with an upgrade nudge should
	 * be displayed for admins on the site frontend.
	 *
	 * @since 8.4.0
	 *
	 * @param array $availability_for_block The availability for the block.
	 *
	 * @return bool
	 */
	public static function should_show_frontend_preview( $availability_for_block ) {
		return (
			isset( $availability_for_block['details']['required_plan'] )
			&& current_user_can( 'manage_options' )
			&& ! is_feed()
		);
	}

	/**
	 * Output an UpgradeNudge Component on the frontend of a site.
	 *
	 * @since 8.4.0
	 *
	 * @param string $plan The plan that users need to purchase to make the block work.
	 *
	 * @return string
	 */
	public static function upgrade_nudge( $plan ) {
		jetpack_require_lib( 'components' );
		return Jetpack_Components::render_upgrade_nudge(
			array(
				'plan' => $plan,
			)
		);
	}

	/**
	 * Output a notice within a block.
	 *
	 * @since 8.6.0
	 *
	 * @param string $message Notice we want to output.
	 * @param string $status  Status of the notice. Can be one of success, info, warning, error. info by default.
	 * @param string $classes List of CSS classes.
	 *
	 * @return string
	 */
	public static function notice( $message, $status = 'info', $classes = '' ) {
		if (
			empty( $message )
			|| ! in_array( $status, array( 'success', 'info', 'warning', 'error' ), true )
		) {
			return '';
		}

		$color = '';
		switch ( $status ) {
			case 'success':
				$color = '#00a32a';
				break;
			case 'warning':
				$color = '#dba617';
				break;
			case 'error':
				$color = '#d63638';
				break;
			case 'info':
			default:
				$color = '#72aee6';
				break;
		}

		return sprintf(
			'<div class="jetpack-block__notice %1$s %3$s" style="border-left:5px solid %4$s;padding:1em;background-color:#f8f9f9;">%2$s</div>',
			esc_attr( $status ),
			wp_kses(
				$message,
				array(
					'br' => array(),
					'p'  => array(),
				)
			),
			esc_attr( $classes ),
			sanitize_hex_color( $color )
		);
	}

	/**
	 * Set the availability of the block as the editor
	 * is loaded.
	 *
	 * @param string $slug Slug of the block.
	 */
	public static function set_availability_for_plan( $slug ) {
		$is_available   = true;
		$plan           = '';
		$slug           = self::remove_extension_prefix( $slug );
		$features_data  = array();
		$is_simple_site = defined( 'IS_WPCOM' ) && IS_WPCOM;
		$is_atomic_site = jetpack_is_atomic_site();

		// Check feature availability for Simple and Atomic sites.
		if ( $is_simple_site || $is_atomic_site ) {

			// Simple sites.
			if ( $is_simple_site ) {
				if ( ! class_exists( 'Store_Product_List' ) ) {
					require WP_CONTENT_DIR . '/admin-plugins/wpcom-billing/store-product-list.php';
				}
				$features_data = Store_Product_List::get_site_specific_features_data();
			} else {
				// Atomic sites.
				$option = get_option( 'jetpack_active_plan' );
				if ( isset( $option['features'] ) ) {
					$features_data = $option['features'];
				}
			}

			$is_available = isset( $features_data['active'] ) && in_array( $slug, $features_data['active'], true );
			if ( ! empty( $features_data['available'][ $slug ] ) ) {
				$plan = $features_data['available'][ $slug ][0];
			}
		} else {
			// Jetpack sites.
			$is_available = Jetpack_Plan::supports( $slug );
			$plan         = Jetpack_Plan::get_minimum_plan_for_feature( $slug );
		}

		if ( $is_available ) {
			self::set_extension_available( $slug );
		} else {
			self::set_extension_unavailable(
				$slug,
				'missing_plan',
				array(
					'required_feature' => $slug,
					'required_plan'    => $plan,
				)
			);
		}
	}

	/**
	 * Wraps the suplied render_callback in a function to check
	 * the availability of the block before rendering it.
	 *
	 * @param string   $slug The block slug, used to check for availability.
	 * @param callable $render_callback The render_callback that will be called if the block is available.
	 */
	public static function get_render_callback_with_availability_check( $slug, $render_callback ) {
		return function ( $prepared_attributes, $block_content, $block ) use ( $render_callback, $slug ) {
			$availability = self::get_cached_availability();
			$bare_slug    = self::remove_extension_prefix( $slug );
			if ( isset( $availability[ $bare_slug ] ) && $availability[ $bare_slug ]['available'] ) {
				return call_user_func( $render_callback, $prepared_attributes, $block_content );
			}

			// A preview of the block is rendered for admins on the frontend with an upgrade nudge.
			if ( isset( $availability[ $bare_slug ] ) ) {
				if ( self::should_show_frontend_preview( $availability[ $bare_slug ] ) ) {
					$block_preview = call_user_func( $render_callback, $prepared_attributes, $block_content );

					// If the upgrade nudge isn't already being displayed by a parent block, display the nudge.
					if ( isset( $block->attributes['shouldDisplayFrontendBanner'] ) && $block->attributes['shouldDisplayFrontendBanner'] ) {
						$upgrade_nudge = self::upgrade_nudge( $availability[ $bare_slug ]['details']['required_plan'] );
						return $upgrade_nudge . $block_preview;
					}

					return $block_preview;
				}
			}

			return null;
		};
	}
}

/*
 * Enable upgrade nudge for Atomic sites.
 * This feature is false as default,
 * so let's enable it through this filter.
 *
 * More doc: https://github.com/Automattic/jetpack/tree/master/projects/plugins/jetpack/extensions#upgrades-for-blocks
 */
if ( jetpack_is_atomic_site() ) {
	add_filter( 'jetpack_block_editor_enable_upgrade_nudge', '__return_true' );
}
