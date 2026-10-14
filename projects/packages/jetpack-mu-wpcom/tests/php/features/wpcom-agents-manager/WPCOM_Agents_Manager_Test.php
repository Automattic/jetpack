<?php
/**
 * Tests for the WordPress.com Agents Manager block-editor gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

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
		eval( 'function big_sky_is_enabled() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

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
		eval( 'function big_sky_is_enabled() { return false; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

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
		eval( 'function big_sky_is_enabled() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		update_option( 'big_sky_enable', '0' );

		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}
}
