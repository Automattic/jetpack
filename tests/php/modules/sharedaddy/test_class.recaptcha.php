<?php
require dirname( __FILE__ ) . '/../../../../modules/sharedaddy/recaptcha.php';

class WP_Test_Jetpack_ReCaptcha extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		$this->site_key   = 'sitekey';
		$this->secret_key = 'secretkey';
		$this->recaptcha  = new Jetpack_ReCaptcha( $this->site_key, $this->secret_key );
	}

	public function test_get_default_config() {
		$default_config = $this->recaptcha->get_default_config();
		$this->assertNotEmpty( $default_config );
		$this->assertArrayHasKey( 'language', $default_config );
		$this->assertArrayHasKey( 'tag_class', $default_config );
		$this->assertArrayHasKey( 'tag_attributes', $default_config );
		$this->assertNotEmpty( $default_config['tag_attributes'] );
		$this->assertArrayHasKey( 'theme', $default_config['tag_attributes'] );
		$this->assertArrayHasKey( 'type', $default_config['tag_attributes'] );
		$this->assertArrayHasKey( 'tabindex', $default_config['tag_attributes'] );
	}

	public function test_verify() {
		// Empty response returns WP_Error.
		$result = $this->recaptcha->verify( '', '127.0.0.1' );
		$this->assertInstanceOf( 'WP_Error', $result );

		// Success response -- JSON response should contains key 'success' with
		// value true.
		add_filter( 'pre_http_request', array( $this, 'pre_http_request_response_success' ) );
		$result = $this->recaptcha->verify( 'g-recaptcha-response', '127.0.0.1' );
		$this->assertTrue( $result );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_response_success' ) );

		// Failed response -- missing input secret.
		add_filter( 'pre_http_request', array( $this, 'pre_http_request_response_missing_input_secret' ) );
		$result = $this->recaptcha->verify( 'g-recaptcha-response', '127.0.0.1' );
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'missing-input-secret', $result->get_error_code() );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_response_missing_input_secret' ) );

		// Failed response -- invalid input secret.
		add_filter( 'pre_http_request', array( $this, 'pre_http_request_response_invalid_input_secret' ) );
		$result = $this->recaptcha->verify( 'g-recaptcha-response', '127.0.0.1' );
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'invalid-input-secret', $result->get_error_code() );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_response_invalid_input_secret' ) );

		// Failed response -- missing input response.
		add_filter( 'pre_http_request', array( $this, 'pre_http_request_response_missing_input_response' ) );
		$result = $this->recaptcha->verify( 'g-recaptcha-response', '127.0.0.1' );
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'missing-input-response', $result->get_error_code() );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_response_missing_input_response' ) );

		// Failed response -- invalid input response.
		add_filter( 'pre_http_request', array( $this, 'pre_http_request_response_invalid_input_response' ) );
		$result = $this->recaptcha->verify( 'g-recaptcha-response', '127.0.0.1' );
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'invalid-input-response', $result->get_error_code() );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_response_invalid_input_response' ) );

		// Failed response without error codes specified -- unexpected response.
		add_filter( 'pre_http_request', array( $this, 'pre_http_request_response_unexpected' ) );
		$result = $this->recaptcha->verify( 'g-recaptcha-response', '127.0.0.1' );
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'unexpected-response', $result->get_error_code() );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_response_unexpected' ) );

		// Failed response -- malformed JSON returns invalid-json error code.
		add_filter( 'pre_http_request', array( $this, 'pre_http_request_response_malformed_json' ) );
		$result = $this->recaptcha->verify( 'g-recaptcha-response', '127.0.0.1' );
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'invalid-json', $result->get_error_code() );
		remove_filter( 'pre_http_request', array( $this, 'pre_http_request_response_malformed_json' ) );
	}

	public function test_get_verify_request_params() {
		$params = $this->recaptcha->get_verify_request_params( 'response', $_SERVER['REMOTE_ADDR'] );
		$this->assertNotEmpty( $params );
		$this->assertArrayHasKey( 'body', $params );
		$this->assertArrayHasKey( 'sslverify', $params );
	}

	public function test_get_recaptcha_html() {
		$config = $this->recaptcha->get_default_config();
		$html = $this->recaptcha->get_recaptcha_html();

		// Make sure div tag appears with expected attributes.
		$this->assertContains( '<div', $html );
		$this->assertContains( $this->site_key, $html );
		$this->assertContains( '</div>', $html );

		// Make sure script tag appears with expected language.
		$this->assertContains( '<script', $html );
		$this->assertContains( $config['language'], $html );
		$this->assertContains( '</script>', $html );
	}

	public function pre_http_request_response_success() {
		return array( 'body' => json_encode( array( 'success' => true ) ) );
	}

	public function pre_http_request_response_unexpected() {
		return array( 'body' => json_encode( array( 'success' => false ) ) );
	}

	public function pre_http_request_response_malformed_json() {
		return array( 'body' => '{"foo":"bar"' );
	}

	public function pre_http_request_response_missing_input_secret() {
		return $this->http_response_with_error_code( 'missing-input-secret' );
	}

	public function pre_http_request_response_invalid_input_secret() {
		return $this->http_response_with_error_code( 'invalid-input-secret' );
	}

	public function pre_http_request_response_missing_input_response() {
		return $this->http_response_with_error_code( 'missing-input-response' );
	}

	public function pre_http_request_response_invalid_input_response() {
		return $this->http_response_with_error_code( 'invalid-input-response' );
	}

	protected function http_response_with_error_code( $first_error_code ) {
		return array(
			'body' => json_encode( array(
				'success'     => false,
				'error-codes' => array( $first_error_code ),
			) ),
		);
	}
}
