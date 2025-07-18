<?php // phpcs:ignore
/**
 * Plugin Name: Jetpack MU WPCom Comment Likes
 * Description: Adds a "Like" action to comment rows and enqueues the necessary assets in the admin area.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) && ( ! defined( 'IS_ATOMIC' ) || ! IS_ATOMIC ) ) {
	return;
}

/**
 * WPCom Comments Likes functionality in a singleton pattern.
 */
class WPCom_Comments_Likes {
	/**
	 * Singleton instance.
	 *
	 * @var WPCom_Comments_Likes
	 */
	private static $instance = null;

	/**
	 * Flag to track if hooks have been initialized.
	 *
	 * @var bool
	 */
	private $initialized = false;

	/**
	 * Private constructor to prevent direct instantiation.
	 */
	private function __construct() {
		// Register REST API for Atomic sites.
		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			add_action( 'rest_api_init', array( $this, 'register_like_api' ) );
		}

		add_action( 'current_screen', array( $this, 'init' ) );
	}

	/**
	 * Get the singleton instance.
	 *
	 * @return WPCom_Comments_Likes
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Initialize the comment likes functionality if enabled.
	 */
	public function init() {
		// Only initialize if comment likes are enabled.
		if ( ! $this->is_comment_likes_enabled() ) {
			return;
		}

		if ( ! is_admin() ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || 'edit-comments' !== $screen->id ) {
			return;
		}

		add_filter( 'comment_class', array( $this, 'add_like_class' ), 10, 3 );
		add_filter( 'comment_row_actions', array( $this, 'enable_likes' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ), 10, 2 );
	}

	/**
	 * Check if comment likes are enabled.
	 *
	 * This is currently only expected to work for WoW sites.
	 *
	 * @return bool True if comment likes are enabled, false otherwise.
	 */
	private function is_comment_likes_enabled() {
		// @phan-suppress-next-line PhanUndeclaredClassReference
		if ( class_exists( 'Jetpack' ) && method_exists( 'Jetpack', 'is_module_active' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			return Jetpack::is_module_active( 'comment-likes' );
		}

		return false;
	}

	/**
	 * Do a comment like API request.
	 *
	 * @param int $blog_id    The blog ID.
	 * @param int $comment_id The comment ID.
	 * @return bool|WP_Error True if the comment is liked, false otherwise, or a WP_Error if the request fails.
	 */
	private function do_comment_like_api_request( $blog_id, $comment_id ) {
		$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			"/sites/$blog_id/comments/$comment_id/likes",
			'v1.1',
			array( 'method' => 'GET' ),
			null,
			'rest'
		);

		// If the request fails, simply return the unmodified classes.
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_data = json_decode( wp_remote_retrieve_body( $response ), true );

		return ! empty( $response_data['i_like'] ?? false );
	}

	/**
	 * Adds a "liked" class to comments that the current user has liked.
	 *
	 * @param array  $classes    Array of comment classes.
	 * @param string $css_class  Unused.
	 * @param int    $comment_id The comment ID.
	 * @return array Modified array of comment classes.
	 */
	public function add_like_class( $classes, $css_class, $comment_id ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
			$liked   = Likes::comment_like_current_user_likes( $blog_id, $comment_id );
		} else {
			$blog_id = Jetpack_Options::get_option( 'id' );

			$liked = $this->do_comment_like_api_request( $blog_id, $comment_id );

			if ( is_wp_error( $liked ) ) {
				return $classes;
			}
		}

		// Append the 'liked' class if the comment is liked.
		if ( $liked ) {
			$classes[] = 'liked';
		}

		return $classes;
	}

	/**
	 * Adds "Like" and "Unlike" action buttons to comment rows.
	 *
	 * @param array      $actions Array of actions for the comment.
	 * @param WP_Comment $comment The comment object.
	 * @return array Modified actions array.
	 */
	public function enable_likes( $actions, $comment ) {
		$actions['like'] = sprintf(
			'<button class="button-link comment-like-button" data-comment-id="%d" aria-label="%s">%s</button>',
			$comment->comment_ID,
			esc_attr__( 'Like this comment', 'jetpack-mu-wpcom' ),
			esc_html__( 'Like', 'jetpack-mu-wpcom' )
		);

		$actions['unlike'] = sprintf(
			'<button class="button-link comment-unlike-button" data-comment-id="%d" aria-label="%s">%s</button>',
			$comment->comment_ID,
			esc_attr__( 'Unlike this comment', 'jetpack-mu-wpcom' ),
			esc_html__( 'Liked by you', 'jetpack-mu-wpcom' )
		);

		return $actions;
	}

	/**
	 * Enqueues the comment like assets (JavaScript and CSS) on the Edit Comments screen.
	 *
	 * @param string $hook The current admin page hook.
	 */
	public function enqueue_scripts( $hook ) {
		// Only enqueue assets on the edit-comments screen.
		if ( 'edit-comments.php' !== $hook ) {
			return;
		}

		// Enqueue the assets using the Jetpack MU WPCom helper function.
		jetpack_mu_wpcom_enqueue_assets( 'wpcom-comment-like', array( 'js', 'css' ) );

		// Localize the script with error messages.
		wp_localize_script(
			'jetpack-mu-wpcom-wpcom-comment-like',
			'wpcomCommentLikesData',
			array(
				'post_like_error'     => __( 'Something went wrong when attempting to like that comment. Please try again.', 'jetpack-mu-wpcom' ),
				'post_unlike_error'   => __( 'Something went wrong when attempting to unlike that comment. Please try again.', 'jetpack-mu-wpcom' ),
				'dismiss_notice_text' => __( 'Dismiss this notice', 'jetpack-mu-wpcom' ),
			)
		);
	}

	/**
	 * Register an API to handle Likes on Atomic sites.
	 */
	public function register_like_api() {
		require_once __DIR__ . '/class-wp-rest-comment-like.php';
		$controller = new WP_REST_Comment_Like();
		$controller->register_routes();
	}
}

WPCom_Comments_Likes::get_instance();
