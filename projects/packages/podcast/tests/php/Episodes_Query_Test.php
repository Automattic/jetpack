<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Episodes_Query;
use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\UsesClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;

/**
 * @covers \Automattic\Jetpack\Podcast\Episodes_Query
 * @uses \Automattic\Jetpack\Podcast\Feed\Customize_Feed
 */
#[CoversClass( Episodes_Query::class )]
#[UsesClass( Customize_Feed::class )]
class Episodes_Query_Test extends BaseTestCase {

	public function test_register_rest_param_adds_boolean_param() {
		$params = Episodes_Query::register_rest_param( array( 'existing' => array() ) );

		$this->assertArrayHasKey( 'existing', $params );
		$this->assertArrayHasKey( Episodes_Query::HAS_ENCLOSURE_PARAM, $params );
		$this->assertSame( 'boolean', $params[ Episodes_Query::HAS_ENCLOSURE_PARAM ]['type'] );
		$this->assertFalse( $params[ Episodes_Query::HAS_ENCLOSURE_PARAM ]['default'] );
	}

	public function test_flag_query_sets_arg_when_param_true() {
		$request = new WP_REST_Request();
		$request->set_param( Episodes_Query::HAS_ENCLOSURE_PARAM, true );

		$args = Episodes_Query::flag_query( array( 'post_type' => 'post' ), $request );

		$this->assertTrue( $args[ Episodes_Query::HAS_ENCLOSURE_PARAM ] );
		$this->assertSame( 'post', $args['post_type'] );
	}

	public function test_flag_query_leaves_args_untouched_when_param_absent() {
		$request = new WP_REST_Request();
		$args    = array( 'post_type' => 'post' );

		$this->assertSame( $args, Episodes_Query::flag_query( $args, $request ) );
	}

	public function test_flag_query_leaves_args_untouched_when_param_false() {
		$request = new WP_REST_Request();
		$request->set_param( Episodes_Query::HAS_ENCLOSURE_PARAM, false );
		$args = array( 'post_type' => 'post' );

		$this->assertSame( $args, Episodes_Query::flag_query( $args, $request ) );
	}

	public function test_constrain_query_appends_enclosure_exists_when_flagged() {
		global $wpdb;
		$query = $this->createStub( \WP_Query::class );
		$query->method( 'get' )->willReturn( true );

		$result = Episodes_Query::constrain_query( ' AND 1=1', $query );

		$this->assertStringStartsWith( ' AND 1=1', $result );
		$this->assertStringContainsString(
			"EXISTS ( SELECT 1 FROM {$wpdb->postmeta} WHERE {$wpdb->postmeta}.post_id = {$wpdb->posts}.ID AND {$wpdb->postmeta}.meta_key = 'enclosure' )",
			$result
		);
	}

	public function test_constrain_query_passthrough_when_not_flagged() {
		$query = $this->createStub( \WP_Query::class );
		$query->method( 'get' )->willReturn( null );

		$this->assertSame( ' AND 1=1', Episodes_Query::constrain_query( ' AND 1=1', $query ) );
	}
}
