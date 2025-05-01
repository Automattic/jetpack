<?php
/**
 * Tests for the XMLWriter sitemap buffer implementations.
 *
 * @package automattic/jetpack
 * @since 14.6
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-constants.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-buffer.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-buffer-xmlwriter.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-buffer-page-xmlwriter.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-buffer-image-xmlwriter.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-buffer-video-xmlwriter.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-buffer-news-xmlwriter.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-buffer-master-xmlwriter.php';

/**
 * Test class for XMLWriter sitemap buffer implementations.
 *
 * @since 14.6
 * @covers \Jetpack_Sitemap_Buffer_Image_XMLWriter
 * @covers \Jetpack_Sitemap_Buffer_Master_XMLWriter
 * @covers \Jetpack_Sitemap_Buffer_News_XMLWriter
 * @covers \Jetpack_Sitemap_Buffer_Page_XMLWriter
 * @covers \Jetpack_Sitemap_Buffer_Video_XMLWriter
 * @covers \Jetpack_Sitemap_Buffer_XMLWriter
 */
#[CoversClass( Jetpack_Sitemap_Buffer_Image_XMLWriter::class )]
#[CoversClass( Jetpack_Sitemap_Buffer_Master_XMLWriter::class )]
#[CoversClass( Jetpack_Sitemap_Buffer_News_XMLWriter::class )]
#[CoversClass( Jetpack_Sitemap_Buffer_Page_XMLWriter::class )]
#[CoversClass( Jetpack_Sitemap_Buffer_Video_XMLWriter::class )]
#[CoversClass( Jetpack_Sitemap_Buffer_XMLWriter::class )]
class Jetpack_Sitemap_Buffer_XMLWriter_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test page sitemap buffer with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 * @since 14.6
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_page_sitemap_buffer() {
		$buffer = new Jetpack_Sitemap_Buffer_Page_XMLWriter(
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
			'1970-01-01 00:00:00'
		);

		$url_data = array(
			'url' => array(
				'loc'        => 'https://example.com/test-page',
				'lastmod'    => '2024-03-31 12:00:00',
				'changefreq' => 'daily',
				'priority'   => '0.8',
			),
		);

		$buffer->append( $url_data );
		$content = $buffer->contents();

		$this->assertStringContainsString( '<?xml version="1.0" encoding="UTF-8"?>', $content );
		$this->assertStringContainsString( '<urlset', $content );
		$this->assertStringContainsString( 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"', $content );
		$this->assertStringContainsString( '<url>', $content );
		$this->assertStringContainsString( '<loc>https://example.com/test-page</loc>', $content );
		$this->assertStringContainsString( '<lastmod>2024-03-31 12:00:00</lastmod>', $content );
		$this->assertStringContainsString( '<changefreq>daily</changefreq>', $content );
		$this->assertStringContainsString( '<priority>0.8</priority>', $content );
	}

	/**
	 * Test image sitemap buffer with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 * @since 14.6
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_image_sitemap_buffer() {
		$buffer = new Jetpack_Sitemap_Buffer_Image_XMLWriter(
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
			'1970-01-01 00:00:00'
		);

		// Test case 1: Basic image entry matching sitemap-builder.php structure
		$url_data = array(
			'url' => array(
				'loc'         => 'https://example.com/test-page',
				'lastmod'     => '2024-03-31 12:00:00',
				'image:image' => array(
					'image:loc' => 'https://example.com/test-image.jpg',
				),
			),
		);

		$this->assertTrue( $buffer->append( $url_data ) );
		$content = $buffer->contents();

		$this->assertStringContainsString( '<?xml version="1.0" encoding="UTF-8"?>', $content );
		$this->assertStringContainsString( '<urlset', $content );
		$this->assertStringContainsString( 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"', $content );
		$this->assertStringContainsString( '<loc>https://example.com/test-page</loc>', $content );
		$this->assertStringContainsString( '<image:loc>https://example.com/test-image.jpg</image:loc>', $content );
		$this->assertStringContainsString( '</urlset>', $content );

		// Test case 2: Image with optional fields
		$buffer = new Jetpack_Sitemap_Buffer_Image_XMLWriter(
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
			'1970-01-01 00:00:00'
		);

		$url_data_with_optional = array(
			'url' => array(
				'loc'         => 'https://example.com/test-page-2',
				'lastmod'     => '2024-03-31 12:00:00',
				'image:image' => array(
					'image:loc'     => 'https://example.com/test-image-2.jpg',
					'image:title'   => 'Test Image Title',
					'image:caption' => 'Test Image Caption',
				),
			),
		);

		$this->assertTrue( $buffer->append( $url_data_with_optional ) );
		$content = $buffer->contents();

		$this->assertStringContainsString( '<image:title>Test Image Title</image:title>', $content );
		$this->assertStringContainsString( '<image:caption>Test Image Caption</image:caption>', $content );
		$this->assertStringContainsString( '</urlset>', $content );
	}

	/**
	 * Test video sitemap buffer with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 * @since 14.6
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_video_sitemap_buffer() {
		$buffer = new Jetpack_Sitemap_Buffer_Video_XMLWriter(
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
			'1970-01-01 00:00:00'
		);

		$url_data = array(
			'url' => array(
				'loc'         => 'https://example.com/test-page',
				'lastmod'     => '2024-03-31 12:00:00',
				'video:video' => array(
					'video:title'         => 'Test Video',
					'video:description'   => 'A test video description',
					'video:thumbnail_loc' => 'https://example.com/thumbnail.jpg',
					'video:content_loc'   => 'https://example.com/video.mp4',
				),
			),
		);

		$buffer->append( $url_data );
		$content = $buffer->contents();

		$this->assertStringContainsString( '<?xml version="1.0" encoding="UTF-8"?>', $content );
		$this->assertStringContainsString( '<urlset', $content );
		$this->assertStringContainsString( 'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"', $content );
		$this->assertStringContainsString( '<url>', $content );
		$this->assertStringContainsString( '<video:video>', $content );
		$this->assertStringContainsString( '<video:title>Test Video</video:title>', $content );
		$this->assertStringContainsString( '<video:description>A test video description</video:description>', $content );
		$this->assertStringContainsString( '<video:thumbnail_loc>https://example.com/thumbnail.jpg</video:thumbnail_loc>', $content );
		$this->assertStringContainsString( '<video:content_loc>https://example.com/video.mp4</video:content_loc>', $content );
	}

	/**
	 * Test news sitemap buffer with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 * @since 14.6
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_news_sitemap_buffer() {
		$buffer = new Jetpack_Sitemap_Buffer_News_XMLWriter(
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
			'1970-01-01 00:00:00'
		);

		$url_data = array(
			'url' => array(
				'loc'       => 'https://example.com/test-news',
				'lastmod'   => '2024-03-31 12:00:00',
				'news:news' => array(
					'news:publication'      => array(
						'news:name'     => 'Test News Site',
						'news:language' => 'en',
					),
					'news:title'            => 'Test News Article',
					'news:publication_date' => '2024-03-31 12:00:00',
					'news:genres'           => 'Blog',
				),
			),
		);

		$buffer->append( $url_data );
		$content = $buffer->contents();

		$this->assertStringContainsString( '<?xml version="1.0" encoding="UTF-8"?>', $content );
		$this->assertStringContainsString( '<urlset', $content );
		$this->assertStringContainsString( 'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"', $content );
		$this->assertStringContainsString( '<url>', $content );
		$this->assertStringContainsString( '<news:news>', $content );
		$this->assertStringContainsString( '<news:publication>', $content );
		$this->assertStringContainsString( '<news:name>Test News Site</news:name>', $content );
		$this->assertStringContainsString( '<news:language>en</news:language>', $content );
		$this->assertStringContainsString( '<news:title>Test News Article</news:title>', $content );
		$this->assertStringContainsString( '<news:publication_date>2024-03-31 12:00:00</news:publication_date>', $content );
		$this->assertStringContainsString( '<news:genres>Blog</news:genres>', $content );
	}

	/**
	 * Test master sitemap buffer with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 * @since 14.6
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_master_sitemap_buffer() {
		$buffer = new Jetpack_Sitemap_Buffer_Master_XMLWriter(
			JP_SITEMAP_MAX_ITEMS,
			JP_SITEMAP_MAX_BYTES,
			'1970-01-01 00:00:00'
		);

		$sitemap_data = array(
			'sitemap' => array(
				'loc'     => 'https://example.com/sitemap-1.xml',
				'lastmod' => '2024-03-31 12:00:00',
			),
		);

		$buffer->append( $sitemap_data );
		$content = $buffer->contents();

		$this->assertStringContainsString( '<?xml version="1.0" encoding="UTF-8"?>', $content );
		$this->assertStringContainsString( '<sitemapindex', $content );
		$this->assertStringContainsString( 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"', $content );
		$this->assertStringContainsString( '<sitemap>', $content );
		$this->assertStringContainsString( '<loc>https://example.com/sitemap-1.xml</loc>', $content );
		$this->assertStringContainsString( '<lastmod>2024-03-31 12:00:00</lastmod>', $content );
	}

	/**
	 * Test buffer capacity limits with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 * @since 14.6
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_buffer_capacity() {
		$buffer = new Jetpack_Sitemap_Buffer_Page_XMLWriter(
			2, // Max items
			1024, // Max bytes
			'1970-01-01 00:00:00'
		);

		$url_data = array(
			'url' => array(
				'loc'     => 'https://example.com/test-page',
				'lastmod' => '2024-03-31 12:00:00',
			),
		);

		// First append should succeed
		$this->assertTrue( $buffer->append( $url_data ) );
		$this->assertFalse( $buffer->is_full() );

		// Second append should succeed
		$this->assertTrue( $buffer->append( $url_data ) );
		$this->assertTrue( $buffer->is_full() );

		// Third append should fail due to item limit
		$this->assertFalse( $buffer->append( $url_data ) );
	}

	/**
	 * Test last modified tracking with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 * @since 14.6
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_last_modified_tracking() {
		$buffer = new Jetpack_Sitemap_Buffer_Page_XMLWriter(
			2,
			1024,
			'1970-01-01 00:00:00'
		);

		$this->assertEquals( '1970-01-01 00:00:00', $buffer->last_modified() );

		$buffer->view_time( '2024-03-31 12:00:00' );
		$this->assertEquals( '2024-03-31 12:00:00', $buffer->last_modified() );

		// Earlier time should not update last_modified
		$buffer->view_time( '2024-03-30 12:00:00' );
		$this->assertEquals( '2024-03-31 12:00:00', $buffer->last_modified() );
	}
}
