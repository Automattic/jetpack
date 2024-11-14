<?php
/**
 * FileExtractor file.
 *
 * @package wpcomsh
 */

namespace Imports\Utils;

use WP_Error;
/**
 * Class FileExtractor
 *
 * This class is responsible for extracting files from a ZIP or TAR archive.
 */
class FileExtractor {
	/**
	 * Extract the contents of a file to a destination directory.
	 *
	 * @param string $file The path to the file to extract.
	 * @param string $destination The path to the directory where the file should be extracted.
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	public static function extract( $file, $destination ) {
		$extension = pathinfo( $file, PATHINFO_EXTENSION );

		// Check if the file exists.
		if ( ! is_file( $file ) || ! is_readable( $file ) ) {
			return new WP_Error( 'file_not_exists', __( 'File not exists', 'wpcomsh' ) );
		}

		if ( ! self::ensure_dir_exists( $destination ) ) {
			return new WP_Error( 'dest_dir_not_created', __( 'Could not create folder', 'wpcomsh' ) );
		}

		switch ( $extension ) {
			case 'zip':
				return self::extract_zip( $file, $destination );
			case 'tar':
			case 'gz':
				return self::extract_tar( $file, $destination );
			default:
				return new WP_Error( 'file_type_not_supported', __( 'File type is not supported', 'wpcomsh' ) );
		}
	}

	/**
	 * Extract the contents of a ZIP file to a destination directory.
	 *
	 * @param string $file The path to the ZIP file to extract.
	 * @param string $destination The path to the directory where the ZIP file should be extracted.
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	private static function extract_zip( string $file, string $destination ) {
		$zip = new \ZipArchive();
		if ( $zip->open( $file ) !== true ) {
			return new WP_Error( 'zipfile_open_failure', __( 'The ZIP file could not be opened.', 'wpcomsh' ) );
		}

		$extracted = $zip->extractTo( $destination );
		$zip->close();

		if ( ! $extracted ) {
			return new WP_Error( 'zipfile_extract_failure', __( 'The ZIP file could not be extracted.', 'wpcomsh' ) );
		}
		return true;
	}

	/**
	 * Extract the contents of a tar file to a destination directory.
	 *
	 * @param string $file The path to the tar file to extract.
	 * @param string $destination The path to the directory where the tar file should be extracted.
	 * @return bool|WP_Error True on success, or a WP_Error on failure.
	 */
	private static function extract_tar( string $file, string $destination ) {
		// For .tar and .tar.gz files, we'll use the PharData class
		try {
			$phar = new \PharData( $file );
			$phar->extractTo( $destination );
		} catch ( \Exception $e ) {
			return new WP_Error( 'phar_extract_failure', __( 'The TAR file could not be extracted.', 'wpcomsh' ) );
		}
		return true;
	}

	/**
	 * Ensure directory exists.
	 *
	 * @param string $dir Directory to ensure the existence of.
	 * @return bool Whether the existence could be asserted.
	 */
	private static function ensure_dir_exists( $dir ) {
		if ( ! is_dir( $dir ) ) {
			if ( ! wp_mkdir_p( $dir ) ) {
				return false;
			}
		}
		return true;
	}
}
