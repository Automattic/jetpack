<?php
/**
 * Tests for the comment form.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use WorDBless\BaseTestCase;

/**
 * Tests for the Comment_Form class.
 */
class Comment_Form_Test extends BaseTestCase {

	/**
	 * Drop the cached instance.
	 *
	 * WorDBless restores the hook state after every test, stripping the hooks
	 * init() registered. Without this the next init() would be a no-op.
	 *
	 * @return void
	 */
	public static function reset_comment_form() {
		$instance = new \ReflectionProperty( Comment_Form::class, 'instance' );
		$instance->setValue( null, null );

		// wp_scripts() and wp_styles() are globals WorDBless leaves alone, so a
		// registered handle and its inline data would otherwise outlive the test.
		// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited -- Resetting test state.
		$GLOBALS['wp_scripts'] = null;
		$GLOBALS['wp_styles']  = null;
		// phpcs:enable WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	/**
	 * Clean up between tests.
	 *
	 * @after
	 */
	#[\PHPUnit\Framework\Attributes\After]
	public function tear_down_comment_form() {
		self::reset_comment_form();
	}

	/**
	 * Init hooks once, and hands back the same instance.
	 */
	public function test_init_is_idempotent() {
		$first = Comment_Form::init();

		$this->assertSame( $first, Comment_Form::init() );
		$this->assertNotFalse( has_filter( 'comment_form_submit_field', array( $first, 'render' ) ) );
	}

	/**
	 * Every field core would draw is dropped, the textarea included.
	 */
	public function test_all_core_fields_are_dropped() {
		Comment_Form::init();

		$fields = apply_filters(
			'comment_form_fields',
			array(
				'comment' => '<textarea></textarea>',
				'author'  => '<p class="comment-form-author"></p>',
				'email'   => '<p class="comment-form-email"></p>',
				'url'     => '<p class="comment-form-url"></p>',
				'cookies' => '<p class="comment-form-cookies-consent"></p>',
			)
		);

		$this->assertSame( array(), $fields );
	}

	/**
	 * The per-field filters are left registered for anyone else who wants them.
	 */
	public function test_per_field_filters_are_not_removed() {
		add_filter( 'comment_form_field_author', '__return_empty_string' );

		Comment_Form::init();

		$this->assertNotFalse( has_filter( 'comment_form_field_author', '__return_empty_string' ) );

		remove_filter( 'comment_form_field_author', '__return_empty_string' );
	}

	/**
	 * The notes and the log-in message are blanked, since the app draws both.
	 */
	public function test_comment_form_defaults_are_blanked() {
		Comment_Form::init();

		$defaults = apply_filters(
			'comment_form_defaults',
			array(
				'logged_in_as'         => 'Logged in as someone.',
				'comment_notes_before' => 'Notes before.',
				'must_log_in'          => 'You must be logged in.',
				'title_reply'          => 'Leave a comment',
				'label_submit'         => 'Post Comment',
			)
		);

		$this->assertSame( '', $defaults['logged_in_as'] );
		$this->assertSame( '', $defaults['comment_notes_before'] );
		$this->assertSame( '', $defaults['must_log_in'] );
		$this->assertSame( 'Leave a comment', $defaults['title_reply'] );
		$this->assertSame( 'Comment', $defaults['label_submit'] );
	}

	/**
	 * The submit label is whatever the form was rendered with.
	 */
	public function test_submit_label_comes_from_the_form_arguments() {
		Comment_Form::init()->enqueue_assets( array( 'label_submit' => 'Send it' ) );

		$settings = $this->inlined_settings();

		$this->assertSame( 'Send it', $settings['strings']['submit'] );
	}

	/**
	 * The submit button keeps the identifiers the form was rendered with.
	 */
	public function test_submit_identifiers_come_from_the_form_arguments() {
		Comment_Form::init()->enqueue_assets(
			array(
				'id_submit'   => 'my-submit',
				'name_submit' => 'my_submit',
			)
		);

		$settings = $this->inlined_settings();

		$this->assertSame( 'my-submit', $settings['submitId'] );
		$this->assertSame( 'my_submit', $settings['submitName'] );
	}

	/**
	 * Core's own defaults apply when the form was rendered without them.
	 */
	public function test_submit_identifiers_fall_back_to_core_defaults() {
		Comment_Form::init()->enqueue_assets();

		$settings = $this->inlined_settings();

		$this->assertSame( 'submit', $settings['submitId'] );
		$this->assertSame( 'submit', $settings['submitName'] );
	}

	/**
	 * Copy can be rewritten without touching the bundle.
	 */
	public function test_strings_are_filterable() {
		add_filter(
			'jetpack_comments_strings',
			function ( $strings ) {
				$strings['reply'] = 'Respond';
				return $strings;
			}
		);

		Comment_Form::init()->enqueue_assets();

		$settings = $this->inlined_settings();

		$this->assertSame( 'Respond', $settings['strings']['reply'] );

		remove_all_filters( 'jetpack_comments_strings' );
	}

	/**
	 * The site's colour scheme lands on the wrapper.
	 */
	public function test_color_scheme_is_applied() {
		update_option( 'jetpack_comment_form_color_scheme', 'dark' );

		$this->assertStringContainsString(
			'class="jetpack-comments dark"',
			Comment_Form::init()->render( '' )
		);
	}

	/**
	 * An unrecognized colour scheme falls back rather than reaching the markup.
	 */
	public function test_unknown_color_scheme_falls_back() {
		update_option( 'jetpack_comment_form_color_scheme', 'neon"><script>' );

		$this->assertStringContainsString(
			'class="jetpack-comments transparent"',
			Comment_Form::init()->render( '' )
		);
	}

	/**
	 * Pull the settings blob back out of the registered script.
	 *
	 * @return array
	 */
	private function inlined_settings() {
		$inline = implode( '', (array) wp_scripts()->get_data( Comment_Form::HANDLE, 'before' ) );
		preg_match( '/window\.JetpackComments = (.*);/', $inline, $matches );

		return json_decode( $matches[1], true );
	}

	/**
	 * The greeting from the Comments settings screen becomes the heading.
	 */
	public function test_greeting_option_sets_the_reply_title() {
		update_option( 'highlander_comment_form_prompt', 'Say something' );

		Comment_Form::init();

		$defaults = apply_filters(
			'comment_form_defaults',
			array( 'title_reply' => 'Leave a Reply' )
		);

		$this->assertSame( 'Say something', $defaults['title_reply'] );
	}

	/**
	 * With no greeting set, core's heading is left alone.
	 */
	public function test_no_greeting_leaves_the_reply_title_alone() {
		delete_option( 'highlander_comment_form_prompt' );

		Comment_Form::init();

		$defaults = apply_filters(
			'comment_form_defaults',
			array( 'title_reply' => 'Leave a Reply' )
		);

		$this->assertSame( 'Leave a Reply', $defaults['title_reply'] );
	}

	/**
	 * The logged-in line is suppressed even when a theme passes its own.
	 */
	public function test_logged_in_line_is_suppressed() {
		Comment_Form::init();

		$this->assertSame( '', apply_filters( 'comment_form_logged_in', 'Logged in as someone.' ) );
	}

	/**
	 * The form re-emits the hidden inputs that replacing the submit field drops.
	 */
	public function test_render_includes_the_mount_point_and_hidden_fields() {
		$post_id         = wp_insert_post(
			array(
				'post_title'   => 'A post to comment on',
				'post_content' => 'Content.',
				'post_status'  => 'publish',
			)
		);
		$GLOBALS['post'] = get_post( $post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Standing in for the main query on a single post.

		$markup = Comment_Form::init()->render( '' );

		$this->assertStringContainsString( '<div class="jetpack-comments transparent"></div>', $markup );
		$this->assertStringContainsString( 'comment_post_ID', $markup );
		$this->assertStringContainsString( 'comment_parent', $markup );
		$this->assertStringContainsString( (string) $post_id, $markup );
		$this->assertStringContainsString( 'name="' . Comment_Form::NONCE_NAME . '"', $markup );
	}

	/**
	 * A block theme renders its template before wp_head(), so the form can come up
	 * before wp_enqueue_scripts has fired. Enqueuing has to register on its own.
	 */
	public function test_enqueue_registers_when_wp_enqueue_scripts_has_not_fired() {
		$comment_form = Comment_Form::init();

		$this->assertFalse( wp_script_is( Comment_Form::HANDLE, 'registered' ) );

		$comment_form->enqueue_assets();

		$this->assertTrue( wp_script_is( Comment_Form::HANDLE, 'registered' ) );
		$this->assertTrue( wp_script_is( Comment_Form::HANDLE, 'enqueued' ) );
	}

	/**
	 * The settings blob rides along with the script.
	 */
	public function test_settings_are_inlined_before_the_bundle() {
		Comment_Form::init()->enqueue_assets();

		$inline = wp_scripts()->get_data( Comment_Form::HANDLE, 'before' );

		$this->assertNotEmpty( $inline );
		$this->assertStringContainsString( 'window.JetpackComments =', implode( '', (array) $inline ) );
	}

	/**
	 * A post type opted out through the filter keeps core's own form.
	 */
	public function test_opting_a_post_type_out_leaves_core_alone() {
		$post_id         = wp_insert_post(
			array(
				'post_title'  => 'Opted out',
				'post_status' => 'publish',
			)
		);
		$GLOBALS['post'] = get_post( $post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Standing in for the main query.

		add_filter( 'jetpack_comment_form_enabled_for_post', '__return_false' );

		$comment_form = Comment_Form::init();
		$fields       = array(
			'comment' => '<textarea></textarea>',
			'author'  => '<p></p>',
		);

		$this->assertSame( $fields, apply_filters( 'comment_form_fields', $fields ) );
		$this->assertSame( 'Logged in as someone.', apply_filters( 'comment_form_logged_in', 'Logged in as someone.' ) );
		$this->assertSame( array( 'logged_in_as' => 'kept' ), apply_filters( 'comment_form_defaults', array( 'logged_in_as' => 'kept' ) ) );
		$this->assertSame( '<p class="form-submit"></p>', $comment_form->render( '<p class="form-submit"></p>' ) );

		// A submission for that post type is core's business, not ours.
		$_POST[ Comment_Form::NONCE_NAME ] = 'not-a-nonce';
		$comment_form->verify_nonce( $post_id );
		$this->assertTrue( true );

		unset( $_POST[ Comment_Form::NONCE_NAME ] );
		remove_all_filters( 'jetpack_comment_form_enabled_for_post' );
	}

	/**
	 * A site requiring registration still gets a form, wrapped by us.
	 */
	public function test_must_log_in_branch_renders_a_form() {
		$comment_form = Comment_Form::init();

		$defaults = apply_filters( 'comment_form_defaults', array( 'must_log_in' => 'You must be logged in.' ) );
		$this->assertSame( '', $defaults['must_log_in'] );

		ob_start();
		$comment_form->render_must_log_in();
		$markup = ob_get_clean();

		$this->assertStringContainsString( '<form', $markup );
		$this->assertStringContainsString( 'id="commentform"', $markup );
		$this->assertStringContainsString( 'wp-comments-post.php', $markup );
		$this->assertStringContainsString( 'jetpack-comments', $markup );
		$this->assertStringContainsString( 'name="' . Comment_Form::NONCE_NAME . '"', $markup );
	}

	/**
	 * The app is told to offer a log-in rather than a comment box.
	 */
	public function test_must_log_in_is_reported_to_the_app() {
		update_option( 'comment_registration', 1 );

		Comment_Form::init()->enqueue_assets();
		$settings = $this->inlined_settings();

		$this->assertTrue( $settings['mustLogIn'] );
		$this->assertNotEmpty( $settings['loginUrl'] );

		delete_option( 'comment_registration' );
	}

	/**
	 * An opted-out post type gets core's notice back, not our form.
	 */
	public function test_must_log_in_respects_the_post_type_opt_out() {
		add_filter( 'jetpack_comment_form_enabled_for_post', '__return_false' );

		ob_start();
		Comment_Form::init()->render_must_log_in();
		$markup = ob_get_clean();

		$this->assertSame( '', $markup );

		remove_all_filters( 'jetpack_comment_form_enabled_for_post' );
	}

	/**
	 * A comment carrying a good nonce is waved through.
	 */
	public function test_verify_nonce_accepts_a_valid_nonce() {
		$comment_form = Comment_Form::init();

		$_POST[ Comment_Form::NONCE_NAME ] = wp_create_nonce( Comment_Form::NONCE_ACTION );

		$comment_form->verify_nonce();

		// wp_die() would have thrown; reaching here is the assertion.
		$this->assertTrue( true );

		unset( $_POST[ Comment_Form::NONCE_NAME ] );
	}

	/**
	 * A comment with no nonce, or the wrong one, is rejected.
	 */
	public function test_verify_nonce_rejects_a_bad_nonce() {
		$comment_form = Comment_Form::init();

		$_POST[ Comment_Form::NONCE_NAME ] = 'not-a-nonce';

		add_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ) );

		try {
			$this->expectException( \Exception::class );
			$comment_form->verify_nonce();
		} finally {
			remove_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ) );
			unset( $_POST[ Comment_Form::NONCE_NAME ] );
		}
	}

	/**
	 * Turn wp_die() into something a test can catch.
	 *
	 * @return callable
	 */
	public function throw_on_wp_die() {
		/**
		 * Throw instead of halting, so the test can assert on it.
		 *
		 * @param string|\Stringable $message Message passed to wp_die().
		 * @return never
		 * @throws \Exception Always.
		 */
		return static function ( $message ) {
			throw new \Exception( esc_html( $message ) );
		};
	}
}
