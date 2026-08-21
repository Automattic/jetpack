<?php
/**
 * The comment form.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Assets;

/**
 * Replaces the core comment form, and accepts what it submits.
 */
class Comment_Form {

	/**
	 * Script and style handle.
	 */
	const HANDLE = 'jetpack-comments';

	/**
	 * Nonce action guarding a comment submission.
	 */
	const NONCE_ACTION = 'jetpack_comments_form';

	/**
	 * POST field carrying the nonce.
	 */
	const NONCE_NAME = 'jetpack_comments_form_nonce';

	/**
	 * Colour schemes the form knows how to draw.
	 */
	const COLOR_SCHEMES = array( 'transparent', 'light', 'dark' );

	/**
	 * Singleton instance.
	 *
	 * @var Comment_Form|null
	 */
	private static $instance = null;

	/**
	 * Whether the settings blob has already been attached to the script.
	 *
	 * @var bool
	 */
	private $settings_printed = false;

	/**
	 * Register the form's hooks. Safe to call more than once.
	 *
	 * @return Comment_Form
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Take over the core comment form.
	 */
	private function __construct() {
		// Drops every field core would draw, the textarea included. With the array
		// empty core skips the loop, so no comment_form_field_* filter runs either.
		add_filter( 'comment_form_fields', array( $this, 'comment_form_fields' ) );
		add_filter( 'comment_form_logged_in', array( $this, 'comment_form_logged_in' ) );
		add_filter( 'comment_form_defaults', array( $this, 'comment_form_defaults' ), 20 );

		// The app renders where the submit button would have been.
		add_filter( 'comment_form_submit_field', array( $this, 'render' ), 10, 2 );

		// On a site requiring registration core prints a notice and returns before
		// the form, so the app needs drawing on that branch too.
		add_action( 'comment_form_must_log_in_after', array( $this, 'render_must_log_in' ) );

		add_action( 'wp_enqueue_scripts', array( $this, 'register_assets' ) );
		add_action( 'pre_comment_on_post', array( $this, 'verify_nonce' ) );
	}

	/**
	 * Whether this form should replace core's for the post being displayed.
	 *
	 * Sites use this to keep the Jetpack comment form off a given post type. It
	 * predates this package, and is the one documented way to opt out.
	 *
	 * @param int|null $post_id Post being commented on. Defaults to the current one.
	 * @return bool
	 */
	private static function enabled_for_post_type( $post_id = null ) {
		$post_type = $post_id ? get_post_type( $post_id ) : get_post_type();

		/** This filter is documented in projects/plugins/jetpack/modules/comments/comments.php */
		return (bool) apply_filters( 'jetpack_comment_form_enabled_for_' . $post_type, true );
	}

	/**
	 * Drop every field core would draw, so the app can draw its own.
	 *
	 * @param array $fields Comment form fields, the textarea included.
	 * @return array
	 */
	public function comment_form_fields( $fields ) {
		return self::enabled_for_post_type() ? array() : $fields;
	}

	/**
	 * Suppress core's logged-in line, which the app draws itself.
	 *
	 * @param string $logged_in_as The "logged in as" markup.
	 * @return string
	 */
	public function comment_form_logged_in( $logged_in_as ) {
		return self::enabled_for_post_type() ? '' : $logged_in_as;
	}

	/**
	 * Set up the arguments the form reads back out.
	 *
	 * These are defaults, so a theme passing any of them to comment_form() still
	 * wins.
	 *
	 * @param array $args Comment form arguments.
	 * @return array
	 */
	public function comment_form_defaults( $args ) {
		if ( ! self::enabled_for_post_type() ) {
			return $args;
		}

		$defaults = array(
			'logged_in_as'         => '',
			'comment_notes_before' => '',
			'must_log_in'          => '',
			'label_submit'         => _x( 'Comment', 'verb', 'jetpack-comments' ),
		);

		// The greeting the Comments settings screen writes. Only override the
		// heading when one is actually set, so core's own default survives.
		$greeting = get_option( 'highlander_comment_form_prompt' );
		if ( is_string( $greeting ) && $greeting !== '' ) {
			$defaults['title_reply'] = $greeting;
		}

		return array_merge( $args, $defaults );
	}

	/**
	 * Replace the submit field with the app.
	 *
	 * @param string $submit_field The submit field markup this replaces.
	 * @param array  $args         Comment form arguments, after the theme's own.
	 * @return string
	 */
	public function render( $submit_field, $args = array() ) {
		if ( ! self::enabled_for_post_type() ) {
			return $submit_field;
		}

		$this->enqueue_assets( $args );

		return $this->markup();
	}

	/**
	 * Draw the app where core would have printed its "you must log in" notice.
	 *
	 * Core returns before opening the form on that branch, so this supplies one.
	 * The app finds its form with closest( 'form' ) and needs it either way.
	 *
	 * @return void
	 */
	public function render_must_log_in() {
		if ( ! self::enabled_for_post_type() ) {
			return;
		}

		$this->enqueue_assets();

		printf(
			'<form action="%s" method="post" id="commentform" class="comment-form">%s</form>',
			esc_url( site_url( '/wp-comments-post.php' ) ),
			$this->markup() // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped as it is built.
		);
	}

	/**
	 * The app's mount point, and the hidden fields it posts with.
	 *
	 * @return string
	 */
	private function markup() {
		return '<div class="jetpack-comments ' . esc_attr( self::color_scheme() ) . '"></div>'
			. $this->hidden_fields();
	}

	/**
	 * Hidden fields the form needs to post.
	 *
	 * Core emits `comment_post_ID` and `comment_parent` as part of the submit
	 * field, which this form replaces wholesale.
	 *
	 * @return string
	 */
	private function hidden_fields() {
		return '<div class="jetpack-comments__fields">'
			. get_comment_id_fields( self::post_id() )
			. wp_nonce_field( self::NONCE_ACTION, self::NONCE_NAME, false, false )
			. '</div>';
	}

	/**
	 * The post being commented on.
	 *
	 * Note that get_queried_object_id() is wrong inside a query loop, where the
	 * form belongs to the looped post rather than to the page.
	 *
	 * @return int
	 */
	private static function post_id() {
		$post = get_post();

		return $post ? $post->ID : 0;
	}

	/**
	 * The colour scheme the site has chosen.
	 *
	 * @return string
	 */
	private static function color_scheme() {
		$scheme = get_option( 'jetpack_comment_form_color_scheme', 'transparent' );

		return in_array( $scheme, self::COLOR_SCHEMES, true ) ? $scheme : 'transparent';
	}

	/**
	 * Register the bundle. Enqueuing waits until a form actually renders.
	 *
	 * @return void
	 */
	public function register_assets() {
		if ( wp_script_is( self::HANDLE, 'registered' ) ) {
			return;
		}

		Assets::register_script(
			self::HANDLE,
			'../../build/comments.js',
			__FILE__,
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);

		// Keeps the CSS out of the footer on classic themes, where the form renders
		// after wp_head(). Query loops, where is_singular() is false, are covered by
		// enqueue_assets().
		if ( is_singular() && comments_open() ) {
			wp_enqueue_style( self::HANDLE );
		}
	}

	/**
	 * Enqueue the bundle and hand it the settings for this form.
	 *
	 * @param array $args Comment form arguments.
	 * @return void
	 */
	public function enqueue_assets( $args = array() ) {
		// A block theme renders its whole template, this form included, before
		// wp_head() runs, so wp_enqueue_scripts has not necessarily fired yet.
		$this->register_assets();

		if ( ! $this->settings_printed ) {
			wp_add_inline_script(
				self::HANDLE,
				'window.JetpackComments = ' . wp_json_encode(
					$this->settings( $args ),
					JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
				) . ';',
				'before'
			);
			$this->settings_printed = true;
		}

		Assets::enqueue_script( self::HANDLE );
		wp_enqueue_style( self::HANDLE );
	}

	/**
	 * Everything the app needs that only PHP knows.
	 *
	 * @param array $args Comment form arguments.
	 * @return array
	 */
	private function settings( $args ) {
		$post_id = self::post_id();

		return array_merge(
			array(
				'requireNameEmail'   => (bool) get_option( 'require_name_email' ),
				'showCookiesConsent' => (bool) get_option( 'show_comments_cookies_opt_in' ),
				'mustLogIn'          => (bool) get_option( 'comment_registration' ) && ! is_user_logged_in(),
				'loginUrl'           => wp_login_url( get_permalink( $post_id ) ),
				'maxLength'          => self::comment_max_length(),
				'submitId'           => $args['id_submit'] ?? 'submit',
				'submitName'         => $args['name_submit'] ?? 'submit',
				'strings'            => self::strings( $args ),
			),
			Identity::settings( $post_id )
		);
	}

	/**
	 * How long a comment the database will take.
	 *
	 * @return int
	 */
	private static function comment_max_length() {
		$lengths = wp_get_comment_fields_max_lengths();

		return isset( $lengths['comment_content'] ) ? (int) $lengths['comment_content'] : 65525;
	}

	/**
	 * The copy the app renders.
	 *
	 * The submit label comes from the comment form arguments, so a theme or plugin
	 * that sets `label_submit` gets what it asked for.
	 *
	 * @param array $args Comment form arguments.
	 * @return array
	 */
	private static function strings( $args ) {
		$strings = array(
			'submit'              => $args['label_submit'] ?? _x( 'Comment', 'verb', 'jetpack-comments' ),
			'reply'               => _x( 'Reply', 'verb', 'jetpack-comments' ),
			'commentLabel'        => _x( 'Comment', 'noun', 'jetpack-comments' ),
			'replyLabel'          => _x( 'Reply', 'noun', 'jetpack-comments' ),
			'placeholder'         => __( 'Write a comment...', 'jetpack-comments' ),
			'replyPlaceholder'    => __( 'Write a reply...', 'jetpack-comments' ),
			'name'                => __( 'Name', 'jetpack-comments' ),
			'email'               => __( 'Email', 'jetpack-comments' ),
			'emailPlaceholder'    => __( 'Email (Address never made public)', 'jetpack-comments' ),
			'website'             => __( 'Website', 'jetpack-comments' ),
			'websitePlaceholder'  => __( 'Website (Optional)', 'jetpack-comments' ),
			'guestPrompt'         => __( 'Leave a comment.', 'jetpack-comments' ),
			'mustLogInPrompt'     => __( 'Log in to leave a comment.', 'jetpack-comments' ),
			'logIn'               => __( 'Log in', 'jetpack-comments' ),
			'guestPromptRequired' => __( 'Provide your name and email to leave a comment.', 'jetpack-comments' ),
			'saveDetails'         => __( 'Save my name, email, and website in this browser for the next time I comment.', 'jetpack-comments' ),
			/* translators: %s is the display name of the logged-in user. */
			'commentingAs'        => __( 'Commenting as %s', 'jetpack-comments' ),
			'logOut'              => __( 'Log out', 'jetpack-comments' ),
		);

		/**
		 * Filter the copy the comment form renders.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $strings Keyed by the name the app reads.
		 * @param array $args    Comment form arguments.
		 */
		return apply_filters( 'jetpack_comments_strings', $strings, $args );
	}

	/**
	 * Reject anything that did not come from a form this class rendered.
	 *
	 * @param int $comment_post_id The post being commented on.
	 * @return void
	 */
	public function verify_nonce( $comment_post_id = 0 ) {
		// Core drew the form for this post type, so core's own checks apply.
		if ( ! self::enabled_for_post_type( $comment_post_id ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- this is the nonce check.
		$nonce = isset( $_POST[ self::NONCE_NAME ] ) ? sanitize_text_field( wp_unslash( $_POST[ self::NONCE_NAME ] ) ) : '';

		if ( wp_verify_nonce( $nonce, self::NONCE_ACTION ) ) {
			return;
		}

		// Logging in or out with the form already on screen submits a nonce minted
		// for the other state, so give the logged-out one a second look.
		$current_user_id = get_current_user_id();
		wp_set_current_user( 0 );
		$valid_logged_out = wp_verify_nonce( $nonce, self::NONCE_ACTION );
		wp_set_current_user( $current_user_id );

		if ( $valid_logged_out ) {
			return;
		}

		wp_die(
			esc_html__( 'Sorry, this comment could not be posted.', 'jetpack-comments' ),
			esc_html__( 'Comment Submission Failure', 'jetpack-comments' ),
			array( 'response' => 403 )
		);
	}
}
