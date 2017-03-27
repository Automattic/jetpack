<?php
/**
 * Tests for the Jetpack_Sitemap_Buffer class.
 *
 * @package Jetpack
 * @since 4.7.0
 */

require dirname( __FILE__ ) . '/../../../../modules/sitemaps/sitemap-buffer.php';

/**
 * Test class for Jetpack_Sitemap_Buffer.
 *
 * @since 4.7.0
 */
class WP_Test_Jetpack_Sitemap_Buffer extends WP_UnitTestCase {

	/**
	 * Construct a new buffer.
	 *
	 * @covers Jetpack_Sitemap_Buffer::__construct
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_constructor() {
		$buffer = new Jetpack_Sitemap_Buffer( 1, 10, 'hello', 'world', '1970-01-01 00:00:00' );
		$this->assertEquals( $buffer->contents(), 'helloworld' );
	}

	/**
	 * Construct a new buffer with empty header and footer.
	 *
	 * @covers Jetpack_Sitemap_Buffer::__contents
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_empty() {
		$buffer = new Jetpack_Sitemap_Buffer( 1, 10, '', '', '1970-01-01 00:00:00' );
		$this->assertEquals( $buffer->contents(), '' );
	}

	/**
	 * Add items to a buffer.
	 *
	 * @covers Jetpack_Sitemap_Buffer::try_to_add_item
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_try_to_add_item() {
		$buffer = new Jetpack_Sitemap_Buffer( 2, 16, '(', ')', '1970-01-01 00:00:00' );
		$buffer->try_to_add_item( 'foo' );
		$buffer->try_to_add_item( 'bar' );
		$this->assertEquals( $buffer->contents(), '(foobar)' );
	}

	/**
	 * New buffer is empty; buffer with items is not empty.
	 *
	 * @covers Jetpack_Sitemap_Buffer::is_empty()
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_is_empty() {
		$buffer = new Jetpack_Sitemap_Buffer( 2, 16, '(', ')', '1970-01-01 00:00:00' );
		$this->assertTrue( $buffer->is_empty() );
		$buffer->try_to_add_item( 'foo' );
		$this->assertFalse( $buffer->is_empty() );
	}

	/**
	 * Try to add an item to a buffer at item capacity.
	 *
	 * @covers Jetpack_Sitemap_Buffer::try_to_add_item
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_add_item_at_item_capacity() {
		$buffer = new Jetpack_Sitemap_Buffer( 1, 16, '(', ')', '1970-01-01 00:00:00' );
		$buffer->try_to_add_item( 'foo' );
		$buffer->try_to_add_item( 'bar' );
		$this->assertEquals( $buffer->contents(), '(foo)' );
	}

	/**
	 * Try to add an item to a buffer at byte capacity.
	 *
	 * @covers Jetpack_Sitemap_Buffer::try_to_add_item
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_add_item_at_byte_capacity() {
		$buffer = new Jetpack_Sitemap_Buffer( 1, 16, '(', ')', '1970-01-01 00:00:00' );
		$buffer->try_to_add_item( 'foobarbazxyzzy' );
		$buffer->try_to_add_item( 'quux' );
		$this->assertEquals( $buffer->contents(), '(foobarbazxyzzy)' );
	}

	/**
	 * Try to add an item to a buffer which is below byte capacity, but item is too large.
	 *
	 * @covers Jetpack_Sitemap_Buffer::try_to_add_item
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_add_item_below_byte_capacity() {
		$buffer = new Jetpack_Sitemap_Buffer( 1, 16, '(', ')', '1970-01-01 00:00:00' );
		$buffer->try_to_add_item( 'foobarbazquux' );
		$buffer->try_to_add_item( 'crunchly' );
		$this->assertEquals( $buffer->contents(), '(foobarbazquux)' );
	}

	/**
	 * Buffer at item capacity is full.
	 *
	 * @covers Jetpack_Sitemap_Buffer::is_full
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_is_full_item_capacity() {
		$buffer = new Jetpack_Sitemap_Buffer( 2, 16, '(', ')', '1970-01-01 00:00:00' );
		$buffer->try_to_add_item( 'foo' );
		$this->assertEquals( $buffer->is_full(), false );
		$buffer->try_to_add_item( 'bar' );
		$this->assertEquals( $buffer->is_full(), false );
		$buffer->try_to_add_item( 'baz' );
		$this->assertEquals( $buffer->is_full(), true );
	}

	/**
	 * Buffer at byte capacity is full.
	 *
	 * @covers Jetpack_Sitemap_Buffer::is_full
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_is_full_byte_capacity() {
		$buffer = new Jetpack_Sitemap_Buffer( 10, 8, '(', ')', '1970-01-01 00:00:00' );
		$buffer->try_to_add_item( 'foo' );
		$this->assertEquals( $buffer->is_full(), false );
		$buffer->try_to_add_item( 'bar' );
		$this->assertEquals( $buffer->is_full(), false );
		$buffer->try_to_add_item( 'baz' );
		$this->assertEquals( $buffer->is_full(), true );
	}

	/**
	 * Last modified time is given by constructor if we don't view any new times.
	 *
	 * @covers Jetpack_Sitemap_Buffer::last_modified
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_last_modified() {
		$buffer = new Jetpack_Sitemap_Buffer( 2, 16, '(', ')', '1970-01-01 00:00:00' );
		$this->assertEquals( $buffer->last_modified(), '1970-01-01 00:00:00' );
	}

	/**
	 * Last modified time updates if we view a more recent time.
	 *
	 * @covers Jetpack_Sitemap_Buffer::view_time
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_view_time_update() {
		$buffer = new Jetpack_Sitemap_Buffer( 2, 16, '(', ')', '1970-01-01 00:00:00' );
		$buffer->view_time( '1971-01-01 00:00:00' );
		$this->assertEquals( $buffer->last_modified(), '1971-01-01 00:00:00' );
	}

	/**
	 * Last modified time does not update if we view a less recent time.
	 *
	 * @covers Jetpack_Sitemap_Buffer::view_time
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_view_time_do_not_update() {
		$buffer = new Jetpack_Sitemap_Buffer( 2, 16, '(', ')', '1971-01-01 00:00:00' );
		$buffer->view_time( '1970-01-01 00:00:00' );
		$this->assertEquals( $buffer->last_modified(), '1971-01-01 00:00:00' );
	}

	/**
	 * Test array_to_xml_string on a simple array; no nesting, no attributes.
	 *
	 * @covers Jetpack_Sitemap_Buffer::array_to_xml_string
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_array_to_xml_string() {
		$array = array(
			'foo' => 'bar',
		);

		$xml = <<<XML
<foo>bar</foo>\n
XML;

		$this->assertEquals(
			$xml,
			Jetpack_Sitemap_Buffer::array_to_xml_string( $array )
		);
	}

	/**
	 * Test array_to_xml_string with an attribute.
	 *
	 * @covers Jetpack_Sitemap_Buffer::array_to_xml_string
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_array_to_xml_string_with_attribute() {
		$array = array(
			'foo src="baz"' => 'bar',
		);

		$xml = <<<XML
<foo src=&quot;baz&quot;>bar</foo>\n
XML;

		$this->assertEquals(
			$xml,
			Jetpack_Sitemap_Buffer::array_to_xml_string( $array )
		);
	}

	/**
	 * Test array_to_xml_string with an empty array.
	 *
	 * @covers Jetpack_Sitemap_Buffer::array_to_xml_string
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_array_to_xml_string_empty_array() {
		$array = array();

		$xml = '';

		$this->assertEquals(
			$xml,
			Jetpack_Sitemap_Buffer::array_to_xml_string( $array )
		);
	}

	/**
	 * Test array_to_xml_string with a nested array.
	 *
	 * @covers Jetpack_Sitemap_Buffer::array_to_xml_string
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_array_to_xml_string_nested_array() {
		$array = array(
			'foo' => array(
				'baz' => 'baz',
				'qux' => array(
					'xyzzy' => 'xyzzy',
				),
			),
			'bar' => array(
				'crunch' => 'crunch',
				'munch'  => null,
			),
		);

		$xml = <<<XML
<foo>
  <baz>baz</baz>
  <qux>
    <xyzzy>xyzzy</xyzzy>
  </qux>
</foo>
<bar>
  <crunch>crunch</crunch>
  <munch />
</bar>\n
XML;

		$this->assertEquals(
			$xml,
			Jetpack_Sitemap_Buffer::array_to_xml_string( $array )
		);
	}
}
