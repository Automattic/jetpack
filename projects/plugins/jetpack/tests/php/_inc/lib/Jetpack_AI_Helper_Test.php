<?php
/**
 * Jetpack_AI_Helper::is_ai_chat_enabled() tests.
 *
 * Locks down the paid-plan gate for SEARCH-351: AI Chat requires a paid
 * Search plan, not just search support in general.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Search\Plan;
use Automattic\Jetpack\Search\Search_Blocks;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';

/**
 * Class for testing Jetpack_AI_Helper::is_ai_chat_enabled().
 *
 * @covers \Jetpack_AI_Helper
 */
#[CoversClass( Jetpack_AI_Helper::class )]
class Jetpack_AI_Helper_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		// @phan-suppress-next-line PhanAccessMethodInternal -- Phan is correct, but the usage is intentional: a monorepo-sibling test resetting the memo between cases.
		Search_Blocks::reset_supports_paid_search_cache();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		delete_transient( 'jetpack_ai_chat_plan_lookup_failed' );
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		( new Manager( 'jetpack' ) )->reset_connection_status();
		remove_filter( 'jetpack_ai_chat_enabled', '__return_false' );
		remove_filter( 'jetpack_ai_chat_enabled', '__return_true' );
		remove_filter( 'pre_http_request', array( $this, 'fail_on_http_request' ) );
		remove_filter( 'pre_http_request', array( $this, 'mock_plan_response' ) );
		remove_filter( 'pre_http_request', array( $this, 'mock_failed_plan_response' ) );
		// @phan-suppress-next-line PhanAccessMethodInternal -- Phan is correct, but the usage is intentional: a monorepo-sibling test resetting the memo between cases.
		Search_Blocks::reset_supports_paid_search_cache();

		parent::tear_down();
	}

	/**
	 * pre_http_request callback that fails the test if a live request is
	 * attempted; used to assert a code path never reaches the network.
	 */
	public function fail_on_http_request() {
		$this->fail( 'A failed plan lookup should not be repeated during its backoff period.' );
	}

	/**
	 * Return paid Search plan data for a cold lookup.
	 *
	 * @param false  $preempt Preemptive response.
	 * @param array  $args Request arguments.
	 * @param string $url Request URL.
	 * @return array|false
	 */
	public function mock_plan_response( $preempt, $args, $url ) {
		if ( strpos( $url, 'jetpack-search/plan' ) === false ) {
			return $preempt;
		}
		return array(
			'body'     => wp_json_encode( array( 'supports_instant_search' => true, 'effective_subscription' => array( 'product_slug' => 'jetpack_search' ) ) ),
			'response' => array( 'code' => 200 ),
		);
	}

	/**
	 * Simulate a failed plan request without leaving the test process.
	 *
	 * @param false  $preempt Preemptive response.
	 * @param array  $args Request arguments.
	 * @param string $url Request URL.
	 * @return WP_Error|false
	 */
	public function mock_failed_plan_response( $preempt, $args, $url ) {
		return strpos( $url, 'jetpack-search/plan' ) !== false ? new WP_Error( 'request_failed' ) : $preempt;
	}

	/**
	 * Simulate a blog-level connection so Manager::is_connected() reads true.
	 */
	private function simulate_connection() {
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'asd.qwe' );
		( new Manager( 'jetpack' ) )->reset_connection_status();
	}

	/**
	 * Seed a paid-plan option: `supports_instant_search: true` and a
	 * non-free product_slug.
	 */
	private function set_paid_search_plan() {
		update_option(
			Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'effective_subscription'  => array( 'product_slug' => 'jetpack_search' ),
			)
		);
	}

	/**
	 * Seed a free-plan option. WPCOM reports `supports_instant_search: true`
	 * on the free plan too, so the gate must also check the product_slug.
	 */
	private function set_free_search_plan() {
		update_option(
			Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'effective_subscription'  => array( 'product_slug' => Plan::JETPACK_SEARCH_FREE_PRODUCT_SLUG ),
			)
		);
	}

	/**
	 * Connected + paid Search plan: chat is enabled.
	 */
	public function test_enabled_when_connected_and_paid_plan() {
		$this->simulate_connection();
		$this->set_paid_search_plan();

		$this->assertTrue( Jetpack_AI_Helper::is_ai_chat_enabled() );
	}

	/**
	 * Connected, but on a free Search plan: chat stays disabled.
	 */
	public function test_disabled_when_connected_but_free_plan() {
		$this->simulate_connection();
		$this->set_free_search_plan();

		$this->assertFalse( Jetpack_AI_Helper::is_ai_chat_enabled() );
	}

	/**
	 * A paid Search plan alone isn't enough without a connection.
	 */
	public function test_disabled_when_paid_plan_but_disconnected() {
		$this->set_paid_search_plan();

		$this->assertFalse( Jetpack_AI_Helper::is_ai_chat_enabled() );
	}

	/**
	 * A missing plan is fetched so a paid site can recover immediately.
	 */
	public function test_enabled_after_fetching_uncached_paid_plan() {
		$this->simulate_connection();
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		add_filter( 'pre_http_request', array( $this, 'mock_plan_response' ), 10, 3 );

		$this->assertTrue( Jetpack_AI_Helper::is_ai_chat_enabled() );
	}

	/**
	 * A failed plan lookup is throttled on later requests.
	 */
	public function test_missing_plan_lookup_is_throttled() {
		$this->simulate_connection();
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		set_transient( 'jetpack_ai_chat_plan_lookup_failed', true, MINUTE_IN_SECONDS );
		add_filter( 'pre_http_request', array( $this, 'fail_on_http_request' ) );

		$this->assertFalse( Jetpack_AI_Helper::is_ai_chat_enabled() );
	}

	/**
	 * A failed cold lookup starts the retry interval.
	 */
	public function test_failed_plan_lookup_starts_backoff() {
		$this->simulate_connection();
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		add_filter( 'pre_http_request', array( $this, 'mock_failed_plan_response' ), 10, 3 );

		$this->assertFalse( Jetpack_AI_Helper::is_ai_chat_enabled() );
		$this->assertTrue( (bool) get_transient( 'jetpack_ai_chat_plan_lookup_failed' ) );
	}

	/**
	 * Filters cannot turn on AI Chat for a free-plan site.
	 */
	public function test_filter_cannot_override_free_plan() {
		$this->simulate_connection();
		$this->set_free_search_plan();
		add_filter( 'jetpack_ai_chat_enabled', '__return_true' );

		$this->assertFalse( Jetpack_AI_Helper::is_ai_chat_enabled() );
	}
}
