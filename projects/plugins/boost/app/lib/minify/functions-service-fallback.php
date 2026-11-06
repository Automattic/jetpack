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
 * Size limits in bytes for one concatenation request. A request over any of them is refused.
 *
 * @return array{encoded_list: int, decoded_list: int, files_read: int, output: int}
 */
function jetpack_boost_page_optimize_limits() {
	return array(
		'encoded_list' => 64 * 1024,
		'decoded_list' => 256 * 1024,
		'files_read'   => 16 * 1024 * 1024,
		'output'       => 16 * 1024 * 1024,
	);
}

/**
 * Refuse the request if the listed files total more than the read limit, before any of them is read.
 *
 * @param string[] $uris The listed file paths.
 *
 * @return void
 */
function jetpack_boost_page_optimize_check_files_size( $uris ) {
	$total_bytes = 0;

	foreach ( $uris as $uri ) {
		$fullpath = jetpack_boost_page_optimize_get_path( $uri );

		if ( ! in_array( jetpack_boost_page_optimize_get_mime_type( $fullpath ), jetpack_boost_page_optimize_types(), true ) ) {
			jetpack_boost_page_optimize_status_exit( 400 );
		}

		// get_path() has refused a missing file already, so this only guards a file removed since that call.
		$total_bytes += file_exists( $fullpath ) ? (int) filesize( $fullpath ) : 0;
	}

	if ( $total_bytes > jetpack_boost_page_optimize_limits()['files_read'] ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}
}

/**
 * Refuse the request if the output built so far is over its size limit.
 *
 * @param int $size Size of the output in bytes.
 *
 * @return void
 */
function jetpack_boost_page_optimize_check_output_size( $size ) {
	if ( $size > jetpack_boost_page_optimize_limits()['output'] ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}
}

/**
 * Get the size limit of one cache directory in bytes. A response that would take the directory over it is served but not stored.
 *
 * @return int
 */
function jetpack_boost_page_optimize_cache_max_bytes() {
	/**
	 * Filter the most bytes a concatenate cache directory may hold.
	 *
	 * The _jb_static route runs while plugins are loading, so hook this from a must-use plugin.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $max_bytes The size limit in bytes.
	 */
	return (int) apply_filters( 'jetpack_boost_minify_cache_max_bytes', 1024 * 1024 * 1024 );
}

/**
 * Whether a cache directory has room for more data.
 *
 * @param string $pattern Glob pattern matching the directory's cache files.
 * @param int    $bytes   Size of the data to add.
 *
 * @return bool
 */
function jetpack_boost_page_optimize_cache_has_room( $pattern, $bytes ) {
	$total_bytes = $bytes;

	foreach ( (array) glob( $pattern ) as $file ) {
		$total_bytes += file_exists( (string) $file ) ? (int) filesize( $file ) : 0;
	}

	return $total_bytes <= jetpack_boost_page_optimize_cache_max_bytes();
}

/**
 * Write a cache file so that a concurrent request sees either the whole file or none of it.
 *
 * @param string $path    Path of the cache file.
 * @param string $content File content.
 *
 * @return bool Whether the file was written.
 */
function jetpack_boost_page_optimize_write_cache_file( $path, $content ) {
	// Same directory, so the rename is atomic, and a name the cleanup globs match, so an orphan is removed.
	$temp_path = $path . '.' . uniqid( 'tmp-', true );

	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents, WordPress.WP.AlternativeFunctions.rename_rename
	if ( strlen( $content ) === file_put_contents( $temp_path, $content ) && rename( $temp_path, $path ) ) {
		return true;
	}

	if ( file_exists( $temp_path ) ) {
		wp_delete_file( $temp_path );
	}

	return false;
}

/**
 * Get the part of the request path before the static prefix, such as `/blog` on a site in a subdirectory.
 *
 * @param string $request_uri The request URI.
 *
 * @return string
 */
function jetpack_boost_page_optimize_get_subdir_prefix( $request_uri ) {
	$use_wp        = defined( 'JETPACK_BOOST_CONCAT_USE_WP' ) && JETPACK_BOOST_CONCAT_USE_WP;
	$request_path  = ( new Utils( $use_wp ) )->parse_url( $request_uri, PHP_URL_PATH );
	$_static_index = strpos( $request_path, jetpack_boost_get_static_prefix() );

	return $_static_index > 0 ? substr( $request_path, 0, $_static_index ) : '';
}

/**
 * Get the cache key of a list, shared by every request for it.
 *
 * @param string $list_id     The list ID.
 * @param string $request_uri The request URI.
 *
 * @return string|false The key, or false if the response must not be shared.
 */
function jetpack_boost_page_optimize_get_cache_key( $list_id, $request_uri ) {
	$use_wp = defined( 'JETPACK_BOOST_CONCAT_USE_WP' ) && JETPACK_BOOST_CONCAT_USE_WP;
	$utils  = new Utils( $use_wp );
	$prefix = jetpack_boost_page_optimize_get_subdir_prefix( $request_uri );

	/** This filter is documented in app/lib/minify/class-concatenate-css.php */
	$site_url = apply_filters( 'page_optimize_site_url', site_url() );

	// The prefix changes how relative CSS URLs are rewritten, so output built under any other path would break the site's pages.
	// A request with no prefix is kept because a proxy can strip the site's path before it reaches WordPress.
	if ( '' !== $prefix && rtrim( (string) $utils->parse_url( $site_url, PHP_URL_PATH ), '/' ) !== $prefix ) {
		return false;
	}

	return md5( $prefix . '|' . $list_id );
}

/**
 * Get the cache key of the list a _jb_static request names. Any list the site has not stored is refused.
 *
 * @param string $request_uri The request URI.
 *
 * @return string|false The key, or false if the response must not be shared.
 */
function jetpack_boost_page_optimize_get_request_cache_key( $request_uri ) {
	$list    = jetpack_boost_page_optimize_get_request_list( $request_uri );
	$list_id = File_Paths::is_id( $list ) ? $list : jetpack_boost_page_optimize_get_issued_list( $list )->get_cache_id();

	return jetpack_boost_page_optimize_get_cache_key( $list_id, $request_uri );
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

	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? $utils->unslash( $_SERVER['REQUEST_URI'] ) : '';
	$cache_key   = jetpack_boost_page_optimize_get_request_cache_key( $request_uri );

	$use_cache       = false !== $cache_key && Config::can_use_cache();
	$cache_file      = '';
	$cache_file_meta = '';

	if ( $use_cache ) {
		$cache_dir       = Config::get_legacy_cache_dir_path();
		$cache_file      = $cache_dir . "/page-optimize-cache-$cache_key";
		$cache_file_meta = $cache_dir . "/page-optimize-cache-meta-$cache_key";

		// Serve an existing file.
		$cached = jetpack_boost_page_optimize_read_cached_response( $cache_file, $cache_file_meta );
		if ( false !== $cached ) {
			if ( isset( $_SERVER['HTTP_IF_MODIFIED_SINCE'] ) ) {
				// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
				if ( strtotime( $utils->unslash( $_SERVER['HTTP_IF_MODIFIED_SINCE'] ) ) < filemtime( $cache_file ) ) {
					header( 'HTTP/1.1 304 Not Modified' );
					exit( 0 );
				}
			}

			foreach ( $cached['headers'] as $header ) {
				header( $header );
			}

			$etag = '"' . md5( $cached['content'] ) . '"';

			// Check if we're on Atomic and take advantage of the Atomic Edge Cache.
			if ( defined( 'ATOMIC_CLIENT_ID' ) ) {
				header( 'A8c-Edge-Cache: cache' );
			}
			header( 'X-Page-Optimize: cached' );
			header( 'Cache-Control: max-age=' . 31536000 );
			header( 'ETag: ' . $etag );

			echo $cached['content']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- We need to trust this unfortunately.
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
		jetpack_boost_page_optimize_store_cached_response( $cache_file, $cache_file_meta, $output );
	}

	die( 0 );
}

/**
 * Read a cached response. A body without its headers counts as a miss, because it would be served as text/html.
 *
 * @param string $cache_file      Path of the content file.
 * @param string $cache_file_meta Path of the headers file.
 *
 * @return array{content: string, headers: string[]}|false The response, or false if it must be rebuilt.
 */
function jetpack_boost_page_optimize_read_cached_response( $cache_file, $cache_file_meta ) {
	if ( ! file_exists( $cache_file ) || ! file_exists( $cache_file_meta ) ) {
		return false;
	}

	// Silenced because the cache can be emptied between the check above and these reads.
	// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	$content = @file_get_contents( $cache_file );
	// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	$meta = json_decode( (string) @file_get_contents( $cache_file_meta ), true );

	if ( false === $content || empty( $meta['headers'] ) ) {
		return false;
	}

	return array(
		'content' => $content,
		'headers' => $meta['headers'],
	);
}

/**
 * Store a built response in the cache, if the cache has room for it.
 *
 * @param string $cache_file      Path of the content file.
 * @param string $cache_file_meta Path of the headers file.
 * @param array  $output          The built response, with 'content' and 'headers'.
 *
 * @return void
 */
function jetpack_boost_page_optimize_store_cached_response( $cache_file, $cache_file_meta, $output ) {
	$meta = wp_json_encode( array( 'headers' => $output['headers'] ), JSON_UNESCAPED_SLASHES );

	if ( ! jetpack_boost_page_optimize_cache_has_room( dirname( $cache_file ) . '/page-optimize-cache-*', strlen( $output['content'] ) + strlen( $meta ) ) ) {
		return;
	}

	// Headers go first: a cached response served without them has no content type.
	if ( jetpack_boost_page_optimize_write_cache_file( $cache_file_meta, $meta ) ) {
		jetpack_boost_page_optimize_write_cache_file( $cache_file, $output['content'] );
	}
}

/**
 * Collapse repeated slashes and `/./` segments in $path, then strip $parent_path from its start.
 */
function jetpack_boost_strip_parent_path( $parent_path, $path ) {
	$trimmed_parent = ltrim( $parent_path, '/' );
	// realpath() accepts `/./` when PAGE_OPTIMIZE_CONCAT_BASE_DIR is defined, and this path is copied into every rewritten url().
	$trimmed_path = ltrim( rtrim( preg_replace( '#/(?:\./|/)+#', '/', $path . '/' ), '/' ), '/' );

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
	$concat_max_files = jetpack_boost_minify_concat_max_files();
	$concat_unique    = true;

	// Main
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? $utils->unslash( $_SERVER['REQUEST_URI'] ) : '';

	$args = jetpack_boost_page_optimize_get_issued_list( jetpack_boost_page_optimize_get_request_list( $request_uri ) )->get_paths();

	// args contain something like array( '/foo/bar.css', '/foo1/bar/baz.css' )
	if ( 0 === count( $args ) || count( $args ) > $concat_max_files ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	jetpack_boost_page_optimize_check_files_size( $args );

	// If we're in a subdirectory context, use that as the root.
	// We can't assume that the root serves the same content as the subdir.
	$subdir_path_prefix = jetpack_boost_page_optimize_get_subdir_prefix( $request_uri );

	$last_modified = 0;
	$pre_output    = '';
	$output        = '';
	$total_bytes   = 0;
	$limits        = jetpack_boost_page_optimize_limits();

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

		$total_bytes += $stat['size'];
		if ( $total_bytes > $limits['files_read'] ) {
			jetpack_boost_page_optimize_status_exit( 400 );
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

			// Rewriting URLs can grow a stylesheet past its file size, so check the output limit before minifying.
			jetpack_boost_page_optimize_check_output_size( strlen( $pre_output ) + strlen( $output ) + strlen( $buf ) );

			// If filename indicates it's already minified, don't minify it again.
			if ( ! jetpack_boost_page_optimize_is_already_minified( $fullpath ) ) {
				// Minify CSS.
				$buf = Minify::css( $buf );
			}
			$output .= "$buf";
		} else {
			// If filename indicates it's already minified, don't minify it again.
			if ( ! jetpack_boost_page_optimize_is_already_minified( $fullpath ) ) {
				// Minify JS
				$buf = Minify::js( $buf );
			}

			$output .= "$buf;\n";
		}

		jetpack_boost_page_optimize_check_output_size( strlen( $pre_output ) + strlen( $output ) );
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

/**
 * Get the file list named by a _jb_static request.
 *
 * @param string $request_uri The request URI.
 *
 * @return string The list, as it appears after the two question marks.
 */
function jetpack_boost_page_optimize_get_request_list( $request_uri ) {
	$use_wp = defined( 'JETPACK_BOOST_CONCAT_USE_WP' ) && JETPACK_BOOST_CONCAT_USE_WP;
	$utils  = new Utils( $use_wp );

	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
	$method = isset( $_SERVER['REQUEST_METHOD'] ) ? $utils->unslash( $_SERVER['REQUEST_METHOD'] ) : 'GET';
	if ( ! in_array( $method, array( 'GET', 'HEAD' ), true ) ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	// Ensure the path follows one of these forms:
	// /_jb_static/??777873a36e
	// -- or, on a page cached before Boost stored its lists --
	// /_jb_static/??/foo/bar.css,/foo1/bar/baz.css?m=293847g
	// -- or --
	// /_jb_static/??-eJzTT8vP109KLNJLLi7W0QdyDEE8IK4CiVjn2hpZGluYmKcDABRMDPM=
	$query = $utils->parse_url( $request_uri, PHP_URL_QUERY );
	if ( ! $query || ! str_contains( $query, '?' ) ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	return substr( $query, strpos( $query, '?' ) + 1 );
}

/**
 * Get the stored list a request names, either by its ID or by the older form of the same list.
 * Any list the site has not stored is refused.
 *
 * @param string $list The list, as it appears in the request.
 *
 * @return File_Paths
 */
function jetpack_boost_page_optimize_get_issued_list( $list ) {
	if ( strlen( $list ) > jetpack_boost_page_optimize_limits()['encoded_list'] ) {
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	if ( File_Paths::is_id( $list ) ) {
		$issued = File_Paths::get_issued( $list );
		if ( ! $issued ) {
			jetpack_boost_page_optimize_status_exit( 404 );
		}
	} else {
		$issued = jetpack_boost_page_optimize_find_older_list( jetpack_boost_page_optimize_decode_older_list( $list ) );
		if ( ! $issued ) {
			jetpack_boost_page_optimize_status_exit( 400 );
		}
	}

	if ( ! is_array( $issued->get_paths() ) ) {
		// Invalid data, abort!
		jetpack_boost_page_optimize_status_exit( 400 );
	}

	return $issued;
}

/**
 * Decode a list from the URL forms Boost issued before it stored its lists.
 *
 * @param string $list The list, as it appears in the request.
 *
 * @return string[] The listed file paths.
 */
function jetpack_boost_page_optimize_decode_older_list( $list ) {
	$limits = jetpack_boost_page_optimize_limits();

	// It's a base64 encoded list of file path.
	// e.g.: /_jb_static/??-eJzTT8vP109KLNJLLi7W0QdyDEE8IK4CiVjn2hpZGluYmKcDABRMDPM=
	if ( str_starts_with( $list, '-' ) ) {

		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		$list = @gzuncompress( base64_decode( substr( $list, 1 ) ), $limits['decoded_list'] );
		// gzuncompress() can return more than the length it is given, so check the result too.
		if ( false === $list || strlen( $list ) > $limits['decoded_list'] ) {
			jetpack_boost_page_optimize_status_exit( 400 );
		}
	}

	// It's an unencoded comma-separated list of file paths.
	// /foo/bar.css,/foo1/bar/baz.css?m=293847g
	$version_string_pos = strpos( $list, '?' );
	if ( false !== $version_string_pos ) {
		$list = substr( $list, 0, $version_string_pos );
	}
	// /foo/bar.css,/foo1/bar/baz.css
	// Split no further than one past the file limit: no stored list is that long, so a longer list is refused.
	return explode( ',', $list, min( jetpack_boost_minify_concat_max_files(), PHP_INT_MAX - 1 ) + 1 );
}

/**
 * Find the stored list that holds the same files as a list from an older URL.
 *
 * @param string[] $paths The listed file paths.
 *
 * @return File_Paths|null
 */
function jetpack_boost_page_optimize_find_older_list( $paths ) {
	$mtime = 0;

	foreach ( $paths as $uri ) {
		$fullpath = jetpack_boost_page_optimize_get_path( $uri );
		if ( ! file_exists( $fullpath ) ) {
			jetpack_boost_page_optimize_status_exit( 404 );
		}
		$mtime = max( $mtime, (int) filemtime( $fullpath ) );
	}

	return File_Paths::find_issued( $paths, $mtime, jetpack_boost_minify_cache_buster() );
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
