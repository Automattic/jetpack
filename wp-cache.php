<?php
/*
Plugin Name: WP Super Cache
Plugin URI: http://ocaoimh.ie/wp-super-cache/
Description: Very fast caching plugin for WordPress.
Version: 0.9.6.1
Author: Donncha O Caoimh
Author URI: http://ocaoimh.ie/
*/

/*  Copyright 2005-2006  Ricardo Galli Granada  (email : gallir@uib.es)
    Some code copyright 2007-2008 Donncha O Caoimh (http://ocaoimh.ie/)

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

include(WPCACHEHOME . 'wp-cache-base.php');


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
			die( 'Please create ' . WP_CONTENT_DIR . '/wp-cache-config.php from wp-super-cache/wp-cache-config-sample.php' );
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
}
register_deactivation_hook( __FILE__, 'wpsupercache_deactivate' );

function wp_cache_add_pages() {
	if( function_exists( 'is_site_admin' ) ) {
		if( is_site_admin() ) {
			add_submenu_page('wpmu-admin.php', __('WP Super Cache'), __('WP Super Cache'), 'manage_options', 'wpsupercache', 'wp_cache_manager');
			add_options_page('WP Super Cache', 'WP Super Cache', 'manage_options', 'wpsupercache', 'wp_cache_manager');
		}
	} else {
		add_options_page('WP Super Cache', 'WP Super Cache', 'manage_options', 'wpsupercache', 'wp_cache_manager');
	}
}
add_action('admin_menu', 'wp_cache_add_pages');

function wp_cache_manager() {
	global $wp_cache_config_file, $valid_nonce, $supercachedir, $cache_path, $cache_enabled, $cache_compression, $super_cache_enabled, $wp_cache_hello_world;
	global $wp_cache_clear_on_post_edit, $cache_rebuild_files, $wp_cache_mutex_disabled, $wp_cache_mobile_enabled, $wp_cache_mobile_whitelist, $wp_cache_mobile_browsers;
	global $wp_cache_cron_check, $wp_cache_debug, $wp_cache_hide_donation, $wp_cache_not_logged_in;

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
	echo "<h2>WP Super Cache Manager</h2>\n";
	if( ini_get( 'safe_mode' ) ) {
		?><h3>Warning! PHP Safe Mode Enabled!</h3>
		<p>You may experience problems running this plugin because SAFE MODE is enabled. <?php
		if( !ini_get( 'safe_mode_gid' ) ) {
			?>Your server is set up to check the owner of PHP scripts before allowing them to read and write files.</p><p>You or an administrator may be able to make it work by changing the group owner of the plugin scripts to match that of the web server user. The group owner of the <?php echo WP_CONTENT_DIR; ?>/cache/ directory must also be changed. See the <a href='http://php.net/features.safe-mode'>safe mode manual page</a> for further details.</p><?php
		} else {
			?>You or an administrator must disable this. See the <a href='http://php.net/features.safe-mode'>safe mode manual page</a> for further details. This cannot be disabled in a .htaccess file unfortunately. It must be done in the php.ini config file.</p><?php
		}
	}
	if(isset($_REQUEST['wp_restore_config']) && $valid_nonce) {
		unlink($wp_cache_config_file);
		echo '<strong>Configuration file changed, some values might be wrong. Load the page again from the "Settings" menu to reset them.</strong>';
	}

	if ( !wp_cache_check_link() ||
		!wp_cache_verify_config_file() ||
		!wp_cache_verify_cache_dir() ) {
		echo "Cannot continue... fix previous problems and retry.";
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
			?><h3>Warning! Your hostname "<?php echo $hostname; ?>" resolves to <?php echo $ip; ?></h3>
			<div style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'>
			<p>Your server thinks your hostname resolves to <?php echo $ip; ?>. Some services such as garbage collection by this plugin, and WordPress scheduled posts may not operate correctly.</p>
			<p>Please see entry 16 in the <a href="http://wordpress.org/extend/plugins/wp-super-cache/faq/">Troubleshooting section</a> of the readme.txt</p>
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
				<p>Unfortunately WordPress cannot find the file wp-cron.php. This script is required for the the correct operation of garbage collection by this plugin, WordPress scheduled posts as well as other critical activities.</p>
				<p>Please see entry 16 in the <a href="http://wordpress.org/extend/plugins/wp-super-cache/faq/">Troubleshooting section</a> of the readme.txt</p>
				</div>
				<?php
			} else {
				wp_cache_replace_line('^ *\$wp_cache_cron_check', "\$wp_cache_cron_check = 1;", $wp_cache_config_file);
			}
		}
	}
	}

	if( $cache_enabled == true && $super_cache_enabled == true && !got_mod_rewrite() ) {
		?><h4 style='color: #a00'>Mod rewrite may not be installed!</h4>
		<p>It appears that mod_rewrite is not installed. Sometimes this check isn't 100% reliable, especially if you are not using Apache. Please verify that the mod_rewrite module is loaded. It is required for serving Super Cache static files. You will still be able to use WP-Cache.</p><?php
	}

	if( !is_writeable_ACLSafe($wp_cache_config_file) ) {
		define( "SUBMITDISABLED", 'disabled style="color: #aaa" ' );
		?><h4 style='text-align:center; color: #a00'>Read Only Mode. Configuration cannot be changed. <a href="javascript:toggleLayer('readonlywarning');" title="Why your configuration may not be changed">Why</a></h4>
		<div id='readonlywarning' style='border: 1px solid #aaa; margin: 2px; padding: 2px; display: none;'>
		<p>The WP Super Cache configuration file is <code><?php echo WP_CONTENT_DIR; ?>/wp-cache-config.php</code> and cannot be modified. The file <?php echo WP_CONTENT_DIR; ?>/wp-cache-config.php must be writeable by the webserver to make any changes.
		A simple way of doing that is by changing the permissions temporarily using the CHMOD command or through your ftp client. Make sure it's globally writeable and it should be fine.
		Writeable: <code>chmod 666 <?php echo WP_CONTENT_DIR; ?>/wp-cache-config.php</code>
		Readonly: <code>chmod 644 <?php echo WP_CONTENT_DIR; ?>/wp-cache-config.php</code></p>
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
			?><h4 style='text-align:center; color: #a00'>Warning! <?php echo WP_CONTENT_DIR; ?> is writeable!</h4>
			<p>You should change the permissions on <?php echo WP_CONTENT_DIR; ?> and make it more restrictive. Use your ftp client, or the following command to fix things:<code>chmod 755 <?php echo WP_CONTENT_DIR; ?>/</code></p><?php
		}
	}

	if ( $valid_nonce ) {
		if( isset( $_POST[ 'wp_cache_status' ] ) ) {
			if( isset( $_POST[ 'wp_cache_mobile_enabled' ] ) ) {
				$wp_cache_mobile_enabled = 1;
			} else {
				$wp_cache_mobile_enabled = 0;
			}
			if( $wp_cache_mobile_enabled == 1 ) {
				if( !isset( $wp_cache_mobile_whitelist ) )
					wp_cache_replace_line('^ *\$wp_cache_mobile_whitelist', "\$wp_cache_mobile_whitelist = 'Stand Alone/QNws';", $wp_cache_config_file);
				if( false == isset( $wp_cache_mobile_browsers ) )
					wp_cache_replace_line('^ *\$wp_cache_mobile_browsers', "\$wp_cache_mobile_browsers = 'Android, 2.0 MMP, 240x320, AvantGo, BlackBerry, Blazer, Cellphone, Danger, DoCoMo, Elaine/3.0, EudoraWeb, hiptop, IEMobile, iPhone, iPod, KYOCERA/WX310K, LG/U990, MIDP-2.0, MMEF20, MOT-V, NetFront, Newt, Nintendo Wii, Nitro, Nokia, Opera Mini, Palm, Playstation Portable, portalmmm, Proxinet, ProxiNet, SHARP-TQ-GX10, Small, SonyEricsson, Symbian OS, SymbianOS, TS21i-10, UP.Browser, UP.Link, Windows CE, WinWAP';", $wp_cache_config_file);
			}
			wp_cache_replace_line('^ *\$wp_cache_mobile_enabled', "\$wp_cache_mobile_enabled = " . $wp_cache_mobile_enabled . ";", $wp_cache_config_file);
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
		}
		if( defined( 'WPSC_DISABLE_COMPRESSION' ) ) {
			$cache_compression_changed = false;
			$cache_compression = 0;
			wp_cache_replace_line('^ *\$cache_compression', "\$cache_compression = " . $cache_compression . ";", $wp_cache_config_file);
		} elseif( isset( $_POST[ 'cache_compression' ] ) && $_POST[ 'cache_compression' ] != $cache_compression ) {
			$cache_compression_changed = true;
			$cache_compression = intval( $_POST[ 'cache_compression' ] );
			wp_cache_replace_line('^ *\$cache_compression', "\$cache_compression = " . $cache_compression . ";", $wp_cache_config_file);
			if( function_exists( 'prune_super_cache' ) )
				prune_super_cache ($cache_path, true);
			delete_option( 'super_cache_meta' );
		}
		if( isset( $_POST[ 'wp_cache_hide_donation' ] ) && $_POST[ 'wp_cache_hide_donation' ] != $wp_cache_hide_donation ) {
			$wp_cache_hide_donation = intval( $_POST[ 'wp_cache_hide_donation' ] );
			wp_cache_replace_line('^ *\$wp_cache_hide_donation', "\$wp_cache_hide_donation = " . $wp_cache_hide_donation . ";", $wp_cache_config_file);
		}
	}

	?>
	<table><td><fieldset class="options" id="show-this-fieldset"> 
	<h3>WP Super Cache Status</h3><?php
	echo '<form name="wp_manager" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	?>
	<label><input type='radio' name='wp_cache_status' value='all' <?php if( $cache_enabled == true && $super_cache_enabled == true ) { echo 'checked=checked'; } ?>> <strong>ON</strong> <span class="setting-description">WP Cache and Super Cache enabled</span></label><br />
	<label><input type='radio' name='wp_cache_status' value='wpcache' <?php if( $cache_enabled == true && $super_cache_enabled == false ) { echo 'checked=checked'; } ?>> <strong>HALF ON</strong> <span class="setting-description">Super Cache Disabled, only legacy WP-Cache caching.</span></label><br />
	<label><input type='radio' name='wp_cache_status' value='none' <?php if( $cache_enabled == false ) { echo 'checked=checked'; } ?>> <strong>OFF</strong> <span class="setting-description">WP Cache and Super Cache disabled</span></label><br />
	<p><label><input type='checkbox' name='wp_cache_not_logged_in' <?php if( $wp_cache_not_logged_in ) echo "checked"; ?> value='1'> Don't cache pages for logged in users.</label></p>
	<p><label><input type='checkbox' name='wp_cache_hello_world' <?php if( $wp_cache_hello_world ) echo "checked"; ?> value='1'> Proudly tell the world your server is Digg proof! (places a message in your blog's footer)</label></p>
	<p><label><input type='checkbox' name='wp_cache_clear_on_post_edit' <?php if( $wp_cache_clear_on_post_edit ) echo "checked"; ?> value='1'> Clear all cache files when a post or page is published. (This may significantly slow down saving of posts.)</label></p>
	<p><label><input type='checkbox' name='cache_rebuild_files' <?php if( $cache_rebuild_files ) echo "checked"; ?> value='1'> Cache rebuild. Serve a supercache file to anonymous users while a new file is being generated. Recommended for <em>very</em> busy websites with lots of comments. Makes "directly cached pages" and "Lockdown mode" obsolete.</label></p>
	<?php if( false == defined( 'WPSC_DISABLE_LOCKING' ) ) { ?>
		<p><label><input type='checkbox' name='wp_cache_mutex_disabled' <?php if( !$wp_cache_mutex_disabled ) echo "checked"; ?> value='0'> Coarse file locking. You probably don't need this but it may help if your server is underpowered. Warning! <em>May cause your server to lock up in very rare cases!</em></label></p>
	<?php } ?>
	<p><label><input type='checkbox' name='wp_cache_mobile_enabled' <?php if( $wp_cache_mobile_enabled ) echo "checked"; ?> value='1'> Mobile device support.</label>
	<?php
	$home_path = trailingslashit( get_home_path() );
	if ( false === strpos( implode( "\n", extract_from_markers( $home_path.'.htaccess', 'WPSuperCache' ) ), 'SHARP-TQ-GX10' ) ) { // we don't have the rewrite rules
	?>
	<blockquote><p>Mobile support requires extra rules in your .htaccess file, or you can set the plugin to half-on mode. Here's your options (in order of difficulty):
	<ol><li> 1. Set the plugin to half on mode and enable mobile support.</li>
	<li> 2. Delete the plugin mod_rewrite rules in <?php echo $home_path; ?>.htaccess enclosed by <code># BEGIN WPSuperCache</code> and <code># END WPSuperCache</code> and let the plugin regenerate them by reloading this page.</li>
	<li> 3. Add the rules yourself. Edit <?php echo $home_path; ?>.htaccess and find the block of code enclosed by the lines <code># BEGIN WPSuperCache</code> and <code># END WPSuperCache</code>. There are two sections that look very similar. Just below the line <code>%{HTTP:Cookie} !^.*(comment_author_|wordpress|wp-postpass_).*$</code> add this line: (do it twice, once for each section)</p>
	<div style='border: 1px solid #333; width:400px; overflow: scroll'><pre>RewriteCond %{HTTP_user_agent} !^.*(Android|2.0\ MMP|240x320|AvantGo|BlackBerry|Blazer|Cellphone|Danger|DoCoMo|Elaine/3.0|EudoraWeb|hiptop|IEMobile|iPhone|iPod|KYOCERA/WX310K|LG/U990|MIDP-2.0|MMEF20|MOT-V|NetFront|Newt|Nintendo\ Wii|Nitro|Nokia|Opera\ Mini|Palm|Playstation\ Portable|portalmmm|Proxinet|ProxiNet|SHARP-TQ-GX10|Small|SonyEricsson|Symbian\ OS|SymbianOS|TS21i-10|UP.Browser|UP.Link|Windows\ CE|WinWAP).*</pre></div></li></ol></blockquote>
	<?php }  ?>
	<p><strong>Note:</strong> If uninstalling this plugin, make sure the directory <em><?php echo WP_CONTENT_DIR; ?></em> is writeable by the webserver so the files <em>advanced-cache.php</em> and <em>cache-config.php</em> can be deleted automatically. (Making sure those files are writeable too is probably a good idea!)</p>
	<p>Uninstall using the <a href="<?php echo WP_PLUGIN_URL; ?>/wp-super-cache/uninstall.php">uninstall script</a> to remove files and directories created by the plugin. (Please see <a href="<?php echo WP_PLUGIN_URL; ?>/wp-super-cache/readme.txt">readme.txt</a> for instructions on uninstalling this script.)</p>
	<?php
	echo "<div class='submit'><input type='submit' " . SUBMITDISABLED . " value='Update Status &raquo;' /></div>";
	wp_nonce_field('wp-cache');
	?>
	</form>
	<?php
	if( $super_cache_enabled && function_exists( 'apache_get_modules' ) ) {
		$mods = apache_get_modules();
		$required_modules = array( 'mod_mime' => 'Required to serve compressed supercache files properly.', 'mod_headers' => 'Required to set caching information on supercache pages. IE7 users will see old pages without this module.', 'mod_expires' => 'Set the expiry date on supercached pages. Visitors may not see new pages when they refresh or leave comments without this module.' );
		foreach( $required_modules as $req => $desc ) {
			if( !in_array( $req, $mods ) ) {
				$missing_mods[ $req ] = $desc;
			}
		}
		if( isset( $missing_mods) && is_array( $missing_mods ) ) {
			echo "<h3>Missing Apache Modules</h3>";
			echo "<p>The following Apache modules are missing. The plugin will work in half-on mode without them. In full Supercache mode, your visitors may see corrupted pages or out of date content however.</p>";
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
	<h3 align='center'>Make WordPress Faster</h3>
	<?php if( $wp_cache_hide_donation != 1 ) { ?>
	<p><a href="http://ocaoimh.ie/wp-super-cache/?r=wpsc">WP Super Cache</a> really makes your blog go faster. Make it go faster<sup>*</sup> by buying me an <a href="http://ocaoimh.ie/agc">Amazon gift card</a>! Make it out to "donncha@ocaoimh.ie". A £10 card would be nice but it's up to you how much you think this plugin is worth to you.</p>
	<p>If Amazon isn't your thing, there's also PayPal. Click the "Donate" button below or take a quick peek at my <a href="http://ocaoimh.ie/wish">wishlist</a>.</p>
	<p>Thanks in advance!<br />Donncha<br />
	<small>* Ok, it won't go any faster but you'll make this plugin author very happy!</small></p>
	<div align='center'>
	<form action="https://www.paypal.com/cgi-bin/webscr" method="post">
	<input type="hidden" name="cmd" value="_s-xclick"/>
	<input type="hidden" name="hosted_button_id" value="3244504"/>
	<input type="image" src="https://www.paypal.com/en_GB/i/btn/btn_donate_SM.gif" border="0" name="submit" alt=""/>
	<img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1"/><br />
	</form>
	<p>Don't show me this again. <form action="<?php echo $_SERVER["REQUEST_URI"]; ?>" method="post"><input type='hidden' name='wp_cache_hide_donation' value='1' /><input type='submit' value='Hide' /><?php wp_nonce_field('wp-cache'); ?></form></p>
	</div>
	<?php } else { ?>
	<p><a href="http://ocaoimh.ie/wp-super-cache/?r=supercache">WP Super Cache</a> is maintained and developed by <a href="http://ocaoimh.ie/?r=supercache">Donncha O Caoimh</a> with contributions from many others.</p>
	<p>He blogs at <a href="http://ocaoimh.ie/?r=supercache">Holy Shmoly</a>, posts photos at <a href="http://inphotos.org/?r=supercache">In Photos.org</a> and <a href="http://ocaoimh.ie/gad">wishes</a> he had more time to read and relax.</p><p>Please say hi to him on <a href="http://twitter.com/donncha/">Twitter</a> too!</p>
	<?php } ?>
	</div>

	</td></table>
	<?php

	wp_cache_files();

	wsc_mod_rewrite();

	wp_cache_edit_max_time();

	echo '<a name="files"></a><fieldset class="options"><h3>Accepted Filenames &amp; Rejected URIs</h3>';
	wp_cache_edit_rejected_pages();
	echo "\n";
	wp_cache_edit_rejected();
	echo "\n";
	wp_cache_edit_accepted();
	echo '</fieldset>';

	wp_cache_edit_rejected_ua();


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
		echo '<fieldset class="options"><h3>Cache Plugins</h3>';
		echo $out;
		echo '</fieldset>';
	}

	echo "</div>\n";
}

function wsc_mod_rewrite() {
	global $super_cache_enabled, $cache_compression, $cache_compression_changed, $valid_nonce, $cache_path;
	if( $super_cache_enabled == false )
		return;
	if( false == defined( 'WPSC_DISABLE_COMPRESSION' ) ) {
	?>
	<fieldset class="options"> 
	<h3>Super Cache Compression</h3>
	<form name="wp_manager" action="<?php echo $_SERVER["REQUEST_URI"]; ?>" method="post">
	<label><input type="radio" name="cache_compression" value="1" <?php if( $cache_compression ) { echo "checked=checked"; } ?>> Enabled</label>
	<label><input type="radio" name="cache_compression" value="0" <?php if( !$cache_compression ) { echo "checked=checked"; } ?>> Disabled</label>
	<p>Compression is disabled by default because some hosts have problems with compressed files. Switching this on and off clears the cache.</p>
	<?php
	if( isset( $cache_compression_changed ) && isset( $_POST[ 'cache_compression' ] ) && !$cache_compression ) {
		?><p><strong>Super Cache compression is now disabled.</strong></p> <?php
	} elseif( isset( $cache_compression_changed ) && isset( $_POST[ 'cache_compression' ] ) && $cache_compression ) {
		?><p><strong>Super Cache compression is now enabled.</strong></p><?php
	}
	echo '<div class="submit"><input ' . SUBMITDISABLED . 'type="submit" value="Update Compression &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
	?></fieldset>
	<?php } ?>

	<a name="modrewrite"></a><fieldset class="options"> 
	<h3>Mod Rewrite Rules</h3><?php
	if ( isset( $_SERVER[ "PHP_DOCUMENT_ROOT" ] ) ) {
		$document_root = $_SERVER[ "PHP_DOCUMENT_ROOT" ];
		$apache_root = $_SERVER[ "PHP_DOCUMENT_ROOT" ];
	} else {
		$document_root = $_SERVER[ "DOCUMENT_ROOT" ];
		$apache_root = '%{DOCUMENT_ROOT}';
	}
	$home_path = get_home_path();
	$home_root = parse_url(get_bloginfo('url'));
	$home_root = trailingslashit($home_root['path']);
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
	$condition_rules[] = "RewriteCond %{REQUEST_METHOD} !=POST";
	$condition_rules[] = "RewriteCond %{QUERY_STRING} !.*=.*";
	$condition_rules[] = "RewriteCond %{HTTP:Cookie} !^.*(comment_author_|wordpress|wp-postpass_).*$";
	$condition_rules[] = "RewriteCond %{HTTP_user_agent} !^.*(Android|2.0\\ MMP|240x320|AvantGo|BlackBerry|Blazer|Cellphone|Danger|DoCoMo|Elaine/3.0|EudoraWeb|hiptop|IEMobile|iPhone|iPod|KYOCERA/WX310K|LG/U990|MIDP-2.0|MMEF20|MOT-V|NetFront|Newt|Nintendo\\ Wii|Nitro|Nokia|Opera\\ Mini|Palm|Playstation\\ Portable|portalmmm|Proxinet|ProxiNet|SHARP-TQ-GX10|Small|SonyEricsson|Symbian\\ OS|SymbianOS|TS21i-10|UP.Browser|UP.Link|Windows\\ CE|WinWAP).*";
	$condition_rules = apply_filters( 'supercacherewriteconditions', $condition_rules );

	$rules = "<IfModule mod_rewrite.c>\n";
	$rules .= "RewriteEngine On\n";
	$rules .= "RewriteBase $home_root\n"; // props Chris Messina
	$charset = get_option('blog_charset') == '' ? 'UTF-8' : get_option('blog_charset');
	$rules .= "AddDefaultCharset {$charset}\n";
	$rules .= "CONDITION_RULES";
	$rules .= "RewriteCond %{HTTP:Accept-Encoding} gzip\n";
	$rules .= "RewriteCond {$apache_root}{$inst_root}cache/supercache/%{HTTP_HOST}{$home_root}$1/index.html.gz -f\n";
	$rules .= "RewriteRule ^(.*) {$inst_root}cache/supercache/%{HTTP_HOST}{$home_root}$1/index.html.gz [L]\n\n";

	$rules .= "CONDITION_RULES";
	$rules .= "RewriteCond {$apache_root}{$inst_root}cache/supercache/%{HTTP_HOST}{$home_root}$1/index.html -f\n";
	$rules .= "RewriteRule ^(.*) {$inst_root}cache/supercache/%{HTTP_HOST}{$home_root}$1/index.html [L]\n";
	$rules .= "</IfModule>\n";
	$rules = apply_filters( 'supercacherewriterules', $rules );

	$rules = str_replace( "CONDITION_RULES", implode( "\n", $condition_rules ) . "\n", $rules );

	$dohtaccess = true;
	if( function_exists( 'is_site_admin' ) ) {
		echo "<h4 style='color: #a00'>WordPress MU Detected</h4><p>Unfortunately the rewrite rules cannot be updated automatically when running WordPress MU. Please open your .htaccess and add the following mod_rewrite rules above any other rules in that file.</p>";
	} elseif( !$wprules || $wprules == '' ) {
		echo "<h4 style='color: #a00'>Mod Rewrite rules cannot be updated!</h4>";
		echo "<p>You must have <strong>BEGIN</strong> and <strong>END</strong> markers in {$home_path}.htaccess for the auto update to work. They look like this and surround the main WordPress mod_rewrite rules:
		<blockquote><pre><em># BEGIN WordPress</em>\n RewriteCond %{REQUEST_FILENAME} !-f\n RewriteCond %{REQUEST_FILENAME} !-d\n RewriteRule . /index.php [L]\n <em># END WordPress</em></pre></blockquote>
		Refresh this page when you have updated your .htaccess file.";
		echo "</fieldset></div>";
		return;
	} elseif( strpos( $wprules, 'wordpressuser' ) ) { // Need to clear out old mod_rewrite rules
		echo "<p><strong>Thank you for upgrading.</strong> The mod_rewrite rules changed since you last installed this plugin. Unfortunately you must remove the old supercache rules before the new ones are updated. Refresh this page when you have edited your .htaccess file. If you wish to manually upgrade, change the following line: <blockquote><code>RewriteCond %{HTTP_COOKIE} !^.*wordpressuser.*\$</code></blockquote> so it looks like this: <blockquote><code>RewriteCond %{HTTP:Cookie} !^.*wordpress.*\$</code></blockquote> The only changes are 'HTTP_COOKIE' becomes 'HTTP:Cookie' and 'wordpressuser' becomes 'wordpress'. This is a WordPress 2.5 change but it's backwards compatible with older versions if you're brave enough to use them.</p>";
		echo "</fieldset></div>";
		return;
	} elseif( $scrules != '' && strpos( $scrules, '%{REQUEST_URI} !^.*[^/]$' ) === false && substr( get_option( 'permalink_structure' ), -1 ) == '/' ) { // permalink structure has a trailing slash, need slash check in rules.
		echo "<div style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><h4>Trailing slash check required.</h4><p>It looks like your blog has URLs that end with a '/'. Unfortunately since you installed this plugin a duplicate content bug has been found where URLs not ending in a '/' end serve the same content as those with the '/' and do not redirect to the proper URL.";
		echo "To fix, you must edit your .htaccess file and add these two rules to the two groups of Super Cache rules:</p>";
		echo "<blockquote><code>RewriteCond %{REQUEST_URI} !^.*[^/]$RewriteCond %{REQUEST_URI} !^.*//.*$</code></blockquote>";
		echo "<p>You can see where the rules go and examine the complete rules by clicking the 'View mod_rewrite rules' link below.</p></div>";
		$dohtaccess = false;
	} elseif( strpos( $scrules, 'supercache' ) || strpos( $wprules, 'supercache' ) ) { // only write the rules once
		$dohtaccess = false;
	}
	// cache/.htaccess rules
	$gziprules =  "<IfModule mod_mime.c>\n  <FilesMatch \"\\.html\\.gz\$\">\n    ForceType text/html\n    FileETag None\n  </FilesMatch>\n  AddEncoding gzip .gz\n  AddType text/html .gz\n</IfModule>\n";
	$gziprules .= "<IfModule mod_deflate.c>\n  SetEnvIfNoCase Request_URI \.gz$ no-gzip\n</IfModule>\n";
	$gziprules .= "<IfModule mod_headers.c>\n  Header set Cache-Control 'max-age=300, must-revalidate'\n</IfModule>\n";
	$gziprules .= "<IfModule mod_expires.c>\n  ExpiresActive On\n  ExpiresByType text/html A300\n</IfModule>\n";
	if( $dohtaccess && !$_POST[ 'updatehtaccess' ] ) {
		if( !is_writeable_ACLSafe( $home_path . ".htaccess" ) ) {
			echo "<div style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><h4>Cannot update .htaccess</h4><p>The file <code>{$home_path}.htaccess</code> cannot be modified by the web server. Please correct this using the chmod command or your ftp client.</p><p>Refresh this page when the file permissions have been modified.</p><p>Alternatively, you can edit your <code>{$home_path}.htaccess</code> file manually and add the following code (before any WordPress rules):</p>";
			echo "<p><pre># BEGIN WPSuperCache\n" . wp_specialchars( $rules ) . "# END WPSuperCache</pre></p></div>";
		} else {
			echo "<div style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><p>To serve static html files your server must have the correct mod_rewrite rules added to a file called <code>{$home_path}.htaccess</code> ";
			if( !function_exists( 'is_site_admin' ) ) {
				echo "You must edit the file yourself add the following rules.";
			} else {
				echo "You can edit the file yourself add the following rules.";
			}
			echo " Make sure they appear before any existing WordPress rules.</p>";
			echo "<pre># BEGIN WPSuperCache\n" . wp_specialchars( $rules ) . "# END WPSuperCache</pre></p>";
			echo "<p>Rules must be added to " . WP_CONTENT_DIR . "/cache/.htaccess too:</p>";
			echo "<pre># BEGIN supercache\n" . wp_specialchars( $gziprules ) . "# END supercache</pre></p>";
			if( !function_exists( 'is_site_admin' ) ) {
				echo '<form name="updatehtaccess" action="'. $_SERVER["REQUEST_URI"] . '#modrewrite" method="post">';
				echo '<input type="hidden" name="updatehtaccess" value="1" />';
				echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'id="updatehtaccess" value="Update Mod_Rewrite Rules &raquo;" /></div>';
				wp_nonce_field('wp-cache');
				echo "</form></div>\n";
			}
		}
	} elseif( $dohtaccess && $valid_nonce && $_POST[ 'updatehtaccess' ] ) {
		wpsc_remove_marker( $home_path.'.htaccess', 'WordPress' ); // remove original WP rules so SuperCache rules go on top
		echo "<div style='padding:0 8px;color:#4f8a10;background-color:#dff2bf;border:1px solid #4f8a10;'>";
		if( insert_with_markers( $home_path.'.htaccess', 'WPSuperCache', explode( "\n", $rules ) ) && insert_with_markers( $home_path.'.htaccess', 'WordPress', explode( "\n", $wprules ) ) ) {
			echo "<h4>Mod Rewrite rules updated!</h4>";
			echo "<p><strong>{$home_path}.htaccess has been updated with the necessary mod_rewrite rules. Please verify they are correct. They should look like this:</strong></p>\n";
		} else {
			echo "<h4>Mod Rewrite rules must be updated!</h4>";
			echo "<p><strong> Your {$home_path}.htaccess is not writable by the webserver and must be updated with the necessary mod_rewrite rules. The new rules go above the regular WordPress rules as shown in the code below:</strong></p>\n";
		}
		echo "<p><pre>" . wp_specialchars( $rules ) . "</pre></p>\n</div>";
	} else {
		?>
		<p>WP Super Cache mod rewrite rules were detected in your <?php echo $home_path ?>.htaccess file.<br /> Click the following link to see the lines added to that file. If you have upgraded the plugin make sure these rules match.<br /><br />
		<a href="javascript:toggleLayer('rewriterules');" class="button">View Mod_Rewrite Rules</a>
		<div id='rewriterules' style='display: none;'>
		<?php echo "<p><pre># BEGIN WPSuperCache\n" . wp_specialchars( $rules ) . "# END WPSuperCache</pre></p>\n"; 
		echo "<p>Rules must be added to " . WP_CONTENT_DIR ."/cache/.htaccess too:</p>";
		echo "<pre># BEGIN supercache\n" . wp_specialchars( $gziprules ) . "# END supercache</pre></p>"; ?>
		</div>
		<?php
	}
	// http://allmybrain.com/2007/11/08/making-wp-super-cache-gzip-compression-work/
	if( !is_file( $cache_path . '.htaccess' ) ) {
		$gziprules = insert_with_markers( $cache_path . '.htaccess', 'supercache', explode( "\n", $gziprules ) );
		echo "<h4>Gzip encoding rules in {$cache_path}.htaccess created.</h4>";
	}

	?></fieldset><?php
}

function wp_cache_restore() {
	echo '<fieldset class="options"><h3>Fix Configuration</h3>';
	echo '<form name="wp_restore" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<input type="hidden" name="wp_restore_config" />';
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'id="deletepost" value="Restore Default Configuration &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
	echo '</fieldset>';

}

function comment_form_lockdown_message() {
	?><p><?php _e( "Comment moderation is enabled. Your comment may take some time to appear." ); ?></p><?php
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
	?><fieldset class="options"> 
	<h3>Lock Down: <?php echo $wp_lock_down == '0' ? '<span style="color:red">Disabled</span>' : '<span style="color:green">Enabled</span>'; ?></h3>
	<p>Prepare your server for an expected spike in traffic by enabling the lock down. When this is enabled, new comments on a post will not refresh the cached static files.</p>
	<p>Developers: Make your plugin lock down compatible by checking the 'WPLOCKDOWN' constant. The following code will make sure your plugin respects the WPLOCKDOWN setting.
	<blockquote><code>if( defined( 'WPLOCKDOWN' ) && constant( 'WPLOCKDOWN' ) ) { 
		&nbsp;&nbsp;&nbsp;&nbsp;echo "Sorry. My blog is locked down. Updates will appear shortly";
		}</code></blockquote>
	<?php
	if( $wp_lock_down == '1' ) {
		?><p>WordPress is locked down. Super Cache static files will not be deleted when new comments are made.</p><?php
	} else {
		?><p>WordPress is not locked down. New comments will refresh Super Cache static files as normal.</p><?php
	}
	$new_lockdown =  $wp_lock_down == '1' ? '0' : '1';
	$new_lockdown_desc =  $wp_lock_down == '1' ? 'Disable' : 'Enable';
	echo '<form name="wp_lock_down" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo "<input type='hidden' name='wp_lock_down' value='{$new_lockdown}' />";
	echo "<div class='submit'><input type='submit' " . SUBMITDISABLED . " value='{$new_lockdown_desc} Lock Down &raquo;' /></div>";
	wp_nonce_field('wp-cache');
	echo "</form>\n";

	?></fieldset><?php
	if( $cache_enabled == true && $super_cache_enabled == true ) {
	?><fieldset class="options"> 
	<h3>Directly Cached Files</h3><?php

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
			echo "<strong>$pagefile removed!</strong>";
			prune_super_cache( $cache_path, true );
		}
	}

	$readonly = '';
	if( !is_writeable_ACLSafe( ABSPATH ) ) {
		$readonly = 'READONLY';
		?><p style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><strong>Warning!</strong> You must make <?php echo ABSPATH ?> writable to enable this feature. As this is a security risk please make it readonly after your page is generated.</p><?php
	} else {
		?><p style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><strong>Warning!</strong> <?php echo ABSPATH ?> is writable. Please make it readonly after your page is generated as this is a security risk.</p><?php
	}
	echo '<form name="direct_page" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
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
			?><table><tr><th>Existing direct page</th><th>Delete cached file</th></tr><?php
			echo "$out</table>";
		}
	}
	if( $readonly != 'READONLY' )
		echo "Add direct page: <input type='text' $readonly name='new_direct_page' size='30' value='' />";

	echo "<p>Directly cached files are files created directly off " . ABSPATH . " where your blog lives. This feature is only useful if you are expecting a major Digg or Slashdot level of traffic to one post or page.</p>";
	if( $readonly != 'READONLY' ) {
		echo "<p>For example: to cache <em>'" . trailingslashit( get_option( 'siteurl' ) ) . "about/'</em>, you would enter '" . trailingslashit( get_option( 'siteurl' ) ) . "about/' or '/about/'. The cached file will be generated the next time an anonymous user visits that page.</p>";
		echo "<p>Make the textbox blank to remove it from the list of direct pages and delete the cached file.</p>";
	}

	wp_nonce_field('wp-cache');
	if( $readonly != 'READONLY' )
		echo "<div class='submit'><input type='submit' ' . SUBMITDISABLED . 'value='Update Direct Pages &raquo;' /></div>";
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
		if ($max_time > 0) {
			$cache_max_time = $max_time;
			wp_cache_replace_line('^ *\$cache_max_time', "\$cache_max_time = $cache_max_time;", $wp_cache_config_file);
		}
	}
	?><fieldset class="options"> 
	<h3>Expiry Time &amp; Garbage Collection</h3><?php
	echo '<form name="wp_edit_max_time" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<label for="wp_max_time">Expire time:</label> ';
	echo "<input type=\"text\" size=6 name=\"wp_max_time\" value=\"$cache_max_time\" /> seconds";
	echo "<h4>Garbage Collection</h4><p>If expiry time is more than 1800 seconds (half an hour), garbage collection will be done every 10 minutes, otherwise it will happen 10 seconds after the expiry time above.</p>";
	echo "<p>Checking for and deleting expired files is expensive, but it's expensive leaving them there too. On a very busy site you should set the expiry time to <em>300 seconds</em>. Experiment with different values and visit this page to see how many expired files remain at different times during the day. Aim to have less than 500 cached files if possible.</p>";
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="Change Expiration &raquo;" /></div>';
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

	if (!function_exists('apache_request_headers')) return;

	if(isset($_REQUEST['wp_rejected_user_agent']) && $valid_nonce) {
		$text = wp_cache_sanitize_value($_REQUEST['wp_rejected_user_agent'], $cache_rejected_user_agent);
		wp_cache_replace_line('^ *\$cache_rejected_user_agent', "\$cache_rejected_user_agent = $text;", $wp_cache_config_file);
	}

	echo '<a name="user-agents"></a><fieldset class="options"><h3>Rejected User Agents</h3>';
	echo "<p>Strings in the HTTP 'User Agent' header that prevent WP-Cache from 
		caching bot, spiders, and crawlers' requests.
		Note that super cached files are still sent to these agents if they already exists.</p>\n";
	echo '<form name="wp_edit_rejected_user_agent" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<textarea name="wp_rejected_user_agent" cols="40" rows="4" style="width: 50%; font-size: 12px;" class="code">';
	foreach ($cache_rejected_user_agent as $ua) {
		echo wp_specialchars($ua) . "\n";
	}
	echo '</textarea> ';
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="Save UA Strings &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo '</form>';
	echo "</fieldset>\n";
}

function wp_cache_edit_rejected_pages() {
	global $wp_cache_config_file, $valid_nonce, $wp_cache_pages;

	if ( isset( $_POST[ 'wp_edit_rejected_pages' ] ) && $valid_nonce ) {
		$pages = array( 'single', 'pages', 'archives', 'tag', 'frontpage', 'home', 'category' );
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

	echo '<p>Do not cache the following page types. See the <a href="http://codex.wordpress.org/Conditional_Tags">Conditional Tags</a> documentation for a complete discussion on each type.</p>';
	echo '<form name="wp_edit_rejected_pages" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<input type="hidden" name="wp_edit_rejected_pages" value="1" />';
	echo '<label><input type="checkbox" value="1" name="wp_cache_pages[single]" ' . checked( 1, $wp_cache_pages[ 'single' ], false ) . ' /> Single Posts (is_single)</label><br />';
	echo '<label><input type="checkbox" value="1" name="wp_cache_pages[pages]" ' . checked( 1, $wp_cache_pages[ 'pages' ], false ) . ' /> Pages (is_page)</label><br />';
	echo '<label><input type="checkbox" value="1" name="wp_cache_pages[frontpage]" ' . checked( 1, $wp_cache_pages[ 'frontpage' ], false ) . ' /> Front Page (is_front_page)</label><br />';
	echo '&nbsp;&nbsp;<label><input type="checkbox" value="1" name="wp_cache_pages[home]" ' . checked( 1, $wp_cache_pages[ 'home' ], false ) . ' /> Home (is_home)</label><br />';
	echo '<label><input type="checkbox" value="1" name="wp_cache_pages[archives]" ' . checked( 1, $wp_cache_pages[ 'archives' ], false ) . ' /> Archives (is_archive)</label><br />';
	echo '&nbsp;&nbsp;<label><input type="checkbox" value="1" name="wp_cache_pages[tag]" ' . checked( 1, $wp_cache_pages[ 'tag' ], false ) . ' /> Tags (is_tag)</label><br />';
	echo '&nbsp;&nbsp;<label><input type="checkbox" value="1" name="wp_cache_pages[category]" ' . checked( 1, $wp_cache_pages[ 'category' ], false ) . ' /> Category (is_category)</label><br />';

	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="Save &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";

}

function wp_cache_edit_rejected() {
	global $cache_acceptable_files, $cache_rejected_uri, $wp_cache_config_file, $valid_nonce;

	if(isset($_REQUEST['wp_rejected_uri']) && $valid_nonce) {
		$text = wp_cache_sanitize_value( str_replace( '\\\\', '\\', $_REQUEST['wp_rejected_uri'] ), $cache_rejected_uri );
		wp_cache_replace_line('^ *\$cache_rejected_uri', "\$cache_rejected_uri = $text;", $wp_cache_config_file);
	}


	echo '<form name="wp_edit_rejected" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo "<p>Add here strings (not a filename) that forces a page not to be cached. For example, if your URLs include year and you dont want to cache last year posts, it's enough to specify the year, i.e. '/2004/'. WP-Cache will search if that string is part of the URI and if so, it will not cache that page.</p>\n";
	echo '<textarea name="wp_rejected_uri" cols="40" rows="4" style="width: 50%; font-size: 12px;" class="code">';
	foreach ($cache_rejected_uri as $file) {
		echo wp_specialchars( $file ) . "\n";
	}
	echo '</textarea> ';
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="Save Strings &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
}

function wp_cache_edit_accepted() {
	global $cache_acceptable_files, $cache_rejected_uri, $wp_cache_config_file, $valid_nonce;

	if(isset($_REQUEST['wp_accepted_files']) && $valid_nonce) {
		$text = wp_cache_sanitize_value($_REQUEST['wp_accepted_files'], $cache_acceptable_files);
		wp_cache_replace_line('^ *\$cache_acceptable_files', "\$cache_acceptable_files = $text;", $wp_cache_config_file);
	}


	echo '<div style="clear:both"></div><form name="wp_edit_accepted" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo "<p>Add here those filenames that can be cached, even if they match one of the rejected substring specified above.</p>\n";
	echo '<textarea name="wp_accepted_files" cols="40" rows="8" style="width: 50%; font-size: 12px;" class="code">';
	foreach ($cache_acceptable_files as $file) {
		echo wp_specialchars($file) . "\n";
	}
	echo '</textarea> ';
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="Save Files &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
}

function wp_cache_enable() {
	global $wp_cache_config_file, $cache_enabled, $supercachedir;

	if(get_option('gzipcompression')) {
		echo "<strong>Error: GZIP compression is enabled, disable it if you want to enable wp-cache.</strong>";
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
		echo "<strong>Warning</strong>: GZIP compression is enabled in Wordpress, wp-cache will be bypassed until you disable gzip compression.";
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
				echo "<strong>Error:</strong> Your cache directory (<strong>$cache_path</strong>) did not exist and couldn't be created by the web server.  Check  $dir permissions.";
				return false;
		}
	}
	if ( !is_writeable_ACLSafe($cache_path)) {
		echo "<strong>Error:</strong> Your cache directory (<strong>$cache_path</strong>) or <strong>$dir</strong> need to be writable for this plugin to work.  Double-check it.";
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
				echo "<strong>Error:</strong> Your WP-Cache config file (<strong>$wp_cache_config_file</strong>) is out of date and not writable by the Web server.Please delete it and refresh this page.";
				return false;
			}
		}
	} elseif( !is_writeable_ACLSafe($dir)) {
		echo "<strong>Error:</strong> Configuration file missing and " . WP_CONTENT_DIR . "  directory (<strong>$dir</strong>) is not writable by the Web server.Check its permissions.";
		return false;
	}

	if ( !file_exists($wp_cache_config_file) ) {
		if ( !file_exists($wp_cache_config_file_sample) ) {
			echo "<strong>Error:</strong> Sample WP-Cache config file (<strong>$wp_cache_config_file_sample</strong>) does not exist.Verify you installation.";
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
		echo "<h3>Warning! <em>" . constant( 'WP_CONTENT_DIR' ) . "/advanced-cache.php</em> does not exist or cannot be updated.</h3>";
		echo "<p><ul><li>1. If it already exists please delete the file first.</li>";
		echo "<li>2. Make " . constant( 'WP_CONTENT_DIR' ) . " writable using the chmod command through your ftp or server software. (<em>chmod 777 " . constant( 'WP_CONTENT_DIR' ) . "</em>) and refresh this page. This is only a temporary measure and you'll have to make it read only afterwards again. (Change 777 to 755 in the previous command)</li>";
		echo "<li>3. Refresh this page to update <em>" . constant( 'WP_CONTENT_DIR' ) . "/advanced-cache.php</em></li></ul>";
		echo "If that doesn't work, make sure the file <em>" . constant( 'WP_CONTENT_DIR' ) . "/advanced-cache.php</em> doesn't exist:<ol>";
		echo "<li>1. Open <em>$wp_cache_file</em> in a text editor.</li><li>2. Change the text <em>CACHEHOME</em> to <em>" . constant( 'WPCACHEHOME' ) . "</em></li><li>3. Save the file and copy it to <em>$wp_cache_link</em> and refresh this page.</li>";
		return false;
	}
	return true;
}

function wp_cache_check_global_config() {
	if( defined( 'WP_CACHE' ) )
		return true;

	if ( file_exists( ABSPATH . 'wp-config.php') ) {
		$global = ABSPATH . 'wp-config.php';
	} else {
		$global = dirname(ABSPATH) . '/wp-config.php';
	}

	$howtoenable = "Edit <code>$global</code> and add the following line: <code>define('WP_CACHE', true);</code>Otherwise, <strong>WP-Cache will not be executed</strong> by Wordpress core. ";
	$lines = file($global);
	foreach($lines as $line) {
		if (preg_match('/^\s*define\s*\(\s*\'WP_CACHE\'\s*,\s*(?i:TRUE|1)\s*\)\s*;/', $line)) {
			echo $howtoenable;
			return false;
		}
	}
	$line = 'define(\'WP_CACHE\', true);';
	if (!is_writeable_ACLSafe($global) || !wp_cache_replace_line('define *\( *\'WP_CACHE\'', $line, $global) ) {
			echo "<strong>Error: WP_CACHE is not enabled</strong> in your <code>wp-config.php</code> file and I couldn't modify it.";
			echo $howtoenable;
			return false;
	} 
	return true;
}

function wp_cache_files() {
	global $cache_path, $file_prefix, $cache_max_time, $valid_nonce, $supercachedir, $cache_enabled, $super_cache_enabled, $blog_cache_dir;

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

	echo '<fieldset class="options" id="show-this-fieldset"><h3>Cache Contents</h3>';
	/*
	echo '<form name="wp_cache_content_list" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<input type="hidden" name="wp_list_cache" />';
	echo '<div class="submit"><input type="submit" ' . SUBMITDISABLED . 'value="'.$list_mess.' &raquo;" /></div>';
	echo "</form>\n";
	*/

	$list_files = false; // it doesn't list supercached files, and removing single pages is buggy
	$count = 0;
	$expired = 0;
	$now = time();
	if ( ($handle = @opendir( $blog_cache_dir . 'meta/' )) ) { 
		if ($list_files) echo "<table cellspacing=\"0\" cellpadding=\"5\">";
		$wp_cache_fsize = 0;
		while ( false !== ($file = readdir($handle))) {
			if ( preg_match("/^$file_prefix.*\.meta/", $file) ) {
				$this_expired = false;
				$content_file = preg_replace("/meta$/", "html", $file);
				$mtime = filemtime( $blog_cache_dir . 'meta/' . $file );
				if ( ! ( $fsize = @filesize( $blog_cache_dir . $content_file ) ) ) 
					continue; // .meta does not exists
				$wp_cache_fsize += $fsize;
				$fsize = intval($fsize/1024);
				$age = $now - $mtime;
				if ( $age > $cache_max_time ) {
					$expired++;
					$this_expired = true;
				}
				$count++;
				/*
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
					echo '<td><form name="wp_delete_cache_file" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
					echo '<input type="hidden" name="wp_list_cache" />';
					echo '<input type="hidden" name="wp_delete_cache_file" value="'.preg_replace("/^(.*)\.meta$/", "$1", $file).'" />';
					echo '<div class="submit"><input id="deletepost" ' . SUBMITDISABLED . 'type="submit" value="Remove" /></div>';
					wp_nonce_field('wp-cache');
					echo "</form></td></tr>\n";
				}
				*/
			}
		}
		closedir($handle);
		if ($list_files) echo "</table>";
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
		$sizes = array( 'expired' => 0, 'cached' => 0, 'ts' => 0 );

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
			if(is_file($supercachedir) && filemtime( $supercachedir ) + $cache_max_time <= $now )
				$sizes[ 'expired' ] ++;
		}
		$sizes[ 'ts' ] = time();
	}

	echo "<p><strong>WP-Cache ({$wp_cache_fsize})</strong></p>";
	echo "<ul><li>$count Cached Pages</li>";
	echo "<li>$expired Expired Pages</li></ul>";
	if( $cache_enabled == true && $super_cache_enabled == true ) {
		$fsize = $sizes[ 'fsize' ] / 1024;
		if( $fsize > 1024 ) {
			$fsize = number_format( $fsize / 1024, 2 ) . "MB";
		} elseif( $fsize != 0 ) {
			$fsize = number_format( $fsize, 2 ) . "KB";
		} else {
			$fsize = "0KB";
		}
		echo "<p><strong>WP-Super-Cache ({$fsize})</strong></p>";
		echo "<ul><li>" . intval($sizes['cached']/2) . " Cached Pages</li>";
		$age = intval(($now - $sizes['ts'])/60);
		echo "<li>" . intval($sizes['expired']/2) . " Expired Pages</li></ul>";
	}
	$last_gc = get_option( "wpsupercache_gc_time" );
	if( $last_gc ) {
		$next_gc = $cache_max_time < 1800 ? $cache_max_time : 600;
		$next_gc_mins = ( time() - $last_gc );
		echo "<p><strong>Garbage Collection</strong><br />Last GC was <strong>" . date( 'i:s', $next_gc_mins ) . "</strong> minutes ago<br />";
		echo "Next GC in <strong>" . date( 'i:s', $next_gc - $next_gc_mins ) . "</strong> minutes</p>";
	}

	echo "<p>Expired files are files older than $cache_max_time seconds. They are still used by the plugin and are deleted periodically.</p>";
	echo '<form name="wp_cache_content_expired" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<input type="hidden" name="wp_delete_expired" />';
	echo '<div class="submit" style="float:left"><input type="submit" ' . SUBMITDISABLED . 'value="Delete Expired &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";

	echo '<form name="wp_cache_content_delete" action="'. $_SERVER["REQUEST_URI"] . '" method="post">';
	echo '<input type="hidden" name="wp_delete_cache" />';
	echo '<div class="submit" style="float:left;margin-left:10px"><input id="deletepost" type="submit" ' . SUBMITDISABLED . 'value="Delete Cache &raquo;" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";

	echo '</fieldset>';
}

function delete_cache_dashboard() {
	if( function_exists( 'is_site_admin' ) && !is_site_admin() )
		return false;

	if( function_exists('current_user_can') && !current_user_can('manage_options') )
		return false;

	echo "<li><a href='" . wp_nonce_url( 'options-general.php?page=wpsupercache&wp_delete_cache=1', 'wp-cache' ) . "' target='_blank' title='Delete Super Cache cached files (opens in new window)'>Delete Cache</a></li>";
}
add_action( 'dashmenu', 'delete_cache_dashboard' );

function wpsc_dirsize($directory, $sizes) {
	global $cache_max_time;
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
			if( filemtime( $directory ) + $cache_max_time <= $now ) {
				$sizes[ 'expired' ]+=1;
			} else {
				$sizes[ 'cached' ]+=1;
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
	global $cache_path, $supercachedir, $blog_cache_dir;

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
	?><p id='supercache'><?php bloginfo('name'); ?> is Digg proof thanks to caching by <a href="http://ocaoimh.ie/wp-super-cache/">WP Super Cache</a>!</p><?php
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

	$actions[ wp_nonce_url( 'options-general.php?page=wpsupercache&wp_delete_cache=1', 'wp-cache' ) ] = array( __( 'Delete Cache' ), 'manage_options' );

	return $actions;
}
add_filter( 'favorite_actions', 'wp_cache_favorite_action' );

function wp_cache_plugin_notice( $plugin ) {
	global $cache_enabled;
 	if( $plugin == 'wp-super-cache/wp-cache.php' && !$cache_enabled && function_exists( "admin_url" ) )
		echo '<td colspan="5" class="plugin-update">WP Super Cache must be configured. Go to <a href="' . admin_url( 'options-general.php?page=wpsupercache' ) . '">the admin page</a> to enable and configure the plugin.</td>';
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
		echo '<div class="error"><p><strong>' . sprintf( __('WP Super Cache is disabled. Please go to the <a href="%s">plugin admin page</a> to enable caching.' ), admin_url( 'options-general.php?page=wpsupercache' ) ) . '</strong></p></div>';
}
add_action( 'admin_notices', 'wp_cache_admin_notice' );
?>
