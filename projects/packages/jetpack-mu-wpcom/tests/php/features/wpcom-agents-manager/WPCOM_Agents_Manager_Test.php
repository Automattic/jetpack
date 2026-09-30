<?php
/**
 * Tests for the WordPress.com Agents Manager gates.
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
		remove_filter( 'agents_manager_should_load', '__return_true' );
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
	 * Without the WordPress Agent on the site, the filter stays false.
	 */
	public function test_stays_false_without_the_wordpress_agent() {
		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
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
	 * Off Simple, the big-sky-enabled blog sticker decides.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enabled_by_the_big_sky_enabled_sticker() {
		if ( ! defined( 'IS_WPCOM' ) ) {
			define( 'IS_WPCOM', true );
		}

		eval( 'function has_blog_sticker( $sticker, $blog_id ) { return "big-sky-enabled" === $sticker; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * The plugin's own opt-out option wins over the site-level setting.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_big_sky_enable_option_switches_it_off() {
		eval( 'function big_sky_is_enabled() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		update_option( 'big_sky_enable', 0 );

		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * The feature asks for the shell when the Dashboard loads.
	 */
	public function test_hooks_the_dashboard_load_action() {
		$this->assertSame( 10, has_action( 'load-index.php', 'wpcom_agents_manager_load_on_dashboard' ) );
	}

	/**
	 * Without the WordPress Agent on the site, the Dashboard does not request the shell.
	 */
	public function test_dashboard_stays_off_without_the_wordpress_agent() {
		wpcom_agents_manager_load_on_dashboard();

		$this->assertFalse( apply_filters( 'agents_manager_should_load', false ) );
	}

	/**
	 * With the WordPress Agent on the site, the Dashboard requests the shell.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_dashboard_requests_the_shell_with_the_wordpress_agent() {
		eval( 'function big_sky_is_enabled() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		wpcom_agents_manager_load_on_dashboard();

		$this->assertTrue( apply_filters( 'agents_manager_should_load', false ) );
	}
}
