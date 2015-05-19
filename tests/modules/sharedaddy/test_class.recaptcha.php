<?php
require dirname( __FILE__ ) . '/../../../modules/sharedaddy/recaptcha.php';

class WP_Test_Jetpack_ReCaptcha extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		$this->site_key   = defined( 'RECAPTCHA_PUBLIC_KEY' ) ? RECAPTCHA_PUBLIC_KEY : 'sitekey';
		$this->secret_key = defined( 'RECAPTCHA_PRIVATE_KEY' ) ? RECAPTCHA_PUBLIC_KEY : 'secretkey';
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

		// TODO: test succeed and failed respones. Make sure to mock wp_remote_post.
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
}
