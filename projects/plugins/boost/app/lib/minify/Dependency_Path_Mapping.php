<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

/**
 * This is a class to map script and style URLs to local filesystem paths.
 * This is necessary when we are deciding what we can concatenate and when
 * actually building the concatenation.
 */
class Dependency_Path_Mapping {
	/**
	 * Save entire site URL so we can check whether other URLs are based on it (internal URLs)
	 *
	 * @var string
	 */
	public $site_url;

	/**
	 * Save URI path and dir for mapping URIs to filesystem paths
	 *
	 * @var string
	 */
	public $site_uri_path    = null;
	public $site_dir         = null;
	public $content_uri_path = null;
	public $content_dir      = null;
	public $plugin_uri_path  = null;
	public $plugin_dir       = null;

	public function __construct(
		// Expose URLs and DIRs for unit test
		$site_url = null, // default site URL is determined dynamically
		$site_dir = null,
		$content_url = WP_CONTENT_URL,
		$content_dir = WP_CONTENT_DIR,
		$plugin_url = WP_PLUGIN_URL,
		$plugin_dir = WP_PLUGIN_DIR
	) {
		if ( null === $site_dir ) {
			$site_dir = Config::get_abspath();
		}

		if ( null === $site_url ) {
			$site_url = is_multisite() ? get_site_url( get_current_blog_id() ) : get_site_url();
		}
		$site_url            = trailingslashit( $site_url );
		$this->site_url      = $site_url;
		$this->site_uri_path = wp_parse_url( $site_url, PHP_URL_PATH );
		$this->site_dir      = trailingslashit( $site_dir );

		// Only resolve content URLs if they are under the site URL
		if ( $this->is_internal_uri( $content_url ) ) {
			$this->content_uri_path = wp_parse_url( trailingslashit( $content_url ), PHP_URL_PATH );
			$this->content_dir      = trailingslashit( $content_dir );
		}

		// Only resolve plugin URLs if they are under the site URL
		if ( $this->is_internal_uri( $plugin_url ) ) {
			$this->plugin_uri_path = wp_parse_url( trailingslashit( $plugin_url ), PHP_URL_PATH );
			$this->plugin_dir      = trailingslashit( $plugin_dir );
		}
	}

	/**
	 * Given the full URL of a script/style dependency, return its local filesystem path.
	 */
	public function dependency_src_to_fs_path( $src ) {
		if ( ! $this->is_internal_uri( $src ) ) {
			// If a URI is not internal, we can have no confidence
			// we are resolving to the correct file.
			return false;
		}

		$src_parts = wp_parse_url( $src );
		if ( false === $src_parts ) {
			return false;
		}

		if ( empty( $src_parts['path'] ) ) {
			// We can't find anything to resolve
			return false;
		}
		$path = $src_parts['path'];

		if ( empty( $src_parts['host'] ) ) {
			// With no host, this is a path relative to the WordPress root
			$fs_path = "{$this->site_dir}{$path}";

			return file_exists( $fs_path ) ? $fs_path : false;
		}

		return $this->uri_path_to_fs_path( $path );
	}

	/**
	 * Given a URI path of a script/style resource, return its local filesystem path.
	 */
	public function uri_path_to_fs_path( $uri_path ) {
		if ( 1 === preg_match( '#(?:^|/)\.\.?(?:/|$)#', $uri_path ) ) {
			// Reject relative paths
			return false;
		}

		// The plugin URI path may be contained within the content URI path, so we check it before the content URI.
		// And both the plugin and content URI paths must be contained within the site URI path,
		// so we check them before checking the site URI.
		if ( isset( $this->plugin_uri_path ) && static::is_descendant_uri( $this->plugin_uri_path, $uri_path ) ) {
			$file_path = $this->plugin_dir . substr( $uri_path, strlen( $this->plugin_uri_path ) );
		} elseif ( isset( $this->content_uri_path ) && static::is_descendant_uri( $this->content_uri_path, $uri_path ) ) {
			$file_path = $this->content_dir . substr( $uri_path, strlen( $this->content_uri_path ) );
		} elseif ( static::is_descendant_uri( $this->site_uri_path, $uri_path ) ) {
			$file_path = $this->site_dir . substr( $uri_path, strlen( $this->site_uri_path ) );
		}

		if ( isset( $file_path ) && file_exists( $file_path ) ) {
			return $file_path;
		} else {
			return false;
		}
	}

	/**
	 * Determine whether a URI is internal, contained by this site.
	 *
	 * This method helps ensure we only resolve to local FS paths.
	 */
	public function is_internal_uri( $uri ) {
		if ( jetpack_boost_page_optimize_starts_with( '/', $uri ) && ! jetpack_boost_page_optimize_starts_with( '//', $uri ) ) {
			// Absolute paths are internal because they are based on the site dir (typically ABSPATH),
			// and this looks like an absolute path.
			return true;
		}

		// To be internal, a URL must have the same scheme, host, and port as the site URL
		// and start with the same path as the site URL.
		return static::is_descendant_uri( $this->site_url, $uri );
	}

	/**
	 * Check whether a path is descended from the given directory path.
	 *
	 * Does not handle relative paths.
	 */
	public static function is_descendant_uri( $dir_path, $candidate ) {
		// Ensure a trailing slash to avoid false matches like
		// "/wp-content/resource" being judged a descendant of "/wp".
		$dir_path = trailingslashit( $dir_path );

		return jetpack_boost_page_optimize_starts_with( $dir_path, $candidate );
	}
}
