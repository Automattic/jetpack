<?php

require_once JETPACK__PLUGIN_DIR . '/modules/geo-location/class.jetpack-geo-location.php';

class WP_Test_Jetpack_Geo_Location extends WP_UnitTestCase {

	const DISABLE_CONSTRUCTOR = true;

	const ENABLE_CONSTRUCTOR = false;

	const MOCK_LAT = '41.878114';

	const MOCK_LONG = '-87.629798';

	const MOCK_ADDRESS = 'Chicago, IL';

	/**
	 * @var WP_Query
	 */
	private $original_wp_query;

	/**
	 * Set up.
	 */
	public function set_up() {
		global $post, $wp_query;

		parent::set_up();

		$post            = new stdClass();
		$post->ID        = 1;
		$post->post_type = 'post';

		$this->original_wp_query = $wp_query;
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		global $wp_query;

		Jetpack_Geo_Location::reset_instance();

		$wp_query = $this->original_wp_query;

		parent::tear_down();
	}

	public function test_location_display_filter_skipped_when_lacking_theme_support() {
		$instance = $this->create_mock_instance(
			array( 'current_theme_supports', 'the_content_location_display' ),
			self::ENABLE_CONSTRUCTOR
		);

		$instance->method( 'current_theme_supports' )->willReturn( false );

		$instance->expects( $this->never() )
			->method( 'the_content_location_display' );

		$instance->wordpress_init();

		apply_filters( 'the_content', 'Test' );
	}

	public function test_location_display_filter_called_when_theme_supports_geo_location() {
		$theme_support = current_theme_supports( 'jetpack-geo-location' );

		if ( ! $theme_support ) {
			add_theme_support( 'jetpack-geo-location' );
		}

		$instance = $this->create_mock_instance(
			array( 'the_content_location_display' ),
			self::ENABLE_CONSTRUCTOR
		);

		$instance->expects( $this->atLeastOnce() )
			->method( 'the_content_location_display' );

		$instance->wordpress_init();

		apply_filters( 'the_content', 'Test' );

		// Remove theme support again if it was missing originally.
		if ( ! $theme_support ) {
			remove_theme_support( 'jetpack-geo-location' );
		}
	}

	public function test_get_meta_values_returns_valid_array_for_nonexistent_post() {
		$instance    = $this->get_instance();
		$meta_values = $instance->get_meta_values( 100 );

		$this->assertIsArray( $meta_values );

		$this->assertArrayHasKey( 'is_public', $meta_values );
		$this->assertArrayHasKey( 'latitude', $meta_values );
		$this->assertArrayHasKey( 'longitude', $meta_values );
		$this->assertArrayHasKey( 'label', $meta_values );
		$this->assertArrayHasKey( 'is_populated', $meta_values );

		$this->assertFalse( $meta_values['is_public'] );
		$this->assertNull( $meta_values['latitude'] );
		$this->assertNull( $meta_values['longitude'] );
		$this->assertSame( '', $meta_values['label'] );
		$this->assertFalse( $meta_values['is_populated'] );
	}

	public function test_get_meta_values_returns_valid_array_for_null_post() {
		$instance    = $this->get_instance();
		$meta_values = $instance->get_meta_values( null );

		$this->assertIsArray( $meta_values );

		$this->assertArrayHasKey( 'is_public', $meta_values );
		$this->assertArrayHasKey( 'latitude', $meta_values );
		$this->assertArrayHasKey( 'longitude', $meta_values );
		$this->assertArrayHasKey( 'label', $meta_values );
		$this->assertArrayHasKey( 'is_populated', $meta_values );

		$this->assertFalse( $meta_values['is_public'] );
		$this->assertNull( $meta_values['latitude'] );
		$this->assertNull( $meta_values['longitude'] );
		$this->assertSame( '', $meta_values['label'] );
		$this->assertFalse( $meta_values['is_populated'] );
	}

	public function test_get_meta_values_with_existing_post_returns_expected_values() {
		$instance    = $this->get_instance_with_mock_public_post();
		$meta_values = $instance->get_meta_values( 1 );

		$this->assertIsArray( $meta_values );

		$this->assertArrayHasKey( 'is_public', $meta_values );
		$this->assertArrayHasKey( 'latitude', $meta_values );
		$this->assertArrayHasKey( 'longitude', $meta_values );
		$this->assertArrayHasKey( 'label', $meta_values );
		$this->assertArrayHasKey( 'is_populated', $meta_values );

		$this->assertTrue( $meta_values['is_public'] );
		$this->assertEquals( (float) self::MOCK_LAT, $meta_values['latitude'] );
		$this->assertEquals( (float) self::MOCK_LONG, $meta_values['longitude'] );
		$this->assertEquals( self::MOCK_ADDRESS, $meta_values['label'] );
		$this->assertTrue( $meta_values['is_populated'] );
	}

	public function test_rss_namespace_method_renders_the_namespace() {
		ob_start();
		$this->get_instance()->rss_namespace();
		$this->assertStringContainsString( 'georss.org', ob_get_clean() );
	}

	public function test_rss_item_does_not_render_private_post() {
		$instance = $this->get_instance_with_mock_private_post();

		ob_start();
		$instance->rss_item();
		$output = ob_get_clean();

		$this->assertStringNotContainsString( self::MOCK_LAT, $output );
		$this->assertStringNotContainsString( self::MOCK_LONG, $output );
	}

	public function test_rss_item_does_render_public_post() {
		$instance = $this->get_instance_with_mock_public_post();

		ob_start();
		$instance->rss_item();
		$output = ob_get_clean();

		$this->assertStringContainsString( self::MOCK_LAT, $output );
		$this->assertStringContainsString( self::MOCK_LONG, $output );
	}

	public function test_rss_item_does_escape_malicious_post() {
		$instance = $this->get_instance_with_mock_malicious_post();

		ob_start();
		$instance->rss_item();
		$output = ob_get_clean();

		$this->assertStringNotContainsString( '<attack>', $output );
		$this->assertStringContainsString( '&#60;', $output );
		$this->assertStringContainsString( '&#62;', $output );
	}

	public function test_wp_head_aborts_when_not_a_single_post_response() {
		$instance = $this->get_instance_with_mock_public_post();

		$this->mock_is_not_single();

		ob_start();
		$instance->wp_head();
		$output = ob_get_clean();

		$this->assertSame( '', trim( $output ) );
	}

	public function test_wp_head_aborts_when_meta_values_are_private() {
		$instance = $this->get_instance_with_mock_private_post();

		$this->mock_is_single();

		ob_start();
		$instance->wp_head();
		$output = ob_get_clean();

		$this->assertSame( '', trim( $output ) );
	}

	public function test_wp_head_renders_public_meta_values() {
		$instance = $this->get_instance_with_mock_public_post();

		$this->mock_is_single();

		ob_start();
		$instance->wp_head();
		$output = ob_get_clean();

		$this->assertStringContainsString( self::MOCK_LAT, $output );
		$this->assertStringContainsString( self::MOCK_LONG, $output );
	}

	public function test_wp_head_escapes_malicious_meta_values() {
		$instance = $this->get_instance_with_mock_malicious_post();

		$this->mock_is_single();

		ob_start();
		$instance->wp_head();
		$output = ob_get_clean();

		$this->assertStringNotContainsString( '<attack>', $output );
		$this->assertStringContainsString( '&lt;', $output );
		$this->assertStringContainsString( '&gt;', $output );
	}

	public function test_the_content_microformat_aborts_when_is_feed() {
		$instance = $this->get_instance_with_mock_public_post();

		$this->mock_is_feed();

		$this->assertEquals( 'Original content', $instance->the_content_microformat( 'Original content' ) );
	}

	public function test_the_content_microformat_aborts_when_meta_values_are_private() {
		$instance = $this->get_instance_with_mock_private_post();

		$this->mock_is_not_feed();

		$this->assertEquals( 'Original content', $instance->the_content_microformat( 'Original content' ) );
	}

	public function test_the_content_microformat_appends_microformat_when_meta_values_are_public() {
		$instance = $this->get_instance_with_mock_public_post();

		$this->mock_is_not_feed();

		$modified_content = $instance->the_content_microformat( 'Original content' );

		$this->assertStringStartsWith( 'Original content', $modified_content );
		$this->assertStringContainsString( self::MOCK_LAT, $modified_content );
		$this->assertStringContainsString( self::MOCK_LONG, $modified_content );
		$this->assertStringContainsString( '<span class="latitude">', $modified_content );
		$this->assertStringContainsString( '<span class="longitude">', $modified_content );
	}

	public function test_the_content_microformat_escapes_malicious_meta_values() {
		$instance = $this->get_instance_with_mock_malicious_post();

		$this->mock_is_not_feed();

		$modified_content = $instance->the_content_microformat( 'Original content' );

		$this->assertStringStartsWith( 'Original content', $modified_content );
		$this->assertStringNotContainsString( '<attack>', $modified_content );
		$this->assertStringContainsString( '&lt;', $modified_content );
		$this->assertStringContainsString( '&gt;', $modified_content );
	}

	public function test_the_content_location_display_aborts_when_is_not_single() {
		$instance = $this->get_instance_with_mock_public_post();

		$this->mock_is_not_single();

		$this->assertEquals( 'Original content', $instance->the_content_location_display( 'Original content' ) );
	}

	public function test_the_content_location_display_aborts_when_meta_values_are_private() {
		$instance = $this->get_instance_with_mock_private_post();

		$this->mock_is_single();

		$this->assertEquals( 'Original content', $instance->the_content_location_display( 'Original content' ) );
	}

	public function test_the_content_location_display_appends_microformat_when_meta_values_are_public() {
		$instance = $this->get_instance_with_mock_public_post();

		$this->mock_is_single();

		$modified_content = $instance->the_content_location_display( 'Original content' );

		$this->assertStringStartsWith( 'Original content', $modified_content );
		$this->assertStringContainsString( self::MOCK_ADDRESS, $modified_content );
	}

	public function test_the_content_location_display_escapes_malicious_meta_values() {
		$instance = $this->get_instance_with_mock_malicious_post();

		$this->mock_is_single();

		$modified_content = $instance->the_content_location_display( 'Original content' );

		$this->assertStringStartsWith( 'Original content', $modified_content );
		$this->assertStringNotContainsString( '<attack>', $modified_content );
		$this->assertStringContainsString( '&lt;', $modified_content );
		$this->assertStringContainsString( '&gt;', $modified_content );
	}

	private function get_instance() {
		return Jetpack_Geo_Location::init();
	}

	private function get_instance_with_mock_public_post() {
		$instance = $this->create_mock_instance();

		$instance->method( 'get_meta_value' )
			->will(
				$this->returnValueMap(
					array(
						array( 1, 'public', '1' ),
						array( 1, 'latitude', self::MOCK_LAT ),
						array( 1, 'longitude', self::MOCK_LONG ),
						array( 1, 'address', self::MOCK_ADDRESS ),
					)
				)
			);

		return $instance;
	}

	private function get_instance_with_mock_malicious_post() {
		$instance = $this->create_mock_instance( array( 'get_meta_values' ) );

		$instance->method( 'get_meta_values' )
			->will(
				$this->returnValue(
					array(
						'is_public'    => true,
						'latitude'     => '<attack>',
						'longitude'    => '<attack>',
						'label'        => '<attack>',
						'is_populated' => true,
					)
				)
			);

		return $instance;
	}

	private function get_instance_with_mock_private_post() {
		$instance = $this->create_mock_instance();

		$instance->method( 'get_meta_value' )
			->will(
				$this->returnValueMap(
					array(
						array( 1, 'public', '0' ),
						array( 1, 'latitude', self::MOCK_LAT ),
						array( 1, 'longitude', self::MOCK_LONG ),
						array( 1, 'address', self::MOCK_ADDRESS ),
					)
				)
			);

		return $instance;
	}

	/**
	 * @param string[] $additional_mock_methods
	 * @param boolean  $disable_constructor
	 * @return Jetpack_Geo_Location|PHPUnit_Framework_MockObject_MockObject
	 */
	private function create_mock_instance(
		$additional_mock_methods = array(),
		$disable_constructor = self::DISABLE_CONSTRUCTOR
	) {
		$mock_methods = array_merge(
			array( 'get_meta_value' ),
			$additional_mock_methods
		);

		/**
		 * @var $instance Jetpack_Geo_Location|PHPUnit_Framework_MockObject_MockObject
		 */
		$builder = $this->getMockBuilder( Jetpack_Geo_Location::class )
			->setMethods( $mock_methods );

		if ( $disable_constructor ) {
			$builder->disableOriginalConstructor();
		}

		return $builder->getMock();
	}

	private function mock_is_single() {
		global $wp_query;

		/**
		 * @var $wp_query WP_Query|PHPUnit_Framework_MockObject_MockObject
		 */
		$wp_query = $this->getMockBuilder( WP_Query::class )
			->setMethods( array( 'is_feed', 'is_single' ) )
			->getMock();

		$wp_query->expects( $this->any() )
			->method( 'is_single' )
			->willReturn( true );
	}

	private function mock_is_not_single() {
		global $wp_query;

		/**
		 * @var $wp_query WP_Query|PHPUnit_Framework_MockObject_MockObject
		 */
		$wp_query = $this->getMockBuilder( WP_Query::class )
			->setMethods( array( 'is_feed', 'is_single' ) )
			->getMock();

		$wp_query->expects( $this->any() )
			->method( 'is_single' )
			->willReturn( false );
	}

	private function mock_is_feed() {
		global $wp_query;

		/**
		 * @var $wp_query WP_Query|PHPUnit_Framework_MockObject_MockObject
		 */
		$wp_query = $this->getMockBuilder( WP_Query::class )
			->setMethods( array( 'is_feed' ) )
			->getMock();

		$wp_query->expects( $this->any() )
			->method( 'is_feed' )
			->willReturn( true );
	}

	private function mock_is_not_feed() {
		global $wp_query;

		/**
		 * @var $wp_query WP_Query|PHPUnit_Framework_MockObject_MockObject
		 */
		$wp_query = $this->getMockBuilder( WP_Query::class )
			->setMethods( array( 'is_feed' ) )
			->getMock();

		$wp_query->expects( $this->any() )
			->method( 'is_feed' )
			->willReturn( false );
	}
}
