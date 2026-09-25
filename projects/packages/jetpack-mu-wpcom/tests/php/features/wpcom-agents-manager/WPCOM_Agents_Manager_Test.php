<?php
/**
 * Tests for the WordPress.com Agents Manager block-editor gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-agents-manager/class-wpcom-agents-manager.php';

/**
 * Test class for WPCOM_Agents_Manager.
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
			has_filter( 'agents_manager_enabled_in_block_editor', array( WPCOM_Agents_Manager::class, 'enable_in_block_editor' ) )
		);
	}

	/**
	 * A true from an earlier filter is preserved even when the WordPress Agent is off.
	 */
	public function test_preserves_an_earlier_true() {
		$this->assertTrue( WPCOM_Agents_Manager::enable_in_block_editor( true ) );
	}

	/**
	 * Without the WordPress Agent on the site, the filter stays false.
	 */
	public function test_stays_false_without_the_wordpress_agent() {
		$this->assertFalse( WPCOM_Agents_Manager::enable_in_block_editor( false ) );
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
		eval( 'namespace { function big_sky_is_enabled() { return true; } }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertTrue( WPCOM_Agents_Manager::enable_in_block_editor( false ) );
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

		eval( 'namespace { function has_blog_sticker( $sticker, $blog_id ) { return "big-sky-enabled" === $sticker; } }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertTrue( WPCOM_Agents_Manager::enable_in_block_editor( false ) );
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
		eval( 'namespace { function big_sky_is_enabled() { return true; } }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		update_option( 'big_sky_enable', 0 );

		$this->assertFalse( WPCOM_Agents_Manager::enable_in_block_editor( false ) );
	}
}
