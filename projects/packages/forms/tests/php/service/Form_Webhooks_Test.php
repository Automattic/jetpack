<?php
/**
 * Unit Tests for Form_Webhooks.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field;
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
		$webhooks->send_webhooks( 123, $fields, false, array() );

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
		$webhooks->send_webhooks( 123, $fields, false, array() );

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
		$webhooks->send_webhooks( 123, $fields, false, array() );

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
		$webhooks->send_webhooks( 123, $fields, false, array() );

		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeMismatchArgumentInternal
		$body_data = json_decode( $captured_request['args']['body'], true );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNullable
		$this->assertEquals( 'custom_value', $body_data['custom_field'] );
	}

	/**
	 * Test webhook logs successful response to post meta.
	 */
	public function test_send_webhooks_logs_successful_response() {
		$post_id = 123;
		$form    = $this->create_mock_form(
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
		$fields  = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

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
		$post_id = 456;
		$form    = $this->create_mock_form(
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
		$fields  = array( $this->create_mock_field( $form, 'test-field', 'test value' ) );

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
	 * Test webhook includes hidden fields in data.
	 */
	public function test_send_webhooks_includes_hidden_fields() {
		$form         = $this->create_mock_form(
			array(
				'webhooks'     => array(
					array(
						'webhook_id' => 'test-webhook',
						'url'        => 'https://example.com/webhook',
						'format'     => 'json',
						'method'     => 'POST',
						'enabled'    => true,
					),
				),
				'hiddenFields' => array(
					array(
						'name'  => 'utm_source',
						'value' => 'google',
					),
					array(
						'name'  => 'utm_campaign',
						'value' => 'summer_2025',
					),
				),
			)
		);
		$field1       = $this->create_mock_field( $form, 'email', 'john@example.com' );
		$form->fields = array( $field1 );
		$fields       = array( $field1 );

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
		$webhooks->send_webhooks( 123, $fields, false, array() );

		// @phan-suppress-next-line PhanTypeArraySuspiciousNull, PhanTypeMismatchArgumentInternal
		$body_data = json_decode( $captured_request['args']['body'], true );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNullable
		$this->assertEquals( 'john@example.com', $body_data['email'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNullable
		$this->assertEquals( 'google', $body_data['utm_source'] );
		// @phan-suppress-next-line PhanTypeArraySuspiciousNullable
		$this->assertEquals( 'summer_2025', $body_data['utm_campaign'] );
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
		$webhooks->send_webhooks( 123, $fields, false, array() );

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
		$webhooks->send_webhooks( 123, $fields, false, array() );

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
		$webhooks->send_webhooks( 123, $fields, false, array() );

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
		$webhooks->send_webhooks( 123, $fields, false, array() );

		$this->assertNotNull( $captured_request, 'HTTP request should be made even with lowercase method' );
		$this->assertEquals( 'post', $captured_request['args']['method'] );
	}

	/**
	 * Helper method to create a mock form.
	 *
	 * @param array $attributes Form attributes.
	 * @return Contact_Form Mock form instance.
	 */
	private function create_mock_form( $attributes ) {
		$form = $this->getMockBuilder( Contact_Form::class )
			->disableOriginalConstructor()
			->getMock();

		$form->attributes = $attributes;
		$form->fields     = array();

		return $form;
	}

	/**
	 * Helper method to create a mock field.
	 *
	 * @param Contact_Form $form Parent form.
	 * @param string       $id Field ID.
	 * @param mixed        $value Field value.
	 * @return Contact_Form_Field Mock field instance.
	 */
	private function create_mock_field( $form, $id, $value ) {
		$field = $this->getMockBuilder( Contact_Form_Field::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'get_attribute' ) )
			->getMock();

		$field->form  = $form;
		$field->value = $value;

		$field->expects( $this->any() )
			->method( 'get_attribute' )
			->willReturnCallback(
				function ( $attr ) use ( $id ) {
					if ( $attr === 'id' ) {
						return $id;
					}
					return null;
				}
			);

		return $field;
	}
}
