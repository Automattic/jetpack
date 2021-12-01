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

	/**
	 * Resolve '.' and '..' components in a path or URL.
	 *
	 * @since 1.12.0
	 * @param string $path Path or URL.
	 * @return string Normalized path or URL.
	 */
	public static function normalize_path( $path ) {
		$parts = wp_parse_url( $path );
		if ( ! isset( $parts['path'] ) ) {
			return $path;
		}

		$ret  = '';
		$ret .= isset( $parts['scheme'] ) ? $parts['scheme'] . '://' : '';
		if ( isset( $parts['user'] ) || isset( $parts['pass'] ) ) {
			$ret .= isset( $parts['user'] ) ? $parts['user'] : '';
			$ret .= isset( $parts['pass'] ) ? ':' . $parts['pass'] : '';
			$ret .= '@';
		}
		$ret .= isset( $parts['host'] ) ? $parts['host'] : '';
		$ret .= isset( $parts['port'] ) ? ':' . $parts['port'] : '';

		$pp = explode( '/', $parts['path'] );
		if ( '' === $pp[0] ) {
			$ret .= '/';
			array_shift( $pp );
		}
		$i = 0;
		while ( $i < count( $pp ) ) { // phpcs:ignore Squiz.PHP.DisallowSizeFunctionsInLoops.Found
			if ( '' === $pp[ $i ] || '.' === $pp[ $i ] || 0 === $i && '..' === $pp[ $i ] ) {
				array_splice( $pp, $i, 1 );
			} elseif ( '..' === $pp[ $i ] ) {
				array_splice( $pp, --$i, 2 );
			} else {
				$i++;
			}
		}
		$ret .= join( '/', $pp );

		$ret .= isset( $parts['query'] ) ? '?' . $parts['query'] : '';
		$ret .= isset( $parts['fragment'] ) ? '#' . $parts['fragment'] : '';

		return $ret;
	}

	/**
	 * Register a Webpack-built script.
	 *
	 * Our Webpack-built scripts tend to need a bunch of boilerplate:
	 *  - A call to `Assets::get_file_url_for_environment()` for possible debugging.
	 *  - A call to `wp_register_style()` for extracted CSS, possibly with detection of RTL.
	 *  - Loading of dependencies and version provided by `@wordpress/dependency-extraction-webpack-plugin`.
	 *  - Avoiding WPCom's broken minifier.
	 *
	 * This wrapper handles all of that.
	 *
	 * @since 1.12.0
	 * @param string $handle      Name of the script. Should be unique across both scripts and styles.
	 * @param string $path        Minimized script path.
	 * @param string $relative_to File that `$path` is relative to. Pass `__FILE__`.
	 * @param array  $options     Additional options:
	 *  - `asset_path`:       (string|null) `.asset.php` to load. Default is to base it on `$path`.
	 *  - `async`:            (bool) Set true to register the script as async, like `Assets::enqueue_async_script()`
	 *  - `css_dependencies`: (string[]) Additional style dependencies to queue.
	 *  - `css_path`:         (string|null) `.css` to load. Default is to base it on `$path`.
	 *  - `dependencies`:     (string[]) Additional script dependencies to queue.
	 *  - `enqueue`:          (bool) Set true to enqueue the script immediately.
	 *  - `in_footer`:        (bool) Set true to register script for the footer.
	 *  - `media`:            (string) Media for the css file. Default 'all'.
	 *  - `minify`:           (bool|null) Set true to pass `minify=true` in the query string, or `null` to suppress the normal `minify=false`.
	 *  - `nonmin_path`:      (string) Non-minified script path.
	 *  - `textdomain`:       (string) Text domain for the script. Required if the script depends on wp-i18n.
	 *  - `version`:          (string) Override the version from the `asset_path` file.
	 * @throws \InvalidArgumentException If arguments are invalid.
	 */
	public static function register_script( $handle, $path, $relative_to, array $options = array() ) {
		if ( substr( $path, -3 ) !== '.js' ) {
			throw new \InvalidArgumentException( '$path must end in ".js"' );
		}

		$dir      = dirname( $relative_to );
		$base     = substr( $path, 0, -3 );
		$options += array(
			'asset_path'       => "$base.asset.php",
			'async'            => false,
			'css_dependencies' => array(),
			'css_path'         => "$base.css",
			'dependencies'     => array(),
			'enqueue'          => false,
			'in_footer'        => false,
			'media'            => 'all',
			'minify'           => false,
			'textdomain'       => null,
		);

		if ( $options['css_path'] && substr( $options['css_path'], -4 ) !== '.css' ) {
			throw new \InvalidArgumentException( '$options[\'css_path\'] must end in ".css"' );
		}

		if ( isset( $options['nonmin_path'] ) ) {
			$url = self::get_file_url_for_environment( $path, $options['nonmin_path'], $relative_to );
		} else {
			$url = plugins_url( $path, $relative_to );
		}
		$url = self::normalize_path( $url );
		if ( null !== $options['minify'] ) {
			$url = add_query_arg( 'minify', $options['minify'] ? 'true' : 'false', $url );
		}

		if ( $options['asset_path'] && file_exists( "$dir/{$options['asset_path']}" ) ) {
			$asset                       = require "$dir/{$options['asset_path']}";
			$options['dependencies']     = array_merge( $asset['dependencies'], $options['dependencies'] );
			$options['css_dependencies'] = array_merge(
				array_filter(
					$asset['dependencies'],
					function ( $d ) {
						return wp_style_is( $d, 'registered' );
					}
				),
				$options['css_dependencies']
			);
			$ver                         = isset( $options['version'] ) ? $options['version'] : $asset['version'];
		} else {
			$ver = isset( $options['version'] ) ? $options['version'] : filemtime( "$dir/$path" );
		}

		wp_register_script( $handle, $url, $options['dependencies'], $ver, $options['in_footer'] );
		if ( $options['async'] ) {
			self::instance()->add_async_script( $handle );
		}
		if ( $options['textdomain'] ) {
			wp_set_script_translations( $handle, $options['textdomain'] );
		} elseif ( in_array( 'wp-i18n', $options['dependencies'], true ) ) {
			_doing_it_wrong(
				__METHOD__,
				/* translators: %s is the script handle. */
				esc_html( sprintf( __( 'Script "%s" depends on wp-i18n but does not specify "textdomain"', 'jetpack' ), $handle ) ),
				''
			);
		}

		if ( $options['css_path'] && file_exists( "$dir/{$options['css_path']}" ) ) {
			$csspath = $options['css_path'];
			if ( is_rtl() ) {
				$rtlcsspath = substr( $csspath, 0, -4 ) . '.rtl.css';
				if ( file_exists( "$dir/$rtlcsspath" ) ) {
					$csspath = $rtlcsspath;
				}
			}

			$url = self::normalize_path( plugins_url( $csspath, $relative_to ) );
			if ( null !== $options['minify'] ) {
				$url = add_query_arg( 'minify', $options['minify'] ? 'true' : 'false', $url );
			}
			wp_register_style( $handle, $url, $options['css_dependencies'], $ver, $options['media'] );
			wp_script_add_data( $handle, 'Jetpack::Assets::hascss', true );
		} else {
			wp_script_add_data( $handle, 'Jetpack::Assets::hascss', false );
		}

		if ( $options['enqueue'] ) {
			self::enqueue_script( $handle );
		}
	}

	/**
	 * Enqueue a script registered with `Assets::register_script`.
	 *
	 * @since 1.12.0
	 * @param string $handle       Name of the script. Should be unique across both scripts and styles.
	 */
	public static function enqueue_script( $handle ) {
		wp_enqueue_script( $handle );
		if ( wp_scripts()->get_data( $handle, 'Jetpack::Assets::hascss' ) ) {
			wp_enqueue_style( $handle );
		}
	}

}
