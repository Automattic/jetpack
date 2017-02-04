<?php
/**
 * Tests for the Jetpack_Sitemap_Builder class.
 *
 * @package Jetpack
 * @since 4.7.0
 */

require dirname( __FILE__ ) . '/../../../../modules/sitemaps/sitemap-constants.php';
require dirname( __FILE__ ) . '/../../../../modules/sitemaps/sitemap-builder.php';

/**
 * Test class for Jetpack_Sitemap_Builder.
 *
 * @since 4.7.0
 */
class WP_Test_Jetpack_Sitemap_Builder extends WP_UnitTestCase {

	/**
	 * Constructor returns without fatal errors.
	 *
	 * @covers Jetpack_Sitemap_Builder::__construct
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_constructor() {
		$buffer = new Jetpack_Sitemap_Builder();
		$this->assertTrue( true );
	}

	/**
	 * The news sitemap xml is valid xml, with 'urlset' at the root.
	 *
	 * @covers Jetpack_Sitemap_Builder::news_sitemap_xml
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_news_sitemap_xml_is_valid() {
		$builder = new Jetpack_Sitemap_Builder();

		$result = simplexml_load_string( $builder->news_sitemap_xml() );

		$this->assertNotEquals( false, $result );
		$this->assertEquals( 'urlset', $result->getName() );
	}

	/**
	 * The news sitemap includes posts which are at most 2 days old.
	 *
	 * @covers Jetpack_Sitemap_Builder::news_sitemap_xml
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_news_sitemap_freshness() {
		// Create a 1 day old post.
		$woo_id = $this->factory->post->create(
			array(
				'post_title' => 'Woo!',
				'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
			)
		);

		// Create a 3 day old post.
		$this->factory->post->create(
			array(
				'post_title' => 'Yeah!',
				'post_date'  => date( 'Y-m-d', strtotime( '-3 days' ) ),
			)
		);

		$builder = new Jetpack_Sitemap_Builder();
		$dom = new DOMDocument;
		$dom->loadXml( $builder->news_sitemap_xml() );

		// Only the 1 day old post should be in the news sitemap.
		$this->assertEquals(
			1,
			$dom->getElementsByTagName( 'url' )->length
		);
	}

	/**
	 * Tests that posts are added to the news sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::news_sitemap_xml
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_news_sitemap_items_added() {
		// Create ten 1 day old posts.
		for ( $i = 1; $i <= 100; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Woo!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		$builder = new Jetpack_Sitemap_Builder();
		$dom = new DOMDocument;
		$dom->loadXml( $builder->news_sitemap_xml() );

		// The news sitemap should have 100 items in it.
		$this->assertEquals(
			100,
			$dom->getElementsByTagName( 'url' )->length
		);
	}

	/**
	 * Testing that the jetpack_sitemap_news_sitemap_count filter limits
	 * the number of items in the news sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::news_sitemap_xml
	 * @covers filter jetpack_sitemap_news_sitemap_count
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_news_sitemap_count_filter() {
		// Create ten 1 day old posts.
		for ( $i = 1; $i <= 10; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Woo!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		/**
		 * Add filter setting the news sitemap count to 5.
		 *
		 * @param int $count The number of items to include in the news sitemap.
		 */
		function set_news_count( $count ) {
			return 5;
		}

		add_filter(
			'jetpack_sitemap_news_sitemap_count',
			'set_news_count'
		);

		$builder = new Jetpack_Sitemap_Builder();
		$dom = new DOMDocument;
		$dom->loadXml( $builder->news_sitemap_xml() );

		// There are 10 posts.
		$this->assertEquals(
			10,
			count( get_posts( array( 'numberposts' => -1 ) ) )
		);

		// But only 5 posts should be in the news sitemap.
		$this->assertEquals(
			5,
			$dom->getElementsByTagName( 'url' )->length
		);
	}

	/**
	 * Testing that the jetpack_sitemap_news_skip_post filter
	 * removes some items from the news sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::news_sitemap_xml
	 * @covers filter jetpack_sitemap_news_skip_post
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_news_sitemap_skip_post_filter() {
		// Create ten 1 day old posts titled 'Woo!'.
		for ( $i = 1; $i <= 10; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Woo!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		// Create a single 1 day old post titled 'Yeah!'.
		$this->factory->post->create(
			array(
				'post_title' => 'Yeah!',
				'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
			)
		);

		/**
		 * Skip any posts with 'Woo!' as the title.
		 *
		 * @param bool    $bool Whether the post is already to be skipped.
		 * @param WP_Post $post The post under consideration.
		 */
		function set_news_skip_post( $bool, $post ) {
			if ( 'Woo!' === $post->post_title ) {
				return true;
			} else {
				return false;
			}
		}

		add_filter(
			'jetpack_sitemap_news_skip_post',
			'set_news_skip_post',
			10,
			2
		);

		$builder = new Jetpack_Sitemap_Builder();
		$dom = new DOMDocument;
		$dom->loadXml( $builder->news_sitemap_xml() );

		// There are 11 posts.
		$this->assertEquals(
			11,
			count( get_posts( array( 'numberposts' => -1 ) ) )
		);

		// But only one post should be in the news sitemap.
		$this->assertEquals(
			1,
			$dom->getElementsByTagName( 'url' )->length
		);
	}

	/**
	 * Testing that the jetpack_sitemap_news_sitemap_item filter
	 * alters the news sitemap url items.
	 *
	 * @covers Jetpack_Sitemap_Builder::news_sitemap_xml
	 * @covers filter jetpack_sitemap_news_sitemap_item
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_news_sitemap_item_filter() {
		// Create ten 1 day old posts.
		for ( $i = 1; $i <= 10; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Woo!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		/**
		 * Change the 'url' elements to 'foo' elements.
		 *
		 * @param array $array Array representing XML of news sitemap url items.
		 */
		function set_news_item( $array ) {
			return array(
				'foo' => $array['url'],
			);
		}

		add_filter(
			'jetpack_sitemap_news_sitemap_item',
			'set_news_item',
			10,
			1
		);

		$builder = new Jetpack_Sitemap_Builder();
		$dom = new DOMDocument;
		$dom->loadXml( $builder->news_sitemap_xml() );

		// Instead of 'url' elements we have 'foo' elements.
		$this->assertEquals(
			0,
			$dom->getElementsByTagName( 'url' )->length
		);

		$this->assertEquals(
			10,
			$dom->getElementsByTagName( 'foo' )->length
		);
	}

	/**
	 * Testing that the jetpack_sitemap_news_sitemap_post_types filter
	 * can add new post types to the news sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::news_sitemap_xml
	 * @covers filter jetpack_sitemap_news_sitemap_post_types
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_news_sitemap_post_types_filter_add_new() {
		// Create five 1 day old posts.
		for ( $i = 1; $i <= 5; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Woo!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		// Create five 1 day old *custom* posts.
		for ( $i = 1; $i <= 5; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Yeah!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
					'post_type'  => 'custom',
				)
			);
		}

		$builder = new Jetpack_Sitemap_Builder();
		$dom = new DOMDocument;

		$dom->loadXml( $builder->news_sitemap_xml() );

		// Only the 'post' items are included.
		$this->assertEquals(
			5,
			$dom->getElementsByTagName( 'url' )->length
		);

		/**
		 * Add 'custom' post type.
		 *
		 * @param array $array Array of post types.
		 */
		function set_news_post_types( $array ) {
			$array[] = 'custom';
			return $array;
		}

		add_filter(
			'jetpack_sitemap_news_sitemap_post_types',
			'set_news_post_types',
			10,
			1
		);

		// Flush the cache.
		delete_transient( 'jetpack_news_sitemap_xml' );

		$dom->loadXml( $builder->news_sitemap_xml() );

		// Now all 10 posts are represented.
		$this->assertEquals(
			10,
			$dom->getElementsByTagName( 'url' )->length
		);
	}

	/**
	 * Testing that posts appear in the plain sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::update_sitemap
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_add_posts() {
		// Create ten 1 day old posts.
		for ( $i = 1; $i <= 10; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Woo!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		$builder = new Jetpack_Sitemap_Builder();
		$librarian = new Jetpack_Sitemap_Librarian();

		$builder->update_sitemap();

		$dom = new DOMDocument;
		$dom->loadXml( $librarian->get_sitemap_text(
			Jetpack_Sitemap_Librarian::name_prefix( JP_SITEMAP_TYPE ) . '1',
			JP_SITEMAP_TYPE
		) );

		// There are 10 posts.
		$this->assertEquals(
			10,
			count( get_posts( array( 'numberposts' => -1 ) ) )
		);

		// 12 items appear in the sitemap (the 11 posts and the main page).
		$this->assertEquals(
			11,
			$dom->getElementsByTagName( 'url' )->length
		);
	}

	/**
	 * Testing that the jetpack_sitemap_skip_post filter
	 * removes some items from the plain sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::update_sitemap
	 * @covers filter jetpack_sitemap_skip_post
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_skip_post_filter() {
		// Create ten 1 day old posts titled 'Woo!'.
		for ( $i = 1; $i <= 10; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Woo! Post!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		// Create a single 1 day old post titled 'Yeah!'.
		$this->factory->post->create(
			array(
				'post_title' => 'Yeah! Post!',
				'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
			)
		);

		/**
		 * Skip any posts with 'Woo!' as the title.
		 *
		 * @param bool    $bool Whether the post is already marked as skipped.
		 * @param WP_Post $post The post under consideration.
		 */
		function set_skip_post( $bool, $post ) {
			if ( 'Woo! Post!' === $post->post_title ) {
				return true;
			} else {
				return false;
			}
		}

		add_filter(
			'jetpack_sitemap_skip_post',
			'set_skip_post',
			10,
			2
		);

		$builder = new Jetpack_Sitemap_Builder();
		$librarian = new Jetpack_Sitemap_Librarian();

		$builder->update_sitemap();

		$dom = new DOMDocument;
		$dom->loadXml( $librarian->get_sitemap_text(
			Jetpack_Sitemap_Librarian::name_prefix( JP_SITEMAP_TYPE ) . '1',
			JP_SITEMAP_TYPE
		) );

		// There are 11 posts.
		$this->assertEquals(
			11,
			count( get_posts( array( 'numberposts' => -1 ) ) )
		);

		// But only two items should be in the sitemap:
		// the 'Yeah!' post and the site home.
		$this->assertEquals(
			2,
			$dom->getElementsByTagName( 'url' )->length
		);
	}

	/**
	 * Testing that the jetpack_sitemap_image_skip_post filter
	 * removes some items from the image sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::update_sitemap
	 * @covers filter jetpack_sitemap_image_skip_post
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_image_skip_post_filter() {
		// Create ten 1 day old images titled 'Woo!'.
		for ( $i = 1; $i <= 10; $i++ ) {
			wp_insert_attachment(
				array(
					'post_title'     => 'Woo! Image!',
					'post_type'      => 'attachment',
					'post_mime_type' => 'image/png',
					'post_content'   => '',
					'post_status'    => 'published',
					'post_date'      => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		// Create a single 1 day old image titled 'Yeah!'.
		wp_insert_attachment(
			array(
				'post_title'     => 'Yeah! Image!',
				'post_type'      => 'attachment',
				'post_mime_type' => 'image/png',
				'post_content'   => '',
				'post_status'    => 'published',
				'post_date'      => date( 'Y-m-d', strtotime( '-1 days' ) ),
			)
		);

		/**
		 * Skip any posts with 'Woo!' as the title.
		 *
		 * @param bool    $bool Whether to skip post or not.
		 * @param WP_Post $post The post under consideration.
		 */
		function set_skip_image( $bool, $post ) {
			if ( 'Woo! Image!' === $post->post_title ) {
				return true;
			} else {
				return false;
			}
		}

		add_filter(
			'jetpack_sitemap_image_skip_post',
			'set_skip_image',
			10,
			2
		);

		$builder = new Jetpack_Sitemap_Builder();
		$librarian = new Jetpack_Sitemap_Librarian();

		$builder->update_sitemap();

		$dom = new DOMDocument;
		$dom->loadXml( $librarian->get_sitemap_text(
			Jetpack_Sitemap_Librarian::name_prefix( JP_IMAGE_SITEMAP_TYPE ) . '1',
			JP_IMAGE_SITEMAP_TYPE
		) );

		// There are 11 attachment posts.
		$this->assertEquals(
			11,
			count( get_posts( array(
				'numberposts' => -1,
				'post_type'   => 'attachment',
			) ) )
		);

		// But only one items should be in the sitemap:
		// the 'Yeah! Image' post.
		$this->assertEquals(
			1,
			$dom->getElementsByTagName( 'url' )->length
		);
	}

	/**
	 * Testing that the jetpack_sitemap_url filter alters
	 * the url items in the plain sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::update_sitemap
	 * @covers filter jetpack_sitemap_url
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_sitemap_url_filter() {
		// Create ten 1 day old posts.
		for ( $i = 1; $i <= 10; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Woo!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		/**
		 * Change the 'url' elements to 'foo' elements.
		 *
		 * @param array $array Array representing XML of sitemap url items.
		 */
		function set_item_url( $array ) {
			return array(
				'foo' => $array['url'],
			);
		}

		add_filter(
			'jetpack_sitemap_url',
			'set_item_url',
			10,
			1
		);

		$builder = new Jetpack_Sitemap_Builder();
		$librarian = new Jetpack_Sitemap_Librarian();

		$builder->update_sitemap();

		$dom = new DOMDocument;
		$dom->loadXml( $librarian->get_sitemap_text(
			Jetpack_Sitemap_Librarian::name_prefix( JP_SITEMAP_TYPE ) . '1',
			JP_SITEMAP_TYPE
		) );

		// 10 'foo' items appear in the sitemap.
		$this->assertEquals(
			10,
			$dom->getElementsByTagName( 'foo' )->length
		);
	}

	/**
	 * Testing that the jetpack_sitemap_url_home filter alters
	 * the url item of the home page in the plain sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::update_sitemap
	 * @covers filter jetpack_sitemap_url_home
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_sitemap_url_home_filter() {
		// Create ten 1 day old posts.
		for ( $i = 1; $i <= 10; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Woo!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		/**
		 * Change the 'url' elements to 'foo' elements.
		 *
		 * @param array $array Array representing XML of sitemap.
		 */
		function set_item_url_home( $array ) {
			return array(
				'foo' => $array['url'],
			);
		}

		add_filter(
			'jetpack_sitemap_url_home',
			'set_item_url',
			10,
			1
		);

		$builder = new Jetpack_Sitemap_Builder();
		$librarian = new Jetpack_Sitemap_Librarian();

		$builder->update_sitemap();

		$dom = new DOMDocument;
		$dom->loadXml( $librarian->get_sitemap_text(
			Jetpack_Sitemap_Librarian::SITEMAP_NAME_PREFIX . '1',
			Jetpack_Sitemap_Librarian::SITEMAP_TYPE
		) );

		// 1 'foo' item appears in the sitemap.
		$this->assertEquals(
			1,
			$dom->getElementsByTagName( 'foo' )->length
		);
	}

	/**
	 * Testing that the jetpack_sitemap_image_sitemap_item filter alters
	 * the url items in the image sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::update_sitemap
	 * @covers filter jetpack_sitemap_image_sitemap_item
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_sitemap_image_sitemap_item_filter() {
		// Create ten 1 day old posts.
		for ( $i = 1; $i <= 10; $i++ ) {
			wp_insert_attachment(
				array(
					'post_title'     => 'Woo! Image!',
					'post_type'      => 'attachment',
					'post_mime_type' => 'image/png',
					'post_content'   => '',
					'post_status'    => 'published',
					'post_date'      => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		/**
		 * Change the 'url' elements to 'foo' elements.
		 *
		 * @param array $array Array representing XML of items in image sitemap.
		 */
		function set_image_item_url( $array ) {
			return array(
				'foo' => $array['url'],
			);
		}

		add_filter(
			'jetpack_sitemap_image_sitemap_item',
			'set_image_item_url',
			10,
			1
		);

		$builder = new Jetpack_Sitemap_Builder();
		$librarian = new Jetpack_Sitemap_Librarian();

		$builder->update_sitemap();

		$dom = new DOMDocument;
		$dom->loadXml( $librarian->get_sitemap_text(
			Jetpack_Sitemap_Librarian::IMAGE_SITEMAP_NAME_PREFIX . '1',
			Jetpack_Sitemap_Librarian::IMAGE_SITEMAP_TYPE
		) );

		// 10 'foo' items appear in the sitemap.
		$this->assertEquals(
			10,
			$dom->getElementsByTagName( 'foo' )->length
		);
	}

	/**
	 * Testing that the jetpack_sitemap_post_types filter
	 * can add new post types to the plain sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::update_sitemap
	 * @covers filter jetpack_sitemap_post_types
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_sitemap_post_types_filter_add_new() {
		// Create five 1 day old posts.
		for ( $i = 1; $i <= 5; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Woo!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
				)
			);
		}

		// Create five 1 day old *custom* posts.
		for ( $i = 1; $i <= 5; $i++ ) {
			$this->factory->post->create(
				array(
					'post_title' => 'Yeah!',
					'post_date'  => date( 'Y-m-d', strtotime( '-1 days' ) ),
					'post_type'  => 'custom',
				)
			);
		}

		$builder = new Jetpack_Sitemap_Builder();
		$librarian = new Jetpack_Sitemap_Librarian();
		$dom = new DOMDocument;

		$builder->update_sitemap();

		$dom->loadXml( $librarian->get_sitemap_text(
			Jetpack_Sitemap_Librarian::SITEMAP_NAME_PREFIX . '1',
			Jetpack_Sitemap_Librarian::SITEMAP_TYPE
		) );

		// Only the 'post' items are included (and the home page).
		$this->assertEquals(
			6,
			$dom->getElementsByTagName( 'url' )->length
		);

		/**
		 * Add 'custom' post type.
		 *
		 * @param array $array The array of post types.
		 */
		function set_post_types( $array ) {
			$array[] = 'custom';
			return $array;
		}

		add_filter(
			'jetpack_sitemap_post_types',
			'set_post_types',
			10,
			1
		);

		// Need to instantiate a new builder because the jetpack_sitemap_post_types
		// filter is only applied when a builder is constructed.
		$builder = new Jetpack_Sitemap_Builder();
		$builder->update_sitemap();

		$dom->loadXml( $librarian->get_sitemap_text(
			Jetpack_Sitemap_Librarian::SITEMAP_NAME_PREFIX . '1',
			Jetpack_Sitemap_Librarian::SITEMAP_TYPE
		) );

		// Now all 10 posts are represented (and the home page).
		$this->assertEquals(
			11,
			$dom->getElementsByTagName( 'url' )->length
		);
	}

	/**
	 * Building all sitemaps stores a valid XML file as the master
	 * sitemap, with root element 'sitemapindex'.
	 *
	 * @covers Jetpack_Sitemap_Builder::update_sitemap
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_builder_master_sitemap() {
		$builder   = new Jetpack_Sitemap_Builder();
		$librarian = new Jetpack_Sitemap_Librarian();

		// First delete all data and verify there is no master sitemap stored.
		$librarian->delete_all_stored_sitemap_data();
		$result = $librarian->read_sitemap_data(
			Jetpack_Sitemap_Librarian::MASTER_SITEMAP_NAME,
			Jetpack_Sitemap_Librarian::MASTER_SITEMAP_TYPE
		);

		$this->assertNull( $result );

		// Then call update_sitemap() and verify that there is a master sitemap stored.
		$builder->update_sitemap();
		$result = $librarian->read_sitemap_data(
			Jetpack_Sitemap_Librarian::MASTER_SITEMAP_NAME,
			Jetpack_Sitemap_Librarian::MASTER_SITEMAP_TYPE
		);

		$this->assertNotNull( $result );

		// Finally check that the master sitemap is valid XML, with root element 'sitemapindex'.
		$master = simplexml_load_string(
			$librarian->get_sitemap_text(
				Jetpack_Sitemap_Librarian::MASTER_SITEMAP_NAME,
				Jetpack_Sitemap_Librarian::MASTER_SITEMAP_TYPE
			)
		);

		$this->assertNotEquals( false, $master );
		$this->assertEquals( 'sitemapindex', $master->getName() );
	}

}
