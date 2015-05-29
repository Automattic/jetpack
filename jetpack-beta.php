<?php

/*
Plugin Name: Jetpack Beta Tester
Plugin URI: https://github.com/Automattic/jetpack
Description: Uses your auto-updater to update your local Jetpack to our latest beta version from the master-stable branch on GitHub.  DO NOT USE IN PRODUCTION.
Version: 1.0a
Author: Automattic
Author URI: http://jetpack.me/
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

//we need jetpack to work!
if( !file_exists( WP_PLUGIN_DIR . '/jetpack/jetpack.php' ) ) { return; }

function set_up_auto_updater() {
	
    $forceUpdate = get_option( 'force-jetpack-update' );
	
    if( $forceUpdate != get_current_jetpack_version() ) {
        update_option( 'force-jetpack-update', 'just-updated' );
    }
	
	$beta_type = get_option( 'jp_beta_type' );
	
	if( $beta_type == 'rc_only' ) {
		$json_url = 'http://alpha.bruteprotect.com/rc/rc.json';
	} else {
		$json_url = 'http://alpha.bruteprotect.com/jetpack-bleeding-edge.json';
	}
	
	$jetpack_beta_json_url = 'http://alpha.bruteprotect.com/jetpack_beta.json';
	
    do_action( 'add_debug_info', $json_url, 'json_url' );
	
	require 'plugin-updates/plugin-update-checker.php';
	$JetpackBeta = PucFactory::buildUpdateChecker(
	    $json_url,
	    WP_PLUGIN_DIR . '/jetpack/jetpack.php',
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
	$test_list_path = WP_PLUGIN_DIR . '/jetpack/to-test.txt';
	if ( ! file_exists( $test_list_path ) ) {
	    return "You're not currently using a beta version of Jetpack";
	}
	$test_list_file    = file_get_contents( $test_list_path );
	$test_list_rows        = explode( "\n", $test_list_file );
	
	
	unset( $test_list_rows[0] );
	unset( $test_list_rows[1] );
	unset( $test_list_rows[2] );
	
	$o = '';
	
	foreach( $test_list_rows as $row ) {
		if( strpos( $row, '===' ) === 0 ) {
			if( $o ) {
				$o .= '</ul>';
				break;
			}
			$o = '<h2>Testing items for Jetpack ' . trim( str_replace( '===', '', $row ) ) . '</h2>';
			$o .= '<ul>';
			continue;
		}
		if( strpos( $row, '*' ) === 0 ) {
			$o .= '<li><strong>' . trim( str_replace( '*', '', $row ) ) . '</strong> <br />';
		} else {
			$o .= $row . '</li>';
		}
	}
	
	return $o;
}

function get_current_jetpack_version() {
	if ( !function_exists('get_plugin_data') ){
		require_once( ABSPATH . '/wp-admin/includes/plugin.php' );
	}
    $jetpack_data = get_plugin_data( WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
    return $jetpack_data[ 'Version' ];
}

function set_force_jetpack_update() {
    update_option( 'force-jetpack-update', get_current_jetpack_version() );
}

add_filter( 'puc_check_now-jetpack', 'check_force_jetpack_update' );
function check_force_jetpack_update( $checkNow ) {
    $forceUpdate = get_option( 'force-jetpack-update' );
	if ( $forceUpdate == 'just-updated' ) {
	    update_option( 'force-jetpack-update', 0 );
	}
    if( !$forceUpdate || $checkNow ) { return $checkNow; }
    return true;
}

add_filter( 'puc_request_info_result-jetpack', 'force_jetpack_update' );
function force_jetpack_update( $pluginInfo ) {
    if( !get_option( 'force-jetpack-update' ) ) { return $pluginInfo; }
    $pluginInfo->version = '999999999999999999999999 - Forced Update';
    return $pluginInfo;
}

/*
 * Admin page
 */
if( is_admin() ) {
    require JPBETA__DIR . 'jetpack-beta-admin.php';
    $jpbeta_admin = new JP_Beta_Admin();
}
