<?php
/**
 * Tests for the Jetpack_Sitemap_Buffer class.
 *
 * @package automattic/jetpack
 * @since 4.7.0
 *
 * phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

require_jetpack_file( 'modules/sitemaps/sitemap-constants.php' );
require_jetpack_file( 'modules/sitemaps/sitemap-buffer.php' );
require_jetpack_file( 'modules/sitemaps/sitemap-buffer-fallback.php' );

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
		$buffer = new Jetpack_Sitemap_Buffer_Dummy( 1, 10, '1970-01-01 00:00:00' );
		$this->assertEquals(
			'<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL
			. '<dummy/>' . PHP_EOL,
			$buffer->contents()
		);
	}

	/**
	 * Add items to a buffer.
	 *
	 * @covers Jetpack_Sitemap_Buffer::append
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_append() {
		$buffer = new Jetpack_Sitemap_Buffer_Dummy( 2, 128, '1970-01-01 00:00:00' );
		$buffer->append( 'foo' );
		$buffer->append( 'bar' );
		$this->assertEquals(
			$buffer->contents(),
			'<?xml version="1.0" encoding="UTF-8"?>'
			. PHP_EOL
			. '<dummy>foobar</dummy>'
			. PHP_EOL
		);
	}

	/**
	 * New buffer is empty; buffer with items is not empty.
	 *
	 * @covers Jetpack_Sitemap_Buffer::is_empty()
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_is_empty() {
		$buffer = new Jetpack_Sitemap_Buffer_Dummy( 2, 64, '1970-01-01 00:00:00' );
		$this->assertTrue( $buffer->is_empty() );
		$buffer->append( 'foo' );
		$this->assertFalse( $buffer->is_empty() );
	}

	/**
	 * Try to add an item to a buffer at item capacity.
	 *
	 * @covers Jetpack_Sitemap_Buffer::append
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_add_item_at_item_capacity() {
		$buffer = new Jetpack_Sitemap_Buffer_Dummy( 1, 48, '1970-01-01 00:00:00' );
		$buffer->append( 'foo' );
		$buffer->append( 'bar' );
		$this->assertEquals(
			$buffer->contents(),
			'<?xml version="1.0" encoding="UTF-8"?>'
			. PHP_EOL
			. '<dummy>foo</dummy>'
			. PHP_EOL
		);
	}

	/**
	 * Try to add an item to a buffer at byte capacity.
	 *
	 * @covers Jetpack_Sitemap_Buffer::append
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_add_item_at_byte_capacity() {
		$buffer = new Jetpack_Sitemap_Buffer_Dummy( 100, 48, '1970-01-01 00:00:00' );
		$buffer->append( 'foobarbazxyzzy' );
		$buffer->append( 'quux' );
		$this->assertEquals(
			$buffer->contents(),
			'<?xml version="1.0" encoding="UTF-8"?>'
			. PHP_EOL
			. '<dummy>foobarbazxyzzy</dummy>'
			. PHP_EOL
		);
	}

	/**
	 * Try to add an item to a buffer which is below byte capacity, but item is too large.
	 *
	 * @covers Jetpack_Sitemap_Buffer::append
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_add_item_below_byte_capacity() {
		$buffer = new Jetpack_Sitemap_Buffer_Dummy( 1, 48, '(', ')', '1970-01-01 00:00:00' );
		$buffer->append( 'foobarbazquux' );
		$buffer->append( 'crunchly' );
		$this->assertEquals(
			$buffer->contents(),
			'<?xml version="1.0" encoding="UTF-8"?>'
			. PHP_EOL
			. '<dummy>foobarbazquux</dummy>'
			. PHP_EOL
		);
	}

	/**
	 * Buffer at item capacity is full.
	 *
	 * @covers Jetpack_Sitemap_Buffer::is_full
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_is_full_item_capacity() {
		$buffer = new Jetpack_Sitemap_Buffer_Dummy( 2, 1024, '1970-01-01 00:00:00' );
		$buffer->append( 'foo' );
		$this->assertFalse( $buffer->is_full() );
		$buffer->append( 'bar' );
		$this->assertFalse( $buffer->is_full() );
		$buffer->append( 'baz' );
		$this->assertTrue( $buffer->is_full() );
	}

	/**
	 * Buffer at byte capacity is full.
	 *
	 * @covers Jetpack_Sitemap_Buffer::is_full
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_is_full_byte_capacity() {
		$buffer = new Jetpack_Sitemap_Buffer_Dummy( 10, 44, '1970-01-01 00:00:00' );
		$buffer->append( 'foo' );
		$this->assertFalse( $buffer->is_full() );
		$buffer->append( 'bar' );
		$this->assertFalse( $buffer->is_full() );
		$buffer->append( 'baz' );
		$this->assertTrue( $buffer->is_full() );
	}

	/**
	 * Last modified time is given by constructor if we don't view any new times.
	 *
	 * @covers Jetpack_Sitemap_Buffer::last_modified
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_last_modified() {
		$buffer = new Jetpack_Sitemap_Buffer_Dummy( 2, 16, '1970-01-01 00:00:00' );
		$this->assertEquals( '1970-01-01 00:00:00', $buffer->last_modified() );
	}

	/**
	 * Last modified time updates if we view a more recent time.
	 *
	 * @covers Jetpack_Sitemap_Buffer::view_time
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_view_time_update() {
		$buffer = new Jetpack_Sitemap_Buffer_Dummy( 2, 16, '1970-01-01 00:00:00' );
		$buffer->view_time( '1971-01-01 00:00:00' );
		$this->assertEquals( '1971-01-01 00:00:00', $buffer->last_modified() );
	}

	/**
	 * Last modified time does not update if we view a less recent time.
	 *
	 * @covers Jetpack_Sitemap_Buffer::view_time
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_buffer_view_time_do_not_update() {
		$buffer = new Jetpack_Sitemap_Buffer_Dummy( 2, 16, '1971-01-01 00:00:00' );
		$buffer->view_time( '1970-01-01 00:00:00' );
		$this->assertEquals( '1971-01-01 00:00:00', $buffer->last_modified() );
	}

	/**
	 * Test array_to_xml_string with a real-life example of an array.
	 *
	 * @covers Jetpack_Sitemap_Buffer::array_to_xml_string
	 * @group jetpack-sitemap
	 * @since 5.1.0
	 */
	public function test_news_sitemap_item_to_xml() {
		$timestamp = gmdate( 'r' );
		$array     = array(
			'url' => array(
				'loc'       => 'http://example.com/blog-url-about-stuff',
				'lastmod'   => $timestamp,
				'news:news' => array(
					'news:publication'      => array(
						'news:name'     => 'Blog about stuff',
						'news:language' => 'en',
					),
					'news:title'            => 'Stuff with stuff to escape, like less than signs: < and ampersands: &',
					'news:publication_date' => $timestamp,
					'news:genres'           => 'Blog with some already escaped stuff: &amp;&#321;',
				),
			),
		);

		$xml = '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL
		. '<dummy>'
		. '<url><loc>http://example.com/blog-url-about-stuff</loc>'
		. "<lastmod>$timestamp</lastmod>"
		. '<news:news>'
		. '<news:publication>'
		. '<news:name>Blog about stuff</news:name>'
		. '<news:language>en</news:language>'
		. '</news:publication>'
		. '<news:title>Stuff with stuff to escape, like less than signs: &lt; and ampersands: &amp;</news:title>'
		. "<news:publication_date>$timestamp</news:publication_date>"
		. '<news:genres>Blog with some already escaped stuff: &amp;amp;&amp;#321;</news:genres>'
		. '</news:news>'
		. '</url></dummy>' . PHP_EOL;

		foreach (
			array(
				new Jetpack_Sitemap_Buffer_Dummy( JP_SITEMAP_MAX_ITEMS, JP_SITEMAP_MAX_BYTES, $timestamp ),
				new Jetpack_Sitemap_Buffer_Fallback_Dummy( JP_SITEMAP_MAX_ITEMS, JP_SITEMAP_MAX_BYTES, $timestamp ),
			) as $buffer
		) {
			$buffer->append( $array );

			$this->assertEquals(
				$xml,
				$buffer->contents(),
				get_class( $buffer )
			);
		}
	}
}

/**
 * Dummy testing class for a concrete Buffer implementation
 */
class Jetpack_Sitemap_Buffer_Dummy extends Jetpack_Sitemap_Buffer {
	public function get_root_element() {
		if ( ! isset( $this->root ) ) {
			$this->root = $this->doc->createElement( 'dummy' );
			$this->doc->appendChild( $this->root );
		}

		return $this->root;
	}
}

/**
 * Dummy testing class for a concrete Buffer implementation for users with no XML support.
 */
class Jetpack_Sitemap_Buffer_Fallback_Dummy extends Jetpack_Sitemap_Buffer_Fallback {
	public function get_root_element() {
		if ( ! isset( $this->root ) ) {
			$this->root = array( '<dummy>', '</dummy>' );
		}

		return $this->root;
	}
}
