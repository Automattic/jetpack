<?php
/**
 * Tests for Cloudflare_Dns and Cloudflare_REST_Controller.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Send\Cloudflare_Dns
 * @covers \Automattic\Jetpack\Send\Cloudflare_REST_Controller
 */
#[CoversClass( Cloudflare_Dns::class )]
#[CoversClass( Cloudflare_REST_Controller::class )]
class Cloudflare_Dns_Test extends BaseTestCase {

	const TOKEN  = 'cfTokenAbc123_secret-VALUE-xyz7890';
	const DOMAIN = 'example.com';
	const ZONE   = 'zone123';
	const DKIM   = 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtest';

	/**
	 * The active HTTP mock.
	 *
	 * @var Http_Mock|null
	 */
	private $http;

	/**
	 * Reset filters, mocks and state.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_all_actions( 'rest_api_init' );
		remove_all_filters( 'jetpack_send_cloudflare_api_enabled' );
		remove_all_filters( 'jetpack_send_pre_existing_spf' );
		if ( $this->http ) {
			$this->http->remove();
			$this->http = null;
		}
		delete_transient( REST_Controller::CHECK_DNS_THROTTLE );
		Account::delete();
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * The records an account asks for in TXT mode.
	 *
	 * @return array[]
	 */
	private static function records() {
		return array(
			array(
				'type'    => 'TXT',
				'name'    => '_mailchannels.' . self::DOMAIN,
				'value'   => 'v=mc1 auth=jpsend42',
				'purpose' => 'lockdown',
			),
			array(
				'type'     => 'TXT',
				'name'     => self::DOMAIN,
				'value'    => 'v=spf1 include:relay.mailchannels.net ~all',
				'purpose'  => 'spf',
				'optional' => true,
			),
			array(
				'type'    => 'TXT',
				'name'    => 'jpsend._domainkey.' . self::DOMAIN,
				'value'   => self::DKIM,
				'purpose' => 'dkim',
			),
		);
	}

	/**
	 * A Cloudflare success envelope.
	 *
	 * @param mixed $result Result.
	 * @param int   $code   HTTP status.
	 * @return array
	 */
	private static function ok( $result, $code = 200 ) {
		return array(
			$code,
			array(
				'success' => true,
				'errors'  => array(),
				'result'  => $result,
			),
		);
	}

	/**
	 * A Cloudflare error envelope.
	 *
	 * @param int $status  HTTP status.
	 * @param int $cf_code Cloudflare error code.
	 * @return array
	 */
	private static function cf_error( $status, $cf_code ) {
		return array(
			$status,
			array(
				'success' => false,
				'errors'  => array(
					array(
						'code'    => $cf_code,
						'message' => 'Cloudflare says no',
					),
				),
				'result'  => null,
			),
		);
	}

	/**
	 * Verify, scope check and zone lookup responses that every successful run starts with.
	 *
	 * @return array[]
	 */
	private static function preamble() {
		return array(
			self::ok( array( 'status' => 'active' ) ),
			self::ok( array( self::zone() ) ),
			self::ok(
				array(
					array(
						'id'   => self::ZONE,
						'name' => self::DOMAIN,
					),
				)
			),
		);
	}

	/**
	 * The sending domain's zone as Cloudflare lists it.
	 *
	 * @param string $id   Zone id.
	 * @param string $name Zone name.
	 * @return array
	 */
	private static function zone( $id = self::ZONE, $name = self::DOMAIN ) {
		return compact( 'id', 'name' );
	}

	/**
	 * A DNS record as Cloudflare lists it.
	 *
	 * @param string $id      Record id.
	 * @param string $type    Type.
	 * @param string $name    Name.
	 * @param string $content Content.
	 * @param bool   $proxied Proxied.
	 * @return array
	 */
	private static function cf_record( $id, $type, $name, $content, $proxied = false ) {
		return compact( 'id', 'type', 'name', 'content', 'proxied' );
	}

	/**
	 * Start a mock with these responses.
	 *
	 * @param array $responses Responses.
	 * @return Http_Mock
	 */
	private function mock( array $responses ) {
		$this->http = new Http_Mock( $responses );
		return $this->http;
	}

	/**
	 * Requests that changed something at Cloudflare.
	 *
	 * @return array[]
	 */
	private function writes() {
		return array_values(
			array_filter(
				$this->http->requests,
				function ( $request ) {
					return 'GET' !== $request['method'];
				}
			)
		);
	}

	/**
	 * Offered only for an editable Cloudflare domain the filter allows.
	 *
	 * @dataProvider provide_availability
	 *
	 * @param array $dns_host Detection.
	 * @param bool  $filter   Filter result.
	 * @param bool  $expected Whether it's offered.
	 */
	#[DataProvider( 'provide_availability' )]
	public function test_is_available( array $dns_host, $filter, $expected ) {
		add_filter( 'jetpack_send_cloudflare_api_enabled', $filter ? '__return_true' : '__return_false' );
		$this->assertSame( $expected, Cloudflare_Dns::is_available( $dns_host ) );
	}

	/**
	 * Rows for test_is_available.
	 *
	 * @return array
	 */
	public static function provide_availability() {
		return array(
			'cloudflare'        => array(
				array(
					'provider' => 'cloudflare',
					'editable' => true,
				),
				true,
				true,
			),
			'another host'      => array(
				array(
					'provider' => 'godaddy',
					'editable' => true,
				),
				true,
				false,
			),
			'temporary address' => array(
				array(
					'provider' => 'cloudflare',
					'editable' => false,
				),
				true,
				false,
			),
			'turned off'        => array(
				array(
					'provider' => 'cloudflare',
					'editable' => true,
				),
				false,
				false,
			),
		);
	}

	/**
	 * Creates missing records, merges SPF into the one existing record and leaves unrelated records alone.
	 */
	public function test_writes_records_and_merges_spf() {
		$this->mock(
			array_merge(
				self::preamble(),
				array(
					self::ok( array() ),
					self::ok( array( 'id' => 'new1' ) ),
					self::ok(
						array(
							self::cf_record( 'site-verify', 'TXT', self::DOMAIN, '"google-site-verification=abc"' ),
							self::cf_record( 'spf1', 'TXT', self::DOMAIN, '"v=spf1 include:_spf.google.com ~all"' ),
							self::cf_record( 'mx1', 'MX', self::DOMAIN, 'mail.example.net' ),
						)
					),
					self::ok( array( 'id' => 'spf1' ) ),
					self::ok( array() ),
					self::ok( array( 'id' => 'new2' ) ),
				)
			)
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, self::records() );

		$this->assertSame(
			array(
				'success' => true,
				'records' => array(
					array(
						'purpose' => 'lockdown',
						'name'    => '_mailchannels.' . self::DOMAIN,
						'action'  => 'created',
					),
					array(
						'purpose'  => 'spf',
						'name'     => self::DOMAIN,
						'action'   => 'updated',
						'optional' => true,
					),
					array(
						'purpose' => 'dkim',
						'name'    => 'jpsend._domainkey.' . self::DOMAIN,
						'action'  => 'created',
					),
				),
			),
			$result
		);

		$requests = $this->http->requests;
		$this->assertSame( Cloudflare_Dns::API_BASE . '/user/tokens/verify', $requests[0]['url'] );
		$this->assertSame( Cloudflare_Dns::API_BASE . '/zones?per_page=2', $requests[1]['url'] );
		$this->assertSame( Cloudflare_Dns::API_BASE . '/zones?name=' . self::DOMAIN, $requests[2]['url'] );
		foreach ( $requests as $request ) {
			$this->assertSame( 'Bearer ' . self::TOKEN, $request['headers']['Authorization'] );
		}

		$writes = $this->writes();
		$this->assertSame( array( 'POST', 'PATCH', 'POST' ), array_column( $writes, 'method' ) );
		$this->assertSame( Cloudflare_Dns::API_BASE . '/zones/' . self::ZONE . '/dns_records/spf1', $writes[1]['url'] );
		$this->assertSame( 'v=spf1 include:_spf.google.com include:relay.mailchannels.net ~all', $writes[1]['body']['content'] );
		$this->assertSame( 'v=mc1 auth=jpsend42', $writes[0]['body']['content'] );
		$this->assertSame( self::DKIM, $writes[2]['body']['content'] );
		foreach ( $writes as $write ) {
			$this->assertFalse( $write['body']['proxied'] );
		}
	}

	/**
	 * Records that are already right cause no writes.
	 */
	public function test_leaves_correct_records_unchanged() {
		$this->mock(
			array_merge(
				self::preamble(),
				array(
					self::ok( array( self::cf_record( 'l', 'TXT', '_mailchannels.' . self::DOMAIN, '"v=mc1 auth=jpsend42"' ) ) ),
					self::ok( array( self::cf_record( 's', 'TXT', self::DOMAIN, 'v=spf1 a include:relay.mailchannels.net -all' ) ) ),
					// Long values come back split into quoted strings.
					self::ok( array( self::cf_record( 'd', 'TXT', 'jpsend._domainkey.' . self::DOMAIN, '"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOC" "AQ8AMIIBCgKCAQEAtest"' ) ) ),
				)
			)
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, self::records() );

		$this->assertTrue( $result['success'] );
		$this->assertSame( array( 'unchanged', 'unchanged', 'unchanged' ), array_column( $result['records'], 'action' ) );
		$this->assertSame( array(), $this->writes() );
	}

	/**
	 * A host's own permission record keeps its entry; ours is added next to it.
	 */
	public function test_adds_to_an_existing_permission_record() {
		$this->mock(
			array_merge(
				self::preamble(),
				array(
					self::ok( array( self::cf_record( 'l', 'TXT', '_mailchannels.' . self::DOMAIN, 'v=mc1 auth=myhost' ) ) ),
					self::ok( array( 'id' => 'l' ) ),
				)
			)
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, array( self::records()[0] ) );

		$this->assertSame( 'updated', $result['records'][0]['action'] );
		$this->assertSame( 'v=mc1 auth=myhost auth=jpsend42', $this->writes()[0]['body']['content'] );
	}

	/**
	 * Problems with one record fail that record only and never delete anything.
	 */
	public function test_conflicts_fail_just_that_record() {
		$this->mock(
			array_merge(
				self::preamble(),
				array(
					self::ok( array( self::cf_record( 'c', 'CNAME', '_mailchannels.' . self::DOMAIN, 'old.example.net' ) ) ),
					self::ok(
						array(
							self::cf_record( 's1', 'TXT', self::DOMAIN, 'v=spf1 include:a.example ~all' ),
							self::cf_record( 's2', 'TXT', self::DOMAIN, 'v=spf1 include:b.example ~all' ),
						)
					),
					self::ok( array() ),
					self::ok( array( 'id' => 'd' ) ),
				)
			)
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, self::records() );

		$this->assertFalse( $result['success'] );
		$this->assertSame( array( 'failed', 'failed', 'created' ), array_column( $result['records'], 'action' ) );
		$this->assertNotEmpty( $result['records'][0]['error'] );
		$this->assertNotEmpty( $result['records'][1]['error'] );
		$this->assertSame( array( 'POST' ), array_column( $this->writes(), 'method' ) );
	}

	/**
	 * In CNAME mode a proxied record is switched to DNS only.
	 */
	public function test_turns_off_the_proxy_on_a_cname() {
		$this->mock(
			array_merge(
				self::preamble(),
				array(
					self::ok( array( self::cf_record( 'c', 'CNAME', '_mailchannels.' . self::DOMAIN, 'jpsend42.lockdown.example.net', true ) ) ),
					self::ok( array( 'id' => 'c' ) ),
				)
			)
		);
		$record = array(
			'type'    => 'CNAME',
			'name'    => '_mailchannels.' . self::DOMAIN,
			'value'   => 'jpsend42.lockdown.example.net',
			'purpose' => 'lockdown',
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, array( $record ) );

		$this->assertSame( 'updated', $result['records'][0]['action'] );
		$this->assertSame( 'PATCH', $this->writes()[0]['method'] );
		$this->assertFalse( $this->writes()[0]['body']['proxied'] );
	}

	/**
	 * A pointer at our name that leads somewhere else is someone else's, so it's never repointed.
	 */
	public function test_never_repoints_another_cname() {
		$this->mock(
			array_merge(
				self::preamble(),
				array( self::ok( array( self::cf_record( 'c', 'CNAME', '_mailchannels.' . self::DOMAIN, 'other.example.net' ) ) ) )
			)
		);
		$record = array(
			'type'    => 'CNAME',
			'name'    => '_mailchannels.' . self::DOMAIN,
			'value'   => 'jpsend42.lockdown.example.net',
			'purpose' => 'lockdown',
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, array( $record ) );

		$this->assertSame( 'failed', $result['records'][0]['action'] );
		$this->assertSame( array(), $this->writes() );
	}

	/**
	 * Records at names their purpose doesn't allow are refused before anything is looked up.
	 */
	public function test_only_writes_our_own_names() {
		$this->mock( self::preamble() );
		$records = array(
			array(
				'type'    => 'CNAME',
				'name'    => 'www.' . self::DOMAIN,
				'value'   => 'jpsend42.dkim.example.net',
				'purpose' => 'dkim',
			),
			array(
				'type'    => 'TXT',
				'name'    => self::DOMAIN,
				'value'   => 'v=mc1 auth=jpsend42',
				'purpose' => 'lockdown',
			),
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, $records );

		$this->assertSame( array( 'failed', 'failed' ), array_column( $result['records'], 'action' ) );
		$this->assertSameSize( self::preamble(), $this->http->requests );
	}

	/**
	 * A sender list that's already near its lookup limit isn't touched, since one more would break it.
	 */
	public function test_leaves_a_full_sender_list_alone() {
		$full = 'v=spf1 a mx include:a.example include:b.example include:c.example include:d.example include:e.example include:f.example include:g.example ~all';
		$this->mock(
			array_merge(
				self::preamble(),
				array( self::ok( array( self::cf_record( 's', 'TXT', self::DOMAIN, $full ) ) ) )
			)
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, array( self::records()[1] ) );

		$this->assertSame( 'failed', $result['records'][0]['action'] );
		$this->assertSame( array(), $this->writes() );
	}

	/**
	 * Cloudflare Email Routing's own sender list gets Jetpack added when Cloudflare allows edits.
	 */
	public function test_merges_into_an_email_routing_sender_list() {
		$routing = self::cf_record( 'er', 'TXT', self::DOMAIN, '"v=spf1 include:_spf.mx.cloudflare.net ~all"' ) + array( 'meta' => array( 'email_routing' => true ) );
		$this->mock(
			array_merge(
				self::preamble(),
				array( self::ok( array( $routing ) ), self::ok( array( 'id' => 'er' ) ) )
			)
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, array( self::records()[1] ) );

		$this->assertSame( 'updated', $result['records'][0]['action'] );
		$this->assertSame( 'v=spf1 include:_spf.mx.cloudflare.net include:relay.mailchannels.net ~all', $this->writes()[0]['body']['content'] );
	}

	/**
	 * A sender list Cloudflare locks is never edited; being optional, it doesn't fail the run.
	 *
	 * @dataProvider provide_locks
	 *
	 * @param array  $lock   Lock fields on the record.
	 * @param string $reason Expected reason.
	 */
	#[DataProvider( 'provide_locks' )]
	public function test_skips_a_locked_optional_sender_list( array $lock, $reason ) {
		$locked = self::cf_record( 'er', 'TXT', self::DOMAIN, 'v=spf1 include:_spf.mx.cloudflare.net ~all' ) + $lock;
		$this->mock(
			array_merge(
				self::preamble(),
				array(
					self::ok( array() ),
					self::ok( array( 'id' => 'a' ) ),
					self::ok( array( $locked ) ),
					self::ok( array() ),
					self::ok( array( 'id' => 'c' ) ),
				)
			)
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, self::records() );

		$this->assertTrue( $result['success'] );
		$this->assertSame( array( 'created', 'skipped', 'created' ), array_column( $result['records'], 'action' ) );
		$this->assertSame( $reason, $result['records'][1]['reason'] );
		$this->assertTrue( $result['records'][1]['optional'] );
		$this->assertSame( array( 'POST', 'POST' ), array_column( $this->writes(), 'method' ) );
	}

	/**
	 * Rows for test_skips_a_locked_optional_sender_list: how Cloudflare marks a locked record.
	 *
	 * @return array
	 */
	public static function provide_locks() {
		return array(
			'Email Routing' => array(
				array(
					'meta' => array(
						'email_routing' => true,
						'read_only'     => true,
					),
				),
				'email_routing',
			),
			'read only'     => array( array( 'meta' => array( 'read_only' => true ) ), 'locked' ),
			'legacy locked' => array( array( 'locked' => true ), 'locked' ),
		);
	}

	/**
	 * When the sender list is required (no signing record), a locked one fails with how to unlock it.
	 */
	public function test_a_locked_required_sender_list_says_how_to_unlock_it() {
		$locked = self::cf_record( 'er', 'TXT', self::DOMAIN, 'v=spf1 include:_spf.mx.cloudflare.net ~all' ) + array(
			'meta' => array(
				'email_routing' => true,
				'read_only'     => true,
			),
		);
		$this->mock( array_merge( self::preamble(), array( self::ok( array( $locked ) ) ) ) );
		$spf = array( 'optional' => false ) + self::records()[1];

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, array( $spf ) );

		$this->assertFalse( $result['success'] );
		$this->assertSame( 'failed', $result['records'][0]['action'] );
		$this->assertSame( 'email_routing', $result['records'][0]['reason'] );
		$this->assertStringContainsString( 'Unlock', $result['records'][0]['error'] );
		$this->assertSame( array(), $this->writes() );
	}

	/**
	 * Cloudflare refusing the optional sender list still leaves the run a success once the others are in.
	 */
	public function test_an_optional_record_cloudflare_refuses_does_not_fail_the_run() {
		$this->mock(
			array_merge(
				self::preamble(),
				array(
					self::ok( array() ),
					self::ok( array( 'id' => 'a' ) ),
					self::ok( array( self::cf_record( 's', 'TXT', self::DOMAIN, 'v=spf1 include:_spf.google.com ~all' ) ) ),
					self::cf_error( 400, 1004 ),
					self::ok( array() ),
					self::ok( array( 'id' => 'c' ) ),
				)
			)
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, self::records() );

		$this->assertTrue( $result['success'] );
		$this->assertSame( array( 'created', 'failed', 'created' ), array_column( $result['records'], 'action' ) );
		$this->assertNotEmpty( $result['records'][1]['error'] );
	}

	/**
	 * Refusals on writing the optional sender list that would otherwise stop the whole run.
	 *
	 * @return array[]
	 */
	public static function provide_optional_write_refusals() {
		return array(
			'not allowed'  => array( 403, 10000 ),
			'bad token'    => array( 401, 10001 ),
			'rate limited' => array( 429, 971 ),
		);
	}

	/**
	 * @dataProvider provide_optional_write_refusals
	 *
	 * @param int $status  HTTP status.
	 * @param int $cf_code Cloudflare error code.
	 */
	#[DataProvider( 'provide_optional_write_refusals' )]
	public function test_a_refused_optional_sender_list_is_skipped_and_the_signing_record_still_goes_in( $status, $cf_code ) {
		$this->mock(
			array_merge(
				self::preamble(),
				array(
					self::ok( array() ),
					self::ok( array( 'id' => 'a' ) ),
					self::ok( array( self::cf_record( 's', 'TXT', self::DOMAIN, 'v=spf1 include:_spf.google.com ~all' ) ) ),
					self::cf_error( $status, $cf_code ),
					self::ok( array() ),
					self::ok( array( 'id' => 'c' ) ),
				)
			)
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, self::records() );

		$this->assertTrue( $result['success'] );
		$this->assertSame( array( 'created', 'skipped', 'created' ), array_column( $result['records'], 'action' ) );
		$this->assertSame( 'refused', $result['records'][1]['reason'] );
	}

	/**
	 * The same refusals still stop the run when the sender list is required (no signing record).
	 *
	 * @dataProvider provide_optional_write_refusals
	 *
	 * @param int $status  HTTP status.
	 * @param int $cf_code Cloudflare error code.
	 */
	#[DataProvider( 'provide_optional_write_refusals' )]
	public function test_a_refused_required_sender_list_stops_the_run( $status, $cf_code ) {
		$this->mock(
			array_merge(
				self::preamble(),
				array(
					self::ok( array( self::cf_record( 's', 'TXT', self::DOMAIN, 'v=spf1 include:_spf.google.com ~all' ) ) ),
					self::cf_error( $status, $cf_code ),
				)
			)
		);
		$spf = array( 'optional' => false ) + self::records()[1];

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, array( $spf ) );

		$this->assertInstanceOf( WP_Error::class, $result );
	}

	/**
	 * A sending subdomain is written into its parent zone, and nothing outside the zone is touched.
	 */
	public function test_finds_the_parent_zone_and_stays_inside_it() {
		$this->mock(
			array(
				self::ok( array( 'status' => 'active' ) ),
				self::ok( array( self::zone() ) ),
				self::ok( array() ),
				self::ok( array( self::zone() ) ),
				self::ok( array() ),
				self::ok( array( 'id' => 'n' ) ),
			)
		);
		$records = array(
			array(
				'type'    => 'TXT',
				'name'    => '_mailchannels.news.' . self::DOMAIN,
				'value'   => 'v=mc1 auth=jpsend42',
				'purpose' => 'lockdown',
			),
			array(
				'type'    => 'TXT',
				'name'    => '_mailchannels.example.org',
				'value'   => 'v=mc1 auth=jpsend42',
				'purpose' => 'lockdown',
			),
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, 'news.' . self::DOMAIN, $records );

		$this->assertSame( Cloudflare_Dns::API_BASE . '/zones?name=news.' . self::DOMAIN, $this->http->requests[2]['url'] );
		$this->assertSame( array( 'created', 'failed' ), array_column( $result['records'], 'action' ) );
		$this->assertCount( 1, $this->writes() );
	}

	/**
	 * Each failure maps to a plain error that never repeats the token.
	 *
	 * @dataProvider provide_errors
	 *
	 * @param string $token     Token sent.
	 * @param array  $responses Mocked responses.
	 * @param string $code      Expected error code.
	 * @param int    $status    Expected REST status.
	 */
	#[DataProvider( 'provide_errors' )]
	public function test_errors( $token, array $responses, $code, $status ) {
		$this->mock( $responses );

		$result = Cloudflare_Dns::apply( $token, self::DOMAIN, self::records() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( $code, $result->get_error_code() );
		$this->assertSame( $status, $result->get_error_data()['status'] );
		$this->assertStringNotContainsString( self::TOKEN, wp_json_encode( array( $result->get_error_messages(), $result->get_error_data() ), JSON_UNESCAPED_SLASHES ) );
		$this->assertStringNotContainsString( 'Cloudflare says no', $result->get_error_message() );
		$this->assertSameSize( $responses, $this->http->requests, 'Stops at the first failure.' );
	}

	/**
	 * Rows for test_errors.
	 *
	 * @return array
	 */
	public static function provide_errors() {
		$preamble = self::preamble();
		return array(
			'malformed token, nothing sent' => array( "bad token\r\nX-Evil: 1", array(), 'jetpack_send_cloudflare_bad_token', 400 ),
			'invalid token'                 => array( self::TOKEN, array( self::cf_error( 401, 1000 ) ), 'jetpack_send_cloudflare_bad_token', 400 ),
			'disabled token'                => array( self::TOKEN, array( self::ok( array( 'status' => 'disabled' ) ) ), 'jetpack_send_cloudflare_bad_token', 400 ),
			'domain not in account'         => array( self::TOKEN, array( $preamble[0], $preamble[1], self::ok( array() ) ), 'jetpack_send_cloudflare_no_zone', 400 ),
			'key sees several zones'        => array( self::TOKEN, array( $preamble[0], self::ok( array( self::zone(), self::zone( 'zone456', 'example.net' ) ) ) ), 'jetpack_send_cloudflare_too_broad', 400 ),
			'no edit permission'            => array( self::TOKEN, array( $preamble[0], $preamble[1], $preamble[2], self::ok( array() ), self::cf_error( 403, 10000 ) ), 'jetpack_send_cloudflare_forbidden', 403 ),
			'rate limited'                  => array( self::TOKEN, array( $preamble[0], self::cf_error( 429, 971 ) ), 'jetpack_send_cloudflare_rate_limited', 429 ),
			'unreachable'                   => array( self::TOKEN, array( new WP_Error( 'http_request_failed', 'cURL error 28 ' . self::TOKEN ) ), 'jetpack_send_cloudflare_error', 502 ),
			'server error'                  => array( self::TOKEN, array( self::cf_error( 500, 10001 ) ), 'jetpack_send_cloudflare_error', 502 ),
		);
	}

	/**
	 * Store an account and return a REST server with the route registered.
	 *
	 * @param array $dns_host Cached detection.
	 * @return WP_REST_Server
	 */
	private function set_up_rest( array $dns_host = array() ) {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( Cloudflare_REST_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init', $wp_rest_server );
		add_filter( 'jetpack_send_pre_existing_spf', '__return_empty_string' );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'admin_user',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
				'user_email' => 'owner@' . self::DOMAIN,
			)
		);
		wp_set_current_user( $user_id );

		Account::save(
			array(
				'handle'           => 'jpsend42',
				'api_key'          => 'mc-key',
				'lockdown_auth_id' => 'jpsend42',
				'domain'           => self::DOMAIN,
				'dkim_selector'    => 'jpsend',
				'monthly_limit'    => -1,
				'dns_records'      => self::records(),
				'zone_records'     => array(),
				'provider'         => 'local',
				'provisioned_at'   => '2026-10-18T10:00:00+00:00',
				'dns_check'        => null,
				'dns_host'         => $dns_host,
			)
		);
		// Keep the follow-up check inside its throttle window so it doesn't call the mail service.
		set_transient( REST_Controller::CHECK_DNS_THROTTLE, time(), 60 );
		return $wp_rest_server;
	}

	/**
	 * A POST /cloudflare/apply request.
	 *
	 * @param string $token Token.
	 * @return WP_REST_Request
	 */
	private static function apply_request( $token = self::TOKEN ) {
		$request = new WP_REST_Request( 'POST', '/jetpack-send/v1/cloudflare/apply' );
		$request->set_body_params( array( 'token' => $token ) );
		return $request;
	}

	/**
	 * The token never reaches options, transients, logs, errors or the response.
	 */
	public function test_token_is_never_kept() {
		$server  = $this->set_up_rest(
			array(
				'domain'   => self::DOMAIN,
				'provider' => 'cloudflare',
				'editable' => true,
			)
		);
		$written = array();
		$capture = function () use ( &$written ) {
			$written[] = serialize( func_get_args() ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize -- Test capture only.
		};
		foreach ( array( 'added_option', 'updated_option', 'setted_transient', 'setted_site_transient', 'added_site_option', 'update_site_option' ) as $hook ) {
			add_action( $hook, $capture, 10, 3 );
		}
		$log_file  = tempnam( sys_get_temp_dir(), 'jpsend-log' );
		$old_log   = ini_set( 'error_log', $log_file ); // phpcs:ignore WordPress.PHP.IniSet.Risky -- Capture error_log output for the assertion.
		$responses = array_merge(
			self::preamble(),
			array( self::ok( array() ), self::ok( array( 'id' => 'a' ) ), self::ok( array() ), self::ok( array() ), self::ok( array( 'id' => 'c' ) ) ),
			// Let the follow-up check run so the request really writes options and a transient.
			array( array( 200, array( 'check_results' => array( 'domain_lockdown' => array( 'verdict' => 'passed' ) ) ) ) )
		);
		delete_transient( REST_Controller::CHECK_DNS_THROTTLE );
		$this->mock( $responses );

		$request = new WP_REST_Request( 'POST', '/jetpack-send/v1/cloudflare/apply' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'token' => self::TOKEN ), JSON_UNESCAPED_SLASHES ) );
		$_POST['token'] = self::TOKEN;
		$response       = $server->dispatch( $request );
		$post_after     = $_POST['token'] ?? '';
		unset( $_POST['token'] );
		$failure = $server->dispatch( self::apply_request( 'short' ) );

		ini_set( 'error_log', (string) $old_log ); // phpcs:ignore WordPress.PHP.IniSet.Risky -- Restore.
		$log = (string) file_get_contents( $log_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local temp file.
		wp_delete_file( $log_file );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['success'] );
		$this->assertSame( 400, $failure->get_status() );
		$this->assertNotEmpty( $written );
		$haystacks = array(
			'options'   => serialize( WorDBless_Options::init()->options ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize -- Test inspection only.
			'writes'    => implode( "\n", $written ),
			'log'       => $log,
			'response'  => wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES ),
			'failure'   => wp_json_encode( $failure->get_data(), JSON_UNESCAPED_SLASHES ),
			'request'   => wp_json_encode( $request->get_params(), JSON_UNESCAPED_SLASHES ),
			'body'      => $request->get_body(),
			'post'      => $post_after,
			'transient' => serialize( get_transient( REST_Controller::CHECK_DNS_THROTTLE ) ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize -- Test inspection only.
		);
		foreach ( $haystacks as $where => $haystack ) {
			$this->assertStringNotContainsString( self::TOKEN, $haystack, "Token found in $where" );
		}
	}

	/**
	 * A token in the query string is ignored, so it can't end up in server logs.
	 */
	public function test_rest_route_ignores_a_token_in_the_query_string() {
		$server = $this->set_up_rest(
			array(
				'domain'   => self::DOMAIN,
				'provider' => 'cloudflare',
				'editable' => true,
			)
		);
		$this->mock( array() );
		$request = new WP_REST_Request( 'POST', '/jetpack-send/v1/cloudflare/apply' );
		$request->set_query_params( array( 'token' => self::TOKEN ) );

		$response = $server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( array(), $this->http->requests );
	}

	/**
	 * When Cloudflare stops the run part-way, the records already written are still reported.
	 */
	public function test_reports_records_written_before_a_stop() {
		$this->mock(
			array_merge(
				self::preamble(),
				array( self::ok( array() ), self::ok( array( 'id' => 'a' ) ), self::cf_error( 429, 971 ) )
			)
		);

		$result = Cloudflare_Dns::apply( self::TOKEN, self::DOMAIN, self::records() );

		$this->assertFalse( $result['success'] );
		$this->assertSame( array( 'created', 'failed' ), array_column( $result['records'], 'action' ) );
		$this->assertStringNotContainsString( self::TOKEN, (string) $result['records'][1]['error'] );
	}

	/**
	 * The route writes the stored account's records and answers with the new status.
	 */
	public function test_rest_route_returns_records_and_status() {
		$server = $this->set_up_rest(
			array(
				'domain'   => self::DOMAIN,
				'provider' => 'cloudflare',
				'editable' => true,
			)
		);
		$this->mock(
			array_merge(
				self::preamble(),
				array( self::ok( array() ), self::ok( array( 'id' => 'a' ) ), self::ok( array() ), self::ok( array() ), self::ok( array( 'id' => 'c' ) ) )
			)
		);

		$data = $server->dispatch( self::apply_request() )->get_data();

		// No sender list exists yet, so the optional one is left alone rather than created.
		$this->assertSame( array( 'created', 'unchanged', 'created' ), array_column( $data['records'], 'action' ) );
		$this->assertSame( self::DOMAIN, $data['status']['account']['domain'] );
		$this->assertArrayNotHasKey( 'api_key', $data['status']['account'] );
	}

	/**
	 * The route refuses without an account, without permission, and when turned off.
	 *
	 * @dataProvider provide_refusals
	 *
	 * @param string $case   Which refusal.
	 * @param string $code   Expected error code.
	 * @param int    $status Expected status.
	 */
	#[DataProvider( 'provide_refusals' )]
	public function test_rest_route_refusals( $case, $code, $status ) {
		$server = $this->set_up_rest(
			array(
				'domain'   => self::DOMAIN,
				'provider' => 'cloudflare',
				'editable' => true,
			)
		);
		$this->mock( array() );
		if ( 'no_account' === $case ) {
			Account::delete();
		} elseif ( 'not_admin' === $case ) {
			wp_set_current_user( 0 );
		} elseif ( 'turned_off' === $case ) {
			add_filter( 'jetpack_send_cloudflare_api_enabled', '__return_false' );
		}

		$response = $server->dispatch( self::apply_request() );

		$this->assertSame( $status, $response->get_status() );
		$this->assertSame( $code, $response->get_data()['code'] );
		$this->assertSame( array(), $this->http->requests );
	}

	/**
	 * Rows for test_rest_route_refusals.
	 *
	 * @return array
	 */
	public static function provide_refusals() {
		return array(
			'no account' => array( 'no_account', 'jetpack_send_not_set_up', 400 ),
			'not admin'  => array( 'not_admin', 'rest_forbidden', 401 ),
			'turned off' => array( 'turned_off', 'jetpack_send_cloudflare_unavailable', 400 ),
		);
	}
}
