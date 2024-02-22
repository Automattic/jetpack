<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress;

class Boost_Cache_Utils {

	const DELETE_ALL   = 'delete-all'; // delete all files and directories in a given directory, recursively.
	const DELETE_FILE  = 'delete-single'; // delete a single file or recursively delete a single directory in a given directory.
	const DELETE_FILES = 'delete-files'; // delete all files in a given directory.

	/**
	 * Recursively delete a directory.
	 * @param string $path - The directory to delete.
	 * @param bool   $type - The type of delete. DELETE_FILES to delete all files in the given directory. DELETE_ALL to delete everything in the given directory, recursively.
	 * @return bool|WP_Error
	 */
	public static function delete_directory( $path, $type ) {
		Logger::debug( "delete directory: $path $type" );
		$path = realpath( $path );
		if ( ! $path ) {
			// translators: %s is the directory that does not exist.
			return new \WP_Error( 'directory-missing', sprintf( __( 'Directory does not exist: %s', 'jetpack-boost' ), $path ) ); // realpath returns false if a file does not exist.
		}

		// make sure that $dir is a directory inside WP_CONTENT . '/boost-cache/';
		if ( self::is_boost_cache_directory( $path ) === false ) {
			// translators: %s is the directory that is invalid.
			return new \WP_Error( 'invalid-directory', sprintf( __( 'Invalid directory %s', 'jetpack-boost' ), $path ) );
		}

		if ( ! is_dir( $path ) ) {
			return new \WP_Error( 'not-a-directory', __( 'Not a directory', 'jetpack-boost' ) );
		}

		switch ( $type ) {
			case self::DELETE_ALL: // delete all files and directories in the given directory.
				$iterator = new \RecursiveIteratorIterator( new \RecursiveDirectoryIterator( $path, \RecursiveDirectoryIterator::SKIP_DOTS ) );
				foreach ( $iterator as $file ) {
					if ( $file->isDir() ) {
						Logger::debug( 'rmdir: ' . $file->getPathname() );
						@rmdir( $file->getPathname() ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir, WordPress.PHP.NoSilencedErrors.Discouraged
					} else {
						Logger::debug( 'unlink: ' . $file->getPathname() );
						@unlink( $file->getPathname() ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
					}
				}
				@rmdir( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir, WordPress.PHP.NoSilencedErrors.Discouraged,
				break;
			case self::DELETE_FILES: // delete all files in the given directory.
				$files = array_diff( scandir( $path ), array( '.', '..' ) );
				foreach ( $files as $file ) {
					$file = $path . '/' . $file;
					if ( is_file( $file ) ) {
						Logger::debug( "unlink: $file" );
						@unlink( $file ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.unlink_unlink
					}
				}
				break;
		}
		return true;
	}

	/**
	 * Performs a deep string replace operation to ensure the values in $search are no longer present.
	 * Copied from wp-includes/formatting.php
	 *
	 * Repeats the replacement operation until it no longer replaces anything to remove "nested" values
	 * e.g. $subject = '%0%0%0DDD', $search ='%0D', $result ='' rather than the '%0%0DD' that
	 * str_replace would return
	 *
	 * @param string|array $search  The value being searched for, otherwise known as the needle.
	 *                              An array may be used to designate multiple needles.
	 * @param string       $subject The string being searched and replaced on, otherwise known as the haystack.
	 * @return string The string with the replaced values.
	 */
	public static function deep_replace( $search, $subject ) {
		$subject = (string) $subject;

		$count = 1;
		while ( $count ) {
				$subject = str_replace( $search, '', $subject, $count );
		}

		return $subject;
	}

	public static function trailingslashit( $string ) {
		return rtrim( $string, '/' ) . '/';
	}

	/**
	 * Returns a sanitized directory path.
	 * @param string $path - The path to sanitize.
	 * @return string
	 */
	public static function sanitize_file_path( $path ) {
		$path = self::trailingslashit( $path );
		$path = self::deep_replace(
			array( '..', '\\' ),
			preg_replace(
				'/[ <>\'\"\r\n\t\(\)]/',
				'',
				preg_replace(
					'/(\?.*)?(#.*)?$/',
					'',
					$path
				)
			)
		);

		return $path;
	}

	/**
	 * Returns true if the given directory is inside the boost-cache directory.
	 * @param string $dir - The directory to check.
	 * @return bool
	 */
	public static function is_boost_cache_directory( $dir ) {
		$dir = self::sanitize_file_path( $dir );
		return strpos( $dir, WP_CONTENT_DIR . '/boost-cache' ) !== false;
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
	public static function normalize_request_uri( $request_uri ) {
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
	 * Checks if the post type is public.
	 *
	 * @param WP_Post $post - The post to check.
	 * @return bool - True if the post type is public.
	 */
	public static function is_visible_post_type( $post ) {
		$post_type = is_a( $post, 'WP_Post' ) ? get_post_type_object( $post->post_type ) : null;
		if ( empty( $post_type ) || ! $post_type->public ) {
			return false;
		}
		return true;
	}

	/**
	 * Given a request_uri and its parameters, return the filename to use for this cached data. Does not include the file path.
	 *
	 * @param array  $parameters  - An associative array of all the things that make this request special/different. Includes GET parameters and COOKIEs normally.
	 */
	public static function get_request_filename( $parameters ) {

		$key_components = apply_filters( 'boost_cache_key_components', $parameters );

		return md5( json_encode( $key_components ) ) . '.html'; // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
	}
}
