<?php

use Automattic\Jetpack_Boost\Lib\Minify;
use Automattic\Jetpack_Boost\Lib\Minify\Config;
use Automattic\Jetpack_Boost\Lib\Minify\Dependency_Path_Mapping;
use Automattic\Jetpack_Boost\Lib\Minify\File_Paths;
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

	// We handle the cache here, tell other caches not to.
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}

	$use_cache       = Config::can_use_cache();
	$cache_file      = '';
	$cache_file_meta = '';

	if ( $use_cache ) {
		$cache_dir = Config::get_legacy_cache_dir_path();
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
					exit( 0 );
				}
			}

			if ( file_exists( $cache_file_meta ) ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				$meta = json_decode( file_get_contents( $cache_file_meta ), true );
				if ( ! empty( $meta ) && ! empty( $meta['headers'] ) ) {
					foreach ( $meta['headers'] as $header ) {
						header( $header );
					}
				}
			}

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$etag = '"' . md5( file_get_contents( $cache_file ) ) . '"';

			// Check if we're on Atomic and take advantage of the Atomic Edge Cache.
			if ( defined( 'ATOMIC_CLIENT_ID' ) ) {
				header( 'A8c-Edge-Cache: cache' );
			}
			header( 'X-Page-Optimize: cached' );
			header( 'Cache-Control: max-age=' . 31536000 );
			header( 'ETag: ' . $etag );

			echo file_get_contents( $cache_file ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped, WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- We need to trust this unfortunately.
			die( 0 );
		}
	}

	// Existing file not available; generate new content.
	$output  = jetpack_boost_page_optimize_build_output();
	$content = $output['content'];
	$headers = $output['headers'];

	foreach ( $headers as $header ) {
		header( $header );
	}
	// Check if we're on Atomic and take advantage of the Atomic Edge Cache.
	if ( defined( 'ATOMIC_CLIENT_ID' ) ) {
		header( 'A8c-Edge-Cache: cache' );
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

	die( 0 );
}

/**
 * Strip matching parent paths off a string. Returns $path without $parent_path.
 */
function jetpack_boost_strip_parent_path( $parent_path, $path ) {
	$trimmed_parent = ltrim( $parent_path, '/' );
	$trimmed_path   = ltrim( $path, '/' );

	if ( substr( $trimmed_path, 0, strlen( $trimmed_parent ) ) === $trimmed_parent ) {
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

	$args = jetpack_boost_page_optimize_get_file_paths( $args );

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
				$buf = preg_replace_callback(
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

function jetpack_boost_page_optimize_get_file_paths( $args ) {
	$paths = File_Paths::get( $args );
	if ( $paths ) {
		$args = $paths->get_paths();
	} else {
		// Kept for backward compatibility in case cached page is still referring to old formal asset URLs.

		// It's a base64 encoded list of file path.
		// e.g.: /_jb_static/??-eJzTT8vP109KLNJLLi7W0QdyDEE8IK4CiVjn2hpZGluYmKcDABRMDPM=
		if ( '-' === $args[0] ) {

			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
			$args = @gzuncompress( base64_decode( substr( $args, 1 ) ) );
		}

		// It's an unencoded comma separated list of file paths.
		// /foo/bar.css,/foo1/bar/baz.css?m=293847g
		$version_string_pos = strpos( $args, '?' );
		if ( false !== $version_string_pos ) {
			$args = substr( $args, 0, $version_string_pos );
		}
		// /foo/bar.css,/foo1/bar/baz.css
		$args = explode( ',', $args );
	}

	if ( ! is_array( $args ) ) {
		// Invalid data, abort!
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	return $args;
}

/**
 * Exit with a given HTTP status code.
 *
 * @param int $status HTTP status code.
 *
 * @return never
 */
function jetpack_boost_page_optimize_status_exit( $status ) {
	http_response_code( $status );
	exit( 0 ); // This is a workaround, until a bug in phan is fixed - https://github.com/phan/phan/issues/4888
}

function jetpack_boost_page_optimize_get_mime_type( $file ) {
	$jetpack_boost_page_optimize_types = jetpack_boost_page_optimize_types();

	$lastdot_pos = strrpos( $file, '.' );
	if ( false === $lastdot_pos ) {
		return false;
	}

	$ext = substr( $file, $lastdot_pos + 1 );
	if ( ! isset( $jetpack_boost_page_optimize_types[ $ext ] ) ) {
		return false;
	}

	return $jetpack_boost_page_optimize_types[ $ext ];
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
