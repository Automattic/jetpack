<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

/*
 * This file is loaded by advanced-cache.php and bypasses WordPress.
 * As it is loaded before WordPress is loaded, it is not autoloaded by Boost.
 */
require_once __DIR__ . '/Boost_Cache.php';

class Boost_File_Cache extends Boost_Cache {
	/*
	 * The path to the cache directory.
	 */
	private $cache_path = WP_CONTENT_DIR . '/boost-cache/cache/';

	/*
	 * Returns the path to the cache directory for the given request, or current request
	 *
	 * @param string $request_uri - The request uri to get the path for. Defaults to current request.
	 * @return string - The path to the cache directory for the given request.
	 */
	private function path( $request_uri = false ) {
		if ( $request_uri !== false ) {
			$request_uri = Boost_Cache_Utils::sanitize_file_path( $this->normalize_request_uri( $request_uri ) );
		} else {
			$request_uri = $this->request_uri;
		}

		$path = Boost_Cache_Utils::trailingslashit( $this->cache_path . $request_uri );

		return $path;
	}

	/*
	 * Returns the cache filename for the given request, or current request.
	 *
	 * @param array $args - an array containing the request_uri, cookies array, and get array representing the request.
	 * @return string - The cache path + filename for the given request.
	 */
	private function cache_filename( $args = array() ) {
		$defaults = array(
			'request_uri' => $this->request_uri,
			'cookies'     => $this->cookies, // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			'get'         => $this->get, // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Recommended
		);
		$args     = array_merge( $defaults, $args );

		return $this->path( $args['request_uri'] ) . $this->cache_key( $args ) . '.html';
	}

	/*
	 * Outputs the cached page if it exists for the given request, or current request.
	 *
	 * @param array $args - an array containing the request_uri, cookies array, and get array representing the request.
	 * @return bool - false if page was not cached.
	 */
	public function get( $args = array() ) {
		if ( ! $this->is_cacheable() ) {
			return false;
		}

		if ( file_exists( $this->cache_filename( $args ) ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, WordPress.Security.EscapeOutput.OutputNotEscaped
			echo file_get_contents( $this->cache_filename( $args ) ) . '<!-- cached: ' . $this->cache_key( $args ) . ' -->';
			die();
		}
		return false;
	}

	/*
	 * Creates the cache directory if it doesn't exist.
	 *
	 * @param string $path - The path to the cache directory to create.
	 */
	private function create_cache_directory( $path ) {
		if ( ! is_dir( $path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.dir_mkdir_dirname, WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
			return mkdir( $path, 0755, true );
		}

		return true;
	}

	/*
	 * Saves the output buffer to the cache file for the given request, or current request.
	 * Then outputs the buffer to the browser.
	 *
	 * @param string $buffer - The output buffer to save to the cache file.
	 * @return bool|WP_Error - WP_Error if page was not cacheable.
	 */
	public function set( $buffer ) {
		if ( ! $this->is_cacheable() ) {
			return new \WP_Error( 'Page is not cacheable' );
		}

		if ( strlen( $buffer ) === 0 ) {
			return new \WP_Error( 'Empty buffer' );
		}

		$cache_filename = $this->cache_filename();
		if ( ! $this->create_cache_directory( dirname( $cache_filename ) ) ) {
			return new \WP_Error( 'Could not create cache directory' );
		}

		return Boost_Cache_Utils::write_to_file( $cache_filename, $buffer );
	}

	/*
	 * Delete the cache for the given url. Recurse through sub directories if $recurse is true.
	 *
	 * @param string $url - The url to delete the cache for.
	 * @param bool $recurse - If true, delete the cache for all sub directories as well.
	 */
	public function delete_cache_for_url( $url, $recurse = true ) {
		$path = $this->path( $this->normalize_request_uri( $url ) );
		if ( ! $recurse ) {
			Boost_Cache_Utils::delete_single_directory( $path );
		} else {
			Boost_Cache_Utils::delete_directory( $path );
		}
	}

	/*
	 * Delete the cache for terms associated with this post.
	 *
	 * @param WP_Post $post - The post to delete the cache for.
	 */
	public function delete_cache_for_post_terms( $post ) {
		// get categories and tags for the post and delete those cache directories
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

	/*
	 * Deletes cache files for the given post.
	 *
	 * @param WP_Post $post - The post to delete the cache file for.
	 * @param bool $all - If false, only delete the cache file for the post, not the paged archive or front page cache.
	 */
	public function delete_cache_for_post( $post, $all = true ) {
		static $already_deleted = -1;
		if ( $already_deleted === $post->ID ) {
			return;
		}

		/*
		 * Don't delete the cache for post types that are not public.
		 */
		if ( ! $this->is_visible_post_type( $post ) ) {
			return;
		}

		$already_deleted = $post->ID;
		$permalink       = get_permalink( $post->ID );

		/*
		 * If a post is unpublished, the permalink will be deleted. In that case,
		 * get_sample_permalink() will return a permalink with ?p=123 instead of
		 * the post name. We need to get the post name from the post object.
		 */
		if ( strpos( $permalink, '?p=' ) !== false ) {
			if ( ! function_exists( 'get_sample_permalink' ) ) {
				require_once ABSPATH . 'wp-admin/includes/post.php';
			}
			list( $permalink, $post_name ) = get_sample_permalink( $post );
			$permalink                     = str_replace( array( '%postname%', '%pagename%' ), $post_name, $permalink );
		}

		$this->delete_cache_for_url( $permalink, $all );
		if ( $all ) {
			$this->maybe_clear_front_page_cache( $post );
		}
	}

	/*
	 * Delete the cached post if it transitioned from one state to another.
	 *
	 * @param string $new_status - The new status of the post.
	 * @param string $old_status - The old status of the post.
	 * @param WP_Post $post - The post that transitioned.
	 */
	public function delete_on_post_transition( $new_status, $old_status, $post ) {
		if ( ! $this->is_visible_post_type( $post ) ) {
			return;
		}

		if ( ( $old_status === 'private' || $old_status === 'publish' ) && $new_status !== 'publish' ) { // post unpublished
			$this->delete_cache_for_post( $post );
			$this->delete_cache_for_post_terms( $post );
		} elseif ( $new_status === 'private' || $new_status === 'publish' ) { // post published
			$this->delete_cache_for_post( $post );
			$this->delete_cache_for_post_terms( $post );
		} else {
			$this->delete_cache_for_post( $post );
		}
	}

	public function delete_post_for_visitor( $post ) {
		wp_delete_file( $this->cache_filename( array( 'request_uri' => get_permalink( $post->ID ) ) ) );
	}

	/*
	 * Delete the entire cache.
	 */
	public function delete_cache() {
		Boost_Cache_Utils::delete_directory( $this->cache_path );
	}
}
