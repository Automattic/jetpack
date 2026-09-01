<?php
/**
 * Unit tests for the Slack integration.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Slack.
 *
 * @covers Automattic\Jetpack\Forms\Service\Slack
 */
#[CoversClass( Slack::class )]
class Slack_Test extends BaseTestCase {

	/**
	 * Requests captured instead of being sent.
	 *
	 * @var array
	 */
	private $requests = array();

	/**
	 * Intercept outbound HTTP so nothing leaves the test run.
	 */
	protected function set_up() {
		$this->requests = array();

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				$this->requests[] = array(
					'url'  => $url,
					'body' => json_decode( $args['body'], true ),
				);

				return array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => 'ok',
				);
			},
			10,
			3
		);
	}

	/**
	 * Remove the interceptor.
	 */
	protected function tear_down() {
		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Only Slack's own incoming-webhook URLs are accepted. Anything else would turn the field
	 * into a way to make the site issue arbitrary requests, and to send responses elsewhere.
	 */
	public function test_only_slack_incoming_webhook_urls_are_valid() {
		$this->assertTrue( Slack::is_valid_webhook_url( $this->webhook_url() ) );

		// Wrong scheme.
		$this->assertFalse( Slack::is_valid_webhook_url( 'http://hooks.slack.com/services/T0/B0/XX' ) );
		// Not Slack.
		$this->assertFalse( Slack::is_valid_webhook_url( 'https://example.com/services/T0/B0/XX' ) );
		// Internal addresses.
		$this->assertFalse( Slack::is_valid_webhook_url( 'http://127.0.0.1/services/T0/B0/XX' ) );
		$this->assertFalse( Slack::is_valid_webhook_url( 'http://169.254.169.254/latest/meta-data' ) );
		// A host that merely ends with Slack's domain.
		$this->assertFalse( Slack::is_valid_webhook_url( 'https://hooks.slack.com.evil.test/services/T0/B0/XX' ) );
		// Slack, but not an incoming webhook.
		$this->assertFalse( Slack::is_valid_webhook_url( 'https://hooks.slack.com/other/T0/B0/XX' ) );
		// Non-strings.
		$this->assertFalse( Slack::is_valid_webhook_url( null ) );
		$this->assertFalse( Slack::is_valid_webhook_url( array() ) );
	}

	/**
	 * A form can be enabled while its URL is missing or has been edited into something
	 * unusable. Nothing should be sent.
	 */
	public function test_nothing_is_sent_without_a_valid_url() {
		Slack::send( $this->context( array( 'enabled' => true ) ) );
		Slack::send(
			$this->context(
				array(
					'enabled'    => true,
					'webhookUrl' => 'https://example.com/hook',
				)
			)
		);

		$this->assertSame( array(), $this->requests );
	}

	/**
	 * The happy path: a Block Kit message posted to the configured URL.
	 */
	public function test_sends_a_block_kit_message_with_the_response() {
		Slack::send( $this->context( $this->valid_settings() ) );

		$this->assertCount( 1, $this->requests );
		$this->assertSame( $this->webhook_url(), $this->requests[0]['url'] );

		$payload = $this->requests[0]['body'];

		$this->assertArrayHasKey( 'blocks', $payload );
		$this->assertSame( 'header', $payload['blocks'][0]['type'] );
		$this->assertStringContainsString( 'Contact Us', $payload['blocks'][0]['text']['text'] );

		// A fallback string is required for notifications and unsupported clients.
		$this->assertNotEmpty( $payload['text'] );

		$encoded = wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		$this->assertStringContainsString( 'Jane Doe', $encoded );
		$this->assertStringContainsString( 'View response', $encoded );
	}

	/**
	 * Opting out of response content must leave every answer out of the payload, not merely
	 * hide it behind a shorter label.
	 */
	public function test_response_content_is_omitted_when_the_form_opts_out() {
		$settings                   = $this->valid_settings();
		$settings['includeContent'] = false;

		Slack::send( $this->context( $settings ) );

		$encoded = wp_json_encode( $this->requests[0]['body'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );

		$this->assertStringNotContainsString( 'Jane Doe', $encoded );
		$this->assertStringNotContainsString( 'jane@example.com', $encoded );
		// The notification itself still goes out, with a link.
		$this->assertStringContainsString( 'Contact Us', $encoded );
		$this->assertStringContainsString( 'View response', $encoded );
	}

	/**
	 * Slack treats these three characters as markup, so a response containing them must not be
	 * able to inject formatting into the message.
	 */
	public function test_slack_markup_characters_in_a_response_are_escaped() {
		Slack::send( $this->context( $this->valid_settings(), '<b>bold</b> & <https://evil.test|click>' ) );

		$encoded = wp_json_encode( $this->requests[0]['body'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );

		$this->assertStringContainsString( '&lt;b&gt;bold&lt;/b&gt; &amp; ', $encoded );
		// The link syntax Slack would otherwise render is neutralized.
		$this->assertStringNotContainsString( '<https://evil.test|click>', $encoded );
		$this->assertStringContainsString( '&lt;https://evil.test|click&gt;', $encoded );
	}

	/**
	 * A failed delivery is recorded so a silent integration can be debugged.
	 */
	public function test_a_failed_delivery_is_recorded_on_the_response() {
		remove_all_filters( 'pre_http_request' );
		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array(
						'code'    => 404,
						'message' => 'Not Found',
					),
					'body'     => 'no_service',
				);
			}
		);

		$post_id = wp_insert_post( array( 'post_title' => 'response' ) );

		Slack::send( $this->context( $this->valid_settings(), 'Jane Doe', $post_id ) );

		$this->assertStringContainsString( 'no_service', get_post_meta( $post_id, '_jetpack_forms_slack_error', true ) );
	}

	/**
	 * A valid webhook URL for tests.
	 *
	 * @return string
	 */
	private function webhook_url() {
		// Deliberately not shaped like a real Slack webhook (`T…/B…/` plus 24 characters):
		// GitHub's push protection treats that shape as a leaked credential and rejects the
		// push, even for an obviously fake value. The validator only cares about the host and
		// the /services/ path, so a clearly-fake tail exercises it just as well.
		return 'https://hooks.slack.com/services/EXAMPLE/WEBHOOK/FOR-TESTS-ONLY';
	}

	/**
	 * Settings for an enabled, correctly configured form.
	 *
	 * @return array
	 */
	private function valid_settings() {
		return array(
			'enabled'    => true,
			'webhookUrl' => $this->webhook_url(),
		);
	}

	/**
	 * Build the submission context the dispatcher passes to an integration.
	 *
	 * @param array    $settings Integration settings for the form.
	 * @param string   $name     Value of the Name answer.
	 * @param int|null $post_id  Feedback post ID.
	 * @return array
	 */
	private function context( array $settings, $name = 'Jane Doe', $post_id = null ) {
		$feedback = new class( $name ) {
			/**
			 * The Name answer.
			 *
			 * @var string
			 */
			private $name;

			/**
			 * Constructor.
			 *
			 * @param string $name The Name answer.
			 */
			public function __construct( $name ) {
				$this->name = $name;
			}

			/**
			 * Stand in for Feedback::get_compiled_fields().
			 *
			 * @param string $context     Render context.
			 * @param string $array_shape Requested shape.
			 * @return array
			 */
			public function get_compiled_fields( $context = 'default', $array_shape = 'all' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return array(
					array(
						'label' => 'Name',
						'value' => $this->name,
					),
					array(
						'label' => 'Email',
						'value' => 'jane@example.com',
					),
				);
			}
		};

		$form = new class() {
			/**
			 * Form attributes.
			 *
			 * @var array
			 */
			public $attributes = array( 'formTitle' => 'Contact Us' );
		};

		return array(
			'settings'     => $settings,
			'post_id'      => $post_id ? $post_id : 1,
			'form'         => $form,
			'feedback'     => $feedback,
			'entry_values' => array(),
		);
	}
}
