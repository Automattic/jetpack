<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Testing the Settings class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use WorDBless\BaseTestCase;

/**
 * Testing the Settings class.
 */
class Publicize_OG_Optimization_Test extends BaseTestCase {

	const TEST_TAGS = array(
		'og:image'        => 'http://example.com/image.jpg',
		'og:image:width'  => '100',
		'og:image:height' => '100',
	);

	const TEST_TAGS_WITHOUT_IMAGE = array(
		'random_tag' => 'random_value',
	);

	const TEST_TAGS_ARRAY_IMAGE = array(
		'og:image'        => array(
			'https://example.com/image1.jpg',
			'https://example.com/image2.jpg',
		),
		'og:image:width'  => '100',
		'og:image:height' => '100',
	);

	/**
	 * Mocks the publicize class and sets the return value for each function in $functions to the corresponding value in $mocks
	 *
	 * @param array $functions The functions to mock.
	 * @param array $mocks The return values for each function.
	 * @return Publicize The mocked publicize class
	 */
	private function mock_publicize_functions( $functions, $mocks ) {
		$publicize = $this->getMockBuilder( Publicize::class )->setMethods( $functions )->getMock();

		// We set the return value for each mock in $mocks
		foreach ( $functions as $index => $function ) {
			$publicize->method( $function )->withAnyParameters()->willReturn( $mocks[ $index ] );
		}

		return $publicize;
	}

	/**
	 * Test the compress_and_scale_og_image method.
	 */
	public function test_compress_and_scale_og_image() {
		$publicize = $this->mock_publicize_functions( array( 'get_resized_image_url' ), array( 'https://example.com/image_compressed' ) );

		// Test that the image is not compressed or scaled if it's smaller than the requested size
		$this->assertEquals(
			array(
				'url'    => 'https://example.com/image_compressed',
				'width'  => 1000,
				'height' => 1000,
			),
			$publicize->compress_and_scale_og_image( 'https://example.com/image', 1000, 1000 )
		);

		// Test that the image is compressed and scaled if it's larger than the requested size - width
		$this->assertEquals(
			array(
				'url'    => 'https://example.com/image_compressed',
				'width'  => 1200,
				'height' => 1200 * 1000 / 2000,
			),
			$publicize->compress_and_scale_og_image( 'https://example.com/image', 2000, 1000 )
		);

		// Test that the image is compressed and scaled if it's larger than the requested size - height
		$this->assertEquals(
			array(
				'url'    => 'https://example.com/image_compressed',
				'width'  => 1200 * 1000 / 2000,
				'height' => 1200,
			),
			$publicize->compress_and_scale_og_image( 'https://example.com/image', 1000, 2000 )
		);
	}

	/**
	 * Test the reduce_file_size method.
	 */
	public function test_reduce_file_size() {
		$publicize = $this->mock_publicize_functions( array( 'get_resized_image_url', 'get_remote_filesize' ), array( 'https://example.com/image_compressed', 3000000 ) );

		// Test that we return null if we cannot reduce the image enough
		$this->assertNull( $publicize->reduce_file_size( 'https://example.com/image', 2000, 2000, 3000000 ) );

		// Test that we scale to 75% and return if it's enough
		$publicize = $this->mock_publicize_functions( array( 'get_resized_image_url', 'get_remote_filesize' ), array( 'https://example.com/image_compressed', 1000000 ) );
		$this->assertEquals(
			array(
				'url'    => 'https://example.com/image_compressed',
				'width'  => 2000 * 0.75,
				'height' => 2000 * 0.75,
			),
			$publicize->reduce_file_size( 'https://example.com/image', 2000, 2000, 3000000 )
		);
	}

	// jetpack_social_open_graph_filter //////////////

	/**
	 * Test that the jetpack_social_open_graph_filter method will return early if there is no OG image.
	 */
	public function test_jetpack_social_open_graph_filter_no_og_image() {
		$publicize = $this->mock_publicize_functions( array( 'get_social_opengraph_image' ), array( null ) );

		// Testing that the tags didn't change
		$this->assertEquals( self::TEST_TAGS_WITHOUT_IMAGE, $publicize->jetpack_social_open_graph_filter( self::TEST_TAGS_WITHOUT_IMAGE ) );
	}

	/**
	 * Test that the jetpack_social_open_graph_filter method will return early if the image's filesize cannot be determined.
	 */
	public function test_jetpack_social_open_graph_filter_invalid_filesize() {
		$publicize = $this->mock_publicize_functions( array( 'get_social_opengraph_image', 'get_remote_filesize' ), array( null, null ) );

		// Testing that the tags didn't change
		$this->assertEquals( self::TEST_TAGS, $publicize->jetpack_social_open_graph_filter( self::TEST_TAGS ) );
	}

	/**
	 * Test that the jetpack_social_open_graph_filter method will return early if the image's filesize is small enough.
	 */
	public function test_jetpack_social_open_graph_filter_small_enough_filesize() {
		$publicize = $this->mock_publicize_functions( array( 'get_social_opengraph_image', 'get_remote_filesize' ), array( null, 1000000 ) );

		// Testing that the tags didn't change
		$this->assertEquals( self::TEST_TAGS, $publicize->jetpack_social_open_graph_filter( self::TEST_TAGS ) );
	}

	/**
	 * Test that the jetpack_social_open_graph_filter method will return early if the OG image tag is an array as with old versions of the plugin.
	 */
	public function test_jetpack_social_open_graph_filter_array_og_tags() {
		$publicize = $this->mock_publicize_functions( array( 'get_social_opengraph_image', 'get_remote_filesize' ), array( null, 1000000 ) );

		// Testing that the tags didn't change
		$this->assertEquals( self::TEST_TAGS_ARRAY_IMAGE, $publicize->jetpack_social_open_graph_filter( self::TEST_TAGS_ARRAY_IMAGE ) );
	}

	/**
	 * Test that the jetpack_social_open_graph_filter method will compress the image, and if that is enough
	 * we won't proceed to reduce the file size.
	 */
	public function test_jetpack_social_open_graph_filter_compression_enough() {
		$publicize = $this->getMockBuilder( Publicize::class )->setMethods(
			array(
				'get_social_opengraph_image',
				'get_remote_filesize',
				'compress_and_scale_og_image',
				'reduce_file_size',
			)
		)
		->getMock();

		$publicize->method( 'get_social_opengraph_image' )->withAnyParameters()->willReturn( null );
		// Mocking so compression will be enough
		$publicize->method( 'get_remote_filesize' )
			->withConsecutive( array( 'http://example.com/image.jpg' ), array( 'http://example.com/image_compressed.jpg' ) )
			->willReturnOnConsecutiveCalls( 3000000, 1200 );
		// Mocking so that the compression decreases the size enough
		$publicize->method( 'compress_and_scale_og_image' )->withAnyParameters()->willReturn(
			array(
				'url'    => 'http://example.com/image_compressed.jpg',
				'width'  => 1000,
				'height' => 1000,
			)
		);

		// Check that we called the compression but not the file size reduction
		$publicize->expects( $this->never() )->method( 'reduce_file_size' );
		$publicize->expects( $this->once() )->method( 'compress_and_scale_og_image' );
		$publicize->expects( $this->exactly( 2 ) )->method( 'get_remote_filesize' );

		// Testing that the tags changed
		$this->assertEquals(
			array(
				'og:image'        => 'http://example.com/image_compressed.jpg',
				'og:image:width'  => 1000,
				'og:image:height' => 1000,
			),
			$publicize->jetpack_social_open_graph_filter( self::TEST_TAGS )
		);
	}

	/**
	 * Test that the jetpack_social_open_graph_filter method will compress the image, and if that is not enough
	 * we will proceed to reduce the file size.
	 */
	public function test_jetpack_social_open_graph_filter_full_flow() {
		$publicize = $this->getMockBuilder( Publicize::class )->setMethods(
			array(
				'get_social_opengraph_image',
				'get_remote_filesize',
				'compress_and_scale_og_image',
				'reduce_file_size',
			)
		)
		->getMock();

		$publicize->method( 'get_social_opengraph_image' )->withAnyParameters()->willReturn( null );
		// Mocking so compression will be enough
		$publicize->method( 'get_remote_filesize' )
			->withConsecutive( array( 'http://example.com/image.jpg' ), array( 'http://example.com/image_compressed.jpg' ) )
			->willReturnOnConsecutiveCalls( 3000000, 2500000 );
		// Mocking so that the compression decreases the size enough
		$publicize->method( 'compress_and_scale_og_image' )->withAnyParameters()->willReturn(
			array(
				'url'    => 'http://example.com/image_compressed.jpg',
				'width'  => 1000,
				'height' => 1000,
			)
		);

		$publicize->method( 'reduce_file_size' )->withAnyParameters()->willReturn(
			array(
				'url'    => 'http://example.com/image_compressed_and_scaled.jpg',
				'width'  => 500,
				'height' => 500,
			)
		);

		// Check that we didn't call reduce_file_size
		$publicize->expects( $this->once() )->method( 'reduce_file_size' );
		$publicize->expects( $this->once() )->method( 'compress_and_scale_og_image' );
		$publicize->expects( $this->exactly( 2 ) )->method( 'get_remote_filesize' );

		// Testing that the tags changed
		$this->assertEquals(
			array(
				'og:image'        => 'http://example.com/image_compressed_and_scaled.jpg',
				'og:image:width'  => 500,
				'og:image:height' => 500,
			),
			$publicize->jetpack_social_open_graph_filter( self::TEST_TAGS )
		);
	}
}
