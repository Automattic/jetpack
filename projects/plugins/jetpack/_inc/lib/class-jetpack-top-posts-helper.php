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
	 * @param int    $period       Period of days to draw stats from.
	 * @param int    $items_count  Number of items to display.
	 * @param string $types        Content types to include.
	 * @return array
	 */
	public static function get_top_posts( $period, $items_count, $types ) {
		$all_time_days = floor( ( time() - strtotime( get_option( 'site_created_date' ) ) ) / ( 60 * 60 * 24 * 365 ) );

		// While we only display ten posts, users can filter out content types.
		// As such, we should obtain a few spare posts from the Stats endpoint.
		$posts_to_obtain_count = 30;

		// We should not override cache when displaying the block on the frontend.
		// But we should allow instant preview of changes when editing the block.
		$is_rendering_block = isset( $types );
		$override_cache     = ! $is_rendering_block;

		$query_args = array(
			'max'       => $posts_to_obtain_count,
			'summarize' => true,
			'num'       => $period !== 'all-time' ? $period : $all_time_days,
			'period'    => 'day',
		);

		$data = ( new WPCOM_Stats() )->get_top_posts( $query_args, $override_cache );

		if ( is_wp_error( $data ) ) {
			$data = array( 'summary' => array( 'postviews' => array() ) );
		}

		$posts_retrieved = count( $data['summary']['postviews'] );

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

		$top_posts = array();

		foreach ( $data['summary']['postviews'] as $post ) {
			$post_id   = $post['id'];
			$thumbnail = get_the_post_thumbnail_url( $post_id );

			if ( ! $thumbnail ) {
				$post_images = get_attached_media( 'image', $post_id );
				$post_image  = reset( $post_images );
				if ( $post_image ) {
					$thumbnail = wp_get_attachment_url( $post_image->ID );
				}
			}

			if ( $post['public'] ) {
				$top_posts[] = array(
					'id'        => $post_id,
					'author'    => get_the_author_meta( 'display_name', get_post_field( 'post_author', $post_id ) ),
					'context'   => get_the_category( $post_id ) ? get_the_category( $post_id ) : get_the_tags( $post_id ),
					'href'      => $post['href'],
					'date'      => get_the_date( '', $post_id ),
					'title'     => $post['title'],
					'type'      => $post['type'],
					'public'    => $post['public'],
					'views'     => isset( $post['views'] ) ? $post['views'] : 0,
					'thumbnail' => $thumbnail,
				);
			}
		}

		// This applies for rendering the block front-end, but not for editing it.
		if ( $is_rendering_block ) {
			$acceptable_types = explode( ',', $types );

			$top_posts = array_filter(
				$top_posts,
				function ( $item ) use ( $acceptable_types ) {
					return in_array( $item['type'], $acceptable_types, true );
				}
			);

			$top_posts = array_slice( $top_posts, 0, $items_count );
		}

		return $top_posts;
	}
}
