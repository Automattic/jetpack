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

require_once __DIR__ . '/akismet-http-post-stub.php';

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
	 * Akismet's own verdict is recorded under its own name, so a submission it rejected can
	 * be told apart from one the site's own settings rejected.
	 */
	public function test_akismet_verdict_records_separately_from_other_filters() {
		/*
		 * Akismet was absent when Contact_Form_Plugin::__construct() ran at bootstrap, so its
		 * check is not hooked up; WorDBless restores $wp_filter, keeping this to one test.
		 */
		add_filter( 'jetpack_contact_form_is_spam', array( Contact_Form_Plugin::init(), 'is_spam_akismet' ), 10, 2 );
		add_filter(
			'jetpack_forms_test_akismet_response',
			static function () {
				return array( array(), 'true' );
			}
		);

		$feedback = $this->submit();

		$this->assertSame( 'spam', $feedback->post_status );
		$this->assertSame( 'akismet', get_post_meta( $feedback->ID, '_feedback_spam_verdict', true ) );
		$this->assertContains(
			array( 'submission_rejected_as_spam', 'akismet' ),
			$this->logged
		);
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
		// Priority 9, so is_spam_blocklist early-returns and cannot set the source itself.
		add_filter( 'jetpack_contact_form_is_spam', '__return_true', 9 );

		$feedback = $this->submit();

		$this->assertSame( 'spam', $feedback->post_status );
		$this->assertSame( 'filter', get_post_meta( $feedback->ID, '_feedback_spam_verdict', true ) );
	}

	/**
	 * The event is attributed to the master user, and carries nothing describing the
	 * logged-out visitor who triggered it.
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
		update_user_meta( $owner_id, 'jetpack_tracks_wpcom_id', '99001' );

		wp_set_current_user( 0 );
		$_SERVER['REMOTE_ADDR'] = '203.0.113.9';

		$pixel_url = '';
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$pixel_url ) {
				if ( '' === $pixel_url ) {
					$pixel_url = (string) $url;
				}
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '',
				);
			},
			10,
			3
		);

		Contact_Form_Plugin::init()->record_tracks_event( 'forms_spam_verdict_probe', array() );

		$this->assertNotSame(
			'',
			$pixel_url,
			'A Tracks event should be recorded for an anonymous visitor when the site has a connected owner.'
		);

		$query = array();
		parse_str( (string) wp_parse_url( $pixel_url, PHP_URL_QUERY ), $query );

		$this->assertSame( 'wpcom:user_id', $query['_ut'] ?? null );
		$this->assertSame( '99001', $query['_ui'] ?? null );
		$this->assertArrayNotHasKey( '_via_ip', $query, 'The visitor address must not be sent with an event attributed to the master user.' );
		$this->assertStringNotContainsString( '203.0.113.9', $pixel_url );
	}
}
