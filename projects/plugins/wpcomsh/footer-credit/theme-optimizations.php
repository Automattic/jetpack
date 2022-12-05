<?php
/**
 * This file is taken from wp-content/blog-plugins/theme-optimizations.php on wpcom and is split into this and 'footer-credit-optimizations.php'.
 * The latter will hold all footer-credit-related logic that can run outside of wpcom environment. I hope to port these files back
 */
require_once __DIR__ . '/footer-credit-optimizations.php';

// Footer credit wpcom-related hooks:

function wpcom_better_footer_credit_can_customize( $previous_value ) {
	$plan = WPCOM_Store::get_subscribed_bundle_product_id_for_blog();
	return in_array( $plan, array( WPCOM_BUSINESS_BUNDLE ) );
}
add_filter( 'wpcom_better_footer_credit_can_customize', 'wpcom_better_footer_credit_can_customize', 10, 1 );

function wpcom_better_footer_credit_apply( $previous_value ) {
	return wpcom_is_pub_theme() && ! wpcom_is_premium_theme() && ! wpcom_is_vip_theme() && ! wpcom_is_a8c_theme();
}
add_filter( 'wpcom_better_footer_credit_apply', 'wpcom_better_footer_credit_apply', 10, 1 );

function wpcom_better_footer_credit_default( $original, $lang ) {
	// Handle WP.com footer text.

	$_blog_id = get_current_blog_id();
	$vertical = site_vertical( $_blog_id );

	$noads = defined( 'NOADVERTS' ) || defined( 'NOADSUPGRADE' );
	if ( $vertical ) {
		if ( $noads ) {
			$credit_link = sprintf( '<a href="%s">%s.</a>', localized_wpcom_url( 'https://wordpress.com/' . $vertical . '/?ref=vertical_footer', $lang ), __( 'Blog at WordPress.com' ) );
		} else {
			$credit_link = sprintf( '<a href="%s">%s.</a>', localized_wpcom_url( 'https://wordpress.com/' . $vertical . '/?ref=vertical_footer', $lang ), __( 'Create a free website at WordPress.com' ) );
		}
	} else if ( $noads || mt_rand( 0, 1 ) ) {
		$credit_link = sprintf( '<a href="%s">%s.</a>', localized_wpcom_url( 'https://wordpress.com/?ref=footer_blog', $lang ), __( 'Blog at WordPress.com' ) );
	} else {
		$credit_link = sprintf( '<a href="%s">%s.</a>', localized_wpcom_url( 'https://wordpress.com/?ref=footer_website', $lang ), __( 'Create a free website or blog at WordPress.com' ) );
	}
	return $credit_link;
}
add_filter( 'wpcom_better_footer_credit_link', 'wpcom_better_footer_credit_default', 10, 2 );

function wpcom_better_footer_credit_url( $original, $lang ) {
	return localized_wpcom_url( $original, $lang );
}
add_filter( 'wpcom_better_footer_credit_url', 'wpcom_better_footer_credit_url', 10, 2 );



/**
 * Prevent widows in post titles
 *
 * Isn't applied when the user is on a non-tablet mobile device, the title contains three or fewer words, or words are over a certain (filterable) length.
 *
 * A multi-byte aware re-implementation of this - http://www.shauninman.com/post/heap/2006/08/22/widont_wordpress_plugin
 *
 * DEVELOPER NOTE: Please run the units at bin/tests/content-filters/widont.php when updating this function!
 *
 * @param string $str
 * @uses jetpack_is_mobile()
 * @uses Jetpack_User_Agent_Info::is_tablet()
 * @uses apply_filters()
 * @filter the_title
 * @return string
 */
function widont( $str = '' ) {
	// Don't apply on non-tablet mobile devices so the browsers can fit to the viewport properly.
	if ( jetpack_is_mobile() && ! Jetpack_User_Agent_Info::is_tablet() ) {
		return $str;
	}

	// We're dealing with whitespace from here out, let's not have any false positives. :)
	$str = trim( $str );

	// If string contains three or fewer words, don't join.
	if ( count( preg_split( '#\s+#', $str ) ) <= 3 ) {
		return $str;
	}

	// Don't join if words exceed a certain length: minimum 10 characters, default 15 characters, filterable via `widont_max_word_length`.
	$widont_max_word_length = max( 10, absint( apply_filters( 'widont_max_word_length', 15 ) ) );
	$regex = '#\s+(\P{Z}{1,' . $widont_max_word_length . '})\s+(\P{Z}{1,' . $widont_max_word_length . '})$#u';

	return preg_replace( $regex, ' $1&nbsp;$2', $str );
}
add_filter( 'the_title', 'widont' );

function wido( $str = '' ) {
	return str_replace( '&#160;', ' ', $str );
}
add_filter( 'the_title_rss', 'wido' );

// Remove extra non-breaking spaces from menu titles - see #1718-wpcom
function wido_menu_titles( $content ) {
	return str_replace( '&nbsp;', ' ', $content );
}
add_filter( 'walker_nav_menu_start_el', 'wido_menu_titles' );

/**
 * Filter links to the Edit Post screen in the admin.
 *
 * These links now point to WP Admin, but we want users to be redirected to the new WP.com editor.
 */
function wpcom_edit_post_admin_url_redirect( $url, $post_id ) {
	$_blog_id = get_current_blog_id();

	if ( ! $post = get_post( $post_id ) ) {
		return $url;
	}

	if ( wpcom_is_vip( $_blog_id ) || ( is_super_admin() && ! is_user_member_of_blog( get_current_user_id(), $_blog_id ) ) ) {
		return $url;
	}

	$post_type = $post->post_type;

	if ( in_array( $post_type, array( 'post', 'page' ) ) ) {
		$path_prefix = $post_type;
	} else if ( in_array( $post_type, apply_filters( 'rest_api_allowed_post_types', array( 'post', 'page', 'revision' ) ) ) ) {
		$path_prefix = sprintf( 'edit/%s', $post_type );
	}

	if ( ! isset( $path_prefix ) ) {
		return $url;
	}

	$site_slug = WPCOM_Masterbar::get_calypso_site_slug( $_blog_id );
	return esc_url_raw( sprintf( 'https://wordpress.com/%s/%s/%d', $path_prefix, $site_slug, $post_id ) );
}

function wpcom_edit_post_admin_url_redirect_add_hook() {
	add_filter( 'get_edit_post_link', 'wpcom_edit_post_admin_url_redirect', 10, 2 );
}
add_action( 'wp_head', 'wpcom_edit_post_admin_url_redirect_add_hook' );

function wpcom_edit_post_admin_url_redirect_remove_hook() {
	remove_filter( 'get_edit_post_link', 'wpcom_edit_post_admin_url_redirect', 10, 2 );
}
add_action( 'wp_footer', 'wpcom_edit_post_admin_url_redirect_remove_hook' );

/**
* Filter links to the New Post screen in the admin.
*
* These links now point to WP Admin, but we want users to be redirected to the new WP.com editor.
*/
function wpcom_new_post_admin_url_redirect( $url, $path ) {
	if ( 'post-new.php' !== $path || ( is_super_admin() && ! is_user_member_of_blog() ) ) {
		return $url;
	}

	$site_slug = WPCOM_Masterbar::get_calypso_site_slug( get_current_blog_id() );
	return esc_url_raw( sprintf( 'https://wordpress.com/post/%s', $site_slug ) );
}

function wpcom_new_post_admin_url_redirect_add_hook() {
	add_filter( 'admin_url', 'wpcom_new_post_admin_url_redirect', 10, 2 );
}
add_action( 'wp_head', 'wpcom_new_post_admin_url_redirect_add_hook' );

function wpcom_new_post_admin_url_redirect_remove_hook() {
	remove_filter( 'admin_url', 'wpcom_new_post_admin_url_redirect', 10, 2 );
}
add_action( 'wp_footer', 'wpcom_new_post_admin_url_redirect_remove_hook' );

/**
 * When a default theme is enabled at signup (new blog creation), ensure that
 * it's mobile setting is turned off -- if the theme is responsive.
 *
 * See track_signup_default_theme() in wp-content/mu-plugins/usage.php
 *
 * @param int $_blog_id
 * @return void
 */
function wpcom_disable_mobile_theme_on_signup( $_blog_id ) {
	global $wpdb;
	$stylesheet = get_blog_option( (int) $_blog_id, 'stylesheet' );

	// Avoid processing for signups that aren't new, like blog name changes.
	if ( empty( $stylesheet ) || 'dashboard' == $stylesheet || 'h4' == $stylesheet ) {
		return;
	}

	// Disable mobile theme.
	if ( in_array( 'responsive-layout', wp_get_theme( $stylesheet )->get( 'Tags' ) ) ) {
		update_blog_option( $_blog_id, 'wp_mobile_disable', 1 );
	}
}
add_action( 'wpmu_new_blog', 'wpcom_disable_mobile_theme_on_signup', 10, 1 );