<?php
/**
 * Unit Tests for Contact_Form_Block.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Extensions\Contact_Form\Contact_Form_Block;
use WorDBless\BaseTestCase;
use WP_Block;
use WP_Block_Type_Registry;

/**
 * Test class for Contact_Form_Block
 *
 * @covers \Automattic\Jetpack\Extensions\Contact_Form\Contact_Form_Block
 */
class Contact_Form_Block_Test extends BaseTestCase {
	/**
	 * Test that ::find_nested_html_block works correctly.
	 */
	public function test_find_nested_html_block() {
		$block = array(
			'blockName'   => 'core/html',
			'attrs'       => array(),
			'innerBlocks' => array(),
		);

		$parent_block = array(
			'blockName' => 'jetpack/contact-form',
		);

		$expected_block = array_merge( $block, array( 'hasJPFormParent' => true ) );

		$this->assertEquals( $expected_block, Contact_Form_Block::find_nested_html_block( $block, array(), new WP_Block( $parent_block ) ) );
	}

	/**
	 * Test that we're registering inner block types via ::register_child_blocks.
	 *
	 * @dataProvider data_provider_test_register_child_blocks
	 */
	public function test_register_child_blocks( $block_name ) {
		Contact_Form_Block::register_child_blocks();
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $block_name );
		// @TODO should we also test supports?
		$this->assertNotNull( $block_type );
	}

	/**
	 * Data provider for test_register_child_blocks.
	 */
	public static function data_provider_test_register_child_blocks() {
		return array(
			'jetpack/input'   => array(
				'jetpack/input',
			),
			'jetpack/label'   => array(
				'jetpack/label',
			),
			'jetpack/options' => array(
				'jetpack/options',
			),
			'jetpack/option'  => array(
				'jetpack/option',
			),
		);
	}
}
