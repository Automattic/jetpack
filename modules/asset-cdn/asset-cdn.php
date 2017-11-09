<?php
/**
 * Plugin Name: Asset CDN
 * Description: Speed up Javascript and CSS
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Automattic
 * Author URI: https://automattic.com
 * Version: 0.1.0
 * Text Domain: asset-cdn
 * Domain Path: /languages/
 * License: GPLv2 or later
 */

/**
 * TODO
 * - versioning (combine ver hashes) and cachebusting
 * - concat/minify/serve JS too
 * - asset inlining for smaller styles?
 * - critical CSS support?
 * - non-enqueued assets?
 */

class Asset_CDN {
	private static $__instance = null;

	private $cdn_server;
	private $concat_style_groups = array();

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Asset_CDN' ) ) {
			self::$__instance = new Asset_CDN();
		}

		return self::$__instance;
	}

	private function __construct() {
		$this->cdn_server = 'https://cdn.wpvm.io';

		// allow smaller CSS by only minifying assets on the page
		add_filter( 'jetpack_implode_frontend_css', '__return_false' );

		// rewrite CSS tags
		add_filter( 'style_loader_tag', array( $this, 'print_inline_styles' ), -100, 4 );

		add_action( 'wp_head', array( $this, 'render_concatenated_styles_head' ), PHP_INT_MAX );
		add_action( 'wp_footer', array( $this, 'render_concatenated_styles_footer' ), PHP_INT_MAX );
	}

	/**
	 * Render functions
	 */

	function render_concatenated_styles_head() {
		if ( isset( $this->concat_style_groups[0] ) ) {
			$this->render_concatenated_styles( $this->concat_style_groups[0] );
		}
	}
	function render_concatenated_styles_footer() {
		if ( isset( $this->concat_style_groups[1] ) ) {
			$this->render_concatenated_styles( $this->concat_style_groups[1] );
		}
	}
	private function render_concatenated_styles( $styles ) {
		// special URL to concatenation service
		foreach( $styles as $media => $urls ) {
			$cdn_url = $this->cdn_server . '/css?b=' . urlencode( site_url() ) . '&' . http_build_query( array( 'f' => $urls ) );
			// if we are injecting critical CSS, load the full CSS async
			if ( $this->inject_critical_css ) {
				echo '<!-- jetpack concat --><link rel="preload" onload="this.rel=\'stylesheet\'" as="style" type="text/css" media="' . $media . '" href="' . esc_attr( $cdn_url ) . '"/>';
			} else {
				echo '<!-- jetpack concat --><link rel="stylesheet" type="text/css" media="' . $media . '" href="' . esc_attr( $cdn_url ) . '"/>';
			}
		}
	}

	/**
	 * Asset modification functions
	 */

	public function print_inline_styles( $tag, $handle, $href, $media ) {
		global $wp_styles;

		// don't do admin for now
		if ( is_admin() || ! isset( $wp_styles->registered[$handle] ) ) {
			return $tag;
		}

		$style = $wp_styles->registered[$handle];

		if ( $this->should_concat_style( $style ) ) {
			$this->buffer_style( $style );
			return '';
		}

		return $tag;
	}

	private function buffer_style( $style ) {
		$group = isset( $style->extra['group'] ) ? $style->extra['group'] : 0;
		$media = $style->args;
		if ( ! $media ) {
			$media = 'all';
		}
		if ( ! isset( $this->concat_style_groups[$group] ) ) {
			$this->concat_style_groups[$group] = array();
		}
		if ( ! isset( $this->concat_style_groups[$group][$media] ) ) {
			$this->concat_style_groups[$group][$media] = array();
		}
		$local_url = str_replace( untrailingslashit( site_url() ), '', $style->src );
		$this->concat_style_groups[$group][$media][] = $local_url;
	}

	private function should_concat_style( $style ) {
		// only concat local styles
		$is_local       = $this->is_local_url( $style->src );
		// don't concat conditional styles
		$is_conditional = isset( $style->extra['conditional'] );
		return apply_filters( 'jetpack_perf_concat_style', $is_local && ! $is_conditional, $style->handle, $style->src );
	}

	private function is_local_url( $url ) {
		$site_url = site_url();
		return ( strncmp( $url, '/', 1 ) === 0 && strncmp( $url, '//', 2 ) !== 0 )
			|| strpos( $url, $site_url ) === 0;
	}
}