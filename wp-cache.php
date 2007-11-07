<?php
/*
Plugin Name: WP Super Cache
Plugin URI: http://ocaoimh.ie/wp-super-cache/
Description: Very fast cache module. It's composed of several modules, this plugin can configure and manage the whole system. Once enabled, you must <a href="options-general.php?page=wp-super-cache/wp-cache.php">enable the cache</a>. Based on WP-Cache by <a href="http://mnm.uib.es/gallir/">Ricardo Galli Granada</a>.
Version: 0.3.1
Author: Donncha O Caoimh
Author URI: http://ocaoimh.ie/
*/
/*  Copyright 2005-2006  Ricardo Galli Granada  (email : gallir@uib.es)
    Some code copyright 2007 Donncha O Caoimh (http://ocaoimh.ie/)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

$wp_cache_config_file = ABSPATH . 'wp-content/wp-cache-config.php';

if( !@include($wp_cache_config_file) ) {
	get_wpcachehome();
	$wp_cache_config_file_sample = WPCACHEHOME . 'wp-cache-config-sample.php';
	@include($wp_cache_config_file_sample);
} else {
	get_wpcachehome();
}

$wp_cache_config_file_sample = WPCACHEHOME . 'wp-cache-config-sample.php';
$wp_cache_link = ABSPATH . 'wp-content/advanced-cache.php';
$wp_cache_file = WPCACHEHOME . 'wp-cache-phase1.php';

include(WPCACHEHOME . 'wp-cache-base.php');

function get_wpcachehome() {
	if( defined( 'WPCACHEHOME' ) == false ) {
		if( is_file( dirname(__FILE__) . '/wp-cache-config-sample.php' ) ) {
			define( 'WPCACHEHOME', trailingslashit( dirname(__FILE__) ) );
		} elseif( is_file( dirname(__FILE__) . '/wp-super-cache/wp-cache-config-sample.php' ) ) {
			define( 'WPCACHEHOME', dirname(__FILE__) . '/wp-super-cache/' );
		} else {
			die( 'Please create wp-content/wp-cache-config.php from wp-super-cache/wp-cache-config-sample.php' );
		}
	}
}

function wp_cache_add_pages() {
	if( function_exists( 'is_site_admin' ) ) {
		if( is_site_admin() ) {
			add_submenu_page('wpmu-admin.php', __('WP Super Cache'), __('WP Super Cache'), 'administrator', __FILE__, 'wp_cache_manager');
		}
	} else {
		add_options_page('WP Super Cache', 'WP Super Cache', 'administrator', __FILE__, 'wp_cache_manager');
	}
}

function wp_cache_manager() {
	global $wp_cache_config_file, $valid_nonce, $supercachedir, $cache_path, $cache_enabled, $cache_compression, $super_cache_enabled;

	if( function_exists( 'is_site_admin' ) )
		if( !is_site_admin() )
			return;

	$supercachedir = $cache_path . 'supercache/' . preg_replace('/:.*$/', '',  $_SERVER["HTTP_HOST"]);
	if( get_option( 'gzipcompression' ) == 1 )
		update_option( 'gzipcompression', 0 );
	$valid_nonce = wp_verify_nonce($_REQUEST['_wpnonce'], 'wp-cache');
	
 	echo '<div class="wrap">';
	echo "<h2>WP Super Cache Manager</h2>\n";
	if(isset($_REQUEST['wp_restore_config']) && $valid_nonce) {
		unlink($wp_cache_config_file);
		echo '<strong>Configuration file changed, some values might be wrong. Load the page again from the "Options" menu to reset them.</strong>';
	}

	echo '<a name="main"></a><fieldset class="options"><legend>Main options</legend>';
	if ( !wp_cache_check_link() ||
		!wp_cache_verify_config_file() ||
		!wp_cache_verify_cache_dir() ) {
		echo "<br>Cannot continue... fix previous problems and retry.<br />";
		echo "</fieldset></div>\n";
		return;
	}

	if (!wp_cache_check_global_config()) {
		echo "</fieldset></div>\n";
		return;
	}

	echo "<h4>WP Super Cache is:</h4>";
	if ( $valid_nonce ) {
		if( isset( $_POST[ 'wp_cache_status' ] ) ) {
			switch( $_POST[ 'wp_cache_status' ] ) {
				case 'all':
					wp_cache_enable();
					break;
				case 'none':
					wp_cache_disable();
					break;
				case 'wpcache':
					wp_cache_enable();
					wp_super_cache_disable();
					break;
			}
		}
		if( isset( $_POST[ 'cache_compression' ] ) && $_POST[ 'cache_compression' ] != $cache_compression ) {
			$cache_compression_changed = true;
			$cache_compression = intval( $_POST[ 'cache_compression' ] );
			wp_cache_replace_line('^ *\$cache_compression', "\$cache_compression = " . $cache_compression . ";", $wp_cache_config_file);
			if( function_exists( 'prune_super_cache' ) )
				prune_super_cache ($cache_path, true);
			delete_option( 'super_cache_meta' );
		}
	}

	echo '<form name="wp_manager" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	?>
	<label><input type='radio' name='wp_cache_status' value='all' <?php if( $cache_enabled == true && $super_cache_enabled == true ) { echo 'checked=checked'; } ?>> Enabled</label><br />
	<label><input type='radio' name='wp_cache_status' value='none' <?php if( $cache_enabled == false ) { echo 'checked=checked'; } ?>> Disabled</label><br />
	<label><input type='radio' name='wp_cache_status' value='wpcache' <?php if( $cache_enabled == true && $super_cache_enabled == false ) { echo 'checked=checked'; } ?>> Super Cache Disabled</label><br />
	<p><strong>Super Cache compression:</strong>
	<label><input type="radio" name="cache_compression" value="1" <?php if( $cache_compression ) { echo "checked=checked"; } ?>> Enabled</label>
	<label><input type="radio" name="cache_compression" value="0" <?php if( !$cache_compression ) { echo "checked=checked"; } ?>> Disabled</label>
	<p>Compression is disabled by default because some hosts have problems with compressed files. Switching this on and off clears the cache.</p>
	<?php
	if( isset( $cache_compression_changed ) && isset( $_POST[ 'cache_compression' ] ) && !$cache_compression ) {
		?><p><strong>Super Cache compression is now disabled. For maximum performance you should remove or comment out the following rules in your .htaccess file:</strong></p>
	<blockquote style='background-color: #ff6'><code>RewriteCond %{HTTP_COOKIE} !^.*comment_author_.*$<br />
	RewriteCond %{HTTP_COOKIE} !^.*wordpressuser.*$<br />
	RewriteCond %{HTTP_COOKIE} !^.*wp-postpass_.*$<br />
	RewriteCond %{HTTP:Accept-Encoding} gzip<br />
	RewriteCond %{DOCUMENT_ROOT}/wp-content/cache/supercache/%{HTTP_HOST}/$1index.html.gz -f<br />
	RewriteRule ^(.*) /wp-content/cache/supercache/%{HTTP_HOST}/$1index.html.gz [L]</code>
		</blockquote><?php
	} elseif( isset( $cache_compression_changed ) && isset( $_POST[ 'cache_compression' ] ) && $cache_compression ) {
		?><p><strong>Super Cache compression is now enabled. You must add or uncomment the following rules in your .htaccess file:</strong></p>
	<blockquote style='background-color: #ff6'><code>RewriteCond %{HTTP_COOKIE} !^.*comment_author_.*$<br />
	RewriteCond %{HTTP_COOKIE} !^.*wordpressuser.*$<br />
	RewriteCond %{HTTP_COOKIE} !^.*wp-postpass_.*$<br />
	RewriteCond %{HTTP:Accept-Encoding} gzip<br />
	RewriteCond %{DOCUMENT_ROOT}/wp-content/cache/supercache/%{HTTP_HOST}/$1index.html.gz -f<br />
	RewriteRule ^(.*) /wp-content/cache/supercache/%{HTTP_HOST}/$1index.html.gz [L]</code>
		</blockquote><?php
	}
	echo '<div class="submit"><input type="submit"value="Update" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";

	wp_cache_edit_max_time();
	echo '</fieldset>';

	echo '<a name="files"></a><fieldset class="options"><legend>Accepted filenames, rejected URIs</legend>';
	wp_cache_edit_rejected();
	echo "<br />\n";
	wp_cache_edit_accepted();
	echo '</fieldset>';

	wp_cache_edit_rejected_ua();

	wp_cache_files();

	wp_cache_restore();

	ob_start();
	if( !function_exists( 'do_cacheaction' ) ) {
		die( 'Install is not complete. Please delete wp-content/advanced-cache.php' );
	} else {
		do_cacheaction( 'cache_admin_page' );
	}
	$out = ob_get_contents();
	ob_end_clean();
	if( $out != '' ) {
		echo '<fieldset class="options"><legend>Cache Plugins</legend>';
		echo $out;
		echo '</fieldset>';
	}

	echo "</div>\n";

}

function wp_cache_restore() {
	echo '<fieldset class="options"><legend>Configuration messed up?</legend>';
	echo '<form name="wp_restore" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<input type="hidden" name="wp_restore_config" />';
	echo '<div class="submit"><input type="submit" id="deletepost" value="Restore default configuration" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
	echo '</fieldset>';

}

function wp_cache_edit_max_time () {
	global $super_cache_max_time, $cache_max_time, $wp_cache_config_file, $valid_nonce;

	if( !isset( $super_cache_max_time ) )
		$super_cache_max_time = 21600;

	if(isset($_POST['wp_max_time']) && $valid_nonce) {
		$max_time = (int)$_POST['wp_max_time'];
		if ($max_time > 0) {
			$cache_max_time = $max_time;
			wp_cache_replace_line('^ *\$cache_max_time', "\$cache_max_time = $cache_max_time;", $wp_cache_config_file);
		}
	}
	if(isset($_POST['super_cache_max_time']) && $valid_nonce) {
		$max_time = (int)$_POST['super_cache_max_time'];
		if ($max_time > 0) {
			$super_cache_max_time = $max_time;
			wp_cache_replace_line('^ *\$super_cache_max_time', "\$super_cache_max_time = $super_cache_max_time;", $wp_cache_config_file);
		}
	}
	echo '<form name="wp_edit_max_time" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<label for="wp_max_time">Expire time (in seconds)</label>';
	echo "<input type=\"text\" name=\"wp_max_time\" value=\"$cache_max_time\" /><br />";
	echo '<label for="super_cache_max_time">Super Cache Expire time (in seconds)</label>';
	echo "<input type=\"text\" name=\"super_cache_max_time\" value=\"$super_cache_max_time\" />";
	echo '<div class="submit"><input type="submit" value="Change expiration" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";


}

function wp_cache_sanitize_value($text, & $array) {
	$text = wp_specialchars(strip_tags($text));
	$array = preg_split("/[\s,]+/", chop($text));
	$text = var_export($array, true);
	$text = preg_replace('/[\s]+/', ' ', $text);
	return $text;
}

function wp_cache_edit_rejected_ua() {
	global $cache_rejected_user_agent, $wp_cache_config_file, $valid_nonce;

	if (!function_exists('apache_request_headers')) return;

	if(isset($_REQUEST['wp_rejected_user_agent']) && $valid_nonce) {
		$text = wp_cache_sanitize_value($_REQUEST['wp_rejected_user_agent'], $cache_rejected_user_agent);
		wp_cache_replace_line('^ *\$cache_rejected_user_agent', "\$cache_rejected_user_agent = $text;", $wp_cache_config_file);
	}


	echo '<a name="user-agents"></a><fieldset class="options"><legend>Rejected User Agents</legend>';
	echo "<p>Strings in the HTTP 'User Agent' header that prevent WP-Cache from 
		caching bot, spiders, and crawlers' requests.
		Note that cached files are still sent to these request if they already exists.</p>\n";
	echo '<form name="wp_edit_rejected_user_agent" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<label for="wp_rejected_user_agent">Rejected UA strings</label>';
	echo '<textarea name="wp_rejected_user_agent" cols="40" rows="4" style="width: 70%; font-size: 12px;" class="code">';
	foreach ($cache_rejected_user_agent as $ua) {
		echo wp_specialchars($ua) . "\n";
	}
	echo '</textarea> ';
	echo '<div class="submit"><input type="submit" value="Save UA strings" /></div>';
	wp_nonce_field('wp-cache');
	echo '</form>';
	echo "</fieldset>\n";
}


function wp_cache_edit_rejected() {
	global $cache_acceptable_files, $cache_rejected_uri, $wp_cache_config_file, $valid_nonce;

	if(isset($_REQUEST['wp_rejected_uri']) && $valid_nonce) {
		$text = wp_cache_sanitize_value($_REQUEST['wp_rejected_uri'], $cache_rejected_uri);
		wp_cache_replace_line('^ *\$cache_rejected_uri', "\$cache_rejected_uri = $text;", $wp_cache_config_file);
	}


	echo "<p>Add here strings (not a filename) that forces a page not to be cached. For example, if your URLs include year and you dont want to cache last year posts, it's enough to specify the year, i.e. '/2004/'. WP-Cache will search if that string is part of the URI and if so, it will no cache that page.</p>\n";
	echo '<form name="wp_edit_rejected" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<label for="wp_rejected_uri">Rejected URIs</label>';
	echo '<textarea name="wp_rejected_uri" cols="40" rows="4" style="width: 70%; font-size: 12px;" class="code">';
	foreach ($cache_rejected_uri as $file) {
		echo wp_specialchars($file) . "\n";
	}
	echo '</textarea> ';
	echo '<div class="submit"><input type="submit" value="Save strings" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
}

function wp_cache_edit_accepted() {
	global $cache_acceptable_files, $cache_rejected_uri, $wp_cache_config_file, $valid_nonce;

	if(isset($_REQUEST['wp_accepted_files']) && $valid_nonce) {
		$text = wp_cache_sanitize_value($_REQUEST['wp_accepted_files'], $cache_acceptable_files);
		wp_cache_replace_line('^ *\$cache_acceptable_files', "\$cache_acceptable_files = $text;", $wp_cache_config_file);
	}


	echo "<p>Add here those filenames that can be cached, even if they match one of the rejected substring specified above.</p>\n";
	echo '<form name="wp_edit_accepted" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<label for="wp_accepted_files">Accepted files</label>';
	echo '<textarea name="wp_accepted_files" cols="40" rows="8" style="width: 70%; font-size: 12px;" class="code">';
	foreach ($cache_acceptable_files as $file) {
		echo wp_specialchars($file) . "\n";
	}
	echo '</textarea> ';
	echo '<div class="submit"><input type="submit" value="Save files" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
}

function wp_cache_enable() {
	global $wp_cache_config_file, $cache_enabled, $supercachedir;

	if(get_settings('gzipcompression')) {
		echo "<b>Error: GZIP compression is enabled, disable it if you want to enable wp-cache.</b><br /><br />";
		return false;
	}
	if( wp_cache_replace_line('^ *\$cache_enabled', '$cache_enabled = true;', $wp_cache_config_file) ) {
		$cache_enabled = true;
	}
	wp_super_cache_enable();
}

function wp_cache_disable() {
	global $wp_cache_config_file, $cache_enabled, $supercachedir, $cache_path;

	if (wp_cache_replace_line('^ *\$cache_enabled', '$cache_enabled = false;', $wp_cache_config_file)) {
		$cache_enabled = false;
	}
	wp_super_cache_disable();
}
function wp_super_cache_enable() {
	global $supercachedir, $wp_cache_config_file, $super_cache_enabled;

	if( is_dir( $supercachedir . ".disabled" ) )
		rename( $supercachedir . ".disabled", $supercachedir );
	wp_cache_replace_line('^ *\$super_cache_enabled', '$super_cache_enabled = true;', $wp_cache_config_file);
	$super_cache_enabled = true;
}

function wp_super_cache_disable() {
	global $supercachedir, $wp_cache_config_file, $super_cache_enabled;

	if( is_dir( $supercachedir ) )
		rename( $supercachedir, $supercachedir . ".disabled" );
	wp_cache_replace_line('^ *\$super_cache_enabled', '$super_cache_enabled = false;', $wp_cache_config_file);
	$super_cache_enabled = false;
}

function wp_cache_is_enabled() {
	global $wp_cache_config_file;

	if(get_settings('gzipcompression')) {
		echo "<b>Warning</b>: GZIP compression is enabled in Wordpress, wp-cache will be bypassed until you disable gzip compression.<br />";
		return false;
	}
	$lines = file($wp_cache_config_file);
	foreach($lines as $line) {
	 	if (preg_match('/^ *\$cache_enabled *= *true *;/', $line))
			return true;
	}
	return false;
}


function wp_cache_replace_line($old, $new, $my_file) {
	if (!is_writable($my_file)) {
		echo "Error: file $my_file is not writable.<br />\n";
		return false;
	}
	$found = false;
	$lines = file($my_file);
	foreach($lines as $line) {
	 	if ( preg_match("/$old/", $line)) {
			$found = true;
			break;
		}
	}
	if ($found) {
		$fd = fopen($my_file, 'w');
		foreach($lines as $line) {
			if ( !preg_match("/$old/", $line))
				fputs($fd, $line);
			else {
				fputs($fd, "$new //Added by WP-Cache Manager\n");
			}
		}
		fclose($fd);
		return true;
	}
	$fd = fopen($my_file, 'w');
	$done = false;
	foreach($lines as $line) {
		if ( $done || !preg_match('/^define|\$|\?>/', $line))
			fputs($fd, $line);
		else {
			fputs($fd, "$new //Added by WP-Cache Manager\n");
			fputs($fd, $line);
			$done = true;
		}
	}
	fclose($fd);
	return true;
/*
	copy($my_file, $my_file . "-prev");
	rename($my_file . '-new', $my_file);
*/
}

function wp_cache_verify_cache_dir() {
	global $cache_path;

	$dir = dirname($cache_path);
	if ( !file_exists($cache_path) ) {
		if ( !is_writable( $dir ) || !($dir = mkdir( $cache_path ) ) ) {
				echo "<b>Error:</b> Your cache directory (<b>$cache_path</b>) did not exist and couldn't be created by the web server. <br /> Check  $dir permissions.";
				return false;
		}
	}
	if ( !is_writable($cache_path)) {
		echo "<b>Error:</b> Your cache directory (<b>$cache_path</b>) or <b>$dir</b> need to be writable for this plugin to work. <br /> Double-check it.";
		return false;
	}

	if ( '/' != substr($cache_path, -1)) {
		$cache_path .= '/';
	}

	@mkdir( $cache_path . 'meta/' );

	return true;
}

function wp_cache_verify_config_file() {
	global $wp_cache_config_file, $wp_cache_config_file_sample;

	$new = false;
	$dir = dirname($wp_cache_config_file);

	if ( !is_writable($dir)) {
			echo "<b>Error:</b> wp-content directory (<b>$dir</b>) is not writable by the Web server.<br />Check its permissions.";
			return false;
	}
	if ( !file_exists($wp_cache_config_file) ) {
		if ( !file_exists($wp_cache_config_file_sample) ) {
			echo "<b>Error:</b> Sample WP-Cache config file (<b>$wp_cache_config_file_sample</b>) does not exist.<br />Verify you installation.";
			return false;
		}
		copy($wp_cache_config_file_sample, $wp_cache_config_file);
		if( is_file( dirname(__FILE__) . '/wp-cache-config-sample.php' ) ) {
			wp_cache_replace_line('WPCACHEHOME', "define( 'WPCACHEHOME', " . str_replace( ABSPATH, 'ABSPATH . "', dirname(__FILE__) ) . "/\" );", $wp_cache_config_file);
		} elseif( is_file( dirname(__FILE__) . '/wp-super-cache/wp-cache-config-sample.php' ) ) {
			wp_cache_replace_line('WPCACHEHOME', "define( 'WPCACHEHOME', " . str_replace( ABSPATH, 'ABSPATH . "', dirname(__FILE__) ) . "/wp-super-cache/\" );", $wp_cache_config_file);
		}
		$new = true;
	}
	if ( !is_writable($wp_cache_config_file)) {
		echo "<b>Error:</b> Your WP-Cache config file (<b>$wp_cache_config_file</b>) is not writable by the Web server.<br />Check its permissions.";
		return false;
	}
	require($wp_cache_config_file);
	return true;
}

function wp_cache_check_link() {
	global $wp_cache_link, $wp_cache_file;

	if ( basename(@readlink($wp_cache_link)) != basename($wp_cache_file)) {
		@unlink($wp_cache_link);
		if( function_exists( 'symlink' ) ) {
		if (!@symlink ($wp_cache_file, $wp_cache_link)) {
			echo "<code>advanced-cache.php</code> link does not exist<br />";
			echo "Create it by executing: <br /><code>ln -s $wp_cache_file $wp_cache_link</code><br /> in your server<br />";
			return false;
		} else {
			if( !@copy( $wp_cache_file, $wp_cache_link ) ) {
				echo "<code>advanced-cache.php</code> does not exist<br />";
				echo "Create it by copying $wp_cache_file to $wp_cache_link<br /> in your server<br />";
				return false;
			}
		}
		}
	}
	return true;
}

function wp_cache_check_global_config() {

	$global = ABSPATH . 'wp-config.php';

	$lines = file($global);
	foreach($lines as $line) {
	 	if (preg_match('/^ *define *\( *\'WP_CACHE\' *, *true *\) *;/', $line)) {
			return true;
		}
	}
	$line = 'define(\'WP_CACHE\', true);';
	if (!is_writable($global) || !wp_cache_replace_line('define *\( *\'WP_CACHE\'', $line, $global) ) {
			echo "<b>Error: WP_CACHE is not enabled</b> in your <code>wp-config.php</code> file and I couldn't modified it.<br />";
			echo "Edit <code>$global</code> and add the following line: <br /><code>define('WP_CACHE', true);</code><br />Otherwise, <b>WP-Cache will not be executed</b> by Wordpress core. <br />";
			return false;
	} 
	return true;
}

function wp_cache_files() {
	global $cache_path, $file_prefix, $cache_max_time, $super_cache_max_time, $valid_nonce, $supercachedir;

	if ( '/' != substr($cache_path, -1)) {
		$cache_path .= '/';
	}

	if ( $valid_nonce ) {
		if(isset($_REQUEST['wp_delete_cache'])) {
			wp_cache_clean_cache($file_prefix);
		}
		if(isset($_REQUEST['wp_delete_cache_file'])) {
			wp_cache_clean_cache($_REQUEST['wp_delete_cache_file']);
		}
		if(isset($_REQUEST['wp_delete_expired'])) {
			wp_cache_clean_expired($file_prefix);
		}
	}
	if(isset($_REQUEST['wp_list_cache'])) {
		$list_files = true;
		$list_mess = "Update list";
	} else 
		$list_mess = "List files";

	echo '<a name="list"></a><fieldset class="options"><legend>Cache contents</legend>';
	echo '<form name="wp_cache_content_list" action="'. $_SERVER["REQUEST_URI"] . '#list" method="post">';
	echo '<input type="hidden" name="wp_list_cache" />';
	echo '<div class="submit"><input type="submit" value="'.$list_mess.'" /></div>';
	echo "</form>\n";

	$count = 0;
	$expired = 0;
	$now = time();
	if ( ($handle = opendir( $cache_path . 'meta/' )) ) { 
		if ($list_files) echo "<table cellspacing=\"0\" cellpadding=\"5\">";
		while ( false !== ($file = readdir($handle))) {
			if ( preg_match("/^$file_prefix.*\.meta/", $file) ) {
				$this_expired = false;
				$content_file = preg_replace("/meta$/", "html", $file);
				$mtime = filemtime($cache_path . 'meta/' . $file);
				if ( ! ($fsize = @filesize($cache_path.$content_file)) ) 
					continue; // .meta does not exists
				$fsize = intval($fsize/1024);
				$age = $now - $mtime;
				if ( $age > $cache_max_time) {
					$expired++;
					$this_expired = true;
				}
				$count++;
				if ($list_files) {
					$meta = new CacheMeta;
					$meta = unserialize(file_get_contents($cache_path . 'meta/' . $file));
					echo $flip ? '<tr style="background: #EAEAEA;">' : '<tr>';
					$flip = !$flip;
					echo '<td><a href="http://' . $meta->uri . '" target="_blank" >';
					echo $meta->uri . "</a></td>";
					if ($this_expired) echo "<td><span style='color:red'>$age secs</span></td>";
					else echo "<td>$age secs</td>";
					echo "<td>$fsize KB</td>";
					echo '<td><form name="wp_delete_cache_file" action="'. $_SERVER["REQUEST_URI"] . '#list" method="post">';
					echo '<input type="hidden" name="wp_list_cache" />';
					echo '<input type="hidden" name="wp_delete_cache_file" value="'.preg_replace("/^(.*)\.meta$/", "$1", $file).'" />';
					echo '<div class="submit"><input id="deletepost" type="submit" value="Remove" /></div>';
					wp_nonce_field('wp-cache');
					echo "</form></td></tr>\n";
				}
			}
		}
		closedir($handle);
		if ($list_files) echo "</table>";
	}
	$sizes = get_option( 'super_cache_meta' );
	if( !$sizes )
		$sizes = array( 'expired' => 0, 'cached' => 0, 'ts' => 0 );

	$now = time();
	if( $_POST[ 'super_cache_stats' ] == 1 || $sizes[ 'cached' ] == 0 || $sizes[ 'ts' ] + 3600 <= $now ) {
		$sizes = array( 'expired' => 0, 'cached' => 0, 'ts' => 0 );

		if (is_dir($supercachedir)) {
			$entries = glob($supercachedir. '/*');
			foreach ($entries as $entry) {
				if ($entry != '.' && $entry != '..') {
					$sizes = wpsc_dirsize( $entry, $sizes );
				}
			}
		} else {
			if(is_file($supercachedir) && filemtime( $supercachedir ) + $super_cache_max_time <= $now )
				$sizes[ 'expired' ] ++;
		}
		$sizes[ 'ts' ] = time();
		update_option( 'super_cache_meta', $sizes );
	}
	echo "<p><strong>WP-Cache</strong></p>";
	echo "<ul><li>$count cached pages</li>";
	echo "<li>$expired expired pages</li></ul>";
	echo "<p><strong>WP-Super-Cache</strong></p>";
	echo "<ul><li>" . intval($sizes['cached']/2) . " cached pages</li>";
	$age = intval(($now - $sizes['ts'])/60);
	echo "<li>" . intval($sizes['expired']/2) . " expired pages. (Generated $age minutes ago. Refresh in " . (60 - $age) . " minutes. )</li></ul>";

	echo '<form name="wp_cache_content_expired" action="'. $_SERVER["REQUEST_URI"] . '#list" method="post">';
	echo '<input type="hidden" name="wp_delete_expired" />';
	echo '<div class="submit"><input type="submit" value="Delete expired" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";


	echo '<form name="wp_cache_content_delete" action="'. $_SERVER["REQUEST_URI"] . '#list" method="post">';
	echo '<input type="hidden" name="wp_delete_cache" />';
	echo '<div class="submit"><input id="deletepost" type="submit" value="Delete cache" /></div>';

	wp_nonce_field('wp-cache');
	echo "</form>\n";

	echo '<form name="wp_super_cache_stats" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<input type="hidden" name="super_cache_stats" value="1" />';
	echo '<div class="submit"><input type="submit" value="Regenerate Super Cache Stats" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";

	echo '</fieldset>';
}

function wpsc_dirsize($directory, $sizes) {
	global $super_cache_max_time;
	$now = time();

	if (is_dir($directory)) {
		$entries = glob($directory. '/*');
		foreach ($entries as $entry) {
			if ($entry != '.' && $entry != '..') {
				$sizes = wpsc_dirsize($entry, $sizes);
			}
		}
	} else {
		if(is_file($directory) ) {
			if( filemtime( $directory ) + $super_cache_max_time <= $now ) {
				$sizes[ 'expired' ]+=1;
			} else {
				$sizes[ 'cached' ]+=1;
			}
		}
	}
	return $sizes;
}


function wp_cache_clean_cache($file_prefix) {
	global $cache_path, $supercachedir;

	// If phase2 was compiled, use its function to avoid race-conditions
	if(function_exists('wp_cache_phase2_clean_cache')) {
		if (function_exists ('prune_super_cache')) {
			if( is_dir( $supercachedir ) ) {
				prune_super_cache( $supercachedir, true );
			} elseif( is_dir( $supercachedir . '.disabled' ) ) {
				prune_super_cache( $supercachedir . '.disabled', true );
			}
			prune_super_cache( $cache_path, true );
			$_POST[ 'super_cache_stats' ] = 1; // regenerate super cache stats;
		}
		return wp_cache_phase2_clean_cache($file_prefix);
	}

	$expr = "/^$file_prefix/";
	if ( ($handle = opendir( $cache_path )) ) { 
		while ( false !== ($file = readdir($handle))) {
			if ( preg_match($expr, $file) ) {
				unlink($cache_path . $file);
				unlink($cache_path . 'meta/' . str_replace( '.html', '.term', $file ) );
			}
		}
		closedir($handle);
	}
}

function wp_cache_clean_expired($file_prefix) {
	global $cache_path, $cache_max_time;

	// If phase2 was compiled, use its function to avoid race-conditions
	if(function_exists('wp_cache_phase2_clean_expired')) {
		if (function_exists ('prune_super_cache')) {
			$dir = $cache_path . 'supercache/' . preg_replace('/:.*$/', '',  $_SERVER["HTTP_HOST"]);
			if( is_dir( $dir ) ) {
				prune_super_cache( $dir );
			} elseif( is_dir( $dir . '.disabled' ) ) {
				prune_super_cache( $dir . '.disabled' );
			}
			$_POST[ 'super_cache_stats' ] = 1; // regenerate super cache stats;
		}
		return wp_cache_phase2_clean_expired($file_prefix);
	}

	$expr = "/^$file_prefix/";
	$now = time();
	if ( ($handle = opendir( $cache_path )) ) { 
		while ( false !== ($file = readdir($handle))) {
			if ( preg_match($expr, $file)  &&
				(filemtime($cache_path . $file) + $cache_max_time) <= $now) {
				unlink($cache_path . $file);
				unlink($cache_path . 'meta/' . str_replace( '.html', '.term', $file ) );
			}
		}
		closedir($handle);
	}
}

add_action('admin_menu', 'wp_cache_add_pages');

if( get_option( 'gzipcompression' ) )
	update_option( 'gzipcompression', 0 );

?>
