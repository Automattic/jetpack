<?php
/**
 * This file is taken from wp-content/blog-plugins/theme-optimizations.php on wpcom and is split into this and 'theme-optimizations.php'.
 */

/**
 * Create an output buffer to capture the HTML content of the footer.php theme
 * template. Used to change links, text, run a/b tests. Etc.
 *
 * @param string $page The HTML content from footer.php template file.
 * @return string $page HTML content.
 */
function wpcom_better_footer_links_buffer( $page ) {
	// Only add theme and colophon links for pub and premium themes, and VIP "partner" themes.
	if ( ! apply_filters( 'wpcom_better_footer_credit_apply', true ) ) {
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
	if ( ! apply_filters( 'wpcom_better_footer_credit_apply', true ) ) {
		return $footer;
	}

	// Get current theme data.
	$theme = wp_get_theme();

	// Replace separator from content, since we are replacing theme and designer credits.
	// Any span separator with a .sep class will be matched and replaced by the regular expression.
	$footer = preg_replace("/\s\|\s(?=\<a)|\<span class=\"([^\"]+\s)?sep(\s[^\"]+)?\">.*<\/span>/i", '', $footer);

	// Handle WP.com footer text.
	$lang = get_bloginfo( 'language' );

	// Replace credit link in footer, and make sure it is replaced only once, to avoid duplicates.
	$credit_link = apply_filters( 'wpcom_better_footer_credit_link', '', $lang );

	// The regular expression to match the credit link replacement.
	$credit_regex = implode( '', array(
		'#' , // Open delimiter
			'<a[^>]*href="http(s?)://(([a-z]{2}(-[A-Z]{2})?|www)\.)?(wordpress|wordpress-fr|wpfr)\.(com|org|net)/?"([^>]+)?>' , // Opening link tag
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

	// Handle adding Theme Name and colophon link to footer text.
	$theme_match = sprintf(
		'(?:\s*\|\s*)?'        . // Optional pipe with spaces (non-capturing)
		'(?:<span\s[^>]+>)?'   . // Optional opening span tag (non-capturing)
		'(Theme|%s)'           . // $1: "Theme" or the localized equivalent
		'\s*(?:&nbsp;)?:?\s*'  . // Zero or more whitespace characters, an optional colon, zero or more whitespace characters
		'(%s|<a[^>]+>%s</a>)'  . // $2: The theme name, or link
		'\.?'                  . // Optional period
		'(?:</span>)?'         . // Optional closing span tag (non-capturing)
		'\.?'                    // Optional period

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
	if ( apply_filters( 'wpcom_better_footer_credit_apply', true ) ) {
		ob_start( 'wpcom_better_footer_links_buffer' );
	}
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
if ( ! apply_filters( 'wpcom_better_footer_credit_apply', true ) ) {
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

