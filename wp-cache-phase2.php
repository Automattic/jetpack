<?php

function wp_cache_phase2() {
	global $wp_cache_gzip_encoding, $super_cache_enabled, $cache_rebuild_files, $cache_enabled, $wp_cache_gmt_offset, $wp_cache_blog_charset;

	if ( $cache_enabled == false ) {
		wp_cache_debug( "Caching disabled! quiting!", 1 );
		return false;
	}

	wp_cache_debug( 'In WP Cache Phase 2', 5 );

	$wp_cache_gmt_offset = get_option( 'gmt_offset' ); // caching for later use when wpdb is gone. http://wordpress.org/support/topic/224349
	$wp_cache_blog_charset = get_option( 'blog_charset' );

	wp_cache_mutex_init();
	if(function_exists('add_action') && ( !defined( 'WPLOCKDOWN' ) || ( defined( 'WPLOCKDOWN' ) && constant( 'WPLOCKDOWN' ) == '0' ) ) ) {
		wp_cache_debug( 'Setting up WordPress actions', 5 );

		add_action( 'template_redirect', 'wp_super_cache_query_vars' );

		// Post ID is received
		add_action('wp_trash_post', 'wp_cache_post_edit', 0);
		add_action('publish_post', 'wp_cache_post_edit', 0);
		add_action('edit_post', 'wp_cache_post_change', 0); // leaving a comment called edit_post
		add_action('delete_post', 'wp_cache_post_edit', 0);
		add_action('publish_phone', 'wp_cache_post_edit', 0);
		// Coment ID is received
		add_action('trackback_post', 'wp_cache_get_postid_from_comment', 99);
		add_action('pingback_post', 'wp_cache_get_postid_from_comment', 99);
		add_action('comment_post', 'wp_cache_get_postid_from_comment', 99);
		add_action('edit_comment', 'wp_cache_get_postid_from_comment', 99);
		add_action('wp_set_comment_status', 'wp_cache_get_postid_from_comment', 99, 2);
		// No post_id is available
		add_action('switch_theme', 'wp_cache_no_postid', 99);
		add_action('edit_user_profile_update', 'wp_cache_no_postid', 99);
		add_action( 'wp_update_nav_menu', 'wp_cache_clear_cache_on_menu' );
		add_action('wp_cache_gc','wp_cache_gc_cron');
		add_action( 'clean_post_cache', 'wp_cache_post_edit' );
		add_filter( 'supercache_filename_str', 'wp_cache_check_mobile' );
		add_action( 'wp_cache_gc_watcher', 'wp_cache_gc_watcher' );
		add_action( 'transition_post_status', 'wpsc_post_transition', 10, 3 );

		do_cacheaction( 'add_cacheaction' );
	}

	if ( is_admin() ) {
		wp_cache_debug( 'Not caching wp-admin requests.', 5 );
		return false;
	}

	if ( !empty( $_GET ) && !defined( "DOING_CRON" ) ) {
		wp_cache_debug( 'Supercache caching disabled. Only using wp-cache. Non empty GET request. ' . json_encode( $_GET ), 5 );
		$super_cache_enabled = false;
	}

	if($wp_cache_gzip_encoding)
		header('Vary: Accept-Encoding, Cookie');
	else
		header('Vary: Cookie');
	ob_start( 'wp_cache_ob_callback' );
	wp_cache_debug( 'Created output buffer', 4 );

	// restore old supercache file temporarily
	if ( ( $_SERVER["REQUEST_METHOD"] != 'POST' && empty( $_POST ) ) && $super_cache_enabled && $cache_rebuild_files ) {
		$user_info = wp_cache_get_cookies_values();
		$do_cache = apply_filters( 'do_createsupercache', $user_info );
		if( $user_info == '' || $do_cache === true )
			wpcache_do_rebuild( get_current_url_supercache_dir() );
	}

	schedule_wp_gc();
}

function wpcache_do_rebuild( $dir ) {
	global $do_rebuild_list, $cache_path, $wpsc_file_mtimes;
	wp_cache_debug( "wpcache_do_rebuild: doing rebuild for $dir" );

	if ( !is_dir( $dir ) ) {
		wp_cache_debug( "wpcache_do_rebuild: exiting as directory is not a directory: $dir" );
		return false;
	}

	$dir = wpsc_get_realpath( $dir );
	if ( ! $dir ) {
		wp_cache_debug( "wpcache_do_rebuild: exiting as directory does not exist." );
		return false;
	}

	if ( isset( $do_rebuild_list[ $dir ] ) ) {
		wp_cache_debug( "wpcache_do_rebuild: directory already rebuilt: $dir" );
		return false;
	}

	$protected = wpsc_get_protected_directories();
	foreach( $protected as $id => $directory ) {
		$protected[ $id ] = wpsc_get_realpath( $directory );
	}

	if ( ! wpsc_is_in_cache_directory( $dir ) ) {
		wp_cache_debug( "wpcache_do_rebuild: exiting as directory not in cache_path: $dir" );
		return false;
	}

	if ( in_array( $dir, $protected ) ) {
		wp_cache_debug( "wpcache_do_rebuild: exiting as directory is protected: $dir" );
		return false;
	}

	if ( !is_dir( $dir ) ) {
		wp_cache_debug( "wpcache_do_rebuild: exiting as directory is not a directory: $dir" );
		return false;
	}

	$dh = @opendir( $dir );
	if ( false == $dh ) {
		wp_cache_debug( "wpcache_do_rebuild: exiting as could not open directory for reading: $dir" );
		return false;
	}

	$dir = trailingslashit( $dir );
	$wpsc_file_mtimes = array();
	while ( ( $file = readdir( $dh ) ) !== false ) {
		if ( $file == '.' || $file == '..' || false == is_file( $dir . $file ) ) {
			continue;
		}

		$cache_file = $dir . $file;
		// if the file is index.html.needs-rebuild and index.html doesn't exist and
		// if the rebuild file is less than 10 seconds old then remove the ".needs-rebuild"
		// extension so index.html can be served to other visitors temporarily
		// until index.html is generated again at the end of this page.

		if ( substr( $cache_file, -14 ) != '.needs-rebuild' ) {
			wp_cache_debug( "wpcache_do_rebuild: base file found: $cache_file" );
			continue;
		}

		wp_cache_debug( "wpcache_do_rebuild: found rebuild file: $cache_file" );

		if ( @file_exists( substr( $cache_file, 0, -14 ) ) ) {
			wp_cache_debug( "wpcache_do_rebuild: rebuild file deleted because base file found: $cache_file" );
			@unlink( $cache_file ); // delete the rebuild file because index.html already exists
			continue;
		}

		$mtime = @filemtime( $cache_file );
		if ( $mtime && ( time() - $mtime ) < 10 ) {
			wp_cache_debug( "wpcache_do_rebuild: rebuild file is new: $cache_file" );
			$base_file = substr( $cache_file, 0, -14 );
			if ( false == @rename( $cache_file, $base_file ) ) { // rename the rebuild file
				@unlink( $cache_file );
				wp_cache_debug( "wpcache_do_rebuild: rebuild file rename failed. Deleted rebuild file: $cache_file" );
			} else {
				$do_rebuild_list[ $dir ] = 1;
				$wpsc_file_mtimes[ $base_file ] = $mtime;
				wp_cache_debug( "wpcache_do_rebuild: rebuild file renamed: $base_file" );
			}
		} else {
			wp_cache_debug( "wpcache_do_rebuild: rebuild file deleted because it's too old: $cache_file" );
			@unlink( $cache_file ); // delete the rebuild file because index.html already exists
		}
	}
}

function wpcache_logged_in_message() {
	echo '<!-- WP Super Cache did not cache this page because you are logged in and "Don\'t cache pages for logged in users" is enabled. -->';
}

if ( !function_exists( 'wp_cache_user_agent_is_rejected' ) ) {
	function wp_cache_user_agent_is_rejected() {
		global $cache_rejected_user_agent;

		if (!function_exists('apache_request_headers')) return false;
		$headers = apache_request_headers();
		if (!isset($headers["User-Agent"])) return false;
		if ( false == is_array( $cache_rejected_user_agent ) )
			return false;
		foreach ($cache_rejected_user_agent as $expr) {
			if (strlen($expr) > 0 && stristr($headers["User-Agent"], $expr))
				return true;
		}
		return false;
	}
}

function wp_cache_get_response_headers() {
	static $known_headers = array(
						'Access-Control-Allow-Origin',
						'Accept-Ranges',
						'Age',
						'Allow',
						'Cache-Control',
						'Connection',
						'Content-Encoding',
						'Content-Language',
						'Content-Length',
						'Content-Location',
						'Content-MD5',
						'Content-Disposition',
						'Content-Range',
						'Content-Type',
						'Date',
						'ETag',
						'Expires',
						'Last-Modified',
						'Link',
						'Location',
						'P3P',
						'Pragma',
						'Proxy-Authenticate',
						"Referrer-Policy",
						'Refresh',
						'Retry-After',
						'Server',
						'Status',
						'Strict-Transport-Security',
						'Trailer',
						'Transfer-Encoding',
						'Upgrade',
						'Vary',
						'Via',
						'Warning',
						'WWW-Authenticate',
						'X-Frame-Options',
						'Public-Key-Pins',
						'X-XSS-Protection',
						'Content-Security-Policy',
						"X-Pingback",
						'X-Content-Security-Policy',
						'X-WebKit-CSP',
						'X-Content-Type-Options',
						'X-Powered-By',
						'X-UA-Compatible',
						'X-Robots-Tag',
					);

	$known_headers = apply_filters( 'wpsc_known_headers', $known_headers );

	if ( ! isset( $known_headers[ 'age' ] ) ) {
		$known_headers = array_map( 'strtolower', $known_headers );
	}

	$headers = array();
	if ( function_exists( 'apache_response_headers' ) ) {
		$headers = apache_response_headers();
	}
	if ( empty( $headers ) && function_exists( 'headers_list' ) ) {
		$headers = array();
		foreach( headers_list() as $hdr ) {
			$header_parts = explode( ':', $hdr, 2 );
			$header_name  = isset( $header_parts[0] ) ? trim( $header_parts[0] ) : '';
			$header_value = isset( $header_parts[1] ) ? trim( $header_parts[1] ) : '';

			$headers[$header_name] = $header_value;
		}
	}

	foreach( $headers as $key => $value ) {
		if ( ! in_array( strtolower( $key ), $known_headers ) ) {
			unset( $headers[ $key ] );
		}
	}

	return $headers;
}

function wp_cache_is_rejected($uri) {
	global $cache_rejected_uri;

	$auto_rejected = array( '/wp-admin/', 'xmlrpc.php', 'wp-app.php' );
	foreach( $auto_rejected as $u ) {
		if( strstr( $uri, $u ) )
			return true; // we don't allow caching of wp-admin for security reasons
	}
	if ( false == is_array( $cache_rejected_uri ) )
		return false;
	foreach ( $cache_rejected_uri as $expr ) {
		if( $expr != '' && @preg_match( "~$expr~", $uri ) )
			return true;
	}
	return false;
}

function wp_cache_mutex_init() {
	global $mutex, $wp_cache_mutex_disabled, $use_flock, $blog_cache_dir, $mutex_filename, $sem_id;

	if ( defined( 'WPSC_DISABLE_LOCKING' ) || ( isset( $wp_cache_mutex_disabled ) && $wp_cache_mutex_disabled ) )
		return true;

	if( !is_bool( $use_flock ) ) {
		if(function_exists('sem_get'))
			$use_flock = false;
		else
			$use_flock = true;
	}

	$mutex = false;
	if ($use_flock )  {
		setup_blog_cache_dir();
		wp_cache_debug( "Created mutex lock on filename: {$blog_cache_dir}{$mutex_filename}", 5 );
		$mutex = @fopen( $blog_cache_dir . $mutex_filename, 'w' );
	} else {
		wp_cache_debug( "Created mutex lock on semaphore: {$sem_id}", 5 );
		$mutex = @sem_get( $sem_id, 1, 0666, 1 );
	}
}

function wp_cache_writers_entry() {
	global $mutex, $wp_cache_mutex_disabled, $use_flock;

	if ( defined( 'WPSC_DISABLE_LOCKING' ) || ( isset( $wp_cache_mutex_disabled ) && $wp_cache_mutex_disabled ) )
		return true;

	if( !$mutex ) {
		wp_cache_debug( "(writers entry) mutex lock not created. not caching.", 2 );
		return false;
	}

	if ( $use_flock ) {
		wp_cache_debug( "grabbing lock using flock()", 5 );
		flock($mutex,  LOCK_EX);
	} else {
		wp_cache_debug( "grabbing lock using sem_acquire()", 5 );
		@sem_acquire($mutex);
	}

	return true;
}

function wp_cache_writers_exit() {
	global $mutex, $wp_cache_mutex_disabled, $use_flock;

	if ( defined( 'WPSC_DISABLE_LOCKING' ) || ( isset( $wp_cache_mutex_disabled ) && $wp_cache_mutex_disabled ) )
		return true;

	if( !$mutex ) {
		wp_cache_debug( "(writers exit) mutex lock not created. not caching.", 2 );
		return false;
	}

	if ( $use_flock ) {
		wp_cache_debug( "releasing lock using flock()", 5 );
		flock( $mutex,  LOCK_UN );
	} else {
		wp_cache_debug( "releasing lock using sem_release() and sem_remove()", 5 );
		@sem_release( $mutex );
		if ( defined( "WPSC_REMOVE_SEMAPHORE" ) )
			@sem_remove( $mutex );
	}
}

function wp_super_cache_query_vars() {
	global $wp_super_cache_query;
	if ( is_search() )
		$wp_super_cache_query[ 'is_search' ] = 1;
	if ( is_page() )
		$wp_super_cache_query[ 'is_page' ] = 1;
	if ( is_archive() )
		$wp_super_cache_query[ 'is_archive' ] = 1;
	if ( is_tag() )
		$wp_super_cache_query[ 'is_tag' ] = 1;
	if ( is_single() )
		$wp_super_cache_query[ 'is_single' ] = 1;
	if ( is_category() )
		$wp_super_cache_query[ 'is_category' ] = 1;
	if ( is_front_page() )
		$wp_super_cache_query[ 'is_front_page' ] = 1;
	if ( is_home() )
		$wp_super_cache_query[ 'is_home' ] = 1;
	if ( is_author() )
		$wp_super_cache_query[ 'is_author' ] = 1;
	if ( is_feed() || ( method_exists( $GLOBALS['wp_query'], 'get') && ( get_query_var( 'sitemap' ) || get_query_var( 'xsl' ) || get_query_var( 'xml_sitemap' ) ) ) )
		$wp_super_cache_query[ 'is_feed' ] = 1;
	if ( is_404() )
		$wp_super_cache_query = array( 'is_404' => 1 );

	return $wp_super_cache_query;
}

function wpsc_is_fatal_error() {
	global $wp_super_cache_query;

	if ( null === ( $error = error_get_last() ) ) {
		return false;
	}

	if ( $error['type'] & ( E_ERROR | E_CORE_ERROR | E_PARSE | E_COMPILE_ERROR | E_USER_ERROR ) ) {
		$wp_super_cache_query[ 'is_fatal_error' ] = 1;
		return true;
	}

	return false;
}

function wp_cache_ob_callback( $buffer ) {
	global $wp_cache_pages, $wp_query, $wp_super_cache_query, $cache_acceptable_files, $wp_cache_no_cache_for_get, $wp_cache_object_cache, $wp_cache_request_uri, $do_rebuild_list, $wpsc_file_mtimes, $wpsc_save_headers, $super_cache_enabled;
	$buffer = apply_filters( 'wp_cache_ob_callback_filter', $buffer );

	$script = basename($_SERVER['PHP_SELF']);

	// All the things that can stop a page being cached
	$cache_this_page = true;

	if ( wpsc_is_fatal_error() ) {
		$cache_this_page = false;
		wp_cache_debug( 'wp_cache_ob_callback: PHP Fatal error occurred. Not caching incomplete page.' );
	} elseif ( empty( $wp_super_cache_query ) && !empty( $buffer ) && is_object( $wp_query ) ) {
		$wp_super_cache_query = wp_super_cache_query_vars();
	}

	if ( empty( $wp_super_cache_query ) && function_exists( 'apply_filter' ) && apply_filter( 'wpsc_only_cache_known_pages', 1 ) ) {
		$cache_this_page = false;
		wp_cache_debug( 'wp_cache_ob_callback: wp_super_cache_query is empty. Not caching unknown page type. Return 0 to the wpsc_only_cache_known_pages filter to cache this page.' );
	} elseif ( defined( 'DONOTCACHEPAGE' ) ) {
		wp_cache_debug( 'DONOTCACHEPAGE defined. Caching disabled.', 2 );
		$cache_this_page = false;
	} elseif ( $wp_cache_no_cache_for_get && false == empty( $_GET ) && false == defined( 'DOING_CRON' ) ) {
		wp_cache_debug( "Non empty GET request. Caching disabled on settings page. " . json_encode( $_GET ), 1 );
		$cache_this_page = false;
	} elseif ( $_SERVER["REQUEST_METHOD"] == 'POST' || !empty( $_POST ) || get_option( 'gzipcompression' ) ) {
		wp_cache_debug( 'Not caching POST request.', 5 );
		$cache_this_page = false;
	} elseif ( $_SERVER["REQUEST_METHOD"] == 'PUT' ) {
		wp_cache_debug( 'Not caching PUT request.', 5 );
		$cache_this_page = false;
	} elseif ( $_SERVER["REQUEST_METHOD"] == 'DELETE' ) {
		wp_cache_debug( 'Not caching DELETE request.', 5 );
		$cache_this_page = false;
	} elseif ( $wp_cache_object_cache && !empty( $_GET ) ) {
		wp_cache_debug( 'Not caching GET request while object cache storage enabled.', 5 );
		$cache_this_page = false;
	} elseif ( isset( $_GET[ 'preview' ] ) ) {
		wp_cache_debug( 'Not caching preview post.', 2 );
		$cache_this_page = false;
	} elseif ( !in_array($script, $cache_acceptable_files) && wp_cache_is_rejected( $wp_cache_request_uri ) ) {
		wp_cache_debug( 'URI rejected. Not Caching', 2 );
		$cache_this_page = false;
	} elseif ( wp_cache_user_agent_is_rejected() ) {
		wp_cache_debug( "USER AGENT ({$_SERVER[ 'HTTP_USER_AGENT' ]}) rejected. Not Caching", 4 );
		$cache_this_page = false;
	} elseif ( isset( $wp_cache_pages[ 'single' ] ) && $wp_cache_pages[ 'single' ] == 1 && isset( $wp_super_cache_query[ 'is_single' ] ) ) {
		wp_cache_debug( 'Not caching single post.', 2 );
		$cache_this_page = false;
	} elseif ( isset( $wp_cache_pages[ 'pages' ] ) && $wp_cache_pages[ 'pages' ] == 1 && isset( $wp_super_cache_query[ 'is_page' ] ) ) {
		wp_cache_debug( 'Not caching single page.', 2 );
		$cache_this_page = false;
	} elseif ( isset( $wp_cache_pages[ 'archives' ] ) && $wp_cache_pages[ 'archives' ] == 1 && isset( $wp_super_cache_query[ 'is_archive' ] ) ) {
		wp_cache_debug( 'Not caching archive page.', 2 );
		$cache_this_page = false;
	} elseif ( isset( $wp_cache_pages[ 'tag' ] ) && $wp_cache_pages[ 'tag' ] == 1 && isset( $wp_super_cache_query[ 'is_tag' ] ) ) {
		wp_cache_debug( 'Not caching tag page.', 2 );
		$cache_this_page = false;
	} elseif ( isset( $wp_cache_pages[ 'category' ] ) && $wp_cache_pages[ 'category' ] == 1 && isset( $wp_super_cache_query[ 'is_category' ] ) ) {
		wp_cache_debug( 'Not caching category page.', 2 );
		$cache_this_page = false;
	} elseif ( isset( $wp_cache_pages[ 'frontpage' ] ) && $wp_cache_pages[ 'frontpage' ] == 1 && isset( $wp_super_cache_query[ 'is_front_page' ] ) ) {
		wp_cache_debug( 'Not caching front page.', 2 );
		$cache_this_page = false;
	} elseif ( isset( $wp_cache_pages[ 'home' ] ) && $wp_cache_pages[ 'home' ] == 1 && isset( $wp_super_cache_query[ 'is_home' ] ) ) {
		wp_cache_debug( 'Not caching home page.', 2 );
		$cache_this_page = false;
	} elseif ( isset( $wp_cache_pages[ 'search' ] ) && $wp_cache_pages[ 'search' ] == 1 && isset( $wp_super_cache_query[ 'is_search' ] ) ) {
		wp_cache_debug( 'Not caching search page.', 2 );
		$cache_this_page = false;
	} elseif ( isset( $wp_cache_pages[ 'author' ] ) && $wp_cache_pages[ 'author' ] == 1 && isset( $wp_super_cache_query[ 'is_author' ] ) ) {
		wp_cache_debug( 'Not caching author page.', 2 );
		$cache_this_page = false;
	} elseif ( isset( $wp_cache_pages[ 'feed' ] ) && $wp_cache_pages[ 'feed' ] == 1 && isset( $wp_super_cache_query[ 'is_feed' ] ) ) {
		wp_cache_debug( 'Not caching feed.', 2 );
		$cache_this_page = false;
	}

	if ( isset( $wpsc_save_headers ) && $wpsc_save_headers )
		$super_cache_enabled = false; // use standard caching to record headers

	if ( $cache_this_page ) {

		wp_cache_debug( 'Output buffer callback', 4 );

		$buffer = wp_cache_get_ob( $buffer );
		wp_cache_shutdown_callback();

		if ( isset( $wpsc_file_mtimes ) && is_array( $wpsc_file_mtimes ) && !empty( $wpsc_file_mtimes ) ) {
			foreach( $wpsc_file_mtimes as $cache_file => $old_mtime ) {
				if ( $old_mtime == @filemtime( $cache_file ) ) {
					wp_cache_debug( "wp_cache_ob_callback deleting unmodified rebuilt cache file: $cache_file" );
					if ( wp_cache_confirm_delete( $cache_file ) ) {
						@unlink( $cache_file );
					}
				}
			}
		}
		return $buffer;
	} else {
		if ( is_array( $do_rebuild_list ) && false == empty( $do_rebuild_list ) ) {
			foreach( $do_rebuild_list as $dir => $n ) {
				if ( wp_cache_confirm_delete( $dir ) ) {
					wp_cache_debug( 'wp_cache_ob_callback clearing rebuilt files in ' . $dir );
					wpsc_delete_files( $dir );
				}
			}
		}
		return wp_cache_maybe_dynamic( $buffer );
	}
}

function wp_cache_append_tag( &$buffer ) {
	global $wp_cache_gmt_offset, $wp_super_cache_comments;
	global $cache_enabled, $super_cache_enabled;

	if ( false == isset( $wp_super_cache_comments ) )
		$wp_super_cache_comments = 1;

	if ( $wp_super_cache_comments == 0 )
		return false;

	$timestamp = gmdate('Y-m-d H:i:s', (time() + ( $wp_cache_gmt_offset * 3600)));
	if ( $cache_enabled || $super_cache_enabled ) {
		$msg = "\n<!-- Cached page generated by WP-Super-Cache on $timestamp -->\n";
	} else {
		$msg = "\n<!-- Live page served on $timestamp -->\n";
	}

	if ( strpos( $buffer, '<html' ) === false ) {
		wp_cache_debug( site_url( $_SERVER[ 'REQUEST_URI' ] ) . " - " . $msg );
		return false;
	}

	$buffer .= $msg;
}

function wp_cache_add_to_buffer( &$buffer, $text ) {
	global $wp_super_cache_comments;

	if ( false == isset( $wp_super_cache_comments ) )
		$wp_super_cache_comments = 1;

	if ( $wp_super_cache_comments == 0 )
		return false;

	if ( strpos( $buffer, '<html' ) === false ) {
		wp_cache_debug( site_url( $_SERVER[ 'REQUEST_URI' ] ) . " - " . $text );
		return false;
	}

	$buffer .= "\n<!-- $text -->";
}

/*
 * If dynamic caching is enabled then run buffer through wpsc_cachedata filter before returning it.
 * or we'll return template tags to visitors.
 */
function wp_cache_maybe_dynamic( &$buffer ) {
	global $wp_cache_mfunc_enabled;
	if ( $wp_cache_mfunc_enabled == 1 && do_cacheaction( 'wpsc_cachedata_safety', 0 ) === 1 ) {
		wp_cache_debug( 'wp_cache_maybe_dynamic: filtered $buffer through wpsc_cachedata', 4 );
		return do_cacheaction( 'wpsc_cachedata', $buffer ); // dynamic content for display
	} else {
		wp_cache_debug( 'wp_cache_maybe_dynamic: returned $buffer', 4 );
		return $buffer;
	}
}

function wp_cache_get_ob(&$buffer) {
	global $cache_enabled, $cache_path, $cache_filename, $wp_start_time, $supercachedir;
	global $new_cache, $wp_cache_meta, $cache_compression, $wp_super_cache_query;
	global $wp_cache_gzip_encoding, $super_cache_enabled;
	global $wp_cache_404, $gzsize, $supercacheonly;
	global $blog_cache_dir, $wp_supercache_cache_list;
	global $wp_cache_not_logged_in, $wp_cache_object_cache, $cache_max_time;
	global $wp_cache_is_home, $wp_cache_front_page_checks, $wp_cache_mfunc_enabled;

	if ( isset( $wp_cache_mfunc_enabled ) == false )
		$wp_cache_mfunc_enabled = 0;

	$new_cache = true;
	$wp_cache_meta = array();

	/* Mode paranoic, check for closing tags
	 * we avoid caching incomplete files */
	if ( $buffer == '' ) {
		$new_cache = false;
		if ( isset( $GLOBALS[ 'wp_super_cache_debug' ] ) && $GLOBALS[ 'wp_super_cache_debug' ] ) {
			wp_cache_debug( "Buffer is blank. Output buffer may have been corrupted by another plugin or this is a redirected URL. Look for text 'ob_start' in the files of your plugins directory.", 2 );
			wp_cache_add_to_buffer( $buffer, "Page not cached by WP Super Cache. Blank Page. Check output buffer usage by plugins." );
		}
	}

	if ( $wp_cache_404 && false == apply_filters( 'wpsupercache_404', false ) ) {
		$new_cache = false;
		if ( isset( $GLOBALS[ 'wp_super_cache_debug' ] ) && $GLOBALS[ 'wp_super_cache_debug' ] ) {
			wp_cache_debug( "404 file not found not cached", 2 );
			wp_cache_add_to_buffer( $buffer, "Page not cached by WP Super Cache. 404." );
		}
	}

	if ( !preg_match( apply_filters( 'wp_cache_eof_tags', '/(<\/html>|<\/rss>|<\/feed>|<\/urlset|<\?xml)/i' ), $buffer ) ) {
		$new_cache = false;
		if( false === strpos( $_SERVER[ 'REQUEST_URI' ], 'robots.txt' ) ) {
			if ( isset( $GLOBALS[ 'wp_super_cache_debug' ] ) && $GLOBALS[ 'wp_super_cache_debug' ] ) {
				wp_cache_debug( "No closing html tag. Not caching.", 2 );
				wp_cache_add_to_buffer( $buffer, "Page not cached by WP Super Cache. No closing HTML tag. Check your theme." );
			}
		} else {
			wp_cache_debug( "robots.txt detected. Not caching.", 2 );
		}
	}
	
	if( !$new_cache )
		return wp_cache_maybe_dynamic( $buffer );

	$duration = wp_cache_microtime_diff($wp_start_time, microtime());
	$duration = sprintf("%0.3f", $duration);
	wp_cache_add_to_buffer( $buffer, "Dynamic page generated in $duration seconds." );

	if( !wp_cache_writers_entry() ) {
		wp_cache_add_to_buffer( $buffer, "Page not cached by WP Super Cache. Could not get mutex lock." );
		wp_cache_debug( "Could not get mutex lock. Not caching.", 1 );
		return wp_cache_maybe_dynamic( $buffer );
	}

	if ( $wp_cache_not_logged_in && isset( $wp_super_cache_query[ 'is_feed' ] ) ) {
		wp_cache_debug( "Feed detected. Writing wpcache cache files.", 5 );
		$wp_cache_not_logged_in = false;
	}

	$home_url = parse_url( trailingslashit( get_bloginfo( 'url' ) ) );

	$dir = get_current_url_supercache_dir();
	$supercachedir = $cache_path . 'supercache/' . preg_replace('/:.*$/', '',  $home_url[ 'host' ]);
	if ( ! empty( $_GET ) || isset( $wp_super_cache_query[ 'is_feed' ] ) || ( $super_cache_enabled == true && is_dir( substr( $supercachedir, 0, -1 ) . '.disabled' ) ) ) {
		wp_cache_debug( "Supercache disabled: GET or feed detected or disabled by config.", 2 );
		$super_cache_enabled = false;
	}

	$tmp_wpcache_filename = $cache_path . uniqid( mt_rand(), true ) . '.tmp';

	$supercacheonly = false;
	if( $super_cache_enabled ) {
		if ( wp_cache_get_cookies_values() == '' && empty( $_GET ) ) {
			wp_cache_debug( "Anonymous user detected. Only creating Supercache file.", 3 );
			$supercacheonly = true;
		}
	}

	$cache_error = '';
	if ( $wp_cache_not_logged_in && wp_cache_get_cookies_values() != '' ) {
		$super_cache_enabled = false;
		$cache_enabled = false;
		$cache_error = 'Not caching requests by known users. (See Advanced Settings page)';
		wp_cache_debug( 'Not caching for known user.', 5 );
	}

	if ( $wp_cache_object_cache ) { // half on mode when using the object cache
		if ( wp_cache_get_cookies_values() != '' ) {
			$cache_enabled = false;
			$cache_error = 'Known User and using object. Only anonymous users cached.';
		}
		$super_cache_enabled = false;
		$supercacheonly = false;
		wp_cache_init(); // PHP5 destroys objects during shutdown
	}

	if ( !$cache_enabled ) {
		wp_cache_debug( 'Cache is not enabled. Sending buffer to browser.', 5 );
		wp_cache_writers_exit();
		wp_cache_add_to_buffer( $buffer, "Page not cached by WP Super Cache. Check your settings page. $cache_error" );
		if ( $wp_cache_mfunc_enabled == 1 ) {
			global $wp_super_cache_late_init;
			if ( false == isset( $wp_super_cache_late_init ) || ( isset( $wp_super_cache_late_init ) && $wp_super_cache_late_init == 0 ) )
				wp_cache_add_to_buffer( $buffer, 'Super Cache dynamic page detected but $wp_super_cache_late_init not set. See the readme.txt for further details.' );
		}

		return wp_cache_maybe_dynamic( $buffer );
	}

	if( @is_dir( $dir ) == false )
		@wp_mkdir_p( $dir );
	$dir = wpsc_get_realpath( $dir );

	if ( ! $dir ) {
		wp_cache_debug( "wp_cache_get_ob: not caching as directory does not exist." );
		return $buffer;
	}

	$dir = trailingslashit( $dir );

	if ( ! wpsc_is_in_cache_directory( $dir ) ) {
		wp_cache_debug( "wp_cache_get_ob: not caching as directory is not in cache_path: $dir" );
		return $buffer;
	}

	$fr = $fr2 = $gz = false;
	// Open wp-cache cache file
	if ( false == $wp_cache_object_cache ) {
		if ( !$supercacheonly ) {
			$fr = @fopen($tmp_wpcache_filename, 'w');
			if (!$fr) {
				wp_cache_debug( "Error. Supercache could not write to " . str_replace( ABSPATH, '', $cache_path ) . $cache_filename, 1 );
				wp_cache_add_to_buffer( $buffer, "File not cached! Super Cache Couldn't write to: " . str_replace( ABSPATH, '', $cache_path ) . $cache_filename );
				wp_cache_writers_exit();
				return wp_cache_maybe_dynamic( $buffer );
			}
		} else {
			$user_info = wp_cache_get_cookies_values();
			$do_cache = apply_filters( 'do_createsupercache', $user_info );
			if ( $super_cache_enabled && ( $user_info == '' || $do_cache === true ) ) {

				$cache_fname = $dir . supercache_filename();
				$tmp_cache_filename = $dir . uniqid( mt_rand(), true ) . '.tmp';
				$fr2 = @fopen( $tmp_cache_filename, 'w' );
				if ( !$fr2 ) {
					wp_cache_debug( "Error. Supercache could not write to " . str_replace( ABSPATH, '', $tmp_cache_filename ), 1 );
					wp_cache_add_to_buffer( $buffer, "File not cached! Super Cache Couldn't write to: " . str_replace( ABSPATH, '', $tmp_cache_filename ) );
					@fclose( $fr );
					@unlink( $tmp_wpcache_filename );
					wp_cache_writers_exit();
					return wp_cache_maybe_dynamic( $buffer );
				} elseif ( ( !isset( $wp_cache_mfunc_enabled ) || $wp_cache_mfunc_enabled == 0 ) && $cache_compression ) { // don't want to store compressed files if using dynamic content
					$gz = @fopen( $tmp_cache_filename . ".gz", 'w');
					if (!$gz) {
						wp_cache_debug( "Error. Supercache could not write to " . str_replace( ABSPATH, '', $tmp_cache_filename ) . ".gz", 1 );
						wp_cache_add_to_buffer( $buffer, "File not cached! Super Cache Couldn't write to: " . str_replace( ABSPATH, '', $tmp_cache_filename ) . ".gz" );
						@fclose( $fr );
						@unlink( $tmp_wpcache_filename );
						@fclose( $fr2 );
						@unlink( $tmp_cache_filename );
						wp_cache_writers_exit();
						return wp_cache_maybe_dynamic( $buffer );
					}
				}
			}
		}
	}

	$added_cache = 0;
	$oc_key = get_oc_key();
	$buffer = apply_filters( 'wpsupercache_buffer', $buffer );
	wp_cache_append_tag( $buffer );

	/*
	 * Dynamic content enabled: write the buffer to a file and then process any templates found using
	 * the wpsc_cachedata filter. Buffer is then returned to the visitor.
	 */
	if ( $wp_cache_mfunc_enabled == 1 ) {
		if ( preg_match( '/<!--mclude|<!--mfunc|<!--dynamic-cached-content-->/', $buffer ) ) { //Dynamic content
			wp_cache_debug( "mfunc/mclude/dynamic-cached-content tags have been retired. Please update your theme. See docs for updates." );
			wp_cache_add_to_buffer( $buffer, "Warning! Obsolete mfunc/mclude/dynamic-cached-content tags found. Please update your theme. See http://ocaoimh.ie/y/5b for more information." );
		}

		global $wp_super_cache_late_init;
		if ( false == isset( $wp_super_cache_late_init ) || ( isset( $wp_super_cache_late_init ) && $wp_super_cache_late_init == 0 ) )
			wp_cache_add_to_buffer( $buffer, 'Super Cache dynamic page detected but late init not set. See the readme.txt for further details.' );

		if ( $fr ) { // wpcache caching
			wp_cache_debug( "Writing dynamic buffer to wpcache file." );
			wp_cache_add_to_buffer( $buffer, "Dynamic WPCache Super Cache" );
			fputs( $fr, '<?php die(); ?>' . $buffer );
		} elseif ( isset( $fr2 ) ) { // supercache active
			wp_cache_debug( "Writing dynamic buffer to supercache file." );
			wp_cache_add_to_buffer( $buffer, "Dynamic Super Cache" );
			fputs( $fr2, $buffer );
		} elseif ( true == $wp_cache_object_cache ) {
			wp_cache_set( $oc_key, $buffer, 'supercache', $cache_max_time );
		}
		$wp_cache_meta[ 'dynamic' ] = true;
		if ( do_cacheaction( 'wpsc_cachedata_safety', 0 ) === 1 )
			$buffer = do_cacheaction( 'wpsc_cachedata', $buffer ); // dynamic content for display

		if ( $cache_compression && $wp_cache_gzip_encoding ) {
			wp_cache_debug( "Gzipping dynamic buffer for display.", 5 );
			wp_cache_add_to_buffer( $buffer, "Compression = gzip" );
			$gzdata = gzencode( $buffer, 6, FORCE_GZIP );
			$gzsize = function_exists( 'mb_strlen' ) ? mb_strlen( $gzdata, '8bit' ) : strlen( $gzdata );
		}
	} else {
		if ( $gz || $wp_cache_gzip_encoding ) {
			wp_cache_debug( "Gzipping buffer.", 5 );
			wp_cache_add_to_buffer( $buffer, "Compression = gzip" );
			$gzdata = gzencode( $buffer, 6, FORCE_GZIP );
			$gzsize = function_exists( 'mb_strlen' ) ? mb_strlen( $gzdata, '8bit' ) : strlen( $gzdata );

			$wp_cache_meta[ 'headers' ][ 'Content-Encoding' ] = 'Content-Encoding: ' . $wp_cache_gzip_encoding;
			$wp_cache_meta[ 'headers' ][ 'Vary' ] = 'Vary: Accept-Encoding, Cookie';
			// Return uncompressed data & store compressed for later use
			if ( $fr ) {
				wp_cache_debug( "Writing gzipped buffer to wp-cache cache file.", 5 );
				fputs($fr, '<?php die(); ?>' . $gzdata);
			} elseif ( $cache_enabled && $wp_cache_object_cache ) {
				wp_cache_set( $oc_key . ".gz", $gzdata, 'supercache', $cache_max_time );
				$added_cache = 1;
			}
		} else { // no compression
			$wp_cache_meta[ 'headers' ][ 'Vary' ] = 'Vary: Cookie';
			if ( $cache_enabled && $wp_cache_object_cache ) {
				wp_cache_set( $oc_key, $buffer, 'supercache', $cache_max_time );
				$added_cache = 1;
			} elseif ( $fr ) {
				wp_cache_debug( "Writing non-gzipped buffer to wp-cache cache file." );
				fputs($fr, '<?php die(); ?>' . $buffer);
			}
		}
		if ( $fr2 ) {
			wp_cache_debug( "Writing non-gzipped buffer to supercache file." );
			wp_cache_add_to_buffer( $buffer, "super cache" );
			fputs($fr2, $buffer );
		}
		if ( isset( $gzdata ) && $gz ) {
			wp_cache_debug( "Writing gzipped buffer to supercache file." );
			fwrite($gz, $gzdata );
		}
	}

	$new_cache = true;
	if ( false == $wp_cache_object_cache ) {
		if( $fr ) {
			$supercacheonly = false;
			fclose($fr);
			if ( filesize( $tmp_wpcache_filename ) == 0 ) {
				wp_cache_debug( "Warning! The file $tmp_wpcache_filename was empty. Did not rename to {$dir}/{$cache_filename}", 5 );
				@unlink( $tmp_wpcache_filename );
			} else {
				if ( !@rename( $tmp_wpcache_filename, $dir . '/' . $cache_filename ) ) {
					if ( false == is_dir( $dir ) )
						@wp_mkdir_p( $dir );
					@unlink( $dir . $cache_filename );
					@rename( $tmp_wpcache_filename, $dir . '/' . $cache_filename );
				}
				wp_cache_debug( "Renamed temp wp-cache file to {$dir}/$cache_filename", 5 );
				$added_cache = 1;
			}
		}
		if( $fr2 ) {
			fclose($fr2);
			if ( $wp_cache_front_page_checks && $cache_fname == $supercachedir . $home_url[ 'path' ] . supercache_filename() && !( $wp_cache_is_home ) ) {
				wp_cache_writers_exit();
				wp_cache_debug( "Warning! Not writing another page to front page cache.", 1 );
				return $buffer;
			} elseif ( filesize( $tmp_cache_filename ) == 0 ) {
				wp_cache_debug( "Warning! The file $tmp_cache_filename was empty. Did not rename to {$cache_fname}", 5 );
				@unlink( $tmp_cache_filename );
			} else {
				if ( !@rename( $tmp_cache_filename, $cache_fname ) ) {
					@unlink( $cache_fname );
					@rename( $tmp_cache_filename, $cache_fname );
				}
				wp_cache_debug( "Renamed temp supercache file to $cache_fname", 5 );
				$added_cache = 1;
			}
		}
		if( $gz ) {
			fclose($gz);
			if ( filesize( $tmp_cache_filename . '.gz' ) == 0 ) {
				wp_cache_debug( "Warning! The file {$tmp_cache_filename}.gz was empty. Did not rename to {$cache_fname}.gz", 5 );
				@unlink( $tmp_cache_filename . '.gz' );
			} else {
				if ( !@rename( $tmp_cache_filename . '.gz', $cache_fname . '.gz' ) ) {
					@unlink( $cache_fname . '.gz' );
					@rename( $tmp_cache_filename . '.gz', $cache_fname . '.gz' );
				}
				wp_cache_debug( "Renamed temp supercache gz file to {$cache_fname}.gz", 5 );
				$added_cache = 1;
			}
		}
	}
	if ( $added_cache && isset( $wp_supercache_cache_list ) && $wp_supercache_cache_list ) {
		update_option( 'wpsupercache_count', ( get_option( 'wpsupercache_count' ) + 1 ) );
		$last_urls = (array)get_option( 'supercache_last_cached' );
		if ( count( $last_urls ) >= 10 )
			$last_urls = array_slice( $last_urls, 1, 9 );
		$last_urls[] = array( 'url' => preg_replace( '/[ <>\'\"\r\n\t\(\)]/', '', $_SERVER[ 'REQUEST_URI' ] ), 'date' => date( 'Y-m-d H:i:s' ) );
		update_option( 'supercache_last_cached', $last_urls );
	}
	wp_cache_writers_exit();
	if ( !headers_sent() && $wp_cache_gzip_encoding && $gzdata) {
		wp_cache_debug( "Writing gzip content headers. Sending buffer to browser", 5 );
		header( 'Content-Encoding: ' . $wp_cache_gzip_encoding );
		header( 'Vary: Accept-Encoding, Cookie' );
		header( 'Content-Length: ' . $gzsize );
		return $gzdata;
	} else {
		wp_cache_debug( "Sending buffer to browser", 5 );
		return $buffer;
	}
}

function wp_cache_phase2_clean_cache($file_prefix) {
	global $wpdb, $blog_cache_dir;

	if( !wp_cache_writers_entry() )
		return false;
	wp_cache_debug( "wp_cache_phase2_clean_cache: Cleaning cache in $blog_cache_dir" );
	if ( $handle = @opendir( $blog_cache_dir ) ) {
		while ( false !== ($file = @readdir($handle))) {
			if ( strpos( $file, $file_prefix ) !== false ) {
				if ( strpos( $file, '.html' ) ) {
					// delete old wpcache files immediately
					wp_cache_debug( "wp_cache_phase2_clean_cache: Deleting obsolete wpcache cache+meta files: $file" );
					@unlink( $blog_cache_dir . $file);
					@unlink( $blog_cache_dir . 'meta/' . str_replace( '.html', '.meta', $file ) );
				} else {
					$meta = json_decode( wp_cache_get_legacy_cache( $blog_cache_dir . 'meta/' . $file ), true );
					if ( $meta[ 'blog_id' ] == $wpdb->blogid ) {
						@unlink( $blog_cache_dir . $file );
						@unlink( $blog_cache_dir . 'meta/' . $file );
					}
				}
			}
		}
		closedir($handle);
	}
	wp_cache_writers_exit();
}

function prune_super_cache( $directory, $force = false, $rename = false ) {

	// Don't prune a NULL/empty directory.
	if ( null === $directory || '' === $directory ) {
		wp_cache_debug( "prune_super_cache: directory is blank" );
		return false;
	}

	global $cache_max_time, $cache_path, $blog_cache_dir;
	static $log = 0;
	static $protected_directories = '';

	$dir = $directory;
	$directory = wpsc_get_realpath( $directory );
	if ( $directory == '' ) {
		wp_cache_debug( "prune_super_cache: exiting as file/directory does not exist : $dir" );
		return false;
	}
	if ( ! wpsc_is_in_cache_directory( $directory ) ) {
		wp_cache_debug( "prune_super_cache: exiting as directory is not in cache path: *$directory* (was $dir before realpath)" );
		return false;
	}

	if ( false == @file_exists( $directory ) ) {
		wp_cache_debug( "prune_super_cache: exiting as file/dir does not exist: $directory" );
		return $log;
	}
	if( !isset( $cache_max_time ) )
		$cache_max_time = 3600;

	$now = time();

	if ( $protected_directories == '' ) {
		$protected_directories = wpsc_get_protected_directories();
	}

	if (is_dir($directory)) {
		if( $dh = @opendir( $directory ) ) {
			$directory = trailingslashit( $directory );
			while( ( $entry = @readdir( $dh ) ) !== false ) {
				if ($entry == '.' || $entry == '..')
					continue;
				$entry = $directory . $entry;
				prune_super_cache( $entry, $force, $rename );
				// If entry is a directory, AND it's not a protected one, AND we're either forcing the delete, OR the file is out of date,
				if( is_dir( $entry ) && !in_array( $entry, $protected_directories ) && ( $force || @filemtime( $entry ) + $cache_max_time <= $now ) ) {
					// if the directory isn't empty can't delete it
					if( $handle = @opendir( $entry ) ) {
						$donotdelete = false;
						while( !$donotdelete && ( $file = @readdir( $handle ) ) !== false ) {
							if ($file == '.' || $file == '..')
								continue;
							$donotdelete = true;
							wp_cache_debug( "gc: could not delete $entry as it's not empty: $file", 2 );
						}
						closedir($handle);
					}
					if( $donotdelete )
						continue;
					if( !$rename ) {
						@rmdir( $entry );
						$log++;
						if ( $force ) {
							wp_cache_debug( "gc: deleted $entry, forced delete", 2 );
						} else {
							wp_cache_debug( "gc: deleted $entry, older than $cache_max_time seconds", 2 );
						}
					}
				} elseif ( in_array( $entry, $protected_directories ) ) {
					wp_cache_debug( "gc: could not delete $entry as it's protected.", 2 );
				}
			}
			closedir($dh);
		}
	} elseif( is_file($directory) && ($force || @filemtime( $directory ) + $cache_max_time <= $now ) ) {
		$oktodelete = true;
		if ( in_array( $directory, $protected_directories ) ) {
			wp_cache_debug( "gc: could not delete $directory as it's protected.", 2 );
			$oktodelete = false;
		}
		if( $oktodelete && !$rename ) {
			wp_cache_debug( "prune_super_cache: deleted $directory", 5 );
			@unlink( $directory );
			$log++;
		} elseif( $oktodelete && $rename ) {
			wp_cache_debug( "prune_super_cache: wp_cache_rebuild_or_delete( $directory )", 5 );
			wp_cache_rebuild_or_delete( $directory );
			$log++;
		} else {
			wp_cache_debug( "prune_super_cache: did not delete file: $directory" );
		}
	} else {
			wp_cache_debug( "prune_super_cache: did not delete file as it wasn't a directory or file and not forced to delete new file: $directory" );
	}
	return $log;
}

function wp_cache_rebuild_or_delete( $file ) {
	global $cache_rebuild_files, $cache_path, $file_prefix;


	if ( strpos( $file, '?' ) !== false )
		$file = substr( $file, 0, strpos( $file, '?' ) );

	$file = wpsc_get_realpath( $file );

	if ( ! $file ) {
		wp_cache_debug( "wp_cache_rebuild_or_delete: file doesn't exist" );
		return false;
	}

	if ( ! wpsc_is_in_cache_directory( $file ) ) {
		wp_cache_debug( "rebuild_or_gc quitting because file is not in cache_path: $file" );
		return false;
	}

	$protected = wpsc_get_protected_directories();
	foreach( $protected as $id => $directory ) {
		$protected[ $id ] = wpsc_get_realpath( $directory );
	}

	if ( in_array( $file, $protected ) ) {
		wp_cache_debug( "rebuild_or_gc: file is protected: $file" );
		return false;
	}

	if ( substr( basename( $file ), 0, mb_strlen( $file_prefix ) ) == $file_prefix ) {
		@unlink( $file );
		wp_cache_debug( "rebuild_or_gc: deleted non-anonymous file: $file" );
		return false;
	}

	if ( substr( basename( $file ), 0, 5 + mb_strlen( $file_prefix ) ) == 'meta-' . $file_prefix ) {
		@unlink( $file );
		wp_cache_debug( "rebuild_or_gc: deleted meta file: $file" );
		return false;
	}

	if ( false == @file_exists( $file ) ) {
		wp_cache_debug( "rebuild_or_gc: file has disappeared: $file" );
		return false;
	}
	if( $cache_rebuild_files && substr( $file, -14 ) != '.needs-rebuild' ) {
		if( @rename($file, $file . '.needs-rebuild') ) {
			@touch( $file . '.needs-rebuild' );
			wp_cache_debug( "rebuild_or_gc: rename file to {$file}.needs-rebuild", 2 );
		} else {
			@unlink( $file );
			wp_cache_debug( "rebuild_or_gc: rename failed. deleted $file", 2 );
		}
	} else {
		$mtime = @filemtime( $file );
		if ( $mtime && ( time() - $mtime ) > 10 ) {
			@unlink( $file );
			wp_cache_debug( "rebuild_or_gc: rebuild file found. deleted because it was too old: $file", 2 );
		}
	}
}

function wp_cache_phase2_clean_expired( $file_prefix, $force = false ) {
	global $cache_path, $cache_max_time, $blog_cache_dir, $wp_cache_preload_on;

	clearstatcache();
	if( !wp_cache_writers_entry() )
		return false;
	$now = time();
	wp_cache_debug( "Cleaning expired cache files in $blog_cache_dir", 2 );
	$deleted = 0;
	if ( ( $handle = @opendir( $blog_cache_dir ) ) ) {
		while ( false !== ($file = readdir($handle))) {
			if ( preg_match("/^$file_prefix/", $file) &&
				(@filemtime( $blog_cache_dir . $file) + $cache_max_time) <= $now  ) {
				@unlink( $blog_cache_dir . $file );
				@unlink( $blog_cache_dir . 'meta/' . str_replace( '.html', '.meta', $file ) );
				wp_cache_debug( "wp_cache_phase2_clean_expired: Deleting obsolete wpcache cache+meta files: $file" );
				continue;
			}
			if($file != '.' && $file != '..') {
				if( is_dir( $blog_cache_dir . $file ) == false && (@filemtime($blog_cache_dir . $file) + $cache_max_time) <= $now  ) {
					if ( substr( $file, -9 ) != '.htaccess' && $file != 'index.html' ) {
						@unlink($blog_cache_dir . $file);
						wp_cache_debug( "Deleting $blog_cache_dir{$file}, older than $cache_max_time seconds", 5 );
					}
				}
			}
		}
		closedir($handle);
		if ( false == $wp_cache_preload_on || true == $force ) {
			wp_cache_debug( "Doing GC on supercache dir: {$cache_path}supercache", 2 );
			$deleted = prune_super_cache( $cache_path . 'supercache', false, false );
		}
	}

	wp_cache_writers_exit();
	return $deleted;
}

function wp_cache_shutdown_callback() {
	global $cache_max_time, $meta_file, $new_cache, $wp_cache_meta, $known_headers, $blog_id, $wp_cache_gzip_encoding, $supercacheonly, $blog_cache_dir;
	global $wp_cache_request_uri, $wp_cache_key, $wp_cache_object_cache, $cache_enabled, $wp_cache_blog_charset, $wp_cache_not_logged_in;
	global $WPSC_HTTP_HOST, $wp_super_cache_query;

	if ( ! function_exists( 'wpsc_init' ) ) {
		/*
		 * If a server has multiple networks the plugin may not have been activated
		 * on all of them. Give feeds on those blogs a short TTL.
		 * ref: https://wordpress.org/support/topic/fatal-error-while-updating-post-or-publishing-new-one/
		 */
		$wpsc_feed_ttl = 1;
		wp_cache_debug( "wp_cache_shutdown_callback: Plugin not loaded. Setting feed ttl to 60 seconds." );
	}


	if ( false == $new_cache ) {
		wp_cache_debug( "wp_cache_shutdown_callback: No cache file created. Returning." );
		return false;
	}

	$wp_cache_meta[ 'uri' ] = $WPSC_HTTP_HOST . preg_replace('/[ <>\'\"\r\n\t\(\)]/', '', $wp_cache_request_uri); // To avoid XSS attacks
	$wp_cache_meta[ 'blog_id' ] = $blog_id;
	$wp_cache_meta[ 'post' ] = wp_cache_post_id();
	$wp_cache_meta[ 'key' ] = $wp_cache_key;
	$wp_cache_meta = apply_filters( 'wp_cache_meta', $wp_cache_meta );

	$response = wp_cache_get_response_headers();
	foreach( $response as $key => $value ) {
		$wp_cache_meta[ 'headers' ][ $key ] = "$key: $value";
	}

	wp_cache_debug( "wp_cache_shutdown_callback: collecting meta data.", 2 );

	if (!isset( $response['Last-Modified'] )) {
		$value = gmdate('D, d M Y H:i:s') . ' GMT';
		/* Dont send this the first time */
		/* @header('Last-Modified: ' . $value); */
		$wp_cache_meta[ 'headers' ][ 'Last-Modified' ] = "Last-Modified: $value";
	}
	if ( !isset( $response[ 'Content-Type' ] ) && !isset( $response[ 'Content-type' ] ) ) {
		// On some systems, headers set by PHP can't be fetched from
		// the output buffer. This is a last ditch effort to set the
		// correct Content-Type header for feeds, if we didn't see
		// it in the response headers already. -- dougal
		if ( isset( $wp_super_cache_query[ 'is_feed' ] ) ) {
			$type = get_query_var('feed');
			$type = str_replace('/','',$type);
			switch ($type) {
				case 'atom':
					$value = "application/atom+xml";
					break;
				case 'rdf':
					$value = "application/rdf+xml";
					break;
				case 'sitemap':
					$value = "text/xml";
					break;
				case 'rss':
				case 'rss2':
				default:
					if ( get_query_var( 'sitemap' ) || get_query_var( 'xsl' ) || get_query_var( 'xml_sitemap' ) ) {
						wp_cache_debug( "wp_cache_shutdown_callback: feed sitemap detected: text/xml" );
						$value = "text/xml";
					} else {
						$value = "application/rss+xml";
					}
			}
			if ( isset( $wpsc_feed_ttl ) && $wpsc_feed_ttl == 1 ) {
				$wp_cache_meta[ 'ttl' ] = 60;
			}

			wp_cache_debug( "wp_cache_shutdown_callback: feed is type: $type - $value" );
		} elseif ( get_query_var( 'sitemap' ) || get_query_var( 'xsl' ) || get_query_var( 'xml_sitemap' ) ) {
			wp_cache_debug( "wp_cache_shutdown_callback: sitemap detected: text/xml" );
			$value = "text/xml";
			if ( isset( $wpsc_feed_ttl ) && $wpsc_feed_ttl == 1 ) {
				$wp_cache_meta[ 'ttl' ] = 60;
			}

		} else { // not a feed
			$value = get_option( 'html_type' );
			if( $value == '' )
				$value = 'text/html';
		}
		$value .=  "; charset=\"" . $wp_cache_blog_charset . "\"";

		wp_cache_debug( "Sending 'Content-Type: $value' header.", 2 );
		@header("Content-Type: $value");
		$wp_cache_meta[ 'headers' ][ 'Content-Type' ] = "Content-Type: $value";
	}

	if ( $cache_enabled && !$supercacheonly && $new_cache ) {
		if( !isset( $wp_cache_meta[ 'dynamic' ] ) && $wp_cache_gzip_encoding && !in_array( 'Content-Encoding: ' . $wp_cache_gzip_encoding, $wp_cache_meta[ 'headers' ] ) ) {
			wp_cache_debug( "Sending gzip headers.", 2 );
			$wp_cache_meta[ 'headers' ][ 'Content-Encoding' ] = 'Content-Encoding: ' . $wp_cache_gzip_encoding;
			$wp_cache_meta[ 'headers' ][ 'Vary' ] = 'Vary: Accept-Encoding, Cookie';
		}

		$serial = '<?php die(); ?>' . json_encode( $wp_cache_meta );
		$dir = get_current_url_supercache_dir();
		if( @is_dir( $dir ) == false )
			@wp_mkdir_p( $dir );

		if( wp_cache_writers_entry() ) {
			wp_cache_debug( "Writing meta file: {$dir}meta-{$meta_file}", 2 );
			if ( false == $wp_cache_object_cache ) {
				$tmp_meta_filename = $dir . uniqid( mt_rand(), true ) . '.tmp';
				$final_meta_filename = $dir . "meta-" . $meta_file;
				$fr = @fopen( $tmp_meta_filename, 'w');
				if ( $fr ) {
					fputs($fr, $serial);
					fclose($fr);
					@chmod( $tmp_meta_filename, 0666 & ~umask());
					if( !@rename( $tmp_meta_filename, $final_meta_filename ) ) {
						@unlink( $dir . $final_meta_filename );
						@rename( $tmp_meta_filename, $final_meta_filename );
					}
				} else {
					wp_cache_debug( "Problem writing meta file: {$final_meta_filename}" );
				}
			} elseif ( $cache_enabled ) {
				$oc_key = get_oc_key() . ".meta";
				if ( gzip_accepted() )
					$oc_key .= ".gz";
				wp_cache_set( $oc_key, $serial, 'supercache', $cache_max_time );
			}
			wp_cache_writers_exit();
		}
	} else {
		wp_cache_debug( "Did not write meta file: meta-{$meta_file} *$supercacheonly* *$wp_cache_not_logged_in* *$new_cache*", 2 );
	}
	global $time_to_gc_cache;
	if( isset( $time_to_gc_cache ) && $time_to_gc_cache == 1 ) {
		wp_cache_debug( "Executing wp_cache_gc action.", 3 );
		do_action( 'wp_cache_gc' );
	}
}

function wp_cache_no_postid($id) {
	return wp_cache_post_change(wp_cache_post_id());
}

function wp_cache_get_postid_from_comment( $comment_id, $status = 'NA' ) {
	global $super_cache_enabled, $wp_cache_request_uri;
	$comment = get_comment($comment_id, ARRAY_A);
	if ( $status != 'NA' ) {
		$comment[ 'old_comment_approved' ] = $comment[ 'comment_approved' ];
		$comment[ 'comment_approved' ] = $status;
	}

	if ( ( $status == 'trash' || $status == 'spam' ) && $comment[ 'old_comment_approved' ] != 1 ) {
		// don't modify cache if moderated comments are trashed or spammed
		wp_cache_debug( "Moderated comment deleted or spammed. Don't delete any cache files.", 4 );
		define( 'DONOTDELETECACHE', 1 );
		return wp_cache_post_id();
	}
	$postid = $comment['comment_post_ID'];
	// Do nothing if comment is not moderated
	// http://ocaoimh.ie/2006/12/05/caching-wordpress-with-wp-cache-in-a-spam-filled-world
	if ( !preg_match('/wp-admin\//', $wp_cache_request_uri) ) {
		if ( $comment['comment_approved'] == 'delete' && ( isset( $comment[ 'old_comment_approved' ] ) && $comment[ 'old_comment_approved' ] == 0 ) ) { // do nothing if moderated comments are deleted
			wp_cache_debug( "Moderated comment deleted. Don't delete any cache files.", 4 );
			define( 'DONOTDELETECACHE', 1 );
			return $postid;
		} elseif ( $comment['comment_approved'] == 'spam' ) {
			wp_cache_debug( "Spam comment. Don't delete any cache files.", 4 );
			define( 'DONOTDELETECACHE', 1 );
			return $postid;
		} elseif( $comment['comment_approved'] == '0' ) {
			if ( $comment[ 'comment_type' ] == '' ) {
				wp_cache_debug( "Moderated comment. Don't delete supercache file until comment approved.", 4 );
				$super_cache_enabled = 0; // don't remove the super cache static file until comment is approved
				define( 'DONOTDELETECACHE', 1 );
			} else {
				wp_cache_debug( "Moderated ping or trackback. Not deleting cache files..", 4 );
				define( 'DONOTDELETECACHE', 1 );
				return $postid;
			}
		}
	}
	// We must check it up again due to WP bugs calling two different actions
	// for delete, for example both wp_set_comment_status and delete_comment
	// are called when deleting a comment
	if ($postid > 0)  {
		wp_cache_debug( "Post $postid changed. Update cache.", 4 );
		return wp_cache_post_change( $postid );
	} elseif ( $_GET[ 'delete_all' ] != 'Empty Trash' && $_GET[ 'delete_all2' ] != 'Empty Spam' ) {
		wp_cache_debug( "Unknown post changed. Update cache.", 4 );
		return wp_cache_post_change( wp_cache_post_id() );
	}
}

/* Used by wp_update_nav_menu action to clear current blog's cache files when navigation menu is modified */
function wp_cache_clear_cache_on_menu() {
	global $wpdb;
	wp_cache_clear_cache( $wpdb->blogid );
}

/* Clear out the cache directory. */
function wp_cache_clear_cache( $blog_id = 0 ) {
	global $cache_path, $wp_cache_object_cache;
	if ( $wp_cache_object_cache ) {
		reset_oc_version();
	} else {
		if ( $blog_id == 0 ) {
			wp_cache_debug( "Clearing all cached files in wp_cache_clear_cache()", 4 );
			prune_super_cache( $cache_path . 'supercache/', true );
			prune_super_cache( $cache_path, true );
		} else {
			wp_cache_debug( "Clearing all cached files for blog $blog_id in wp_cache_clear_cache()", 4 );
			prune_super_cache( get_supercache_dir( $blog_id ), true );
			prune_super_cache( $cache_path . 'blogs/', true );
		}
	}
}

function wpsc_delete_cats_tags( $post ) {
	$post = get_post($post);
	$categories = get_the_category($post->ID);
	if ( $categories ) {
		$category_base = get_option( 'category_base');
		if ( $category_base == '' )
			$category_base = '/category/';
		$category_base = trailingslashit( $category_base ); // paranoid much?
		foreach ($categories as $cat) {
			prune_super_cache ( get_supercache_dir() . $category_base . $cat->slug . '/', true );
			wp_cache_debug( "wpsc_post_transition: deleting category: " . get_supercache_dir() . $category_base . $cat->slug . '/' );
		}
	}
	$posttags = get_the_tags($post->ID);
	if ( $posttags ) {
		$tag_base = get_option( 'tag_base' );
		if ( $tag_base == '' )
			$tag_base = '/tag/';
		$tag_base = trailingslashit( str_replace( '..', '', $tag_base ) ); // maybe!
		foreach ($posttags as $tag) {
			prune_super_cache( get_supercache_dir() . $tag_base . $tag->slug . '/', true );
			wp_cache_debug( "wpsc_post_transition: deleting tag: " . get_supercache_dir() . $tag_base . $tag->slug . '/' );
		}
	}
}

function wpsc_post_transition( $new_status, $old_status, $post ) {
	if (
		($old_status == 'publish' && $new_status != 'publish' ) // post unpublished
		||
		($old_status != 'publish' && $new_status == 'publish') // post published
	) {
		wpsc_delete_cats_tags( $post );
		prune_super_cache( get_supercache_dir() . '/' . $post->post_name . '/', true );
		wp_cache_debug( "wpsc_post_transition: deleting post: " . get_supercache_dir() . '/' . $post->post_name . '/' );
	}
}

/* check if we want to clear out all cached files on post updates, otherwise call standard wp_cache_post_change() */
function wp_cache_post_edit($post_id) {
	global $wp_cache_clear_on_post_edit, $cache_path, $blog_cache_dir, $wp_cache_object_cache;
	static $last_post_edited = -1;

	if ( $post_id == $last_post_edited ) {
		wp_cache_debug( "wp_cache_post_edit: Already processed post $post_id.", 4 );
		return $post_id;
	}

	$post = get_post( $post_id );
	if ( is_object( $post ) == false )
		return $post_id;

	// Some users are inexplicibly seeing this error on scheduled posts.
	// define this constant to disable the post status check.
	if ( false == defined( 'WPSCFORCEUPDATE' ) && !in_array($post->post_status, array( 'publish', 'private' ) ) ) {
		wp_cache_debug( "wp_cache_post_edit: draft post, not deleting any cache files. status: " . $post->post_status, 4 );
		return $post_id;
	}

	// we want to process the post again just in case it becomes published before the second time this function is called.
	$last_post_edited = $post_id;
	if( $wp_cache_clear_on_post_edit ) {
		wp_cache_debug( "wp_cache_post_edit: Clearing cache $blog_cache_dir and {$cache_path}supercache/ on post edit per config.", 2 );
		if ( $wp_cache_object_cache ) {
			reset_oc_version();
		} else {
			prune_super_cache( $blog_cache_dir, true );
			prune_super_cache( get_supercache_dir(), true );
		}
	} else {
		wp_cache_debug( "wp_cache_post_edit: Clearing cache for post $post_id on post edit.", 2 );
		wp_cache_post_change( $post_id );
	}
}

function wp_cache_post_id_gc( $post_id, $all = 'all' ) {
	global $wp_cache_object_cache;
	
	if ( $wp_cache_object_cache )
		reset_oc_version();

	$post_id = intval( $post_id );
	if( $post_id == 0 )
		return;

	$permalink = trailingslashit( str_replace( get_option( 'home' ), '', get_permalink( $post_id ) ) );
	$dir = get_current_url_supercache_dir( $post_id );
	wp_cache_debug( "wp_cache_post_id_gc post_id: $post_id " . get_permalink( $post_id ) . " clearing cache in $dir.", 4 );
	if ( $all ) {
		prune_super_cache( $dir, true, true );
		do_action( 'gc_cache', 'prune', $permalink );
		@rmdir( $dir );
		$supercache_home = get_supercache_dir();
		wp_cache_debug( "wp_cache_post_id_gc clearing cache in {$supercache_home}page/." );
		prune_super_cache( $supercache_home . 'page/', true );
		do_action( 'gc_cache', 'prune', 'page/' );
	} else {
		wp_cache_debug( "wp_cache_post_id_gc clearing cached index files in $dir.", 4 );
		prune_super_cache( $dir, true, true );
		do_action( 'gc_cache', 'prune', $permalink );
	}
}

function wp_cache_post_change( $post_id ) {
	global $file_prefix, $cache_path, $blog_id, $super_cache_enabled, $blog_cache_dir, $wp_cache_refresh_single_only, $wp_cache_object_cache;
	static $last_processed = -1;

	if ( $post_id == $last_processed ) {
		wp_cache_debug( "wp_cache_post_change: Already processed post $post_id.", 4 );
		return $post_id;
	}
	$post = get_post( $post_id );
	// Some users are inexplicibly seeing this error on scheduled posts.
	// define this constant to disable the post status check.
	if ( false == defined( 'WPSCFORCEUPDATE' ) && is_object( $post ) && !in_array($post->post_status, array( 'publish', 'private' ) ) ) {
		wp_cache_debug( "wp_cache_post_change: draft post, not deleting any cache files.", 4 );
		return $post_id;
	}
	$last_processed = $post_id;

	if( !wp_cache_writers_entry() )
		return $post_id;

	if ( isset( $wp_cache_refresh_single_only ) && $wp_cache_refresh_single_only && ( strpos( $_SERVER[ 'HTTP_REFERER' ], 'edit-comments.php' ) || strpos( $_SERVER[ 'REQUEST_URI' ], 'wp-comments-post.php' ) ) ) {
		if ( defined( 'DONOTDELETECACHE' ) ) {
			wp_cache_debug( "wp_cache_post_change: comment detected and it's moderated or spam. Not deleting cached files.", 4 );
			return $post_id;
		} else {
			wp_cache_debug( "wp_cache_post_change: comment detected. only deleting post page.", 4 );
			$all = false;
		}
	} else {
		$all = true;
	}

	$all_backup = $all;
	$all = apply_filters( 'wpsc_delete_related_pages_on_edit', $all ); // return 0 to disable deleting homepage and other pages.
	if ( $all != $all_backup )
		wp_cache_debug( 'wp_cache_post_change: $all changed by wpsc_delete_related_pages_on_edit filter: ' . intval( $all ) );

	if ( $wp_cache_object_cache )
		reset_oc_version();

	// Delete supercache files whenever a post change event occurs, even if supercache is currently disabled.
	$dir = get_supercache_dir();
	// make sure the front page has a rebuild file
	wp_cache_post_id_gc( $post_id, $all );
	if ( $all == true ) {
		wp_cache_debug( "Post change: supercache enabled: deleting cache files in " . $dir );
		wpsc_rebuild_files( $dir );
		do_action( 'gc_cache', 'prune', 'homepage' );
	} else {
		wp_cache_debug( "wp_cache_post_change: not deleting all pages.", 4 );
	}
	if( $all == true && get_option( 'show_on_front' ) == 'page' ) {
		wp_cache_debug( "Post change: deleting page_on_front and page_for_posts pages.", 4 );
		wp_cache_debug( "Post change: page_on_front " . get_option( 'page_on_front' ), 4 );
		$permalink = trailingslashit( str_replace( get_option( 'home' ), '', get_permalink( get_option( 'page_for_posts' ) ) ) );
		wp_cache_debug( "Post change: Deleting files in: " . str_replace( '//', '/', $dir . $permalink ) );
		wpsc_rebuild_files( $dir . $permalink );
		do_action( 'gc_cache', 'prune', $permalink );
	} else {
		wp_cache_debug( "wp_cache_post_change: not deleting front static page.", 4 );
	}

	wp_cache_debug( "wp_cache_post_change: checking {$blog_cache_dir}meta/", 4 );
	$supercache_files_deleted = false;
	if ( $handle = @opendir( $blog_cache_dir ) ) {
		while ( false !== ($file = readdir($handle))) {
			if ( strpos( $file, $file_prefix ) !== false ) {
				if ( strpos( $file, '.html' ) ) {
					// delete old wpcache files immediately
					wp_cache_debug( "wp_cache_post_change: Deleting obsolete wpcache cache+meta files: $file" );
					@unlink( $blog_cache_dir . $file);
					@unlink( $blog_cache_dir . 'meta/' . str_replace( '.html', '.meta', $file ) );
					continue;
				} else {
					$meta = json_decode( wp_cache_get_legacy_cache( $blog_cache_dir . 'meta/' . $file ), true );
					if( false == is_array( $meta ) ) {
						wp_cache_debug( "Post change cleaning up stray file: $file", 4 );
						@unlink( $blog_cache_dir . 'meta/' . $file );
						@unlink( $blog_cache_dir . $file );
						continue;
					}
					if ( $post_id > 0 && $meta ) {
						$permalink = trailingslashit( str_replace( get_option( 'home' ), '', get_permalink( $post_id ) ) );
						if ( $meta[ 'blog_id' ] == $blog_id  && ( ( $all == true && !$meta[ 'post' ] ) || $meta[ 'post' ] == $post_id) ) {
							wp_cache_debug( "Post change: deleting post wp-cache files for {$meta[ 'uri' ]}: $file", 4 );
							@unlink( $blog_cache_dir . 'meta/' . $file );
							@unlink( $blog_cache_dir . $file );
							if ( false == $supercache_files_deleted && $super_cache_enabled == true ) {
								wp_cache_debug( "Post change: deleting supercache files for {$permalink}" );
								wpsc_rebuild_files( $dir . $permalink );
								$supercache_files_deleted = true;
								do_action( 'gc_cache', 'rebuild', $permalink );
							}
						}
					} elseif ( $meta[ 'blog_id' ] == $blog_id ) {
						wp_cache_debug( "Post change: deleting wp-cache files for {$meta[ 'uri' ]}: $file", 4 );
						@unlink( $blog_cache_dir . 'meta/' . $file );
						@unlink( $blog_cache_dir . $file );
						if ( $super_cache_enabled == true ) {
							wp_cache_debug( "Post change: deleting supercache files for {$meta[ 'uri' ]}" );
							wpsc_rebuild_files( $dir . $meta[ 'uri' ] );
							do_action( 'gc_cache', 'rebuild', trailingslashit( $meta[ 'uri' ] ) );
						}
					}
				}
			}
		}
		closedir($handle);
	}
	wp_cache_writers_exit();
	return $post_id;
}

function wp_cache_microtime_diff($a, $b) {
	list($a_dec, $a_sec) = explode(' ', $a);
	list($b_dec, $b_sec) = explode(' ', $b);
	return (float)$b_sec - (float)$a_sec + (float)$b_dec - (float)$a_dec;
}

function wp_cache_post_id() {
	global $posts, $comment_post_ID, $post_ID;
	// We try hard all options. More frequent first.
	if ($post_ID > 0 ) return $post_ID;
	if ($comment_post_ID > 0 )  return $comment_post_ID;
	if (is_singular() && !empty($posts)) return $posts[0]->ID;
	if (isset( $_GET[ 'p' ] ) && $_GET['p'] > 0) return $_GET['p'];
	if (isset( $_POST[ 'p' ] ) && $_POST['p'] > 0) return $_POST['p'];
	return 0;
}

function maybe_stop_gc( $flag ) {

	if ( @file_exists( $flag ) ) {
		if ( time() - filemtime( $flag ) > 3600 ) {
			@unlink( $flag );
			wp_cache_debug( "maybe_stop_gc: GC flag found but deleted because it's older than 3600 seconds.", 5 );
			return false;
		} else {
			wp_cache_debug( 'maybe_stop_gc: GC flag found. GC cancelled.', 5 );
			return true;
		}
	} else {
		wp_cache_debug( 'maybe_stop_gc: GC flag not found. GC will go ahead..', 5 );
		return false;
	}
}
function get_gc_flag() {
	global $cache_path;
	return $cache_path . strtolower( preg_replace( '!/:.*$!', '', str_replace( 'http://', '', str_replace( 'https://', '', get_option( 'home' ) ) ) ) ) . "_wp_cache_gc.txt";
}

function wp_cache_gc_cron() {
	global $file_prefix, $cache_max_time, $cache_gc_email_me, $cache_time_interval;

	$msg = '';
	if ( $cache_max_time == 0 ) {
		wp_cache_debug( 'Cache garbage collection disabled because cache expiry time is zero.', 5 );
		return false;
	}

	$gc_flag = get_gc_flag();
	if ( maybe_stop_gc( $gc_flag ) ) {
		wp_cache_debug( 'GC flag found. GC cancelled.', 5 );
		return false;
	}

	update_option( 'wpsupercache_gc_time', time() );
	wp_cache_debug( "wp_cache_gc_cron: Set GC Flag. ($gc_flag)", 5 );
	$fp = @fopen( $gc_flag, 'w' );
	@fclose( $fp );

	wp_cache_debug( 'Cache garbage collection.', 5 );

	if( !isset( $cache_max_time ) )
		$cache_max_time = 600;

	$start = time();
	$num = 0;
	if( false === ( $num = wp_cache_phase2_clean_expired( $file_prefix ) ) ) {
		wp_cache_debug( 'Cache Expiry cron job failed. Probably mutex locked.', 1 );
		update_option( 'wpsupercache_gc_time', time() - ( $cache_time_interval - 10 ) ); // if GC failed then run it again in one minute
		$msg .= __( 'Cache expiry cron job failed. Job will run again in 10 seconds.', 'wp-super-cache' ) . "\n";
	}
	if( time() - $start > 30 ) {
		wp_cache_debug( "Cache Expiry cron job took more than 30 seconds to execute.\nYou should reduce the Expiry Time in the WP Super Cache admin page\nas you probably have more cache files than your server can handle efficiently.", 1 );
		$msg .= __( 'Cache expiry cron job took more than 30 seconds. You should probably run the garbage collector more often.', 'wp-super-cache' ) . "\n";
	}

	if ( $cache_gc_email_me ) {
		if ( $msg != '' )
			$msg = "The following warnings were generated by the WP Super Cache Garbage Collector:\n" . $msg;

		$msg = "Hi,\n\nThe WP Super Cache Garbage Collector has now run, deleting " . (int)$num . " files and directories.\nIf you want to switch off these emails please see the WP Super Cache Advanced Settings\npage on your blog.\n\n{$msg}\nRegards,\nThe Garbage Collector.";

		wp_mail( get_option( 'admin_email' ), sprintf( __( '[%1$s] WP Super Cache GC Report', 'wp-super-cache' ), home_url() ), $msg );
	}
	@unlink( $gc_flag );
	wp_cache_debug( 'GC completed. GC flag deleted.', 5 );
	schedule_wp_gc( 1 );
}

function schedule_wp_gc( $forced = 0 ) {
	global $cache_schedule_type, $cache_max_time, $cache_time_interval, $cache_scheduled_time, $cache_schedule_interval;

	if ( false == isset( $cache_time_interval ) )
		$cache_time_interval = 3600;

	if ( false == isset( $cache_schedule_type ) ) {
		$cache_schedule_type = 'interval';
		$cache_schedule_interval = $cache_max_time;
	}
	if ( $cache_schedule_type == 'interval' ) {
		if ( !isset( $cache_max_time ) )
			$cache_max_time = 600;
		if ( $cache_max_time == 0 )
			return false;
		$last_gc = get_option( "wpsupercache_gc_time" );

		if ( !$last_gc ) {
			update_option( 'wpsupercache_gc_time', time() );
			$last_gc = get_option( "wpsupercache_gc_time" );
		}
		if ( $forced || ( $last_gc < ( time() - 60 ) ) ) { // Allow up to 60 seconds for the previous job to run
			global $wp_cache_shutdown_gc;
			if ( !isset( $wp_cache_shutdown_gc ) || $wp_cache_shutdown_gc == 0 ) {
				if ( !($t = wp_next_scheduled( 'wp_cache_gc' ) ) ) {
					wp_clear_scheduled_hook( 'wp_cache_gc' );
					wp_schedule_single_event( time() + $cache_time_interval, 'wp_cache_gc' );
					wp_cache_debug( 'scheduled wp_cache_gc for 10 seconds time.', 5 );
				}
			} else {
				global $time_to_gc_cache;
				$time_to_gc_cache = 1; // tell the "shutdown gc" to run!
			}
		}
	} elseif ( $cache_schedule_type == 'time' && !wp_next_scheduled( 'wp_cache_gc' ) ) {
		wp_schedule_event( strtotime( $cache_scheduled_time ), $cache_schedule_interval, 'wp_cache_gc' );
	}
	return true;
}

function wp_cache_gc_watcher() {
	if ( false == wp_next_scheduled( 'wp_cache_gc' ) ) {
		wp_cache_debug( 'GC Watcher: scheduled new gc cron.', 5 );
		schedule_wp_gc();
	}
}

?>
