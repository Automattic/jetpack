<?php
/**
 * Tests for the Write feature's post-publish one-question survey.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

// write.php provides the survey's helpers (wpcom_write_asset_url(),
// WPCOM_WRITE_VERSION) and require_once's post-publish-survey.php, which is the
// code under test here.
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/write/write.php';

/**
 * Exercises the post-publish survey: its visibility gate, question variants,
 * rendered markup, stored response payload, and submission endpoint.
 */
class Write_Post_Publish_Survey_Test extends \WorDBless\BaseTestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user ID (cannot submit the survey).
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'pps_admin',
				'user_pass'  => 'password',
				'user_email' => 'pps_admin@example.com',
				'role'       => 'administrator',
			)
		);

		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'pps_subscriber',
				'user_pass'  => 'password',
				'user_email' => 'pps_subscriber@example.com',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		delete_option( 'site_creation_flow' );
		delete_option( 'wpcom_public_coming_soon' );
		unset( $_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] );
		unset( $_GET['source'] );
		$_POST    = array();
		$_REQUEST = array();
		parent::tear_down();
	}

	/**
	 * Simulate a front-end single-post request so is_singular( 'post' ) is true.
	 *
	 * @param string $post_type Post type to query for ('post' or 'page').
	 * @return int The created post ID.
	 */
	private function go_to_singular_post( $post_type = 'post' ) {
		global $wp_query, $post;

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test post',
				'post_status' => 'publish',
				'post_type'   => $post_type,
			)
		);

		$post                        = get_post( $post_id );
		$wp_query->is_singular       = true;
		$wp_query->is_single         = 'post' === $post_type;
		$wp_query->is_page           = 'page' === $post_type;
		$wp_query->queried_object    = $post;
		$wp_query->queried_object_id = $post_id;

		return $post_id;
	}

	/**
	 * Put the request into the state where the survey is eligible to render.
	 */
	private function make_survey_eligible() {
		wp_set_current_user( $this->admin_id );
		$this->go_to_singular_post();
		$_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] = '1';
	}

	/**
	 * The survey should not show without the publish marker.
	 */
	public function test_survey_hidden_without_marker() {
		wp_set_current_user( $this->admin_id );
		$this->go_to_singular_post();

		$this->assertFalse( wpcom_write_should_show_post_publish_survey() );
	}

	/**
	 * The survey should not show to a user who could not submit it.
	 */
	public function test_survey_hidden_without_manage_options() {
		wp_set_current_user( $this->subscriber_id );
		$this->go_to_singular_post();
		$_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] = '1';

		$this->assertFalse( wpcom_write_should_show_post_publish_survey() );
	}

	/**
	 * The survey should not show outside a single post view.
	 */
	public function test_survey_hidden_when_not_singular_post() {
		wp_set_current_user( $this->admin_id );
		$this->go_to_singular_post( 'page' );
		$_GET[ WPCOM_WRITE_PUBLISHED_MARKER ] = '1';

		$this->assertFalse( wpcom_write_should_show_post_publish_survey() );
	}

	/**
	 * The survey is once per user: a recorded impression closes the gate.
	 */
	public function test_survey_hidden_after_it_has_been_shown() {
		$this->make_survey_eligible();
		update_user_meta( $this->admin_id, WPCOM_WRITE_SURVEY_SHOWN_META, time() );

		$this->assertFalse( wpcom_write_should_show_post_publish_survey() );
	}

	/**
	 * The survey shows when marker + single post + capability all hold, on a
	 * launched site as well as a Coming Soon one.
	 */
	public function test_survey_shown_when_eligible() {
		$this->make_survey_eligible();
		update_option( 'wpcom_public_coming_soon', 0 );

		$this->assertTrue( wpcom_write_should_show_post_publish_survey() );
	}

	/**
	 * Rendering must NOT record the impression. On a Coming Soon site the card
	 * renders behind the post-publish checklist, whose launch CTA navigates away
	 * without dismissing — so those writers would burn their one showing on a
	 * card they never saw.
	 */
	public function test_render_does_not_mark_the_survey_as_shown() {
		$this->make_survey_eligible();

		ob_start();
		wpcom_write_render_post_publish_survey();
		$markup = ob_get_clean();

		$this->assertStringContainsString( 'wpcom-write-pps', $markup );
		$this->assertEmpty( get_user_meta( $this->admin_id, WPCOM_WRITE_SURVEY_SHOWN_META, true ) );
		$this->assertTrue( wpcom_write_should_show_post_publish_survey() );
	}

	/**
	 * Revealing the card is what closes the gate, so it appears exactly once.
	 */
	public function test_reveal_marks_the_survey_as_shown() {
		$this->make_survey_eligible();
		$this->set_valid_nonce();

		$response = $this->capture_ajax_json( 'wpcom_write_ajax_mark_survey_shown' );

		$this->assertTrue( $response['success'] );
		$this->assertNotEmpty( get_user_meta( $this->admin_id, WPCOM_WRITE_SURVEY_SHOWN_META, true ) );
		$this->assertFalse( wpcom_write_should_show_post_publish_survey() );
	}

	/**
	 * A viewer who could not submit the survey cannot close their gate either.
	 */
	public function test_reveal_mark_rejects_a_user_without_manage_options() {
		wp_set_current_user( $this->subscriber_id );
		$this->set_valid_nonce();

		$response = $this->capture_ajax_json( 'wpcom_write_ajax_mark_survey_shown' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'forbidden', $response['data']['reason'] );
		$this->assertEmpty( get_user_meta( $this->subscriber_id, WPCOM_WRITE_SURVEY_SHOWN_META, true ) );
	}

	/**
	 * A site created by the write-first flow is detected from its creation flow.
	 */
	public function test_write_first_site_detected_from_site_creation_flow() {
		update_option( 'site_creation_flow', 'write-on' );
		$this->assertTrue( wpcom_write_is_write_first_site() );

		update_option( 'site_creation_flow', 'onboarding' );
		$this->assertFalse( wpcom_write_is_write_first_site() );
	}

	/**
	 * Write-first writers get the "how was it" scale; everyone else gets the
	 * comparison scale, which includes an escape hatch for a first-ever post.
	 */
	public function test_answer_options_differ_by_variant() {
		$write_first = array_keys( wpcom_write_get_survey_answers( true ) );
		$returning   = array_keys( wpcom_write_get_survey_answers( false ) );

		$this->assertSame( array( 'easy', 'fine', 'frustrating' ), $write_first );
		$this->assertSame( array( 'easier', 'about_same', 'harder', 'first_post' ), $returning );
	}

	/**
	 * "Live" would be untrue on a Coming Soon site, where the post stays private.
	 */
	public function test_heading_does_not_claim_the_post_is_live_when_coming_soon() {
		update_option( 'wpcom_public_coming_soon', 1 );
		$coming_soon = wpcom_write_get_survey_strings( false );

		update_option( 'wpcom_public_coming_soon', 0 );
		$launched = wpcom_write_get_survey_strings( false );

		$this->assertSame( 'Your post is saved.', $coming_soon['heading'] );
		$this->assertSame( 'Your post is live.', $launched['heading'] );
	}

	/**
	 * The rendered card offers exactly the current variant's answers.
	 */
	public function test_rendered_markup_offers_the_write_first_answers() {
		$this->make_survey_eligible();
		update_option( 'site_creation_flow', 'write-on' );

		ob_start();
		wpcom_write_render_post_publish_survey();
		$markup = ob_get_clean();

		$this->assertStringContainsString( 'data-wpcom-write-pps-answer="easy"', $markup );
		$this->assertStringContainsString( 'data-wpcom-write-pps-answer="frustrating"', $markup );
		$this->assertStringNotContainsString( 'data-wpcom-write-pps-answer="about_same"', $markup );
	}

	/**
	 * The entry point is read from the redirect and sanitized.
	 */
	public function test_survey_source_is_read_and_sanitized() {
		$this->assertSame( '', wpcom_write_survey_source() );

		$_GET['source'] = 'Posts_List!';
		$this->assertSame( 'posts_list', wpcom_write_survey_source() );
	}

	/**
	 * Prose is stored under 'text' so wpcom's formatter reads it as free text
	 * rather than as a preset answer key, alongside the segmenting metadata.
	 */
	public function test_response_payload_stores_prose_under_text() {
		$uuid    = wp_generate_uuid4();
		$payload = wpcom_write_build_survey_response( 'harder', 'The toolbar hid my text.', $uuid, 'dashboard', false );

		$this->assertSame( 'harder', $payload['experience'] );
		$this->assertSame( array( 'text' => 'The toolbar hid my text.' ), $payload['comment'] );
		$this->assertSame( 'returning', $payload['variant'] );
		$this->assertSame( 'dashboard', $payload['entryPoint'] );
		$this->assertSame( $uuid, $payload['responseId'] );
	}

	/**
	 * An empty comment is omitted rather than stored as an empty answer.
	 */
	public function test_response_payload_omits_an_empty_comment() {
		$payload = wpcom_write_build_survey_response( 'easy', '', wp_generate_uuid4(), '', true );

		$this->assertArrayNotHasKey( 'comment', $payload );
		$this->assertSame( 'write_first', $payload['variant'] );
	}

	/**
	 * We cap the free text ourselves: neither storage path passes through the
	 * endpoint that would otherwise enforce a limit.
	 */
	public function test_response_payload_caps_long_free_text() {
		$long    = str_repeat( 'a', WPCOM_WRITE_SURVEY_MAX_COMMENT_LENGTH + 500 );
		$payload = wpcom_write_build_survey_response( 'easier', $long, wp_generate_uuid4(), '', false );

		$this->assertSame(
			WPCOM_WRITE_SURVEY_MAX_COMMENT_LENGTH,
			strlen( $payload['comment']['text'] )
		);
	}

	/**
	 * A forged response ID is discarded rather than stored. It is only ever a
	 * uuid4 we minted at render, and it round-trips through the client.
	 */
	public function test_response_payload_discards_a_non_uuid_response_id() {
		$payload = wpcom_write_build_survey_response( 'easier', '', 'not-a-uuid', '', false );

		$this->assertSame( '', $payload['responseId'] );

		$uuid    = wp_generate_uuid4();
		$payload = wpcom_write_build_survey_response( 'easier', '', $uuid, '', false );

		$this->assertSame( $uuid, $payload['responseId'] );
	}

	/**
	 * Every stored field is bounded, not just the free text: neither storage path
	 * passes through the endpoint that enforces wpcom's response-size cap.
	 */
	public function test_response_payload_caps_the_entry_point() {
		$payload = wpcom_write_build_survey_response( 'easier', '', '', str_repeat( 'a', 500 ), false );

		$this->assertSame(
			WPCOM_WRITE_SURVEY_MAX_SOURCE_LENGTH,
			strlen( $payload['entryPoint'] )
		);
	}

	/**
	 * The single-select state is exposed from first render, not only after a
	 * choice — otherwise the buttons change role mid-interaction.
	 */
	public function test_answer_buttons_expose_their_pressed_state_initially() {
		$this->make_survey_eligible();

		ob_start();
		wpcom_write_render_post_publish_survey();
		$markup = ob_get_clean();

		$this->assertSame(
			count( wpcom_write_get_survey_answers( false ) ),
			substr_count( $markup, 'aria-pressed="false"' )
		);
	}

	/**
	 * An answer outside the current variant's scale is rejected, so a stray or
	 * forged submission can't write a slug nothing knows how to read.
	 */
	public function test_submission_rejects_an_answer_from_the_other_variant() {
		$this->make_survey_eligible();
		$this->set_valid_nonce();
		$_POST['answer'] = 'frustrating'; // Write-first slug on a non-write-first site.

		$response = $this->capture_ajax_json( 'wpcom_write_ajax_submit_survey' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'invalid_answer', $response['data']['reason'] );
	}

	/**
	 * A valid answer passes validation and reaches the store. No wpcom survey
	 * library exists under test, so the store reports failure — which is what
	 * distinguishes "validated and attempted" from "rejected at the door".
	 */
	public function test_submission_accepts_a_valid_answer_and_reaches_the_store() {
		$this->make_survey_eligible();
		$this->set_valid_nonce();
		$_POST['answer'] = 'easier';

		$response = $this->capture_ajax_json( 'wpcom_write_ajax_submit_survey' );

		$this->assertFalse( $response['success'] );
		$this->assertSame( 'store_failed', $response['data']['reason'] );
	}

	/**
	 * Prime a valid nonce for the survey submission.
	 *
	 * Note that check_ajax_referer() reads $_REQUEST, which PHP does not
	 * repopulate from a test's $_POST writes, so both have to be set.
	 */
	private function set_valid_nonce() {
		$nonce             = wp_create_nonce( WPCOM_WRITE_SURVEY_NONCE );
		$_REQUEST['nonce'] = $nonce;
		$_POST['nonce']    = $nonce;
	}

	/**
	 * A stored response closes the gate even if the shown-ping never landed.
	 * That ping is fire-and-forget, so it is not the authoritative record.
	 */
	public function test_survey_hidden_after_a_response_was_stored() {
		$this->make_survey_eligible();
		update_user_meta( $this->admin_id, WPCOM_WRITE_SURVEY_SUBMITTED_META, time() );

		$this->assertFalse( wpcom_write_should_show_post_publish_survey() );
	}

	/**
	 * A replayed submission is refused before it reaches the store. Nonces are
	 * valid for their full lifetime and are not single-use, so the once-per-user
	 * rule has to bind on the write path, not only on the render path.
	 *
	 * The 409-vs-500 distinction is the assertion: 500 is the store being
	 * unavailable under test, which proves the request got that far, while 409
	 * proves it short-circuited first.
	 */
	public function test_submission_is_refused_once_a_response_is_stored() {
		$this->make_survey_eligible();
		$this->set_valid_nonce();
		$_POST['answer'] = 'easier';

		$first = $this->capture_ajax_json( 'wpcom_write_ajax_submit_survey' );
		$this->assertSame( 'store_failed', $first['data']['reason'] );

		update_user_meta( $this->admin_id, WPCOM_WRITE_SURVEY_SUBMITTED_META, time() );

		$second = $this->capture_ajax_json( 'wpcom_write_ajax_submit_survey' );
		$this->assertFalse( $second['success'] );
		$this->assertSame( 'already_submitted', $second['data']['reason'] );
	}

	/**
	 * Invoke an ajax handler and return its JSON envelope as an array.
	 *
	 * WordPress's wp_send_json_* echoes the response then calls wp_die(); force the
	 * ajax path and throw from the die handler so we can capture the buffered JSON
	 * without ending the test process.
	 *
	 * @param callable $handler Ajax handler to invoke.
	 * @return array<string, mixed> Decoded response.
	 */
	private function capture_ajax_json( $handler ) {
		add_filter( 'wp_doing_ajax', '__return_true' );
		add_filter(
			'wp_die_ajax_handler',
			function () {
				// Throw so wp_send_json_*'s wp_die() unwinds back to the test rather
				// than ending the process. A `never` return type would break PHP <8.1.
				// @phan-suppress-next-line PhanPluginNeverReturnFunction
				return function () {
					throw new \Exception( 'wp_die' );
				};
			}
		);

		ob_start();
		try {
			$handler();
		} catch ( \Exception $e ) {
			unset( $e ); // wp_die() from wp_send_json_*; expected.
		}
		$output = ob_get_clean();

		remove_all_filters( 'wp_doing_ajax' );
		remove_all_filters( 'wp_die_ajax_handler' );

		return json_decode( $output, true );
	}
}
