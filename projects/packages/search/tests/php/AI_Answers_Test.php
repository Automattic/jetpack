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
		$this->assertArrayNotHasKey( 'aiAnswersSiteId', $state );
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

	public function test_get_behavior_instructions_returns_empty_by_default() {
		// wp_guideline is not registered; option is unset — expect empty string.
		$this->assertSame( '', AI_Answers::get_behavior_instructions() );
	}

	public function test_get_behavior_instructions_reads_option_when_no_cpt() {
		update_option( AI_Answers::BEHAVIOR_OPTION_KEY, 'Answer only in English.' );
		$this->assertSame( 'Answer only in English.', AI_Answers::get_behavior_instructions() );
		delete_option( AI_Answers::BEHAVIOR_OPTION_KEY );
	}

	public function test_register_behavior_meta_registers_setting_when_cpt_absent() {
		// wp_guideline is not registered in the bare test environment — the fallback
		// path should register the site option via register_setting() without error.
		$ai = new AI_Answers();
		$ai->register_behavior_meta();
		$this->assertNotFalse( get_registered_settings()[ AI_Answers::BEHAVIOR_OPTION_KEY ] ?? false );
	}
}
