<?php
/**
 * Tests for the WooCommerce unified block editor assets sticker controls.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * Tests the WooCommerce unified block editor assets sticker controls.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Block_Editor_Unified_Assets_Test extends TestCase {

	/**
	 * Set up the blog sticker test double.
	 */
	protected function setUp(): void {
		parent::setUp();

		$GLOBALS['jetpack_mu_wpcom_test_blog_stickers'] = array();

		require_once __DIR__ . '/../../fixtures/woocommerce-unified-assets-functions.php';
	}

	/**
	 * Clean up test state.
	 */
	protected function tearDown(): void {
		unset( $GLOBALS['jetpack_mu_wpcom_test_blog_stickers'] );

		parent::tearDown();
	}

	/**
	 * The disable sticker takes precedence over every opt-in path.
	 */
	public function test_disable_sticker_force_disables_feature() {
		$GLOBALS['jetpack_mu_wpcom_test_blog_stickers'] = array( 'disable-woocommerce-block-editor-unified-assets' );

		$this->assertSame( 'no', Jetpack_Mu_Wpcom::enable_woocommerce_block_editor_unified_assets( 'yes' ) );
	}

	/**
	 * The enable sticker opts a site in.
	 */
	public function test_enable_sticker_force_enables_feature() {
		$GLOBALS['jetpack_mu_wpcom_test_blog_stickers'] = array( 'woocommerce-block-editor-unified-assets' );

		$this->assertSame( 'yes', Jetpack_Mu_Wpcom::enable_woocommerce_block_editor_unified_assets( 'no' ) );
	}

	/**
	 * Without stickers, the existing option value is retained.
	 */
	public function test_without_stickers_retains_option_value() {
		$this->assertSame( 'no', Jetpack_Mu_Wpcom::enable_woocommerce_block_editor_unified_assets( 'no' ) );
		$this->assertSame( 'yes', Jetpack_Mu_Wpcom::enable_woocommerce_block_editor_unified_assets( 'yes' ) );
	}
}
