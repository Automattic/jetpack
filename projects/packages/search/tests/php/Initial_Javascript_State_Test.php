<?php
/**
 * Tests for the Instant Search / Customberg initial state payload.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Unit tests for Helper::generate_initial_javascript_state().
 */
class Initial_Javascript_State_Test extends Search_TestCase {
	use Toggles_Ai_Master;

	public function tearDown(): void {
		$this->remove_ai_master_filters();
		unset( $GLOBALS['jetpack_search_test_internal_env'] );
		parent::tearDown();
	}

	public function test_it_reports_the_master_as_off_on_self_hosted() {
		$this->turn_ai_master_off();
		$GLOBALS['jetpack_search_test_internal_env'] = false;

		$state = Helper::generate_initial_javascript_state();

		$this->assertFalse( $state['aiMasterEnabled'] );
	}

	public function test_it_reports_the_ai_master_switch_as_off() {
		$this->turn_ai_master_off();

		$state = Helper::generate_initial_javascript_state();

		$this->assertFalse( $state['aiMasterEnabled'] );
	}

	public function test_it_reports_the_ai_master_switch_as_on() {
		$this->turn_ai_master_on();

		$state = Helper::generate_initial_javascript_state();

		$this->assertTrue( $state['aiMasterEnabled'] );
	}

	public function test_the_enabled_flag_stays_gated_while_the_saved_choice_is_on() {
		update_option( 'jetpack_search_ai_answers_enabled', true );
		$this->turn_ai_master_off();

		$state = Helper::generate_initial_javascript_state();

		$this->assertFalse( $state['aiAnswersEnabled'] );

		delete_option( 'jetpack_search_ai_answers_enabled' );
	}
}
