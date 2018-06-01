<?php

require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-geo-locate.php' );

class WP_Test_Jetpack_Geo_Locate extends WP_UnitTestCase {
	const DISABLE_CONSTRUCTOR = true;

	const ENABLE_CONSTRUCTOR = false;

	const MOCK_LAT = '41.878114';

	const MOCK_LONG = '-87.629798';

	const MOCK_ADDRESS = 'Chicago, IL';

	public function setUp() {
		global $post;

		$post = new stdClass();
		$post->ID = 1;
	}

	public function tearDown() {
		Jetpack_Geo_Locate::reset_instance();
	}

	public function test_location_display_filter_skipped_when_lacking_theme_support() {
		$instance = $this->create_mock_instance(
			[ 'current_theme_supports', 'the_content_location_display' ],
			self::ENABLE_CONSTRUCTOR
		);

		$instance->method( 'current_theme_supports' )->willReturn( false );

		$instance->expects( $this->never() )
			->method( 'the_content_location_display' );

		$instance->wordpress_init();

		apply_filters( 'the_content', 'Test' );
	}

	public function test_location_display_filter_called_when_theme_supports_geo_location() {
		$instance = $this->create_mock_instance(
			[ 'current_theme_supports', 'the_content_location_display' ],
			self::ENABLE_CONSTRUCTOR
		);

		$instance->method( 'current_theme_supports' )->with( 'geo-location' )->willReturn( true );

		$instance->expects( $this->atLeastOnce() )
			->method( 'the_content_location_display' );

		$instance->wordpress_init();

		apply_filters( 'the_content', 'Test' );
	}

	public function test_get_meta_values_returns_valid_array_for_nonexistent_post() {
		$instance    = $this->get_instance();
		$meta_values = $instance->get_meta_values( 100 );

		$this->assertTrue( is_array( $meta_values ) );

		$this->assertArrayHasKey( 'is_public', $meta_values );
		$this->assertArrayHasKey( 'latitude', $meta_values );
		$this->assertArrayHasKey( 'longitude', $meta_values );
		$this->assertArrayHasKey( 'label', $meta_values );
		$this->assertArrayHasKey( 'is_populated', $meta_values );

		$this->assertFalse( $meta_values['is_public'] );
		$this->assertNull( $meta_values['latitude'] );
		$this->assertNull( $meta_values['longitude'] );
		$this->assertEquals( '', $meta_values['label'] );
		$this->assertFalse( $meta_values['is_populated'] );
	}

	public function test_get_meta_values_returns_valid_array_for_null_post() {
		$instance    = $this->get_instance();
		$meta_values = $instance->get_meta_values( null );

		$this->assertTrue( is_array( $meta_values ) );

		$this->assertArrayHasKey( 'is_public', $meta_values );
		$this->assertArrayHasKey( 'latitude', $meta_values );
		$this->assertArrayHasKey( 'longitude', $meta_values );
		$this->assertArrayHasKey( 'label', $meta_values );
		$this->assertArrayHasKey( 'is_populated', $meta_values );

		$this->assertFalse( $meta_values['is_public'] );
		$this->assertNull( $meta_values['latitude'] );
		$this->assertNull( $meta_values['longitude'] );
		$this->assertEquals( '', $meta_values['label'] );
		$this->assertFalse( $meta_values['is_populated'] );
	}

	public function test_get_meta_values_with_existing_post_returns_expected_values() {
		$instance    = $this->get_instance_with_mock_public_post();
		$meta_values = $instance->get_meta_values( 1 );

		$this->assertTrue( is_array( $meta_values ) );

		$this->assertArrayHasKey( 'is_public', $meta_values );
		$this->assertArrayHasKey( 'latitude', $meta_values );
		$this->assertArrayHasKey( 'longitude', $meta_values );
		$this->assertArrayHasKey( 'label', $meta_values );
		$this->assertArrayHasKey( 'is_populated', $meta_values );

		$this->assertTrue( $meta_values['is_public'] );
		$this->assertEquals( (float) self::MOCK_LAT , $meta_values['latitude'] );
		$this->assertEquals( (float) self::MOCK_LONG , $meta_values['longitude'] );
		$this->assertEquals( self::MOCK_ADDRESS, $meta_values['label'] );
		$this->assertTrue( $meta_values['is_populated'] );
	}

	public function test_rss_namespace_method_renders_the_namespace() {
		ob_start();
		$this->get_instance()->rss_namespace();
		$this->assertContains( 'georss.org', ob_get_clean() );
	}

	public function test_rss_item_does_not_render_private_post() {
		$instance = $this->get_instance_with_mock_private_post();

		ob_start();
		$instance->rss_item();
		$output = ob_get_clean();

		$this->assertNotContains( self::MOCK_LAT, $output);
		$this->assertNotContains( self::MOCK_LONG, $output);
	}

	public function test_rss_item_does_render_public_post() {
		$instance = $this->get_instance_with_mock_public_post();

		ob_start();
		$instance->rss_item();
		$output = ob_get_clean();

		$this->assertContains( self::MOCK_LAT, $output);
		$this->assertContains( self::MOCK_LONG, $output);
	}

	public function test_rss_item_does_escape_malicious_post() {
		$instance = $this->get_instance_with_mock_malicious_post();

		ob_start();
		$instance->rss_item();
		$output = ob_get_clean();

		$this->assertNotContains( '<attack>', $output );
		$this->assertContains( '&#60;', $output );
		$this->assertContains( '&#62;', $output );
	}

	public function test_wp_head_aborts_when_not_a_single_post_response() {
		$instance = $this->get_instance_with_mock_public_post();

		$instance->method( 'is_single' )->willReturn( false );

		$this->assertNull( $instance->wp_head() );
	}

	public function test_wp_head_aborts_when_meta_values_are_private() {
		$instance = $this->get_instance_with_mock_private_post();

		$instance->method( 'is_single' )->willReturn( true );

		$this->assertNull( $instance->wp_head() );
	}

	public function test_wp_head_renders_public_meta_values() {
		$instance = $this->get_instance_with_mock_public_post();

		$instance->method( 'is_single' )->willReturn( true );

		ob_start();
		$instance->wp_head();
		$output = ob_get_clean();

		$this->assertContains( self::MOCK_LAT, $output);
		$this->assertContains( self::MOCK_LONG, $output);
	}

	public function test_wp_head_escapes_malicious_meta_values() {
		$instance = $this->get_instance_with_mock_malicious_post();

		$instance->method( 'is_single' )->willReturn( true );

		ob_start();
		$instance->wp_head();
		$output = ob_get_clean();

		$this->assertNotContains( '<attack>', $output );
		$this->assertContains( '&lt;', $output );
		$this->assertContains( '&gt;', $output );
	}

	public function test_the_content_microformat_aborts_when_is_feed() {
		$instance = $this->get_instance_with_mock_public_post();

		$instance->method( 'is_feed' )->willReturn( true );

		$this->assertEquals( 'Original content',  $instance->the_content_microformat( 'Original content' ) );
	}

	public function test_the_content_microformat_aborts_when_meta_values_are_private() {
		$instance = $this->get_instance_with_mock_private_post();

		$instance->method( 'is_feed' )->willReturn( false );

		$this->assertEquals( 'Original content',  $instance->the_content_microformat( 'Original content' ) );
	}

	public function test_the_content_microformat_appends_microformat_when_meta_values_are_public() {
		$instance = $this->get_instance_with_mock_public_post();

		$instance->method( 'is_feed' )->willReturn( false );

		$modifiedContent = $instance->the_content_microformat( 'Original content' );

		$this->assertStringStartsWith( 'Original content', $modifiedContent);
		$this->assertContains( self::MOCK_LAT, $modifiedContent);
		$this->assertContains( self::MOCK_LONG, $modifiedContent);
		$this->assertContains( '<span class="latitude">', $modifiedContent);
		$this->assertContains( '<span class="longitude">', $modifiedContent);
	}

	public function test_the_content_microformat_escapes_malicious_meta_values() {
		$instance = $this->get_instance_with_mock_malicious_post();

		$instance->method( 'is_feed' )->willReturn( false );

		$modifiedContent = $instance->the_content_microformat( 'Original content' );

		$this->assertStringStartsWith( 'Original content', $modifiedContent);
		$this->assertNotContains( '<attack>', $modifiedContent );
		$this->assertContains( '&lt;', $modifiedContent );
		$this->assertContains( '&gt;', $modifiedContent );
	}

	public function test_the_content_location_display_aborts_when_is_not_single() {
		$instance = $this->get_instance_with_mock_public_post();

		$instance->method( 'is_single' )->willReturn( false );

		$this->assertEquals( 'Original content',  $instance->the_content_location_display( 'Original content' ) );
	}

	public function test_the_content_location_display_aborts_when_meta_values_are_private() {
		$instance = $this->get_instance_with_mock_private_post();

		$instance->method( 'is_single' )->willReturn( true );

		$this->assertEquals( 'Original content',  $instance->the_content_location_display( 'Original content' ) );
	}

	public function test_the_content_location_display_appends_microformat_when_meta_values_are_public() {
		$instance = $this->get_instance_with_mock_public_post();

		$instance->method( 'is_single' )->willReturn( true );

		$modifiedContent = $instance->the_content_location_display( 'Original content' );

		$this->assertStringStartsWith( 'Original content', $modifiedContent);
		$this->assertContains( self::MOCK_ADDRESS, $modifiedContent);
	}

	public function test_the_content_location_display_escapes_malicious_meta_values() {
		$instance = $this->get_instance_with_mock_malicious_post();

		$instance->method( 'is_single' )->willReturn( true );

		$modifiedContent = $instance->the_content_location_display( 'Original content' );

		$this->assertStringStartsWith( 'Original content', $modifiedContent);
		$this->assertNotContains( '<attack>', $modifiedContent );
		$this->assertContains( '&lt;', $modifiedContent );
		$this->assertContains( '&gt;', $modifiedContent );
	}

	private function get_instance() {
		return Jetpack_Geo_Locate::init();
	}

	private function get_instance_with_mock_public_post() {
		$instance = $this->create_mock_instance();

		$instance->method( 'get_meta_value' )
	         ->will(
	         	$this->returnValueMap(
	         	    array(
	         	    	array( 1, 'public', '1' ),
		                array( 1, 'latitude', self::MOCK_LAT ),
		                array( 1, 'longitude',  self::MOCK_LONG ),
		                array( 1, 'address', self::MOCK_ADDRESS )
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
				         array( 1, 'address', self::MOCK_ADDRESS )
			         )
		         )
	         );

		return $instance;
	}

	/**
	 * @param string[] $additional_mock_methods
	 * @param boolean $disable_constructor
	 * @return Jetpack_Geo_Locate|PHPUnit_Framework_MockObject_MockObject
	 */
	private function create_mock_instance(
		$additional_mock_methods = array(),
		$disable_constructor = self::DISABLE_CONSTRUCTOR
	) {
		$mock_methods = array_merge(
			array( 'get_meta_value', 'is_single', 'is_feed' ),
			$additional_mock_methods
		);

		/* @var $instance Jetpack_Geo_Locate|PHPUnit_Framework_MockObject_MockObject */
		$builder = $this->getMockBuilder( Jetpack_Geo_Locate::class )
			->setMethods( $mock_methods );

		if ( $disable_constructor ) {
			$builder->disableOriginalConstructor();
		}

        return $builder->getMock();
	}
}
