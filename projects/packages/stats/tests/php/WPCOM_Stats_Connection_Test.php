<?php
/**
 * Tests connection failures in the Stats traffic API client.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WP_Error;

/**
 * @covers Automattic\Jetpack\Stats\WPCOM_Stats
 */
#[CoversClass( WPCOM_Stats::class )]
class WPCOM_Stats_Connection_Test extends StatsBaseTestCase {
	/**
	 * Traffic requests expose rejected credentials as connection errors.
	 *
	 * @dataProvider rejected_token_provider
	 * @param string $error_code Remote authentication error.
	 */
	#[DataProvider( 'rejected_token_provider' )]
	public function test_visits_with_rejected_blog_token( $error_code ) {
		\Automattic\Jetpack\Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		$reject = static function () use ( $error_code ) {
			return array(
				'response' => array( 'code' => 400 ),
				'body'     => wp_json_encode( array( 'error' => $error_code ), JSON_UNESCAPED_SLASHES ),
			);
		};
		add_filter( 'pre_http_request', $reject );
		try {
			$response = ( new WPCOM_Stats() )->get_visits();
			$this->assertInstanceOf( WP_Error::class, $response );
			$this->assertSame( 'site_not_connected', $response->get_error_code() );
			$this->assertSame( array( 'status' => 400 ), $response->get_error_data() );
		} finally {
			remove_filter( 'pre_http_request', $reject );
		}
	}

	/**
	 * Remote rejections observed for invalid token keys and secrets.
	 *
	 * @return array
	 */
	public static function rejected_token_provider() {
		return array(
			'invalid token'    => array( 'invalid_token' ),
			'unknown key'      => array( 'unknown_token' ),
			'incorrect secret' => array( 'signature_mismatch' ),
		);
	}

	/**
	 * Restoring a connection must retry the same request instead of replaying a cached error.
	 *
	 * @dataProvider rejected_token_provider
	 * @param string $error_code Remote authentication error.
	 */
	#[DataProvider( 'rejected_token_provider' )]
	public function test_visits_retries_after_connection_recovery( $error_code ) {
		\Automattic\Jetpack\Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		$calls   = 0;
		$data    = array(
			'fields' => array( 'period', 'views' ),
			'data'   => array( array( '2026-09-07', 3 ) ),
		);
		$respond = static function () use ( &$calls, $error_code, $data ) {
			++$calls;
			return array(
				'response' => array( 'code' => 1 === $calls ? 400 : 200 ),
				'body'     => wp_json_encode( 1 === $calls ? array( 'error' => $error_code ) : $data, JSON_UNESCAPED_SLASHES ),
			);
		};
		add_filter( 'pre_http_request', $respond );
		try {
			$client = new WPCOM_Stats();
			$this->assertInstanceOf( WP_Error::class, $client->get_visits() );
			$this->assertSame( $data, $client->get_visits() );
			$this->assertSame( 2, $calls );
		} finally {
			remove_filter( 'pre_http_request', $respond );
		}
	}

	/**
	 * A malformed token fails before HTTP and still identifies the connection problem.
	 */
	public function test_visits_with_malformed_blog_token() {
		\Jetpack_Options::update_option( 'blog_token', 'invalid-token-without-secret' );
		( new \Automattic\Jetpack\Connection\Manager() )->reset_connection_status();
		$response = ( new WPCOM_Stats() )->get_visits();
		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'site_not_connected', $response->get_error_code() );
		$this->assertSame( array( 'status' => 400 ), $response->get_error_data() );
	}

	/**
	 * An unrelated transport failure retains its original error details.
	 */
	public function test_visits_preserves_transport_error() {
		\Automattic\Jetpack\Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		$error = new WP_Error( 'http_request_failed', 'Connection timed out.' );
		$fail  = static function () use ( $error ) {
			return $error;
		};
		add_filter( 'pre_http_request', $fail );
		try {
			$this->assertSame( $error, ( new WPCOM_Stats() )->get_visits() );
		} finally {
			remove_filter( 'pre_http_request', $fail );
		}
	}

	/**
	 * A healthy response still provides traffic data.
	 */
	public function test_visits_preserves_successful_response() {
		\Automattic\Jetpack\Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		$data    = array(
			'fields' => array( 'period', 'views' ),
			'data'   => array( array( '2026-09-07', 3 ) ),
		);
		$succeed = static function () use ( $data ) {
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( $data, JSON_UNESCAPED_SLASHES ),
			);
		};
		add_filter( 'pre_http_request', $succeed );
		try {
			$this->assertSame( $data, ( new WPCOM_Stats() )->get_visits() );
		} finally {
			remove_filter( 'pre_http_request', $succeed );
		}
	}

	/**
	 * Each reader asks the WordPress.com route that serves it.
	 *
	 * @return array
	 */
	public static function provide_routes(): array {
		return array(
			'device views'      => array( 'get_device_views', array( 'browser', array( 'days' => 7 ) ), 'https://public-api.wordpress.com/rest/v1.1/sites/1234/stats/devices/browser?days=7' ),
			'utm views'         => array( 'get_utm_views', array( 'utm_source,utm_medium' ), 'https://public-api.wordpress.com/rest/v1.1/sites/1234/stats/utm/utm_source,utm_medium' ),
			'author views'      => array( 'get_author_views', array( 7, array( 'num' => 2 ) ), 'https://public-api.wordpress.com/rest/v1.1/sites/1234/stats/author/7?num=2' ),
			'subscriber counts' => array( 'get_subscriber_counts', array(), 'https://public-api.wordpress.com/wpcom/v2/sites/1234/subscribers/counts' ),
			'subscribers'       => array( 'get_subscribers', array( array( 'page' => 2 ) ), 'https://public-api.wordpress.com/wpcom/v2/sites/1234/subscribers?page=2' ),
			'ad earnings'       => array( 'get_wordads_earnings', array(), 'https://public-api.wordpress.com/rest/v1.1/sites/1234/wordads/earnings' ),
			'email summary'     => array( 'get_email_summary', array( array( 'quantity' => 5 ) ), 'https://public-api.wordpress.com/rest/v1.1/sites/1234/stats/emails/summary?quantity=5' ),
			'subscriber series' => array( 'get_subscriber_history', array( array( 'unit' => 'month' ) ), 'https://public-api.wordpress.com/rest/v1.1/sites/1234/stats/subscribers?unit=month' ),
			'stats usage'       => array( 'get_stats_usage', array(), 'https://public-api.wordpress.com/wpcom/v2/sites/1234/jetpack-stats/usage' ),
			'ad stats'          => array( 'get_wordads_stats', array( array( 'unit' => 'day' ) ), 'https://public-api.wordpress.com/rest/v1.1/sites/1234/wordads/stats?unit=day' ),
		);
	}

	/**
	 * @dataProvider provide_routes
	 *
	 * @param string $method WPCOM_Stats method.
	 * @param array  $args   Its arguments.
	 * @param string $url    The URL it must request.
	 */
	#[DataProvider( 'provide_routes' )]
	public function test_readers_request_their_route( string $method, array $args, string $url ) {
		\Automattic\Jetpack\Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		$requested = '';
		$respond   = static function ( $pre, $r, $request_url ) use ( &$requested ) {
			$requested = $request_url;
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => '{"ok":true}',
			);
		};
		add_filter( 'pre_http_request', $respond, 10, 3 );
		try {
			( new WPCOM_Stats() )->$method( ...$args );
			// The connection appends its signature after the query.
			$this->assertSame( $url, preg_replace( '/[?&]token=.*$/', '', $requested ) );
		} finally {
			remove_filter( 'pre_http_request', $respond );
		}
	}

	/**
	 * A refusal keeps WordPress.com's reason and status, e.g. that the plan lacks a report.
	 */
	public function test_refusal_keeps_the_wpcom_message() {
		\Automattic\Jetpack\Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		$refuse = static function () {
			return array(
				'response' => array( 'code' => 403 ),
				'body'     => '{"error":"unauthorized","message":"This report needs a paid plan."}',
			);
		};
		add_filter( 'pre_http_request', $refuse );
		try {
			$response = ( new WPCOM_Stats() )->get_device_views( 'browser' );
			$this->assertSame( 'This report needs a paid plan.', $response->get_error_message() );
			$this->assertSame( array( 'status' => 403 ), $response->get_error_data() );
		} finally {
			remove_filter( 'pre_http_request', $refuse );
		}
	}
}
