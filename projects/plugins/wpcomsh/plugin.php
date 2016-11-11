<?php
/**
 * Plugin Name: AT Pressable disable premium theme editing
 * Plugin URI: http://wordpress.com
 * Description: Disable editing WPCom third-party premium themes.
 * Version: 1.0
 * Author: Automattic
 * Author URI: http://automattic.com/
 */

add_filter( 'user_has_cap', 'at_pressable_disable_premium_theme_editing', 10, 3 );

function at_pressable_disable_premium_theme_editing( $allcaps ) {
	$allcaps['edit_themes'] = false;

	return $allcaps;
}


