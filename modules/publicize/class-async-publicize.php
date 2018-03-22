<?php
/**
 * Provides REST endpoints to accommodate asynchronous Publicize use
 *
 * Provides REST endpoints to publish a post without publicizing and to publicize
 * an already published post. Publicize was originally written to publicize
 * a post right as it's being published. This class extends the standard
 * Publicize behavior to accommodate user interface designs
 * that separate publish and publicize actions (i.e. in Gutenberg).
 *
 * @package Jetpack
 * @subpackage Publicize
 * @since 5.9.1
 */

/**
 * Class to set up asynchronous (publish and later publicize) support.
 *
 * This class sets up REST endpoints for publishing posts and then
 * later sharing them with Publicize.
 *
 * @since 5.9.1
 */
class Async_Publicize {
	/**
	 * Instance of publicize class, used to access helper methods.
	 *
	 * @since 5.9.1
	 * @var  Publicize $publicize
	 */
	protected $publicize;

	/**
	 * Meta key name to flag publishing posts that should not be publicized.
	 *
	 * @since 5.9.1
	 * @var string $PUBLICIZE_BLOCK_META_KEY
	 */
	const PUBLICIZE_BLOCK_META_KEY = '_NO_PUBLICIZE';

	/**
	 * Time out in seconds before PUBLICIZE_BLOCK_META_KEY meta key expires.
	 *
	 * @since 5.9.1
	 * @var int META_KEY_TIMEOUT_SECONDS
	 */
	const META_KEY_TIMEOUT_SECONDS = 60 * 5;

	/**
	 * Cosntructor for Async_Publicize
	 *
	 * Set up hooks to extend legacy Publicize behavior.
	 *
	 * @since 5.9.1
	 */
	public function __construct() {
		add_action( 'rest_api_init', function () {
			register_rest_route( 'publicize/', '/posts/(?P<post_id>\d+)/flag-no-publicize', array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'flag_post_no_publicize' ),
				'post_id'             => array(
					'validate_post_id' => function( $param, $request, $key ) {
						return is_int( $param );
					},
				),
				'permission_callback' => function () {
					return current_user_can( 'publish_posts' );
				},
			) );
		} );

		// This filter is documented in publicize-jetpack.php.
		add_filter( 'publicize_should_publicize_published_post', array( $this, 'can_publicize' ), 1, 2 );

		// Setup callback to do cleanup after the post has actually been published
		add_action( 'jetpack_published_post', array( $this, 'post_publish_cleanup' ), 10, 2 );

		// Do post edit page specific setup.
		add_action( 'admin_enqueue_scripts', array( $this, 'post_page_enqueue' ) );
	}

	/**
	 * Completes any necessary cleanup after a post is published.
	 *
	 * Does cleanup after Jetpack is finished sending post for publish.
	 * Useful for cleaning up the temporary meta key that blocks publicize.
	 *
	 * @since 5.9.1
	 *
	 * @param int $post_id ID number of post being published
	 * @param array $flags {@see class.jetpack-sync-module-posts.php/send_published()}
	 */
	public function post_publish_cleanup( $post_id, $flags ) {
		// Clean post meta since it's purpose has been served.
		delete_post_meta( $post_id, self::PUBLICIZE_BLOCK_META_KEY );
	}

	/**
	 * Enqueue scripts when they are needed for the edit page
	 *
	 * Enqueues necessary scripts for edit page.
	 * is open.
	 *
	 * @since 5.9.1
	 *
	 * @param string $hook_suffix File name of current page.
	 */
	public function post_page_enqueue( $hook_suffix ) {
		if ( ( 'post.php' === $hook_suffix || 'post-new.php' === $hook_suffix ) ) {
			wp_enqueue_script( 'async_publicize_js', plugins_url( 'assets/async-publicize.js', __FILE__ ), array( 'jquery' ) );
			wp_localize_script( 'async_publicize_js', 'async_publicize_setup',
				array(
					'api_nonce' => wp_create_nonce( 'wp_rest' ),
					'base_url'  => site_url(),
				)
			);
		}
	}

	/**
	 * Filter function to block publicize on 'async' published post.
	 *
	 * Used as a 'publicize_should_publicize_published_post' filter callback to
	 * block publicize on posts that have been flagged with the
	 * self::PUBLICIZE_BLOCK_META_KEY meta key, which is set
	 * for posts that have been published via {@see 'flag_post_no_publicize()'}.
	 *
	 * @since 5.9.1
	 *
	 * @see publish_wo_publicize()
	 *
	 * @param boolean $should_publicize True of post should be publicized.
	 * @param  WP_Post $post Post instance in question.
	 * @return boolean True if post should be published, false otherwise.
	 */
	public function can_publicize( $should_publicize, $post ) {
		// Catch posts that are being published with asynchronous publicization and don't publicize them.
		if ( metadata_exists( 'post', $post->ID, self::PUBLICIZE_BLOCK_META_KEY ) ) {
			$meta_status = $this->check_async_meta_status( $post->ID );

			if ( 'META_VALID' === $meta_status ) {
				// Don't publicize since the flag has expired.
				return false;
			} else {
				// Publicize post since the meta key has expired.
				return true;
			}
		} else {
			// Publicize post since it hasn't been flagged.
			return true;
		}
	}

	/**
	 * Check if meta key flag for blocking publicize has expired.
	 *
	 * Implement the expiration of PUBLICIZE_BLOCK_META_KEY meta key.
	 * Useful for handling the case where a post is flagged for no publicize
	 * {@see flag_post_no_publicize()} but the publish operation does not
	 * occur. Without a timeout, PUBLICIZE_BLOCK_META_KEY will be in effect
	 * indefinitely, even if the post is later published from classic editor
	 * or other non-Gutenberg source.
	 *
	 * @since 5.9.1
	 *
	 * @param int $post_id ID of post being queried.
	 * @return string Returns 'META_VALID' if not expired, and 'META_EXPIRED' otherwise.
	 */
	public function check_async_meta_status( $post_id ) {
		$time_flagged = get_post_meta( $post_id, self::PUBLICIZE_BLOCK_META_KEY, true );

		if ( is_numeric( $time_flagged ) && ( $time_flagged < time() + self::META_KEY_TIMEOUT_SECONDS ) ) {
			return 'META_VALID';
		}

		return 'META_EXPIRED';
	}

	/**
	 * REST api callback for publishing a post without publicizing it.
	 *
	 * Function exposed as endpoint 'publicize/posts/<post_id>/flag-no-publicize'.
	 * Marks a post (using post meta key) so that it is NOT later publicized.
	 * This should be called if the caller is about to publish a post but does not
	 * want it automatically publicized.
	 *
	 * @since 5.9.1
	 *
	 * @see __construct()
	 *
	 * @param WP_REST_Request $request Request instance from REST call.
	 * @return string|null Result body to return to REST caller
	 */
	public function flag_post_no_publicize( $request ) {
		$post_id = $request['post_id'];

		if ( ! current_user_can( 'publish_post', $post_id ) ) {
			return 'Current user cannot publish this post';
		}

		// If post does not exist.
		if ( get_post_status( $post_id ) === false ) {
			return 'Post ID does not exist';

		}
		if ( get_post_status( $post_id ) === 'publish' ) {
			return 'Post already published.';
		}

		/*
		 * Mark post for NO publicizing upon publish
		 *
		 * Gutenberg user interface publishes a post without
		 * publicizing it. The user can later (optionally) choose to publicize
		 * the post after it has already been published.
		 * To keep backwards compatibility, this post meta key
		 * is introduced so that Publicize knows the post is
		 * coming from Gutenberg and can ignore the post.
		 * Meta key checked when 'publicize_should_publicize_published_post'
		 * filter is triggered {@see can_publicize()}.
		 * Current server timestamp is recorded so the request will expire.
		 */
		update_post_meta( $post_id, self::PUBLICIZE_BLOCK_META_KEY, time() );

		return null;
	}



}
