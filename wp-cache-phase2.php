<?php

function wp_cache_phase2() {
	global $cache_filename, $cache_acceptable_files, $wp_cache_gzip_encoding, $super_cache_enabled, $cache_rebuild_files, $wp_cache_gmt_offset, $wp_cache_blog_charset, $wp_cache_last_gc;
	global $cache_max_time, $wp_cache_not_logged_in, $wp_cache_request_uri;

	$wp_cache_gmt_offset   = get_option( 'gmt_offset' ); // caching for later use when wpdb is gone. http://wordpress.org/support/topic/224349
	$wp_cache_blog_charset = get_option( 'blog_charset' );

	wp_cache_mutex_init();
	if(function_exists('add_action') && ( !defined( 'WPLOCKDOWN' ) || ( defined( 'WPLOCKDOWN' ) && constant( 'WPLOCKDOWN' ) == '0' ) ) ) {
		// Post ID is received
		add_action('publish_post', 'wp_cache_post_edit', 0);
		add_action('edit_post', 'wp_cache_post_change', 0); // leaving a comment called edit_post
		add_action('delete_post', 'wp_cache_post_edit', 0);
		add_action('publish_phone', 'wp_cache_post_edit', 0);
		// Coment ID is received
		add_action('trackback_post', 'wp_cache_get_postid_from_comment', 99);
		add_action('pingback_post', 'wp_cache_get_postid_from_comment', 99);
		add_action('comment_post', 'wp_cache_get_postid_from_comment', 99);
		add_action('edit_comment', 'wp_cache_get_postid_from_comment', 99);
		add_action('wp_set_comment_status', 'wp_cache_get_postid_from_comment', 99);
		// No post_id is available
		add_action('delete_comment', 'wp_cache_no_postid', 99);
		add_action('switch_theme', 'wp_cache_no_postid', 99); 
		add_action('edit_user_profile_update', 'wp_cache_no_postid', 99); 

		add_action('wp_cache_gc','wp_cache_gc_cron');

		do_cacheaction( 'add_cacheaction' );
	}

	if( $_SERVER["REQUEST_METHOD"] == 'POST' || !empty( $_POST ) || get_option('gzipcompression')) 
		return false;

	if ( $wp_cache_not_logged_in && is_user_logged_in() && !is_feed() && !is_admin() ) {
		register_shutdown_function( 'wpcache_logged_in_message' );
		return false;
	}

	$script = basename($_SERVER['PHP_SELF']);
	if (!in_array($script, $cache_acceptable_files) && wp_cache_is_rejected($wp_cache_request_uri))
		return false;
	if (wp_cache_user_agent_is_rejected()) return;
	if($wp_cache_gzip_encoding)
		header('Vary: Accept-Encoding, Cookie');
	else
		header('Vary: Cookie');
	ob_start( 'wp_cache_ob_callback' ); 

	// restore old supercache file temporarily
	if( $super_cache_enabled && $cache_rebuild_files ) {
		$user_info = wp_cache_get_cookies_values();
		$do_cache = apply_filters( 'do_createsupercache', $user_info );
		if( $user_info == '' || $do_cache === true ) {
			$dir = get_current_url_supercache_dir();
			$files_to_check = array( $dir . 'index.html', $dir . 'index.html.gz' );
			foreach( $files_to_check as $cache_file ) {
				if( !@file_exists( $cache_file . '.needs-rebuild' ) )
					continue;
				$mtime = @filemtime($cache_file . '.needs-rebuild');
				if( $mtime && (time() - $mtime) < 30 ) {
					@rename( $cache_file . '.needs-rebuild', $cache_file );
				}
				// cleanup old files or if rename fails
				if( @file_exists( $cache_file . '.needs-rebuild' ) ) {
					@unlink( $cache_file . '.needs-rebuild' );
				}
			}
		}
	}

	if( !isset( $cache_max_time ) )
		$cache_max_time = 600;
	$last_gc = get_option( "wpsupercache_gc_time" );

	if( !$last_gc ) {
		update_option( 'wpsupercache_gc_time', time() );
	}
	$next_gc = $cache_max_time < 1800 ? $cache_max_time : 600;
	if( $last_gc < ( time() - $next_gc ) ) {
		update_option( 'wpsupercache_gc_time', time() );

		global $wp_cache_shutdown_gc;
		if( !isset( $wp_cache_shutdown_gc ) || $wp_cache_shutdown_gc == 0 ) {
			if(!wp_next_scheduled('wp_cache_gc')) wp_schedule_single_event(time() + 10 , 'wp_cache_gc');
		} else {
			global $time_to_gc_cache;
			$time_to_gc_cache = 1; // tell the "shutdown gc" to run!
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
		foreach ($cache_rejected_user_agent as $expr) {
			if (strlen($expr) > 0 && stristr($headers["User-Agent"], $expr))
				return true;
		}
		return false;
	}
}

function wp_cache_get_response_headers() {
	if(function_exists('apache_response_headers')) {
		flush();
		$headers = apache_response_headers();
	} else if(function_exists('headers_list')) {
		$headers = array();
		foreach(headers_list() as $hdr) {
			list($header_name, $header_value) = explode(': ', $hdr, 2);
			$headers[$header_name] = $header_value;
		}
	} else
		$headers = null;

	return $headers;
}

function wp_cache_is_rejected($uri) {
	global $cache_rejected_uri;

	$auto_rejected = array( '/wp-admin/', 'xmlrpc.php', 'wp-app.php' );
	foreach( $auto_rejected as $u ) {
		if( strstr( $uri, $u ) )
			return true; // we don't allow caching of wp-admin for security reasons
	}
	foreach ($cache_rejected_uri as $expr) {
		if( $expr != '' && preg_match( "~$expr~", $uri ) )
			return true;
	}
	return false;
}

function wp_cache_mutex_init() {
	global $use_flock, $mutex, $cache_path, $mutex_filename, $sem_id, $blog_cache_dir;

	if(!is_bool($use_flock)) {
		if(function_exists('sem_get')) 
			$use_flock = false;
		else
			$use_flock = true;
	}

	$mutex = false;
	if ($use_flock) 
		$mutex = @fopen($blog_cache_dir . $mutex_filename, 'w');
	else
		$mutex = @sem_get($sem_id, 1, 0644 | IPC_CREAT, 1);
}

function wp_cache_writers_entry() {
	global $use_flock, $mutex, $cache_path, $mutex_filename, $wp_cache_mutex_disabled;

	if( isset( $wp_cache_mutex_disabled ) && $wp_cache_mutex_disabled )
		return true;

	if( !$mutex )
		return false;

	if ($use_flock)
		flock($mutex,  LOCK_EX);
	else
		sem_acquire($mutex);

	return true;
}

function wp_cache_writers_exit() {
	global $use_flock, $mutex, $cache_path, $mutex_filename, $wp_cache_mutex_disabled;

	if( isset( $wp_cache_mutex_disabled ) && $wp_cache_mutex_disabled )
		return true;

	if( !$mutex )
		return false;

	if ($use_flock)
		flock($mutex,  LOCK_UN);
	else
		sem_release($mutex);
}

function get_current_url_supercache_dir() {
	global $cached_direct_pages, $cache_path, $wp_cache_request_uri;
	$uri = preg_replace('/[ <>\'\"\r\n\t\(\)]/', '', str_replace( '/index.php', '/', str_replace( '..', '', preg_replace("/(\?.*)?$/", '', $wp_cache_request_uri ) ) ) );
	$uri = str_replace( '\\', '', $uri );
	$dir = strtolower(preg_replace('/:.*$/', '',  $_SERVER["HTTP_HOST"])) . $uri; // To avoid XSS attacks
	$dir = apply_filters( 'supercache_dir', $dir );
	$dir = trailingslashit( $cache_path . 'supercache/' . $dir );
	if( is_array( $cached_direct_pages ) && in_array( $_SERVER[ 'REQUEST_URI' ], $cached_direct_pages ) ) {
		$dir = trailingslashit( ABSPATH . $uri );
	}
	$dir = str_replace( '//', '/', $dir );
	return $dir;
}

function wp_cache_ob_callback( $buffer ) {
	global $wp_cache_pages;
	if( defined( 'DONOTCACHEPAGE' ) )
		return $buffer;

	if ( isset( $wp_cache_pages[ 'single' ] ) && $wp_cache_pages[ 'single' ] == 1 && is_single() ) {
		return $buffer;
	} elseif ( isset( $wp_cache_pages[ 'pages' ] ) && $wp_cache_pages[ 'pages' ] == 1 && is_page() ) {
		return $buffer;
	} elseif ( isset( $wp_cache_pages[ 'archives' ] ) && $wp_cache_pages[ 'archives' ] == 1 && is_archive() ) {
		return $buffer;
	} elseif ( isset( $wp_cache_pages[ 'tag' ] ) && $wp_cache_pages[ 'tag' ] == 1 && is_tag() ) {
		return $buffer;
	} elseif ( isset( $wp_cache_pages[ 'category' ] ) && $wp_cache_pages[ 'category' ] == 1 && is_category() ) {
		return $buffer;
	} elseif ( isset( $wp_cache_pages[ 'frontpage' ] ) && $wp_cache_pages[ 'frontpage' ] == 1 && is_front_page() ) {
		return $buffer;
	} elseif ( isset( $wp_cache_pages[ 'home' ] ) && $wp_cache_pages[ 'home' ] == 1 && is_home() ) {
		return $buffer;
	}
	$buffer = &wp_cache_get_ob( $buffer );
	wp_cache_shutdown_callback();
	return $buffer;
}


function wp_cache_get_ob(&$buffer) {
	global $cache_path, $cache_filename, $meta_file, $wp_start_time, $supercachedir;
	global $new_cache, $wp_cache_meta, $file_expired, $blog_id, $cache_compression;
	global $wp_cache_gzip_encoding, $super_cache_enabled, $cached_direct_pages;
	global $wp_cache_404, $gzsize, $supercacheonly, $wp_cache_gzip_first, $wp_cache_gmt_offset;
	global $blog_cache_dir, $wp_cache_request_uri;

	$new_cache = true;
	$wp_cache_meta = '';

	/* Mode paranoic, check for closing tags 
	 * we avoid caching incomplete files */
	if( $wp_cache_404 ) {
		$new_cache = false;
		$buffer .= "\n<!-- Page not cached by WP Super Cache. 404. -->\n";
	}

	if (!preg_match('/(<\/html>|<\/rss>|<\/feed>)/i',$buffer) ) {
		$new_cache = false;
		if( false === strpos( $_SERVER[ 'REQUEST_URI' ], 'robots.txt' ) )
			$buffer .= "\n<!-- Page not cached by WP Super Cache. No closing HTML tag. Check your theme. -->\n";
	}
	
	if( !$new_cache )
		return $buffer;

	$duration = wp_cache_microtime_diff($wp_start_time, microtime());
	$duration = sprintf("%0.3f", $duration);
	$buffer .= "\n<!-- Dynamic page generated in $duration seconds. -->\n";

	if( !wp_cache_writers_entry() ) {
		$buffer .= "\n<!-- Page not cached by WP Super Cache. Could not get mutex lock. -->\n";
		return $buffer;
	}

		$dir = get_current_url_supercache_dir();
		$supercachedir = $cache_path . 'supercache/' . preg_replace('/:.*$/', '',  $_SERVER["HTTP_HOST"]);
		if( !empty( $_GET ) || is_feed() || ( $super_cache_enabled == true && is_dir( substr( $supercachedir, 0, -1 ) . '.disabled' ) ) )
			$super_cache_enabled = false;

		$tmp_wpcache_filename = $cache_path . uniqid( mt_rand(), true ) . '.tmp';

		// Don't create wp-cache files for anon users
		$supercacheonly = false;
		if( $super_cache_enabled && wp_cache_get_cookies_values() == '' )
			$supercacheonly = true;

		if( !$supercacheonly ) {
			if ( !@file_exists( $blog_cache_dir . $cache_filename ) || ( @file_exists( $blog_cache_dir . $cache_filename ) && ( time() - @filemtime( $blog_cache_dir . $cache_filename ) ) > 5 ) ) {
				$fr = @fopen($tmp_wpcache_filename, 'w');
				if (!$fr) {
					$buffer .= "<!-- File not cached! Super Cache Couldn't write to: " . str_replace( ABSPATH, '', $cache_path ) . $cache_filename . " -->\n";
					return $buffer;
				}
			}
		}
		if( $super_cache_enabled ) {
			$user_info = wp_cache_get_cookies_values();
			$do_cache = apply_filters( 'do_createsupercache', $user_info );
			if( $user_info == '' || $do_cache === true ) {

				if( @is_dir( $dir ) == false )
					@wp_mkdir_p( $dir );

				$cache_fname = "{$dir}index.html";
				$tmp_cache_filename = $dir . uniqid( mt_rand(), true ) . '.tmp';
				if ( !@file_exists( $cache_fname ) || ( @file_exists( $cache_fname ) && ( time() - @filemtime( $cache_fname ) ) > 5 ) ) {
					$fr2 = @fopen( $tmp_cache_filename, 'w' );
					if (!$fr2) {
						$buffer .= "<!-- File not cached! Super Cache Couldn't write to: " . str_replace( ABSPATH, '', $tmp_cache_filename ) . " -->\n";
						@fclose( $fr );
						@unlink( $tmp_wpcache_filename );
						return $buffer;
					} elseif( $cache_compression ) {
						$gz = @fopen( $tmp_cache_filename . ".gz", 'w');
						if (!$gz) {
							$buffer .= "<!-- File not cached! Super Cache Couldn't write to: " . str_replace( ABSPATH, '', $tmp_cache_filename ) . ".gz -->\n";
							@fclose( $fr );
							@unlink( $tmp_wpcache_filename );
							@fclose( $fr2 );
							@unlink( $tmp_cache_filename );
							return $buffer;
						}
					}
				}
			}
		}

		if (preg_match('/<!--mclude|<!--mfunc/', $buffer)) { //Dynamic content
			$store = preg_replace('|<!--mclude (.*?)-->(.*?)<!--/mclude-->|is', 
					"<!--mclude-->\n<?php include_once('" . ABSPATH . "$1'); ?>\n<!--/mclude-->", $buffer);
			$store = preg_replace('|<!--mfunc (.*?)-->(.*?)<!--/mfunc-->|is', 
					"<!--mfunc-->\n<?php $1 ;?>\n<!--/mfunc-->", $store);
			$store = apply_filters( 'wpsupercache_buffer', $store );
			$wp_cache_meta[ 'dynamic' ] = true;
			/* Clean function calls in tag */
			$buffer = preg_replace('|<!--mclude (.*?)-->|is', '<!--mclude-->', $buffer);
			$buffer = preg_replace('|<!--mfunc (.*?)-->|is', '<!--mfunc-->', $buffer);
			if( $fr )
				fputs($fr, $store);
			if( $fr2 )
				fputs($fr2, $store . '<!-- super cache -->' );
			if( $gz )
				fputs($gz, gzencode( $store . '<!-- super cache gz -->', 1, FORCE_GZIP ) );
		} else {
			$buffer = apply_filters( 'wpsupercache_buffer', $buffer );
			$buffer .= "<!-- Cached page generated by WP-Super-Cache on " . gmdate('Y-m-d H:i:s', (time() + ( $wp_cache_gmt_offset * 3600)))  . " -->\n";

			if( $gz || $wp_cache_gzip_encoding ) {
				$gzdata = gzencode( $buffer . "<!-- Compression = gzip -->", 3, FORCE_GZIP );
				$gzsize = strlen($gzdata);
			}
			if ($wp_cache_gzip_encoding) {
				$wp_cache_meta[ 'headers' ][ 'Content-Encoding' ] = 'Content-Encoding: ' . $wp_cache_gzip_encoding;
				$wp_cache_meta[ 'headers' ][ 'Vary' ] = 'Vary: Accept-Encoding, Cookie';
				// Return uncompressed data & store compressed for later use
				if( $fr )
					fputs($fr, $gzdata);
			} else { // no compression
				$wp_cache_meta[ 'headers' ][ 'Vary' ] = 'Vary: Cookie';
				if( $fr )
					fputs($fr, $buffer);
			}
			if( $fr2 )
				fputs($fr2, $buffer . '<!-- super cache -->' );
			if( $gz )
				fwrite($gz, $gzdata );
			$buffer .= $log;
		}
		$new_cache = true;
		if( $fr ) {
			$supercacheonly = false;
			fclose($fr);
			if( !rename( $tmp_wpcache_filename, $blog_cache_dir . $cache_filename ) ) {
				unlink( $blog_cache_dir . $cache_filename );
				rename( $tmp_wpcache_filename, $blog_cache_dir . $cache_filename );
			}
		}
		if( $fr2 ) {
			fclose($fr2);
			if( !@rename( $tmp_cache_filename, $cache_fname ) ) {
				@unlink( $cache_fname );
				@rename( $tmp_cache_filename, $cache_fname );
			}
		}
		if( $gz ) {
			fclose($gz);
			if( !@rename( $tmp_cache_filename . '.gz', $cache_fname . '.gz' ) ) {
				@unlink( $cache_fname . '.gz' );
				@rename( $tmp_cache_filename . '.gz', $cache_fname . '.gz' );
			}
		}
	wp_cache_writers_exit();
	if ( !headers_sent() && isset( $wp_cache_gzip_first ) && 1 == $wp_cache_gzip_first && $wp_cache_gzip_encoding && $gzdata) {
		header( 'Content-Encoding: ' . $wp_cache_gzip_encoding );
		header( 'Vary: Accept-Encoding, Cookie' );
		header( 'Content-Length: ' . $gzsize );
		return $gzdata;
	} else {
		return $buffer;
	}
}

function wp_cache_phase2_clean_cache($file_prefix) {
	global $cache_path, $blog_cache_dir;

	if( !wp_cache_writers_entry() )
		return false;
	if ( ( $handle = @opendir( $blog_cache_dir ) ) ) { 
		while ( false !== ($file = @readdir($handle))) {
			if ( preg_match("/^$file_prefix/", $file) )
				@unlink( $blog_cache_dir . $file );
		}
		closedir($handle);
	}
	wp_cache_writers_exit();
}

function prune_super_cache( $directory, $force = false, $rename = false ) {
	global $cache_max_time, $cache_path, $super_cache_enabled, $cache_rebuild_files, $blog_cache_dir;

	if( !is_admin() && $super_cache_enabled == 0 )
		return false;

	if( !isset( $cache_max_time ) )
		$cache_max_time = 3600;

	$now = time();

	$protected_directories = array( $cache_path . '.htaccess', $cache_path . $blog_cache_dir . 'meta', $cache_path . 'supercache' );

	$oktodelete = false;
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
						}
						closedir($handle);
					}
					if( $donotdelete )
						continue;
					if( !$rename )
						@rmdir( $entry );
				}
			}
			closedir($dh);
		}
	} elseif( is_file($directory) && ($force || @filemtime( $directory ) + $cache_max_time <= $now ) ) {
		$oktodelete = true;
		if( in_array( $directory, $protected_directories ) )
			$oktodelete = false;
		if( $oktodelete && !$rename ) {
			@unlink( $directory );
		} elseif( $oktodelete && $rename ) {
			wp_cache_rebuild_or_delete( $directory );
		}
	}
}

function wp_cache_rebuild_or_delete( $file ) {
	global $cache_rebuild_files;
	if( strpos( $file, '?' ) !== false )
		$file = substr( $file, 0, strpos( $file, '?' ) );
	if( $cache_rebuild_files && substr( $file, -14 ) != '.needs-rebuild' ) {
		if( @rename($file, $file . '.needs-rebuild') ) {
			@touch( $file . '.needs-rebuild' );
		} else {
			@unlink( $file );
		}
	} else {
		@unlink( $file );
	}
}

function wp_cache_phase2_clean_expired($file_prefix) {
	global $cache_path, $cache_max_time, $blog_cache_dir;

	clearstatcache();
	if( !wp_cache_writers_entry() )
		return false;
	$now = time();
	if ( ( $handle = @opendir( $blog_cache_dir ) ) ) { 
		while ( false !== ($file = readdir($handle))) {
			if ( preg_match("/^$file_prefix/", $file) && 
				(@filemtime( $blog_cache_dir . $file) + $cache_max_time) <= $now  ) {
				@unlink( $blog_cache_dir . $file );
				@unlink( $blog_cache_dir . 'meta/' . str_replace( '.html', '.meta', $file ) );
				continue;
			}
			if($file != '.' && $file != '..') {
				if( is_dir( $blog_cache_dir . $file ) == false && (@filemtime($blog_cache_dir . $file) + $cache_max_time) <= $now  ) {
					if( substr( $file, -9 ) != '.htaccess' )
						@unlink($blog_cache_dir . $file);
				}
			}
		}
		closedir($handle);
		prune_super_cache( $cache_path . 'supercache' );
	}

	wp_cache_writers_exit();
	return true;
}

function wp_cache_shutdown_callback() {
	global $cache_path, $cache_max_time, $file_expired, $file_prefix, $meta_file, $new_cache, $wp_cache_meta, $known_headers, $blog_id, $wp_cache_gzip_encoding, $gzsize, $cache_filename, $supercacheonly, $blog_cache_dir;
	global $wp_cache_blog_charset, $wp_cache_request_uri;

	$wp_cache_meta[ 'uri' ] = $_SERVER["SERVER_NAME"].preg_replace('/[ <>\'\"\r\n\t\(\)]/', '', $wp_cache_request_uri); // To avoid XSS attacks
	$wp_cache_meta[ 'blog_id' ] = $blog_id;
	$wp_cache_meta[ 'post' ] = wp_cache_post_id();

	$response = wp_cache_get_response_headers();
	foreach ($known_headers as $key) {
		if(isset($response[$key])) {
			$wp_cache_meta[ 'headers' ][ $key ] = "$key: " . $response[$key];
		}
	}
	if (!isset( $response['Last-Modified'] )) {
		$value = gmdate('D, d M Y H:i:s') . ' GMT';
		/* Dont send this the first time */
		/* @header('Last-Modified: ' . $value); */
		$wp_cache_meta[ 'headers' ][ 'Last-Modified' ] = "Last-Modified: $value";
	}
	if (!$response['Content-Type'] && !$response['Content-type']) {
		// On some systems, headers set by PHP can't be fetched from
		// the output buffer. This is a last ditch effort to set the
		// correct Content-Type header for feeds, if we didn't see
		// it in the response headers already. -- dougal
		if (is_feed()) {
			$type = get_query_var('feed');
			$type = str_replace('/','',$type);
			switch ($type) {
				case 'atom':
					$value = "application/atom+xml";
					break;
				case 'rdf':
					$value = "application/rdf+xml";
					break;
				case 'rss':
				case 'rss2':
				default:
					$value = "application/rss+xml";
			}
		} else { // not a feed
			$value = get_option( 'html_type' );
			if( $value == '' )
				$value = 'text/html';
		}
		$value .=  "; charset=\"" . $wp_cache_blog_charset . "\"";

		@header("Content-Type: $value");
		$wp_cache_meta[ 'headers' ][ 'Content-Type' ] = "Content-Type: $value";
	}

	if ( ! $supercacheonly && $new_cache ) {
		if( $wp_cache_gzip_encoding && !in_array( 'Content-Encoding: ' . $wp_cache_gzip_encoding, $wp_cache_meta[ 'headers' ] ) ) {
			$wp_cache_meta[ 'headers' ][ 'Content-Encoding' ] = 'Content-Encoding: ' . $wp_cache_gzip_encoding;
			$wp_cache_meta[ 'headers' ][ 'Vary' ] = 'Vary: Accept-Encoding, Cookie';
		}

		$serial = serialize($wp_cache_meta);
		if( wp_cache_writers_entry() ) {
			$tmp_meta_filename = $blog_cache_dir . 'meta/' . uniqid( mt_rand(), true ) . '.tmp';
			$fr = @fopen( $tmp_meta_filename, 'w');
			if( !$fr )
				@mkdir( $blog_cache_dir . 'meta' );
			$fr = fopen( $tmp_meta_filename, 'w');
			fputs($fr, $serial);
			fclose($fr);
			@chmod( $tmp_meta_filename, 0666 & ~umask());
			if( !@rename( $tmp_meta_filename, $blog_cache_dir . 'meta/' . $meta_file ) ) {
				unlink( $blog_cache_dir . 'meta/' . $meta_file );
				rename( $tmp_meta_filename, $blog_cache_dir . 'meta/' . $meta_file );
			}
			wp_cache_writers_exit();
		}
	}
	global $time_to_gc_cache;
	if( isset( $time_to_gc_cache ) && $time_to_gc_cache == 1 )
		do_action( 'wp_cache_gc' );
}

function wp_cache_no_postid($id) {
	return wp_cache_post_change(wp_cache_post_id());
}

function wp_cache_get_postid_from_comment($comment_id) {
	global $super_cache_enabled, $wp_cache_request_uri;
	$comment = get_comment($comment_id, ARRAY_A);
	$postid = $comment['comment_post_ID'];
	// Do nothing if comment is not moderated
	// http://ocaoimh.ie/2006/12/05/caching-wordpress-with-wp-cache-in-a-spam-filled-world
	if( !preg_match('/wp-admin\//', $wp_cache_request_uri) ) 
		if( $comment['comment_approved'] == 'spam' ) { // changed from 1 to "spam"
			return $postid;
		} elseif( $comment['comment_approved'] == '0' ) {
			$super_cache_enabled = 0; // don't remove the super cache static file until comment is approved
		}
	// We must check it up again due to WP bugs calling two different actions
	// for delete, for example both wp_set_comment_status and delete_comment 
	// are called when deleting a comment
	if ($postid > 0) 
		return wp_cache_post_change($postid);
	else 
		return wp_cache_post_change(wp_cache_post_id());
}

function wp_cache_post_edit($post_id) {
	global $wp_cache_clear_on_post_edit, $cache_path, $blog_cache_dir;
	if( $wp_cache_clear_on_post_edit ) {
		prune_super_cache( $blog_cache_dir, true );
		prune_super_cache( $cache_path . 'supercache/', true );
	} else {
		wp_cache_post_change( $post_id );
	}
}

function wp_cache_post_id_gc( $siteurl, $post_id ) {
	global $cache_path;
	
	$post_id = intval( $post_id );
	if( $post_id == 0 )
		return;

	$permalink = trailingslashit( str_replace( get_option( 'home' ), '', post_permalink( $post_id ) ) );
	$dir = $cache_path . 'supercache/' . $siteurl;
	prune_super_cache( $dir . $permalink, true, true );
	@rmdir( $dir . $permalink );
	prune_super_cache( $dir . 'page/', true );
}

function wp_cache_post_change($post_id) {
	global $file_prefix, $cache_path, $blog_id, $super_cache_enabled, $blog_cache_dir, $blogcacheid;
	static $last_processed = -1;

	if ($post_id == $last_processed) return $post_id;
	$last_processed = $post_id;
	if( !wp_cache_writers_entry() )
		return $post_id;

	$permalink = trailingslashit( str_replace( get_option( 'siteurl' ), '', post_permalink( $post_id ) ) );
	if( $super_cache_enabled ) {
		$siteurl = trailingslashit( strtolower( preg_replace( '/:.*$/', '', str_replace( 'http://', '', get_option( 'home' ) ) ) ) );
		// make sure the front page has a rebuild file
		prune_super_cache( $cache_path . 'supercache/' . $siteurl . 'index.html', true, true ); 
		prune_super_cache( $cache_path . 'supercache/' . $siteurl . 'index.html.gz', true, true );
		wp_cache_post_id_gc( $siteurl, $post_id );
		if( get_option( 'show_on_front' ) == 'page' ) {
			wp_cache_post_id_gc( $siteurl, get_option( 'page_on_front' ) );
			wp_cache_post_id_gc( $siteurl, get_option( 'page_for_posts' ) );
		}
	}

	$matches = array();
	if ( ($handle = @opendir( $blog_cache_dir . 'meta/' )) ) { 
		while ( false !== ($file = readdir($handle))) {
			if ( preg_match("/^({$file_prefix}{$blogcacheid}.*)\.meta/", $file, $matches) ) {
				$meta_pathname = $blog_cache_dir . 'meta/' . $file;
				$content_pathname = $blog_cache_dir . $matches[1] . ".html";
				$meta = unserialize(@file_get_contents($meta_pathname));
				if( false == is_array( $meta ) ) {
					@unlink($meta_pathname);
					@unlink($content_pathname);
					continue;
				}
				if ($post_id > 0 && $meta) {
					if ($meta[ 'blog_id' ] == $blog_id  && (!$meta[ 'post' ] || $meta[ 'post' ] == $post_id) ) {
						@unlink($meta_pathname);
						@unlink($content_pathname);
						@wp_cache_rebuild_or_delete($cache_path . 'supercache/' . trailingslashit( $meta[ 'uri' ] ) . 'index.html');
						@wp_cache_rebuild_or_delete($cache_path . 'supercache/' . trailingslashit( $meta[ 'uri' ] ) . 'index.html.gz');
					}
				} elseif ($meta[ 'blog_id' ] == $blog_id) {
					@unlink($meta_pathname);
					@unlink($content_pathname);
					@wp_cache_rebuild_or_delete($cache_path . 'supercache/' . trailingslashit( $meta[ 'uri' ] ) . 'index.html');
					@wp_cache_rebuild_or_delete($cache_path . 'supercache/' . trailingslashit( $meta[ 'uri' ] ) . 'index.html.gz');
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
	return $b_sec - $a_sec + $b_dec - $a_dec;
}

function wp_cache_post_id() {
	global $posts, $comment_post_ID, $post_ID;
	// We try hard all options. More frequent first.
	if ($post_ID > 0 ) return $post_ID;
	if ($comment_post_ID > 0 )  return $comment_post_ID;
	if (is_single() || is_page()) return $posts[0]->ID;
	if (isset( $_GET[ 'p' ] ) && $_GET['p'] > 0) return $_GET['p'];
	if (isset( $_POST[ 'p' ] ) && $_POST['p'] > 0) return $_POST['p'];
	return 0;
}

function wp_cache_gc_cron() {
	global $file_prefix, $cache_max_time;

	if( !isset( $cache_max_time ) )
		$cache_max_time = 600;

	$start = time();
	if( !wp_cache_phase2_clean_expired($file_prefix ) ) {
		wp_cache_debug( 'Cache Expiry cron job failed. Probably mutex locked.' );
		update_option( 'wpsupercache_gc_time', time() - ( $cache_max_time - 10 ) ); // if GC failed then run it again in one minute
	}
	if( time() - $start > 30 )
		wp_cache_debug( "Cache Expiry cron job took more than 30 seconds to execute.\nYou should reduce the Expiry Time in the WP Super Cache admin page\nas you probably have more cache files than your server can handle efficiently." );
}

?>
