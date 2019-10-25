<?php

require dirname( __FILE__ ) . '/../../../../modules/related-posts.php';

class WP_Test_Jetpack_RelatedPosts extends WP_UnitTestCase {
	static $posts_by_date   = array();
	static $posts_by_tag    = array();
	static $posts_by_format = array();

	public static function wpSetupBeforeClass( $factory ) {
		$inputs = array(
			array(
				'post_date'  => '2011-03-09 12:00:00',
				'tags_input' => array( 'red' ),
				'post_format' => 'aside',
			),
			array(
				'post_date' => '2011-03-19 12:00:00',
				'tags_input' => array( 'green' ),
				'post_format' => 'aside',
			),
			array(
				'post_date' => '2011-07-06 12:00:00',
				'tags_input' => array( 'blue' ),
				'post_format' => 'aside',
			),
			array(
				'post_date' => '2011-07-19 12:00:00',
				'tags_input' => array( 'green', 'blue' ),
				'post_format' => 'aside',
			),
			array(
				'post_date' => '2011-11-17 12:00:00',
				'tags_input' => array( 'red', 'blue' ),
				'post_format' => 'aside',
			),
			array(
				'post_date' => '2011-11-18 12:00:00',
				'tags_input' => array( 'red', 'green' ),
				'post_format' => 'aside',
			),
			array(
				'post_date' => '2011-12-06 12:00:00',
				'tags_input' => array( 'red', 'green', 'blue' ),
				'post_format' => 'status',
			),
			array(
				'post_date' => '2012-04-12 12:00:00',
				'tags_input' => array(),
				'post_format' => 'status',
			),
		);

		foreach ( $inputs as $input ) {
			$post_id = $factory->post->create( $input );
			self::$posts_by_date[ $input['post_date'] ] = $post_id;

			foreach ( $input['tags_input'] as $tag ) {
				if ( ! isset( self::$posts_by_tag[$tag] ) ) {
					self::$posts_by_tag[$tag] = array();
				}

				self::$posts_by_tag[$tag][] = $post_id;
			}

			set_post_format( $post_id, $input['post_format'] );

			self::$posts_by_format[ $input['post_format'] ] = $post_id;
		}
	}

	public function setUp() {
		parent::setUp();

		Jetpack_RelatedPosts_Module::instance()->action_on_load();
		add_filter( 'jetpack_relatedposts_filter_options', '__return_null' );
	}

	/**
	 * Verify that 'enabled' remains the same if it's true.
	 *
	 * @since  4.7.0
	 */
	public function test_options_ok() {
		$options = $options_after_parse = array(
			'enabled'         => true,
			'show_headline'   => true,
			'show_thumbnails' => true,
			'show_date'       => true,
			'show_context'    => true,
			'layout'          => 'grid',
			'headline'        => 'Related',
			'size'            => null,
		);

		$this->assertEquals( $options_after_parse, Jetpack_RelatedPosts::init()->parse_options( $options ) );
	}

	/**
	 * Verify that if 'enabled' is somehow not passed to saving request, it's set to true.
	 *
	 * @since  4.7.0
	 */
	public function test_options_enabled_true_if_not_set() {
		$options = $options_after_parse = array(
			// The option 'enabled' isn't passed if it's saved in Customizer
			'show_headline'   => true,
			'show_thumbnails' => true,
			'show_date'       => true,
			'show_context'    => true,
			'layout'          => 'grid',
			'headline'        => 'Related',
			'size'            => null,
		);

		// Must be true after saving in Customizer
		$options_after_parse['enabled'] = true;

		$this->assertEquals( $options_after_parse, Jetpack_RelatedPosts::init()->parse_options( $options ) );
	}

	/**
	 * Verify that 'enabled' is set to true if one of the keys saved by Customizer are passed.
	 *
	 * @since  4.7.0
	 */
	public function test_options_enabled_false_if_has_customizer_key() {
		$options_after_parse = array(
			'enabled'         => true,
			'show_headline'   => false,
			'show_thumbnails' => false,
			'show_date'       => true,
			'show_context'    => false,
			'layout'          => 'grid',
			'headline'        => 'Related',
			'size'            => null,
		);

		$this->assertEquals( $options_after_parse, Jetpack_RelatedPosts::init()->parse_options( array(
			'enabled'   => false,
			'show_date' => true,
		) ) );

		$options_after_parse['show_date'] = false;
		$this->assertEquals( $options_after_parse, Jetpack_RelatedPosts::init()->parse_options( array(
			'show_date' => false,
		) ) );
	}

	/**
	 * Verify that 'enabled' can be saved as false if it's explicitly set to false.
	 *
	 * @since  4.7.0
	 */
	public function test_options_enabled_false_if_not_customizer_key() {
		$options = $options_after_parse = array(
			'enabled'         => false, // set to false
			'show_headline'   => true,
			'show_thumbnails' => true,
			'size'            => null,
		);

		// When enabled is false, the other options are cleared.
		$empty_options = array(
			'enabled' => false,
			'size'    => null,
		);

		$this->assertEquals( $empty_options, Jetpack_RelatedPosts::init()->parse_options( $options ) );
	}

	public function test_mocked_results_size() {
		global $post;

		$post_id = current( self::$posts_by_date );
		$post = get_post( $post_id );

		$args = array(
			'size'             => 2,
			'post_type'        => 'post',
			'post_formats'     => array(),
			'has_terms'        => array(),
			'date_range'       => array(),
			'exclude_post_ids' => array(),
		);

		$results = Jetpack_RelatedPosts::init()->get_mock_results( $post_id, $args );
		$this->assertCount( 2, $results );

		$args['size'] = 4;
		$results = Jetpack_RelatedPosts::init()->get_mock_results( $post_id, $args );
		$this->assertCount( 4, $results );
	}

	public function test_mocked_results_terms() {
		global $post;

		$post_id = current( self::$posts_by_date );
		$post = get_post( $post_id );

		$red = get_terms( [ 'taxonomy' => 'post_tag', 'slug' => 'red' ] )[0];

		$args = array(
			'size'             => 3,
			'post_type'        => 'post',
			'post_formats'     => array(),
			'has_terms'        => array( $red ),
			'date_range'       => array(),
			'exclude_post_ids' => array(),
		);

		$results = Jetpack_RelatedPosts::init()->get_mock_results( $post_id, $args );
		$this->assertCount( 3, $results );

		foreach ( $results as $result ) {
			$this->assertTrue( has_tag( $red->id, $result['id'] ) );
		}
	}

	public function test_mocked_results_post_formats() {
		global $post;

		$post_id = current( self::$posts_by_date );
		$post = get_post( $post_id );

		$args = array(
			'size'             => 3,
			'post_type'        => 'post',
			'post_formats'     => array( 'aside' ),
			'has_terms'        => array(),
			'date_range'       => array(),
			'exclude_post_ids' => array(),
		);

		$results = Jetpack_RelatedPosts::init()->get_mock_results( $post_id, $args );
		$this->assertCount( 3, $results );

		foreach ( $results as $result ) {
			$this->assertEquals( 'aside', $result['format'] );
		}
	}

	public function test_mocked_results_date_range() {
		global $post;

		$post_id = current( self::$posts_by_date );
		$post = get_post( $post_id );

		$args = array(
			'size'             => 3,
			'post_type'        => 'post',
			'post_formats'     => array(),
			'has_terms'        => array(),
			'date_range'       => array(
				'from' => '2011-08-15 12:00:00',
				'to'   => '2012-01-15 12:00:00',
			),
			'exclude_post_ids' => array(),
		);

		$results = Jetpack_RelatedPosts::init()->get_mock_results( $post_id, $args );
		$this->assertCount( 3, $results );

		foreach ( $results as $result ) {
			// Compares lexicographically, which is fine.
			$this->assertLessThan( '2012-01-15 12:00:00', gmdate( 'Y-m-d H:i:s', strtotime( $result['date'] ) ) );
			$this->assertGreaterThan( '2011-08-15 12:00:00', gmdate( 'Y-m-d H:i:s', strtotime( $result['date'] ) ) );
		}
	}

	public function test_mocked_results_exclude_post_ids() {
		global $post;

		$post_id = current( self::$posts_by_date );
		$post = get_post( $post_id );

		$red = get_terms( [ 'taxonomy' => 'post_tag', 'slug' => 'red' ] )[0];
		$exclude = self::$posts_by_tag['red'][0];

		$args = array(
			'size'             => 4,
			'post_type'        => 'post',
			'post_formats'     => array(),
			'has_terms'        => array( $red ),
			'date_range'       => array(),
			'exclude_post_ids' => array( $exclude ),
		);

		$results = Jetpack_RelatedPosts::init()->get_mock_results( $post_id, $args );
		$this->assertCount( 4, $results );

		foreach ( $results as $result ) {
			$this->assertNotEquals( $exclude, $result['id'] );
		}
	}

	public function test_mocked_results_multiple_conditions() {
		global $post;

		$post_id = current( self::$posts_by_date );
		$post = get_post( $post_id );

		$green = get_terms( [ 'taxonomy' => 'post_tag', 'slug' => 'green' ] )[0];
		$exclude = self::$posts_by_tag['green'][0];

		$args = array(
			'size'             => 2,
			'post_type'        => 'post',
			'post_formats'     => array( 'aside' ),
			'has_terms'        => array( $green ),
			'date_range'       => array(
				'from' => '2011-10-15 12:00:00',
				'to'   => '2012-01-15 12:00:00',
			),
			'exclude_post_ids' => array( $exclude ),
		);

		$results = Jetpack_RelatedPosts::init()->get_mock_results( $post_id, $args );
		$this->assertCount( 2, $results );

		// Only one post that matches these conditions.
		$this->assertEquals( self::$posts_by_tag['green'][2], $results[0]['id'] );

		// The other is a hard-coded post.
		$this->assertEquals( -1, $results[1]['id'] );
	}
}
