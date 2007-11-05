<?php
/*
Plugin Name: WP Super Cache
Plugin URI: http://ocaoimh.ie/wp-super-cache/
Description: Very fast cache module. It's composed of several modules, this plugin can configure and manage the whole system. Once enabled, you must <a href="options-general.php?page=wp-super-cache/wp-cache.php">enable the cache</a>. Based on WP-Cache by <a href="http://mnm.uib.es/gallir/">Ricardo Galli Granada</a>.
Version: 0.1
Author: Donncha O Caoimh
Author URI: http://ocaoimh.ie/
*/
/*  Copyright 2005-2006  Ricardo Galli Granada  (email : gallir@uib.es)

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

/* Changelog
	2007-09-21
		- Version 2.1.2:
			- Add "Content-type" to "known header" because WP uses both (?).
			- Removed quotes from charset http headers, some clients get confused.

	2007-03-23
		- Version 2.1.1: Patch from Alex Concha: add control in admin pages to avoid 
		                possible XSS derived from CSRF attacks, if the users store
						the form with the "injected" bad values.
	2007-01-31
		- Version 2.1: modified and tested with WP 2.1, WP 2.0, WP 1.5 and PHP 4.3 and PHP 5.2.

	2007-01-14: 2.0.22
		- Corrected bug with meta object not marked as dynamic (introduce in 2.0.20 by http://dev.wp-plugins.org/ticket/517

	2006-12-31: 2.0.21
		- Added global definitien missing from http://dev.wp-plugins.org/ticket/517

	2006-12-31: 2.0.20
		- See http://mnm.uib.es/gallir/posts/2006/12/31/930/

	2006-11-06: 2.0.19
		- Added control of blog_id to delete only those cache files belonging to the same
		  virtual blog. $blog_id is tricky business, because the variable is not assigned yet
		  when wp-cache-phase1.php is called, so it cannot be used as part of the key.

	2006-11-04: 2.0.18 (beta)
		- Changed the use of REQUEST_URI to SCRIPT_URI for key generation. This
		  would solve problems in WP-MU.
		- Clean URI string in MetaCache object to avoid XSS attacks in the admin page.
		- Do not cache 404 pages.
	2005-10-23: 2.0.17
		- Commented out Content-Lenght negotiation, some site have strange problems with
		  ob_content_lenght and buffer length at OB shutdown. WP does not send it anyway.

	2005-10-20: 2.0.16
		- strlen($buffer) is a bug the that function, it's really not defined.
		
	2005-10-16: 2.0.15
		- Changed "Content-Size" to "Content-Length". Obvious bug.

	2005-09-12: 2.0.14
		- Add array() to headers to avoid PHP warnings

	2005-09-08: 2.0.13
			- Move request for Apache response headers to the shutdown callback
			  It seems some plugins do dirty things with headers... or php config?

	2005-07-26: 2.0.12
			- Patch from James (http://shreddies.org/) to delete individual cache files

	2005-07-21: 2.0.11
			- Check also for Last-Modified headers. Last WP version (1.5.3) does not 
			  it.
			- Move the previous check to the ob_callback, so the aditional headers 
			  can be sent also when cache still does not exist.

	2005-07-19: 2.0.10
			- Check also for feeds' closing tags
			  (patch from Daniel Westermann-Clark <dwc at ufl dot edu>)

	2005-07-19: 2.0.9
			- Better control of post_id and comment_id by refactoring the code
			  (inspired by a Brian Dupuis patch).
			- Avoid cleaning cache twice due to WP bugs that wrongly calls two actions.
			
	2005-07-12: 2.0.8
			- Add paranoic control to make sure it only caches files with
			  closing "body" and "html" tags.

	2005-06-23: 2.0.7
			- Add an extra control to make sure meta_mtime >= content_mtime
			  (it could serves incomplete html because other process is re-generating
			   content file and the meta file is the previous one).

	2005-06-23: 2.0.6
			- Delect cache _selectively_. If post_id is known
			  it deletes only that cache and the general (indexes) ones.
			  See: http://mnm.uib.es/gallir/wp-cache-2/#comment-4194
			- Delete cache files (all) also after moderation.

	2005-06-19: 2.0.5
			- Added "#anchors" to refresh cache files' list
			  (http://mnm.uib.es/gallir/wp-cache-2/#comment-4116)

	2005-06-09: 2.0.4
			- Avoid "fwrite() thrashing" at the begining of a connections storm
			- Send Content-Size header when generated dynamically too
			- Clean stats cache before deleting expired files
			- Optimized phase1, EVEN MORE! :-): 
				removed random and extrachecks that were not useful in the context 
				move checking for .meta at the begining

	2005-05-27: 2.0.3
			- Check for zero length of user agent and uri strings

	2005-05-24: 2.0.2a
			- As a workaround for buggy apache installations, create
			  Content-Type header if is not retrieved from Apache headers.
	2005-05-23: 2.0.2
			- Added mfunc sintax as in Staticize Reloaded 2.5,
			  also keep tags but take out function calls
			- Check of numbers are really numbers in web forms.
			- Remove header_list function verification, its result are not
			  the same.
			- wp-cache now verifies if gzipcompression is enabled
			
	2005-05-08: 2.0.1
			sanitize function names to aovid namespace collisions

	2005-05-08: 2.0-beta6
			ignore URI after #, it's sent by buggy clients
			print in red expired files's cache time
			if phase2 was compiled, reuse its function to remove files,
				it avoids race-conditions
			check html _and_ meta exist when listing/accesing files in cache

	2005-05-06: 2.0-beta5
			remove all expired files when one has expired
			POSTs are completely ignored
			only wordpress specific cookies are used for the md5 key

	2005-05-06: 2.0-beta4
			move wp_cache_microtime_diff to phase 2
			normalize functions' name in phase2
			workaround for nasty bug un PHP4(.3) that hits when cache fallbacks to flock()

	2005-05-06:	2.0-beta3
			include sample configuration file if the final one does not exist
			more verbose in errors
			change order of initial configuration to give better information
			stop if global cache is not enabled
			wp-cache-phase1 returns silently if no wp-cache-config.php is found
				
	2005-05-06:	2.0-beta2
			removed paranoic chmod's
			check for cache file consistency in Phase1 several times
			addded option to prevent cache based on user-agents
			added size in KB to every listed file in "cache listing"

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
	if( function_exists( 'is_site_admin' ) )
		if( !is_site_admin() )
			return;

	add_options_page('WP Super Cache Manager', 'WP Super Cache', 'administrator', __FILE__, 'wp_cache_manager');
}

function wp_cache_manager() {
	global $wp_cache_config_file, $valid_nonce, $supercachedir, $cache_path, $cache_enabled, $cache_compression;

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
					wp_super_cache_disable();
					break;
			}
		}

		if( $_POST[ 'cache_compression' ] != $cache_compression ) {
			$cache_compression = $_POST[ 'cache_compression' ];
			wp_cache_replace_line('^ *\$cache_compression', "\$cache_compression = " . $_POST[ 'cache_compression' ] . ";", $wp_cache_config_file);
			prune_super_cache( $cache_path, true );
		}
	}

	echo '<form name="wp_manager" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	?>
	<input type='radio' name='wp_cache_status' value='all' <?php if( $cache_enabled == true && is_dir( $supercachedir ) ) { echo 'checked=checked'; } ?>> Enabled<br />
	<input type='radio' name='wp_cache_status' value='none' <?php if( $cache_enabled == false ) { echo 'checked=checked'; } ?>> Disabled<br />
	<input type='radio' name='wp_cache_status' value='wpcache' <?php if( $cache_enabled == true && is_dir( $supercachedir . ".disabled" ) ) { echo 'checked=checked'; } ?>> Only using WP Cache<br />
	<p><strong>Super Cache compression:</strong>
	<input type="radio" name="cache_compression" value="1" <?php if( $cache_compression ) { echo "checked=checked"; } ?>> Enabled
	<input type="radio" name="cache_compression" value="0" <?php if( !$cache_compression ) { echo "checked=checked"; } ?>> Disabled
	<p>Compression is disabled by default because some hosts have problems with compressed files.</p>
	<?php
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
	do_cacheaction( 'cache_admin_page' );
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
		wp_super_cache_enable();
	}
}

function wp_cache_disable() {
	global $wp_cache_config_file, $cache_enabled, $supercachedir, $cache_path;

	if (wp_cache_replace_line('^ *\$cache_enabled', '$cache_enabled = false;', $wp_cache_config_file)) {
		$cache_enabled = false;
		wp_super_cache_disable();
	}
}
function wp_super_cache_enable() {
	global $supercachedir;

	if( is_dir( $supercachedir . ".disabled" ) ) {
		rename( $supercachedir . ".disabled", $supercachedir );
	}
}

function wp_super_cache_disable() {
	global $supercachedir;

	if( is_dir( $supercachedir ) ) {
		rename( $supercachedir, $supercachedir . ".disabled" );
	}
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
		if (!@symlink ($wp_cache_file, $wp_cache_link)) {
			echo "<code>advanced-cache.php</code> link does not exist<br />";
			echo "Create it by executing: <br /><code>ln -s $wp_cache_file $wp_cache_link</code><br /> in your server<br />";
			return false;
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
		if( is_dir( $supercachedir ) ) {
			prune_super_cache( $supercachedir, true );
		} elseif( is_dir( $supercachedir . '.disabled' ) ) {
			prune_super_cache( $supercachedir . '.disabled', true );
		}
		prune_super_cache( $cache_path, true );
		$_POST[ 'super_cache_stats' ] = 1; // regenerate super cache stats;
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
		$dir = $cache_path . 'supercache/' . preg_replace('/:.*$/', '',  $_SERVER["HTTP_HOST"]);
		if( is_dir( $dir ) ) {
			prune_super_cache( $dir );
		} elseif( is_dir( $dir . '.disabled' ) ) {
			prune_super_cache( $dir . '.disabled' );
		}
		$_POST[ 'super_cache_stats' ] = 1; // regenerate super cache stats;
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
