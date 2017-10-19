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
	private $defer_scripts = false;

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
		$this->async_scripts = false;
		$this->defer_scripts = false;
	}

	/**
	 * TODO: detect if this is worth doing for wp-admin?
	 */

	/**
	 * Registers actions
	 */
	private function __construct() {
		$this->is_first_load             = ! isset( $_COOKIE['jetpack_perf_loaded'] );
		$this->remove_remote_fonts       = get_option( 'perf_remove_remote_fonts' );
		$this->inline_always             = get_option( 'perf_inline_on_every_request' );
		$this->inline_scripts_and_styles = get_option( 'perf_inline_scripts_and_styles' ) && ( $this->is_first_load || $this->inline_always );
		$this->async_scripts             = get_option( 'perf_async_scripts' );
		$this->defer_scripts             = get_option( 'perf_defer_scripts' );

		if ( $this->remove_remote_fonts ) {
			add_filter( 'jetpack_perf_remove_script', array( $this, 'remove_external_font_scripts' ), 10, 3 );
			add_filter( 'jetpack_perf_remove_style', array( $this, 'remove_external_font_styles' ), 10, 3 );
		}

		add_filter( 'script_loader_src', array( $this, 'filter_inline_scripts' ), 10, 2 );
		add_filter( 'script_loader_tag', array( $this, 'print_inline_scripts' ), 10, 3 );
		add_filter( 'style_loader_src', array( $this, 'filter_inline_styles' ), 10, 2 );
		add_filter( 'style_loader_tag', array( $this, 'print_inline_styles' ), 10, 4 );

		add_action( 'init', array( $this, 'set_first_load_cookie' ) );

		// remove emoji detection - TODO a setting for this
		add_action( 'init', array( $this, 'disable_emojis' ) );

	}

	/** Disabling Emojis **/
	// improves page load performance

	function disable_emojis() {
		remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
		remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
		remove_action( 'embed_head', 'print_emoji_detection_script', 7 );

		remove_action( 'wp_print_styles', 'print_emoji_styles' );
		remove_action( 'admin_print_styles', 'print_emoji_styles' );

		remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
		remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
		remove_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );

		add_filter( 'tiny_mce_plugins', array( $this, 'disable_emojis_tinymce' ) );
		add_filter( 'wp_resource_hints', array( $this, 'disable_emojis_remove_dns_prefetch' ), 10, 2 );
	}

	/**
	 * Filter function used to remove the tinymce emoji plugin.
	 *
	 * @param array $plugins
	 * @return array Difference betwen the two arrays
	 */
	function disable_emojis_tinymce( $plugins ) {
		if ( is_array( $plugins ) ) {
			return array_diff( $plugins, array( 'wpemoji' ) );
		} else {
			return array();
		}
	}

	/**
	 * Remove emoji CDN hostname from DNS prefetching hints.
	 *
	 * @param array $urls URLs to print for resource hints.
	 * @param string $relation_type The relation type the URLs are printed for.
	 * @return array Difference betwen the two arrays.
	 */
	function disable_emojis_remove_dns_prefetch( $urls, $relation_type ) {
		if ( 'dns-prefetch' == $relation_type ) {
			/** This filter is documented in wp-includes/formatting.php */
			$emoji_svg_url = apply_filters( 'emoji_svg_url', 'https://s.w.org/images/core/emoji/2/svg/' );

			$urls = array_diff( $urls, array( $emoji_svg_url ) );
		}

		return $urls;
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
		global $wp_scripts;

		if ( is_admin() || ! isset( $wp_scripts->registered[$handle] ) ) {
			return $src;
		}

		$script = $wp_scripts->registered[$handle];

		// reset src to empty - can't return empty string though because then it skips rendering the tag
		if ( $this->should_inline_script( $script ) ) {
			return '#';
		}

		return $src;
	}

	public function print_inline_scripts( $tag, $handle, $src ) {
		global $wp_scripts;

		if ( is_admin() || ! isset( $wp_scripts->registered[$handle] ) ) {
			return $tag;
		}

		$script = $wp_scripts->registered[$handle];

		if ( $this->should_remove_script( $script ) ) {
			return '';
		}

		if ( $this->should_inline_script( $script ) ) {
			$tag = '<script type="text/javascript">' . file_get_contents( $script->extra['jetpack-inline-file'] ) . '</script>';
		}

		if ( $this->should_async_script( $script ) ) {
			$tag = preg_replace( '/<script /', '<script async ', $tag );
		} elseif ( $this->should_defer_script( $script ) ) {
			$tag = preg_replace( '/<script /', '<script defer ', $tag );
		}

		return $tag;
	}

	private function should_async_script( $script ) {
		$should_async_script = isset( $script->extra['jetpack-async'] ) && $script->extra['jetpack-async'];
		return $this->async_scripts && apply_filters( 'jetpack_perf_async_script', $should_async_script, $script->handle, $script->src );
	}

	private function should_defer_script( $script ) {
		$should_defer_script = isset( $script->extra['jetpack-defer'] ) && $script->extra['jetpack-defer'];
		return $this->defer_scripts && apply_filters( 'jetpack_perf_defer_script', $should_defer_script, $script->handle, $script->src );
	}

	private function should_remove_script( $script ) {
		return $this->should_remove_asset( 'jetpack_perf_remove_script', $script );
	}

	private function should_inline_script( $script ) {
		return $this->inline_scripts_and_styles && $this->should_inline_asset( 'jetpack_perf_inline_script', $script );
	}

	/** STYLES **/
	public function filter_inline_styles( $src, $handle ) {
		global $wp_styles;

		if ( is_admin() || ! isset( $wp_scripts->registered[$handle] ) ) {
			return $src;
		}

		$style = $wp_scripts->registered[$handle];

		if ( $this->should_inline_style( $style ) ) {
			return '#';
		}

		return $src;
	}

	public function print_inline_styles( $tag, $handle, $href, $media ) {
		global $wp_styles;

		if ( is_admin() || ! isset( $wp_styles->registered[$handle] ) ) {
			return $tag;
		}

		$style = $wp_styles->registered[$handle];

		if ( $this->should_inline_style( $style ) ) {
			return "<style type='text/css' media='$media'>" . file_get_contents( $style->extra['jetpack-inline-file'] ) . '</style>';
		}

		if ( $this->should_remove_style( $style ) ) {
			return '';
		}

		return $tag;
	}

	private function should_inline_style( $style ) {
		return $this->inline_scripts_and_styles && $this->should_inline_asset( 'jetpack_perf_inline_style', $style );
	}

	private function should_remove_style( $style ) {
		return $this->should_remove_asset( 'jetpack_perf_remove_style', $style );
	}

	/** shared code **/

	private function should_inline_asset( $filter, $dependency ) {
		// inline anything local, with a src starting with /, or starting with site_url
		$site_url = site_url();

		$is_local_url = ( strncmp( $dependency->src, '/', 1 ) === 0 && strncmp( $dependency->src, '//', 2 ) !== 0 )
			|| strpos( $dependency->src, $site_url ) === 0;

		if ( $is_local_url && ! isset( $dependency->extra['jetpack-inline'] ) ) {
			$dependency->extra['jetpack-inline'] = true;
			$dependency->extra['jetpack-inline-file'] = untrailingslashit( ABSPATH ) . str_replace( $site_url, '', $dependency->src );
		}

		$should_inline = isset( $dependency->extra['jetpack-inline'] ) && $dependency->extra['jetpack-inline'];

		return apply_filters( $filter, $should_inline, $dependency->handle, $dependency->src ) && file_exists( $dependency->extra['jetpack-inline-file'] );
	}

	private function should_remove_asset( $filter, $dependency ) {
		return apply_filters( $filter, true, $dependency->handle, $dependency->src );
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