<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Test methods from Automattic\Jetpack\Blocks
 *
 * @since 9.0.0
 *
 * @package automattic/jetpack-blocks
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Blocks;
use PHPUnit\Framework\TestCase;

/**
 * Class Test_Blocks
 */
class Test_Blocks extends TestCase {
	/**
	 * Test the different inputs and matching output for Classes.
	 *
	 * @since 9.0.0
	 *
	 * @covers Automattic\Jetpack\Blocks::classes
	 */
	public function test_block_classes() {
		$block_name = 'foo';
		$attr       = array(
			'bar'       => 'baz',
			'align'     => 'wide',
			'className' => 'editorclass',
		);
		$extra      = array( 'extraclass' );

		$block_classes = Blocks::classes( $block_name, $attr, $extra );

		$this->assertContains( 'wp-block-jetpack-foo', $block_classes ); // a general class is created from the block name.
		$this->assertNotContains( 'bar', $block_classes ); // The extra 'bar' attribute should be dropped.
		$this->assertNotContains( 'baz', $block_classes ); // The extra 'baz' attribute should be dropped.
		$this->assertNotContains( 'align ', $block_classes ); // The align attribute should only be used to create a new attribute.
		$this->assertNotContains( 'className', $block_classes ); // The className attribute should be dropped, only the editorclass value should remain.
		$this->assertContains( 'alignwide', $block_classes ); // an alignment class is created.
		$this->assertContains( 'editorclass', $block_classes ); // className classes are passed.
		$this->assertContains( 'extraclass', $block_classes ); // Extra class remains.
	}

	/**
	 * Test whether we can detect an AMP view.
	 *
	 * @since 9.0.0
	 *
	 * @covers Automattic\Jetpack\Blocks::is_amp_request
	 */
	public function test_is_amp_request() {
		add_filter( 'jetpack_is_amp_request', '__return_true' );

		$this->assertTrue( Blocks::is_amp_request() );

		remove_filter( 'jetpack_is_amp_request', '__return_true' );
	}

	/**
	 * Test whether we can detect an AMP view.
	 *
	 * @since 9.0.0
	 *
	 * @covers Automattic\Jetpack\Blocks::is_amp_request
	 */
	public function test_is_not_amp_request() {
		$this->assertFalse( Blocks::is_amp_request() );
	}
}
