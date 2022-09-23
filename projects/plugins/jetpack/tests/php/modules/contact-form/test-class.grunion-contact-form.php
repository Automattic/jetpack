<?php
/**
 * Unit Tests for Grunion_Contact_Form.
 *
 * @package automattic/jetpack
 */

require_jetpack_file( 'modules/contact-form/grunion-contact-form.php' );

/**
 * Test class for Grunion_Contact_Form
 *
 * @covers Grunion_Contact_Form
 */
class WP_Test_Grunion_Contact_Form extends WP_UnitTestCase {

	/**
	 * Sets up the test environment before the class tests begin.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();
		define( 'DOING_AJAX', true ); // Defined so that 'exit' is not called in process_submission.

		// Remove any relevant filters that might exist before running the tests.
		remove_all_filters( 'grunion_still_email_spam' );
		remove_all_filters( 'jetpack_contact_form_is_spam' );
		remove_all_filters( 'wp_mail' );
	}

	/**
	 * Inserts globals needed to process contact form submits
	 */
	private function set_globals() {
		$_SERVER['REMOTE_ADDR']     = '127.0.0.1';
		$_SERVER['HTTP_USER_AGENT'] = 'unit-test';
		$_SERVER['HTTP_REFERER']    = 'test';
	}

	/**
	 * Sets up the test environment before each unit test.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_globals();

		$author_id = $this->factory->user->create(
			array(
				'user_email' => 'john@example.com',
			)
		);

		$post_id = $this->factory->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => (string) $author_id,
			)
		);

		global $post;
		$post = get_post( $post_id );

		// Place post_id to contact form id to make the form processable.
		$_POST['contact-form-id'] = $post_id;

		// Make the global post (used by contact forms) accessbile to tests.
		$this->post = $post;

		// Initialize plugin.
		$this->plugin = Grunion_Contact_Form_Plugin::init();
		// Call to add tokenization hook.
		$this->plugin->process_form_submission();
	}

	/**
	 * Tears down the test environment after each unit test.
	 */
	public function tear_down() {
		parent::tear_down();

		// Remove filters after running tests.
		remove_all_filters( 'wp_mail' );
		remove_all_filters( 'grunion_still_email_spam' );
		remove_all_filters( 'jetpack_contact_form_is_spam' );
	}

	/**
	 * Adds the field values to the global $_POST value.
	 *
	 * @param array $values Array of field key value pairs.
	 */
	private function add_field_values( $values ) {
		foreach ( $values as $key => $val ) {
			$_POST[ 'g' . $this->post->ID . '-' . $key ] = $val;
		}
	}

	/**
	 * Tests that the submission as a whole will produce something in the
	 * database when required information is provided.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_a_feedback_correctly_with_default_form() {
		$form   = new Grunion_Contact_Form( array() );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 1, $feedback, 'There should be one feedback after process_submission' );

		// Default metadata should be saved.
		$submission = $feedback[0];
		$email      = get_post_meta( $submission->ID, '_feedback_email', true );
		$this->assertEquals( 'john <john@example.com>', $email['to'][0] );
		$this->assertStringContainsString( 'IP Address: 127.0.0.1', $email['message'] );
	}

	/**
	 * Tests that the submission as a whole will produce something in the
	 * database when some labels are provided.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_extra_field_metadata() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form   = new Grunion_Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 1, $feedback, 'There should be one feedback after process_submission' );

		// Default metadata should be saved.
		$submission   = $feedback[0];
		$extra_fields = get_post_meta( $submission->ID, '_feedback_extra_fields', true );

		$this->assertCount( 3, $extra_fields, 'There should be exactly three extra fields when one of the fields is name, and the others are an extra dropdown, radio button field and text field' );

		/*
		 * Metadata starts counting from 5, because post content has:
		 *   1_Name
		 *   2_Dropdown
		 *   3_Radio
		 *   4_Text
		 */
		$this->assertEquals( 'First option', $extra_fields['5_Dropdown'], 'When the first option of a dropdown field with label Dropdown is selected, there should be metadata with that key and value' );
		$this->assertEquals( 'Second option', $extra_fields['6_Radio'], 'When the first option of a radio button field with label Radio is selected, there should be metadata with that key and value' );
		$this->assertEquals( 'Texty text', $extra_fields['7_Text'], 'When the text field with label Text is filled with the text \'Texty text\', there should be metadata with that key and value' );
	}

	/**
	 * Tests that the submission will store the subject when specified.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_subject_when_specified() {
		$form   = new Grunion_Contact_Form( array( 'subject' => 'I\'m sorry, but the party\'s over' ) ); // Default form.
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 1, $feedback, 'There should be one feedback after process_submission' );

		// Default metadata should be saved.
		$submission = $feedback[0];

		$this->assertStringContainsString( 'SUBJECT: I\'m sorry, but the party\'s over', $submission->post_content, 'The stored subject didn\'t match the given' );
	}

	/**
	 * Tests that the submission will store the subject with tokens replace using the name and text fields.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_subject_with_token_replaced_from_name_and_text_field() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'state' => 'Kansas',
			)
		);

		$form = new Grunion_Contact_Form( array( 'subject' => 'Hello {name} from {state}!' ), "[contact-field label='Name' type='name' required='1'/][contact-field label='State' type='text'/]" );

		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 1, $feedback, 'There should be one feedback after process_submission' );

		// Default metadata should be saved.
		$submission = $feedback[0];

		$this->assertStringContainsString( 'SUBJECT: Hello John Doe from Kansas!', $submission->post_content, 'The stored subject didn\'t match the given' );
	}

	/**
	 * Tests that the submission will store the subject with a token replaced using the radio button field.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_subject_with_token_replaced_from_radio_button_field() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'state' => 'Kansas',
			)
		);

		$form   = new Grunion_Contact_Form( array( 'subject' => 'Hello {name} from {state}!' ), "[contact-field label='Name' type='name' required='1'/][contact-field label='State' type='radio' options='Kansas,California'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 1, $feedback, 'There should be one feedback after process_submission' );

		// Default metadata should be saved.
		$submission = $feedback[0];

		$this->assertStringContainsString( 'SUBJECT: Hello John Doe from Kansas!', $submission->post_content, 'The stored subject didn\'t match the given' );
	}

	/**
	 * Tests that the submission will store the subject with a token replaced using the dropdown field.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_subject_with_token_replaced_from_dropdown_field() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'state' => 'Kansas',
			)
		);

		$form   = new Grunion_Contact_Form( array( 'subject' => 'Hello {name} from {state}!' ), "[contact-field label='Name' type='name' required='1'/][contact-field label='State' type='select' options='Kansas,California'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 1, $feedback, 'There should be one feedback after process_submission' );

		// Default metadata should be saved.
		$submission = $feedback[0];

		$this->assertStringContainsString( 'SUBJECT: Hello John Doe from Kansas!', $submission->post_content, 'The stored subject didn\'t match the given' );
	}

	/**
	 * Tests the form submission will store the fields and their values in the post content.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_fields_and_their_values_to_post_content() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form   = new Grunion_Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 1, $feedback, 'There should be one feedback after process_submission' );

		// Default metadata should be saved.
		$submission = $feedback[0];

		$this->assertStringContainsString( '[1_Name] =&gt; John Doe', $submission->post_content, 'Post content did not contain the name label and/or value' );
		$this->assertStringContainsString( '[2_Dropdown] =&gt; First option', $submission->post_content, 'Post content did not contain the dropdown label and/or value' );
		$this->assertStringContainsString( '[3_Radio] =&gt; Second option', $submission->post_content, 'Post content did not contain the radio button label and/or value' );
		$this->assertStringContainsString( '[4_Text] =&gt; Texty text', $submission->post_content, 'Post content did not contain the text field label and/or value' );
	}

	/**
	 * Tests that the form submission will store the fields and their value in the email meta.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_fields_and_their_values_to_email_meta() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form   = new Grunion_Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 1, $feedback, 'There should be one feedback after process_submission' );

		// Default metadata should be saved.
		$submission = $feedback[0];
		$email      = get_post_meta( $submission->ID, '_feedback_email', true );

		$expected  = '<b>Name:</b> John Doe<br /><br />';
		$expected .= '<b>Dropdown:</b> First option<br /><br />';
		$expected .= '<b>Radio:</b> Second option<br /><br />';
		$expected .= '<b>Text:</b> Texty text<br /><br />';

		$email_body = explode( PHP_EOL . PHP_EOL, $email['message'] );

		$email_body = $email_body[1];

		$this->assertStringStartsWith( $expected, $email_body );
	}

	/**
	 * Tests that the form subussion sends the correct single email.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_sends_correct_single_email() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		add_filter( 'wp_mail', array( $this, 'pre_test_process_submission_sends_correct_single_email' ) );

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form   = new Grunion_Contact_Form(
			array(
				'to'      => 'john <john@example.com>',
				'subject' => 'Hello there!',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]"
		);
		$result = $form->process_submission();
		$this->assertNotNull( $result );
	}

	/**
	 * This method is hooked to the wp-mail filter.
	 *
	 * @param array $args A compacted array of wp_mail() arguments, including the "to" email,
	 *                    subject, message, headers, and attachments values.
	 */
	public function pre_test_process_submission_sends_correct_single_email( $args ) {
		$this->assertContains( 'john <john@example.com>', $args['to'] );
		$this->assertEquals( 'Hello there!', $args['subject'] );

		$expected  = '<b>Name:</b> John Doe<br /><br />';
		$expected .= '<b>Dropdown:</b> First option<br /><br />';
		$expected .= '<b>Radio:</b> Second option<br /><br />';
		$expected .= '<b>Text:</b> Texty text<br /><br />';

		// Divides email by the first empty line.
		$email_body = explode( PHP_EOL . PHP_EOL, $args['message'] );
		$email_body = $email_body[1];

		$this->assertStringStartsWith( $expected, $email_body );
	}

	/**
	 * Tests that the form subussion sends the correct multiple emails.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_sends_correct_multiple_email() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		add_filter( 'wp_mail', array( $this, 'pre_test_process_submission_sends_correct_multiple_email' ) );

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form = new Grunion_Contact_Form(
			array(
				'to'      => 'john@example.com, jane@example.com',
				'subject' => 'Hello there!',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]"
		);

		$result = $form->process_submission();
		$this->assertNotNull( $result );
	}

	/**
	 * This method is hooked to the wp-mail filter.
	 *
	 * @param array $args A compacted array of wp_mail() arguments, including the "to" email,
	 *                    subject, message, headers, and attachments values.
	 */
	public function pre_test_process_submission_sends_correct_multiple_email( $args ) {
		$this->assertEquals( array( 'john <john@example.com>', 'jane <jane@example.com>' ), $args['to'] );
	}

	/**
	 * Tests that the form submission fails when spam is marked with a WP_Error object.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_fails_if_spam_marked_with_WP_Error() {
		add_filter( 'jetpack_contact_form_is_spam', array( $this, 'pre_test_process_submission_fails_if_spam_marked_with_WP_Error' ), 11 ); // Run after akismet filter.

		$form   = new Grunion_Contact_Form( array() );
		$result = $form->process_submission();

		$this->assertInstanceOf( 'WP_Error', $result, 'When $is_spam contains a WP_Error, the result of process_submission should be a WP_Error' );
		$this->assertEquals( 'Message is spam', $result->get_error_message() );
	}

	/**
	 * This method is hooked to the jetpack_contact_form_is_spam filter.
	 */
	public function pre_test_process_submission_fails_if_spam_marked_with_WP_Error() {
		return new WP_Error( 'spam', 'Message is spam' );
	}

	/**
	 * Tests that the form submission won't send if the submission is marked as spam.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_wont_send_spam_if_marked_as_spam_with_true() {
		add_filter( 'jetpack_contact_form_is_spam', '__return_true', 11 ); // Run after akismet filter.

		add_filter( 'wp_mail', array( $this, 'pre_test_process_submission_wont_send_spam_if_marked_as_spam_with_true' ) );

		$form   = new Grunion_Contact_Form( array( 'to' => 'john@example.com' ) );
		$result = $form->process_submission();
		$this->assertNotNull( $result );
	}

	/**
	 * This method is hooked to the wp-mail filter, and the test will fail if this method is called.
	 */
	public function pre_test_process_submission_wont_send_spam_if_marked_as_spam_with_true() {
		$this->assertTrue( false ); // Fail if trying to send.
	}

	/**
	 * Tests that the email subject is labeled with Spam when the submission is spam and the filter to send spam is set to true.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_labels_message_as_spam_in_subject_if_marked_as_spam_with_true_and_sending_spam() {
		add_filter( 'jetpack_contact_form_is_spam', '__return_true', 11 ); // Run after akismet filter.

		add_filter( 'grunion_still_email_spam', '__return_true' );

		add_filter( 'wp_mail', array( $this, 'pre_test_process_submission_labels_message_as_spam_in_subject_if_marked_as_spam_with_true_and_sending_spam' ) );

		$form   = new Grunion_Contact_Form( array( 'to' => 'john@example.com' ) );
		$result = $form->process_submission();
		$this->assertNotNull( $result );
	}

	/**
	 * This method is hooked to the wp-mail filter.
	 *
	 * @param array $args A compacted array of wp_mail() arguments, including the "to" email,
	 *                    subject, message, headers, and attachments values.
	 */
	public function pre_test_process_submission_labels_message_as_spam_in_subject_if_marked_as_spam_with_true_and_sending_spam( $args ) {
		$this->assertStringContainsString( '***SPAM***', $args['subject'] );
	}

	/**
	 * Tests that 'grunion_delete_old_spam()' deletes an old post that is marked as spam.
	 *
	 * @author tonykova
	 * @covers ::grunion_delete_old_spam
	 */
	public function test_grunion_delete_old_spam_deletes_an_old_post_marked_as_spam() {
		$post_id = $this->factory->post->create(
			array(
				'post_type'     => 'feedback',
				'post_status'   => 'spam',
				'post_date_gmt' => '1987-01-01 12:00:00',
			)
		);

		grunion_delete_old_spam();
		$this->assertNull( get_post( $post_id ), 'An old spam feedback should be deleted' );
	}

	/**
	 * Tests that 'grunion_delete_old_spam' does not delete a new post that is marked as spam.
	 *
	 * @author tonykova
	 * @covers ::grunion_delete_old_spam
	 */
	public function test_grunion_delete_old_spam_does_not_delete_a_new_post_marked_as_spam() {
		$post_id = $this->factory->post->create(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'spam',
			)
		);

		grunion_delete_old_spam();
		$this->assertEquals( $post_id, get_post( $post_id )->ID, 'A new spam feedback should be left intact when deleting old spam' );
	}

	/**
	 * Tests that token is left intact when there is not matching field.
	 *
	 * @author tonykova
	 * @covers Grunion_Contact_Form_Plugin
	 */
	public function test_token_left_intact_when_no_matching_field() {
		$plugin       = Grunion_Contact_Form_Plugin::init();
		$subject      = 'Hello {name}!';
		$field_values = array(
			'City' => 'Chicago',
		);

		$this->assertEquals( 'Hello {name}!', $plugin->replace_tokens_with_input( $subject, $field_values ) );
	}

	/**
	 * Tests that token is replaced with an empty string when there is not value in field.
	 *
	 * @author tonykova
	 * @covers Grunion_Contact_Form_Plugin
	 */
	public function test_replaced_with_empty_string_when_no_value_in_field() {
		$plugin       = Grunion_Contact_Form_Plugin::init();
		$subject      = 'Hello {name}!';
		$field_values = array(
			'Name' => null,
		);

		$this->assertEquals( 'Hello !', $plugin->replace_tokens_with_input( $subject, $field_values ) );
	}

	/**
	 * Tests that token in curly brackets is replaced with the value when the name has whitespace.
	 *
	 * @author tonykova
	 * @covers Grunion_Contact_Form_Plugin
	 */
	public function test_token_can_replace_entire_subject_with_token_field_whose_name_has_whitespace() {
		$plugin       = Grunion_Contact_Form_Plugin::init();
		$subject      = '{subject token}';
		$field_values = array(
			'Subject Token' => 'Chicago',
		);

		$this->assertEquals( 'Chicago', $plugin->replace_tokens_with_input( $subject, $field_values ) );
	}

	/**
	 * Tests that token with curly brackets is replaced with value.
	 *
	 * @author tonykova
	 * @covers Grunion_Contact_Form_Plugin
	 */
	public function test_token_with_curly_brackets_can_be_replaced() {
		$plugin       = Grunion_Contact_Form_Plugin::init();
		$subject      = '{subject {token}}';
		$field_values = array(
			'Subject {Token}' => 'Chicago',
		);

		$this->assertEquals( 'Chicago', $plugin->replace_tokens_with_input( $subject, $field_values ) );
	}

	/**
	 * Tests that the field attributes remain the same when no escaping is necessary.
	 *
	 * @author tonykova
	 */
	public function test_parse_contact_field_keeps_string_unchanged_when_no_escaping_necesssary() {
		add_shortcode( 'contact-field', array( 'Grunion_Contact_Form', 'parse_contact_field' ) );

		// @phpcs:ignore Squiz.Strings.DoubleQuoteUsage.NotRequired
		$shortcode = "[contact-field label=\"Name\" type=\"name\" required=\"1\"/][contact-field label=\"Email\" type=\"email\" required=\"1\"/][contact-field label=\"asdasd\" type=\"text\"/][contact-field id=\"1\" required derp herp asd lkj]adsasd[/contact-field]";
		$html      = do_shortcode( $shortcode );

		$this->assertEquals( $shortcode, $html );
	}

	/**
	 * Tests that the default label is added when no label is present.
	 */
	public function test_make_sure_that_we_add_default_label_when_non_is_present() {
		add_shortcode( 'contact-field', array( 'Grunion_Contact_Form', 'parse_contact_field' ) );
		$shortcode = "[contact-field type='name' required='1' /]";
		$html      = do_shortcode( $shortcode );
		// @phpcs:ignore Squiz.Strings.DoubleQuoteUsage.NotRequired
		$this->assertEquals( "[contact-field type=\"name\" required=\"1\" label=\"Name\"/]", $html );
	}

	/**
	 * Tests the empty options are removed from form fields.
	 */
	public function test_make_sure_that_we_remove_empty_options_from_form_field() {
		add_shortcode( 'contact-field', array( 'Grunion_Contact_Form', 'parse_contact_field' ) );
		$shortcode = "[contact-field type='select' required='1' options='fun,,run' label='fun times' values='go,,have some fun'/]";
		$html      = do_shortcode( $shortcode );
		// @phpcs:ignore Squiz.Strings.DoubleQuoteUsage.NotRequired
		$this->assertEquals( "[contact-field type=\"select\" required=\"1\" options=\"fun,run\" label=\"fun times\" values=\"go,have some fun\"/]", $html );
	}

	/**
	 * Tests shortcode with commas and brackets.
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_array_values_with_commas_and_brackets() {
		add_shortcode( 'contact-field', array( 'Grunion_Contact_Form', 'parse_contact_field' ) );
		$shortcode = "[contact-field type='radio' options='\"foo\",bar&#044; baz,&#091;b&#092;rackets&#093;' label='fun &#093;&#091; times'/]";
		$html      = do_shortcode( $shortcode );
		$this->assertEquals( '[contact-field type="radio" options="&quot;foo&quot;,bar&#044; baz,&#091;b&#092;rackets&#093;" label="fun &#093;&#091; times"/]', $html );
	}

	/**
	 * Tests Gutenblock input with commas and brackets.
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_array_values_with_commas_and_brackets_from_gutenblock() {
		$attr = array(
			'type'    => 'radio',
			'options' => array( '"foo"', 'bar, baz', '[b\\rackets]' ),
			'label'   => 'fun ][ times',
		);
		$html = Grunion_Contact_Form_Plugin::gutenblock_render_field_radio( $attr, '' );
		$this->assertEquals( '[contact-field type="radio" options="&quot;foo&quot;,bar&#044; baz,&#091;b&#092;rackets&#093;" label="fun &#093;&#091; times"/]', $html );
	}

	/**
	 * Test for text field_renders
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_make_sure_text_field_renders_as_expected() {
		$attributes = array(
			'label'       => 'fun',
			'type'        => 'text',
			'class'       => 'lalala',
			'default'     => 'foo',
			'placeholder' => 'PLACEHOLDTHIS!',
			'id'          => 'funID',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'text' ) );
		$this->assertValidField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for email field_renders
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_make_sure_email_field_renders_as_expected() {
		$attributes = array(
			'label'       => 'fun',
			'type'        => 'email',
			'class'       => 'lalala',
			'default'     => 'foo',
			'placeholder' => 'PLACEHOLDTHIS!',
			'id'          => 'funID',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'email' ) );
		$this->assertValidField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for url field_renders
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_make_sure_url_field_renders_as_expected() {
		$attributes = array(
			'label'       => 'fun',
			'type'        => 'url',
			'class'       => 'lalala',
			'default'     => 'foo',
			'placeholder' => 'PLACEHOLDTHIS!',
			'id'          => 'funID',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'url' ) );
		$this->assertValidField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for telephone field_renders
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_make_sure_telephone_field_renders_as_expected() {
		$attributes = array(
			'label'       => 'fun',
			'type'        => 'telephone',
			'class'       => 'lalala',
			'default'     => 'foo',
			'placeholder' => 'PLACEHOLDTHIS!',
			'id'          => 'funID',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'tel' ) );
		$this->assertValidField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for date field_renders
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_make_sure_date_field_renders_as_expected() {
		$attributes = array(
			'label'       => 'fun',
			'type'        => 'date',
			'class'       => 'lalala',
			'default'     => 'foo',
			'placeholder' => 'PLACEHOLDTHIS!',
			'id'          => 'funID',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'text' ) );
		$this->assertValidField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for textarea field_renders
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_make_sure_textarea_field_renders_as_expected() {
		$attributes = array(
			'label'       => 'fun',
			'type'        => 'textarea',
			'class'       => 'lalala',
			'default'     => 'foo',
			'placeholder' => 'PLACEHOLDTHIS!',
			'id'          => 'funID',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'textarea' ) );
		$this->assertValidField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for checkbox field_renders
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_make_sure_checkbox_field_renders_as_expected() {
		$attributes = array(
			'label'       => 'fun',
			'type'        => 'checkbox',
			'class'       => 'lalala',
			'default'     => 'foo',
			'placeholder' => 'PLACEHOLDTHIS!',
			'id'          => 'funID',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'checkbox' ) );
		$this->assertValidCheckboxField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Multiple fields
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_make_sure_checkbox_multiple_field_renders_as_expected() {
		$attributes = array(
			'label'   => 'fun',
			'type'    => 'checkbox-multiple',
			'class'   => 'lalala',
			'default' => 'option 1',
			'id'      => 'funID',
			'options' => array( 'option 1', 'option 2' ),
			'values'  => array( 'option 1', 'option 2' ),
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'checkbox' ) );
		$this->assertValidFieldMultiField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for radio field_renders
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_make_sure_radio_field_renders_as_expected() {
		$attributes = array(
			'label'   => 'fun',
			'type'    => 'radio',
			'class'   => 'lalala',
			'default' => 'option 1',
			'id'      => 'funID',
			'options' => array( 'option 1', 'option 2', 'option 3, or 4', 'back\\slash' ),
			'values'  => array( 'option 1', 'option 2', 'option [34]', '\\' ),
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'radio' ) );
		$this->assertValidFieldMultiField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for select field_renders
	 *
	 * @covers Grunion_Contact_Form_Field
	 */
	public function test_make_sure_select_field_renders_as_expected() {
		$attributes = array(
			'label'   => 'fun',
			'type'    => 'select',
			'class'   => 'lalala',
			'default' => 'option 1',
			'id'      => 'funID',
			'options' => array( 'option 1', 'option 2', 'option 3, or 4', 'back\\slash' ),
			'values'  => array( 'option 1', 'option 2', 'option [34]', '\\' ),
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'select' ) );
		$this->assertValidFieldMultiField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Renders a Grunion_Contact_Form_Field.
	 *
	 * @param array $attributes An associative array of shortcode attributes.
	 *
	 * @return string The field html string.
	 */
	public function render_field( $attributes ) {
		$form  = new Grunion_Contact_Form( array() );
		$field = new Grunion_Contact_Form_Field( $attributes, '', $form );
		return $field->render();
	}

	/**
	 * Gets the first div in the input html.
	 *
	 * @param string $html The html string.
	 *
	 * @return DOMElement The first div element.
	 */
	public function getCommonDiv( $html ) {
		$doc = new DOMDocument();
		$doc->loadHTML( $html );
		return $this->getFirstElement( $doc, 'div' );
	}

	/**
	 * Gets the first element in the given DOMDocument object.
	 *
	 * @param DOMDocument $dom The DOMDocument object.
	 * @param string      $tag The tag name.
	 * @param int         $index The index.
	 *
	 * @return DOMElement The first element with the given tag.
	 */
	public function getFirstElement( $dom, $tag, $index = 0 ) {
		$elements = $dom->getElementsByTagName( $tag );
		return $elements->item( $index );
	}

	/**
	 * Tests whether the class attribute in the wrapper div matches the field's class attribute value.
	 *
	 * @param DOMElement $wrapper_div The wrapper div.
	 * @param array      $attributes An associative array containing the field's attributes.
	 */
	public function assertCommonValidHtml( $wrapper_div, $attributes ) {
		if ( 'date' === $attributes['type'] ) {
			$attributes['class'] = 'jp-contact-form-date';
		}
		$this->assertEquals(
			$wrapper_div->getAttribute( 'class' ),
			"grunion-field-wrap grunion-field-{$attributes['type']}-wrap {$attributes['class']}-wrap",
			'div class attribute doesn\'t match'
		);

		// Get label.
		$label = $this->getFirstElement( $wrapper_div, 'label' );

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$this->assertEquals( trim( $label->nodeValue ), $attributes['label'], 'Label is not what we expect it to be...' );
	}

	/**
	 * Tests whether a field is valid.
	 *
	 * @param string $html The html string.
	 * @param array  $attributes An associative array containing the field's attributes.
	 */
	public function assertValidField( $html, $attributes ) {

		$wrapper_div = $this->getCommonDiv( $html );
		$this->assertCommonValidHtml( $wrapper_div, $attributes );

		// Get label.
		$label = $this->getFirstElement( $wrapper_div, 'label' );

		// Input.
		$input = (
			'textarea' === $attributes['type']
			? $this->getFirstElement( $wrapper_div, 'textarea' )
			: $this->getFirstElement( $wrapper_div, 'input' )
		);

		// Label matches for matches input ID.
		$this->assertEquals(
			$label->getAttribute( 'for' ),
			$input->getAttribute( 'id' ),
			'label for does not equal input ID!'
		);

		$this->assertEquals( $input->getAttribute( 'placeholder' ), $attributes['placeholder'], 'Placeholder doesn\'t match' );
		if ( 'textarea' === $attributes['type'] ) {
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$this->assertEquals( $input->nodeValue, $attributes['default'], 'value and default doesn\'t match' );
			$this->assertEquals(
				$label->getAttribute( 'for' ),
				'contact-form-comment-' . $input->getAttribute( 'name' ),
				'label for doesn\'t match the input name'
			);
		} else {
			$this->assertEquals( $input->getAttribute( 'type' ), $attributes['input_type'], 'Type doesn\'t match' );
			$this->assertEquals( $input->getAttribute( 'value' ), $attributes['default'], 'value and default doesn\'t match' );
			// Label matches for matches input name.
			$this->assertEquals(
				$label->getAttribute( 'for' ),
				$input->getAttribute( 'name' ),
				'label for doesn\'t match the input name'
			);
		}

		if ( 'date' === $attributes['type'] ) {
			$this->assertEquals(
				$input->getAttribute( 'class' ),
				"{$attributes['type']} jp-contact-form-date",
				'input class attribute doesn\'t match'
			);
		} else {
			$this->assertEquals(
				$input->getAttribute( 'class' ),
				"{$attributes['type']} {$attributes['class']}",
				'input class attribute doesn\'t match'
			);
		}
	}

	/**
	 * Tests whether a checkbox field is valid.
	 *
	 * @param string $html The html string.
	 * @param array  $attributes An associative array containing the field's attributes.
	 */
	public function assertValidCheckboxField( $html, $attributes ) {

		$wrapper_div = $this->getCommonDiv( $html );
		$this->assertCommonValidHtml( $wrapper_div, $attributes );

		$label = $this->getFirstElement( $wrapper_div, 'label' );
		$input = $this->getFirstElement( $label, 'input' );

		$this->assertEquals( $label->getAttribute( 'class' ), 'grunion-field-label ' . $attributes['type'], 'label class doesn\'t match' );

		$this->assertEquals( $input->getAttribute( 'name' ), $attributes['id'], 'Input name doesn\'t match' );
		$this->assertEquals( 'Yes', $input->getAttribute( 'value' ), 'Input value doesn\'t match' );
		$this->assertEquals( $input->getAttribute( 'type' ), $attributes['type'], 'Input type doesn\'t match' );
		if ( $attributes['default'] ) {
			$this->assertEquals( 'checked', $input->getAttribute( 'checked' ), 'Input checked doesn\'t match' );
		}

		$this->assertEquals( $input->getAttribute( 'class' ), $attributes['type'] . ' ' . $attributes['class'], 'Input class doesn\'t match' );
	}

	/**
	 * Tests whether a multifield contact form field is valid.
	 *
	 * @param string $html The html string.
	 * @param array  $attributes An associative array containing the field's attributes.
	 */
	public function assertValidFieldMultiField( $html, $attributes ) {

		$wrapper_div = $this->getCommonDiv( $html );
		$this->assertCommonValidHtml( $wrapper_div, $attributes );

		// Get label.
		$label = $this->getFirstElement( $wrapper_div, 'label' );

		// Inputs.
		if ( 'select' === $attributes['type'] ) {
			$this->assertEquals( 'grunion-field-label select', $label->getAttribute( 'class' ), 'label class doesn\'t match' );

			$select = $this->getFirstElement( $wrapper_div, 'select' );
			$this->assertEquals(
				$label->getAttribute( 'for' ),
				$select->getAttribute( 'id' ),
				'label for does not equal input ID!'
			);

			$this->assertEquals(
				$label->getAttribute( 'for' ),
				$select->getAttribute( 'name' ),
				'label for does not equal input name!'
			);

			$this->assertEquals( $select->getAttribute( 'class' ), 'select ' . $attributes['class'], ' select class does not match expected' );

			// Options.
			$options = $select->getElementsByTagName( 'option' );
			$n       = $options->length;
			$this->assertCount( $n, $attributes['options'], 'Number of inputs doesn\'t match number of options' );
			$this->assertCount( $n, $attributes['values'], 'Number of inputs doesn\'t match number of values' );
			for ( $i = 0; $i < $n; $i++ ) {
				$option = $options->item( $i );
				$this->assertEquals( $option->getAttribute( 'value' ), $attributes['values'][ $i ], 'Input value doesn\'t match' );
				if ( 0 === $i ) {
					$this->assertEquals( 'selected', $option->getAttribute( 'selected' ), 'Input is not selected' );
				} else {
					$this->assertNotEquals( $option->getAttribute( 'selected' ), 'selected', 'Input is selected' );
				}
				//phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$this->assertEquals( $option->nodeValue, $attributes['options'][ $i ], 'Input does not match the option' );
			}
		} else {
			$this->assertEquals( 'grunion-field-label', $label->getAttribute( 'class' ), 'label class doesn\'t match' );
			// Radio and Checkboxes.
			$labels = $wrapper_div->getElementsByTagName( 'label' );
			$n      = $labels->length - 1;
			$this->assertCount( $n, $attributes['options'], 'Number of inputs doesn\'t match number of options' );
			$this->assertCount( $n, $attributes['values'], 'Number of inputs doesn\'t match number of values' );
			for ( $i = 0; $i < $n; $i++ ) {
				$item_label = $labels->item( $i + 1 );
				//phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$this->assertEquals( $item_label->nodeValue, ' ' . $attributes['options'][ $i ] ); // extra space added for a padding.

				$input = $this->getFirstElement( $item_label, 'input' );
				$this->assertEquals( $input->getAttribute( 'type' ), $attributes['input_type'], 'Type doesn\'t match' );
				if ( 'radio' === $attributes['input_type'] ) {
					$this->assertEquals( $input->getAttribute( 'name' ), $attributes['id'], 'Input name doesn\'t match' );
				} else {
					$this->assertEquals( $input->getAttribute( 'name' ), $attributes['id'] . '[]', 'Input name doesn\'t match' );
				}
				$this->assertEquals( $input->getAttribute( 'value' ), $attributes['values'][ $i ], 'Input value doesn\'t match' );
				$this->assertEquals( $input->getAttribute( 'class' ), $attributes['type'] . ' ' . $attributes['class'], 'Input class doesn\'t match' );
				if ( 0 === $i ) {
					$this->assertEquals( 'checked', $input->getAttribute( 'checked' ), 'Input checked doesn\'t match' );
				} else {
					$this->assertNotEquals( $input->getAttribute( 'checked' ), 'checked', 'Input checked doesn\'t match' );
				}
			}
		}
	}

	/**
	 * Tests that the form attributes and values are properly escaped.
	 *
	 * @author tonykova
	 */
	public function test_parse_contact_field_escapes_things_inside_a_value_and_attribute_and_the_content() {
		add_shortcode( 'contact-field', array( 'Grunion_Contact_Form', 'parse_contact_field' ) );

		$shortcode = "[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type=''email'' req'uired='1'/][contact-field label='asdasd' type='text'/][contact-field id='1' required 'derp' herp asd lkj]adsasd[/contact-field]";
		$html      = do_shortcode( $shortcode );

		/*
		 * The expected string has some quotes escaped, since we want to make
		 * sure we don't output anything harmful
		 */
		$this->assertEquals( '[contact-field label="Name" type="name" required="1"/][contact-field label="Email" type=&#039;&#039;email&#039;&#039; req&#039;uired=&#039;1&#039;/][contact-field label="asdasd" type="text"/][contact-field id="1" required derp herp asd lkj]adsasd[/contact-field]', $html );
	}

	/**
	 * Test get_export_data_for_posts with fully vaid data input.
	 *
	 * @covers Grunion_Contact_Form_Plugin
	 * @group csvexport
	 */
	public function test_get_export_data_for_posts_fully_valid_data() {
		/**
		 * Grunion_Contact_Form_Plugin mock object.
		 *
		 * @var Grunion_Contact_Form_Plugin $mock
		 */
		$mock = $this->getMockBuilder( 'Grunion_Contact_Form_Plugin' )
			->setMethods(
				array(
					'get_post_meta_for_csv_export',
					'get_parsed_field_contents_of_post',
					'get_post_content_for_csv_export',
					'map_parsed_field_contents_of_post_to_field_names',
				)
			)
			->disableOriginalConstructor()
			->getMock();

		$get_post_meta_for_csv_export_map = array(
			array(
				15,
				array(
					'key1' => 'value1',
					'key2' => 'value2',
					'key3' => 'value3',
					'key4' => 'value4',

				),
			),
			array(
				16,
				array(
					'key3' => 'value3',
					'key4' => 'value4',
					'key5' => 'value5',
					'key6' => 'value6',
				),
			),
		);

		$get_parsed_field_contents_of_post_map = array(
			array( 15, array( '_feedback_subject' => 'subj1' ) ),
			array( 16, array( '_feedback_subject' => 'subj2' ) ),
		);

		$get_post_content_for_csv_export_map = array(
			array( 15, 'This is my test 15' ),
			array( 16, 'This is my test 16' ),
		);

		$mapped_fields_contents_map = array(
			array(
				array(
					'_feedback_subject'      => 'subj1',
					'_feedback_main_comment' => 'This is my test 15',
				),
				array(
					'Contact Form' => 'subj1',
					'4_Comment'    => 'This is my test 15',
				),
			),
			array(
				array(
					'_feedback_subject'      => 'subj2',
					'_feedback_main_comment' => 'This is my test 16',
				),
				array(
					'Contact Form' => 'subj2',
					'4_Comment'    => 'This is my test 16',
				),
			),
		);

		$mock->expects( $this->exactly( 2 ) )
			->method( 'get_post_meta_for_csv_export' )
			->will( $this->returnValueMap( $get_post_meta_for_csv_export_map ) );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'get_parsed_field_contents_of_post' )
			->will( $this->returnValueMap( $get_parsed_field_contents_of_post_map ) );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'get_post_content_for_csv_export' )
			->will( $this->returnValueMap( $get_post_content_for_csv_export_map ) );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'map_parsed_field_contents_of_post_to_field_names' )
			->will( $this->returnValueMap( $mapped_fields_contents_map ) );

		$result = $mock->get_export_data_for_posts( array( 15, 16 ) );

		$expected_result = array(
			'Contact Form' => array( 'subj1', 'subj2' ),
			'key1'         => array( 'value1', '' ),
			'key2'         => array( 'value2', '' ),
			'key3'         => array( 'value3', 'value3' ),
			'key4'         => array( 'value4', 'value4' ),
			'key5'         => array( '', 'value5' ),
			'key6'         => array( '', 'value6' ),
			'4_Comment'    => array( 'This is my test 15', 'This is my test 16' ),
		);

		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test get_export_data_for_posts with single invalid entry for post meta
	 *
	 * @covers Grunion_Contact_Form_Plugin
	 * @group csvexport
	 */
	public function test_get_export_data_for_posts_invalid_single_entry_meta() {
		/**
		 * Grunion_Contact_Form_Plugin mock object.
		 *
		 * @var Grunion_Contact_Form_Plugin $mock
		 * */
		$mock = $this->getMockBuilder( 'Grunion_Contact_Form_Plugin' )
			->setMethods(
				array(
					'get_post_meta_for_csv_export',
					'get_parsed_field_contents_of_post',
					'get_post_content_for_csv_export',
					'map_parsed_field_contents_of_post_to_field_names',
				)
			)
			->disableOriginalConstructor()
			->getMock();

		$get_post_meta_for_csv_export_map = array(
			array( 15, null ),
			array(
				16,
				array(
					'key3' => 'value3',
					'key4' => 'value4',
					'key5' => 'value5',
					'key6' => 'value6',
				),
			),
		);

		$get_parsed_field_contents_of_post_map = array(
			array( 15, array( '_feedback_subject' => 'subj1' ) ),
			array( 16, array( '_feedback_subject' => 'subj2' ) ),
		);

		$get_post_content_for_csv_export_map = array(
			array( 15, 'This is my test 15' ),
			array( 16, 'This is my test 16' ),
		);

		$mapped_fields_contents_map = array(
			array(
				array(
					'_feedback_subject'      => 'subj1',
					'_feedback_main_comment' => 'This is my test 15',
				),
				array(
					'Contact Form' => 'subj1',
					'4_Comment'    => 'This is my test 15',
				),
			),
			array(
				array(
					'_feedback_subject'      => 'subj2',
					'_feedback_main_comment' => 'This is my test 16',
				),
				array(
					'Contact Form' => 'subj2',
					'4_Comment'    => 'This is my test 16',
				),
			),
		);

		// Even though there is no post meta for the first, we don't stop the cycle
		// and each mock expects two calls.
		$mock->expects( $this->exactly( 2 ) )
			->method( 'get_post_meta_for_csv_export' )
			->will( $this->returnValueMap( $get_post_meta_for_csv_export_map ) );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'get_parsed_field_contents_of_post' )
			->will( $this->returnValueMap( $get_parsed_field_contents_of_post_map ) );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'get_post_content_for_csv_export' )
			->will( $this->returnValueMap( $get_post_content_for_csv_export_map ) );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'map_parsed_field_contents_of_post_to_field_names' )
			->will( $this->returnValueMap( $mapped_fields_contents_map ) );

		$result = $mock->get_export_data_for_posts( array( 15, 16 ) );

		$expected_result = array(
			'Contact Form' => array( 'subj1', 'subj2' ),
			'key3'         => array( '', 'value3' ),
			'key4'         => array( '', 'value4' ),
			'key5'         => array( '', 'value5' ),
			'key6'         => array( '', 'value6' ),
			'4_Comment'    => array( 'This is my test 15', 'This is my test 16' ),
		);

		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test get_export_data_for_posts with invalid all entries for post meta
	 *
	 * @covers Grunion_Contact_Form_Plugin
	 * @group csvexport
	 */
	public function test_get_export_data_for_posts_invalid_all_entries_meta() {
		/**
		 * Grunion_Contact_Form_Plugin mock object.
		 *
		 * @var Grunion_Contact_Form_Plugin $mock
		 */
		$mock = $this->getMockBuilder( 'Grunion_Contact_Form_Plugin' )
			->setMethods(
				array(
					'get_post_meta_for_csv_export',
					'get_parsed_field_contents_of_post',
					'get_post_content_for_csv_export',
					'map_parsed_field_contents_of_post_to_field_names',
				)
			)
			->disableOriginalConstructor()
			->getMock();

		$get_post_meta_for_csv_export_map = array(
			array( 15, null ),
			array( 16, null ),
		);

		$get_parsed_field_contents_of_post_map = array(
			array( 15, array( '_feedback_subject' => 'subj1' ) ),
			array( 16, array( '_feedback_subject' => 'subj2' ) ),
		);

		$get_post_content_for_csv_export_map = array(
			array( 15, 'This is my test 15' ),
			array( 16, 'This is my test 16' ),
		);

		$mapped_fields_contents_map = array(
			array(
				array(
					'_feedback_subject'      => 'subj1',
					'_feedback_main_comment' => 'This is my test 15',
				),
				array(
					'Contact Form' => 'subj1',
					'4_Comment'    => 'This is my test 15',
				),
			),
			array(
				array(
					'_feedback_subject'      => 'subj2',
					'_feedback_main_comment' => 'This is my test 16',
				),
				array(
					'Contact Form' => 'subj2',
					'4_Comment'    => 'This is my test 16',
				),
			),
		);

		$mock->expects( $this->exactly( 2 ) )
			->method( 'get_post_meta_for_csv_export' )
			->will( $this->returnValueMap( $get_post_meta_for_csv_export_map ) );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'get_parsed_field_contents_of_post' )
			->will( $this->returnValueMap( $get_parsed_field_contents_of_post_map ) );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'get_post_content_for_csv_export' )
			->will( $this->returnValueMap( $get_post_content_for_csv_export_map ) );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'map_parsed_field_contents_of_post_to_field_names' )
			->will( $this->returnValueMap( $mapped_fields_contents_map ) );

		$result = $mock->get_export_data_for_posts( array( 15, 16 ) );

		$expected_result = array(
			'Contact Form' => array( 'subj1', 'subj2' ),
			'4_Comment'    => array( 'This is my test 15', 'This is my test 16' ),
		);

		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test get_export_data_for_posts with single invalid entry for parsed fields.
	 *
	 * @covers Grunion_Contact_Form_Plugin
	 * @group csvexport
	 */
	public function test_get_export_data_for_posts_single_invalid_entry_for_parse_fields() {
		/**
		 * Grunion_Contact_Form_Plugin mock object.
		 *
		 * @var Grunion_Contact_Form_Plugin $mock
		 * */
		$mock = $this->getMockBuilder( 'Grunion_Contact_Form_Plugin' )
			->setMethods(
				array(
					'get_post_meta_for_csv_export',
					'get_parsed_field_contents_of_post',
					'get_post_content_for_csv_export',
					'map_parsed_field_contents_of_post_to_field_names',
				)
			)
			->disableOriginalConstructor()
			->getMock();

		$get_post_meta_for_csv_export_map = array(
			array(
				15,
				array(
					'key1' => 'value1',
					'key2' => 'value2',
					'key3' => 'value3',
					'key4' => 'value4',

				),
			),
			array(
				16,
				array(
					'key3' => 'value3',
					'key4' => 'value4',
					'key5' => 'value5',
					'key6' => 'value6',
				),
			),
		);

		$get_parsed_field_contents_of_post_map = array(
			array( 15, array() ),
			array( 16, array( '_feedback_subject' => 'subj2' ) ),
		);

		$get_post_content_for_csv_export_map = array(
			array( 15, 'This is my test 15' ),
			array( 16, 'This is my test 16' ),
		);

		$mapped_fields_contents_map = array(
			array(
				array(
					'_feedback_subject'      => 'subj1',
					'_feedback_main_comment' => 'This is my test 15',
				),
				array(
					'Contact Form' => 'subj1',
					'4_Comment'    => 'This is my test 15',
				),
			),
			array(
				array(
					'_feedback_subject'      => 'subj2',
					'_feedback_main_comment' => 'This is my test 16',
				),
				array(
					'Contact Form' => 'subj2',
					'4_Comment'    => 'This is my test 16',
				),
			),
		);

		$mock->expects( $this->exactly( 1 ) )
			->method( 'get_post_meta_for_csv_export' )
			->will( $this->returnValueMap( $get_post_meta_for_csv_export_map ) );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'get_parsed_field_contents_of_post' )
			->will( $this->returnValueMap( $get_parsed_field_contents_of_post_map ) );

		$mock->expects( $this->exactly( 1 ) )
			->method( 'get_post_content_for_csv_export' )
			->will( $this->returnValueMap( $get_post_content_for_csv_export_map ) );

		$mock->expects( $this->exactly( 1 ) )
			->method( 'map_parsed_field_contents_of_post_to_field_names' )
			->will( $this->returnValueMap( $mapped_fields_contents_map ) );

		$result = $mock->get_export_data_for_posts( array( 15, 16 ) );

		$expected_result = array(
			'Contact Form' => array( 'subj2' ),
			'key3'         => array( 'value3' ),
			'key4'         => array( 'value4' ),
			'key5'         => array( 'value5' ),
			'key6'         => array( 'value6' ),
			'4_Comment'    => array( 'This is my test 16' ),
		);

		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test get_export_data_for_posts with all entries for parsed fields invalid.
	 *
	 * @covers Grunion_Contact_Form_Plugin
	 * @group csvexport
	 */
	public function test_get_export_data_for_posts_all_entries_for_parse_fields_invalid() {
		/**
		 * Grunion_Contact_Form_Plugin mock object.
		 *
		 * @var Grunion_Contact_Form_Plugin $mock
		 */
		$mock = $this->getMockBuilder( 'Grunion_Contact_Form_Plugin' )
			->setMethods(
				array(
					'get_post_meta_for_csv_export',
					'get_parsed_field_contents_of_post',
					'get_post_content_for_csv_export',
					'map_parsed_field_contents_of_post_to_field_names',
				)
			)
			->disableOriginalConstructor()
			->getMock();

		$get_parsed_field_contents_of_post_map = array(
			array( 15, array() ),
			array( 16, array() ),
		);

		$mock->expects( $this->never() )
			->method( 'get_post_meta_for_csv_export' );

		$mock->expects( $this->exactly( 2 ) )
			->method( 'get_parsed_field_contents_of_post' )
			->will( $this->returnValueMap( $get_parsed_field_contents_of_post_map ) );

		$result = $mock->get_export_data_for_posts( array( 15, 16 ) );

		$expected_result = array();

		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Test map_parsed_field_contents_of_post_to_field_names
	 *
	 * @covers Grunion_Contact_Form_Plugin
	 * @group csvexport
	 */
	public function test_map_parsed_field_contents_of_post_to_field_names() {

		$input_data = array(
			'test_field'             => 'moonstruck',
			'_feedback_subject'      => 'This is my form',
			'_feedback_author_email' => '',
			'_feedback_author'       => 'John Smith',
			'_feedback_author_url'   => 'http://example.com',
			'_feedback_main_comment' => 'This is my comment!',
			'another_field'          => 'thunderstruck',
		);

		$plugin = Grunion_Contact_Form_Plugin::init();

		$result = $plugin->map_parsed_field_contents_of_post_to_field_names( $input_data );

		$expected_result = array(
			'Contact Form' => 'This is my form',
			'1_Name'       => 'John Smith',
			'3_Website'    => 'http://example.com',
			'4_Comment'    => 'This is my comment!',
		);

		$this->assertEquals( $expected_result, $result );
	}

	/**
	 * Tests the functionality of 'Grunion_Contact_Form_Plugin::personal_data_exporter'.
	 *
	 * @author jaswrks
	 */
	public function test_personal_data_exporter() {
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'email'    => 'john@example.com',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		for ( $i = 1; $i <= 2; $i++ ) {
			$form = new Grunion_Contact_Form(
				array(
					'to'      => '"john" <john@example.com>',
					'subject' => 'Hello world! [ ' . wp_rand() . ' ]',
				),
				'
					[contact-field label="Name" type="name" required="1"/]
					[contact-field label="Email" type="email" required="1"/]
					[contact-field label="Dropdown" type="select" options="First option,Second option,Third option"/]
					[contact-field label="Radio" type="radio" options="First option,Second option,Third option"/]
					[contact-field label="Text" type="text"/]
				'
			);
			$this->assertTrue(
				is_string( $form->process_submission() ),
				'form submission ' . $i
			);
		}

		$posts  = get_posts( array( 'post_type' => 'feedback' ) );
		$export = $this->plugin->personal_data_exporter( 'john@example.com' );

		$this->assertCount( 2, $posts, 'posts count matches' );
		$this->assertCount( 2, $export['data'], 'export[data] count matches' );

		foreach ( $export['data'] as $data ) {
			$this->assertSame( 'feedback', $data['group_id'], 'group_id matches' );
			$this->assertSame( 'Feedback', $data['group_label'], 'group_label matches' );
			$this->assertSame( true, ! empty( $data['item_id'] ), 'has item_id key' );
			$this->assertCount( 9, $data['data'], 'has total expected data keys' );
		}
	}

	/**
	 * Tests the functionality of 'Grunion_Contact_Form_Plugin::personal_data_eraser'.
	 *
	 * @author jaswrks
	 */
	public function test_personal_data_eraser() {
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'email' => 'john@example.com',
			)
		);

		for ( $i = 1; $i <= 2; $i++ ) {
			$form = new Grunion_Contact_Form(
				array(
					'to'      => '"john" <john@example.com>',
					'subject' => 'Hello world! [ ' . wp_rand() . ' ]',
				),
				'
					[contact-field label="Name" type="name" required="1"/]
					[contact-field label="Email" type="email" required="1"/]
				'
			);
			$this->assertTrue(
				is_string( $form->process_submission() ),
				'form submission ' . $i
			);
		}

		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 2, $posts, 'posts count matches before erasing' );

		$this->plugin->personal_data_eraser( 'john@example.com' );

		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 0, $posts, 'posts count matches after erasing' );
	}

	/**
	 * Tests the functionality of 'Grunion_Contact_Form_Plugin::personal_data_eraser' with pagination.
	 */
	public function test_personal_data_eraser_pagination() {
		$this->add_field_values(
			array(
				'name'  => 'Jane Doe',
				'email' => 'jane_doe@example.com',
			)
		);

		for ( $i = 1; $i <= 3; $i++ ) {
			$form = new Grunion_Contact_Form(
				array(
					'to'      => '"jane" <jane_doe@example.com>',
					'subject' => 'Hello world! [ ' . wp_rand() . ' ]',
				),
				'
					[contact-field label="Name" type="name" required="1"/]
					[contact-field label="Email" type="email" required="1"/]
				'
			);
			$this->assertTrue(
				is_string( $form->process_submission() ),
				'form submission ' . $i
			);
		}

		$this->add_field_values(
			array(
				'name'  => 'Jane Doe Again',
				'email' => 'jane@example.com',
			)
		);

		$form = new Grunion_Contact_Form(
			array(
				'to'      => '"jane" <jane@example.com>',
				'subject' => 'Hello world! [ ' . wp_rand() . ' ]',
			),
			'
				[contact-field label="Name" type="name" required="1"/]
				[contact-field label="Email" type="email" required="1"/]
			'
		);
		$this->assertTrue(
			is_string( $form->process_submission() ),
			'form submission ' . $i
		);

		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 4, $posts, 'posts count matches before erasing' );

		$this->plugin->_internal_personal_data_eraser( 'jane_doe@example.com', 1, 1 );
		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 3, $posts, 'posts count matches after page 1' );

		$this->plugin->_internal_personal_data_eraser( 'jane_doe@example.com', 2, 1 );
		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 2, $posts, 'posts count matches after page 2' );

		$this->plugin->_internal_personal_data_eraser( 'jane_doe@example.com', 3, 1 );
		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 1, $posts, 'posts count matches after page 3' );

		$this->plugin->_internal_personal_data_eraser( 'jane@example.com', 1, 1 );
		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 0, $posts, 'posts count matches after deleting the other feedback responder' );
	}

	/**
	 * Tests the functionality of the grunion_contact_form_apply_block_attribute() function.
	 */
	public function test_grunion_contact_form_apply_block_attribute() {
		// No contact form block.
		$original = <<<EOT
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT;
		$expected = <<<EOT
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT;
		$this->assertEquals(
			$expected,
			grunion_contact_form_apply_block_attribute( $original, array( 'foo' => 'bar' ) )
		);
		// Contact form block without attributes.
		$original = <<<EOT
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:jetpack/contact-form -->
<div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-name {"label":"Single Template","required":true} /-->

<!-- wp:jetpack/field-textarea /-->

<!-- wp:jetpack/button {"element":"button","text":"Contact Us"} /--></div>
<!-- /wp:jetpack/contact-form -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT;
		$expected = <<<EOT
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:jetpack/contact-form {"foo":"bar"} -->
<div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-name {"label":"Single Template","required":true} /-->

<!-- wp:jetpack/field-textarea /-->

<!-- wp:jetpack/button {"element":"button","text":"Contact Us"} /--></div>
<!-- /wp:jetpack/contact-form -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT;
		$this->assertEquals(
			$expected,
			grunion_contact_form_apply_block_attribute( $original, array( 'foo' => 'bar' ) )
		);
		// Contact form block with attributes.
		$original = <<<EOT
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:jetpack/contact-form {"customThankyou":"message"} -->
<div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-name {"label":"Single Template","required":true} /-->

<!-- wp:jetpack/field-textarea /-->

<!-- wp:jetpack/button {"element":"button","text":"Contact Us"} /--></div>
<!-- /wp:jetpack/contact-form -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT;
		$expected = <<<EOT
<!-- wp:template-part {"slug":"post-meta-icons","theme":"pub/zoologist"} /-->

<!-- wp:spacer {"height":"150px"} -->
<div style="height:150px;" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:jetpack/contact-form {"customThankyou":"message","foo":"bar"} -->
<div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-name {"label":"Single Template","required":true} /-->

<!-- wp:jetpack/field-textarea /-->

<!-- wp:jetpack/button {"element":"button","text":"Contact Us"} /--></div>
<!-- /wp:jetpack/contact-form -->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"30px","right":"20px","bottom":"0px","left":"20px"}}},"layout":{"inherit":true}} -->
<div class="wp-block-group" style="padding-top:30px;padding-right:20px;padding-bottom:0;padding-left:20px;"><!-- wp:columns {"align":"wide","className":"next-prev-links"} -->
<div class="wp-block-columns alignwide next-prev-links"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"type":"previous","label":"←","showTitle":true} /--></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:post-navigation-link {"textAlign":"right","label":"→","showTitle":true} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:post-comments /--></div>
<!-- /wp:group -->
EOT;
		$this->assertEquals(
			$expected,
			grunion_contact_form_apply_block_attribute( $original, array( 'foo' => 'bar' ) )
		);
	}
} // end class
