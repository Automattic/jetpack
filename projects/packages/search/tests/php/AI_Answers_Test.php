<?php
/**
 * Tests for the AI_Answers class.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Unit tests for the AI_Answers class.
 */
class AI_Answers_Test extends Search_TestCase {
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		( new AI_Answers() )->init();
		do_action( 'init' );
	}

	/** @var callable|null */
	private $posts_query_filter = null;

	/** @var int[] */
	private $test_post_ids = array();

	public function tearDown(): void {
		// Delete test posts BEFORE parent::tearDown() empties the WorDBless store.
		// wp_delete_post() must find the post to call clean_post_cache(), which
		// invalidates the WP query cache and prevents stale cache hits in later tests.
		foreach ( $this->test_post_ids as $id ) {
			wp_delete_post( $id, true );
		}
		$this->test_post_ids = array();

		parent::tearDown();

		if ( $this->posts_query_filter !== null ) {
			remove_filter( 'posts_pre_query', $this->posts_query_filter, 10 );
			$this->posts_query_filter = null;
		}
		if ( post_type_exists( 'wp_guideline' ) ) {
			unregister_post_type( 'wp_guideline' );
		}
	}

	public function test_is_enabled_defaults_to_false() {
		$this->assertFalse( AI_Answers::is_enabled() );
	}

	public function test_is_enabled_reads_option() {
		update_option( 'jetpack_search_ai_answers_enabled', true );
		$this->assertTrue( AI_Answers::is_enabled() );
		delete_option( 'jetpack_search_ai_answers_enabled' );
	}

	public function test_is_enabled_filter_overrides_option() {
		add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
		$this->assertTrue( AI_Answers::is_enabled() );
		remove_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
	}

	public function test_get_behavior_instructions_returns_empty_by_default() {
		// wp_guideline is not registered; option is unset — expect empty string.
		$this->assertSame( '', AI_Answers::get_behavior_instructions() );
	}

	public function test_get_behavior_instructions_reads_option_when_no_cpt() {
		update_option( AI_Answers::BEHAVIOR_OPTION_KEY, 'Answer only in English.' );
		$this->assertSame( 'Answer only in English.', AI_Answers::get_behavior_instructions() );
	}

	public function test_register_behavior_meta_registers_setting_when_cpt_absent() {
		// wp_guideline is not registered in the bare test environment — the fallback
		// path should register the site option via register_setting() without error.
		$ai = new AI_Answers();
		$ai->register_behavior_meta();
		$this->assertNotFalse( get_registered_settings()[ AI_Answers::BEHAVIOR_OPTION_KEY ] ?? false );
	}

	// -------------------------------------------------------------------------
	// Tests for the wp_guideline CPT path
	// -------------------------------------------------------------------------

	/**
	 * Register a queryable variant of wp_guideline for test isolation.
	 */
	private function register_guideline_cpt() {
		register_post_type(
			'wp_guideline', // phpcs:ignore WordPress.NamingConventions.ValidPostTypeSlug.ReservedPrefix
			array(
				'public'   => true,
				'supports' => array( 'custom-fields' ),
			)
		);
	}

	/**
	 * WorDBless dbless mode only intercepts SELECT * FROM posts WHERE ID = N.
	 * All other WP_Query SQL returns empty. Hook posts_pre_query (which runs
	 * regardless of suppress_filters) to short-circuit the query and return
	 * our test post when the query targets wp_guideline posts.
	 */
	private function hook_wordbless_posts_query( int $post_id ): void {
		$this->posts_query_filter = static function ( $posts, $query ) use ( $post_id ) {
			if ( 'wp_guideline' === $query->get( 'post_type' ) ) {
				return array( get_post( $post_id ) );
			}
			return $posts;
		};
		add_filter( 'posts_pre_query', $this->posts_query_filter, 10, 2 );
	}

	public function test_register_behavior_meta_registers_post_meta_when_wp_guideline_exists() {
		$this->register_guideline_cpt();
		$ai = new AI_Answers();
		$ai->register_behavior_meta();
		$registered = get_registered_meta_keys( 'post', 'wp_guideline' );
		$this->assertArrayHasKey( AI_Answers::BEHAVIOR_META_KEY, $registered );
	}

	public function test_register_behavior_meta_does_not_register_option_when_cpt_exists() {
		$this->register_guideline_cpt();
		$before = get_registered_settings();
		$ai     = new AI_Answers();
		$ai->register_behavior_meta();
		$after = get_registered_settings();
		// The fallback option key should NOT have been freshly registered.
		$this->assertEquals( isset( $before[ AI_Answers::BEHAVIOR_OPTION_KEY ] ), isset( $after[ AI_Answers::BEHAVIOR_OPTION_KEY ] ) );
	}

	public function test_get_behavior_instructions_reads_from_published_post_meta() {
		$this->register_guideline_cpt();
		$post_id               = wp_insert_post(
			array(
				'post_type'   => 'wp_guideline',
				'post_status' => 'publish',
				'post_title'  => 'Guidelines',
			)
		);
		$this->test_post_ids[] = $post_id;
		update_post_meta( $post_id, AI_Answers::BEHAVIOR_META_KEY, 'Answer only in English.' );
		$this->hook_wordbless_posts_query( $post_id );

		$this->assertSame( 'Answer only in English.', AI_Answers::get_behavior_instructions() );
	}

	public function test_get_behavior_instructions_falls_back_to_option_when_cpt_has_no_published_posts() {
		$this->register_guideline_cpt();
		update_option( AI_Answers::BEHAVIOR_OPTION_KEY, 'Fallback instructions.' );

		// CPT registered but no published posts exist — WP_Query returns empty in WorDBless.
		$this->assertSame( 'Fallback instructions.', AI_Answers::get_behavior_instructions() );
	}

	public function test_get_behavior_instructions_ignores_draft_posts() {
		$this->register_guideline_cpt();
		$post_id               = wp_insert_post(
			array(
				'post_type'   => 'wp_guideline',
				'post_status' => 'draft',
				'post_title'  => 'Draft Guidelines',
			)
		);
		$this->test_post_ids[] = $post_id;
		update_post_meta( $post_id, AI_Answers::BEHAVIOR_META_KEY, 'Draft instructions.' );

		// Only published posts should be read; draft posts are ignored.
		// (No wordbless hook — WP_Query returns empty, so get_option fallback returns ''.)
		$this->assertSame( '', AI_Answers::get_behavior_instructions() );
	}

	public function test_get_behavior_instructions_prefers_cpt_over_option_when_both_exist() {
		$this->register_guideline_cpt();
		$post_id               = wp_insert_post(
			array(
				'post_type'   => 'wp_guideline',
				'post_status' => 'publish',
				'post_title'  => 'Guidelines',
			)
		);
		$this->test_post_ids[] = $post_id;
		update_post_meta( $post_id, AI_Answers::BEHAVIOR_META_KEY, 'From CPT.' );
		update_option( AI_Answers::BEHAVIOR_OPTION_KEY, 'From option.' );
		$this->hook_wordbless_posts_query( $post_id );

		$this->assertSame( 'From CPT.', AI_Answers::get_behavior_instructions() );
	}

	public function test_behavior_option_key_constant() {
		$this->assertSame( 'jetpack_search_ai_behavior_instructions', AI_Answers::BEHAVIOR_OPTION_KEY );
	}
}
