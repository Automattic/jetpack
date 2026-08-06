<?php
/**
 * Unit tests for Google Sheets sync setup.
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

require_once __DIR__ . '/../contact-form/class-utility.php';

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Feedback;
use Automattic\Jetpack\Forms\ContactForm\Utility;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Google_Sheets_Setup.
 *
 * @covers Automattic\Jetpack\Forms\Service\Google_Sheets_Setup
 */
#[CoversClass( Google_Sheets_Setup::class )]
class Google_Sheets_Setup_Test extends BaseTestCase {

	/**
	 * The labels of the three-field form the helpers below build.
	 *
	 * @var array
	 */
	const FORM_LABELS = array( 'Name', 'Email', 'Message' );

	/**
	 * Clean up after each test.
	 */
	protected function tear_down() {
		parent::tear_down();
		Feedback::clear_cache();
	}

	/**
	 * A form whose responses hang off the given jetpack_form post.
	 *
	 * @param int $form_post_id The jetpack_form post ID.
	 * @return Contact_Form
	 */
	private function get_form_for( $form_post_id ) {
		return new Contact_Form(
			array(
				'title' => 'Test Form',
				'ref'   => $form_post_id,
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);
	}

	/**
	 * Save a response belonging to a specific form.
	 *
	 * @param Contact_Form $form    The form being submitted.
	 * @param string       $name    The submitted name.
	 * @param bool         $is_test Whether to mark it as a preview submission.
	 * @return int The feedback post ID.
	 */
	private function save_response_for_form( Contact_Form $form, $name, $is_test = false ) {
		// Prefix the submitted keys with the form's own computed ID, so the field
		// IDs match the ones this form generates for its inputs.
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $name,
				'email'   => 'john@example.com',
				'message' => 'Test message',
			),
			'g' . $form->get_attribute( 'id' )
		);

		$response = Feedback::from_submission( $_post_data, $form );
		if ( $is_test ) {
			$response->mark_as_test();
		}
		$post = $response->save();

		Feedback::clear_cache();
		return $post->ID;
	}

	/**
	 * Build a saved response from a three-field form.
	 *
	 * @return Feedback
	 */
	private function get_saved_response() {
		return Feedback::get( $this->save_response_for_form( $this->get_form_for( 0 ), 'John Doe' ) );
	}

	public function test_header_row_leads_with_metadata_columns() {
		$header = Google_Sheets_Setup::build_header_row( array( 'Name', 'Email' ) );

		$this->assertSame( array( 'Submitted', 'Source', 'Name', 'Email' ), $header );
	}

	public function test_header_row_skips_blank_and_non_string_columns() {
		$header = Google_Sheets_Setup::build_header_row( array( '', '   ', array( 'Name' ), null, 'Email' ) );

		$this->assertSame( array( 'Submitted', 'Source', 'Email' ), $header );
	}

	public function test_header_row_handles_no_fields() {
		$this->assertSame( array( 'Submitted', 'Source' ), Google_Sheets_Setup::build_header_row( array() ) );
	}

	/**
	 * A row has to line up with the header: metadata first, then one cell per
	 * column in the frozen order.
	 */
	public function test_row_aligns_values_to_the_column_order() {
		$response = $this->get_saved_response();

		$row = Google_Sheets_Setup::build_row( $response, self::FORM_LABELS );

		$this->assertCount( count( self::FORM_LABELS ) + 2, $row );
		$this->assertSame( $response->get_time(), $row[0] );
		$this->assertSame( 'John Doe', $row[2] );
		$this->assertSame( 'john@example.com', $row[3] );
		$this->assertSame( 'Test message', $row[4] );
	}

	/**
	 * A column the response has no value for leaves a blank cell rather than
	 * shifting every later value one column to the left.
	 */
	public function test_row_leaves_a_blank_cell_for_a_removed_field() {
		$response = $this->get_saved_response();

		$row = Google_Sheets_Setup::build_row(
			$response,
			array( 'Name', 'Since removed', 'Email' )
		);

		$this->assertSame( array( 'John Doe', '', 'john@example.com' ), array_slice( $row, 2 ) );
	}

	/**
	 * Reordering the frozen columns reorders the row, so rows written before and
	 * after a form edit still land under the right headers.
	 */
	public function test_row_follows_the_column_order_not_the_form_order() {
		$response = $this->get_saved_response();

		$forward  = Google_Sheets_Setup::build_row( $response, self::FORM_LABELS );
		$reversed = Google_Sheets_Setup::build_row( $response, array_reverse( self::FORM_LABELS ) );

		$this->assertSame( array_slice( $forward, 2 ), array_reverse( array_slice( $reversed, 2 ) ) );
	}

	/**
	 * Backfill rows come out in the order the responses were given, one row each.
	 *
	 * Note this drives build_rows_for_feedback_ids() rather than
	 * get_backfill_rows(): WP_Query returns nothing under WorDBless, so the query
	 * itself is covered on a live site instead.
	 */
	public function test_backfill_builds_one_row_per_response_in_order() {
		$form_post_id = \wp_insert_post(
			array(
				'post_type'   => 'jetpack_form',
				'post_status' => 'publish',
				'post_title'  => 'Synced form',
			)
		);

		$form   = $this->get_form_for( $form_post_id );
		$first  = $this->save_response_for_form( $form, 'First person' );
		$second = $this->save_response_for_form( $form, 'Second person' );

		$rows = Google_Sheets_Setup::build_rows_for_feedback_ids(
			array( $first, $second ),
			self::FORM_LABELS
		);

		$this->assertCount( 2, $rows );
		$this->assertSame( 'First person', $rows[0][2] );
		$this->assertSame( 'Second person', $rows[1][2] );
	}

	/**
	 * Preview submissions are not real responses and must not be seeded.
	 */
	public function test_backfill_skips_test_responses() {
		$form_post_id = \wp_insert_post(
			array(
				'post_type'   => 'jetpack_form',
				'post_status' => 'publish',
				'post_title'  => 'Synced form',
			)
		);

		$form = $this->get_form_for( $form_post_id );
		$real = $this->save_response_for_form( $form, 'Real person' );
		$test = $this->save_response_for_form( $form, 'Preview person', true );

		$rows = Google_Sheets_Setup::build_rows_for_feedback_ids( array( $real, $test ), self::FORM_LABELS );

		$this->assertCount( 1, $rows );
		$this->assertSame( 'Real person', $rows[0][2] );
	}

	public function test_backfill_returns_nothing_without_a_form_id() {
		$this->assertSame( array(), Google_Sheets_Setup::get_backfill_rows( 0, array() ) );
	}
}
