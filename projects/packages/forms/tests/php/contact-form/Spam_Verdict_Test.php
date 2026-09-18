<?php
/**
 * Tests for how a rejected submission records which check rejected it.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Posts;

/**
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin
 */
#[CoversClass( Contact_Form::class )]
#[CoversClass( Contact_Form_Plugin::class )]
class Spam_Verdict_Test extends BaseTestCase {

	/**
	 * The post the form lives on.
	 *
	 * @var \WP_Post
	 */
	private $post;

	/**
	 * Arguments each `jetpack_forms_log` call was made with.
	 *
	 * @var array
	 */
	private $logged = array();

	/**
	 * @before
	 */
	#[Before]
	public function set_up_spam_verdict_test() {
		add_filter( 'pre_wp_mail', '__return_true', PHP_INT_MAX );

		$this->logged = array();
		add_action(
			'jetpack_forms_log',
			function ( ...$args ) {
				$this->logged[] = $args;
			},
			10,
			PHP_INT_MAX
		);

		$_SERVER['REMOTE_ADDR']     = '203.0.113.9';
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)';

		$author_id = wp_insert_user(
			array(
				'user_email' => 'owner@example.com',
				'user_login' => 'spam_verdict_owner',
				'user_pass'  => 'abc123',
				'role'       => 'author',
			)
		);

		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Contact',
				'post_content' => 'Form lives here',
				'post_status'  => 'draft',
				'post_author'  => $author_id,
			),
			true
		);

		global $post;
		$post                     = get_post( $post_id );
		$this->post               = $post;
		$_POST['contact-form-id'] = $post_id;

		Contact_Form_Plugin::init()->process_form_submission();
	}

	/**
	 * Submit the form and return the feedback post that was created.
	 *
	 * @return \stdClass
	 */
	private function submit() {
		$prefix = 'g' . $this->post->ID;
		$_POST  = array(
			'contact-form-id'    => $this->post->ID,
			$prefix . '-name'    => 'Real Customer',
			$prefix . '-email'   => 'customer@example.com',
			$prefix . '-message' => 'Please book me an appointment.',
		);

		$form = new Contact_Form(
			array( 'to' => 'owner@example.com' ),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		$form->process_submission();

		return end( Posts::init()->posts );
	}

	/**
	 * A term in Disallowed Comment Keys matches the user agent, not the message. The
	 * submission is trashed, and the reason has to survive to say why.
	 */
	public function test_disallowed_list_hit_records_its_verdict() {
		update_option( 'disallowed_keys', "iPhone\n" );

		$feedback = $this->submit();

		$this->assertSame( 'trash', $feedback->post_status );
		$this->assertSame( 'disallowed_list', get_post_meta( $feedback->ID, '_feedback_spam_verdict', true ) );
		$this->assertContains(
			array( 'submission_rejected_as_spam', 'disallowed_list' ),
			$this->logged
		);
	}

	/**
	 * A verdict from a filter other than the disallowed list is stored as spam and
	 * recorded separately, so the two cases can be told apart after the fact.
	 */
	public function test_filter_verdict_records_separately_from_the_disallowed_list() {
		add_filter( 'jetpack_contact_form_is_spam', '__return_true', 11 );

		$feedback = $this->submit();

		$this->assertSame( 'spam', $feedback->post_status );
		$this->assertSame( 'filter', get_post_meta( $feedback->ID, '_feedback_spam_verdict', true ) );
		$this->assertContains(
			array( 'submission_rejected_as_spam', 'filter' ),
			$this->logged
		);

		remove_all_filters( 'jetpack_contact_form_is_spam' );
	}

	/**
	 * An accepted submission records no verdict at all.
	 */
	public function test_accepted_submission_records_no_verdict() {
		$feedback = $this->submit();

		$this->assertSame( 'publish', $feedback->post_status );
		$this->assertSame( '', get_post_meta( $feedback->ID, '_feedback_spam_verdict', true ) );
		$this->assertSame( array(), $this->logged );
	}

	/**
	 * The verdict source does not leak from one submission into the next.
	 */
	public function test_verdict_source_resets_between_submissions() {
		update_option( 'disallowed_keys', "iPhone\n" );
		$this->submit();

		update_option( 'disallowed_keys', '' );
		$feedback = $this->submit();

		$this->assertSame( 'publish', $feedback->post_status );
		$this->assertSame( '', get_post_meta( $feedback->ID, '_feedback_spam_verdict', true ) );
	}

	/**
	 * A logged-out visitor is never a connected user, so the connection check has to run
	 * against the master user the event is actually attributed to.
	 */
	public function test_tracks_event_is_attributed_to_the_master_user_for_a_logged_out_visitor() {
		$owner_id = wp_insert_user(
			array(
				'user_email' => 'master@example.com',
				'user_login' => 'spam_verdict_master',
				'user_pass'  => 'abc123',
				'role'       => 'administrator',
			)
		);

		Jetpack_Options::update_option( 'master_user', $owner_id );
		Jetpack_Options::update_option( 'user_tokens', array( $owner_id => 'token.secret.' . $owner_id ) );
		Jetpack_Options::update_option( 'id', 1234 );
		update_option( 'jetpack_tos_agreed', true );

		wp_set_current_user( 0 );

		$recorded = array();
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$recorded ) {
				$recorded[] = $url;
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '',
				);
			},
			10,
			3
		);

		Contact_Form_Plugin::init()->record_tracks_event( 'forms_spam_verdict_probe', array() );

		$this->assertNotEmpty(
			$recorded,
			'A Tracks event should be recorded for an anonymous visitor when the site has a connected owner.'
		);
	}
}
