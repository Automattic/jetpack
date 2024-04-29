<?php
/*
 * This file is loaded by advanced-cache.php, and so cannot rely on autoloading.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

use WP_Comment;
use WP_Error;
use WP_Post;

/*
 * Require all pre-wordpress files here. These files aren't autoloaded as they are loaded before WordPress is fully initialized.
 * pre-wordpress files assume all other pre-wordpress files are loaded here.
 */
require_once __DIR__ . '/Boost_Cache_Actions.php';
require_once __DIR__ . '/Boost_Cache_Error.php';
require_once __DIR__ . '/Boost_Cache_Settings.php';
require_once __DIR__ . '/Boost_Cache_Utils.php';
require_once __DIR__ . '/Filesystem_Utils.php';
require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/Request.php';
require_once __DIR__ . '/storage/Storage.php';
require_once __DIR__ . '/storage/File_Storage.php';

// Define how many seconds the cache should last for each cached page.
if ( ! defined( 'JETPACK_BOOST_CACHE_DURATION' ) ) {
	define( 'JETPACK_BOOST_CACHE_DURATION', HOUR_IN_SECONDS );
}

class Boost_Cache {
	/**
	 * @var Boost_Cache_Settings - The settings for the page cache.
	 */
	private $settings;

	/**
	 * @var Storage\Storage - The storage system used by Boost Cache.
	 */
	private $storage;

	/**
	 * @var Request - The request object that provides utility for the current request.
	 */
	private $request = null;

	/**
	 * @var bool - Indicates whether the cache engine has been loaded.
	 */
	private static $cache_engine_loaded = false;

	/**
	 * @param $storage - Optionally provide a Boost_Cache_Storage subclass to handle actually storing and retrieving cached content. Defaults to a new instance of File_Storage.
	 */
	public function __construct( $storage = null ) {
		$this->settings = Boost_Cache_Settings::get_instance();
		$home           = isset( $_SERVER['HTTP_HOST'] ) ? strtolower( $_SERVER['HTTP_HOST'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$this->storage  = $storage ?? new Storage\File_Storage( $home );
		$this->request  = Request::current();
	}

	/**
	 * Initialize the actions for the cache.
	 */
	public function init_actions() {
		add_action( 'transition_post_status', array( $this, 'delete_on_post_transition' ), 10, 3 );
		add_action( 'transition_comment_status', array( $this, 'delete_on_comment_transition' ), 10, 3 );
		add_action( 'comment_post', array( $this, 'delete_on_comment_post' ), 10, 3 );
		add_action( 'edit_comment', array( $this, 'delete_on_comment_edit' ), 10, 2 );
		add_action( 'switch_theme', array( $this, 'delete_cache' ) );
		add_action( 'wp_trash_post', array( $this, 'delete_on_post_trash' ), 10, 2 );
		add_filter( 'wp_php_error_message', array( $this, 'disable_caching_on_error' ) );
	}

	/**
	 * Serve the cached page if it exists, otherwise start output buffering.
	 */
	public function serve() {
		if ( ! $this->settings->get_enabled() ) {
			return;
		}

		// Indicate that the cache engine has been loaded.
		self::$cache_engine_loaded = true;

		if ( ! $this->request->is_cacheable() ) {
			return;
		}

		if ( ! $this->serve_cached() ) {
			$this->ob_start();
		}
	}

	/**
	 * Check if the cache engine has been loaded.
	 *
	 * @return bool - True if the cache engine has been loaded, false otherwise.
	 */
	public static function is_loaded() {
		return self::$cache_engine_loaded;
	}

	/**
	 * Get the storage instance used by Boost Cache.
	 *
	 * @return Storage\Storage
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
			$this->send_header( 'X-Jetpack-Boost-Cache: hit' );
			Logger::debug( 'Serving cached page' );
			echo $cached; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			die();
		}

		$this->send_header( 'X-Jetpack-Boost-Cache: miss' );

		return false;
	}

	private function send_header( $header ) {
		if ( ! headers_sent() ) {
			header( $header );
		}
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

			if ( false === stripos( $buffer, '</html>' ) ) {
				Logger::debug( 'Closing HTML tag not found, not caching' );
				return $buffer;
			}

			$result = $this->storage->write( $this->request->get_uri(), $this->request->get_parameters(), $buffer );

			if ( $result instanceof Boost_Cache_Error ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
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
	public function delete_cache_for_front_page() {
		if ( get_option( 'show_on_front' ) === 'page' ) {
			$front_page_id = get_option( 'page_on_front' ); // static page
			if ( $front_page_id ) {
				Logger::debug( 'delete_cache_for_front_page: deleting front page cache' );
				$this->delete_cache_for_post( get_post( $front_page_id ) );
			}
			$posts_page_id = get_option( 'page_for_posts' ); // posts page
			if ( $posts_page_id ) {
				Logger::debug( 'delete_cache_for_front_page: deleting posts page cache' );
				$this->delete_cache_for_post( get_post( $posts_page_id ) );
			}
		} else {
			$this->storage->invalidate( home_url(), Filesystem_Utils::DELETE_FILES );
			Logger::debug( 'delete front page cache ' . Boost_Cache_Utils::normalize_request_uri( home_url() ) );
		}
	}

	/**
	 * Delete the cache for the given post.
	 *
	 * @param int $post_id - The ID of the post to delete the cache for.
	 */
	public function delete_cache_by_post_id( $post_id ) {
		$post = get_post( (int) $post_id );
		if ( $post ) {
			$this->delete_cache_for_post( $post );
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
		Logger::debug( "delete_on_comment_transition: $new_status, $old_status" );

		if ( $new_status !== 'approved' && $old_status !== 'approved' ) {
			Logger::debug( 'delete_on_comment_transition: comment not approved' );
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
		Logger::debug( "delete_on_comment_post: $comment_id, $comment_approved, {$post->ID}" );
		/**
		 * If a comment is not approved, we only need to delete the cache for
		 * this post for this visitor so the unmoderated comment is shown to them.
		 */
		if ( $comment_approved !== 1 ) {
			$parameters = $this->request->get_parameters();
			/**
			 * if there are no cookies, then visitor did not click "remember me".
			 * No need to delete the cache for this visitor as they'll be
			 * redirected to a page with a hash in the URL for the moderation
			 * message.
			 */
			if ( isset( $parameters['cookies'] ) && ! empty( $parameters['cookies'] ) ) {
				$filename = trailingslashit( get_permalink( $post->ID ) ) . Filesystem_Utils::get_request_filename( $parameters );
				$this->storage->invalidate( $filename, Filesystem_Utils::DELETE_FILE );
			}
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
		// Special case: Delete cache if the post type can effect the whole site.
		$special_post_types = array( 'wp_template', 'wp_template_part', 'wp_global_styles' );
		if ( in_array( $post->post_type, $special_post_types, true ) ) {
			Logger::debug( 'delete_on_post_transition: special post type ' . $post->post_type );
			$this->delete_cache();
			return;
		}

		if ( ! Boost_Cache_Utils::is_visible_post_type( $post ) ) {
			return;
		}

		if ( $new_status === 'trash' ) {
			return;
		}

		Logger::debug( "delete_on_post_transition: $new_status, $old_status, {$post->ID}" );

		// Don't delete the cache for posts that weren't published and aren't published now
		if ( ! $this->is_published( $new_status ) && ! $this->is_published( $old_status ) ) {
			Logger::debug( 'delete_on_post_transition: not published' );
			return;
		}

		Logger::debug( "delete_on_post_transition: deleting post {$post->ID}" );

		$this->delete_cache_for_post( $post );
		$this->delete_cache_for_post_terms( $post );
		$this->delete_cache_for_front_page();
		$this->delete_cache_for_author( $post->post_author );
	}

	/**
	 * Delete the cache for the post if it was trashed.
	 *
	 * @param int $post_id - The id of the post.
	 * @param string $old_status - The old status of the post.
	 */
	public function delete_on_post_trash( $post_id, $old_status ) {
		if ( $this->is_published( $old_status ) ) {
			$post = get_post( $post_id );
			$this->delete_cache_for_post( $post );
			$this->delete_cache_for_post_terms( $post );
			$this->delete_cache_for_front_page();
			$this->delete_cache_for_author( $post->post_author );
		}
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
		Logger::debug( "delete_cache_for_post: $permalink" );
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
	 * Delete the entire cache for the author's archive page.
	 *
	 * @param int $author_id - The id of the author.
	 * @return bool|WP_Error - True if the cache was deleted, WP_Error otherwise.
	 */
	public function delete_cache_for_author( $author_id ) {
		$author = get_userdata( $author_id );
		if ( ! $author ) {
			return;
		}

		$author_link = get_author_posts_url( $author_id, $author->user_nicename );
		return $this->delete_cache_for_url( $author_link );
	}

	/**
	 * Delete the cache for the given url.
	 *
	 * @param string $url - The url to delete the cache for.
	 */
	public function delete_cache_for_url( $url ) {
		Logger::debug( 'delete_cache_for_url: ' . $url );

		return $this->storage->invalidate( $url, Filesystem_Utils::DELETE_ALL );
	}

	/**
	 * Delete the entire cache.
	 */
	public function delete_cache() {
		return $this->delete_cache_for_url( home_url() );
	}

	public function disable_caching_on_error( $message ) {
		if ( ! defined( 'DONOTCACHEPAGE' ) ) {
			define( 'DONOTCACHEPAGE', true );
		}
		Logger::debug( 'Fatal error detected, caching disabled' );
		return $message;
	}
}
