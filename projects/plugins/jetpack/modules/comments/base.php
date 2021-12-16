<?php

/**
 * All the code shared between WP.com Highlander and Jetpack Highlander
 */
class Highlander_Comments_Base {
	function __construct() {
		$this->setup_globals();
		$this->setup_actions();
		$this->setup_filters();
	}

	/**
	 * Set any global variables or class variables
	 * @since JetpackComments (1.4)
	 */
	protected function setup_globals() {}

	/**
	 * Setup actions for methods in this class
	 * @since JetpackComments (1.4)
	 */
	protected function setup_actions() {
		// Before a comment is posted
		add_action( 'pre_comment_on_post', array( $this, 'allow_logged_out_user_to_comment_as_external' ) );

		// After a comment is posted
		add_action( 'comment_post', array( $this, 'set_comment_cookies' ) );
	}

	/**
	 * Setup filters for methods in this class
	 * @since JetpackComments (1.4)
	 */
	protected function setup_filters() {
		add_filter( 'comments_array', array( $this, 'comments_array' ) );
		add_filter( 'preprocess_comment', array( $this, 'allow_logged_in_user_to_comment_as_guest' ), 0 );
	}

	/**
	 * Is this a Highlander POST request?
	 * Optionally restrict to one or more credentials slug (facebook, twitter, ...)
	 *
	 * @param string Comment credentials slug
	 * @param ...
	 * @return false|string false if it's not a Highlander POST request.  The matching credentials slug if it is.
	 */
	function is_highlander_comment_post( ...$args ) {
		if ( empty( $_POST['hc_post_as'] ) ) {
			return false;
		}

		if ( $args ) {
			foreach ( $args as $id_source ) {
				if ( $id_source === $_POST['hc_post_as'] ) {
					return $id_source;
				}
			}
			return false;
		}

		return is_string( $_POST['hc_post_as'] ) && in_array( $_POST['hc_post_as'], $this->id_sources ) ? $_POST['hc_post_as'] : false;
	}

	/**
	 * Signs an array of scalars with the self-hosted blog's Jetpack Token
	 *
	 * @param array $parameters
	 * @param string $key
	 * @return string HMAC
	 */
	static function sign_remote_comment_parameters( $parameters, $key ) {
		unset(
			$parameters['sig'],       // Don't sign the signature
			$parameters['replytocom'] // This parameter is unsigned - it changes dynamically as the comment form moves from parent comment to parent comment
		);

		ksort( $parameters );

		$signing = array();
		foreach ( $parameters as $k => $v ) {
			if ( ! is_scalar( $v ) ) {
				return new WP_Error( 'invalid_input', __( 'Invalid request', 'jetpack' ), array( 'status' => 400 ) );
			}

			$signing[] = "{$k}={$v}";
		}

		return hash_hmac( 'sha1', implode( ':', $signing ), $key );
	}

	/*
	  * After commenting as a guest while logged in, the user needs to see both:
	 *
	 * ( user_id = blah AND comment_approved = 0 )
	 * and
	 * ( comment_author_email = blah AND comment_approved = 0 )
	 *
	  * Core only does the first since the user is logged in.
	  *
	  * Add the second to the comments array.
	  */
	function comments_array( $comments ) {
		global $wpdb, $post;

		$commenter = $this->get_current_commenter();

		if ( ! $commenter['user_id'] ) {
			return $comments;
		}

		if ( ! $commenter['comment_author'] ) {
			return $comments;
		}

		$in_moderation_comments = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM `$wpdb->comments` WHERE `comment_post_ID` = %d AND `user_id` = 0 AND `comment_author` = %s AND `comment_author_email` = %s AND `comment_approved` = '0' ORDER BY `comment_date_gmt` /* Highlander_Comments_Base::comments_array() */",
				$post->ID,
				wp_specialchars_decode( $commenter['comment_author'], ENT_QUOTES ),
				$commenter['comment_author_email']
			)
		);

		if ( ! $in_moderation_comments ) {
			return $comments;
		}

		// @todo ZOMG this is a bad idea
		$comments = array_merge( $comments, $in_moderation_comments );
		usort( $comments, array( $this, 'sort_comments_by_comment_date_gmt' ) );

		return $comments;
	}

	/**
	 * Comment sort comparator: comment_date_gmt
	 *
	 * @since JetpackComments (1.4)
	 * @param object $a
	 * @param object $b
	 * @return int
	 */
	public function sort_comments_by_comment_date_gmt( $a, $b ) {
		if ( $a->comment_date_gmt == $b->comment_date_gmt ) {
			return 0;
		}

		return $a->comment_date_gmt < $b->comment_date_gmt ? -1 : 1;
	}

	/**
	 * Get the current commenter's information from their cookie
	 *
	 * @since JetpackComments (1.4)
	 * @return array Commenters information from cookie
	 */
	protected function get_current_commenter() {
		// Defaults
		$user_id              = 0;
		$comment_author       = '';
		$comment_author_email = '';
		$comment_author_url   = '';

		if ( isset( $_COOKIE[ 'comment_author_' . COOKIEHASH ] ) ) {
			$comment_author = $_COOKIE[ 'comment_author_' . COOKIEHASH ];
		}

		if ( isset( $_COOKIE[ 'comment_author_email_' . COOKIEHASH ] ) ) {
			$comment_author_email = $_COOKIE[ 'comment_author_email_' . COOKIEHASH ];
		}

		if ( isset( $_COOKIE[ 'comment_author_url_' . COOKIEHASH ] ) ) {
			$comment_author_url = $_COOKIE[ 'comment_author_url_' . COOKIEHASH ];
		}

		if ( is_user_logged_in() ) {
			$user    = wp_get_current_user();
			$user_id = $user->ID;
		}

		return compact( 'comment_author', 'comment_author_email', 'comment_author_url', 'user_id' );
	}

	/**
	 * Allows a logged out user to leave a comment as a facebook or twitter credentialed user.
	 * Overrides WordPress' core comment_registration option to treat these commenters as "registered" (verified) users.
	 *
	 * @since JetpackComments (1.4)
	 * @return If no
	 */
	function allow_logged_out_user_to_comment_as_external() {
		if ( ! $this->is_highlander_comment_post( 'facebook', 'twitter', 'googleplus' ) ) {
			return;
		}

		add_filter( 'pre_option_comment_registration', '__return_zero' );
		add_filter( 'pre_option_require_name_email', '__return_zero' );
	}

	/**
	 * Allow a logged in user to post as a guest, FB, or twitter credentialed request.
	 * Bypasses WordPress' core overrides that force a logged in user to comment as that user.
	 * Respects comment_registration option.
	 *
	 * @since JetpackComments (1.4)
	 * @param array $comment_data
	 * @return int
	 */
	function allow_logged_in_user_to_comment_as_guest( $comment_data ) {
		// Bail if user registration is allowed
		if ( get_option( 'comment_registration' ) ) {
			return $comment_data;
		}

		// Bail if user is not logged in or not a post request
		if ( 'POST' != strtoupper( $_SERVER['REQUEST_METHOD'] ) || ! is_user_logged_in() ) {
			return $comment_data;
		}

		// Bail if this is not a guest or external service credentialed request
		if ( ! $this->is_highlander_comment_post( 'guest', 'facebook', 'twitter', 'googleplus' ) ) {
			return $comment_data;
		}

		$user = wp_get_current_user();

		foreach ( array(
			'comment_author'       => 'display_name',
			'comment_author_email' => 'user_email',
			'comment_author_url'   => 'user_url',
		) as $comment_field => $user_field ) {
			if ( $comment_data[ $comment_field ] != addslashes( $user->$user_field ) ) {
				return $comment_data; // some other plugin already did something funky
			}
		}

		if ( get_option( 'require_name_email' ) ) {
			if ( 6 > strlen( $_POST['email'] ) || empty( $_POST['author'] ) ) {
				wp_die( __( 'Error: please fill the required fields (name, email).', 'jetpack' ), 400 );
			} elseif ( ! is_email( $_POST['email'] ) ) {
				wp_die( __( 'Error: please enter a valid email address.', 'jetpack' ), 400 );
			}
		}

		$author_change = false;
		foreach ( array(
			'comment_author'       => 'author',
			'comment_author_email' => 'email',
			'comment_author_url'   => 'url',
		) as $comment_field => $post_field ) {
			if ( $comment_data[ $comment_field ] != $_POST[ $post_field ] && 'url' != $post_field ) {
				$author_change = true;
			}
			$comment_data[ $comment_field ] = $_POST[ $post_field ];
		}

		// Mark as guest comment if name or email were changed
		if ( $author_change ) {
			$comment_data['user_id'] = $comment_data['user_ID'] = 0;
		}

		return $comment_data;
	}

	/**
	 * Set the comment cookies or bail if comment is invalid
	 *
	 * @since JetpackComments (1.4)
	 * @param type $comment_id
	 * @return If comment is invalid
	 */
	public function set_comment_cookies( $comment_id ) {
		// Get comment and bail if it's invalid somehow
		$comment = get_comment( $comment_id );
		if ( empty( $comment ) || is_wp_error( $comment ) ) {
			return;
		}

		$id_source = $this->is_highlander_comment_post();
		if ( empty( $id_source ) ) {
			return;
		}

		// Set comment author cookies
		// phpcs:ignore WordPress.WP.CapitalPDangit
		if ( ( 'wordpress' != $id_source ) && is_user_logged_in() ) {
			/** This filter is already documented in core/wp-includes/comment-functions.php */
			$comment_cookie_lifetime = apply_filters( 'comment_cookie_lifetime', 30000000 );
			setcookie( 'comment_author_' . COOKIEHASH, $comment->comment_author, time() + $comment_cookie_lifetime, COOKIEPATH, COOKIE_DOMAIN );
			setcookie( 'comment_author_email_' . COOKIEHASH, $comment->comment_author_email, time() + $comment_cookie_lifetime, COOKIEPATH, COOKIE_DOMAIN );
			setcookie( 'comment_author_url_' . COOKIEHASH, esc_url( $comment->comment_author_url ), time() + $comment_cookie_lifetime, COOKIEPATH, COOKIE_DOMAIN );
		}
	}

	/**
	 * Get an avatar from Photon
	 *
	 * @since JetpackComments (1.4)
	 * @param string $url
	 * @param int $size
	 * @return string
	 */
	protected function photon_avatar( $url, $size ) {
		$size = (int) $size;

		return jetpack_photon_url( $url, array( 'resize' => "$size,$size" ) );
	}
}
