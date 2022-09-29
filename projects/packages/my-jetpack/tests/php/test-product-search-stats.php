<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Search_Stats;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for Search_Stats.
 *
 * @package automattic/my-jetpack
 */
class Test_Search_Stats extends TestCase {

	/**
	 * Test post type breakdown function.
	 */
	public function test_get_post_type_breakdown_with() {
		$indexable_post_types   = array( 'post', 'page', 'product', 'appointment' );
		$indexable_status_array = array( 'publish', 'complete' );
		$raw_posts_counts       = $this->get_raw_post_type_breakdown();

		$this->assertEquals(
			array(
				'appointment' => 14,
				'product'     => 13,
				'page'        => 12,
				'post'        => 11,
				'topic'       => 10,
			),
			Search_Stats::get_post_type_breakdown_with( $raw_posts_counts, $indexable_post_types, $indexable_status_array )
		);
	}

	/**
	 * Raw post type breakdown to filter on.
	 */
	public function get_raw_post_type_breakdown() {
		return array(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'num_posts'   => 11,
			),
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'num_posts'   => 12,
			),
			array(
				'post_type'   => 'post',
				'post_status' => 'draft',
				'num_posts'   => 5,
			),
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
				'num_posts'   => 6,
			),
			array(
				'post_type'   => 'product',
				'post_status' => 'publish',
				'num_posts'   => 13,
			),
			array(
				'post_type'   => 'appointment',
				'post_status' => 'complete',
				'num_posts'   => 14,
			),
			array(
				'post_type'   => 'post',
				'post_status' => 'private',
				'num_posts'   => 7,
			),
			array(
				'post_type'   => 'elementor_library',
				'post_status' => 'publish',
				'num_posts'   => 9,
			),
			array(
				'post_type'   => 'topic',
				'post_status' => 'publish',
				'num_posts'   => 10,
			),
			array(
				'post_type'   => 'topic',
				'post_status' => 'draft',
				'num_posts'   => 3,
			),
		);
	}
}
