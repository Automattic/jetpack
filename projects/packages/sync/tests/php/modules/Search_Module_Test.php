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
	 * AI Answer CPTs should NOT be in the whitelist when the AI Answers feature flag is off (default).
	 */
	public function test_ai_cpts_not_in_whitelist_when_search_disabled() {
		// Ensure filter returns false (default — do NOT add __return_true).
		$list = apply_filters( 'jetpack_sync_post_types_whitelist', array() );
		$this->assertNotContains( 'jp_search_behavior', $list );
		$this->assertNotContains( 'jetpack_search_topic', $list );
	}

	/**
	 * AI Answer CPTs should be in the whitelist when the AI Answers feature flag is on.
	 */
	public function test_ai_cpts_in_whitelist_when_search_enabled() {
		add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
		$list = apply_filters( 'jetpack_sync_post_types_whitelist', array() );
		remove_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
		$this->assertContains( 'jp_search_behavior', $list );
		$this->assertContains( 'jetpack_search_topic', $list );
	}

	/**
	 * AI topic postmeta keys should be in the whitelist when the AI Answers feature flag is on.
	 */
	public function test_ai_topic_meta_in_whitelist_when_search_enabled() {
		add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
		$list = apply_filters( 'jetpack_sync_post_meta_whitelist', array() );
		remove_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
		$this->assertContains( '_jstopic_keywords', $list );
		$this->assertContains( '_jstopic_url', $list );
	}
}
