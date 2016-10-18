<?php

/**
 * An SEO expert walks into a bar, bars, pub, public house, Irish pub, drinks, beer, wine, liquor, Grey Goose, Cristal...
 */
class Jetpack_SEO {
	public function __construct() {
		add_action( 'init', array( $this, 'init' ) );
	}

	public function init() {
		if ( apply_filters( 'jetpack_seo_meta_tags', true ) ) {
			add_action( 'wp_head', array( $this, 'meta_tags' ) );

			// Add support for editing page excerpts in pages, regardless of theme support.
			add_post_type_support( 'page', 'excerpt' );
		}

		if ( apply_filters( 'jetpack_seo_custom_titles', true ) ) {
			// Overwrite page title with custom SEO meta title for themes that support title-tag.
			add_filter( 'pre_get_document_title', array( 'A8C_SEO_Title', 'get_custom_title' ) );

			// Add overwrite support for themes that don't support title-tag.
			add_filter( 'wp_title', array( 'A8C_SEO_Title', 'get_custom_title' ) );
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

	function meta_tags() {
		global $wp_query;

		$period = $template = '';
		$meta = array();
		$conflicted_themes = apply_filters( 'jetpack_seo_meta_tags_conflicted_themes', array() );

		if ( isset( $conflicted_themes[ get_option( 'template' ) ] ) ) {
			return;
		}

		$description = A8C_SEO::get_front_page_meta_description() ?: get_bloginfo( 'description' );

		$site_host = apply_filters( 'jetpack_seo_site_host', get_site_url() );

		$meta['title'] = sprintf( _x( '%1$s on %2$s', 'Site Title on WordPress' ), get_bloginfo( 'title' ),	$site_host );
		$meta['description'] = trim( $description );

		// Try to target things if we're on a "specific" page of any kind
		if ( is_singular() ) {
			$meta['title'] = sprintf( _x( '%1$s | %2$s', 'Post Title | Site Title on WordPress' ), get_the_title(), $meta['title'] );

			// Business users can overwrite the description
			if ( ! ( is_front_page() && A8C_SEO::get_front_page_meta_description() ) ) {
				$description = A8C_SEO_Posts::get_post_description( get_post() );

				if ( $description ) {
					$description = wp_trim_words( strip_shortcodes( wp_kses( $description, array() ) ) );
					$meta['description'] = $description;
				}
			}

		} else if ( is_author() ) {
			$obj                 = get_queried_object();
			$meta['title']       = sprintf( _x( 'Posts by %1$s | %2$s', 'Posts by Author Name | Blog Title on WordPress' ), $obj->display_name, $meta['title'] );
			$meta['description'] = sprintf( _x( 'Read all of the posts by %1$s on %2$s', 'Read all of the posts by Author Name on Blog Title' ), $obj->display_name, get_bloginfo( 'title' ) );
		} else if ( is_tag() || is_category() || is_tax() ) {
			$obj = get_queried_object();

			$meta['title'] = sprintf( _x( 'Posts about %1$s on %2$s', 'Posts about Category on Blog Title' ), single_term_title( '', false ), get_bloginfo( 'title' ) );

			$description = get_term_field( 'description', $obj->term_id, $obj->taxonomy, 'raw' );
			if ( ! is_wp_error( $description ) && '' != $description ) {
				$meta['description'] = wp_trim_words( $description );
			} else {

				$authors             = $this->get_authors();
				$meta['description'] = wp_sprintf( _x( 'Posts about %1$s written by %2$l', 'Posts about Category written by John and Bob' ), single_term_title( '', false ), $authors );
			}
		} else if ( is_date() ) {
			if ( is_year() ) {
				$period   = get_query_var( 'year' );
				$template = _nx(
					'%1$s post published by %2$l in the year %3$s', // singular
					'%1$s posts published by %2$l in the year %3$s', // plural
					count( $wp_query->posts ), // number
					'10 posts published by John in the year 2012' // context
				);
			} else if ( is_month() ) {
				$period   = date( 'F Y', mktime( 0, 0, 0, get_query_var( 'monthnum' ), 1, get_query_var( 'year' ) ) );
				$template = _nx(
					'%1$s post published by %2$l during %3$s', // singular
					'%1$s posts published by %2$l during %3$s', // plural
					count( $wp_query->posts ), // number
					'10 posts publishes by John during May 2012' // context
				);
			} else if ( is_day() ) {
				$period   = date( 'F j, Y', mktime( 0, 0, 0, get_query_var( 'monthnum' ), get_query_var( 'day' ), get_query_var( 'year' ) ) );
				$template = _nx(
					'%1$s post published by %2$l on %3$s', // singular
					'%1$s posts published by %2$l on %3$s', // plural
					count( $wp_query->posts ), // number
					'10 posts published by John on May 30, 2012' // context
				);
			}
			$meta['title'] = sprintf( _x( 'Posts from %1$s on %2$s', 'Posts from May 2012 on Blog Title' ), $period, get_bloginfo( 'title' ) );

			$authors             = $this->get_authors();
			$meta['description'] = wp_sprintf( $template, count( $wp_query->posts ), $authors, $period );
		}

		// Output them
		foreach ( $meta as $name => $content ) {
			if ( ! empty( $content ) ) {
				echo '<meta name="' . esc_attr( $name ) . '" content="' . esc_attr( $content ) . '" />' . "\n";
			}
		}
	}
}

new Jetpack_SEO;
