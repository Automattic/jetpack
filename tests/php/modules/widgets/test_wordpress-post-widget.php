<?php

require dirname( __FILE__ ) . '/../../../../modules/widgets/wordpress-post-widget.php';
class WP_Test_Jetpack_Display_Posts_Widget extends WP_UnitTestCase {

	/**
	 * WP_Test_Jetpack_Display_Posts_Widget constructor.
	 */
	function __construct() {
		parent::__construct();
		$this->inst = new Jetpack_Display_Posts_Widget;
	}

	/**
	 * Test parse_service_response when called with a WP_Error
	 */
	function test_parse_service_response_wp_error() {

		$input_data = new WP_Error( 'test_case', 'TEST CASE', 'mydata' );

		$result = $this->inst->parse_service_response( $input_data );

		$this->assertTrue(is_wp_error($result));

		$this->assertEquals(array('general_error'), $result->get_error_codes());
		$this->assertEquals(array('An error occurred while fetching data from remote.'), $result->get_error_messages());
		$this->assertEquals(array('TEST CASE'), $result->get_error_data());

	}

}
