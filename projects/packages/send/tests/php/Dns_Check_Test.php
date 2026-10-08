<?php
/**
 * Tests for Dns_Check.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Send\Dns_Check
 */
#[CoversClass( Dns_Check::class )]
class Dns_Check_Test extends BaseTestCase {

	/**
	 * Check-domain responses and the verdicts they reduce to.
	 *
	 * @return array[]
	 */
	public static function provide_check_results() {
		return array(
			'all passing'                                 => array(
				array(
					'check_results' => array(
						'spf'             => array( 'verdict' => 'passed' ),
						'domain_lockdown' => array( 'verdict' => 'passed' ),
						'dkim'            => array( array( 'verdict' => 'passed' ) ),
						'sender_domain'   => array( 'verdict' => 'passed' ),
					),
				),
				array(
					'domain_lockdown' => 'passed',
					'spf'             => 'passed',
					'dkim'            => 'passed',
					'sender_domain'   => 'passed',
				),
			),
			'lockdown failing, sender domain via MX only' => array(
				array(
					'check_results' => array(
						'spf'             => array( 'verdict' => 'Soft Failed' ),
						'domain_lockdown' => array( 'verdict' => 'failed' ),
						'dkim'            => array(),
						'sender_domain'   => array(
							'a'  => array( 'verdict' => 'failed' ),
							'mx' => array( 'verdict' => 'passed' ),
						),
					),
				),
				array(
					'domain_lockdown' => 'failed',
					'spf'             => 'soft failed',
					'dkim'            => 'unknown',
					'sender_domain'   => 'passed',
				),
			),
			'unexpected shape'                            => array(
				array(),
				array(
					'domain_lockdown' => 'unknown',
					'spf'             => 'unknown',
					'dkim'            => 'unknown',
					'sender_domain'   => 'unknown',
				),
			),
		);
	}

	/**
	 * @dataProvider provide_check_results
	 *
	 * @param array $response MailChannels check-domain response.
	 * @param array $expected Expected verdicts.
	 */
	#[DataProvider( 'provide_check_results' )]
	public function test_normalize_reduces_check_results_to_verdicts( array $response, array $expected ) {
		$check = Dns_Check::normalize( $response, 'v=spf1 -all' );

		foreach ( $expected as $key => $verdict ) {
			$this->assertSame( $verdict, $check[ $key ], $key );
		}
		$this->assertSame( 'v=spf1 -all', $check['existing_spf'] );
	}
}
