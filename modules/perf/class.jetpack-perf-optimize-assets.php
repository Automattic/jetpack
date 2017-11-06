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
	private $inject_critical_css = false;
	private $minify_html = false;
	const INLINE_ASSET_MAX_SIZE_BYTES = 50 * 1024; // 10kb
	const INLINE_CSS_URL_MAX_SIZE_BYTES = 5 * 1024; // 5kb

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
//		global $concatenate_scripts;
//		$concatenate_scripts = true;
		$this->is_first_load             = ! isset( $_COOKIE['jetpack_perf_loaded'] );
		$this->remove_remote_fonts       = get_option( 'perf_remove_remote_fonts', true );
		$this->inline_always             = get_option( 'perf_inline_on_every_request', false );
		$this->inline_scripts_and_styles = get_option( 'perf_inline_scripts_and_styles', true ) && ( $this->is_first_load || $this->inline_always );
		$this->async_scripts             = get_option( 'perf_async_scripts', true );
		$this->defer_scripts             = get_option( 'perf_defer_scripts', true );
		$this->move_scripts_above_css_in_header = true;
		$this->remove_core_emojis        = true;
		$this->prevent_jetpack_implode_css = true;
		$this->inject_critical_css       = true;
		$this->preload_scripts           = true;
		$this->minify_html               = false;

		if ( $this->minify_html ) {
			require_once dirname( __FILE__ ) . '/class.jetpack-perf-optimize-html.php';
			Jetpack_Perf_Optimize_HTML::instance();
		}

		if ( $this->remove_remote_fonts ) {
			add_filter( 'jetpack_perf_remove_script', array( $this, 'remove_external_font_scripts' ), 10, 3 );
			add_filter( 'jetpack_perf_remove_style', array( $this, 'remove_external_font_styles' ), 10, 3 );
		}

		add_action( 'wp_enqueue_scripts', array( $this, 'relocate_assets' ), PHP_INT_MAX );

		// relocate assets
//		add_filter( 'jetpack_perf_style_group', array( $this, 'set_style_groups' ), 10, 2 );
		add_filter( 'jetpack_perf_script_group', array( $this, 'set_script_groups' ), 10, 2 );

		if ( $this->inject_critical_css ) {
			add_action( 'wp_head', array( $this, 'render_critical_css' ), 0 );
		}

		if ( $this->preload_scripts ) {
			add_action( 'wp_print_scripts', array( $this, 'preload_scripts' ) );
		}


		// munge footer scripts
		//add_filter( 'wp_footer', array( $this, 'encode_footer_scripts' ), -PHP_INT_MAX );

		// necessary to catch some woocommerce scripts that get localized inside wp_print_scripts at pri 5
		//add_filter( 'wp_print_footer_scripts', array( $this, 'encode_footer_scripts' ), 9 );

		// in modern browsers (post-2008) there is a small performance win from
		// loading CSS after external scripts in the header, rather than before
		if ( $this->move_scripts_above_css_in_header ) {
			add_action( 'init', array( $this, 'move_styles_to_bottom_of_header' ), PHP_INT_MAX );
		}

		if ( $this->prevent_jetpack_implode_css ) {
			add_filter( 'jetpack_implode_frontend_css', '__return_false' );
		}

		// ensure dashicons is loading inline
		add_filter( 'jetpack_perf_async_style', function( $should_async, $handle, $src ) {
			if ( 'dashicons' === $handle ) {
				return false;
			}
			return $should_async;
		}, 10, 3 );

		add_filter( 'jetpack_perf_inline_style', function( $should_inline, $handle, $src ) {
			if ( 'dashicons' === $handle ) {
					return true;
			}
			return $should_inline;
		}, 10, 3 );

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

	// preload scripts we expect to find in the footer
	function preload_scripts() {
		global $wp_scripts;
		$wp_scripts->all_deps( $wp_scripts->queue, false );
				foreach( $wp_scripts->to_do as $handle ) {
						$registration = $wp_scripts->registered[$handle];
			// preload anything not async'd, since these scripts are likely to be a higher priority
			$is_footer_script = isset( $registration->extra['group'] ) && 1 == $registration->extra['group'];
			// TODO: this doesn't currently affect any scripts - will it ever?
			if ( ! $this->should_async_script( $registration ) && $is_footer_script ) {
				echo '<link rel="preload" as="script" href="'. esc_attr( $registration->src )  .'" />';
			}
		}
	}

	function render_critical_css() {
		echo '<!-- critical.css --><style type="text/css">' . file_get_contents( plugin_dir_path( __FILE__ ) . 'critical.css' ) . '</style>';
	}

	// by default we only inline scripts+styles on first page load for a given user
	function set_first_load_cookie() {
		if ( ! isset( $_COOKIE['jetpack_perf_loaded'] ) ) {
			setcookie( 'jetpack_perf_loaded', '1', time() + YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
		}
	}

	// this code essentially sets the default asset location to the footer rather than the head
	function relocate_assets() {
		global $wp_scripts;

		//error_log(print_r($wp_scripts,1));

		// fetch all deps for head
		$wp_scripts->all_deps( $wp_scripts->queue, false );
		foreach( $wp_scripts->to_do as $handle ) {
			$registration = $wp_scripts->registered[$handle];
			$asset_group = apply_filters( 'jetpack_perf_script_group', $registration->args, $handle );

			if ( $asset_group !== $registration->args ) {
				$registration->args = $asset_group;
				$wp_scripts->groups[$handle] = $asset_group;
			}
		}

		//$wp_scripts->done = array();

		global $wp_styles;

				// fetch all deps for head
				$wp_styles->all_deps( $wp_styles->queue, false,1 );
				foreach( $wp_styles->to_do as $handle ) {
						$registration = $wp_styles->registered[$handle];
						$asset_group = apply_filters( 'jetpack_perf_style_group', $wp_styles->groups[$handle], $handle );

						if ( $asset_group !== $wp_styles->groups[$handle] ) {
								$registration->args = $asset_group;
								$wp_styles->groups[$handle] = $asset_group;
						}
				}

	}

	// scripts that run after CSS <link>s in the header block waiting for the CSS to load
	// so we move styles as late as possible in the wp_head action to maximise the chance
	// of non-blocking rendering
	function move_styles_to_bottom_of_header() {
		remove_action( 'wp_head', 'wp_print_styles', 8 );
		add_action( 'wp_head', 'wp_print_styles', 999 );
	}

	function set_script_groups( $group, $handle ) {
		// move everything to the footer
		return 1;
		//error_log("set script for $handle in group $group");
		// force jquery into header, everything else can go in footer unless filtered elsewhere
		if ( in_array( $handle, array( 'jquery-core', 'jquery-migrate', 'jquery' ) ) ) {
			return 0;
		}

		// force scripts with deps into header
		if ( $this->script_has_deps( $handle ) ) {
			return 0;
		}

		if ( $group === NULL ) {
		//	error_log("force set $handle to 0");
			// set default location to header
			return 1;
		}

		//error_log("set $handle to $group");

		return $group;
	}

	function set_style_groups( $group, $handle ) {
		if ( in_array( $handle, array( 'genericons' ) ) ) {
			return 0;
		}

		if ( $group === NULL ) {
			return 1;
		}

		return $group;
	}

	// this is wild: inline scripts in the footer can block rendering, but we don't have a chance to intercept them in the header
	// so let's mark them as defer (which guarantees order) - which also requires adding deps with the localize script base64-encoded

	// so, I don't think this is a performance win - stuff in the footer is already "deferred" and forcing the defer attribute
	// only makes them load one after the other, rather than allowing the browser to do paralellisation

	// we're better off concatenating
	function encode_footer_scripts() {
		global $wp_scripts;
		$queued = $wp_scripts->all_deps( $wp_scripts->queue, false );

				foreach( $wp_scripts->to_do as $handle ) {
						$registration = $wp_scripts->registered[$handle];
			//error_log(print_r($registration,1));
			if ( isset( $registration->extra['data'] ) && $registration->extra['data'] ) {
				//register artificial dependency with param of defer
				$encoded_src = 'data:text/javascript;base64,' . base64_encode( $registration->extra['data'] );
				$data_handle = $handle . '_jp_data';
				$wp_scripts->add( $data_handle, $encoded_src, array(), false );
				$wp_scripts->add_data( $data_handle, 'jetpack-defer', true );
				$registration->deps[] = $data_handle;
				unset( $registration->extra['data'] );
			}

			$registration->extra['jetpack-defer'] = true;
			$registration->extra['jetpack-async'] = false;
				}
		$wp_scripts->to_do = array();
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
			$label = '<!-- ' . $script->src . ' -->';
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
		// this could be dangerous if scripts have undeclared dependencies
		// only make scripts async if nothing depends on them
		// turns out this is a problem - lots of plugins import (say) jquery extensions and then use them in the page from inline scripts. Bah.
		// but if a script has been declared in the footer? hm maybe that's ok........
		$should_async_script = ! $this->script_has_deps( $script->handle ); //isset( $script->extra['group'] ) && $script->extra['group'] === 1;

		// you can override this logic by setting jetpack-async
		$should_async_script = $should_async_script || ( isset( $script->extra['jetpack-async'] ) && $script->extra['jetpack-async'] );
		return $this->async_scripts && apply_filters( 'jetpack_perf_async_script', $should_async_script, $script->handle, $script->src );
	}

	private function script_has_deps( $handle ) {
		global $wp_scripts;
				foreach ( $wp_scripts->to_do as $other_script_handle ) {
						$other_script = $wp_scripts->registered[ $other_script_handle ];
						if ( in_array( $handle, $other_script->deps ) ) {
				return true;
						}
				}

		return false;
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
		return $this->inline_scripts_and_styles && $this->should_inline_asset( 'jetpack_perf_inline_script', $script );
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

		// async styles use the new(-ish) preload syntax - should only be done if
		// critical CSS is enabled, since otherwise we'll end up with flash of unstyled content (FOUC)
		if ( $this->should_async_style( $style ) ) {
			// we async all styles if inline-critical-css is enabled
			$existing_tag = $tag;
			$tag = preg_replace( '/rel=[\'"]stylesheet[\'"]/', 'rel="preload"', $tag );
			$tag = preg_replace( '/<link /', '<link onload="this.rel=\'stylesheet\'" as="style" ', $tag );
			$tag .= '<noscript>' . $existing_tag . '</noscript>';
			return $tag;
		}

		if ( $this->should_inline_style( $style ) ) {
			$label = '<!-- ' . $style->src . ' -->';
			$css = $this->fix_css_urls( file_get_contents( $style->extra['jetpack-inline-file'] ), $style->src );
			return "$label<style type='text/css' media='$media'>$css</style>";
		}

		if ( $this->should_remove_style( $style ) ) {
			return '';
		}

		return $tag;
	}

	// we can async styles if we load critical CSS in the header
	private function should_async_style( $style ) {
		return apply_filters( 'jetpack_perf_async_style', $this->inject_critical_css, $style->handle, $style->src );
	}

	// for CSS urls()s, replace with base64-encoded content if smaller than a certain size
	public function fix_css_urls( $css, $css_url ) {
		$base = trailingslashit( dirname( $css_url ) );
		$base = str_replace( site_url(), '', $base );

		// reject absolute site_url
		if ( 'http' === substr( $base, 0, 4 ) ) {
			return $css;
		}

		return preg_replace_callback( '/url[\s]*\([\s]*["\']?[\s]*(?!https?:\/\/)(?!data:)(?!#)([^\)"\']*)["\']?\)/i', function( $matches ) use ( $base ) {
			// TODO: embed data-encoded file, for files smaller than certain size?
			$url = $this->rel2abspath( $matches[1], $base );

			// sneaky - see if it's small enough that it should be encoded and placed inline
			$local_path = $this->local_url_to_file_path( $url );
			if ( file_exists( $local_path ) && filesize( $local_path ) < self::INLINE_CSS_URL_MAX_SIZE_BYTES && ( $mime_type = wp_check_filetype( $url )['type'] ) ) {
				$url = 'data:' . $mime_type . ';base64,' . base64_encode( file_get_contents( $local_path ) );
			}

			return 'url('.$url.')';
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
			$dependency->extra['jetpack-inline-file'] = $this->local_url_to_file_path( $dependency->src );
		}

		// early exit if the file doesn't exist or is too large
		if ( ! isset( $dependency->extra['jetpack-inline-file'] ) || ! file_exists( $dependency->extra['jetpack-inline-file'] ) ) {
			return false;
		}

		// only inline if we don't have a conditional
		$should_inline = ! isset( $dependency->extra['conditional'] )
			&& isset( $dependency->extra['jetpack-inline'] )
			&& $dependency->extra['jetpack-inline']
			&& filesize( $dependency->extra['jetpack-inline-file'] ) < self::INLINE_ASSET_MAX_SIZE_BYTES;

		return apply_filters( $filter, $should_inline, $dependency->handle, $dependency->src );
	}

	private function local_url_to_file_path( $url ) {
		$path = untrailingslashit( ABSPATH ) . parse_url( $url )['path'];
		if ( '/' !== DIRECTORY_SEPARATOR )
				 	$path = str_replace( '/', DIRECTORY_SEPARATOR, $path );
		return $path;
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
