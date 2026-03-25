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
	 * Test generate_metadata_html with logged-in user renders user info with display name.
	 */
	public function test_generate_metadata_html_logged_in_user() {
		$result = self::invoke_static_method(
			'generate_metadata_html',
			array(
				'logged_in_user' => array(
					'display_name' => 'John Smith',
					'username'     => 'jsmith',
					'id'           => 42,
				),
			)
		);

		$this->assertStringContainsString( 'Logged-in user', $result );
		$this->assertStringContainsString( 'John Smith (#42)', $result );
		$this->assertStringNotContainsString( 'jsmith', $result );
	}

	/**
	 * Test generate_metadata_html with logged-in user uses username as fallback when no display name.
	 */
	public function test_generate_metadata_html_logged_in_user_username_fallback() {
		$result = self::invoke_static_method(
			'generate_metadata_html',
			array(
				'logged_in_user' => array(
					'display_name' => '',
					'username'     => 'jsmith',
					'id'           => 123,
				),
			)
		);

		$this->assertStringContainsString( 'Logged-in user', $result );
		$this->assertStringContainsString( 'jsmith (#123)', $result );
	}

	/**
	 * Test generate_metadata_html with logged-in user uses username as fallback when display name is null.
	 */
	public function test_generate_metadata_html_logged_in_user_username_fallback_null_display_name() {
		$result = self::invoke_static_method(
			'generate_metadata_html',
			array(
				'logged_in_user' => array(
					'username' => 'fallbackuser',
					'id'       => 456,
				),
			)
		);

		$this->assertStringContainsString( 'Logged-in user', $result );
		$this->assertStringContainsString( 'fallbackuser (#456)', $result );
	}

	/**
	 * Test generate_metadata_html with logged-in user shows ID only when both display name and username are empty.
	 */
	public function test_generate_metadata_html_logged_in_user_id_only() {
		$result = self::invoke_static_method(
			'generate_metadata_html',
			array(
				'logged_in_user' => array(
					'display_name' => '',
					'username'     => '',
					'id'           => 123,
				),
			)
		);

		$this->assertStringContainsString( 'Logged-in user', $result );
		$this->assertStringContainsString( '#123', $result );
		$this->assertStringNotContainsString( '(#123)', $result );
	}

	/**
	 * Test generate_metadata_html without logged-in user omits the row.
	 */
	public function test_generate_metadata_html_no_logged_in_user() {
		$result = self::invoke_static_method(
			'generate_metadata_html',
			array(
				'date'   => 'January 1, 2025',
				'device' => 'Desktop',
			)
		);

		$this->assertStringNotContainsString( 'Logged-in user', $result );
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
	 * Test email_html renders plain text for a basic text field.
	 */
	public function test_email_html_text_field() {
		$field  = new Feedback_Field( 'k', 'Label', 'Hello world', 'text' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( 'Hello world', $result );
	}

	/**
	 * Test email_html renders empty value dash for empty text field.
	 */
	public function test_email_html_empty_text_field() {
		$field  = new Feedback_Field( 'k', 'Label', '', 'text' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( '&mdash;', $result );
	}

	/**
	 * Test email_html renders chips for select field.
	 */
	public function test_email_html_select_field() {
		$field  = new Feedback_Field( 'k', 'Label', 'Option A', 'select' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( 'Option A', $result );
		$this->assertStringContainsString( 'background-color: #f0f0f0', $result );
	}

	/**
	 * Test email_html renders multiple chips for checkbox-multiple field.
	 */
	public function test_email_html_checkbox_multiple_field() {
		$field  = new Feedback_Field( 'k', 'Label', array( 'Red', 'Blue' ), 'checkbox-multiple' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( 'Red', $result );
		$this->assertStringContainsString( 'Blue', $result );
		$this->assertStringContainsString( 'background-color: #f0f0f0', $result );
	}

	/**
	 * Test email_html renders Yes for consent field with truthy value.
	 */
	public function test_email_html_consent_yes() {
		$field  = new Feedback_Field( 'k', 'Consent', '1', 'consent' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( 'Yes', $result );
	}

	/**
	 * Test email_html renders No for consent field with empty value.
	 */
	public function test_email_html_consent_no() {
		$field  = new Feedback_Field( 'k', 'Consent', '', 'consent' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( 'No', $result );
	}

	/**
	 * Test email_html renders tel: link for phone field.
	 */
	public function test_email_html_phone_field() {
		$field  = new Feedback_Field( 'k', 'Phone', '+1 555 123 4567', 'phone' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( 'tel:', $result );
		$this->assertStringContainsString( '+1 555 123 4567', $result );
	}

	/**
	 * Test email_html renders clickable link for URL field.
	 */
	public function test_email_html_url_field() {
		$field  = new Feedback_Field( 'k', 'Website', 'https://example.com', 'url' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( 'href="https://example.com"', $result );
		$this->assertStringContainsString( 'https://example.com', $result );
	}

	/**
	 * Test email_html renders stars for rating field.
	 */
	public function test_email_html_rating_field() {
		$field  = new Feedback_Field( 'k', 'Rating', '3/5', 'rating' );
		$result = $field->get_render_value( 'email_html' );

		// 3 gold + 2 gray stars.
		$this->assertSame( 3, substr_count( $result, '#e6a117' ) );
		$this->assertSame( 2, substr_count( $result, '#cccccc' ) );
	}

	/**
	 * Test email_html renders dash for empty chips.
	 */
	public function test_email_html_select_empty() {
		$field  = new Feedback_Field( 'k', 'Label', '', 'select' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( '&mdash;', $result );
	}

	/**
	 * Test file field email rendering produces table layout with file name and size.
	 */
	public function test_file_field_renders_table_layout() {
		$value = array(
			'field_id' => 'abc123',
			'files'    => array(
				array(
					'file_id' => 123,
					'name'    => 'photo.png',
					'size'    => 2621440,
					'type'    => 'image/png',
				),
			),
		);

		$field  = new Feedback_Field( 'k', 'File upload', $value, 'file' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( 'photo.png', $result );
		$this->assertStringContainsString( size_format( 2621440 ), $result );
		$this->assertStringContainsString( '<table', $result );
	}

	/**
	 * Test file field email rendering works without field_id (computed fields path).
	 */
	public function test_file_field_renders_without_field_id() {
		$value = array(
			'files' => array(
				array(
					'file_id' => 123,
					'name'    => 'document.pdf',
					'size'    => 1048576,
					'type'    => 'application/pdf',
				),
			),
		);

		$field  = new Feedback_Field( 'k', 'File upload', $value, 'file' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( 'document.pdf', $result );
		$this->assertStringContainsString( '1 MB', $result );
		$this->assertStringContainsString( '<table', $result );
	}

	/**
	 * Test file field email rendering shows dash for empty files.
	 */
	public function test_file_field_renders_dash_when_empty() {
		$value = array(
			'field_id' => 'abc123',
			'files'    => array(),
		);

		$field  = new Feedback_Field( 'k', 'File upload', $value, 'file' );
		$result = $field->get_render_value( 'email_html' );

		$this->assertStringContainsString( '&mdash;', $result );
	}

	/**
	 * Test file field uses file-type icon URL for non-image files.
	 */
	public function test_file_field_uses_file_type_icon() {
		$value = array(
			'files' => array(
				array(
					'file_id' => 999,
					'name'    => 'report.pdf',
					'size'    => 500000,
					'type'    => 'application/pdf',
				),
			),
		);

		$field  = new Feedback_Field( 'k', 'File upload', $value, 'file' );
		$result = $field->get_render_value( 'email_html' );

		// Should use the pdf icon PNG from file-icons directory.
		$this->assertStringContainsString( 'file-icons/pdf@2x.png', $result );
	}

	/**
	 * Test file icon mapping by extension.
	 */
	public function test_file_icon_mapping_by_extension() {
		$method = self::invoke_feedback_field_method( 'get_file_icon_name', 'spreadsheet.xlsx', 'application/octet-stream' );
		$this->assertSame( 'xls', $method );

		$method = self::invoke_feedback_field_method( 'get_file_icon_name', 'slides.pptx', '' );
		$this->assertSame( 'ppt', $method );

		$method = self::invoke_feedback_field_method( 'get_file_icon_name', 'archive.zip', '' );
		$this->assertSame( 'zip', $method );
	}

	/**
	 * Test file icon mapping falls back to MIME type category.
	 */
	public function test_file_icon_mapping_by_mime_category() {
		$method = self::invoke_feedback_field_method( 'get_file_icon_name', 'clip.unknown', 'video/quicktime' );
		$this->assertSame( 'mp4', $method );

		$method = self::invoke_feedback_field_method( 'get_file_icon_name', 'song.unknown', 'audio/mpeg' );
		$this->assertSame( 'mp3', $method );
	}

	/**
	 * Test file icon mapping falls back to txt for unknown types.
	 */
	public function test_file_icon_mapping_unknown_falls_back_to_txt() {
		$method = self::invoke_feedback_field_method( 'get_file_icon_name', 'mystery.xyz', 'application/octet-stream' );
		$this->assertSame( 'txt', $method );
	}

	/**
	 * Test build_email_content with empty title does not render h1 tag.
	 */
	public function test_build_email_content_empty_title() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'Name'  => 'Test User',
				'Email' => 'test@example.com',
			),
			'Test message',
			'Test User'
		);

		$form     = new Contact_Form( array(), '' );
		$response = Feedback::get( $post_id );

		$context_data = array(
			'time'                 => current_time( 'mysql' ),
			'url'                  => 'https://example.com',
			'comment_author'       => 'Test User',
			'comment_author_email' => 'test@example.com',
			'comment_author_ip'    => '127.0.0.1',
			'is_spam'              => false,
			'feedback_status'      => 'publish',
		);

		add_filter( 'jetpack_forms_response_email_title', '__return_empty_string' );
		$result = Feedback_Email_Renderer::build_email_content( $post_id, $form, $response, $context_data );
		remove_filter( 'jetpack_forms_response_email_title', '__return_empty_string' );

		$this->assertStringNotContainsString( '<h1 class="email-header">', $result['message'] );
	}

	/**
	 * Test build_email_content with non-empty title renders h1 tag.
	 */
	public function test_build_email_content_with_title() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'Name'  => 'Test User',
				'Email' => 'test@example.com',
			),
			'Test message',
			'Test User'
		);

		$form     = new Contact_Form( array(), '' );
		$response = Feedback::get( $post_id );

		$context_data = array(
			'time'                 => current_time( 'mysql' ),
			'url'                  => 'https://example.com',
			'comment_author'       => 'Test User',
			'comment_author_email' => 'test@example.com',
			'comment_author_ip'    => '127.0.0.1',
			'is_spam'              => false,
			'feedback_status'      => 'publish',
		);

		add_filter(
			'jetpack_forms_response_email_title',
			function () {
				return 'Custom Email Title';
			}
		);
		$result = Feedback_Email_Renderer::build_email_content( $post_id, $form, $response, $context_data );
		remove_all_filters( 'jetpack_forms_response_email_title' );

		$this->assertStringContainsString( '<h1 class="email-header">Custom Email Title</h1>', $result['message'] );
	}

	/**
	 * Invoke a private static method on Feedback_Field via reflection.
	 *
	 * @param string $method_name The method name.
	 * @param mixed  ...$args     Arguments to pass to the method.
	 * @return mixed The method's return value.
	 */
	private static function invoke_feedback_field_method( $method_name, ...$args ) {
		$reflection = new \ReflectionClass( Feedback_Field::class );
		$method     = $reflection->getMethod( $method_name );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( null, ...$args );
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
