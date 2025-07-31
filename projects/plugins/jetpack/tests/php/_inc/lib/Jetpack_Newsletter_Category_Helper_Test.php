<?php
/**
 * Newsletter Category Helper unit tests.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-newsletter-category-helper.php';

/**
 * Class for testing the Jetpack_Newsletter_Category_Helper class.
 *
 * @covers \Jetpack_Newsletter_Category_Helper
 */
#[CoversClass( Jetpack_Newsletter_Category_Helper::class )]
class Jetpack_Newsletter_Category_Helper_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( 'wpcom_newsletter_categories' );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		delete_option( 'wpcom_newsletter_categories' );
		parent::tear_down();
	}

	/**
	 * Test get_category_ids() returns empty array when option doesn't exist.
	 */
	public function test_get_category_ids_no_option() {
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( array(), $result );
	}

	/**
	 * Test get_category_ids() returns empty array when option is empty.
	 */
	public function test_get_category_ids_empty_option() {
		update_option( 'wpcom_newsletter_categories', array() );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( array(), $result );
	}

	/**
	 * Test get_category_ids() returns empty array when option is not an array.
	 */
	public function test_get_category_ids_invalid_option() {
		update_option( 'wpcom_newsletter_categories', 'not-an-array' );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( array(), $result );
	}

	/**
	 * Test get_category_ids() handles array of integers format.
	 */
	public function test_get_category_ids_integer_array() {
		$categories = array( 123, 456, 789 );
		update_option( 'wpcom_newsletter_categories', $categories );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( $categories, $result );
	}

	/**
	 * Test get_category_ids() handles array of arrays with term_id format.
	 */
	public function test_get_category_ids_term_id_array() {
		$categories = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 456 ),
			array( 'term_id' => 789 ),
		);
		update_option( 'wpcom_newsletter_categories', $categories );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( array( 123, 456, 789 ), $result );
	}

	/**
	 * Test get_category_ids() filters out non-numeric term_ids.
	 */
	public function test_get_category_ids_filters_invalid_term_ids() {
		$categories = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 'not-a-number' ),
			array( 'term_id' => 456 ),
		);
		update_option( 'wpcom_newsletter_categories', $categories );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( array( 123, 456 ), $result );
	}

	/**
	 * Test get_category_ids() handles serialized data.
	 */
	public function test_get_category_ids_serialized_data() {
		$categories = array( 123, 456 );
		update_option( 'wpcom_newsletter_categories', serialize( $categories ) );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( $categories, $result );
	}

	/**
	 * Test save_category_ids() returns false for empty array.
	 */
	public function test_save_category_ids_empty_array() {
		$result = Jetpack_Newsletter_Category_Helper::save_category_ids( array() );
		$this->assertFalse( $result );
	}

	/**
	 * Test save_category_ids() formats array of integers correctly.
	 */
	public function test_save_category_ids_integer_array() {
		$input    = array( 123, 456, 789 );
		$expected = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 456 ),
			array( 'term_id' => 789 ),
		);
		$result   = Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$this->assertEquals( $expected, $result );

		$saved_option = get_option( 'wpcom_newsletter_categories' );
		$this->assertEquals( $expected, $saved_option );
	}

	/**
	 * Test save_category_ids() handles string numeric values.
	 */
	public function test_save_category_ids_string_numeric() {
		$input    = array( '123', '456', '789' );
		$expected = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 456 ),
			array( 'term_id' => 789 ),
		);
		$result   = Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test save_category_ids() filters out non-numeric values.
	 */
	public function test_save_category_ids_filters_non_numeric() {
		$input    = array( 123, 'not-a-number', 456 );
		$expected = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 456 ),
		);
		$result   = Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test save_category_ids() handles array of arrays with term_id.
	 */
	public function test_save_category_ids_term_id_array() {
		$input = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 456 ),
			array( 'term_id' => 789 ),
		);

		$result = Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$this->assertEquals( $input, $result );
	}

	/**
	 * Test save_category_ids() returns false when no valid categories.
	 */
	public function test_save_category_ids_no_valid_categories() {
		$input  = array( 'not-a-number', 'also-not-a-number' );
		$result = Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$this->assertFalse( $result );
	}

	/**
	 * Test integration between save and get methods.
	 */
	public function test_save_and_get_integration() {
		$input = array( 123, 456, 789 );
		Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( $input, $result );
	}
}
