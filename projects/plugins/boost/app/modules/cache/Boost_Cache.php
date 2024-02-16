<?php
/**
 * This file is loaded by advanced-cache.php, and so cannot rely on autoloading.
 */

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

require_once __DIR__ . '/Boost_Cache_Settings.php';
require_once __DIR__ . '/Boost_Cache_Utils.php';
require_once __DIR__ . '/storage/File_Storage.php';

class Boost_Cache {
	/**
	 * @var Boost_Cache_Settings - The settings for the page cache.
	 */
	private $settings;

	/**
	 * @var Boost_Cache_Storage - The storage system used by Boost Cache.
	 */
	private $storage;

	/**
	 * @var string - The normalized path for the current request. This is not sanitized. Only to be used for comparison purposes.
	 */
	private $request_uri = false;

	/**
	 * @var array - The GET parameters and cookies for the current request. Everything considered in the cache key.
	 */
	private $request_parameters;

	/**
	 * @param $storage - Optionally provide a Boost_Cache_Storage subclass to handle actually storing and retrieving cached content. Defaults to a new instance of File_Storage.
	 */
	public function __construct( $storage = null ) {
		$this->settings = Boost_Cache_Settings::get_instance();
		$home           = isset( $_SERVER['HTTP_HOST'] ) ? strtolower( $_SERVER['HTTP_HOST'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$this->storage  = $storage ?? new Storage\File_Storage( $home );

		$this->request_uri = isset( $_SERVER['REQUEST_URI'] )
			? $this->normalize_request_uri( $_SERVER['REQUEST_URI'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			: false;

		/**
		 * Set the cookies and get parameters for the current request.
		 * Sometimes these arrays are modified by WordPress or other plugins.
		 * We need to cache them here so they can be used for the cache key later.
		 * We don't need to sanitize them, as they are only used for comparison.
		 */
		$this->request_parameters = array(
			'cookies' => $_COOKIE, // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			'get'     => $_GET,   // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Recommended
		);

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
		if ( ! $this->is_cacheable() ) {
			return;
		}

		if ( ! $this->serve_cached() ) {
			$this->ob_start();
		}
	}

	/**
	 * Returns true if the current request has a fatal error.
	 *
	 * @return bool
	 */
	private function is_fatal_error() {
		$error = error_get_last();
		if ( $error === null ) {
			return false;
		}

		$fatal_errors = array(
			E_ERROR,
			E_PARSE,
			E_CORE_ERROR,
			E_COMPILE_ERROR,
			E_USER_ERROR,
		);

		return in_array( $error['type'], $fatal_errors, true );
	}

	public function is_url_excluded( $request_uri = '' ) {
		if ( $request_uri === '' ) {
			$request_uri = $this->request_uri;
		}

		$excluded_urls = $this->settings->get_excluded_urls();
		$excluded_urls = apply_filters( 'boost_cache_excluded_urls', $excluded_urls );

		$excluded_urls[] = 'wp-.*\.php';
		foreach ( $excluded_urls as $expr ) {
			if ( ! empty( $expr ) && preg_match( "~$expr~", $request_uri ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns true if the request is cacheable.
	 *
	 * If a request is in the backend, or is a POST request, or is not an
	 * html request, it is not cacheable.
	 * The filter boost_cache_cacheable can be used to override this.
	 *
	 * @return bool
	 */
	public function is_cacheable() {
		if ( ! apply_filters( 'boost_cache_cacheable', $this->request_uri ) ) {
			return false;
		}

		if ( defined( 'DONOTCACHEPAGE' ) ) {
			return false;
		}

		// do not cache post previews or customizer previews
		if ( ! empty( $_GET ) && ( isset( $_GET['preview'] ) || isset( $_GET['customize_changeset_uuid'] ) ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Recommended
			return false;
		}

		if ( $this->is_fatal_error() ) {
			return false;
		}

		if ( $this->is_url_excluded() ) {
			error_log( $_SERVER['REQUEST_URI'] . ' url excluded, not cached!' ); // phpcs:ignore -- This is a debug message
			return false;
		}

		if ( function_exists( 'is_user_logged_in' ) && is_user_logged_in() ) {
			return false;
		}

		if ( Boost_Cache_Utils::is_404() ) {
			return false;
		}

		if ( Boost_Cache_Utils::is_feed() ) {
			return false;
		}

		if ( $this->is_backend() ) {
			return false;
		}

		if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] !== 'GET' ) {
			return false;
		}

		$accept_headers = apply_filters( 'boost_accept_headers', array( 'application/json', 'application/activity+json', 'application/ld+json' ) );
		$accept_headers = array_map( 'strtolower', $accept_headers );
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- $accept is checked and set below.
		$accept = isset( $_SERVER['HTTP_ACCEPT'] ) ? strtolower( filter_var( $_SERVER['HTTP_ACCEPT'] ) ) : '';

		if ( $accept !== '' ) {
			foreach ( $accept_headers as $header ) {
				if ( str_contains( $accept, $header ) ) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Normalize the request uri so it can be used for caching purposes.
	 * It removes the query string and the trailing slash, and characters
	 * that might cause problems with the filesystem.
	 *
	 * **THIS DOES NOT SANITIZE THE VARIABLE IN ANY WAY.**
	 * Only use it for comparison purposes or to generate an MD5 hash.
	 *
	 * @param string $request_uri - The request uri to normalize.
	 * @return string - The normalized request uri.
	 */
	protected function normalize_request_uri( $request_uri ) {
		// get path from request uri
		$request_uri = parse_url( $request_uri, PHP_URL_PATH ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
		if ( empty( $request_uri ) ) {
			$request_uri = '/';
		} elseif ( substr( $request_uri, -1 ) !== '/' ) {
			$request_uri .= '/';
		}

		return $request_uri;
	}

	/**
	 * Serve cached content, if any is available for the current request. Will terminate if it does so.
	 * Otherwise, returns false.
	 */
	public function serve_cached() {
		if ( ! $this->is_cacheable() ) {
			return false;
		}

		$cached = $this->storage->read( $this->request_uri, $this->request_parameters );
		if ( is_string( $cached ) ) {
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
		if ( ! $this->is_cacheable() ) {
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
		if ( strlen( $buffer ) > 0 && $this->is_cacheable() ) {
			$result = $this->storage->write( $this->request_uri, $this->request_parameters, $buffer );

			if ( is_wp_error( $result ) ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
				// TODO: log error for site owner
			}
		}

		return $buffer;
	}

	/**
	 * Returns true if the current request is one of the following:
	 * 1. wp-admin
	 * 2. wp-login.php, xmlrpc.php or wp-cron.php/cron request
	 * 3. WP_CLI
	 * 4. REST request.
	 *
	 * @return bool
	 */
	public function is_backend() {

		$is_backend = is_admin();
		if ( $is_backend ) {
			return $is_backend;
		}

		$script = isset( $_SERVER['PHP_SELF'] ) ? basename( $_SERVER['PHP_SELF'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		if ( $script !== 'index.php' ) {
			if ( in_array( $script, array( 'wp-login.php', 'xmlrpc.php', 'wp-cron.php' ), true ) ) {
				$is_backend = true;
			}
		}

		if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
			$is_backend = true;
		}

		if ( PHP_SAPI === 'cli' || ( defined( 'WP_CLI' ) && constant( 'WP_CLI' ) ) ) {
			$is_backend = true;
		}

		if ( defined( 'REST_REQUEST' ) ) {
			$is_backend = true;
		}

		return $is_backend;
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
			$this->storage->invalidate_home_page( $this->normalize_request_uri( home_url() ) );
			error_log( 'delete front page cache ' . $this->normalize_request_uri( home_url() ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
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
			$this->storage->invalidate_single_visitor( $this->normalize_request_uri( get_permalink( $post->ID ) ), $this->request_parameters );
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
		$path = $this->normalize_request_uri( $url );

		return $this->storage->invalidate( $path );
	}

	/**
	 * Delete the entire cache.
	 */
	public function delete_cache() {
		return $this->delete_cache_for_url( home_url() );
	}
}
