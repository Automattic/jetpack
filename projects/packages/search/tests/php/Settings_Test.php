<?php
/**
 * Tests for the Settings class.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Unit tests for the Settings class.
 */
class Settings_Test extends Search_TestCase {
	use Toggles_Ai_Master;

	public function tearDown(): void {
		$this->remove_ai_master_filters();
		parent::tearDown();
	}

	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		// Instantiating Settings hooks settings_register onto admin_init and
		// rest_api_init.  Fire rest_api_init so the settings are registered
		// before the individual tests run.
		new Settings();
		do_action( 'rest_api_init' );
	}

	public function test_settings_register_registers_ai_answers_enabled() {
		$registered = get_registered_settings();
		$this->assertArrayHasKey( Options::OPTION_PREFIX . 'ai_answers_enabled', $registered );
		$setting = $registered[ Options::OPTION_PREFIX . 'ai_answers_enabled' ];
		$this->assertEquals( 'boolean', $setting['type'] );
		$this->assertFalse( $setting['default'] );
	}

	public function test_ai_answers_setting_persists_while_the_ai_master_is_off() {
		// The AI feature-settings endpoint writes feature choices even while the
		// master is off so they survive it; this option follows the same contract
		// as the other AI feature options. Enforcement lives in is_enabled().
		$this->turn_ai_master_off();

		update_option( Options::OPTION_PREFIX . 'ai_answers_enabled', true );

		$this->assertTrue( (bool) get_option( Options::OPTION_PREFIX . 'ai_answers_enabled', false ) );
		$this->assertFalse( AI_Answers::is_enabled() );
	}

	public function test_ai_answers_setting_can_still_be_turned_off_while_the_ai_master_is_off() {
		update_option( Options::OPTION_PREFIX . 'ai_answers_enabled', true );
		$this->turn_ai_master_off();

		update_option( Options::OPTION_PREFIX . 'ai_answers_enabled', false );

		$this->assertFalse( (bool) get_option( Options::OPTION_PREFIX . 'ai_answers_enabled', false ) );
	}

	public function test_ai_answers_setting_can_be_turned_on_while_the_ai_master_is_on() {
		$this->turn_ai_master_on();

		update_option( Options::OPTION_PREFIX . 'ai_answers_enabled', true );

		$this->assertTrue( (bool) get_option( Options::OPTION_PREFIX . 'ai_answers_enabled', false ) );
	}

	public function test_settings_register_registers_result_format() {
		$registered = get_registered_settings();
		$this->assertArrayHasKey( Options::OPTION_PREFIX . 'result_format', $registered );
		$setting = $registered[ Options::OPTION_PREFIX . 'result_format' ];
		$this->assertEquals( 'string', $setting['type'] );
		$this->assertEquals( 'minimal', $setting['default'] );
	}

	public function test_settings_register_registers_enable_sort() {
		$registered = get_registered_settings();
		$this->assertArrayHasKey( Options::OPTION_PREFIX . 'enable_sort', $registered );
		$setting = $registered[ Options::OPTION_PREFIX . 'enable_sort' ];
		$this->assertEquals( 'boolean', $setting['type'] );
		$this->assertTrue( $setting['default'] );
	}

	public function test_settings_register_all_settings_have_show_in_rest() {
		$registered    = get_registered_settings();
		$prefix        = Options::OPTION_PREFIX;
		$expected_keys = array(
			$prefix . 'ai_prompt_override',
			$prefix . 'color_theme',
			$prefix . 'result_format',
			$prefix . 'default_sort',
			$prefix . 'overlay_trigger',
			$prefix . 'excluded_post_types',
			$prefix . 'highlight_color',
			$prefix . 'enable_sort',
			$prefix . 'inf_scroll',
			$prefix . 'filtering_opens_overlay',
			$prefix . 'show_post_date',
			$prefix . 'show_product_price',
			$prefix . 'show_powered_by',
			$prefix . 'ai_answers_enabled',
		);
		foreach ( $expected_keys as $key ) {
			$this->assertArrayHasKey( $key, $registered, "Setting $key not registered" );
			$this->assertTrue( $registered[ $key ]['show_in_rest'], "Setting $key missing show_in_rest" );
		}
	}
}
