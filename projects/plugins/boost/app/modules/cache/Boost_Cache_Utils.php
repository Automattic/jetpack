<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

class Boost_Cache_Utils {

	/**
	 * "Safe" version of WordPress' is_404 method. When called before WordPress' query is run, returns
	 * `null` (a falsey value) instead of outputting a _doing_it_wrong warning.
	 */
	public static function is_404() {
		global $wp_query;

		if ( ! isset( $wp_query ) || ! function_exists( '\is_404' ) ) {
			return null;
		}

		return \is_404();
	}

	/**
	 * "Safe" version of WordPress' is_feed method. When called before WordPress' query is run, returns
	 * `null` (a falsey value) instead of outputting a _doing_it_wrong warning.
	 */
	public static function is_feed() {
		global $wp_query;

		if ( ! isset( $wp_query ) || ! function_exists( '\is_feed' ) ) {
			return null;
		}

		return \is_feed();
	}

	/**
	 * Recursively delete a directory.
	 * @param string $dir - The directory to delete.
	 * @param bool   $recurse - If false, only delete the files in the directory, do not recurse into subdirectories.
	 * @return bool|WP_Error
	 */
	public static function delete_directory( $dir, $recurse = true ) {
		error_log( "delete directory: $dir " . (int) $recurse ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		$dir = realpath( $dir );
		if ( ! $dir ) {
			// translators: %s is the directory that does not exist.
			return new \WP_Error( 'directory-missing', sprintf( __( 'Directory does not exist: %s', 'jetpack-boost' ), $dir ) ); // realpath returns false if a file does not exist.
		}

		// make sure that $dir is a directory inside WP_CONTENT . '/boost-cache/';
		if ( self::is_boost_cache_directory( $dir ) === false ) {
			// translators: %s is the directory that is invalid.
			return new \WP_Error( 'invalid-directory', sprintf( __( 'Invalid directory %s', 'jetpack-boost' ), $dir ) );
		}

		$files = array_diff( scandir( $dir ), array( '.', '..' ) );
		foreach ( $files as $file ) {
			$file = $dir . '/' . $file;
			if ( $recurse && is_dir( $file ) ) {
				self::delete_directory( $file, $recurse );
			} else {
				wp_delete_file( $file );
			}
		}
		return @rmdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir, WordPress.PHP.NoSilencedErrors.Discouraged
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
	 * Delete a single directory.
	 * @param string $dir - The directory to delete.
	 * @return bool
	 */
	public static function delete_single_directory( $dir ) {
		error_log( "delete single directory: $dir" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		return self::delete_directory( $dir, false );
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
	 * Creates the directory if it doesn't exist.
	 *
	 * @param string $path - The path to the directory to create.
	 */
	public static function create_directory( $path ) {
		if ( ! is_dir( $path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.dir_mkdir_dirname, WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
			return mkdir( $path, 0755, true );
		}

		return true;
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
	 * Writes data to a file.
	 * This creates a temporary file first, then renames the file to the final filename.
	 * This is done to prevent the file from being read while it is being written to.
	 *
	 * @param string $filename - The filename to write to.
	 * @param string $data - The data to write to the file.
	 * @return bool|WP_Error - true on sucess or WP_Error on failure.
	 */
	public static function write_to_file( $filename, $data ) {
		$tmp_filename = $filename . uniqid( uniqid(), true ) . '.tmp';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( false === file_put_contents( $tmp_filename, $data ) ) {
			return new \WP_Error( 'Could not write to tmp file: ' . $tmp_filename );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename
		if ( ! rename( $tmp_filename, $filename ) ) {
			return new \WP_Error( 'Could not rename tmp file to final file: ' . $filename );
		}
		return true;
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
}
