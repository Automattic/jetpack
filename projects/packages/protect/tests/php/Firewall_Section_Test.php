<?php
/**
 * Tests for the Protect dashboard's Firewall section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Protect\Sections\Firewall;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * The WAF package isn't installed here, as on a site whose firewall predates the self-check.
 *
 * @covers \Automattic\Jetpack\Protect\Sections\Firewall
 */
#[CoversClass( Firewall::class )]
class Firewall_Section_Test extends BaseTestCase {

	public function test_start_test_fails_cleanly_without_the_self_check() {
		$result = Firewall::start_test();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'firewall_test_unavailable', $result->get_error_code() );
	}

	public function test_recent_blocks_are_empty_without_the_blocklog_reader() {
		$this->assertSame( array(), Firewall::get_recent_blocks() );
	}

	public function test_request_details_join_the_block_they_were_logged_with() {
		$blocks  = array(
			array(
				'id'        => 3,
				'timestamp' => '2026-10-09T16:54:03Z',
				'ruleId'    => -2,
			),
			array(
				'id'        => 2,
				'timestamp' => '2026-10-09T16:54:03Z',
				'ruleId'    => -2,
			),
			array(
				'id'        => 1,
				'timestamp' => '2026-10-09T16:07:51Z',
				'ruleId'    => -1,
			),
		);
		$entries = array(
			array(
				'timestamp'   => '2026-10-09 16:54:03',
				'rule_id'     => '-2',
				'request_uri' => '/?first',
				'user_agent'  => 'curl/8.14.1',
			),
			array(
				'timestamp'   => '2026-10-09 16:54:03',
				'rule_id'     => -2,
				'request_uri' => '/?second',
				'user_agent'  => '',
			),
		);

		$result = Firewall::add_request_details( $blocks, $entries );

		$this->assertSame( '/?second', $result[0]['uri'] );
		$this->assertArrayNotHasKey( 'userAgent', $result[0] );
		$this->assertSame( '/?first', $result[1]['uri'] );
		$this->assertSame( 'curl/8.14.1', $result[1]['userAgent'] );
		$this->assertSame( $blocks[2], $result[2] );
	}
}
