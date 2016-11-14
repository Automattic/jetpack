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
	$list_of_third_party_premium_themes = [
		'Carbon',
		'Eris',
		'Label',
		'Pena'
		// TODO: If we decide for this approach, list all third-party WPCom premium themes here
	];

	$currently_active_theme = get_template();

	if ( $currently_active_theme && in_array( $currently_active_theme, $list_of_third_party_premium_themes ) ) {
		$allcaps['edit_themes'] = false;
	}

	return $allcaps;
}


