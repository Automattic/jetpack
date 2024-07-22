<?php
/**
 * Register Newspack Blocks rest fields
 *
 * @package Newspack_Blocks
 */

/**
 * `Newspack_Blocks_API` is a wrapper for `register_rest_fields()`
 */
class Newspack_Blocks_API {
	/**
	 * Get thumbnail featured image source for the rest field.
	 *
	 * @param array $object The object info.
	 * @return array | bool Featured image if available, false if not.
	 */
	public static function newspack_blocks_get_image_src( $object ) {
		$featured_image_set = array();

		if ( 0 === $object['featured_media'] ) {
			return false;
		}

		// Large image.
		$feat_img_array_large        = wp_get_attachment_image_src(
			$object['featured_media'],
			'large',
			false
		);
		$featured_image_set['large'] = $feat_img_array_large[0];

		// Landscape image.
		$landscape_size = Newspack_Blocks::image_size_for_orientation( 'landscape' );

		$feat_img_array_landscape        = wp_get_attachment_image_src(
			$object['featured_media'],
			$landscape_size,
			false
		);
		$featured_image_set['landscape'] = $feat_img_array_landscape[0];

		// Portrait image.
		$portrait_size = Newspack_Blocks::image_size_for_orientation( 'portrait' );

		$feat_img_array_portrait        = wp_get_attachment_image_src(
			$object['featured_media'],
			$portrait_size,
			false
		);
		$featured_image_set['portrait'] = $feat_img_array_portrait[0];

		// Square image.
		$square_size = Newspack_Blocks::image_size_for_orientation( 'square' );

		$feat_img_array_square        = wp_get_attachment_image_src(
			$object['featured_media'],
			$square_size,
			false
		);
		$featured_image_set['square'] = $feat_img_array_square[0];

		// Uncropped image.
		$uncropped_size = 'newspack-article-block-uncropped';

		$feat_img_array_uncropped        = wp_get_attachment_image_src(
			$object['featured_media'],
			$uncropped_size,
			false
		);
		$featured_image_set['uncropped'] = $feat_img_array_uncropped[0];

		return $featured_image_set;
	}

	/**
	 * Get thumbnail featured image captions for the rest field.
	 *
	 * @param array $object The object info.
	 * @return string|null Image caption on success, null on failure.
	 */
	public static function newspack_blocks_get_image_caption( $object ) {
		return (int) $object['featured_media'] > 0 ? trim( wp_get_attachment_caption( $object['featured_media'] ) ) : null;
	}

	/**
	 * Get author info for the rest field.
	 *
	 * @param array $object The object info.
	 * @return array Author data.
	 */
	public static function newspack_blocks_get_author_info( $object ) {
		$author_data = array();

		if ( function_exists( 'coauthors_posts_links' ) && ! empty( get_coauthors() ) ) :
			$authors = get_coauthors();

			foreach ( $authors as $author ) {
				$author_avatar = coauthors_get_avatar( $author, 48 );
				$author_link   = null;

				if ( function_exists( 'coauthors_posts_links' ) ) {
					$author_link = get_author_posts_url( $author->ID, $author->user_nicename );
				}
				$author_data[] = array(
					/* Get the author name */
					'display_name' => esc_html( $author->display_name ),
					/* Get the author avatar */
					'avatar'       => wp_kses_post( $author_avatar ),
					/* Get the author ID */
					'id'           => $author->ID,
					/* Get the author Link */
					'author_link'  => $author_link,
				);
			}
		else :
			$author_data[] = array(
				/* Get the author name */
				'display_name' => get_the_author_meta( 'display_name', $object['author'] ),
				/* Get the author avatar */
				'avatar'       => get_avatar( $object['author'], 48 ),
				/* Get the author ID */
				'id'           => $object['author'],
				/* Get the author Link */
				'author_link'  => get_author_posts_url( $object['author'] ),
			);
		endif;

		/* Return the author data */
		return $author_data;
	}

	/**
	 * Get primary category for the rest field.
	 *
	 * @param array $object The object info.
	 * @return string Category name.
	 */
	public static function newspack_blocks_get_primary_category( $object ) {
		$category = false;

		// Use Yoast primary category if set.
		if ( class_exists( 'WPSEO_Primary_Term' ) ) {
			$primary_term = new WPSEO_Primary_Term( 'category', $object['id'] );
			$category_id  = $primary_term->get_primary_term();
			if ( $category_id ) {
				$category = get_term( $category_id );
			}
		}

		if ( ! $category ) {
			$categories_list = get_the_category( $object['id'] );
			if ( ! empty( $categories_list ) ) {
				$category = $categories_list[0];
			}
		}

		if ( ! $category ) {
			return '';
		}

		$linked_category = '<a href="#">' . $category->name . '</a>';

		return apply_filters( 'newspack_blocks_categories', $linked_category );
	}

	/**
	 * Get a list of category, tag classes for the rest field.
	 *
	 * @param array $object The object info.
	 * @return string classes from assigned categories and tags.
	 */
	public static function newspack_blocks_get_cat_tag_classes( $object ) {
		return Newspack_Blocks::get_term_classes( $object['id'] );
	}

	/**
	 * Get all sponsor information for the rest field.
	 *
	 * @param array $object The object info.
	 * @return array sponsor information.
	 */
	public static function newspack_blocks_sponsor_info( $object ) {
		$sponsors = Newspack_Blocks::get_all_sponsors(
			$object['id'],
			'native',
			'post',
			array(
				'maxwidth'  => 80,
				'maxheight' => 40,
			)
		);
		if ( ! empty( $sponsors ) ) {
			$sponsor_info = array();
			foreach ( $sponsors as $sponsor ) {
				$sponsor_info_item = array(
					'flag'          => $sponsor['sponsor_flag'],
					'sponsor_name'  => $sponsor['sponsor_name'],
					'sponsor_url'   => $sponsor['sponsor_url'],
					'byline_prefix' => $sponsor['sponsor_byline'],
					'id'            => $sponsor['sponsor_id'],
					'scope'         => $sponsor['sponsor_scope'],
				);
				if ( ! empty( $sponsor['sponsor_logo'] ) ) {
					$sponsor_info_item['src']        = $sponsor['sponsor_logo']['src'];
					$sponsor_info_item['img_width']  = $sponsor['sponsor_logo']['img_width'];
					$sponsor_info_item['img_height'] = $sponsor['sponsor_logo']['img_height'];
				}
				$sponsor_info[] = $sponsor_info_item;
			}
			return $sponsor_info;
		}

		return false;
	}

	/**
	 * Pass whether there is a custom excerpt to the editor.
	 *
	 * @param array $object The object info.
	 * @return boolean custom excerpt status.
	 */
	public static function newspack_blocks_has_custom_excerpt( $object ) {
		$post_has_custom_excerpt = has_excerpt( $object['id'] );
		return $post_has_custom_excerpt;
	}

	/**
	 * Register the video-playlist endpoint.
	 */
	public static function register_video_playlist_endpoint() {
		register_rest_route(
			'newspack-blocks/v1',
			'/video-playlist',
			array(
				'methods'             => 'GET',
				'callback'            => array( 'Newspack_Blocks_API', 'video_playlist_endpoint' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}

	/**
	 * Process requests to the video-playlist endpoint.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response.
	 */
	public static function video_playlist_endpoint( $request ) {
		$args = $request->get_params();
		return new \WP_REST_Response( newspack_blocks_get_video_playlist( $args ), 200 );
	}

	/**
	 * Posts endpoint
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response.
	 */
	public static function posts_endpoint( $request ) {
		$attributes = $request->get_params();
		$args       = Newspack_Blocks::build_articles_query( $attributes, apply_filters( 'newspack_blocks_block_name', 'newspack-blocks/homepage-articles' ) );

		if ( $attributes['exclude'] && count( $attributes['exclude'] ) ) {
			$args['post__not_in'] = $attributes['exclude'];
		}

		if ( $attributes['include'] && count( $attributes['include'] ) ) {
			$args['post__in'] = $attributes['include'];
			$args['orderby']  = 'post__in';
			$args['order']    = 'ASC';
		}

		if ( isset( $attributes['showExcerpt'], $attributes['excerptLength'] ) ) {
			$block_attributes = array(
				'showExcerpt'   => $attributes['showExcerpt'],
				'excerptLength' => $attributes['excerptLength'],
			);
			Newspack_Blocks::filter_excerpt( $block_attributes );
		}

		$query = new WP_Query( $args );
		$posts = array();

		foreach ( $query->posts as $post ) {
			$GLOBALS['post'] = $post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			setup_postdata( $post );

			$post_date_gmt = '0000-00-00 00:00:00' === $post->post_date_gmt ? get_gmt_from_date( $post->post_date ) : $post->post_date_gmt;

			// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
			$excerpt = apply_filters( 'get_the_excerpt', $post->post_excerpt, $post );
			$excerpt = apply_filters( 'the_excerpt', $excerpt );
			$content = apply_filters( 'the_content', $post->post_content );
			// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

			$meta = new WP_REST_Post_Meta_Fields( 'post' );
			$data = array(
				'author'         => (int) $post->post_author,
				'content'        => array(
					'rendered' => post_password_required( $post ) ? '' : $content,
				),
				'date_gmt'       => mysql_to_rfc3339( $post_date_gmt ),
				'date'           => mysql_to_rfc3339( $post->post_date ),
				'excerpt'        => array(
					'rendered' => post_password_required( $post ) ? '' : $excerpt,
				),
				'featured_media' => (int) get_post_thumbnail_id( $post->ID ),
				'id'             => $post->ID,
				'meta'           => $meta->get_value( $post->ID, $request ),
				'title'          => array(
					'rendered' => get_the_title( $post->ID ),
				),
			);

			$sponsors = Newspack_Blocks::get_all_sponsors( $post->ID );
			$add_ons  = array(
				'newspack_article_classes'          => Newspack_Blocks::get_term_classes( $data['id'] ),
				'newspack_author_info'              => self::newspack_blocks_get_author_info( $data ),
				'newspack_category_info'            => self::newspack_blocks_get_primary_category( $data ),
				'newspack_featured_image_caption'   => self::newspack_blocks_get_image_caption( $data ),
				'newspack_featured_image_src'       => self::newspack_blocks_get_image_src( $data ),
				'newspack_has_custom_excerpt'       => self::newspack_blocks_has_custom_excerpt( $data ),
				'newspack_post_sponsors'            => self::newspack_blocks_sponsor_info( $data ),
				'newspack_sponsors_show_author'     => Newspack_Blocks::newspack_display_sponsors_and_authors( $sponsors ),
				'newspack_sponsors_show_categories' => Newspack_Blocks::newspack_display_sponsors_and_categories( $sponsors ),
				'post_status'                       => $post->post_status,
				'post_type'                         => $post->post_type,
				'post_link'                         => Newspack_Blocks::get_post_link( $post->ID ),
			);

			// Support Newspack Listings hide author/publish date options.
			if ( class_exists( 'Newspack_Listings\Core' ) ) {
				$add_ons['newspack_listings_hide_author']       = apply_filters( 'newspack_listings_hide_author', false ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
				$add_ons['newspack_listings_hide_publish_date'] = apply_filters( 'newspack_listings_hide_publish_date', false ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
			}

			$posts[] = array_merge( $data, $add_ons );
		}

		Newspack_Blocks::remove_excerpt_filter();

		return new \WP_REST_Response( $posts );
	}

	/**
	 * Lookup individual posts by title only.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response.
	 */
	public static function specific_posts_endpoint( $request ) {
		$params = $request->get_params();
		if ( empty( $params['search'] ) ) {
			return new \WP_REST_Response( array() );
		}
		add_filter( 'posts_where', array( 'Newspack_Blocks_API', 'add_post_title_wildcard_search' ), 10, 2 );

		$args = array(
			'post_status'           => 'publish',
			'title_wildcard_search' => esc_sql( $params['search'] ),
			'posts_per_page'        => $params['postsToShow'],
		);

		if ( $params['postType'] && count( $params['postType'] ) ) {
			$args['post_type'] = $params['postType'];
		} else {
			$args['post_type'] = 'post';
		}

		$query = new WP_Query( $args );
		remove_filter( 'posts_where', array( 'Newspack_Blocks_API', 'add_post_title_wildcard_search' ), 10, 2 );
		return new \WP_REST_Response(
			array_map(
				function ( $post ) {
					return array(
						'id'    => $post->ID,
						'title' => $post->post_title,
					);
				},
				$query->posts
			),
			200
		);
	}

	/**
	 * Add title wildcard search to post lookup query.
	 *
	 * @param String   $where Where clause.
	 * @param WP_Query $query The query.
	 */
	public static function add_post_title_wildcard_search( $where, $query ) {
		$search = ! empty( $query->query['title_wildcard_search'] ) ? $query->query['title_wildcard_search'] : null;
		$where .= ' AND post_title LIKE "%' . $search . '%" ';
		return $where;
	}
}

add_action( 'rest_api_init', array( 'Newspack_Blocks_API', 'register_video_playlist_endpoint' ) );
