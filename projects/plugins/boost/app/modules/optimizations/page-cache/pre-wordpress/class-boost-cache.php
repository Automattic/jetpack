<?php
/*
 * This file is loaded by advanced-cache.php, and so cannot rely on autoloading.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

use WP_Comment;
use WP_Post;

/*
 * Require all pre-wordpress files here. These files aren't autoloaded as they are loaded before WordPress is fully initialized.
 * pre-wordpress files assume all other pre-wordpress files are loaded here.
 */
require_once __DIR__ . '/boost-cache-actions.php';
require_once __DIR__ . '/class-boost-cache-error.php';
require_once __DIR__ . '/class-boost-cache-settings.php';
require_once __DIR__ . '/class-boost-cache-utils.php';
require_once __DIR__ . '/class-filesystem-utils.php';
require_once __DIR__ . '/class-logger.php';
require_once __DIR__ . '/class-request.php';
require_once __DIR__ . '/storage/interface-storage.php';
require_once __DIR__ . '/storage/class-file-storage.php';

// Define how many seconds the cache should last for each cached page.
if ( ! defined( 'JETPACK_BOOST_CACHE_DURATION' ) ) {
	define( 'JETPACK_BOOST_CACHE_DURATION', HOUR_IN_SECONDS );
}

// Define how many seconds the rebuild cache should be considered stale, but usable, for each cached page.
if ( ! defined( 'JETPACK_BOOST_CACHE_REBUILD_DURATION' ) ) {
	define( 'JETPACK_BOOST_CACHE_REBUILD_DURATION', 10 );
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
	 * @var bool - Indicates whether WordPress initialized correctly and we can cache the page.
	 */
	private $do_cache = false;

	/**
	 * @var string - The ignored cookies that were removed from the cache parameters.
	 */
	private $ignored_cookies = '';

	/**
	 * @var string - The ignored GET parameters that were removed from the cache parameters.
	 */
	private $ignored_get_parameters = '';

	/**
	 * @param ?Storage\Storage $storage - Optionally provide a Storage subclass to handle actually storing and retrieving cached content. Defaults to a new instance of File_Storage.
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
		add_action( 'transition_post_status', array( $this, 'invalidate_on_post_transition' ), 10, 3 );
		add_action( 'transition_comment_status', array( $this, 'invalidate_on_comment_transition' ), 10, 3 );
		add_action( 'comment_post', array( $this, 'rebuild_on_comment_post' ), 10, 3 );
		add_action( 'edit_comment', array( $this, 'rebuild_on_comment_edit' ), 10, 2 );
		add_action( 'switch_theme', array( $this, 'rebuild_all' ) );
		add_action( 'wp_trash_post', array( $this, 'delete_on_post_trash' ), 10, 2 );
		add_filter( 'wp_php_error_message', array( $this, 'disable_caching_on_error' ) );
		add_filter( 'init', array( $this, 'init_do_cache' ) );
		add_filter( 'jetpack_boost_cache_parameters', array( $this, 'ignore_cookies' ) );
		add_filter( 'jetpack_boost_cache_parameters', array( $this, 'ignore_get_parameters' ) );
		$this->load_extra();
	}

	private function load_extra() {
		if ( file_exists( WP_CONTENT_DIR . '/boost-cache-extra.php' ) ) {
			include_once WP_CONTENT_DIR . '/boost-cache-extra.php';
		}
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

		// check if rebuild file exists and rename it to the correct file
		$rebuild_found = $this->storage->reset_rebuild_file( $this->request->get_uri(), $this->request->get_parameters() );
		if ( $rebuild_found ) {
			Logger::debug( 'Rebuild file found. Will be used for cache until new file created.' );
			$cached = false;
		} else {
			$cached = $this->storage->read( $this->request->get_uri(), $this->request->get_parameters() );
		}

		if ( is_string( $cached ) ) {
			$this->send_header( 'X-Jetpack-Boost-Cache: hit' );
			$ignored_cookies_message = $this->ignored_cookies === '' ? '' : " and ignored cookies: {$this->ignored_cookies}";
			$ignored_get_message     = $this->ignored_get_parameters === '' ? '' : " and ignored GET parameters: {$this->ignored_get_parameters}";
			Logger::debug( 'Serving cached page' . $ignored_cookies_message . $ignored_get_message );
			echo $cached; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			die( 0 );
		}

		$cache_status = $rebuild_found ? 'rebuild' : 'miss';
		$this->send_header( 'X-Jetpack-Boost-Cache: ' . $cache_status );

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
		return true;
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

			// Do not cache the page as WordPress did not initialize correctly.
			if ( ! $this->do_cache ) {
				Logger::debug( 'Page exited early. Do not cache.' );
				return $buffer;
			}

			if ( false === stripos( $buffer, '</html>' ) ) {
				Logger::debug( 'Closing HTML tag not found, not caching' );
				return $buffer;
			}

			$result = $this->storage->write( $this->request->get_uri(), $this->request->get_parameters(), $buffer );

			if ( $result instanceof Boost_Cache_Error ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
				Logger::debug( 'Error writing cache file: ' . $result->get_error_message() );
			} else {
				$ignored_cookies_message = $this->ignored_cookies === '' ? '' : " and ignored cookies: {$this->ignored_cookies}";
				$ignored_get_message     = $this->ignored_get_parameters === '' ? '' : " and ignored GET parameters: {$this->ignored_get_parameters}";
				Logger::debug( 'Cache file created' . $ignored_cookies_message . $ignored_get_message );
			}
		}

		return $buffer;
	}

	/**
	 * Delete/rebuild the cache for the front page and paged archives.
	 * This is called when a post is edited, deleted, or published.
	 */
	public function rebuild_front_page() {
		if ( get_option( 'show_on_front' ) === 'page' ) {
			$this->rebuild_page( home_url() );
			$posts_page_id = get_option( 'page_for_posts' ); // posts page
			if ( $posts_page_id ) {
				Logger::debug( 'rebuild_front_page: deleting posts page cache' );
				$this->rebuild_post_cache( get_post( $posts_page_id ) );
			}
		} else {
			$this->rebuild_page( home_url() );
			Logger::debug( 'delete front page cache ' . Boost_Cache_Utils::normalize_request_uri( home_url() ) );
		}
	}

	/**
	 * Rebuild the cache for the post if the comment transitioned from one state to another.
	 *
	 * @param string     $new_status - The new status of the comment.
	 * @param string     $old_status - The old status of the comment.
	 * @param WP_Comment $comment - The comment that transitioned.
	 */
	public function invalidate_on_comment_transition( $new_status, $old_status, $comment ) {
		if ( $new_status === $old_status ) {
			return;
		}
		Logger::debug( "invalidate_on_comment_transition: $new_status, $old_status" );

		if ( $new_status !== 'approved' && $old_status !== 'approved' ) {
			Logger::debug( 'invalidate_on_comment_transition: comment not approved' );
			return;
		}

		$post = get_post( (int) $comment->comment_post_ID );
		$this->rebuild_post_cache( $post );
	}

	/**
	 * After editing a comment, rebuild the cache for the post if the comment is approved.
	 * If changing state and editing, both actions will be called, but the cache will only be rebuilt once.
	 *
	 * @param int   $comment_id - The id of the comment.
	 * @param array $commentdata - The comment data.
	 */
	public function rebuild_on_comment_edit( $comment_id, $commentdata ) {
		$post = get_post( $commentdata['comment_post_ID'] );

		if ( (int) $commentdata['comment_approved'] === 1 ) {
			$this->rebuild_post_cache( $post );
		}
	}

	/**
	 * After a comment is posted, rebuild the cache for the post if the comment is approved.
	 * If the comment is not approved, only rebuild the cache for this post for this visitor.
	 *
	 * @param int   $comment_id - The id of the comment.
	 * @param int   $comment_approved - The approval status of the comment.
	 * @param array $commentdata - The comment data.
	 */
	public function rebuild_on_comment_post( $comment_id, $comment_approved, $commentdata ) {
		$post = get_post( $commentdata['comment_post_ID'] );
		Logger::debug( "rebuild_on_comment_post: $comment_id, $comment_approved, {$post->ID}" );
		/**
		 * If a comment is not approved, we only need to delete the cache for
		 * this post for this visitor so the unmoderated comment is shown to them.
		 */
		if ( $comment_approved !== 1 ) {
			$parameters = $this->request->get_parameters();

			/*
			 * If there are no cookies, then visitor did not click "remember me".
			 * They'll be redirected to a page with a hash in the URL for the
			 * moderation message.
			 * Only delete the cache for visitors who clicked "remember me".
			 */
			if ( isset( $parameters['cookies'] ) && ! empty( $parameters['cookies'] ) ) {
				$this->delete_page( get_permalink( $post->ID ), $parameters );
			}
			return;
		}

		$this->rebuild_post_cache( $post );
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
	 * @param string  $new_status - The new status of the post.
	 * @param string  $old_status - The old status of the post.
	 * @param WP_Post $post - The post that transitioned.
	 */
	public function invalidate_on_post_transition( $new_status, $old_status, $post ) {
		// Special case: Delete cache if the post type can effect the whole site.
		$special_post_types = array( 'wp_template', 'wp_template_part', 'wp_global_styles' );
		if ( in_array( $post->post_type, $special_post_types, true ) ) {
			Logger::debug( 'invalidate_on_post_transition: special post type ' . $post->post_type );
			$this->rebuild_all();
			return;
		}

		if ( ! Boost_Cache_Utils::is_visible_post_type( $post ) ) {
			return;
		}

		if ( $new_status === 'trash' ) {
			return;
		}

		Logger::debug( "invalidate_on_post_transition: $new_status, $old_status, {$post->ID}" );

		// Don't delete the cache for posts that weren't published and aren't published now
		if ( ! $this->is_published( $new_status ) && ! $this->is_published( $old_status ) ) {
			Logger::debug( 'invalidate_on_post_transition: not published' );
			return;
		}

		// delete the cache files entirely if the post was unpublished
		if ( 'publish' === $old_status && 'publish' !== $new_status ) {
			Logger::debug( 'invalidate_on_post_transition: delete cache on new private page' );
			$this->delete_on_post_trash( $post->ID, $old_status );
			return;
		}
		Logger::debug( "invalidate_on_post_transition: rebuilding post {$post->ID}" );

		$this->rebuild_post_cache( $post );
		$this->rebuild_post_terms_cache( $post );
		$this->rebuild_front_page();
		$this->rebuild_author_page( (int) $post->post_author );
	}

	/**
	 * Delete the cache for the post if it was trashed.
	 *
	 * @param int    $post_id - The id of the post.
	 * @param string $old_status - The old status of the post.
	 */
	public function delete_on_post_trash( $post_id, $old_status ) {
		if ( $this->is_published( $old_status ) ) {
			$post      = get_post( $post_id );
			$post_path = $this->get_post_path_for_invalidation( $post );
			if ( $post_path ) {
				$this->delete_recursive( $post_path );
			}
			$this->rebuild_post_terms_cache( $post );
			$this->rebuild_front_page();
			$this->rebuild_author_page( (int) $post->post_author );
		}
	}

	private function get_post_path_for_invalidation( $post ) {
		static $already_deleted = -1;
		if ( $already_deleted === $post->ID ) {
			return null;
		}

		/**
		 * Don't invalidate the cache for post types that are not public.
		 */
		if ( ! Boost_Cache_Utils::is_visible_post_type( $post ) ) {
			return null;
		}

		$already_deleted = $post->ID;

		/**
		 * If a post is unpublished, the permalink will be deleted. In that case,
		 * get_sample_permalink() will return a permalink with ?p=123 instead of
		 * the post name. We need to get the post name from the post object.
		 */
		$permalink = get_permalink( $post->ID );
		if ( strpos( $permalink, '?p=' ) !== false || strpos( $permalink, '?page_id=' ) !== false ) {
			if ( $post->post_type === 'page' ) {
				$permalink = get_page_link( $post->ID, false, true );
			} else {
				if ( ! function_exists( 'get_sample_permalink' ) ) {
					require_once ABSPATH . 'wp-admin/includes/post.php';
				}
				list( $permalink, $post_name ) = get_sample_permalink( $post->ID );
				$permalink                     = str_replace( '%postname%', $post_name, $permalink );
			}
		}
		return $permalink;
	}

	/**
	 * Delete the cache for terms associated with this post.
	 *
	 * @param WP_Post $post - The post to delete the cache for.
	 */
	public function rebuild_post_terms_cache( $post ) {
		$categories = get_the_category( $post->ID );
		if ( is_array( $categories ) ) {
			foreach ( $categories as $category ) {
				$link = trailingslashit( get_category_link( $category->term_id ) );
				$this->rebuild_recursive( $link );
			}
		}

		$tags = get_the_tags( $post->ID );
		if ( is_array( $tags ) ) {
			foreach ( $tags as $tag ) {
				$link = trailingslashit( get_tag_link( $tag->term_id ) );
				$this->rebuild_recursive( $link );
			}
		}
	}

	/**
	 * Delete the entire cache for the author's archive page.
	 *
	 * @param int $author_id - The id of the author.
	 */
	public function rebuild_author_page( $author_id ) {
		$author = get_userdata( $author_id );
		if ( ! $author ) {
			return;
		}

		$author_link = get_author_posts_url( $author_id, $author->user_nicename );
		$this->rebuild_recursive( $author_link );
	}

	/**
	 * Rebuild the entire cache.
	 */
	public function rebuild_all() {
		$this->rebuild_recursive( home_url() );
	}

	public function delete_post_cache( $post ) {
		$post_path = $this->get_post_path_for_invalidation( $post );
		if ( null === $post_path ) {
			return;
		}

		if ( Boost_Cache_Utils::trailingslashit( $post_path ) !== Boost_Cache_Utils::trailingslashit( home_url() ) ) {
			$this->delete_recursive( $post_path );
		} else {
			$this->delete_page( $post_path );
		}
	}

	public function rebuild_post_cache( $post ) {
		$post_path = $this->get_post_path_for_invalidation( $post );
		if ( null === $post_path ) {
			return;
		}

		if ( Boost_Cache_Utils::trailingslashit( $post_path ) !== Boost_Cache_Utils::trailingslashit( home_url() ) ) {
			$this->rebuild_recursive( $post_path );
		} else {
			$this->rebuild_page( $post_path );
		}
	}

	public function rebuild_page( $path, $parameters = false ) {
		$this->storage->clear(
			$path,
			array(
				'rebuild'    => true,
				'parameters' => $parameters,
			)
		);
		$this->invalidate_cache_success( $path, 'rebuild', 'page' );
	}

	public function delete_page( $path, $parameters = false ) {
		$this->storage->clear(
			$path,
			array(
				'rebuild'    => false,
				'parameters' => $parameters,
			)
		);
		$this->invalidate_cache_success( $path, 'delete', 'page' );
	}

	public function rebuild_recursive( $path ) {
		$this->storage->clear(
			$path,
			array(
				'rebuild'   => true,
				'recursive' => true,
			)
		);
		$this->invalidate_cache_success( $path, 'rebuild', 'recursive' );
	}

	public function delete_recursive( $path ) {
		$this->storage->clear(
			$path,
			array(
				'rebuild'   => false,
				'recursive' => true,
			)
		);
		$this->invalidate_cache_success( $path, 'delete', 'recursive' );
	}

	private function invalidate_cache_success( $path, $type, $scope ) {
		do_action( 'jetpack_boost_invalidate_cache_success', $path, $type, $scope );
	}

	/**
	 * Ignore certain GET parameters in the cache parameters so cached pages can be served to these visitors.
	 *
	 * @param array $parameters - The parameters with the GET array to filter.
	 * @return array - The parameters with GET parameters removed.
	 */
	public function ignore_get_parameters( $parameters ) {
		static $params = false;

		// Only run this once as it may be called multiple times on uncached pages.
		if ( $params ) {
			return $params;
		}

		/**
		 * Filters the GET parameters so cached pages can be served to these visitors.
		 * The list is an array of regex patterns. The default list contains the
		 * most common GET parameters used by analytics services.
		 *
		 * @since 3.8.0
		 *
		 * @param array $get_parameters An array of regexes to remove items from the GET parameter list.
		 */
		$get_parameters = apply_filters(
			'jetpack_boost_ignore_get_parameters',
			array( 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ysclid', 'srsltid', 'yclid' )
		);

		$get_parameters = array_unique(
			array_map(
				'trim',
				$get_parameters
			)
		);

		foreach ( $get_parameters as $get_parameter ) {
			foreach ( array_keys( $parameters['get'] ) as $get_parameter_name ) {
				if ( preg_match( '/^' . $get_parameter . '$/', $get_parameter_name ) ) {
					unset( $parameters['get'][ $get_parameter_name ] );
					$this->ignored_get_parameters .= $get_parameter_name . ',';
				}
			}
		}
		if ( $this->ignored_get_parameters !== '' ) {
			$this->ignored_get_parameters = rtrim( $this->ignored_get_parameters, ',' );
		}

		$params = $parameters;

		return $parameters;
	}

	/**
	 * Ignore certain cookies in the cache parameters so cached pages can be served to these visitors.
	 *
	 * @param array $parameters - The parameters with the cookies array to filter.
	 * @return array - The parameters with cookies removed.
	 */
	public function ignore_cookies( $parameters ) {
		static $params = false;

		// Only run this once as it may be called multiple times on uncached pages.
		if ( $params ) {
			return $params;
		}

		$default_cookies = array(
			'cf_clearance',
			'cf_chl_rc_i',
			'cf_chl_rc_ni',
			'cf_chl_rc_m',
			'_cfuvid',
			'__cfruid',
			'__cfwaitingroom',
			'cf_ob_info',
			'cf_use_ob',
			'__cfseq',
			'__cf_bm',
			'__cflb',

			// Sourcebuster
			'sbjs_(.*)',

			// Google Analytics
			'_ga(?:_[A-Z0-9]*)?',

			// AWS Load Balancer
			'AWSELB',
			'AWSELBCORS',
			'AWSALB',
			'AWSALBCORS',
		);
		$jetpack_cookies = array( 'tk_ai', 'tk_qs' );
		$cookies         = array_merge( $default_cookies, $jetpack_cookies );

		/**
		 * Filters the browser cookies so cached pages can be served to these visitors.
		 * The list is an array of regex patterns. The default list contains the
		 * cookies used by Cloudflare, and the regex pattern for the sbjs_ cookies
		 * used by sourcebuster.js
		 *
		 * @since 3.8.0
		 *
		 * @param array $cookies An array of regexes to remove items from the cookie list.
		 */
		$cookies = apply_filters(
			'jetpack_boost_ignore_cookies',
			$cookies
		);

		$cookies = array_unique(
			array_map(
				'trim',
				$cookies
			)
		);

		/**
		 * The Jetpack Cookie Banner plugin sets a cookie to indicate that the
		 * user has accepted the cookie policy.
		 * The value of the cookie is the expiry date of the cookie, which means
		 * that everyone who has accepted the cookie policy will use a different
		 * cache file.
		 * Set it to 1 here so those visitors will use the same cache file.
		 */
		if ( isset( $parameters['cookies']['eucookielaw'] ) ) {
			$parameters['cookies']['eucookielaw'] = 1;
		}

		/**
		 * This is for the personalized ads consent cookie.
		 */
		if ( isset( $parameters['cookies']['personalized-ads-consent'] ) ) {
			$parameters['cookies']['personalized-ads-consent'] = 1;
		}

		$cookie_keys = array();
		if ( isset( $parameters['cookies'] ) && is_array( $parameters['cookies'] ) ) {
			$cookie_keys = array_keys( $parameters['cookies'] );
		} else {
			return $parameters;
		}

		foreach ( $cookies as $cookie ) {
			foreach ( $cookie_keys as $cookie_name ) {
				if ( preg_match( '/^' . $cookie . '$/', $cookie_name ) ) {
					unset( $parameters['cookies'][ $cookie_name ] );
					$this->ignored_cookies .= $cookie_name . ',';
				}
			}
		}
		if ( $this->ignored_cookies !== '' ) {
			$this->ignored_cookies = rtrim( $this->ignored_cookies, ',' );
		}

		$params = $parameters;

		return $parameters;
	}

	public function disable_caching_on_error( $message ) {
		if ( ! defined( 'DONOTCACHEPAGE' ) ) {
			define( 'DONOTCACHEPAGE', true );
		}
		Logger::debug( 'Fatal error detected, caching disabled' );
		return $message;
	}

	/**
	 * This function is called after WordPress is loaded, on "init".
	 * It is used to indicate that it is safe to cache and that no
	 * fatal errors occurred.
	 */
	public function init_do_cache() {
		$this->do_cache = true;
	}
}
