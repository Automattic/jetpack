<?php
/**
 * Code Block test file
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Code_Block;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::BASE_DIR . 'features/wpcom-blocks/code/class-code-block.php';

/**
 * Class Code_Block_Test
 */
class Code_Block_Test extends \WorDBless\BaseTestCase {
	/**
	 * Test that `register_block_type_args` returns false when passed false,
	 * instead of crashing with a TypeError.
	 *
	 * The WordPress `register_block_type_args` filter can legitimately pass
	 * false to cancel block registration. Our filter callback must not crash.
	 */
	public function test_register_block_type_args_passes_through_false() {
		$result = Code_Block::register_block_type_args( false, 'woocommerce/cart' );
		$this->assertFalse( $result );
	}

	/**
	 * Test that `register_block_type_args` returns false when passed false
	 * even for the core/code block type.
	 */
	public function test_register_block_type_args_passes_through_false_for_core_code() {
		$result = Code_Block::register_block_type_args( false, 'core/code' );
		$this->assertFalse( $result );
	}

	/**
	 * Test that `register_block_type_args` returns the array unchanged for
	 * non-core/code block types.
	 */
	public function test_register_block_type_args_returns_array_unchanged_for_other_blocks() {
		$args   = array( 'render_callback' => null );
		$result = Code_Block::register_block_type_args( $args, 'core/paragraph' );
		$this->assertSame( $args, $result );
	}
}
