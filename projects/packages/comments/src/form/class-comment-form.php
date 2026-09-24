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
	 * Singleton instance.
	 *
	 * @var Comment_Form|null
	 */
	private static $instance = null;

	/**
	 * Whether the settings blob has been printed.
	 *
	 * @var bool
	 */
	private $settings_printed = false;

	/**
	 * The form defaults last seen, for the must-log-in branch, which core fires with no arguments.
	 *
	 * @var array
	 */
	private $defaults = array();

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
		add_filter( 'comment_form_fields', array( $this, 'comment_form_fields' ) );
		add_filter( 'comment_form_logged_in', array( $this, 'comment_form_logged_in' ) );
		add_filter( 'comment_form_defaults', array( $this, 'comment_form_defaults' ), 20 );

		// Past 10, where Jetpack Subscriptions adds its checkboxes: this replaces
		// the field wholesale, so it has to see what everyone else has added.
		add_filter( 'comment_form_submit_field', array( $this, 'render' ), 20, 2 );

		add_action( 'comment_form_must_log_in_after', array( $this, 'render_must_log_in' ) );

		add_filter( 'comment_reply_link', array( $this, 'comment_reply_link' ), 10, 4 );

		add_action( 'wp_enqueue_scripts', array( $this, 'register_assets' ) );
		add_action( 'pre_comment_on_post', array( $this, 'verify_nonce' ) );
	}

	/**
	 * Keep Reply moving the form when the site requires registration.
	 *
	 * @param string      $reply_link Markup for the reply link.
	 * @param array       $args       Reply link arguments.
	 * @param \WP_Comment $comment    Comment being replied to.
	 * @param \WP_Post    $post       Post being commented on.
	 * @return string
	 */
	public function comment_reply_link( $reply_link, $args, $comment, $post ) {
		if ( ! get_option( 'comment_registration' ) || ! self::enabled_for_post_type() ) {
			return $reply_link;
		}

		$comment = get_comment( $comment );
		$post    = get_post( $post );

		if ( ! $comment instanceof \WP_Comment || ! $post instanceof \WP_Post ) {
			return $reply_link;
		}

		$respond_id = esc_attr( $args['respond_id'] );
		$reply_url  = esc_url( add_query_arg( 'replytocom', $comment->comment_ID . '#' . $respond_id ) );

		$reply_to = sprintf( $args['reply_to_text'], get_comment_author( $comment ) );

		$link = sprintf(
			'<a class="comment-reply-link" href="%s"%s onclick="return addComment.moveForm( \'%s-%d\', \'%d\', \'%s\', \'%d\' )">%s</a>',
			$reply_url,
			$args['show_reply_to_text'] ? '' : ' aria-label="' . esc_attr( $reply_to ) . '"',
			esc_attr( $args['add_below'] ),
			$comment->comment_ID,
			$comment->comment_ID,
			$respond_id,
			$post->ID,
			wp_kses( $args['show_reply_to_text'] ? $reply_to : $args['reply_text'], self::reply_text_html() )
		);

		return wp_kses( $args['before'], wp_kses_allowed_html( 'post' ) )
			. $link
			. wp_kses( $args['after'], wp_kses_allowed_html( 'post' ) );
	}

	/**
	 * Markup a theme may put inside its reply link, such as an icon.
	 *
	 * @return array
	 */
	private static function reply_text_html() {
		return array(
			'svg' => array(
				'class'           => true,
				'aria-hidden'     => true,
				'aria-labelledby' => true,
				'role'            => true,
				'xmlns'           => true,
				'width'           => true,
				'height'          => true,
				'viewbox'         => true,
			),
			'use' => array(
				'href'       => true,
				'xlink:href' => true,
			),
		);
	}

	/**
	 * Whether this form should replace core's for a post's type.
	 *
	 * @param int|null $post_id Post being commented on. Defaults to the current one.
	 * @return bool
	 */
	public static function enabled_for_post_type( $post_id = null ) {
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
	 * Set the form arguments the app reads back out.
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

		$greeting = get_option( 'highlander_comment_form_prompt' );
		if ( is_string( $greeting ) && $greeting !== '' ) {
			$defaults['title_reply'] = $greeting;
		}

		$this->defaults = array_merge( $args, $defaults );

		return $this->defaults;
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

		$args['subscriptions'] = self::subscriptions( $submit_field );

		// Fires after this filter, and would draw the subscribe options again below the form.
		remove_action( 'comment_form', 'subscription_comment_form' );

		$this->enqueue_assets( $args );

		return $this->markup( $args );
	}

	/**
	 * The subscribe checkboxes each host draws itself, read back to draw in the
	 * dialog under the host's own field names: Jetpack Subscriptions appends its
	 * own to the submit field at priority 10, and WordPress.com has a function.
	 *
	 * @param string $submit_field The submit field after the filters before this one.
	 * @return array Each with the field `name`, the `label` to show and whether it starts `checked`.
	 */
	private static function subscriptions( $submit_field ) {
		$drawn = $submit_field;

		if ( function_exists( 'subscription_comment_form' ) ) {
			$drawn .= (string) subscription_comment_form( self::post_id(), false );
		}

		$labels = array(
			'subscribe_comments' => __( 'Notify me of new comments by email.', 'jetpack-comments' ),
			'subscribe'          => __( 'Notify me of new comments by email.', 'jetpack-comments' ),
			'subscribe_blog'     => sprintf(
				/* translators: %s is the site's name. */
				__( 'Subscribe to keep up with %s.', 'jetpack-comments' ),
				get_bloginfo( 'name' )
			),
		);

		$subscriptions = array();

		foreach ( $labels as $name => $label ) {
			if ( preg_match( '/<input\b[^>]*\bname="' . $name . '"[^>]*>/', $drawn, $input ) ) {
				$subscriptions[] = array(
					'name'    => $name,
					'label'   => $label,
					'checked' => false !== strpos( $input[0], 'checked' ),
				);
			}
		}

		return $subscriptions;
	}

	/**
	 * Draw the app, and a form to hold it, on the must-log-in branch.
	 *
	 * @return void
	 */
	public function render_must_log_in() {
		if ( ! self::enabled_for_post_type() ) {
			return;
		}

		$args = $this->defaults;

		// Core skips the submit field on this branch, so the hosts never draw their
		// checkboxes. Run that filter here without this class on it, to ask them.
		remove_filter( 'comment_form_submit_field', array( $this, 'render' ), 20 );
		$args['subscriptions'] = self::subscriptions( (string) apply_filters( 'comment_form_submit_field', '', $args ) );
		add_filter( 'comment_form_submit_field', array( $this, 'render' ), 20, 2 );

		$this->enqueue_assets( $args );

		printf(
			'<form action="%s" method="post" id="commentform" class="comment-form">%s</form>',
			esc_url( site_url( '/wp-comments-post.php' ) ),
			$this->markup( $args ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped as it is built.
		);
	}

	/**
	 * The app's mount point, and the hidden fields it posts with.
	 *
	 * @param array $args Comment form arguments.
	 * @return string
	 */
	private function markup( $args = array() ) {
		return '<div class="jetpack-comments"'
			. ' data-jetpack-comments="' . esc_attr(
				(string) wp_json_encode(
					self::form_settings( $args ),
					JSON_UNESCAPED_SLASHES | JSON_HEX_AMP
				)
			) . '"></div>'
			. '<div class="jetpack-comments__fields">'
			. get_comment_id_fields( self::post_id() )
			. wp_nonce_field( self::NONCE_ACTION, self::NONCE_NAME, false, false )
			. '</div>';
	}

	/**
	 * The post being commented on.
	 *
	 * @return int
	 */
	private static function post_id() {
		$post = get_post();

		return $post ? $post->ID : 0;
	}

	/**
	 * Register the bundle, and the stylesheet on a singular view.
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
		$lengths = wp_get_comment_fields_max_lengths();

		return array_merge(
			array(
				'requireNameEmail' => (bool) get_option( 'require_name_email' ),
				'mustLogIn'        => (bool) get_option( 'comment_registration' ) && ! is_user_logged_in(),
				'maxLength'        => isset( $lengths['comment_content'] ) ? (int) $lengths['comment_content'] : 65525,
				'site'             => array(
					'name'    => get_bloginfo( 'name' ),
					'iconUrl' => (string) get_site_icon_url( 64 ),
				),
				'subscriptions'    => self::subscriptions_links(),
				'strings'          => self::strings( $args ),
			),
			Identity::settings()
		);
	}

	/**
	 * Where a reader manages their subscriptions to this site, the way the Action Bar links it.
	 *
	 * A WordPress.com account manages them in the Reader: the subscription itself
	 * when the site knows it exists, else the list filtered to this site. Anyone
	 * else manages them by email address. The page is cached for a reader the popup
	 * signs in, so their link is decided in the browser from `signedInUrl`.
	 *
	 * @return array `url` and `byEmail` for the reader the page rendered for, and `signedInUrl`. All empty where the host offers no subscriptions.
	 */
	private static function subscriptions_links() {
		$links = array(
			'url'         => '',
			'byEmail'     => true,
			'signedInUrl' => '',
		);

		if ( ! function_exists( 'subscription_comment_form' ) && ! class_exists( 'Jetpack_Subscriptions' ) ) {
			return $links;
		}

		$host = (string) wp_parse_url( home_url(), PHP_URL_HOST );

		$links['url']         = 'https://subscribe.wordpress.com/';
		$links['signedInUrl'] = 'https://wordpress.com/reader/subscriptions?s=' . rawurlencode( $host );

		if ( ! is_user_logged_in() || ! function_exists( 'wpcom_subs_is_subscribed' ) ) {
			return $links;
		}

		$subscription_id = wpcom_subs_is_subscribed(
			array(
				'user_id' => get_current_user_id(),
				'blog_id' => Checkpoint::blog_id(),
			)
		);

		$links['byEmail'] = false;
		$links['url']     = $subscription_id
			? 'https://wordpress.com/reader/subscriptions/' . (int) $subscription_id
			: $links['signedInUrl'];

		return $links;
	}

	/**
	 * Values belonging to one form, rather than to the page it sits on.
	 *
	 * @param array $args Comment form arguments.
	 * @return array
	 */
	private static function form_settings( $args ) {
		$post_id   = self::post_id();
		$permalink = get_permalink( $post_id );

		$id    = $args['id_submit'] ?? 'submit';
		$name  = $args['name_submit'] ?? 'submit';
		$label = $args['label_submit'] ?? _x( 'Comment', 'verb', 'jetpack-comments' );

		// The classes come from the button template, not class_submit: on a block
		// theme the Post Comments Form block bakes the theme's button classes into it.
		$button = sprintf(
			$args['submit_button'] ?? '<input name="%1$s" type="submit" id="%2$s" class="%3$s" value="%4$s" />',
			esc_attr( $name ),
			esc_attr( $id ),
			esc_attr( $args['class_submit'] ?? 'submit' ),
			esc_attr( $label )
		);
		$class  = preg_match( '/\bclass="([^"]*)"/', $button, $match ) ? $match[1] : 'submit';

		$settings = array(
			'postId'          => $post_id,
			'loginUrl'        => wp_login_url( $permalink ),
			'logoutUrl'       => '',
			'submitId'        => $id,
			'submitName'      => $name,
			'submitClass'     => $class,
			// The block wraps its button the way the Buttons block does, so block-level button styles reach it.
			'submitWrapClass' => false !== strpos( $class, 'wp-block-button__link' ) ? 'wp-block-button' : '',
			'submitLabel'     => $label,
			'subscriptions'   => $args['subscriptions'] ?? array(),
		);

		if ( is_user_logged_in() ) {
			// wp_logout_url() runs the URL through esc_html(), which encodes single quotes too.
			$settings['logoutUrl'] = html_entity_decode( wp_logout_url( $permalink ), ENT_QUOTES );
		}

		return $settings;
	}

	/**
	 * The copy the app renders.
	 *
	 * @param array $args Comment form arguments.
	 * @return array
	 */
	private static function strings( $args ) {
		$strings = array(
			'reply'               => _x( 'Reply', 'verb', 'jetpack-comments' ),
			'commentLabel'        => _x( 'Comment', 'noun', 'jetpack-comments' ),
			'replyLabel'          => _x( 'Reply', 'noun', 'jetpack-comments' ),
			'placeholder'         => __( 'Write a comment...', 'jetpack-comments' ),
			'replyPlaceholder'    => __( 'Write a reply...', 'jetpack-comments' ),
			'name'                => __( 'Name', 'jetpack-comments' ),
			'email'               => __( 'Email', 'jetpack-comments' ),
			'emailHint'           => __( 'Address never made public', 'jetpack-comments' ),
			'website'             => __( 'Website (optional)', 'jetpack-comments' ),
			'intro'               => __( 'Add your name and email to post your comment.', 'jetpack-comments' ),
			'saveAndPost'         => __( 'Save and post comment', 'jetpack-comments' ),
			'postWithoutSaving'   => __( 'No, thanks. I just want to post a comment', 'jetpack-comments' ),
			'close'               => __( 'Close', 'jetpack-comments' ),
			'edit'                => __( 'Edit', 'jetpack-comments' ),
			'manageSubscriptions' => __( 'Manage subscriptions', 'jetpack-comments' ),
			'logInToComment'      => __( 'Log in to comment', 'jetpack-comments' ),
			'logInWithWordPress'  => __( 'Log in with WordPress.com', 'jetpack-comments' ),
			'logOut'              => __( 'Log out', 'jetpack-comments' ),
			/* translators: %s is the commenter's name. */
			'commentingAs'        => __( 'Commenting as %s', 'jetpack-comments' ),
			'cancel'              => __( 'Cancel', 'jetpack-comments' ),
			'signInFailed'        => __( 'We could not sign you in. Please try again.', 'jetpack-comments' ),
			'signInRateLimited'   => __( 'Too many sign-in attempts. Please wait a moment and try again.', 'jetpack-comments' ),
		);

		/**
		 * Filter the copy the comment form renders.
		 *
		 * @since 0.1.0
		 *
		 * @param array $strings Keyed by the name the app reads.
		 * @param array $args    Comment form arguments.
		 */
		return apply_filters( 'jetpack_comments_strings', $strings, $args );
	}

	/**
	 * Require a comment to arrive with a nonce this site issued.
	 *
	 * Worth being plain about the strength of this. For a logged-in reader the
	 * nonce is tied to their session and is real CSRF cover. For a logged-out one
	 * it is the same string for everybody, for up to 24 hours, so it proves the
	 * sender loaded a page from this site and nothing more.
	 *
	 * @param int $comment_post_id The post being commented on.
	 * @return void
	 */
	public function verify_nonce( $comment_post_id = 0 ) {
		if ( ! self::enabled_for_post_type( $comment_post_id ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- this is the nonce check.
		$nonce = isset( $_POST[ self::NONCE_NAME ] ) ? sanitize_text_field( wp_unslash( $_POST[ self::NONCE_NAME ] ) ) : '';

		if ( wp_verify_nonce( $nonce, self::NONCE_ACTION ) ) {
			return;
		}

		if ( self::verify_logged_out_nonce( $nonce ) ) {
			return;
		}

		wp_die(
			esc_html__( 'Sorry, this comment could not be posted. Go back and try again.', 'jetpack-comments' ),
			esc_html__( 'Comment Submission Failure', 'jetpack-comments' ),
			array(
				'response'  => 403,
				'back_link' => true,
			)
		);
	}

	/**
	 * Check a nonce against the one a logged-out reader would have been given.
	 *
	 * A page cache can hand a logged-in reader a copy rendered for nobody, so the
	 * nonce they post is the anonymous one. wp_verify_nonce() hashes the user ID
	 * together with wp_get_session_token(), and that token is read from the
	 * logged-in cookie rather than from the current user, so clearing the user is
	 * not enough on its own: the cookie has to go too, or the hash still carries
	 * their session and can never match what an anonymous visitor was served.
	 *
	 * @param string $nonce The nonce submitted with the comment.
	 * @return bool
	 */
	private static function verify_logged_out_nonce( $nonce ) {
		if ( ! defined( 'LOGGED_IN_COOKIE' ) || ! isset( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
			// Nothing to strip, so the check above already ran as this reader.
			return false;
		}

		$user_id = get_current_user_id();

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- Stashed and put back untouched, for core to read as it would have.
		$cookie = $_COOKIE[ LOGGED_IN_COOKIE ];

		unset( $_COOKIE[ LOGGED_IN_COOKIE ] );
		wp_set_current_user( 0 );

		$valid = (bool) wp_verify_nonce( $nonce, self::NONCE_ACTION );

		$_COOKIE[ LOGGED_IN_COOKIE ] = $cookie;
		wp_set_current_user( $user_id );

		return $valid;
	}
}
