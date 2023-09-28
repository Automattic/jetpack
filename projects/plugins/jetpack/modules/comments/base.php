<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Jetpack comments base file - where the code shared between WP.com Verbum and Jetpack Verbum is defined
 *
 * @package automattic/jetpack
 */

/**
 * Class Verbum_Comments_Base
 * This class is used to share code between WP.com Verbum and Jetpack Verbum.
 */
class Verbum_Comments_Base {
	/**
	 * Constructor
	 */
	public function __construct() {
		$this->setup_actions();
		$this->setup_filters();
		$this->setup_globals();
	}

	/**
	 * Setup actions for methods in this class
	 *
	 * @since 1.4
	 */
	protected function setup_actions() {
		// Selfishly remove everything from the existing comment form.
		remove_all_actions( 'comment_form_before' );

		// Allow Facebook users to comment as a logged in (registered) user.
		add_action( 'pre_comment_on_post', array( $this, 'allow_logged_out_user_to_comment_as_external' ), 100 ); // Set priority high to run after check to make sure they are logged in to the external service.
	}

	/**
	 * Setup filters for methods in this class
	 *
	 * @since 1.4
	 */
	protected function setup_filters() {
		// Remove unnecessary default fields.
		add_filter( 'comment_form_defaults', array( $this, 'comment_form_defaults' ) );

		// Fix comment reply link when `comment_registration` is required.
		add_filter( 'comment_reply_link', array( $this, 'comment_reply_link' ), 10, 4 );

		// Allows users on self-hosted sites to comment with Verbum.
		// Without this there is a nonce mismatch.
		add_filter( 'preprocess_comment', array( $this, 'allow_logged_in_user_to_comment_as_guest' ), 0 );
	}

	/**
	 * Set any global variables or class variables
	 *
	 * This is primarily defining the comment form available login services.
	 *
	 * @since 1.4
	 */
	protected function setup_globals() {
		// Sources.
		$this->available_services = array(
			'guest',
			'jetpack',
			'wordpress',
			'facebook',
		);
	}

	/**
	 * Check the POST request for the service the user is commenting as.
	 * Optionally check the service against an expected value.
	 *
	 * @param string $expected The expected service.
	 * @return string|false The service the user is commenting as, or false if the request is not Verbum..
	 */
	public function is_verbum_comment_post( $expected = null ) {
		$service = isset( $_POST['hc_post_as'] ) ? sanitize_text_field( wp_unslash( $_POST['hc_post_as'] ) ) : false; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce checked before saving comment.

		if ( ! $service ) {
			return false;
		}

		if ( ! in_array( $service, $this->available_services, true ) ) {
			return false;
		}

		if ( ! empty( $expected ) && $expected !== $service ) {
			return false;
		}

		return $service;
	}

	/**
	 * Allows a logged out user to leave a comment as a Facebook credentialed user.
	 * Overrides WordPress' core comment_registration option to treat the commenter as "registered" (verified) users.
	 */
	public function allow_logged_out_user_to_comment_as_external() {
		if ( ! $this->is_verbum_comment_post( 'facebook' ) ) {
			return;
		}

		add_filter( 'pre_option_comment_registration', '__return_zero' );
		add_filter( 'pre_option_require_name_email', '__return_zero' );
	}

	/**
	 * Set comment reply link.
	 * This is to fix the reply link when comment registration is required.
	 *
	 * @param string $reply_link The reply link.
	 * @param array  $args       The arguments.
	 * @param object $comment    The comment object.
	 * @param object $post       The post object.
	 * @return string The reply link.
	 */
	public function comment_reply_link( $reply_link, $args, $comment, $post ) {
		// This is only necessary if comment_registration is required to post comments
		if ( ! get_option( 'comment_registration' ) ) {
			return $reply_link;
		}

		$comment     = get_comment( $comment );
		$respond_id  = $args['respond_id'];
		$add_below   = $args['add_below'];
		$reply_text  = esc_html( $args['reply_text'] );
		$before_link = wp_kses( $args['before'], wp_kses_allowed_html( 'post' ) );
		$after_link  = wp_kses( $args['after'], wp_kses_allowed_html( 'post' ) );

		$reply_url = esc_url( add_query_arg( 'replytocom', $comment->comment_ID . '#' . $respond_id ) );

		return <<<HTML
			$before_link
			<a class='comment-reply-link' href='$reply_url' onclick='return addComment.moveForm( "$add_below-$comment->comment_ID", "$comment->comment_ID", "$respond_id", "$post->ID" )'>$reply_text</a>
			$after_link
HTML;
	}

	/**
	 * Remove some of the default comment_form args because they are not needed.
	 *
	 * @param string $args Comment form default args.
	 */
	public function comment_form_defaults( $args ) {
		return array_merge(
			$args,
			array(
				'comment_field'        => '',
				'must_log_in'          => '',
				'logged_in_as'         => '',
				'comment_notes_before' => '',
				'comment_notes_after'  => '',
				'title_reply'          => '',
				/* translators: % is the original posters name */
				'title_reply_to'       => __( 'Leave a Reply to %s', 'jetpack' ),
				'cancel_reply_link'    => __( 'Cancel reply', 'jetpack' ),
			)
		);
	}

	/**
	 * Allow a logged in user to post as a guest, FB, or twitter credentialed request.
	 * Bypasses WordPress' core overrides that force a logged in user to comment as that user.
	 * Respects comment_registration option.
	 *
	 * @since JetpackComments (1.4)
	 * @param array $comment_data All data for a specific comment.
	 * @return array Modified comment data, or an error if the required fields or a valid email address are not entered.
	 */
	public function allow_logged_in_user_to_comment_as_guest( $comment_data ) {
		$service = $this->is_verbum_comment_post();

		// Bail if user registration is allowed.
		if ( get_option( 'comment_registration' ) ) {
			return $comment_data;
		}

		// Bail if user is not logged in or not a post request.
		if ( ! isset( $_SERVER['REQUEST_METHOD'] ) || 'POST' !== strtoupper( $_SERVER['REQUEST_METHOD'] ) || ! is_user_logged_in() ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- simple comparison
			return $comment_data;
		}

		// Bail if this is not a guest or external service credentialed request.
		if ( ! in_array( $service, array( 'facebook', 'guest' ), true ) ) {
			return $comment_data;
		}

		$user = wp_get_current_user();

		foreach ( array(
			'comment_author'       => 'display_name',
			'comment_author_email' => 'user_email',
			'comment_author_url'   => 'user_url',
		) as $comment_field => $user_field ) {
			if ( addslashes( $user->$user_field ) !== $comment_data[ $comment_field ] ) {
				return $comment_data; // some other plugin already did something funky.
			}
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- Nonce verification should happen in Jetpack_Comments::pre_comment_on_post()
		// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitization too
		if ( get_option( 'require_name_email' ) ) {
			if ( isset( $_POST['email'] ) && 6 > strlen( wp_unslash( $_POST['email'] ) ) || empty( $_POST['author'] ) ) {
				wp_die( esc_html__( 'Error: please fill the required fields (name, email).', 'jetpack' ), 400 );
			} elseif ( ! isset( $_POST['email'] ) || ! is_email( wp_unslash( $_POST['email'] ) ) ) {
				wp_die( esc_html__( 'Error: please enter a valid email address.', 'jetpack' ), 400 );
			}
		}

		$author_change = false;
		foreach ( array(
			'comment_author'       => 'author',
			'comment_author_email' => 'email',
			'comment_author_url'   => 'url',
		) as $comment_field => $post_field ) {
			if ( ( ! isset( $_POST[ $post_field ] ) || $comment_data[ $comment_field ] !== $_POST[ $post_field ] ) && 'url' !== $post_field ) {
				$author_change = true;
			}
			$comment_data[ $comment_field ] = isset( $_POST[ $post_field ] ) ? wp_unslash( $_POST[ $post_field ] ) : null;
		}
		// phpcs:enable WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		// Mark as guest comment if name or email were changed.
		if ( $author_change ) {
			$comment_data['user_ID'] = 0;
			$comment_data['user_id'] = $comment_data['user_ID'];
		}

		return $comment_data;
	}
}
