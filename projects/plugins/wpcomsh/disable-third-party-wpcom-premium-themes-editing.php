<?php

namespace AT_Pressable\Themes;

add_action( 'admin_init', __NAMESPACE__ . '\\add_filter_for_edit_themes_capability' );

function add_filter_for_edit_themes_capability() {
	add_filter( 'user_has_cap', __NAMESPACE__ . '\\disable_third_party_wpcom_premium_themes_editing', 10, 3 );
}

function disable_third_party_wpcom_premium_themes_editing( $allcaps, $required_cap, $args ) {
	$requested_cap = $args[0];

	if ( 'edit_themes' !== $requested_cap ) {
		return $allcaps;
	}

	// Bail out for users who can't delete themes.
	if (
		! isset( $allcaps['edit_themes'] ) ||
		! $allcaps['edit_themes']
	) {
		return $allcaps;
	}

	$active_theme_slug = get_template();

	// Bail out if the active theme is not a WPCom theme.
	if ( ! is_wpcom_theme_quick( $active_theme_slug ) ) {
		return $allcaps;
	}

	// Bail out if the active theme is not a WPCom premium one.
	if ( ! WPCom_Themes_Manager::is_wpcom_premium_theme( $active_theme_slug ) ) {
		return $allcaps;
	}

	$active_theme_obj = wp_get_theme();

	// Bail out if the active WPCom premium theme is made by Automattic.
	if ( 'Automattic' === $active_theme_obj->get( 'Author' ) ) {
		return $allcaps;
	}

	// Finally, if the active WPCom premium theme is not made by Automattic, disable editing it.
	$allcaps['edit_themes'] = false;

	return $allcaps;
}
