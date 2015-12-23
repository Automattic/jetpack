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

		$this->assertTrue( is_wp_error( $result ) );

		$this->assertEquals( array( 'general_error' ), $result->get_error_codes() );
		$this->assertEquals( array( 'An error occurred while fetching data from remote.' ), $result->get_error_messages() );
		$this->assertEquals( array( 'TEST CASE' ), $result->get_error_data() );

	}


	/**
	 * Test parse_service_response when called with a WP_Error
	 */
	function test_parse_service_response_bad_request() {

		$input_data = array(
			'response' => array(
				'code'    => 500,
				'message' => 'TESTING, ATTENTION'
			)
		);

		$result = $this->inst->parse_service_response( $input_data );

		$this->assertTrue( is_wp_error( $result ) );

		$this->assertEquals( array( 'http_error' ), $result->get_error_codes() );
		$this->assertEquals( array( 'An error occurred while fetching data from remote.' ), $result->get_error_messages() );
		$this->assertEquals( 'TESTING, ATTENTION', $result->get_error_data() );

	}


	/**
	 * Test parse_service_response when called with missing body
	 */
	function test_parse_service_response_missing_body() {

		$input_data = array(
			'some'     => array(),
			'array'    => 123,
			'data'     => array( 1, 2, 3 ),
			'response' => array(
				'code'    => 200,
			)
		);

		$result = $this->inst->parse_service_response( $input_data );

		$this->assertTrue( is_wp_error( $result ) );

		$this->assertEquals( array( 'no_body' ), $result->get_error_codes() );
		$this->assertEquals( array( 'Invalid data returned by remote.' ), $result->get_error_messages() );
		$this->assertEquals( 'No body in response.', $result->get_error_data() );

	}


	/**
	 * Test parse_service_response when called with broken body
	 */
	function test_parse_service_response_invalid_body_json() {

		$input_data = array(
			'response' => array(
				'code'    => 200,
			),
			'body' => 'asd'
		);

		$result = $this->inst->parse_service_response( $input_data );

		$this->assertTrue( is_wp_error( $result ) );

		$this->assertEquals( array( 'no_body' ), $result->get_error_codes() );
		$this->assertEquals( array( 'Invalid data returned by remote.' ), $result->get_error_messages() );
		$this->assertEquals( 'Invalid JSON from remote.', $result->get_error_data() );

	}


	/**
	 * Test parse_service_response when called with body that has error
	 */
	function test_parse_service_response_body_has_error() {

		$input_data = array(
			'response' => array(
				'code'    => 200,
			),
			'body' => json_encode(
				array('error' => 'test error')
			),
		);

		$result = $this->inst->parse_service_response( $input_data );

		$this->assertTrue( is_wp_error( $result ) );

		$this->assertEquals( array( 'remote_error' ), $result->get_error_codes() );
		$this->assertEquals( array( 'We cannot display information for this blog.' ), $result->get_error_messages() );
		$this->assertEquals( 'test error', $result->get_error_data() );

	}


	/**
	 * Test parse_service_response when called with body that has error
	 */
	function test_parse_service_response_valid_body() {

		$input_data = array(
			'response' => array(
				'code'    => 200,
			),
			'body' => json_encode(
				array('mydata' => 'your data')
			),
		);

		$result = $this->inst->parse_service_response( $input_data );

		$expectedValue = new stdClass;
		$expectedValue->mydata = 'your data';

		$this->assertEquals($expectedValue, $result);

	}

}
