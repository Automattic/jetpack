<?php
/**
 * SCRIPT_DEBUG fallback for wp-build generated functions.
 *
 * Production distributions exclude unminified JS files to reduce plugin size.
 * The auto-generated code in build/ uses SCRIPT_DEBUG to pick .js vs .min.js
 * without checking whether the unminified file exists, which would cause 404s
 * in production when SCRIPT_DEBUG is enabled.
 *
 * This file predefines those functions with a file_exists fallback. Because the
 * generated code wraps each function in function_exists(), our definitions take
 * precedence when this file is loaded before build.php.
 *
 * @package automattic/jetpack-forms
 */

if ( ! function_exists( 'jetpack_forms_override_script' ) ) {
	/**
	 * Registers a script according to `wp_register_script`, honoring any existing
	 * registration by reassigning its internal properties rather than deregistering.
	 *
	 * @param WP_Scripts       $scripts   WP_Scripts instance.
	 * @param string           $handle    Script handle.
	 * @param string           $src       Full URL or root-relative path.
	 * @param array            $deps      Dependencies.
	 * @param string|bool|null $ver       Version string.
	 * @param bool             $in_footer Whether to enqueue in footer.
	 */
	function jetpack_forms_override_script( $scripts, $handle, $src, $deps = array(), $ver = false, $in_footer = false ) {
		$script = $scripts->query( $handle, 'registered' );
		if ( $script ) {
			$script->src  = $src;
			$script->deps = $deps;
			$script->ver  = $ver;
			$script->args = $in_footer ? 1 : null;
		} else {
			$scripts->add( $handle, $src, $deps, $ver, ( $in_footer ? 1 : null ) );
		}

		if ( in_array( 'wp-i18n', $deps, true ) ) {
			$scripts->set_translations( $handle );
		}
	}
}

if ( ! function_exists( 'jetpack_forms_register_package_scripts' ) ) {
	/**
	 * Register all package scripts with SCRIPT_DEBUG file_exists fallback.
	 *
	 * @param WP_Scripts $scripts WP_Scripts instance.
	 */
	function jetpack_forms_register_package_scripts( $scripts ) {
		$build_dir       = dirname( __DIR__, 2 ) . '/build';
		$build_constants = require $build_dir . '/constants.php';
		$default_version = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? time() : $build_constants['version'];

		$scripts_dir  = $build_dir . '/scripts';
		$scripts_file = $scripts_dir . '/registry.php';

		if ( ! file_exists( $scripts_file ) ) {
			return;
		}

		$scripts_data = require $scripts_file;

		$extension = '.min.js';
		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			if ( ! empty( $scripts_data[0]['path'] ) ) {
				$unminified_path = $scripts_dir . '/' . $scripts_data[0]['path'] . '.js';
				if ( file_exists( $unminified_path ) ) {
					$extension = '.js';
				}
			}
		}

		foreach ( $scripts_data as $script_data ) {
			$asset_file   = $scripts_dir . '/' . $script_data['asset'];
			$asset        = file_exists( $asset_file ) ? require $asset_file : array();
			$dependencies = $asset['dependencies'] ?? array();
			$version      = $asset['version'] ?? $default_version;

			jetpack_forms_override_script(
				$scripts,
				$script_data['handle'],
				$build_constants['build_url'] . 'scripts/' . $script_data['path'] . $extension,
				$dependencies,
				$version,
				true
			);
		}
	}

	add_action( 'wp_default_scripts', 'jetpack_forms_register_package_scripts' );
}

if ( ! function_exists( 'jetpack_forms_register_script_modules' ) ) {
	/**
	 * Register all script modules with SCRIPT_DEBUG file_exists fallback.
	 */
	function jetpack_forms_register_script_modules() {
		$build_dir       = dirname( __DIR__, 2 ) . '/build';
		$build_constants = require $build_dir . '/constants.php';
		$modules_dir     = $build_dir . '/modules';
		$modules_file    = $modules_dir . '/registry.php';

		if ( ! file_exists( $modules_file ) ) {
			return;
		}

		$modules   = require $modules_file;
		$base_url  = $build_constants['build_url'] . 'modules/';
		$extension = '.min.js';
		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			if ( ! empty( $modules[0]['path'] ) ) {
				$unminified_path = $modules_dir . '/' . $modules[0]['path'] . '.js';
				if ( file_exists( $unminified_path ) ) {
					$extension = '.js';
				}
			}
		}

		foreach ( $modules as $module ) {
			$asset_path = $modules_dir . '/' . $module['asset'];
			$asset      = file_exists( $asset_path ) ? require $asset_path : array();

			wp_register_script_module(
				$module['id'],
				$base_url . $module['path'] . $extension,
				$asset['module_dependencies'] ?? array(),
				$asset['version'] ?? false,
				array(
					'fetchpriority' => 'low',
					'in_footer'     => true,
				)
			);
		}
	}

	add_action( 'wp_default_scripts', 'jetpack_forms_register_script_modules' );
}

if ( ! function_exists( 'jetpack_forms_register_page_routes' ) ) {
	/**
	 * Register routes for a page with SCRIPT_DEBUG file_exists fallback.
	 *
	 * @param array  $page_routes           Array of route data for the page.
	 * @param string $register_function_name Name of the function to call for registering each route.
	 */
	function jetpack_forms_register_page_routes( $page_routes, $register_function_name ) {
		$build_dir       = dirname( __DIR__, 2 ) . '/build';
		$build_constants = require $build_dir . '/constants.php';

		foreach ( $page_routes as $route ) {
			$content_handle = null;
			$route_handle   = null;

			// Register content module if exists.
			if ( $route['has_content'] ) {
				$content_asset_path = $build_dir . "/routes/{$route['name']}/content.min.asset.php";
				if ( file_exists( $content_asset_path ) ) {
					$content_asset  = require $content_asset_path;
					$content_handle = 'jetpack-forms/routes/' . $route['name'] . '/content';
					$extension      = '.min.js';
					if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
						$content_unminified = $build_dir . '/routes/' . $route['name'] . '/content.js';
						if ( file_exists( $content_unminified ) ) {
							$extension = '.js';
						}
					}
					wp_register_script_module(
						$content_handle,
						$build_constants['build_url'] . 'routes/' . $route['name'] . '/content' . $extension,
						$content_asset['module_dependencies'] ?? array(),
						$content_asset['version'] ?? false
					);
				}
			}

			// Register route module if exists.
			if ( $route['has_route'] ) {
				$route_asset_path = $build_dir . "/routes/{$route['name']}/route.min.asset.php";
				if ( file_exists( $route_asset_path ) ) {
					$route_asset  = require $route_asset_path;
					$route_handle = 'jetpack-forms/routes/' . $route['name'] . '/route';
					$extension    = '.min.js';
					if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
						$route_unminified = $build_dir . '/routes/' . $route['name'] . '/route.js';
						if ( file_exists( $route_unminified ) ) {
							$extension = '.js';
						}
					}
					wp_register_script_module(
						$route_handle,
						$build_constants['build_url'] . 'routes/' . $route['name'] . '/route' . $extension,
						$route_asset['module_dependencies'] ?? array(),
						$route_asset['version'] ?? false
					);
				}
			}

			// Register route with page.
			if ( function_exists( $register_function_name ) ) {
				call_user_func( $register_function_name, $route['path'], $content_handle, $route_handle );
			}
		}
	}
}

if ( ! function_exists( 'jetpack_forms_override_style' ) ) {
	/**
	 * Registers a style, deregistering any existing style by the same handle first.
	 *
	 * @param WP_Styles        $styles WP_Styles instance.
	 * @param string           $handle Stylesheet handle.
	 * @param string           $src    Full URL or root-relative path.
	 * @param array            $deps   Dependencies.
	 * @param string|bool|null $ver    Version string.
	 * @param string           $media  Media type.
	 */
	function jetpack_forms_override_style( $styles, $handle, $src, $deps = array(), $ver = false, $media = 'all' ) {
		$style = $styles->query( $handle, 'registered' );
		if ( $style ) {
			$styles->remove( $handle );
		}
		$styles->add( $handle, $src, $deps, $ver, $media );
	}
}

if ( ! function_exists( 'jetpack_forms_register_package_styles' ) ) {
	/**
	 * Register all package styles with SCRIPT_DEBUG file_exists fallback.
	 *
	 * @param WP_Styles $styles WP_Styles instance.
	 */
	function jetpack_forms_register_package_styles( $styles ) {
		$build_dir       = dirname( __DIR__, 2 ) . '/build';
		$build_constants = require $build_dir . '/constants.php';
		$default_version = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? time() : $build_constants['version'];

		$styles_dir  = $build_dir . '/styles';
		$styles_file = $styles_dir . '/registry.php';

		if ( ! file_exists( $styles_file ) ) {
			return;
		}

		$styles_data = require $styles_file;

		$suffix = '.min';
		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			if ( ! empty( $styles_data[0]['path'] ) ) {
				$unminified_path = $styles_dir . '/' . $styles_data[0]['path'] . '.css';
				if ( file_exists( $unminified_path ) ) {
					$suffix = '';
				}
			}
		}

		foreach ( $styles_data as $style_data ) {
			jetpack_forms_override_style(
				$styles,
				$style_data['handle'],
				$build_constants['build_url'] . 'styles/' . $style_data['path'] . $suffix . '.css',
				$style_data['dependencies'],
				$default_version
			);

			// Enable RTL support.
			$styles->add_data( $style_data['handle'], 'rtl', 'replace' );
			$styles->add_data( $style_data['handle'], 'suffix', $suffix );
		}
	}

	add_action( 'wp_default_styles', 'jetpack_forms_register_package_styles' );
}
