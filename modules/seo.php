<?php
/**
 * Module Name: seo
 * Module Description: Adds tools to enhance your site's content for better results on search engines and social media.
 * Sort Order: 35
 * First Introduced: 4.3
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Social, Appearance
 */

include dirname( __FILE__ ) . '/seo/helpers-seo.php';
include dirname( __FILE__ ) . '/seo/title-seo.php';
include dirname( __FILE__ ) . '/seo/posts-seo.php';

/**
 * An SEO expert walks into a bar, bars, pub, public house, Irish pub, drinks, beer, wine, liquor, Grey Goose, Cristal...
 */
class SEO {
	function __construct() {
		add_action( 'init', array( $this, 'init' ) );
	}

	function init() {
		add_action( 'wp_head', array( $this, 'meta_tags' ) );

		// Add support for editing page excerpts in pages, regardless of theme support.
		add_post_type_support( 'page', 'excerpt' );

		// Overwrite page title with custom SEO meta title for themes that support title-tag
		add_filter( 'pre_get_document_title', 'get_custom_title' );

		// Add overwrite support for themes that don't support title-tag
		add_filter( 'wp_title', 'get_custom_title' );
	}

	/**
	 * "The first major crawler-based search engines to use the meta keywords tag were Infoseek and AltaVista"
	 *
	 * Source: http://searchenginewatch.com/article/2066825/Death-Of-A-Meta-Tag
	 */
	function meta_tags() {

		global $wp_query;

		$period = $template = '';

		$description = get_front_page_meta_description() ?: get_bloginfo( 'description' );

		$meta = array(
			'title'       => sprintf( _x( '%1$s on %2$s', 'Blog Title on WordPress.com' ), get_bloginfo( 'title' ), 'WordPress.com' ),
			'description' => trim( $description ),
		);

		// Try to target things if we're on a "specific" page of any kind
		if ( is_singular() ) {
			$meta['title'] = sprintf( _x( '%1$s | %2$s', 'Post Title | Blog Title on WordPress.com' ), get_the_title(), $meta['title'] );

			// Business users can overwrite the description
			if ( ! ( is_front_page() && get_front_page_meta_description() ) ) {
				$description = get_post_description( get_post() );

				if ( $description ) {
					$description = wp_trim_words( strip_shortcodes( wp_kses( $description, array() ) ) );
					$meta['description'] = $description;
				}
			}

		} else if ( is_author() ) {
			$obj                 = get_queried_object();
			$meta['title']       = sprintf( _x( 'Posts by %1$s | %2$s', 'Posts by Author Name | Blog Title on WordPress.com' ), $obj->display_name, $meta['title'] );
			$meta['description'] = sprintf( _x( 'Read all of the posts by %1$s on %2$s', 'Read all of the posts by Author Name on Blog Title' ), $obj->display_name, get_bloginfo( 'title' ) );
		} else if ( is_tag() || is_category() || is_tax() ) {
			$obj = get_queried_object();

			$meta['title'] = sprintf( _x( 'Posts about %1$s on %2$s', 'Posts about Category on Blog Title' ), single_term_title( '', false ), get_bloginfo( 'title' ) );

			$description = get_term_field( 'description', $obj->term_id, $obj->taxonomy, 'raw' );
			if ( ! is_wp_error( $description ) && '' != $description ) {
				$meta['description'] = wp_trim_words( $description );
			} else {

				$authors             = $this->get_authors();
				$meta['description'] = sprintf( _x( 'Posts about %1$s written by %2$s', 'Posts about Category written by John and Bob' ), single_term_title( '', false ), oxford_comma( $authors ) );
			}
		} else if ( is_date() ) {
			if ( is_year() ) {
				$period   = get_query_var( 'year' );
				$template = _nx(
					'%1$s post published by %2$s in the year %3$s', // singular
					'%1$s posts published by %2$s in the year %3$s', // plural
					count( $wp_query->posts ), // number
					'10 posts published by John in the year 2012' // context
				);
			} else if ( is_month() ) {
				$period   = date( 'F Y', mktime( 0, 0, 0, get_query_var( 'monthnum' ), 1, get_query_var( 'year' ) ) );
				$template = _nx(
					'%1$s post published by %2$s during %3$s', // singular
					'%1$s posts published by %2$s during %3$s', // plural
					count( $wp_query->posts ), // number
					'10 posts publishes by John during May 2012' // context
				);
			} else if ( is_day() ) {
				$period   = date( 'F j, Y', mktime( 0, 0, 0, get_query_var( 'monthnum' ), get_query_var( 'day' ), get_query_var( 'year' ) ) );
				$template = _nx(
					'%1$s post published by %2$s on %3$s', // singular
					'%1$s posts published by %2$s on %3$s', // plural
					count( $wp_query->posts ), // number
					'10 posts published by John on May 30, 2012' // context
				);
			}
			$meta['title'] = sprintf( _x( 'Posts from %1$s on %2$s', 'Posts from May 2012 on Blog Title' ), $period, get_bloginfo( 'title' ) );

			$authors             = $this->get_authors();
			$meta['description'] = sprintf( $template, count( $wp_query->posts ), oxford_comma( $authors ), $period );
		}

		// Output them
		foreach ( $meta as $name => $content ) {
			if ( ! empty( $content ) ) {
				echo '<meta name="' . esc_attr( $name ) . '" content="' . esc_attr( $content ) . '" />' . "\n";
			}
		}
	}

	private function get_authors() {
		global $wp_query;

		$authors = array();

		foreach ( $wp_query->posts as $post ) {
			$authors[] = get_the_author_meta( 'display_name', (int) $post->post_author );
		}

		$authors = array_unique( $authors );

		return $authors;
	}
}

new SEO;
