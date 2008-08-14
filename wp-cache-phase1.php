<?php
// Pre-2.6 compatibility
if( !defined('WP_CONTENT_DIR') )
	define( 'WP_CONTENT_DIR', ABSPATH . 'wp-content' );

if( !include( WP_CONTENT_DIR . '/wp-cache-config.php' ) )
	return;
if( !defined( 'WPCACHEHOME' ) )
	define('WPCACHEHOME', dirname(__FILE__).'/');

include( WPCACHEHOME . 'wp-cache-base.php');

if(defined('DOING_CRON')) {
	require_once( WPCACHEHOME . 'wp-cache-phase2.php');
	return;
}

$mutex_filename = 'wp_cache_mutex.lock';
$new_cache = false;


// Don't change variables behind this point

$plugins = glob( WPCACHEHOME . 'plugins/*.php' );
if( is_array( $plugins ) ) {
	foreach ( $plugins as $plugin ) {
	if( is_file( $plugin ) )
		require_once( $plugin );
	}
}

if (!$cache_enabled || $_SERVER["REQUEST_METHOD"] == 'POST') 
	return;

$file_expired = false;
$cache_filename = '';
$meta_file = '';
$wp_cache_gzip_encoding = '';

function gzip_accepted(){
	if( ini_get( 'zlib.output_compression' ) ) // don't compress WP-Cache data files when PHP is already doing it
		return false;

	if (strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'gzip') === false) return false;
	if (strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'x-gzip') === false) return 'gzip';
	return 'x-gzip';
}

if ($cache_compression) {
	$wp_cache_gzip_encoding = gzip_accepted();
}

$key = $blogcacheid . md5($_SERVER['HTTP_HOST'].preg_replace('/#.*$/', '', str_replace( '/index.php', '/', $_SERVER['REQUEST_URI'] ) ).$wp_cache_gzip_encoding.wp_cache_get_cookies_values());

$cache_filename = $file_prefix . $key . '.html';
$meta_file = $file_prefix . $key . '.meta';
$cache_file = realpath( $cache_path . $cache_filename );
$meta_pathname = realpath( $cache_path . 'meta/' . $meta_file );

$wp_start_time = microtime();
if( ($mtime = @filemtime($meta_pathname)) ) {
	if ($mtime + $cache_max_time > time() ) {
		$meta = new CacheMeta;
		if (! ($meta = unserialize(@file_get_contents($meta_pathname))) ) 
			return;
		foreach ($meta->headers as $header) {
			// godaddy fix, via http://blog.gneu.org/2008/05/wp-supercache-on-godaddy/ and http://www.littleredrails.com/blog/2007/09/08/using-wp-cache-on-godaddy-500-error/
			if( strpos( $header, 'Last-Modified:' ) === false ) 
				header($header);
		}
		if ( !($content_size = @filesize($cache_file)) > 0 || $mtime < @filemtime($cache_file))
			return;
		if ($meta->dynamic) {
			include($cache_file);
		} else {
			/* No used to avoid problems with some PHP installations
			$content_size += strlen($log);
			header("Content-Length: $content_size");
			*/
			if(!@readfile ($cache_file)) 
				return;
		}
		die;
	}
	$file_expired = true; // To signal this file was expired
}

function wp_cache_postload() {
	global $cache_enabled;

	if (!$cache_enabled) 
		return;
	require_once( WPCACHEHOME . 'wp-cache-phase2.php');
	wp_cache_phase2();
}

function wp_cache_get_cookies_values() {
	$string = '';
	while ($key = key($_COOKIE)) {
		if (preg_match("/^wp-postpass|^wordpress|^comment_author_/", $key)) {
			$string .= $_COOKIE[$key] . ",";
		}
		next($_COOKIE);
	}
	reset($_COOKIE);
	if( $string != '' )
		return $string;

	$string = do_cacheaction( 'wp_cache_get_cookies_values', $string );
	return $string;
}

function add_cacheaction( $action, $func ) {
	global $wp_supercache_actions;
	$wp_supercache_actions[ $action ][] = $func;
}

function do_cacheaction( $action, $value = '' ) {
	global $wp_supercache_actions;
	if( is_array( $wp_supercache_actions[ $action ] ) ) {
		$actions = $wp_supercache_actions[ $action ];
		foreach( $actions as $func ) {
			$value = $func( $value );
		}
	}

	return $value;
}

?>
