<?php
/**
 * Gutenberg RTC Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/gutenberg-rtc/gutenberg-rtc.php';

/**
 * Tests for Gutenberg RTC feature.
 *
 * @covers ::wpcom_enqueue_gutenberg_rtc_assets
 * @covers ::is_eligible_for_gutenberg_rtc
 */
#[CoversFunction( 'wpcom_enqueue_gutenberg_rtc_assets' )]
#[CoversFunction( 'is_eligible_for_gutenberg_rtc' )]
class Gutenberg_RTC_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tests whether the gutenberg-rtc assets enqueue function is hooked correctly.
	 */
	public function test_wpcom_enqueue_gutenberg_rtc_assets_hooked() {
		$this->assertSame( 10, has_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_gutenberg_rtc_assets' ) );
	}

	/**
	 * Returns false when fewer than 2 users have edit_posts capability.
	 */
	public function test_not_eligible_with_one_editor() {
		Functions\when( 'wpcom_gutenberg_rtc_has_multiple_editors' )->justReturn( false );

		$this->assertFalse( is_eligible_for_gutenberg_rtc() );
	}

	/**
	 * Returns false with 2+ editors but not on an Atomic or Simple site.
	 */
	public function test_not_eligible_on_non_wpcom_non_atomic_site() {
		Functions\when( 'wpcom_gutenberg_rtc_has_multiple_editors' )->justReturn( true );

		$this->assertFalse( is_eligible_for_gutenberg_rtc() );
	}

	/**
	 * Returns true on Atomic with 2+ users with edit_posts capability.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_eligible_on_atomic_with_two_editors() {
		define( 'IS_ATOMIC', true );
		Functions\when( 'wpcom_gutenberg_rtc_has_multiple_editors' )->justReturn( true );

		$this->assertTrue( is_eligible_for_gutenberg_rtc() );
	}

	/**
	 * Returns true on Simple site with Business plan and 2+ users with edit_posts capability.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_eligible_on_simple_with_business_plan_and_two_editors() {
		define( 'IS_WPCOM', true );
		Functions\when( 'wpcom_gutenberg_rtc_has_multiple_editors' )->justReturn( true );
		Functions\when( 'wpcom_gutenberg_rtc_is_wpcom_business_plan' )->justReturn( true );

		$this->assertTrue( is_eligible_for_gutenberg_rtc() );
	}

	/**
	 * Returns false on Simple site without Business plan, even with 2+ editors.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_not_eligible_on_simple_without_business_plan() {
		define( 'IS_WPCOM', true );
		Functions\when( 'wpcom_gutenberg_rtc_has_multiple_editors' )->justReturn( true );
		Functions\when( 'wpcom_gutenberg_rtc_is_wpcom_business_plan' )->justReturn( false );

		$this->assertFalse( is_eligible_for_gutenberg_rtc() );
	}
}
