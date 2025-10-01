<?php
/**
 * Loads the correct admin menu file depending on the site type.
 *
 * @package automattic/jetpack-mu-wpcom
 */

$is_difm_lite_in_progress = ( function_exists( 'has_blog_sticker' ) && has_blog_sticker( 'difm-lite-in-progress' ) ) ||
							( function_exists( 'wpcomsh_is_site_sticker_active' ) && wpcomsh_is_site_sticker_active( 'difm-lite-in-progress' ) );
$is_support_session       = defined( 'WPCOM_SUPPORT_SESSION' ) && WPCOM_SUPPORT_SESSION;

if ( $is_difm_lite_in_progress && ! $is_support_session ) {
	require_once __DIR__ . '/difm-admin-menu.php';
} else {
	require_once __DIR__ . '/wpcom-admin-menu.php';
}
