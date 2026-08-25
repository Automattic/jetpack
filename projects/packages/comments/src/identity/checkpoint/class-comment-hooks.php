<?php
/**
 * Applies a redeemed identity to a comment being posted.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * Three hooks carry the identity onto the comment, in the order core runs them:
 *
 * - pre_comment_on_post lifts the registration and name/email gates, so a
 *   commenter WordPress.com vouched for is treated as verified. It fires before
 *   those gates in wp_handle_comment_submission(), which is why the lift has to
 *   happen here.
 * - preprocess_comment writes the author, email and avatar from the cookie, and
 *   drops any logged-in user id, so the comment is attributed to the identity.
 * - comment_post records the identity as meta, so the comment is self-contained
 *   and nothing has to look the author up later.
 */
class Comment_Hooks {

	/**
	 * The identity applied to the comment in flight, carried from
	 * preprocess_comment to comment_post.
	 *
	 * @var array|null
	 */
	private static $applied = null;

	/**
	 * Register the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'pre_comment_on_post', array( __CLASS__, 'lift_gates' ), 1 );
		add_filter( 'preprocess_comment', array( __CLASS__, 'apply_identity' ), 0 );
		add_action( 'comment_post', array( __CLASS__, 'store_meta' ), 10, 1 );
	}

	/**
	 * Treat a WordPress.com-vouched commenter as a registered one.
	 *
	 * @return void
	 */
	public static function lift_gates() {
		if ( is_user_logged_in() || false === Passport::read() ) {
			return;
		}

		add_filter( 'pre_option_comment_registration', '__return_zero' );
		add_filter( 'pre_option_require_name_email', '__return_zero' );
	}

	/**
	 * Attribute the comment to the redeemed identity.
	 *
	 * @param array $comment_data The comment being posted.
	 * @return array
	 */
	public static function apply_identity( $comment_data ) {
		self::$applied = null;

		if ( is_user_logged_in() ) {
			return $comment_data;
		}

		$identity = Passport::read();
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

		self::$applied = $identity;

		return $comment_data;
	}

	/**
	 * Record the identity on the comment.
	 *
	 * @param int $comment_id The new comment's ID.
	 * @return void
	 */
	public static function store_meta( $comment_id ) {
		if ( null === self::$applied ) {
			return;
		}

		$identity      = self::$applied;
		self::$applied = null;

		add_comment_meta( $comment_id, Checkpoint::META_SUB, $identity['sub'], true );
		add_comment_meta( $comment_id, Checkpoint::META_PROVIDER, $identity['provider'], true );

		if ( '' !== $identity['avatar'] ) {
			add_comment_meta( $comment_id, Checkpoint::META_AVATAR, $identity['avatar'], true );
		}
	}
}
