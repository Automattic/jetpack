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
	 * Meta key name to mark publishing posts that should not be publicized.
	 *
	 * @since 5.9.1
	 * @var string $PUBLICIZE_BLOCK_META_KEY
	 */
	const PUBLICIZE_BLOCK_META_KEY = '_NO_PUBLICIZE';

	/**
	 * Cosntructor for Async_Publicize
	 *
	 * Set up hooks to extend legacy Publicize behavior.
	 *
	 * @since 5.9.1
	 */
	public function __construct() {
		add_action( 'rest_api_init', function () {
			register_rest_route( 'publicize/', '/posts/(?P<post_id>\d+)/publish-wo-publicize', array(
				'methods'  => 'POST',
				'callback' => array( $this, 'publish_wo_publicize' ),
				'post_id'  => array(
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

		// Do post edit page specific setup.
		add_action( 'admin_enqueue_scripts', array( $this, 'post_page_enqueue' ) );
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
	 * block publicize on posts that have been marked with the
	 * self::PUBLICIZE_BLOCK_META_KEY meta key, which is set
	 * for posts that have been published via {@see 'publish_wo_publicize()'}.
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
			// Clean post meta since it's purpose has been served.
			delete_post_meta( $post->ID, self::PUBLICIZE_BLOCK_META_KEY );

			// Don't publicize.
			return false;
		} else {
			return true;
		}
	}

	/**
	 * REST api callback for publishing a post without publicizing it.
	 *
	 * Function exposed as endpoint 'publicize/posts/<post_id>/publish-wo-publicize'.
	 * Marks a post (using post meta key) so that it is NOT later publicized, and
	 * then directly publishes the post. This should be called if the caller
	 * wants to publish a post but not publicize it, so publicize can be later
	 * completed if desired.
	 *
	 * @since 5.9.1
	 *
	 * @see __construct()
	 *
	 * @param WP_REST_Request $request Request instance from REST call.
	 * @return string|null Result body to return to REST caller
	 */
	public function publish_wo_publicize( $request ) {
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
		 * filter is triggered {@see can_publicize()}
		 */
		update_post_meta( $post_id, self::PUBLICIZE_BLOCK_META_KEY, true );

		wp_publish_post( $post_id );
		return null;

	}



}
