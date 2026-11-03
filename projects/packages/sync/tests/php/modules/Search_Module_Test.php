<?php
/**
 * Test file for Automattic\Jetpack\Sync\Modules\Search
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Search\Plan;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Class Search_Module_Test
 *
 * @covers Automattic\Jetpack\Sync\Modules\Search
 */
#[CoversClass( Modules\Search::class )]
class Search_Module_Test extends BaseTestCase {

	/**
	 * The Search sync module instance.
	 *
	 * @var Modules\Search
	 */
	private $search_module;

	/**
	 * Runs before every test in this class.
	 *
	 * Seeds a paid Search plan so the SEARCH-342 plan gate doesn't block.
	 * `Search_Blocks::supports_paid_search()` memoizes for the process
	 * lifetime with no reset reachable from this package, so this only
	 * pins the answer on whichever test first triggers it — every test
	 * here wants "paid", so that's fine, but don't add a "no plan" test
	 * to this file expecting it to see a fresh answer; that case is
	 * covered in packages/search's own suite.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->search_module = new Modules\Search();
		update_option(
			Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'effective_subscription'  => array( 'product_slug' => 'jetpack_search' ),
			)
		);
	}

	/**
	 * Runs after every test in this class.
	 */
	protected function tearDown(): void {
		remove_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
		parent::tearDown();
	}

	/**
	 * The guideline CPT should NOT be in the whitelist when AI Answers is off (default).
	 */
	public function test_ai_cpts_not_in_whitelist_when_search_disabled() {
		$list = apply_filters( 'jetpack_sync_post_types_whitelist', array() );
		$this->assertNotContains( 'wp_guideline', $list );
		$this->assertNotContains( 'jetpack_search_topic', $list );
	}

	/**
	 * The guideline CPT should be in the whitelist when AI Answers is enabled via filter.
	 */
	public function test_ai_cpts_in_whitelist_when_search_enabled() {
		add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
		$list = apply_filters( 'jetpack_sync_post_types_whitelist', array() );
		remove_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
		$this->assertContains( 'wp_guideline', $list );
		$this->assertNotContains( 'jetpack_search_topic', $list );
	}

	/**
	 * The guideline CPT should be in the whitelist when enabled via WP option only (no filter).
	 */
	public function test_ai_cpts_in_whitelist_when_option_set() {
		update_option( 'jetpack_search_ai_answers_enabled', 1 );
		$list = apply_filters( 'jetpack_sync_post_types_whitelist', array() );
		delete_option( 'jetpack_search_ai_answers_enabled' );
		$this->assertContains( 'wp_guideline', $list );
		$this->assertNotContains( 'jetpack_search_topic', $list );
	}
}
