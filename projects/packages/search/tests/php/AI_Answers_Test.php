<?php
/**
 * Tests for the AI_Answers class.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Unit tests for the AI_Answers class.
 */
class AI_Answers_Test extends Search_TestCase {
	use Toggles_Ai_Master;

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

		$this->remove_ai_master_filters();
		unset( $GLOBALS['jetpack_search_test_internal_env'] );
		Constants::clear_single_constant( 'IS_WPCOM' );

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

	// -------------------------------------------------------------------------
	// Tests for the site-wide Jetpack AI master switch
	// -------------------------------------------------------------------------

	/**
	 * Off Simple, the `ai` module is the master switch.
	 */
	public function test_should_enforce_master_is_true_when_the_ai_module_is_active() {
		$this->turn_ai_master_on();

		$this->assertTrue( AI_Answers::should_enforce_master() );
	}

	public function test_should_enforce_master_is_false_when_the_ai_module_is_inactive() {
		$this->turn_ai_master_off();

		$this->assertFalse( AI_Answers::should_enforce_master() );
	}

	public function test_should_enforce_master_is_true_when_the_ai_module_is_not_registered() {
		// Standalone Jetpack Search plugin: no Jetpack plugin, so no `ai` module and
		// no master switch to obey. Sites that never had one must not be gated.
		$this->assertTrue( AI_Answers::should_enforce_master() );
	}

	/**
	 * Turn the Simple master off.
	 *
	 * Stores the empty string rather than `false`, which is what WordPress
	 * persists for a false option — and what WorDBless can round-trip, since it
	 * returns the default for a stored `false`.
	 */
	private function disable_simple_master() {
		update_option( AI_Answers::AI_MASTER_OPTION, '' );
	}

	public function test_should_enforce_master_reads_the_option_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->disable_simple_master();

		$this->assertFalse( AI_Answers::should_enforce_master() );
	}

	public function test_should_enforce_master_defaults_to_true_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertTrue( AI_Answers::should_enforce_master() );
	}

	public function test_should_enforce_master_holds_on_wpcom_simple_regardless_of_environment() {
		// Simple keeps its option contract: enforcement applies there even
		// outside internal testing environments (is_master_rollout_active()).
		Constants::set_constant( 'IS_WPCOM', true );
		$this->disable_simple_master();
		$GLOBALS['jetpack_search_test_internal_env'] = false;

		$this->assertFalse( AI_Answers::should_enforce_master() );
	}

	public function test_should_enforce_master_ignores_the_ai_module_on_wpcom_simple() {
		// Modules never run on Simple, and Modules::is_active() answers true there
		// unconditionally — the option stays the master.
		Constants::set_constant( 'IS_WPCOM', true );
		$this->turn_ai_master_on();
		$this->disable_simple_master();

		$this->assertFalse( AI_Answers::should_enforce_master() );
	}

	public function test_should_enforce_master_is_true_outside_internal_testing_environments() {
		// The master switch UI ships internal-only for now, so a public site must not be
		// gated on a switch its owner cannot see. Module present but inactive, yet ungated.
		$this->turn_ai_module_off();
		$GLOBALS['jetpack_search_test_internal_env'] = false;

		$this->assertTrue( AI_Answers::should_enforce_master() );
	}

	public function test_is_enabled_ignores_the_module_outside_internal_testing_environments() {
		// Module-only setup: pins that the package's own enforcement is env-scoped.
		// (With the Jetpack plugin loaded, its filter gate still applies publicly.)
		update_option( 'jetpack_search_ai_answers_enabled', true );
		$this->turn_ai_module_off();
		$GLOBALS['jetpack_search_test_internal_env'] = false;

		$this->assertTrue( AI_Answers::is_enabled() );
	}

	public function test_is_enabled_is_false_when_the_master_is_off() {
		// The saved choice persists while the master is off; only is_enabled() gates it.
		update_option( 'jetpack_search_ai_answers_enabled', true );
		$this->turn_ai_master_off();

		$this->assertTrue( AI_Answers::is_saved_on() );
		$this->assertFalse( AI_Answers::is_enabled() );
	}

	public function test_is_enabled_master_gate_cannot_be_filtered_back_on() {
		// The master gate is applied after the filter chain, so a filter cannot
		// re-enable AI Answers while the site-wide switch is off.
		$this->turn_ai_master_off();
		add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );

		$this->assertFalse( AI_Answers::is_enabled() );

		remove_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
	}

	/**
	 * The saved choice is the raw option.
	 */
	public function test_is_saved_on_returns_the_raw_option() {
		$this->assertFalse( AI_Answers::is_saved_on() );
		update_option( 'jetpack_search_ai_answers_enabled', true );
		$this->assertTrue( AI_Answers::is_saved_on() );
		delete_option( 'jetpack_search_ai_answers_enabled' );
	}

	public function test_is_saved_on_ignores_the_filter() {
		// The saved choice is the raw option; gates on the filter must not leak in.
		add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
		$this->assertFalse( AI_Answers::is_saved_on() );
		remove_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
	}

	public function test_is_master_enabled_is_true_without_a_master_gate() {
		// Standalone Jetpack Search plugin: nothing subscribes to the filter, so
		// there is no master switch to obey and the site must not report gated.
		$this->assertTrue( AI_Answers::is_master_enabled() );
	}

	public function test_is_master_enabled_is_false_when_the_master_is_off() {
		$this->turn_ai_master_off();
		$this->assertFalse( AI_Answers::is_master_enabled() );
	}

	public function test_is_master_enabled_is_true_when_the_master_is_on() {
		$this->turn_ai_master_on();
		$this->assertTrue( AI_Answers::is_master_enabled() );
	}

	public function test_is_master_enabled_reports_on_outside_internal_testing_environments() {
		// The master rollout is a12s-scoped: public sites report ungated even
		// when the gate is registered, so no master-off UI leaks before the sweep.
		$this->turn_ai_master_off();
		$GLOBALS['jetpack_search_test_internal_env'] = false;

		$this->assertTrue( AI_Answers::is_master_enabled() );
	}

	public function test_is_master_enabled_reports_the_gate_on_wpcom_simple_regardless_of_environment() {
		// On Simple the option keeps its contract and the master enforces
		// publicly (see the plugin's is_master_rollout_active()), so the
		// reporting must follow it there even outside internal environments.
		Constants::set_constant( 'IS_WPCOM', true );
		$this->turn_ai_master_off();
		$GLOBALS['jetpack_search_test_internal_env'] = false;

		$this->assertFalse( AI_Answers::is_master_enabled() );
	}

	public function test_is_master_enabled_never_reports_above_enforcement_on_wpcom_simple() {
		// On Simple the probe depends on the plugin's filter being registered,
		// which wpcom's loader doesn't guarantee per request. With no filter and
		// the option off, reporting must still follow enforcement.
		Constants::set_constant( 'IS_WPCOM', true );
		update_option( AI_Answers::AI_MASTER_OPTION, '' );

		$this->assertFalse( AI_Answers::is_master_enabled() );
	}

	public function test_is_enabled_still_gated_outside_internal_testing_environments() {
		// Enforcement is the plugin's public filter — only the *reporting* is
		// scoped. A public master-off site still reports the feature off.
		update_option( 'jetpack_search_ai_answers_enabled', true );
		$this->turn_ai_master_off();
		$GLOBALS['jetpack_search_test_internal_env'] = false;

		$this->assertFalse( AI_Answers::is_enabled() );

		delete_option( 'jetpack_search_ai_answers_enabled' );
	}

	public function test_is_master_enabled_ignores_the_option() {
		// The reported master state is about the gates, not the feature's saved choice.
		update_option( 'jetpack_search_ai_answers_enabled', false );
		$this->turn_ai_master_on();
		$this->assertTrue( AI_Answers::is_master_enabled() );
		delete_option( 'jetpack_search_ai_answers_enabled' );
	}

	// -------------------------------------------------------------------------
	// Tests for the host's AI opt-out
	// -------------------------------------------------------------------------

	/**
	 * The host's opt-out is core's call, so the package follows wp_supports_ai().
	 */
	public function test_host_allows_ai_follows_core_when_the_host_opts_out() {
		add_filter( 'wp_supports_ai', '__return_false' );

		$this->assertFalse( AI_Answers::host_allows_ai() );

		remove_filter( 'wp_supports_ai', '__return_false' );
	}

	public function test_host_allows_ai_follows_core_when_the_host_allows_it() {
		add_filter( 'wp_supports_ai', '__return_true' );

		$this->assertTrue( AI_Answers::host_allows_ai() );

		remove_filter( 'wp_supports_ai', '__return_true' );
	}

	public function test_host_allows_ai_defaults_to_true() {
		// No host opt-out configured: AI Answers must not be gated.
		$this->assertTrue( AI_Answers::host_allows_ai() );
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
