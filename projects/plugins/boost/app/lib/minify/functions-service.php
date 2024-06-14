<?php

use Automattic\Jetpack_Boost\Lib\Minify;
use Automattic\Jetpack_Boost\Lib\Minify\Config;
use Automattic\Jetpack_Boost\Lib\Minify\Dependency_Path_Mapping;
use Automattic\Jetpack_Boost\Lib\Minify\Utils;

function jetpack_boost_page_optimize_types() {
	return array(
		'css' => 'text/css',
		'js'  => 'application/javascript',
	);
}

/**
 * Handle serving a minified / concatenated file from the virtual _jb_static dir.
 *
 * @return never
 */
function jetpack_boost_page_optimize_service_request() {
	$use_wp = defined( 'JETPACK_BOOST_CONCAT_USE_WP' ) && JETPACK_BOOST_CONCAT_USE_WP;
	$utils  = new Utils( $use_wp );

	$cache_dir = Config::get_cache_dir_path();
	$use_cache = ! empty( $cache_dir );

	// We handle the cache here, tell other caches not to.
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}

	// Ensure the cache directory exists.
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
	if ( $use_cache && ! is_dir( $cache_dir ) && ! mkdir( $cache_dir, 0775, true ) ) {
		$use_cache = false;
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log(
				sprintf(
				/* translators: a filesystem path to a directory */
					__( "Disabling page-optimize cache. Unable to create cache directory '%s'.", 'jetpack-boost' ),
					$cache_dir
				)
			);
		}
	}

	// Ensure the cache directory is writable.
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
	if ( $use_cache && ( ! is_dir( $cache_dir ) || ! is_writable( $cache_dir ) || ! is_executable( $cache_dir ) ) ) {
		$use_cache = false;
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log(
				sprintf(
				/* translators: a filesystem path to a directory */
					__( "Disabling page-optimize cache. Unable to write to cache directory '%s'.", 'jetpack-boost' ),
					$cache_dir
				)
			);
		}
	}

	if ( $use_cache ) {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$request_uri      = isset( $_SERVER['REQUEST_URI'] ) ? $utils->unslash( $_SERVER['REQUEST_URI'] ) : '';
		$request_uri_hash = md5( $request_uri );
		$cache_file       = $cache_dir . "/page-optimize-cache-$request_uri_hash";
		$cache_file_meta  = $cache_dir . "/page-optimize-cache-meta-$request_uri_hash";

		// Serve an existing file.
		if ( file_exists( $cache_file ) ) {
			if ( isset( $_SERVER['HTTP_IF_MODIFIED_SINCE'] ) ) {
				// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
				if ( strtotime( $utils->unslash( $_SERVER['HTTP_IF_MODIFIED_SINCE'] ) ) < filemtime( $cache_file ) ) {
					header( 'HTTP/1.1 304 Not Modified' );
					exit;
				}
			}

			if ( file_exists( $cache_file_meta ) ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				$meta = json_decode( file_get_contents( $cache_file_meta ), ARRAY_A );
				if ( ! empty( $meta ) && ! empty( $meta['headers'] ) ) {
					foreach ( $meta['headers'] as $header ) {
						header( $header );
					}
				}
			}

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$etag = '"' . md5( file_get_contents( $cache_file ) ) . '"';

			header( 'X-Page-Optimize: cached' );
			header( 'Cache-Control: max-age=' . 31536000 );
			header( 'ETag: ' . $etag );

			echo file_get_contents( $cache_file ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped, WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- We need to trust this unfortunately.
			die();
		}
	}

	// Existing file not available; generate new content.
	$output  = jetpack_boost_page_optimize_build_output();
	$content = $output['content'];
	$headers = $output['headers'];

	foreach ( $headers as $header ) {
		header( $header );
	}
	header( 'X-Page-Optimize: uncached' );
	header( 'Cache-Control: max-age=' . 31536000 );
	header( 'ETag: "' . md5( $content ) . '"' );

	echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- We need to trust this unfortunately.

	// Cache the generated data, if available.
	if ( $use_cache ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $cache_file, $content );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $cache_file_meta, wp_json_encode( array( 'headers' => $headers ) ) );
	}

	die();
}

/**
 * Strip matching parent paths off a string. Returns $path without $parent_path.
 */
function jetpack_boost_strip_parent_path( $parent_path, $path ) {
	$trimmed_parent = ltrim( $parent_path, '/' );
	$trimmed_path   = ltrim( $path, '/' );

	if ( substr( $trimmed_path, 0, strlen( $trimmed_parent ) === $trimmed_parent ) ) {
		$trimmed_path = substr( $trimmed_path, strlen( $trimmed_parent ) );
	}

	return str_starts_with( $trimmed_path, '/' ) ? $trimmed_path : '/' . $trimmed_path;
}

/**
 * Generate a combined and minified output for the current request. This is run regardless of the
 * type of content being fetched; JavaScript or CSS, so it must handle either.
 */
function jetpack_boost_page_optimize_build_output() {
	$use_wp = defined( 'JETPACK_BOOST_CONCAT_USE_WP' ) && JETPACK_BOOST_CONCAT_USE_WP;
	$utils  = new Utils( $use_wp );

	$jetpack_boost_page_optimize_types = jetpack_boost_page_optimize_types();

	// Config
	$concat_max_files = 150;
	$concat_unique    = true;

	// Main
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
	$method = isset( $_SERVER['REQUEST_METHOD'] ) ? $utils->unslash( $_SERVER['REQUEST_METHOD'] ) : 'GET';
	if ( ! in_array( $method, array( 'GET', 'HEAD' ), true ) ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	// Ensure the path follows one of these forms:
	// /_jb_static/??/foo/bar.css,/foo1/bar/baz.css?m=293847g
	// -- or --
	// /_jb_static/??-eJzTT8vP109KLNJLLi7W0QdyDEE8IK4CiVjn2hpZGluYmKcDABRMDPM=
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? $utils->unslash( $_SERVER['REQUEST_URI'] ) : '';
	$args        = $utils->parse_url( $request_uri, PHP_URL_QUERY );
	if ( ! $args || ! str_contains( $args, '?' ) ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	$args = substr( $args, strpos( $args, '?' ) + 1 );

	// Detect paths with - in their filename - this implies a base64 encoded gzipped string for the file list.
	// e.g.: /_jb_static/??-eJzTT8vP109KLNJLLi7W0QdyDEE8IK4CiVjn2hpZGluYmKcDABRMDPM=
	if ( '-' === $args[0] ) {
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		$args = @gzuncompress( base64_decode( substr( $args, 1 ) ) );

		// Invalid data, abort!
		if ( false === $args ) {
			jetpack_boost_page_optimize_status_exit( 400 );
		}
	}

	// Handle comma separated list of files. e.g.:
	// /foo/bar.css,/foo1/bar/baz.css?m=293847g
	$version_string_pos = strpos( $args, '?' );
	if ( false !== $version_string_pos ) {
		$args = substr( $args, 0, $version_string_pos );
	}

	// /foo/bar.css,/foo1/bar/baz.css
	$args = explode( ',', $args );
	if ( ! $args ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	// args contain something like array( '/foo/bar.css', '/foo1/bar/baz.css' )
	if ( 0 === count( $args ) || count( $args ) > $concat_max_files ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	// If we're in a subdirectory context, use that as the root.
	// We can't assume that the root serves the same content as the subdir.
	$subdir_path_prefix = '';
	$request_path       = $utils->parse_url( $request_uri, PHP_URL_PATH );
	$_static_index      = strpos( $request_path, jetpack_boost_get_static_prefix() );
	if ( $_static_index > 0 ) {
		$subdir_path_prefix = substr( $request_path, 0, $_static_index );
	}
	unset( $request_path, $_static_index );

	$last_modified = 0;
	$pre_output    = '';
	$output        = '';

	foreach ( $args as $uri ) {
		$fullpath = jetpack_boost_page_optimize_get_path( $uri );

		if ( ! file_exists( $fullpath ) ) {
			jetpack_boost_page_optimize_status_exit( 404 );
		}

		$mime_type = jetpack_boost_page_optimize_get_mime_type( $fullpath );
		if ( ! in_array( $mime_type, $jetpack_boost_page_optimize_types, true ) ) {
			jetpack_boost_page_optimize_status_exit( 400 );
		}

		if ( $concat_unique ) {
			if ( ! isset( $last_mime_type ) ) {
				$last_mime_type = $mime_type;
			}

			if ( $last_mime_type !== $mime_type ) {
				jetpack_boost_page_optimize_status_exit( 400 );
			}
		}

		$stat = stat( $fullpath );
		if ( false === $stat ) {
			jetpack_boost_page_optimize_status_exit( 500 );
		}

		if ( $stat['mtime'] > $last_modified ) {
			$last_modified = $stat['mtime'];
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$buf = file_get_contents( $fullpath );
		if ( false === $buf ) {
			jetpack_boost_page_optimize_status_exit( 500 );
		}

		if ( 'text/css' === $mime_type ) {
			$dirpath = jetpack_boost_strip_parent_path( $subdir_path_prefix, dirname( $uri ) );

			// url(relative/path/to/file) -> url(/absolute/and/not/relative/path/to/file)
			$buf = jetpack_boost_page_optimize_relative_path_replace( $buf, $dirpath );

			// phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			// This regex changes things like AlphaImageLoader(...src='relative/path/to/file'...) to AlphaImageLoader(...src='/absolute/path/to/file'...)
			$buf = preg_replace(
				'/(Microsoft.AlphaImageLoader\s*\([^\)]*src=(?:\'|")?)([^\/\'"\s\)](?:(?<!http:|https:).)*)\)/isU',
				'$1' . ( $dirpath === '/' ? '/' : $dirpath . '/' ) . '$2)',
				$buf
			);

			// The @charset rules must be on top of the output
			if ( str_starts_with( $buf, '@charset' ) ) {
				preg_replace_callback(
					'/(?P<charset_rule>@charset\s+[\'"][^\'"]+[\'"];)/i',
					function ( $match ) use ( &$pre_output ) {
						if ( str_starts_with( $pre_output, '@charset' ) ) {
							return '';
						}

						$pre_output = $match[0] . "\n" . $pre_output;

						return '';
					},
					$buf
				);
			}

			// Move the @import rules on top of the concatenated output.
			// Only @charset rule are allowed before them.
			if ( str_contains( $buf, '@import' ) ) {
				$buf = preg_replace_callback(
					'/(?P<pre_path>@import\s+(?:url\s*\()?[\'"\s]*)(?P<path>[^\'"\s](?:https?:\/\/.+\/?)?.+?)(?P<post_path>[\'"\s\)]*;)/i',
					function ( $match ) use ( $dirpath, &$pre_output ) {
						if ( ! str_starts_with( $match['path'], 'http' ) && '/' !== $match['path'][0] ) {
							$pre_output .= $match['pre_path'] . ( $dirpath === '/' ? '/' : $dirpath . '/' ) .
											$match['path'] . $match['post_path'] . "\n";
						} else {
							$pre_output .= $match[0] . "\n";
						}

						return '';
					},
					$buf
				);
			}

			// If filename indicates it's already minified, don't minify it again.
			if ( ! preg_match( '/\.min\.css$/', $fullpath ) ) {
				// Minify CSS.
				$buf = Minify::css( $buf );
			}
			$output .= "$buf";
		} else {
			// If filename indicates it's already minified, don't minify it again.
			if ( ! preg_match( '/\.min\.js$/', $fullpath ) ) {
				// Minify JS
				$buf = Minify::js( $buf );
			}

			$output .= "$buf;\n";
		}
	}

	// Don't let trailing whitespace ruin everyone's day. Seems to get stripped by batcache
	// resulting in ns_error_net_partial_transfer errors.
	$output = rtrim( $output );

	$headers = array(
		'Last-Modified: ' . gmdate( 'D, d M Y H:i:s', $last_modified ) . ' GMT',
		"Content-Type: $mime_type",
	);

	return array(
		'headers' => $headers,
		'content' => $pre_output . $output,
	);
}

function jetpack_boost_page_optimize_status_exit( $status ) {
	http_response_code( $status );
	exit;
}

function jetpack_boost_page_optimize_get_mime_type( $file ) {
	$jetpack_boost_page_optimize_types = jetpack_boost_page_optimize_types();

	$lastdot_pos = strrpos( $file, '.' );
	if ( false === $lastdot_pos ) {
		return false;
	}

	$ext = substr( $file, $lastdot_pos + 1 );

	return isset( $jetpack_boost_page_optimize_types[ $ext ] ) ? $jetpack_boost_page_optimize_types[ $ext ] : false;
}

function jetpack_boost_page_optimize_relative_path_replace( $buf, $dirpath ) {
	// url(relative/path/to/file) -> url(/absolute/and/not/relative/path/to/file)
	$buf = preg_replace(
		'/(:?\s*url\s*\()\s*(?:\'|")?\s*([^\/\'"\s\)](?:(?<!data:|http:|https:|[\(\'"]#|%23).)*)[\'"\s]*\)/isU',
		'$1' . ( $dirpath === '/' ? '/' : $dirpath . '/' ) . '$2)',
		$buf
	);

	return $buf;
}

function jetpack_boost_page_optimize_get_path( $uri ) {
	static $dependency_path_mapping;

	if ( ! strlen( $uri ) ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	if ( str_contains( $uri, '..' ) || str_contains( $uri, "\0" ) ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	if ( defined( 'PAGE_OPTIMIZE_CONCAT_BASE_DIR' ) ) {
		$path = realpath( PAGE_OPTIMIZE_CONCAT_BASE_DIR . "/$uri" );

		if ( false === $path ) {
			$path = realpath( Config::get_abspath() . "/$uri" );
		}
	} else {
		if ( empty( $dependency_path_mapping ) ) {
			$dependency_path_mapping = new Dependency_Path_Mapping();
		}
		$path = $dependency_path_mapping->uri_path_to_fs_path( $uri );
	}

	if ( false === $path ) {
		jetpack_boost_page_optimize_status_exit( 404 );
	}

	return $path;
}
