<?php
/**
 * Tests for the AI SEO availability gate: each term falsified on its own. The Simple behavior is pinned plugin-side in Jetpack_AI_Sidebar_Test
 * (IS_WPCOM needs process isolation, broken here under PHP 8.5).
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\SEO\Ai_Seo
 */
#[CoversClass( Ai_Seo::class )]
class AiSeoTest extends SeoTestCase {

	/**
	 * Reset the option, filters and plan pin every test touches.
	 */
	protected function tearDown(): void {
		delete_option( 'ai_seo_enhancer_enabled' );
		remove_all_filters( 'ai_seo_enhancer_enabled' );
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( 'jetpack_disable_seo_tools' );

		\Automattic\Jetpack\Extensions\AiAssistantPlugin\Jetpack_AI_Sidebar::$is_host_enabled = false;

		self::reset_plan();

		parent::tearDown();
	}

	/**
	 * Every term satisfied: available.
	 */
	public function test_is_available_when_all_inputs_true() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );

		$this->assertTrue( Ai_Seo::is_available() );
	}

	/**
	 * The feature filter vetoes on its own.
	 */
	public function test_is_not_available_when_filter_off() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );

		$this->assertFalse( Ai_Seo::is_available() );
	}

	/**
	 * The seo-tools module vetoes on its own.
	 */
	public function test_is_not_available_when_seo_tools_module_inactive() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( false );

		$this->assertFalse( Ai_Seo::is_available() );
	}

	/**
	 * `advanced-seo` sits in the free plan's supports list, so every self-hosted
	 * plan is entitled — AI SEO is offered on a free site with SEO tools on.
	 * Automatic generation is the part that needs a higher tier, and it checks
	 * `ai-seo-enhancer` where it runs, not here.
	 *
	 * The entitlement can only be falsified on WordPress.com, where
	 * Current_Plan::supports() hijacks to wpcom_site_has_feature(); pinning a
	 * purchase there would couple this test to wpcomsh's schema.
	 */
	public function test_is_available_on_a_free_plan() {
		self::set_plan( 'jetpack_free' );
		self::set_seo_tools_active( true );

		$this->assertTrue( Ai_Seo::is_available() );
	}

	/**
	 * A conflicting SEO plugin (jetpack_disable_seo_tools) vetoes on its own.
	 */
	public function test_is_not_available_when_seo_tools_are_disabled_by_filter() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );

		$this->assertFalse( Ai_Seo::is_available() );
	}

	/**
	 * The editor's generation is reachable on a plan holding `ai-seo-enhancer`.
	 */
	public function test_has_reachable_surface_when_the_plan_supports_the_enhancer() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );

		$this->assertTrue( Ai_Seo::has_reachable_surface() );
	}

	/**
	 * A free plan off WordPress.com is entitled to AI SEO but reaches neither
	 * surface: no sidebar on this host, no `ai-seo-enhancer` for the editor.
	 */
	public function test_has_no_reachable_surface_on_a_free_plan_without_the_sidebar() {
		self::set_plan( 'jetpack_free' );
		self::set_seo_tools_active( true );

		$this->assertTrue( Ai_Seo::is_available() );
		$this->assertFalse( Ai_Seo::has_reachable_surface() );
	}

	/**
	 * A host that loads the sidebar reaches its SEO suggestions without the
	 * enhancer entitlement.
	 */
	public function test_has_reachable_surface_when_the_host_loads_the_sidebar() {
		self::set_plan( 'jetpack_free' );
		self::set_seo_tools_active( true );
		\Automattic\Jetpack\Extensions\AiAssistantPlugin\Jetpack_AI_Sidebar::$is_host_enabled = true;

		$this->assertTrue( Ai_Seo::has_reachable_surface() );
	}

	/**
	 * A falsified availability term vetoes a reachable surface too.
	 */
	public function test_has_no_reachable_surface_when_seo_tools_module_inactive() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( false );
		\Automattic\Jetpack\Extensions\AiAssistantPlugin\Jetpack_AI_Sidebar::$is_host_enabled = true;

		$this->assertFalse( Ai_Seo::has_reachable_surface() );
	}
}
