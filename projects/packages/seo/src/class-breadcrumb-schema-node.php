<?php
/**
 * BreadcrumbList Schema.org node builder.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Builds a BreadcrumbList for the current public request.
 */
class Breadcrumb_Schema_Node {

	/**
	 * Build the breadcrumb node for the current request.
	 *
	 * @return array|null
	 */
	public static function build() {
		if ( is_front_page() || is_search() || is_404() ) {
			return null;
		}

		$items = array(
			array(
				'name' => __( 'Home', 'jetpack-seo' ),
				'item' => home_url( '/' ),
			),
		);

		if ( is_singular() ) {
			$items = self::singular_items( $items );
		} elseif ( is_category() || is_tag() || is_tax() ) {
			$items = self::taxonomy_items( $items );
		} elseif ( is_home() ) {
			$items = self::blog_items( $items );
		} elseif ( is_post_type_archive() ) {
			$items = self::post_type_archive_items( $items );
		} elseif ( is_author() ) {
			$items = self::author_items( $items );
		} elseif ( is_date() ) {
			$items = self::date_items( $items );
		} else {
			return null;
		}

		if ( null === $items || count( $items ) < 2 ) {
			return null;
		}

		$list_items = array();
		$last       = count( $items ) - 1;
		foreach ( $items as $index => $item ) {
			$name = self::text( $item['name'] ?? '' );
			if ( '' === $name ) {
				return null;
			}

			$list_item = array(
				'@type'    => 'ListItem',
				'position' => $index + 1,
				'name'     => $name,
			);
			if ( $index < $last && ! empty( $item['item'] ) ) {
				$list_item['item'] = $item['item'];
			}
			$list_items[] = $list_item;
		}

		return array(
			'@type'           => 'BreadcrumbList',
			'itemListElement' => $list_items,
		);
	}

	/**
	 * Add breadcrumbs for a singular post.
	 *
	 * @param array $items Existing items.
	 * @return array|null
	 */
	private static function singular_items( array $items ) {
		$post = get_queried_object();
		if ( ! $post instanceof \WP_Post || 'publish' !== $post->post_status ) {
			return null;
		}

		$post_type = get_post_type_object( $post->post_type );
		if ( ! $post_type || ! is_post_type_viewable( $post_type ) ) {
			return null;
		}

		if ( 'post' === $post->post_type ) {
			self::add_posts_page( $items );
		} elseif ( 'page' !== $post->post_type && $post_type->has_archive ) {
			self::add_item( $items, $post_type->labels->name, get_post_type_archive_link( $post->post_type ) );
		}

		$front_page_id = 'page' === get_option( 'show_on_front' ) ? (int) get_option( 'page_on_front' ) : 0;
		if ( is_post_type_hierarchical( $post->post_type ) ) {
			foreach ( array_reverse( get_post_ancestors( $post ) ) as $ancestor_id ) {
				$ancestor = get_post( $ancestor_id );
				if ( $ancestor instanceof \WP_Post && $front_page_id === $ancestor->ID ) {
					continue;
				}
				if ( $ancestor instanceof \WP_Post && 'publish' === $ancestor->post_status ) {
					self::add_item( $items, $ancestor->post_title, get_permalink( $ancestor ) );
				}
			}
		}

		return self::add_current( $items, $post->post_title );
	}

	/**
	 * Add breadcrumbs for a taxonomy archive.
	 *
	 * @param array $items Existing items.
	 * @return array|null
	 */
	private static function taxonomy_items( array $items ) {
		$term = get_queried_object();
		if ( ! $term instanceof \WP_Term ) {
			return null;
		}

		$taxonomy = get_taxonomy( $term->taxonomy );
		if ( ! $taxonomy || ! $taxonomy->public ) {
			return null;
		}

		if ( $taxonomy->hierarchical ) {
			foreach ( array_reverse( get_ancestors( $term->term_id, $term->taxonomy, 'taxonomy' ) ) as $ancestor_id ) {
				$ancestor = get_term( $ancestor_id, $term->taxonomy );
				if ( ! $ancestor instanceof \WP_Term ) {
					continue;
				}

				$link = get_term_link( $ancestor );
				if ( ! is_wp_error( $link ) ) {
					self::add_item( $items, $ancestor->name, $link );
				}
			}
		}

		return self::add_current( $items, $term->name );
	}

	/**
	 * Add the configured posts page as the current blog archive.
	 *
	 * @param array $items Existing items.
	 * @return array|null
	 */
	private static function blog_items( array $items ) {
		$page = self::posts_page();
		return null === $page ? null : self::add_current( $items, $page->post_title );
	}

	/**
	 * Add a custom post type archive.
	 *
	 * @param array $items Existing items.
	 * @return array|null
	 */
	private static function post_type_archive_items( array $items ) {
		$post_type = get_queried_object();
		if ( ! $post_type instanceof \WP_Post_Type || ! is_post_type_viewable( $post_type ) || ! $post_type->has_archive ) {
			return null;
		}

		return self::add_current( $items, $post_type->labels->name );
	}

	/**
	 * Add an author archive, optionally under the posts page.
	 *
	 * @param array $items Existing items.
	 * @return array|null
	 */
	private static function author_items( array $items ) {
		$author = get_queried_object();
		if ( ! $author instanceof \WP_User || ! $author->exists() ) {
			return null;
		}

		self::add_posts_page( $items );
		return self::add_current( $items, $author->display_name );
	}

	/**
	 * Add a year, month, or day archive under the posts page.
	 *
	 * @param array $items Existing items.
	 * @return array|null
	 */
	private static function date_items( array $items ) {
		global $wp_locale;

		$year  = (int) get_query_var( 'year' );
		$month = (int) get_query_var( 'monthnum' );
		$day   = (int) get_query_var( 'day' );

		if ( $year < 1 || $year > 9999 ) {
			return null;
		}

		self::add_posts_page( $items );
		if ( is_year() ) {
			return self::add_current( $items, (string) $year );
		}

		if ( $month < 1 || $month > 12 ) {
			return null;
		}

		self::add_item( $items, (string) $year, get_year_link( $year ) );
		$month_name = $wp_locale->get_month( $month );
		if ( is_month() ) {
			return self::add_current( $items, $month_name );
		}

		if ( ! is_day() || ! checkdate( $month, $day, $year ) ) {
			return null;
		}

		self::add_item( $items, $month_name, get_month_link( $year, $month ) );
		return self::add_current( $items, (string) $day );
	}

	/**
	 * Add the configured, distinct posts page as an ancestor.
	 *
	 * @param array $items Items passed by reference.
	 * @return void
	 */
	private static function add_posts_page( array &$items ) {
		$page = self::posts_page();
		if ( null !== $page && (int) get_option( 'page_on_front' ) !== $page->ID ) {
			self::add_item( $items, $page->post_title, get_permalink( $page ) );
		}
	}

	/**
	 * Get the valid configured posts page.
	 *
	 * @return \WP_Post|null
	 */
	private static function posts_page() {
		if ( 'page' !== get_option( 'show_on_front' ) ) {
			return null;
		}

		$page = get_post( (int) get_option( 'page_for_posts' ) );
		return $page instanceof \WP_Post && 'publish' === $page->post_status && '' !== self::text( $page->post_title ) ? $page : null;
	}

	/**
	 * Add a navigable ancestor when its name and URL are valid.
	 *
	 * @param array  $items Items passed by reference.
	 * @param mixed  $name  Item name.
	 * @param string $url   Item URL.
	 * @return void
	 */
	private static function add_item( array &$items, $name, $url ) {
		$name = self::text( $name );
		if ( '' !== $name && is_string( $url ) && '' !== $url ) {
			$items[] = array(
				'name' => $name,
				'item' => $url,
			);
		}
	}

	/**
	 * Add the non-linked current item.
	 *
	 * @param array $items Existing items.
	 * @param mixed $name  Current item name.
	 * @return array|null
	 */
	private static function add_current( array $items, $name ) {
		$name = self::text( $name );
		if ( '' === $name ) {
			return null;
		}

		$items[] = array( 'name' => $name );
		return $items;
	}

	/**
	 * Normalize a breadcrumb name to trimmed plain text.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private static function text( $value ) {
		return is_string( $value ) ? trim( wp_strip_all_tags( $value ) ) : '';
	}
}
