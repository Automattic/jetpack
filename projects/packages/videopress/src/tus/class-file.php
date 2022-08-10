<?php
/**
 * File
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
// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_read_fwrite
// phpcs:disable WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
// phpcs:disable WordPress.NamingConventions.ValidVariableName.InterpolatedVariableNotSnakeCase

namespace Automattic\Jetpack\VideoPress\Tus;

use InvalidArgumentException;

/**
 * File
 */
class File {

	/** @const Max chunk size */
	const CHUNK_SIZE = 8192; // 8 kilobytes.

	/** @const Input stream */
	const INPUT_STREAM = 'php://input';

	/** @const Read binary mode */
	const READ_BINARY = 'rb';

	/** @const Append binary mode */
	const APPEND_BINARY = 'ab';

	/** @var string */
	protected $key;

	/** @var string */
	protected $checksum;

	/** @var string */
	protected $name;

	/** @var Cacheable */
	protected $cache;

	/** @var int */
	protected $offset;

	/** @var string */
	protected $location;

	/** @var string */
	protected $filePath;

	/** @var int */
	protected $fileSize;

	/** @var string[] */
	private $uploadMetadata = array();

	/**
	 * File constructor.
	 *
	 * @param string|null    $name
	 * @param Cacheable|null $cache
	 *
	 * @throws InvalidArgumentException
	 */
	public function __construct( $name = null, Cacheable $cache = null ) {
		if ( $name !== null && ! is_string( $name ) ) {
			throw new InvalidArgumentException( '$name needs to be a string' );
		}
		$this->name  = $name;
		$this->cache = $cache;
	}

	/**
	 * Set file meta.
	 *
	 * @param int         $offset
	 * @param int         $fileSize
	 * @param string      $filePath
	 * @param string|null $location
	 *
	 * @throws InvalidArgumentException
	 * @return File
	 */
	public function setMeta( $offset, $fileSize, $filePath, $location = null ) {
		if ( ! is_string( $filePath ) ) {
			throw new InvalidArgumentException( '$filePath needs to be a string' );
		}
		if ( $location !== null && ! is_string( $location ) ) {
			throw new InvalidArgumentException( '$location needs to be a string' );
		}
		if ( ! is_int( $offset ) || ! is_int( $fileSize ) ) {
			throw new InvalidArgumentException( '$offset and $fileSize need to be integers' );
		}
		$this->offset   = $offset;
		$this->fileSize = $fileSize;
		$this->filePath = $filePath;
		$this->location = $location;

		return $this;
	}

	/**
	 * Set name.
	 *
	 * @param string $name
	 *
	 * @throws InvalidArgumentException
	 * @return File
	 */
	public function setName( $name ) {
		if ( ! is_string( $name ) ) {
			throw new InvalidArgumentException( '$name needs to be a string' );
		}
		$this->name = $name;

		return $this;
	}

	/**
	 * Get name.
	 *
	 * @return string
	 */
	public function getName() {
		return $this->name;
	}

	/**
	 * Set file size.
	 *
	 * @param int $size
	 *
	 * @throws InvalidArgumentException
	 * @return File
	 */
	public function setFileSize( $size ) {
		if ( ! is_int( $size ) ) {
			throw new InvalidArgumentException( '$size needs to be an integer' );
		}
		$this->fileSize = $size;

		return $this;
	}

	/**
	 * Get file size.
	 *
	 * @return int
	 */
	public function getFileSize() {
		return $this->fileSize;
	}

	/**
	 * Set key.
	 *
	 * @param string $key
	 *
	 * @throws InvalidArgumentException
	 * @return File
	 */
	public function setKey( $key ) {
		if ( ! is_string( $key ) ) {
			throw new InvalidArgumentException( '$key needs to be a string' );
		}
		$this->key = $key;

		return $this;
	}

	/**
	 * Get key.
	 *
	 * @return string
	 */
	public function getKey() {
		return $this->key;
	}

	/**
	 * Set checksum.
	 *
	 * @param string $checksum
	 *
	 * @throws InvalidArgumentException
	 * @return File
	 */
	public function setChecksum( $checksum ) {
		if ( ! is_string( $checksum ) ) {
			throw new InvalidArgumentException( '$checksum needs to be a string' );
		}
		$this->checksum = $checksum;

		return $this;
	}

	/**
	 * Get checksum.
	 *
	 * @return string
	 */
	public function getChecksum() {
		return $this->checksum;
	}

	/**
	 * Set offset.
	 *
	 * @param int $offset
	 *
	 * @throws InvalidArgumentException
	 * @return File
	 */
	public function setOffset( $offset ) {
		if ( ! is_int( $offset ) ) {
			throw new InvalidArgumentException( '$offset needs to be an integer' );
		}
		$this->offset = $offset;

		return $this;
	}

	/**
	 * Get offset.
	 *
	 * @return int
	 */
	public function getOffset() {
		return $this->offset;
	}

	/**
	 * Set location.
	 *
	 * @param string $location
	 *
	 * @throws InvalidArgumentException
	 * @return File
	 */
	public function setLocation( $location ) {
		if ( ! is_string( $location ) ) {
			throw new InvalidArgumentException( '$location needs to be a string' );
		}
		$this->location = $location;

		return $this;
	}

	/**
	 * Get location.
	 *
	 * @return string
	 */
	public function getLocation() {
		return $this->location;
	}

	/**
	 * Set absolute file location.
	 *
	 * @param string $path
	 *
	 * @throws InvalidArgumentException
	 * @return File
	 */
	public function setFilePath( $path ) {
		if ( ! is_string( $path ) ) {
			throw new InvalidArgumentException( '$path needs to be a string' );
		}
		$this->filePath = $path;

		return $this;
	}

	/**
	 * Get absolute location.
	 *
	 * @return string
	 */
	public function getFilePath() {
		return $this->filePath;
	}

	/**
	 * @param string[] $metadata
	 *
	 * @return File
	 */
	public function setUploadMetadata( array $metadata ) {
		$this->uploadMetadata = $metadata;

		return $this;
	}

	/**
	 * Get input stream.
	 *
	 * @return string
	 */
	public function getInputStream() {
		return self::INPUT_STREAM;
	}

	/**
	 * Get file meta.
	 *
	 * @return array
	 */
	public function details() {
		$now   = time();
		$cache = $this->cache;

		return array(
			'name'       => $this->name,
			'size'       => $this->fileSize,
			'offset'     => $this->offset,
			'checksum'   => $this->checksum,
			'location'   => $this->location,
			'file_path'  => $this->filePath,
			'metadata'   => $this->uploadMetadata,
			'created_at' => gmdate( $cache::RFC_7231, $now ),
			'expires_at' => gmdate( $cache::RFC_7231, $now + $cache->getTtl() ),
		);
	}

	/**
	 * Upload file to server.
	 *
	 * @param int $totalBytes
	 *
	 * @throws Connection_Exception
	 * @throws InvalidArgumentException
	 *
	 * @return int
	 */
	public function upload( $totalBytes ) {
		if ( ! is_int( $totalBytes ) ) {
			throw new InvalidArgumentException( '$totalBytes needs to be an integer' );
		}
		if ( $this->offset === $totalBytes ) {
			return $this->offset;
		}

		$input  = $this->open( $this->getInputStream(), self::READ_BINARY );
		$output = $this->open( $this->getFilePath(), self::APPEND_BINARY );
		$key    = $this->getKey();

		try {
			$this->seek( $output, $this->offset );

			while ( ! feof( $input ) ) {
				if ( CONNECTION_NORMAL !== connection_status() ) {
					throw new Connection_Exception( 'Connection aborted by user.' );
				}

				$data  = $this->read( $input, self::CHUNK_SIZE );
				$bytes = $this->write( $output, $data, self::CHUNK_SIZE );

				$this->offset += $bytes;

				$this->cache->set( $key, array( 'offset' => $this->offset ) );

				if ( $this->offset > $totalBytes ) {
					throw new Out_Of_Range_Exception( 'The uploaded file is corrupt.' );
				}

				if ( $this->offset === $totalBytes ) {
					break;
				}
			}
		} finally {
			$this->close( $input );
			$this->close( $output );
		}

		return $this->offset;
	}

	/**
	 * Open file in given mode.
	 *
	 * @param string $filePath
	 * @param string $mode
	 *
	 * @throws File_Exception
	 * @throws InvalidArgumentException
	 *
	 * @return resource
	 */
	public function open( $filePath, $mode ) {
		if ( ! is_string( $filePath ) || ! is_string( $mode ) ) {
			throw new InvalidArgumentException( '$filePath and $mode need to be strings' );
		}
		$this->exists( $filePath, $mode );

		$ptr = @fopen( $filePath, $mode ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

		if ( false === $ptr ) {
			throw new File_Exception( "Unable to open $filePath." );
		}

		return $ptr;
	}

	/**
	 * Check if file to read exists.
	 *
	 * @param string $filePath
	 * @param string $mode
	 *
	 * @throws File_Exception
	 * @throws InvalidArgumentException
	 *
	 * @return bool
	 */
	public function exists( $filePath, $mode = self::READ_BINARY ) {
		if ( ! is_string( $filePath ) || ! is_string( $mode ) ) {
			throw new InvalidArgumentException( '$filePath and $mode need to be strings' );
		}
		if ( self::INPUT_STREAM === $filePath ) {
			return true;
		}

		if ( self::READ_BINARY === $mode && ! file_exists( $filePath ) ) {
			throw new File_Exception( 'File not found.' );
		}

		return true;
	}

	/**
	 * Move file pointer to given offset.
	 *
	 * @param resource $handle
	 * @param int      $offset
	 * @param int      $whence
	 *
	 * @throws File_Exception
	 * @throws InvalidArgumentException
	 *
	 * @return int
	 */
	public function seek( $handle, $offset, $whence = SEEK_SET ) {
		if ( ! is_int( $offset ) || ! is_int( $whence ) ) {
			throw new InvalidArgumentException( '$offset and $whence need to be integers' );
		}
		$position = fseek( $handle, $offset, $whence );

		if ( -1 === $position ) {
			throw new File_Exception( 'Cannot move pointer to desired position.' );
		}

		return $position;
	}

	/**
	 * Read data from file.
	 *
	 * @param resource $handle
	 * @param int      $chunkSize
	 *
	 * @throws File_Exception
	 * @throws InvalidArgumentException
	 *
	 * @return string
	 */
	public function read( $handle, $chunkSize ) {
		if ( ! is_int( $chunkSize ) ) {
			throw new InvalidArgumentException( '$chunkSize needs to be an integer' );
		}
		$data = fread( $handle, $chunkSize );

		if ( false === $data ) {
			throw new File_Exception( 'Cannot read file.' );
		}

		return $data;
	}

	/**
	 * Write data to file.
	 *
	 * @param resource $handle
	 * @param string   $data
	 * @param int|null $length
	 *
	 * @throws File_Exception
	 * @throws InvalidArgumentException
	 *
	 * @return int
	 */
	public function write( $handle, $data, $length = null ) {
		if ( ! is_string( $data ) ) {
			throw new InvalidArgumentException( '$data needs to be a string' );
		}
		$bytesWritten = \is_int( $length ) ? fwrite( $handle, $data, $length ) : fwrite( $handle, $data );

		if ( false === $bytesWritten ) {
			throw new File_Exception( 'Cannot write to a file.' );
		}

		return $bytesWritten;
	}

	/**
	 * Merge 2 or more files.
	 *
	 * @param array $files File data with meta info.
	 *
	 * @throws File_Exception
	 * @return int
	 */
	public function merge( array $files ) {
		$destination = $this->getFilePath();
		$firstFile   = array_shift( $files );

		// First partial file can directly be copied.
		$this->copy( $firstFile['file_path'], $destination );

		$this->offset   = $firstFile['offset'];
		$this->fileSize = filesize( $firstFile['file_path'] );

		$handle = $this->open( $destination, self::APPEND_BINARY );

		foreach ( $files as $file ) {
			if ( ! file_exists( $file['file_path'] ) ) {
				throw new File_Exception( 'File to be merged not found.' );
			}

			$this->fileSize += $this->write( $handle, file_get_contents( $file['file_path'] ) );

			$this->offset += $file['offset'];
		}

		$this->close( $handle );

		return $this->fileSize;
	}

	/**
	 * Copy file from source to destination.
	 *
	 * @param string $source
	 * @param string $destination
	 *
	 * @throws InvalidArgumentException
	 * @return bool
	 */
	public function copy( $source, $destination ) {
		if ( ! is_string( $source ) || ! is_string( $destination ) ) {
			throw new InvalidArgumentException( '$source and $destination need to be strings' );
		}
		$status = @copy( $source, $destination ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

		if ( false === $status ) {
			throw new File_Exception( sprintf( 'Cannot copy source (%s) to destination (%s).', $source, $destination ) );
		}

		return $status;
	}

	/**
	 * Delete file and/or folder.
	 *
	 * @param array $files
	 * @param bool  $folder
	 *
	 * @throws InvalidArgumentException
	 * @return bool
	 */
	public function delete( array $files, $folder = false ) {
		if ( ! is_bool( $folder ) ) {
			throw new InvalidArgumentException( '$folder needs to be a boolean' );
		}
		$status = $this->deleteFiles( $files );

		if ( $status && $folder ) {
			return rmdir( \dirname( current( $files ) ) );
		}

		return $status;
	}

	/**
	 * Delete multiple files.
	 *
	 * @param array $files
	 *
	 * @return bool
	 */
	public function deleteFiles( array $files ) {
		if ( empty( $files ) ) {
			return false;
		}

		$status = true;

		foreach ( $files as $file ) {
			if ( file_exists( $file ) ) {
				$status = $status && unlink( $file );
			}
		}

		return $status;
	}

	// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamTag
	// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamName
	/**
	 * Close file.
	 *
	 * @param $handle
	 *
	 * @return bool
	 */
	public function close( $handle ) {
		return fclose( $handle );
	}
}
