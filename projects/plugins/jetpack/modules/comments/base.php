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
	 * @param array $args The comment form args.
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
}
