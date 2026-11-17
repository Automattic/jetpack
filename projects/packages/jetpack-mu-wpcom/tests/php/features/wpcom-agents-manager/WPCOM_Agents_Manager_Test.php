<?php
/**
 * Tests for the WordPress.com Agents Manager block-editor gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-agents-manager/wpcom-agents-manager.php';

/**
 * Test class for the wpcom-agents-manager feature.
 */
class WPCOM_Agents_Manager_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tear down.
	 */
	public function tear_down() {
		delete_option( 'big_sky_enable' );
		delete_option( 'jetpack_active_plan' );
		$reset_plan_cache = Closure::bind(
			/** @phan-closure-scope \Automattic\Jetpack\Current_Plan */
			static function () {
				// An empty array is a cache miss for Current_Plan::get().
				self::$active_plan_cache = array();
			},
			null,
			Current_Plan::class
		);
		$reset_plan_cache();
		parent::tear_down();
	}

	/**
	 * The feature answers the Agents Manager block-editor filter.
	 */
	public function test_hooks_the_block_editor_filter() {
		$this->assertSame(
			10,
			has_filter( 'agents_manager_enabled_in_block_editor', 'wpcom_agents_manager_enable_in_block_editor' )
		);
	}

	/**
	 * A true from an earlier filter is preserved even when the WordPress Agent is off.
	 */
	public function test_preserves_an_earlier_true() {
		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( true ) );
	}

	/**
	 * Off Simple, without the option WordPress.com writes when the WordPress
	 * Agent is switched on, the filter stays false.
	 */
	public function test_stays_false_without_the_wordpress_agent() {
		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * Off Simple, the option written by WordPress.com decides.
	 */
	public function test_enabled_by_the_option_off_simple() {
		update_option( 'big_sky_enable', '1' );
		Current_Plan::update_from_site_record(
			array(
				'plan' => array(
					'product_slug' => 'jetpack_personal',
					'features'     => array( 'active' => array( 'big-sky' ) ),
				),
			)
		);

		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, the platform's big_sky_is_enabled() decides.
	 *
	 * The stub is evaluated into the global namespace, so the test runs in its
	 * own process. Brain Monkey can't redefine it because the function does not
	 * exist when Patchwork loads.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enabled_when_the_platform_reports_big_sky_enabled() {
		eval( 'function big_sky_is_enabled() { return true; } function big_sky_is_available_for_site() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, the platform saying no wins even though the option defaults to on.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_stays_false_when_the_platform_reports_big_sky_disabled() {
		eval( 'function big_sky_is_enabled() { return false; } function big_sky_is_available_for_site() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, the admin's opt-out option wins over the site-level setting.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_big_sky_enable_option_switches_it_off_on_simple() {
		eval( 'function big_sky_is_enabled() { return true; } function big_sky_is_available_for_site() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		update_option( 'big_sky_enable', '0' );

		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, a site downgraded to Free keeps the Big Sky sticker but has no plan, so the Agent is off.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_stays_false_on_simple_without_a_plan() {
		eval( 'function big_sky_is_enabled() { return true; } function big_sky_is_available_for_site() { return false; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, a plan that grants Big Sky keeps the Agent on.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enabled_on_simple_with_a_plan() {
		eval( 'function big_sky_is_enabled() { return true; } function big_sky_is_available_for_site() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, a legacy Big Sky free-trial site has no plan but keeps the Agent.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enabled_on_simple_for_a_free_trial_site() {
		eval( 'function big_sky_is_enabled() { return true; } function big_sky_is_available_for_site() { return false; } function has_blog_sticker( $sticker ) { return "big-sky-free-trial" === $sticker; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * Off Simple, the option alone is not enough: the site's plan must grant Big Sky.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_stays_false_off_simple_without_a_plan() {
		update_option( 'big_sky_enable', '1' );

		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * Off Simple, the option plus a plan that grants Big Sky keeps the Agent on.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enabled_off_simple_with_a_plan() {
		Current_Plan::update_from_site_record(
			array(
				'plan' => array(
					'product_slug' => 'jetpack_personal',
					'features'     => array( 'active' => array( 'big-sky' ) ),
				),
			)
		);

		update_option( 'big_sky_enable', '1' );

		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( false ) );
	}
}
