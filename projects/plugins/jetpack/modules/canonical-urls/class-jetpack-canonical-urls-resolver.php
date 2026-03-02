<?php
/**
 * URL resolution logic for the Canonical URLs module.
 *
 * @package automattic/jetpack
 */

/**
 * Resolves canonical URLs for different archive page types.
 *
 * URLs are built from scratch using WordPress API functions (get_permalink,
 * get_term_link, etc.) rather than parsing the current request URL, so they
 * are inherently clean — no sorting, filtering, or tracking parameters.
 */
class Jetpack_Canonical_Urls_Resolver {

	/**
	 * Get the canonical URL for the current page.
	 *
	 * Routes to the correct URL based on the current query conditionals.
	 *
	 * @since 15.6
	 *
	 * @return string The canonical URL, or empty string if none should be output.
	 */
	public static function get_canonical_url() {
		$url = '';

		if ( is_front_page() && is_home() ) {
			// Default homepage (latest posts).
			$url = home_url( '/' );
		} elseif ( is_front_page() ) {
			// Static front page.
			$url = home_url( '/' );
		} elseif ( is_home() ) {
			// Blog page (when a static front page is set).
			$blog_page_id = (int) get_option( 'page_for_posts' );
			if ( $blog_page_id ) {
				$url = get_permalink( $blog_page_id );
			}
		} elseif ( function_exists( 'is_shop' ) && is_shop() ) {
			// WooCommerce shop page.
			$shop_page_id = (int) get_option( 'woocommerce_shop_page_id' );
			if ( $shop_page_id ) {
				$url = get_permalink( $shop_page_id );
			}
		} elseif ( is_category() || is_tag() || is_tax() ) {
			$term = get_queried_object();
			if ( $term instanceof WP_Term ) {
				$url = get_term_link( $term );
				if ( is_wp_error( $url ) ) {
					$url = '';
				}
			}
		} elseif ( is_post_type_archive() ) {
			$url = get_post_type_archive_link( get_query_var( 'post_type' ) );
			if ( false === $url ) {
				$url = '';
			}
		} elseif ( is_author() ) {
			$author = get_queried_object();
			if ( $author instanceof WP_User ) {
				$url = get_author_posts_url( $author->ID );
			}
		} elseif ( is_year() ) {
			$url = get_year_link( get_query_var( 'year' ) );
		} elseif ( is_month() ) {
			$url = get_month_link( get_query_var( 'year' ), get_query_var( 'monthnum' ) );
		} elseif ( is_day() ) {
			$url = get_day_link( get_query_var( 'year' ), get_query_var( 'monthnum' ), get_query_var( 'day' ) );
		}
		// is_search() and is_404() intentionally return empty string (no canonical).

		if ( ! empty( $url ) ) {
			$url = self::apply_pagination( $url );
		}

		/**
		 * Filter the canonical URL before output.
		 *
		 * @module canonical-urls
		 *
		 * @since 15.6
		 *
		 * @param string $url The canonical URL for the current page.
		 */
		return apply_filters( 'jetpack_canonical_url', $url );
	}

	/**
	 * Append pagination to the canonical URL for paged views.
	 *
	 * @since 15.6
	 *
	 * @param string $url The base canonical URL.
	 * @return string The URL with pagination appended if applicable.
	 */
	private static function apply_pagination( $url ) {
		$paged = get_query_var( 'paged', 0 );

		if ( $paged < 2 ) {
			return $url;
		}

		global $wp_rewrite;

		if ( $wp_rewrite->using_permalinks() && false === strpos( $url, '?' ) ) {
			$url = user_trailingslashit( trailingslashit( $url ) . $wp_rewrite->pagination_base . '/' . $paged );
		} else {
			$url = add_query_arg( 'paged', $paged, $url );
		}

		return $url;
	}
}
