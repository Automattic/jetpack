<?php

/**
 * Optimizes page assets for unreliable networks and fast rendering, particularly with empty caches
 * - inline scripts and styles
 * - async external JS
 * - remove references to external fonts
 */

class Jetpack_Perf_Optimize_Assets {
	private static $__instance = null;
	private $remove_remote_fonts = false;
	private $inline_scripts_and_styles = false;
	private $async_scripts = false;

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_Perf_Optimize_Assets' ) ) {
			self::$__instance = new Jetpack_Perf_Optimize_Assets();
		}

		return self::$__instance;
	}

	public function disable_for_request() {
		$this->remove_remote_fonts = false;
		$this->inline_scripts_and_styles = false;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		$this->is_first_load             = ! isset( $_COOKIE['jetpack_perf_loaded'] );
		$this->scripts_to_remove         = array();
		$this->styles_to_remove          = array();
		$this->remove_remote_fonts       = get_option( 'perf_remove_remote_fonts' );
		$this->inline_always             = get_option( 'perf_inline_on_every_request' );
		$this->inline_scripts_and_styles = get_option( 'perf_inline_scripts_and_styles' ) && ( $this->is_first_load || $this->inline_always );
		$this->async_scripts             = get_option( 'perf_async_scripts' );

		if ( $this->remove_remote_fonts ) {
			add_filter( 'jetpack_perf_remove_script', array( $this, 'remove_external_font_scripts' ) );
			add_filter( 'jetpack_perf_remove_style', array( $this, 'remove_external_font_styles' ) );
		}

		add_filter( 'script_loader_src', array( $this, 'filter_inline_scripts' ), 10, 2 );
		add_filter( 'script_loader_tag', array( $this, 'print_inline_scripts' ), 10, 3 );
		add_filter( 'style_loader_src', array( $this, 'filter_inline_styles' ), 10, 2 );
		add_filter( 'style_loader_tag', array( $this, 'print_inline_styles' ), 10, 4 );

		add_action( 'init', array( $this, 'set_first_load_cookie' ) );
	}

	// by default we only inline scripts+styles on first page load for a given user
	function set_first_load_cookie() {
		if ( ! isset( $_COOKIE['jetpack_perf_loaded'] ) ) {
			setcookie( 'jetpack_perf_loaded', '1', time() + YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
		}
	}

	/** FILTERS **/
	public function remove_external_font_scripts( $should_remove, $handle, $asset_url ) {
		$font_script_url = 'http://use.typekit.com/';
		return strncmp( $asset_url, $font_script_url, strlen( $font_script_url ) ) === 0;
	}

	public function remove_external_font_styles( $should_remove, $handle, $asset_url ) {
		$font_url = 'https://fonts.googleapis.com';
		return strncmp( $asset_url, $font_url, strlen( $font_url ) ) === 0;
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
		if ( $this->should_remove_script( $handle ) ) {
			return '';
		}

		if ( $this->should_inline_script( $handle ) ) {
			$tag = '<script type="text/javascript">' . $this->get_inline_script_content( $handle ) . '</script>';
		}

		if ( $this->should_async_script( $handle ) ) {
			$tag = preg_replace( '/<script /', '<script async ', $tag );
		} elseif ( $this->should_defer_script( $handle ) ) {
			$tag = preg_replace( '/<script /', '<script defer ', $tag );
		}

		return $tag;
	}

	private function should_async_script( $handle ) {
		global $wp_scripts;

		if ( ! isset( $wp_scripts->registered[$handle] ) ) {
			return false;
		}

		$registration = $wp_scripts->registered[$handle];

		$should_async_script = $this->async_scripts && isset( $registration->extra['jetpack-async'] ) && $registration->extra['jetpack-async'];

		return apply_filters( 'jetpack_perf_async_script', $should_async_script, $handle );
	}

	private function should_defer_script( $handle ) {
		global $wp_scripts;

		if ( ! isset( $wp_scripts->registered[$handle] ) ) {
			return false;
		}

		$registration = $wp_scripts->registered[$handle];

		$should_async_script = $this->async_scripts && isset( $registration->extra['jetpack-defer'] ) && $registration->extra['jetpack-defer'];

		return apply_filters( 'jetpack_perf_defer_script', $should_async_script, $handle );
	}

	private function should_remove_script( $handle ) {
		global $wp_scripts;
		return $this->should_remove_asset( 'jetpack_perf_remove_script', $wp_scripts, $handle );
	}

	private function should_inline_script( $handle ) {
		if ( ! $this->inline_scripts_and_styles ) {
			return false;
		}

		global $wp_scripts;
		return apply_filters( 'jetpack_perf_inline_script', $this->should_inline_asset( $wp_scripts, $handle ), $handle );
	}

	private function get_inline_script_content( $handle ) {
		global $wp_scripts;
		$registration = $wp_scripts->registered[$handle];

		if ( isset( $registration->extra['jetpack-inline-file'] ) && file_exists( $registration->extra['jetpack-inline-file'] ) ) {
			$file_path = $registration->extra['jetpack-inline-file'];
		} else {
			return "console.warn('failed to get script contents for " . $handle . "');";
		}

		return file_get_contents( $file_path );
	}

	/** STYLES **/
	public function filter_inline_styles( $src, $handle ) {
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
		if ( ! $this->inline_scripts_and_styles ) {
			return false;
		}

		global $wp_styles;
		return apply_filters( 'jetpack_perf_inline_style', $this->should_inline_asset( $wp_styles, $handle ) );
	}

	private function should_remove_style( $handle ) {
		global $wp_styles;
		return $this->should_remove_asset( 'jetpack_perf_remove_style', $wp_styles, $handle );
	}

	private function get_inline_style_content( $handle ) {
		global $wp_styles;
		$registration = $wp_styles->registered[$handle];

		if ( isset( $registration->extra['jetpack-inline-file'] ) && file_exists( $registration->extra['jetpack-inline-file'] ) ) {
			$file_path = $registration->extra['jetpack-inline-file'];
		} else {
			return "/* failed to fetch CSS for " . $handle . " */";
		}

		return file_get_contents( $file_path );
	}

	/** shared code **/
	private function should_inline_asset( $wp_dependencies, $handle ) {
		if ( ! isset( $wp_dependencies->registered[$handle] ) ) {
			return false;
		}

		$registration = $wp_dependencies->registered[$handle];

		// inline anything local, with a src starting with /, or starting with site_url
		$site_url = site_url();

		$is_local_url = ( strncmp( $registration->src, '/', 1 ) === 0 && strncmp( $registration->src, '//', 2 ) !== 0 )
			|| strpos( $registration->src, $site_url ) === 0;

		if ( $is_local_url && ! isset( $registration->extra['jetpack-inline'] ) ) {
			$registration->extra['jetpack-inline'] = true;
			$registration->extra['jetpack-inline-file'] = untrailingslashit( ABSPATH ) . str_replace( $site_url, '', $registration->src );
		}

		return isset( $registration->extra['jetpack-inline'] ) && $registration->extra['jetpack-inline'];
	}

	private function should_remove_asset( $filter, $wp_dependencies, $handle ) {
		if ( ! isset( $wp_styles->registered[$handle] ) ) {
			return false;
		}

		$registration = $wp_styles->registered[$handle];

		return apply_filters( $filter, true, $handle, $registration->src );
	}

	/**
	 * if inline assets are enabled, renders inline
	 * TODO: enable this just for certain paths/patterns/filetypes
	 * This is actually currently unused
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

	/**
	 * if inline assets are enabled, renders inline
	 * TODO: enable this just for certain paths/patterns/filetypes
	 * This is actually currently unused
	 */
	public function register_inline_style( $handle, $file, $plugin_file, $deps = array(), $ver = false, $media = 'all' ) {
		$registered = wp_register_style( $handle, plugins_url( $file, $plugin_file ), $deps, $ver, $media );

		if ( $registered ) {
			$file_full_path = dirname( $plugin_file ) . '/' . $file;
			wp_style_add_data( $handle, 'jetpack-inline', true );
			wp_style_add_data( $handle, 'jetpack-inline-file', $file_full_path );
		}
	}
}