<?php
/**
 * Tests for the `subscription_options` core REST settings registration and sanitizer
 * declared in modules/subscriptions/views.php.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions/views.php';

/**
 * @covers ::jetpack_sanitize_subscription_options
 * @covers ::register_subscription_options_setting
 */
#[CoversFunction( 'jetpack_sanitize_subscription_options' )]
#[CoversFunction( 'register_subscription_options_setting' )]
class Jetpack_Subscription_Options_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Existing option value applied before each test so the sibling-merge behaviour
	 * has a deterministic baseline to merge against.
	 *
	 * @var array<string, string>
	 */
	private static $baseline = array(
		'invitation'              => 'Existing invitation',
		'comment_follow'          => 'Existing comment follow',
		'welcome'                 => 'Existing welcome',
		'subscribe_modal_heading' => 'Existing heading',
	);

	public function set_up() {
		parent::set_up();
		update_option( 'subscription_options', self::$baseline );
	}

	public function tear_down() {
		delete_option( 'subscription_options' );
		parent::tear_down();
	}

	// ──────────────────────────────────────────────────
	// jetpack_sanitize_subscription_options()
	// ──────────────────────────────────────────────────

	/**
	 * Non-array input should return the existing stored value unchanged.
	 *
	 * @dataProvider non_array_input_provider
	 *
	 * @param mixed $value Input passed to the sanitizer.
	 */
	#[DataProvider( 'non_array_input_provider' )]
	public function test_non_array_input_returns_existing_option( $value ) {
		$this->assertSame( self::$baseline, jetpack_sanitize_subscription_options( $value ) );
	}

	/**
	 * @return array<string, array{0: mixed}>
	 */
	public static function non_array_input_provider() {
		return array(
			'null'    => array( null ),
			'string'  => array( 'not an array' ),
			'integer' => array( 42 ),
			'bool'    => array( false ),
		);
	}

	public function test_unknown_keys_are_dropped() {
		$sanitized = jetpack_sanitize_subscription_options(
			array(
				'subscribe_modal_heading' => 'Hello',
				'evil_key'                => 'should be dropped',
				'arbitrary'               => 'also dropped',
			)
		);

		$this->assertArrayNotHasKey( 'evil_key', $sanitized );
		$this->assertArrayNotHasKey( 'arbitrary', $sanitized );
		$this->assertSame( 'Hello', $sanitized['subscribe_modal_heading'] );
	}

	public function test_disallowed_html_tags_are_stripped() {
		$sanitized = jetpack_sanitize_subscription_options(
			array(
				'welcome'                 => '<script>alert(1)</script>Welcome <a href="https://example.com">aboard</a>',
				'subscribe_modal_heading' => '<iframe src="evil"></iframe>Subscribe',
			)
		);

		$this->assertStringNotContainsString( '<script>', $sanitized['welcome'] );
		$this->assertStringNotContainsString( '<iframe', $sanitized['subscribe_modal_heading'] );
		$this->assertStringContainsString( '<a href="https://example.com">aboard</a>', $sanitized['welcome'] );
		$this->assertSame( 'Subscribe', $sanitized['subscribe_modal_heading'] );
	}

	public function test_allowed_html_tags_are_preserved_in_message_keys() {
		$markup    = '<p>Hi <strong>there</strong>!</p><ul><li>One</li></ul>';
		$sanitized = jetpack_sanitize_subscription_options(
			array(
				'invitation' => $markup,
				'welcome'    => '<em>Cheers</em>',
			)
		);

		$this->assertSame( $markup, $sanitized['invitation'] );
		$this->assertSame( '<em>Cheers</em>', $sanitized['welcome'] );
	}

	/**
	 * Subscribe_modal_heading is trimmed: whitespace-only collapses to ''.
	 *
	 * @dataProvider heading_trim_provider
	 *
	 * @param string $input    Raw heading input.
	 * @param string $expected Expected stored value.
	 */
	#[DataProvider( 'heading_trim_provider' )]
	public function test_subscribe_modal_heading_is_trimmed( $input, $expected ) {
		$sanitized = jetpack_sanitize_subscription_options(
			array( 'subscribe_modal_heading' => $input )
		);
		$this->assertSame( $expected, $sanitized['subscribe_modal_heading'] );
	}

	/**
	 * @return array<string, array{0: string, 1: string}>
	 */
	public static function heading_trim_provider() {
		return array(
			'spaces only'         => array( '   ', '' ),
			'tabs and newlines'   => array( "\n  \t  ", '' ),
			'leading whitespace'  => array( '   Hello', 'Hello' ),
			'trailing whitespace' => array( 'Hello   ', 'Hello' ),
			'both sides'          => array( '   Hello   ', 'Hello' ),
			'inner whitespace'    => array( 'Hello  world', 'Hello  world' ),
			'no whitespace'       => array( 'Hello', 'Hello' ),
			'empty string'        => array( '', '' ),
		);
	}

	public function test_partial_writes_merge_with_existing_option() {
		$sanitized = jetpack_sanitize_subscription_options(
			array( 'subscribe_modal_heading' => 'Brand new' )
		);

		$this->assertSame( 'Brand new', $sanitized['subscribe_modal_heading'] );
		$this->assertSame( self::$baseline['invitation'], $sanitized['invitation'] );
		$this->assertSame( self::$baseline['welcome'], $sanitized['welcome'] );
		$this->assertSame( self::$baseline['comment_follow'], $sanitized['comment_follow'] );
	}

	public function test_other_keys_are_not_trimmed() {
		// Welcome/invitation/comment_follow can legitimately have surrounding
		// whitespace for email-template formatting reasons; only the modal
		// heading is normalized.
		$sanitized = jetpack_sanitize_subscription_options(
			array( 'welcome' => '  Hello  ' )
		);
		$this->assertSame( '  Hello  ', $sanitized['welcome'] );
	}

	/**
	 * Registers `subscription_options` for the core /wp/v2/settings REST API
	 * with the canonical sanitize callback.
	 */
	public function test_register_subscription_options_setting_registers_with_sanitize_callback() {
		// The `init` hook in views.php has already fired by test time, so the
		// setting is registered. Calling the function again is a no-op (WP
		// silently overrides), and lets us verify the canonical shape.
		register_subscription_options_setting();
		$registered = get_registered_settings();

		$this->assertArrayHasKey( 'subscription_options', $registered );
		$this->assertSame(
			'jetpack_sanitize_subscription_options',
			$registered['subscription_options']['sanitize_callback']
		);
	}

	/**
	 * Exposes a JSON schema on the REST API that lists all four sub-keys and
	 * titles the entry "Subscribe messages" for the entities-saved-states label.
	 */
	public function test_register_subscription_options_setting_exposes_schema_on_rest() {
		register_subscription_options_setting();
		$registered = get_registered_settings();

		$schema = $registered['subscription_options']['show_in_rest']['schema'] ?? null;
		$this->assertIsArray( $schema, 'subscription_options must be exposed via show_in_rest with a schema.' );
		$this->assertSame( 'object', $schema['type'] );
		$this->assertSame( 'Subscribe messages', $schema['title'] );

		$properties = $schema['properties'] ?? array();
		$this->assertArrayHasKey( 'invitation', $properties );
		$this->assertArrayHasKey( 'welcome', $properties );
		$this->assertArrayHasKey( 'comment_follow', $properties );
		$this->assertArrayHasKey( 'subscribe_modal_heading', $properties );
		$this->assertSame( 'string', $properties['subscribe_modal_heading']['type'] );
	}
}
