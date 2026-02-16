<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\ContactForm\Feedback_Email_Renderer.
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Feedback_Email_Renderer
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback_Email_Renderer
 */
#[CoversClass( Feedback_Email_Renderer::class )]
class Feedback_Email_Renderer_Test extends BaseTestCase {

	/**
	 * Test generate_respondent_info_html returns empty string for empty input.
	 */
	public function test_generate_respondent_info_html_empty_input() {
		$this->assertSame( '', self::invoke_static_method( 'generate_respondent_info_html', array() ) );
	}

	/**
	 * Test generate_respondent_info_html returns empty string when no name or email.
	 */
	public function test_generate_respondent_info_html_no_name_no_email() {
		$result = self::invoke_static_method(
			'generate_respondent_info_html',
			array( 'avatar' => 'https://example.com/avatar.jpg' )
		);
		$this->assertSame( '', $result );
	}

	/**
	 * Test generate_respondent_info_html with name and email, no avatar.
	 */
	public function test_generate_respondent_info_html_name_and_email() {
		$result = self::invoke_static_method(
			'generate_respondent_info_html',
			array(
				'name'  => 'John Doe',
				'email' => 'john@example.com',
			)
		);

		$this->assertStringContainsString( 'JD', $result );
		$this->assertStringContainsString( 'respondent-name', $result );
		$this->assertStringContainsString( 'John Doe', $result );
		$this->assertStringContainsString( 'respondent-email', $result );
		$this->assertStringContainsString( 'mailto:john@example.com', $result );
		$this->assertStringNotContainsString( '<img src=', $result );
	}

	/**
	 * Test generate_respondent_info_html with single-word name produces one-letter initial.
	 */
	public function test_generate_respondent_info_html_single_word_name() {
		$result = self::invoke_static_method(
			'generate_respondent_info_html',
			array(
				'name'  => 'Madonna',
				'email' => 'madonna@example.com',
			)
		);

		$this->assertMatchesRegularExpression( '/respondent-avatar-wrapper[^>]*>\s*M\s*<\/div>/', $result );
	}

	/**
	 * Test generate_respondent_info_html with email only (no name).
	 */
	public function test_generate_respondent_info_html_email_only() {
		$result = self::invoke_static_method(
			'generate_respondent_info_html',
			array( 'email' => 'test@example.com' )
		);

		$this->assertStringContainsString( 'T', $result );
		$this->assertStringContainsString( 'respondent-email', $result );
		$this->assertStringContainsString( 'mailto:test@example.com', $result );
		$this->assertStringNotContainsString( 'respondent-name', $result );
	}

	/**
	 * Test generate_respondent_info_html with avatar URL renders img tag.
	 */
	public function test_generate_respondent_info_html_with_avatar() {
		$result = self::invoke_static_method(
			'generate_respondent_info_html',
			array(
				'name'   => 'John Doe',
				'email'  => 'john@example.com',
				'avatar' => 'https://example.com/avatar.jpg',
			)
		);

		$this->assertStringContainsString( '<img src=', $result );
		$this->assertStringContainsString( 'avatar.jpg', $result );
	}

	/**
	 * Test generate_metadata_html returns empty string for empty input.
	 */
	public function test_generate_metadata_html_empty_input() {
		$this->assertSame( '', self::invoke_static_method( 'generate_metadata_html', array() ) );
	}

	/**
	 * Test generate_metadata_html with date only.
	 */
	public function test_generate_metadata_html_date_only() {
		$result = self::invoke_static_method(
			'generate_metadata_html',
			array( 'date' => 'January 1, 2025' )
		);

		$this->assertStringContainsString( 'metadata-table', $result );
		$this->assertStringContainsString( 'Date', $result );
		$this->assertStringContainsString( 'January 1, 2025', $result );
	}

	/**
	 * Test generate_metadata_html with source and URL wraps in link.
	 */
	public function test_generate_metadata_html_source_with_url() {
		$result = self::invoke_static_method(
			'generate_metadata_html',
			array(
				'source'     => 'My Site',
				'source_url' => 'https://example.com',
			)
		);

		$this->assertStringContainsString( 'Source', $result );
		$this->assertStringContainsString( '<a href="https://example.com"', $result );
		$this->assertStringContainsString( 'My Site</a>', $result );
	}

	/**
	 * Test generate_metadata_html with source but no URL renders plain text.
	 */
	public function test_generate_metadata_html_source_without_url() {
		$result = self::invoke_static_method(
			'generate_metadata_html',
			array( 'source' => 'My Site' )
		);

		$this->assertStringContainsString( 'Source', $result );
		$this->assertStringContainsString( 'My Site', $result );
		$this->assertStringNotContainsString( '<a href=', $result );
	}

	/**
	 * Test generate_metadata_html with IP and flag prepends emoji.
	 */
	public function test_generate_metadata_html_ip_with_flag() {
		$us_flag = "\xF0\x9F\x87\xBA\xF0\x9F\x87\xB8";
		$result  = self::invoke_static_method(
			'generate_metadata_html',
			array(
				'ip'      => '192.168.1.1',
				'ip_flag' => $us_flag,
			)
		);

		$this->assertStringContainsString( 'IP address', $result );
		$this->assertStringContainsString( $us_flag . ' 192.168.1.1', $result );
	}

	/**
	 * Test generate_metadata_html with IP but no flag.
	 */
	public function test_generate_metadata_html_ip_without_flag() {
		$result = self::invoke_static_method(
			'generate_metadata_html',
			array( 'ip' => '10.0.0.1' )
		);

		$this->assertStringContainsString( 'IP address', $result );
		$this->assertStringContainsString( '10.0.0.1', $result );
	}

	/**
	 * Test generate_metadata_html with all fields populates all rows and divider.
	 */
	public function test_generate_metadata_html_all_fields() {
		$result = self::invoke_static_method(
			'generate_metadata_html',
			array(
				'date'       => 'January 1, 2025',
				'source'     => 'My Site',
				'source_url' => 'https://example.com',
				'device'     => 'Desktop',
				'ip'         => '192.168.1.1',
				'ip_flag'    => "\xF0\x9F\x87\xBA\xF0\x9F\x87\xB8",
			)
		);

		$this->assertStringContainsString( 'Date', $result );
		$this->assertStringContainsString( 'Source', $result );
		$this->assertStringContainsString( 'Device', $result );
		$this->assertStringContainsString( 'IP address', $result );
		$this->assertStringContainsString( 'border-bottom: 1px solid #E4E4E7', $result );
	}

	/**
	 * Test format_field_for_email with label renders label, value, and field icon.
	 */
	public function test_format_field_for_email_with_label() {
		$result = self::invoke_static_method(
			'format_field_for_email',
			array(
				'label' => 'Your Name',
				'value' => 'John Doe',
				'type'  => 'name',
			)
		);

		$this->assertStringContainsString( 'Your Name', $result );
		$this->assertStringContainsString( '#757575', $result );
		$this->assertStringContainsString( 'John Doe', $result );
		$this->assertStringContainsString( 'field-text@2x.png', $result );
	}

	/**
	 * Test format_field_for_email without label omits label styling.
	 */
	public function test_format_field_for_email_without_label() {
		$result = self::invoke_static_method(
			'format_field_for_email',
			array(
				'label' => '',
				'value' => 'Some value',
				'type'  => 'text',
			)
		);

		$this->assertStringNotContainsString( '#757575', $result );
		$this->assertStringContainsString( 'Some value', $result );
		$this->assertStringContainsString( 'field-text@2x.png', $result );
	}

	/**
	 * Test format_field_for_email defaults type to text when omitted.
	 */
	public function test_format_field_for_email_default_type() {
		$result = self::invoke_static_method(
			'format_field_for_email',
			array(
				'label' => 'Test',
				'value' => 'Value',
			)
		);

		$this->assertStringContainsString( 'field-text@2x.png', $result );
	}

	/**
	 * Test add_plain_text_alternative converts HTML to plain text.
	 */
	public function test_add_plain_text_alternative() {
		$alt_body = self::get_plain_text_alt_body( '<p>Hello World</p><br><hr><div>Content</div>' );

		$this->assertStringNotContainsString( '<br>', $alt_body );
		$this->assertStringContainsString( '----', $alt_body );
		$this->assertStringNotContainsString( '<p>', $alt_body );
		$this->assertStringNotContainsString( '<div', $alt_body );
		$this->assertStringContainsString( 'Hello World', $alt_body );
		$this->assertStringContainsString( 'Content', $alt_body );
	}

	/**
	 * Test add_plain_text_alternative handles self-closing br variant.
	 */
	public function test_add_plain_text_alternative_br_variant() {
		$alt_body = self::get_plain_text_alt_body( 'Line 1<br />Line 2' );

		$this->assertStringContainsString( "Line 1\nLine 2", $alt_body );
	}

	/**
	 * Test wrap_message_in_html_tags returns body unchanged when it already contains <html.
	 */
	public function test_wrap_message_in_html_tags_pre_wrapped_html() {
		$body   = '<html><body>Already wrapped</body></html>';
		$result = Contact_Form::wrap_message_in_html_tags( 'Title', $body, 'Footer' );

		$this->assertSame( $body, $result );
	}

	/**
	 * Invoke a private static method on Feedback_Email_Renderer via reflection.
	 *
	 * @param string $method_name The method name.
	 * @param mixed  ...$args     Arguments to pass to the method.
	 * @return mixed The method's return value.
	 */
	private static function invoke_static_method( $method_name, ...$args ) {
		$reflection = new \ReflectionClass( Feedback_Email_Renderer::class );
		$method     = $reflection->getMethod( $method_name );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( null, ...$args );
	}

	/**
	 * Run add_plain_text_alternative on the given HTML body and return the AltBody.
	 *
	 * @param string $html The HTML body content.
	 * @return string The plain text alternative.
	 */
	private static function get_plain_text_alt_body( $html ) {
		$mailer = new \stdClass();
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$mailer->Body = $html;
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- stdClass duck-types PHPMailer's Body/AltBody properties.
		Contact_Form::add_plain_text_alternative( $mailer );
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		return $mailer->AltBody;
	}
}
