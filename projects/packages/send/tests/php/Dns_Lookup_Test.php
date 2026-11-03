<?php
/**
 * Tests for Dns_Lookup and GET /dns-lookup.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Send\Dns_Lookup
 * @covers \Automattic\Jetpack\Send\Dns_REST_Controller
 */
#[CoversClass( Dns_Lookup::class )]
#[CoversClass( Dns_REST_Controller::class )]
class Dns_Lookup_Test extends BaseTestCase {

	const LOCKDOWN = 'v=mc1 auth=jpsendtest';
	const DKIM     = 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAQIDAQAB';

	/**
	 * Fake DNS answers by `name|TYPE`; anything missing has no records.
	 *
	 * @var array
	 */
	private $dns = array();

	/**
	 * Route every lookup to the fake answers.
	 */
	public function set_up() {
		parent::set_up();
		$this->dns = array();
		add_filter( 'jetpack_send_pre_dns_lookup', array( $this, 'fake_lookup' ), 10, 3 );
	}

	/**
	 * Reset globals, filters and options.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_all_actions( 'rest_api_init' );
		remove_all_filters( 'jetpack_send_pre_dns_lookup' );
		Account::delete();
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Filter callback for jetpack_send_pre_dns_lookup.
	 *
	 * @param mixed  $pre  Unused.
	 * @param string $name Name.
	 * @param int    $type Type.
	 * @return array|false
	 */
	public function fake_lookup( $pre, $name, $type ) {
		unset( $pre );
		$names = array(
			DNS_TXT   => 'TXT',
			DNS_CNAME => 'CNAME',
			DNS_A     => 'A',
			DNS_AAAA  => 'AAAA',
		);
		$key   = $name . '|' . ( $names[ $type ] ?? (string) $type );
		return array_key_exists( $key, $this->dns ) ? $this->dns[ $key ] : array();
	}

	/**
	 * Fake records at a name.
	 *
	 * @param string   $name   Name.
	 * @param string   $type   `TXT`, `CNAME`, `A` or `AAAA`.
	 * @param string[] $values Values.
	 */
	private function answer( $name, $type, array $values ) {
		$field                            = array(
			'TXT'   => 'txt',
			'CNAME' => 'target',
			'A'     => 'ip',
			'AAAA'  => 'ipv6',
		)[ $type ];
		$this->dns[ $name . '|' . $type ] = array_map(
			static function ( $value ) use ( $name, $type, $field ) {
				return array(
					'host' => $name,
					'type' => $type,
					$field => $value,
				);
			},
			$values
		);
	}

	/**
	 * A required record.
	 *
	 * @param string $purpose Purpose.
	 * @param string $type    Type.
	 * @param string $name    Name.
	 * @param string $value   Value.
	 * @return array
	 */
	private static function record( $purpose, $type, $name, $value ) {
		return array(
			'type'     => $type,
			'name'     => $name,
			'value'    => $value,
			'purpose'  => $purpose,
			'optional' => false,
		);
	}

	/**
	 * State and problem for one TXT record, across what people actually end up with in DNS.
	 *
	 * @dataProvider provide_txt_cases
	 * @param string      $purpose  Purpose.
	 * @param string      $name     Record name.
	 * @param string      $expected Expected value.
	 * @param array       $answers  `[ name, type, values|false ]` triples.
	 * @param string      $state    Expected state.
	 * @param string|null $problem  Expected problem.
	 */
	#[DataProvider( 'provide_txt_cases' )]
	public function test_txt_record_state( $purpose, $name, $expected, array $answers, $state, $problem ) {
		foreach ( $answers as list( $at, $type, $values ) ) {
			if ( false === $values ) {
				$this->dns[ $at . '|' . $type ] = false;
			} else {
				$this->answer( $at, $type, $values );
			}
		}

		$row = Dns_Lookup::record_state( self::record( $purpose, 'TXT', $name, $expected ), 'example.com' );
		$this->assertSame( $state, $row['state'] );
		$this->assertSame( $problem, $row['problem'] ?? null );
	}

	/**
	 * TXT cases.
	 *
	 * @return array
	 */
	public static function provide_txt_cases() {
		$lockdown = '_mailchannels.example.com';
		$dkim     = 'jpsend._domainkey.example.com';
		return array(
			'nothing yet'                => array( 'lockdown', $lockdown, self::LOCKDOWN, array(), 'not_found', null ),
			'lookup failed'              => array( 'lockdown', $lockdown, self::LOCKDOWN, array( array( $lockdown, 'TXT', false ) ), 'no_answer', null ),
			'found'                      => array( 'lockdown', $lockdown, self::LOCKDOWN, array( array( $lockdown, 'TXT', array( '"v=mc1 auth=JPSENDTEST"' ) ) ), 'found', null ),
			'merged with the host'       => array( 'lockdown', $lockdown, self::LOCKDOWN, array( array( $lockdown, 'TXT', array( 'v=mc1 auth=myhost auth=jpsendtest' ) ) ), 'found', null ),
			'wildcard noise ignored'     => array( 'lockdown', $lockdown, self::LOCKDOWN, array( array( $lockdown, 'TXT', array( 'google-site-verification=x' ) ) ), 'not_found', null ),
			'wrong value'                => array( 'lockdown', $lockdown, self::LOCKDOWN, array( array( $lockdown, 'TXT', array( 'v=mc1 auth=myhost' ) ) ), 'needs_fix', 'wrong_value' ),
			'two permission records'     => array( 'lockdown', $lockdown, self::LOCKDOWN, array( array( $lockdown, 'TXT', array( 'v=mc1 auth=myhost', self::LOCKDOWN ) ) ), 'needs_fix', 'conflict' ),
			'domain doubled'             => array( 'lockdown', $lockdown, self::LOCKDOWN, array( array( $lockdown . '.example.com', 'TXT', array( self::LOCKDOWN ) ) ), 'needs_fix', 'doubled' ),
			'CNAME in the way'           => array( 'lockdown', $lockdown, self::LOCKDOWN, array( array( $lockdown, 'CNAME', array( 'x.other.net' ) ) ), 'needs_fix', 'conflict' ),
			'signing key, split strings' => array( 'dkim', $dkim, self::DKIM, array( array( $dkim, 'TXT', array( '"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCg" "KCAQEAQIDAQAB"' ) ) ), 'found', null ),
			'signing key, other key'     => array( 'dkim', $dkim, self::DKIM, array( array( $dkim, 'TXT', array( 'v=DKIM1; k=rsa; p=OLDKEY' ) ) ), 'needs_fix', 'wrong_value' ),
			'spf merged'                 => array( 'spf', 'example.com', 'v=spf1 include:relay.mailchannels.net ~all', array( array( 'example.com', 'TXT', array( 'v=spf1 include:_spf.google.com include:relay.mailchannels.net ~all', 'other=1' ) ) ), 'found', null ),
			'spf missing the include'    => array( 'spf', 'example.com', 'v=spf1 include:relay.mailchannels.net ~all', array( array( 'example.com', 'TXT', array( 'v=spf1 include:_spf.google.com ~all' ) ) ), 'needs_fix', 'wrong_value' ),
			'two spf records'            => array( 'spf', 'example.com', 'v=spf1 include:relay.mailchannels.net ~all', array( array( 'example.com', 'TXT', array( 'v=spf1 -all', 'v=spf1 include:relay.mailchannels.net ~all' ) ) ), 'needs_fix', 'conflict' ),
		);
	}

	/**
	 * State and problem for one CNAME record (zone mode).
	 *
	 * @dataProvider provide_cname_cases
	 * @param array       $answers `[ name, type, values|false ]` triples.
	 * @param string      $state   Expected state.
	 * @param string|null $problem Expected problem.
	 */
	#[DataProvider( 'provide_cname_cases' )]
	public function test_cname_record_state( array $answers, $state, $problem ) {
		foreach ( $answers as list( $at, $type, $values ) ) {
			if ( false === $values ) {
				$this->dns[ $at . '|' . $type ] = false;
			} else {
				$this->answer( $at, $type, $values );
			}
		}

		$row = Dns_Lookup::record_state( self::record( 'lockdown', 'CNAME', '_mailchannels.example.com', 'h.lockdown.zone.test' ), 'example.com' );
		$this->assertSame( $state, $row['state'] );
		$this->assertSame( $problem, $row['problem'] ?? null );
		$this->assertSame( '_mailchannels', $row['host'] );
	}

	/**
	 * CNAME cases.
	 *
	 * @return array
	 */
	public static function provide_cname_cases() {
		$name = '_mailchannels.example.com';
		return array(
			'nothing yet'      => array( array(), 'not_found', null ),
			'lookup failed'    => array( array( array( $name, 'CNAME', false ) ), 'no_answer', null ),
			'found'            => array( array( array( $name, 'CNAME', array( 'H.lockdown.zone.test.' ) ) ), 'found', null ),
			'wrong target'     => array( array( array( $name, 'CNAME', array( 'old.zone.test' ) ) ), 'needs_fix', 'wrong_value' ),
			'domain doubled'   => array( array( array( $name . '.example.com', 'CNAME', array( 'h.lockdown.zone.test' ) ) ), 'needs_fix', 'doubled' ),
			'old TXT in place' => array( array( array( $name, 'TXT', array( self::LOCKDOWN ) ) ), 'needs_fix', 'conflict' ),
			'proxied v4'       => array( array( array( $name, 'A', array( '104.21.3.4' ) ) ), 'needs_fix', 'proxied' ),
			'proxied v6'       => array( array( array( $name, 'AAAA', array( '2606:4700:3030::6815:1' ) ) ), 'needs_fix', 'proxied' ),
			'other address'    => array( array( array( $name, 'A', array( '192.0.2.10' ) ) ), 'not_found', null ),
		);
	}

	/**
	 * A mail-service pass beats anything the local lookup sees.
	 */
	public function test_mail_service_pass_is_verified() {
		$row = Dns_Lookup::record_state(
			self::record( 'lockdown', 'TXT', '_mailchannels.example.com', self::LOCKDOWN ),
			'example.com',
			array( 'domain_lockdown' => 'passed' )
		);
		$this->assertSame( 'verified', $row['state'] );
	}

	/**
	 * Values seen are reported with quotes and extra spaces removed.
	 */
	public function test_found_values_are_cleaned() {
		$this->answer( '_mailchannels.example.com', 'TXT', array( '"v=mc1   auth=jpsendtest"' ) );
		$row = Dns_Lookup::record_state( self::record( 'lockdown', 'TXT', '_mailchannels.example.com', self::LOCKDOWN ), 'example.com' );
		$this->assertSame( array( self::LOCKDOWN ), $row['found'] );
		$this->assertSame( self::LOCKDOWN, $row['expected'] );
	}

	/**
	 * The payload lists required records in order, adds the sending-domain row only when it fails, and gates /check-dns.
	 */
	public function test_check_payload() {
		$account = array(
			'api_key'     => 'secret',
			'domain'      => 'blog.example.com',
			'dns_records' => array(
				self::record( 'lockdown', 'TXT', '_mailchannels.blog.example.com', self::LOCKDOWN ),
				array_merge( self::record( 'spf', 'TXT', 'blog.example.com', 'v=spf1 include:relay.mailchannels.net ~all' ), array( 'optional' => true ) ),
				self::record( 'dkim', 'TXT', 'jpsend._domainkey.blog.example.com', self::DKIM ),
			),
			'dns_host'    => array(
				'domain' => 'blog.example.com',
				'apex'   => 'example.com',
			),
			'dns_check'   => array(
				'domain_lockdown' => 'failed',
				'spf'             => 'failed',
				'dkim'            => 'passed',
				'sender_domain'   => 'failed',
			),
		);
		$this->answer( '_mailchannels.blog.example.com', 'TXT', array( self::LOCKDOWN ) );

		$lookup = Dns_Lookup::check( $account );
		$this->assertSame( 'blog.example.com', $lookup['domain'] );
		$this->assertSame(
			array( array( 'lockdown', '_mailchannels.blog', 'found' ), array( 'dkim', 'jpsend._domainkey.blog', 'verified' ), array( 'sender_domain', '@', 'needs_fix' ) ),
			array_map(
				static function ( $row ) {
					return array( $row['purpose'], $row['host'], $row['state'] );
				},
				$lookup['records']
			)
		);
		$this->assertSame( 'not_live', $lookup['records'][2]['problem'] );
		$this->assertTrue( $lookup['all_found'] );
		$this->assertFalse( $lookup['can_enable'] );

		// Without a signing key, SPF becomes the required second record.
		unset( $account['dns_records'][2], $account['dns_check'] );
		$lookup = Dns_Lookup::check( $account );
		$this->assertSame( array( 'lockdown', 'spf' ), array_column( $lookup['records'], 'purpose' ) );
		$this->assertFalse( $lookup['all_found'] );
	}

	/**
	 * GET /dns-lookup needs an account and returns the payload.
	 */
	public function test_rest_route() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( Dns_REST_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init', $wp_rest_server );
		$admin = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin );
		$request = new WP_REST_Request( 'GET', '/jetpack-send/v1/dns-lookup' );
		$this->assertSame( 400, $wp_rest_server->dispatch( $request )->get_status() );

		Account::save(
			array(
				'api_key'     => 'secret',
				'domain'      => 'example.com',
				'dns_records' => array( self::record( 'lockdown', 'TXT', '_mailchannels.example.com', self::LOCKDOWN ) ),
			)
		);
		$response = $wp_rest_server->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'not_found', $response->get_data()['records'][0]['state'] );
	}

	public function test_a_wildcard_cname_is_not_an_old_record_in_the_way() {
		$this->answer( '_mailchannels.example.com', 'CNAME', array( 'example.com' ) );
		$this->answer( '_jpsend-wildcard-probe.example.com', 'CNAME', array( 'example.com' ) );

		$row = Dns_Lookup::record_state( self::record( 'lockdown', 'TXT', '_mailchannels.example.com', self::LOCKDOWN ), 'example.com' );

		$this->assertSame( 'not_found', $row['state'] );
	}

	public function test_a_wildcard_on_cloudflare_is_not_a_proxied_record() {
		$this->answer( '_mailchannels.example.com', 'A', array( '104.16.1.1' ) );
		$this->answer( '_jpsend-wildcard-probe.example.com', 'A', array( '104.16.1.1' ) );

		$row = Dns_Lookup::record_state( self::record( 'lockdown', 'CNAME', '_mailchannels.example.com', 'h.lockdown.example.net' ), 'example.com' );

		$this->assertSame( 'not_found', $row['state'] );
	}

	public function test_a_failing_sender_domain_alone_is_not_all_found() {
		$check = Dns_Lookup::check(
			array(
				'domain'      => 'example.com',
				'dns_records' => array(),
				'dns_check'   => array( 'sender_domain' => 'failed' ),
			)
		);

		$this->assertCount( 1, $check['records'] );
		$this->assertFalse( $check['all_found'] );
	}

	public function test_rest_route_refuses_non_admins() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( Dns_REST_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init', $wp_rest_server );
		$subscriber = wp_insert_user(
			array(
				'user_login' => 'subscriber',
				'user_pass'  => 'pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber );

		$this->assertSame( 403, $wp_rest_server->dispatch( new WP_REST_Request( 'GET', '/jetpack-send/v1/dns-lookup' ) )->get_status() );
	}
}
