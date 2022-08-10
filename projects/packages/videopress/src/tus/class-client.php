<?php
/**
 * Client
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

namespace Automattic\Jetpack\VideoPress\Tus;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\GuzzleException;
use InvalidArgumentException;
use Ramsey\Uuid\Uuid;

/**
 * Client
 */
class Client extends Abstract_Tus {

	/** @var GuzzleClient */
	protected $client;

	/** @var string */
	protected $filePath;

	/** @var int */
	protected $fileSize = 0;

	/** @var string */
	protected $fileName;

	/** @var string */
	protected $key;

	/** @var string */
	protected $url;

	/** @var string */
	protected $checksum;

	/** @var int */
	protected $partialOffset = -1;

	/** @var bool */
	protected $partial = false;

	/** @var string */
	protected $checksumAlgorithm = 'sha256';

	/** @var array */
	protected $metadata = array();

	/** @var array */
	protected $headers = array();

	/**
	 * Client constructor.
	 *
	 * @param string $baseUri
	 * @param array  $options
	 *
	 * @throws \ReflectionException
	 * @throws InvalidArgumentException
	 */
	public function __construct( $baseUri, array $options = array() ) {
		if ( ! is_string( $baseUri ) ) {
			throw new InvalidArgumentException( '$baseUri needs to be a string' );
		}
		$this->headers      = isset( $options['headers'] ) ? $options['headers'] : array();
		$options['headers'] = array(
			'Tus-Resumable' => self::TUS_PROTOCOL_VERSION,
		) + ( $this->headers );

		$this->client = new GuzzleClient(
			array( 'base_uri' => $baseUri ) + $options
		);

		Config::set( __DIR__ . '/client-config.php' );

		$this->setCache( 'file' );
	}

	/**
	 * Set file properties.
	 *
	 * @param string      $file File path.
	 * @param string|null $name File name.
	 *
	 * @throws InvalidArgumentException
	 * @return Client
	 */
	public function file( $file, $name = null ) {
		if ( ! is_string( $file ) ) {
			throw new InvalidArgumentException( '$file needs to be a string' );
		}
		$this->filePath = $file;

		if ( ! file_exists( $file ) || ! is_readable( $file ) ) {
			throw new File_Exception( 'Cannot read file: ' . $file );
		}

		$this->fileName = ! empty( $name ) ? basename( $this->filePath ) : '';
		$this->fileSize = filesize( $file );

		$this->addMetadata( 'filename', $this->fileName );

		return $this;
	}

	/**
	 * Get file path.
	 *
	 * @return string|null
	 */
	public function getFilePath() {
		return $this->filePath;
	}

	/**
	 * Set file name.
	 *
	 * @param string $name
	 *
	 * @throws InvalidArgumentException
	 * @return Client
	 */
	public function setFileName( $name ) {
		if ( ! is_string( $name ) ) {
			throw new InvalidArgumentException( '$name needs to be a string' );
		}
		$this->addMetadata( 'filename', $this->fileName = $name );

		return $this;
	}

	/**
	 * Get file name.
	 *
	 * @return string|null
	 */
	public function getFileName() {
		return $this->fileName;
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
	 * Get guzzle client.
	 *
	 * @return GuzzleClient
	 */
	public function getClient() {
		return $this->client;
	}

	/**
	 * Set checksum.
	 *
	 * @param string $checksum
	 *
	 * @throws InvalidArgumentException
	 * @return Client
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
		if ( empty( $this->checksum ) ) {
			$this->setChecksum( hash_file( $this->getChecksumAlgorithm(), $this->getFilePath() ) );
		}

		return $this->checksum;
	}

	/**
	 * Add metadata.
	 *
	 * @param string $key
	 * @param string $value
	 *
	 * @throws InvalidArgumentException
	 * @return Client
	 */
	public function addMetadata( $key, $value ) {
		if ( ! is_string( $key ) || ! is_string( $value ) ) {
			throw new InvalidArgumentException( '$key and $value need to be strings' );
		}
		$this->metadata[ $key ] = base64_encode( $value ); //phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		return $this;
	}

	/**
	 * Remove metadata.
	 *
	 * @param string $key
	 *
	 * @throws InvalidArgumentException
	 * @return Client
	 */
	public function removeMetadata( $key ) {
		if ( ! is_string( $key ) ) {
			throw new InvalidArgumentException( '$key needs to be a string' );
		}
		unset( $this->metadata[ $key ] );

		return $this;
	}

	/**
	 * Set metadata.
	 *
	 * @param array $items
	 *
	 * @return Client
	 */
	public function setMetadata( array $items ) {
		$items = array_map( 'base64_encode', $items );

		$this->metadata = $items;

		return $this;
	}

	/**
	 * Get metadata.
	 *
	 * @return array
	 */
	public function getMetadata() {
		return $this->metadata;
	}

	/**
	 * Get metadata for Upload-Metadata header.
	 *
	 * @return string
	 */
	protected function getUploadMetadataHeader() {
		$metadata = array();

		foreach ( $this->getMetadata() as $key => $value ) {
			$metadata[] = "{$key} {$value}";
		}

		return implode( ',', $metadata );
	}

	/**
	 * Set key.
	 *
	 * @param string $key
	 *
	 * @throws InvalidArgumentException
	 * @return Client
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
	 * Get url.
	 *
	 * @throws File_Exception
	 * @return string|null
	 */
	public function getUrl() {
		$this->url = ! empty( $this->getCache()->get( $this->getKey() )['location'] ) ? $this->getCache()->get( $this->getKey() )['location'] : null;

		if ( ! $this->url ) {
			throw new File_Exception( 'File not found.' );
		}

		return $this->url;
	}

	/**
	 * Set checksum algorithm.
	 *
	 * @param string $algorithm
	 *
	 * @throws InvalidArgumentException
	 * @return Client
	 */
	public function setChecksumAlgorithm( $algorithm ) {
		if ( ! is_string( $algorithm ) ) {
			throw new InvalidArgumentException( '$algorithm needs to be a string' );
		}
		$this->checksumAlgorithm = $algorithm;

		return $this;
	}

	/**
	 * Get checksum algorithm.
	 *
	 * @return string
	 */
	public function getChecksumAlgorithm() {
		return $this->checksumAlgorithm;
	}

	/**
	 * Check if current upload is expired.
	 *
	 * @return bool
	 */
	public function isExpired() {
		$expiresAt = ! empty( $this->getCache()->get( $this->getKey() )['expires_at'] ) ? $this->getCache()->get( $this->getKey() )['expires_at'] : null;

		return empty( $expiresAt ) || time() > strtotime( $expiresAt );
	}

	/**
	 * Check if this is a partial upload request.
	 *
	 * @return bool
	 */
	public function isPartial() {
		return $this->partial;
	}

	/**
	 * Get partial offset.
	 *
	 * @return int
	 */
	public function getPartialOffset() {
		return $this->partialOffset;
	}

	/**
	 * Set offset and force this to be a partial upload request.
	 *
	 * @param int $offset
	 *
	 * @throws InvalidArgumentException
	 * @return self
	 */
	public function seek( $offset ) {
		if ( ! is_int( $offset ) ) {
			throw new InvalidArgumentException( '$offset needs to be an integer' );
		}
		$this->partialOffset = $offset;

		$this->partial();

		return $this;
	}

	/**
	 * Upload file.
	 *
	 * @param int $bytes Bytes to upload.
	 *
	 * @throws Tus_Exception
	 * @throws GuzzleException
	 * @throws Connection_Exception
	 * @throws InvalidArgumentException
	 *
	 * @return int
	 */
	public function upload( $bytes = -1 ) {
		if ( ! is_int( $bytes ) ) {
			throw new InvalidArgumentException( '$bytes needs to be an integer' );
		}
		$bytes  = $bytes < 0 ? $this->getFileSize() : $bytes;
		$offset = $this->partialOffset < 0 ? 0 : $this->partialOffset;

		try {
			// Check if this upload exists with HEAD request.
			$offset = $this->sendHeadRequest();
		} catch ( File_Exception $e ) {
			// Create a new upload.
			$this->url = $this->create( $this->getKey() );
		} catch ( ClientException $e ) {
			// Create a new upload.
			$this->url = $this->create( $this->getKey() );
		} catch ( ConnectException $e ) {
			throw new Connection_Exception( "Couldn't connect to server." );
		}

		// Verify that upload is not yet expired.
		if ( $this->isExpired() ) {
			throw new Tus_Exception( 'Upload expired.' );
		}

		// Now, resume upload with PATCH request.
		return $this->sendPatchRequest( $bytes, $offset );
	}

	/**
	 * Returns offset if file is partially uploaded.
	 *
	 * @throws GuzzleException
	 *
	 * @return bool|int
	 */
	public function getOffset() {
		try {
			$offset = $this->sendHeadRequest();
		} catch ( File_Exception $e ) {
			return false;
		} catch ( ClientException $e ) {
			return false;
		}

		return $offset;
	}

	/**
	 * Create resource with POST request.
	 *
	 * @param string $key
	 *
	 * @throws File_Exception
	 * @throws GuzzleException
	 * @throws InvalidArgumentException
	 *
	 * @return string
	 */
	public function create( $key ) {
		if ( ! is_string( $key ) ) {
			throw new InvalidArgumentException( '$key needs to be a string' );
		}
		return $this->createWithUpload( $key, 0 )['location'];
	}

	/**
	 * Create resource with POST request and upload data using the creation-with-upload extension.
	 *
	 * @see https://tus.io/protocols/resumable-upload.html#creation-with-upload
	 *
	 * @param string $key
	 * @param int    $bytes -1 => all data; 0 => no data.
	 *
	 * @throws GuzzleException
	 * @throws InvalidArgumentException
	 * @throws File_Exception
	 *
	 * @return array [
	 *     'location' => string,
	 *     'offset' => int
	 * ]
	 */
	public function createWithUpload( $key, $bytes = -1 ) {
		if ( ! is_string( $key ) ) {
			throw new InvalidArgumentException( '$key needs to be a string' );
		}
		$bytes = $bytes < 0 ? $this->fileSize : $bytes;

		$headers = $this->headers + array(
			'Upload-Length'   => $this->fileSize,
			'Upload-Key'      => $key,
			'Upload-Checksum' => $this->getUploadChecksumHeader(),
			'Upload-Metadata' => $this->getUploadMetadataHeader(),
		);

		$data = '';
		if ( $bytes > 0 ) {
			$data = $this->getData( 0, $bytes );

			$headers += array(
				'Content-Type'   => self::HEADER_CONTENT_TYPE,
				'Content-Length' => \strlen( $data ),
			);
		}

		if ( $this->isPartial() ) {
			$headers += array( 'Upload-Concat' => 'partial' );
		}

		try {
			$response = $this->getClient()->post(
				$this->apiPath,
				array(
					'body'    => $data,
					'headers' => $headers,
				)
			);
		} catch ( ClientException $e ) {
			$response = $e->getResponse();
		}

		$statusCode = $response->getStatusCode();

		if ( Response_Codes::HTTP_CREATED !== $statusCode ) {
			throw new File_Exception( 'Unable to create resource.' );
		}

		$uploadOffset   = $bytes > 0 ? current( $response->getHeader( 'upload-offset' ) ) : 0;
		$uploadLocation = current( $response->getHeader( 'location' ) );

		$this->getCache()->set(
			$this->getKey(),
			array(
				'location'   => $uploadLocation,
				'expires_at' => gmdate( $this->getCache()::RFC_7231, time() + $this->getCache()->getTtl() ),
			)
		);

		return array(
			'location' => $uploadLocation,
			'offset'   => $uploadOffset,
		);
	}

	/**
	 * Concatenate 2 or more partial uploads.
	 *
	 * @param string $key
	 * @param mixed  ...$partials
	 *
	 * @throws GuzzleException
	 * @throws InvalidArgumentException
	 * @throws File_Exception
	 *
	 * @return string
	 */
	public function concat( $key, ...$partials ) {
		if ( ! is_string( $key ) ) {
			throw new InvalidArgumentException( '$key needs to be a string' );
		}
		$response = $this->getClient()->post(
			$this->apiPath,
			array(
				'headers' => $this->headers + array(
					'Upload-Length'   => $this->fileSize,
					'Upload-Key'      => $key,
					'Upload-Checksum' => $this->getUploadChecksumHeader(),
					'Upload-Metadata' => $this->getUploadMetadataHeader(),
					'Upload-Concat'   => self::UPLOAD_TYPE_FINAL . ';' . implode( ' ', $partials ),
				),
			)
		);

		$data       = json_decode( $response->getBody(), true );
		$checksum   = ! empty( $data['data']['checksum'] ) ? $data['data']['checksum'] : null;
		$statusCode = $response->getStatusCode();

		if ( Response_Codes::HTTP_CREATED !== $statusCode || ! $checksum ) {
			throw new File_Exception( 'Unable to create resource.' );
		}

		return $checksum;
	}

	/**
	 * Send DELETE request.
	 *
	 * @throws File_Exception
	 * @throws GuzzleException
	 *
	 * @return void
	 */
	public function delete() {
		try {
			$this->getClient()->delete( $this->getUrl() );
		} catch ( ClientException $e ) {
			$statusCode = $e->getResponse()->getStatusCode();

			if ( Response_Codes::HTTP_NOT_FOUND === $statusCode || Response_Codes::HTTP_GONE === $statusCode ) {
				throw new File_Exception( 'File not found.' );
			}
		}
	}

	/**
	 * Set as partial request.
	 *
	 * @param bool $state
	 *
	 * @throws InvalidArgumentException
	 * @return void
	 */
	protected function partial( $state = true ) {
		if ( ! is_bool( $state ) ) {
			throw new InvalidArgumentException( '$state needs to be a boolean' );
		}
		$this->partial = $state;

		if ( ! $this->partial ) {
			return;
		}

		$key = $this->getKey();

		if ( false !== strpos( $key, self::PARTIAL_UPLOAD_NAME_SEPARATOR ) ) {
			list($key, /* $partialKey */) = explode( self::PARTIAL_UPLOAD_NAME_SEPARATOR, $key );
		}

		$this->key = $key . self::PARTIAL_UPLOAD_NAME_SEPARATOR . Uuid::uuid4()->toString();
	}

	/**
	 * Send HEAD request.
	 *
	 * @throws File_Exception
	 * @throws GuzzleException
	 *
	 * @return int
	 */
	protected function sendHeadRequest() {
		$response   = $this->getClient()->head( $this->getUrl() );
		$statusCode = $response->getStatusCode();

		if ( Response_Codes::HTTP_OK !== $statusCode ) {
			throw new File_Exception( 'File not found.' );
		}

		return (int) current( $response->getHeader( 'upload-offset' ) );
	}

	/**
	 * Send PATCH request.
	 *
	 * @param int $bytes
	 * @param int $offset
	 *
	 * @throws Tus_Exception
	 * @throws File_Exception
	 * @throws GuzzleException
	 * @throws Connection_Exception
	 * @throws InvalidArgumentException
	 *
	 * @return int
	 */
	protected function sendPatchRequest( $bytes, $offset ) {
		if ( ! is_int( $bytes ) || ! is_int( $offset ) ) {
			throw new InvalidArgumentException( '$bytes and $offset need to be integers' );
		}
		$data    = $this->getData( $offset, $bytes );
		$headers = $this->headers + array(
			'Content-Type'    => self::HEADER_CONTENT_TYPE,
			'Content-Length'  => \strlen( $data ),
			'Upload-Checksum' => $this->getUploadChecksumHeader(),
		);

		if ( $this->isPartial() ) {
			$headers += array( 'Upload-Concat' => self::UPLOAD_TYPE_PARTIAL );
		} else {
			$headers += array( 'Upload-Offset' => $offset );
		}

		try {
			$response = $this->getClient()->patch(
				$this->getUrl(),
				array(
					'body'    => $data,
					'headers' => $headers,
				)
			);

			return (int) current( $response->getHeader( 'upload-offset' ) );
		} catch ( ClientException $e ) {
			throw $this->handleClientException( $e );
		} catch ( ConnectException $e ) {
			throw new Connection_Exception( "Couldn't connect to server." );
		}
	}

	/**
	 * Handle client exception during patch request.
	 *
	 * @param ClientException $e
	 *
	 * @return \Exception
	 */
	protected function handleClientException( ClientException $e ) {
		$response   = $e->getResponse();
		$statusCode = $response !== null ? $response->getStatusCode() : Response_Codes::HTTP_INTERNAL_SERVER_ERROR;

		if ( Response_Codes::HTTP_REQUESTED_RANGE_NOT_SATISFIABLE === $statusCode ) {
			return new File_Exception( 'The uploaded file is corrupt.' );
		}

		if ( Response_Codes::HTTP_CONTINUE === $statusCode ) {
			return new Connection_Exception( 'Connection aborted by user.' );
		}

		if ( Response_Codes::HTTP_UNSUPPORTED_MEDIA_TYPE === $statusCode ) {
			return new Tus_Exception( 'Unsupported media types.' );
		}

		return new Tus_Exception( (string) $response->getBody(), $statusCode );
	}

	/**
	 * Get X bytes of data from file.
	 *
	 * @param int $offset
	 * @param int $bytes
	 *
	 * @throws InvalidArgumentException
	 *
	 * @return string
	 */
	protected function getData( $offset, $bytes ) {
		if ( ! is_int( $bytes ) || ! is_int( $offset ) ) {
			throw new InvalidArgumentException( '$bytes and $offset need to be integers' );
		}
		$file   = new File();
		$handle = $file->open( $this->getFilePath(), $file::READ_BINARY );

		$file->seek( $handle, $offset );

		$data = $file->read( $handle, $bytes );

		$file->close( $handle );

		return $data;
	}

	/**
	 * Get upload checksum header.
	 *
	 * @return string
	 */
	protected function getUploadChecksumHeader() {
		return $this->getChecksumAlgorithm() . ' ' . base64_encode( $this->getChecksum() ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
	}
}
