<?php
/**
 * Package Provenance inventory sources.
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Builds the inventories Package_Provenance_Predictor consumes: what core,
 * Gutenberg and wp-build-polyfills ship, and which module names the site's
 * bundles opt in with.
 *
 * Core versions other than the running one come from the WordPress/WordPress
 * mirror on GitHub; Gutenberg release zips come from GitHub Releases. Downloads
 * are cached under the system temp dir.
 */
class Package_Provenance_Sources {

	const MIRROR_API = 'https://api.github.com/repos/WordPress/WordPress/contents/';
	const MIRROR_RAW = 'https://raw.githubusercontent.com/WordPress/WordPress/';

	/**
	 * Directories never scanned for bundles.
	 *
	 * @var string[]
	 */
	const SKIP_DIRS = array( 'node_modules', 'vendor', 'tests', 'test', '.git', '.cache', 'src' );

	/**
	 * Whether to ignore cached downloads.
	 *
	 * @var bool
	 */
	private $refresh;

	/**
	 * Constructor.
	 *
	 * @param bool $refresh Ignore cached downloads.
	 */
	public function __construct( $refresh = false ) {
		$this->refresh = (bool) $refresh;
	}

	/**
	 * Core inventory for a WordPress version.
	 *
	 * @param string $version WordPress version, or `trunk`.
	 * @return array Inventory plus `source` (`local` or the mirror ref).
	 * @throws RuntimeException When the mirror cannot be read.
	 */
	public function core_inventory( $version ) {
		$running = (string) ( $GLOBALS['wp_version'] ?? '' );
		if ( 'trunk' !== $version && version_compare( $version, $running, '==' ) ) {
			$dist      = ABSPATH . WPINC . '/js/dist';
			$inventory = array(
				'scripts'   => $this->handles_from_files( self::glob( $dist . '/*.js' ) ),
				'modules'   => $this->ids_from_dirs( self::glob( $dist . '/script-modules/*', GLOB_ONLYDIR ) ),
				'allowlist' => Package_Provenance_Predictor::parse_allowlist( (string) file_get_contents( $dist . '/private-apis.js' ) ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				'source'    => 'local',
			);
			return $inventory;
		}

		$ref   = 'trunk' === $version ? 'master' : $version;
		$cache = $this->cache_path( 'core-' . $ref . '.json' );
		if ( ! $this->refresh && 'master' !== $ref && is_file( $cache ) ) {
			$cached = json_decode( (string) file_get_contents( $cache ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			if ( is_array( $cached ) ) {
				return $cached;
			}
		}

		$scripts = array();
		foreach ( $this->mirror_listing( 'wp-includes/js/dist', $ref ) as $entry ) {
			if ( 'file' === $entry['type'] && substr( $entry['name'], -3 ) === '.js' && substr( $entry['name'], -7 ) !== '.min.js' ) {
				$scripts[] = 'wp-' . substr( $entry['name'], 0, -3 );
			}
		}
		$modules = array();
		foreach ( $this->mirror_listing( 'wp-includes/js/dist/script-modules', $ref ) as $entry ) {
			if ( 'dir' === $entry['type'] ) {
				$modules[] = '@wordpress/' . $entry['name'];
			}
		}
		sort( $scripts );
		sort( $modules );

		$inventory = array(
			'scripts'   => $scripts,
			'modules'   => $modules,
			'allowlist' => Package_Provenance_Predictor::parse_allowlist( $this->fetch( self::MIRROR_RAW . $ref . '/wp-includes/js/dist/private-apis.js' ) ),
			'source'    => 'WordPress/WordPress@' . $ref,
		);
		file_put_contents( $cache, wp_json_encode( $inventory, JSON_UNESCAPED_SLASHES ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		return $inventory;
	}

	/**
	 * Gutenberg inventory for a spec.
	 *
	 * @param string $spec `off`, `active`, a release version, or a path to a plugin zip or directory.
	 * @return array|null Inventory plus `version` and `source`, or null for `off`.
	 * @throws RuntimeException When the spec cannot be resolved.
	 */
	public function gutenberg_inventory( $spec ) {
		$spec = trim( (string) $spec );
		if ( '' === $spec || 'off' === $spec || 'none' === $spec ) {
			return null;
		}
		if ( 'active' === $spec ) {
			$dir = WP_PLUGIN_DIR . '/gutenberg';
			if ( ! is_dir( $dir ) ) {
				throw new RuntimeException( 'The Gutenberg plugin is not installed in ' . WP_PLUGIN_DIR );
			}
			return $this->gutenberg_from_dir( $dir, 'active plugin' );
		}
		if ( is_dir( $spec ) ) {
			return $this->gutenberg_from_dir( $spec, $spec );
		}
		if ( is_file( $spec ) ) {
			return $this->gutenberg_from_zip( $spec, $spec );
		}
		if ( preg_match( '/^\d+\.\d+(\.\d+)?(-[\w.]+)?$/', $spec ) ) {
			$zip = $this->cache_path( 'gutenberg-' . $spec . '.zip' );
			if ( $this->refresh || ! is_file( $zip ) ) {
				$this->download( 'https://github.com/WordPress/gutenberg/releases/download/v' . $spec . '/gutenberg.zip', $zip );
			}
			return $this->gutenberg_from_zip( $zip, 'release v' . $spec );
		}
		throw new RuntimeException( 'Cannot resolve Gutenberg spec: ' . $spec );
	}

	/**
	 * Inventory of a wp-build-polyfills build.
	 *
	 * Defaults to the copy loaded on this site. Pass another package directory to
	 * evaluate a different build (a branch checkout, for example); the force rules
	 * still come from the loaded class.
	 *
	 * @param string $root Package directory holding `build/`, or '' for the loaded copy.
	 * @return array Inventory plus `optins` (module names each build opts in with, by handle), `root` and `version`.
	 * @throws RuntimeException When no plugin ships the package, or the directory has no build.
	 */
	public function polyfill_inventory( $root = '' ) {
		$class = '\\Automattic\\Jetpack\\WP_Build_Polyfills\\WP_Build_Polyfills';
		if ( ! class_exists( $class ) ) {
			throw new RuntimeException( 'No active plugin ships automattic/jetpack-wp-build-polyfills.' );
		}
		if ( ! method_exists( $class, 'predict_registration' ) ) {
			throw new RuntimeException( 'The loaded wp-build-polyfills is too old: it has no predict_registration().' );
		}

		$root  = '' === $root ? dirname( ( new ReflectionClass( $class ) )->getFileName(), 2 ) : rtrim( $root, '/' );
		$build = $root . '/build';
		if ( ! is_dir( $build . '/scripts' ) ) {
			throw new RuntimeException( 'No wp-build-polyfills build under ' . $root . '; run its build first.' );
		}
		$apis = is_file( $build . '/scripts/private-apis/index.js' ) ? $build . '/scripts/private-apis/index.js' : $build . '/scripts/private-apis/index.min.js';

		// Released copies carry the version in composer.json; monorepo checkouts only in package.json.
		$version = '';
		foreach ( array( 'composer.json', 'package.json' ) as $manifest ) {
			$data = is_file( $root . '/' . $manifest ) ? json_decode( (string) file_get_contents( $root . '/' . $manifest ), true ) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			if ( is_array( $data ) && ! empty( $data['version'] ) ) {
				$version = (string) $data['version'];
				break;
			}
		}

		$optins = array();
		foreach ( self::glob( $build . '/scripts/*', GLOB_ONLYDIR ) as $dir ) {
			$optins[ 'wp-' . basename( $dir ) ] = $this->optins_in_dir( $dir );
		}
		foreach ( self::glob( $build . '/modules/*', GLOB_ONLYDIR ) as $dir ) {
			$optins[ '@wordpress/' . basename( $dir ) ] = $this->optins_in_dir( $dir );
		}

		return array(
			'scripts'   => $this->handles_from_dirs( self::glob( $build . '/scripts/*', GLOB_ONLYDIR ) ),
			'modules'   => $this->ids_from_dirs( self::glob( $build . '/modules/*', GLOB_ONLYDIR ) ),
			'allowlist' => is_file( $apis ) ? Package_Provenance_Predictor::parse_allowlist( (string) file_get_contents( $apis ) ) : array(), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			'optins'    => array_filter( $optins ),
			'root'      => $root,
			'version'   => $version,
		);
	}

	/**
	 * Directories of the active plugins and the mu-plugins directory.
	 *
	 * @return string[]
	 */
	public function default_bundle_dirs() {
		$dirs = array();
		foreach ( (array) get_option( 'active_plugins', array() ) as $plugin ) {
			$dir = WP_PLUGIN_DIR . '/' . dirname( $plugin );
			if ( '.' !== dirname( $plugin ) && is_dir( $dir ) ) {
				$dirs[ $dir ] = true;
			}
		}
		if ( is_dir( WPMU_PLUGIN_DIR ) ) {
			$dirs[ WPMU_PLUGIN_DIR ] = true;
		}
		return array_keys( $dirs );
	}

	/**
	 * Module names the JavaScript under the given directories opts in with.
	 *
	 * @param string[] $dirs         Directories to scan recursively.
	 * @param string   $exclude_root Directory to skip (the polyfill package, accounted for separately).
	 * @return array<string, string[]> Module name => files, as `<plugin dir>/<path>`.
	 */
	public function optins( array $dirs, $exclude_root = '' ) {
		$exclude_root = '' === $exclude_root ? '' : (string) realpath( $exclude_root );
		$found        = array();
		foreach ( $dirs as $dir ) {
			$real = realpath( $dir );
			if ( false === $real ) {
				continue;
			}
			$iterator = new RecursiveIteratorIterator(
				new RecursiveCallbackFilterIterator(
					new RecursiveDirectoryIterator( $real, FilesystemIterator::SKIP_DOTS | FilesystemIterator::FOLLOW_SYMLINKS ),
					function ( $current ) use ( $exclude_root ) {
						if ( $current->isDir() ) {
							if ( in_array( $current->getFilename(), self::SKIP_DIRS, true ) ) {
								return false;
							}
							// Compare real paths: plugins reach the package through symlinks.
							return '' === $exclude_root || 0 !== strpos( (string) $current->getRealPath(), $exclude_root );
						}
						return (bool) preg_match( '/\.m?js$/', $current->getFilename() );
					}
				)
			);
			foreach ( $iterator as $file ) {
				$names = Package_Provenance_Predictor::parse_optins( (string) file_get_contents( $file->getPathname() ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				foreach ( $names as $name ) {
					$found[ $name ][] = basename( $dir ) . substr( $file->getPathname(), strlen( $real ) );
				}
			}
		}
		ksort( $found );
		return $found;
	}

	/**
	 * Module names the JavaScript directly under a build directory opts in with.
	 *
	 * @param string $dir Directory.
	 * @return string[]
	 */
	private function optins_in_dir( $dir ) {
		$names = array();
		foreach ( self::glob( $dir . '/*.js' ) as $file ) {
			$names = array_merge( $names, Package_Provenance_Predictor::parse_optins( (string) file_get_contents( $file ) ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		}
		$names = array_values( array_unique( $names ) );
		sort( $names );
		return $names;
	}

	/**
	 * Inventory of a Gutenberg plugin directory (old `build/<pkg>` and new `build/scripts/<pkg>` layouts).
	 *
	 * @param string $dir    Plugin directory.
	 * @param string $source Label for the `source` key.
	 * @return array
	 */
	private function gutenberg_from_dir( $dir, $source ) {
		$dir     = rtrim( $dir, '/' );
		$scripts = is_dir( $dir . '/build/scripts' ) ? $dir . '/build/scripts' : $dir . '/build';
		$modules = is_dir( $dir . '/build/modules' ) ? $dir . '/build/modules' : $dir . '/build-module';

		$script_dirs = array();
		foreach ( self::glob( $scripts . '/*', GLOB_ONLYDIR ) as $candidate ) {
			if ( is_file( $candidate . '/index.min.js' ) ) {
				$script_dirs[] = $candidate;
			}
		}
		$apis = $scripts . '/private-apis/index.min.js';

		$version = '';
		if ( is_file( $dir . '/build/constants.php' ) ) {
			$constants = include $dir . '/build/constants.php';
			$version   = (string) ( $constants['version'] ?? '' );
		}
		if ( '' === $version && is_file( $dir . '/gutenberg.php' ) && preg_match( '/^\s*\*\s*Version:\s*(\S+)/m', (string) file_get_contents( $dir . '/gutenberg.php' ), $m ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$version = $m[1];
		}

		return array(
			'scripts'   => $this->handles_from_dirs( $script_dirs ),
			'modules'   => $this->ids_from_dirs( self::glob( $modules . '/*', GLOB_ONLYDIR ) ),
			'allowlist' => is_file( $apis ) ? Package_Provenance_Predictor::parse_allowlist( (string) file_get_contents( $apis ) ) : array(), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			'version'   => $version,
			'source'    => $source,
		);
	}

	/**
	 * Inventory of a Gutenberg plugin zip, without extracting it.
	 *
	 * @param string $zip    Zip path.
	 * @param string $source Label for the `source` key.
	 * @return array
	 * @throws RuntimeException When the zip cannot be opened.
	 */
	private function gutenberg_from_zip( $zip, $source ) {
		$archive = new ZipArchive();
		if ( true !== $archive->open( $zip ) ) {
			throw new RuntimeException( 'Cannot open ' . $zip );
		}

		$names = array();
		for ( $i = 0; $i < $archive->numFiles; $i++ ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$names[] = $archive->getNameIndex( $i );
		}

		// Release zips may nest everything under one top-level directory.
		$prefix = '';
		foreach ( $names as $name ) {
			if ( preg_match( '#^((?:[^/]+/)?)gutenberg\.php$#', $name, $m ) ) {
				$prefix = $m[1];
				break;
			}
		}

		$layout  = in_array( $prefix . 'build/scripts.php', $names, true ) ? 'build/scripts/' : 'build/';
		$modules = in_array( $prefix . 'build/modules.php', $names, true ) ? 'build/modules/' : 'build-module/';

		$scripts = array();
		$ids     = array();
		foreach ( $names as $name ) {
			if ( preg_match( '#^' . preg_quote( $prefix . $layout, '#' ) . '([a-z0-9-]+)/index\.min\.js$#', $name, $m ) ) {
				$scripts[] = 'wp-' . $m[1];
			} elseif ( preg_match( '#^' . preg_quote( $prefix . $modules, '#' ) . '([a-z0-9-]+)/index(\.min)?\.js$#', $name, $m ) ) {
				$ids[] = '@wordpress/' . $m[1];
			}
		}
		$scripts = array_values( array_unique( $scripts ) );
		$ids     = array_values( array_unique( $ids ) );
		sort( $scripts );
		sort( $ids );

		$version   = '';
		$constants = $archive->getFromName( $prefix . 'build/constants.php' );
		if ( false !== $constants && preg_match( "/'version'\s*=>\s*'([^']+)'/", $constants, $m ) ) {
			$version = $m[1];
		}
		$header = $archive->getFromName( $prefix . 'gutenberg.php' );
		if ( '' === $version && false !== $header && preg_match( '/^\s*\*\s*Version:\s*(\S+)/m', $header, $m ) ) {
			$version = $m[1];
		}

		$apis = $archive->getFromName( $prefix . $layout . 'private-apis/index.min.js' );
		$archive->close();

		return array(
			'scripts'   => $scripts,
			'modules'   => $ids,
			'allowlist' => false !== $apis ? Package_Provenance_Predictor::parse_allowlist( $apis ) : array(),
			'version'   => $version,
			'source'    => $source,
		);
	}

	/**
	 * Lists a directory of the WordPress/WordPress mirror.
	 *
	 * @param string $path Repository path.
	 * @param string $ref  Tag or branch.
	 * @return array[] Entries with `name` and `type`.
	 * @throws RuntimeException When the listing is not JSON.
	 */
	private function mirror_listing( $path, $ref ) {
		$entries = json_decode( $this->fetch( self::MIRROR_API . $path . '?ref=' . rawurlencode( $ref ) ), true );
		if ( ! is_array( $entries ) || isset( $entries['message'] ) ) {
			throw new RuntimeException( 'Cannot list ' . $path . ' at WordPress/WordPress@' . $ref . ( isset( $entries['message'] ) ? ': ' . $entries['message'] : '' ) );
		}
		return $entries;
	}

	/**
	 * GETs a URL and returns the body.
	 *
	 * @param string $url URL.
	 * @return string
	 * @throws RuntimeException On HTTP failure.
	 */
	private function fetch( $url ) {
		$response = wp_remote_get( $url, array( 'timeout' => 30 ) );
		if ( is_wp_error( $response ) ) {
			throw new RuntimeException( $url . ': ' . $response->get_error_message() );
		}
		$code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			throw new RuntimeException( $url . ': HTTP ' . $code );
		}
		return (string) wp_remote_retrieve_body( $response );
	}

	/**
	 * Downloads a URL to a path.
	 *
	 * @param string $url  URL.
	 * @param string $path Destination.
	 * @throws RuntimeException On failure.
	 */
	private function download( $url, $path ) {
		$response = wp_remote_get(
			$url,
			array(
				'timeout'  => 120,
				'stream'   => true,
				'filename' => $path,
			)
		);
		if ( is_wp_error( $response ) ) {
			throw new RuntimeException( $url . ': ' . $response->get_error_message() );
		}
		$code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			@unlink( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.unlink_unlink
			throw new RuntimeException( $url . ': HTTP ' . $code );
		}
	}

	/**
	 * Path inside the cache directory, creating the directory on first use.
	 *
	 * @param string $file File name.
	 * @return string
	 */
	private function cache_path( $file ) {
		$dir = rtrim( get_temp_dir(), '/' ) . '/jetpack-debug-helper-provenance';
		if ( ! is_dir( $dir ) ) {
			wp_mkdir_p( $dir );
		}
		return $dir . '/' . $file;
	}

	/**
	 * Wraps glob() so it never returns false.
	 *
	 * @param string $pattern Pattern.
	 * @param int    $flags   Flags.
	 * @return string[]
	 */
	private static function glob( $pattern, $flags = 0 ) {
		$matches = glob( $pattern, $flags );
		return false === $matches ? array() : $matches;
	}

	/**
	 * `wp-<name>` handles from `<name>.js` files.
	 *
	 * @param string[] $files File paths.
	 * @return string[]
	 */
	private function handles_from_files( array $files ) {
		$handles = array();
		foreach ( $files as $file ) {
			$name = basename( $file );
			if ( substr( $name, -7 ) !== '.min.js' ) {
				$handles[] = 'wp-' . substr( $name, 0, -3 );
			}
		}
		sort( $handles );
		return $handles;
	}

	/**
	 * `wp-<name>` handles from `<name>/` directories.
	 *
	 * @param string[] $dirs Directory paths.
	 * @return string[]
	 */
	private function handles_from_dirs( array $dirs ) {
		$handles = array_map(
			function ( $dir ) {
				return 'wp-' . basename( $dir );
			},
			$dirs
		);
		sort( $handles );
		return $handles;
	}

	/**
	 * `@wordpress/<name>` IDs from `<name>/` directories.
	 *
	 * @param string[] $dirs Directory paths.
	 * @return string[]
	 */
	private function ids_from_dirs( array $dirs ) {
		$ids = array_map(
			function ( $dir ) {
				return '@wordpress/' . basename( $dir );
			},
			$dirs
		);
		sort( $ids );
		return $ids;
	}
}
