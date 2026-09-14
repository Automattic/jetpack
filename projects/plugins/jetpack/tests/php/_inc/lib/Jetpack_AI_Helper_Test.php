<?php
/**
 * Jetpack_AI_Helper::is_ai_chat_enabled() tests.
 *
 * Locks down the paid-plan gate for SEARCH-351: AI Chat requires a paid
 * Search plan, not just search support in general.
 *
 * Runs in separate processes: supports_paid_search() memoizes per-process,
 * and its test reset is @internal to packages/search.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Search\Plan;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

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
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		( new Manager( 'jetpack' ) )->reset_connection_status();
		remove_filter( 'jetpack_ai_chat_enabled', '__return_false' );
		remove_filter( 'jetpack_ai_chat_enabled', '__return_true' );

		parent::tear_down();
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
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enabled_when_connected_and_paid_plan() {
		$this->simulate_connection();
		$this->set_paid_search_plan();

		$this->assertTrue( Jetpack_AI_Helper::is_ai_chat_enabled() );
	}

	/**
	 * Connected, but on a free Search plan: chat stays disabled.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_disabled_when_connected_but_free_plan() {
		$this->simulate_connection();
		$this->set_free_search_plan();

		$this->assertFalse( Jetpack_AI_Helper::is_ai_chat_enabled() );
	}

	/**
	 * A paid Search plan alone isn't enough without a connection.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_disabled_when_paid_plan_but_disconnected() {
		$this->set_paid_search_plan();

		$this->assertFalse( Jetpack_AI_Helper::is_ai_chat_enabled() );
	}
}
