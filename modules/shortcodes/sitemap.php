<?php
/**
 * Sitemap shortcode.
 *
 * Usage: [sitemap]
 */

add_shortcode( 'sitemap', 'jetpack_sitemap_shortcode' );

/**
 * Parse shortcode arguments and render its output.
 *
 * @since 4.5.0
 *
 * @param array  $atts    Shortcode parameters.
 * @param string $content Content enclosed by shortcode tags.
 *
 * @return string
 */
function jetpack_sitemap_shortcode( $atts, $content ) {
	return '<ul>' .	wp_list_pages( array(
		'title_li' => '<b><a href="/">' . esc_html( get_bloginfo( 'name' ) ) . '</a></b>',
		'exclude'  => get_option( 'page_on_front' ),
		'echo'     => false,
	) ) . '</ul>';
}
