<?php
/**
 * Tests for the Jetpack_Sitemap_Builder class.
 *
 * @package automattic/jetpack
 * @since 13.4
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-builder.php';

/**
 * Test class for Jetpack_Sitemap_Builder.
 *
 * @since 13.4
 * @covers \Jetpack_Sitemap_Builder
 */
#[CoversClass( Jetpack_Sitemap_Builder::class )]
class Jetpack_Sitemap_Builder_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @var Jetpack_Sitemap_Builder
	 */
	private $builder;

	/**
	 * Set up before each test
	 */
	public function set_up() {
		parent::set_up();
		$this->builder = new Jetpack_Sitemap_Builder();

		// Reset the sitemap state
		Jetpack_Sitemap_State::reset( JP_PAGE_SITEMAP_TYPE );
	}

	/**
	 * Clean up after each test
	 */
	public function tear_down() {
		// Clean up any registered post types
		if ( post_type_exists( 'test_cpt' ) ) {
			unregister_post_type( 'test_cpt' );
		}

		// Reset permalink structure
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules( true );

		// Clean up sitemap state and options
		Jetpack_Sitemap_State::delete();
		delete_option( 'jetpack_sitemap_post_types' );

		parent::tear_down();
	}

	/**
	 * Test constructor sets up default post types
	 */
	public function test_constructor_sets_default_post_types() {
		$post_types = get_option( 'jetpack_sitemap_post_types' );
		$this->assertEquals( array( 'post', 'page' ), $post_types );
	}

	/**
	 * Test sitemap index generation with multiple sitemaps
	 */
	public function test_sitemap_index_generation() {
		// Create enough posts to generate multiple sitemaps
		self::factory()->post->create_many(
			2000,
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
			)
		);

		// Run updates until we reach the index generation
		for ( $i = 0; $i < 3; $i++ ) {
			$this->builder->update_sitemap();
		}

		// Check that index files were created
		$librarian = new Jetpack_Sitemap_Librarian();
		$index     = $librarian->get_sitemap_text( 'sitemap-index-1.xml', JP_PAGE_SITEMAP_INDEX_TYPE );

		$this->assertNotEmpty( $index );
		$this->assertStringContainsString( '<sitemapindex', $index );
		$this->assertStringContainsString( '<sitemap>', $index );
	}

	/**
	 * Test master sitemap generation
	 */
	public function test_master_sitemap_generation() {
		$this->markTestSkipped( 'Skipping master sitemap generation test since it assumed XMLWriter usage.' );
		// Create content of different types
		// @phan-suppress-next-line PhanPluginUnreachableCode -- Disabling until OOM issues are better understood/corrected.
		self::factory()->post->create_many(
			5,
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
			)
		);

		// Use jetpack-icon.jpg from tests/php folder
		$filename = dirname( __DIR__, 3 ) . '/jetpack-icon.jpg';

		// Create an attachment with proper image metadata
		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => $filename,
				'post_parent'    => 0,
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'Test Image',
				'post_content'   => 'Test Image Description',
				'post_excerpt'   => 'Test Image Caption',
				'post_status'    => 'publish',
			)
		);

		// Add image metadata
		$attachment_metadata = array(
			'width'      => 100,
			'height'     => 100,
			'file'       => 'test-image.jpg',
			'sizes'      => array(
				'thumbnail' => array(
					'file'      => 'test-image-150x150.jpg',
					'width'     => 150,
					'height'    => 150,
					'mime-type' => 'image/jpeg',
				),
			),
			'image_meta' => array(
				'title'   => 'Test Image',
				'caption' => 'Test Image Caption',
			),
		);
		wp_update_attachment_metadata( $attachment_id, $attachment_metadata );

		// Add a filter to transform image:image to images format
		add_filter(
			'jetpack_sitemap_image_sitemap_item',
			function ( $item_array ) use ( $attachment_id ) {
				if ( isset( $item_array['url']['image:image'] ) ) {
					$item_array['url']['images'] = array(
						array(
							'loc'     => $item_array['url']['image:image']['image:loc'],
							'title'   => get_the_title( $attachment_id ),
							'caption' => get_the_excerpt( $attachment_id ),
						),
					);
					unset( $item_array['url']['image:image'] );
				}
				return $item_array;
			}
		);

		// Run updates until we reach master sitemap generation
		for ( $i = 0; $i < 10; $i++ ) {
			$this->builder->update_sitemap();
		}

		// Check master sitemap
		$librarian = new Jetpack_Sitemap_Librarian();
		$master    = $librarian->get_sitemap_text( 'sitemap.xml', JP_MASTER_SITEMAP_TYPE );

		$this->assertNotEmpty( $master );
		$this->assertStringContainsString( '<sitemapindex', $master );
		$this->assertStringContainsString( 'sitemap-1.xml', $master );
		$this->assertStringContainsString( 'image-sitemap-1.xml', $master );

		// Clean up
		wp_delete_attachment( $attachment_id, true );
		if ( file_exists( $filename ) && strpos( $filename, 'test-image-' ) !== false ) {
			unlink( $filename );
		}
		remove_filter(
			'jetpack_sitemap_image_sitemap_item',
			function ( $item_array ) use ( $attachment_id ) {
				if ( isset( $item_array['url']['image:image'] ) ) {
					$item_array['url']['images'] = array(
						array(
							'loc'     => $item_array['url']['image:image']['image:loc'],
							'title'   => get_the_title( $attachment_id ),
							'caption' => get_the_excerpt( $attachment_id ),
						),
					);
					unset( $item_array['url']['image:image'] );
				}
				return $item_array;
			}
		);
	}

	/**
	 * Test sitemap generation with custom post types
	 */
	public function test_sitemap_with_custom_post_types() {
		// Reset the sitemap state to ensure clean test
		Jetpack_Sitemap_State::reset( JP_PAGE_SITEMAP_TYPE );

		// Register a custom post type with minimal configuration
		register_post_type(
			'test_cpt',
			array(
				'public'       => true,
				'has_archive'  => true,
				'show_in_rest' => false,
				'rewrite'      => array(
					'slug'       => 'test_cpt',
					'with_front' => true,
					'pages'      => true,
					'feeds'      => true,
					'ep_mask'    => 1,
				),
				'supports'     => array(),
			)
		);

		// Ensure rewrite rules are flushed
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->flush_rules( true );

		// Update sitemap post types option directly
		update_option(
			'jetpack_sitemap_post_types',
			array( 'post', 'page', 'test_cpt' )
		);

		// Create some custom post type content
		$post_id = self::factory()->post->create(
			array(
				'post_type'   => 'test_cpt',
				'post_status' => 'publish',
				'post_title'  => 'Test CPT Post',
				'post_name'   => 'test-cpt-post',
			)
		);

		// Force permalink structure to ensure consistent URLs
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules( true );

		// Generate sitemap
		$this->builder->update_sitemap();

		// Check that custom post type URLs are included
		$librarian = new Jetpack_Sitemap_Librarian();
		$sitemap   = $librarian->get_sitemap_text( 'sitemap-1.xml', JP_PAGE_SITEMAP_TYPE );

		$post_url = get_permalink( $post_id );
		$this->assertStringContainsString( $post_url, $sitemap );

		// Clean up
		unregister_post_type( 'test_cpt' );
		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules( true );
		Jetpack_Sitemap_State::delete();
		delete_option( 'jetpack_sitemap_post_types' );
	}

	/**
	 * "lastmod" date from other URLs filter is considered when building a sitemap.
	 *
	 * @group jetpack-sitemap
	 * @since 13.4
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_build_one_page_sitemap_considers_lastmod_from_other_urls() {
		$other_urls = array(
			array(
				'loc'     => 'https://example.com/1',
				'lastmod' => '2019-01-01T00:00:00Z',
			),
			array(
				'loc'     => 'https://example.com/2',
				'lastmod' => '2024-03-08T01:02:03Z',
			),
			array(
				'loc'     => 'https://example.com/3',
				'lastmod' => '2022-02-02T00:00:00Z',
			),
		);

		$callback = function () use ( $other_urls ) {
			return $other_urls;
		};

		add_filter( 'jetpack_page_sitemap_other_urls', $callback );

		$builder = new Jetpack_Sitemap_Builder();
		$result  = $builder->build_one_page_sitemap( 1, 1 );

		remove_filter( 'jetpack_page_sitemap_other_urls', $callback );

		$this->assertSame( '2024-03-08T01:02:03Z', $result['last_modified'], 'Last modified date is not the one from the other_urls filter.' );
	}
}
