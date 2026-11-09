<?php
/**
 * Tests for Local_Provisioner.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * @covers \Automattic\Jetpack\Send\Local_Provisioner
 */
#[CoversClass( Local_Provisioner::class )]
class Local_Provisioner_Test extends BaseTestCase {

	const API = 'https://api.mailchannels.net/tx/v1';

	/**
	 * The active HTTP mock.
	 *
	 * @var Http_Mock|null
	 */
	private $http;

	/**
	 * Stop intercepting HTTP.
	 */
	public function tear_down() {
		if ( $this->http ) {
			$this->http->remove();
			$this->http = null;
		}
		parent::tear_down();
	}

	/**
	 * A DKIM key response carrying its DNS record.
	 *
	 * @return array
	 */
	private static function dkim_key() {
		return array(
			'selector'         => 'jpsend',
			'dkim_dns_records' => array(
				array(
					'name'  => 'jpsend._domainkey.example.com',
					'type'  => 'TXT',
					'value' => 'v=DKIM1; k=rsa; p=ABC',
				),
			),
		);
	}

	/**
	 * Method, URL and API key of every request made.
	 *
	 * @return array[]
	 */
	private function request_summary() {
		return array_map(
			fn( $request ) => array( $request['method'], $request['url'], $request['headers']['X-Api-Key'] ?? '' ),
			$this->http->requests
		);
	}

	public function test_provision_points_lockdown_and_dkim_at_the_jetpack_zone() {
		$handle     = Local_Provisioner::handle_for_site();
		$this->http = new Http_Mock(
			array(
				array( 201, array( 'handle' => $handle ) ),
				array( 201, array( 'key' => 'sub-key' ) ),
				array( 201, self::dkim_key() ),
			)
		);

		$result = ( new Local_Provisioner( new MailChannels_Client( 'parent-key' ), null, 'send-dns.example.net' ) )->provision( 'example.com' );

		$this->assertSame(
			array(
				array( 'CNAME', '_mailchannels.example.com', "{$handle}.lockdown.send-dns.example.net", 'lockdown', false ),
				array( 'TXT', 'example.com', 'v=spf1 include:relay.mailchannels.net ~all', 'spf', true ),
				array( 'CNAME', 'jpsend._domainkey.example.com', "{$handle}.dkim.send-dns.example.net", 'dkim', false ),
			),
			array_map(
				fn( $record ) => array( $record['type'], $record['name'], $record['value'], $record['purpose'], $record['optional'] ),
				$result['dns_records']
			)
		);
		$this->assertSame(
			array(
				array( "{$handle}.lockdown.send-dns.example.net", 'v=mc1 auth=' . $handle ),
				array( "{$handle}.dkim.send-dns.example.net", 'v=DKIM1; k=rsa; p=ABC' ),
			),
			array_map( fn( $record ) => array( $record['name'], $record['value'] ), $result['zone_records'] )
		);
	}

	public function test_provision_creates_a_sub_account_key_and_dkim_key() {
		$handle     = Local_Provisioner::handle_for_site();
		$this->http = new Http_Mock(
			array(
				array( 201, array( 'handle' => $handle ) ),
				array( 201, array( 'key' => 'sub-key' ) ),
				array( 201, self::dkim_key() ),
			)
		);

		$result = ( new Local_Provisioner( new MailChannels_Client( 'parent-key' ) ) )->provision( 'example.com' );

		$this->assertSame(
			array(
				array( 'POST', self::API . '/sub-account', 'parent-key' ),
				array( 'POST', self::API . "/sub-account/{$handle}/api-key", 'parent-key' ),
				array( 'POST', self::API . '/domains/example.com/dkim-keys', 'sub-key' ),
			),
			$this->request_summary()
		);
		$this->assertSame( 'sub-key', $result['api_key'] );
		$this->assertSame( $handle, $result['lockdown_auth_id'] );
		$this->assertSame( -1, $result['monthly_limit'] );
		$this->assertSame( array( 'lockdown', 'spf', 'dkim' ), array_column( $result['dns_records'], 'purpose' ) );
		$this->assertSame( 'v=mc1 auth=' . $handle, $result['dns_records'][0]['value'] );
		$this->assertSame( 'v=DKIM1; k=rsa; p=ABC', $result['dns_records'][2]['value'] );
	}

	public function test_provision_reuses_an_existing_sub_account_and_dkim_key() {
		$handle     = Local_Provisioner::handle_for_site();
		$this->http = new Http_Mock(
			array(
				array( 409, array( 'errors' => array( 'Sub-account already exists' ) ) ),
				array( 201, array( 'key' => 'sub-key' ) ),
				array( 200, array( 'sends' => 500 ) ),
				array( 409, array( 'errors' => array( 'Key already exists' ) ) ),
				array( 200, array( 'keys' => array( self::dkim_key() ) ) ),
			)
		);

		$result = ( new Local_Provisioner( new MailChannels_Client( 'parent-key' ), 500 ) )->provision( 'example.com' );

		$this->assertSame(
			array(
				array( 'POST', self::API . '/sub-account', 'parent-key' ),
				array( 'POST', self::API . "/sub-account/{$handle}/api-key", 'parent-key' ),
				array( 'PUT', self::API . "/sub-account/{$handle}/limit", 'parent-key' ),
				array( 'POST', self::API . '/domains/example.com/dkim-keys', 'sub-key' ),
				array( 'GET', self::API . '/domains/example.com/dkim-keys?selector=jpsend&include_dns_record=true', 'sub-key' ),
			),
			$this->request_summary()
		);
		$this->assertSame( 500, $result['monthly_limit'] );
		$this->assertSame( 'v=DKIM1; k=rsa; p=ABC', $result['dns_records'][2]['value'] );
	}

	public function test_provision_names_the_dkim_record_from_the_selector_not_the_response() {
		$key = array_replace_recursive( self::dkim_key(), array( 'dkim_dns_records' => array( array( 'name' => 'jpsend._domainkey' ) ) ) );

		$this->http = new Http_Mock(
			array(
				array( 201, array() ),
				array( 201, array( 'key' => 'sub-key' ) ),
				array( 201, $key ),
			)
		);

		$result = ( new Local_Provisioner( new MailChannels_Client( 'parent-key' ) ) )->provision( 'example.com' );

		$this->assertSame( 'jpsend._domainkey.example.com', $result['dns_records'][2]['name'] );
	}

	public function test_provision_continues_without_dkim_when_the_key_cannot_be_created() {
		$this->http = new Http_Mock(
			array(
				array( 201, array() ),
				array( 201, array( 'key' => 'sub-key' ) ),
				array( 403, array( 'errors' => array( 'Forbidden' ) ) ),
			)
		);

		$result = ( new Local_Provisioner( new MailChannels_Client( 'parent-key' ) ) )->provision( 'example.com' );

		$this->assertSame( array( 'lockdown', 'spf' ), array_column( $result['dns_records'], 'purpose' ) );
	}

	public function test_provision_stops_when_the_account_cannot_create_sub_accounts() {
		$this->http = new Http_Mock( array( array( 403, array( 'errors' => array( 'Not permitted to create sub-accounts' ) ) ) ) );

		$result = ( new Local_Provisioner( new MailChannels_Client( 'parent-key' ) ) )->provision( 'example.com' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_send_http_403', $result->get_error_code() );
		$this->assertCount( 1, $this->http->requests );
	}
}
