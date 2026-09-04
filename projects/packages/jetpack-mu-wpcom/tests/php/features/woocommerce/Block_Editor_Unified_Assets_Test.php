<?php
/**
 * Tests for the WooCommerce unified block editor assets rollout.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * Tests the WooCommerce unified block editor assets rollout gate.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Block_Editor_Unified_Assets_Test extends TestCase {

	/**
	 * Set up the Atomic site and blog sticker test doubles.
	 */
	protected function setUp(): void {
		parent::setUp();

		$GLOBALS['jetpack_mu_wpcom_test_atomic_site_id'] = 42;
		$GLOBALS['jetpack_mu_wpcom_test_blog_stickers']  = array();

		require_once __DIR__ . '/../../fixtures/woocommerce-unified-assets-functions.php';
	}

	/**
	 * Clean up test state.
	 */
	protected function tearDown(): void {
		unset(
			$GLOBALS['jetpack_mu_wpcom_test_atomic_site_id'],
			$GLOBALS['jetpack_mu_wpcom_test_blog_stickers']
		);

		parent::tearDown();
	}

	/**
	 * The disable sticker takes precedence over every opt-in path.
	 */
	public function test_disable_sticker_force_disables_feature() {
		$GLOBALS['jetpack_mu_wpcom_test_atomic_site_id'] = 100;
		$GLOBALS['jetpack_mu_wpcom_test_blog_stickers']  = array( 'disable-woocommerce-block-editor-unified-assets' );

		$this->assertSame( 'no', Jetpack_Mu_Wpcom::enable_woocommerce_block_editor_unified_assets( 'yes' ) );
	}

	/**
	 * The enable sticker opts a site in outside the rollout segment.
	 */
	public function test_enable_sticker_force_enables_feature() {
		$GLOBALS['jetpack_mu_wpcom_test_blog_stickers'] = array( 'woocommerce-block-editor-unified-assets' );

		$this->assertSame( 'yes', Jetpack_Mu_Wpcom::enable_woocommerce_block_editor_unified_assets( 'no' ) );
	}

	/**
	 * Atomic site IDs in the first percentile are enrolled.
	 */
	public function test_first_percentile_is_enabled() {
		$GLOBALS['jetpack_mu_wpcom_test_atomic_site_id'] = 200;

		$this->assertSame( 'yes', Jetpack_Mu_Wpcom::enable_woocommerce_block_editor_unified_assets( 'no' ) );
	}

	/**
	 * Sites outside the segment retain the existing option value.
	 */
	public function test_site_outside_segment_retains_option_value() {
		$this->assertSame( 'no', Jetpack_Mu_Wpcom::enable_woocommerce_block_editor_unified_assets( 'no' ) );
		$this->assertSame( 'yes', Jetpack_Mu_Wpcom::enable_woocommerce_block_editor_unified_assets( 'yes' ) );
	}

	/**
	 * A missing Atomic site ID does not enroll the site.
	 */
	public function test_missing_atomic_site_id_retains_option_value() {
		$GLOBALS['jetpack_mu_wpcom_test_atomic_site_id'] = 0;

		$this->assertSame( 'no', Jetpack_Mu_Wpcom::enable_woocommerce_block_editor_unified_assets( 'no' ) );
	}
}
