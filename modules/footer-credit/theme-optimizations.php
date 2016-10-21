<?php

/**
 * Create an output buffer to capture the HTML content of the footer.php theme
 * template. Used to change links, text, run a/b tests. Etc.
 *
 * @param string $page The HTML content from footer.php template file.
 * @return string $page HTML content.
 */
function wpcom_better_footer_links_buffer( $page ) {
	// Only add theme and colophon links for pub and premium themes, and VIP "partner" themes.
	if ( ! wpcom_is_pub_theme() && ! wpcom_is_premium_theme() && ! wpcom_is_vip_theme() && ! wpcom_is_a8c_theme() ) {
		return $page;
	}

	// Would like to only see footer content before wp_footer output.
	$output = preg_split( '/wpcom_wp_footer/i', $page, 2 );

	// Run "better link" filters.
	$footer = wpcom_better_footer_links( $output[0] );

	// Piece back together again.
	$page = implode( array( $footer, 'wpcom_wp_footer' . $output[1] ) );

	// If nothing to join, return empty string.
	if ( 'wpcom_wp_footer' === $page ) {
		return '';
	}

	// Replace any dangling references of glue code.
	$page = preg_replace( '/wpcom_wp_footer/i', '', $page );

	return $page;
}

/**
 * Better WP.com footer links.
 *
 * 1. Replace default "Powered by WordPress" text and link with
 * a link to WordPress.com and custom call-out text.
 *
 * 2. Replace theme name in footer with a link to relevant theme page on the Theme Showcase.
 * URL structure: http://theme.wordpress.com/themes/{theme-slug}/
 *
 * 3. Link to the Vertical landing page for sites that are stickered with a vertical.
 *
 * @param string $footer Footer HTML content to filter.
 * @return string $footer Filtered HTML content.
 */
function wpcom_better_footer_links( $footer ) {
	// Only add theme and colophon links for pub and premium themes, and VIP "partner" themes.
	if ( ! wpcom_is_pub_theme() && ! wpcom_is_premium_theme() && ! wpcom_is_vip_theme() && ! wpcom_is_a8c_theme() ) {
		return $footer;
	}

	// Get current theme data.
	$theme = wp_get_theme();

	// Replace separator from content, since we are replacing theme and designer credits.
	// Any span separator with a .sep class will be matched and replaced by the regular expression.
	$footer = preg_replace("/\s\|\s(?=\<a)|\<span class=\"([^\"]+\s)?sep(\s[^\"]+)?\">.*<\/span>/i", '', $footer);

	// Handle WP.com footer text.
	$lang = get_bloginfo( 'language' );

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

	// Replace credit link in footer, and make sure it is replaced only once, to avoid duplicates.
	$credit_link = apply_filters( 'wpcom_better_footer_credit_link', $credit_link, $lang );

	// The regular expression to match the credit link replacement.
	$credit_regex = implode( '', array(
		'#' , // Open delimiter
			'<a[^>]*href="http(s?)://(([a-z]{2}|www)\.)?(wordpress|wordpress-fr|wpfr)\.(com|org|net)/?"([^>]+)?>' , // Opening link tag
			    '\s*'   , // Optional whitespace
			    '(.+?)' , // Any word or sentence
			    '\s*'   , // Optional whitespace
			'</a>'      , // Closing link tag
			'\.?'       , // Optional period
			'(\s*&[^;]+;\s*)?' , // Optional HTML Entity
		'#i' , // Ending delimiter & modifier
	) );

	// Add filter for specific themes that may need to tweak the regex a bit.
	$credit_regex = apply_filters( 'wpcom_better_footer_credit_regex', $credit_regex, $theme );

	// Get the full matches of the credit regular expression, proceed if match.
	if ( preg_match_all( $credit_regex, $footer, $matches, PREG_OFFSET_CAPTURE ) ) {

		// Get last match and offset.
		$match = array_pop( $matches[0] );
		$offset = $match[1];

		// Split the content into two parts, which we will join later on.
		$before = substr( $footer, 0, $offset );
		$after = substr( $footer, $offset );

		// Replace on the last part. Ensure we only do one replacement to avoid duplicates.
		$after = preg_replace( $credit_regex, $credit_link, $after, 1 );

		// Join the two parts.
		$footer = $before . $after;

	}

	// Themes that have duplicate footer credit links (e.g. "Powered by WordPress.com" + another credit link).
	$powered_by_themes = array(
		'pub/toujours',
	);

	// Remove "Proudly powered by WordPress" on selected themes.
	if ( in_array( $theme->stylesheet, $powered_by_themes ) ) {
		$powered_string = preg_quote( __( 'Proudly powered by WordPress' ), '#' );
		$powered_regex = sprintf( '#<a[^>]*href="http(s?)://(([a-z]{2}|www)\.)?wordpress\.(com|org)/?"([^>]+)?>%s</a>\.?#i', $powered_string );
		$footer = preg_replace( $powered_regex, '', $footer );
	}

	// Only add theme and colophon link for pub and premium themes.
	if ( wpcom_is_vip_theme() ) {
		return $footer;
	}

	// Handle adding Theme Name and colophon link to footer text.
	$theme_match = sprintf(
		'(?:\s*\|\s*)?'       . // Optional pipe with spaces (non-capturing)
		'(?:<span\s[^>]+>)?'  . // Optional opening span tag (non-capturing)
		'(Theme|%s)'          . // $1: "Theme" or the localized equivalent
		'\s*(?:&nbsp;)?:\s*'  . // Zero or more whitespace characters, a colon, zero or more whitespace characters
		'(%s|<a[^>]+>%s</a>)' . // $2: The theme name, or link
		'\.?'                 . // Optional period
		'(?:</span>)?'        . // Optional closing span tag (non-capturing)
		'\.?'                   // Optional period

		, preg_quote( __( 'Theme' ), '#' )
		, preg_quote( $theme->name, '#' )
		, preg_quote( $theme->name, '#' )
	);

	// Theme designer match.
	$designer_match = $theme_match . sprintf(
		'('                       . // Start $3
		    '\s*'                 . // Zero or more whitespace characters
		    '(?:<span\s[^>]+>)?'  . // Optional opening span tag (non-capturing)
		    '(?:by|%s)'           . // "by" or the localized equivalent (non-capturing)
		    '(?:</span>)?'        . // Optional closing span tag (non-capturing)
		    '\s*'                 . // Zero or more whitespace characters
		    '(<a[^>]+>.+?</a>)?'  . // $4: Maybe a full <a> element
		')'                       . // End $3
		'\.?'                       // Optional period

		, preg_quote( __( 'by' ), '#' ) // localized "by" preposition
	);

	// Match "Design by <shop>".
	$design_by = preg_quote( $credit_link, '#' ) . sprintf(
		'\.?'                . // Optional period
		'\s*'                . // Optional whitespace
		'(Design by|%s)'     . // "Design by" or localized equivalent
		'\s*'                . // Optional whitespace
		'(<a[^>]+>.+?</a>)'  . // Full link element
		'\.?'                  // Optional period

		, preg_quote( __( 'Design by' ), '#' )
	);

	if ( preg_match( "#$designer_match#i", $footer ) ) {
		$footer = preg_replace( "#$designer_match#i", '', $footer, 1 );
	}

	if ( preg_match( "#$theme_match#i", $footer ) ) {
		$footer = preg_replace( "#$theme_match#i", '', $footer, 1 );
	}

	if ( preg_match( "#$design_by#i", $footer ) ) {
		$footer = preg_replace( "#$design_by#i", $credit_link, $footer, 1 );
	}

	return $footer;
}

// Enable filters for footer content for all themes, except VIP sites.
function better_wpcom_link_init() {
	if ( ! wpcom_is_vip() )
		ob_start( 'wpcom_better_footer_links_buffer' );
}
add_action( 'get_footer', 'better_wpcom_link_init' );

// Enable filters on those themes that need special treatment.
function better_wpcom_link_workarounds_init() {
	if ( function_exists( 'blogly_widgets_init' ) && 'premium/blogly' === wp_get_theme()->stylesheet ) {
		add_action( 'get_sidebar', 'better_wpcom_link_init' );
	}
	if ( function_exists( 'designer_widgets_init' ) && 'premium/designer' === wp_get_theme()->stylesheet ) {
		add_action( 'get_header', 'better_wpcom_link_init' );
	}
}
add_action( 'init', 'better_wpcom_link_workarounds_init' );

// Enable filters Infinite Scroll footer conntent, except VIP sites.
if ( ! wpcom_is_vip() ) {
	add_filter( 'infinite_scroll_credit', 'wpcom_better_footer_links' );
}

/**
 * Filters the default footer credits regex.
 *
 * @param string $credit_regex The regular expression for the footer credit.
 * @param object $theme The object returned by `wp_get_theme()`
 * @return string
 */
function wpcom_better_footer_credit_regex_filter( $credit_regex, $theme ) {
	// Twotone renders the social menu after the credit links. If there is a WordPress.com link in the menu,
	// it will break the footer credits. Adding a space before the actual link fixes this.
	if ( 'premium/twotone' === $theme->stylesheet ) {
		$credit_regex = str_replace( '#<a', '#\s<a', $credit_regex );
	}
	return $credit_regex;
}
add_filter( 'wpcom_better_footer_credit_regex', 'wpcom_better_footer_credit_regex_filter', 10, 2 );

/**
 * Add an HTML comment flag for wp_footer output so that our footer replacement
 * script knows when to stop looking for more footer content.
 */
function wpcom_footer_html_comment_flag() {
	echo "<!-- wpcom_wp_footer -->\n";
}
add_action( 'wp_footer', 'wpcom_footer_html_comment_flag', 9 );

/**
 * Add theme name to Twenty Ten footer
 */
function wpcomthemes_twentyten_credits() {
	echo 'Theme: Twenty Ten'; // leave untranslated for regex match, will be translated in final output
}
add_action( 'twentyten_credits', 'wpcomthemes_twentyten_credits' );

/**
 * Add theme name to Twenty Eleven footer
 */
function wpcomthemes_twentyeleven_credits() {
	echo 'Theme: Twenty Eleven <span class="sep"> | </span>'; // leave untranslated for regex match, will be translated in final output
}
add_action( 'twentyeleven_credits', 'wpcomthemes_twentyeleven_credits' );

/**
 * Add theme name to Twenty Twelve footer
 */
function wpcomthemes_twentytwelve_credits() {
	echo 'Theme: Twenty Twelve.'; // leave untranslated for regex match, will be translated in final output
}
add_action( 'twentytwelve_credits', 'wpcomthemes_twentytwelve_credits' );

/**
 * Add theme name to Twenty Thirteen footer
 */
function wpcomthemes_twentythirteen_credits() {
	echo 'Theme: Twenty Thirteen.'; // leave untranslated for regex match, will be translated in final output
}
add_action( 'twentythirteen_credits', 'wpcomthemes_twentythirteen_credits' );

/**
 * Add theme name to Twenty Fourteen footer
 */
function wpcomthemes_twentyfourteen_credits() {
	echo 'Theme: Twenty Fourteen.'; // leave untranslated for regex match, will be translated in final output
}
add_action( 'twentyfourteen_credits', 'wpcomthemes_twentyfourteen_credits' );

/**
 * Add theme name to Twenty Fifteen footer
 */
function wpcomthemes_twentyfifteen_credits() {
	echo 'Theme: Twenty Fifteen.'; // leave untranslated for regex match, will be translated in final output
}
add_action( 'twentyfifteen_credits', 'wpcomthemes_twentyfifteen_credits' );

/**
 * Add theme name to Twenty Sixteen footer
 */
function wpcomthemes_twentysixteen_credits() {
	echo 'Theme: Twenty Sixteen.'; // leave untranslated for regex match, will be translated in final output
}
add_action( 'twentysixteen_credits', 'wpcomthemes_twentysixteen_credits' );

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
