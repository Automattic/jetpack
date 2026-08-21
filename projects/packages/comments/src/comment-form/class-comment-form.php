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

		add_filter( 'comment_form_submit_field', array( $this, 'render' ), 10, 2 );

		add_action( 'comment_form_must_log_in_after', array( $this, 'render_must_log_in' ) );

		add_filter( 'comment_reply_link', array( $this, 'comment_reply_link' ), 10, 4 );

		add_action( 'wp_enqueue_scripts', array( $this, 'register_assets' ) );
		add_action( 'pre_comment_on_post', array( $this, 'verify_nonce' ) );

		remove_action( 'comment_form', 'subscription_comment_form' );
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

		$link = sprintf(
			'<a class="comment-reply-link" href="%s" onclick="return addComment.moveForm( \'%s-%d\', \'%d\', \'%s\', \'%d\' )">%s</a>',
			$reply_url,
			esc_attr( $args['add_below'] ),
			$comment->comment_ID,
			$comment->comment_ID,
			$respond_id,
			$post->ID,
			wp_kses( $args['reply_text'], self::reply_text_html() )
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

		return $this->markup( $args );
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
	 * @param array $args Comment form arguments.
	 * @return string
	 */
	private function markup( $args = array() ) {
		return '<div class="jetpack-comments ' . esc_attr( self::color_scheme() ) . '"'
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
	 * The colour scheme the site has chosen.
	 *
	 * @return string
	 */
	private static function color_scheme() {
		$scheme = get_option( 'jetpack_comment_form_color_scheme', 'transparent' );

		return in_array( $scheme, array( 'transparent', 'light', 'dark' ), true ) ? $scheme : 'transparent';
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
				'requireNameEmail'   => (bool) get_option( 'require_name_email' ),
				'showCookiesConsent' => (bool) get_option( 'show_comments_cookies_opt_in' ),
				'mustLogIn'          => (bool) get_option( 'comment_registration' ) && ! is_user_logged_in(),
				'maxLength'          => isset( $lengths['comment_content'] ) ? (int) $lengths['comment_content'] : 65525,
				'strings'            => self::strings( $args ),
			),
			Identity::settings()
		);
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

		$settings = array(
			'postId'      => $post_id,
			'loginUrl'    => wp_login_url( $permalink ),
			'logoutUrl'   => '',
			'submitId'    => $args['id_submit'] ?? 'submit',
			'submitName'  => $args['name_submit'] ?? 'submit',
			'submitLabel' => $args['label_submit'] ?? _x( 'Comment', 'verb', 'jetpack-comments' ),
		);

		if ( is_user_logged_in() ) {
			$settings['logoutUrl'] = html_entity_decode( wp_logout_url( $permalink ), ENT_COMPAT );
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
			'emailPlaceholder'    => __( 'Email (Address never made public)', 'jetpack-comments' ),
			'website'             => __( 'Website', 'jetpack-comments' ),
			'websitePlaceholder'  => __( 'Website (Optional)', 'jetpack-comments' ),
			'guestPrompt'         => __( 'Leave a comment.', 'jetpack-comments' ),
			'mustLogInPrompt'     => __( 'Log in to leave a comment.', 'jetpack-comments' ),
			'logIn'               => __( 'Log in', 'jetpack-comments' ),
			'guestPromptRequired' => __( 'Provide your name and email to leave a comment.', 'jetpack-comments' ),
			'saveDetails'         => __( 'Save my name, email, and website in this browser for the next time I comment.', 'jetpack-comments' ),
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
		if ( ! self::enabled_for_post_type( $comment_post_id ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- this is the nonce check.
		$nonce = isset( $_POST[ self::NONCE_NAME ] ) ? sanitize_text_field( wp_unslash( $_POST[ self::NONCE_NAME ] ) ) : '';

		if ( wp_verify_nonce( $nonce, self::NONCE_ACTION ) ) {
			return;
		}

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
