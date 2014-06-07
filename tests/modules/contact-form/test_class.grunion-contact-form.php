<?php
require __DIR__ . '/../../../modules/contact-form/grunion-contact-form.php';

class WP_Test_Grunion_Contact_Form extends WP_UnitTestCase {

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();
		define( 'DOING_AJAX', true ); // Defined so that 'exit' is not called in process_submission
	}

	/**
	 * Inserts globals needed to process contact form submits
	 */
	private function set_globals() {
		$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
		$_SERVER['HTTP_USER_AGENT'] = 'unit-test';
		$_SERVER['HTTP_REFERER'] = 'test';
	}

	public function setUp() {
		parent::setUp();

		$this->set_globals();

		$author_id = $this->factory->user->create( array(
			'user_email' => 'mellow@hello.com'
		) );

		$post_id = $this->factory->post->create( array(
			'post_status' => 'draft',
			'post_author' => strval( $author_id )
		) );

		global $post;
		$post = get_post( $post_id );

		// Place post_id to contact form id to make the form processable
		$_POST['contact-form-id'] = $post_id;

		// Make the global post (used by contact forms) accessbile to tests
		$this->post = $post;
	}

	private function add_field_values( $values ) {
		foreach( $values as $key => $val ) {
			$_POST['g' . $this->post->ID . '-' . $key] = $val;
		}
	}

	/**
	 * @author tonykova
	 * @covers Grunion_Contact_Form::process_submission
	 *
	 * Tests that the submission as a whole will produce something in the
	 * database when required information is provided
	 */
	public function test_process_submission_will_store_a_feedback_correctly_with_default_form() {
		$form = new Grunion_Contact_Form( array() );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertEquals( 1, count( $feedback ), 'There should be one feedback after process_submission' );

		// Default metadata should be saved
		$submission = $feedback[0];
		$email = get_post_meta( $submission->ID, '_feedback_email', true );
		$this->assertEquals( 'mellow@hello.com', $email['to'][0] );
		$this->assertContains( 'IP Address: 127.0.0.1', $email['message'] );
	}

	/**
	 * @author tonykova
	 * @covers Grunion_Contact_Form::process_submission
	 *
	 * Tests that the submission as a whole will produce something in the
	 * database when some labels are provided
	 */
	public function test_process_submission_will_store_extra_field_metadata() {
		// Fill field values
		$this->add_field_values( array(
			'name'     => 'John Doe',
			'dropdown' => 'First option',
			'radio'    =>'Second option',
			'text'     =>'Texty text'
		) );

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field
		$form = new Grunion_Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertEquals( 1, count( $feedback ), 'There should be one feedback after process_submission' );

		// Default metadata should be saved
		$submission = $feedback[0];
		$extra_fields = get_post_meta( $submission->ID, '_feedback_extra_fields', true );

		$this->assertEquals( 3, count( $extra_fields ), 'There should be exactly three extra fields when one of the fields is name, and the others are an extra dropdown, radio button field and text field' );
		$this->assertEquals( $extra_fields['Dropdown'], 'First option', 'When the first option of a dropdown field with label Dropdown is selected, there should be metadata with that key and value' );
		$this->assertEquals( $extra_fields['Radio'], 'Second option', 'When the first option of a radio button field with label Radio is selected, there should be metadata with that key and value' );
		$this->assertEquals( $extra_fields['Text'], 'Texty text', 'When the text field with label Text is filled with the text \'Texty text\', there should be metadata with that key and value' );
	}

	/**
	 * @author tonykova
	 * @covers Grunion_Contact_Form::process_submission
	 *
	 * Tests that the submission will store the subject when specified
	 */
	public function test_process_submission_will_store_subject_when_specified() {
		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field
		$form = new Grunion_Contact_Form( array( 'subject' => 'I\'m sorry, but the party\'s over') ); // Default form
		$result = $form->process_submission();

		// Processing should be successful and produce the success message
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertEquals( 1, count( $feedback ), 'There should be one feedback after process_submission' );

		// Default metadata should be saved
		$submission = $feedback[0];

		$this->assertContains( 'SUBJECT: I\'m sorry, but the party\'s over', $submission->post_content, 'The stored subject didn\'t match the given' );
	}

	/**
	 * @author tonykova
	 * @covers Grunion_Contact_Form::process_submission
	 */
	public function test_process_submission_will_store_fields_and_their_values_to_post_content() {
		// Fill field values
		$this->add_field_values( array(
			'name'     => 'John Doe',
			'dropdown' => 'First option',
			'radio'    =>'Second option',
			'text'     =>'Texty text'
		) );

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field
		$form = new Grunion_Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertEquals( 1, count( $feedback ), 'There should be one feedback after process_submission' );

		// Default metadata should be saved
		$submission = $feedback[0];

		$this->assertContains( '[Name] =&gt; John Doe', $submission->post_content, 'Post content did not contain the name label and/or value' );
		$this->assertContains( '[Dropdown] =&gt; First option', $submission->post_content, 'Post content did not contain the dropdown label and/or value' );
		$this->assertContains( '[Radio] =&gt; Second option', $submission->post_content, 'Post content did not contain the radio button label and/or value' );
		$this->assertContains( '[Text] =&gt; Texty text', $submission->post_content, 'Post content did not contain the text field label and/or value' );
	}

	/**
	 * @author tonykova
	 * @covers Grunion_Contact_Form::process_submission
	 */
	public function test_process_submission_will_store_fields_and_their_values_to_email_meta() {
		// Fill field values
		$this->add_field_values( array(
			'name'     => 'John Doe',
			'dropdown' => 'First option',
			'radio'    =>'Second option',
			'text'     =>'Texty text'
		) );

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field
		$form = new Grunion_Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message
		$this->assertTrue( is_string( $result ) );

		$feedback = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertEquals( 1, count( $feedback ), 'There should be one feedback after process_submission' );

		// Default metadata should be saved
		$submission = $feedback[0];
		$email = get_post_meta( $submission->ID, '_feedback_email', true );

		$expected = 'Name: John Doe' . PHP_EOL;
		$expected .= 'Dropdown: First option' . PHP_EOL;
		$expected .= 'Radio: Second option' . PHP_EOL;
		$expected .= 'Text: Texty text';

		$email_body = explode( PHP_EOL . PHP_EOL, $email['message'] )[0];

		$this->assertEquals( $expected, $email_body );
	}

	/**
	 * @author tonykova
	 * @covers Grunion_Contact_Form::process_submission
	 */
	public function test_process_submission_sends_correct_email() {
		// Fill field values
		$this->add_field_values( array(
			'name'     => 'John Doe',
			'dropdown' => 'First option',
			'radio'    =>'Second option',
			'text'     =>'Texty text'
		) );

		add_filter( 'wp_mail', function( $args ) {
			$this->assertContains( 'mellow@hello.com', $args['to'] );
			$this->assertEquals( 'Hello there!', $args['subject'] );

			$expected = 'Name: John Doe' . PHP_EOL;
			$expected .= 'Dropdown: First option' . PHP_EOL;
			$expected .= 'Radio: Second option' . PHP_EOL;
			$expected .= 'Text: Texty text';

			// Divides email by the first empty line
			$email_body = explode( PHP_EOL . PHP_EOL, $args['message'] )[0];

			$this->assertEquals( $expected, $email_body );
		} );

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field
		$form = new Grunion_Contact_Form( array( 'to' => 'mellow@hello.com', 'subject' => 'Hello there!' ), "[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$form->process_submission();
	}

	/**
	 * @author tonykova
	 * @covers grunion_delete_old_spam
	 */
	public function test_grunion_delete_old_spam_deletes_a_post_marked_as_spam() {
		$post_id = $this->factory->post->create( array(
			'post_type' => 'feedback',
			'post_status' => 'spam',
			'post_date_gmt' => '1987-01-01 12:00:00'
		) );

		grunion_delete_old_spam();
		$this->assertEquals( null, get_post( $post_id ) );
	}
} // end class
