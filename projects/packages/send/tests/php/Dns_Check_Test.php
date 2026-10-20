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

	/**
	 * Existing SPF records and the single record to publish.
	 *
	 * @return array[]
	 */
	public static function provide_spf_records() {
		return array(
			'no record'                      => array( '', 'v=spf1 include:relay.mailchannels.net ~all', 'new' ),
			'bare all'                       => array( 'v=spf1 ~all', 'v=spf1 include:relay.mailchannels.net ~all', 'merge' ),
			'merges before a hard fail'      => array( 'v=spf1 include:_spf.google.com -all', 'v=spf1 include:_spf.google.com include:relay.mailchannels.net -all', 'merge' ),
			'merges before an uppercase all' => array( 'v=spf1 include:_spf.google.com ~ALL', 'v=spf1 include:_spf.google.com include:relay.mailchannels.net ~ALL', 'merge' ),
			'appends when there is no all'   => array( 'v=spf1 include:_spf.google.com', 'v=spf1 include:_spf.google.com include:relay.mailchannels.net', 'merge' ),
			'already includes the relay'     => array( 'v=spf1 INCLUDE:relay.mailchannels.net ~all', 'v=spf1 INCLUDE:relay.mailchannels.net ~all', 'present' ),
			'merges before a mid-record all' => array( 'v=spf1 include:x.example -all exp=why.example', 'v=spf1 include:x.example include:relay.mailchannels.net -all exp=why.example', 'merge' ),
		);
	}

	/**
	 * @dataProvider provide_spf_records
	 *
	 * @param string $existing The domain's current SPF record.
	 * @param string $value    Expected record to publish.
	 * @param string $state    Expected state.
	 */
	#[DataProvider( 'provide_spf_records' )]
	public function test_spf_suggestion_never_produces_a_second_or_misordered_record( $existing, $value, $state ) {
		$this->assertSame(
			array(
				'value' => $value,
				'state' => $state,
			),
			Dns_Check::spf_suggestion( $existing )
		);
	}

	public function test_spf_lookups_counts_only_terms_that_cost_a_lookup() {
		$this->assertSame( 6, Dns_Check::spf_lookups( 'v=spf1 a mx:mail.example ptr ~include:x.example exists:%{i}.example redirect=y.example ip4:192.0.2.1 all' ) );
	}

	public function test_existing_spf_goes_through_the_lookup_filter() {
		$filter = static function ( $pre, $name, $type ) {
			unset( $pre );
			return 'example.com' === $name && DNS_TXT === $type
				? array(
					array( 'txt' => 'google-site-verification=abc' ),
					array( 'entries' => array( 'v=spf1 include:_spf.google.com', ' ~all' ) ),
				)
				: array();
		};
		add_filter( 'jetpack_send_pre_dns_lookup', $filter, 10, 3 );

		$spf = Dns_Check::existing_spf( 'example.com' );
		remove_filter( 'jetpack_send_pre_dns_lookup', $filter, 10 );

		$this->assertSame( 'v=spf1 include:_spf.google.com ~all', $spf );
	}
}
