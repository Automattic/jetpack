<?php
/** Blocks package.
 *
 * @since 9.0.0
 *
 * This package lifts elements from Jetpack's Jetpack_Gutenberg class.
 * It is now an standalone package reusable outside Jetpack.
 *
 * @package automattic/jetpack-blocks
 */

namespace Automattic\Jetpack;

use Jetpack_Gutenberg;

/**
 * Register and manage blocks within a plugin. Used to manage block registration, enqueues, and more.
 *
 * @since 9.0.0
 */
class Blocks {
	/**
	 * Wrapper function to safely register a Gutenberg block type
	 * Default asset version used when no other constant is defined.
	 */
	const DEFAULT_BLOCK_ASSET_VERSION = '1.0.0';

	/**
	 * Wrapper function to safely register a gutenberg block type
	 *
	 * @see register_block_type
	 * @see Automattic\Jetpack\Blocks::is_gutenberg_version_available
	 *
	 * @since 9.0.0
	 *
	 * @param string $slug Slug of the block.
	 * @param array  $args {
	 *     Arguments that are passed into register_block_type.
	 *     See register_block_type for full list of arguments.
	 *     Can also include 2 extra arguments not currently supported by register_block_type.
	 *
	 *     @type array $version_requirements Array containing required Gutenberg version and, if known, the WordPress version that was released with this minimum version.
	 *     @type bool  $plan_check           Should we check for a specific plan before registering the block.
	 * }
	 *
	 * @return WP_Block_Type|false The registered block type on success, or false on failure.
	 */
	public static function jetpack_register_block( $slug, $args = array() ) {
		if ( 0 !== strpos( $slug, 'jetpack/' ) && ! strpos( $slug, '/' ) ) {
			_doing_it_wrong( 'jetpack_register_block', 'Prefix the block with jetpack/ ', 'Jetpack 9.0.0' );
			$slug = 'jetpack/' . $slug;
		}

		if (
			isset( $args['version_requirements'] )
			&& ! self::is_gutenberg_version_available( $args['version_requirements'], $slug )
		) {
			return false;
		}

		// Checking whether block is registered to ensure it isn't registered twice.
		if ( self::is_registered( $slug ) ) {
			return false;
		}

		$feature_name = self::remove_extension_prefix( $slug );

		// This is only useful in Jetpack.
		if ( class_exists( Jetpack_Gutenberg::class ) ) {
			// If the block is dynamic, and a Jetpack block, wrap the render_callback to check availability.
			if ( ! empty( $args['plan_check'] ) ) {
				if ( isset( $args['render_callback'] ) ) {
					$args['render_callback'] = Jetpack_Gutenberg::get_render_callback_with_availability_check( $feature_name, $args['render_callback'] );
				}
				$method_name = 'set_availability_for_plan';
			} else {
				$method_name = 'set_extension_available';
			}

			add_action(
				'jetpack_register_gutenberg_extensions',
				function() use ( $feature_name, $method_name ) {
					call_user_func( array( 'Jetpack_Gutenberg', $method_name ), $feature_name );
				}
			);
		}
		return register_block_type( $slug, $args );
	}

	/**
	 * Check if an extension/block is already registered
	 *
	 * @since 9.0.0
	 *
	 * @param string $slug Name of extension/block to check.
	 *
	 * @return bool
	 */
	public static function is_registered( $slug ) {
		return \WP_Block_Type_Registry::get_instance()->is_registered( $slug );
	}

	/**
	 * Remove the 'jetpack/' or jetpack-' prefix from an extension name
	 *
	 * @since 9.0.0
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
	 * Check to see if a minimum version of Gutenberg is available. Because a Gutenberg version is not available in
	 * php if the Gutenberg plugin is not installed, if we know which minimum WP release has the required version we can
	 * optionally fall back to that.
	 *
	 * @since 9.0.0
	 *
	 * @param array  $version_requirements {
	 *     An array containing the required Gutenberg version and, if known, the WordPress version that was released with this minimum version.
	 *
	 *     @type string $gutenberg Gutenberg version.
	 *     @type string $wp        Optional. WordPress version.
	 * }
	 * @param string $slug The slug of the block or plugin that has the Gutenberg version requirement.
	 *
	 * @return boolean True if the version of Gutenberg required by the block or plugin is available.
	 */
	public static function is_gutenberg_version_available( $version_requirements, $slug ) {
		global $wp_version;

		// Bail if we don't at least have the Gutenberg version requirement, the WP version is optional.
		if ( empty( $version_requirements['gutenberg'] ) ) {
			return false;
		}

		// If running a local dev build of Gutenberg plugin GUTENBERG_DEVELOPMENT_MODE is set so assume correct version.
		if ( defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE ) {
			return true;
		}

		$version_available = false;

		// If running a production build of the Gutenberg plugin then GUTENBERG_VERSION is set, otherwise if WP version
		// with required version of Gutenberg is known check that.
		if ( defined( 'GUTENBERG_VERSION' ) ) {
			$version_available = version_compare( GUTENBERG_VERSION, $version_requirements['gutenberg'], '>=' );
		} elseif ( ! empty( $version_requirements['wp'] ) ) {
			$version_available = version_compare( $wp_version, $version_requirements['wp'], '>=' );
		}

		if (
			! $version_available
			&& class_exists( Jetpack_Gutenberg::class ) // This is only useful in Jetpack.
		) {
			Jetpack_Gutenberg::set_extension_unavailable(
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
	 * Return the Gutenberg extensions (blocks and plugins) directory
	 *
	 * @return string The Gutenberg extensions directory
	 */
	public static function get_blocks_directory() {
		if ( defined( '\\JETPACK__VERSION' ) ) {
			/**
			 * Filter to select Gutenberg blocks directory
			 *
			 * @since 6.9.0
			 *
			 * @param string default: '_inc/blocks/'
			 */
			return apply_filters( 'jetpack_blocks_directory', '_inc/blocks/' );
		}

		// For standalone blocks, we build in the build directory.
		return 'build/';
	}

	/**
	 * Return the filesystem directory path (with trailing slash) for the current plugin.
	 *
	 * @return string filesystem directory path
	 */
	public static function get_plugin_dir_path() {
		if ( defined( '\\JETPACK__PLUGIN_DIR' ) ) {
			return JETPACK__PLUGIN_DIR;
		}
		return plugin_dir_path( __FILE__ );
	}

	/**
	 * Check if an asset exists for a block.
	 *
	 * @param string $file Path of the file we are looking for.
	 *
	 * @return bool $block_has_asset Does the file exist.
	 */
	public static function block_has_asset( $file ) {
		return file_exists( self::get_plugin_dir_path() . $file );
	}

	/**
	 * Get the version number to use when loading the file. Allows us to bypass cache when developing.
	 *
	 * @param string $file Path of the file we are looking for.
	 * @param string $name Slug of the block.
	 *
	 * @return string $script_version Version number.
	 */
	public static function get_asset_version( $file, $name = '' ) {
		$block_version_constant = '\\JETPACK_' . strtoupper( $name ) . '_BLOCK__VERSION';

		if ( defined( '\\JETPACK__VERSION' ) ) {
			$plugin_version = constant( '\\JETPACK__VERSION' );
		} elseif ( defined( $block_version_constant ) ) {
			$plugin_version = constant( $block_version_constant );
		} else {
			$plugin_version = self::DEFAULT_BLOCK_ASSET_VERSION;
		}

		return ! preg_match( '/^\d+(\.\d+)+$/', $plugin_version ) && self::block_has_asset( $file )
			? filemtime( self::get_plugin_dir_path() . $file )
			: $plugin_version;
	}

	/**
	 * Only enqueue block assets when needed.
	 *
	 * @since 9.0.0
	 *
	 * @param string $type                Slug of the block.
	 * @param array  $script_dependencies Script dependencies. Will be merged with automatically
	 *                                         detected script dependencies from the webpack build.
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
	 * Only enqueue block styles when needed.
	 *
	 * @since 9.0.0
	 *
	 * @param string $type Slug of the block.
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
			$style_version = self::get_asset_version( $style_relative_path, $type );
			$view_style    = plugins_url( $style_relative_path, JETPACK__PLUGIN_FILE );
			wp_enqueue_style( 'jetpack-block-' . $type, $view_style, array(), $style_version );
		}

	}

	/**
	 * Only enqueue block scripts when needed.
	 *
	 * @param string $type                Slug of the block.
	 * @param array  $script_dependencies Script dependencies. Will be merged with automatically
	 *                                         detected script dependencies from the webpack build.
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
		$script_deps_path      = self::get_plugin_dir_path() . self::get_blocks_directory() . $type . '/view.asset.php';
		$script_dependencies[] = 'wp-polyfill';
		if ( file_exists( $script_deps_path ) ) {
			$asset_manifest      = include $script_deps_path;
			$script_dependencies = array_unique( array_merge( $script_dependencies, $asset_manifest['dependencies'] ) );
		}

		if ( ! self::is_amp_request() && self::block_has_asset( $script_relative_path ) ) {
			$script_version = self::get_asset_version( $script_relative_path, $type );
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
	 * Get CSS classes for a block.
	 *
	 * @since 9.0.0
	 *
	 * @param string $slug  Block slug.
	 * @param array  $attr  Block attributes.
	 * @param array  $extra Potential extra classes you may want to provide.
	 *
	 * @return string $classes List of CSS classes for a block.
	 */
	public static function classes( $slug, $attr, $extra = array() ) {
		if ( empty( $slug ) ) {
			return '';
		}

		// Basic block name class.
		$classes = array(
			'wp-block-jetpack-' . $slug,
		);

		// Add alignment if provided.
		if (
			! empty( $attr['align'] )
			&& in_array( $attr['align'], array( 'left', 'center', 'right', 'wide', 'full' ), true )
		) {
			$classes[] = 'align' . $attr['align'];
		}

		// Add custom classes if provided in the block editor.
		if ( ! empty( $attr['className'] ) ) {
			$classes[] = $attr['className'];
		}

		// Add any extra classes.
		if ( is_array( $extra ) && ! empty( $extra ) ) {
			$classes = array_merge( $classes, array_filter( $extra ) );
		}

		return implode( ' ', $classes );
	}

	/**
	 * Does the page return AMP content.
	 *
	 * @since 9.0.0
	 *
	 * @return bool $is_amp_request Are we on an AMP view.
	 */
	public static function is_amp_request() {
		$is_amp_request = ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() );

		/** This filter is documented in 3rd-party/class.jetpack-amp-support.php */
		return apply_filters( 'jetpack_is_amp_request', $is_amp_request );
	}
}
