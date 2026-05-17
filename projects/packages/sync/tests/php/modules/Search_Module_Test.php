<?php
/**
 * Test file for Automattic\Jetpack\Sync\Modules\Search
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

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
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->search_module = new Modules\Search();
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
