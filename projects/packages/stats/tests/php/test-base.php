<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Base class for Stats package testing.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Constants;
use Jetpack_Options;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WP_Post;

/**
 * Base class for Stats package testing..
 */
abstract class StatsBaseTestCase extends BaseTestCase {
	/**
	 * The default value for setting the 'STATS_VERSION' constant.
	 *
	 * @var string
	 */
	const DEFAULT_STATS_VERSION = '9';
	/**
	 * The default value for setting the 'JETPACK__API_VERSION' constant.
	 *
	 * @var string
	 */
	const DEFAULT_JETPACK__API_VERSION = '11.4';
	/**
	 * The default value for setting the 'JETPACK__VERSION' constant.
	 *
	 * @var string
	 */
	const DEFAULT_JETPACK__VERSION = '11.4';
	/**
	 * Set up before each test
	 *
	 * @before
	 */
	protected function set_up() {
		parent::setUp();
		Constants::set_constant( 'STATS_VERSION', self::DEFAULT_STATS_VERSION );
		Constants::set_constant( 'JETPACK__API_VERSION', self::DEFAULT_JETPACK__API_VERSION );
		Constants::set_constant( 'JETPACK__VERSION', self::DEFAULT_JETPACK__API_VERSION );
		Jetpack_Options::update_option( 'id', 1234 );
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		WorDBless_Options::init()->clear_options();
		Constants::clear_constants();
	}

	/**
	 * Method to create transient post for testing
	 *
	 * @param int $id The ID of the post.
	 */
	protected static function post( $id ) {

		$now     = current_time( 'mysql' );
		$now_gmt = get_gmt_from_date( $now );

		$post = (object) array(
			'ID'                    => $id,
			'post_date'             => $now,
			'post_date_gmt'         => $now_gmt,
			'post_modified'         => $now,
			'post_modified_gmt'     => $now_gmt,
			'post_title'            => 'The Title',
			'post_content'          => 'The Content',
			'post_name'             => 'the-title',
			'post_content_filtered' => 'The Content',
			'filter'                => 'raw',
			'post_author'           => '0',
			'post_excerpt'          => '',
			'post_status'           => 'publish',
			'post_type'             => 'post',
			'comment_status'        => 'closed',
			'ping_status'           => '',
			'post_password'         => '',
			'to_ping'               => '',
			'pinged'                => '',
			'post_parent'           => 0,
			'menu_order'            => 0,
			'guid'                  => '',
		);

		return new WP_Post( $post );
	}
}
