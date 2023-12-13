<?php // phpcs:disable Squiz.Commenting.FileComment.Missing

// phpcs:disable WordPress.PHP.DevelopmentFunctions.prevent_path_disclosure_error_reporting
// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_error_reporting
// phpcs:disable WordPress.PHP.IniSet.display_errors_Disallowed

namespace Automattic\Jetpack\Backup;

use Exception;
use Throwable;

/**
 * Wrappers for functions which throw an exception on errors and warnings instead of silently continuing operation.
 *
 * PHP is pretty lax with error reporting when doing I/O operations, e.g. a typical I/O helper function returns false,
 * null, and/or emits a warning, but the whole PHP application continues operation. It's for the caller of the I/O
 * helper function to test the returned result of the function, and notice + act upon I/O errors.
 *
 * We really want to know about each and every I/O error. Therefore, this class provides wrappers for some common
 * (mostly) I/O operations that throw an exception on errors instead of just returning false, null, or something else.
 * This wrapper class treats warnings as errors too.
 *
 * Given that static method names are similar to the ones used by PHP, they're prefixed with "t_" to not erroneously
 * trigger various security scanners.
 */
class Throw_On_Errors {

	/**
	 * Execute a callable, throw an exception (together with a descriptive label) on PHP warnings / errors.
	 *
	 * @param callable $callable Callable to execute.
	 * @param string   $label Label to add to the thrown exception to clarify what was attempted.
	 *
	 * @return mixed Callable's return value, if any.
	 * @throws Exception On warnings thrown by the callable.
	 * @noinspection PhpUnusedParameterInspection
	 */
	private static function throw_on_warnings( $callable, $label ) {
		$old_error_reporting = error_reporting( - 1 );
		$old_display_errors  = ini_set( 'display_errors', 'stderr' );

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler
		set_error_handler(
		/**
		 * Temporary error handler.
		 *
		 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.set-error-handler
		 * @see https://www.php.net/manual/en/function.set-error-handler.php
		 *
		 * @param int $errno Level of the error raised.
		 * @param string $errstr Error message.
		 * @param string|null $errfile Filename that the error was raised in.
		 * @param int|null $errline Line number where the error was raised.
		 * @param array|null $errcontext Deprecated, unused.
		 *
		 * @return mixed
		 * @throws Exception
		 */
			// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			function ( $errno, $errstr, $errfile = null, $errline = null, $errcontext = null ) {
				throw new Exception( "$errstr (file: $errfile; line: $errline)" );
			}
		);

		$result        = null;
		$error_message = null;
		try {
			$result = $callable();
		} catch ( Throwable $throwable ) {
			$error_message = $throwable->getMessage();
		}

		restore_error_handler();
		ini_set( 'display_errors', $old_display_errors );
		error_reporting( $old_error_reporting );

		if ( $error_message !== null ) {
			throw new Exception( "$label failed: $error_message" );
		}

		return $result;
	}

	/**
	 * Return canonicalized absolute pathname, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.realpath
	 * @see https://www.php.net/manual/en/function.realpath.php
	 *
	 * @param string $path Path being checked.
	 *
	 * @return string Canonicalized absolute pathname
	 * @throws Exception On invalid parameters, or if realpath() has returned false or thrown warnings.
	 */
	public static function t_realpath( $path ) {
		// PHP 5.x won't complain about parameter being unset, so let's do it ourselves.
		if ( ! $path ) {
			throw new Exception( 'Filename for realpath() is unset' );
		}

		$label = "realpath( '$path' )";

		$realpath_result = static::throw_on_warnings(
			function () use ( $path ) {
				return realpath( $path );
			},
			$label
		);

		if ( false === $realpath_result ) {
			throw new Exception( "Unable to $label" );
		}

		return $realpath_result;
	}

	/**
	 * Check whether a file or directory exists, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.file-exists
	 * @see https://www.php.net/manual/en/function.file-exists.php
	 *
	 * @param string $filename Path to the file or directory.
	 *
	 * @return bool True if the file or directory specified by filename exists; false otherwise.
	 * @throws Exception On invalid parameters, or if file_exists() has thrown warnings.
	 */
	public static function t_file_exists( $filename ) {
		// PHP 5.x won't complain about parameter being unset, so let's do it ourselves.
		if ( ! $filename ) {
			throw new Exception( 'Filename for file_exists() is unset' );
		}

		return static::throw_on_warnings(
			function () use ( $filename ) {
				return file_exists( $filename );
			},
			"file_exists( '$filename' )"
		);
	}

	/**
	 * Tell whether the filename (or a directory) is readable, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.is-readable
	 * @see https://www.php.net/manual/en/function.is-readable.php
	 *
	 * @param string $filename Filename (or directory) to check.
	 *
	 * @return bool True if the filename (or a directory) exists and is readable, false otherwise.
	 * @throws Exception On invalid parameters, or if is_readable() has thrown warnings.
	 */
	public static function t_is_readable( $filename ) {
		// PHP 5.x won't complain about parameter being unset, so let's do it ourselves.
		if ( ! $filename ) {
			throw new Exception( 'Filename for is_readable() is unset' );
		}

		return static::throw_on_warnings(
			function () use ( $filename ) {
				return is_readable( $filename );
			},
			"is_readable( '$filename' )"
		);
	}

	/**
	 * Tell whether the filename (or a directory) is writable, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.is-writable
	 * @see https://www.php.net/manual/en/function.is-writable.php
	 *
	 * @param string $filename Filename (or directory) to check.
	 *
	 * @return bool True if the filename (or a directory) exists and is writable, false otherwise.
	 * @throws Exception On invalid parameters, or if is_writable() has thrown warnings.
	 */
	public static function t_is_writable( $filename ) {
		// PHP 5.x won't complain about parameter being unset, so let's do it ourselves.
		if ( ! $filename ) {
			throw new Exception( 'Filename for is_writable() is unset' );
		}

		return static::throw_on_warnings(
			function () use ( $filename ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
				return is_writable( $filename );
			},
			"is_writable( '$filename' )"
		);
	}

	/**
	 * Get file size, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.filesize
	 * @see https://www.php.net/manual/en/function.filesize.php
	 *
	 * @param string $filename Path to the file.
	 *
	 * @return int Size of the file in bytes
	 * @throws Exception On invalid parameters, or if filesize() has thrown warnings.
	 */
	public static function t_filesize( $filename ) {
		// PHP 5.x won't complain about parameter being unset, so let's do it ourselves.
		if ( ! $filename ) {
			throw new Exception( 'Filename for filesize() is unset' );
		}

		$label = "filesize( '$filename' )";

		$filesize_result = static::throw_on_warnings(
			function () use ( $filename ) {
				return filesize( $filename );
			},
			$label
		);

		if ( false === $filesize_result ) {
			throw new Exception( "Unable to $label" );
		}

		return $filesize_result;
	}

	/**
	 * Get file modification time, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.filemtime
	 * @see https://www.php.net/manual/en/function.filemtime.php
	 *
	 * @param string $filename Path to the file.
	 *
	 * @return int The time the file was last modified
	 * @throws Exception On invalid parameters, or if filemtime() has thrown warnings.
	 */
	public static function t_filemtime( $filename ) {
		// PHP 5.x won't complain about parameter being unset, so let's do it ourselves.
		if ( ! $filename ) {
			throw new Exception( 'Filename for filemtime() is unset' );
		}

		$label = "filemtime( '$filename' )";

		$filemtime_result = static::throw_on_warnings(
			function () use ( $filename ) {
				return filemtime( $filename );
			},
			$label
		);

		if ( false === $filemtime_result ) {
			throw new Exception( "Unable to $label" );
		}

		return $filemtime_result;
	}

	/**
	 * Tell whether the filename is a directory (follow symlinks), throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.is-dir
	 * @see https://www.php.net/manual/en/function.is-dir.php
	 *
	 * @param string $filename Path to the file.
	 *
	 * @return bool True if the filename (or the symlink's target) exists and is a directory, false otherwise.
	 * @throws Exception On invalid parameters, if is_dir() has thrown warnings, or has failed.
	 */
	public static function t_is_dir( $filename ) {
		// PHP 5.x won't complain about parameter being unset, so let's do it ourselves.
		if ( ! $filename ) {
			throw new Exception( 'Filename for is_dir() is unset' );
		}

		return static::throw_on_warnings(
			function () use ( $filename ) {
				return is_dir( $filename );
			},
			"is_dir( '$filename' )"
		);
	}

	/**
	 * Make a directory, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.mkdir
	 * @see https://www.php.net/manual/en/function.mkdir.php
	 *
	 * @param string $directory Directory path.
	 * @param int    $permissions Permissions of the newly created directory.
	 * @param bool   $recursive If true, then any parent directories to the directory specified will also be created,
	 *                              with the same permissions.
	 *
	 * @return void
	 * @throws Exception On invalid parameters, if mkdir() has thrown warnings, or has failed.
	 */
	public static function t_mkdir( $directory, $permissions = 0777, $recursive = false ) {
		// PHP 5.x won't complain about permissions being null, so let's do it ourselves.
		if ( $permissions === null ) {
			throw new Exception( 'Permissions for mkdir() are unset' );
		}

		$label = "mkdir( '$directory', 0" . decoct( $permissions ) . ', ' . ( $recursive ? 'true' : 'false' ) . ' )';

		$mkdir_result = static::throw_on_warnings(
			function () use ( $directory, $permissions, $recursive ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
				return mkdir( $directory, $permissions, $recursive );
			},
			$label
		);

		if ( false === $mkdir_result ) {
			throw new Exception( "Unable to $label" );
		}
	}

	/**
	 * List files and directories inside the specified path, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.scandir
	 * @see https://www.php.net/manual/en/function.scandir.php
	 *
	 * @param string $directory Directory that will be scanned.
	 *
	 * @return string An array of filenames.
	 * @throws Exception If scandir() has thrown warnings, or has failed.
	 */
	public static function t_scandir( $directory ) {

		// PHP 5.x won't complain about parameter being unset, so let's do it ourselves.
		if ( ! $directory ) {
			throw new Exception( 'Directory for scandir() is unset' );
		}

		$label = "scandir( '$directory' )";

		$scandir_result = static::throw_on_warnings(
			function () use ( $directory ) {
				return scandir( $directory );
			},
			$label
		);

		if ( false === $scandir_result ) {
			throw new Exception( "Unable to $label" );
		}

		return $scandir_result;
	}

	/**
	 * Remove a directory, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.rmdir
	 * @see https://www.php.net/manual/en/function.rmdir.php
	 *
	 * @param string $directory Directory path.
	 *
	 * @return void
	 * @throws Exception On invalid parameters, if rmdir() has thrown warnings, or has failed.
	 */
	public static function t_rmdir( $directory ) {
		// PHP 5.x won't complain about parameter being unset, so let's do it ourselves.
		if ( ! $directory ) {
			throw new Exception( 'Directory for mkdir() is unset' );
		}

		$label = "rmdir( '$directory' )";

		$rmdir_result = static::throw_on_warnings(
			function () use ( $directory ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
				return rmdir( $directory );
			},
			$label
		);

		if ( false === $rmdir_result ) {
			throw new Exception( "Unable to $label" );
		}
	}

	/**
	 * Delete a file, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.unlink
	 * @see https://www.php.net/manual/en/function.unlink.php
	 *
	 * @param string $filename Path to the file.
	 *
	 * @return void
	 * @throws Exception If unlink() has thrown warnings, or has failed.
	 */
	public static function t_unlink( $filename ) {

		$label = "unlink( '$filename' )";

		$unlink_result = static::throw_on_warnings(
			function () use ( $filename ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
				return unlink( $filename );
			},
			$label
		);

		if ( false === $unlink_result ) {
			throw new Exception( "Unable to $label" );
		}
	}

	/**
	 * Write data to a file, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.file-put-contents
	 * @see https://www.php.net/manual/en/function.file-put-contents.php
	 *
	 * @param string $filename Path to the file where to write the data.
	 * @param string $data The data to write.
	 *
	 * @return void
	 * @throws Exception If file_put_contents() has thrown warnings, has failed, or if it didn't write all the bytes.
	 */
	public static function t_file_put_contents( $filename, $data ) {

		// PHP 5.x won't complain about parameter being unset, so let's do it ourselves.
		if ( ! $filename ) {
			throw new Exception( 'Filename for file_put_contents() is unset' );
		}
		if ( $data === null ) {
			throw new Exception( 'Data to write is null' );
		}

		$data_length = strlen( $data );

		$label = "file_put_contents( '$filename', $data_length bytes of data )";

		$number_of_bytes_written = static::throw_on_warnings(
			function () use ( $filename, $data ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
				return file_put_contents( $filename, $data );
			},
			$label
		);

		if ( false === $number_of_bytes_written ) {
			throw new Exception( "Unable to $label" );
		}

		if ( $number_of_bytes_written !== $data_length ) {
			throw new Exception(
				"$label was expected to write $data_length bytes, but wrote $number_of_bytes_written bytes"
			);
		}
	}

	/**
	 * Read entire file into a string, throw on warnings / errors.
	 *
	 * @see https://php-legacy-docs.zend.com/manual/php5/en/function.file-get-contents
	 * @see https://www.php.net/manual/en/function.file-get-contents.php
	 *
	 * @param string $filename Name of the file to read.
	 *
	 * @return string The read data.
	 * @throws Exception If file_get_contents() has thrown warnings, or has failed.
	 */
	public static function t_file_get_contents( $filename ) {

		// PHP 5.x won't complain about parameter being unset, so let's do it ourselves.
		if ( ! $filename ) {
			throw new Exception( 'Filename for file_get_contents() is unset' );
		}

		$label = "file_get_contents( '$filename' )";

		$file_get_contents_result = static::throw_on_warnings(
			function () use ( $filename ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				return file_get_contents( $filename );
			},
			$label
		);

		if ( false === $file_get_contents_result ) {
			throw new Exception( "Unable to $label" );
		}

		return $file_get_contents_result;
	}
}
