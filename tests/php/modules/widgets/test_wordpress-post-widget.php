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
				'code' => 200,
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
				'code' => 200,
			),
			'body'     => 'asd'
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
				'code' => 200,
			),
			'body'     => json_encode(
				array( 'error' => 'test error' )
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
				'code' => 200,
			),
			'body'     => json_encode(
				array( 'mydata' => 'your data' )
			),
		);

		$result = $this->inst->parse_service_response( $input_data );

		$expectedValue         = new stdClass;
		$expectedValue->mydata = 'your data';

		$this->assertEquals( $expectedValue, $result );

	}


	/**
	 * Test what value returns get_site_hash
	 */
	function test_get_site_hash() {

		$result = $this->inst->get_site_hash( 'http://test.com' );

		$this->assertEquals( '1aa0d4413384d91bc0d45', $result );
	}


	/**
	 * Test fetch_blog_data with invalid site info
	 */
	function test_fetch_blog_data_invalid_site_info() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
		             ->setMethods( array(
			                           'fetch_site_info',
			                           'parse_site_info_response',
			                           'fetch_posts_for_site',
			                           'parse_posts_response'
		                           ) )
		             ->disableOriginalConstructor()
		             ->getMock();

		$mock->expects( $this->any() )
		     ->method( 'fetch_site_info' )
		     ->with( 'http://test.com' )
		     ->will( $this->returnValue( ( 'test_param_1' ) ) );

		$test_error = new WP_Error( 'broke', 'the', 'test' );

		$mock->expects( $this->any() )
		     ->method( 'parse_site_info_response' )
		     ->with( 'test_param_1' )
		     ->will( $this->returnValue( $test_error ) );


		$mock->expects( $this->never() )
		     ->method( 'fetch_posts_for_site' );

		$mock->expects( $this->never() )
		     ->method( 'parse_posts_response' );

		$result = $mock->fetch_blog_data( 'http://test.com' );

		/**
		 * Verify last update, last check times as they are dynamic
		 */

		$current_time = time();

		$this->assertTrue( abs( $current_time - $result['site_info']['last_check'] ) < 10 );
		$this->assertTrue( empty( $result['site_info']['last_update'] ) );

		unset( $result['site_info']['last_check'], $result['site_info']['last_update'] );

		$check_value = array(
			'site_info' => array(
				'data'  => array(),
				'error' => $test_error
			),
			'posts'     => array(
				'data'        => array(),
				'error'       => null,
				'last_check'  => null,
				'last_update' => null,
			)
		);

		$this->assertEquals( $check_value, $result );
	}


	/**
	 * Test fetch_blog_data with invalid posts info
	 */
	function test_fetch_blog_data_invalid_post_info() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
		             ->setMethods( array(
			                           'fetch_site_info',
			                           'parse_site_info_response',
			                           'fetch_posts_for_site',
			                           'parse_posts_response'
		                           ) )
		             ->disableOriginalConstructor()
		             ->getMock();

		$mock->expects( $this->any() )
		     ->method( 'fetch_site_info' )
		     ->with( 'http://test.com' )
		     ->will( $this->returnValue( 'test_param_1' ) );

		$mock->expects( $this->any() )
		     ->method( 'parse_site_info_response' )
		     ->with( 'test_param_1' )
		     ->will( $this->returnValue( ( (object) ( array( 'ID' => 'test_id' ) ) ) ) );

		$mock->expects( $this->any() )
		     ->method( 'fetch_posts_for_site' )
		     ->with( 'test_id' )
		     ->will( $this->returnValue( 'test_param_2' ) );


		$test_error = new WP_Error( 'broke', 'the', 'test' );


		$mock->expects( $this->any() )
		     ->method( 'parse_posts_response' )
		     ->with( 'test_param_2' )
		     ->will( $this->returnValue( $test_error ) );

		$result = $mock->fetch_blog_data( 'http://test.com' );

		/**
		 * Verify last update, last check times as they are dynamic
		 */

		$current_time = time();

		$this->assertTrue( abs( $current_time - $result['site_info']['last_check'] ) < 10 );
		$this->assertTrue( abs( $current_time - $result['site_info']['last_update'] ) < 10 );

		$this->assertTrue( abs( $current_time - $result['posts']['last_check'] ) < 10 );
		$this->assertTrue( empty( $result['posts']['last_update'] ) );

		unset( $result['site_info']['last_check'], $result['site_info']['last_update'] );
		unset( $result['posts']['last_check'], $result['posts']['last_update'] );

		$check_value = array(
			'site_info' => array(
				'data'  => ( (object) ( array( 'ID' => 'test_id' ) ) ),
				'error' => null
			),
			'posts'     => array(
				'data'  => array(),
				'error' => $test_error
			)
		);

		$this->assertEquals( $check_value, $result );
	}


	/**
	 * Test fetch_blog_data with invalid posts info
	 */
	function test_fetch_blog_data_invalid_post_info_predefined_data() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
		             ->setMethods( array(
			                           'fetch_site_info',
			                           'parse_site_info_response',
			                           'fetch_posts_for_site',
			                           'parse_posts_response'
		                           ) )
		             ->disableOriginalConstructor()
		             ->getMock();

		$mock->expects( $this->any() )
		     ->method( 'fetch_site_info' )
		     ->with( 'http://test.com' )
		     ->will( $this->returnValue( 'test_param_1' ) );

		$mock->expects( $this->any() )
		     ->method( 'parse_site_info_response' )
		     ->with( 'test_param_1' )
		     ->will( $this->returnValue( ( (object) ( array( 'ID' => 'test_id' ) ) ) ) );

		$mock->expects( $this->any() )
		     ->method( 'fetch_posts_for_site' )
		     ->with( 'test_id' )
		     ->will( $this->returnValue( 'test_param_2' ) );


		$test_error = new WP_Error( 'broke', 'the', 'test' );


		$mock->expects( $this->any() )
		     ->method( 'parse_posts_response' )
		     ->with( 'test_param_2' )
		     ->will( $this->returnValue( $test_error ) );

		$predefined_data = array(
			'site_info' => array(
				'data'  => ( (object) ( array( 'ID' => 'test_id' ) ) ),
				'error' => null
			),
			'posts'     => array(
				'data'  => array( 'my predefined array' ),
				'error' => $test_error
			)
		);


		$result = $mock->fetch_blog_data( 'http://test.com', $predefined_data );

		/**
		 * Verify last update, last check times as they are dynamic
		 */

		$current_time = time();

		$this->assertTrue( abs( $current_time - $result['site_info']['last_check'] ) < 10 );
		$this->assertTrue( abs( $current_time - $result['site_info']['last_update'] ) < 10 );

		$this->assertTrue( abs( $current_time - $result['posts']['last_check'] ) < 10 );
		$this->assertTrue( empty( $result['posts']['last_update'] ) );

		unset( $result['site_info']['last_check'], $result['site_info']['last_update'] );
		unset( $result['posts']['last_check'], $result['posts']['last_update'] );

		$check_value = array(
			'site_info' => array(
				'data'  => ( (object) ( array( 'ID' => 'test_id' ) ) ),
				'error' => null
			),
			'posts'     => array(
				'data'  => array( 'my predefined array' ),
				'error' => $test_error
			)
		);

		$this->assertEquals( $check_value, $result );
	}


	/**
	 * Test fetch_blog_data with fully valid values
	 */
	function test_fetch_blog_data_valid() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
		             ->setMethods( array(
			                           'fetch_site_info',
			                           'parse_site_info_response',
			                           'fetch_posts_for_site',
			                           'parse_posts_response'
		                           ) )
		             ->disableOriginalConstructor()
		             ->getMock();

		$mock->expects( $this->any() )
		     ->method( 'fetch_site_info' )
		     ->with( 'http://test.com' )
		     ->will( $this->returnValue( 'test_param_1' ) );

		$mock->expects( $this->any() )
		     ->method( 'parse_site_info_response' )
		     ->with( 'test_param_1' )
		     ->will( $this->returnValue( ( (object) ( array( 'ID' => 'test_id' ) ) ) ) );

		$mock->expects( $this->any() )
		     ->method( 'fetch_posts_for_site' )
		     ->with( 'test_id' )
		     ->will( $this->returnValue( 'test_param_2' ) );


		$mock->expects( $this->any() )
		     ->method( 'parse_posts_response' )
		     ->with( 'test_param_2' )
		     ->will( $this->returnValue( 'test_result_final' ) );

		$result = $mock->fetch_blog_data( 'http://test.com' );

		/**
		 * Verify last update, last check times as they are dynamic
		 */

		$current_time = time();

		$this->assertTrue( abs( $current_time - $result['site_info']['last_check'] ) < 10 );
		$this->assertTrue( abs( $current_time - $result['site_info']['last_update'] ) < 10 );

		$this->assertTrue( abs( $current_time - $result['posts']['last_check'] ) < 10 );
		$this->assertTrue( abs( $current_time - $result['posts']['last_update'] ) < 10 );

		unset( $result['site_info']['last_check'], $result['site_info']['last_update'] );
		unset( $result['posts']['last_check'], $result['posts']['last_update'] );

		$check_value = array(
			'site_info' => array(
				'data'  => ( (object) ( array( 'ID' => 'test_id' ) ) ),
				'error' => null
			),
			'posts'     => array(
				'data'  => 'test_result_final',
				'error' => null
			)
		);

		$this->assertEquals( $check_value, $result );
	}


	/**
	 * Test fetch_blog_data with fully valid values
	 */
	function test_get_blog_data_invalid_cache() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
		             ->setMethods( array( 'get_site_hash', 'wp_get_option' ) )
		             ->disableOriginalConstructor()
		             ->getMock();

		$mock->expects( $this->any() )
		     ->method( 'get_site_hash' )
		     ->with( 'http://test.com' )
		     ->will( $this->returnValue( 'test_option_hash' ) );

		$mock->expects( $this->any() )
		     ->method( 'wp_get_option' )
		     ->with( $mock->widget_options_key_prefix . 'test_option_hash' )
		     ->will( $this->returnValue( false ) );

		$result = $mock->get_blog_data( 'http://test.com' );

		$this->assertTrue( is_wp_error( $result ) );

		$message = $result->get_error_messages();

		$this->assertEquals( array( 'Information about this blog is being currently retrieved.' ), $message );

		$codes = $result->get_error_codes();

		$this->assertEquals( array( 'empty_cache' ), $codes );
	}


	/**
	 * Test fetch_blog_data with fully valid values
	 */
	function test_get_blog_data_valid_cache() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
		             ->setMethods( array( 'get_site_hash', 'wp_get_option' ) )
		             ->disableOriginalConstructor()
		             ->getMock();

		$mock->expects( $this->any() )
		     ->method( 'get_site_hash' )
		     ->with( 'http://test.com' )
		     ->will( $this->returnValue( 'test_option_hash' ) );

		$mock->expects( $this->any() )
		     ->method( 'wp_get_option' )
		     ->with( $mock->widget_options_key_prefix . 'test_option_hash' )
		     ->will( $this->returnValue( 'real value' ) );

		$result = $mock->get_blog_data( 'http://test.com' );

		$this->assertEquals( 'real value', $result );
	}

	/**
	 * Test parse_posts_response with valid data
	 */
	function test_parse_posts_response_valid() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
		             ->setMethods( array( 'format_posts_for_storage' ) )
		             ->disableOriginalConstructor()
		             ->getMock();

		$service_response_test = (object) ( array(
			'posts' => array( '1,2,3' ),
		) );

		$mock->expects( $this->any() )
		     ->method( 'format_posts_for_storage' )
		     ->with( $service_response_test )
		     ->will( $this->returnValue( 'other test value' ) );

		$result = $mock->parse_posts_response( $service_response_test );

		$this->assertEquals( 'other test value', $result );
	}

	/**
	 * Test parse_posts_response with WP_Error
	 */
	function test_parse_posts_response_wp_error() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
		             ->setMethods( array( 'format_posts_for_storage' ) )
		             ->disableOriginalConstructor()
		             ->getMock();

		$service_response_test_wp_err = new WP_Error( 'test code', 'test message', 'test_data' );

		$mock->expects( $this->never() )
		     ->method( 'format_posts_for_storage' );

		$result = $mock->parse_posts_response( $service_response_test_wp_err );

		$this->assertTrue( is_wp_error( $result ) );

		$message = $result->get_error_messages();

		$this->assertEquals( array( 'test message' ), $message );

		$codes = $result->get_error_codes();

		$this->assertEquals( array( 'test code' ), $codes );
	}

	/**
	 * Test parse_posts_response with invalid data
	 */
	function test_parse_posts_response_invalid_data() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
		             ->setMethods( array( 'format_posts_for_storage' ) )
		             ->disableOriginalConstructor()
		             ->getMock();

		$service_response_test_invalid_data = (object) ( array(
			'posts' => 'invalid data',
		) );

		$mock->expects( $this->never() )
		     ->method( 'format_posts_for_storage' );

		$result = $mock->parse_posts_response( $service_response_test_invalid_data );

		$this->assertTrue( is_wp_error( $result ) );

		$message = $result->get_error_messages();

		$this->assertEquals( array( 'No posts data returned by remote.' ), $message );

		$codes = $result->get_error_codes();

		$this->assertEquals( array( 'no_posts' ), $codes );

		$data = $result->get_error_data();

		$this->assertEquals( 'No posts information set in the returned data.', $data );
	}

	/**
	 * Test parse_site_info_response with valid data
	 */
	function test_parse_site_info_response_valid() {

		$service_response_test_valid_data = (object) ( array(
			'ID' => 55
		) );

		$result = $this->inst->parse_site_info_response( $service_response_test_valid_data );

		$this->assertEquals( $service_response_test_valid_data, $result );

	}

	/**
	 * Test parse_site_info_response with WP_Error
	 */
	function test_parse_site_info_response_wp_error() {

		$service_response_test_wp_err = new WP_Error( 'test code', 'test message', 'test_data' );

		$result = $this->inst->parse_site_info_response( $service_response_test_wp_err );

		$this->assertTrue( is_wp_error( $result ) );

		$message = $result->get_error_messages();

		$this->assertEquals( array( 'test message' ), $message );

		$codes = $result->get_error_codes();

		$this->assertEquals( array( 'test code' ), $codes );
	}


	/**
	 * Test parse_site_info_response with WP_Error
	 */
	function test_parse_site_info_response_invalid_data() {

		$service_response_test_invalid_data = (object) ( array(
			'not_valid' => 55
		) );

		$result = $this->inst->parse_site_info_response( $service_response_test_invalid_data );

		$this->assertTrue( is_wp_error( $result ) );

		$message = $result->get_error_messages();

		$this->assertEquals( array( 'Invalid site information returned from remote.' ), $message );

		$codes = $result->get_error_codes();

		$this->assertEquals( array( 'no_site_info' ), $codes );

		$data = $result->get_error_data();

		$this->assertEquals( 'No site ID present in the response.', $data );
	}


	/**
	 * Test format_posts_for_storage with valid data
	 */
	function tests_format_posts_for_storage_valid() {

		$posts_list_test = (object) ( array(
			'posts' => array(
				(object) ( array(
					'title'          => 'test title 1',
					'excerpt'        => 'This is my test excerpt 1',
					'featured_image' => 'test image 1.png',
					'URL'            => 'http://test.com/1',
					'full_text'      => 'Full post text contained here'
				) ),

				(object) ( array(
					'title'          => '',
					'excerpt'        => 'This is my test excerpt 2',
					'featured_image' => 'test image 2.png',
					'URL'            => 'http://test.com/2',
					'full_text'      => 'Full post text contained here'
				) ),

				(object) ( array(
					'title'          => 'Test title 3',
					'excerpt'        => '',
					'featured_image' => 'test image 3.png',
					'URL'            => 'http://test.com/3',
					'full_text'      => 'Full post text contained here'
				) ),

				(object) ( array(
					'title'          => '',
					'excerpt'        => '',
					'featured_image' => '',
					'URL'            => '',
					'full_text'      => ''
				) ),
			)
		) );


		$result = $this->inst->format_posts_for_storage( $posts_list_test );

		$expected_posts_list = array(
			array(
				'title'          => 'test title 1',
				'excerpt'        => 'This is my test excerpt 1',
				'featured_image' => 'test image 1.png',
				'url'            => 'http://test.com/1',
			),
			array(
				'title'          => '',
				'excerpt'        => 'This is my test excerpt 2',
				'featured_image' => 'test image 2.png',
				'url'            => 'http://test.com/2',
			),
			array(
				'title'          => 'Test title 3',
				'excerpt'        => '',
				'featured_image' => 'test image 3.png',
				'url'            => 'http://test.com/3',
			),
			array(
				'title'          => '',
				'excerpt'        => '',
				'featured_image' => '',
				'url'            => '',
			)
		);

		$this->assertEquals( $expected_posts_list, $result );
	}


	/**
	 * Test format_posts_for_storage with invalid data
	 */
	function tests_format_posts_for_storage_invalid() {

		$posts_list_test = (object) ( array(
			'posts' => 'invalid posts'
		) );


		$result = $this->inst->format_posts_for_storage( $posts_list_test );

		$expected_posts_list = array();

		$this->assertEquals( $expected_posts_list, $result );
	}


}
