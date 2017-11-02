<?php

/**
 * Optimizes page assets for unreliable networks and fast rendering, particularly with empty caches
 * - inline scripts and styles
 * - async external JS
 * - remove references to external fonts
 * - move CSS links below scripts in head (scripts after CSS blocks render until script finishes downloading)
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
		$this->remove_remote_fonts       = get_option( 'perf_remove_remote_fonts', true );
		$this->inline_always             = get_option( 'perf_inline_on_every_request', false );
		$this->inline_scripts_and_styles = get_option( 'perf_inline_scripts_and_styles', true ) && ( $this->is_first_load || $this->inline_always );
		$this->async_scripts             = get_option( 'perf_async_scripts', true );
		$this->defer_scripts             = get_option( 'perf_defer_scripts', true );
		$this->move_scripts_to_footer    = true;
		$this->move_scripts_above_css_in_header = true;
		$this->remove_core_emojis        = true;
		$this->prevent_jetpack_implode_css = true;

		if ( $this->remove_remote_fonts ) {
			add_filter( 'jetpack_perf_remove_script', array( $this, 'remove_external_font_scripts' ), 10, 3 );
			add_filter( 'jetpack_perf_remove_style', array( $this, 'remove_external_font_styles' ), 10, 3 );
		}

		if ( $this->move_scripts_to_footer ) {
			add_filter( 'jetpack_perf_asset_group', array( $this, 'set_asset_groups' ), 10, 2 );
		}

		if ( $this->move_scripts_above_css_in_header ) {
			add_action( 'init', array( $this, 'move_styles_to_bottom_of_header' ), PHP_INT_MAX );
		}

		if ( $this->prevent_jetpack_implode_css ) {
			add_filter( 'jetpack_implode_frontend_css', '__return_false' );
		}

		add_action( 'wp_enqueue_scripts', array( $this, 'send_scripts_to_footer' ), PHP_INT_MAX );
		add_filter( 'script_loader_src', array( $this, 'filter_inline_scripts' ), -100, 2 );
		add_filter( 'script_loader_tag', array( $this, 'print_inline_scripts' ), -100, 3 );
		add_filter( 'style_loader_src', array( $this, 'filter_inline_styles' ), -100, 2 );
		add_filter( 'style_loader_tag', array( $this, 'print_inline_styles' ), -100, 4 );

		add_action( 'init', array( $this, 'set_first_load_cookie' ) );

		/**
		 * Feature, theme and plugin-specific hacks
		 */

		// remove emoji detection - TODO a setting for this
		if ( $this->remove_core_emojis ) {
			add_action( 'init', array( $this, 'disable_emojis' ) );
		}

		// inline/defer/async stuff for Jetpack
		add_action( 'init', array( $this, 'optimize_jetpack' ) );
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

	function optimize_jetpack() {

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

	// this code essentially sets the default asset location to the footer rather than the head
	function send_scripts_to_footer() {
		global $wp_scripts;

		// fetch all deps for head
		$wp_scripts->all_deps( $wp_scripts->queue, true, 1 );
		foreach( $wp_scripts->to_do as $handle ) {
			$registration = $wp_scripts->registered[$handle];
			if ( $registration->args !== NULL ) {
				// skip, this asset has an explicit location
				continue;
			}

			$asset_group = apply_filters( 'jetpack_perf_asset_group', 1, $handle );
			$registration->args = $asset_group;
			$wp_scripts->groups[$handle] = $asset_group;
		}
	}

	// scripts that run after CSS <link>s in the header block waiting for the CSS to load
	// so we move styles as late as possible in the wp_head action to maximise the chance
	// of non-blocking rendering
	function move_styles_to_bottom_of_header() {
		remove_action( 'wp_head', 'wp_print_styles', 8 );
		add_action( 'wp_head', 'wp_print_styles', 999 );
	}

	function set_asset_groups( $group, $handle ) {
		// force jquery into header, everything else can go in footer unless filtered elsewhere
		if ( in_array( $handle, array( 'jquery-core', 'jquery-migrate', 'jquery' ) ) ) {
			return 0;
		}

		return $group;
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
			$label = '<!-- ' . $script->src . '-->';
			// base64-encoding a script into the src URL only makes sense if we intend to async or defer it
			if ( $this->should_defer_script( $script ) ) {
				$tag = $label . '<script defer type="text/javascript" src="data:text/javascript;base64,' . base64_encode( file_get_contents( $script->extra['jetpack-inline-file'] ) ) . '"></script>';
			} elseif ( $this->should_async_script( $script ) ) {
				$tag = $label . '<script async type="text/javascript" src="data:text/javascript;base64,' . base64_encode( file_get_contents( $script->extra['jetpack-inline-file'] ) ) . '"></script>';
			} else {
				$tag = $label . '<script type="text/javascript">' . file_get_contents( $script->extra['jetpack-inline-file'] ) . '</script>';
			}
		} else {
			if ( $this->should_defer_script( $script ) ) {
				$tag = preg_replace( '/<script /', '<script defer ', $tag );
			} elseif ( $this->should_async_script( $script ) ) {
				$tag = preg_replace( '/<script /', '<script async ', $tag );
			}
		}

		return $tag;
	}

	private function should_async_script( $script ) {
		global $wp_scripts;

		// explicitly in the header (scripts aren't affected much by async)
		$should_async_script = $script->args === 0;

		// only make scripts async if nothing depends on them
		foreach ( $wp_scripts->to_do as $other_script_handle ) {
			$other_script = $wp_scripts->registered[ $other_script_handle ];
			if ( in_array( $script->handle, $other_script->deps ) ) {
				$should_async_script = false;
				break;
			}
		}

		// you can override this logic by setting jetpack-async
		$should_async_script = $should_async_script || ( isset( $script->extra['jetpack-async'] ) && $script->extra['jetpack-async'] );
		return $this->async_scripts && apply_filters( 'jetpack_perf_async_script', $should_async_script, $script->handle, $script->src );
	}

	private function should_defer_script( $script ) {
		global $wp_scripts;

		// if it's explicitly not in the footer, or we have Jetpack Defer set, and has no dependencies
		$should_defer_script = $script->args === 0;

		// only make scripts deferred if nothing depends on them
		foreach ( $wp_scripts->to_do as $other_script_handle ) {
			$other_script = $wp_scripts->registered[ $other_script_handle ];
			if ( in_array( $script->handle, $other_script->deps ) ) {
				$should_defer_script = false;
				break;
			}
		}

		$should_defer_script = $should_defer_script || ( isset( $script->extra['jetpack-defer'] ) && $script->extra['jetpack-defer'] );
		return $this->defer_scripts && apply_filters( 'jetpack_perf_defer_script', $should_defer_script, $script->handle, $script->src );
	}

	private function should_remove_script( $script ) {
		return $this->should_remove_asset( 'jetpack_perf_remove_script', $script );
	}

	private function should_inline_script( $script ) {
		return ( $this->inline_scripts_and_styles || $this->inline_always ) && $this->should_inline_asset( 'jetpack_perf_inline_script', $script );
	}

	/** STYLES **/
	public function filter_inline_styles( $src, $handle ) {
		global $wp_scripts;

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
			$label = '<!-- ' . $style->src . '-->';
			$css = $this->fix_css_urls( file_get_contents( $style->extra['jetpack-inline-file'] ), $style->src ); 
			return "$label<style type='text/css' media='$media'>$css</style>";
		}

		if ( $this->should_remove_style( $style ) ) {
			return '';
		}

		return $tag;
	}

	public function fix_css_urls( $css, $css_url ) {
		$base = trailingslashit( dirname( $css_url ) );
		$base = str_replace( site_url(), '', $base );
		
		// reject absolute site_url 
		if ( 'http' === substr( $base, 0, 4 ) ) {
			return $css;
		}
		return preg_replace_callback( '/url[\s]*\([\s]*["\']?[\s]*(?!https?:\/\/)(?!data:)(?!#)([^\)"\']*)["\']?\)/i', function( $matches ) use ( $base ) {
			// TODO: embed data-encoded file, for files smaller than certain size?
			return 'url('.$this->rel2abspath( $matches[1], $base ).')';
		}, $css );
	}

	// see: http://stackoverflow.com/questions/4444475/transfrom-relative-path-into-absolute-url-using-php
	private function rel2abspath( $rel, $path) {
		/* remove non-directory element from path */
		$path = preg_replace( '#/[^/]*$#', '', $path );

		/* destroy path if relative url points to root */
		if( $rel[0] == '/' )
			$path = '';

		/* dirty absolute URL */
		$abs = '';

		$abs .= $path . '/' . $rel;

		/* replace '//' or '/./' or '/foo/../' with '/' */
		$re = array('#(/\.?/)#', '#/(?!\.\.)[^/]+/\.\./#');
		for( $n=1; $n>0; $abs = preg_replace( $re, '/', $abs, -1, $n ) ) {}

		/* absolute path is ready! */
		return $abs;
	}

	private function should_inline_style( $style ) {
		return ( $this->inline_scripts_and_styles || $this->inline_always ) && $this->should_inline_asset( 'jetpack_perf_inline_style', $style );
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

			$path = untrailingslashit( ABSPATH ) . str_replace( $site_url, '', $dependency->src );

			if ( ! file_exists( $path ) ) {
				$path = str_replace('/', DIRECTORY_SEPARATOR, str_replace( $site_url, '', $dependency->src ));

				$prefix = explode( DIRECTORY_SEPARATOR, untrailingslashit( WP_CONTENT_DIR ) );
				$prefix = array_slice( $prefix, 0, array_search( $path[1], $prefix ) - 1 );

				$path = implode( DIRECTORY_SEPARATOR, $prefix ) . $path;
			}

			$dependency->extra['jetpack-inline-file'] = $path;
		}

		// only inline if we don't have a conditional
		$should_inline = ! isset( $dependency->extra['conditional'] ) && isset( $dependency->extra['jetpack-inline'] ) && $dependency->extra['jetpack-inline'];

		return apply_filters( $filter, $should_inline, $dependency->handle, $dependency->src ) && file_exists( $dependency->extra['jetpack-inline-file'] );
	}

	private function should_remove_asset( $filter, $dependency ) {
		return apply_filters( $filter, false, $dependency->handle, $dependency->src );
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
