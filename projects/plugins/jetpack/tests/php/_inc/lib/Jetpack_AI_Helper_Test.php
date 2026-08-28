<?php
/**
 * Jetpack AI Helper unit tests.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';

/**
 * Class for testing Jetpack_AI_Helper.
 *
 * @covers \Jetpack_AI_Helper
 */
#[CoversClass( Jetpack_AI_Helper::class )]
class Jetpack_AI_Helper_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const BLOG_ID = 1234;

	/**
	 * Number of mocked WordPress.com requests.
	 *
	 * @var int
	 */
	private $request_count = 0;

	/**
	 * Current HTTP mock callback.
	 *
	 * @var callable|null
	 */
	private $pre_http_request_filter;

	/**
	 * Set up a connected Jetpack site.
	 */
	public function set_up() {
		parent::set_up();

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		Jetpack_Options::update_option( 'id', self::BLOG_ID );
		Jetpack_Options::update_option( 'blog_token', 'blog.secret' );
		Jetpack_Options::update_option( 'master_user', $user_id );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
		( new Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();

		delete_transient( $this->get_transient_name() );
		delete_transient( $this->get_refresh_transient_name() );
		$this->reset_failed_request();
	}

	/**
	 * Clean up the mocked connection and cache.
	 */
	public function tear_down() {
		delete_transient( $this->get_transient_name() );
		delete_transient( $this->get_refresh_transient_name() );
		$this->remove_wpcom_response_mock();
		Jetpack_Options::delete_option( array( 'id', 'blog_token', 'master_user', 'user_tokens' ) );
		( new Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		wp_set_current_user( 0 );
		$this->reset_failed_request();

		parent::tear_down();
	}

	/**
	 * Normal reads use the cached feature response.
	 */
	public function test_get_ai_assistance_feature_uses_cache_by_default() {
		$cached = array( 'requests-count' => 3 );
		set_transient( $this->get_transient_name(), $cached, MINUTE_IN_SECONDS );
		$this->mock_wpcom_response( array( 'requests-count' => 4 ) );

		$this->assertSame( $cached, Jetpack_AI_Helper::get_ai_assistance_feature() );
		$this->assertSame( 0, $this->request_count );
	}

	/**
	 * Normal reads also accept the versioned cost-credit contract from cache.
	 */
	public function test_get_ai_assistance_feature_uses_cost_credit_cache_by_default() {
		$cached = $this->get_credit_allowance_response();
		set_transient( $this->get_transient_name(), $cached, MINUTE_IN_SECONDS );
		$this->mock_wpcom_response(
			$this->get_credit_allowance_response(
				array(
					'credits-used'      => 300,
					'credits-remaining' => 700,
				)
			)
		);

		$this->assertSame( $cached, Jetpack_AI_Helper::get_ai_assistance_feature() );
		$this->assertSame( 0, $this->request_count );
	}

	/**
	 * Malformed cached data is ignored in favor of a fresh usable response.
	 */
	public function test_get_ai_assistance_feature_ignores_malformed_cache() {
		$fresh = $this->get_credit_allowance_response();
		set_transient( $this->get_transient_name(), array( 'has-feature' => true ), MINUTE_IN_SECONDS );
		$this->mock_wpcom_response( $fresh );

		$this->assertSame( $fresh, Jetpack_AI_Helper::get_ai_assistance_feature() );
		$this->assertSame( $fresh, get_transient( $this->get_transient_name() ) );
		$this->assertSame( 1, $this->request_count );
	}

	/**
	 * Forced reads fetch fresh feature data and replace the cache.
	 */
	public function test_get_ai_assistance_feature_skip_cache_replaces_cache() {
		$cached = array( 'requests-count' => 3 );
		$fresh  = array( 'requests-count' => 4 );
		set_transient( $this->get_transient_name(), $cached, MINUTE_IN_SECONDS );
		$this->mock_wpcom_response( $fresh );

		$this->assertSame( $fresh, Jetpack_AI_Helper::get_ai_assistance_feature( true ) );
		$this->assertSame( $fresh, get_transient( $this->get_transient_name() ) );
		$this->assertSame( 1, $this->request_count );
	}

	/**
	 * Forced reads replace cached cost-credit data with a fresh paid snapshot.
	 */
	public function test_get_ai_assistance_feature_skip_cache_replaces_cost_credit_cache() {
		$cached = $this->get_credit_allowance_response();
		$fresh  = $this->get_credit_allowance_response(
			array(
				'plan-kind'         => 'paid',
				'credit-limit'      => 10000,
				'credits-used'      => 350,
				'credits-remaining' => 9650,
			)
		);
		set_transient( $this->get_transient_name(), $cached, MINUTE_IN_SECONDS );
		$this->mock_wpcom_response( $fresh );

		$this->assertSame( $fresh, Jetpack_AI_Helper::get_ai_assistance_feature( true ) );
		$this->assertSame( $fresh, get_transient( $this->get_transient_name() ) );
		$this->assertSame( 1, $this->request_count );
	}

	/**
	 * A failed forced refresh leaves a usable cached response intact.
	 */
	public function test_get_ai_assistance_feature_skip_cache_preserves_cache_on_failure() {
		$cached = array( 'requests-count' => 3 );
		set_transient( $this->get_transient_name(), $cached, MINUTE_IN_SECONDS );
		$this->mock_wpcom_response( array(), 500 );

		$this->assertSame( $cached, Jetpack_AI_Helper::get_ai_assistance_feature( true ) );
		$this->assertSame( $cached, get_transient( $this->get_transient_name() ) );
		$this->assertSame( 1, $this->request_count );

		delete_transient( $this->get_transient_name() );
		$this->assertWPError( Jetpack_AI_Helper::get_ai_assistance_feature() );
		$this->assertSame( 2, $this->request_count );
	}

	/**
	 * A malformed successful response does not replace usable cached data.
	 */
	public function test_get_ai_assistance_feature_skip_cache_preserves_cache_on_malformed_response() {
		$cached = array( 'requests-count' => 3 );
		set_transient( $this->get_transient_name(), $cached, MINUTE_IN_SECONDS );
		$this->mock_wpcom_response( array( 'has-feature' => true ) );

		$this->assertSame( $cached, Jetpack_AI_Helper::get_ai_assistance_feature( true ) );
		$this->assertSame( $cached, get_transient( $this->get_transient_name() ) );
		$this->assertSame( 1, $this->request_count );
	}

	/**
	 * A malformed successful response is never cached when no usable cache exists.
	 */
	public function test_get_ai_assistance_feature_rejects_malformed_response_without_cache() {
		$this->mock_wpcom_response( array( 'has-feature' => true ) );

		$result = Jetpack_AI_Helper::get_ai_assistance_feature( true );

		$this->assertWPError( $result );
		$this->assertSame( 'invalid_ai_assistance_feature_response', $result->get_error_code() );
		$this->assertWPError( get_transient( $this->get_transient_name() ) );
		$this->assertSame( 1, $this->request_count );
	}

	/**
	 * An incomplete cost-credit object is not treated as usable status.
	 */
	public function test_get_ai_assistance_feature_rejects_incomplete_cost_credit_response() {
		$response = $this->get_credit_allowance_response();
		unset( $response['ai-credit-allowance']['resets-at'] );
		$this->mock_wpcom_response( $response );

		$result = Jetpack_AI_Helper::get_ai_assistance_feature();

		$this->assertWPError( $result );
		$this->assertSame( 'invalid_ai_assistance_feature_response', $result->get_error_code() );
		$this->assertSame( 1, $this->request_count );
	}

	/**
	 * Shadow-only credit data cannot become the active usage contract.
	 */
	public function test_get_ai_assistance_feature_rejects_non_authoritative_cost_credit_response() {
		$response = $this->get_credit_allowance_response();
		$response['ai-credit-allowance']['authoritative'] = false;
		$this->mock_wpcom_response( $response );

		$result = Jetpack_AI_Helper::get_ai_assistance_feature();

		$this->assertWPError( $result );
		$this->assertSame( 'invalid_ai_assistance_feature_response', $result->get_error_code() );
		$this->assertSame( 1, $this->request_count );
	}

	/**
	 * A malformed additive allowance is removed from a valid legacy response.
	 */
	public function test_get_ai_assistance_feature_strips_malformed_allowance_from_legacy_response() {
		$response                   = $this->get_credit_allowance_response();
		$response['requests-count'] = 3;
		unset( $response['ai-credit-allowance']['resets-at'] );
		$this->mock_wpcom_response( $response );

		$expected = array( 'requests-count' => 3 );
		$this->assertSame( $expected, Jetpack_AI_Helper::get_ai_assistance_feature() );
		$this->assertSame( $expected, get_transient( $this->get_transient_name() ) );
		$this->assertSame( 1, $this->request_count );
	}

	/**
	 * A forced refresh within the cooldown returns the usable site cache.
	 */
	public function test_get_ai_assistance_feature_skip_cache_respects_refresh_cooldown() {
		$cached = $this->get_credit_allowance_response();
		set_transient( $this->get_transient_name(), $cached, MINUTE_IN_SECONDS );
		set_transient( $this->get_refresh_transient_name(), true, MINUTE_IN_SECONDS );
		$this->mock_wpcom_response(
			$this->get_credit_allowance_response(
				array(
					'credits-used'      => 300,
					'credits-remaining' => 700,
				)
			)
		);

		$this->assertSame( $cached, Jetpack_AI_Helper::get_ai_assistance_feature( true ) );
		$this->assertSame( 0, $this->request_count );
	}

	/**
	 * A forced refresh without usable cache fails closed during the cooldown.
	 */
	public function test_get_ai_assistance_feature_skip_cache_without_cache_respects_refresh_cooldown() {
		set_transient( $this->get_refresh_transient_name(), true, MINUTE_IN_SECONDS );
		$this->mock_wpcom_response( $this->get_credit_allowance_response() );

		$result = Jetpack_AI_Helper::get_ai_assistance_feature( true );

		$this->assertWPError( $result );
		$this->assertSame( 'ai_assistance_feature_refresh_rate_limited', $result->get_error_code() );
		$this->assertSame( 0, $this->request_count );
	}

	/**
	 * Forced reads bypass a failure remembered earlier in the request.
	 */
	public function test_get_ai_assistance_feature_skip_cache_bypasses_failure_latch() {
		$this->mock_wpcom_response( array(), 500 );

		$failed = Jetpack_AI_Helper::get_ai_assistance_feature();
		$this->assertWPError( $failed );
		delete_transient( $this->get_transient_name() );

		$this->remove_wpcom_response_mock();
		$fresh = array( 'requests-count' => 4 );
		$this->mock_wpcom_response( $fresh );

		$this->assertSame( $failed, Jetpack_AI_Helper::get_ai_assistance_feature() );
		$this->assertSame( 1, $this->request_count );
		$this->assertSame( $fresh, Jetpack_AI_Helper::get_ai_assistance_feature( true ) );
		$this->assertSame( 2, $this->request_count );
	}

	/**
	 * Get the feature cache transient name.
	 *
	 * @return string
	 */
	private function get_transient_name() {
		return Jetpack_AI_Helper::transient_name_for_ai_assistance_feature( self::BLOG_ID );
	}

	/**
	 * Get the feature refresh cooldown transient name.
	 *
	 * @return string
	 */
	private function get_refresh_transient_name() {
		return Jetpack_AI_Helper::transient_name_for_ai_assistance_feature_refresh( self::BLOG_ID );
	}

	/**
	 * Build a valid versioned cost-credit response.
	 *
	 * @param array $overrides Allowance fields to override.
	 * @return array
	 */
	private function get_credit_allowance_response( $overrides = array() ) {
		return array(
			'ai-credit-allowance' => array_merge(
				array(
					'schema-version'    => 1,
					'metering-model'    => 'provider-cost-v1',
					'policy'            => 'jetpack-ai-self-hosted-monthly-v1',
					'plan-kind'         => 'free',
					'authoritative'     => true,
					'credit-limit'      => 1000,
					'credits-used'      => 250,
					'credits-remaining' => 750,
					'period-start'      => '2026-08-01T00:00:00+00:00',
					'resets-at'         => '2026-09-01T00:00:00+00:00',
					'rollover'          => false,
					'is-exhausted'      => false,
				),
				$overrides
			),
		);
	}

	/**
	 * Mock a response from the WordPress.com feature endpoint.
	 *
	 * @param mixed $body        Response body.
	 * @param int   $status_code HTTP status code.
	 */
	private function mock_wpcom_response( $body, $status_code = 200 ) {
		$this->pre_http_request_filter = function ( $preempt, $parsed_args, $url ) use ( $body, $status_code ) {
			$is_feature_request = false !== strpos( $url, '/sites/' . self::BLOG_ID . '/jetpack-ai/ai-assistant-feature' );
			if ( 'GET' !== $parsed_args['method'] || ! $is_feature_request ) {
				return $preempt;
			}

			++$this->request_count;

			return array(
				'headers'  => array( 'content-type' => 'application/json' ),
				'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
				'response' => array(
					'code'    => $status_code,
					'message' => 200 === $status_code ? 'OK' : 'Server Error',
				),
				'cookies'  => array(),
			);
		};

		add_filter(
			'pre_http_request',
			$this->pre_http_request_filter,
			10,
			3
		);
	}

	/**
	 * Remove the current WordPress.com response mock.
	 */
	private function remove_wpcom_response_mock() {
		if ( $this->pre_http_request_filter ) {
			remove_filter( 'pre_http_request', $this->pre_http_request_filter, 10 );
			$this->pre_http_request_filter = null;
		}
	}

	/**
	 * Reset the per-request failure latch.
	 */
	private function reset_failed_request() {
		$reflection = new ReflectionClass( Jetpack_AI_Helper::class );
		$property   = $reflection->getProperty( 'ai_assistant_failed_request' );
		// @todo Remove once we drop PHP < 8.1 support. `setAccessible()` is
		// deprecated in 8.5 (a no-op since 8.1), so only call it where it's needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}
}
