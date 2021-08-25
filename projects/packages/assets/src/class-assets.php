<?php
/**
 * Jetpack Assets package.
 *
 * @package  automattic/jetpack-assets
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Constants as Jetpack_Constants;

/**
 * Class Assets
 */
class Assets {
	/**
	 * Holds all the scripts handles that should be loaded in a deferred fashion.
	 *
	 * @var array
	 */
	private $defer_script_handles = array();
	/**
	 * The singleton instance of this class.
	 *
	 * @var Assets
	 */
	protected static $instance;

	/**
	 * Constructor.
	 *
	 * Static-only class, so nothing here.
	 */
	private function __construct() {}

	/**
	 * Get the singleton instance of the class.
	 *
	 * @return Assets
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new Assets();
			self::$instance->init_hooks();
		}

		return self::$instance;
	}

	/**
	 * Initalize the hooks as needed.
	 */
	private function init_hooks() {
		/*
		 * Load some scripts asynchronously.
		 */
		add_filter( 'script_loader_tag', array( $this, 'script_add_async' ), 10, 2 );
	}

	/**
	 * A public method for adding the async script.
	 *
	 * @param string $script_handle Script handle.
	 */
	public function add_async_script( $script_handle ) {
		$this->defer_script_handles[] = $script_handle;
	}

	/**
	 * Add an async attribute to scripts that can be loaded deferred.
	 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
	 *
	 * @param string $tag    The <script> tag for the enqueued script.
	 * @param string $handle The script's registered handle.
	 */
	public function script_add_async( $tag, $handle ) {
		if ( empty( $this->defer_script_handles ) ) {
			return $tag;
		}

		if ( in_array( $handle, $this->defer_script_handles, true ) ) {
			return preg_replace( '/^<script /i', '<script defer ', $tag );
		}

		return $tag;
	}

	/**
	 * Given a minified path, and a non-minified path, will return
	 * a minified or non-minified file URL based on whether SCRIPT_DEBUG is set and truthy.
	 *
	 * If $package_path is provided, then the minified or non-minified file URL will be generated
	 * relative to the root package directory.
	 *
	 * Both `$min_base` and `$non_min_base` can be either full URLs, or are expected to be relative to the
	 * root Jetpack directory.
	 *
	 * @param string $min_path     minified path.
	 * @param string $non_min_path non-minified path.
	 * @param string $package_path Optional. A full path to a file inside a package directory
	 *                             The URL will be relative to its directory. Default empty.
	 *                             Typically this is done by passing __FILE__ as the argument.
	 *
	 * @return string The URL to the file
	 * @since 1.0.3
	 * @since-jetpack 5.6.0
	 */
	public static function get_file_url_for_environment( $min_path, $non_min_path, $package_path = '' ) {
		$path = ( Jetpack_Constants::is_defined( 'SCRIPT_DEBUG' ) && Jetpack_Constants::get_constant( 'SCRIPT_DEBUG' ) )
			? $non_min_path
			: $min_path;

		/*
		 * If the path is actually a full URL, keep that.
		 * We look for a host value, since enqueues are sometimes without a scheme.
		 */
		$file_parts = wp_parse_url( $path );
		if ( ! empty( $file_parts['host'] ) ) {
			$url = $path;
		} else {
			$plugin_path = empty( $package_path ) ? Jetpack_Constants::get_constant( 'JETPACK__PLUGIN_FILE' ) : $package_path;

			$url = plugins_url( $path, $plugin_path );
		}

		/**
		 * Filters the URL for a file passed through the get_file_url_for_environment function.
		 *
		 * @since 1.0.3
		 *
		 * @package assets
		 *
		 * @param string $url The URL to the file.
		 * @param string $min_path The minified path.
		 * @param string $non_min_path The non-minified path.
		 */
		return apply_filters( 'jetpack_get_file_for_environment', $url, $min_path, $non_min_path );
	}

	/**
	 * A helper function that lets you enqueue scripts in an async fashion.
	 *
	 * @param string $handle        Name of the script. Should be unique.
	 * @param string $min_path      Minimized script path.
	 * @param string $non_min_path  Full Script path.
	 * @param array  $deps           Array of script dependencies.
	 * @param bool   $ver             The script version.
	 * @param bool   $in_footer       Should the script be included in the footer.
	 */
	public static function enqueue_async_script( $handle, $min_path, $non_min_path, $deps = array(), $ver = false, $in_footer = true ) {
		$assets_instance = self::instance();
		$assets_instance->add_async_script( $handle );
		wp_enqueue_script( $handle, self::get_file_url_for_environment( $min_path, $non_min_path ), $deps, $ver, $in_footer );
	}

	/**
	 * Passes an array of URLs to wp_resource_hints.
	 *
	 * @since 1.5.0
	 *
	 * @param string|array $urls URLs to hint.
	 * @param string       $type One of the supported resource types: dns-prefetch (default), preconnect, prefetch, or prerender.
	 */
	public static function add_resource_hint( $urls, $type = 'dns-prefetch' ) {
		add_filter(
			'wp_resource_hints',
			function ( $hints, $resource_type ) use ( $urls, $type ) {
				if ( $resource_type === $type ) {
					// Type casting to array required since the function accepts a single string.
					foreach ( (array) $urls as $url ) {
						$hints[] = $url;
					}
				}
				return $hints;
			},
			10,
			2
		);
	}

	/**
	 * Serve a WordPress.com static resource via a randomized wp.com subdomain.
	 *
	 * @since 1.9.0
	 *
	 * @param string $url WordPress.com static resource URL.
	 *
	 * @return string $url
	 */
	public static function staticize_subdomain( $url ) {
		// Extract hostname from URL.
		$host = wp_parse_url( $url, PHP_URL_HOST );

		// Explode hostname on '.'.
		$exploded_host = explode( '.', $host );

		// Retrieve the name and TLD.
		if ( count( $exploded_host ) > 1 ) {
			$name = $exploded_host[ count( $exploded_host ) - 2 ];
			$tld  = $exploded_host[ count( $exploded_host ) - 1 ];
			// Rebuild domain excluding subdomains.
			$domain = $name . '.' . $tld;
		} else {
			$domain = $host;
		}
		// Array of Automattic domains.
		$domains_allowed = array( 'wordpress.com', 'wp.com' );

		// Return $url if not an Automattic domain.
		if ( ! in_array( $domain, $domains_allowed, true ) ) {
			return $url;
		}

		if ( \is_ssl() ) {
			return preg_replace( '|https?://[^/]++/|', 'https://s-ssl.wordpress.com/', $url );
		}

		/*
		 * Generate a random subdomain id by taking the modulus of the crc32 value of the URL.
		 * Valid values are 0, 1, and 2.
		 */
		$static_counter = abs( crc32( basename( $url ) ) % 3 );

		return preg_replace( '|://[^/]+?/|', "://s$static_counter.wp.com/", $url );
	}
}
