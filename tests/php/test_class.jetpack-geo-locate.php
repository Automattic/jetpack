<?php

require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-geo-locate.php' );

class WP_Test_Jetpack_Geo_Locate extends WP_UnitTestCase {
	public function tearDown() {
		Jetpack_Geo_Locate::resetInstance();
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
		$this->assertEquals( 41.878114, $meta_values['latitude'] );
		$this->assertEquals( -87.629798, $meta_values['longitude'] );
		$this->assertEquals( 'Chicago, IL', $meta_values['label'] );
		$this->assertTrue( $meta_values['is_populated'] );
	}

	private function get_instance() {
		return Jetpack_Geo_Locate::init();
	}

	/**
	 * @return Jetpack_Geo_Locate
	 */
	private function get_instance_with_mock_public_post() {
		/* @var $instance Jetpack_Geo_Locate|PHPUnit_Framework_MockObject_MockObject */
		$instance = $this->getMockBuilder( Jetpack_Geo_Locate::class )
			->disableOriginalConstructor()
			->setMethods( [ 'get_meta_value' ])
			->getMock();

		$instance->method( 'get_meta_value' )
	         ->will(
	         	$this->returnValueMap(
	         	    array(
	         	    	array( 1, 'public', '1' ),
		                array( 1, 'latitude', '41.878114' ),
		                array( 1, 'longitude', '-87.629798' ),
		                array( 1, 'address', 'Chicago, IL' )
	                )
	            )
	         );

		return $instance;
	}
}
