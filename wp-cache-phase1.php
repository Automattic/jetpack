<?php
//error_reporting(E_ERROR | E_PARSE); // uncomment to debug this file!
// Pre-2.6 compatibility
if( !defined('WP_CONTENT_DIR') )
	define( 'WP_CONTENT_DIR', ABSPATH . 'wp-content' );

if( !include( WP_CONTENT_DIR . '/wp-cache-config.php' ) )
	return false;

if( !defined( 'WPCACHEHOME' ) )
	define('WPCACHEHOME', dirname(__FILE__).'/');


include( WPCACHEHOME . 'wp-cache-base.php');

if( $blogcacheid != '' ) {
	$blog_cache_dir = str_replace( '//', '/', $cache_path . "blogs/" . $blogcacheid . '/' );
} else {
	$blog_cache_dir = $cache_path;
}

$wp_cache_phase1_loaded = true;

$mutex_filename  = 'wp_cache_mutex.lock';
$new_cache = false;

if( !isset( $wp_cache_plugins_dir ) )
	$wp_cache_plugins_dir = WPCACHEHOME . 'plugins';

require_once( WPCACHEHOME . 'wp-cache-phase2.php');

if ( isset( $_GET[ 'donotcachepage' ] ) && isset( $cache_page_secret ) && $_GET[ 'donotcachepage' ] == $cache_page_secret ) {
	$cache_enabled = false;
	define( 'DONOTCACHEPAGE', 1 );
}

$plugins = glob( $wp_cache_plugins_dir . '/*.php' );
if( is_array( $plugins ) ) {
	foreach ( $plugins as $plugin ) {
	if( is_file( $plugin ) )
		require_once( $plugin );
	}
}

if ( isset( $wp_cache_make_known_anon ) && $wp_cache_make_known_anon )
	wp_supercache_cache_for_admins();

do_cacheaction( 'cache_init' );

if (!$cache_enabled || $_SERVER["REQUEST_METHOD"] == 'POST')
	return true;

$file_expired = false;
$cache_filename = '';
$meta_file = '';
$wp_cache_gzip_encoding = '';

$gzipped = 0;
$gzsize = 0;

function gzip_accepted(){
	if ( 1 == ini_get( 'zlib.output_compression' ) || "on" == strtolower( ini_get( 'zlib.output_compression' ) ) ) // don't compress WP-Cache data files when PHP is already doing it
		return false;

	if ( !isset( $_SERVER[ 'HTTP_ACCEPT_ENCODING' ] ) || ( isset( $_SERVER[ 'HTTP_ACCEPT_ENCODING' ] ) && strpos( $_SERVER[ 'HTTP_ACCEPT_ENCODING' ], 'gzip' ) === false ) ) return false;
	return 'gzip';
}

if ($cache_compression) {
	$wp_cache_gzip_encoding = gzip_accepted();
}

add_cacheaction( 'supercache_filename_str', 'wp_cache_check_mobile' );

$wp_cache_request_uri = $_SERVER[ 'REQUEST_URI' ]; // Cache this in case any plugin modifies it.

if ( $wp_cache_object_cache ) {
	if ( ! include_once( WP_CONTENT_DIR . '/object-cache.php' ) )
		return;

	wp_cache_init(); // Note: wp-settings.php calls wp_cache_init() which clobbers the object made here.

	if ( ! is_object( $wp_object_cache ) )
		return;
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

$wp_start_time = microtime();

function get_wp_cache_key( $url = false ) {
	global $wp_cache_request_uri, $wp_cache_gzip_encoding, $WPSC_HTTP_HOST;
	if ( !$url )
		$url = $wp_cache_request_uri;
	return do_cacheaction( 'wp_cache_key', $WPSC_HTTP_HOST . intval( $_SERVER[ 'SERVER_PORT' ] ) . preg_replace('/#.*$/', '', str_replace( '/index.php', '/', $url ) ) . $wp_cache_gzip_encoding . wp_cache_get_cookies_values() );
}

function wp_super_cache_init() {
	global $wp_cache_key, $key, $blogcacheid, $wp_cache_request_uri, $file_prefix, $blog_cache_dir, $meta_file, $cache_file, $cache_filename, $meta_pathname, $wp_cache_gzip_encoding, $meta;

	$wp_cache_key = get_wp_cache_key();
	$key = $blogcacheid . md5( $wp_cache_key );
	$wp_cache_key = $blogcacheid . $wp_cache_key;

	$cache_filename = $file_prefix . $key . '.php';
	$meta_file = $file_prefix . $key . '.php';
	$cache_file = realpath( $blog_cache_dir . $cache_filename );
	$meta_pathname = realpath( $blog_cache_dir . 'meta/' . $meta_file );
	return compact( 'key', 'cache_filename', 'meta_file', 'cache_file', 'meta_pathname' );
}

function wp_cache_serve_cache_file() {
	global $key, $blogcacheid, $wp_cache_request_uri, $file_prefix, $blog_cache_dir, $meta_file, $cache_file, $cache_filename, $meta_pathname, $wp_cache_gzip_encoding, $meta;
	global $wp_cache_object_cache, $cache_compression, $wp_cache_slash_check, $wp_supercache_304, $wp_cache_home_path, $wp_cache_no_cache_for_get;
	global $wp_cache_disable_utf8, $wp_cache_mfunc_enabled;

	extract( wp_super_cache_init() );

	if ( wp_cache_user_agent_is_rejected() ) {
		wp_cache_debug( "No wp-cache file served as user agent rejected.", 5 );
		return false;
	}

	if ( $wp_cache_no_cache_for_get && false == empty( $_GET ) ) {
		wp_cache_debug( "Non empty GET request. Caching disabled on settings page. " . json_encode( $_GET ), 1 );
		return false;
	}

	if ( $wp_cache_object_cache && wp_cache_get_cookies_values() == '' ) {
		if ( !empty( $_GET ) ) {
			wp_cache_debug( "Non empty GET request. Not serving request from object cache. " . json_encode( $_GET ), 1 );
			return false;
		}

		$oc_key = get_oc_key();
		$meta_filename = $oc_key . ".meta";
		if ( gzip_accepted() ) {
			$oc_key .= ".gz";
			$meta_filename .= ".gz";
		}
		$cache = wp_cache_get( $oc_key, 'supercache' );
		$meta = json_decode( wp_cache_get( $meta_filename, 'supercache' ), true );
		if ( is_array( $meta ) == false ) {
			wp_cache_debug( "Meta array from object cache corrupt. Ignoring cache.", 1 );
			return true;
		}
	} elseif ( file_exists( $cache_file ) ) {
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
	} else {
		// last chance, check if a supercache file exists. Just in case .htaccess rules don't work on this host
		$filename = supercache_filename();
		$file = get_current_url_supercache_dir() . $filename;
		if ( false == file_exists( $file ) ) {
			wp_cache_debug( "No Super Cache file found for current URL: $file" );
			return false;
		} elseif ( false == empty( $_GET ) ) {
			wp_cache_debug( "GET array not empty. Cannot serve a supercache file. " . json_encode( $_GET ) );
			return false;
		} elseif ( wp_cache_get_cookies_values() != '' ) {
			wp_cache_debug( "Cookies found. Cannot serve a supercache file. " . wp_cache_get_cookies_values() );
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

			header( "Vary: Accept-Encoding, Cookie" );
			header( "Cache-Control: max-age=3, must-revalidate" );
			header( "WP-Super-Cache: Served supercache file from PHP" );
			$size = function_exists( 'mb_strlen' ) ? mb_strlen( $cachefiledata, '8bit' ) : strlen( $cachefiledata );
			if ( $wp_cache_gzip_encoding ) {
				header( 'Content-Encoding: ' . $wp_cache_gzip_encoding );
				header( 'Content-Length: ' . $size );
			} elseif ( $wp_supercache_304 ) {
				header( 'Content-Length: ' . $size );
			}

			// don't try to match modified dates if using dynamic code.
			if ( $wp_cache_mfunc_enabled == 0 && $wp_supercache_304 ) {
				if ( function_exists( 'apache_request_headers' ) ) {
					$request = apache_request_headers();
					$remote_mod_time = ( isset ( $request[ 'If-Modified-Since' ] ) ) ? $request[ 'If-Modified-Since' ] : 0;
				} else {
					if ( isset( $_SERVER[ 'HTTP_IF_MODIFIED_SINCE' ] ) )
						$remote_mod_time = $_SERVER[ 'HTTP_IF_MODIFIED_SINCE' ];
					else
						$remote_mod_time = 0;
				}
				$local_mod_time = gmdate("D, d M Y H:i:s",filemtime( $file )).' GMT';
				if ( $remote_mod_time != 0 && $remote_mod_time == $local_mod_time ) {
					header("HTTP/1.0 304 Not Modified");
					exit();
				}
				header( 'Last-Modified: ' . $local_mod_time );
			}
			echo $cachefiledata;
			exit();
		} else {
			wp_cache_debug( "No wp-cache file exists. Must generate a new one." );
			return false;
		}
	}

	$cache_file = do_cacheaction( 'wp_cache_served_cache_file', $cache_file );
	// Sometimes the gzip headers are lost. Make sure html returned isn't compressed!
	if ( $cache_compression && $wp_cache_gzip_encoding && !in_array( 'Content-Encoding: ' . $wp_cache_gzip_encoding, $meta[ 'headers' ] ) ) {
		$ungzip = true;
		wp_cache_debug( "GZIP headers not found. Force uncompressed output.", 1 );
	} else {
		$ungzip = false;
	}
	foreach ($meta[ 'headers' ] as $t => $header) {
		// godaddy fix, via http://blog.gneu.org/2008/05/wp-supercache-on-godaddy/ and http://www.littleredrails.com/blog/2007/09/08/using-wp-cache-on-godaddy-500-error/
		if( strpos( $header, 'Last-Modified:' ) === false )
			header($header);
	}
	header( 'WP-Super-Cache: Served legacy cache file' );
	if ( $wp_cache_object_cache ) {
		if ( $cache ) {
			if ( $ungzip ) {
				// attempt to uncompress the cached file just in case it's gzipped
				$uncompressed = gzuncompress( $cache );
				if ( $uncompressed ) {
					wp_cache_debug( "Uncompressed gzipped cache file from object cache", 1 );
					$cache = $uncompressed;
					unset( $uncompressed );
				}
			}
			if ( isset( $meta[ 'dynamic' ] ) && $meta[ 'dynamic' ] ) {
				wp_cache_debug( "Serving wp-cache dynamic file from object cache", 5 );
				echo do_cacheaction( 'wpsc_cachedata', $cache );
			} else {
				wp_cache_debug( "Serving wp-cache static file from object cache", 5 );
				echo $cache;
			}
			wp_cache_debug( "exit request", 5 );
			die();
		}
	} else {
		if ( isset( $meta[ 'dynamic' ] ) ) {
			wp_cache_debug( "Serving wp-cache dynamic file", 5 );
			if ( $ungzip ) {
				// attempt to uncompress the cached file just in case it's gzipped
				$cache = wp_cache_get_legacy_cache( $cache_file );
				$uncompressed = @gzuncompress( $cache );
				if ( $uncompressed ) {
					wp_cache_debug( "Uncompressed gzipped cache file from wp-cache", 1 );
					unset( $cache );
					echo do_cacheaction( 'wpsc_cachedata', $uncompressed );
				} else {
					echo do_cacheaction( 'wpsc_cachedata', $cache );
				}
			} else {
				echo do_cacheaction( 'wpsc_cachedata', wp_cache_get_legacy_cache( $cache_file ) );
			}
		} else {
			wp_cache_debug( "Serving wp-cache static file", 5 );
			if ( $ungzip ) {
				$cache = wp_cache_get_legacy_cache( $cache_file );
				$uncompressed = gzuncompress( $cache );
				if ( $uncompressed ) {
					wp_cache_debug( "Uncompressed gzipped cache file from wp-cache", 1 );
					echo $uncompressed;
				} else {
					echo $cache;
				}
			} else {
				echo( wp_cache_get_legacy_cache( $cache_file ) );
			}
		}
		wp_cache_debug( "exit request", 5 );
		die();
	}
}

function wp_cache_get_legacy_cache( $cache_file ) {
	return substr( @file_get_contents( $cache_file ), 15 );
}

if(defined('DOING_CRON')) {
	extract( wp_super_cache_init() );
	return true;
}

if ( !isset( $wp_super_cache_late_init ) || ( isset( $wp_super_cache_late_init ) && false == $wp_super_cache_late_init ) ) {
	wp_cache_serve_cache_file();
}

function wp_cache_postload() {
	global $cache_enabled, $wp_super_cache_late_init;

	if ( !$cache_enabled )
		return true;

	if ( isset( $wp_super_cache_late_init ) && true == $wp_super_cache_late_init ) {
		wp_cache_debug( "Supercache Late Init: add wp_cache_serve_cache_file to init", 3 );
		add_action( 'init', 'wp_cache_late_loader', 9999 );
	} else {
		wp_super_cache_init();
		wp_cache_phase2();
	}
}

function wp_cache_late_loader() {
	wp_cache_debug( "Supercache Late Loader running on init", 3 );
	wp_cache_serve_cache_file();
	wp_cache_phase2();
}

function wp_cache_get_cookies_values() {
	static $string = '';

	if ( $string != '' ) {
		wp_cache_debug( "wp_cache_get_cookies_values: cached: $string" );
		return $string;
	}

	$regex = "/^wp-postpass|^comment_author_";
	if ( defined( 'LOGGED_IN_COOKIE' ) )
		$regex .= "|^" . preg_quote( constant( 'LOGGED_IN_COOKIE' ) );
	else
		$regex .= "|^wordpress_logged_in_";
	$regex .= "/";
	while ($key = key($_COOKIE)) {
		if ( preg_match( $regex, $key ) ) {
			wp_cache_debug( "wp_cache_get_cookies_values: $regex Cookie detected: $key", 5 );
			$string .= $_COOKIE[ $key ] . ",";
		}
		next($_COOKIE);
	}
	reset($_COOKIE);

	// If you use this hook, make sure you update your .htaccess rules with the same conditions
	$string = do_cacheaction( 'wp_cache_get_cookies_values', $string );
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
			if ( is_array( $func ) ) {
				$value = $func[0]->{$func[1]}( $value );
			} else {
				$value = $func( $value );
			}
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

// From http://wordpress.org/plugins/wordpress-mobile-edition/ by Alex King
function wp_cache_check_mobile( $cache_key ) {
	global $wp_cache_mobile_enabled, $wp_cache_mobile_browsers, $wp_cache_mobile_prefixes;
	if ( !isset( $wp_cache_mobile_enabled ) || false == $wp_cache_mobile_enabled )
		return $cache_key;

	wp_cache_debug( "wp_cache_check_mobile: $cache_key" );

	// allow plugins to short circuit mobile check. Cookie, extra UA checks?
	switch( do_cacheaction( 'wp_cache_check_mobile', $cache_key ) ) {
	case "normal":
		wp_cache_debug( "wp_cache_check_mobile: desktop user agent detected by wp_cache_check_mobile action" );
		return $cache_key;
		break;
	case "mobile":
		wp_cache_debug( "wp_cache_check_mobile: mobile user agent detected by wp_cache_check_mobile action" );
		return $cache_key . "-mobile";
		break;
	}

	if ( !isset( $_SERVER[ "HTTP_USER_AGENT" ] ) ) {
		return $cache_key;
	}

	if ( do_cacheaction( 'disable_mobile_check', false ) ) {
		wp_cache_debug( "wp_cache_check_mobile: disable_mobile_check disabled mobile check" );
		return $cache_key;
	}

	$browsers = explode( ',', $wp_cache_mobile_browsers );
	$user_agent = strtolower( $_SERVER['HTTP_USER_AGENT'] );
	foreach ($browsers as $browser) {
		if ( strstr( $user_agent, trim( strtolower( $browser ) ) ) ) {
			wp_cache_debug( "mobile browser detected: " . $_SERVER[ "HTTP_USER_AGENT" ], 5 );
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
				wp_cache_debug( "mobile browser (prefix) detected: " . $_SERVER[ "HTTP_USER_AGENT" ], 5 );
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
	$log_message = date('H:i:s') . " " . getmypid() . " {$_SERVER['REQUEST_URI']} {$message}\n\r";
	// path to the log file in the cache folder
	$log_file = $cache_path . str_replace('/', '', str_replace('..', '', $wp_cache_debug_log));

	error_log( $log_message, 3, $log_file );
}

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
			 * Sometimes site_url doesn't return the siteurl. See http://wordpress.org/support/topic/wp-super-cache-not-refreshing-post-after-comments-made
			*/
			$DONOTREMEMBER = 1;
			wp_cache_debug( "get_current_url_supercache_dir: warning! site_url ($site_url) not found in permalink ($permalink).", 1 );
			if ( false === strpos( $permalink, $WPSC_HTTP_HOST ) ) {
				wp_cache_debug( "get_current_url_supercache_dir: WARNING! SERVER_NAME ({$WPSC_HTTP_HOST}) not found in permalink ($permalink). ", 1 );
				$p = parse_url( $permalink );
				if ( is_array( $p ) ) {
					$uri = $p[ 'path' ];
					wp_cache_debug( "get_current_url_supercache_dir: WARNING! Using $uri as permalink. Used parse_url.", 1 );
				} else {
					wp_cache_debug( "get_current_url_supercache_dir: WARNING! Permalink ($permalink) could not be understood by parse_url. Using front page.", 1 );
					$uri = '';
				}
			} else {
				wp_cache_debug( "get_current_url_supercache_dir: Removing SERVER_NAME ({$WPSC_HTTP_HOST}) and $protocol from permalink ($permalink). Is the url right?", 1 );
				$uri = str_replace( $WPSC_HTTP_HOST, '', $permalink );
				$uri = str_replace( 'http://', '', $uri );
				$uri = str_replace( 'https://', '', $uri );
			}
		} else {
			$uri = str_replace( $site_url, '', $permalink );
			if ( strpos( $uri, $wp_cache_home_path ) !== 0 )
				$uri = rtrim( $wp_cache_home_path, '/' ) . $uri;
		}
	} else {
		$uri = strtolower( $wp_cache_request_uri );
	}
	$uri = wpsc_deep_replace( array( '..', '\\', 'index.php', ), preg_replace( '/[ <>\'\"\r\n\t\(\)]/', '', preg_replace( "/(\?.*)?$/", '', $uri ) ) );
	$dir = preg_replace( '/:.*$/', '',  $WPSC_HTTP_HOST ) . $uri; // To avoid XSS attacks
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

function get_all_supercache_filenames( $dir = '' ) {
	global $wp_cache_mobile_enabled, $cache_path;

	$dir = realpath( $dir );
	if ( substr( $dir, 0, strlen( $cache_path ) ) != $cache_path )
		return array();

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
	//Add support for https and http caching
	$is_https = ( ( isset( $_SERVER[ 'HTTPS' ] ) && 'on' ==  strtolower( $_SERVER[ 'HTTPS' ] ) ) || ( isset( $_SERVER[ 'HTTP_X_FORWARDED_PROTO' ] ) && 'https' == strtolower( $_SERVER[ 'HTTP_X_FORWARDED_PROTO' ] ) ) ); //Also supports https requests coming from an nginx reverse proxy
	$extra_str = $is_https ? '-https' : '';

	if ( function_exists( "apply_filters" ) ) {
		$extra_str = apply_filters( 'supercache_filename_str', $extra_str );
	} else {
		$extra_str = do_cacheaction( 'supercache_filename_str', $extra_str );
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
		$key = intval( $_SERVER[ 'SERVER_PORT' ] ) . strtolower( preg_replace( '/:.*$/', '',  $WPSC_HTTP_HOST ) ) . $url;
	} else {
		$key = get_current_url_supercache_dir();
	}
	return $key . $wp_cache_gzip_encoding . get_oc_version();
}

function wp_supercache_cache_for_admins() {
	if ( isset( $_GET[ 'preview' ] ) || function_exists( "is_admin" ) && is_admin() )
		return true;

	if ( false == do_cacheaction( 'wp_supercache_remove_cookies', true ) )
		return true;

	$cookie_keys = array( 'wordpress_logged_in', 'comment_author_' );
	if ( defined( 'LOGGED_IN_COOKIE' ) )
		$cookie_keys[] = constant( 'LOGGED_IN_COOKIE' );
	reset( $_COOKIE );
	foreach( $_COOKIE as $cookie => $val ) {
		reset( $cookie_keys );
		foreach( $cookie_keys as $key ) {
			if ( strpos( $cookie, $key ) !== FALSE ) {
				wp_cache_debug( 'Removing auth from $_COOKIE to allow caching for logged in user (' . $cookie . ')', 5 );
				unset( $_COOKIE[ $cookie ] );
			}
		}
	}
}

/* returns true/false depending on location of $dir. */
function wp_cache_confirm_delete( $dir ) {
	global $cache_path, $blog_cache_dir;
	// don't allow cache_path, blog cache dir, blog meta dir, supercache.
	$dir = realpath( $dir );
	if ( 
		$dir == $cache_path || 
		$dir == $blog_cache_dir ||
		$dir == $blog_cache_dir . "meta/" ||
		$dir == $cache_path . "supercache"
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

?>
