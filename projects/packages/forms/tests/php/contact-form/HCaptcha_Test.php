<?php
/**
 * Unit Tests for hCaptcha support.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Error;

require_once __DIR__ . '/../../../src/contact-form/class-hcaptcha.php';

/**
 * Test class for HCaptcha.
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\HCaptcha
 */
#[CoversClass( HCaptcha::class )]
class HCaptcha_Test extends BaseTestCase {

	/**
	 * Tear down test state.
	 */
	public function tear_down() {
		delete_option( HCaptcha::OPTION_NAME );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'jetpack_forms_hcaptcha_settings' );
		remove_all_filters( 'jetpack_forms_hcaptcha_enabled' );
		remove_all_filters( 'jetpack_forms_hcaptcha_verify_url' );
		wp_dequeue_script( HCaptcha::SCRIPT_HANDLE );
		wp_deregister_script( HCaptcha::SCRIPT_HANDLE );
		unset( $_POST['h-captcha-response'] );
		unset( $_SERVER['REMOTE_ADDR'] );
	}

	/**
	 * Test that no widget is rendered when hCaptcha is disabled.
	 */
	public function test_render_widget_returns_empty_when_disabled() {
		$this->assertSame( '', HCaptcha::render_widget( 'abc123' ) );
		$this->assertFalse( wp_script_is( HCaptcha::SCRIPT_HANDLE, 'enqueued' ) );
	}

	/**
	 * Test that the widget renders when hCaptcha is configured.
	 */
	public function test_render_widget_outputs_hcaptcha_markup_when_enabled() {
		$this->enable_hcaptcha();

		$html = HCaptcha::render_widget( 'abc123' );

		$this->assertStringContainsString( 'class="h-captcha"', $html );
		$this->assertStringContainsString( 'data-sitekey="site-key"', $html );
		$this->assertStringContainsString( 'data-jetpack-forms-hcaptcha="abc123"', $html );
		$this->assertTrue( wp_script_is( HCaptcha::SCRIPT_HANDLE, 'enqueued' ) );
	}

	/**
	 * Test that supported widget attributes are rendered as hCaptcha data attributes.
	 */
	public function test_render_widget_outputs_optional_hcaptcha_attributes() {
		$this->enable_hcaptcha();

		$html = HCaptcha::render_widget(
			'abc123',
			array(
				'size'     => 'compact',
				'theme'    => 'dark',
				'tabindex' => '2',
				'onload'   => 'ignored',
			)
		);

		$this->assertStringContainsString( 'data-size="compact"', $html );
		$this->assertStringContainsString( 'data-theme="dark"', $html );
		$this->assertStringContainsString( 'data-tabindex="2"', $html );
		$this->assertStringNotContainsString( 'onload', $html );
	}

	/**
	 * Test that manually inserted hCaptcha shortcodes are replaced by native markup.
	 */
	public function test_replace_manual_shortcode_outputs_hcaptcha_markup() {
		$this->enable_hcaptcha();

		$html = '<div class="field">Name</div><p>[hcaptcha size="compact" theme="dark"]</p>';

		$result = HCaptcha::replace_manual_widget( $html, 'abc123' );

		$this->assertStringContainsString( 'data-jetpack-forms-hcaptcha="abc123"', $result );
		$this->assertStringContainsString( 'class="h-captcha"', $result );
		$this->assertStringContainsString( 'data-size="compact"', $result );
		$this->assertStringContainsString( 'data-theme="dark"', $result );
		$this->assertStringNotContainsString( '[hcaptcha', $result );
	}

	/**
	 * Test that manual hCaptcha shortcodes are removed when hCaptcha is disabled.
	 */
	public function test_replace_manual_shortcode_removes_placeholder_when_hcaptcha_is_disabled() {
		$html = '<div class="field">Name</div><p>[hcaptcha size="compact"]</p>';

		$result = HCaptcha::replace_manual_widget( $html, 'abc123' );

		$this->assertStringContainsString( '<div class="field">Name</div>', $result );
		$this->assertStringNotContainsString( '[hcaptcha', $result );
		$this->assertStringNotContainsString( 'h-captcha', $result );
	}

	/**
	 * Test that manually inserted hCaptcha markup is replaced by native markup.
	 */
	public function test_replace_manual_markup_outputs_hcaptcha_markup() {
		$this->enable_hcaptcha();

		$html = '<input type="hidden" name="hcaptcha-widget-id" value="widget"><h-captcha data-size="compact" data-theme="dark"></h-captcha>';

		$result = HCaptcha::replace_manual_widget( $html, 'abc123' );

		$this->assertStringContainsString( 'data-jetpack-forms-hcaptcha="abc123"', $result );
		$this->assertStringContainsString( 'class="h-captcha"', $result );
		$this->assertStringContainsString( 'data-size="compact"', $result );
		$this->assertStringContainsString( 'data-theme="dark"', $result );
		$this->assertStringNotContainsString( '<h-captcha', $result );
		$this->assertStringNotContainsString( 'hcaptcha-widget-id', $result );
	}

	/**
	 * Test that stale hCaptcha error markup is removed when normalizing markup.
	 */
	public function test_replace_manual_markup_removes_existing_hcaptcha_error_message() {
		$this->enable_hcaptcha();

		$html = '<h-captcha data-size="compact"></h-captcha><div class="contact-form__input-error">Old error</div>';

		$result = HCaptcha::replace_manual_widget( $html, 'abc123' );

		$this->assertStringContainsString( 'data-jetpack-forms-hcaptcha="abc123"', $result );
		$this->assertStringNotContainsString( 'Old error', $result );
		$this->assertStringNotContainsString( 'contact-form__input-error', $result );
	}

	/**
	 * Test that verification is skipped when hCaptcha is disabled.
	 */
	public function test_verify_returns_current_status_when_disabled() {
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return false;
			}
		);

		$result = HCaptcha::init()->verify( false, array() );

		$this->assertFalse( $result );
		$this->assertFalse( $http_request_made );
	}

	/**
	 * Test that a missing token aborts the submission.
	 */
	public function test_verify_fails_when_response_token_is_missing() {
		$this->enable_hcaptcha();

		$result = HCaptcha::init()->verify( false, array() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_hcaptcha', $result->get_error_code() );
		$this->assertSame( 'Please complete the hCaptcha.', $result->get_error_message() );
	}

	/**
	 * Test that successful hCaptcha verification allows the submission to continue.
	 */
	public function test_verify_allows_successful_hcaptcha_response() {
		$this->enable_hcaptcha();

		$_POST['h-captcha-response'] = 'token';
		$_SERVER['REMOTE_ADDR']      = '203.0.113.10';

		$captured_url  = null;
		$captured_args = null;

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_url, &$captured_args ) {
				$captured_url  = $url;
				$captured_args = $args;

				return array(
					'response' => array(
						'code' => 200,
					),
					'body'     => wp_json_encode(
						array(
							'success' => true,
						)
					),
				);
			},
			10,
			3
		);

		$result = HCaptcha::init()->verify( false, array() );

		$this->assertFalse( $result );
		$this->assertSame( HCaptcha::VERIFY_URL, $captured_url );
		$this->assertSame( 'secret-key', $captured_args['body']['secret'] );
		$this->assertSame( 'token', $captured_args['body']['response'] );
		$this->assertSame( 'site-key', $captured_args['body']['sitekey'] );
		$this->assertSame( '203.0.113.10', $captured_args['body']['remoteip'] );
	}

	/**
	 * Test that unsuccessful hCaptcha verification aborts the submission.
	 */
	public function test_verify_fails_when_hcaptcha_rejects_response() {
		$this->enable_hcaptcha();

		$_POST['h-captcha-response'] = 'bad-token';

		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array(
						'code' => 200,
					),
					'body'     => wp_json_encode(
						array(
							'success'     => false,
							'error-codes' => array( 'invalid-input-response' ),
						)
					),
				);
			}
		);

		$result = HCaptcha::init()->verify( false, array() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_hcaptcha', $result->get_error_code() );
		$this->assertSame(
			'hCaptcha error: The response parameter (verification token) is invalid or malformed.',
			$result->get_error_message()
		);
	}

	/**
	 * Test that an empty hCaptcha verification response uses the generic hCaptcha failure message.
	 */
	public function test_verify_fails_with_hcaptcha_failure_message_when_response_body_is_empty() {
		$this->enable_hcaptcha();

		$_POST['h-captcha-response'] = 'bad-token';

		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array(
						'code' => 200,
					),
					'body'     => '',
				);
			}
		);

		$result = HCaptcha::init()->verify( false, array() );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_hcaptcha', $result->get_error_code() );
		$this->assertSame( 'The hCaptcha is invalid.', $result->get_error_message() );
	}

	/**
	 * Test that settings cannot enable hCaptcha without both keys.
	 */
	public function test_sanitize_settings_disables_hcaptcha_when_keys_are_missing() {
		$result = HCaptcha::init()->sanitize_settings(
			array(
				'enabled'  => '1',
				'site_key' => 'site-key',
			)
		);

		$this->assertFalse( $result['enabled'] );
		$this->assertSame( 'site-key', $result['site_key'] );
		$this->assertSame( '', $result['secret_key'] );
	}

	/**
	 * Enable hCaptcha for tests.
	 */
	private function enable_hcaptcha() {
		update_option(
			HCaptcha::OPTION_NAME,
			array(
				'enabled'    => true,
				'site_key'   => 'site-key',
				'secret_key' => 'secret-key',
			)
		);
	}
}
