<?php
/*
Plugin Name: WP Super Cache
Plugin URI: http://ocaoimh.ie/wp-super-cache/
Description: Very fast caching plugin for WordPress.
Version: 0.9.9.3
Author: Donncha O Caoimh
Author URI: http://ocaoimh.ie/
*/

/*  Copyright 2005-2006  Ricardo Galli Granada  (email : gallir@uib.es)
    Copyright 2007-2009 Donncha O Caoimh (http://ocaoimh.ie/)

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

// Pre-2.6 compatibility
if( !defined('WP_CONTENT_URL') )
	define( 'WP_CONTENT_URL', get_option('siteurl') . '/wp-content');
if( !defined('WP_CONTENT_DIR') )
	define( 'WP_CONTENT_DIR', ABSPATH . 'wp-content' );

$wp_cache_config_file = WP_CONTENT_DIR . '/wp-cache-config.php';

if( !@include($wp_cache_config_file) ) {
	get_wpcachehome();
	$wp_cache_config_file_sample = WPCACHEHOME . 'wp-cache-config-sample.php';
	@include($wp_cache_config_file_sample);
} else {
	get_wpcachehome();
}

$wp_cache_config_file_sample = WPCACHEHOME . 'wp-cache-config-sample.php';
$wp_cache_link = WP_CONTENT_DIR . '/advanced-cache.php';
$wp_cache_file = WPCACHEHOME . 'advanced-cache.php';

if( !defined( 'WP_CACHE' ) || ( defined( 'WP_CACHE' ) && constant( 'WP_CACHE' ) == false ) ) {
	$wp_cache_check_wp_config = true;
}

include(WPCACHEHOME . 'wp-cache-base.php');

function wp_super_cache_text_domain() {
	load_plugin_textdomain( 'wp-super-cache', WPCACHEHOME . 'languages', basename( dirname( __FILE__ ) ) . '/languages' );
}
add_action( 'init', 'wp_super_cache_text_domain' );

// from legolas558 d0t users dot sf dot net at http://www.php.net/is_writable
function is_writeable_ACLSafe($path) {

	// PHP's is_writable does not work with Win32 NTFS
		 
	if ($path{strlen($path)-1}=='/') // recursively return a temporary file path
		return is_writeable_ACLSafe($path.uniqid(mt_rand()).'.tmp');
	else if (is_dir($path))
		return is_writeable_ACLSafe($path.'/'.uniqid(mt_rand()).'.tmp');
	// check tmp file for read/write capabilities
	$rm = file_exists($path);
	$f = @fopen($path, 'a');
	if ($f===false)
		return false;
	fclose($f);
	if (!$rm)
		unlink($path);
	return true;
}

function get_wpcachehome() {
	if( defined( 'WPCACHEHOME' ) == false ) {
		if( is_file( dirname(__FILE__) . '/wp-cache-config-sample.php' ) ) {
			define( 'WPCACHEHOME', trailingslashit( dirname(__FILE__) ) );
		} elseif( is_file( dirname(__FILE__) . '/wp-super-cache/wp-cache-config-sample.php' ) ) {
			define( 'WPCACHEHOME', dirname(__FILE__) . '/wp-super-cache/' );
		} else {
			die( sprintf( __( 'Please create %s /wp-cache-config.php from wp-super-cache/wp-cache-config-sample.php', 'wp-super-cache' ), WP_CONTENT_DIR ) );
		}
	}
}

function wpsupercache_deactivate() {
	global $wp_cache_config_file, $wp_cache_link, $cache_path;
	$files = array( $wp_cache_config_file, $wp_cache_link );
	foreach( $files as $file ) {
		if( file_exists( $file ) )
			unlink( $file );
	}
	if( !function_exists( 'prune_super_cache' ) )
		include_once( 'wp-cache-phase2.php' );
	prune_super_cache ($cache_path, true);
	@unlink( $cache_path . '.htaccess' );
	@unlink( $cache_path . 'meta' );
	@unlink( $cache_path . 'supercache' );
	wp_clear_scheduled_hook( 'wp_cache_check_site_hook' );
}
register_deactivation_hook( __FILE__, 'wpsupercache_deactivate' );

function wpsupercache_activate() {
}
register_activation_hook( __FILE__, 'wpsupercache_activate' );

function wp_cache_add_pages() {
	if( function_exists( 'is_site_admin' ) ) {
		if( is_site_admin() ) {
			add_submenu_page( 'ms-admin.php', 'WP Super Cache', 'WP Super Cache', 'manage_options', 'wpsupercache', 'wp_cache_manager' );
			add_options_page('WP Super Cache', 'WP Super Cache', 'manage_options', 'wpsupercache', 'wp_cache_manager');
		}
	} else {
		add_options_page('WP Super Cache', 'WP Super Cache', 'manage_options', 'wpsupercache', 'wp_cache_manager');
	}
}
add_action('admin_menu', 'wp_cache_add_pages');

function wp_cache_manager() {
	global $wp_cache_config_file, $valid_nonce, $supercachedir, $cache_path, $cache_enabled, $cache_compression, $super_cache_enabled, $wp_cache_hello_world;
	global $wp_cache_clear_on_post_edit, $cache_rebuild_files, $wp_cache_mutex_disabled, $wp_cache_mobile_enabled, $wp_cache_mobile_browsers;
	global $wp_cache_cron_check, $wp_cache_debug, $wp_cache_hide_donation, $wp_cache_not_logged_in, $wp_supercache_cache_list;
	global $wp_super_cache_front_page_check, $wp_cache_object_cache, $_wp_using_ext_object_cache, $wp_cache_refresh_single_only, $wp_cache_mobile_prefixes;

	if( function_exists( 'is_site_admin' ) )
		if( !is_site_admin() )
			return;

	$supercachedir = $cache_path . 'supercache/' . preg_replace('/:.*$/', '',  $_SERVER["HTTP_HOST"]);
	if( get_option( 'gzipcompression' ) == 1 )
		update_option( 'gzipcompression', 0 );
	if( !isset( $cache_rebuild_files ) )
		$cache_rebuild_files = 0;

	$valid_nonce = isset($_REQUEST['_wpnonce']) ? wp_verify_nonce($_REQUEST['_wpnonce'], 'wp-cache') : false;
	/* http://www.netlobo.com/div_hiding.html */
	?>
<script type='text/javascript'>
<!--
function toggleLayer( whichLayer ) {
  var elem, vis;
  if( document.getElementById ) // this is the way the standards work
    elem = document.getElementById( whichLayer );
  else if( document.all ) // this is the way old msie versions work
      elem = document.all[whichLayer];
  else if( document.layers ) // this is the way nn4 works
    elem = document.layers[whichLayer];
  vis = elem.style;
  // if the style.display value is blank we try to figure it out here
  if(vis.display==''&&elem.offsetWidth!=undefined&&elem.offsetHeight!=undefined)
    vis.display = (elem.offsetWidth!=0&&elem.offsetHeight!=0)?'block':'none';
  vis.display = (vis.display==''||vis.display=='block')?'none':'block';
}
// -->
//Clicking header opens fieldset options
jQuery(document).ready(function(){
	jQuery("fieldset h3").css("cursor","pointer").click(function(){
		jQuery(this).parent("fieldset").find("p,form,ul,blockquote").toggle("slow");
	});
});
</script>
<?php
	echo '<div class="wrap">';
	echo "<h2><a href='?page=wpsupercache'>" . __( 'WP Super Cache Manager', 'wp-super-cache' ) . "</a></h2>\n";
	if ( 1 == ini_get( 'safe_mode' ) || "on" == strtolower( ini_get( 'safe_mode' ) ) ) {
		?><h3><?php _e( 'Warning! PHP Safe Mode Enabled!', 'wp-super-cache' ); ?></h3>
		<p><?php _e( 'You may experience problems running this plugin because SAFE MODE is enabled.', 'wp-super-cache' );
		if( !ini_get( 'safe_mode_gid' ) ) {
			echo __( 'Your server is set up to check the owner of PHP scripts before allowing them to read and write files.', 'wp-super-cache' ) . "</p><p>";
			echo sprintf( __( 'You or an administrator may be able to make it work by changing the group owner of the plugin scripts to match that of the web server user. The group owner of the %s/cache/ directory must also be changed. See the <a href="http://php.net/features.safe-mode">safe mode manual page</a> for further details.', 'wp-super-cache' ), WP_CONTENT_DIR ) . "</p>";
		} else {
			echo __( 'You or an administrator must disable this. See the <a href="http://php.net/features.safe-mode">safe mode manual page</a> for further details. This cannot be disabled in a .htaccess file unfortunately. It must be done in the php.ini config file.', 'wp-super-cache' ) . "</p>";
		}
	}

	if ( '' == get_option( 'permalink_structure' ) ) {
		echo "<h3>" . __( 'Permlink Structure Error', 'wp-super-cache' ) . "</h3>";
		echo "<p>" . __( 'A custom url or permalink structure is required for this plugin to work correctly. Please go to the <a href="options-permalink.php">Permalinks Options Page</a> to configure your permalinks.' ) . "</p>";
	}

	if ( isset( $wp_super_cache_front_page_check ) && $wp_super_cache_front_page_check == 1 && !wp_next_scheduled( 'wp_cache_check_site_hook' ) ) {
		wp_schedule_single_event( time() + 360 , 'wp_cache_check_site_hook' );
		if ( isset( $GLOBALS[ 'wp_super_cache_debug' ] ) && $GLOBALS[ 'wp_super_cache_debug' ] ) wp_cache_debug( 'scheduled wp_cache_check_site_hook for 360 seconds time.', 2 );
	}

	if(isset($_REQUEST['wp_restore_config']) && $valid_nonce) {
		unlink($wp_cache_config_file);
		echo '<strong>' . __( 'Configuration file changed, some values might be wrong. Load the page again from the "Settings" menu to reset them.', 'wp-super-cache' ) . '</strong>';
	}

	if ( !wp_cache_check_link() ||
		!wp_cache_verify_config_file() ||
		!wp_cache_verify_cache_dir() ) {
		echo '<p>' . __( "Cannot continue... fix previous problems and retry.", 'wp-super-cache' ) . '</p>';
		echo "</div>\n";
		return;
	}

	if (!wp_cache_check_global_config()) {
		echo "</div>\n";
		return;
	}
	if( $wp_cache_debug || !$wp_cache_cron_check ) {
	if( function_exists( "wp_remote_get" ) == false ) {
		$hostname = str_replace( 'http://', '', str_replace( 'https://', '', get_option( 'siteurl' ) ) );
		if( strpos( $hostname, '/' ) )
			$hostname = substr( $hostname, 0, strpos( $hostname, '/' ) );
		$ip = gethostbyname( $hostname );
		if( substr( $ip, 0, 3 ) == '127' || substr( $ip, 0, 7 ) == '192.168' ) {
			?><h3><?php printf( __( 'Warning! Your hostname "%s" resolves to %s', 'wp-super-cache' ), $hostname, $ip ); ?></h3>
			<div style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'>
			<p><?php printf( __( 'Your server thinks your hostname resolves to %s. Some services such as garbage collection by this plugin, and WordPress scheduled posts may not operate correctly.', 'wp-super-cache' ), $ip ); ?></p>
			<p><?php printf( __( 'Please see entry 16 in the <a href="%s">Troubleshooting section</a> of the readme.txt', 'wp-super-cache' ), 'http://wordpress.org/extend/plugins/wp-super-cache/faq/' ); ?></p>
			</div>
			<?php
		} else {
			wp_cache_replace_line('^ *\$wp_cache_cron_check', "\$wp_cache_cron_check = 1;", $wp_cache_config_file);
		}
	} else {
		$cron_url = get_option( 'siteurl' ) . '/wp-cron.php?check=' . wp_hash('187425');
		$cron = wp_remote_get($cron_url, array('timeout' => 0.01, 'blocking' => true));
		if( is_array( $cron ) ) {
			if( $cron[ 'response' ][ 'code' ] == '404' ) {
				?><h3>Warning! wp-cron.php not found!</h3>
				<div style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'>
				<p><?php _e( 'Unfortunately WordPress cannot find the file wp-cron.php. This script is required for the the correct operation of garbage collection by this plugin, WordPress scheduled posts as well as other critical activities.', 'wp-super-cache' ); ?></p>
				<p><?php printf( __( 'Please see entry 16 in the <a href="%s">Troubleshooting section</a> of the readme.txt', 'wp-super-cache' ), 'http://wordpress.org/extend/plugins/wp-super-cache/faq/' ); ?></p>
				</div>
				<?php
			} else {
				wp_cache_replace_line('^ *\$wp_cache_cron_check', "\$wp_cache_cron_check = 1;", $wp_cache_config_file);
			}
		}
	}
	}

	if ( substr( get_option( 'permalink_structure' ), -1 ) == '/' ) {
		wp_cache_replace_line('^ *\$wp_cache_slash_check', "\$wp_cache_slash_check = 1;", $wp_cache_config_file);
	} else {
		wp_cache_replace_line('^ *\$wp_cache_slash_check', "\$wp_cache_slash_check = 0;", $wp_cache_config_file);
	}

	if ( 1 == ini_get( 'zlib.output_compression' ) || "on" == strtolower( ini_get( 'zlib.output_compression' ) ) ) { 
		?><h4 style='color: #a00'><?php _e( 'Zlib Output Compression Enabled!', 'wp-super-cache' ); ?></h4>
		<p><?php _e( 'PHP is compressing the data sent to the visitors of your site. Disabling this is recommended as the plugin caches the compressed output once instead of compressing the same page over and over again. Also see #21 in the Troubleshooting section. See <a href="http://php.net/manual/en/zlib.configuration.php">this page</a> for instructions on modifying your php.ini.', 'wp-super-cache' ); ?></p><?php
	}

	if( $cache_enabled == true && $super_cache_enabled == true && !got_mod_rewrite() ) {
		?><h4 style='color: #a00'><?php _e( 'Mod rewrite may not be installed!', 'wp-super-cache' ); ?></h4>
		<p><?php _e( 'It appears that mod_rewrite is not installed. Sometimes this check isn&#8217;t 100% reliable, especially if you are not using Apache. Please verify that the mod_rewrite module is loaded. It is required for serving Super Cache static files. You will still be able to use half-on mode.', 'wp-super-cache' ); ?></p><?php
	}

	if( !is_writeable_ACLSafe($wp_cache_config_file) ) {
		define( "SUBMITDISABLED", 'disabled style="color: #aaa" ' );
		?><h4 style='text-align:center; color: #a00'><?php _e( 'Read Only Mode. Configuration cannot be changed.', 'wp-super-cache' ); ?> <a href="javascript:toggleLayer('readonlywarning');" title="<?php _e( 'Why your configuration may not be changed', 'wp-super-cache' ); ?>"><?php _e( 'Why', 'wp-super-cache' ); ?></a></h4>
		<div id='readonlywarning' style='border: 1px solid #aaa; margin: 2px; padding: 2px; display: none;'>
		<p><?php printf( __( 'The WP Super Cache configuration file is <code>%s/wp-cache-config.php</code> and cannot be modified. That file must be writeable by the webserver to make any changes.', 'wp-super-cache' ), WP_CONTENT_DIR ); ?>
		<?php _e( 'A simple way of doing that is by changing the permissions temporarily using the CHMOD command or through your ftp client. Make sure it&#8217;s globally writeable and it should be fine.', 'wp-super-cache' ); ?></p>
		<?php _e( 'Writeable:', 'wp-super-cache' ); ?> <code>chmod 666 <?php echo WP_CONTENT_DIR; ?>/wp-cache-config.php</code>
		<?php _e( 'Readonly:', 'wp-super-cache' ); ?> <code>chmod 644 <?php echo WP_CONTENT_DIR; ?>/wp-cache-config.php</code></p>
		</div><?php
	} else {
		define( "SUBMITDISABLED", ' ' );
	}

	// Server could be running as the owner of the wp-content directory.  Therefore, if it's
	// writable, issue a warning only if the permissions aren't 755.
	if( is_writeable_ACLSafe( WP_CONTENT_DIR . '/' ) ) {
		$wp_content_stat = stat(WP_CONTENT_DIR . '/');
		$wp_content_mode = ($wp_content_stat['mode'] & 0777);
		if( $wp_content_mode != 0755 ) {
			?><h4 style='text-align:center; color: #a00'><?php printf( __( 'Warning! %s is writeable!', 'wp-super-cache' ), WP_CONTENT_DIR ); ?></h4>
			<p><?php printf( __( 'You should change the permissions on %s and make it more restrictive. Use your ftp client, or the following command to fix things:', 'wp-super-cache' ), WP_CONTENT_DIR ); ?><code>chmod 755 <?php echo WP_CONTENT_DIR; ?>/</code></p><?php
		}
	}

	// used by mod_rewrite rules and config file
	if ( function_exists( "cfmobi_default_browsers" ) ) {
		$wp_cache_mobile_browsers = cfmobi_default_browsers( "mobile" );
		$wp_cache_mobile_browsers = array_merge( $wp_cache_mobile_browsers, cfmobi_default_browsers( "touch" ) );
	} else {
		$wp_cache_mobile_browsers = array( '2.0 MMP', '240x320', '400X240', 'AvantGo', 'BlackBerry', 'Blazer', 'Cellphone', 'Danger', 'DoCoMo', 'Elaine/3.0', 'EudoraWeb', 'Googlebot-Mobile', 'hiptop', 'IEMobile', 'KYOCERA/WX310K', 'LG/U990', 'MIDP-2.', 'MMEF20', 'MOT-V', 'NetFront', 'Newt', 'Nintendo Wii', 'Nitro', 'Nokia', 'Opera Mini', 'Palm', 'PlayStation Portable', 'portalmmm', 'Proxinet', 'ProxiNet', 'SHARP-TQ-GX10', 'SHG-i900', 'Small', 'SonyEricsson', 'Symbian OS', 'SymbianOS', 'TS21i-10', 'UP.Browser', 'UP.Link', 'webOS', 'Windows CE', 'WinWAP', 'YahooSeeker/M1A1-R2D2', 'iPhone', 'iPod', 'Android', 'BlackBerry9530', 'LG-TU915 Obigo', 'LGE VX', 'webOS', 'Nokia5800' );
	}
	$wp_cache_mobile_prefixes = array( 'w3c ', 'w3c-', 'acs-', 'alav', 'alca', 'amoi', 'audi', 'avan', 'benq', 'bird', 'blac', 'blaz', 'brew', 'cell', 'cldc', 'cmd-', 'dang', 'doco', 'eric', 'hipt', 'htc_', 'inno', 'ipaq', 'ipod', 'jigs', 'kddi', 'keji', 'leno', 'lg-c', 'lg-d', 'lg-g', 'lge-', 'lg/u', 'maui', 'maxo', 'midp', 'mits', 'mmef', 'mobi', 'mot-', 'moto', 'mwbp', 'nec-', 'newt', 'noki', 'palm', 'pana', 'pant', 'phil', 'play', 'port', 'prox', 'qwap', 'sage', 'sams', 'sany', 'sch-', 'sec-', 'send', 'seri', 'sgh-', 'shar', 'sie-', 'siem', 'smal', 'smar', 'sony', 'sph-', 'symb', 't-mo', 'teli', 'tim-', 'tosh', 'tsm-', 'upg1', 'upsi', 'vk-v', 'voda', 'wap-', 'wapa', 'wapi', 'wapp', 'wapr', 'webc', 'winw', 'winw', 'xda ', 'xda-' ); // from http://svn.wp-plugins.org/wordpress-mobile-pack/trunk/plugins/wpmp_switcher/lite_detection.php
	$wp_cache_mobile_browsers = apply_filters( 'cached_mobile_browsers', $wp_cache_mobile_browsers ); // Allow mobile plugins access to modify the mobile UA list
	$wp_cache_mobile_prefixes = apply_filters( 'cached_mobile_prefixes', $wp_cache_mobile_prefixes ); // Allow mobile plugins access to modify the mobile UA prefix list
	$mobile_groups = apply_filters( 'cached_mobile_groups', array() ); // Group mobile user agents by capabilities. Lump them all together by default
	// mobile_groups = array( 'apple' => array( 'ipod', 'iphone' ), 'nokia' => array( 'nokia5800', 'symbianos' ) );

	if ( $valid_nonce ) {
		if( isset( $_POST[ 'wp_cache_status' ] ) ) {
			if( isset( $_POST[ 'wp_cache_mobile_enabled' ] ) ) {
				$wp_cache_mobile_enabled = 1;
			} else {
				$wp_cache_mobile_enabled = 0;
			}
			if( $wp_cache_mobile_enabled == 1 ) {
				update_cached_mobile_ua_list( $wp_cache_mobile_browsers, $wp_cache_mobile_prefixes, $mobile_groups );
			}
			wp_cache_replace_line('^ *\$wp_cache_mobile_enabled', "\$wp_cache_mobile_enabled = " . $wp_cache_mobile_enabled . ";", $wp_cache_config_file);

			$wp_supercache_cache_list = $_POST[ 'wp_supercache_cache_list' ] == 1 ? 1 : 0;
			wp_cache_replace_line('^ *\$wp_supercache_cache_list', "\$wp_supercache_cache_list = " . $wp_supercache_cache_list . ";", $wp_cache_config_file);

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
			if( isset( $_POST[ 'wp_cache_hello_world' ] ) ) {
				$wp_cache_hello_world = 1;
			} else {
				$wp_cache_hello_world = 0;
			}
			wp_cache_replace_line('^ *\$wp_cache_hello_world', '$wp_cache_hello_world = ' . (int)$wp_cache_hello_world . ";", $wp_cache_config_file);
			if( isset( $_POST[ 'wp_cache_clear_on_post_edit' ] ) ) {
				$wp_cache_clear_on_post_edit = 1;
			} else {
				$wp_cache_clear_on_post_edit = 0;
			}
			wp_cache_replace_line('^ *\$wp_cache_clear_on_post_edit', "\$wp_cache_clear_on_post_edit = " . $wp_cache_clear_on_post_edit . ";", $wp_cache_config_file);
			if( isset( $_POST[ 'cache_rebuild_files' ] ) ) {
				$cache_rebuild_files = 1;
			} else {
				$cache_rebuild_files = 0;
			}
			wp_cache_replace_line('^ *\$cache_rebuild_files', "\$cache_rebuild_files = " . $cache_rebuild_files . ";", $wp_cache_config_file);
			if( isset( $_POST[ 'wp_cache_mutex_disabled' ] ) ) {
				$wp_cache_mutex_disabled = 0;
			} else {
				$wp_cache_mutex_disabled = 1;
			}
			if( defined( 'WPSC_DISABLE_LOCKING' ) ) {
				$wp_cache_mutex_disabled = 1;
			}
			wp_cache_replace_line('^ *\$wp_cache_mutex_disabled', "\$wp_cache_mutex_disabled = " . $wp_cache_mutex_disabled . ";", $wp_cache_config_file);
			if( isset( $_POST[ 'wp_cache_not_logged_in' ] ) ) {
				if( $wp_cache_not_logged_in == 0 && function_exists( 'prune_super_cache' ) )
					prune_super_cache ($cache_path, true);
				$wp_cache_not_logged_in = 1;
			} else {
				$wp_cache_not_logged_in = 0;
			}
			wp_cache_replace_line('^ *\$wp_cache_not_logged_in', "\$wp_cache_not_logged_in = " . $wp_cache_not_logged_in . ";", $wp_cache_config_file);
			if( $_wp_using_ext_object_cache && isset( $_POST[ 'wp_cache_object_cache' ] ) ) {
				if( $wp_cache_object_cache == 0 && function_exists( 'prune_super_cache' ) )
					prune_super_cache ($cache_path, true);
				$wp_cache_object_cache = 1;
			} else {
				$wp_cache_object_cache = 0;
			}
			wp_cache_replace_line('^ *\$wp_cache_object_cache', "\$wp_cache_object_cache = " . $wp_cache_object_cache . ";", $wp_cache_config_file);
			if( isset( $_POST[ 'wp_cache_refresh_single_only' ] ) ) {
				$wp_cache_refresh_single_only = 1;
			} else {
				$wp_cache_refresh_single_only = 0;
			}
			wp_cache_replace_line('^ *\$wp_cache_refresh_single_only', "\$wp_cache_refresh_single_only = '" . $wp_cache_refresh_single_only . "';", $wp_cache_config_file);
		}
		if( defined( 'WPSC_DISABLE_COMPRESSION' ) ) {
			$cache_compression_changed = false;
			$cache_compression = 0;
			wp_cache_replace_line('^ *\$cache_compression', "\$cache_compression = " . $cache_compression . ";", $wp_cache_config_file);
		} elseif( isset( $_POST[ 'cache_compression' ] ) && $_POST[ 'cache_compression' ] != $cache_compression ) {
			if ( $_POST[ 'cache_compression' ] && 1 == ini_get( 'zlib.output_compression' ) || "on" == strtolower( ini_get( 'zlib.output_compression' ) ) ) { 
				_e( "<strong>Warning!</strong> You attempted to enable compression but <code>zlib.output_compression</code> is enabled. See #21 in the Troubleshooting section of the readme file.", 'wp-super-cache' );
			} else {
				$cache_compression = intval( $_POST[ 'cache_compression' ] );
				$cache_compression_changed = true;
				wp_cache_replace_line('^ *\$cache_compression', "\$cache_compression = " . $cache_compression . ";", $wp_cache_config_file);
				if( function_exists( 'prune_super_cache' ) )
					prune_super_cache ($cache_path, true);
				delete_option( 'super_cache_meta' );
			}
		}
		if( isset( $_POST[ 'wp_cache_hide_donation' ] ) && $_POST[ 'wp_cache_hide_donation' ] != $wp_cache_hide_donation ) {
			$wp_cache_hide_donation = intval( $_POST[ 'wp_cache_hide_donation' ] );
			wp_cache_replace_line('^ *\$wp_cache_hide_donation', "\$wp_cache_hide_donation = " . $wp_cache_hide_donation . ";", $wp_cache_config_file);
		}
	}

	echo '<a name="top"></a>';
	?>
	<table><td><fieldset class="options" id="show-this-fieldset"> 
	<h3><?php _e( 'WP Super Cache Status', 'wp-super-cache' ); ?></h3><?php
	echo '<form name="wp_manager" action="#top" method="post">';
	?>
	<label><input type='radio' name='wp_cache_status' value='all' <?php if( $cache_enabled == true && $super_cache_enabled == true ) { echo 'checked=checked'; } ?>> <strong><?php _e( 'ON', 'wp-super-cache' ); ?></strong> <span class="setting-description"><?php _e( 'WP Cache and Super Cache enabled', 'wp-super-cache' ); ?></span></label><br />
	<label><input type='radio' name='wp_cache_status' value='wpcache' <?php if( $cache_enabled == true && $super_cache_enabled == false ) { echo 'checked=checked'; } ?>> <strong><?php _e( 'HALF ON', 'wp-super-cache' ); ?></strong> <span class="setting-description"><?php _e( 'Super Cache Disabled, only legacy WP-Cache caching.', 'wp-super-cache' ); ?></span></label><br />
	<label><input type='radio' name='wp_cache_status' value='none' <?php if( $cache_enabled == false ) { echo 'checked=checked'; } ?>> <strong><?php _e( 'OFF', 'wp-super-cache' ); ?></strong> <span class="setting-description"><?php _e( 'WP Cache and Super Cache disabled', 'wp-super-cache' ); ?></span></label><br />
	<p><label><input type='checkbox' name='wp_cache_not_logged_in' <?php if( $wp_cache_not_logged_in ) echo "checked"; ?> value='1'> <?php _e( 'Don&#8217;t cache pages for known users. (Logged in users and those that comment)', 'wp-super-cache' ); ?></label></p>
	<p><label><input type='checkbox' name='wp_cache_hello_world' <?php if( $wp_cache_hello_world ) echo "checked"; ?> value='1'> <?php _e( 'Proudly tell the world your server is Digg proof! (places a message in your blog&#8217;s footer)', 'wp-super-cache' ); ?></label></p>
	<p><label><input type='checkbox' name='wp_cache_clear_on_post_edit' <?php if( $wp_cache_clear_on_post_edit ) echo "checked"; ?> value='1'> <?php _e( 'Clear all cache files when a post or page is published. (This may significantly slow down saving of posts.)', 'wp-super-cache' ); ?></label></p>
	<p><label><input type='checkbox' name='cache_rebuild_files' <?php if( $cache_rebuild_files ) echo "checked"; ?> value='1'> <?php _e( 'Cache rebuild. Serve a supercache file to anonymous users while a new file is being generated. Recommended for <em>very</em> busy websites with lots of comments. Makes "directly cached pages" and "Lockdown mode" obsolete.', 'wp-super-cache' ); ?></label></p>
	<?php if( false == defined( 'WPSC_DISABLE_LOCKING' ) ) { ?>
		<p><label><input type='checkbox' name='wp_cache_mutex_disabled' <?php if( !$wp_cache_mutex_disabled ) echo "checked"; ?> value='0'> <?php _e( 'Coarse file locking. You probably don&#8217;t need this but it may help if your server is underpowered. Warning! <em>May cause your server to lock up in very rare cases!</em>', 'wp-super-cache' ); ?></label></p>
	<?php } ?>
	<p><label><input type='checkbox' name='wp_supercache_cache_list' <?php if( $wp_supercache_cache_list ) echo "checked"; ?> value='1'> <?php _e( 'List the newest cached pages (may be expensive to run on busy sites, use with caution.)', 'wp-super-cache' ); ?></label>
	<p><label><input type='checkbox' name='wp_cache_mobile_enabled' <?php if( $wp_cache_mobile_enabled ) echo "checked"; ?> value='1'> <?php printf( __( 'Mobile device support.', 'wp-super-cache' ), 'http://wordpress.org/extend/plugins/wordpress-mobile-edition/' ); ?></label>
	<?php
	$home_path = trailingslashit( get_home_path() );
	$scrules = implode( "\n", extract_from_markers( $home_path.'.htaccess', 'WPSuperCache' ) );
	if ( !$wp_cache_mobile_enabled && strpos( $scrules, addcslashes( implode( '|', $wp_cache_mobile_browsers ), ' ' ) ) ) {
		echo "<blockquote style='background-color:#feefb3; padding: 5px; margin: 5px;'><h4>" . __( 'Mobile rewrite rules detected', 'wp-super-cache' ) . "</h4>";
		echo "<p>" . __( 'For best performance you should enable "Mobile device support" or delete the mobile rewrite rules in your .htaccess. Look for the 2 lines with the text "2.0\ MMP|240x320" and delete those.', 'wp-super-cache' ) . "</p><p>" . __( 'This will have no affect on ordinary users but mobile users will see uncached pages.', 'wp-super-cache' ) . "</p></blockquote>";
	} elseif ( $wp_cache_mobile_enabled && $scrules != '' && ( 
		false === strpos( $scrules, addcslashes( implode( '|', $wp_cache_mobile_prefixes ), ' ' ) ) ||
		false === strpos( $scrules, addcslashes( implode( '|', $wp_cache_mobile_browsers ), ' ' ) ) ) 
		) {
	?>
	<blockquote style='background-color:#fefeb3; padding: 5px; margin: 5px;'><h4><?php _e( 'Rewrite rules must be updated', 'wp-super-cache' ); ?></h4>
	<p><?php _e( 'The rewrite rules required by this plugin have changed or are missing. ', 'wp-super-cache' ); ?>
	<?php _e( 'Mobile support requires extra rules in your .htaccess file, or you can set the plugin to half-on mode. Here are your options (in order of difficulty):', 'wp-super-cache' ); ?>
	<ol><li> <?php _e( 'Set the plugin to half on mode and enable mobile support.', 'wp-super-cache' ); ?></li>
	<li> <?php _e( 'Scroll down this page and click the <strong>Update Mod_Rewrite Rules</strong> button.', 'wp-super-cache' ); ?></li>
	<li> <?php printf( __( 'Delete the plugin mod_rewrite rules in %s.htaccess enclosed by <code># BEGIN WPSuperCache</code> and <code># END WPSuperCache</code> and let the plugin regenerate them by reloading this page.', 'wp-super-cache' ), $home_path ); ?></li>
	<li> <?php printf( __( 'Add the rules yourself. Edit %s.htaccess and find the block of code enclosed by the lines <code># BEGIN WPSuperCache</code> and <code># END WPSuperCache</code>. There are two sections that look very similar. Just below the line <code>%%{HTTP:Cookie} !^.*(comment_author_|wordpress_logged_in|wp-postpass_).*$</code> add these lines: (do it twice, once for each section)', 'wp-super-cache' ), $home_path ); ?></p>
	<div style='padding: 2px; margin: 2px; border: 1px solid #333; width:400px; overflow: scroll'><pre>RewriteCond %{HTTP_user_agent} !^.*(<?php echo addcslashes( implode( '|', $wp_cache_mobile_browsers ), ' ' ); ?>).*
RewriteCond %{HTTP_user_agent} !^(<?php echo addcslashes( implode( '|', $wp_cache_mobile_prefixes ), ' ' ); ?>).*</pre></div></li></ol></blockquote>
	<?php } ?>
	<?php if ( $_wp_using_ext_object_cache ) { 
		?><p><label><input type='checkbox' name='wp_cache_object_cache' <?php if( $wp_cache_object_cache ) echo "checked"; ?> value='1'> <?php echo __( 'Use object cache to store cached files.', 'wp-super-cache' ) . ' ' . __( '(Experimental)', 'wp-super-cache' ); ?></label></p><?php 
	}
	?><p><label><input type='checkbox' name='wp_cache_refresh_single_only' <?php if( $wp_cache_refresh_single_only ) echo "checked"; ?> value='1'> <?php echo __( 'Only refresh current page when comments made.', 'wp-super-cache' ); ?></label></p> 
	<p><strong><?php _e( 'Note:', 'wp-super-cache' ); ?></strong> <?php printf( __( 'If uninstalling this plugin, make sure the directory <em>%s</em> is writeable by the webserver so the files <em>advanced-cache.php</em> and <em>cache-config.php</em> can be deleted automatically. (Making sure those files are writeable too is probably a good idea!)', 'wp-super-cache' ), WP_CONTENT_DIR ); ?></p>
	<p><?php printf( __( 'Please see the <a href="%1$s/wp-super-cache/readme.txt">readme.txt</a> for instructions on uninstalling this script. Look for the heading, "How to uninstall WP Super Cache".', 'wp-super-cache' ), WP_PLUGIN_URL ); ?></p><?php
	echo "<p><em>" . sprintf( __( 'Need help? Check the <a href="%1$s">Super Cache readme file</a>. It includes installation documentation, a FAQ and Troubleshooting tips. The <a href="%2$s">support forum</a> is also available. Your question may already have been answered.', 'wp-super-cache' ), 'http://wordpress.org/extend/plugins/wp-super-cache/', 'http://wordpress.org/tags/wp-super-cache?forum_id=10' ) . "</em></p>";

	echo "<div class='submit'><input type='submit' " . SUBMITDISABLED . " value='" . __( 'Update Status', 'wp-super-cache' ) . " &raquo;' /></div>";
	wp_nonce_field('wp-cache');
	?>
	</form>
	<?php
	if ( $cache_enabled ) {
		echo '<a name="test"></a>';
		echo "<h3>" . __( 'Cache Tester', 'wp-super-cache' ) . "</h3>";
		echo '<p>' . __( 'Test your cached website by clicking the test button below.', 'wp-super-cache' ) . '</p>';
		if ( $_POST[ 'action' ] == 'test' && $valid_nonce ) {
			// Prime the cache
			echo "<p>";
			printf(  __( 'Fetching %s to prime cache: ', 'wp-super-cache' ), site_url() );
			$page = wp_remote_get( site_url(), array('timeout' => 60, 'blocking' => true ) );
			echo '<strong>' . __( 'OK', 'wp-super-cache' ) . '</strong>';
			echo "</p>";
			sleep( 1 );
			// Get the first copy
			echo "<p>";
			printf(  __( 'Fetching first copy of %s: ', 'wp-super-cache' ), site_url() );
			$page = wp_remote_get( site_url(), array('timeout' => 60, 'blocking' => true ) );
			echo '<strong>' . __( 'OK', 'wp-super-cache' ) . '</strong>';
			echo "</p>";
			sleep( 1 );
			// Get the second copy
			echo "<p>";
			printf(  __( 'Fetching second copy of %s: ', 'wp-super-cache' ), site_url() );
			$page2 = wp_remote_get( site_url(), array('timeout' => 60, 'blocking' => true ) );
			echo '<strong>' . __( 'OK', 'wp-super-cache' ) . '</strong>';
			echo "</p>";

			if ( preg_match( '/(Cached page generated by WP-Super-Cache on) ([0-9]*-[0-9]*-[0-9]* [0-9]*:[0-9]*:[0-9]*)/', $page[ 'body' ], $matches1 ) &&
			preg_match( '/(Cached page generated by WP-Super-Cache on) ([0-9]*-[0-9]*-[0-9]* [0-9]*:[0-9]*:[0-9]*)/', $page2[ 'body' ], $matches2 ) && $matches1[2] == $matches2[2] ) {
				echo '<p>' . sprintf( __( 'Page 1: %s', 'wp-super-cache' ), $matches1[ 2 ] ) . '</p>';
				echo '<p>' . sprintf( __( 'Page 2: %s', 'wp-super-cache' ), $matches2[ 2 ] ) . '</p>';
				echo '<p><strong>' . __( 'The timestamps on both pages match!', 'wp-super-cache' ) . '</strong></p>';
			} else {
				echo '<p><strong>' . __( 'The pages do not match! Timestamps differ or were not found!', 'wp-super-cache' ) . '</strong></p>';
			}
		}
		echo '<form name="cache_tester" action="#test" method="post">';
		echo '<input type="hidden" name="action" value="test" />';
		echo '<div class="submit"><input type="submit" name="test" value="' . __( 'Test Cache', 'wp-super-cache' ) . '" /></div>';
		wp_nonce_field('wp-cache');
		echo '</form>';

		echo '<a name="preload"></a>';
		echo "<h3>" . __( 'Preload Cache', 'wp-super-cache' ) . "</h3>";
		if ( $super_cache_enabled == true && false == defined( 'DISABLESUPERCACHEPRELOADING' ) ) {
			global $wp_cache_preload_interval, $wp_cache_preload_on, $wp_cache_preload_email_me, $wp_cache_preload_email_volume, $wp_cache_preload_posts, $wpdb;
			$count = $wpdb->get_var( "SELECT count(*) FROM {$wpdb->posts} WHERE post_status = 'publish'" );
			if ( $count > 1000 ) {
				$min_refresh_interval = 720;
			} else {
				$min_refresh_interval = 30;
			}
			if ( $_POST[ 'action' ] == 'preload' && $valid_nonce ) {
				if ( $_POST[ 'posts_to_cache' ] == 'all' ) {
					$wp_cache_preload_posts = 'all';
				} else {
					$wp_cache_preload_posts = (int)$_POST[ 'posts_to_cache' ];
				}
				wp_cache_replace_line('^ *\$wp_cache_preload_posts', "\$wp_cache_preload_posts = '$wp_cache_preload_posts';", $wp_cache_config_file);

				if ( isset( $_POST[ 'preload' ] ) && $_POST[ 'preload' ] == __( 'Cancel Cache Preload', 'wp-super-cache' ) ) {
					$next_preload = wp_next_scheduled( 'wp_cache_preload_hook' );
					if ( $next_preload ) {
						update_option( 'preload_cache_counter', 0 );
						wp_unschedule_event( $next_preload, 'wp_cache_preload_hook' );
					}
					echo "<p><strong>" . __( 'Scheduled preloading of cache cancelled. If a job is currently running it will not shutdown until the current 100 pages are complete.', 'wp-super-cache' ) . "</strong></p>";
				} elseif ( isset( $_POST[ 'custom_preload_interval' ] ) && ( $_POST[ 'custom_preload_interval' ] == 0 || $_POST[ 'custom_preload_interval' ] >= $min_refresh_interval ) ) {
					// if preload interval changes than unschedule any preload jobs and schedule any new one.
					$_POST[ 'custom_preload_interval' ] = (int)$_POST[ 'custom_preload_interval' ];
					if ( $wp_cache_preload_interval != $_POST[ 'custom_preload_interval' ] ) {
						$next_preload = wp_next_scheduled( 'wp_cache_full_preload_hook' );
						if ( $next_preload ) {
							update_option( 'preload_cache_counter', 0 );
							add_option( 'preload_cache_stop', 1 );
							wp_unschedule_event( $next_preload, 'wp_cache_full_preload_hook' );
							if ( $wp_cache_preload_interval == 0 ) {
								echo "<p><strong>" . __( 'Scheduled preloading of cache cancelled.', 'wp-super-cache' ) . "</strong></p>";
							} 
						}
						if ( $_POST[ 'custom_preload_interval' ] != 0 )
							wp_schedule_single_event( time() + ( $_POST[ 'custom_preload_interval' ] * 60 ), 'wp_cache_full_preload_hook' );
					}
					$wp_cache_preload_interval = (int)$_POST[ 'custom_preload_interval' ];
					wp_cache_replace_line('^ *\$wp_cache_preload_interval', "\$wp_cache_preload_interval = $wp_cache_preload_interval;", $wp_cache_config_file);
					if ( isset( $_POST[ 'preload_email_me' ] ) ) {
						$wp_cache_preload_email_me = 1;
					} else {
						$wp_cache_preload_email_me = 0;
					}
					wp_cache_replace_line('^ *\$wp_cache_preload_email_me', "\$wp_cache_preload_email_me = $wp_cache_preload_email_me;", $wp_cache_config_file);
					if ( isset( $_POST[ 'wp_cache_preload_email_volume' ] ) && in_array( $_POST[ 'wp_cache_preload_email_volume' ], array( 'less', 'medium', 'many' ) ) ) {
						$wp_cache_preload_email_volume = $_POST[ 'wp_cache_preload_email_volume' ];
					} else {
						$wp_cache_preload_email_volume = 'medium';
					}
					wp_cache_replace_line('^ *\$wp_cache_preload_email_volume', "\$wp_cache_preload_email_volume = '$wp_cache_preload_email_volume';", $wp_cache_config_file);
					if ( isset( $_POST[ 'preload_on' ] ) ) {
						$wp_cache_preload_on = 1;
					} else {
						$wp_cache_preload_on = 0;
					}
					wp_cache_replace_line('^ *\$wp_cache_preload_on', "\$wp_cache_preload_on = $wp_cache_preload_on;", $wp_cache_config_file);
					if ( isset( $_POST[ 'preload' ] ) && $_POST[ 'preload' ] == __( 'Preload Cache Now', 'wp-super-cache' ) ) {
						update_option( 'preload_cache_counter', 0 );
						wp_schedule_single_event( time() + 10, 'wp_cache_preload_hook' );
						echo "<p><strong>" . __( 'Scheduled preloading of cache in 10 seconds.' ) . "</strong></p>";
					} elseif ( (int)$_POST[ 'custom_preload_interval' ] ) {
						update_option( 'preload_cache_counter', 0 );
						wp_schedule_single_event( time() + ( (int)$_POST[ 'custom_preload_interval' ] * 60 ), 'wp_cache_full_preload_hook' );
						echo "<p><strong>" . sprintf( __( 'Scheduled preloading of cache in %d minutes', 'wp-super-cache' ), (int)$_POST[ 'custom_preload_interval' ] ) . "</strong></p>";
					}
				}
			}
			echo '<p>' . __( 'This will cache every published post and page on your site. It will create supercache static files so unknown visitors (including bots) will hit a cached page. This will probably help your Google ranking as they are using speed as a metric when judging websites now.', 'wp-super-cache' ) . '</p>';
			echo '<p>' . __( 'Preloading creates lots of files however. Caching is done from the newest post to the oldest so please consider only caching the newest if you have lots (10,000+) of posts. This is especially important on shared hosting.', 'wp-super-cache' ) . '</p>';
			echo '<p>' . __( 'In &#8217;Preload Mode&#8217; regular garbage collection will only clean out old half-on files for known users, not the preloaded supercache files. This is a recommended setting when the cache is preloaded.', 'wp-super-cache' ) . '</p>';
			echo '<form name="cache_filler" action="#preload" method="POST">';
			echo '<input type="hidden" name="action" value="preload" />';
			echo '<input type="hidden" name="page" value="wpsupercache" />';
			echo '<p>' . sprintf( __( 'Refresh preloaded cache files every %s minutes. (0 to disable, minimum %d minutes.)', 'wp-super-cache' ), "<input type='text' size=4 name='custom_preload_interval' value='" . (int)$wp_cache_preload_interval . "' />", $min_refresh_interval ) . '</p>';
			if ( $count > 1000 ) {
				$step = (int)( $count / 5 );

				$select = "<select name='posts_to_cache' size=1>";
				$select .= "<option value='all' ";
				if ( !isset( $wp_cache_preload_posts ) || $wp_cache_preload_posts == 'all' ) {
					$checked = 'selectect=1 ';
					$best = 'all';
				} else {
					$checked = ' ';
					$best = $wp_cache_preload_posts;
				}
				$select .= "{$checked}>" . __( 'all', 'wp-super-cache' ) . "</option>";

				for( $c = $step; $c < $count; $c += $step ) {
					$checked = ' ';
					if ( $best == $c )
						$checked = 'selected=1 ';
					$select .= "<option value='$c'{$checked}>$c</option>";
				}
				$checked = ' ';
				if ( $best == $count )
					$checked = 'selected=1 ';
				$select .= "<option value='$count'{$checked}>$count</option>";
				$select .= "</select>";
				echo '<p>' . sprintf( __( 'Preload %s posts.', 'wp-super-cache' ), $select ) . '</p>';
			} else {
				echo '<input type="hidden" name="posts_to_cache" value="' . $count . '" />';
			}

			echo '<input type="checkbox" name="preload_on" value="1" ';
			echo $wp_cache_preload_on == 1 ? 'checked=1' : '';
			echo ' /> ' . __( 'Preload mode (garbage collection only on half-on cache files. Recommended.)', 'wp-super-cache' ) . '<br />';
			echo '<input type="checkbox" name="preload_email_me" value="1" ';
			echo $wp_cache_preload_email_me == 1 ? 'checked=1' : '';
			echo ' /> ' . __( 'Send me status emails when files are refreshed.', 'wp-super-cache' ) . '<br />';
			if ( !isset( $wp_cache_preload_email_volume ) )
				$wp_cache_preload_email_volume = 'many';
			echo '&nbsp;&nbsp;&nbsp;&nbsp;<input name="wp_cache_preload_email_volume" type="radio" value="many" class="tog" ';
			checked( 'many', $wp_cache_preload_email_volume );
			echo '/> ' . __( 'Many emails, 2 emails per 100 posts.' ) . '<br >';
			echo '&nbsp;&nbsp;&nbsp;&nbsp;<input name="wp_cache_preload_email_volume" type="radio" value="medium" class="tog" ';
			checked( 'medium', $wp_cache_preload_email_volume );
			echo '/> ' . __( 'Medium, 1 email per 100 posts.' ) . '<br >';
			echo '&nbsp;&nbsp;&nbsp;&nbsp;<input name="wp_cache_preload_email_volume" type="radio" value="less" class="tog" ';
			checked( 'less', $wp_cache_preload_email_volume );
			echo '/> ' . __( 'Less emails, 1 at the start and 1 at the end of preloading all posts.', 'wp-super-cache' ) . '<br >';

			$currently_preloading = false;

			next_preload_message( 'wp_cache_preload_hook', 'Refresh of cache in %d hours %d minutes and %d seconds.', 60 );
			next_preload_message( 'wp_cache_full_preload_hook', 'Full refresh of cache in %d hours %d minutes and %d seconds.' );

			if ( $preload_counter = get_option( 'preload_cache_counter' ) ) {
				echo '<p><strong>' . sprintf( __( 'Currently caching from post %d to %d.', 'wp-super-cache' ), $preload_counter, ( $preload_counter + 100 ) ) . '</strong></p>';
				$currently_preloading = true;
			}
			echo '<div class="submit"><input type="submit" name="preload" value="' . __( 'Update Settings', 'wp-super-cache' ) . '" />&nbsp;<input type="submit" name="preload" value="' . __( 'Preload Cache Now', 'wp-super-cache' ) . '" />';
			if ( $currently_preloading ) {
				echo '&nbsp;<input type="submit" name="preload" value="' . __( 'Cancel Cache Preload', 'wp-super-cache' ) . '" />';
			}
			echo '</div>';
			wp_nonce_field('wp-cache');
			echo '</form>';
		} else {
			echo '<p>' . __( 'Preloading of cache disabled. Please enable supercaching or talk to your host administrator.', 'wp-super-cache' ) . '</p>';
		}
	}

	if( $super_cache_enabled && function_exists( 'apache_get_modules' ) ) {
		$mods = apache_get_modules();
		$required_modules = array( 'mod_mime' => __( 'Required to serve compressed supercache files properly.', 'wp-super-cache' ), 'mod_headers' => __( 'Required to set caching information on supercache pages. IE7 users will see old pages without this module.', 'wp-super-cache' ), 'mod_expires' => __( 'Set the expiry date on supercached pages. Visitors may not see new pages when they refresh or leave comments without this module.', 'wp-super-cache' ) );
		foreach( $required_modules as $req => $desc ) {
			if( !in_array( $req, $mods ) ) {
				$missing_mods[ $req ] = $desc;
			}
		}
		if( isset( $missing_mods) && is_array( $missing_mods ) ) {
			echo "<h3>" . __( 'Missing Apache Modules', 'wp-super-cache' ) . "</h3>";
			echo "<p>" . __( 'The following Apache modules are missing. The plugin will work in half-on mode without them. In full Supercache mode, your visitors may see corrupted pages or out of date content however.', 'wp-super-cache' ) . "</p>";
			echo "<ul>";
			foreach( $missing_mods as $req => $desc ) {
				echo "<li> $req - $desc</li>";
			}
			echo "</ul>";
		}
	}
	?>
	</fieldset>
	</td><td valign='top'>
	<div style='background: #ffc; border: 1px solid #333; margin: 2px; padding: 5px'>
	<h3 align='center'><?php _e( 'Make WordPress Faster', 'wp-super-cache' ); ?></h3>
	<?php if( $wp_cache_hide_donation != 1 ) { ?>
	<p><?php printf( __( '%1$s really makes your blog go faster. Make it go faster<sup>*</sup> by buying me an <a href="%2$s">Amazon gift card</a>! Make it out to "%3$s" for whatever amount you want. Every penny helps!', 'wp-super-cache' ), '<a href="http://ocaoimh.ie/wp-super-cache/?r=wpsc">WP Super Cache</a>', 'http://ocaoimh.ie/agc', 'donncha@ocaoimh.ie' ) ?>;</p>
	<p><?php printf( __( 'If Amazon isn&#8217;t your thing, there&#8217;s also PayPal. Click the "Donate" button below or take a quick peek at my <a href="%s">wishlist</a>.', 'wp-super-cache' ), 'http://ocaoimh.ie/wish' ); ?></p>
	<p><?php _e( 'Thanks in advance!', 'wp-super-cache' ); ?><br />Donncha<br />
	<small>* <?php _e( 'Ok, it won&#8217;t go any faster but you&#8217;ll make this plugin author very happy!', 'wp-super-cache' ); ?></small></p>
	<div align='center'>
	<form action="https://www.paypal.com/cgi-bin/webscr" method="post">
	<input type="hidden" name="cmd" value="_s-xclick"/>
	<input type="hidden" name="hosted_button_id" value="3244504"/>
	<input type="image" src="https://www.paypal.com/en_GB/i/btn/btn_donate_SM.gif" border="0" name="submit" alt=""/>
	<img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1"/><br />
	</form>
	<p><?php _e( 'Don&#8217;t show me this again.', 'wp-super-cache' ); ?> <form action="#top" method="post"><input type='hidden' name='wp_cache_hide_donation' value='1' /><input type='submit' value='<?php _e( 'Hide', 'wp-super-cache' ); ?>' /><?php wp_nonce_field('wp-cache'); ?></form></p>
	</div>
	<?php } else { ?>
	<p><?php printf( __( '%1$s is maintained and developed by %2$s with contributions from many others.', 'wp-super-cache' ), '<a href="http://ocaoimh.ie/wp-super-cache/?r=supercache">WP Super Cache</a>', '<a href="http://ocaoimh.ie/?r=supercache">Donncha O Caoimh</a>' ); ?></p>
	<p><?php printf( __( 'He blogs at %1$s and posts photos at %2$s. He would really appreciate a <a href="%3$s">donation</a> to encourage development of this plugin.<br />Even a penny will help.', 'wp-super-cache' ), '<a href="http://ocaoimh.ie/?r=supercache">Holy Shmoly</a>', '<a href="http://inphotos.org/?r=supercache">In Photos.org</a>', 'http://ocaoimh.ie/gad' ); ?></p>
	<p><?php printf( __( 'Please say hi to him on %s too!', 'wp-super-cache' ), '<a href="http://twitter.com/donncha/">Twitter</a>' ); ?></p>
	<?php 
	}
	if ( isset( $wp_supercache_cache_list ) && $wp_supercache_cache_list ) { 
		$start_date = get_option( 'wpsupercache_start' );
		if ( !$start_date ) {
			$start_date = time();
		}
		?>
		<p><?php printf( __( 'Cached pages since %1$s : <strong>%2$s</strong>', 'wp-super-cache' ), date( 'M j, Y', $start_date ), number_format( get_option( 'wpsupercache_count' ) ) ); ?></p>
		<p><?php _e( 'Newest Cached Pages:', 'wp-super-cache' ); ?><ol>
		<?php
		foreach( array_reverse( (array)get_option( 'supercache_last_cached' ) ) as $url ) {
			$since = time() - strtotime( $url[ 'date' ] );
			echo "<li><a title='" . sprintf( __( 'Cached %s seconds ago', 'wp-super-cache' ), $since ) . "' href='" . site_url( $url[ 'url' ] ) . "'>{$url[ 'url' ]}</a></li>\n";
		}
		?></ol>
		<small><?php _e( '(may not always be accurate on busy sites)', 'wp-super-cache' ); ?></small>
		</p><?php 
	} else {
		$start_date = get_option( 'wpsupercache_start' );
		if ( $start_date ) {
			update_option( 'wpsupercache_start', $start_date );
			update_option( 'wpsupercache_count', 0 );
		}
	}
	?>
	</div>

	</td></table>
	<?php

	wp_cache_files();

	wsc_mod_rewrite();

	wp_cache_edit_max_time();

	echo '<a name="files"></a><fieldset class="options"><h3>' . __( 'Accepted Filenames &amp; Rejected URIs', 'wp-super-cache' ) . '</h3>';
	wp_cache_edit_rejected_pages();
	echo "\n";
	wp_cache_edit_rejected();
	echo "\n";
	wp_cache_edit_accepted();
	echo '</fieldset>';

	wp_cache_edit_rejected_ua();

	wp_cache_debug_settings();

	wp_lock_down();

	wp_cache_restore();

	ob_start();
	if( defined( 'WP_CACHE' ) ) {
		if( function_exists( 'do_cacheaction' ) ) {
			do_cacheaction( 'cache_admin_page' );
		}
	}
	$out = ob_get_contents();
	ob_end_clean();
	if( SUBMITDISABLED == ' ' && $out != '' ) {
		echo '<fieldset class="options"><h3>' . __( 'Cache Plugins', 'wp-super-cache' ) . '</h3>';
		echo $out;
		echo '</fieldset>';
	}

	echo "</div>\n";
}

function wsc_mod_rewrite() {
	global $cache_enabled, $super_cache_enabled, $cache_compression, $cache_compression_changed, $valid_nonce, $cache_path;
	if( $super_cache_enabled == false && $cache_enabled == true ) {
		?><h3><?php _e( 'Super Cache Compression', 'wp-super-cache' ); ?></h3>
		<p><?php _e( 'Compression is enabled by default when in <em>HALF ON</em> mode.', 'wp-super-cache' ); ?></p>
		<?php
		return;
	} elseif ( $super_cache_enabled == false ) {
		return;
	}
	if( false == defined( 'WPSC_DISABLE_COMPRESSION' ) ) {
	?>
	<a name='rewrite'></a>
	<fieldset class="options"> 
	<h3><?php _e( 'Super Cache Compression', 'wp-super-cache' ); ?></h3>
	<form name="wp_manager" action="#rewrite" method="post">
	<label><input type="radio" name="cache_compression" value="1" <?php if( $cache_compression ) { echo "checked=checked"; } ?>> <?php _e( 'Enabled', 'wp-super-cache' ); ?></label>
	<label><input type="radio" name="cache_compression" value="0" <?php if( !$cache_compression ) { echo "checked=checked"; } ?>> <?php _e( 'Disabled', 'wp-super-cache' ); ?></label>
	<p><?php _e( 'Compression is disabled by default because some hosts have problems with compressed files. Switching this on and off clears the cache.', 'wp-super-cache' ); ?></p>
	<?php
	if( isset( $cache_compression_changed ) && isset( $_POST[ 'cache_compression' ] ) && !$cache_compression ) {
		?><p><strong><?php _e( 'Super Cache compression is now disabled.', 'wp-super-cache' ); ?></strong></p> <?php
	} elseif( isset( $cache_compression_changed ) && isset( $_POST[ 'cache_compression' ] ) && $cache_compression ) {
		?><p><strong><?php _e( 'Super Cache compression is now enabled.', 'wps-uper-cache' ); ?></strong></p><?php
	}
	echo '<div class="submit"><input ' . SUBMITDISABLED . 'type="submit" value="' . __( 'Update Compression', 'wp-super-cache' ) . ' &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
	?></fieldset>
	<?php } ?>

	<a name="modrewrite"></a><fieldset class="options"> 
	<h3><?php _e( 'Mod Rewrite Rules', 'wp-super-cache' ); ?></h3><?php

	extract( wpsc_get_htaccess_info() );
	$dohtaccess = true;
	global $wpmu_version;
	if( isset( $wpmu_version ) ) {
		echo "<h4 style='color: #a00'>" . __( 'WordPress MU Detected', 'wp-super-cache' ) . "</h4><p>" . __( "Unfortunately the rewrite rules cannot be updated automatically when running WordPress MU. Please open your .htaccess and add the following mod_rewrite rules above any other rules in that file.", 'wp-super-cache' ) . "</p>";
	} elseif( !$wprules || $wprules == '' ) {
		echo "<h4 style='color: #a00'>" . __( 'Mod Rewrite rules cannot be updated!', 'wp-super-cache' ) . "</h4>";
		echo "<p>" . sprintf( __( "You must have <strong>BEGIN</strong> and <strong>END</strong> markers in %s.htaccess for the auto update to work. They look like this and surround the main WordPress mod_rewrite rules:", 'wp-super-cache' ), $home_path );
		echo "<blockquote><pre><em># BEGIN WordPress</em>\n RewriteCond %{REQUEST_FILENAME} !-f\n RewriteCond %{REQUEST_FILENAME} !-d\n RewriteRule . /index.php [L]\n <em># END WordPress</em></pre></blockquote>";
		_e( 'Refresh this page when you have updated your .htaccess file.', 'wp-super-cache' );
		echo "</fieldset></div>";
		return;
	} elseif( strpos( $wprules, 'wordpressuser' ) ) { // Need to clear out old mod_rewrite rules
		echo "<p><strong>" . __( 'Thank you for upgrading.', 'wp-super-cache' ) . "</strong> " . sprintf( __( 'The mod_rewrite rules changed since you last installed this plugin. Unfortunately you must remove the old supercache rules before the new ones are updated. Refresh this page when you have edited your .htaccess file. If you wish to manually upgrade, change the following line: %1$s so it looks like this: %2$s The only changes are "HTTP_COOKIE" becomes "HTTP:Cookie" and "wordpressuser" becomes "wordpress". This is a WordPress 2.5 change but it&#8217;s backwards compatible with older versions if you&#8217;re brave enough to use them.', 'wp-super-cache' ), '<blockquote><code>RewriteCond %{HTTP_COOKIE} !^.*wordpressuser.*$</code></blockquote>', '<blockquote><code>RewriteCond %{HTTP:Cookie} !^.*wordpress.*$</code></blockquote>' ) . "</p>";
		echo "</fieldset></div>";
		return;
	} elseif( $scrules != '' && strpos( $scrules, '%{REQUEST_URI} !^.*[^/]$' ) === false && substr( get_option( 'permalink_structure' ), -1 ) == '/' ) { // permalink structure has a trailing slash, need slash check in rules.
		echo "<div style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><h4>" . __( 'Trailing slash check required.', 'wp-super-cache' ) . "</h4><p>" . __( 'It looks like your blog has URLs that end with a "/". Unfortunately since you installed this plugin a duplicate content bug has been found where URLs not ending in a "/" end serve the same content as those with the "/" and do not redirect to the proper URL. To fix, you must edit your .htaccess file and add these two rules to the two groups of Super Cache rules:', 'wp-super-cache' ) . "</p>";
		echo "<blockquote><code>RewriteCond %{REQUEST_URI} !^.*[^/]$RewriteCond %{REQUEST_URI} !^.*//.*$</code></blockquote>";
		echo "<p>" . __( 'You can see where the rules go and examine the complete rules by clicking the "View mod_rewrite rules" link below.', 'wp-super-cache' ) . "</p></div>";
		$dohtaccess = false;
	} elseif( strpos( $scrules, 'supercache' ) || strpos( $wprules, 'supercache' ) ) { // only write the rules once
		$dohtaccess = false;
	}
	if( $dohtaccess && !$_POST[ 'updatehtaccess' ] ) {
		if ( $scrules == '' ) {
			wpsc_update_htaccess_form( 0 ); // don't hide the update htaccess form
		} else {
			wpsc_update_htaccess_form();
		}
	} elseif( $valid_nonce && $_POST[ 'updatehtaccess' ] ) {
		echo "<div style='padding:0 8px;color:#4f8a10;background-color:#dff2bf;border:1px solid #4f8a10;'>";
		if( wpsc_update_htaccess() ) {
			echo "<h4>" . __( 'Mod Rewrite rules updated!', 'wp-super-cache' ) . "</h4>";
			echo "<p><strong>" . sprintf( __( '%s.htaccess has been updated with the necessary mod_rewrite rules. Please verify they are correct. They should look like this:', 'wp-super-cache' ), $home_path ) . "</strong></p>\n";
		} else {
			echo "<h4>" . __( 'Mod Rewrite rules must be updated!', 'wp-super-cache' ) . "</h4>";
			echo "<p><strong>" . sprintf( __( 'Your %s.htaccess is not writable by the webserver and must be updated with the necessary mod_rewrite rules. The new rules go above the regular WordPress rules as shown in the code below:', 'wp-super-cache' ), $home_path ) . "</strong></p>\n";
		}
		echo "<p><pre>" . wp_specialchars( $rules ) . "</pre></p>\n</div>";
	} else {
		?>
		<p><?php printf( __( 'WP Super Cache mod rewrite rules were detected in your %s.htaccess file.<br /> Click the following link to see the lines added to that file. If you have upgraded the plugin make sure these rules match.', 'wp-super-cache' ), $home_path ); ?></p>
		<?php
		if ( $rules != $scrules ) {
			?><p style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><?php _e( 'A difference between the rules in your .htaccess file and the plugin rewrite rules has been found. This could be simple whitespace differences but you should compare the rules in the file with those below as soon as possible. Click the &#8217;Update Mod_Rewrite Rules&#8217; button to update the rules.', 'wp-super-cache' ); ?></p><?php
		}
		?>
		<a href="javascript:toggleLayer('rewriterules');" class="button"><?php _e( 'View Mod_Rewrite Rules', 'wp-super-cache' ); ?></a>
		<?php wpsc_update_htaccess_form(); ?>
		<div id='rewriterules' style='display: none;'>
		<?php echo "<p><pre># BEGIN WPSuperCache\n" . wp_specialchars( $rules ) . "# END WPSuperCache</pre></p>\n"; 
		echo "<p>" . sprintf( __( 'Rules must be added to %s too:', 'wp-super-cache' ), WP_CONTENT_DIR . "/cache/.htaccess" ) . "</p>";
		echo "<pre># BEGIN supercache\n" . wp_specialchars( $gziprules ) . "# END supercache</pre></p>"; ?>
		</div>
		<?php
	}
	// http://allmybrain.com/2007/11/08/making-wp-super-cache-gzip-compression-work/
	if( !is_file( $cache_path . '.htaccess' ) ) {
		$gziprules = insert_with_markers( $cache_path . '.htaccess', 'supercache', explode( "\n", $gziprules ) );
		echo "<h4>" . sprintf( __( 'Gzip encoding rules in %s.htaccess created.', 'wp-super-cache' ), $cache_path ) . "</h4>";
	}

	?></fieldset><?php
}

function wp_cache_restore() {
	echo '<fieldset class="options"><h3>' . __( 'Fix Configuration', 'wp-super-cache' ) . '</h3>';
	echo '<form name="wp_restore" action="#top" method="post">';
	echo '<input type="hidden" name="wp_restore_config" />';
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'id="deletepost" value="' . __( 'Restore Default Configuration', 'wp-super-cache' ) . ' &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
	echo '</fieldset>';

}

function comment_form_lockdown_message() {
	?><p><?php _e( "Comment moderation is enabled. Your comment may take some time to appear.", 'wp-super-cache' ); ?></p><?php
}
if( defined( 'WPLOCKDOWN' ) && constant( 'WPLOCKDOWN' ) )
	add_action( 'comment_form', 'comment_form_lockdown_message' );

function wp_lock_down() {
	global $wpdb, $cache_path, $wp_cache_config_file, $valid_nonce, $cached_direct_pages, $cache_enabled, $super_cache_enabled;

	if(isset($_POST['wp_lock_down']) && $valid_nonce) {
		$wp_lock_down = $_POST['wp_lock_down'] == '1' ? '1' : '0';
		wp_cache_replace_line('^.*WPLOCKDOWN', "define( 'WPLOCKDOWN', '$wp_lock_down' );", $wp_cache_config_file);
		if( $wp_lock_down == '0' && function_exists( 'prune_super_cache' ) )
			prune_super_cache( $cache_path, true ); // clear the cache after lockdown

	}
	if( !isset( $wp_lock_down ) ) {
		if( defined( 'WPLOCKDOWN' ) ) {
			$wp_lock_down = constant( 'WPLOCKDOWN' );
		} else {
			$wp_lock_down = '0';
		}
	}
	?><a name='lockdown'></a>
	<fieldset class="options"> 
	<h3><?php _e( 'Lock Down:', 'wp-super-cache' ); ?> <?php echo $wp_lock_down == '0' ? '<span style="color:red">' . __( 'Disabled', 'wp-super-cache' ) . '</span>' : '<span style="color:green">' . __( 'Enabled', 'wp-super-cache' ) . '</span>'; ?></h3>
	<p><?php _e( 'Prepare your server for an expected spike in traffic by enabling the lock down. When this is enabled, new comments on a post will not refresh the cached static files.', 'wp-super-cache' ); ?></p>
	<p><?php _e( 'Developers: Make your plugin lock down compatible by checking the "WPLOCKDOWN" constant. The following code will make sure your plugin respects the WPLOCKDOWN setting.', 'wp-super-cache' ); ?>
	<blockquote><code>if( defined( 'WPLOCKDOWN' ) && constant( 'WPLOCKDOWN' ) ) { 
		&nbsp;&nbsp;&nbsp;&nbsp;echo "<?php _e( 'Sorry. My blog is locked down. Updates will appear shortly', 'wp-super-cache' ); ?>";
		}</code></blockquote>
	<?php
	if( $wp_lock_down == '1' ) {
		?><p><?php _e( 'WordPress is locked down. Super Cache static files will not be deleted when new comments are made.', 'wp-super-cache' ); ?></p><?php
	} else {
		?><p><?php _e( 'WordPress is not locked down. New comments will refresh Super Cache static files as normal.', 'wp-super-cache' ); ?></p><?php
	}
	$new_lockdown =  $wp_lock_down == '1' ? '0' : '1';
	$new_lockdown_desc =  $wp_lock_down == '1' ? __( 'Disable', 'wp-super-cache' ) : __( 'Enable', 'wp-super-cache' );
	echo '<form name="wp_lock_down" action="#lockdown" method="post">';
	echo "<input type='hidden' name='wp_lock_down' value='{$new_lockdown}' />";
	echo "<div class='submit'><input type='submit' " . SUBMITDISABLED . " value='{$new_lockdown_desc} " . __( 'Lock Down', 'wp-super-cache' ) . " &raquo;' /></div>";
	wp_nonce_field('wp-cache');
	echo "</form>\n";

	?></fieldset><?php
	if( $cache_enabled == true && $super_cache_enabled == true ) {
		?><a name='direct'></a>
	<fieldset class="options"> 
	<h3><?php _e( 'Directly Cached Files', 'wp-super-cache' ); ?></h3><?php

	$out = '';
	if( $valid_nonce && is_array( $_POST[ 'direct_pages' ] ) && !empty( $_POST[ 'direct_pages' ] ) ) {
		$expiredfiles = array_diff( $cached_direct_pages, $_POST[ 'direct_pages' ] );
		unset( $cached_direct_pages );
		foreach( $_POST[ 'direct_pages' ] as $page ) {
			$page = $wpdb->escape( $page );
			if( $page != '' ) {
				$cached_direct_pages[] = $page;
				$out .= "'$page', ";
			}
		}
		if( $out == '' ) {
			$out = "'', ";
		}
	}
	if( $valid_nonce && $_POST[ 'new_direct_page' ] && '' != $_POST[ 'new_direct_page' ] ) {
		$page = str_replace( get_option( 'siteurl' ), '', $_POST[ 'new_direct_page' ] );
		if( substr( $page, 0, 1 ) != '/' )
			$page = '/' . $page;
		$page = $wpdb->escape( $page );
		if( in_array( $page, $cached_direct_pages ) == false ) {
			$cached_direct_pages[] = $page;
			$out .= "'$page', ";
		}
	}

	if( $out != '' ) {
		$out = substr( $out, 0, -2 );
		$out = '$cached_direct_pages = array( ' . $out . ' );';
		wp_cache_replace_line('^ *\$cached_direct_pages', "$out", $wp_cache_config_file);
		prune_super_cache( $cache_path, true );
	}

	if( !empty( $expiredfiles ) ) {
		foreach( $expiredfiles as $file ) {
			if( $file != '' ) {
				$firstfolder = explode( '/', $file );
				$firstfolder = ABSPATH . $firstfolder[1];
				$file = ABSPATH . $file;
				@unlink( trailingslashit( $file ) . 'index.html' );
				@unlink( trailingslashit( $file ) . 'index.html.gz' );
				RecursiveFolderDelete( trailingslashit( $firstfolder ) );
			}
		}
	}

	if( $valid_nonce && $_POST[ 'deletepage' ] ) {
		$page = preg_replace('/[ <>\'\"\r\n\t\(\)]/', '', str_replace( '..', '', $_POST['deletepage']) );
		$pagefile = ABSPATH . $page . 'index.html';
		$firstfolder = explode( '/', $page );
		$firstfolder = ABSPATH . $firstfolder[1];
		$page = ABSPATH . $page;
		if( is_file( $pagefile ) && is_writeable_ACLSafe( $pagefile ) && is_writeable_ACLSafe( $firstfolder ) ) {
			@unlink( $pagefile );
			@unlink( $pagefile . '.gz' );
			RecursiveFolderDelete( $firstfolder );
			echo "<strong>" . sprintf( __( '%s removed!', 'wp-super-cache' ), $pagefile ) . "</strong>";
			prune_super_cache( $cache_path, true );
		}
	}

	$readonly = '';
	if( !is_writeable_ACLSafe( ABSPATH ) ) {
		$readonly = 'READONLY';
		?><p style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><strong><?php _e( 'Warning!', 'wp-super-cache' ); ?></strong> <?php printf( __( 'You must make %s writable to enable this feature. As this is a security risk please make it readonly after your page is generated.', 'wp-super-cache' ), ABSPATH ); ?></p><?php
	} else {
		?><p style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><strong><?php _e( 'Warning!', 'wp-super-cache' ); ?></strong> <?php printf( __( '%s is writable. Please make it readonly after your page is generated as this is a security risk.', 'wp-super-cache' ), ABSPATH ); ?></p><?php
	}
	echo '<form name="direct_page" action="#direct" method="post">';
	if( is_array( $cached_direct_pages ) ) {
		$out = '';
		foreach( $cached_direct_pages as $page ) {
			if( $page == '' )
				continue;
			$generated = '';
			if( is_file( ABSPATH . $page . '/index.html' ) )
				$generated = '<input type="Submit" name="deletepage" value="' . $page . '">';
			$out .= "<tr><td><input type='text' $readonly name='direct_pages[]' size='30' value='$page' /></td><td>$generated</td></tr>";
		}
		if( $out != '' ) {
			?><table><tr><th><?php _e( 'Existing direct page', 'wp-super-cache' ); ?></th><th><?php _e( 'Delete cached file', 'wp-super-cache' ); ?></th></tr><?php
			echo "$out</table>";
		}
	}
	if( $readonly != 'READONLY' )
		echo __( "Add direct page:", 'wp-super-cache' ) . "<input type='text' $readonly name='new_direct_page' size='30' value='' />";

	echo "<p>" . sprintf( __( "Directly cached files are files created directly off %s where your blog lives. This feature is only useful if you are expecting a major Digg or Slashdot level of traffic to one post or page.", 'wp-super-cache' ), ABSPATH ) . "</p>";
	if( $readonly != 'READONLY' ) {
		echo "<p>" . sprintf( __( 'For example: to cache <em>%1$sabout/</em>, you would enter %1$sabout/ or /about/. The cached file will be generated the next time an anonymous user visits that page.', 'wp-super-cache' ), trailingslashit( get_option( 'siteurl' ) ) ) . "</p>";
		echo "<p>" . __( 'Make the textbox blank to remove it from the list of direct pages and delete the cached file.', 'wp-super-cache' ) . "</p>";
	}

	wp_nonce_field('wp-cache');
	if( $readonly != 'READONLY' )
		echo "<div class='submit'><input type='submit' ' . SUBMITDISABLED . 'value='" . __( 'Update Direct Pages', 'wp-super-cache' ) . " &raquo;' /></div>";
	echo "</form>\n";
	?></fieldset><?php
	} // if $super_cache_enabled
}

function RecursiveFolderDelete ( $folderPath ) { // from http://www.php.net/manual/en/function.rmdir.php
	if( trailingslashit( constant( 'ABSPATH' ) ) == trailingslashit( $folderPath ) )
		return false;
	if ( @is_dir ( $folderPath ) ) {
		$dh  = @opendir($folderPath);
		while (false !== ($value = @readdir($dh))) {
			if ( $value != "." && $value != ".." ) {
				$value = $folderPath . "/" . $value; 
				if ( @is_dir ( $value ) ) {
					RecursiveFolderDelete ( $value );
				}
			}
		}
		return @rmdir ( $folderPath );
	} else {
		return FALSE;
	}
}

function wp_cache_edit_max_time () {
	global $cache_max_time, $wp_cache_config_file, $valid_nonce, $cache_enabled, $super_cache_enabled;

	if( !isset( $cache_max_time ) )
		$cache_max_time = 3600;

	if(isset($_POST['wp_max_time']) && $valid_nonce) {
		$max_time = (int)$_POST['wp_max_time'];
		$cache_max_time = $max_time;
		wp_cache_replace_line('^ *\$cache_max_time', "\$cache_max_time = $cache_max_time;", $wp_cache_config_file);
	}
	?><fieldset class="options"> 
	<a name='expirytime'></a>
	<h3><?php _e( 'Expiry Time &amp; Garbage Collection', 'wp-super-cache' ); ?></h3><?php
	echo '<form name="wp_edit_max_time" action="#expirytime" method="post">';
	echo '<label for="wp_max_time">' . __( 'Expire time:', 'wp-super-cache' ) . '</label> ';
	echo "<input type=\"text\" size=6 name=\"wp_max_time\" value=\"$cache_max_time\" /> " . __( "seconds", 'wp-super-cache' );
	echo "<h4>" . __( 'Garbage Collection', 'wp-super-cache' ) . "</h4><p>" . __( 'If expiry time is more than 1800 seconds (half an hour), garbage collection will be done every 10 minutes, otherwise it will happen 10 seconds after the expiry time above.', 'wp-super-cache' ) . "</p>";
	echo "<p>" . __( 'Checking for and deleting expired files is expensive, but it&#8217;s expensive leaving them there too. On a very busy site you should set the expiry time to <em>300 seconds</em>. Experiment with different values and visit this page to see how many expired files remain at different times during the day. Aim to have less than 500 cached files if possible.', 'wp-super-cache' ) . "</p>";
	echo "<p>" . __( 'Set the expiry time to 0 seconds to disable garbage collection.', 'wp-super-cache' ) . "</p>";
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Change Expiration', 'wp-super-cache' ) . ' &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
	?></fieldset><?php
}

function wp_cache_sanitize_value($text, & $array) {
	$text = wp_specialchars(strip_tags($text));
	$array = preg_split("/[\s,]+/", chop($text));
	$text = var_export($array, true);
	$text = preg_replace('/[\s]+/', ' ', $text);
	return $text;
}

// from tehjosh at gamingg dot net http://uk2.php.net/manual/en/function.apache-request-headers.php#73964
// fixed bug in second substr()
if( !function_exists('apache_request_headers') ) {
	function apache_request_headers() {
		$headers = array();
		foreach(array_keys($_SERVER) as $skey) {
			if(substr($skey, 0, 5) == "HTTP_") {
				$headername = str_replace(" ", "-", ucwords(strtolower(str_replace("_", " ", substr($skey, 5)))));
				$headers[$headername] = $_SERVER[$skey];
			}
		}
		return $headers;
	}
}

function wp_cache_edit_rejected_ua() {
	global $cache_rejected_user_agent, $wp_cache_config_file, $valid_nonce;

	if ( !function_exists( 'apache_request_headers' ) ) return;

	if ( isset( $_POST[ 'wp_rejected_user_agent' ] ) && $valid_nonce ) {
		$_POST[ 'wp_rejected_user_agent' ] = str_replace( ' ', '___', $_POST[ 'wp_rejected_user_agent' ] );
		$text = str_replace( '___', ' ', wp_cache_sanitize_value( $_POST[ 'wp_rejected_user_agent' ], $cache_rejected_user_agent ) );
		wp_cache_replace_line( '^ *\$cache_rejected_user_agent', "\$cache_rejected_user_agent = $text;", $wp_cache_config_file );
		foreach( $cache_rejected_user_agent as $k => $ua ) {
			$cache_rejected_user_agent[ $k ] = str_replace( '___', ' ', $ua );
		}
		reset( $cache_rejected_user_agent );
	}

	echo '<a name="useragents"></a><fieldset class="options"><h3>' . __( 'Rejected User Agents', 'wp-super-cache' ) . '</h3>';
	echo "<p>" . __( 'Strings in the HTTP &#8217;User Agent&#8217; header that prevent WP-Cache from caching bot, spiders, and crawlers&#8217; requests. Note that super cached files are still sent to these agents if they already exists.', 'wp-super-cache' ) . "</p>\n";
	echo '<form name="wp_edit_rejected_user_agent" action="#useragents" method="post">';
	echo '<textarea name="wp_rejected_user_agent" cols="40" rows="4" style="width: 50%; font-size: 12px;" class="code">';
	foreach( $cache_rejected_user_agent as $ua ) {
		echo esc_html( $ua ) . "\n";
	}
	echo '</textarea> ';
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Save UA Strings', 'wp-super-cache' ) . ' &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo '</form>';
	echo "</fieldset>\n";
}

function wp_cache_edit_rejected_pages() {
	global $wp_cache_config_file, $valid_nonce, $wp_cache_pages;

	if ( isset( $_POST[ 'wp_edit_rejected_pages' ] ) && $valid_nonce ) {
		$pages = array( 'single', 'pages', 'archives', 'tag', 'frontpage', 'home', 'category', 'feed', 'search' );
		foreach( $pages as $page ) {
			if ( isset( $_POST[ 'wp_cache_pages' ][ $page ] ) ) {
				$value = 1;
			} else {
				$value = 0;
			}
			wp_cache_replace_line('^ *\$wp_cache_pages\[ "' . $page . '" \]', "\$wp_cache_pages[ \"{$page}\" ] = $value;", $wp_cache_config_file);
			$wp_cache_pages[ $page ] = $value;
		}
	}

	echo '<a name="rejectpages"></a>';
	echo '<p>' . __( 'Do not cache the following page types. See the <a href="http://codex.wordpress.org/Conditional_Tags">Conditional Tags</a> documentation for a complete discussion on each type.', 'wp-super-cache' ) . '</p>';
	echo '<form name="wp_edit_rejected_pages" action="#rejectpages" method="post">';
	echo '<input type="hidden" name="wp_edit_rejected_pages" value="1" />';
	echo '<label><input type="checkbox" value="1" name="wp_cache_pages[single]" ' . checked( 1, $wp_cache_pages[ 'single' ], false ) . ' /> ' . __( 'Single Posts', 'wp-super-cache' ) . ' (is_single)</label><br />';
	echo '<label><input type="checkbox" value="1" name="wp_cache_pages[pages]" ' . checked( 1, $wp_cache_pages[ 'pages' ], false ) . ' /> ' . __( 'Pages', 'wp-super-cache' ) . ' (is_page)</label><br />';
	echo '<label><input type="checkbox" value="1" name="wp_cache_pages[frontpage]" ' . checked( 1, $wp_cache_pages[ 'frontpage' ], false ) . ' /> ' . __( 'Front Page', 'wp-super-cache' ) . ' (is_front_page)</label><br />';
	echo '&nbsp;&nbsp;<label><input type="checkbox" value="1" name="wp_cache_pages[home]" ' . checked( 1, $wp_cache_pages[ 'home' ], false ) . ' /> ' . __( 'Home', 'wp-super-cache' ) . ' (is_home)</label><br />';
	echo '<label><input type="checkbox" value="1" name="wp_cache_pages[archives]" ' . checked( 1, $wp_cache_pages[ 'archives' ], false ) . ' /> ' . __( 'Archives', 'wp-super-cache' ) . ' (is_archive)</label><br />';
	echo '&nbsp;&nbsp;<label><input type="checkbox" value="1" name="wp_cache_pages[tag]" ' . checked( 1, $wp_cache_pages[ 'tag' ], false ) . ' /> ' . __( 'Tags', 'wp-super-cache' ) . ' (is_tag)</label><br />';
	echo '&nbsp;&nbsp;<label><input type="checkbox" value="1" name="wp_cache_pages[category]" ' . checked( 1, $wp_cache_pages[ 'category' ], false ) . ' /> ' . __( 'Category', 'wp-super-cache' ) . ' (is_category)</label><br />';
	echo '<label><input type="checkbox" value="1" name="wp_cache_pages[feed]" ' . checked( 1, $wp_cache_pages[ 'feed' ], false ) . ' /> ' . __( 'Feeds', 'wp-super-cache' ) . ' (is_feed)</label><br />';
	echo '<label><input type="checkbox" value="1" name="wp_cache_pages[search]" ' . checked( 1, $wp_cache_pages[ 'search' ], false ) . ' /> ' . __( 'Search Pages', 'wp-super-cache' ) . ' (is_search)</label><br />';

	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Save' ) . ' &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";

}

function wp_cache_edit_rejected() {
	global $cache_acceptable_files, $cache_rejected_uri, $wp_cache_config_file, $valid_nonce;

	if(isset($_REQUEST['wp_rejected_uri']) && $valid_nonce) {
		$text = wp_cache_sanitize_value( str_replace( '\\\\', '\\', $_REQUEST['wp_rejected_uri'] ), $cache_rejected_uri );
		wp_cache_replace_line('^ *\$cache_rejected_uri', "\$cache_rejected_uri = $text;", $wp_cache_config_file);
	}


	echo '<a name="rejecturi"></a>';
	echo '<form name="wp_edit_rejected" action="#rejecturi" method="post">';
	echo "<p>" . __( 'Add here strings (not a filename) that forces a page not to be cached. For example, if your URLs include year and you dont want to cache last year posts, it&#8217;s enough to specify the year, i.e. &#8217;/2004/&#8217;. WP-Cache will search if that string is part of the URI and if so, it will not cache that page.', 'wp-super-cache' ) . "</p>\n";
	echo '<textarea name="wp_rejected_uri" cols="40" rows="4" style="width: 50%; font-size: 12px;" class="code">';
	foreach ($cache_rejected_uri as $file) {
		echo wp_specialchars( $file ) . "\n";
	}
	echo '</textarea> ';
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Save Strings', 'wp-super-cache' ) . ' &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
}

function wp_cache_edit_accepted() {
	global $cache_acceptable_files, $cache_rejected_uri, $wp_cache_config_file, $valid_nonce;

	if(isset($_REQUEST['wp_accepted_files']) && $valid_nonce) {
		$text = wp_cache_sanitize_value($_REQUEST['wp_accepted_files'], $cache_acceptable_files);
		wp_cache_replace_line('^ *\$cache_acceptable_files', "\$cache_acceptable_files = $text;", $wp_cache_config_file);
	}


	echo '<a name="cancache"></a>';
	echo '<div style="clear:both"></div><form name="wp_edit_accepted" action="#cancache" method="post">';
	echo "<p>" . __( 'Add here those filenames that can be cached, even if they match one of the rejected substring specified above.', 'wp-super-cache' ) . "</p>\n";
	echo '<textarea name="wp_accepted_files" cols="40" rows="8" style="width: 50%; font-size: 12px;" class="code">';
	foreach ($cache_acceptable_files as $file) {
		echo wp_specialchars($file) . "\n";
	}
	echo '</textarea> ';
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Save Files', 'wp-super-cache' ) . ' &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
}

function wp_cache_debug_settings() {
	global $wp_super_cache_debug, $wp_cache_debug_email, $wp_cache_debug_log, $wp_cache_debug_level, $wp_cache_debug_ip, $cache_path, $valid_nonce, $wp_cache_config_file, $wp_cache_debug_to_file;
	global $wp_super_cache_front_page_check, $wp_super_cache_front_page_clear, $wp_super_cache_front_page_text, $wp_super_cache_front_page_notification, $wp_super_cache_advanced_debug;

	if ( !isset( $wp_cache_debug_level ) )
		$wp_cache_debug_level = 1;
	if ( isset( $_POST[ 'wp_cache_debug' ] ) && $valid_nonce ) {
		$wp_super_cache_debug = intval( $_POST[ 'wp_super_cache_debug' ] );
		wp_cache_replace_line('^ *\$wp_super_cache_debug', "\$wp_super_cache_debug = '$wp_super_cache_debug';", $wp_cache_config_file);
		$wp_cache_debug_email = wp_specialchars( $_POST[ 'wp_cache_debug_email' ] );
		wp_cache_replace_line('^ *\$wp_cache_debug_email', "\$wp_cache_debug_email = '$wp_cache_debug_email';", $wp_cache_config_file);
		$wp_cache_debug_to_file = intval( $_POST[ 'wp_cache_debug_to_file' ] );
		if ( $wp_cache_debug_to_file && ( ( isset( $wp_cache_debug_log ) && $wp_cache_debug_log == '' ) || !isset( $wp_cache_debug_log ) ) ) {
			$wp_cache_debug_log = md5( time() ) . ".txt";
		} elseif( $wp_cache_debug_to_file == false ) {
			$wp_cache_debug_log = "";
		}
		wp_cache_replace_line('^ *\$wp_cache_debug_to_file', "\$wp_cache_debug_to_file = '$wp_cache_debug_to_file';", $wp_cache_config_file);
		wp_cache_replace_line('^ *\$wp_cache_debug_log', "\$wp_cache_debug_log = '$wp_cache_debug_log';", $wp_cache_config_file);
		$wp_cache_debug_ip = wp_specialchars( $_POST[ 'wp_cache_debug_ip' ] );
		wp_cache_replace_line('^ *\$wp_cache_debug_ip', "\$wp_cache_debug_ip = '$wp_cache_debug_ip';", $wp_cache_config_file);
		$wp_cache_debug_level = (int)$_POST[ 'wp_cache_debug_level' ];
		wp_cache_replace_line('^ *\$wp_cache_debug_level', "\$wp_cache_debug_level = '$wp_cache_debug_level';", $wp_cache_config_file);
		$wp_super_cache_front_page_check = (int)$_POST[ 'wp_super_cache_front_page_check' ];
		wp_cache_replace_line('^ *\$wp_super_cache_front_page_check', "\$wp_super_cache_front_page_check = '$wp_super_cache_front_page_check';", $wp_cache_config_file);
		$wp_super_cache_front_page_clear = (int)$_POST[ 'wp_super_cache_front_page_clear' ];
		wp_cache_replace_line('^ *\$wp_super_cache_front_page_clear', "\$wp_super_cache_front_page_clear = '$wp_super_cache_front_page_clear';", $wp_cache_config_file);
		$wp_super_cache_front_page_text = wp_specialchars( $_POST[ 'wp_super_cache_front_page_text' ] );
		wp_cache_replace_line('^ *\$wp_super_cache_front_page_text', "\$wp_super_cache_front_page_text = '$wp_super_cache_front_page_text';", $wp_cache_config_file);
		$wp_super_cache_front_page_notification = (int)$_POST[ 'wp_super_cache_front_page_notification' ];
		wp_cache_replace_line('^ *\$wp_super_cache_front_page_notification', "\$wp_super_cache_front_page_notification = '$wp_super_cache_front_page_notification';", $wp_cache_config_file);
		if ( isset( $wp_super_cache_front_page_check ) && $wp_super_cache_front_page_check == 1 && !wp_next_scheduled( 'wp_cache_check_site_hook' ) ) {
			wp_schedule_single_event( time() + 360 , 'wp_cache_check_site_hook' );
			if ( isset( $GLOBALS[ 'wp_super_cache_debug' ] ) && $GLOBALS[ 'wp_super_cache_debug' ] ) wp_cache_debug( 'scheduled wp_cache_check_site_hook for 360 seconds time.', 2 );
		}
	}

	echo '<a name="debug"></a>';
	echo '<fieldset class="options">';
	echo "<h3>" . __( 'Debug Settings', 'wp-super-cache' ) . "</h3>";
	if ( ( isset( $wp_cache_debug_log ) && $wp_cache_debug_log != '' ) || ( isset( $wp_cache_debug_email ) && $wp_cache_debug_email != '' ) ) {
		echo "<p>" . __( 'Currently logging to: ', 'wp-super-cache' );
		if ( isset( $wp_cache_debug_log ) && $wp_cache_debug_log != '' ) {
			$url = str_replace( ABSPATH, '', "{$cache_path}{$wp_cache_debug_log}" );
			echo "<a href='" . site_url( $url ) . "'>$cache_path{$wp_cache_debug_log}</a> ";

		}
		if ( isset( $wp_cache_debug_email ) )
			echo " $wp_cache_debug_email ";
		echo "</p>";
	}
	echo '<p>' . __( 'Fix problems with the plugin by debugging it here. It can send you debug emails or log them to a file in your cache directory.', 'wp-super-cache' ) . '</p>';
	echo '<p>' . __( 'Logging to a file is easier but faces the problem that clearing the cache will clear the log file.', 'wp-super-cache' ) . '</p>';
	echo '<div style="clear:both"></div><form name="wp_cache_debug" action="#debug" method="post">';
	echo "<input type='hidden' name='wp_cache_debug' value='1' /><br />";
	echo "<table class='form-table'>";
	echo "<tr><td>" . __( 'Debugging', 'wp-super-cache' ) . "</td><td><input type='checkbox' name='wp_super_cache_debug' value='1' " . checked( 1, $wp_super_cache_debug, false ) . " /> " . __( 'enabled', 'wp-super-cache' ) . "</td></tr>";
	echo "<tr><td valign='top' rowspan='2'>" . __( 'Logging Type', 'wp-super-cache' ) . "</td><td> " . __( 'Email', 'wp-super-cache' ) . ": <input type='text' size='30' name='wp_cache_debug_email' value='{$wp_cache_debug_email}' /></td></tr>";
	echo "<tr><td><input type='checkbox' name='wp_cache_debug_to_file' value='1' " . checked( 1, $wp_cache_debug_to_file, false ) . " /> " . __( 'file', 'wp-super-cache' ) . "</td></tr>";
	echo "<tr><td>" . __( 'IP Address', 'wp-super-cache' ) . "</td><td> <input type='text' size='20' name='wp_cache_debug_ip' value='{$wp_cache_debug_ip}' /> " . sprintf( __( '(only log requests from this IP address. Your IP is %s)', 'wp-super-cache' ), $_SERVER[ 'REMOTE_ADDR' ] ) . "</td></tr>";
	echo "<tr><td>" . __( 'Log level', 'wp-super-cache' ) . "</td><td> ";
	for( $t = 1; $t <= 5; $t++ ) {
		echo "<input type='radio' name='wp_cache_debug_level' value='$t' ";
		echo $wp_cache_debug_level == $t ? "checked='checked' " : '';
		echo "/> $t ";
	}
	echo " " . __( '(1 = less, 5 = more, may cause severe server load.)', 'wp-super-cache' ) . "</td></tr>";
	echo "</table>\n";
	if ( isset( $wp_super_cache_advanced_debug ) ) {
	echo "<h4>" . __( 'Advanced', 'wp-super-cache' ) . "</h4><p>" . __( 'In very rare cases two problems may arise on some blogs:<ol><li> The front page may start downloading as a zip file.</li><li> The wrong page is occasionally cached as the front page if your blog uses a static front page and the permalink structure is <em>/%category%/%postname%/</em>.</li></ol>', 'wp-super-cache' ) . '</p>';
	echo "<p>" . __( 'I&#8217;m 99% certain that they aren&#8217;t bugs in WP Super Cache and they only happen in very rare cases but you can run a simple check once every 5 minutes to verify that your site is ok if you&#8217;re worried. You will be emailed if there is a problem.', 'wp-super-cache' ) . "</p>";
	echo "<table class='form-table'>";
	echo "<tr><td valign='top' colspan='2'><input type='checkbox' name='wp_super_cache_front_page_check' value='1' " . checked( 1, $wp_super_cache_front_page_check, false ) . " /> " . __( 'Check front page every 5 minutes.', 'wp-super-cache' ) . "</td></tr>";
	echo "<tr><td valign='top'>" . __( 'Front page text', 'wp-super-cache' ) . "</td><td> <input type='text' size='30' name='wp_super_cache_front_page_text' value='{$wp_super_cache_front_page_text}' /> (" . __( 'Text to search for on your front page. If this text is missing the cache will be cleared. Leave blank to disable.', 'wp-super-cache' ) . ")</td></tr>";
	echo "<tr><td valign='top' colspan='2'><input type='checkbox' name='wp_super_cache_front_page_clear' value='1' " . checked( 1, $wp_super_cache_front_page_clear, false ) . " /> " . __( 'Clear cache on error.', 'wp-super-cache' ) . "</td></tr>";
	echo "<tr><td valign='top' colspan='2'><input type='checkbox' name='wp_super_cache_front_page_notification' value='1' " . checked( 1, $wp_super_cache_front_page_notification, false ) . " /> " . __( 'Email the blog admin when checks are made. (useful for testing)', 'wp-super-cache' ) . "</td></tr>";
	
	echo "</table>\n";
	}
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Save', 'wp-super-cache' ) . ' &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
	echo '</fieldset>';
}

function wp_cache_enable() {
	global $wp_cache_config_file, $cache_enabled, $supercachedir;

	if(get_option('gzipcompression')) {
		echo "<strong>" . __( 'Error: GZIP compression is enabled, disable it if you want to enable wp-cache.', 'wp-super-cache' ) . "</strong>";
		return false;
	}
	if( wp_cache_replace_line('^ *\$cache_enabled', '$cache_enabled = true;', $wp_cache_config_file) ) {
		$cache_enabled = true;
	}
	wp_super_cache_enable();
}

function wp_cache_disable() {
	global $wp_cache_config_file, $cache_enabled;

	if (wp_cache_replace_line('^ *\$cache_enabled', '$cache_enabled = false;', $wp_cache_config_file)) {
		$cache_enabled = false;
	}
	wp_super_cache_disable();
}
function wp_super_cache_enable() {
	global $supercachedir, $wp_cache_config_file, $super_cache_enabled;

	if( is_dir( $supercachedir . ".disabled" ) )
		if( is_dir( $supercachedir ) ) {
			prune_super_cache( $supercachedir . ".disabled", true );
			@unlink( $supercachedir . ".disabled" );
		} else {
			@rename( $supercachedir . ".disabled", $supercachedir );
		}
	wp_cache_replace_line('^ *\$super_cache_enabled', '$super_cache_enabled = true;', $wp_cache_config_file);
	$super_cache_enabled = true;
}

function wp_super_cache_disable() {
	global $cache_path, $supercachedir, $wp_cache_config_file, $super_cache_enabled;

	wp_cache_replace_line('^ *\$super_cache_enabled', '$super_cache_enabled = false;', $wp_cache_config_file);
	if( is_dir( $supercachedir ) )
		@rename( $supercachedir, $supercachedir . ".disabled" );
	$super_cache_enabled = false;
	sleep( 1 ); // allow existing processes to write to the supercachedir and then delete it
	if (function_exists ('prune_super_cache') && is_dir( $supercachedir ) ) {
		prune_super_cache( $cache_path, true );
	}
}

function wp_cache_is_enabled() {
	global $wp_cache_config_file;

	if(get_option('gzipcompression')) {
		echo "<strong>" . __( 'Warning', 'wp-super-cache' ) . "</strong>: " . __( "GZIP compression is enabled in WordPress, wp-cache will be bypassed until you disable gzip compression.", 'wp-super-cache' );
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
	if (!is_writeable_ACLSafe($my_file)) {
		echo "Error: file $my_file is not writable.\n";
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
		if ( $done || !preg_match('/^(if\ \(\ \!\ )?define|\$|\?>/', $line) ) {
			fputs($fd, $line);
		} else {
			fputs($fd, "$new //Added by WP-Cache Manager\n");
			fputs($fd, $line);
			$done = true;
		}
	}
	fclose($fd);
	return true;
}

function wp_cache_verify_cache_dir() {
	global $cache_path, $blog_cache_dir, $blogcacheid;

	$dir = dirname($cache_path);
	if ( !file_exists($cache_path) ) {
		if ( !is_writeable_ACLSafe( $dir ) || !($dir = mkdir( $cache_path ) ) ) {
				echo "<strong>" . __( 'Error', 'wp-super-cache' ) . ":</strong> " . sprintf( __( 'Your cache directory (<strong>$cache_path</strong>) did not exist and couldn&#8217;t be created by the web server. Check %s permissions.', 'wp-super-cache' ), $dir );
				return false;
		}
	}
	if ( !is_writeable_ACLSafe($cache_path)) {
		echo "<strong>" . __( 'Error', 'wp-super-cache' ) . ":</strong> " . sprintf( __( 'Your cache directory (<strong>%1$s</strong>) or <strong>%2$s</strong> need to be writable for this plugin to work. Double-check it.', 'wp-super-cache' ), $cache_path, $dir );
		return false;
	}

	if ( '/' != substr($cache_path, -1)) {
		$cache_path .= '/';
	}

	if( false == is_dir( $blog_cache_dir ) ) {
		@mkdir( $cache_path . "blogs" );
		if( $blog_cache_dir != $cache_path . "blogs/" )
			@mkdir( $blog_cache_dir );
	}

	if( false == is_dir( $blog_cache_dir . 'meta' ) )
		@mkdir( $blog_cache_dir . 'meta' );

	return true;
}

function wp_cache_verify_config_file() {
	global $wp_cache_config_file, $wp_cache_config_file_sample, $sem_id, $cache_path;

	$new = false;
	$dir = dirname($wp_cache_config_file);

	if ( file_exists($wp_cache_config_file) ) {
		$lines = join( ' ', file( $wp_cache_config_file ) );
		if( strpos( $lines, 'WPCACHEHOME' ) === false ) {
			if( is_writeable_ACLSafe( $wp_cache_config_file ) ) {
				@unlink( $wp_cache_config_file );
			} else {
				echo "<strong>" . __( 'Error', 'wp-super-cache' ) . ":</strong> " . sprintf( __( 'Your WP-Cache config file (<strong>%s</strong>) is out of date and not writable by the Web server.Please delete it and refresh this page.', 'wp-super-cache' ), $wp_cache_config_file );
				return false;
			}
		}
	} elseif( !is_writeable_ACLSafe($dir)) {
		echo "<strong>" . __( 'Error', 'wp-super-cache' ) . ":</strong> " . sprintf( __( 'Configuration file missing and %1$s  directory (<strong>%2$s</strong>) is not writable by the Web server.Check its permissions.', 'wp-super-cache' ), WP_CONTENT_DIR, $dir );
		return false;
	}

	if ( !file_exists($wp_cache_config_file) ) {
		if ( !file_exists($wp_cache_config_file_sample) ) {
			echo "<strong>" . __( 'Error', 'wp-super-cache' ) . ":</strong> " . sprintf( __( 'Sample WP-Cache config file (<strong>%s</strong>) does not exist.Verify you installation.', 'wp-super-cache' ), $wp_cache_config_file_sample );
			return false;
		}
		copy($wp_cache_config_file_sample, $wp_cache_config_file);
		$dir = str_replace( str_replace( '\\', '/', WP_CONTENT_DIR ), '', str_replace( '\\', '/', dirname(__FILE__) ) );
		if( is_file( dirname(__FILE__) . '/wp-cache-config-sample.php' ) ) {
			wp_cache_replace_line('define\(\ \'WPCACHEHOME', "\tdefine( 'WPCACHEHOME', WP_CONTENT_DIR . \"{$dir}/\" );", $wp_cache_config_file);
		} elseif( is_file( dirname(__FILE__) . '/wp-super-cache/wp-cache-config-sample.php' ) ) {
			wp_cache_replace_line('define\(\ \'WPCACHEHOME', "\tdefine( 'WPCACHEHOME', WP_CONTENT_DIR . \"{$dir}/wp-super-cache/\" );", $wp_cache_config_file);
		}
		$new = true;
	}
	if( $sem_id == 5419 && $cache_path != '' ) {
		$sem_id = crc32( $_SERVER[ 'HTTP_HOST' ] . $cache_path ) & 0x7fffffff;
		wp_cache_replace_line('sem_id', '$sem_id = ' . $sem_id . ';', $wp_cache_config_file);
	}
	require($wp_cache_config_file);
	return true;
}

function wp_cache_create_advanced_cache() {
	global $wp_cache_link, $wp_cache_file;
	$ret = true;

	$file = file_get_contents( $wp_cache_file );
	$file = str_replace( 'CACHEHOME', constant( 'WPCACHEHOME' ), $file );
	$fp = @fopen( $wp_cache_link, 'w' );
	if( $fp ) {
		fputs( $fp, $file );
		fclose( $fp );
	} else {
		$ret = false;
	}
	return $ret;
}

function wp_cache_check_link() {
	global $wp_cache_link, $wp_cache_file;
 
 	$ret = true;
	if( file_exists($wp_cache_link) ) {
		$file = file_get_contents( $wp_cache_link );
		if( strpos( $file, "WP SUPER CACHE 0.8.9.1" ) ) {
			return true;
		} else {
			if( !@unlink($wp_cache_link) ) {
				$ret = false;
			} else {
				$ret = wp_cache_create_advanced_cache();
			}
		}
	} else {
		$ret = wp_cache_create_advanced_cache();
	}

	if( false == $ret ) {
		echo "<h3>" . __( 'Warning', 'wp-super-cache' ) . "! <em>" . sprintf( __( '%s/advanced-cache.php</em> does not exist or cannot be updated.', 'wp-super-cache' ), WP_CONTENT_DIR ) . "</h3>";
		echo "<p><ul><li>" . __( '1. If it already exists please delete the file first.', 'wp-super-cache' ) . "</li>";
		echo "<li>" . sprintf( __( '2. Make %1$s writable using the chmod command through your ftp or server software. (<em>chmod 777 %1$s</em>) and refresh this page. This is only a temporary measure and you&#8217;ll have to make it read only afterwards again. (Change 777 to 755 in the previous command)', 'wp-super-cache' ), WP_CONTENT_DIR ) . "</li>";
		echo "<li>" . sprintf( __( '3. Refresh this page to update <em>%s/advanced-cache.php</em>', 'wp-super-cache' ), WP_CONTENT_DIR ) . "</li></ul>";
		echo sprintf( __( 'If that doesn&#8217;t work, make sure the file <em>%s/advanced-cache.php</em> doesn&#8217;t exist:', 'wp-super-cache' ), WP_CONTENT_DIR ) . "<ol>";
		printf( __( '<li>1. Open <em>%1$s$wp_cache_file</em> in a text editor.</li><li>2. Change the text <em>CACHEHOME</em> to <em>%2$s</em></li><li>3. Save the file and copy it to <em>%3$s</em> and refresh this page.</li>', 'wp-super-cache' ), $wp_cache_file, WPCACHEHOME, $wp_cache_link );
		return false;
	}
	return true;
}

function wp_cache_check_global_config() {
	global $wp_cache_check_wp_config;

	if ( !isset( $wp_cache_check_wp_config ) )
		return true;


	if ( file_exists( ABSPATH . 'wp-config.php') ) {
		$global = ABSPATH . 'wp-config.php';
	} else {
		$global = dirname(ABSPATH) . '/wp-config.php';
	}

	$line = 'define(\'WP_CACHE\', true);';
	if (!is_writeable_ACLSafe($global) || !wp_cache_replace_line('define *\( *\'WP_CACHE\'', $line, $global) ) {
		if ( defined( 'WP_CACHE' ) && constant( 'WP_CACHE' ) == false ) {
			echo "<div style='border: 1px solid #333; background: #ffffaa; padding: 2px;'>" . __( '<h3>WP_CACHE constant in wp-config.php set to false</h3><p>The WP_CACHE constant is defined in your wp-config.php but must be set to true, not false for this plugin to work correctly.</p>', 'wp-super-cache' ) . "</div>";
		} else {
			echo "<p>" . __( "<strong>Error: WP_CACHE is not enabled</strong> in your <code>wp-config.php</code> file and I couldn&#8217;t modify it.", 'wp-super-cache' ) . "</p>";;
			echo "<p>" . sprintf( __( "Edit <code>%s</code> and add the following line:<br /> <code>define('WP_CACHE', true);</code><br />Otherwise, <strong>WP-Cache will not be executed</strong> by WordPress core. ", 'wp-super-cache' ), $global ) . "</p>";
		}
		return false;
	}  else {
		echo "<div style='border: 1px solid #333; background: #ffffaa; padding: 2px;'>" . __( '<h3>WP_CACHE constant added to wp-config.php</h3><p>If you continue to see this warning message please see point 5 of the <a href="http://wordpress.org/extend/plugins/wp-super-cache/faq/">FAQ</a>. The WP_CACHE line must be moved up.', 'wp-super-cache' ) . "</p></div>";
	}
	return true;
}

function wp_cache_files() {
	global $cache_path, $file_prefix, $cache_max_time, $valid_nonce, $supercachedir, $cache_enabled, $super_cache_enabled, $blog_cache_dir, $cache_compression;
	global $wp_cache_object_cache, $wp_cache_preload_on;

	if ( '/' != substr($cache_path, -1)) {
		$cache_path .= '/';
	}

	if ( $valid_nonce ) {
		if(isset($_REQUEST['wp_delete_cache'])) {
			wp_cache_clean_cache($file_prefix);
		}
		if(isset($_REQUEST['wp_delete_expired'])) {
			wp_cache_clean_expired($file_prefix);
		}
	}
	echo "<a name='listfiles'></a>";
	echo '<fieldset class="options" id="show-this-fieldset"><h3>' . __( 'Cache Contents', 'wp-super-cache' ) . '</h3>';

	if ( $wp_cache_object_cache ) {
		echo "<p>" . __( "Object cache in use. No cache listing available.", 'wp-super-cache' ) . "</p>";
		wp_cache_delete_buttons();
		echo "</fieldset>";
		return false;
	}

	$cache_stats = get_option( 'supercache_stats' );
	if ( !is_array( $cache_stats ) || ( $valid_nonce && $_GET[ 'action' ] == 'regenerate_cache_stats' ) ) {
	$list_files = false; // it doesn't list supercached files, and removing single pages is buggy
	$count = 0;
	$expired = 0;
	$now = time();
	if ( ($handle = @opendir( $blog_cache_dir . 'meta/' )) ) { 
		$wp_cache_fsize = 0;
		if ( $valid_nonce && isset( $_GET[ 'action' ] ) && $_GET[ 'action' ] == 'deletewpcache' ) {
			$deleteuri = preg_replace( '/[ <>\'\"\r\n\t\(\)]/', '', str_replace( '/index.php', '/', str_replace( '..', '', preg_replace("/(\?.*)?$/", '', base64_decode( $_GET[ 'uri' ] ) ) ) ) );
			$deleteuri = str_replace( '\\', '', $deleteuri );
		} else {
			$deleteuri = '';
		}

		if ( $valid_nonce && isset( $_GET[ 'action' ] ) && $_GET[ 'action' ] == 'deletesupercache' ) {
			$supercacheuri = preg_replace( '/[ <>\'\"\r\n\t\(\)]/', '', str_replace( '/index.php', '/', str_replace( '..', '', preg_replace("/(\?.*)?$/", '', base64_decode( $_GET[ 'uri' ] ) ) ) ) );
			$supercacheuri = trailingslashit( str_replace( '\\', '', $supercacheuri ) );
			printf( __( "Deleting supercache file: <strong>%s</strong><br />", 'wp-super-cache' ), $supercacheuri );
			@unlink( $cache_path . 'supercache/' . $supercacheuri . 'index.html' );
			@unlink( $cache_path . 'supercache/' . $supercacheuri . 'index.html.gz' );
			prune_super_cache( $cache_path . 'supercache/' . $supercacheuri . 'page', true );
			@rmdir( $cache_path . 'supercache/' . $supercacheuri );
		}
		while( false !== ($file = readdir($handle))) {
			if ( preg_match("/^$file_prefix.*\.meta/", $file) ) {
				$content_file = preg_replace("/meta$/", "html", $file);
				$mtime = filemtime( $blog_cache_dir . 'meta/' . $file );
				if ( ! ( $fsize = @filesize( $blog_cache_dir . $content_file ) ) ) 
					continue; // .meta does not exists

				$age = $now - $mtime;
				if ( $valid_nonce && $_GET[ 'listfiles' ] ) {
					$meta = unserialize( file_get_contents( $blog_cache_dir . 'meta/' . $file ) );
					if ( $deleteuri != '' && $meta[ 'uri' ] == $deleteuri ) {
						printf( __( "Deleting wp-cache file: <strong>%s</strong><br />", 'wp-super-cache' ), $deleteuri );
						@unlink( $blog_cache_dir . 'meta/' . $file );
						@unlink( $blog_cache_dir . $content_file );
						continue;
					}
					$meta[ 'age' ] = $age;
					if ( $cache_max_time > 0 && $age > $cache_max_time ) {
						$expired_list[ $age ][] = $meta;
					} else {
						$cached_list[ $age ][] = $meta;
					}
				}

				if ( $cache_max_time > 0 && $age > $cache_max_time ) {
					$expired++;
				} else {
					$count++;
				}
				$wp_cache_fsize += $fsize;
				$fsize = intval($fsize/1024);
			}
		}
		closedir($handle);
	}
	if( $wp_cache_fsize != 0 ) {
		$wp_cache_fsize = $wp_cache_fsize/1024;
	} else {
		$wp_cache_fsize = 0;
	}
	if( $wp_cache_fsize > 1024 ) {
		$wp_cache_fsize = number_format( $wp_cache_fsize / 1024, 2 ) . "MB";
	} elseif( $wp_cache_fsize != 0 ) {
		$wp_cache_fsize = number_format( $wp_cache_fsize, 2 ) . "KB";
	} else {
		$wp_cache_fsize = '0KB';
	}
	if( $cache_enabled == true && $super_cache_enabled == true ) {
		$now = time();
		$sizes = array( 'expired' => 0, 'expired_list' => array(), 'cached' => 0, 'cached_list' => array(), 'ts' => 0 );

		if (is_dir($supercachedir)) {
			if( $dh = opendir( $supercachedir ) ) {
				while( ( $entry = readdir( $dh ) ) !== false ) {
					if ($entry != '.' && $entry != '..') {
						$sizes = wpsc_dirsize( trailingslashit( $supercachedir ) . $entry, $sizes );
					}
				}
				closedir($dh);
			}
		} else {
			$filem = @filemtime( $supercachedir );
			if ( false == $wp_cache_preload_on && is_file( $supercachedir ) && $cache_max_time > 0 && $filem + $cache_max_time <= $now ) {
				$sizes[ 'expired' ] ++;
				if ( $valid_nonce && $_GET[ 'listfiles' ] )
					$sizes[ 'expired_list' ][ str_replace( $cache_path . 'supercache/' , '', $supercachedir ) ] = $now - $filem;
			} else {
				if ( $valid_nonce && $_GET[ 'listfiles' ] && $filem )
					$sizes[ 'cached_list' ][ str_replace( $cache_path . 'supercache/' , '', $supercachedir ) ] = $now - $filem;
			}
		} 
		$sizes[ 'ts' ] = time();
	}
	$cache_stats = array( 'generated' => time(), 'supercache' => $sizes, 'wpcache' => array( 'cached' => $count, 'expired' => $expired, 'fsize' => $wp_cache_fsize ) );
	update_option( 'supercache_stats', $cache_stats );
	} else {
		echo "<p>" . __( 'Cache stats are not automatically generated. You must click the link below to regenerate the stats on this page.', 'wp-super-cache' ) . "</p>";
		echo "<a href='" . wp_nonce_url( add_query_arg( array( 'page' => 'wpsupercache', 'action' => 'regenerate_cache_stats' ) ), 'wp-cache' ) . "'>" . __( 'Regenerate cache stats' ) . "</a>";
		if ( is_array( $cache_stats ) ) {
			echo "<p>" . sprintf( __( 'Cache stats last generated: %s minutes ago.', 'wp-super-cache' ), number_format( ( time() - $cache_stats[ 'generated' ] ) / 60 ) ) . "</p>";
		}
		$cache_stats = get_option( 'supercache_stats' );
	}// regerate stats cache

	if ( is_array( $cache_stats ) ) {
	echo "<p><strong>" . __( 'WP-Cache', 'wp-super-cache' ) . " ({$cache_stats[ 'wpcache' ][ 'fsize' ]})</strong></p>";
	echo "<ul><li>" . sprintf( __( '%s Cached Pages', 'wp-super-cache' ), $cache_stats[ 'wpcache' ][ 'cached' ] ) . "</li>";
	echo "<li>" . sprintf( __( '%s Expired Pages', 'wp-super-cache' ),    $cache_stats[ 'wpcache' ][ 'expired' ] ) . "</li></ul>";
	$divisor = $cache_compression == 1 ? 2 : 1;
	if( $cache_enabled == true && $super_cache_enabled == true ) {
		$fsize = $cache_stats[ 'supercache' ][ 'fsize' ] / 1024;
		if( $fsize > 1024 ) {
			$fsize = number_format( $fsize / 1024, 2 ) . "MB";
		} elseif( $fsize != 0 ) {
			$fsize = number_format( $fsize, 2 ) . "KB";
		} else {
			$fsize = "0KB";
		}
		echo "<p><strong>" . __( 'WP-Super-Cache', 'wp-super-cache' ) . " ({$fsize})</strong></p>";
		echo "<ul><li>" . sprintf( __( '%s Cached Pages', 'wp-super-cache' ), intval( $cache_stats[ 'supercache' ][ 'cached' ] / $divisor ) ) . "</li>";
		$age = intval(($now - $sizes['ts'])/60);
		echo "<li>" . sprintf( __( '%s Expired Pages', 'wp-super-cache' ), intval( $cache_stats[ 'supercache' ][ 'expired' ] / $divisor ) ) . "</li></ul>";
	}
	if ( $valid_nonce && $_GET[ 'listfiles' ] ) {
		echo "<div style='padding: 10px; border: 1px solid #333; height: 400px; width: 70%; overflow: auto'>";
		if ( is_array( $cached_list ) && !empty( $cached_list ) ) {
			echo "<h4>" . __( 'Fresh WP-Cached Files', 'wp-super-cache' ) . "</h4>";
			echo "<table class='widefat'><tr><th>#</th><th>" . __( 'URI', 'wp-super-cache' ) . "</th><th>" . __( 'Key', 'wp-super-cache' ) . "</th><th>" . __( 'Age', 'wp-super-cache' ) . "</th><th>" . __( 'Delete', 'wp-super-cache' ) . "</th></tr>";
			$c = 1;
			$flip = 1;
			ksort( $cached_list );
			foreach( $cached_list as $age => $d ) {
				foreach( $d as $details ) {
				$bg = $flip ? 'style="background: #EAEAEA;"' : '';
				echo "<tr $bg><td>$c</td><td> <a href='http://{$details[ 'uri' ]}'>" . $details[ 'uri' ] . "</a></td><td> " . str_replace( $details[ 'uri' ], '', $details[ 'key' ] ) . "</td><td> {$age}</td><td><a href='" . wp_nonce_url( add_query_arg( array( 'page' => 'wpsupercache', 'action' => 'deletewpcache', 'uri' => base64_encode( $details[ 'uri' ] ) ) ), 'wp-cache' ) . "#listfiles'>X</a></td></tr>\n";
				$flip = !$flip;
				$c++;
				}
			}
			echo "</table>";
		}
		if ( is_array( $expired_list ) && !empty( $expired_list ) ) {
			echo "<h4>" . __( 'Stale WP-Cached Files', 'wp-super-cache' ) . "</h4>";
			echo "<table class='widefat'><tr><th>#</th><th>" . __( 'URI', 'wp-super-cache' ) . "</th><th>" . __( 'Key', 'wp-super-cache' ) . "</th><th>" . __( 'Age', 'wp-super-cache' ) . "</th><th>" . __( 'Delete', 'wp-super-cache' ) . "</th></tr>";
			$c = 1;
			$flip = 1;
			ksort( $expired_list );
			foreach( $expired_list as $age => $d ) {
				foreach( $d as $details ) {
				$bg = $flip ? 'style="background: #EAEAEA;"' : '';
				echo "<tr $bg><td>$c</td><td> <a href='http://{$details[ 'uri' ]}'>" . $details[ 'uri' ] . "</a></td><td> " . str_replace( $details[ 'uri' ], '', $details[ 'key' ] ) . "</td><td> {$age}</td><td><a href='" . wp_nonce_url( add_query_arg( array( 'page' => 'wpsupercache', 'action' => 'deletewpcache', 'uri' => base64_encode( $details[ 'uri' ] ) ) ), 'wp-cache' ) . "#listfiles'>X</a></td></tr>\n";
				$flip = !$flip;
				$c++;
				}
			}
			echo "</table>";
		}
		if ( is_array( $sizes[ 'cached_list' ] ) & !empty( $sizes[ 'cached_list' ] ) ) {
			echo "<h4>" . __( 'Fresh Super Cached Files', 'wp-super-cache' ) . "</h4>";
			echo "<table class='widefat'><tr><th>#</th><th>" . __( 'URI', 'wp-super-cache' ) . "</th><th>" . __( 'Age', 'wp-super-cache' ) . "</th><th>" . __( 'Delete', 'wp-super-cache' ) . "</th></tr>";
			$c = 1;
			$flip = 1;
			ksort( $sizes[ 'cached_list' ] );
			foreach( $sizes[ 'cached_list' ] as $age => $d ) {
				foreach( $d as $uri => $n ) {
				$bg = $flip ? 'style="background: #EAEAEA;"' : '';
				echo "<tr $bg><td>$c</td><td> <a href='http://{$uri}'>" . $uri . "</a></td><td>$age</td><td><a href='" . wp_nonce_url( add_query_arg( array( 'page' => 'wpsupercache', 'action' => 'deletesupercache', 'uri' => base64_encode( $uri ) ) ), 'wp-cache' ) . "#listfiles'>X</a></td></tr>\n";
				$flip = !$flip;
				$c++;
				}
			}
			echo "</table>";
		}
		if ( is_array( $sizes[ 'expired_list' ] ) && !empty( $sizes[ 'expired_list' ] ) ) {
			echo "<h4>" . __( 'Stale Super Cached Files', 'wp-super-cache' ) . "</h4>";
			echo "<table class='widefat'><tr><th>#</th><th>" . __( 'URI', 'wp-super-cache' ) . "</th><th>" . __( 'Age', 'wp-super-cache' ) . "</th><th>" . __( 'Delete', 'wp-super-cache' ) . "</th></tr>";
			$c = 1;
			$flip = 1;
			ksort( $sizes[ 'expired_list' ] );
			foreach( $sizes[ 'expired_list' ] as $age => $d ) {
				foreach( $d as $uri => $n ) {
				$bg = $flip ? 'style="background: #EAEAEA;"' : '';
				echo "<tr $bg><td>$c</td><td> <a href='http://{$uri}'>" . $uri . "</a></td><td>$age</td><td><a href='" . wp_nonce_url( add_query_arg( array( 'page' => 'wpsupercache', 'action' => 'deletesupercache', 'uri' => base64_encode( $uri ) ) ), 'wp-cache' ) . "#listfiles'>X</a></td></tr>\n";
				$flip = !$flip;
				$c++;
				}
			}
			echo "</table>";
		}
		echo "</div>";
		echo "<p><a href='?page=wpsupercache#top'>" . __( 'Hide file list', 'wp-super-cache' ) . "</a></p>";
	} elseif ( $cache_stats[ 'supercache' ][ 'cached' ] > 300 || $cache_stats[ 'supercache' ][ 'expired' ] > 300 || ( $cache_stats[ 'wpcache' ][ 'cached' ] / $divisor ) > 300 || ( $cache_stats[ 'wpcache' ][ 'expired' ] / $divisor) > 300 ) {
		echo "<p><em>" . __( 'Too many cached files, no listing possible.', 'wp-super-cache' ) . "</em></p>";
	}
	$last_gc = get_option( "wpsupercache_gc_time" );
	if ( $cache_max_time > 0 && $last_gc ) {
		$next_gc = $cache_max_time < 1800 ? $cache_max_time : 600;
		$next_gc_mins = ( time() - $last_gc );
		echo "<p>" . sprintf( __( '<strong>Garbage Collection</strong><br />Last GC was <strong>%s</strong> minutes ago<br />', 'wp-super-cache' ), date( 'i:s', $next_gc_mins ) );
		printf( __( "Next GC in <strong>%s</strong> minutes", 'wp-super-cache' ), date( 'i:s', $next_gc - $next_gc_mins ) ) . "</p>";
	}
	if ( $cache_max_time > 0 )
		echo "<p>" . sprintf( __( 'Expired files are files older than %s seconds. They are still used by the plugin and are deleted periodically.', 'wp-super-cache' ), $cache_max_time ) . "</p>";
	} // cache_stats
	wp_cache_delete_buttons();

	echo '</fieldset>';
}

function wp_cache_delete_buttons() {

	echo '<form name="wp_cache_content_expired" action="#listfiles" method="post">';
	echo '<input type="hidden" name="wp_delete_expired" />';
	echo '<div class="submit" style="float:left"><input type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Delete Expired', 'wp-super-cache' ) . ' &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";

	echo '<form name="wp_cache_content_delete" action="#listfiles" method="post">';
	echo '<input type="hidden" name="wp_delete_cache" />';
	echo '<div class="submit" style="float:left;margin-left:10px"><input id="deletepost" type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Delete Cache', 'wp-super-cache' ) . ' &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
}

function delete_cache_dashboard() {
	if( function_exists( 'is_site_admin' ) && !is_site_admin() )
		return false;

	if( function_exists('current_user_can') && !current_user_can('manage_options') )
		return false;

	echo "<li><a href='" . wp_nonce_url( 'options-general.php?page=wpsupercache&wp_delete_cache=1', 'wp-cache' ) . "' target='_blank' title='" . __( 'Delete Super Cache cached files (opens in new window)', 'wp-super-cache' ) . "'>" . __( 'Delete Cache', 'wp-super-cache' ) . "</a></li>";
}
add_action( 'dashmenu', 'delete_cache_dashboard' );

function wpsc_dirsize($directory, $sizes) {
	global $cache_max_time, $cache_path, $valid_nonce, $wp_cache_preload_on;
	$now = time();

	if (is_dir($directory)) {
		if( $dh = opendir( $directory ) ) {
			while( ( $entry = readdir( $dh ) ) !== false ) {
				if ($entry != '.' && $entry != '..') {
					$sizes = wpsc_dirsize( trailingslashit( $directory ) . $entry, $sizes );
				}
			}
			closedir($dh);
		}
	} else {
		if(is_file($directory) ) {
			$filem = filemtime( $directory );
			if ( $wp_cache_preload_on == false && $cache_max_time > 0 && $filem + $cache_max_time <= $now ) {
				$sizes[ 'expired' ]+=1;
				if ( $valid_nonce && $_GET[ 'listfiles' ] )
					$sizes[ 'expired_list' ][ $now - $filem ][ str_replace( $cache_path . 'supercache/' , '', str_replace( 'index.html', '', str_replace( 'index.html.gz', '', $directory ) ) ) ] = 1;
			} else {
				$sizes[ 'cached' ]+=1;
				if ( $valid_nonce && $_GET[ 'listfiles' ] )
					$sizes[ 'cached_list' ][ $now - $filem ][ str_replace( $cache_path . 'supercache/' , '', str_replace( 'index.html', '', str_replace( 'index.html.gz', '', $directory ) ) ) ] = 1;
			}
			if ( ! isset( $sizes[ 'fsize' ] ) )
				$sizes[ 'fsize' ] = @filesize( $directory );
			else
				$sizes[ 'fsize' ] += @filesize( $directory );
		}
	}
	return $sizes;
}


function wp_cache_clean_cache($file_prefix) {
	global $cache_path, $supercachedir, $blog_cache_dir, $wp_cache_object_cache;

	if ( $wp_cache_object_cache && function_exists( "reset_oc_version" ) )
		reset_oc_version();

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
		} elseif ( isset( $GLOBALS[ 'wp_super_cache_debug' ] ) && $GLOBALS[ 'wp_super_cache_debug' ] ) wp_cache_debug( 'Warning! prune_super_cache() not found in wp-cache.php', 1 );
		return wp_cache_phase2_clean_cache($file_prefix);
	} elseif ( isset( $GLOBALS[ 'wp_super_cache_debug' ] ) && $GLOBALS[ 'wp_super_cache_debug' ] ) wp_cache_debug( 'Warning! wp_cache_phase2_clean_cache() not found in wp-cache.php', 1 );

	$expr = "/^$file_prefix/";
	if ( ($handle = @opendir( $blog_cache_dir )) ) { 
		while ( false !== ($file = readdir($handle))) {
			if ( preg_match($expr, $file) ) {
				@unlink( $blog_cache_dir . $file);
				@unlink( $blog_cache_dir . 'meta/' . str_replace( '.html', '.meta', $file ) );
			}
		}
		closedir($handle);
	}
}

function wp_cache_clean_expired($file_prefix) {
	global $cache_path, $cache_max_time, $blog_cache_dir;

	if ( $cache_max_time == 0 ) {
		return false;
	}

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
	if ( ($handle = @opendir( $blog_cache_dir )) ) { 
		while ( false !== ($file = readdir($handle))) {
			if ( preg_match( $expr, $file )  &&
				( filemtime( $blog_cache_dir . $file ) + $cache_max_time ) <= $now ) {
				@unlink( $blog_cache_dir . $file );
				@unlink( $blog_cache_dir . 'meta/' . str_replace( '.html', '.meta', $file ) );
			}
		}
		closedir($handle);
	}
}

function wpsc_remove_marker( $filename, $marker ) {
	if (!file_exists( $filename ) || is_writeable_ACLSafe( $filename ) ) {
		if (!file_exists( $filename ) ) {
			return '';
		} else {
			$markerdata = explode( "\n", implode( '', file( $filename ) ) );
		}

		$f = fopen( $filename, 'w' );
		$foundit = false;
		if ( $markerdata ) {
			$state = true;
			foreach ( $markerdata as $n => $markerline ) {
				if (strpos($markerline, '# BEGIN ' . $marker) !== false)
					$state = false;
				if ( $state ) {
					if ( $n + 1 < count( $markerdata ) )
						fwrite( $f, "{$markerline}\n" );
					else
						fwrite( $f, "{$markerline}" );
				}
				if (strpos($markerline, '# END ' . $marker) !== false) {
					$state = true;
				}
			}
		}
		return true;
	} else {
		return false;
	}
}

function wp_super_cache_footer() {
	?><p id='supercache'><?php printf( __( '%1$s is Digg proof thanks to caching by %2$s', 'wp-super-cache' ), bloginfo( 'name' ), '<a href="http://ocaoimh.ie/wp-super-cache/">WP Super Cache</a>' ); ?></p><?php
}
if( isset( $wp_cache_hello_world ) && $wp_cache_hello_world )
	add_action( 'wp_footer', 'wp_super_cache_footer' );

if( get_option( 'gzipcompression' ) )
	update_option( 'gzipcompression', 0 );

// Catch 404 requests. Themes that use query_posts() destroy $wp_query->is_404
function wp_cache_catch_404() {
	global $wp_cache_404;
	$wp_cache_404 = false;
	if( is_404() )
		$wp_cache_404 = true;
}
add_action( 'template_redirect', 'wp_cache_catch_404' );

function wp_cache_favorite_action( $actions ) {
	if( function_exists( 'is_site_admin' ) && !is_site_admin() )
		return $actions;

	if( function_exists('current_user_can') && !current_user_can('manage_options') )
		return $actions;

	$actions[ wp_nonce_url( 'options-general.php?page=wpsupercache&wp_delete_cache=1', 'wp-cache' ) ] = array( __( 'Delete Cache', 'wp-super-cache' ), 'manage_options' );

	return $actions;
}
add_filter( 'favorite_actions', 'wp_cache_favorite_action' );

function wp_cache_plugin_notice( $plugin ) {
	global $cache_enabled;
 	if( $plugin == 'wp-super-cache/wp-cache.php' && !$cache_enabled && function_exists( "admin_url" ) )
		echo '<td colspan="5" class="plugin-update">' . sprintf( __( 'WP Super Cache must be configured. Go to <a href="%s">the admin page</a> to enable and configure the plugin.' ), admin_url( 'options-general.php?page=wpsupercache' ) ) . '</td>';
}
add_action( 'after_plugin_row', 'wp_cache_plugin_notice' );

function wp_cache_plugin_actions( $links, $file ) {
 	if( $file == 'wp-super-cache/wp-cache.php' && function_exists( "admin_url" ) ) {
		$settings_link = '<a href="' . admin_url( 'options-general.php?page=wpsupercache' ) . '">' . __('Settings') . '</a>';
		array_unshift( $links, $settings_link ); // before other links
	}
	return $links;
}
add_filter( 'plugin_action_links', 'wp_cache_plugin_actions', 10, 2 );

function wp_cache_admin_notice() {
	global $cache_enabled;
	if( substr( $_SERVER["PHP_SELF"], -11 ) == 'plugins.php' && !$cache_enabled && function_exists( "admin_url" ) )
		echo '<div class="error"><p><strong>' . sprintf( __('WP Super Cache is disabled. Please go to the <a href="%s">plugin admin page</a> to enable caching.', 'wp-super-cache' ), admin_url( 'options-general.php?page=wpsupercache' ) ) . '</strong></p></div>';
}
add_action( 'admin_notices', 'wp_cache_admin_notice' );

function wp_cache_check_site() {
	global $wp_super_cache_front_page_check, $wp_super_cache_front_page_clear, $wp_super_cache_front_page_text, $wp_super_cache_front_page_notification;

	if ( !isset( $wp_super_cache_front_page_check ) || ( isset( $wp_super_cache_front_page_check ) && $wp_super_cache_front_page_check == 0 ) ) {
		return false;
	}

	if ( function_exists( "wp_remote_get" ) == false ) {
		return false;
	}
	$front_page = wp_remote_get( site_url(), array('timeout' => 60, 'blocking' => true ) );
	if( is_array( $front_page ) ) {
		// Check for gzipped front page
                if ( $front_page[ 'headers' ][ 'content-type' ] == 'application/x-gzip' ) {
                        if ( !isset( $wp_super_cache_front_page_clear ) || ( isset( $wp_super_cache_front_page_clear ) && $wp_super_cache_front_page_clear == 0 ) ) {
                                wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Front page is gzipped! Please clear cache!', 'wp-super-cache' ), site_url() ), sprintf( __( "Please visit %s to clear the cache as the front page of your site is now downloading!", 'wp-super-cache' ), trailingslashit( site_url() ) . "wp-admin/options-general.php?page=wpsupercache" ) );
                        } else {
                                wp_cache_clear_cache();
                                wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Front page is gzipped! Cache Cleared!', 'wp-super-cache' ), site_url() ), sprintf( __( "The cache on your blog has been cleared because the front page of your site is now downloading. Please visit %s to verify the cache has been cleared.", 'wp-super-cache' ), trailingslashit( site_url() ) . "wp-admin/options-general.php?page=wpsupercache" ) );
                        }
                }

		// Check for broken front page
		if ( isset( $wp_super_cache_front_page_text ) && $wp_super_cache_front_page_text != '' && false === strpos( $front_page[ 'body' ], $wp_super_cache_front_page_text ) ) {
			if ( !isset( $wp_super_cache_front_page_clear ) || ( isset( $wp_super_cache_front_page_clear ) && $wp_super_cache_front_page_clear == 0 ) ) {
                                wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Front page is not correct! Please clear cache!', 'wp-super-cache' ), site_url() ), sprintf( __( 'Please visit %1$s to clear the cache as the front page of your site is not correct and missing the text, "%2$s"!', 'wp-super-cache' ), trailingslashit( site_url() ) . "wp-admin/options-general.php?page=wpsupercache", $wp_super_cache_front_page_text ) );
                        } else {
                                wp_cache_clear_cache();
                                wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Front page is not correct! Cache Cleared!', 'wp-super-cache' ), site_url() ), sprintf( __( 'The cache on your blog has been cleared because the front page of your site is missing the text "%2$s". Please visit %1$s to verify the cache has been cleared.', 'wp-super-cache' ), trailingslashit( site_url() ) . "wp-admin/options-general.php?page=wpsupercache", $wp_super_cache_front_page_text ) );
			}
		}
	}
	if ( isset( $wp_super_cache_front_page_notification ) && $wp_super_cache_front_page_notification == 1 ) {
		wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Front page check!', 'wp-super-cache' ), site_url() ), sprintf( __( "WP Super Cache has checked the front page of your blog. Please visit %s if you would like to disable this.", 'wp-super-cache' ) . "\n\n", trailingslashit( site_url() ) . "wp-admin/options-general.php?page=wpsupercache#debug" ) . print_r( $front_page, 1 ) );
	}

	if ( !wp_next_scheduled( 'wp_cache_check_site_hook' ) ) {
		wp_schedule_single_event( time() + 360 , 'wp_cache_check_site_hook' );
		if ( isset( $GLOBALS[ 'wp_super_cache_debug' ] ) && $GLOBALS[ 'wp_super_cache_debug' ] ) wp_cache_debug( 'scheduled wp_cache_check_site_hook for 360 seconds time.', 2 );
	}
}
add_action( 'wp_cache_check_site_hook', 'wp_cache_check_site' );

function update_cached_mobile_ua_list( $mobile_browsers, $mobile_prefixes = 0, $mobile_groups = 0 ) {
	global $wp_cache_config_file, $wp_cache_mobile_browsers, $wp_cache_mobile_prefixes, $wp_cache_mobile_groups;
	if ( is_array( $mobile_browsers ) ) {
		$wp_cache_mobile_browsers = $mobile_browsers;
		wp_cache_replace_line('^ *\$wp_cache_mobile_browsers', "\$wp_cache_mobile_browsers = '" . implode( ', ', $mobile_browsers ) . "';", $wp_cache_config_file);
	}
	if ( is_array( $mobile_prefixes ) ) {
		$wp_cache_mobile_prefixes = $mobile_prefixes;
		wp_cache_replace_line('^ *\$wp_cache_mobile_prefixes', "\$wp_cache_mobile_prefixes = '" . implode( ', ', $mobile_prefixes ) . "';", $wp_cache_config_file);
	}
	if ( is_array( $mobile_groups ) ) {
		$wp_cache_mobile_groups = $mobile_groups;
		wp_cache_replace_line('^ *\$wp_cache_mobile_groups', "\$wp_cache_mobile_groups = '" . implode( ', ', $mobile_groups ) . "';", $wp_cache_config_file);
	}
	
	return true;
}

function wpsc_update_htaccess() {
	extract( wpsc_get_htaccess_info() );
	wpsc_remove_marker( $home_path.'.htaccess', 'WordPress' ); // remove original WP rules so SuperCache rules go on top
	if( insert_with_markers( $home_path.'.htaccess', 'WPSuperCache', explode( "\n", $rules ) ) && insert_with_markers( $home_path.'.htaccess', 'WordPress', explode( "\n", $wprules ) ) ) {
		return true;
	} else {
		return false;
	}
}

function wpsc_update_htaccess_form( $short_form = true ) {
	global $wpmu_version;

	extract( wpsc_get_htaccess_info() );
	if( !is_writeable_ACLSafe( $home_path . ".htaccess" ) ) {
		echo "<div style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><h4>" . __( 'Cannot update .htaccess', 'wp-super-cache' ) . "</h4><p>" . sprintf( __( 'The file <code>%s.htaccess</code> cannot be modified by the web server. Please correct this using the chmod command or your ftp client.', 'wp-super-cache' ), $home_path ) . "</p><p>" . __( 'Refresh this page when the file permissions have been modified.' ) . "</p><p>" . sprintf( __( 'Alternatively, you can edit your <code>%s.htaccess</code> file manually and add the following code (before any WordPress rules):', 'wp-super-cache' ), $home_path ) . "</p>";
		echo "<p><pre># BEGIN WPSuperCache\n" . wp_specialchars( $rules ) . "# END WPSuperCache</pre></p></div>";
	} else {
		if ( $short_form == false ) {
			echo "<div style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><p>" . sprintf( __( 'To serve static html files your server must have the correct mod_rewrite rules added to a file called <code>%s.htaccess</code>', 'wp-super-cache' ), $home_path ) . " ";
			if( !function_exists( 'is_site_admin' ) ) {
				_e( "You must edit the file yourself add the following rules.", 'wp-super-cache' );
			} else {
				_e( "You can edit the file yourself add the following rules.", 'wp-super-cache' );
			}
			echo __( " Make sure they appear before any existing WordPress rules. ", 'wp-super-cache' ) . "</p>";
			echo "<pre># BEGIN WPSuperCache\n" . wp_specialchars( $rules ) . "# END WPSuperCache</pre></p>";
			echo "<p>" . sprintf( __( 'Rules must be added to %s too:', 'wp-super-cache' ), WP_CONTENT_DIR . "/cache/.htaccess" ) . "</p>";
			echo "<pre># BEGIN supercache\n" . wp_specialchars( $gziprules ) . "# END supercache</pre></p>";
		}
		if ( !isset( $wpmu_version ) || $wpmu_version == '' ) {
			echo '<form name="updatehtaccess" action="#modrewrite" method="post">';
			echo '<input type="hidden" name="updatehtaccess" value="1" />';
			echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'id="updatehtaccess" value="' . __( 'Update Mod_Rewrite Rules', 'wp-super-cache' ) . ' &raquo;" /></div>';
			wp_nonce_field('wp-cache');
			echo "</form></div>\n";
		}
	}
}

function wpsc_get_htaccess_info() {
	global $wp_cache_mobile_prefixes, $wp_cache_mobile_browsers;
	if ( isset( $_SERVER[ "PHP_DOCUMENT_ROOT" ] ) ) {
		$document_root = $_SERVER[ "PHP_DOCUMENT_ROOT" ];
		$apache_root = $_SERVER[ "PHP_DOCUMENT_ROOT" ];
	} else {
		$document_root = $_SERVER[ "DOCUMENT_ROOT" ];
		$apache_root = '%{DOCUMENT_ROOT}';
	}
	$home_path = get_home_path();
	$home_root = parse_url(get_bloginfo('url'));
	$home_root = isset( $home_root['path'] ) ? trailingslashit( $home_root['path'] ) : '/';
	$inst_root = str_replace( '//', '/', '/' . trailingslashit( str_replace( $document_root, '', str_replace( '\\', '/', WP_CONTENT_DIR ) ) ) );
	$wprules = implode( "\n", extract_from_markers( $home_path.'.htaccess', 'WordPress' ) );
	$wprules = str_replace( "RewriteEngine On\n", '', $wprules );
	$wprules = str_replace( "RewriteBase $home_root\n", '', $wprules );
	$scrules = implode( "\n", extract_from_markers( $home_path.'.htaccess', 'WPSuperCache' ) );

	if( substr( get_option( 'permalink_structure' ), -1 ) == '/' ) {
		$condition_rules[] = "RewriteCond %{REQUEST_URI} !^.*[^/]$";
		$condition_rules[] = "RewriteCond %{REQUEST_URI} !^.*//.*$";
	}
	$condition_rules[] = "RewriteCond %{REQUEST_METHOD} !POST";
	$condition_rules[] = "RewriteCond %{QUERY_STRING} !.*=.*";
	$condition_rules[] = "RewriteCond %{HTTP:Cookie} !^.*(comment_author_|wordpress_logged_in|wp-postpass_).*$";
	$condition_rules[] = "RewriteCond %{HTTP:X-Wap-Profile} !^[a-z0-9\\\"]+ [NC]";
	$condition_rules[] = "RewriteCond %{HTTP:Profile} !^[a-z0-9\\\"]+ [NC]";
	$condition_rules[] = "RewriteCond %{HTTP_USER_AGENT} !^.*(" . addcslashes( implode( '|', $wp_cache_mobile_browsers ), ' ' ) . ").*";
	$condition_rules[] = "RewriteCond %{HTTP_user_agent} !^(" . addcslashes( implode( '|', $wp_cache_mobile_prefixes ), ' ' ) . ").*";
	$condition_rules = apply_filters( 'supercacherewriteconditions', $condition_rules );

	$rules = "<IfModule mod_rewrite.c>\n";
	$rules .= "RewriteEngine On\n";
	$rules .= "RewriteBase $home_root\n"; // props Chris Messina
	$charset = get_option('blog_charset') == '' ? 'UTF-8' : get_option('blog_charset');
	$rules .= "AddDefaultCharset {$charset}\n";
	$rules .= "CONDITION_RULES";
	$rules .= "RewriteCond %{HTTP:Accept-Encoding} gzip\n";
	$rules .= "RewriteCond {$apache_root}{$inst_root}cache/supercache/%{HTTP_HOST}{$home_root}$1/index.html.gz -f\n";
	$rules .= "RewriteRule ^(.*) \"{$inst_root}cache/supercache/%{HTTP_HOST}{$home_root}$1/index.html.gz\" [L]\n\n";

	$rules .= "CONDITION_RULES";
	$rules .= "RewriteCond {$apache_root}{$inst_root}cache/supercache/%{HTTP_HOST}{$home_root}$1/index.html -f\n";
	$rules .= "RewriteRule ^(.*) \"{$inst_root}cache/supercache/%{HTTP_HOST}{$home_root}$1/index.html\" [L]\n";
	$rules .= "</IfModule>\n";
	$rules = apply_filters( 'supercacherewriterules', $rules );

	$rules = str_replace( "CONDITION_RULES", implode( "\n", $condition_rules ) . "\n", $rules );

	$gziprules =  "<IfModule mod_mime.c>\n  <FilesMatch \"\\.html\\.gz\$\">\n    ForceType text/html\n    FileETag None\n  </FilesMatch>\n  AddEncoding gzip .gz\n  AddType text/html .gz\n</IfModule>\n";
	$gziprules .= "<IfModule mod_deflate.c>\n  SetEnvIfNoCase Request_URI \.gz$ no-gzip\n</IfModule>\n";
	$gziprules .= "<IfModule mod_headers.c>\n  Header set Vary \"Accept-Encoding, Cookie\"\n  Header set Cache-Control 'max-age=300, must-revalidate'\n</IfModule>\n";
	$gziprules .= "<IfModule mod_expires.c>\n  ExpiresActive On\n  ExpiresByType text/html A300\n</IfModule>\n";
	return array( "document_root" => $document_root, "apache_root" => $apache_root, "home_path" => $home_path, "home_root" => $home_root, "inst_root" => $inst_root, "wprules" => $wprules, "scrules" => $scrules, "condition_rules" => $condition_rules, "rules" => $rules, "gziprules" => $gziprules );
}

function clear_post_supercache( $post_id ) {
	$dir = get_current_url_supercache_dir( $post_id );
	if ( file_exists( $dir . 'index.html' ) ) {
		unlink( $dir . 'index.html' );
	}
	if ( file_exists( $dir . 'index.html.gz' ) ) {
		unlink( $dir . 'index.html.gz' );
	}
}

function wp_cron_preload_cache() {
	global $wpdb, $wp_cache_preload_interval, $wp_cache_preload_posts, $wp_cache_preload_email_me, $wp_cache_preload_email_volume;

	if ( get_option( 'preload_cache_stop' ) ) {
		delete_option( 'preload_cache_stop' );
		return true;
	}

	$c = (int)get_option( 'preload_cache_counter' );
	if ( $wp_cache_preload_posts == 'all' || $c <= $wp_cache_preload_posts ) {
		$posts = $wpdb->get_col( "SELECT ID FROM {$wpdb->posts} WHERE post_status = 'publish' ORDER BY post_date DESC LIMIT $c, 100" );
	} else {
		$posts = false;
	}
	if ( !isset( $wp_cache_preload_email_volume ) )
		$wp_cache_preload_email_volume = 'medium';

	update_option( 'preload_cache_counter', ($c + 100) );
	if ( $posts ) {
		if ( $wp_cache_preload_email_me && $c == 0 )
			wp_mail( get_option( 'admin_email' ), sprintf( __( '[%1$s] Cache Preload Started', 'wp-super-cache' ), site_url(), '' ), '' );
		if ( $wp_cache_preload_email_me && $wp_cache_preload_email_volume == 'many' )
			wp_mail( get_option( 'admin_email' ), sprintf( __( '[%1$s] Refreshing posts from %2$d to %3$d', 'wp-super-cache' ), site_url(), $c, ($c+100) ), '' );
		$msg = '';
		$count = $c + 1;
		foreach( $posts as $post_id ) {
			clear_post_supercache( $post_id );
			$url = get_permalink( $post_id );
			$msg .= "$url\n";
			wp_remote_get( $url, array('timeout' => 60, 'blocking' => true ) );
			$count++;
		}
		if ( $wp_cache_preload_email_me && $wp_cache_preload_email_volume != 'less' )
			wp_mail( get_option( 'admin_email' ), sprintf( __( '[%1$s] %2$d posts refreshed', 'wp-super-cache' ), $_SERVER[ 'HTTP_HOST' ], ($c+100) ), __( "Refreshed the following posts:", 'wp-super-cache' ) . "\n$msg" );
		if ( defined( 'DOING_CRON' ) ) {
			wp_schedule_single_event( time() + 30, 'wp_cache_preload_hook' );
		}
	} else {
		$msg = '';
		update_option( 'preload_cache_counter', 0 );
		if ( (int)$wp_cache_preload_interval && defined( 'DOING_CRON' ) ) {
			if ( $wp_cache_preload_email_me )
				$msg = sprintf( __( 'Scheduling next preload refresh in %d minutes.', 'wp-super-cache' ), (int)$wp_cache_preload_interval );
			wp_schedule_single_event( time() + ( (int)$wp_cache_preload_interval * 60 ), 'wp_cache_full_preload_hook' );
		}
		global $file_prefix, $cache_max_time;
		if ( $wp_cache_preload_interval > 0 ) {
			$cache_max_time = (int)$wp_cache_preload_interval * 60; // fool the GC into expiring really old files
		} else {
			$cache_max_time = 86400; // fool the GC into expiring really old files
		}
		if ( $wp_cache_preload_email_me )
			wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Cache Preload Completed', 'wp-super-cache' ), site_url() ), __( "Cleaning up old supercache files.", 'wp-super-cache' ) . "\n" . $msg );
		wp_cache_phase2_clean_expired( $file_prefix, true ); // force cleanup of old files.
	}
}
add_action( 'wp_cache_preload_hook', 'wp_cron_preload_cache' );
add_action( 'wp_cache_full_preload_hook', 'wp_cron_preload_cache' );

function next_preload_message( $hook, $text, $limit = 0 ) {
	global $currently_preloading, $wp_cache_preload_interval;
	if ( $next_preload = wp_next_scheduled( $hook ) ) {
		$next_time = $next_preload - time();
		if ( $limit != 0 && $next_time > $limit )
			return false;
		$h = $m = $s = 0;
		if ( $next_time > 0 ) {
			// http://bytes.com/topic/php/answers/3917-seconds-converted-hh-mm-ss
			$m = (int)($next_time / 60);
			$s = $next_time % 60;
			$h = (int)($m / 60); $m = $m % 60;
		}
		if ( $next_time > 0 && $next_time < ( 60 * $wp_cache_preload_interval ) )
			echo '<p><strong>' . sprintf( __( $text, 'wp-super-cache' ), $h, $m, $s ) . '</strong></p>';
		if ( ( $next_preload - time() ) <= 60 )
			$currently_preloading = true;
	}
}
?>
