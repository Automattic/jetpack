<?php

/*
Plugin Name: Jetpack Beta Tester
Plugin URI: https://github.com/Automattic/jetpack
Description: Uses your auto-updater to update your local Jetpack to our latest beta version from the master-stable branch on GitHub.  DO NOT USE IN PRODUCTION.
Version: 1.1
Author: Automattic
Author URI: https://jetpack.com/
License: GPLv2 or later
*/

/*
This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

define( 'JPBETA__PLUGIN_FILE', plugins_url() . '/jetpack-beta/' );
define( 'JPBETA__DIR', dirname(__FILE__).'/' );

if( defined( 'IS_PRESSABLE' ) && IS_PRESSABLE ) {
	define( 'JETPACK_PLUGIN_PATH', WP_PLUGIN_DIR . '/jetpack-pressable-beta/jetpack.php' );
	define( 'JETPACK_PLUGIN_ID', 'jetpack-pressable-beta/jetpack.php' );
	define( 'JETPACK_PLUGIN_FOLDER', 'jetpack-pressable-beta' );
} else {
	define( 'JETPACK_PLUGIN_PATH', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
	define( 'JETPACK_PLUGIN_ID', 'jetpack/jetpack.php' );
	define( 'JETPACK_PLUGIN_FOLDER', 'jetpack' );
}

//we need jetpack to work!
if( !file_exists( WP_PLUGIN_DIR . '/jetpack/jetpack.php' ) ) { return; }



function set_up_auto_updater() {

    $forceUpdate = get_option( 'force-jetpack-update' );

    if( $forceUpdate && $forceUpdate != get_current_jetpack_version() ) {
        update_option( 'force-jetpack-update', 'just-updated' );
    }
	
	$beta_type = get_option( 'jp_beta_type' );

	if( $beta_type == 'rc_only' ) {
		$json_url = 'http://betadownload.jetpack.me/rc/rc.json';
	} else {
		$json_url = 'http://betadownload.jetpack.me/jetpack-bleeding-edge.json';
	}
	
	if( defined( 'IS_PRESSABLE' ) && IS_PRESSABLE ) {
		$json_url = str_replace( '.json', '-pressable.json', $json_url );
	}

    do_action( 'add_debug_info', $json_url, 'json_url' );

	require 'plugin-updates/plugin-update-checker.php';
	$JetpackBeta = PucFactory::buildUpdateChecker(
	    $json_url,
	    JETPACK_PLUGIN_PATH,
	    'jetpack',
	    '0.01'
	);

	// Allows us to update the Jetpack Beta tool by updating GitHub
	$className = PucFactory::getLatestClassVersion('PucGitHubChecker');
	$myUpdateChecker = new $className(
		'https://github.com/Automattic/jetpack-beta/',
		__FILE__,
		'master'
	);


	$jp_beta_autoupdate = get_option( 'jp_beta_autoupdate' );
	if( $jp_beta_autoupdate != 'no' ) {
		function auto_update_jetpack_beta ( $update, $item ) {
		    // Array of plugin slugs to always auto-update
		    $plugins = array ( 
		        'jetpack'
		    );
		    if ( in_array( $item->slug, $plugins ) ) {
		        return true; // Always update plugins in this array
		    } else {
		        return $update; // Else, use the normal API response to decide whether to update or not
		    }
		}
		add_filter( 'auto_update_plugin', 'auto_update_jetpack_beta', 10, 2 );
	}

}
add_action( 'plugins_loaded', 'set_up_auto_updater' );




function load_debug_bar_jpa_info() {
    do_action( 'add_debug_info', get_current_jetpack_version(), 'jetpack version' );
    do_action( 'add_debug_info', get_option( 'force-jetpack-update' ), 'force-jetpack-update' );
}
add_action( 'admin_init', 'load_debug_bar_jpa_info' );

function jpbeta_get_testing_list() {
	$test_list_path = WP_PLUGIN_DIR . '/' . JETPACK_PLUGIN_FOLDER . '/to-test.md';
	if ( ! file_exists( $test_list_path ) ) {
	    return "You're not currently using a beta version of Jetpack";
	}

	$test_list_file = file_get_contents( $test_list_path );

	if ( class_exists( 'Jetpack' ) && Jetpack::is_module_active( 'markdown' ) ) {

		// We'll apply standard content filters to our content.
		add_filter( 'jetpack_beta_test_content', 'wptexturize'        );
		add_filter( 'jetpack_beta_test_content', 'convert_smilies'    );
		add_filter( 'jetpack_beta_test_content', 'convert_chars'      );
		add_filter( 'jetpack_beta_test_content', 'wpautop'            );
		add_filter( 'jetpack_beta_test_content', 'shortcode_unautop'  );
		add_filter( 'jetpack_beta_test_content', 'prepend_attachment' );

		// Then let's use Jetpack Markdown to process our content
		jetpack_require_lib( 'markdown' );
		$o = WPCom_Markdown::get_instance()->transform( $test_list_file, array('id'=>false,'unslash'=>false) );
		$o = apply_filters( 'jetpack_beta_test_content', $o );

	} else {

		$test_list_rows = explode( "\n", $test_list_file );

		unset( $test_list_rows[0] );
		unset( $test_list_rows[1] );
		unset( $test_list_rows[2] );

		$o = sprintf(
			__( "<h2>Please <a href='%s'>enable Jetpack's Markdown Module</a> for a better display of this list.</h2>", 'jpbeta' ),
			Jetpack::admin_url( 'page=jetpack_modules' )
		);

		foreach( $test_list_rows as $row ) {
			if( strpos( $row, '===' ) === 0 ) {
				if( $o ) {
					$o .= '</ul>';
					break;
				}
				$o = '<h3 title="Testing items for Jetpack">Testing items for Jetpack ' . trim( str_replace( '===', '', $row ) ) . '</h3>';
				$o .= '<ul>';
				continue;
			}
			if( strpos( $row, '*' ) === 0 ) {
				$o .= '<li><p><strong>' . trim( str_replace( '*', '', $row ) ) . '</strong></p>';
			} else {
				$o .= '<p>' . $row . '</p></li>';
			}
		}

	}
	return $o;
}

function get_current_jetpack_version() {
	if ( !function_exists('get_plugin_data') ){
		require_once( ABSPATH . '/wp-admin/includes/plugin.php' );
	}
    $jetpack_data = get_plugin_data( JETPACK_PLUGIN_PATH );
    return $jetpack_data[ 'Version' ];
}

function set_force_jetpack_update() {
    update_option( 'force-jetpack-update', get_current_jetpack_version() );
}

add_filter( 'puc_check_now-jetpack', 'check_force_jetpack_update' );
function check_force_jetpack_update( $checkNow ) {
    $forceUpdate = get_option( 'force-jetpack-update' );
	if ( $forceUpdate == 'just-updated' ) {
	    delete_option( 'force-jetpack-update' );
		// echo 'cleared force';
	}
	// die( $forceUpdate );
    if( !$forceUpdate || $checkNow ) { return $checkNow; }
    return true;
}

add_filter( 'puc_request_info_result-jetpack', 'force_jetpack_update' );
// add_filter( 'puc_request_info_result-jetpack', 'echoblah' );
function echoblah() {
	die('blah!!!');
}
function force_jetpack_update( $pluginInfo ) {
    if( !get_option( 'force-jetpack-update' ) ) { return $pluginInfo; }
    $pluginInfo->version = '999999999999999999999999 - Forced Update';
    return $pluginInfo;
}

add_action( 'in_plugin_update_message-' . JETPACK_PLUGIN_ID, 'jpb_replace_update_message' );
function jpb_replace_update_message() {
	?>
	<script>
		jQuery('#jetpack-update .update-message a').text( function() { return jQuery(this).text().replace("version 999999999999999999999999 - Forced Update", "beta"); })
	</script>
	<?php
}

function jpbeta_pressable_install_1() {
	if( !is_plugin_active( 'jetpack-pressable-beta/jetpack.php' ) ) {
		
		if( is_plugin_active( 'jetpack/jetpack.php' ) ) {
			deactivate_plugins( 'jetpack/jetpack.php' );
		}
		
		copy( 'http://betadownload.jetpack.me/rc/jetpack-pressable.zip', WP_PLUGIN_DIR.'/jetpack-pressable.zip' );
		
		$creds = request_filesystem_credentials(site_url() . '/wp-admin/', '', false, false, array());

		/* initialize the API */
		if ( ! WP_Filesystem($creds) ) {
			/* any problems and we exit */
			die( 'failed!' );
		}

		global $wp_filesystem;

		$plugin_path = str_replace(ABSPATH, $wp_filesystem->abspath(), WP_PLUGIN_DIR);

		$result = unzip_file( $plugin_path . '/jetpack-pressable.zip', $plugin_path );
		
		?>
		<br /><br /><br />
		<center>Activating Jetpack Beta...</center>
		<br />
		<center><small>Stuck?  <a href="?jpbetaswap2">Click to continue...</a></small></center>
		<script type="text/javascript">
		<!--
		window.location = "?jpbetaswap2"
		//-->
		</script>
		<?php
		exit;
	}
}
function jpbeta_pressable_install_2() {
	activate_plugins( 'jetpack-pressable-beta/jetpack.php' );
	?>
	<br /><br /><br />
	<center>Almost finished...</center>
	<br />
	<center><small>Stuck?  <a href="<?php echo admin_url( 'admin.php?page=jetpack-beta' ) ?>">Click to continue...</a></small></center>
	<script type="text/javascript">
	<!--
	window.location = "<?php echo admin_url( 'admin.php?page=jetpack-beta' ) ?>"
	//-->
	</script>
	<?php
	exit;
}


function jetpack_pressable_install_notice() {
	if( is_plugin_active( 'jetpack-pressable-beta/jetpack.php' ) ) {
		return;
	}
	
	$class = 'notice notice-warning';
	$message = 'You\'re almost ready to run Jetpack betas!';
	$button = '<a href="' . admin_url( 'plugins.php?jpbetaswap' ) . '" class="button button-primary" id="wpcom-connect">Activate The Latest Jetpack Beta</a>';

	printf( '<div class="%1$s"><h2>%2$s</h2><p>%3$s</p></div>', $class, $message, $button );
}

function hide_required_jetpack_when_running_beta_on_pressable() {
	if( !is_plugin_active( 'jetpack-pressable-beta/jetpack.php' ) ) {
		return;
	}
	global $wp_list_table;
	$plugin_list_table_items = $wp_list_table->items;
	foreach ( $plugin_list_table_items as $key => $val ) {
		if (in_array($key, array('jetpack/jetpack.php') )) {
			unset($wp_list_table->items[$key]);
		}
	}
}

/*
 * Admin page
 */
if( is_admin() ) {
	
	if( defined( 'IS_PRESSABLE' ) && IS_PRESSABLE ) {
		add_action( 'admin_notices', 'jetpack_pressable_install_notice' );
		add_action( 'pre_current_active_plugins', 'hide_required_jetpack_when_running_beta_on_pressable' );
	}
	
	if( defined( 'IS_PRESSABLE' ) && IS_PRESSABLE && isset( $_GET['jpbetaswap'] ) ) {
		add_action( 'admin_init', 'jpbeta_pressable_install_1' );
	}
	if( defined( 'IS_PRESSABLE' ) && IS_PRESSABLE && isset( $_GET['jpbetaswap2'] ) ) {
		add_action( 'admin_init', 'jpbeta_pressable_install_2' );
	}
	$jp_beta_type = get_option( 'jp_beta_type' );
	if( !$jp_beta_type ) {
		update_option( 'jp_beta_type', 'rc_only' );
	}
	
    require JPBETA__DIR . 'jetpack-beta-admin.php';
    $jpbeta_admin = new JP_Beta_Admin();
}
