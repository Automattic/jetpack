<?php
/**
 * Top Posts & Pages block helper.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Stats\WPCOM_Stats;

/**
 * Class Jetpack_Top_Posts_Helper
 */
class Jetpack_Top_Posts_Helper {
	/**
	 * Returns user's top posts.
	 *
	 * @param int|string $period      Period of days to draw stats from, or 'all-time'.
	 * @param int        $items_count Optional. Number of items to display.
	 * @param string     $types       Optional. Content types to include.
	 * @param bool       $cached      Optional. Whether to allow caching the result in a transient and serving that back.
	 * @return array
	 */
	public static function get_top_posts( $period, $items_count = null, $types = null, $cached = true ) {
		$all_time_days = floor( ( time() - strtotime( get_option( 'site_created_date' ) ) ) / ( YEAR_IN_SECONDS ) );

		// While we only display ten posts, users can filter out content types.
		// As such, we should obtain a few spare posts from the Stats endpoint.
		$posts_to_obtain_count = 30;

		// We should not override cache when displaying the block on the frontend.
		// But we should allow instant preview of changes when editing the block.
		$is_rendering_block = ! empty( $types );
		$override_cache     = ! $is_rendering_block;

		$query_args = array(
			'max'       => $posts_to_obtain_count,
			'summarize' => true,
			'num'       => $period !== 'all-time' ? $period : $all_time_days,
			'period'    => 'day',
		);

		// Use a transient key that should be unique based on the query and accepted types.
		$transient_key = 'jp_top_posts_' . md5( wp_json_encode( $query_args ) . $types );
		$top_posts     = get_transient( $transient_key );
		if ( $cached && false !== $top_posts ) {
			return $top_posts;
		}

		// Atomic or self-hosted sites via WPCOM public v1.1 endpoint.
		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			$data = ( new WPCOM_Stats() )->get_top_posts( $query_args, $override_cache );
		} else {
			// Directly access posts on WPCOM, as Simple sites run on the same environment.
			require_lib( 'jetpack-stats' );
			if ( class_exists( '\Jetpack\Stats\Top_Posts' ) ) {
				// @phan-suppress-next-line PhanUndeclaredClassMethod
				$data = ( new \Jetpack\Stats\Top_Posts() )->get_top_posts( get_current_blog_id(), $query_args );
			} else {
				$data = array( 'summary' => array( 'postviews' => array() ) );
			}
		}

		if ( is_wp_error( $data ) ) {
			$data = array( 'summary' => array( 'postviews' => array() ) );
		}

		$acceptable_types = $is_rendering_block ? explode( ',', $types ) : array();

		// Prime the post cache for all candidates in one batched query, rather than
		// letting get_post_status() below trigger a separate lookup per post.
		_prime_post_caches( wp_list_pluck( $data['summary']['postviews'] ?? array(), 'id' ), true, true );

		// Remove posts that have subsequently been deleted. The endpoint can return more
		// entries than the `max` we asked for, so stop there, then keep only further ones
		// the block can render, so its type filter is never starved.
		$published  = array();
		$renderable = 0;

		foreach ( (array) ( $data['summary']['postviews'] ?? array() ) as $item ) {
			$capped = $is_rendering_block && count( $published ) >= $posts_to_obtain_count;

			if ( $capped && $renderable >= $items_count ) {
				break;
			}
			if ( get_post_status( $item['id'] ) !== 'publish' ) {
				continue;
			}

			$can_render = $is_rendering_block
				&& ! empty( $item['public'] )
				&& in_array( $item['type'] ?? '', $acceptable_types, true );

			if ( $capped && ! $can_render ) {
				continue;
			}

			$published[] = $item;

			if ( $can_render ) {
				++$renderable;
			}
		}

		$data['summary']['postviews'] = $published;
		$posts_retrieved              = count( $published );

		// Fallback to random posts if user does not have enough top content.
		if ( $posts_retrieved < $posts_to_obtain_count ) {
			$args = array(
				'numberposts' => $posts_to_obtain_count - $posts_retrieved,
				'exclude'     => array_column( $data['summary']['postviews'], 'id' ),
				'orderby'     => 'rand',
				'post_status' => 'publish',
			);

			$random_posts = get_posts( $args );

			foreach ( $random_posts as $post ) {
				$random_posts_data = array(
					'id'     => $post->ID,
					'href'   => get_permalink( $post->ID ),
					'date'   => $post->post_date,
					'title'  => $post->post_title,
					'type'   => 'post',
					'public' => true,
				);

				$data['summary']['postviews'][] = $random_posts_data;
			}

			$data['summary']['postviews'] = array_slice( $data['summary']['postviews'], 0, 10 );
		}

		// Narrow down to the exact posts we're going to return *before* doing the
		// expensive per-post thumbnail lookups below, so we don't fetch media for
		// posts we're about to discard.
		$candidate_posts = array_values(
			array_filter(
				$data['summary']['postviews'],
				function ( $post ) use ( $is_rendering_block, $acceptable_types ) {
					if ( empty( $post['public'] ) ) {
						return false;
					}
					return ! $is_rendering_block || in_array( $post['type'] ?? '', $acceptable_types, true );
				}
			)
		);

		if ( $is_rendering_block ) {
			$candidate_posts = array_slice( $candidate_posts, 0, $items_count );
		}

		$top_posts = array();

		foreach ( $candidate_posts as $post ) {
			$post_id   = $post['id'];
			$thumbnail = get_the_post_thumbnail_url( $post_id );

			if ( ! $thumbnail ) {
				$post_images = get_attached_media( 'image', $post_id );
				$post_image  = reset( $post_images );
				if ( $post_image ) {
					$thumbnail = wp_get_attachment_url( $post_image->ID );
				}
			}

			$top_post = array(
				'id'        => $post_id,
				'author'    => get_the_author_meta( 'display_name', get_post_field( 'post_author', $post_id ) ),
				'context'   => get_the_category( $post_id ) ? get_the_category( $post_id ) : get_the_tags( $post_id ),
				// Use the local permalink to avoid stale values from the Stats API.
				'href'      => get_permalink( $post_id ),
				'date'      => get_the_date( '', $post_id ),
				'title'     => $post['title'],
				'type'      => $post['type'] ?? '',
				'public'    => $post['public'],
				'views'     => $post['views'] ?? 0,
				'thumbnail' => $thumbnail,
			);

			/**
			 * Allows modifying the title of each individual post returned by the Top Posts helper.
			 *
			 * Applies to both the Top Posts block's front-end output and the REST
			 * response used by the block editor preview.
			 *
			 * @module stats
			 *
			 * @since 15.8
			 *
			 * @param string $post_title Post title.
			 * @param array  $top_post   Information about the post.
			 */
			$top_post['title'] = apply_filters( 'jetpack_top_posts_item_title', $top_post['title'], $top_post );

			$top_posts[] = $top_post;
		}

		if ( $cached ) {
			set_transient( $transient_key, $top_posts, WPCOM_Stats::get_cache_expiration() );
		}

		return $top_posts;
	}
}
