<?php
/**
 * Admits a WordPress.com-vouched commenter as their comment is posted.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * On pre_comment_on_post, exchange a carried code (or read the Passport) and
 * lift core's registration gates; on preprocess_comment, attribute the comment;
 * on comment_post, store the meta and stamp the Passport.
 */
class Comment_Hooks {

	/**
	 * The hidden field a held code rides in.
	 */
	const CODE_FIELD = 'jetpack_comment_identity_code';

	/**
	 * The identity applied to the comment in flight.
	 *
	 * @var array|null
	 */
	private static $identity = null;

	/**
	 * Whether the identity was just exchanged, so the Passport is still to be written.
	 *
	 * @var bool
	 */
	private static $from_code = false;

	/**
	 * Register the hooks. Priority 20 puts the exchange after the form's nonce
	 * check, so an unnonced POST cannot burn codes.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'pre_comment_on_post', array( __CLASS__, 'admit' ), 20 );
		add_filter( 'preprocess_comment', array( __CLASS__, 'apply_identity' ), 0 );
		add_action( 'comment_post', array( __CLASS__, 'store' ), 10, 1 );
	}

	/**
	 * Establish who is commenting and treat them as registered.
	 *
	 * @return void
	 */
	public static function admit() {
		self::$identity  = null;
		self::$from_code = false;

		if ( is_user_logged_in() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Comment_Form::verify_nonce() ran at priority 10.
		$code     = isset( $_POST[ self::CODE_FIELD ] ) ? sanitize_text_field( wp_unslash( $_POST[ self::CODE_FIELD ] ) ) : '';
		$passport = Passport::read();

		if ( '' !== $code ) {
			$identity = Redeemer::redeem( $code );

			if ( is_wp_error( $identity ) ) {
				self::refuse( $identity );
			}

			$identity['exp'] = $identity['expires_at'];

			// A code and a Passport for different people is a stale tab on a shared
			// browser. The Passport is the later act, so it wins; the code is burned.
			if ( false !== $passport && $passport['site_commenter_id'] !== $identity['site_commenter_id'] ) {
				self::$identity = $passport;
			} else {
				self::$identity  = $identity;
				self::$from_code = true;
			}
		} elseif ( false !== $passport ) {
			self::$identity = $passport;
		} else {
			return;
		}

		add_filter( 'pre_option_comment_registration', '__return_zero' );
		add_filter( 'pre_option_require_name_email', '__return_zero' );
	}

	/**
	 * Attribute the comment to the identity. Reads the Passport itself for
	 * comments that skipped pre_comment_on_post, such as REST.
	 *
	 * @param array $comment_data The comment being posted.
	 * @return array
	 */
	public static function apply_identity( $comment_data ) {
		if ( is_user_logged_in() ) {
			return $comment_data;
		}

		$identity = null !== self::$identity ? self::$identity : Passport::read();
		if ( false === $identity ) {
			return $comment_data;
		}

		if ( '' !== $identity['name'] ) {
			$comment_data['comment_author'] = $identity['name'];
		}
		$comment_data['comment_author_email'] = $identity['email'];
		$comment_data['comment_author_url']   = '';
		$comment_data['user_id']              = 0;
		$comment_data['user_ID']              = 0;

		self::$identity = $identity;

		return $comment_data;
	}

	/**
	 * Store the identity meta, and the Passport for a commenter who arrived on a code.
	 *
	 * @param int $comment_id The new comment's ID.
	 * @return void
	 */
	public static function store( $comment_id ) {
		if ( null === self::$identity ) {
			return;
		}

		$identity        = self::$identity;
		$from_code       = self::$from_code;
		self::$identity  = null;
		self::$from_code = false;

		add_comment_meta( $comment_id, Checkpoint::META_SITE_COMMENTER_ID, $identity['site_commenter_id'], true );
		add_comment_meta( $comment_id, Checkpoint::META_PROVIDER, $identity['provider'], true );

		if ( '' !== $identity['avatar'] ) {
			add_comment_meta( $comment_id, Checkpoint::META_AVATAR, $identity['avatar'], true );
		}

		if ( $from_code ) {
			Passport::write( $identity, $identity['exp'] );
		}
	}

	/**
	 * Turn the comment away the way core turns away a failed gate.
	 *
	 * @param \WP_Error $error Why the exchange failed.
	 * @return void
	 */
	private static function refuse( \WP_Error $error ) {
		$data   = $error->get_error_data();
		$status = is_array( $data ) && isset( $data['status'] ) ? (int) $data['status'] : 400;
		if ( $status < 400 || $status >= 600 ) {
			$status = 400;
		}

		if ( in_array( $error->get_error_code(), array( 'code_expired', 'code_used' ), true ) ) {
			$message = __( 'Your sign-in has lapsed. Go back and try again.', 'jetpack-comments' );
		} else {
			$message = __( 'Sorry, your sign-in could not be confirmed. Go back and try again.', 'jetpack-comments' );
		}

		wp_die(
			esc_html( $message ),
			esc_html__( 'Comment Submission Failure', 'jetpack-comments' ),
			array(
				'response'  => (int) $status,
				'back_link' => true,
			)
		);
	}
}
