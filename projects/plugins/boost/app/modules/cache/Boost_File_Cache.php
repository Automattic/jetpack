<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

/*
 * This file is loaded by advanced-cache.php and bypasses WordPress.
 * As it is loaded before WordPress is loaded, it is not autoloaded by Boost.
 */
require_once __DIR__ . '/Boost_Cache.php';

class Boost_File_Cache extends Boost_Cache {
	/*
	 * Returns the path to the cache directory for the given request, or current request
	 *
	 * @param string $request_uri - The request uri to get the path for. Defaults to current request.
	 * @return string - The path to the cache directory for the given request.
	 */
	private function path( $request_uri = false ) {
		if ( $request_uri !== false ) {
			$request_uri = $this->normalize_request_uri( $request_uri );
		} else {
			$request_uri = $this->request_uri;
		}

		$key  = $this->path_key( $request_uri );
		$path = WP_CONTENT_DIR . '/boost-cache/cache/';

		/*
		 * The cache directory is split into 5 levels of subdirectories.
		 * 2 characters of the md5 hash of the request uri are used for each level.
		 * This is done to prevent having too many files in a single directory.
		 */
		for ( $i = 0; $i < 10; $i += 2 ) {
			$path .= substr( $key, $i, 2 ) . '/';
		}

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
			'cookies'     => $_COOKIE, // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			'get'         => $_GET, // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Recommended
		);
		$args     = array_merge( $defaults, $args );
		error_log( 'cache_filename: ' . print_r( $args, true ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log, WordPress.PHP.DevelopmentFunctions.error_log_print_r

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
		// exclude wp-json requests
		if ( strpos( $this->request_uri, '/wp-json/' ) === false ) {
			error_log( 'get: ' . $this->request_uri . ' ' . $this->cache_filename( $args ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
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

		$tmp_filename = $cache_filename . uniqid( wp_rand(), true ) . '.tmp';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( false === file_put_contents( $tmp_filename, $buffer ) ) {
			return new \WP_Error( 'Could not write to tmp file' );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename
		if ( ! rename( $tmp_filename, $cache_filename ) ) {
			return new \WP_Error( 'Could not rename tmp file' );
		}

		return true;
	}

	public function delete_cache_for_url( $url, $filename = false ) {
		error_log( "deleting cache for url: $url $filename" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		if ( $filename ) {
			if ( Boost_Cache_Utils::is_boost_cache_directory( $filename ) ) {
				error_log( 'deleting file: ' . $filename ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				unlink( $filename ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
				return;
			}
		}

		$path = $this->path( $this->normalize_request_uri( $url ) );
		if ( Boost_Cache_Utils::is_boost_cache_directory( $path ) ) {
			Boost_Cache_Utils::delete_directory( $path );
			error_log( "Boost_File_Cache::delete_directory( $url ) -> $path" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		}
	}

	public function delete_cache_for_post_terms( $post ) {
		// get categories and tags for the post and delete those cache directories too
		$categories = get_the_category( $post->ID );
		if ( is_array( $categories ) ) {
			foreach ( $categories as $category ) {
				$link = trailingslashit( get_category_link( $category->term_id ) );
				$this->delete_cache_for_url( $link );
				$count = get_term_by( 'id', $category->term_id, 'category' )->count;
				for ( $i = 1; $i <= $count; $i++ ) {
					$this->delete_cache_for_url( $link . "page/$i/" );
				}
			}
		}

		$tags = get_the_tags( $post->ID );
		if ( is_array( $tags ) ) {
			foreach ( $tags as $tag ) {
				$link = trailingslashit( get_tag_link( $tag->term_id ) );
				$this->delete_cache_for_url( $link );
				$count = get_term_by( 'id', $tag->term_id, 'post_tag' )->count;
				for ( $i = 1; $i <= $count; $i++ ) {
					error_log( "deleting $link/page/$i/" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					$this->delete_cache_for_url( $link . "page/$i/" );
				}
			}
		}
	}

	/*
	 * Deletes cache files for the given post.
	 *
	 * @param WP_Post $post - The post to delete the cache file for.
	 */
	public function delete_cache_for_post( $post, $filename = false ) {
		static $already_deleted = -1;
		if ( $already_deleted === $post->ID ) {
			error_log( "Boost_File_Cache::delete_cache_for_post( {$post->ID} ) already deleted" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return;
		}

		/*
		 * Don't delete the cache for post types that are not public.
		 */
		if ( ! $this->is_visible_post_type( $post ) ) {
			return;
		}

		$already_deleted = $post->ID;
		error_log( "Boost_File_Cache::delete_cache_for_post( {$post->ID} )" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		$permalink = get_permalink( $post->ID );

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
			error_log( "got permalink: $permalink, post_name: $post_name" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			$permalink = str_replace( array( '%postname%', '%pagename%' ), $post->post_name, $permalink );
		}

		$this->delete_cache_for_url( $permalink, $filename );

		// delete the front page only if we're not deleting a post for a specific visitor.
		if ( $filename === false ) {
			$this->maybe_clear_front_page_cache( $post );
		}
	}

	public function delete_on_post_transition( $new_status, $old_status, $post ) {
		if ( ! $this->is_visible_post_type( $post ) ) {
			return;
		}
		error_log( "Called Boost_File_Cache::delete_on_post_transition( $new_status, $old_status, $post->ID )" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

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
		error_log( 'visitor post: deleting post: ' . $this->cache_filename( array( 'request_uri' => get_permalink( $post->ID ) ) ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		$this->delete_cache_for_post( $post, $this->cache_filename( array( 'request_uri' => get_permalink( $post->ID ) ) ) );
	}
}
