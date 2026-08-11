<?php
/**
 * Tests for the canonical AI SEO Enhancer gate: the three availability terms,
 * the stored toggle, and the combination of the two.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Depends;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers \Automattic\Jetpack\SEO\AI_SEO_Enhancer
 */
#[CoversClass( AI_SEO_Enhancer::class )]
class AiSeoEnhancerTest extends SeoTestCase {

	/**
	 * Reset the option, filters and plan pin every test touches.
	 */
	protected function tearDown(): void {
		delete_option( AI_SEO_Enhancer::OPTION );
		remove_all_filters( 'ai_seo_enhancer_enabled' );
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( 'jetpack_disable_seo_tools' );

		self::reset_plan();

		parent::tearDown();
	}

	/**
	 * The option name is the one the settings endpoints round-trip, so the
	 * package copy of the gate can never read a different store than the
	 * plugin's AI feature settings.
	 */
	public function test_option_constant_is_the_shared_toggle() {
		$this->assertSame( 'ai_seo_enhancer_enabled', AI_SEO_Enhancer::OPTION );
	}

	/**
	 * Availability ANDs three independent inputs; with all three satisfied the
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

		try {
			$this->assertFalse( AI_SEO_Enhancer::is_available() );
		} finally {
			remove_filter( 'ai_seo_enhancer_enabled', '__return_false' );
		}
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

		try {
			$this->assertFalse( AI_SEO_Enhancer::is_available() );
		} finally {
			remove_filter( 'jetpack_disable_seo_tools', '__return_true' );
		}
	}

	/**
	 * The stored toggle is opt-in: absent means off, matching the `false`
	 * default `Jetpack_AI_Settings::is_feature_enabled( 'seo_enhancer' )` reads.
	 */
	public function test_is_toggled_on_defaults_to_false() {
		delete_option( AI_SEO_Enhancer::OPTION );

		$this->assertFalse( AI_SEO_Enhancer::is_toggled_on() );
	}

	/**
	 * A stored `1` reads as on, and as a real bool rather than the raw option.
	 */
	public function test_is_toggled_on_reads_the_stored_option() {
		update_option( AI_SEO_Enhancer::OPTION, 1 );

		$this->assertTrue( AI_SEO_Enhancer::is_toggled_on() );
	}

	/**
	 * WordPress.com Simple no-regression guarantee: adding the module term must
	 * not take the enhancer away from Simple sites, which do not run the
	 * seo-tools module through Jetpack's module machinery at all.
	 *
	 * `Modules::is_active()` returns true unconditionally when the real
	 * `IS_WPCOM` constant is defined, so the module term is inert there. That
	 * constant can't be defined for a single test in-process (it would leak into
	 * every later test in the run and turn *every* module on), so this runs in
	 * an isolated process with the constant genuinely defined — the same read
	 * path production takes on Simple.
	 *
	 * The annotations are kept alongside the attributes on purpose: the
	 * attributes are what PHPUnit 10+ reads, the annotations are what the
	 * PHPUnit 8/9 configurations this package still ships read. Losing the
	 * isolation would silently define `IS_WPCOM` for the rest of the run.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_module_term_is_inert_on_wordpress_com_simple() {
		define( 'IS_WPCOM', true );

		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( false );

		$this->assertTrue( AI_SEO_Enhancer::is_available() );
	}

	/**
	 * Guards the isolation the test above depends on: a dropped
	 * `#[RunInSeparateProcess]` shows up here as a failure rather than as
	 * `IS_WPCOM` quietly switching every module on for the rest of the run.
	 *
	 * Ordered by `@depends` rather than by declaration order, so the guard still
	 * runs after its subject if the suite is ever switched to random execution.
	 *
	 * @depends test_module_term_is_inert_on_wordpress_com_simple
	 */
	#[Depends( 'test_module_term_is_inert_on_wordpress_com_simple' )]
	public function test_wordpress_com_simple_case_did_not_leak_its_constant() {
		$this->assertFalse( defined( 'IS_WPCOM' ), 'IS_WPCOM leaked out of the isolated WordPress.com Simple test.' );
	}
}
