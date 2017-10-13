<?php

class Jetpack_PWA_Inline_Assets {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA_Inline_Assets' ) ) {
			self::$__instance = new Jetpack_PWA_Inline_Assets();
		}

		return self::$__instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		add_filter( 'script_loader_src', array( $this, 'filter_inline_scripts' ), 10, 2 );
		add_filter( 'script_loader_tag', array( $this, 'print_inline_scripts' ), 10, 3 );

		add_filter( 'style_loader_src', array( $this, 'filter_inline_styles' ), 10, 2 );
		add_filter( 'style_loader_tag', array( $this, 'print_inline_styles' ), 10, 4 );
	}

	/** SCRIPTS **/

	public function filter_inline_scripts( $src, $handle ) {
		// reset src to empty - can't return empty string though because then it skips rendering the tag
		if ( $this->should_inline_script( $handle ) ) {
			return '#';
		}

		return $src;
	}

	public function print_inline_scripts( $tag, $handle, $src ) {
		if ( $this->should_inline_script( $handle ) ) {
			return '<script type="text/javascript">' . $this->get_inline_script_content( $handle ) . '</script>';
		}

		if ( $this->should_async_script( $handle ) ) {
			$tag = preg_replace( '/<script /', '<script async ', $tag );
		}

		return $tag;
	}

	private function should_async_script( $handle ) {
		global $wp_scripts;

		if ( ! isset( $wp_scripts->registered[$handle] ) ) {
			return false;
		}

		$registration = $wp_scripts->registered[$handle];

		return isset( $registration->extra['jetpack-async'] ) && $registration->extra['jetpack-async'];
	}

	private function should_inline_script( $handle ) {
		global $wp_scripts;

		if ( ! isset( $wp_scripts->registered[$handle] ) ) {
			return false;
		}

		// // automatically inline a script loaded on every page...
		// if ( 'jquery' === $handle || 'jquery-migrate' === $handle || 'jquery-core' === $handle ) {
		// 	return true;
		// }

		$registration = $wp_scripts->registered[$handle];

		// inline anything local, with a src starting with /, or starting with site_url
		$site_url = site_url();
		// TODO: handle //, like //stats.wp.com/w.js - whoops!
		if ( strncmp( $registration->src, '/', 1 ) === 0 ) {
			$registration->extra['jetpack-inline'] = true;
			$registration->extra['jetpack-inline-file'] = untrailingslashit( ABSPATH ) . $registration->src;
		} elseif ( strpos( $registration->src, $site_url ) === 0 ) {
			$registration->extra['jetpack-inline'] = true;
			$raw_path = substr( $registration->src, strlen( $site_url ) );
			$registration->extra['jetpack-inline-file'] = untrailingslashit( ABSPATH ) . $raw_path;
		}

		return isset( $registration->extra['jetpack-inline'] ) && $registration->extra['jetpack-inline'];
	}

	private function get_inline_script_content( $handle ) {
		global $wp_scripts;
		$registration = $wp_scripts->registered[$handle];

		if ( isset( $registration->extra['jetpack-inline-file'] ) && file_exists( $registration->extra['jetpack-inline-file'] ) ) {
			$file_path = $registration->extra['jetpack-inline-file'];
		} else {
			return "console.warn('failed to get script contents for " . $handle . "');";
		}

		// TODO: file_exists
		return file_get_contents( $file_path );
	}

	/** STYLES **/

	public function filter_inline_styles( $src, $handle ) {
		// reset src to empty - can't return empty string though because then it skips rendering the tag
		if ( $this->should_inline_style( $handle ) ) {
			return '#';
		}

		return $src;
	}

	public function print_inline_styles( $tag, $handle, $href, $media ) {
		if ( $this->should_inline_style( $handle ) ) {
			return "<style type='text/css' media='$media'>" . $this->get_inline_style_content( $handle ) . '</style>';
		}

		if ( $this->should_remove_style( $handle ) ) {
			return '';
		}

		return $tag;
	}

	private function should_inline_style( $handle ) {
		global $wp_styles;

		if ( ! isset( $wp_styles->registered[$handle] ) ) {
			return false;
		}

		$registration = $wp_styles->registered[$handle];

		// inline anything local, with a src starting with /, or starting with site_url
		$site_url = site_url();
		if ( strncmp( $registration->src, '/', 1 ) === 0 ) {
			$registration->extra['jetpack-inline'] = true;
			$registration->extra['jetpack-inline-file'] = untrailingslashit( ABSPATH ) . $registration->src;
		} elseif ( strpos( $registration->src, $site_url ) === 0 ) {
			$registration->extra['jetpack-inline'] = true;
			$raw_path = substr( $registration->src, strlen( $site_url ) );
			$registration->extra['jetpack-inline-file'] = untrailingslashit( ABSPATH ) . $raw_path;
		}

		return isset( $registration->extra['jetpack-inline'] ) && $registration->extra['jetpack-inline'];
	}

	private function should_remove_style( $handle ) {
		global $wp_styles;

		// remove all google fonts
		if ( $registration = $wp_styles->registered[$handle] ) {
			if ( strncmp( $registration->src, 'https://fonts.googleapis.com', 28 ) === 0 ) {
				return true;
			}
		}

		// by default, remove external Google fonts from default themes
		$font_handles = array( 'twentyseventeen-fonts', 'twentysixteen-fonts', 'twentyfifteen-fonts', 'twentyfourteen-fonts' );
		return in_array( $handle, $font_handles );
	}

	private function get_inline_style_content( $handle ) {
		global $wp_styles;
		$registration = $wp_styles->registered[$handle];

		if ( isset( $registration->extra['jetpack-inline-file'] ) && file_exists( $registration->extra['jetpack-inline-file'] ) ) {
			$file_path = $registration->extra['jetpack-inline-file'];
		} else {
			return "/* failed to fetch CSS for " . $handle . " */";
		}

		// TODO: file_exists
		return file_get_contents( $file_path );
	}

	/**
	 * if inline assets are enabled, renders inline
	 * TODO: enable this just for certain paths/patterns/filetypes
	 */
	 public function register_inline_script( $handle, $file, $plugin_file, $deps = false, $ver = false, $in_footer = false ) {
		$registered = wp_register_script( $handle, plugins_url( $file, $plugin_file ), $deps, $ver, $in_footer );

		if ( $registered ) {
			$file_full_path = dirname( $plugin_file ) . '/' . $file;
			wp_script_add_data( $handle, 'jetpack-inline', true );
			wp_script_add_data( $handle, 'jetpack-inline-file', $file_full_path );
		}

		return $registered;
	}

	public function register_inline_style( $handle, $file, $plugin_file, $deps = array(), $ver = false, $media = 'all' ) {
		$registered = wp_register_style( $handle, plugins_url( $file, $plugin_file ), $deps, $ver, $media );

		if ( $registered ) {
			$file_full_path = dirname( $plugin_file ) . '/' . $file;
			wp_style_add_data( $handle, 'jetpack-inline', true );
			wp_style_add_data( $handle, 'jetpack-inline-file', $file_full_path );
		}
	}
}