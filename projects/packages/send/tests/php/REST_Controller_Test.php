<?php
/**
 * Tests for REST_Controller.
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
 * @covers \Automattic\Jetpack\Send\REST_Controller
 */
#[CoversClass( REST_Controller::class )]
class REST_Controller_Test extends BaseTestCase {

	/**
	 * REST server.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * The active HTTP mock.
	 *
	 * @var Http_Mock|null
	 */
	private $http;

	/**
	 * The fake database, when a test uses one.
	 *
	 * @var Fake_Db|null
	 */
	private $db;

	/**
	 * Register the routes on a fresh server.
	 */
	public function set_up() {
		parent::set_up();
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;
		add_action( 'rest_api_init', array( REST_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init', $this->server );
		add_filter( 'jetpack_send_pre_existing_spf', '__return_empty_string' );
	}

	/**
	 * Reset globals and filters.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_all_actions( 'rest_api_init' );
		remove_all_filters( 'jetpack_send_provisioner' );
		remove_all_filters( 'jetpack_send_pre_existing_spf' );
		if ( $this->http ) {
			$this->http->remove();
			$this->http = null;
		}
		delete_transient( REST_Controller::CHECK_DNS_THROTTLE );
		Onboarding::delete();
		Onboarding::delete_test_history();
		if ( $this->db ) {
			$this->db->remove();
			$this->db = null;
		}
		remove_all_filters( 'jetpack_send_log_retention_days' );
		remove_all_filters( 'jetpack_send_resend_limit' );
		delete_option( Resend::TIMES_OPTION );
		delete_option( Stats::BACKFILL_OPTION );
		Email_Origin::forget();
		Settings::delete();
		Account::delete();
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Schema 4 and a fake database.
	 *
	 * @return Fake_Db
	 */
	private function fake_db() {
		wp_cache_flush();
		update_option( Email_Log::DB_VERSION_OPTION, '4' );
		$this->db = new Fake_Db();
		return $this->db;
	}

	/**
	 * A logged row, as the log table returns it.
	 *
	 * @param array $overrides Columns to replace.
	 * @return array
	 */
	private static function log_row( array $overrides = array() ) {
		return array_merge(
			array(
				'id'              => '12',
				'created_at'      => '2026-10-19 18:14:03',
				'recipients'      => 'Jordan <jordan@example.net>',
				'subject'         => 'Your receipt for order 1048',
				'status'          => 'failed',
				'error'           => 'HTTP 403: This sender is not authorized to send from example.com',
				'request_id'      => '6f2a',
				'source'          => 'wp_mail',
				'origin'          => 'plugin:shop',
				'message'         => wp_json_encode(
					array(
						'from'         => array( 'email' => 'hello@example.com' ),
						'reply_to'     => null,
						'to'           => array( array( 'email' => 'jordan@example.net' ) ),
						'cc'           => array(),
						'bcc'          => array(),
						'subject'      => 'Your receipt for order 1048',
						'content_type' => 'text/plain',
						'body'         => 'Thanks, Jordan. Your total is $12.',
						'attachments'  => array(),
						'kept'         => 'full',
						'redacted'     => false,
					),
					JSON_UNESCAPED_SLASHES
				),
				'from_email'      => 'hello@example.com',
				'other_addresses' => '',
				'body_text'       => 'Thanks, Jordan. Your total is $12.',
				'reason'          => 'lockdown',
				'detail'          => wp_json_encode(
					array(
						'v'              => 1,
						'stage'          => 'response',
						'http_status'    => 403,
						'service_errors' => array( 'This sender is not authorized to send from example.com for jordan@example.net' ),
						'timing'         => array( 'ms' => 412 ),
						'fallback'       => 'off',
						'records'        => array(
							'lockdown'   => 'failed',
							'dkim'       => 'passed',
							'spf'        => 'soft failed',
							'checked_at' => '2026-10-19T18:10:00Z',
						),
					),
					JSON_UNESCAPED_SLASHES
				),
				'resend_of'       => '0',
				'user_id'         => '0',
			),
			$overrides
		);
	}

	/**
	 * Log in as a new user with a role.
	 *
	 * @param string $role  Role.
	 * @param string $email Email address.
	 */
	private function login( $role, $email = '' ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $role . '_user',
				'user_pass'  => 'pass',
				'role'       => $role,
				'user_email' => $email,
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * A DNS check where every record the account needs passed.
	 *
	 * @return array
	 */
	private static function passing_check() {
		return array(
			'domain_lockdown' => 'passed',
			'sender_domain'   => 'passed',
			'spf'             => 'passed',
			'dkim'            => 'unknown',
		);
	}

	/**
	 * A check-domain response with every check passing (or lockdown failing).
	 *
	 * @param bool $passing Whether lockdown passes.
	 * @return array
	 */
	private static function check_response( $passing = true ) {
		return array(
			200,
			array(
				'check_results' => array(
					'spf'             => array( 'verdict' => 'passed' ),
					'domain_lockdown' => array( 'verdict' => $passing ? 'passed' : 'failed' ),
					'dkim'            => array(),
					'sender_domain'   => array( 'verdict' => 'passed' ),
				),
			),
		);
	}

	/**
	 * A MailChannels send response that accepted the message.
	 *
	 * @return array
	 */
	private static function sent() {
		return array(
			202,
			array(
				'request_id' => 'req-1',
				'results'    => array(
					array(
						'index'  => 0,
						'status' => 'sent',
					),
				),
			),
		);
	}

	/**
	 * Dispatch a request.
	 *
	 * @param string $method Method.
	 * @param string $route  Route under the namespace.
	 * @param array  $params Params.
	 * @return \WP_REST_Response
	 */
	private function request( $method, $route, array $params = array() ) {
		$request = new WP_REST_Request( $method, '/jetpack-send/v1' . $route );
		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}
		return $this->server->dispatch( $request );
	}

	/**
	 * A stored account with overrides.
	 *
	 * @param array $overrides Keys to replace.
	 * @return array
	 */
	private static function account( array $overrides = array() ) {
		return array_merge(
			array(
				'handle'           => 'jpsendtest',
				'api_key'          => 'secret-sub-key',
				'lockdown_auth_id' => 'jpsendtest',
				'domain'           => 'example.com',
				'dkim_selector'    => '',
				'monthly_limit'    => -1,
				'dns_records'      => array(),
				'provider'         => 'local',
				'provisioned_at'   => '2026-10-07T00:00:00+00:00',
				'dns_check'        => null,
			),
			$overrides
		);
	}

	/**
	 * A provisioner whose provision() and deprovision() results can be overridden.
	 *
	 * @param array|\WP_Error|null $provision_result   Replaces provision()'s result when set.
	 * @param true|\WP_Error       $deprovision_result deprovision()'s result.
	 * @return Provisioner
	 */
	private static function provisioner( $provision_result = null, $deprovision_result = true ) {
		return new class( $provision_result, $deprovision_result ) extends Fake_Provisioner {
			/**
			 * Replacement provision() result.
			 *
			 * @var array|\WP_Error|null
			 */
			private $provision_result;

			/**
			 * The deprovision() result.
			 *
			 * @var true|\WP_Error
			 */
			private $deprovision_result;

			/**
			 * Constructor.
			 *
			 * @param array|\WP_Error|null $provision_result   Replacement provision() result.
			 * @param true|\WP_Error       $deprovision_result The deprovision() result.
			 */
			public function __construct( $provision_result, $deprovision_result ) {
				$this->provision_result   = $provision_result;
				$this->deprovision_result = $deprovision_result;
			}

			/**
			 * The replacement result, or the fixed one.
			 *
			 * @param string $domain Domain.
			 * @return array|\WP_Error
			 */
			public function provision( $domain ) {
				return null === $this->provision_result ? parent::provision( $domain ) : $this->provision_result;
			}

			/**
			 * The configured result.
			 *
			 * @param array $account Account.
			 * @return true|\WP_Error
			 */
			public function deprovision( array $account ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Required by the interface.
				return $this->deprovision_result;
			}
		};
	}

	/**
	 * Every route, with params that pass validation.
	 *
	 * @return array[]
	 */
	public static function provide_routes() {
		return array(
			'status'     => array( 'GET', '/status', array() ),
			'setup'      => array( 'POST', '/setup', array( 'domain' => 'example.com' ) ),
			'check-dns'  => array( 'POST', '/check-dns', array() ),
			'settings'   => array( 'POST', '/settings', array() ),
			'test'       => array( 'POST', '/test', array( 'to' => 'someone@example.com' ) ),
			'usage'      => array( 'GET', '/usage', array() ),
			'stats'      => array( 'GET', '/stats', array() ),
			'log'        => array( 'GET', '/log', array() ),
			'log entry'  => array( 'GET', '/log/1', array() ),
			'origins'    => array( 'GET', '/log/origins', array() ),
			'summary'    => array( 'GET', '/log/summary', array() ),
			'resend'     => array( 'POST', '/log/1/resend', array( 'to' => array( 'a@example.org' ) ) ),
			'delete one' => array( 'DELETE', '/log/1', array() ),
			'delete'     => array( 'POST', '/log/delete', array( 'ids' => array( 1 ) ) ),
			'reset'      => array( 'POST', '/reset', array() ),
		);
	}

	/**
	 * @dataProvider provide_routes
	 *
	 * @param string $method Method.
	 * @param string $route  Route.
	 * @param array  $params Params.
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_routes_require_manage_options( $method, $route, array $params ) {
		$this->login( 'editor' );

		$this->assertSame( 403, $this->request( $method, $route, $params )->get_status() );
	}

	/**
	 * DNS check states and whether enabling is allowed.
	 *
	 * @return array[]
	 */
	public static function provide_enable_states() {
		$passing     = array(
			'domain_lockdown' => 'passed',
			'sender_domain'   => 'passed',
			'spf'             => 'passed',
			'dkim'            => 'passed',
		);
		$dkim_record = array(
			array(
				'type'    => 'TXT',
				'name'    => 'jpsend._domainkey.example.com',
				'value'   => 'v=DKIM1; p=ABC',
				'purpose' => 'dkim',
			),
		);

		return array(
			'not checked yet'                            => array( null, array(), 400 ),
			'lockdown failing'                           => array( array_merge( $passing, array( 'domain_lockdown' => 'failed' ) ), array(), 400 ),
			'sender domain failing'                      => array( array_merge( $passing, array( 'sender_domain' => 'failed' ) ), array(), 400 ),
			'SPF failing on a domain with a DKIM key'    => array( array_merge( $passing, array( 'spf' => 'soft failed' ) ), $dkim_record, 200 ),
			'SPF failing on a domain without a DKIM key' => array( array_merge( $passing, array( 'spf' => 'soft failed' ) ), array(), 400 ),
			'DKIM failing on a domain with a DKIM key'   => array( array_merge( $passing, array( 'dkim' => 'failed' ) ), $dkim_record, 400 ),
			'DKIM unchecked on a domain without a key'   => array( array_merge( $passing, array( 'dkim' => 'unknown' ) ), array(), 200 ),
			'every record passing'                       => array( $passing, $dkim_record, 200 ),
		);
	}

	/**
	 * @dataProvider provide_enable_states
	 *
	 * @param array|null $dns_check   Stored DNS check.
	 * @param array      $dns_records Stored DNS records.
	 * @param int        $status      Expected HTTP status.
	 */
	#[DataProvider( 'provide_enable_states' )]
	public function test_enabling_requires_lockdown_and_a_dmarc_aligned_record( $dns_check, array $dns_records, $status ) {
		$this->login( 'administrator' );
		Account::save(
			self::account(
				array(
					'dns_check'   => $dns_check,
					'dns_records' => $dns_records,
				)
			)
		);

		$response = $this->request( 'POST', '/settings', array( 'enabled' => true ) );

		$this->assertSame( $status, $response->get_status() );
		$this->assertSame( 200 === $status, Settings::get()['enabled'] );
	}

	public function test_status_never_exposes_the_api_key() {
		$this->login( 'administrator' );
		Account::save( self::account() );

		$response = $this->request( 'GET', '/status' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'example.com', $response->get_data()['account']['domain'] );
		$this->assertStringNotContainsString( 'secret-sub-key', (string) wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) );
	}

	public function test_setup_stores_the_account_and_turns_sending_off() {
		$this->login( 'administrator' );
		Settings::update( array( 'enabled' => true ) );
		add_filter( 'jetpack_send_provisioner', fn() => new Fake_Provisioner() );

		$response = $this->request( 'POST', '/setup', array( 'domain' => 'Example.com' ) );

		$this->assertSame( 200, $response->get_status() );
		$account = Account::get();
		$this->assertIsArray( $account );
		$this->assertSame( 'example.com', $account['domain'] );
		$this->assertSame( 'fake-key', $account['api_key'] );
		$this->assertSame( 'jpsend', $account['dkim_selector'] );
		$this->assertFalse( Settings::get()['enabled'] );
		$this->assertSame( '', $account['existing_spf'] );
		$this->assertSame(
			array(
				'value' => 'v=spf1 include:relay.mailchannels.net ~all',
				'state' => 'new',
			),
			$response->get_data()['spf_suggestion']
		);
	}

	public function test_setup_records_the_domains_existing_spf_record() {
		$this->login( 'administrator' );
		add_filter( 'jetpack_send_provisioner', fn() => new Fake_Provisioner() );
		add_filter( 'jetpack_send_pre_existing_spf', fn( $pre, $domain ) => 'example.com' === $domain ? 'v=spf1 -all' : '', 10, 2 );

		$response = $this->request( 'POST', '/setup', array( 'domain' => 'example.com' ) );

		$account = Account::get();
		$this->assertIsArray( $account );
		$this->assertSame( 'v=spf1 -all', $account['existing_spf'] );
		$this->assertSame( 'v=spf1 include:relay.mailchannels.net -all', $response->get_data()['spf_suggestion']['value'] );
	}

	/**
	 * Where status finds the SPF record: the latest DNS check, then the one seen at setup.
	 *
	 * @return array[]
	 */
	public static function provide_spf_sources() {
		return array(
			'no account'                      => array( null, null ),
			'account from before SPF capture' => array( array(), 'new' ),
			'setup-time record'               => array( array( 'existing_spf' => 'v=spf1 -all' ), 'merge' ),
			'a later DNS check wins'          => array(
				array(
					'existing_spf' => 'v=spf1 -all',
					'dns_check'    => array( 'existing_spf' => 'v=spf1 include:relay.mailchannels.net -all' ),
				),
				'present',
			),
		);
	}

	/**
	 * @dataProvider provide_spf_sources
	 *
	 * @param array|null  $overrides Account keys to replace, or null for no account.
	 * @param string|null $state     Expected suggestion state, or null for no suggestion.
	 */
	#[DataProvider( 'provide_spf_sources' )]
	public function test_status_suggests_spf_from_the_latest_known_record( $overrides, $state ) {
		$this->login( 'administrator' );
		if ( null !== $overrides ) {
			Account::save( self::account( $overrides ) );
		}

		$suggestion = $this->request( 'GET', '/status' )->get_data()['spf_suggestion'];

		$this->assertSame( $state, null === $suggestion ? null : $suggestion['state'] );
	}

	public function test_setup_failure_leaves_the_account_and_settings_unchanged() {
		$this->login( 'administrator' );
		Account::save( self::account() );
		Settings::update( array( 'enabled' => true ) );
		$provisioner = self::provisioner( new \WP_Error( 'jetpack_send_transport', 'down', array( 'status' => 0 ) ) );
		add_filter( 'jetpack_send_provisioner', fn() => $provisioner );

		$response = $this->request( 'POST', '/setup', array( 'domain' => 'other.example.net' ) );

		$this->assertSame( 502, $response->get_status() );
		$this->assertSame( 'jetpack_send_transport', $response->get_data()['code'] );
		$account = Account::get();
		$this->assertIsArray( $account );
		$this->assertSame( 'example.com', $account['domain'] );
		$this->assertSame( 'secret-sub-key', $account['api_key'] );
		$this->assertTrue( Settings::get()['enabled'] );
	}

	/**
	 * Whether deprovisioning fails, and the warning the response carries.
	 *
	 * @return array[]
	 */
	public static function provide_deprovision_results() {
		return array(
			'deprovisioned' => array( true, '' ),
			'cannot delete' => array( new \WP_Error( 'x', 'Could not delete' ), 'Could not delete' ),
		);
	}

	/**
	 * @dataProvider provide_deprovision_results
	 *
	 * @param true|\WP_Error $deprovision_result What deprovision() returns.
	 * @param string         $warning            Expected reset_warning.
	 */
	#[DataProvider( 'provide_deprovision_results' )]
	public function test_reset_clears_local_state_even_if_deprovisioning_fails( $deprovision_result, $warning ) {
		$this->login( 'administrator' );
		Account::save( self::account() );
		Settings::update( array( 'enabled' => true ) );
		$provisioner = self::provisioner( null, $deprovision_result );
		add_filter( 'jetpack_send_provisioner', fn() => $provisioner );

		$response = $this->request( 'POST', '/reset' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNull( Account::get() );
		$this->assertFalse( Settings::get()['enabled'] );
		$this->assertSame( $warning, $response->get_data()['reset_warning'] );
	}

	public function test_status_carries_the_new_settings_and_onboarding_state() {
		$this->login( 'administrator' );

		$data = $this->request( 'GET', '/status' )->get_data();

		$this->assertSame( '', $data['settings']['reply_to'] );
		$this->assertTrue( $data['settings']['auto_enable'] );
		$this->assertSame( Onboarding::defaults(), $data['onboarding'] );
		$this->assertArrayHasKey( 'next_check_at', $data );
	}

	public function test_setup_starts_onboarding_for_the_user_who_ran_it() {
		$this->login( 'administrator', 'owner@example.org' );
		Onboarding::record( array( 'test_sent_at' => '2026-01-01T00:00:00Z' ) );
		Onboarding::update_from_client(
			array(
				'step'   => 'connect',
				'closed' => true,
			)
		);
		add_filter( 'jetpack_send_provisioner', fn() => new Fake_Provisioner() );

		$onboarding = $this->request( 'POST', '/setup', array( 'domain' => 'example.com' ) )->get_data()['onboarding'];

		$this->assertSame( 'owner@example.org', $onboarding['test_to'] );
		$this->assertNull( $onboarding['test_sent_at'] );
		// A new domain shows setup again.
		$this->assertNull( $onboarding['closed_at'] );
		$this->assertNull( $onboarding['step'] );
	}

	/**
	 * Settings changes and the code they're refused with, or null when saved.
	 *
	 * @return array[]
	 */
	public static function provide_settings_changes() {
		return array(
			'reply-to saved'           => array( array( 'reply_to' => ' owner@example.org ' ), null, array( 'reply_to' => 'owner@example.org' ) ),
			'reply-to cleared'         => array( array( 'reply_to' => '' ), null, array( 'reply_to' => '' ) ),
			'reply-to not an email'    => array( array( 'reply_to' => 'owner' ), 'jetpack_send_invalid_reply_to', array( 'reply_to' => '' ) ),
			'auto-enable turned off'   => array( array( 'auto_enable' => false ), null, array( 'auto_enable' => false ) ),
			'bad From local part'      => array( array( 'from_local_part' => 'a b' ), 'jetpack_send_invalid_from', array( 'from_local_part' => 'wordpress' ) ),
			'bad step blocks the rest' => array(
				array(
					'reply_to'   => 'owner@example.org',
					'onboarding' => array( 'step' => 'nope' ),
				),
				'jetpack_send_invalid_onboarding',
				array( 'reply_to' => '' ),
			),
		);
	}

	/**
	 * @dataProvider provide_settings_changes
	 *
	 * @param array       $params   Request params.
	 * @param string|null $code     Expected error code, or null for success.
	 * @param array       $expected Settings afterwards.
	 */
	#[DataProvider( 'provide_settings_changes' )]
	public function test_settings_validates_new_keys( array $params, $code, array $expected ) {
		$this->login( 'administrator' );

		$response = $this->request( 'POST', '/settings', $params );

		$this->assertSame( null === $code ? 200 : 400, $response->get_status() );
		if ( null !== $code ) {
			$this->assertSame( $code, $response->get_data()['code'] );
		}
		$this->assertSame( $expected, array_intersect_key( Settings::get(), $expected ) );
	}

	public function test_settings_saves_onboarding_progress() {
		$this->login( 'administrator' );

		$onboarding = $this->request(
			'POST',
			'/settings',
			array(
				'onboarding' => array(
					'step'    => 'connect',
					'closed'  => true,
					'test_to' => 'someone@example.org',
				),
			)
		)->get_data()['onboarding'];

		$this->assertSame( 'connect', $onboarding['step'] );
		$this->assertNotNull( $onboarding['closed_at'] );
		$this->assertNull( $onboarding['test_to'] );
	}

	public function test_turning_sending_on_by_hand_stops_it_turning_on_by_itself_later() {
		$this->login( 'administrator' );
		Account::save( self::account( array( 'dns_check' => self::passing_check() ) ) );

		$this->request( 'POST', '/settings', array( 'enabled' => true ) );
		$this->request( 'POST', '/settings', array( 'enabled' => false ) );

		$this->assertFalse( Onboarding::maybe_auto_enable() );
	}

	/**
	 * Whether auto-enable is on, and whether a passing check turns sending on.
	 *
	 * @return array[]
	 */
	public static function provide_auto_enable() {
		return array(
			'passing, auto-enable on'  => array( true, true, true ),
			'passing, auto-enable off' => array( true, false, false ),
			'failing, auto-enable on'  => array( false, true, false ),
		);
	}

	/**
	 * @dataProvider provide_auto_enable
	 *
	 * @param bool $passing     Whether the check passes.
	 * @param bool $auto_enable The auto_enable setting.
	 * @param bool $enabled     Whether sending ends up on.
	 */
	#[DataProvider( 'provide_auto_enable' )]
	public function test_check_dns_turns_sending_on_when_checks_pass( $passing, $auto_enable, $enabled ) {
		$this->login( 'administrator' );
		Account::save( self::account() );
		Settings::update( array( 'auto_enable' => $auto_enable ) );
		$this->http = new Http_Mock( array( self::check_response( $passing ) ) );

		$data = $this->request( 'POST', '/check-dns' )->get_data();

		$this->assertSame( $enabled, $data['settings']['enabled'] );
		$this->assertSame( $passing, $data['can_enable'] );
	}

	public function test_check_dns_answers_from_the_last_check_inside_the_window() {
		$this->login( 'administrator' );
		Account::save( self::account() );
		$this->http = new Http_Mock( array( self::check_response( false ), self::check_response( true ) ) );

		$this->request( 'POST', '/check-dns' );
		$second = $this->request( 'POST', '/check-dns' );

		$this->assertSame( 200, $second->get_status() );
		$this->assertCount( 1, $this->http->requests );
		$this->assertFalse( $second->get_data()['can_enable'] );

		delete_transient( REST_Controller::CHECK_DNS_THROTTLE );
		$this->assertTrue( $this->request( 'POST', '/check-dns' )->get_data()['can_enable'] );
		$this->assertCount( 2, $this->http->requests );
	}

	/**
	 * Test requests that are refused before anything is sent.
	 *
	 * @return array[]
	 */
	public static function provide_refused_tests() {
		return array(
			'not set up'          => array( false, null, array(), 'jetpack_send_not_set_up' ),
			'someone else'        => array( true, self::passing_check(), array( 'to' => 'victim@example.org' ), 'jetpack_send_bad_recipient' ),
			'records not checked' => array( true, null, array(), 'jetpack_send_not_ready' ),
			'lockdown failing'    => array( true, array_merge( self::passing_check(), array( 'domain_lockdown' => 'failed' ) ), array(), 'jetpack_send_not_ready' ),
		);
	}

	/**
	 * @dataProvider provide_refused_tests
	 *
	 * @param bool       $set_up    Whether an account exists.
	 * @param array|null $dns_check Stored check.
	 * @param array      $params    Request params.
	 * @param string     $code      Expected error code.
	 */
	#[DataProvider( 'provide_refused_tests' )]
	public function test_test_is_refused_without_sending( $set_up, $dns_check, array $params, $code ) {
		$this->login( 'administrator', 'me@example.org' );
		if ( $set_up ) {
			Account::save( self::account( array( 'dns_check' => $dns_check ) ) );
		}
		$this->http = new Http_Mock( array() );

		$response = $this->request( 'POST', '/test', $params );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( $code, $response->get_data()['code'] );
		$this->assertSame( array(), $this->http->requests );
	}

	public function test_not_ready_names_the_domain() {
		$this->login( 'administrator', 'me@example.org' );
		Account::save( self::account() );

		$this->assertSame( 'Finish connecting example.com first.', $this->request( 'POST', '/test' )->get_data()['message'] );
	}

	public function test_test_goes_to_the_current_user_and_returns_its_log_id() {
		$this->login( 'administrator', 'Me@Example.org' );
		Account::save( self::account( array( 'dns_check' => self::passing_check() ) ) );
		update_option( Email_Log::DB_VERSION_OPTION, Email_Log::DB_VERSION );
		$this->http = new Http_Mock( array( self::sent() ) );

		$response = $this->request( 'POST', '/test', array( 'to' => 'me@example.org' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['success'] );
		$this->assertSame( 'req-1', $response->get_data()['request_id'] );
		$this->assertIsString( $response->get_data()['log_id'] );
		$this->assertSame( array( array( 'email' => 'Me@Example.org' ) ), $this->http->requests[0]['body']['personalizations'][0]['to'] );
	}

	public function test_failed_test_is_still_a_200_with_the_reason() {
		$this->login( 'administrator', 'me@example.org' );
		Account::save( self::account( array( 'dns_check' => self::passing_check() ) ) );
		$this->http = new Http_Mock( array( array( 403, array( 'errors' => array( 'Domain lockdown' ) ) ) ) );

		$response = $this->request( 'POST', '/test' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( $response->get_data()['success'] );
		$this->assertNotSame( '', $response->get_data()['error'] );
	}

	public function test_tests_are_rate_limited_per_site() {
		$this->login( 'administrator', 'me@example.org' );
		Account::save( self::account( array( 'dns_check' => self::passing_check() ) ) );
		$this->http = new Http_Mock( array_fill( 0, Onboarding::TEST_LIMIT, self::sent() ) );
		for ( $i = 0; $i < Onboarding::TEST_LIMIT; $i++ ) {
			$this->assertSame( 200, $this->request( 'POST', '/test' )->get_status() );
		}

		$response = $this->request( 'POST', '/test' );

		$this->assertSame( 429, $response->get_status() );
		$this->assertSame( 'jetpack_send_rate_limited', $response->get_data()['code'] );
		$this->assertCount( Onboarding::TEST_LIMIT, $this->http->requests );
	}

	public function test_reset_does_not_refill_the_test_allowance() {
		for ( $i = 0; $i < Onboarding::TEST_LIMIT; $i++ ) {
			Onboarding::count_test();
		}
		$this->login( 'administrator', 'me@example.org' );
		Account::save( self::account() );
		$this->request( 'POST', '/reset' );

		$this->assertTrue( Onboarding::test_rate_limited() );
	}

	/**
	 * List filters as each client sends them, and the condition they become; unknown values are a 400.
	 *
	 * @return array[]
	 */
	public static function provide_log_lists() {
		return array(
			'one value, as older pages send' => array( array( 'source' => 'test' ), 200, "source IN ('test')" ),
			'any, as older pages send'       => array( array( 'status' => '' ), 200, 'WHERE 1=1 ORDER' ),
			'a comma string, as links send'  => array( array( 'status' => 'failed,fallback' ), 200, "status IN ('failed','fallback')" ),
			'an array, as the Log sends'     => array( array( 'source' => array( 'wp_mail', 'resend' ) ), 200, "source IN ('wp_mail','resend')" ),
			'plugins and kinds of email'     => array( array( 'origin' => array( 'plugin:shop-orders', 'core:password_reset' ) ), 200, "origin IN ('plugin:shop-orders','core:password_reset')" ),
			'an unknown type'                => array( array( 'source' => 'cron' ), 400, '' ),
			'an origin that isn\'t one'      => array( array( 'origin' => "plugin:x' OR 1=1" ), 400, '' ),
		);
	}

	/**
	 * @dataProvider provide_log_lists
	 *
	 * @param array  $params   Params.
	 * @param int    $status   Expected HTTP status.
	 * @param string $expected SQL the page query carries.
	 */
	#[DataProvider( 'provide_log_lists' )]
	public function test_log_filters_take_every_list_form( array $params, $status, $expected ) {
		$this->login( 'administrator' );
		$db = $this->fake_db();

		$response = $this->request( 'GET', '/log', $params );

		$this->assertSame( $status, $response->get_status() );
		if ( 200 === $status ) {
			$this->assertStringContainsString( str_replace( ' ORDER', '', $expected ), $db->matching( 'SELECT id, created_at' )[0] );
		}
	}

	public function test_log_rows_name_their_origin_and_link_their_original() {
		$this->login( 'administrator' );
		$this->fake_db()->on(
			'SELECT id, created_at',
			array(
				array(
					'id'         => '9',
					'created_at' => '2026-10-18 09:00:00',
					'recipients' => 'a@example.org',
					'subject'    => 'Again',
					'status'     => 'sent',
					'error'      => '',
					'request_id' => 'r9',
					'source'     => 'resend',
					'origin'     => 'core:password_reset',
					'from_email' => 'hello@example.com',
					'reason'     => '',
					'resend_of'  => '4',
				),
			)
		);

		$item = $this->request( 'GET', '/log' )->get_data()['items'][0];

		$this->assertSame( 'Password resets', $item['origin_label'] );
		$this->assertNull( $item['origin_icon_url'] );
		$this->assertSame( '4', $item['resend_of'] );
		$this->assertArrayNotHasKey( 'detail', $item );
	}

	public function test_log_origins_list_what_is_still_in_the_log() {
		$this->login( 'administrator' );
		$this->fake_db()->on(
			'GROUP BY origin',
			array(
				array(
					'origin' => 'core:password_reset',
					'n'      => '3',
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'key'      => 'core:password_reset',
					'label'    => 'Password resets',
					'icon_url' => null,
					'count'    => 3,
				),
			),
			$this->request( 'GET', '/log/origins' )->get_data()
		);
	}

	/**
	 * Log `days` values and the HTTP status they get.
	 *
	 * @return array[]
	 */
	public static function provide_log_days() {
		return array(
			'last 7 days'  => array( 7, 200 ),
			'last 30 days' => array( 30, 200 ),
			'negative'     => array( -1, 400 ),
		);
	}

	/**
	 * @dataProvider provide_log_days
	 *
	 * @param int $days   Days param.
	 * @param int $status Expected HTTP status.
	 */
	#[DataProvider( 'provide_log_days' )]
	public function test_log_counts_back_the_same_days_as_stats( $days, $status ) {
		$this->login( 'administrator' );
		update_option( Email_Log::DB_VERSION_OPTION, Email_Log::DB_VERSION );
		update_option( 'gmt_offset', 10 );
		$queries = array();
		$capture = static function ( $results, $query ) use ( &$queries ) {
			$queries[] = $query;
			return $results;
		};
		add_filter( 'wordbless_wpdb_query_results', $capture, 10, 2 );

		$response = $this->request( 'GET', '/log', array( 'days' => $days ) );
		remove_filter( 'wordbless_wpdb_query_results', $capture, 10 );

		$this->assertSame( $status, $response->get_status() );
		if ( 200 === $status ) {
			// Site-local midnight at UTC+10, the boundary GET /stats counts from too.
			$since = gmdate( 'Y-m-d H:i:s', Period::resolve( array( 'days' => $days ) )['start_utc'] );
			$this->assertStringEndsWith( ' 14:00:00', $since );
			$this->assertStringContainsString( "created_at >= '{$since}'", implode( "\n", $queries ) );
		}
	}

	/**
	 * Days the clocks go forward at midnight, and the UTC times the Log's date filter must keep to.
	 *
	 * @return array[]
	 */
	public static function provide_log_change_days() {
		return array(
			'Santiago' => array( 'America/Santiago', '2026-09-06', '2026-09-06 04:00:00', '2026-09-07 03:00:00' ),
			'Cairo'    => array( 'Africa/Cairo', '2026-04-24', '2026-04-23 22:00:00', '2026-04-24 21:00:00' ),
		);
	}

	/**
	 * @dataProvider provide_log_change_days
	 *
	 * @param string $zone  Site timezone.
	 * @param string $day   The day picked.
	 * @param string $from  UTC of its first moment.
	 * @param string $until UTC of the next day's first moment.
	 */
	#[DataProvider( 'provide_log_change_days' )]
	public function test_the_log_date_filter_covers_exactly_a_day_the_clocks_go_forward_at_midnight( $zone, $day, $from, $until ) {
		$this->login( 'administrator' );
		update_option( Email_Log::DB_VERSION_OPTION, Email_Log::DB_VERSION );
		update_option( 'timezone_string', $zone );
		$queries = array();
		$capture = static function ( $results, $query ) use ( &$queries ) {
			$queries[] = $query;
			return $results;
		};
		add_filter( 'wordbless_wpdb_query_results', $capture, 10, 2 );

		$response = $this->request(
			'GET',
			'/log',
			array(
				'start' => $day,
				'end'   => $day,
			)
		);
		remove_filter( 'wordbless_wpdb_query_results', $capture, 10 );
		update_option( 'timezone_string', '' );

		$this->assertSame( 200, $response->get_status() );
		$sql = implode( "\n", $queries );
		$this->assertStringContainsString( "created_at >= '{$from}' AND created_at < '{$until}'", $sql );
	}

	/**
	 * Recipient lists and the address whose avatar shows.
	 *
	 * @return array[]
	 */
	public static function provide_recipients() {
		return array(
			'one address'       => array( 'sales@example.com', 'sales@example.com' ),
			'several'           => array( 'sales@example.com, jobs@example.com', 'sales@example.com' ),
			'name with a comma' => array( '"Desk, Help" <help@example.com>, sales@example.com', 'help@example.com' ),
			'no valid address'  => array( 'undisclosed-recipients', '' ),
		);
	}

	/**
	 * @dataProvider provide_recipients
	 *
	 * @param string $recipients Logged recipients.
	 * @param string $expected   First address.
	 */
	#[DataProvider( 'provide_recipients' )]
	public function test_first_recipient( $recipients, $expected ) {
		$this->assertSame( $expected, REST_Controller::first_recipient( $recipients ) );
	}

	/**
	 * The Discussion setting for avatars, and whether log rows carry one.
	 *
	 * @return array[]
	 */
	public static function provide_avatar_settings() {
		return array(
			'avatars shown'  => array( '1', true ),
			'avatars hidden' => array( '0', false ),
		);
	}

	/**
	 * @dataProvider provide_avatar_settings
	 *
	 * @param string $show       The `show_avatars` option.
	 * @param bool   $has_avatar Whether the row should carry an avatar URL.
	 */
	#[DataProvider( 'provide_avatar_settings' )]
	public function test_log_rows_carry_the_first_recipients_avatar( $show, $has_avatar ) {
		$this->login( 'administrator' );
		update_option( Email_Log::DB_VERSION_OPTION, Email_Log::DB_VERSION );
		update_option( 'show_avatars', $show );
		$rows = static function ( $results, $query ) {
			if ( false === strpos( $query, 'SELECT id, created_at' ) ) {
				return $results;
			}
			return array(
				(object) array(
					'id'         => '1',
					'created_at' => '2026-10-18 09:00:00',
					'recipients' => 'Sales <sales@example.com>, jobs@example.com',
					'subject'    => 'Your order',
					'status'     => 'sent',
					'error'      => '',
					'request_id' => 'r1',
					'source'     => 'wp_mail',
				),
			);
		};
		add_filter( 'wordbless_wpdb_query_results', $rows, 10, 2 );

		$response = $this->request( 'GET', '/log' );
		remove_filter( 'wordbless_wpdb_query_results', $rows, 10 );

		$url = $response->get_data()['items'][0]['avatar_url'];
		if ( ! $has_avatar ) {
			$this->assertNull( $url );
			return;
		}
		$this->assertSame(
			get_avatar_url(
				'sales@example.com',
				array(
					'size'    => REST_Controller::AVATAR_SIZE,
					'default' => 'blank',
				)
			),
			$url
		);
		// A transparent image for addresses without one: the initial shows through, with no 404 in the console.
		$this->assertStringContainsString( 'd=blank', $url );
	}

	/**
	 * Answer the log table's queries with rows whose ids are given.
	 *
	 * @param string[] $ids Ids the table holds.
	 * @return callable The filter, to remove afterwards.
	 */
	private static function fake_log( array $ids ) {
		update_option( Email_Log::DB_VERSION_OPTION, Email_Log::DB_VERSION );
		$filter = static function ( $results, $query ) use ( $ids ) {
			if ( 0 !== stripos( $query, 'SELECT id FROM' ) ) {
				return $results;
			}
			return array_map( fn( $id ) => (object) array( 'id' => $id ), $ids );
		};
		add_filter( 'wordbless_wpdb_query_results', $filter, 10, 2 );
		return $filter;
	}

	public function test_deleting_an_email_that_is_gone_is_a_404() {
		$this->login( 'administrator' );
		$filter = self::fake_log( array() );

		$response = $this->request( 'DELETE', '/log/9' );
		remove_filter( 'wordbless_wpdb_query_results', $filter, 10 );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'jetpack_send_log_entry_not_found', $response->get_data()['code'] );
	}

	public function test_bulk_delete_reports_the_ids_that_were_already_gone() {
		$this->login( 'administrator' );
		$filter = self::fake_log( array( '3' ) );

		$response = $this->request( 'POST', '/log/delete', array( 'ids' => array( 3, 4 ) ) );
		remove_filter( 'wordbless_wpdb_query_results', $filter, 10 );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'deleted' => array( '3' ),
				'missing' => array( '4' ),
			),
			$response->get_data()
		);
	}

	public function test_bulk_delete_takes_at_most_one_page_of_ids() {
		$this->login( 'administrator' );

		$response = $this->request( 'POST', '/log/delete', array( 'ids' => range( 1, REST_Controller::MAX_DELETE_IDS + 1 ) ) );

		$this->assertSame( 400, $response->get_status() );
	}

	public function test_deleting_the_test_email_leaves_setup_and_the_test_limit_alone() {
		$this->login( 'administrator', 'owner@example.com' );
		Onboarding::record(
			array(
				'test_sent_at'     => '2026-10-18T09:00:00Z',
				'auto_test_log_id' => '3',
			)
		);
		Onboarding::update_from_client( array( 'closed' => true ) );
		Onboarding::count_test();
		$state  = Onboarding::state();
		$times  = get_option( Onboarding::TEST_TIMES_OPTION );
		$filter = self::fake_log( array( '3' ) );

		$this->request( 'DELETE', '/log/3' );
		remove_filter( 'wordbless_wpdb_query_results', $filter, 10 );

		$this->assertSame( $state, Onboarding::state() );
		$this->assertSame( $times, get_option( Onboarding::TEST_TIMES_OPTION ) );
		$this->assertNotEmpty( $times );
	}

	public function test_this_month_counts_from_the_dashboards_counts_and_resets_on_the_first_in_the_site_timezone() {
		update_option( 'timezone_string', 'Pacific/Auckland' );
		$db = $this->fake_db()->on(
			'GROUP BY source, status',
			array(
				array(
					'source' => 'wp_mail',
					'status' => 'sent',
					'n'      => '7',
				),
				array(
					'source' => 'test',
					'status' => 'sent',
					'n'      => '5',
				),
			)
		);
		add_filter( 'jetpack_send_provisioner', fn() => new Fake_Provisioner() );

		// 31 Oct 12:30 UTC is already 1 Nov in Auckland.
		$usage = REST_Controller::usage_data( self::account(), (int) strtotime( '2026-10-31 12:30:00 UTC' ) );
		delete_option( 'timezone_string' );

		// The counts, not the service's (12), so deleting emails from the log doesn't lower it.
		$this->assertSame( 12, $usage['emails'] );
		$this->assertSame( 5, $usage['tests'] );
		$this->assertSame( 3000, $usage['monthly_limit'] );
		$this->assertSame( '2026-11-01', $usage['month_start'] );
		$this->assertSame( '2026-12-01', $usage['resets_on'] );
		$this->assertStringContainsString( 'bucket >= ' . strtotime( '2026-10-31 11:00:00 UTC' ), $db->matching( 'GROUP BY source, status' )[0] );
	}

	public function test_this_month_starts_at_the_first_midnight_when_the_clocks_go_back_at_1_am_on_the_first() {
		// Havana's clocks go back from 01:00 to 00:00 on 1 Nov 2026, so that day has two midnights.
		update_option( 'timezone_string', 'America/Havana' );
		$db = $this->fake_db();
		add_filter( 'jetpack_send_provisioner', fn() => new Fake_Provisioner() );

		$usage = REST_Controller::usage_data( self::account(), (int) strtotime( '2026-11-15 12:00:00 UTC' ) );
		delete_option( 'timezone_string' );

		$this->assertSame( '2026-11-01', $usage['month_start'] );
		$this->assertSame( '2026-12-01', $usage['resets_on'] );
		$this->assertStringContainsString( 'bucket >= ' . strtotime( '2026-11-01 04:00:00 UTC' ), $db->matching( 'GROUP BY source, status' )[0] );
	}

	/**
	 * Avatar settings and the sender avatar the status carries.
	 *
	 * @return array[]
	 */
	public static function provide_sender_avatars() {
		return array(
			'avatars shown'  => array( '1', 'hello@example.com' ),
			'avatars hidden' => array( '0', null ),
		);
	}

	/**
	 * @dataProvider provide_sender_avatars
	 *
	 * @param string      $show  The `show_avatars` option.
	 * @param string|null $email The address the avatar is for, or null for none.
	 */
	#[DataProvider( 'provide_sender_avatars' )]
	public function test_status_carries_the_from_addresss_avatar( $show, $email ) {
		update_option( 'show_avatars', $show );
		Account::save( self::account() );
		Settings::update( array( 'from_local_part' => 'hello' ) );

		$avatar = REST_Controller::status_data()['sender_avatar'];

		$this->assertSame( $email, $avatar['email'] ?? null );
		if ( $email ) {
			$this->assertStringContainsString( 'd=blank', $avatar['url'] );
		}
	}

	public function test_check_dns_tries_again_after_a_failed_call() {
		$this->login( 'administrator' );
		Account::save( self::account() );
		$this->http = new Http_Mock( array( array( 500, array( 'errors' => array( 'down' ) ) ), self::check_response( true ) ) );

		$this->assertSame( 500, $this->request( 'POST', '/check-dns' )->get_status() );
		$second = $this->request( 'POST', '/check-dns' );

		$this->assertCount( 2, $this->http->requests );
		$this->assertTrue( $second->get_data()['can_enable'] );
	}

	public function test_reset_stops_the_watch() {
		$this->login( 'administrator' );
		Account::save( self::account() );
		Dns_Watch::start();
		$this->assertNotFalse( wp_next_scheduled( Dns_Watch::HOOK ) );

		$this->request( 'POST', '/reset' );

		$this->assertFalse( wp_next_scheduled( Dns_Watch::HOOK ) );
		$this->assertNull( Dns_Watch::next_check_at() );
	}

	public function test_status_names_the_current_users_email() {
		$this->login( 'administrator', 'me@example.org' );

		$this->assertSame( 'me@example.org', $this->request( 'GET', '/status' )->get_data()['current_user_email'] );
	}

	public function test_reset_forgets_onboarding() {
		$this->login( 'administrator' );
		Account::save( self::account() );
		Onboarding::update_from_client( array( 'closed' => true ) );

		$this->assertSame( Onboarding::defaults(), $this->request( 'POST', '/reset' )->get_data()['onboarding'] );
	}

	/**
	 * Domain input and what it normalizes to.
	 *
	 * @return array[]
	 */
	public static function provide_domains() {
		return array(
			'url with path and mixed case' => array( 'https://WWW.Example.com/path', 'www.example.com' ),
			'trailing dot'                 => array( 'example.com.', 'example.com' ),
			'no dot'                       => array( 'localhost', '' ),
			'empty'                        => array( '', '' ),
			'uppercase'                    => array( 'Example.COM', 'example.com' ),
		);
	}

	/**
	 * @dataProvider provide_domains
	 *
	 * @param string $input    Raw input.
	 * @param string $expected Normalized domain, or ''.
	 */
	#[DataProvider( 'provide_domains' )]
	public function test_sanitize_domain( $input, $expected ) {
		$this->assertSame( $expected, REST_Controller::sanitize_domain( $input ) );
	}

	public function test_stats_needs_an_account() {
		$this->login( 'administrator' );

		$this->assertSame( 'jetpack_send_not_set_up', $this->request( 'GET', '/stats' )->as_error()->get_error_code() );
	}

	/**
	 * GET /stats params and the status each gets.
	 *
	 * @return array[]
	 */
	public static function provide_stats_periods() {
		$today = gmdate( 'Y-m-d' );
		return array(
			'default 90 days'         => array( array(), 200, 90 ),
			'last 24 hours'           => array( array( 'range' => 1 ), 200, 1 ),
			'an older 7-day link'     => array( array( 'range' => 7 ), 200, 7 ),
			'14 days isn\'t a preset' => array( array( 'range' => 14 ), 400, null ),
			'custom days'             => array(
				array(
					'start' => gmdate( 'Y-m-d', time() - 9 * DAY_IN_SECONDS ),
					'end'   => $today,
				),
				200,
				null,
			),
			'over a year'             => array(
				array(
					'start' => gmdate( 'Y-m-d', time() - 400 * DAY_IN_SECONDS ),
					'end'   => $today,
				),
				400,
				null,
			),
			'not a date'              => array(
				array(
					'start' => 'yesterday',
					'end'   => $today,
				),
				400,
				null,
			),
		);
	}

	/**
	 * @dataProvider provide_stats_periods
	 *
	 * @param array    $params Params.
	 * @param int      $status Expected HTTP status.
	 * @param int|null $range  The range the payload says.
	 */
	#[DataProvider( 'provide_stats_periods' )]
	public function test_stats_takes_a_preset_or_custom_days( array $params, $status, $range ) {
		$this->login( 'administrator' );
		Account::save( self::account() );
		update_option( Email_Log::DB_VERSION_OPTION, '4' );

		$response = $this->request( 'GET', '/stats', $params );

		$this->assertSame( $status, $response->get_status() );
		if ( 200 === $status ) {
			$data = $response->get_data();
			// Older pages read the first nine keys.
			$this->assertSame( array( 'range', 'from', 'to', 'unit', 'totals', 'tests', 'days', 'hours', 'origins', 'attention', 'last_email_at', 'last_email_day', 'has_history', 'stats_since', 'log_covers_from' ), array_keys( $data ) );
			$this->assertSame( $range, $data['range'] );
			$this->assertCount( 1 === $range ? 24 : 0, $data['hours'] );
		}
	}

	public function test_reset_forgets_the_cached_stats() {
		$this->login( 'administrator' );
		set_transient( Email_Log::STATS_TRANSIENT . '7', array( 'data' => array() ) );

		$this->request( 'POST', '/reset' );

		$this->assertFalse( get_transient( Email_Log::STATS_TRANSIENT . '7' ) );
	}

	/**
	 * Origins, the plugins installed, and the name and icon an email's panel shows.
	 *
	 * @return array[]
	 */
	public static function provide_entry_origins() {
		return array(
			'a plugin with a WordPress.org icon' => array( 'plugin:shop', 'Shop', 'https://ps.w.org/shop/assets/icon.svg?rev=1' ),
			'a kind of WordPress email'          => array( 'core:password_reset', 'Password resets', null ),
			'none'                               => array( '', '', null ),
		);
	}

	/**
	 * @dataProvider provide_entry_origins
	 *
	 * @param string      $origin Origin key.
	 * @param string      $label  Name.
	 * @param string|null $icon   Icon URL.
	 */
	#[DataProvider( 'provide_entry_origins' )]
	public function test_an_entry_names_what_sent_it( $origin, $label, $icon ) {
		$db = $this->fake_db();
		$this->login( 'administrator' );
		wp_cache_set( 'plugins', array( '' => array( 'shop/shop.php' => array( 'Name' => 'Shop' ) ) ), 'plugins' );
		set_site_transient(
			'update_plugins',
			(object) array(
				'no_update' => array(
					'shop/shop.php' => (object) array( 'icons' => array( 'svg' => 'https://ps.w.org/shop/assets/icon.svg?rev=1' ) ),
				),
			)
		);
		$db->on( 'SELECT * FROM `wp_jetpack_send_log`', array( self::log_row( array( 'origin' => $origin ) ) ) );

		$entry = $this->request( 'GET', '/log/12' )->get_data();
		wp_cache_delete( 'plugins', 'plugins' );
		delete_site_transient( 'update_plugins' );

		$this->assertSame( $label, $entry['origin_label'] );
		$this->assertSame( $icon, $entry['origin_icon_url'] );
	}

	public function test_an_entry_says_why_it_failed_and_what_can_be_done() {
		$this->login( 'administrator' );
		Account::save( self::account( array( 'dns_check' => self::passing_check() ) ) );
		Settings::update( array( 'enabled' => true ) );
		$this->fake_db()
			->on( 'SELECT * FROM `wp_jetpack_send_log`', array( self::log_row() ) )
			->on(
				'WHERE resend_of = 12 ORDER BY',
				array(
					array(
						'id'         => '15',
						'status'     => 'sent',
						'created_at' => '2026-10-19 18:20:00',
					),
				)
			)
			->on( 'COUNT(*) FROM `wp_jetpack_send_log` WHERE resend_of', array( array( 'n' => '1' ) ) )
			->on( 'COUNT(*) FROM `wp_jetpack_send_debug`', array( array( 'n' => '4' ) ) );

		$entry = $this->request( 'GET', '/log/12' )->get_data();

		$this->assertSame( 'lockdown', $entry['reason'] );
		$this->assertSame( 403, $entry['detail']['http_status'] );
		$this->assertSame(
			array(
				'allowed' => true,
				'reason'  => '',
				'locked'  => false,
			),
			$entry['resend']
		);
		$this->assertSame(
			array(
				array(
					'id'         => '15',
					'status'     => 'sent',
					'created_at' => '2026-10-19 18:20:00',
				),
			),
			$entry['resends']
		);
		$this->assertSame( 1, $entry['resend_count'] );
		$this->assertSame( '', $entry['resend_of'] );
		$this->assertNull( $entry['resend_of_entry'] );
		$this->assertSame( '', $entry['resent_by'] );
		$this->assertSame( 4, $entry['debug_count'] );
		$this->assertArrayNotHasKey( 'body_text', $entry );
		$this->assertArrayNotHasKey( 'user_id', $entry );
	}

	public function test_support_text_names_domains_only() {
		$this->login( 'administrator' );
		update_option( 'timezone_string', 'America/New_York' );
		$this->fake_db()->on( 'SELECT * FROM `wp_jetpack_send_log`', array( self::log_row() ) );

		$text = $this->request( 'GET', '/log/12' )->get_data()['support_text'];
		delete_option( 'timezone_string' );

		$this->assertStringStartsWith( "Jetpack Send email report\nWhen: 2026-10-19 14:14:03 (America/New_York, UTC-04:00)\nStatus: failed (lockdown)\nFrom domain: example.com\nTo domain: example.net\nWhat happened: HTTP 403 from the email service\n", $text );
		$this->assertStringContainsString( 'Records at the time: permission failed, signing passed, sender list soft failed (checked 2026-10-19 14:10)', $text );
		$this->assertStringContainsString( 'j•••@example.net', $text );
		foreach ( array( 'jordan@example.net', 'Your receipt', 'Thanks, Jordan' ) as $private ) {
			$this->assertStringNotContainsString( $private, $text );
		}
	}

	public function test_a_copy_links_back_to_its_original_and_who_sent_it() {
		$db = $this->fake_db();
		$this->login( 'administrator' );
		$user = wp_insert_user(
			array(
				'user_login'   => 'resender',
				'user_pass'    => 'pass',
				'display_name' => 'Sam Rivera',
			)
		);
		$db->on(
			'SELECT * FROM `wp_jetpack_send_log`',
			array(
				self::log_row(
					array(
						'source'    => 'resend',
						'resend_of' => '4',
						'user_id'   => (string) $user,
					)
				),
			)
		)
			->on( 'SELECT created_at, status FROM', array() );

		$entry = $this->request( 'GET', '/log/12' )->get_data();

		$this->assertSame( '4', $entry['resend_of'] );
		$this->assertSame(
			array(
				'id'         => '4',
				'exists'     => false,
				'created_at' => null,
				'status'     => null,
			),
			$entry['resend_of_entry']
		);
		$this->assertSame( 'Sam Rivera', $entry['resent_by'] );
	}

	public function test_a_copy_says_how_its_original_went() {
		$db = $this->fake_db();
		$this->login( 'administrator' );
		$db->on(
			'SELECT * FROM `wp_jetpack_send_log`',
			array(
				self::log_row(
					array(
						'source'    => 'resend',
						'resend_of' => '4',
					)
				),
			)
		)
			->on(
				'SELECT created_at, status FROM',
				array(
					array(
						'created_at' => '2026-10-19 14:14:03',
						'status'     => 'failed',
					),
				)
			);

		$entry = $this->request( 'GET', '/log/12' )->get_data();

		$this->assertSame(
			array(
				'id'         => '4',
				'exists'     => true,
				'created_at' => '2026-10-19 14:14:03',
				'status'     => 'failed',
			),
			$entry['resend_of_entry']
		);
	}

	/**
	 * Resends refused before anything is sent, and the error each gets.
	 *
	 * @return array[]
	 */
	public static function provide_refused_resends() {
		return array(
			'not in the log'  => array( 'missing', array( 'to' => array( 'jordan@example.net' ) ), 404, 'jetpack_send_log_entry_not_found' ),
			'a test'          => array( 'test', array( 'to' => array( 'jordan@example.net' ) ), 403, 'jetpack_send_not_resendable' ),
			'a bad address'   => array( 'ok', array( 'to' => array( 'jordan@' ) ), 400, 'jetpack_send_invalid_address' ),
			'no one'          => array( 'ok', array( 'to' => array() ), 400, 'rest_invalid_param' ),
			'a sign-in link'  => array( 'locked', array( 'to' => array( 'friend@example.org' ) ), 403, 'jetpack_send_resend_locked' ),
			'already sending' => array( 'in_flight', array( 'to' => array( 'jordan@example.net' ) ), 409, 'jetpack_send_resend_in_flight' ),
			'over the limit'  => array( 'limit', array( 'to' => array( 'jordan@example.net' ) ), 429, 'jetpack_send_resend_rate_limited' ),
		);
	}

	/**
	 * @dataProvider provide_refused_resends
	 *
	 * @param string $case   What's set up.
	 * @param array  $params Params.
	 * @param int    $status Expected HTTP status.
	 * @param string $code   Expected error code.
	 */
	#[DataProvider( 'provide_refused_resends' )]
	public function test_resend_refusals( $case, array $params, $status, $code ) {
		$this->login( 'administrator', 'me@example.com' );
		Account::save( self::account( array( 'dns_check' => self::passing_check() ) ) );
		Settings::update( array( 'enabled' => true ) );
		$overrides = array(
			'test'   => array( 'source' => 'test' ),
			'locked' => array( 'origin' => 'core:password_reset' ),
		);
		$db        = $this->fake_db()->on( 'SELECT * FROM `wp_jetpack_send_log`', 'missing' === $case ? array() : array( self::log_row( $overrides[ $case ] ?? array() ) ) );
		if ( 'in_flight' === $case ) {
			$db->locks['jetpack_send_lock_resend_12'] = true;
		}
		if ( 'limit' === $case ) {
			add_filter( 'jetpack_send_resend_limit', fn() => 1 );
			update_option( 'jetpack_send_resend_times', array( time() - 60 ), false );
		}
		$this->http = new Http_Mock( array() );

		$response = $this->request( 'POST', '/log/12/resend', $params );

		$this->assertSame( $status, $response->get_status() );
		$this->assertSame( $code, $response->get_data()['code'] );
		$this->assertSame( array(), $this->http->requests );
		if ( 'limit' === $case ) {
			$this->assertSame( 'You’ve resent 1 email in the last hour. Try again in 59 minutes.', $response->get_data()['message'] );
		}
	}

	public function test_resend_sends_a_copy_and_says_how_it_went() {
		$this->login( 'administrator', 'me@example.com' );
		Account::save( self::account( array( 'dns_check' => self::passing_check() ) ) );
		Settings::update( array( 'enabled' => true ) );
		$this->fake_db()->on( 'SELECT * FROM `wp_jetpack_send_log`', array( self::log_row() ) );
		$this->http = new Http_Mock( array( self::sent() ) );

		$data = $this->request( 'POST', '/log/12/resend', array( 'to' => array( 'me@example.com' ) ) )->get_data();

		$this->assertTrue( $data['success'] );
		$this->assertSame( 'sent', $data['status'] );
		$this->assertSame( '', $data['message'] );
		$this->assertMatchesRegularExpression( '/^\d+$/', $data['log_id'] );
		$this->assertSame( array(), $this->db->locks );
	}

	public function test_summary_counts_what_each_retention_would_delete() {
		$this->login( 'administrator' );
		$this->fake_db()->on(
			'AS total',
			array(
				array(
					'total'  => '1284',
					'oldest' => '2026-10-12 09:00:00',
					'd1'     => '1200',
					'd7'     => '3',
				),
			)
		);

		$data = $this->request( 'GET', '/log/summary' )->get_data();

		$this->assertSame( 1284, $data['total'] );
		$this->assertSame( array( '1', '7', '30', '90', '180', '365' ), array_map( 'strval', array_keys( $data['older_than'] ) ) );
		$this->assertSame( 3, $data['older_than']['7'] );
	}

	/**
	 * Retention changes, and whether older emails are deleted now.
	 *
	 * @return array[]
	 */
	public static function provide_retention_changes() {
		return array(
			'shorter'      => array( 30, 7, true ),
			'from forever' => array( 0, 365, true ),
			'longer'       => array( 7, 30, false ),
			'to forever'   => array( 30, 0, false ),
		);
	}

	/**
	 * @dataProvider provide_retention_changes
	 *
	 * @param int  $before Days kept before.
	 * @param int  $after  Days kept after.
	 * @param bool $prunes Whether it deletes older emails now.
	 */
	#[DataProvider( 'provide_retention_changes' )]
	public function test_a_shorter_retention_deletes_older_emails_now( $before, $after, $prunes ) {
		$this->login( 'administrator' );
		Settings::update( array( 'log_retention_days' => $before ) );
		$this->fake_db()->on( 'SELECT id FROM `wp_jetpack_send_log` WHERE created_at <', array( array( 'id' => '3' ) ) );

		$data = $this->request( 'POST', '/settings', array( 'log_retention_days' => $after ) )->get_data();

		$this->assertSame( $after, $data['log_retention_days'] );
		$this->assertSame( $prunes, isset( $data['pruned'] ) );
		if ( $prunes ) {
			$this->assertSame(
				array(
					'deleted'   => 1,
					'remaining' => 0,
				),
				$data['pruned']
			);
		}
	}

	/**
	 * Retention values the route refuses.
	 *
	 * @return array[]
	 */
	public static function provide_refused_retentions() {
		return array(
			'not a choice'          => array( 14, false, 'rest_invalid_param' ),
			'the site code sets it' => array( 30, true, 'jetpack_send_retention_locked' ),
		);
	}

	/**
	 * @dataProvider provide_refused_retentions
	 *
	 * @param int    $days   Days sent.
	 * @param bool   $locked Whether a filter sets the retention.
	 * @param string $code   Error code.
	 */
	#[DataProvider( 'provide_refused_retentions' )]
	public function test_retention_refusals( $days, $locked, $code ) {
		$this->login( 'administrator' );
		if ( $locked ) {
			add_filter( 'jetpack_send_log_retention_days', fn() => 14 );
		}

		$response = $this->request( 'POST', '/settings', array( 'log_retention_days' => $days ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( $code, $response->get_data()['code'] );
	}

	public function test_the_debug_log_turns_on_and_off_from_settings() {
		$this->login( 'administrator' );
		$this->fake_db();

		$on  = $this->request(
			'POST',
			'/settings',
			array(
				'debug_log'      => true,
				'debug_log_days' => 30,
			)
		)->get_data()['debug_log'];
		$off = $this->request( 'POST', '/settings', array( 'debug_log' => false ) )->get_data()['debug_log'];

		$this->assertTrue( $on['enabled'] );
		$this->assertSame( 30, $on['days'] );
		$this->assertEqualsWithDelta( time() + 30 * DAY_IN_SECONDS, strtotime( $on['until'] ), 5 );
		$this->assertFalse( $off['enabled'] );
		$this->assertNull( $off['until'] );
		$this->assertArrayNotHasKey( 'debug_log_until', $this->request( 'GET', '/status' )->get_data()['settings'] );
		// The switch sends its days with it; the entry names the one change.
		$this->assertStringContainsString( "'Changed the debug log.'", $this->db->matching( "'settings.changed'" )[0] );
	}

	/**
	 * The oldest email, the oldest counted hour, and whether older emails were deleted from the log.
	 *
	 * @return array[]
	 */
	public static function provide_trims() {
		return array(
			'a new site'                   => array( '2026-10-16 09:00:00', '2026-10-16 08:00:00', null ),
			'the oldest email was deleted' => array( '2026-10-16 09:00:00', '2026-10-12 08:00:00', '2026-10-16T09:00:00Z' ),
			'an empty log'                 => array( null, '2026-10-12 08:00:00', null ),
		);
	}

	/**
	 * @dataProvider provide_trims
	 *
	 * @param string|null $oldest  The oldest row, UTC.
	 * @param string      $counted The oldest counted hour, UTC.
	 * @param string|null $trimmed Expected `log_trimmed_before`.
	 */
	#[DataProvider( 'provide_trims' )]
	public function test_the_log_is_trimmed_only_when_the_counts_reach_an_earlier_day( $oldest, $counted, $trimmed ) {
		$this->fake_db()
			->on( 'MIN(created_at)', array( array( 'v' => $oldest ) ) )
			->on( 'MIN(bucket)', array( array( 'v' => (string) strtotime( $counted . ' UTC' ) ) ) );

		$status = REST_Controller::status_data();

		$this->assertSame( $trimmed, $status['log_trimmed_before'] );
		$this->assertSame( null === $oldest ? null : str_replace( ' ', 'T', $oldest ) . 'Z', $status['log_covers_from'] );
	}

	public function test_pages_built_before_these_changes_still_get_their_fields() {
		$this->login( 'administrator' );
		Account::save( self::account() );
		update_option( Email_Log::DB_VERSION_OPTION, '3' );
		$log = $this->request(
			'GET',
			'/log',
			array(
				'status' => 'failed',
				'source' => 'wp_mail',
				'days'   => 7,
			)
		);

		$stats = $this->request( 'GET', '/stats', array( 'range' => 7 ) );

		$this->assertSame( 200, $log->get_status() );
		$this->assertSame( array( 'items', 'total' ), array_slice( array_keys( $log->get_data() ), 0, 2 ) );
		$this->assertSame( 200, $stats->get_status() );
		$this->assertCount( 7, $stats->get_data()['days'] );
	}

	public function test_a_failed_test_says_why() {
		$this->login( 'administrator', 'me@example.com' );
		Account::save( self::account( array( 'dns_check' => self::passing_check() ) ) );
		$this->http = new Http_Mock( array( array( 503, array() ) ) );

		$data = $this->request( 'POST', '/test' )->get_data();

		$this->assertFalse( $data['success'] );
		$this->assertSame( 'service_down', $data['reason'] );
	}
}
