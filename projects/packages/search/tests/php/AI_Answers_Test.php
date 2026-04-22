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

	public static function tearDownAfterClass(): void {
		unregister_post_type( AI_Answers::BEHAVIOR_CPT );
		unregister_post_type( AI_Answers::TOPIC_CPT );
		parent::tearDownAfterClass();
	}

	public function test_behavior_cpt_registered() {
		$this->assertTrue( post_type_exists( AI_Answers::BEHAVIOR_CPT ) );
	}

	public function test_topic_cpt_registered() {
		$this->assertTrue( post_type_exists( AI_Answers::TOPIC_CPT ) );
	}

	public function test_cpts_are_private() {
		$behavior = get_post_type_object( AI_Answers::BEHAVIOR_CPT );
		$topic    = get_post_type_object( AI_Answers::TOPIC_CPT );
		$this->assertFalse( $behavior->public );
		$this->assertFalse( $topic->public );
	}

	public function test_cpts_show_in_rest() {
		$behavior = get_post_type_object( AI_Answers::BEHAVIOR_CPT );
		$topic    = get_post_type_object( AI_Answers::TOPIC_CPT );
		$this->assertTrue( $behavior->show_in_rest );
		$this->assertTrue( $topic->show_in_rest );
	}

	public function test_topic_postmeta_registered() {
		$registered = get_registered_meta_keys( 'post', AI_Answers::TOPIC_CPT );
		$this->assertArrayHasKey( '_jstopic_keywords', $registered );
		$this->assertArrayHasKey( '_jstopic_url', $registered );
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

	public function test_hmac_token_not_in_state_when_disabled() {
		// Feature disabled by default.
		$state = Helper::generate_initial_javascript_state();
		$this->assertArrayNotHasKey( 'aiAnswersToken', $state );
	}

	public function test_hmac_token_in_state_when_enabled() {
		add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
		$state = Helper::generate_initial_javascript_state();
		remove_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );
		// The test environment (WorDBless) provides a blog token, so both keys
		// should be present in state when the feature is enabled.
		$this->assertArrayHasKey( 'aiAnswersToken', $state );
		$this->assertNotEmpty( $state['aiAnswersToken'] );
		$this->assertArrayHasKey( 'aiAnswersSiteId', $state );
		$this->assertIsInt( $state['aiAnswersSiteId'] );
	}
}
