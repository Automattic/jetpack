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
	 * Most block queries one batch request may carry. Bounds the work a single request can
	 * ask for; the editor splits a larger page into consecutive batches.
	 */
	const POSTS_BATCH_MAX_QUERIES = 50;

	/**
	 * Most posts one batch request may be asked to exclude up front. The editor's list is the
	 * specific posts its blocks pin plus the post being edited, so this is far above what a page
	 * produces; it bounds what a caller can make every query in the batch carry.
	 */
	const POSTS_BATCH_MAX_EXCLUDE = 1000;

	/**
	 * Get thumbnail featured image source for the rest field.
	 *
	 * @param array $object_info The object info.
	 * @return array | bool Featured image if available, false if not.
	 */
	public static function newspack_blocks_get_image_src( $object_info ) {
		$featured_image_set = [];

		if ( 0 === $object_info['featured_media'] ) {
			return false;
		}

		// Large image.
		$feat_img_array_large        = wp_get_attachment_image_src(
			$object_info['featured_media'],
			'large',
			false
		);
		$featured_image_set['large'] = $feat_img_array_large[0] ?? null;

		// Landscape image.
		$landscape_size = Newspack_Blocks::image_size_for_orientation( 'landscape' );

		$feat_img_array_landscape        = wp_get_attachment_image_src(
			$object_info['featured_media'],
			$landscape_size,
			false
		);
		$featured_image_set['landscape'] = $feat_img_array_landscape[0] ?? null;

		// Portrait image.
		$portrait_size = Newspack_Blocks::image_size_for_orientation( 'portrait' );

		$feat_img_array_portrait        = wp_get_attachment_image_src(
			$object_info['featured_media'],
			$portrait_size,
			false
		);
		$featured_image_set['portrait'] = $feat_img_array_portrait[0] ?? null;

		// Square image.
		$square_size = Newspack_Blocks::image_size_for_orientation( 'square' );

		$feat_img_array_square        = wp_get_attachment_image_src(
			$object_info['featured_media'],
			$square_size,
			false
		);
		$featured_image_set['square'] = $feat_img_array_square[0] ?? null;

		// Uncropped image.
		$uncropped_size = 'newspack-article-block-uncropped';

		$feat_img_array_uncropped        = wp_get_attachment_image_src(
			$object_info['featured_media'],
			$uncropped_size,
			false
		);
		$featured_image_set['uncropped'] = $feat_img_array_uncropped[0] ?? null;

		return $featured_image_set;
	}

	/**
	 * Get primary category for the rest field.
	 *
	 * @param array $object_info The object info.
	 * @return string Category name.
	 */
	public static function newspack_blocks_get_primary_category( $object_info ) {
		$category = false;

		// Use Yoast primary category if set.
		if ( class_exists( 'WPSEO_Primary_Term' ) ) {
			$primary_term = new WPSEO_Primary_Term( 'category', $object_info['id'] );
			$category_id  = $primary_term->get_primary_term();
			if ( $category_id ) {
				$category = get_term( $category_id );
			}
		}

		if ( ! $category ) {
			$categories_list = get_the_category( $object_info['id'] );
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
	 * @param array $object_info The object info.
	 * @return string classes from assigned categories and tags.
	 */
	public static function newspack_blocks_get_cat_tag_classes( $object_info ) {
		return Newspack_Blocks::get_term_classes( $object_info['id'] );
	}

	/**
	 * Get all sponsor information for the rest field.
	 *
	 * @param array $object_info The object info.
	 * @return array sponsor information.
	 */
	public static function newspack_blocks_sponsor_info( $object_info ) {
		$sponsors = Newspack_Blocks::get_all_sponsors(
			$object_info['id'],
			'native',
			'post',
			array(
				'maxwidth'  => 80,
				'maxheight' => 40,
			)
		);
		if ( ! empty( $sponsors ) ) {
			$sponsor_info = [];
			foreach ( $sponsors as $sponsor ) {
				$sponsor_info_item = [
					'flag'          => $sponsor['sponsor_flag'],
					'sponsor_name'  => $sponsor['sponsor_name'],
					'sponsor_url'   => $sponsor['sponsor_url'],
					'byline_prefix' => $sponsor['sponsor_byline'],
					'id'            => $sponsor['sponsor_id'],
					'scope'         => $sponsor['sponsor_scope'],
				];
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
	 * Get tag labels for the REST API.
	 *
	 * @param  array $object_info The object info.
	 * @return array|bool Tag labels, or false if none.
	 */
	public static function newspack_blocks_get_tag_labels( $object_info ) {
		$tag_labels = Newspack_Blocks::get_tag_labels( $object_info['id'] );
		return ! empty( $tag_labels ) ? array_values( $tag_labels ) : false;
	}

	/**
	 * Pass whether there is a custom excerpt to the editor.
	 *
	 * @param array $object_info The object info.
	 * @return boolean custom excerpt status.
	 */
	public static function newspack_blocks_has_custom_excerpt( $object_info ) {
		$post_has_custom_excerpt = has_excerpt( $object_info['id'] );
		return $post_has_custom_excerpt;
	}

	/**
	 * Point every anchor in a rendered payload fragment at '#'.
	 *
	 * The editor canvas renders the byline and avatar fields verbatim, so a
	 * live URL navigates the canvas iframe away from the post being edited.
	 * Runs on the finished markup — after the newspack_blocks_post_byline
	 * filter — so links injected by filters (e.g. custom bylines) are covered
	 * too, matching the category-link convention used elsewhere in this
	 * payload. Only real anchor href attributes are rewritten: "href=" text
	 * inside another attribute's value (avatar proxy URLs), xlink:href sprite
	 * references, and plain text all pass through untouched.
	 *
	 * @param string $html Rendered markup destined for the editor payload.
	 * @return string Markup with every anchor href pointing at '#'.
	 */
	private static function neutralize_editor_links( $html ) {
		$processor = new \WP_HTML_Tag_Processor( (string) $html );
		while ( $processor->next_tag( 'A' ) ) {
			$processor->set_attribute( 'href', '#' );
		}
		return $processor->get_updated_html();
	}

	/**
	 * Register the video-playlist endpoint.
	 */
	public static function register_video_playlist_endpoint() {
		register_rest_route(
			'newspack-blocks/v1',
			'/video-playlist',
			[
				'methods'             => 'GET',
				'callback'            => [ 'Newspack_Blocks_API', 'video_playlist_endpoint' ],
				'permission_callback' => function() {
					return current_user_can( 'edit_posts' );
				},
			]
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
	 * Posts batch endpoint.
	 *
	 * Answers every Homepage Posts block on a page in one request. Deduplication makes each
	 * block depend on the posts every block above it shows, so the editor used to wait for one
	 * request before sending the next; on a page with dozens of blocks the per-request startup
	 * cost added up to most of the load time. Each query still goes through the single-block
	 * route, so its argument schema, defaults, and permission check apply unchanged.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response List of { clientId, posts } or { clientId, error }, in request order.
	 */
	public static function posts_batch_endpoint( $request ) {
		$exclude = array_map( 'intval', (array) $request->get_param( 'exclude' ) );
		$results = [];
		// Each query must start from the state a standalone request would, because two pieces of
		// per-request state outlive one: the global post, which posts_endpoint() leaves on the last
		// post it formatted, and the deduplication list, which a Homepage Posts or Carousel block
		// embedded in a formatted post writes its rendered IDs into while `the_content` runs. Left
		// in place, that list lands in the next query's post__not_in and silently drops posts.
		$original_post = $GLOBALS['post'] ?? null;

		foreach ( $request->get_param( 'queries' ) as $query ) {
			$client_id   = $query['clientId'];
			$deduplicate = ! empty( $query['deduplicate'] );
			$params      = (array) ( $query['postsQuery'] ?? [] );
			if ( $deduplicate ) {
				$params['exclude'] = $exclude; // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_exclude
			}

			$single = new WP_REST_Request( 'GET', '/newspack-blocks/v1/newspack-blocks-posts' );
			$single->set_query_params( $params );

			try {
				$response = rest_do_request( $single );
			} catch ( \Throwable $e ) {
				self::reset_batch_query_state( $original_post );
				// A throw skips the excerpt filter posts_endpoint() would have removed itself.
				Newspack_Blocks::remove_excerpt_filter();
				// One bad query must not cost the rest of the page its posts. The message itself
				// can carry a query or a path, so the block gets a generic one.
				error_log( 'Newspack Blocks batch query failed: ' . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				$results[] = [
					'clientId' => $client_id,
					'error'    => __( 'The posts for this block could not be loaded.', 'jetpack-mu-wpcom' ),
				];
				continue;
			}
			self::reset_batch_query_state( $original_post );

			if ( $response->is_error() ) {
				$results[] = [
					'clientId' => $client_id,
					'error'    => $response->as_error()->get_error_message(),
				];
				continue;
			}

			$posts = $response->get_data();
			if ( $deduplicate ) {
				$exclude = array_merge( $exclude, array_map( 'intval', wp_list_pluck( $posts, 'id' ) ) );
			}
			$results[] = [
				'clientId' => $client_id,
				'posts'    => $posts,
			];
		}

		return new \WP_REST_Response( $results );
	}

	/**
	 * Return the state a batched query leaves behind to what a standalone request starts from.
	 *
	 * @param WP_Post|null $original_post The global post as the batch request found it.
	 */
	private static function reset_batch_query_state( $original_post ) {
		$GLOBALS['post'] = $original_post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		Newspack_Blocks::reset_deduplication();
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
			$args['post__not_in'] = $attributes['exclude']; // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in
		}

		if ( $attributes['include'] && count( $attributes['include'] ) ) {
			$args['post__in'] = $attributes['include'];
			$args['orderby']  = 'post__in';
			$args['order']    = 'ASC';
		}

		if ( isset( $attributes['showExcerpt'], $attributes['excerptLength'] ) ) {
			$block_attributes = [
				'showExcerpt'   => $attributes['showExcerpt'],
				'excerptLength' => $attributes['excerptLength'],
			];
			Newspack_Blocks::filter_excerpt( $block_attributes );
		}

		$query = new WP_Query( $args );
		$posts = [];

		foreach ( $query->posts as $post ) {
			$GLOBALS['post'] = $post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			setup_postdata( $post );

			// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
			$excerpt = apply_filters( 'get_the_excerpt', $post->post_excerpt, $post );
			$excerpt = apply_filters( 'the_excerpt', $excerpt );
			$content = apply_filters( 'the_content', $post->post_content );
			// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

			$meta = new WP_REST_Post_Meta_Fields( 'post' );
			$data = [
				'author'              => (int) $post->post_author,
				'content'             => [
					'rendered' => post_password_required( $post ) ? '' : $content,
				],
				'date'                => Newspack_Blocks::get_displayed_post_date( $post ),
				'date_formatted'      => Newspack_Blocks::get_formatted_displayed_post_date( $post ),
				'article_meta_footer' => Newspack_Blocks::get_article_meta_footer( $post ),
				'excerpt'             => [
					'rendered' => post_password_required( $post ) ? '' : $excerpt,
				],
				'full_content'        => get_the_content( $post->ID ),
				'featured_media'      => (int) get_post_thumbnail_id( $post->ID ),
				'id'                  => $post->ID,
				'meta'                => $meta->get_value( $post->ID, $request ),
				'title'               => [
					'rendered' => get_the_title( $post->ID ),
				],
			];

			// The meta bag is returned verbatim, and the Homepage Posts editor component
			// assigns the subtitle with RawHTML. A value stored before the theme gained a
			// sanitize_callback is still raw, so it is filtered here rather than at that
			// sink -- this endpoint is the only thing between the two.
			if ( isset( $data['meta']['newspack_post_subtitle'] ) ) {
				$data['meta']['newspack_post_subtitle'] = Newspack_Blocks::sanitize_post_subtitle( $data['meta']['newspack_post_subtitle'] );
			}

			$sponsors = Newspack_Blocks::get_all_sponsors( $post->ID );
			$author_info = Newspack_Blocks::prepare_authors();
			$add_ons  = [
				'newspack_article_classes'          => Newspack_Blocks::get_term_classes( $data['id'] ),
				'newspack_category_info'            => self::newspack_blocks_get_primary_category( $data ),
				'newspack_featured_image_caption'   => Newspack_Blocks::get_image_caption( $data['featured_media'], $attributes['showCaption'], $attributes['showCredit'] ),
				'newspack_featured_image_src'       => self::newspack_blocks_get_image_src( $data ),
				'newspack_has_custom_excerpt'       => self::newspack_blocks_has_custom_excerpt( $data ),
				'newspack_post_sponsors'            => self::newspack_blocks_sponsor_info( $data ),
				'newspack_sponsors_show_author'     => Newspack_Blocks::newspack_display_sponsors_and_authors( $sponsors ),
				'newspack_sponsors_show_categories' => Newspack_Blocks::newspack_display_sponsors_and_categories( $sponsors ),
				'newspack_tag_labels'               => self::newspack_blocks_get_tag_labels( $data ),
				'newspack_post_avatars'             => self::neutralize_editor_links( \newspack_blocks_format_avatars( $author_info ) ),
				'newspack_post_byline'              => self::neutralize_editor_links( \newspack_blocks_format_byline( $author_info ) ),
				'post_status'                       => $post->post_status,
				'post_type'                         => $post->post_type,
				'post_link'                         => Newspack_Blocks::get_post_link( $post->ID ),
			];

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
			return new \WP_REST_Response( [] );
		}
		add_filter( 'posts_where', [ 'Newspack_Blocks_API', 'add_post_title_wildcard_search' ], 10, 2 );

		$args = [
			'post_status'           => 'publish',
			'title_wildcard_search' => esc_sql( $params['search'] ),
			'posts_per_page'        => $params['postsToShow'],
		];

		if ( $params['postType'] && count( $params['postType'] ) ) {
			$args['post_type'] = $params['postType'];
		} else {
			$args['post_type'] = 'post';
		}

		$query = new WP_Query( $args );
		remove_filter( 'posts_where', [ 'Newspack_Blocks_API', 'add_post_title_wildcard_search' ], 10, 2 );
		return new \WP_REST_Response(
			array_map(
				function( $post ) {
					return [
						'id'    => $post->ID,
						'title' => $post->post_title,
					];
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
