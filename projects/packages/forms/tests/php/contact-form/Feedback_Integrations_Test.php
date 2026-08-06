<?php
/**
 * Unit tests for the Feedback integrations payload.
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

require_once __DIR__ . '/class-utility.php';

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for the Feedback integrations payload.
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Integrations_Test extends BaseTestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tear_down() {
		parent::tear_down();
		Feedback::clear_cache();
	}

	/**
	 * A form configured to sync its responses to Google Sheets.
	 *
	 * @return Contact_Form
	 */
	private function get_syncing_form() {
		return new Contact_Form(
			array(
				'googleSheetsData' => array(
					'enabled'       => true,
					'spreadsheetId' => '1AbCdEf',
					'userId'        => 42,
					'columns'       => array( 'g1-name', 'g2-email' ),
				),
			)
		);
	}

	/**
	 * Submission data used across the tests.
	 *
	 * @return array
	 */
	private function get_post_data() {
		return array(
			'name'  => 'John Doe',
			'email' => 'john@example.com',
		);
	}

	/**
	 * The destination is read off the form at submission time.
	 */
	public function test_submission_carries_the_google_sheets_destination() {
		$response = Feedback::from_submission( $this->get_post_data(), $this->get_syncing_form() );

		$this->assertSame(
			array(
				'spreadsheet_id' => '1AbCdEf',
				'user_id'        => 42,
				'columns'        => array( 'g1-name', 'g2-email' ),
			),
			$response->get_integration( 'google_sheets' )
		);
	}

	/**
	 * The destination has to survive the trip through post_content, because that
	 * is what Jetpack Sync carries to WordPress.com.
	 */
	public function test_destination_survives_a_serialize_parse_round_trip() {
		$response = Feedback::from_submission( $this->get_post_data(), $this->get_syncing_form() );
		$post     = $response->save();
		$this->assertInstanceOf( \WP_Post::class, $post );

		Feedback::clear_cache();
		$reloaded    = Feedback::get( $post->ID );
		$destination = $reloaded->get_integration( 'google_sheets' );

		$this->assertIsArray( $destination );
		$this->assertSame( '1AbCdEf', $destination['spreadsheet_id'] );
		$this->assertSame( 42, $destination['user_id'] );
		$this->assertSame( array( 'g1-name', 'g2-email' ), $destination['columns'] );
	}

	/**
	 * Forms without sync switched on must serialize exactly as they did before,
	 * so we do not churn stored payloads for the overwhelming majority of forms.
	 */
	public function test_no_key_is_written_when_sync_is_disabled() {
		$form     = new Contact_Form( array() );
		$response = Feedback::from_submission( $this->get_post_data(), $form );

		$this->assertNull( $response->get_integration( 'google_sheets' ) );
		$this->assertStringNotContainsString( 'integrations', $response->serialize() );
	}

	/**
	 * Spam responses carry the destination too.
	 *
	 * Absence of the key means "this form has sync switched off", never "this
	 * response is spam". A spam response with no destination could never be
	 * appended if the user later marks it as not spam.
	 */
	public function test_destination_is_written_for_spam_responses() {
		$response = Feedback::from_submission( $this->get_post_data(), $this->get_syncing_form() );
		$response->set_status( 'spam' );
		$post = $response->save();
		$this->assertInstanceOf( \WP_Post::class, $post );

		Feedback::clear_cache();
		$reloaded = Feedback::get( $post->ID );

		$this->assertSame( 'spam', get_post_status( $post->ID ) );
		$this->assertNotNull( $reloaded->get_integration( 'google_sheets' ) );
	}

	/**
	 * Payloads written before this key existed still parse.
	 */
	public function test_payloads_without_the_key_still_parse() {
		$post_id = \wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'publish',
				'post_content'   => '{"subject":"Legacy","fields":[]}',
				'post_mime_type' => 'v3',
			)
		);

		Feedback::clear_cache();
		$reloaded = Feedback::get( $post_id );

		$this->assertInstanceOf( Feedback::class, $reloaded );
		$this->assertNull( $reloaded->get_integration( 'google_sheets' ) );
	}
}
