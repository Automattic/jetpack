<?php
/**
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/** @covers \Automattic\Jetpack\SEO\Indexnow_Client */
#[CoversClass( Indexnow_Client::class )]
class IndexnowClientTest extends SeoTestCase {
	protected function setUp(): void {
		parent::setUp();
		self::set_seo_tools_active( true );
		add_filter( 'rsm_jetpack_seo', '__return_true' );
		update_option( 'blog_public', 1 );
		update_option( 'home', 'https://example.com' );
		update_option( Indexnow_Client::ENABLED_OPTION, true );
		update_option( Indexnow_Client::SCOPE_OPTION, home_url( '/' ) );
	}

	protected function tearDown(): void {
		foreach ( array( Indexnow_Client::ENABLED_OPTION, Indexnow_Client::SCOPE_OPTION, Indexnow_Client::KEY_OPTION, 'home' ) as $option ) {
			delete_option( $option );
		}
		remove_filter( 'rsm_jetpack_seo', '__return_true' );
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( 'pre_http_request' );
		parent::tearDown();
	}

	public function test_scope_rejects_other_hosts_and_encoded_traversal() {
		update_option( 'home', 'https://example.com/blog' );
		$this->assertTrue( Indexnow_Client::in_scope( 'https://example.com/blog/guide/' ) );
		foreach ( array( 'https://other.example/blog/', 'https://example.com/blog2/', 'https://example.com/blog/%2e%2e/private/', 'https://example.com/blog/%252e%252e/private/', 'https://owner@example.com/blog/' ) as $url ) {
			$this->assertFalse( Indexnow_Client::in_scope( $url ), $url );
		}
	}

	public function test_off_and_private_states_never_send_requests() {
		$calls = 0;
		add_filter(
			'pre_http_request',
			static function () use ( &$calls ) {
				++$calls;
				return new \WP_Error( 'unexpected_network' );
			}
		);
		update_option( Indexnow_Client::ENABLED_OPTION, false );
		Indexnow_Client::submit( array( 'https://example.com/guide/' ) );
		update_option( Indexnow_Client::ENABLED_OPTION, true );
		update_option( 'blog_public', -1 );
		Indexnow_Client::submit( array( 'https://example.com/guide/' ) );
		$this->assertSame( 0, $calls );
	}

	public function test_an_existing_delivery_provider_can_pause_jetpack_without_overriding_consent() {
		add_filter( 'jetpack_seo_indexnow_can_notify', '__return_false' );
		try {
			$this->assertFalse( Indexnow_Client::enabled() );
		} finally {
			remove_filter( 'jetpack_seo_indexnow_can_notify', '__return_false' );
		}
		update_option( Indexnow_Client::ENABLED_OPTION, false );
		$this->assertFalse( Indexnow_Client::enabled() );
	}

	/**
	 * @dataProvider invalid_key_values
	 * @param mixed $stored Stored key value.
	 */
	#[DataProvider( 'invalid_key_values' )]
	public function test_invalid_stored_key_is_replaced_with_a_usable_persisted_key( $stored ) {
		update_option( Indexnow_Client::KEY_OPTION, $stored );
		$key = Indexnow_Client::key();
		$this->assertMatchesRegularExpression( '/^[a-f0-9]{32}$/', $key );
		$this->assertSame( $key, Indexnow_Client::key() );
	}

	public static function invalid_key_values() {
		return array(
			'malformed string' => array( 'broken' ),
			'boolean'          => array( true ),
			'array'            => array( array( 'broken' ) ),
		);
	}

	public function test_subdirectory_batch_includes_ownership_location_and_unique_urls() {
		update_option( 'home', 'https://example.com/blog' );
		update_option( Indexnow_Client::SCOPE_OPTION, home_url( '/' ) );
		$key   = Indexnow_Client::key();
		$urls  = array( 'https://example.com/blog/guide/', 'https://example.com/blog/?p=123' );
		$calls = 0;
		add_filter(
			'pre_http_request',
			function ( $pre, $args, $target ) use ( $key, $urls, &$calls ) {
				++$calls;
				$this->assertSame( Indexnow_Client::ENDPOINT, $target );
				$this->assertSame( 'POST', $args['method'] );
				$this->assertLessThanOrEqual( 5, $args['timeout'] );
				$this->assertSame( 0, $args['redirection'] );
				$this->assertSame(
					array(
						'host'        => 'example.com',
						'key'         => $key,
						'keyLocation' => 'https://example.com/blog/' . $key . '.txt',
						'urlList'     => $urls,
					),
					json_decode( $args['body'], true )
				);
				return array(
					'headers'  => array(),
					'body'     => '',
					'response' => array( 'code' => 200 ),
				);
			},
			10,
			3
		);
		$result = Indexnow_Client::submit( array_merge( $urls, $urls ) );
		$this->assertSame( 'accepted', $result['state'] );
		$this->assertSame( 1, $calls );
	}

	public function test_invalid_batches_are_rejected_without_a_network_request() {
		$calls = 0;
		add_filter(
			'pre_http_request',
			static function () use ( &$calls ) {
				++$calls;
				return new \WP_Error( 'unexpected_network' );
			}
		);
		foreach ( array( array(), 'https://example.com/guide/', array_fill( 0, Indexnow_Client::BATCH_SIZE + 1, 'https://example.com/guide/' ), array( 'https://other.example/guide/' ), array( 'https://example.com/guide/#private' ) ) as $urls ) {
			$this->assertFalse( Indexnow_Client::submit( $urls )['retry'] );
		}
		$this->assertSame( 0, $calls );
	}

	public function test_rate_limit_response_preserves_a_bounded_retry_delay() {
		add_filter(
			'pre_http_request',
			static function () {
				return array(
					'headers'  => array( 'retry-after' => '3600' ),
					'body'     => '',
					'response' => array(
						'code'    => 429,
						'message' => 'Too Many Requests',
					),
				);
			}
		);
		$result = Indexnow_Client::submit( array( 'https://example.com/public/' ) );
		$this->assertTrue( $result['retry'] );
		$this->assertSame( 3600, $result['retry_after'] );
	}

	public static function response_cases() {
		return array(
			array( 200, 'accepted', false ),
			array( 202, 'verification_pending', true ),
			array( 400, 'http_400', false ),
			array( 403, 'http_403', false ),
			array( 422, 'http_422', false ),
			array( 429, 'http_429', true ),
			array( 503, 'http_503', true ),
			array( null, 'transport_failure', true ),
		);
	}

	/**
	 * @dataProvider response_cases
	 * @param int|null $code HTTP response code, or null for a transport failure.
	 * @param string   $state Expected delivery state.
	 * @param bool     $retry Whether to retry.
	 */
	#[DataProvider( 'response_cases' )]
	public function test_client_distinguishes_acceptance_verification_and_failures( $code, $state, $retry ) {
		add_filter(
			'pre_http_request',
			static function () use ( $code ) {
				if ( null === $code ) {
					return new \WP_Error( 'http_request_failed', 'Controlled request timeout.' );
				}
				return array(
					'headers'  => array(),
					'body'     => '',
					'response' => array(
						'code'    => $code,
						'message' => '',
					),
				);
			}
		);
		$result = Indexnow_Client::submit( array( 'https://example.com/guide/' ) );
		$this->assertSame( $state, $result['state'] );
		$this->assertSame( $retry, $result['retry'] );
	}
}
