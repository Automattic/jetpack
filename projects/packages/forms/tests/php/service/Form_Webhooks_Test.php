<?php
/**
 * Unit Tests for Form_Webhooks.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field;
use Automattic\Jetpack\Forms\ContactForm\Feedback;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WpOrg\Requests\Utility\CaseInsensitiveDictionary;

/**
 * Test class for Form_Webhooks
 *
 * @covers Automattic\Jetpack\Forms\Service\Form_Webhooks
 */
#[CoversClass( Form_Webhooks::class )]
class Form_Webhooks_Test extends BaseTestCase {

	/**
	 * Test webhook is not sent when no webhooks are configured.
	 */
	public function test_send_webhooks_does_nothing_when_no_webhooks_configured() {
		$form   = $this->create_mock_form( array() );
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		// Mock wp_remote_request should not be called
		$this->assertFalse( has_filter( 'pre_http_request' ) );

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( 123, $fields, false, array() );
	}

	/**
	 * Test webhook is not sent when webhook is disabled.
	 */
	public function test_send_webhooks_skips_disabled_webhooks() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => false,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
				);
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( 123, $fields, false, array() );

		$this->assertFalse( $http_request_made, 'HTTP request should not be made for disabled webhook' );
	}

	/**
	 * Test webhook is not sent when URL is missing.
	 */
	public function test_send_webhooks_skips_webhooks_without_url() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => '',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
				);
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( 123, $fields, false, array() );

		$this->assertFalse( $http_request_made, 'HTTP request should not be made for webhook without URL' );
	}

	/**
	 * Test webhook is not sent for spam submissions.
	 */
	public function test_send_webhooks_skips_spam_submissions() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
				);
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( 123, $fields, true, array() ); // is_spam = true

		$this->assertFalse( $http_request_made, 'HTTP request should not be made for spam submissions' );
	}

	/**
	 * Test webhook sends JSON formatted data.
	 */
	public function test_send_webhooks_sends_json_data() {
		$form         = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$field1       = $this->create_mock_field( $form, 'name', 'John Doe' );
		$field2       = $this->create_mock_field( $form, 'email', 'john@example.com' );
		$form->fields = array( $field1, $field2 );
		$fields       = array( $field1, $field2 );

		$post_id = $this->create_feedback_post( $form, $fields );

		$captured_request = null;
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_request ) {
				$captured_request = array(
					'url'  => $url,
					'args' => $args,
				);
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		$this->assertNotNull( $captured_request, 'HTTP request should be made' );
		$this->assertEquals( 'https://example.com/webhook', $captured_request['url'] );
		$this->assertEquals( 'POST', $captured_request['args']['method'] );
		$this->assertEquals( 'application/json', $captured_request['args']['headers']['Content-Type'] );

		$body_data = json_decode( $captured_request['args']['body'], true );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNullable
		$this->assertEquals( 'John Doe', $body_data['name'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNullable
		$this->assertEquals( 'john@example.com', $body_data['email'] );
	}

	/**
	 * Test webhook sends URL-encoded data.
	 */
	public function test_send_webhooks_sends_urlencoded_data() {
		$form         = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'urlencoded',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$field1       = $this->create_mock_field( $form, 'name', 'John Doe' );
		$field2       = $this->create_mock_field( $form, 'email', 'john@example.com' );
		$form->fields = array( $field1, $field2 );
		$fields       = array( $field1, $field2 );

		$post_id = $this->create_feedback_post( $form, $fields );

		$captured_request = null;
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_request ) {
				$captured_request = array(
					'url'  => $url,
					'args' => $args,
				);
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/x-www-form-urlencoded' ) ),
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		$this->assertNotNull( $captured_request, 'HTTP request should be made' );
		$this->assertEquals( 'application/x-www-form-urlencoded', $captured_request['args']['headers']['Content-Type'] );
		$this->assertIsArray( $captured_request['args']['body'] );
		$this->assertEquals( 'John Doe', $captured_request['args']['body']['name'] );
		$this->assertEquals( 'john@example.com', $captured_request['args']['body']['email'] );
	}

	/**
	 * Test webhook skips invalid format.
	 */
	public function test_send_webhooks_skips_invalid_format() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'xml', // Invalid format
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
				);
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( 123, $fields, false, array() );

		$this->assertFalse( $http_request_made, 'HTTP request should not be made for invalid format' );
	}

	/**
	 * Test webhook skips invalid method.
	 */
	public function test_send_webhooks_skips_invalid_method() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'json',
						'method'     => 'DELETE', // Invalid method
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
				);
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( 123, $fields, false, array() );

		$this->assertFalse( $http_request_made, 'HTTP request should not be made for invalid method' );
	}

	/**
	 * Test webhook uses GET method when specified.
	 */
	public function test_send_webhooks_uses_get_method() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'json',
						'method'     => 'GET',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		$captured_request = null;
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_request ) {
				$captured_request = array(
					'url'  => $url,
					'args' => $args,
				);
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		$this->assertNotNull( $captured_request );
		$this->assertEquals( 'GET', $captured_request['args']['method'] );
	}

	/**
	 * Test jetpack_forms_before_webhook_request filter is applied.
	 */
	public function test_send_webhooks_applies_filter() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'email', 'john@example.com' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Add filter to modify data
		add_filter(
			'jetpack_forms_before_webhook_request',
			function ( $data, $webhook_id ) {
				$this->assertEquals( 'test-webhook', $webhook_id );
				$data['custom_field'] = 'custom_value';
				return $data;
			},
			10,
			2
		);

		$captured_request = null;
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_request ) {
				$captured_request = array(
					'url'  => $url,
					'args' => $args,
				);
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeMismatchArgumentInternal
		$body_data = json_decode( $captured_request['args']['body'], true );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNullable
		$this->assertEquals( 'custom_value', $body_data['custom_field'] );
	}

	/**
	 * Test webhook logs successful response to post meta.
	 */
	public function test_send_webhooks_logs_successful_response() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		$response_meta = get_post_meta( $post_id, '_jetpack_forms_webhook_response', true );
		$this->assertNotEmpty( $response_meta );

		$response_data = json_decode( $response_meta, true );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNullable
		$this->assertEquals( 200, $response_data['http_code'] );
		$this->assertArrayHasKey( 'timestamp', $response_data );
	}

	/**
	 * Test webhook logs error to post meta.
	 */
	public function test_send_webhooks_logs_error() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_failed', 'Connection timeout' );
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		$error_meta = get_post_meta( $post_id, '_jetpack_forms_webhook_error', true );
		$this->assertEquals( 'Connection timeout', $error_meta );
	}

	/**
	 * Test logging action is triggered when webhook URL is empty.
	 */
	public function test_send_webhooks_logs_empty_url() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => '',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		$this->assertCount( 1, $logged_events );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'webhook_skipped', $logged_events[0]['event'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'url_empty', $logged_events[0]['reason'] );
	}

	/**
	 * Test logging action is triggered when webhook format is invalid.
	 */
	public function test_send_webhooks_logs_invalid_format() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'xml',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		$this->assertCount( 1, $logged_events );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'webhook_skipped', $logged_events[0]['event'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'format_invalid', $logged_events[0]['reason'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertIsArray( $logged_events[0]['data'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'xml', $logged_events[0]['data']['format'] );
	}

	/**
	 * Test logging action is triggered when webhook method is invalid.
	 */
	public function test_send_webhooks_logs_invalid_method() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'json',
						'method'     => 'DELETE',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		$this->assertCount( 1, $logged_events );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'webhook_skipped', $logged_events[0]['event'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'method_invalid', $logged_events[0]['reason'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertIsArray( $logged_events[0]['data'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'DELETE', $logged_events[0]['data']['method'] );
	}

	/**
	 * Test webhook method validation is case-insensitive.
	 */
	public function test_send_webhooks_accepts_lowercase_method() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'json',
						'method'     => 'post', // lowercase should be accepted
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		$captured_request = null;
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_request ) {
				$captured_request = array(
					'url'  => $url,
					'args' => $args,
				);
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		$this->assertNotNull( $captured_request, 'HTTP request should be made even with lowercase method' );
		$this->assertEquals( 'post', $captured_request['args']['method'] );
	}

	/**
	 * Test webhook is blocked when URL uses HTTP instead of HTTPS.
	 */
	public function test_send_webhooks_blocks_http_urls() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'http://example.com/webhook', // HTTP instead of HTTPS
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
				);
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		$this->assertFalse( $http_request_made, 'HTTP request should not be made for non-HTTPS URLs' );
		$this->assertCount( 1, $logged_events );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'webhook_skipped', $logged_events[0]['event'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'https_required', $logged_events[0]['reason'] );
	}

	/**
	 * Test webhook is blocked when URL points to localhost.
	 * SSRF protection is handled at request time by wp_safe_remote_request().
	 */
	public function test_send_webhooks_blocks_localhost_urls() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://127.0.0.1/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Prevent actual network requests - return WP_Error simulating blocked private IP
		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_not_executed', 'A valid URL was not provided.' );
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// wp_safe_remote_request() blocks private IPs and returns WP_Error, which gets logged
		$error_meta = get_post_meta( $post_id, '_jetpack_forms_webhook_error', true );
		$this->assertNotEmpty( $error_meta, 'Error should be logged for localhost URLs' );
	}

	/**
	 * Test webhook is blocked when URL points to private Class A network (10.x.x.x).
	 * SSRF protection is handled at request time by wp_safe_remote_request().
	 */
	public function test_send_webhooks_blocks_private_class_a_urls() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://10.0.0.1/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Prevent actual network requests - return WP_Error simulating blocked private IP
		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_not_executed', 'A valid URL was not provided.' );
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// wp_safe_remote_request() blocks private IPs and returns WP_Error, which gets logged
		$error_meta = get_post_meta( $post_id, '_jetpack_forms_webhook_error', true );
		$this->assertNotEmpty( $error_meta, 'Error should be logged for private Class A URLs' );
	}

	/**
	 * Test webhook is blocked when URL points to private Class B network (172.16-31.x.x).
	 * SSRF protection is handled at request time by wp_safe_remote_request().
	 */
	public function test_send_webhooks_blocks_private_class_b_urls() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://172.16.0.1/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Prevent actual network requests - return WP_Error simulating blocked private IP
		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_not_executed', 'A valid URL was not provided.' );
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// wp_safe_remote_request() blocks private IPs and returns WP_Error, which gets logged
		$error_meta = get_post_meta( $post_id, '_jetpack_forms_webhook_error', true );
		$this->assertNotEmpty( $error_meta, 'Error should be logged for private Class B URLs' );
	}

	/**
	 * Test webhook is blocked when URL points to private Class C network (192.168.x.x).
	 * SSRF protection is handled at request time by wp_safe_remote_request().
	 */
	public function test_send_webhooks_blocks_private_class_c_urls() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://192.168.1.1/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Prevent actual network requests - return WP_Error simulating blocked private IP
		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_not_executed', 'A valid URL was not provided.' );
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// wp_safe_remote_request() blocks private IPs and returns WP_Error, which gets logged
		$error_meta = get_post_meta( $post_id, '_jetpack_forms_webhook_error', true );
		$this->assertNotEmpty( $error_meta, 'Error should be logged for private Class C URLs' );
	}

	/**
	 * Test webhook is blocked when URL points to link-local network (169.254.x.x - includes AWS metadata).
	 * SSRF protection blocks link-local IPs at validation time.
	 */
	public function test_send_webhooks_blocks_link_local_urls() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://169.254.169.254/latest/meta-data/',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{}',
				);
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// Link-local IPs should be blocked at validation time, no HTTP request made
		$this->assertFalse( $http_request_made, 'HTTP request should not be made for link-local/AWS metadata URLs' );
		$this->assertCount( 1, $logged_events );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'webhook_skipped', $logged_events[0]['event'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'blocked_ip', $logged_events[0]['reason'] );
	}

	/**
	 * Test that webhook blocks IPv6 loopback addresses.
	 * SSRF protection should block ::1 (IPv6 loopback) at validation time.
	 */
	public function test_send_webhooks_blocks_ipv6_loopback() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://[::1]/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Prevent actual network requests - return WP_Error if filter is reached
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return new \WP_Error( 'http_request_not_executed', 'Request should have been blocked.' );
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// IPv6 loopback should be blocked at validation time
		$this->assertFalse( $http_request_made, 'HTTP request should not be made for IPv6 loopback URLs' );
		$this->assertCount( 1, $logged_events );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'webhook_skipped', $logged_events[0]['event'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'blocked_ip', $logged_events[0]['reason'] );
	}

	/**
	 * Test that webhook blocks IPv6 link-local addresses.
	 * SSRF protection should block fe80::/10 range at validation time.
	 */
	public function test_send_webhooks_blocks_ipv6_link_local() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://[fe80::1]/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Prevent actual network requests - return WP_Error if filter is reached
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return new \WP_Error( 'http_request_not_executed', 'Request should have been blocked.' );
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// IPv6 link-local should be blocked at validation time
		$this->assertFalse( $http_request_made, 'HTTP request should not be made for IPv6 link-local URLs' );
		$this->assertCount( 1, $logged_events );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'webhook_skipped', $logged_events[0]['event'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'blocked_ip', $logged_events[0]['reason'] );
	}

	/**
	 * Test that webhook blocks IPv6 unique local addresses (fd00::/8).
	 * SSRF protection should block fc00::/7 range which includes fd00::/8 used for private networks
	 * and cloud metadata endpoints like fd00::a9fe:a9fe.
	 */
	public function test_send_webhooks_blocks_ipv6_unique_local() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://[fd00::1]/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Prevent actual network requests - return WP_Error if filter is reached
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return new \WP_Error( 'http_request_not_executed', 'Request should have been blocked.' );
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// IPv6 unique local addresses should be blocked at validation time
		$this->assertFalse( $http_request_made, 'HTTP request should not be made for IPv6 unique local URLs' );
		$this->assertCount( 1, $logged_events );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'webhook_skipped', $logged_events[0]['event'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'blocked_ip', $logged_events[0]['reason'] );
	}

	/**
	 * Test that webhook blocks IPv6 site-local addresses (fec0::/10).
	 * These are deprecated but still blocked for security at validation time.
	 */
	public function test_send_webhooks_blocks_ipv6_site_local() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://[fec0::1]/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Prevent actual network requests - return WP_Error if filter is reached
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return new \WP_Error( 'http_request_not_executed', 'Request should have been blocked.' );
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// IPv6 site-local addresses (deprecated) should be blocked at validation time
		$this->assertFalse( $http_request_made, 'HTTP request should not be made for IPv6 site-local URLs' );
		$this->assertCount( 1, $logged_events );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'webhook_skipped', $logged_events[0]['event'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'blocked_ip', $logged_events[0]['reason'] );
	}

	/**
	 * Test that webhook blocks IPv4-mapped IPv6 addresses.
	 * SSRF protection should block ::ffff:169.254.169.254 which maps to the AWS metadata endpoint.
	 */
	public function test_send_webhooks_blocks_ipv4_mapped_ipv6() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://[::ffff:169.254.169.254]/latest/meta-data/',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// IPv4-mapped IPv6 addresses should be blocked at validation time
		$this->assertFalse( $http_request_made, 'HTTP request should not be made for IPv4-mapped IPv6 URLs' );
		$this->assertNotEmpty( $logged_events, 'Blocked IP should be logged' );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'blocked_ip', $logged_events[0]['reason'] );
	}

	/**
	 * Test that webhook blocks fc00:: addresses (part of fc00::/7 unique local range).
	 * SSRF protection should block fc00::/8 in addition to fd00::/8.
	 */
	public function test_send_webhooks_blocks_ipv6_fc00_range() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://[fc00::1]/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{}',
				);
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// fc00:: addresses should be blocked at validation time
		$this->assertFalse( $http_request_made, 'HTTP request should not be made for fc00:: URLs' );
	}

	/**
	 * Test webhook is blocked when URL uses localhost hostname.
	 * SSRF protection should block localhost - either at validation (if resolves to 127.0.0.1)
	 * or at request time via wp_safe_remote_request().
	 */
	public function test_send_webhooks_blocks_localhost_hostname() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://localhost/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// localhost should be blocked - either at validation or by wp_safe_remote_request
		$error_meta = get_post_meta( $post_id, '_jetpack_forms_webhook_error', true );
		$this->assertTrue(
			! $http_request_made || ! empty( $error_meta ) || ! empty( $logged_events ),
			'localhost hostname should be blocked or fail'
		);
	}

	/**
	 * Test webhook is blocked when URL contains URL-encoded IP address.
	 * This tests for URL encoding bypass attempts like 169%2e254%2e169%2e254.
	 */
	public function test_send_webhooks_blocks_url_encoded_ip() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						// URL-encoded dots: 169.254.169.254 -> 169%2e254%2e169%2e254
						'url'        => 'https://169%2e254%2e169%2e254/latest/meta-data/',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// URL-encoded IPs are rejected as invalid URLs by filter_var()
		$this->assertFalse( $http_request_made, 'HTTP request should not be made for URL-encoded IP URLs' );
		$this->assertNotEmpty( $logged_events, 'Invalid URL should be logged' );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'invalid_url', $logged_events[0]['reason'] );
	}

	/**
	 * Test webhook is blocked for other link-local addresses (not just AWS metadata).
	 * The entire 169.254.0.0/16 range should be blocked.
	 */
	public function test_send_webhooks_blocks_other_link_local_addresses() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://169.254.1.1/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{}',
				);
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// All link-local addresses (169.254.x.x) should be blocked at validation time
		$this->assertFalse( $http_request_made, 'HTTP request should not be made for link-local URLs' );
	}

	/**
	 * Test webhook is blocked for Azure Wire Server endpoint.
	 * Azure uses 168.63.129.16 for internal services including Instance Metadata Service.
	 */
	public function test_send_webhooks_blocks_azure_wire_server() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://168.63.129.16/metadata/instance',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// Azure Wire Server IP should be blocked at validation time
		$this->assertFalse( $http_request_made, 'HTTP request should not be made for Azure Wire Server URLs' );
		$this->assertNotEmpty( $logged_events, 'Blocked IP should be logged' );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'blocked_ip', $logged_events[0]['reason'] );
	}

	/**
	 * Test webhook is blocked when URL uses decimal IP notation.
	 * Decimal notation like 2852039166 converts to 169.254.169.254.
	 */
	public function test_send_webhooks_blocks_decimal_ip_notation() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						// 2852039166 = 169.254.169.254 in decimal
						'url'        => 'https://2852039166/latest/meta-data/',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{}',
				);
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// Decimal IP notation should be blocked - either by validation or wp_safe_remote_request
		$error_meta = get_post_meta( $post_id, '_jetpack_forms_webhook_error', true );
		$this->assertTrue(
			! $http_request_made || ! empty( $error_meta ) || ! empty( $logged_events ),
			'Decimal IP notation should be blocked or fail'
		);
	}

	/**
	 * Test webhook is blocked when URL uses octal IP notation.
	 * Octal notation like 0251.0376.0251.0376 converts to 169.254.169.254.
	 */
	public function test_send_webhooks_blocks_octal_ip_notation() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						// 0251.0376.0251.0376 = 169.254.169.254 in octal
						'url'        => 'https://0251.0376.0251.0376/latest/meta-data/',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{}',
				);
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// Octal IP notation should be blocked - either by validation or wp_safe_remote_request
		$error_meta = get_post_meta( $post_id, '_jetpack_forms_webhook_error', true );
		$this->assertTrue(
			! $http_request_made || ! empty( $error_meta ) || ! empty( $logged_events ),
			'Octal IP notation should be blocked or fail'
		);
	}

	/**
	 * Test webhook is blocked when URL uses zero-padded IP notation.
	 * Zero-padded IPs like 127.000.000.001 should resolve to 127.0.0.1.
	 */
	public function test_send_webhooks_blocks_zero_padded_ip() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://127.000.000.001/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// Zero-padded localhost should be blocked by wp_safe_remote_request
		$error_meta = get_post_meta( $post_id, '_jetpack_forms_webhook_error', true );
		$this->assertNotEmpty( $error_meta, 'Error should be logged for zero-padded localhost URLs' );
	}

	/**
	 * Test webhook is blocked for IPv6 addresses with zone identifiers.
	 * Zone identifiers like fe80::1%eth0 are used for link-local addresses.
	 */
	public function test_send_webhooks_blocks_ipv6_with_zone_id() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						// %25 is URL-encoded % for zone identifier
						'url'        => 'https://[fe80::1%25eth0]/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// IPv6 with zone identifier is rejected as invalid URL by filter_var()
		$this->assertFalse( $http_request_made, 'HTTP request should not be made for IPv6 with zone identifier' );
		$this->assertNotEmpty( $logged_events, 'Invalid URL should be logged' );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeInvalidDimOffset
		$this->assertEquals( 'invalid_url', $logged_events[0]['reason'] );
	}

	/**
	 * Test webhook handles hostname with trailing dot.
	 * Trailing dots are valid in DNS but could be used in bypass attempts.
	 */
	public function test_send_webhooks_handles_trailing_dot_hostname() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://localhost./webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		// Track if HTTP request was made
		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			}
		);

		$logged_events = array();
		add_action(
			'jetpack_forms_log',
			function ( $event, $reason, $data = null ) use ( &$logged_events ) {
				$logged_events[] = array(
					'event'  => $event,
					'reason' => $reason,
					'data'   => $data,
				);
			},
			10,
			3
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		// localhost with trailing dot should be blocked - either at validation or by wp_safe_remote_request
		$error_meta = get_post_meta( $post_id, '_jetpack_forms_webhook_error', true );
		$this->assertTrue(
			! $http_request_made || ! empty( $error_meta ) || ! empty( $logged_events ),
			'Trailing dot localhost hostname should be blocked or fail'
		);
	}

	/**
	 * Test webhook allows valid public HTTPS URLs.
	 */
	public function test_send_webhooks_allows_valid_public_https_urls() {
		$form   = $this->create_mock_form(
			array(
				'webhooks' => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://hooks.zapier.com/webhook/123',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
			)
		);
		$fields = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

		$post_id = $this->create_feedback_post( $form, $fields );

		$http_request_made = false;
		add_filter(
			'pre_http_request',
			function () use ( &$http_request_made ) {
				$http_request_made = true;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '{"success":true}',
					'headers'  => new CaseInsensitiveDictionary( array( 'Content-Type' => 'application/json' ) ),
				);
			}
		);

		$webhooks = Form_Webhooks::init();
		$webhooks->send_webhooks( $post_id, $fields, false, array() );

		$this->assertTrue( $http_request_made, 'HTTP request should be made for valid public HTTPS URLs' );
	}

	/**
	 * Helper method to create a test form object.
	 *
	 * @param array $attributes Form attributes.
	 * @return Contact_Form Test form instance with required properties.
	 */
	private function create_mock_form( $attributes ) {
		return new class( $attributes ) extends Contact_Form {
			/**
			 * Constructor.
			 *
			 * @param array $attributes Form attributes.
			 */
			public function __construct( $attributes ) {
				// Don't call parent constructor - just set properties directly
				$this->attributes = $attributes;
				$this->fields     = array();
			}
		};
	}

	/**
	 * Helper method to create a test field object.
	 *
	 * @param Contact_Form $form Parent form.
	 * @param string       $id Field ID.
	 * @param mixed        $value Field value.
	 * @return Contact_Form_Field Test field instance with required properties and methods.
	 */
	private function create_mock_field( $form, $id, $value ) {
		return new class( $form, $id, $value ) extends Contact_Form_Field {
			/**
			 * Field ID.
			 *
			 * @var string
			 */
			private $id;

			/**
			 * Constructor.
			 *
			 * @param Contact_Form $form Parent form.
			 * @param string       $id Field ID.
			 * @param mixed        $value Field value.
			 */
			public function __construct( $form, $id, $value ) {
				// Don't call parent constructor - just set properties directly
				$this->form  = $form;
				$this->id    = $id;
				$this->value = $value;
			}

			/**
			 * Get field attribute.
			 *
			 * @param string $attr Attribute name.
			 * @return mixed Attribute value or null.
			 */
			public function get_attribute( $attr ) {
				if ( $attr === 'id' ) {
					return $this->id;
				}
				return null;
			}
		};
	}

	/**
	 * Helper method to create a feedback post with fields.
	 *
	 * @param Contact_Form $form The mock form object with webhook configuration.
	 * @param array        $fields Array of Contact_Form_Field mock instances.
	 * @return int The feedback post ID.
	 */
	private function create_feedback_post( $form, $fields ) {
		// Build POST data from fields
		$post_data        = array();
		$shortcode_fields = array();
		foreach ( $fields as $field ) {
			$field_id               = $field->get_attribute( 'id' );
			$post_data[ $field_id ] = $field->value;
			// Create shortcode for each field based on its ID (name, email, etc.)
			$shortcode_fields[] = "[contact-field label='" . ucfirst( $field_id ) . "' type='text' id='" . $field_id . "'/]";
		}

		// Create a real Contact_Form with the webhook configuration
		$real_form = new Contact_Form(
			$form->attributes,
			implode( '', $shortcode_fields )
		);

		// Create feedback from submission
		$feedback = Feedback::from_submission( $post_data, $real_form );
		$post_id  = $feedback->save();

		return is_int( $post_id ) ? $post_id : $post_id->ID;
	}
}
