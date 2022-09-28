<?php

require __DIR__ . '/../../../../modules/widgets/wordpress-post-widget.php';

class WP_Test_Jetpack_Display_Posts_Widget extends WP_UnitTestCase {

	/**
	 * WP_Test_Jetpack_Display_Posts_Widget constructor.
	 */
	public function __construct() {
		parent::__construct();
		$this->inst = new Jetpack_Display_Posts_Widget();
		remove_action( 'shutdown', 'jetpack_display_posts_conditionally_set_cron_run_status' );
	}

	/**
	 * Test parse_service_response when called with a WP_Error
	 */
	public function test_parse_service_response_wp_error() {

		$input_data = new WP_Error( 'test_case', 'TEST CASE', 'mydata' );

		$result = $this->inst->parse_service_response( $input_data );

		$this->assertTrue( is_wp_error( $result ) );

		$this->assertEquals( array( 'general_error' ), $result->get_error_codes() );
		$this->assertEquals( array( 'An error occurred fetching the remote data.' ), $result->get_error_messages() );
		$this->assertEquals( array( 'TEST CASE' ), $result->get_error_data() );

	}

	/**
	 * Test parse_service_response when called with a WP_Error
	 */
	public function test_parse_service_response_bad_request() {

		$input_data = array(
			'response' => array(
				'code'    => 500,
				'message' => 'TESTING, ATTENTION',
			),
		);

		$result = $this->inst->parse_service_response( $input_data );

		$this->assertTrue( is_wp_error( $result ) );

		$this->assertEquals( array( 'http_error' ), $result->get_error_codes() );
		$this->assertEquals( array( 'An error occurred fetching the remote data.' ), $result->get_error_messages() );
		$this->assertEquals( 'TESTING, ATTENTION', $result->get_error_data() );

	}

	/**
	 * Test parse_service_response when called with missing body
	 */
	public function test_parse_service_response_missing_body() {

		$input_data = array(
			'some'     => array(),
			'array'    => 123,
			'data'     => array( 1, 2, 3 ),
			'response' => array(
				'code' => 200,
			),
		);

		$result = $this->inst->parse_service_response( $input_data );

		$this->assertTrue( is_wp_error( $result ) );

		$this->assertEquals( array( 'no_body' ), $result->get_error_codes() );
		$this->assertEquals( array( 'Invalid remote response.' ), $result->get_error_messages() );
		$this->assertEquals( 'No body in response.', $result->get_error_data() );

	}

	/**
	 * Test parse_service_response when called with broken body
	 */
	public function test_parse_service_response_invalid_body_json() {

		$input_data = array(
			'response' => array(
				'code' => 200,
			),
			'body'     => 'asd',
		);

		$result = $this->inst->parse_service_response( $input_data );

		$this->assertTrue( is_wp_error( $result ) );

		$this->assertEquals( array( 'no_body' ), $result->get_error_codes() );
		$this->assertEquals( array( 'Invalid remote response.' ), $result->get_error_messages() );
		$this->assertEquals( 'Invalid JSON from remote.', $result->get_error_data() );

	}

	/**
	 * Test parse_service_response when called with body that has error
	 */
	public function test_parse_service_response_body_has_error() {

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
		$this->assertEquals( array( 'It looks like the WordPress site URL is incorrectly configured. Please check it in your widget settings.' ), $result->get_error_messages() );
		$this->assertEquals( 'test error', $result->get_error_data() );

	}

	/**
	 * Test parse_service_response when called with body that has error
	 */
	public function test_parse_service_response_valid_body() {

		$input_data = array(
			'response' => array(
				'code' => 200,
			),
			'body'     => json_encode(
				array( 'mydata' => 'your data' )
			),
		);

		$result = $this->inst->parse_service_response( $input_data );

		$expected_value         = new stdClass();
		$expected_value->mydata = 'your data';

		$this->assertEquals( $expected_value, $result );

	}

	/**
	 * Test what value returns get_site_hash
	 */
	public function test_get_site_hash() {

		$result = $this->inst->get_site_hash( 'http://test.com' );

		$this->assertEquals( '1aa0d4413384d91bc0d45', $result );
	}

	/**
	 * Test fetch_blog_data with invalid site info
	 */
	public function test_fetch_blog_data_invalid_site_info() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods(
						array(
							'fetch_site_info',
							'parse_site_info_response',
							'fetch_posts_for_site',
							'parse_posts_response',
						)
					)
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
		$this->assertEmpty( $result['site_info']['last_update'] );

		unset( $result['site_info']['last_check'], $result['site_info']['last_update'] );

		$check_value = array(
			'site_info' => array(
				'data'  => array(),
				'error' => $test_error,
			),
			'posts'     => array(
				'data'        => array(),
				'error'       => null,
				'last_check'  => null,
				'last_update' => null,
			),
		);

		$this->assertEquals( $check_value, $result );
	}

	/**
	 * Test fetch_blog_data with invalid posts info
	 */
	public function test_fetch_blog_data_invalid_post_info() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods(
						array(
							'fetch_site_info',
							'parse_site_info_response',
							'fetch_posts_for_site',
							'parse_posts_response',
						)
					)
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
		$this->assertEmpty( $result['posts']['last_update'] );

		unset( $result['site_info']['last_check'], $result['site_info']['last_update'] );
		unset( $result['posts']['last_check'], $result['posts']['last_update'] );

		$check_value = array(
			'site_info' => array(
				'data'  => ( (object) ( array( 'ID' => 'test_id' ) ) ),
				'error' => null,
			),
			'posts'     => array(
				'data'  => array(),
				'error' => $test_error,
			),
		);

		$this->assertEquals( $check_value, $result );
	}

	/**
	 * Test fetch_blog_data with invalid posts info
	 */
	public function test_fetch_blog_data_invalid_post_info_predefined_data() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods(
						array(
							'fetch_site_info',
							'parse_site_info_response',
							'fetch_posts_for_site',
							'parse_posts_response',
						)
					)
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
				'error' => null,
			),
			'posts'     => array(
				'data'  => array( 'my predefined array' ),
				'error' => $test_error,
			),
		);

		$result = $mock->fetch_blog_data( 'http://test.com', $predefined_data );

		/**
		 * Verify last update, last check times as they are dynamic
		 */

		$current_time = time();

		$this->assertTrue( abs( $current_time - $result['site_info']['last_check'] ) < 10 );
		$this->assertTrue( abs( $current_time - $result['site_info']['last_update'] ) < 10 );

		$this->assertTrue( abs( $current_time - $result['posts']['last_check'] ) < 10 );
		$this->assertTrue( empty( $result['posts']['last_update'] ) ); // phpcs:ignore MediaWiki.PHPUnit.SpecificAssertions.assertEmpty -- We need the potential error suppression.

		unset( $result['site_info']['last_check'], $result['site_info']['last_update'] );
		unset( $result['posts']['last_check'], $result['posts']['last_update'] );

		$check_value = array(
			'site_info' => array(
				'data'  => ( (object) ( array( 'ID' => 'test_id' ) ) ),
				'error' => null,
			),
			'posts'     => array(
				'data'  => array( 'my predefined array' ),
				'error' => $test_error,
			),
		);

		$this->assertEquals( $check_value, $result );
	}

	/**
	 * Test fetch_blog_data with fully valid values
	 */
	public function test_fetch_blog_data_valid() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods(
						array(
							'fetch_site_info',
							'parse_site_info_response',
							'fetch_posts_for_site',
							'parse_posts_response',
						)
					)
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
				'error' => null,
			),
			'posts'     => array(
				'data'  => 'test_result_final',
				'error' => null,
			),
		);

		$this->assertEquals( $check_value, $result );
	}

	/**
	 * Test fetch_blog_data with only site info fetching
	 */
	public function test_fetch_blog_data_only_site_info() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods(
						array(
							'fetch_site_info',
							'parse_site_info_response',
							'fetch_posts_for_site',
							'parse_posts_response',
						)
					)
					->disableOriginalConstructor()
					->getMock();

		$mock->expects( $this->any() )
			->method( 'fetch_site_info' )
			->with( 'http://test.com' )
			->will( $this->returnValue( ( 'test_param_1' ) ) );

		$mock->expects( $this->any() )
			->method( 'parse_site_info_response' )
			->with( 'test_param_1' )
			->will( $this->returnValue( array( 1, 2, 3 ) ) );

		$mock->expects( $this->never() )
			->method( 'fetch_posts_for_site' );

		$mock->expects( $this->never() )
			->method( 'parse_posts_response' );

		$result = $mock->fetch_blog_data( 'http://test.com', array(), true );

		/**
		 * Verify last update, last check times as they are dynamic
		 */

		$current_time = time();

		$this->assertTrue( abs( $current_time - $result['site_info']['last_check'] ) < 10 );
		$this->assertTrue( abs( $current_time - $result['site_info']['last_update'] ) < 10 );

		unset( $result['site_info']['last_check'], $result['site_info']['last_update'] );

		$check_value = array(
			'site_info' => array(
				'data'  => array( 1, 2, 3 ),
				'error' => null,
			),
			'posts'     => array(
				'data'        => array(),
				'error'       => null,
				'last_check'  => null,
				'last_update' => null,
			),
		);

		$this->assertEquals( $check_value, $result );
	}

	/**
	 * Test fetch_blog_data with fully valid values
	 */
	public function test_get_blog_data_invalid_cache() {
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

		$this->assertEquals( array( 'Information about this blog is currently being retrieved.' ), $message );

		$codes = $result->get_error_codes();

		$this->assertEquals( array( 'empty_cache' ), $codes );
	}

	/**
	 * Test fetch_blog_data with fully valid values
	 */
	public function test_get_blog_data_valid_cache() {
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
	public function test_parse_posts_response_valid() {
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
	public function test_parse_posts_response_wp_error() {
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
	public function test_parse_posts_response_invalid_data() {
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
	public function test_parse_site_info_response_valid() {

		$service_response_test_valid_data = (object) ( array(
			'ID' => 55,
		) );

		$result = $this->inst->parse_site_info_response( $service_response_test_valid_data );

		$this->assertEquals( $service_response_test_valid_data, $result );

	}

	/**
	 * Test parse_site_info_response with WP_Error
	 */
	public function test_parse_site_info_response_wp_error() {

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
	public function test_parse_site_info_response_invalid_data() {

		$service_response_test_invalid_data = (object) ( array(
			'not_valid' => 55,
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
	public function tests_format_posts_for_storage_valid() {

		$posts_list_test = (object) ( array(
			'posts' => array(
				(object) ( array(
					'title'          => 'test title 1',
					'excerpt'        => 'This is my test excerpt 1',
					'featured_image' => 'test image 1.png',
					'URL'            => 'http://test.com/1',
					'full_text'      => 'Full post text contained here',
				) ),

				(object) ( array(
					'title'          => '',
					'excerpt'        => 'This is my test excerpt 2',
					'featured_image' => 'test image 2.png',
					'URL'            => 'http://test.com/2',
					'full_text'      => 'Full post text contained here',
				) ),

				(object) ( array(
					'title'          => 'Test title 3',
					'excerpt'        => '',
					'featured_image' => 'test image 3.png',
					'URL'            => 'http://test.com/3',
					'full_text'      => 'Full post text contained here',
				) ),

				(object) ( array(
					'title'          => '',
					'excerpt'        => '',
					'featured_image' => '',
					'URL'            => '',
					'full_text'      => '',
				) ),
			),
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
			),
		);

		$this->assertEquals( $expected_posts_list, $result );
	}

	/**
	 * Test format_posts_for_storage with invalid data
	 */
	public function tests_format_posts_for_storage_invalid() {

		$posts_list_test = (object) ( array(
			'posts' => 'invalid posts',
		) );

		$result = $this->inst->format_posts_for_storage( $posts_list_test );

		$expected_posts_list = array();

		$this->assertEquals( $expected_posts_list, $result );
	}

	/**
	 * Test cron_task with valid data
	 */
	public function test_cron_task_valid_data() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods( array( 'get_instances_sites', 'update_instance', 'should_cron_be_running' ) )
					->disableOriginalConstructor()
					->getMock();

		$mock->expects( $this->any() )
			->method( 'should_cron_be_running' )
			->will( $this->returnValue( true ) );

		$mock->expects( $this->any() )
			->method( 'get_instances_sites' )
			->will( $this->returnValue( array( 'test_url_1', 'test_url_2', 'test_url_3' ) ) );

		$mock->expects( $this->exactly( 3 ) )
			->method( 'update_instance' )
			->withConsecutive(
				array( 'test_url_1' ),
				array( 'test_url_2' ),
				array( 'test_url_3' )
			);

		$result = $mock->cron_task();

		$this->assertTrue( $result );
	}

	/**
	 * Test cron_task with invalid data
	 */
	public function test_cron_task_no_data() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods( array( 'get_instances_sites', 'update_instance', 'should_cron_be_running' ) )
					->disableOriginalConstructor()
					->getMock();

		$mock->expects( $this->any() )
			->method( 'should_cron_be_running' )
			->will( $this->returnValue( true ) );

		$mock->expects( $this->any() )
			->method( 'get_instances_sites' )
			->will( $this->returnValue( array() ) );

		$mock->expects( $this->never() )
			->method( 'update_instance' );

		$result = $mock->cron_task();

		$this->assertTrue( $result );
	}

	/**
	 * Test cron_task with no data
	 */
	public function test_cron_task_invalid_data() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods( array( 'get_instances_sites', 'update_instance', 'should_cron_be_running' ) )
					->disableOriginalConstructor()
					->getMock();

		$mock->expects( $this->any() )
			->method( 'should_cron_be_running' )
			->will( $this->returnValue( true ) );

		$mock->expects( $this->any() )
			->method( 'get_instances_sites' )
			->will( $this->returnValue( '' ) );

		$mock->expects( $this->never() )
			->method( 'update_instance' );

		$result = $mock->cron_task();

		$this->assertTrue( $result );
	}

	/**
	 * Test cron_task with no data
	 */
	public function test_cron_task_cron_should_not_be_running() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods(
						array(
							'get_instances_sites',
							'update_instance',
							'should_cron_be_running',
						)
					)
					->disableOriginalConstructor()
					->getMock();

		$mock->expects( $this->any() )
			->method( 'should_cron_be_running' )
			->will( $this->returnValue( false ) );

		$mock->expects( $this->never() )
			->method( 'get_instances_sites' );

		$mock->expects( $this->never() )
			->method( 'update_instance' );

		$result = $mock->cron_task();

		$this->assertTrue( $result );
	}

	/**
	 * Test get_instances_sites with valid data
	 */
	public function test_get_instances_sites_valid_data() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods( array( 'wp_get_option' ) )
					->disableOriginalConstructor()
					->getMock();

		$url_list_test = array(
			array( 'url' => 'test_url_1' ),
			array( 'url' => 'test_url_2' ),
			array( 'url' => 'test_url_3' ),
			array( 'url' => 'test_url_3' ), // uniqueness test
			array( 'url' => 'test_url_3' ), // uniqueness test
		);

		$mock->expects( $this->any() )
			->method( 'wp_get_option' )
			->with( 'widget_jetpack_display_posts_widget' )
			->will( $this->returnValue( $url_list_test ) );

		$result = $mock->get_instances_sites();

		$expected_result = array(
			'test_url_1',
			'test_url_2',
			'test_url_3',
		);

		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test get_instances_sites with invalid data
	 */
	public function test_get_instances_sites_invalid_data() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods( array( 'wp_get_option' ) )
					->disableOriginalConstructor()
					->getMock();

		$mock->expects( $this->any() )
			->method( 'wp_get_option' )
			->with( 'widget_jetpack_display_posts_widget' )
			->will( $this->returnValue( false ) );

		$result = $mock->get_instances_sites();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_instances_sites with invalid data, part 2
	 */
	public function test_get_instances_sites_invalid_data_2() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods( array( 'wp_get_option' ) )
					->disableOriginalConstructor()
					->getMock();

		$mock->expects( $this->any() )
			->method( 'wp_get_option' )
			->with( 'widget_jetpack_display_posts_widget' )
			->will( $this->returnValue( 'my value' ) );

		$result = $mock->get_instances_sites();

		$this->assertFalse( $result );
	}

	/**
	 * Test get_instances_sites with invalid data, part 2
	 */
	public function test_get_instances_sites_empty_data() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods( array( 'wp_get_option' ) )
					->disableOriginalConstructor()
					->getMock();

		$mock->expects( $this->any() )
			->method( 'wp_get_option' )
			->with( 'widget_jetpack_display_posts_widget' )
			->will( $this->returnValue( array() ) );

		$result = $mock->get_instances_sites();

		$this->assertEquals( array(), $result );
	}

	/**
	 * Test get_instances_sites with invalid data, part 2
	 */
	public function test_get_instances_sites_broken_data() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods( array( 'wp_get_option' ) )
					->disableOriginalConstructor()
					->getMock();

		$broken_data = array(
			array(
				'my'    => 'test',
				'value' => 'contains',
				'no'    => 'url',
			),
			array(
				'my2'    => 'test',
				'value2' => 'contains',
				'no2'    => 'url',
			),
			array(
				'my3'    => 'test',
				'value3' => 'contains',
				'no3'    => 'url',
			),
		);

		$mock->expects( $this->any() )
			->method( 'wp_get_option' )
			->with( 'widget_jetpack_display_posts_widget' )
			->will( $this->returnValue( $broken_data ) );

		$result = $mock->get_instances_sites();

		$this->assertEquals( array(), $result );
	}

	/**
	 * Test update_instance with valid data, new option
	 */
	public function test_update_instance_valid_data_new_option() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods(
						array(
							'get_site_hash',
							'wp_get_option',
							'fetch_blog_data',
							'wp_add_option',
							'wp_update_option',
						)
					)
					->disableOriginalConstructor()
					->getMock();

		$mock->expects( $this->any() )
			->method( 'get_site_hash' )
			->with( 'http://test.com' )
			->will( $this->returnValue( 'my_hash' ) );

		$widget_data_original = false;

		$mock->expects( $this->any() )
			->method( 'wp_get_option' )
			->with( $mock->widget_options_key_prefix . 'my_hash' )
			->will( $this->returnValue( $widget_data_original ) );

		$mock->expects( $this->any() )
			->method( 'fetch_blog_data' )
			->with( 'http://test.com', false )
			->will( $this->returnValue( 'new data' ) );

		$mock->expects( $this->any() )
			->method( 'wp_add_option' )
			->with( $mock->widget_options_key_prefix . 'my_hash', 'new data' );

		$mock->expects( $this->never() )
			->method( 'wp_update_option' );

		$mock->update_instance( 'http://test.com' );
	}

	/**
	 * Test update_instance with valid data, update option
	 */
	public function test_update_instance_valid_data_update_option() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods(
						array(
							'get_site_hash',
							'wp_get_option',
							'fetch_blog_data',
							'wp_add_option',
							'wp_update_option',
						)
					)
					->disableOriginalConstructor()
					->getMock();

		$mock->expects( $this->any() )
			->method( 'get_site_hash' )
			->with( 'http://test.com' )
			->will( $this->returnValue( 'my_hash' ) );

		$mock->expects( $this->any() )
			->method( 'wp_get_option' )
			->with( $mock->widget_options_key_prefix . 'my_hash' )
			->will( $this->returnValue( array( 123 ) ) );

		$mock->expects( $this->any() )
			->method( 'fetch_blog_data' )
			->with( 'http://test.com', array( 123 ) )
			->will( $this->returnValue( 'new data' ) );

		$mock->expects( $this->never() )
			->method( 'wp_add_option' );

		$mock->expects( $this->any() )
			->method( 'wp_update_option' )
			->with( $mock->widget_options_key_prefix . 'my_hash', 'new data' );

		$mock->update_instance( 'http://test.com' );
	}

	/**
	 * Test extract_errors_from_blog_data with WP_Error input
	 */
	public function test_extract_errors_from_blog_data_wp_error() {
		$input_data = new WP_Error( 'test_case', 'TEST CASE', 'mydata' );

		$result = $this->inst->extract_errors_from_blog_data( $input_data );

		$this->assertEquals(
			array(
				'message' => '',
				'debug'   => '',
				'where'   => '',
			),
			$result
		);
	}

	/**
	 * Test extract_errors_from_blog_data with array error in site_info
	 */
	public function test_extract_errors_from_blog_data_array_error_site_info() {

		$input_data = array(
			'site_info' => array(
				'error' => array( 1, 2, 4, 5 ),
			),
			'posts'     => array(
				'error' => array( 'a', 'b', 'c', 'd' ),
			),
		);

		$result = $this->inst->extract_errors_from_blog_data( $input_data );

		$expected_result = array(
			'message' => 1,
			'debug'   => '',
			'where'   => 'site_info',
		);
		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test extract_errors_from_blog_data with array error in posts
	 */
	public function test_extract_errors_from_blog_data_array_error_posts() {

		$input_data = array(
			'site_info' => array(
				'error' => null,
			),
			'posts'     => array(
				'error' => array( 'a', 'b', 'c', 'd' ),
			),
		);

		$result = $this->inst->extract_errors_from_blog_data( $input_data );

		$expected_result = array(
			'message' => 'a',
			'debug'   => '',
			'where'   => 'posts',
		);
		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test extract_errors_from_blog_data with valid WP_Error in site_info
	 */
	public function test_extract_errors_from_blog_data_valid_wp_error_site_info() {

		$input_data = array(
			'site_info' => array(
				'error' => new WP_Error( 'site_info_code', 'SITE INFO MESSAGE', 'SITE INFO DEBUG' ),
			),
			'posts'     => array(
				'error' => new WP_Error( 'posts_code', 'POSTS MESSAGE', 'POSTS DEBUG' ),
			),
		);

		$result = $this->inst->extract_errors_from_blog_data( $input_data );

		$expected_result = array(
			'message' => 'SITE INFO MESSAGE',
			'debug'   => 'SITE INFO DEBUG',
			'where'   => 'site_info',
		);
		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test extract_errors_from_blog_data with valid WP_Error in posts
	 */
	public function test_extract_errors_from_blog_data_valid_wp_error_posts() {

		$input_data = array(
			'site_info' => array(
				'error' => null,
			),
			'posts'     => array(
				'error' => new WP_Error( 'posts_code', 'POSTS MESSAGE', 'POSTS DEBUG' ),
			),
		);

		$result = $this->inst->extract_errors_from_blog_data( $input_data );

		$expected_result = array(
			'message' => 'POSTS MESSAGE',
			'debug'   => 'POSTS DEBUG',
			'where'   => 'posts',
		);
		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test extract_errors_from_blog_data with valid WP_Error with array debug
	 */
	public function test_extract_errors_from_blog_data_valid_wp_error_posts_array_debug() {

		$input_data = array(
			'site_info' => array(
				'error' => null,
			),
			'posts'     => array(
				'error' => new WP_Error( 'posts_code', 'POSTS MESSAGE', array( 1, 2, 3, 4 ) ),
			),
		);

		$result = $this->inst->extract_errors_from_blog_data( $input_data );

		$expected_result = array(
			'message' => 'POSTS MESSAGE',
			'debug'   => '1; 2; 3; 4',
			'where'   => 'posts',
		);
		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test extract_errors_from_blog_data with errors that are not WP_Error or array
	 */
	public function test_extract_errors_from_blog_data_no_errors() {

		$input_data = array(
			'site_info' => array(
				'error' => 'dsa',
			),
			'posts'     => array(
				'error' => 'asd',
			),
		);

		$result = $this->inst->extract_errors_from_blog_data( $input_data );

		$expected_result = array(
			'message' => '',
			'debug'   => '',
			'where'   => 'posts',
		);
		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test if jetpack_display_posts_widget_cron_intervals is working correctly with
	 * predefined list of cron schedule.
	 */
	public function test_jetpack_display_posts_widget_cron_intervals_predefined_schedule() {

		$predefine_schedules = array(
			'minutes_5'  => array(
				'interval' => 300,
				'display'  => 'Every five minutes',
			),
			'minutes_15' => array(
				'interval' => 900,
				'display'  => 'Every fifteen minutes',
			),
		);

		$result = jetpack_display_posts_widget_cron_intervals( $predefine_schedules );

		$expected_result = array(
			'minutes_5'  => array(
				'interval' => 300,
				'display'  => 'Every five minutes',
			),
			'minutes_15' => array(
				'interval' => 900,
				'display'  => 'Every fifteen minutes',
			),
			'minutes_10' => array(
				'interval' => 600,
				'display'  => 'Every 10 minutes',
			),
		);

		$this->assertEquals( $expected_result, $result );

	}

	/**
	 * Test if jetpack_display_posts_widget_cron_intervals is working correctly with
	 * no predefined cron schedules.
	 */
	public function test_jetpack_display_posts_widget_cron_intervals_no_predefined_schedule() {

		$predefine_schedules = array();

		$result = jetpack_display_posts_widget_cron_intervals( $predefine_schedules );

		$expected_result = array(
			'minutes_10' => array(
				'interval' => 600,
				'display'  => 'Every 10 minutes',
			),
		);

		$this->assertEquals( $expected_result, $result );

	}

	/**
	 * Test if jetpack_display_posts_widget_cron_intervals is working correctly with
	 * minutes_10 interval already defined.
	 */
	public function test_jetpack_display_posts_widget_cron_intervals_predefined_schedule_no_overwrite() {

		$predefine_schedules = array(
			'minutes_5'  => array(
				'interval' => 300,
				'display'  => 'Every five minutes',
			),
			'minutes_10' => array(
				'interval' => 12345,
				'display'  => 'Bogus predefined interval',
			),
			'minutes_15' => array(
				'interval' => 900,
				'display'  => 'Every fifteen minutes',
			),
		);

		$result = jetpack_display_posts_widget_cron_intervals( $predefine_schedules );

		$expected_result = array(
			'minutes_5'  => array(
				'interval' => 300,
				'display'  => 'Every five minutes',
			),
			'minutes_10' => array(
				'interval' => 12345,
				'display'  => 'Bogus predefined interval',
			),
			'minutes_15' => array(
				'interval' => 900,
				'display'  => 'Every fifteen minutes',
			),
		);

		$this->assertEquals( $expected_result, $result );

	}

	/**
	 * Test fetch_service_endpoint with no possible cache hits
	 */
	public function test_fetch_service_endpoint_no_cache_hits() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods(
						array(
							'wp_wp_remote_get',
							'parse_service_response',
						)
					)
					->disableOriginalConstructor()
					->getMock();

		$mock->expects( $this->exactly( 2 ) )
			->method( 'wp_wp_remote_get' )
			->withConsecutive(
				array( $mock->service_url . 'first_endpoint', array( 'timeout' => 15 ) ),
				array( $mock->service_url . 'second_endpoint', array( 'timeout' => 15 ) )
			)
			->willReturnOnConsecutiveCalls( 'first_endpoint response', 'second_endpoint response' );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'parse_service_response' )
			->withConsecutive(
				array( 'first_endpoint response' ),
				array( 'second_endpoint response' )
			)
			->willReturnOnConsecutiveCalls( 'first test', 'second test' );

		$result1 = $mock->fetch_service_endpoint( 'first_endpoint' );

		$this->assertEquals( 'first test', $result1 );

		$result2 = $mock->fetch_service_endpoint( 'second_endpoint' );

		$this->assertEquals( 'second test', $result2 );
	}

	/**
	 * Test fetch_service_endpoint with cache hits
	 */
	public function test_fetch_service_endpoint_with_cache_hits() {
		/** @var Jetpack_Display_Posts_Widget $mock */
		$mock = $this->getMockBuilder( 'Jetpack_Display_Posts_Widget' )
					->setMethods(
						array(
							'wp_wp_remote_get',
							'parse_service_response',
						)
					)
					->disableOriginalConstructor()
					->getMock();

		$wp_wp_remote_get_map = array(
			array( $mock->service_url . 'cache_endpoint_1', array( 'timeout' => 15 ), 'cache_endpoint_1_response' ),
			array( $mock->service_url . 'cache_endpoint_2', array( 'timeout' => 15 ), 'cache_endpoint_2_response' ),
		);

		$parse_service_response_map = array(
			array( 'cache_endpoint_1_response', 'first test' ),
			array( 'cache_endpoint_2_response', 'second test' ),
		);

		$mock->expects( $this->exactly( 2 ) )
			->method( 'wp_wp_remote_get' )
			->will( $this->returnValueMap( $wp_wp_remote_get_map ) );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'parse_service_response' )
			->will( $this->returnValueMap( $parse_service_response_map ) );

		$result1       = $mock->fetch_service_endpoint( 'cache_endpoint_1' );
		$result2       = $mock->fetch_service_endpoint( 'cache_endpoint_2' );
		$result1_again = $mock->fetch_service_endpoint( 'cache_endpoint_1' );

		$this->assertEquals( 'first test', $result1 );
		$this->assertEquals( 'second test', $result2 );
		$this->assertEquals( 'first test', $result1_again );

	}

}
