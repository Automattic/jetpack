<?php
/**
 * Tests for the AI SEO Enhancer gate: each availability term falsified on its own.
 *
 * Not covered here: that the module term is inert on WordPress.com Simple.
 * Exercising it needs the real `IS_WPCOM` constant, which only works in an
 * isolated process, and this package's SQLite bootstrap emits deprecations
 * there on PHP 8.5 that PHPUnit reports as an error. The user-visible half of
 * that guarantee is covered plugin-side by
 * Jetpack_AI_Sidebar_Test::test_preview_stays_open_on_simple_even_with_every_toggle_off.
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
	 * Availability ANDs four independent inputs; with all of them satisfied the
	 * enhancer is available.
	 */
	public function test_is_available_when_all_inputs_true() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );

		$this->assertTrue( AI_SEO_Enhancer::is_available() );
	}

	/**
	 * The feature filter vetoes on its own: a host that kills the enhancer
	 * hides it even with the module and the plan in place.
	 */
	public function test_is_not_available_when_filter_off() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );

		$this->assertFalse( AI_SEO_Enhancer::is_available() );
	}

	/**
	 * The seo-tools module vetoes on its own: the enhancer writes to the SEO
	 * title and meta description fields that module owns, so an inactive module
	 * leaves it nothing to write.
	 */
	public function test_is_not_available_when_seo_tools_module_inactive() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( false );

		$this->assertFalse( AI_SEO_Enhancer::is_available() );
	}

	/**
	 * The plan vetoes on its own: `ai-seo-enhancer` is a Business-tier feature,
	 * so a free site is not entitled to it.
	 */
	public function test_is_not_available_when_plan_lacks_feature() {
		self::set_plan( 'jetpack_free' );
		self::set_seo_tools_active( true );

		$this->assertFalse( AI_SEO_Enhancer::is_available() );
	}

	/**
	 * A conflicting SEO plugin vetoes on its own. The seo-tools module raises
	 * `jetpack_disable_seo_tools` when Yoast, AIOSEO or Rank Math owns the
	 * site's SEO; the enhancer's fields are then not Jetpack's to write, so no
	 * surface should offer the toggle.
	 */
	public function test_is_not_available_when_seo_tools_are_disabled_by_filter() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );

		$this->assertFalse( AI_SEO_Enhancer::is_available() );
	}
}
