<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Episode_Query;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Query;
use WP_REST_Request;

/**
 * @covers \Automattic\Jetpack\Podcast\Episode_Query
 */
#[CoversClass( Episode_Query::class )]
class Episode_Query_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();
		Episode_Query::init();
	}

	public function test_register_collection_param_adds_boolean_param() {
		$params = Episode_Query::register_collection_param( array() );

		$this->assertSame( 'boolean', $params['podcast_episodes']['type'] );
		$this->assertFalse( $params['podcast_episodes']['default'] );
	}

	public function test_apply_rest_param_forwards_truthy_param_only() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts' );
		$this->assertArrayNotHasKey( 'podcast_episodes', Episode_Query::apply_rest_param( array(), $request ) );

		$request->set_param( 'podcast_episodes', true );
		$this->assertTrue( Episode_Query::apply_rest_param( array(), $request )['podcast_episodes'] );
	}

	public function test_constrain_query_leaves_where_untouched_without_query_var() {
		$where = ' AND 1=1';
		$this->assertSame( $where, Episode_Query::constrain_query( $where, new WP_Query() ) );
	}

	public function test_constrain_query_appends_enclosure_exists_subquery() {
		global $wpdb;
		$query = new WP_Query();
		$query->set( 'podcast_episodes', true );

		$result = Episode_Query::constrain_query( ' AND 1=1', $query );

		$this->assertStringStartsWith( ' AND 1=1', $result );
		$this->assertStringContainsString(
			"EXISTS ( SELECT 1 FROM {$wpdb->postmeta} WHERE {$wpdb->postmeta}.post_id = {$wpdb->posts}.ID AND {$wpdb->postmeta}.meta_key = 'enclosure' )",
			$result
		);
	}
}
