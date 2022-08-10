<?php
/**
 * File Store cache
 *
 * @package jetpack-videopress
 */

// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamComment
// phpcs:disable WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase
// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
// phpcs:disable WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
// phpcs:disable Generic.Commenting.DocComment.MissingShort
// phpcs:disable Squiz.Commenting.FunctionComment.EmptyThrows
// phpcs:disable Squiz.Commenting.FunctionCommentThrowTag.WrongNumber
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_read_fread
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_read_fclose
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_read_fopen
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_read_file_put_contents
// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamTag

namespace Automattic\Jetpack\VideoPress\Tus;

use InvalidArgumentException;

/**
 * File Store cache
 */
class File_Store extends Abstract_Cache {

	/** @var int */
	const LOCK_NONE = 0;

	/** @var string */
	protected $cacheDir;

	/** @var string */
	protected $cacheFile;

	/**
	 * File_Store constructor.
	 *
	 * @throws InvalidArgumentException
	 * @param string|null $cacheDir
	 * @param string|null $cacheFile
	 */
	public function __construct( $cacheDir = null, $cacheFile = null ) {
		if ( $cacheDir !== null && ! is_string( $cacheDir ) ) {
			throw new InvalidArgumentException( '$cacheDir needs to be a string' );
		}
		if ( $cacheFile !== null && ! is_string( $cacheFile ) ) {
			throw new InvalidArgumentException( '$cacheFile needs to be a string' );
		}

		$cacheDir  = ! empty( $cacheDir ) ? $cacheDir : Config::get( 'file.dir' );
		$cacheFile = ! empty( $cacheFile ) ? $cacheFile : Config::get( 'file.name' );

		$this->setCacheDir( $cacheDir );
		$this->setCacheFile( $cacheFile );
	}

	/**
	 * Set cache dir.
	 *
	 * @param string $path
	 *
	 * @throws InvalidArgumentException
	 * @return self
	 */
	public function setCacheDir( $path ) {
		if ( ! is_string( $path ) ) {
			throw new InvalidArgumentException( '$path needs to be a string' );
		}
		$this->cacheDir = $path;

		return $this;
	}

	/**
	 * Get cache dir.
	 *
	 * @return string
	 */
	public function getCacheDir() {
		return $this->cacheDir;
	}

	/**
	 * Set cache file.
	 *
	 * @param string $file
	 *
	 * @throws InvalidArgumentException
	 * @return self
	 */
	public function setCacheFile( $file ) {
		if ( ! is_string( $file ) ) {
			throw new InvalidArgumentException( '$file needs to be a string' );
		}
		$this->cacheFile = $file;

		return $this;
	}

	/**
	 * Get cache file.
	 *
	 * @return string
	 */
	public function getCacheFile() {
		return $this->cacheDir . $this->cacheFile;
	}

	/**
	 * Create cache dir if not exists.
	 *
	 * @return void
	 */
	protected function createCacheDir() {
		if ( ! file_exists( $this->cacheDir ) ) {
			mkdir( $this->cacheDir );
		}
	}

	/**
	 * Create a cache file.
	 *
	 * @return void
	 */
	protected function createCacheFile() {
		$this->createCacheDir();

		$cacheFilePath = $this->getCacheFile();

		if ( ! file_exists( $cacheFilePath ) ) {
			touch( $cacheFilePath );
		}
	}

	/**
	 * {@inheritDoc}
	 *
	 * @throws InvalidArgumentException
	 */
	public function get( $key, $withExpired = false ) {
		if ( ! is_string( $key ) ) {
			throw new InvalidArgumentException( '$key needs to be a string' );
		}
		if ( ! is_bool( $withExpired ) ) {
			throw new InvalidArgumentException( '$withExpired needs to be a boolean' );
		}
		$key      = $this->getActualCacheKey( $key );
		$contents = $this->getCacheContents();

		if ( empty( $contents[ $key ] ) ) {
			return null;
		}

		if ( $withExpired ) {
			return $contents[ $key ];
		}

		return $this->isValid( $key ) ? $contents[ $key ] : null;
	}

	/**
	 * @param string        $path
	 * @param int           $type
	 * @param callable|null $cb
	 *
	 * @throws InvalidArgumentException
	 * @return mixed
	 */
	protected function lock( $path, $type = LOCK_SH, callable $cb = null ) {
		if ( ! is_string( $path ) ) {
			throw new InvalidArgumentException( '$path needs to be a string' );
		}
		if ( ! is_int( $type ) ) {
			throw new InvalidArgumentException( '$type needs to be an integer' );
		}
		$out    = false;
		$handle = @fopen( $path, File::READ_BINARY ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

		if ( false === $handle ) {
			return $out;
		}

		try {
			if ( flock( $handle, $type ) ) {
				clearstatcache( true, $path );

				$out = $cb( $handle );
			}
		} finally {
			flock( $handle, LOCK_UN );
			fclose( $handle );
		}

		return $out;
	}

	/**
	 * Get contents of a file with shared access.
	 *
	 * @param string $path
	 *
	 * @throws InvalidArgumentException
	 * @return string
	 */
	public function sharedGet( $path ) {
		if ( ! is_string( $path ) ) {
			throw new InvalidArgumentException( '$path needs to be a string' );
		}
		return $this->lock(
			$path,
			LOCK_SH,
			function ( $handle ) use ( $path ) {
				$contents = fread( $handle, filesize( $path ) ?: 1 ); // phpcs:ignore Universal.Operators.DisallowShortTernary.Found

				if ( false === $contents ) {
					return '';
				}

				return $contents;
			}
		);
	}

	/**
	 * Write the contents of a file with exclusive lock.
	 *
	 * @param string $path
	 * @param string $contents
	 * @param int    $lock
	 *
	 * @throws InvalidArgumentException
	 * @return int|false
	 */
	public function put( $path, $contents, $lock = LOCK_EX ) {
		if ( ! is_string( $path ) ) {
			throw new InvalidArgumentException( '$path needs to be a string' );
		}
		if ( ! is_string( $contents ) ) {
			throw new InvalidArgumentException( '$contents needs to be a string' );
		}
		if ( ! is_int( $lock ) ) {
			throw new InvalidArgumentException( '$lock needs to be an integer' );
		}
		return file_put_contents( $path, $contents, $lock );
	}

	/**
	 * {@inheritDoc}
	 *
	 * @throws InvalidArgumentException
	 */
	public function set( $key, $value ) {
		if ( ! is_string( $key ) ) {
			throw new InvalidArgumentException( '$key needs to be a string' );
		}
		$cacheKey  = $this->getActualCacheKey( $key );
		$cacheFile = $this->getCacheFile();

		if ( ! file_exists( $cacheFile ) || ! $this->isValid( $cacheKey ) ) {
			$this->createCacheFile();
		}

		return $this->lock(
			$cacheFile,
			LOCK_EX,
			function ( $handle ) use ( $cacheKey, $cacheFile, $value ) {
				$contents = fread( $handle, filesize( $cacheFile ) ?: 1 ); // phpcs:ignore Universal.Operators.DisallowShortTernary.Found
				$contents = $contents ? json_decode( $contents, true ) : array();

				if ( ! empty( $contents[ $cacheKey ] ) && \is_array( $value ) ) {
					$contents[ $cacheKey ] = $value + $contents[ $cacheKey ];
				} else {
					$contents[ $cacheKey ] = $value;
				}

				return $this->put( $cacheFile, wp_json_encode( $contents ), self::LOCK_NONE );
			}
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @throws InvalidArgumentException
	 */
	public function delete( $key ) {
		if ( ! is_string( $key ) ) {
			throw new InvalidArgumentException( '$key needs to be a string' );
		}
		$cacheKey = $this->getActualCacheKey( $key );
		$contents = $this->getCacheContents();

		if ( isset( $contents[ $cacheKey ] ) ) {
			unset( $contents[ $cacheKey ] );

			return false !== $this->put( $this->getCacheFile(), wp_json_encode( $contents ) );
		}

		return false;
	}

	/**
	 * {@inheritDoc}
	 */
	public function keys() {
		$contents = $this->getCacheContents();

		if ( \is_array( $contents ) ) {
			return array_keys( $contents );
		}

		return array();
	}

	/**
	 * Check if cache is still valid.
	 *
	 * @param string $key
	 *
	 * @throws InvalidArgumentException
	 * @return bool
	 */
	public function isValid( $key ) {
		if ( ! is_string( $key ) ) {
			throw new InvalidArgumentException( '$key needs to be a string' );
		}
		$key  = $this->getActualCacheKey( $key );
		$meta = ! empty( $this->getCacheContents()[ $key ] ) ? $this->getCacheContents()[ $key ] : array();

		if ( empty( $meta['expires_at'] ) ) {
			return false;
		}

		return time() < strtotime( $meta['expires_at'] );
	}

	/**
	 * Get cache contents.
	 *
	 * @return array|bool
	 */
	public function getCacheContents() {
		$cacheFile = $this->getCacheFile();

		if ( ! file_exists( $cacheFile ) ) {
			return false;
		}

		$content = json_decode( $this->sharedGet( $cacheFile ), true );
		return $content ? $content : array();
	}

	/**
	 * Get actual cache key with prefix.
	 *
	 * @param string $key
	 *
	 * @throws InvalidArgumentException
	 * @return string
	 */
	public function getActualCacheKey( $key ) {
		if ( ! is_string( $key ) ) {
			throw new InvalidArgumentException( '$key needs to be a string' );
		}
		$prefix = $this->getPrefix();

		if ( false === strpos( $key, $prefix ) ) {
			$key = $prefix . $key;
		}

		return $key;
	}
}
