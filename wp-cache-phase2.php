<?php

function gzip_accepted(){
	if ( 1 == ini_get( 'zlib.output_compression' ) || "on" == strtolower( ini_get( 'zlib.output_compression' ) ) ) // don't compress WP-Cache data files when PHP is already doing it
		return false;

	if ( !isset( $_SERVER[ 'HTTP_ACCEPT_ENCODING' ] ) || ( isset( $_SERVER[ 'HTTP_ACCEPT_ENCODING' ] ) && strpos( $_SERVER[ 'HTTP_ACCEPT_ENCODING' ], 'gzip' ) === false ) ) return false;
	return 'gzip';
}

function setup_blog_cache_dir() {
	global $blog_cache_dir, $cache_path;
	if( false == @is_dir( $blog_cache_dir ) ) {
		@mkdir( $cache_path . "blogs" );
		@mkdir( $blog_cache_dir );
	}

	if( false == @is_dir( $blog_cache_dir . 'meta' ) )
		@mkdir( $blog_cache_dir . 'meta' );
}

function get_wp_cache_key( $url = false ) {
	global $wp_cache_request_uri, $wp_cache_gzip_encoding, $WPSC_HTTP_HOST;
	if ( ! $url ) {
		$url = $wp_cache_request_uri;
	}
	$server_port = isset( $_SERVER[ 'SERVER_PORT' ] ) ? intval( $_SERVER[ 'SERVER_PORT' ] ) : 0;
	return do_cacheaction( 'wp_cache_key', wp_cache_check_mobile( $WPSC_HTTP_HOST . $server_port . preg_replace('/#.*$/', '', str_replace( '/index.php', '/', $url ) ) . $wp_cache_gzip_encoding . wp_cache_get_cookies_values() ) );
}

function wpsc_remove_tracking_params_from_uri( $uri ) {
	global $wpsc_tracking_parameters, $wpsc_ignore_tracking_parameters;

	if ( ! isset( $wpsc_ignore_tracking_parameters ) || ! $wpsc_ignore_tracking_parameters ) {
		return $uri;
	}

	if ( ! isset( $wpsc_tracking_parameters ) || empty( $wpsc_tracking_parameters ) ) {
		return $uri;
	}

	$parsed_url = parse_url( $uri );
	$query      = array();

	if ( isset( $parsed_url['query'] ) ) {
		parse_str( $parsed_url['query'], $query );
		foreach( $wpsc_tracking_parameters as $param_name ) {
			unset( $query[$param_name] );
		}
	}
	$path = isset( $parsed_url['path'] ) ? $parsed_url['path'] : '';
	$query = ! empty( $query ) ? '?' . http_build_query( $query ) : '';

	if ( $uri !== $path . $query ) {
		wp_cache_debug( 'Removed tracking parameters from URL. Returning ' . $path . $query );
	}

	return $path . $query;
}

function wp_super_cache_init() {
	global $wp_cache_key, $key, $blogcacheid, $file_prefix, $blog_cache_dir, $meta_file, $cache_file, $cache_filename, $meta_pathname;

	$wp_cache_key = get_wp_cache_key();
	$key = $blogcacheid . md5( $wp_cache_key );
	$wp_cache_key = $blogcacheid . $wp_cache_key;

	$cache_filename = $file_prefix . $key . '.php';
	$meta_file = $file_prefix . $key . '.php';
	$cache_file = wpsc_get_realpath( $blog_cache_dir ) . '/' . $cache_filename;
	$meta_pathname = wpsc_get_realpath( $blog_cache_dir . 'meta/' ) . '/' . $meta_file;
	return compact( 'key', 'cache_filename', 'meta_file', 'cache_file', 'meta_pathname' );
}

function wp_cache_serve_cache_file() {
	global $key, $blogcacheid, $wp_cache_request_uri, $file_prefix, $blog_cache_dir, $meta_file, $cache_file, $cache_filename, $meta_pathname, $wp_cache_gzip_encoding, $meta;
	global $cache_compression, $wp_cache_slash_check, $wp_supercache_304, $wp_cache_home_path, $wp_cache_no_cache_for_get;
	global $wp_cache_disable_utf8, $wp_cache_mfunc_enabled, $wpsc_served_header;

	if ( wpsc_is_backend() ) {
		wp_cache_debug( 'Not serving wp-admin requests.', 5 );
		return false;
	}

	if ( $wp_cache_no_cache_for_get && false == empty( $_GET ) ) {
		wp_cache_debug( 'Non empty GET request. Caching disabled on settings page. ' . wpsc_dump_get_request(), 1 );
		return false;
	}

	if ( defined( 'WPSC_SERVE_DISABLED' ) ) {
		wp_cache_debug( 'wp_cache_serve_cache_file: WPSC_SERVE_DISABLED defined. Not serving cached files.' );
		return false;
	}

	extract( wp_super_cache_init() ); // $key, $cache_filename, $meta_file, $cache_file, $meta_pathname

	if (
		! defined( 'WPSC_SUPERCACHE_ONLY' ) &&
		(
			( $cache_file && file_exists( $cache_file ) ) ||
			file_exists( get_current_url_supercache_dir() . 'meta-' . $cache_filename )
		)
	) {
		if ( file_exists( get_current_url_supercache_dir() . 'meta-' . $cache_filename ) ) {
			$cache_file = get_current_url_supercache_dir() . $cache_filename;
			$meta_pathname = get_current_url_supercache_dir() . 'meta-' . $cache_filename;
		} elseif ( !file_exists( $cache_file ) ) {
			wp_cache_debug( 'wp_cache_serve_cache_file: found cache file but then it disappeared!' );
			return false;
		}

		wp_cache_debug( "wp-cache file exists: $cache_file", 5 );
		if ( !( $meta = json_decode( wp_cache_get_legacy_cache( $meta_pathname ), true ) ) ) {
			wp_cache_debug( "couldn't load wp-cache meta file", 5 );
			return true;
		}
		if ( is_array( $meta ) == false ) {
			wp_cache_debug( "meta array corrupt, deleting $meta_pathname and $cache_file", 1 );
			@unlink( $meta_pathname );
			@unlink( $cache_file );
			return true;
		}
	} else { // no $cache_file
		global $wpsc_save_headers;
		global $cache_max_time;
		// last chance, check if a supercache file exists. Just in case .htaccess rules don't work on this host
		$filename = supercache_filename();
		$file = get_current_url_supercache_dir() . $filename;
		if ( false == file_exists( $file ) ) {
			wp_cache_debug( "No Super Cache file found for current URL: $file" );
			return false;
		} elseif ( false == empty( $_GET ) ) {
			wp_cache_debug( 'GET array not empty. Cannot serve a supercache file. ' . wpsc_dump_get_request() );
			return false;
		} elseif ( wp_cache_get_cookies_values() != '' ) {
			wp_cache_debug( 'Cookies found. Cannot serve a supercache file. ' . wp_cache_get_cookies_values() );
			return false;
		} elseif ( isset( $wpsc_save_headers ) && $wpsc_save_headers ) {
			wp_cache_debug( 'Saving headers. Cannot serve a supercache file.' );
			return false;
		} elseif ( $cache_max_time > 0 && ( filemtime( $file ) + $cache_max_time ) < time() ) {
			wp_cache_debug( sprintf( "Cache has expired and is older than %d seconds old.", $cache_max_time ) );
			return false;
		}

		if ( isset( $wp_cache_mfunc_enabled ) == false )
			$wp_cache_mfunc_enabled = 0;

		if ( false == isset( $wp_cache_home_path ) )
			$wp_cache_home_path = '/';

		// make sure ending slashes are ok
		if ( $wp_cache_request_uri == $wp_cache_home_path || ( $wp_cache_slash_check && substr( $wp_cache_request_uri, -1 ) == '/' ) || ( $wp_cache_slash_check == 0 && substr( $wp_cache_request_uri, -1 ) != '/' ) ) {

			if ( $wp_cache_mfunc_enabled == 0 ) {
				// get data from file
				if ( $wp_cache_gzip_encoding ) {
					if ( file_exists( $file . '.gz' ) ) {
						$cachefiledata = file_get_contents( $file . '.gz' );
						wp_cache_debug( "Fetched gzip static page data from supercache file using PHP. File: $file.gz" );
					} else {
						$cachefiledata = gzencode( file_get_contents( $file ), 6, FORCE_GZIP );
						wp_cache_debug( "Fetched static page data from supercache file using PHP and gzipped it. File: $file" );
					}
				} else {
					$cachefiledata = file_get_contents( $file );
					wp_cache_debug( "Fetched static page data from supercache file using PHP. File: $file" );
				}
			} else {
				// get dynamic data from filtered file
				$cachefiledata = do_cacheaction( 'wpsc_cachedata', file_get_contents( $file ) );
				if ( $wp_cache_gzip_encoding ) {
					$cachefiledata = gzencode( $cachefiledata, 6, FORCE_GZIP );
					wp_cache_debug( "Fetched dynamic page data from supercache file using PHP and gzipped it. File: $file" );
				} else {
					wp_cache_debug( "Fetched dynamic page data from supercache file using PHP. File: $file" );
				}
			}

			if ( isset( $wp_cache_disable_utf8 ) == false || $wp_cache_disable_utf8 == 0 )
				header( "Content-type: text/html; charset=UTF-8" );

			if ( defined( 'WPSC_VARY_HEADER' ) ) {
				if ( WPSC_VARY_HEADER != '' ) {
					header( "Vary: " . WPSC_VARY_HEADER );
				}
			} else {
				header( "Vary: Accept-Encoding, Cookie" );
			}
			if ( defined( 'WPSC_CACHE_CONTROL_HEADER' ) ) {
				if ( WPSC_CACHE_CONTROL_HEADER != '' ) {
					header( "Cache-Control: " . WPSC_CACHE_CONTROL_HEADER );
				}
			} else {
				header( "Cache-Control: max-age=3, must-revalidate" );
			}
			$size = function_exists( 'mb_strlen' ) ? mb_strlen( $cachefiledata, '8bit' ) : strlen( $cachefiledata );
			if ( $wp_cache_gzip_encoding ) {
				if ( isset( $wpsc_served_header ) && $wpsc_served_header ) {
					header( "X-WP-Super-Cache: Served supercache gzip file from PHP" );
				}
				header( 'Content-Encoding: ' . $wp_cache_gzip_encoding );
				header( 'Content-Length: ' . $size );
			} elseif ( $wp_supercache_304 ) {
				if ( isset( $wpsc_served_header ) && $wpsc_served_header ) {
					header( "X-WP-Super-Cache: Served supercache 304 file from PHP" );
				}
				header( 'Content-Length: ' . $size );
			} else {
				if ( isset( $wpsc_served_header ) && $wpsc_served_header ) {
					header( "X-WP-Super-Cache: Served supercache file from PHP" );
				}
			}

			// don't try to match modified dates if using dynamic code.
			if ( $wp_cache_mfunc_enabled == 0 && $wp_supercache_304 ) {
				$headers         = apache_request_headers();
				$remote_mod_time = isset ( $headers['If-Modified-Since'] ) ? $headers['If-Modified-Since'] : null;

				if ( is_null( $remote_mod_time ) && isset( $_SERVER['HTTP_IF_MODIFIED_SINCE'] ) ) {
					$remote_mod_time = $_SERVER['HTTP_IF_MODIFIED_SINCE'];
				}

				$local_mod_time = gmdate("D, d M Y H:i:s",filemtime( $file )).' GMT';
				if ( ! is_null( $remote_mod_time ) && $remote_mod_time == $local_mod_time ) {
					header( $_SERVER[ 'SERVER_PROTOCOL' ] . " 304 Not Modified" );
					exit();
				}
				header( 'Last-Modified: ' . $local_mod_time );
			}
			echo $cachefiledata;
			exit();
		} else {
			wp_cache_debug( 'No wp-cache file exists. Must generate a new one.' );
			return false;
		}
	}

	$cache_file = do_cacheaction( 'wp_cache_served_cache_file', $cache_file );
	// Sometimes the gzip headers are lost. Make sure html returned isn't compressed!
	if ( $cache_compression && $wp_cache_gzip_encoding && !in_array( 'Content-Encoding: ' . $wp_cache_gzip_encoding, $meta[ 'headers' ] ) ) {
		$ungzip = true;
		wp_cache_debug( 'GZIP headers not found. Force uncompressed output.', 1 );
	} else {
		$ungzip = false;
	}
	foreach ( $meta[ 'headers' ] as $t => $header) {
		// godaddy fix, via http://blog.gneu.org/2008/05/wp-supercache-on-godaddy/ and http://www.littleredrails.com/blog/2007/09/08/using-wp-cache-on-godaddy-500-error/
		if ( strpos( $header, 'Last-Modified:' ) === false ) {
			header( $header );
		}
	}
	if ( isset( $wpsc_served_header ) && $wpsc_served_header ) {
		header( 'X-WP-Super-Cache: Served WPCache cache file' );
	}
	if ( isset( $meta[ 'dynamic' ] ) ) {
		wp_cache_debug( 'Serving wp-cache dynamic file', 5 );
		if ( $ungzip ) {
			// attempt to uncompress the cached file just in case it's gzipped
			$cache = wp_cache_get_legacy_cache( $cache_file );
			$uncompressed = @gzuncompress( $cache );
			if ( $uncompressed ) {
				wp_cache_debug( 'Uncompressed gzipped cache file from wp-cache', 1 );
				unset( $cache );
				echo do_cacheaction( 'wpsc_cachedata', $uncompressed );
			} else {
				echo do_cacheaction( 'wpsc_cachedata', $cache );
			}
		} else {
			echo do_cacheaction( 'wpsc_cachedata', wp_cache_get_legacy_cache( $cache_file ) );
		}
	} else {
		wp_cache_debug( 'Serving wp-cache static file', 5 );
		if ( $ungzip ) {
			$cache = wp_cache_get_legacy_cache( $cache_file );
			$uncompressed = gzuncompress( $cache );
			if ( $uncompressed ) {
				wp_cache_debug( 'Uncompressed gzipped cache file from wp-cache', 1 );
				echo $uncompressed;
			} else {
				wp_cache_debug( 'Compressed gzipped cache file from wp-cache', 1 );
				echo $cache;
			}
		} else {
			wp_cache_debug( 'Getting legacy cache file ' . $cache_file, 1 );
			echo( wp_cache_get_legacy_cache( $cache_file ) );
		}
	}
	wp_cache_debug( 'exit request', 5 );
	die();
}

function wp_cache_get_legacy_cache( $cache_file ) {
	return substr( @file_get_contents( $cache_file ), 15 );
}

function wp_cache_postload() {
	global $cache_enabled, $wp_super_cache_late_init;

	if ( !$cache_enabled )
		return true;

	if ( isset( $wp_super_cache_late_init ) && true == $wp_super_cache_late_init ) {
		wp_cache_debug( 'Supercache Late Init: add wp_cache_serve_cache_file to init', 3 );
		add_action( 'init', 'wp_cache_late_loader', 9999 );
	} else {
		wp_super_cache_init();
		wp_cache_phase2();
	}
}

function wp_cache_late_loader() {
	wp_cache_debug( 'Supercache Late Loader running on init', 3 );
	wp_cache_serve_cache_file();
	wp_cache_phase2();
}

function wpsc_get_auth_cookies() {
	static $cached_cookies;

	if ( isset( $cached_cookies ) && is_array( $cached_cookies ) ) {
		return $cached_cookies;
	}

	$cookies = array_keys( $_COOKIE );
	if ( empty( $cookies ) ) {
		return array();
	}

	$auth_cookies      = array();
	$duplicate_cookies = array();

	$wp_cookies = array(
		'AUTH_COOKIE'        => 'wordpress_',
		'SECURE_AUTH_COOKIE' => 'wordpress_sec_',
		'LOGGED_IN_COOKIE'   => 'wordpress_logged_in_',
	);

	foreach ( $wp_cookies as $cookie_const => $cookie_prefix ) {
		$cookie_key = strtolower( $cookie_const );

		if ( defined( $cookie_const ) ) {
			if ( in_array( constant( $cookie_const ), $cookies, true ) ) {
				$auth_cookies[ $cookie_key ] = constant( $cookie_const );
			}

			continue;
		}

		$found_cookies = preg_grep( '`^' . preg_quote( $cookie_prefix, '`' ) . '([0-9a-f]+)$`', $cookies );

		if ( count( $found_cookies ) === 1 ) {
			$auth_cookies[ $cookie_key ] = reset( $found_cookies );
		} elseif ( count( $found_cookies ) > 1 ) {
			$duplicate_cookies           = array_merge( $duplicate_cookies, $found_cookies );
			$auth_cookies[ $cookie_key ] = $found_cookies;
		}
	}

	$cookie_hash   = defined( 'COOKIEHASH' ) ? COOKIEHASH : '';
	$other_cookies = array(
		'comment_cookie'  => 'comment_author_',
		'postpass_cookie' => 'wp-postpass_',
	);

	foreach ( $other_cookies as $cookie_key => $cookie_prefix ) {

		if ( $cookie_hash ) {
			if ( in_array( $cookie_prefix . $cookie_hash, $cookies, true ) ) {
				$auth_cookies[ $cookie_key ] = $cookie_prefix . $cookie_hash;
			}

			continue;
		}

		$found_cookies = preg_grep( '`^' . preg_quote( $cookie_prefix, '`' ) . '([0-9a-f]+)$`', $cookies );

		if ( count( $found_cookies ) === 1 ) {
			$auth_cookies[ $cookie_key ] = reset( $found_cookies );
		} elseif ( count( $found_cookies ) > 1 ) {
			$duplicate_cookies           = array_merge( $duplicate_cookies, $found_cookies );
			$auth_cookies[ $cookie_key ] = $found_cookies;
		}
	}

	if ( ! $duplicate_cookies ) {
		$cached_cookies = $auth_cookies;
	}

	if ( empty( $auth_cookies ) ) {
		wp_cache_debug( 'wpsc_get_auth_cookies: no auth cookies detected', 5 );
	} else {
		if ( $duplicate_cookies ) {
			wp_cache_debug( 'wpsc_get_auth_cookies: duplicate cookies detected( ' . implode( ', ', $duplicate_cookies ) . ' )', 5 );
		} else {
			wp_cache_debug( 'wpsc_get_auth_cookies: cookies detected: ' . implode( ', ', $auth_cookies ), 5 );
		}
	}

	return $auth_cookies;
}

function wp_cache_get_cookies_values() {
	global $wpsc_cookies;
	static $string = '';

	if ( $string != '' ) {
		wp_cache_debug( "wp_cache_get_cookies_values: cached: $string" );
		return $string;
	}

	if ( defined( 'COOKIEHASH' ) )
		$cookiehash = preg_quote( constant( 'COOKIEHASH' ) );
	else
		$cookiehash = '';
	$regex = "/^wp-postpass_$cookiehash|^comment_author_$cookiehash";
	if ( defined( 'LOGGED_IN_COOKIE' ) )
		$regex .= "|^" . preg_quote( constant( 'LOGGED_IN_COOKIE' ) );
	else
		$regex .= "|^wordpress_logged_in_$cookiehash";
	$regex .= "/";
	while ($key = key($_COOKIE)) {
		if ( preg_match( $regex, $key ) ) {
			wp_cache_debug( "wp_cache_get_cookies_values: Login/postpass cookie detected" );
			$string .= $_COOKIE[ $key ] . ",";
		}
		next($_COOKIE);
	}
	reset($_COOKIE);

	// If you use this hook, make sure you update your .htaccess rules with the same conditions
	$string = do_cacheaction( 'wp_cache_get_cookies_values', $string );

	if (
		isset( $wpsc_cookies ) &&
		is_array( $wpsc_cookies ) &&
		! empty( $wpsc_cookies )
	) {
		foreach( $wpsc_cookies as $name ) {
			if ( isset( $_COOKIE[ $name ] ) ) {
				wp_cache_debug( "wp_cache_get_cookies_values - found extra cookie: $name" );
				$string .= $name . "=" . $_COOKIE[ $name ] . ",";
			}
		}
	}

	if ( $string != '' )
		$string = md5( $string );

	wp_cache_debug( "wp_cache_get_cookies_values: return: $string", 5 );
	return $string;
}

function add_cacheaction( $action, $func ) {
	global $wp_supercache_actions;
	$wp_supercache_actions[ $action ][] = $func;
}

function do_cacheaction( $action, $value = '' ) {
	global $wp_supercache_actions;

	if ( !isset( $wp_supercache_actions ) || !is_array( $wp_supercache_actions ) )
		return $value;

	if( array_key_exists($action, $wp_supercache_actions) && is_array( $wp_supercache_actions[ $action ] ) ) {
		$actions = $wp_supercache_actions[ $action ];
		foreach( $actions as $func ) {
			$value = call_user_func_array( $func, array( $value ) );
		}
	}

	return $value;
}

function wp_cache_mobile_group( $user_agent ) {
	global $wp_cache_mobile_groups;
	foreach( (array)$wp_cache_mobile_groups as $name => $group ) {
		foreach( (array)$group as $browser ) {
			$browser = trim( strtolower( $browser ) );
			if ( $browser != '' && strstr( $user_agent, $browser ) ) {
				return $browser;
			}
		}
	}
	return "mobile";
}

// From https://wordpress.org/plugins/wordpress-mobile-edition/ by Alex King
function wp_cache_check_mobile( $cache_key ) {
	global $wp_cache_mobile_enabled, $wp_cache_mobile_browsers, $wp_cache_mobile_prefixes;
	if ( !isset( $wp_cache_mobile_enabled ) || false == $wp_cache_mobile_enabled )
		return $cache_key;

	wp_cache_debug( "wp_cache_check_mobile: $cache_key" );

	// allow plugins to short circuit mobile check. Cookie, extra UA checks?
	switch( do_cacheaction( 'wp_cache_check_mobile', $cache_key ) ) {
	case "normal":
		wp_cache_debug( 'wp_cache_check_mobile: desktop user agent detected by wp_cache_check_mobile action' );
		return $cache_key;
		break;
	case "mobile":
		wp_cache_debug( 'wp_cache_check_mobile: mobile user agent detected by wp_cache_check_mobile action' );
		return $cache_key . "-mobile";
		break;
	}

	if ( !isset( $_SERVER[ "HTTP_USER_AGENT" ] ) ) {
		return $cache_key;
	}

	if ( do_cacheaction( 'disable_mobile_check', false ) ) {
		wp_cache_debug( 'wp_cache_check_mobile: disable_mobile_check disabled mobile check' );
		return $cache_key;
	}

	$browsers = explode( ',', $wp_cache_mobile_browsers );
	$user_agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
	foreach ($browsers as $browser) {
		if ( strstr( $user_agent, trim( strtolower( $browser ) ) ) ) {
			wp_cache_debug( 'mobile browser detected: ' . $browser );
			return $cache_key . '-' . wp_cache_mobile_group( $user_agent );
		}
	}
	if (isset($_SERVER['HTTP_X_WAP_PROFILE']) )
		return $cache_key . '-' . $_SERVER['HTTP_X_WAP_PROFILE'];
	if (isset($_SERVER['HTTP_PROFILE']) )
		return $cache_key . '-' . $_SERVER['HTTP_PROFILE'];

	if ( isset( $wp_cache_mobile_prefixes ) ) {
		$browsers = explode( ',', $wp_cache_mobile_prefixes );
		foreach ($browsers as $browser_prefix) {
			if ( substr($user_agent, 0, 4) == $browser_prefix ) {
				wp_cache_debug( 'mobile browser (prefix) detected: ' . $browser_prefix );
				return $cache_key . '-' . $browser_prefix;
			}
		}
	}
	$accept = isset( $_SERVER[ 'HTTP_ACCEPT' ] ) ? strtolower( $_SERVER[ 'HTTP_ACCEPT' ] ) : '';
	if (strpos($accept, 'wap') !== false) {
		return $cache_key . '-' . 'wap';
	}

	if (isset($_SERVER['ALL_HTTP']) && strpos(strtolower($_SERVER['ALL_HTTP']), 'operamini') !== false) {
		return $cache_key . '-' . 'operamini';
	}

	return $cache_key;
}

/**
 * Add a log message to the file, if debugging is turned on
 *
 * @param $message string The message that should be added to the log
 * @param $level   int
 */
function wp_cache_debug( $message, $level = 1 ) {
	global $wp_cache_debug_log, $cache_path, $wp_cache_debug_ip, $wp_super_cache_debug;
	static $last_message = '';

	if ( $last_message == $message ) {
		return false;
	}
	$last_message = $message;

	// If either of the debug or log globals aren't set, then we can stop
	if ( !isset($wp_super_cache_debug)
		 || !isset($wp_cache_debug_log) )
		return false;

	// If either the debug or log globals are false or empty, we can stop
	if ( $wp_super_cache_debug == false
		 || $wp_cache_debug_log == '' )
		return false;

	// If the debug_ip has been set, but it doesn't match the ip of the requester
	// then we can stop.
	if ( isset($wp_cache_debug_ip)
		 && $wp_cache_debug_ip != ''
		 && $wp_cache_debug_ip != $_SERVER[ 'REMOTE_ADDR' ] )
		return false;

	// Log message: Date URI Message
	$log_message = date('H:i:s') . " " . getmypid() . " {$_SERVER['REQUEST_URI']} {$message}" . PHP_EOL;
	// path to the log file in the cache folder
	$log_file = $cache_path . str_replace('/', '', str_replace('..', '', $wp_cache_debug_log));

	if ( ! file_exists( $log_file ) && function_exists( 'wpsc_create_debug_log' ) ) {
		global $wp_cache_debug_username;
		if ( ! isset( $wp_cache_debug_username ) ) {
			$wp_cache_debug_username = '';
		}

		wpsc_create_debug_log( $wp_cache_debug_log, $wp_cache_debug_username );
	}

	error_log( $log_message, 3, $log_file );
}

function wpsc_dump_get_request() {
	static $string;

	if ( isset( $string) ) {
		return $string;
	}

	if ( function_exists( 'wp_json_encode' ) ) {
		$string = wp_json_encode( $_GET );
	} else {
		$string = json_encode( $_GET );
	}

	return $string;
}

function wpsc_is_backend() {
	static $is_backend;

	if ( isset( $is_backend ) ) {
		return $is_backend;
	}

	$is_backend = is_admin();
	if ( $is_backend ) {
		return $is_backend;
	}

	$script = isset( $_SERVER['PHP_SELF'] ) ? basename( $_SERVER['PHP_SELF'] ) : '';
	if ( $script !== 'index.php' ) {
		if ( in_array( $script, array( 'wp-login.php', 'xmlrpc.php', 'wp-cron.php' ) ) ) {
			$is_backend = true;
		} elseif ( defined( 'DOING_CRON' ) && DOING_CRON ) {
			$is_backend = true;
		} elseif ( PHP_SAPI == 'cli' || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
			$is_backend = true;
		}
	}

	return $is_backend;
}

function get_supercache_dir( $blog_id = 0 ) {
	global $cache_path;
	if ( $blog_id == 0 ) {
		$home = get_option( 'home' );
	} else {
		$home = get_blog_option( $blog_id, 'home' );
	}
	return trailingslashit( apply_filters( 'wp_super_cache_supercachedir', $cache_path . 'supercache/' . trailingslashit( strtolower( preg_replace( '/:.*$/', '', str_replace( 'http://', '', str_replace( 'https://', '', $home ) ) ) ) ) ) );
}
function get_current_url_supercache_dir( $post_id = 0 ) {
	global $cached_direct_pages, $cache_path, $wp_cache_request_uri, $WPSC_HTTP_HOST, $wp_cache_home_path;
	static $saved_supercache_dir = array();

	if ( isset( $saved_supercache_dir[ $post_id ] ) ) {
		return $saved_supercache_dir[ $post_id ];
	}

	$DONOTREMEMBER = 0;
	if ( $post_id != 0 ) {
		$site_url = site_url();
		$permalink = get_permalink( $post_id );
		if ( false === strpos( $permalink, $site_url ) ) {
			/*
			 * Sometimes site_url doesn't return the siteurl. See https://wordpress.org/support/topic/wp-super-cache-not-refreshing-post-after-comments-made
			 */
			$DONOTREMEMBER = 1;
			wp_cache_debug( "get_current_url_supercache_dir: WARNING! site_url ($site_url) not found in permalink ($permalink).", 1 );
			if ( preg_match( '`^(https?:)?//([^/]+)(/.*)?$`i', $permalink, $matches ) ) {
				if ( $WPSC_HTTP_HOST != $matches[2] ) {
					wp_cache_debug( "get_current_url_supercache_dir: WARNING! SERVER_NAME ({$WPSC_HTTP_HOST}) not found in permalink ($permalink).", 1 );
				}
				wp_cache_debug( "get_current_url_supercache_dir: Removing SERVER_NAME ({$matches[2]}) from permalink ($permalink). Is the url right?", 1 );
				$uri = isset( $matches[3] ) ? $matches[3] : '';
			} elseif ( preg_match( '`^/([^/]+)(/.*)?$`i', $permalink, $matches ) ) {
				wp_cache_debug( "get_current_url_supercache_dir: WARNING! Permalink ($permalink) looks as absolute path. Is the url right?", 1 );
				$uri = $permalink;
			} else {
				wp_cache_debug( "get_current_url_supercache_dir: WARNING! Permalink ($permalink) could not be understood by parsing url. Using front page.", 1 );
				$uri = '';
			}
		} else {
			$uri = str_replace( $site_url, '', $permalink );
			if ( strpos( $uri, $wp_cache_home_path ) !== 0 )
				$uri = rtrim( $wp_cache_home_path, '/' ) . $uri;
		}
	} else {
		$uri = strtolower( $wp_cache_request_uri );
	}
	$uri = wpsc_deep_replace( array( '..', '\\', 'index.php', ), preg_replace( '/[ <>\'\"\r\n\t\(\)]/', '', preg_replace( "/(\?.*)?(#.*)?$/", '', $uri ) ) );
	$hostname = $WPSC_HTTP_HOST;
	// Get hostname from wp options for wp-cron, wp-cli and similar requests.
	if ( empty( $hostname ) && function_exists( 'get_option' ) ) {
		$hostname = (string) parse_url( get_option( 'home' ), PHP_URL_HOST );
	}
	$dir = preg_replace( '/:.*$/', '', $hostname ) . $uri; // To avoid XSS attacks
	if ( function_exists( "apply_filters" ) ) {
		$dir = apply_filters( 'supercache_dir', $dir );
	} else {
		$dir = do_cacheaction( 'supercache_dir', $dir );
	}
	$dir = $cache_path . 'supercache/' . $dir . '/';
	if( is_array( $cached_direct_pages ) && in_array( $_SERVER[ 'REQUEST_URI' ], $cached_direct_pages ) ) {
		$dir = ABSPATH . $uri . '/';
	}
	$dir = str_replace( '..', '', str_replace( '//', '/', $dir ) );
	wp_cache_debug( "supercache dir: $dir", 5 );
	if ( $DONOTREMEMBER == 0 )
		$saved_supercache_dir[ $post_id ] = $dir;
	return $dir;
}

/*
 * Delete (or rebuild) all the files in one directory.
 * Checks if it is in the cache directory but doesn't allow files in the following directories to be deleted:
 * wp-content/cache/
 * wp-content/cache/blogs/
 * wp-content/cache/supercache/
 *
 */
function wpsc_rebuild_files( $dir ) {
	return wpsc_delete_files( $dir, false );
}

// realpath() doesn't always remove the trailing slash
function wpsc_get_realpath( $directory ) {
	if ( $directory == '/' ) {
		return false;
	}

	$original_dir = $directory;
	$directory = realpath( $directory );

	if ( ! $directory ) {
		wp_cache_debug( "wpsc_get_realpath: directory does not exist - $original_dir" );
		return false;
	}

	if ( substr( $directory, -1 ) == '/' || substr( $directory, -1 ) == '\\' ) {
		$directory = substr( $directory, 0, -1 ); // remove trailing slash
	}

	return $directory;
}

// return true if directory is in the cache directory
function wpsc_is_in_cache_directory( $directory ) {
	global $cache_path;
	static $rp_cache_path = '';

	if ( $directory == '' ) {
		wp_cache_debug( 'wpsc_is_in_cache_directory: exiting as directory is blank' );
		return false;
	}

	if ( $cache_path == '' ) {
		wp_cache_debug( 'wpsc_is_in_cache_directory: exiting as cache_path is blank' );
		return false;
	}

	if ( $rp_cache_path == '' ) {
		$rp_cache_path = wpsc_get_realpath( $cache_path );
	}

	if ( ! $rp_cache_path ) {
		wp_cache_debug( 'wpsc_is_in_cache_directory: exiting as cache_path directory does not exist' );
		return false;
	}

	$directory = wpsc_get_realpath( $directory );

	if ( ! $directory ) {
		wp_cache_debug( 'wpsc_is_in_cache_directory: directory does not exist' );
		return false;
	}

	if ( substr( $directory, 0, strlen( $rp_cache_path ) ) == $rp_cache_path ) {
		return true;
	} else {
		return false;
	}
}

function wpsc_delete_files( $dir, $delete = true ) {
	global $cache_path;
	static $protected = '';

	if ( $dir == '' ) {
		wp_cache_debug( 'wpsc_delete_files: directory is blank' );
		return false;
	}
	wp_cache_debug( 'wpsc_delete_files: deleting ' . $dir );

	// only do this once, this function will be called many times
	if ( $protected == '' ) {
		$protected = array( $cache_path, $cache_path . "blogs/", $cache_path . 'supercache' );
		foreach( $protected as $id => $directory ) {
			$protected[ $id ] = trailingslashit( wpsc_get_realpath( $directory ) );
		}
	}

	$orig_dir = $dir;
	$dir = wpsc_get_realpath( $dir );
	if ( ! $dir ) {
		wp_cache_debug( 'wpsc_delete_files: directory does not exist: ' . $orig_dir );
		return false;
	}

	$dir = trailingslashit( $dir );

	if ( ! wpsc_is_in_cache_directory( $dir ) ) {
		wp_cache_debug( 'wpsc_delete_files: directory is not in cache directory: ' . $dir );
		return false;
	}

	if ( in_array( $dir, $protected ) ) {
		wp_cache_debug( 'wpsc_delete_files: directory is protected ' . $dir );
		return false;
	}

	if ( is_dir( $dir ) && $dh = @opendir( $dir ) ) {
		while ( ( $file = readdir( $dh ) ) !== false ) {
			wp_cache_debug( 'wpsc_delete_files: reading files: ' . $file );
			if ( $file != '.' && $file != '..' && $file != '.htaccess' && is_file( $dir . $file ) )
				if ( $delete ) {
					wp_cache_debug( 'wpsc_delete_files: deleting ' . $dir . $file );
					@unlink( $dir . $file );
				} else {
					wp_cache_debug( 'wpsc_delete_files: rebuild or delete ' . $dir . $file );
					@wp_cache_rebuild_or_delete( $dir . $file );
				}
		}
		closedir( $dh );

		if ( $delete ) {
			wp_cache_debug( 'wpsc_delete_files: remove directory ' . $dir );
			@rmdir( $dir );
		}
	} else {
		wp_cache_debug( 'wpsc_delete_files: could not open directory ' . $dir );
	}
	return true;
}

function get_all_supercache_filenames( $dir = '' ) {
	global $wp_cache_mobile_enabled, $cache_path;

	$dir = wpsc_get_realpath( $dir );
	if ( ! $dir ) {
		wp_cache_debug( 'get_all_supercache_filenames: directory does not exist' );
		return array();
	}

	if ( ! wpsc_is_in_cache_directory( $dir ) ) {
		return array();
	}

	$filenames = array( 'index.html', 'index-https.html', 'index.html.php' );

	if ( $dir != '' && isset( $wp_cache_mobile_enabled ) && $wp_cache_mobile_enabled ) {
		// open directory and look for index-*.html files
		if ( is_dir( $dir ) && $dh = @opendir( $dir ) ) {
			while ( ( $file = readdir( $dh ) ) !== false ) {
				if ( substr( $file, 0, 6 ) == 'index-' && strpos( $file, '.html' ) )
					$filenames[] = $file;
			}
			closedir( $dh );
		}
	}

	if ( function_exists( "apply_filters" ) ) {
		$filenames = apply_filters( 'all_supercache_filenames', $filenames );
	} else {
		$filenames = do_cacheaction( 'all_supercache_filenames', $filenames );
	}

	foreach( $filenames as $file ) {
		$out[] = $file;
		$out[] = $file . '.gz';
	}

	return $out;
}

function supercache_filename() {
	global $cached_direct_pages;

	//Add support for https and http caching
	$is_https = ( ( isset( $_SERVER[ 'HTTPS' ] ) && 'on' ==  strtolower( $_SERVER[ 'HTTPS' ] ) ) || ( isset( $_SERVER[ 'HTTP_X_FORWARDED_PROTO' ] ) && 'https' == strtolower( $_SERVER[ 'HTTP_X_FORWARDED_PROTO' ] ) ) ); //Also supports https requests coming from an nginx reverse proxy
	$extra_str = $is_https ? '-https' : '';

	if ( function_exists( "apply_filters" ) ) {
		$extra_str = apply_filters( 'supercache_filename_str', $extra_str );
	} else {
		$extra_str = do_cacheaction( 'supercache_filename_str', $extra_str );
	}

	if ( is_array( $cached_direct_pages ) && in_array( $_SERVER[ 'REQUEST_URI' ], $cached_direct_pages ) ) {
		$extra_str = '';
	}
	$filename = 'index' . $extra_str . '.html';

	return $filename;
}

function get_oc_version() {
	$wp_cache_oc_key = wp_cache_get( "wp_cache_oc_key" );
	if ( ! $wp_cache_oc_key ) {
		$wp_cache_oc_key[ 'key' ] = reset_oc_version();
	} elseif ( $wp_cache_oc_key[ 'ts' ] < time() - 600 )
		wp_cache_set( "wp_cache_oc_key", array( 'ts' => time(), 'key' => $wp_cache_oc_key[ 'key' ] ) );
	return $wp_cache_oc_key[ 'key' ];
}

function reset_oc_version( $version = 1 ) {
	if ( $version == 1 )
		$version = mt_rand();
	wp_cache_set( "wp_cache_oc_key", array( 'ts' => time(), 'key' => $version ) );

	return $version;
}

function get_oc_key( $url = false ) {
	global $wp_cache_gzip_encoding, $WPSC_HTTP_HOST;

	if ( $url ) {
		$key = intval( $_SERVER[ 'SERVER_PORT' ] ) . preg_replace( '/:.*$/', '',  $WPSC_HTTP_HOST ) . $url;
	} else {
		$key = get_current_url_supercache_dir();
	}
	return $key . $wp_cache_gzip_encoding . get_oc_version();
}

function wp_supercache_cache_for_admins() {

	// Don't remove cookies for some requests.
	if (
		wpsc_is_backend() ||
		$_SERVER['REQUEST_METHOD'] !== 'GET' ||
		isset( $_GET['preview'], $_GET['customize_changeset_uuid'] ) || // WPCS: CSRF ok.
		strpos( stripslashes( $_SERVER['REQUEST_URI'] ), '/wp-json/' ) !== false // WPCS: sanitization ok.
	) {
		return true;
	}

	if ( false === do_cacheaction( 'wp_supercache_remove_cookies', true ) ) {
		return true;
	}

	$removed_cookies = array();
	foreach ( wpsc_get_auth_cookies() as $cookie ) {

		$cookies = is_array( $cookie ) ? $cookie : array( $cookie );

		foreach ( $cookies as $cookie_key ) {
			unset( $_COOKIE[ $cookie_key ] );
			$removed_cookies[] = $cookie_key;
		}
	}

	if ( ! empty( $removed_cookies ) ) {
		wp_cache_debug( 'Removing auth from $_COOKIE to allow caching for logged in user ( ' . implode( ', ', $removed_cookies ) . ' )', 5 );
	}
}

/*
 * Check if caching is disabled for the current visitor based on their cookies
 */
function wpsc_is_caching_user_disabled() {
	global $wp_cache_not_logged_in;
	if ( $wp_cache_not_logged_in == 2 && wpsc_get_auth_cookies() ) {
		wp_cache_debug( 'wpsc_is_caching_user_disabled: true because logged in' );
		return true;
	} elseif ( $wp_cache_not_logged_in == 1 && ! empty( $_COOKIE ) ) {
		wp_cache_debug( 'wpsc_is_caching_user_disabled: true because cookie found' );
		return true;
	} else {
		wp_cache_debug( 'wpsc_is_caching_user_disabled: false' );
		return false;
	}
}

/* returns true/false depending on location of $dir. */
function wp_cache_confirm_delete( $dir ) {
	global $cache_path, $blog_cache_dir;
	// don't allow cache_path, blog cache dir, blog meta dir, supercache.
	$dir = wpsc_get_realpath( $dir );

	if ( ! $dir ) {
		wp_cache_debug( 'wp_cache_confirm_delete: directory does not exist' );
		return false;
	}

	if ( ! wpsc_is_in_cache_directory( $dir ) ) {
		return false;
	}

	$rp_cache_path = wpsc_get_realpath( $cache_path );

	if ( ! $rp_cache_path ) {
		wp_cache_debug( "wp_cache_confirm_delete: cache_path does not exist: $cache_path" );
		return false;
	}

	if (
		$dir == '' ||
		$dir == $rp_cache_path ||
		$dir == wpsc_get_realpath( $blog_cache_dir ) ||
		$dir == wpsc_get_realpath( $blog_cache_dir . "meta/" ) ||
		$dir == wpsc_get_realpath( $cache_path . "supercache" )
	) {
		return false;
	} else {
		return true;
	}
}

// copy of _deep_replace() to be used before WordPress loads
function wpsc_deep_replace( $search, $subject ) {
	$subject = (string) $subject;

	$count = 1;
	while ( $count ) {
		$subject = str_replace( $search, '', $subject, $count );
	}

	return $subject;
}

function wpsc_get_protected_directories() {
	global $cache_path, $blog_cache_dir;
	return apply_filters( 'wpsc_protected_directories', array(
									$cache_path . '.htaccess',
									$cache_path . "index.html",
									$blog_cache_dir,
									$blog_cache_dir . "index.html",
									$blog_cache_dir . 'meta',
									$blog_cache_dir . 'meta/index.html',
									$cache_path . 'supercache/index.html',
									$cache_path . 'supercache' )
								);
}

function wpsc_debug_username() {
	global $wp_cache_debug_username;
	if ( ! isset( $wp_cache_debug_username ) || $wp_cache_debug_username == '' ) {
		$wp_cache_debug_username = md5( time() + mt_rand() );
		wp_cache_setting( 'wp_cache_debug_username', $wp_cache_debug_username );
	}
	return $wp_cache_debug_username;
}
function wpsc_create_debug_log( $filename = '', $username = '' ) {
	global $cache_path, $wp_cache_debug_username, $wp_cache_debug_log;
	if ( $filename != '' ) {
		$wp_cache_debug_log = $filename;
	} else {
		$wp_cache_debug_log = md5( time() + mt_rand() ) . ".php";
	}
	if ( $username != '' ) {
		$wp_cache_debug_username = $username;
	} else {
		$wp_cache_debug_username = wpsc_debug_username();
	}

	$msg = 'die( "Please use the viewer" );' . PHP_EOL;
	$fp = fopen( $cache_path . $wp_cache_debug_log, 'w' );
	if ( $fp ) {
		fwrite( $fp, '<' . "?php\n" );
		fwrite( $fp, $msg );
		fwrite( $fp, '?' . "><pre>" . PHP_EOL );
		fwrite( $fp, '<' . '?php // END HEADER ?' . '>' . PHP_EOL );
		fclose( $fp );
		wp_cache_setting( 'wp_cache_debug_log', $wp_cache_debug_log );
		wp_cache_setting( 'wp_cache_debug_username', $wp_cache_debug_username );
	}

	$msg = '
if ( !isset( $_SERVER[ "PHP_AUTH_USER" ] ) || ( $_SERVER[ "PHP_AUTH_USER" ] != "' . $wp_cache_debug_username . '" && $_SERVER[ "PHP_AUTH_PW" ] != "' . $wp_cache_debug_username . '" ) ) {
	header( "WWW-Authenticate: Basic realm=\"WP-Super-Cache Debug Log\"" );
	header( $_SERVER[ "SERVER_PROTOCOL" ] . " 401 Unauthorized" );
	echo "You must login to view the debug log";
	exit;
}' . PHP_EOL;

	$fp = fopen( $cache_path . 'view_' . $wp_cache_debug_log, 'w' );
	if ( $fp ) {
		fwrite( $fp, '<' . "?php" . PHP_EOL );
		$msg .= '$debug_log = file( "./' . $wp_cache_debug_log . '" );
$start_log = 1 + array_search( "<" . "?php // END HEADER ?" . ">" . PHP_EOL, $debug_log );
if ( $start_log > 1 ) {
	$debug_log = array_slice( $debug_log, $start_log );
}
?' . '><form action="" method="GET"><' . '?php

$checks = array( "wp-admin", "exclude_filter", "wp-content", "wp-json" );
foreach( $checks as $check ) {
	if ( isset( $_GET[ $check ] ) ) {
		$$check = 1;
	} else {
		$$check = 0;
	}
}

if ( isset( $_GET[ "filter" ] ) ) {
	$filter = htmlspecialchars( $_GET[ "filter" ] );
} else {
	$filter = "";
}

unset( $checks[1] ); // exclude_filter
?' . '>
<h2>WP Super Cache Log Viewer</h2>
<h3>Warning! Do not copy and paste this log file to a public website!</h3>
<p>This log file contains sensitive information about your website such as cookies and directories.</p>
<p>If you must share it please remove any cookies and remove any directories such as ' . ABSPATH . '.</p>
Exclude requests: <br />
<' . '?php foreach ( $checks as $check ) { ?>
	<label><input type="checkbox" name="<' . '?php echo $check; ?' . '>" value="1" <' . '?php if ( $$check ) { echo "checked"; } ?' . '> /> <' . '?php echo $check; ?' . '></label><br />
<' . '?php } ?' . '>
<br />
Text to filter by:

<input type="text" name="filter" value="<' . '?php echo $filter; ?' . '>" /><br />
<input type="checkbox" name="exclude_filter" value="1" <' . '?php if ( $exclude_filter ) { echo "checked"; } ?' . '> /> Exclude by filter instead of include.<br />
<input type="submit" value="Submit" />
</form>
<' . '?php
$path_to_site = "' . ABSPATH . '";
foreach ( $debug_log as $t => $line ) {
	$line = str_replace( $path_to_site, "ABSPATH/", $line );
	$debug_log[ $t ] = $line;
	foreach( $checks as $check ) {
		if ( $$check && false !== strpos( $line, " /$check/" ) ) {
			unset( $debug_log[ $t ] );
		}
	}
	if ( $filter ) {
		if ( false !== strpos( $line, $filter ) && $exclude_filter ) {
			unset( $debug_log[ $t ] );
		} elseif ( false === strpos( $line, $filter ) && ! $exclude_filter ) {
			unset( $debug_log[ $t ] );
		}
	}
}
foreach( $debug_log as $line ) {
	echo htmlspecialchars( $line ) . "<br />";
}';
		fwrite( $fp, $msg );
		fclose( $fp );
	}

	return array( 'wp_cache_debug_log' => $wp_cache_debug_log, 'wp_cache_debug_username' => $wp_cache_debug_username );
}

function wpsc_delete_url_cache( $url ) {
	if ( false !== strpos( $url, '?' ) ) {
		wp_cache_debug( 'wpsc_delete_url_cache: URL contains the character "?". Not deleting URL: ' . $url );
		return false;
	}
	$dir = str_replace( get_option( 'home' ), '', $url );
	if ( $dir != '' ) {
		$supercachedir = get_supercache_dir();
		wpsc_delete_files( $supercachedir . $dir );
		prune_super_cache( $supercachedir . $dir . '/page', true );
		return true;
	} else {
		return false;
	}
}

// from legolas558 d0t users dot sf dot net at http://www.php.net/is_writable
function is_writeable_ACLSafe( $path ) {

	if (
		( defined( 'PHP_OS_FAMILY' ) && 'Windows' !== constant( 'PHP_OS_FAMILY' ) ) ||
		stristr( PHP_OS, 'DAR' ) ||
		! stristr( PHP_OS, 'WIN' )
	) {
		return is_writeable( $path );
	}

	// PHP's is_writable does not work with Win32 NTFS

	if ( $path[ strlen( $path ) - 1 ] == '/' ) { // recursively return a temporary file path
		return is_writeable_ACLSafe( $path . uniqid( mt_rand() ) . '.tmp' );
	} elseif ( is_dir( $path ) ) {
		return is_writeable_ACLSafe( $path . '/' . uniqid( mt_rand() ) . '.tmp' );
	}

	// check tmp file for read/write capabilities
	$rm = file_exists( $path );
	$f = @fopen( $path, 'a' );
	if ( $f === false )
		return false;
	fclose( $f );
	if ( ! $rm ) {
		unlink( $path );
	}

	return true;
}

function wp_cache_setting( $field, $value ) {
	global $wp_cache_config_file;

	$GLOBALS[ $field ] = $value;
	if ( is_numeric( $value ) ) {
		return wp_cache_replace_line( '^ *\$' . $field, "\$$field = $value;", $wp_cache_config_file );
	} elseif ( is_bool( $value ) ) {
		$output_value = $value === true ? 'true' : 'false';
		return wp_cache_replace_line( '^ *\$' . $field, "\$$field = $output_value;", $wp_cache_config_file );
	} elseif ( is_object( $value ) || is_array( $value ) ) {
		$text = var_export( $value, true );
		$text = preg_replace( '/[\s]+/', ' ', $text );
		return wp_cache_replace_line( '^ *\$' . $field, "\$$field = $text;", $wp_cache_config_file );
	} else {
		return wp_cache_replace_line( '^ *\$' . $field, "\$$field = '$value';", $wp_cache_config_file );
	}
}

function wp_cache_replace_line( $old, $new, $my_file ) {
	if ( @is_file( $my_file ) == false ) {
		if ( function_exists( 'set_transient' ) ) {
			set_transient( 'wpsc_config_error', 'config_file_missing', 10 );
		}
		return false;
	}
	if (!is_writeable_ACLSafe($my_file)) {
		if ( function_exists( 'set_transient' ) ) {
			set_transient( 'wpsc_config_error', 'config_file_ro', 10 );
		}
		trigger_error( "Error: file $my_file is not writable." );
		return false;
	}

	$found = false;
	$loaded = false;
	$c = 0;
	$lines = array();
	while( ! $loaded ) {
		$lines = file( $my_file );
		if ( ! empty( $lines ) && is_array( $lines ) ) {
			$loaded = true;
		} else {
			$c++;
			if ( $c > 100 ) {
				if ( function_exists( 'set_transient' ) ) {
					set_transient( 'wpsc_config_error', 'config_file_not_loaded', 10 );
				}
				trigger_error( "wp_cache_replace_line: Error  - file $my_file could not be loaded." );
				return false;
			}
		}
	}
	foreach( (array) $lines as $line ) {
		if (
			trim( $new ) != '' &&
			trim( $new ) == trim( $line )
		) {
			wp_cache_debug( "wp_cache_replace_line: setting not changed - $new" );
			return true;
		} elseif ( preg_match( "/$old/", $line ) ) {
			wp_cache_debug( "wp_cache_replace_line: changing line " . trim( $line ) . " to *$new*" );
			$found = true;
		}
	}

	$tmp_config_filename = tempnam( $GLOBALS['cache_path'], md5( mt_rand( 0, 9999 ) ) );
	if ( file_exists( $tmp_config_filename . '.php' ) ) {
		unlink( $tmp_config_filename . '.php' );
		if ( file_exists( $tmp_config_filename . '.php' ) ) {
			die( __( 'WARNING: attempt to intercept updating of config file.', 'wp-super-cache' ) );
		}
	}
	rename( $tmp_config_filename, $tmp_config_filename . ".php" );
	$tmp_config_filename .= ".php";
	wp_cache_debug( 'wp_cache_replace_line: writing to ' . $tmp_config_filename );
	$fd = fopen( $tmp_config_filename, 'w' );
	if ( ! $fd ) {
		if ( function_exists( 'set_transient' ) ) {
			set_transient( 'wpsc_config_error', 'config_file_ro', 10 );
		}
		trigger_error( "wp_cache_replace_line: Error  - could not write to $my_file" );
		return false;
	}
	if ( $found ) {
		foreach( (array) $lines as $line ) {
			if ( ! preg_match( "/$old/", $line ) ) {
				fputs( $fd, $line );
			} elseif ( $new != '' ) {
				fputs( $fd, "$new\n" );
			}
		}
	} else {
		$done = false;
		foreach( (array) $lines as $line ) {
			if ( $done || ! preg_match( '/^(if\ \(\ \!\ )?define|\$|\?>/', $line ) ) {
				fputs($fd, $line);
			} else {
				fputs($fd, "$new\n");
				fputs($fd, $line);
				$done = true;
			}
		}
	}
	fclose( $fd );
	rename( $tmp_config_filename, $my_file );
	wp_cache_debug( 'wp_cache_replace_line: moved ' . $tmp_config_filename . ' to ' . $my_file );

	if ( function_exists( "opcache_invalidate" ) ) {
		@opcache_invalidate( $my_file );
	}

	return true;
}

function wpsc_shutdown_message() {
	static $did_wp_footer = false;
	global $wp_super_cache_comments;

	if ( ! defined( 'WPSCSHUTDOWNMESSAGE' ) || ( isset( $wp_super_cache_comments) && ! $wp_super_cache_comments ) ) {
		return;
	}

	if ( ! $did_wp_footer ) {
		$did_wp_footer = true;
		register_shutdown_function( 'wpsc_shutdown_message' );
	} else {
		echo PHP_EOL . '<!-- WP Super Cache: ' . esc_html( constant( 'WPSCSHUTDOWNMESSAGE' ) ) . ' -->' . PHP_EOL;
	}
}

function wp_cache_phase2() {
	global $wp_cache_gzip_encoding, $super_cache_enabled, $cache_rebuild_files, $cache_enabled, $wp_cache_gmt_offset, $wp_cache_blog_charset;

	if ( $cache_enabled == false ) {
		wp_cache_debug( 'wp_cache_phase2: Caching disabled! Exit' );
		define( 'WPSCSHUTDOWNMESSAGE', __( 'Caching disabled. Page not cached.', 'wp-super-cache' ) );
		add_action( 'wp_footer', 'wpsc_shutdown_message' );
		return false;
	}

	if ( wp_cache_user_agent_is_rejected() ) {
		wp_cache_debug( 'wp_cache_phase2: No caching to do as user agent rejected.' );
		return false;
	}

	wp_cache_debug( 'In WP Cache Phase 2', 5 );

	$wp_cache_gmt_offset = get_option( 'gmt_offset' ); // caching for later use when wpdb is gone. https://wordpress.org/support/topic/224349
	$wp_cache_blog_charset = get_option( 'blog_charset' );

	wp_cache_mutex_init();
	if ( function_exists( 'add_action' ) && ( ! defined( 'WPLOCKDOWN' ) || constant( 'WPLOCKDOWN' ) == '0' ) ) {
		wp_cache_debug( 'Setting up WordPress actions', 5 );

		add_action( 'template_redirect', 'wp_super_cache_query_vars' );
		add_filter( 'wp_redirect_status', 'wpsc_catch_http_status_code' );
		add_filter( 'status_header', 'wpsc_catch_status_header', 10, 2 );
		add_filter( 'supercache_filename_str', 'wp_cache_check_mobile' );

		wpsc_register_post_hooks();

		do_cacheaction( 'add_cacheaction' );
	}

	if ( wpsc_is_backend() ) {
		wp_cache_debug( 'Not caching wp-admin requests.', 5 );
		return false;
	}

	if ( ! empty( $_GET ) ) {
		wp_cache_debug( 'Supercache caching disabled. Only using wp-cache. Non empty GET request. ' . wpsc_dump_get_request(), 5 );
		$super_cache_enabled = false;
	}

	if ( defined( 'WPSC_VARY_HEADER' ) ) {
		if ( WPSC_VARY_HEADER != '' ) {
			header( 'Vary: ' . WPSC_VARY_HEADER );
		}
	} else {
		header( 'Vary: Accept-Encoding, Cookie' );
	}

	ob_start( 'wp_cache_ob_callback' );
	wp_cache_debug( 'Created output buffer', 4 );

	// restore old supercache file temporarily
	if ( ( $_SERVER['REQUEST_METHOD'] !== 'POST' && empty( $_POST ) ) && $super_cache_enabled && $cache_rebuild_files ) {
		$user_info = wp_cache_get_cookies_values();

		if( empty( $user_info )
			|| true === apply_filters( 'do_createsupercache', $user_info )
		) {
			wpcache_do_rebuild( get_current_url_supercache_dir() );
		}
	}

	schedule_wp_gc();
}

function wpsc_register_post_hooks() {
	static $done = false;

	if ( $done ) {
		return;
	}

	if ( false === $GLOBALS['cache_enabled']
		|| ( defined( 'WPLOCKDOWN' ) && constant( 'WPLOCKDOWN' ) != '0' )
	) {
		$done = true;
		return;
	}

	// Post ID is received
	add_action( 'wp_trash_post', 'wp_cache_post_edit', 0 );
	add_action( 'publish_post', 'wp_cache_post_edit', 0 );
	add_action( 'edit_post', 'wp_cache_post_change', 0 ); // leaving a comment called edit_post
	add_action( 'delete_post', 'wp_cache_post_edit', 0 );
	add_action( 'publish_phone', 'wp_cache_post_edit', 0 );

	// Coment ID is received
	add_action( 'trackback_post', 'wp_cache_get_postid_from_comment', 99 );
	add_action( 'pingback_post', 'wp_cache_get_postid_from_comment', 99 );
	add_action( 'comment_post', 'wp_cache_get_postid_from_comment', 99 );
	add_action( 'edit_comment', 'wp_cache_get_postid_from_comment', 99 );
	add_action( 'wp_set_comment_status', 'wp_cache_get_postid_from_comment', 99, 2 );

	// No post_id is available
	add_action( 'switch_theme', 'wp_cache_no_postid', 99 );
	add_action( 'edit_user_profile_update', 'wp_cache_no_postid', 99 );
	add_action( 'wp_update_nav_menu', 'wp_cache_clear_cache_on_menu' );
	add_action( 'clean_post_cache', 'wp_cache_post_edit' );
	add_action( 'transition_post_status', 'wpsc_post_transition', 10, 3 );

	// Cron hooks
	add_action( 'wp_cache_gc','wp_cache_gc_cron' );
	add_action( 'wp_cache_gc_watcher', 'wp_cache_gc_watcher' );

	$done = true;
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
		wp_cache_debug( 'wpcache_do_rebuild: exiting as directory does not exist.' );
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

function wp_cache_user_agent_is_rejected() {
	global $cache_rejected_user_agent;

	if ( empty( $cache_rejected_user_agent ) || ! is_array( $cache_rejected_user_agent ) ) {
		return false;
	}

	$headers = apache_request_headers();
	if ( empty( $headers['User-Agent'] ) ) {
		return false;
	}

	foreach ( $cache_rejected_user_agent as $user_agent ) {
		if ( ! empty( $user_agent ) && stristr( $headers['User-Agent'], $user_agent ) ) {
			return true;
		}
	}

	return false;
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
		'Referrer-Policy',
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
		'X-Pingback',
		'X-Content-Security-Policy',
		'X-WebKit-CSP',
		'X-Content-Type-Options',
		'X-Powered-By',
		'X-UA-Compatible',
		'X-Robots-Tag',
	);

	if ( ! function_exists( 'headers_list' ) ) {
		return array();
	}

	$known_headers = apply_filters( 'wpsc_known_headers', $known_headers );

	if ( ! isset( $known_headers['age'] ) ) {
		$known_headers = array_map( 'strtolower', $known_headers );
	}

	$headers = array();
	foreach ( headers_list() as $hdr ) {
		$ptr = strpos( $hdr, ':' );

		if ( empty( $ptr ) ) {
			continue;
		}

		$hdr_key = rtrim( substr( $hdr, 0, $ptr ) );

		if ( in_array( strtolower( $hdr_key ), $known_headers, true ) ) {
			$hdr_val = ltrim( substr( $hdr, $ptr + 1 ) );

			if ( ! empty( $headers[ $hdr_key ] ) ) {
				$hdr_val = $headers[ $hdr_key ] . ', ' . $hdr_val;
			}

			$headers[ $hdr_key ] = $hdr_val;
		}
	}

	return $headers;
}

function wpsc_is_rejected_cookie() {
	global $wpsc_rejected_cookies;
	if ( false == is_array( $wpsc_rejected_cookies ) ) {
		return false;
	}

	foreach ( $wpsc_rejected_cookies as $expr ) {
		if ( $expr !== '' && $match = preg_grep( "~$expr~", array_keys( $_COOKIE ) ) ) {
			wp_cache_debug( 'wpsc_is_rejected_cookie: found cookie: ' . $expr );
			return true;
		}
	}
	return false;
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
		wp_cache_debug( '(writers entry) mutex lock not created. not caching.', 2 );
		return false;
	}

	if ( $use_flock ) {
		wp_cache_debug( 'grabbing lock using flock()', 5 );
		flock($mutex,  LOCK_EX);
	} else {
		wp_cache_debug( 'grabbing lock using sem_acquire()', 5 );
		@sem_acquire($mutex);
	}

	return true;
}

function wp_cache_writers_exit() {
	global $mutex, $wp_cache_mutex_disabled, $use_flock;

	if ( defined( 'WPSC_DISABLE_LOCKING' ) || ( isset( $wp_cache_mutex_disabled ) && $wp_cache_mutex_disabled ) )
		return true;

	if( !$mutex ) {
		wp_cache_debug( '(writers exit) mutex lock not created. not caching.', 2 );
		return false;
	}

	if ( $use_flock ) {
		wp_cache_debug( 'releasing lock using flock()', 5 );
		flock( $mutex,  LOCK_UN );
	} else {
		wp_cache_debug( 'releasing lock using sem_release() and sem_remove()', 5 );
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

	// REST API
	if ( ( defined( 'REST_REQUEST' )   && REST_REQUEST ) ||
	     ( defined( 'JSON_REQUEST' )   && JSON_REQUEST ) ||
	     ( defined( 'WC_API_REQUEST' ) && WC_API_REQUEST )
	) {
		$wp_super_cache_query[ 'is_rest' ] = 1;
	}

	// Feeds, sitemaps and robots.txt
	if ( is_feed() ) {
		$wp_super_cache_query[ 'is_feed' ] = 1;
		if ( get_query_var( 'feed' ) == 'sitemap' ) {
			$wp_super_cache_query[ 'is_sitemap' ] = 1;
		}
	} elseif ( get_query_var( 'sitemap' ) || get_query_var( 'xsl' ) || get_query_var( 'xml_sitemap' ) ) {
		$wp_super_cache_query[ 'is_feed' ] = 1;
		$wp_super_cache_query[ 'is_sitemap' ] = 1;
	} elseif ( is_robots() ) {
		$wp_super_cache_query[ 'is_robots' ] = 1;
	}

	// Reset everything if it's 404
	if ( is_404() )
		$wp_super_cache_query = array( 'is_404' => 1 );

	return $wp_super_cache_query;
}

function wpsc_catch_status_header( $status_header, $code ) {

	if ( $code != 200 )
		wpsc_catch_http_status_code( $code );

	return $status_header;
}

function wpsc_catch_http_status_code( $status ) {
	global $wp_super_cache_query;

	if ( in_array( intval( $status ), array( 301, 302, 303, 307 ) ) ) {
		$wp_super_cache_query[ 'is_redirect' ] = 1;
	} elseif ( $status == 304 ) {
		$wp_super_cache_query[ 'is_304' ] = 1;
	} elseif ( $status == 404 ) {
		$wp_super_cache_query[ 'is_404' ] = 1;
	}

	return $status;
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
	global $wp_cache_pages, $wp_query, $wp_super_cache_query, $cache_acceptable_files, $wp_cache_no_cache_for_get, $wp_cache_request_uri, $do_rebuild_list, $wpsc_file_mtimes, $wpsc_save_headers, $super_cache_enabled;
	$script = basename( $_SERVER[ 'PHP_SELF' ] );

	// All the things that can stop a page being cached
	$cache_this_page = true;

	if ( wpsc_is_fatal_error() ) {
		wp_cache_debug( 'wp_cache_ob_callback: PHP Fatal error occurred. Not caching incomplete page.' );
		$cache_this_page = false;
	} elseif ( empty( $wp_super_cache_query ) && !empty( $buffer ) && is_object( $wp_query ) && method_exists( $wp_query, 'get' ) ) {
		$wp_super_cache_query = wp_super_cache_query_vars();
	} elseif ( empty( $wp_super_cache_query ) && function_exists( 'http_response_code' ) ) {
		wpsc_catch_http_status_code( http_response_code() );
	}

	$buffer = apply_filters( 'wp_cache_ob_callback_filter', $buffer );

	if ( defined( 'DONOTCACHEPAGE' ) ) {
		wp_cache_debug( 'DONOTCACHEPAGE defined. Caching disabled.', 2 );
		$cache_this_page = false;
	} elseif ( $wp_cache_no_cache_for_get && ! empty( $_GET ) ) {
		wp_cache_debug( 'Non empty GET request. Caching disabled on settings page. ' . wpsc_dump_get_request(), 1 );
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
	} elseif ( isset( $_GET[ 'preview' ] ) ) {
		wp_cache_debug( 'Not caching preview post.', 2 );
		$cache_this_page = false;
	} elseif ( !in_array( $script, (array) $cache_acceptable_files ) && wp_cache_is_rejected( $wp_cache_request_uri ) ) {
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
	} elseif ( isset( $wp_super_cache_query[ 'is_rest' ] ) ) {
		wp_cache_debug( 'REST API detected. Caching disabled.' );
		$cache_this_page = false;
	} elseif ( isset( $wp_super_cache_query[ 'is_robots' ] ) ) {
		wp_cache_debug( 'robots.txt detected. Caching disabled.' );
		$cache_this_page = false;
	} elseif ( isset( $wp_super_cache_query[ 'is_redirect' ] ) ) {
		wp_cache_debug( 'Redirect detected. Caching disabled.' );
		$cache_this_page = false;
	} elseif ( isset( $wp_super_cache_query[ 'is_304' ] ) ) {
		wp_cache_debug( 'HTTP 304 (Not Modified) sent. Caching disabled.' );
		$cache_this_page = false;
	} elseif ( empty( $wp_super_cache_query ) && !empty( $buffer ) && apply_filters( 'wpsc_only_cache_known_pages', 1 ) ) {
		wp_cache_debug( 'wp_cache_ob_callback: wp_super_cache_query is empty. Not caching unknown page type. Return 0 to the wpsc_only_cache_known_pages filter to cache this page.' );
		$cache_this_page = false;
	} elseif ( wpsc_is_caching_user_disabled() ) {
		wp_cache_debug( 'wp_cache_ob_callback: Caching disabled for known user. User logged in or cookie found.' );
		$cache_this_page = false;
	} elseif ( wp_cache_user_agent_is_rejected() ) {
		wp_cache_debug( 'wp_cache_ob_callback: Caching disabled because user agent was rejected.' );
		$cache_this_page = false;
	}

	if ( isset( $wpsc_save_headers ) && $wpsc_save_headers )
		$super_cache_enabled = false; // use standard caching to record headers

	if ( $cache_this_page ) {

		wp_cache_debug( 'Output buffer callback', 4 );

		$buffer = wp_cache_get_ob( $buffer );
		wp_cache_shutdown_callback();

		if ( !empty( $wpsc_file_mtimes ) && is_array( $wpsc_file_mtimes ) ) {
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
		if ( !empty( $do_rebuild_list ) && is_array( $do_rebuild_list ) ) {
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
		$msg = "Cached page generated by WP-Super-Cache on $timestamp";
	} else {
		$msg = "Live page served on $timestamp";
	}

	if ( strpos( $buffer, '<html' ) === false ) {
		wp_cache_debug( site_url( $_SERVER[ 'REQUEST_URI' ] ) . " - " . $msg );
		return false;
	}

	$buffer .= "\n<!-- $msg -->\n";
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
	global $gzsize, $supercacheonly;
	global $blog_cache_dir, $wp_supercache_cache_list;
	global $wp_cache_not_logged_in, $cache_max_time;
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

	if ( isset( $wp_super_cache_query[ 'is_404' ] ) && false == apply_filters( 'wpsupercache_404', false ) ) {
		$new_cache = false;
		if ( isset( $GLOBALS[ 'wp_super_cache_debug' ] ) && $GLOBALS[ 'wp_super_cache_debug' ] ) {
			wp_cache_debug( '404 file not found not cached', 2 );
			wp_cache_add_to_buffer( $buffer, "Page not cached by WP Super Cache. 404." );
		}
	}

	if ( !preg_match( apply_filters( 'wp_cache_eof_tags', '/(<\/html>|<\/rss>|<\/feed>|<\/urlset|<\?xml)/i' ), $buffer ) ) {
		$new_cache = false;
		if ( isset( $GLOBALS[ 'wp_super_cache_debug' ] ) && $GLOBALS[ 'wp_super_cache_debug' ] ) {
			wp_cache_debug( 'No closing html tag. Not caching.', 2 );
			wp_cache_add_to_buffer( $buffer, "Page not cached by WP Super Cache. No closing HTML tag. Check your theme." );
		}
	}

	if( !$new_cache )
		return wp_cache_maybe_dynamic( $buffer );

	$duration = wp_cache_microtime_diff($wp_start_time, microtime());
	$duration = sprintf("%0.3f", $duration);
	wp_cache_add_to_buffer( $buffer, "Dynamic page generated in $duration seconds." );

	if( !wp_cache_writers_entry() ) {
		wp_cache_add_to_buffer( $buffer, "Page not cached by WP Super Cache. Could not get mutex lock." );
		wp_cache_debug( 'Could not get mutex lock. Not caching.', 1 );
		return wp_cache_maybe_dynamic( $buffer );
	}

	if ( $wp_cache_not_logged_in && isset( $wp_super_cache_query[ 'is_feed' ] ) ) {
		wp_cache_debug( 'Feed detected. Writing wpcache cache files.', 5 );
		$wp_cache_not_logged_in = false;
	}

	$home_url = parse_url( trailingslashit( get_bloginfo( 'url' ) ) );

	$dir = get_current_url_supercache_dir();
	$supercachedir = $cache_path . 'supercache/' . preg_replace('/:.*$/', '',  $home_url[ 'host' ]);
	if ( ! empty( $_GET ) || isset( $wp_super_cache_query[ 'is_feed' ] ) || ( $super_cache_enabled == true && is_dir( substr( $supercachedir, 0, -1 ) . '.disabled' ) ) ) {
		wp_cache_debug( 'Supercache disabled: GET or feed detected or disabled by config.', 2 );
		$super_cache_enabled = false;
	}

	$tmp_wpcache_filename = $cache_path . uniqid( mt_rand(), true ) . '.tmp';

	if ( defined( 'WPSC_SUPERCACHE_ONLY' ) ) {
		$supercacheonly = true;
		wp_cache_debug( 'wp_cache_get_ob: WPSC_SUPERCACHE_ONLY defined. Only creating supercache files.' );
	} else {
		$supercacheonly = false;
	}

	if( $super_cache_enabled ) {
		if ( wp_cache_get_cookies_values() == '' && empty( $_GET ) ) {
			wp_cache_debug( 'Anonymous user detected. Only creating Supercache file.', 3 );
			$supercacheonly = true;
		}
	}

	$cache_error = '';
	if ( wpsc_is_caching_user_disabled() ) {
		$super_cache_enabled = false;
		$cache_enabled = false;
		$cache_error = 'Not caching requests by known users. (See Advanced Settings page)';
		wp_cache_debug( 'Not caching for known user.', 5 );
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
		wp_cache_debug( 'wp_cache_get_ob: not caching as directory does not exist.' );
		return $buffer;
	}

	$dir = trailingslashit( $dir );

	if ( ! wpsc_is_in_cache_directory( $dir ) ) {
		wp_cache_debug( "wp_cache_get_ob: not caching as directory is not in cache_path: $dir" );
		return $buffer;
	}

	$fr = $fr2 = $gz = false;
	// Open wp-cache cache file
	if ( ! $supercacheonly ) {
		$fr = @fopen( $tmp_wpcache_filename, 'w' );
		if ( ! $fr ) {
			wp_cache_debug( 'Error. Supercache could not write to ' . str_replace( ABSPATH, '', $cache_path ) . $cache_filename, 1 );
			wp_cache_add_to_buffer( $buffer, "File not cached! Super Cache Couldn't write to: " . str_replace( ABSPATH, '', $cache_path ) . $cache_filename );
			wp_cache_writers_exit();
			return wp_cache_maybe_dynamic( $buffer );
		}
	} else {
		$user_info = wp_cache_get_cookies_values();
		$do_cache = apply_filters( 'do_createsupercache', $user_info );
		if (
			$super_cache_enabled &&
			(
				$user_info == '' ||
				$do_cache === true
			)
		) {
			$cache_fname = $dir . supercache_filename();
			$tmp_cache_filename = $dir . uniqid( mt_rand(), true ) . '.tmp';
			$fr2 = @fopen( $tmp_cache_filename, 'w' );
			if ( !$fr2 ) {
				wp_cache_debug( 'Error. Supercache could not write to ' . str_replace( ABSPATH, '', $tmp_cache_filename ), 1 );
				wp_cache_add_to_buffer( $buffer, "File not cached! Super Cache Couldn't write to: " . str_replace( ABSPATH, '', $tmp_cache_filename ) );
				@fclose( $fr );
				@unlink( $tmp_wpcache_filename );
				wp_cache_writers_exit();
				return wp_cache_maybe_dynamic( $buffer );
			} elseif (
				$cache_compression &&
				(
					! isset( $wp_cache_mfunc_enabled ) ||
					$wp_cache_mfunc_enabled == 0
				)
			) { // don't want to store compressed files if using dynamic content
				$gz = @fopen( $tmp_cache_filename . ".gz", 'w');
				if ( !$gz ) {
					wp_cache_debug( 'Error. Supercache could not write to ' . str_replace( ABSPATH, '', $tmp_cache_filename ) . ".gz", 1 );
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
			wp_cache_debug( 'mfunc/mclude/dynamic-cached-content tags have been retired. Please update your theme. See docs for updates.' );
			wp_cache_add_to_buffer( $buffer, "Warning! Obsolete mfunc/mclude/dynamic-cached-content tags found. Please update your theme. See http://ocaoimh.ie/y/5b for more information." );
		}

		global $wp_super_cache_late_init;
		if ( false == isset( $wp_super_cache_late_init ) || ( isset( $wp_super_cache_late_init ) && $wp_super_cache_late_init == 0 ) )
			wp_cache_add_to_buffer( $buffer, 'Super Cache dynamic page detected but late init not set. See the readme.txt for further details.' );

		if ( $fr ) { // wpcache caching
			wp_cache_debug( 'Writing dynamic buffer to wpcache file.' );
			wp_cache_add_to_buffer( $buffer, "Dynamic WPCache Super Cache" );
			fputs( $fr, '<?php die(); ?>' . $buffer );
		} elseif ( isset( $fr2 ) ) { // supercache active
			wp_cache_debug( 'Writing dynamic buffer to supercache file.' );
			wp_cache_add_to_buffer( $buffer, "Dynamic Super Cache" );
			fputs( $fr2, $buffer );
		}
		$wp_cache_meta[ 'dynamic' ] = true;
		if ( $wp_cache_mfunc_enabled == 1 && do_cacheaction( 'wpsc_cachedata_safety', 0 ) === 1 ) {
			$buffer = do_cacheaction( 'wpsc_cachedata', $buffer ); // dynamic content for display
		}

		if ( $cache_compression && $wp_cache_gzip_encoding ) {
			wp_cache_debug( 'Gzipping dynamic buffer for display.', 5 );
			wp_cache_add_to_buffer( $buffer, "Compression = gzip" );
			$gzdata = gzencode( $buffer, 6, FORCE_GZIP );
			$gzsize = function_exists( 'mb_strlen' ) ? mb_strlen( $gzdata, '8bit' ) : strlen( $gzdata );
		}
	} else {
		if ( defined( 'WPSC_VARY_HEADER' ) ) {
			if ( WPSC_VARY_HEADER != '' ) {
				$vary_header = WPSC_VARY_HEADER;
			} else {
				$vary_header = '';
			}
		} else {
			$vary_header = 'Accept-Encoding, Cookie';
		}
		if ( $vary_header ) {
			$wp_cache_meta[ 'headers' ][ 'Vary' ] = 'Vary: ' . $vary_header;
		}
		if ( $gz || $wp_cache_gzip_encoding ) {
			wp_cache_debug( 'Gzipping buffer.', 5 );
			wp_cache_add_to_buffer( $buffer, "Compression = gzip" );
			$gzdata = gzencode( $buffer, 6, FORCE_GZIP );
			$gzsize = function_exists( 'mb_strlen' ) ? mb_strlen( $gzdata, '8bit' ) : strlen( $gzdata );

			$wp_cache_meta[ 'headers' ][ 'Content-Encoding' ] = 'Content-Encoding: ' . $wp_cache_gzip_encoding;
			// Return uncompressed data & store compressed for later use
			if ( $fr ) {
				wp_cache_debug( 'Writing gzipped buffer to wp-cache cache file.', 5 );
				fputs($fr, '<?php die(); ?>' . $gzdata);
			}
		} else { // no compression
			if ( $fr ) {
				wp_cache_debug( 'Writing non-gzipped buffer to wp-cache cache file.' );
				fputs($fr, '<?php die(); ?>' . $buffer);
			}
		}
		if ( $fr2 ) {
			wp_cache_debug( 'Writing non-gzipped buffer to supercache file.' );
			wp_cache_add_to_buffer( $buffer, "super cache" );
			fputs($fr2, $buffer );
		}
		if ( isset( $gzdata ) && $gz ) {
			wp_cache_debug( 'Writing gzipped buffer to supercache file.' );
			fwrite($gz, $gzdata );
		}
	}

	$new_cache = true;
	if ( $fr ) {
		$supercacheonly = false;
		fclose( $fr );
		if ( filesize( $tmp_wpcache_filename ) == 0 ) {
			wp_cache_debug( "Warning! The file $tmp_wpcache_filename was empty. Did not rename to {$dir}{$cache_filename}", 5 );
			@unlink( $tmp_wpcache_filename );
		} else {
			if ( ! @rename( $tmp_wpcache_filename, $dir . $cache_filename ) ) {
				if ( false == is_dir( $dir ) ) {
					@wp_mkdir_p( $dir );
				}
				@unlink( $dir . $cache_filename );
				@rename( $tmp_wpcache_filename, $dir . $cache_filename );
			}
			if ( file_exists( $dir . $cache_filename ) ) {
				wp_cache_debug( "Renamed temp wp-cache file to {$dir}{$cache_filename}", 5 );
			} else {
				wp_cache_debug( "FAILED to rename temp wp-cache file to {$dir}{$cache_filename}", 5 );
			}
			$added_cache = 1;
		}
	}

	if ( $fr2 ) {
		fclose( $fr2 );
		if ( $wp_cache_front_page_checks && $cache_fname == $supercachedir . $home_url[ 'path' ] . supercache_filename() && !( $wp_cache_is_home ) ) {
			wp_cache_writers_exit();
			wp_cache_debug( 'Warning! Not writing another page to front page cache.', 1 );
			return $buffer;
		} elseif ( filesize( $tmp_cache_filename ) == 0 ) {
			wp_cache_debug( "Warning! The file $tmp_cache_filename was empty. Did not rename to {$cache_fname}", 5 );
			@unlink( $tmp_cache_filename );
		} else {
			if ( ! @rename( $tmp_cache_filename, $cache_fname ) ) {
				@unlink( $cache_fname );
				@rename( $tmp_cache_filename, $cache_fname );
			}
			wp_cache_debug( "Renamed temp supercache file to $cache_fname", 5 );
			$added_cache = 1;
		}
	}
	if ( $gz ) {
		fclose( $gz );
		if ( filesize( $tmp_cache_filename . '.gz' ) == 0 ) {
			wp_cache_debug( "Warning! The file {$tmp_cache_filename}.gz was empty. Did not rename to {$cache_fname}.gz", 5 );
			@unlink( $tmp_cache_filename . '.gz' );
		} else {
			if ( ! @rename( $tmp_cache_filename . '.gz', $cache_fname . '.gz' ) ) {
				@unlink( $cache_fname . '.gz' );
				@rename( $tmp_cache_filename . '.gz', $cache_fname . '.gz' );
			}
			wp_cache_debug( "Renamed temp supercache gz file to {$cache_fname}.gz", 5 );
			$added_cache = 1;
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
		wp_cache_debug( 'Writing gzip content headers. Sending buffer to browser', 5 );
		header( 'Content-Encoding: ' . $wp_cache_gzip_encoding );
		if ( defined( 'WPSC_VARY_HEADER' ) ) {
			if ( WPSC_VARY_HEADER != '' ) {
				$vary_header = WPSC_VARY_HEADER;
			} else {
				$vary_header = '';
			}
		} else {
			$vary_header = 'Accept-Encoding, Cookie';
		}
		if ( $vary_header ) {
			header( 'Vary: ' . $vary_header );
		}
		header( 'Content-Length: ' . $gzsize );
		return $gzdata;
	} else {
		wp_cache_debug( 'Sending buffer to browser', 5 );
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
		do_action( 'wp_cache_cleared' );
	}
	wp_cache_writers_exit();
}

function prune_super_cache( $directory, $force = false, $rename = false ) {

	// Don't prune a NULL/empty directory.
	if ( null === $directory || '' === $directory ) {
		wp_cache_debug( 'prune_super_cache: directory is blank' );
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

	if ( $cache_max_time == 0 ) {
		wp_cache_debug( "wp_cache_phase2_clean_expired: disabled because GC disabled.", 2 );
		return false;
	}

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
	global $wp_cache_request_uri, $wp_cache_key, $cache_enabled, $wp_cache_blog_charset, $wp_cache_not_logged_in;
	global $WPSC_HTTP_HOST, $wp_super_cache_query;

	if ( ! function_exists( 'wpsc_init' ) ) {
		/*
		 * If a server has multiple networks the plugin may not have been activated
		 * on all of them. Give feeds on those blogs a short TTL.
		 * ref: https://wordpress.org/support/topic/fatal-error-while-updating-post-or-publishing-new-one/
		 */
		$wpsc_feed_ttl = 1;
		wp_cache_debug( 'wp_cache_shutdown_callback: Plugin not loaded. Setting feed ttl to 60 seconds.' );
	}


	if ( false == $new_cache ) {
		wp_cache_debug( 'wp_cache_shutdown_callback: No cache file created. Returning.' );
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

	wp_cache_debug( 'wp_cache_shutdown_callback: collecting meta data.', 2 );

	if (!isset( $response['Last-Modified'] )) {
		$value = gmdate('D, d M Y H:i:s') . ' GMT';
		/* Dont send this the first time */
		/* @header('Last-Modified: ' . $value); */
		$wp_cache_meta[ 'headers' ][ 'Last-Modified' ] = "Last-Modified: $value";
	}
	$is_feed = false;
	if ( !isset( $response[ 'Content-Type' ] ) && !isset( $response[ 'Content-type' ] ) ) {
		// On some systems, headers set by PHP can't be fetched from
		// the output buffer. This is a last ditch effort to set the
		// correct Content-Type header for feeds, if we didn't see
		// it in the response headers already. -- dougal
		if ( isset( $wp_super_cache_query[ 'is_feed' ] ) ) {
			if ( isset( $wp_super_cache_query[ 'is_sitemap' ] ) )  {
				$type  = 'sitemap';
				$value = 'text/xml';
			} else {
				$type = get_query_var( 'feed' );
				$type = str_replace('/','',$type);
				switch ($type) {
					case 'atom':
						$value = 'application/atom+xml';
						break;
					case 'rdf':
						$value = 'application/rdf+xml';
						break;
					case 'rss':
					case 'rss2':
					default:
						$value = 'application/rss+xml';
				}
			}
			$is_feed = true;

			if ( isset( $wpsc_feed_ttl ) && $wpsc_feed_ttl == 1 ) {
				$wp_cache_meta[ 'ttl' ] = 60;
			}
			$is_feed = true;

			wp_cache_debug( "wp_cache_shutdown_callback: feed is type: $type - $value" );
		} elseif ( isset( $wp_super_cache_query[ 'is_rest' ] ) ) { // json
			$value = 'application/json';
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
			wp_cache_debug( 'Sending gzip headers.', 2 );
			$wp_cache_meta[ 'headers' ][ 'Content-Encoding' ] = 'Content-Encoding: ' . $wp_cache_gzip_encoding;
			if ( defined( 'WPSC_VARY_HEADER' ) ) {
				if ( WPSC_VARY_HEADER != '' ) {
					$vary_header = WPSC_VARY_HEADER;
				} else {
					$vary_header = '';
				}
			} else {
				$vary_header = 'Accept-Encoding, Cookie';
			}
			if ( $vary_header ) {
				$wp_cache_meta[ 'headers' ][ 'Vary' ] = 'Vary: ' . $vary_header;
			}
		}

		$serial = '<?php die(); ?>' . json_encode( $wp_cache_meta );
		$dir = get_current_url_supercache_dir();
		if( @is_dir( $dir ) == false )
			@wp_mkdir_p( $dir );

		if( wp_cache_writers_entry() ) {
			wp_cache_debug( "Writing meta file: {$dir}meta-{$meta_file}", 2 );

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
			wp_cache_writers_exit();

			// record locations of archive feeds to be updated when the site is updated.
			// Only record a maximum of 50 feeds to avoid bloating database.
			if ( ( isset( $wp_super_cache_query[ 'is_feed' ] ) || $is_feed ) && ! isset( $wp_super_cache_query[ 'is_single' ] ) ) {
				$wpsc_feed_list = (array) get_option( 'wpsc_feed_list' );
				if ( count( $wpsc_feed_list ) <= 50 ) {
					$wpsc_feed_list[] = $dir . $meta_file;
					update_option( 'wpsc_feed_list', $wpsc_feed_list );
				}
			}
		}
	} else {
		wp_cache_debug( "Did not write meta file: meta-{$meta_file}\nsupercacheonly: $supercacheonly\nwp_cache_not_logged_in: $wp_cache_not_logged_in\nnew_cache:$new_cache" );
	}
	global $time_to_gc_cache;
	if( isset( $time_to_gc_cache ) && $time_to_gc_cache == 1 ) {
		wp_cache_debug( 'Executing wp_cache_gc action.', 3 );
		do_action( 'wp_cache_gc' );
	}
}

function wp_cache_no_postid($id) {
	return wp_cache_post_change(wp_cache_post_id());
}

function wp_cache_get_postid_from_comment( $comment_id, $status = 'NA' ) {
	global $super_cache_enabled, $wp_cache_request_uri;

	if ( defined( 'DONOTDELETECACHE' ) ) {
		return;
	}

	// Check is it "Empty Spam" or "Empty Trash"
	if ( isset( $GLOBALS[ 'pagenow' ] ) && $GLOBALS[ 'pagenow' ] === 'edit-comments.php' &&
		( isset( $_REQUEST['delete_all'] ) || isset( $_REQUEST['delete_all2'] ) )
	) {
		wp_cache_debug( "Delete all SPAM or Trash comments. Don't delete any cache files.", 4 );
		define( 'DONOTDELETECACHE', 1 );
		return;
	}

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
	$postid = isset( $comment[ 'comment_post_ID' ] ) ? (int) $comment[ 'comment_post_ID' ] : 0;
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
				wp_cache_debug( 'Moderated ping or trackback. Not deleting cache files..', 4 );
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
	} else {
		wp_cache_debug( 'Unknown post changed. Update cache.', 4 );
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
	global $cache_path;

	if ( $blog_id == 0 ) {
		wp_cache_debug( 'Clearing all cached files in wp_cache_clear_cache()', 4 );
		prune_super_cache( $cache_path . 'supercache/', true );
		prune_super_cache( $cache_path, true );
	} else {
		wp_cache_debug( "Clearing all cached files for blog $blog_id in wp_cache_clear_cache()", 4 );
		prune_super_cache( get_supercache_dir( $blog_id ), true );
		prune_super_cache( $cache_path . 'blogs/', true );
	}

	do_action( 'wp_cache_cleared' );
}

function wpsc_delete_post_archives( $post ) {
	$post = @get_post( $post );
	if ( ! is_object( $post ) ) {
		return;
	}

	// Taxonomies - categories, tags, custom taxonomies
	foreach( get_object_taxonomies( $post, 'objects' ) as $taxonomy ) {

		if ( ! $taxonomy->public || ! $taxonomy->rewrite ) {
			continue;
		}

		$terms = get_the_terms( $post->ID, $taxonomy->name );
		if ( empty( $terms ) ) {
			continue;
		}

		foreach( $terms as $term ) {

			$term_url = get_term_link( $term, $taxonomy->name );
			if ( is_wp_error( $term_url ) ) {
				continue;
			}

			wpsc_delete_url_cache( $term_url );
			wp_cache_debug( 'wpsc_delete_post_archives: deleting cache of taxonomies: ' . $term_url );
		}
	}

	// Post type archive page
	if ( $post->post_type === 'page' ) {
		$archive_url = false;
	} elseif ( $post->post_type === 'post' && get_option( 'show_on_front' ) !== 'posts' && ! get_option( 'page_for_posts' ) ) {
		$archive_url = false;
	} else {
		$archive_url = get_post_type_archive_link( $post->post_type );
	}

	if ( $archive_url ) {
		wpsc_delete_url_cache( $archive_url );
		wp_cache_debug( 'wpsc_delete_post_archives: deleting cache of post type archive: ' . $archive_url );
	}

	// Author archive page
	$author_url = get_author_posts_url( $post->post_author );
	if ( $author_url ) {
		wpsc_delete_url_cache( $author_url );
		wp_cache_debug( 'wpsc_delete_post_archives: deleting cache of author archive: ' . $author_url );
	}
}

function wpsc_delete_cats_tags( $post ) {
	if ( function_exists( '_deprecated_function' ) ) {
		_deprecated_function( __FUNCTION__, 'WP Super Cache 1.6.3', 'wpsc_delete_post_archives' );
	}

	$post = get_post($post);
	$categories = get_the_category($post->ID);
	if ( $categories ) {
		$category_base = get_option( 'category_base');
		if ( $category_base == '' )
			$category_base = '/category/';
		$category_base = trailingslashit( $category_base ); // paranoid much?
		foreach ($categories as $cat) {
			prune_super_cache ( get_supercache_dir() . $category_base . $cat->slug . '/', true );
			wp_cache_debug( 'wpsc_post_transition: deleting category: ' . get_supercache_dir() . $category_base . $cat->slug . '/' );
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
			wp_cache_debug( 'wpsc_post_transition: deleting tag: ' . get_supercache_dir() . $tag_base . $tag->slug . '/' );
		}
	}
}

function wpsc_post_transition( $new_status, $old_status, $post ) {

	$ptype = is_object( $post ) ? get_post_type_object( $post->post_type ) : null;
	if ( empty( $ptype ) || ! $ptype->public ) {
		return;
	}

	if ( $old_status === 'publish' && $new_status !== 'publish' ) { // post unpublished
		if ( ! function_exists( 'get_sample_permalink' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}
		list( $permalink, $post_name ) = get_sample_permalink( $post );
		$post_url = str_replace( array( "%postname%", "%pagename%" ), $post->post_name, $permalink );
	}
	elseif ( $old_status !== 'publish' && $new_status === 'publish' ) { // post published
		wp_cache_post_edit( $post->ID );
		return;
	}

	if ( ! empty( $post_url ) ) {
		wp_cache_debug( 'wpsc_post_transition: deleting cache of post: ' . $post_url );
		wpsc_delete_url_cache( $post_url );
		wpsc_delete_post_archives( $post );
	}
}

/* check if we want to clear out all cached files on post updates, otherwise call standard wp_cache_post_change() */
function wp_cache_post_edit( $post_id ) {
	global $wp_cache_clear_on_post_edit, $cache_path, $blog_cache_dir;
	static $last_post_edited = -1;

	if ( $post_id == $last_post_edited ) {
		$action = current_filter();
		wp_cache_debug( "wp_cache_post_edit(${action}): Already processed post $post_id.", 4 );
		return $post_id;
	}

	$post = get_post( $post_id );
	if ( ! is_object( $post ) || 'auto-draft' === $post->post_status ) {
		return $post_id;
	}

	// Some users are inexplicibly seeing this error on scheduled posts.
	// define this constant to disable the post status check.
	if ( ! defined( 'WPSCFORCEUPDATE' ) && ! in_array( get_post_status( $post ), array( 'publish', 'private' ), true ) ) {
		wp_cache_debug( 'wp_cache_post_edit: draft post, not deleting any cache files. status: ' . $post->post_status, 4 );
		return $post_id;
	}

	// we want to process the post again just in case it becomes published before the second time this function is called.
	$last_post_edited = $post_id;
	if( $wp_cache_clear_on_post_edit ) {
		wp_cache_debug( "wp_cache_post_edit: Clearing cache $blog_cache_dir and {$cache_path}supercache/ on post edit per config.", 2 );
		prune_super_cache( $blog_cache_dir, true );
		prune_super_cache( get_supercache_dir(), true );
	} else {
		$action = current_filter();
		wp_cache_debug( "wp_cache_post_edit: Clearing cache for post $post_id on ${action}", 2 );
		wp_cache_post_change( $post_id );
		wpsc_delete_post_archives( $post_id ); // delete related archive pages.
	}
}

function wp_cache_post_id_gc( $post_id, $all = 'all' ) {

	$post_id = intval( $post_id );
	if( $post_id == 0 )
		return true;

	$permalink = trailingslashit( str_replace( get_option( 'home' ), '', get_permalink( $post_id ) ) );
	if ( false !== strpos( $permalink, '?' ) ) {
		wp_cache_debug( 'wp_cache_post_id_gc: NOT CLEARING CACHE. Permalink has a "?". ' . $permalink );
		return false;
	}
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
	return true;
}

function wp_cache_post_change( $post_id ) {
	global $file_prefix, $cache_path, $blog_id, $super_cache_enabled, $blog_cache_dir, $wp_cache_refresh_single_only;
	static $last_processed = -1;

	if ( $post_id == $last_processed ) {
		$action = current_filter();
		wp_cache_debug( "wp_cache_post_change(${action}): Already processed post $post_id.", 4 );
		return $post_id;
	}

	$post  = get_post( $post_id );
	$ptype = is_object( $post ) ? get_post_type_object( $post->post_type ) : null;
	if ( empty( $ptype ) || ! $ptype->public ) {
		return $post_id;
	}

	// Some users are inexplicibly seeing this error on scheduled posts.
	// define this constant to disable the post status check.
	if ( ! defined( 'WPSCFORCEUPDATE' ) && ! in_array( get_post_status( $post ), array( 'publish', 'private' ), true ) ) {
		wp_cache_debug( 'wp_cache_post_change: draft post, not deleting any cache files.', 4 );
		return $post_id;
	}
	$last_processed = $post_id;

	if ( ! wp_cache_writers_entry() ) {
		return $post_id;
	}

	if (
		isset( $wp_cache_refresh_single_only ) &&
		$wp_cache_refresh_single_only &&
		(
			isset( $_SERVER['HTTP_REFERER'] ) &&
			strpos( $_SERVER['HTTP_REFERER'], 'edit-comments.php' ) ||
			strpos( $_SERVER['REQUEST_URI'], 'wp-comments-post.php' )
		)
	) {
		if ( defined( 'DONOTDELETECACHE' ) ) {
			wp_cache_debug( "wp_cache_post_change: comment detected and it's moderated or spam. Not deleting cached files.", 4 );
			return $post_id;
		} else {
			wp_cache_debug( 'wp_cache_post_change: comment detected. only deleting post page.', 4 );
			$all = false;
		}
	} else {
		$all = true;
	}

	$all_backup = $all;
	$all = apply_filters( 'wpsc_delete_related_pages_on_edit', $all ); // return 0 to disable deleting homepage and other pages.
	if ( $all != $all_backup )
		wp_cache_debug( 'wp_cache_post_change: $all changed by wpsc_delete_related_pages_on_edit filter: ' . intval( $all ) );

	// Delete supercache files whenever a post change event occurs, even if supercache is currently disabled.
	$dir = get_supercache_dir();
	// make sure the front page has a rebuild file
	if ( false == wp_cache_post_id_gc( $post_id, $all ) ) {
		wp_cache_debug( 'wp_cache_post_change: not deleting any cache files as GC of post returned false' );
		wp_cache_writers_exit();
		return false;
	}
	if ( $all == true ) {
		wp_cache_debug( 'Post change: supercache enabled: deleting cache files in ' . $dir );
		wpsc_rebuild_files( $dir );
		do_action( 'gc_cache', 'prune', 'homepage' );
		if ( get_option( 'show_on_front' ) == 'page' ) {
			wp_cache_debug( 'Post change: deleting page_on_front and page_for_posts pages.', 4 );
			wp_cache_debug( 'Post change: page_on_front ' . get_option( 'page_on_front' ), 4 );
			/**
			 * It's possible that page_for_posts is zero.
			 * Quick fix to reduce issues in debugging.
			 */
			wp_cache_debug( 'Post change: page_for_posts ' . get_option( 'page_for_posts' ), 4 );
			if ( get_option( 'page_for_posts' ) ) {
				$permalink = trailingslashit( str_replace( get_option( 'home' ), '', get_permalink( get_option( 'page_for_posts' ) ) ) );
				wp_cache_debug( 'Post change: Deleting files in: ' . str_replace( '//', '/', $dir . $permalink ) );
				wpsc_rebuild_files( $dir . $permalink );
				do_action( 'gc_cache', 'prune', $permalink );
			}
		}
	} else {
		wp_cache_debug( 'wp_cache_post_change: not deleting all pages.', 4 );
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

if ( ! function_exists( 'apache_request_headers' ) ) {
	/**
	 * A fallback for get request headers.
	 * Based on comments from http://php.net/manual/en/function.apache-request-headers.php
	 *
	 * @return array List of request headers
	 */
	function apache_request_headers() {
		$headers = array();

		foreach ( array_keys( $_SERVER ) as $skey ) {
			if ( 0 === strpos( $skey, 'HTTP_' ) ) {
				$header = implode( '-', array_map( 'ucfirst', array_slice( explode( '_', strtolower( $skey ) ) , 1 ) ) );
				$headers[ $header ] = $_SERVER[ $skey ];
			}
		}

		return $headers;
	}
}
