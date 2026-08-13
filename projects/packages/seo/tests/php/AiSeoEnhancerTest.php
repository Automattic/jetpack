<?php
/**
 * Tests for the AI SEO Enhancer gate: each availability term falsified on its
 * own. The Simple behavior is pinned plugin-side in Jetpack_AI_Sidebar_Test
 * (IS_WPCOM needs process isolation, broken here under PHP 8.5).
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\SEO\AI_SEO_Enhancer
 */
#[CoversClass( AI_SEO_Enhancer::class )]
class AiSeoEnhancerTest extends SeoTestCase {

	/**
	 * Reset the option, filters and plan pin every test touches.
	 */
	protected function tearDown(): void {
		delete_option( 'ai_seo_enhancer_enabled' );
		remove_all_filters( 'ai_seo_enhancer_enabled' );
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( 'jetpack_disable_seo_tools' );

		self::reset_plan();

		parent::tearDown();
	}

	/**
	 * All four terms satisfied: available.
	 */
	public function test_is_available_when_all_inputs_true() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );

		$this->assertTrue( AI_SEO_Enhancer::is_available() );
	}

	/**
	 * The feature filter vetoes on its own.
	 */
	public function test_is_not_available_when_filter_off() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );

		$this->assertFalse( AI_SEO_Enhancer::is_available() );
	}

	/**
	 * The seo-tools module vetoes on its own.
	 */
	public function test_is_not_available_when_seo_tools_module_inactive() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( false );

		$this->assertFalse( AI_SEO_Enhancer::is_available() );
	}

	/**
	 * The plan vetoes on its own.
	 */
	public function test_is_not_available_when_plan_lacks_feature() {
		self::set_plan( 'jetpack_free' );
		self::set_seo_tools_active( true );

		$this->assertFalse( AI_SEO_Enhancer::is_available() );
	}

	/**
	 * A conflicting SEO plugin (jetpack_disable_seo_tools) vetoes on its own.
	 */
	public function test_is_not_available_when_seo_tools_are_disabled_by_filter() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );

		$this->assertFalse( AI_SEO_Enhancer::is_available() );
	}

	/**
	 * An absent option is not "switched off": most sites never stored a value,
	 * and hiding on absence would take the feature away from all of them.
	 */
	public function test_is_switched_off_false_when_option_absent() {
		delete_option( AI_SEO_Enhancer::OPTION );

		$this->assertFalse( AI_SEO_Enhancer::is_switched_off() );
	}

	/**
	 * A stored falsy value is a deliberate off. The module-settings endpoint
	 * stores `(int) 0`.
	 */
	public function test_is_switched_off_true_when_option_stored_off() {
		update_option( AI_SEO_Enhancer::OPTION, 0 );

		$this->assertTrue( AI_SEO_Enhancer::is_switched_off() );
	}

	/**
	 * The AI feature settings endpoint stores a sanitized bool, which
	 * `update_option()` persists as an empty string — still a deliberate off.
	 */
	public function test_is_switched_off_true_when_option_stored_as_empty_string() {
		update_option( AI_SEO_Enhancer::OPTION, '' );

		$this->assertTrue( AI_SEO_Enhancer::is_switched_off() );
	}

	/**
	 * A stored on is not off.
	 */
	public function test_is_switched_off_false_when_option_stored_on() {
		update_option( AI_SEO_Enhancer::OPTION, 1 );

		$this->assertFalse( AI_SEO_Enhancer::is_switched_off() );
	}
}
