<?php
/*
 * This file is loaded by advanced-cache.php, and so cannot rely on autoloading.
 */

namespace Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress;

/*
 * Require all pre-wordpress files here. These files aren't autoloaded as they are loaded before WordPress is fully initialized.
 * pre-wordpress files assume all other pre-wordpress files are loaded here.
 */
require_once __DIR__ . '/Boost_Cache_Settings.php';
require_once __DIR__ . '/Boost_Cache_Utils.php';
require_once __DIR__ . '/Filesystem_Utils.php';
require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/Request.php';
require_once __DIR__ . '/storage/Storage.php';
require_once __DIR__ . '/storage/File_Storage.php';

class Boost_Cache {
	/**
	 * @var Boost_Cache_Settings - The settings for the page cache.
	 */
	private $settings;

	/**
	 * @var Storage\File_Storage - The storage system used by Boost Cache.
	 */
	private $storage;

	/**
	 * @var Request - The request object that provides utility for the current request.
	 */
	private $request = null;

	/**
	 * @param $storage - Optionally provide a Boost_Cache_Storage subclass to handle actually storing and retrieving cached content. Defaults to a new instance of File_Storage.
	 */
	public function __construct( $storage = null ) {
		$this->settings = Boost_Cache_Settings::get_instance();
		$home           = isset( $_SERVER['HTTP_HOST'] ) ? strtolower( $_SERVER['HTTP_HOST'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$this->storage  = $storage ?? new Storage\File_Storage( $home );
		$this->request  = Request::current();

		$this->init_actions();
	}

	/**
	 * Initialize the actions for the cache.
	 */
	protected function init_actions() {
		add_action( 'transition_post_status', array( $this, 'delete_on_post_transition' ), 10, 3 );
		add_action( 'transition_comment_status', array( $this, 'delete_on_comment_transition' ), 10, 3 );
		add_action( 'comment_post', array( $this, 'delete_on_comment_post' ), 10, 3 );
		add_action( 'edit_comment', array( $this, 'delete_on_comment_edit' ), 10, 2 );
		add_action( 'switch_theme', array( $this, 'delete_cache' ) );
	}

	/**
	 * Serve the cached page if it exists, otherwise start output buffering.
	 */
	public function serve() {
		if ( ! $this->request->is_cacheable() ) {
			return;
		}

		if ( ! $this->serve_cached() ) {
			$this->ob_start();
		}
	}

	/**
	 * Get the storage instance used by Boost Cache.
	 */
	public function get_storage() {
		return $this->storage;
	}

	/**
	 * Serve cached content, if any is available for the current request. Will terminate if it does so.
	 * Otherwise, returns false.
	 */
	public function serve_cached() {
		if ( ! $this->request->is_cacheable() ) {
			return false;
		}

		$cached = $this->storage->read( $this->request->get_uri(), $this->request->get_parameters() );
		if ( is_string( $cached ) ) {
			Logger::debug( 'Serving cached page' );
			echo $cached . '<!-- cached -->'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			die();
		}

		return false;
	}

	/**
	 * Starts output buffering and sets the callback to save the cache file.
	 *
	 * @return bool - false if page is not cacheable.
	 */
	public function ob_start() {
		if ( ! $this->request->is_cacheable() ) {
			return false;
		}

		ob_start( array( $this, 'ob_callback' ) );
	}

	/**
	 * Callback function from output buffer. This function saves the output
	 * buffer to a cache file and then returns the buffer so PHP will send it
	 * to the browser.
	 *
	 * @param string $buffer - The output buffer to save to the cache file.
	 * @return string - The output buffer.
	 */
	public function ob_callback( $buffer ) {
		if ( strlen( $buffer ) > 0 && $this->request->is_cacheable() ) {
			$result = $this->storage->write( $this->request->get_uri(), $this->request->get_parameters(), $buffer );

			if ( is_wp_error( $result ) ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
				Logger::debug( 'Error writing cache file: ' . $result->get_error_message() );
			} else {
				Logger::debug( 'Cache file created' );
			}
		}

		return $buffer;
	}

	/**
	 * Delete the cache for the front page and paged archives.
	 * This is called when a post is edited, deleted, or published.
	 *
	 * @param WP_Post $post - The post that should be deleted.
	 */
	protected function delete_cache_for_front_page() {
		if ( get_option( 'show_on_front' ) === 'page' ) {
			$front_page_id = get_option( 'page_on_front' ); // static page
			if ( $front_page_id ) {
				error_log( 'delete_cache_for_front_page: deleting front page cache' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				$this->delete_cache_for_post( get_post( $front_page_id ) );
			}
			$posts_page_id = get_option( 'page_for_posts' ); // posts page
			if ( $posts_page_id ) {
				error_log( 'delete_cache_for_front_page: deleting posts page cache' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				$this->delete_cache_for_post( get_post( $posts_page_id ) );
			}
		} else {
			$this->storage->invalidate_home_page( Boost_Cache_Utils::normalize_request_uri( home_url() ) );
			error_log( 'delete front page cache ' . Boost_Cache_Utils::normalize_request_uri( home_url() ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		}
	}

	/**
	 * Delete the cache for the post if the comment transitioned from one state to another.
	 *
	 * @param string $new_status - The new status of the comment.
	 * @param string $old_status - The old status of the comment.
	 * @param WP_Comment $comment - The comment that transitioned.
	 */
	public function delete_on_comment_transition( $new_status, $old_status, $comment ) {
		if ( $new_status === $old_status ) {
			return;
		}
		error_log( "delete_on_comment_transition: $new_status, $old_status" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

		if ( $new_status !== 'approved' && $old_status !== 'approved' ) {
			error_log( 'delete_on_comment_transition: comment not approved' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return;
		}

		$post = get_post( $comment->comment_post_ID );
		$this->delete_cache_for_post( $post );
	}

	/**
	 * After editing a comment, delete the cache for the post if the comment is approved.
	 * If changing state and editing, both actions will be called, but the cache will only be deleted once.
	 *
	 * @param int $comment_id - The id of the comment.
	 * @param array $commentdata - The comment data.
	 */
	public function delete_on_comment_edit( $comment_id, $commentdata ) {
		$post = get_post( $commentdata['comment_post_ID'] );

		if ( (int) $commentdata['comment_approved'] === 1 ) {
			$this->delete_cache_for_post( $post );
		}
	}

	/**
	 * After a comment is posted, delete the cache for the post if the comment is approved.
	 * If the comment is not approved, only delete the cache for this post for this visitor.
	 *
	 * @param int $comment_id - The id of the comment.
	 * @param int $comment_approved - The approval status of the comment.
	 * @param array $commentdata - The comment data.
	 */
	public function delete_on_comment_post( $comment_id, $comment_approved, $commentdata ) {
		$post = get_post( $commentdata['comment_post_ID'] );

		/**
		 * If a comment is not approved, we only need to delete the cache for
		 * this post for this visitor so the unmoderated comment is shown to them.
		 */
		if ( $comment_approved !== 1 ) {
			$this->storage->invalidate_single_visitor( Boost_Cache_Utils::normalize_request_uri( get_permalink( $post->ID ) ), $this->request->get_parameters() );
			return;
		}

		$this->delete_cache_for_post( $post );
	}

	/**
	 * Returns true if the post is published or private.
	 *
	 * @param string $status - The status of the post.
	 * @return bool
	 */
	private function is_published( $status ) {
		return $status === 'publish' || $status === 'private';
	}

	/**
	 * Delete the cached post if it transitioned from one state to another.
	 *
	 * @param string $new_status - The new status of the post.
	 * @param string $old_status - The old status of the post.
	 * @param WP_Post $post - The post that transitioned.
	 */
	public function delete_on_post_transition( $new_status, $old_status, $post ) {
		if ( ! Boost_Cache_Utils::is_visible_post_type( $post ) ) {
			return;
		}

		error_log( "delete_on_post_transition: $new_status, $old_status, {$post->ID}" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

		// Don't delete the cache for posts that weren't published and aren't published now
		if ( ! $this->is_published( $new_status ) && ! $this->is_published( $old_status ) ) {
			error_log( 'delete_on_post_transition: not published' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return;
		}

		error_log( "delete_on_post_transition: deleting post {$post->ID}" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

		$this->delete_cache_for_post( $post );
		$this->delete_cache_for_post_terms( $post );
		$this->delete_cache_for_front_page();
	}

	/**
	 * Deletes cache files for the given post.
	 *
	 * @param WP_Post $post - The post to delete the cache file for.
	 */
	public function delete_cache_for_post( $post ) {
		static $already_deleted = -1;
		if ( $already_deleted === $post->ID ) {
			return;
		}

		/**
		 * Don't delete the cache for post types that are not public.
		 */
		if ( ! Boost_Cache_Utils::is_visible_post_type( $post ) ) {
			return;
		}

		$already_deleted = $post->ID;

		/**
		 * If a post is unpublished, the permalink will be deleted. In that case,
		 * get_sample_permalink() will return a permalink with ?p=123 instead of
		 * the post name. We need to get the post name from the post object.
		 */
		$permalink = get_permalink( $post->ID );
		if ( strpos( $permalink, '?p=' ) !== false ) {
			if ( ! function_exists( 'get_sample_permalink' ) ) {
				require_once ABSPATH . 'wp-admin/includes/post.php';
			}
			list( $permalink, $post_name ) = get_sample_permalink( $post );
			$permalink                     = str_replace( array( '%postname%', '%pagename%' ), $post_name, $permalink );
		}

		error_log( "delete_cache_for_post: $permalink" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		$this->delete_cache_for_url( $permalink );
	}

	/**
	 * Delete the cache for terms associated with this post.
	 *
	 * @param WP_Post $post - The post to delete the cache for.
	 */
	public function delete_cache_for_post_terms( $post ) {
		$categories = get_the_category( $post->ID );
		if ( is_array( $categories ) ) {
			foreach ( $categories as $category ) {
				$link = trailingslashit( get_category_link( $category->term_id ) );
				$this->delete_cache_for_url( $link );
			}
		}

		$tags = get_the_tags( $post->ID );
		if ( is_array( $tags ) ) {
			foreach ( $tags as $tag ) {
				$link = trailingslashit( get_tag_link( $tag->term_id ) );
				$this->delete_cache_for_url( $link );
			}
		}
	}

	/**
	 * Delete the cache for the given url.
	 *
	 * @param string $url - The url to delete the cache for.
	 */
	public function delete_cache_for_url( $url ) {
		error_log( 'delete_cache_for_url: ' . $url ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		$path = Boost_Cache_Utils::normalize_request_uri( $url );

		return $this->storage->invalidate( $path );
	}

	/**
	 * Delete the entire cache.
	 */
	public function delete_cache() {
		return $this->delete_cache_for_url( home_url() );
	}
}
