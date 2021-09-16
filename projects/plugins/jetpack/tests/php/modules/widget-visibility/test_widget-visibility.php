<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase

require_jetpack_file( 'modules/widget-visibility/widget-conditions.php' );

/**
 * Test class for Jetpack_Widget_Conditions (widget visibility)
 *
 * To run: jetpack docker phpunit -- --filter=widget
 *
 * @covers Jetpack_Widget_Conditions
 */
class WP_Test_Jetpack_Widget_Conditions extends WP_UnitTestCase {
	/**
	 * Verifies that recursively_filter_blocks makes no changes to blocks with
	 * no rules, or all rules that pass.
	 *
	 * Creates a simple paragraph block, then runs it through
	 * recursively_filter_blocks() with (1) no rules, then (2) rule for "show
	 * if logged out", which always passes in a unit test context.
	 *
	 * Expects to see the same paragraph block.
	 *
	 * @covers Jetpack_Widget_Conditions::recursively_filter_blocks
	 */
	public function test_rfb_no_change_flat() {
		// Rule for "Display only when logged out" (Will pass during unit tests).
		$logged_out_attrs = array(
			'conditions' => array(
				'action'    => 'show',
				'rules'     => array(
					array(
						'major' => 'loggedin',
						'minor' => 'loggedout',
					),
				),
				'match_all' => '1',
			),
		);
		$attrs_to_test    = array(
			null,             // "No Rules" - no filtering will happen
			$logged_out_attrs, // "Display only when logged out" - Tests run as logged out, so no filtering will happen
		);

		foreach ( $attrs_to_test as $attrs ) {
			$blocks_before = array(
				array(
					'blockName'    => 'core/paragraph',
					'innerBlocks'  => array(),
					'innerHtml'    => '<p>hi</p>',
					'innerContent' => array( '<p>hi</p>' ),
				),
			);
			// Add rule if we have one.
			if ( ! empty( $attrs ) ) {
				$blocks_before[0]['attrs'] = $attrs;
			}
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize,WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
			$blocks_before_snapshot = unserialize( serialize( $blocks_before ) );

			$return_val      = Jetpack_Widget_Conditions::recursively_filter_blocks( $blocks_before );
			$blocks_after    = $return_val[0];
			$indexes_removed = $return_val[1];

			$this->assertSame( $blocks_before_snapshot, $blocks_after );
			$this->assertSame( $indexes_removed, array() );
		}
	}

	/**
	 * Verifies that recursively_filter_blocks makes no changes to blocks with
	 * no rules, or all rules that pass, when run recursively.
	 *
	 * Creates a column block, which each column including a paragraph block.
	 * Then we test two times:
	 *   (1) No rules added.
	 *   (2) Rule "Show only when logged out" to all three blocks.
	 *
	 * Expects to see no changes passed to the blocks.
	 *
	 * @covers Jetpack_Widget_Conditions::recursively_filter_blocks
	 */
	public function test_rfb_no_change_recursive() {
		// Rule for "Display only when logged out" (Will pass during unit tests).
		$logged_out_attrs = array(
			'conditions' => array(
				'action'    => 'show',
				'rules'     => array(
					array(
						'major' => 'loggedin',
						'minor' => 'loggedout',
					),
				),
				'match_all' => '1',
			),
		);
		$attrs_to_test    = array(
			null,             // "No Rules" - no filtering will happen
			$logged_out_attrs, // "Display only when logged out" - Tests run as logged out, so no filtering will happen
		);

		foreach ( $attrs_to_test as $attrs ) {
			$paragraph_block = array(
				'blockName'    => 'core/paragraph',
				'innerBlocks'  => array(),
				'innerHtml'    => '<p>hi</p>',
				'innerContent' => array( '<p>hi</p>' ),
			);
			// Add rule if we have one.
			if ( ! empty( $attrs ) ) {
				$paragraph_block['attrs'] = $attrs;
			}
			$blocks_before = array(
				0 => array(
					'blockName'    => 'core/columns',
					'innerBlocks'  => array( $paragraph_block, $paragraph_block ),
					'innerHtml'    => '<div class="wp-block-columns"></div>',
					'innerContent' => array( '<div class="wp-block-columns">', null, "\n\n", null, '</div>' ),
				),
			);
			// Add rule if we have one.
			if ( ! empty( $attrs ) ) {
				$blocks_before[0]['attrs'] = $attrs;
			}
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize,WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
			$blocks_before_snapshot = unserialize( serialize( $blocks_before ) );

			$return_val      = Jetpack_Widget_Conditions::recursively_filter_blocks( $blocks_before );
			$blocks_after    = $return_val[0];
			$indexes_removed = $return_val[1];

			$this->assertSame( $blocks_before_snapshot, $blocks_after );
			$this->assertSame( $indexes_removed, array() );
		}
	}

	/**
	 * Verifies that recursively_filter_blocks removes blocks failing
	 * visibility condition checks.
	 *
	 * Creates three paragraph blocks, the middle one with a "Show only
	 * when logged in" rule. That one should be removed after running through
	 * recursively_filter_blocks().
	 *
	 * @covers Jetpack_Widget_Conditions::recursively_filter_blocks
	 */
	public function test_rfb_filter_flat() {
		// Rule for "Display only when logged in" (Will fail during unit tests).
		$logged_in_attrs = array(
			'conditions' => array(
				'action'    => 'show',
				'rules'     => array(
					array(
						'major' => 'loggedin',
						'minor' => 'loggedin',
					),
				),
				'match_all' => '1',
			),
		);

		$blocks_before = array(
			array(
				'blockName'    => 'core/paragraph',
				'innerBlocks'  => array(),
				'innerHtml'    => '<p>hi</p>',
				'innerContent' => array( '<p>hi</p>' ),
			),
			array(
				'blockName'    => 'core/paragraph',
				'innerBlocks'  => array(),
				'innerHtml'    => '<p>bye</p>',
				'innerContent' => array( '<p>bye</p>' ),
				'attrs'        => $logged_in_attrs,
			),
			array(
				'blockName'    => 'core/paragraph',
				'innerBlocks'  => array(),
				'innerHtml'    => '<p>hi</p>',
				'innerContent' => array( '<p>hi</p>' ),
			),
		);

		$return_val      = Jetpack_Widget_Conditions::recursively_filter_blocks( $blocks_before );
		$blocks_after    = $return_val[0];
		$indexes_removed = $return_val[1];

		// Expect to see: Middle block removed. Indexes removed = [1].
		$blocks_expected          = array(
			0 => array(
				'blockName'    => 'core/paragraph',
				'innerBlocks'  => array(),
				'innerHtml'    => '<p>hi</p>',
				'innerContent' => array( '<p>hi</p>' ),
			),
			2 => array(
				'blockName'    => 'core/paragraph',
				'innerBlocks'  => array(),
				'innerHtml'    => '<p>hi</p>',
				'innerContent' => array( '<p>hi</p>' ),
			),
		);
		$indexes_removed_expected = array( 1 );

		$this->assertSame( $blocks_after, $blocks_expected );
		$this->assertSame( $indexes_removed, $indexes_removed_expected );
	}

	/**
	 * Verifies that recursively_filter_blocks removes blocks failing
	 * visibility condition checks.
	 *
	 * Creates a paragraph block, a column block containing 4 paragraph blocks,
	 * and another paragraph block.
	 *
	 * Some of the paragraph blocks have a "Show only when logged in" rule attached.
	 * Those should be hidden.
	 *
	 * Additionally, when child blocks are removed from the column's
	 * `innerBlocks`, corresponding nulls from the column's `innerContent` are
	 * removed.  Each null is code for "grab the content from the next
	 * innerBlock". If there are 4 nulls in innerContent, but only 2 blocks in
	 * innerBlocks, the renderer will crash. So everytime we remove an
	 * innerBlock, we also need to remove a null from innerContent.
	 *
	 * @covers Jetpack_Widget_Conditions::recursively_filter_blocks
	 */
	public function test_rfb_filter_recursive() {
		// Rule for "Display only when logged in" (Will fail during unit tests).
		$logged_in_attrs = array(
			'conditions' => array(
				'action'    => 'show',
				'rules'     => array(
					array(
						'major' => 'loggedin',
						'minor' => 'loggedin',
					),
				),
				'match_all' => '1',
			),
		);

		$paragraph_block      = array(
			'blockName'    => 'core/paragraph',
			'innerBlocks'  => array(),
			'innerHtml'    => '<p>hi</p>',
			'innerContent' => array( '<p>hi</p>' ),
		);
		$paragraph_block_hide = array(
			'blockName'    => 'core/paragraph',
			'innerBlocks'  => array(),
			'innerHtml'    => '<p>hi</p>',
			'innerContent' => array( '<p>hi</p>' ),
			'attrs'        => $logged_in_attrs,
		);
		$blocks_before        = array(
			0 => $paragraph_block_hide,
			1 => array(
				'blockName'    => 'core/columns',
				'innerBlocks'  => array( $paragraph_block, $paragraph_block_hide, $paragraph_block, $paragraph_block_hide ),
				'innerHtml'    => '<div class="wp-block-columns"></div>',
				'innerContent' => array( '<div class="wp-block-columns">', null, 'after 1 before 2', null, 'after 2 before 3', null, 'after 3 before 4', null, '</div>' ),
			),
			2 => $paragraph_block,
		);

		$return_val      = Jetpack_Widget_Conditions::recursively_filter_blocks( $blocks_before );
		$blocks_after    = $return_val[0];
		$indexes_removed = $return_val[1];

		// Expect to see:
		// Outer level: First paragaph block removed.
		// Inner level: 1 => innerBlocks => The $paragraph_block_hides are removed.
		// Inner Level: 1 => innerContent => 2 of the four nulls are removed,
		// corresponding to the $paragraph_block_hides that were removed. The first and third null should remain.
		$blocks_expected          = array(
			1 => array(
				'blockName'    => 'core/columns',
				'innerBlocks'  => array(
					0 => $paragraph_block,
					2 => $paragraph_block,
				),
				'innerHtml'    => '<div class="wp-block-columns"></div>',
				'innerContent' => array( '<div class="wp-block-columns">', null, 'after 1 before 2', 'after 2 before 3', null, 'after 3 before 4', '</div>' ),
			),
			2 => $paragraph_block,
		);
		$indexes_removed_expected = array( 0 );

		$this->assertSame( $blocks_after, $blocks_expected );
		$this->assertSame( $indexes_removed, $indexes_removed_expected );
	}
}
