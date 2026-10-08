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
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Log in as a new user with a role.
	 *
	 * @param string $role Role.
	 */
	private function login( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $role . '_user',
				'user_pass'  => 'pass',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
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
			'status'    => array( 'GET', '/status', array() ),
			'setup'     => array( 'POST', '/setup', array( 'domain' => 'example.com' ) ),
			'check-dns' => array( 'POST', '/check-dns', array() ),
			'settings'  => array( 'POST', '/settings', array() ),
			'test'      => array( 'POST', '/test', array( 'to' => 'someone@example.com' ) ),
			'usage'     => array( 'GET', '/usage', array() ),
			'log'       => array( 'GET', '/log', array() ),
			'log entry' => array( 'GET', '/log/1', array() ),
			'reset'     => array( 'POST', '/reset', array() ),
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

		$response = $this->request( 'POST', '/setup', array( 'domain' => 'other.com' ) );

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
}
