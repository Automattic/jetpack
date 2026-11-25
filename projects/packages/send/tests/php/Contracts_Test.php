<?php
/**
 * Tests for the shared hooks, routes and fields the onboarding builds on.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Send\Dns_Lookup
 * @covers \Automattic\Jetpack\Send\Account
 * @covers \Automattic\Jetpack\Send\REST_Controller
 */
#[CoversClass( Dns_Lookup::class )]
#[CoversClass( Account::class )]
#[CoversClass( REST_Controller::class )]
class Contracts_Test extends BaseTestCase {

	/**
	 * Reset globals and filters.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_all_actions( 'rest_api_init' );
		remove_all_filters( 'jetpack_send_pre_dns_lookup' );
		remove_all_filters( 'jetpack_send_suggested_domain' );
		parent::tear_down();
	}

	/**
	 * The filter sees a normalized name and the type, and its answer is returned as is.
	 *
	 * @dataProvider provide_lookup_answers
	 * @param array|false $answer What the filter returns.
	 */
	#[DataProvider( 'provide_lookup_answers' )]
	public function test_resolve_uses_the_pre_lookup_filter( $answer ) {
		$seen = array();
		add_filter(
			'jetpack_send_pre_dns_lookup',
			static function ( $pre, $name, $type ) use ( &$seen, $answer ) {
				$seen = array( $pre, $name, $type );
				return $answer;
			},
			10,
			3
		);

		$this->assertSame( $answer, Dns_Lookup::resolve( '_MailChannels.Example.com.', DNS_TXT ) );
		$this->assertSame( array( null, '_mailchannels.example.com', DNS_TXT ), $seen );
	}

	/**
	 * Filter answers.
	 *
	 * @return array
	 */
	public static function provide_lookup_answers() {
		return array(
			'records'    => array(
				array(
					array(
						'host' => '_mailchannels.example.com',
						'type' => 'TXT',
						'txt'  => 'v=mc1 auth=abc',
					),
				),
			),
			'no records' => array( array() ),
			'failed'     => array( false ),
		);
	}

	/**
	 * Record hosts are relative to the detected zone, falling back to the sending domain.
	 *
	 * @dataProvider provide_hosts
	 * @param string      $name     Full record name.
	 * @param string|null $apex     Detected zone root, or null before detection.
	 * @param string      $expected Short host.
	 */
	#[DataProvider( 'provide_hosts' )]
	public function test_public_records_carry_a_relative_host( $name, $apex, $expected ) {
		$account = array(
			'api_key'     => 'secret',
			'domain'      => 'mail.example.com',
			'dns_records' => array(
				array(
					'type'  => 'TXT',
					'name'  => $name,
					'value' => 'v',
				),
			),
		);
		if ( null !== $apex ) {
			$account['dns_host'] = array( 'apex' => $apex );
		}

		$public = Account::to_public( $account );
		$this->assertSame( $expected, ( $public['dns_records'] ?? array() )[0]['host'] ?? null );
		$this->assertArrayNotHasKey( 'api_key', $public );
	}

	/**
	 * Hosts.
	 *
	 * @return array
	 */
	public static function provide_hosts() {
		return array(
			'relative to the domain' => array( '_mailchannels.mail.example.com', null, '_mailchannels' ),
			'relative to the apex'   => array( '_mailchannels.mail.example.com', 'example.com', '_mailchannels.mail' ),
			'zone root'              => array( 'example.com', 'example.com', '@' ),
			'outside the zone'       => array( 'example.net', 'example.com', 'example.net' ),
		);
	}

	/**
	 * Hosts whose site address isn't their mail domain can override the suggestion.
	 */
	public function test_suggested_domain_is_filterable() {
		add_filter(
			'jetpack_send_suggested_domain',
			static function () {
				return ' Example.com ';
			}
		);

		$this->assertSame( 'example.com', REST_Controller::status_data()['suggested_domain'] );
	}

	/**
	 * The new routes exist at the paths the dashboard calls.
	 */
	public function test_new_routes_are_registered() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( Dns_REST_Controller::class, 'register_routes' ) );
		add_action( 'rest_api_init', array( Cloudflare_REST_Controller::class, 'register_routes' ) );
		add_action( 'rest_api_init', array( REST_Controller::class, 'register_routes' ) );
		add_action( 'rest_api_init', array( Debug_REST_Controller::class, 'register_routes' ) );
		do_action( 'rest_api_init', $wp_rest_server );

		$routes = $wp_rest_server->get_routes();
		$paths  = array( '/dns-host', '/dns-lookup', '/cloudflare/apply', '/log/origins', '/log/summary', '/log/(?P<id>\\d+)/resend', '/debug-log', '/debug-log/(?P<id>\\d+)', '/debug-log/text', '/debug-log/clear' );
		foreach ( array_map( fn( $path ) => '/jetpack-send/v1' . $path, $paths ) as $route ) {
			$this->assertArrayHasKey( $route, $routes );
		}
	}
}
