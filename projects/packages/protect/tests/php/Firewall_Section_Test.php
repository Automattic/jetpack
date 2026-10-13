<?php
/**
 * Tests for the Protect dashboard's Firewall section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Protect\Sections\Firewall;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Sections\Firewall
 */
#[CoversClass( Firewall::class )]
class Firewall_Section_Test extends BaseTestCase {

	/**
	 * Offering a proxy's address for the allow list would exempt every visitor behind it.
	 *
	 * @dataProvider provide_addresses
	 *
	 * @param array  $server   The request's `$_SERVER` entries.
	 * @param string $expected The address offered, or empty for none.
	 */
	#[DataProvider( 'provide_addresses' )]
	public function test_current_ip_is_only_offered_when_it_is_the_visitors( $server, $expected ) {
		$original = $_SERVER;
		$_SERVER  = array_merge( $_SERVER, $server );

		$ip = Firewall::get_current_ip();

		$_SERVER = $original;
		$this->assertSame( $expected, $ip );
	}

	/**
	 * Data provider for test_current_ip_is_only_offered_when_it_is_the_visitors.
	 *
	 * @return array
	 */
	public static function provide_addresses() {
		return array(
			'a direct visitor'                    => array( array( 'REMOTE_ADDR' => '203.0.113.7' ), '203.0.113.7' ),
			'a proxy that rewrote the address'    => array(
				array(
					'REMOTE_ADDR'          => '203.0.113.7',
					'HTTP_X_FORWARDED_FOR' => '203.0.113.7, 198.51.100.2',
				),
				'203.0.113.7',
			),
			'a proxy that forwards someone else'  => array(
				array(
					'REMOTE_ADDR'          => '198.51.100.2',
					'HTTP_X_FORWARDED_FOR' => '203.0.113.7',
				),
				'',
			),
			'a proxy on the same private network' => array( array( 'REMOTE_ADDR' => '10.0.0.5' ), '' ),
			'a proxy on the same machine'         => array( array( 'REMOTE_ADDR' => '127.0.0.1' ), '' ),
		);
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
