<?php
/**
 * VideoPress Uploader
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use TusPhp\Exception\ConnectionException;
use TusPhp\Exception\FileException;
use TusPhp\Exception\TusException;

/**
 * VideoPress Uploader class
 *
 * Handles the upload from the Media Library to VideoPress servers
 */
class Uploader {

	/**
	 * The key of the post meta that holds the ID of the attachment that holds the VideoPress video, in case this attachment was uploaded before.
	 *
	 * @var string
	 */
	const UPLOADED_KEY = '_videopress_uploaded_id';

	/**
	 * The chunk size of each upload step
	 *
	 * @var int
	 */
	const CHUNK_SIZE = 1000000;

	/**
	 * The Tus Client instance
	 *
	 * @var Tus_Client
	 */
	protected $client = null;

	/**
	 * The attachment ID
	 *
	 * @var int
	 */
	protected $attachment_id;

	/**
	 * Checks whether this feature is supported by the server
	 *
	 * @return boolean
	 */
	public static function is_supported() {
		return version_compare( phpversion(), '7', '>=' );
	}

	/**
	 * Constructs the object
	 *
	 * @throws Upload_Exception If attachment is invalid or server does not support it.
	 * @param int $attachment_id The ID of the video attachment we want to upload to VideoPress.
	 */
	public function __construct( $attachment_id ) {
		if ( ! $this->is_supported() ) {
			throw new Upload_Exception( __( 'VideoPress uploader requires PHP 7 or higher', 'jetpack-videopress' ) );
		}
		$this->attachment_id = $attachment_id;
		if ( ! $this->get_file_path() ) {
			throw new Upload_Exception( __( 'Invalid attachment ID', 'jetpack-videopress' ) );
		}
		if ( ! is_readable( $this->get_file_path() ) ) {
			throw new Upload_Exception( __( 'File not found', 'jetpack-videopress' ) );
		}
		if ( ! $this->file_has_supported_mime_type() ) {
			throw new Upload_Exception( __( 'Mime type not supported', 'jetpack-videopress' ) );
		}
	}

	/**
	 * Gets the path of the video file
	 *
	 * @return string
	 */
	public function get_file_path() {
		return get_attached_file( $this->attachment_id );
	}

	/**
	 * Gets the mime type of the attachment
	 *
	 * @return string
	 */
	public function get_file_mime_type() {
		return get_post_mime_type( $this->attachment_id );
	}

	/**
	 * Gets the name of the video file
	 *
	 * @return string
	 */
	public function get_file_name() {
		return basename( $this->get_file_path() );
	}

	/**
	 * Gets the size of the video file
	 *
	 * @return int
	 */
	public function get_file_size() {
		return filesize( $this->get_file_path() );
	}

	/**
	 * Checks if the mime type of the attachment is supported to be uploaded
	 *
	 * @return boolean
	 */
	public function file_has_supported_mime_type() {
		return 0 === strpos( $this->get_file_mime_type(), 'video/' );
	}

	/**
	 * Gets the VideoPress upload token
	 *
	 * @throws Upload_Exception If it fails to fetch the token.
	 *
	 * @return string
	 */
	public function get_upload_token() {
		$blog_id  = Jetpack_Options::get_option( 'id' );
		$endpoint = "sites/{$blog_id}/media/videopress-upload-jwt";
		$args     = array( 'method' => 'POST' );
		$result   = Client::wpcom_json_api_request_as_blog( $endpoint, 'v2', $args, null, 'wpcom' );
		if ( is_wp_error( $result ) ) {
			throw new Upload_Exception(
				__( 'Could not obtain a VideoPress upload JWT. Please try again later.', 'jetpack-videopress' ) .
				'(' . $result->get_error_message() . ')'
			);
		}

		$response = json_decode( $result['body'], true );

		if ( empty( $response['upload_token'] ) ) {
			throw new Upload_Exception( __( 'Could not obtain a VideoPress upload JWT. Please try again later. (empty upload token)', 'jetpack-videopress' ) );
		}

		return $response['upload_token'];

	}

	/**
	 * Gets a unique upload key for this attachment
	 *
	 * @return string
	 */
	public function get_key() {
		return sprintf( 's-%d-v-%d', Jetpack_Options::get_option( 'id' ), $this->attachment_id );
	}

	/**
	 * Sets the current attachment as uploaded and stores the ID of the VideoPress video attachment ID
	 *
	 * @param int $new_attachment_id The ID of the new attachment created to hold the VideoPress video.
	 * @return void
	 */
	protected function mark_as_uploaded( $new_attachment_id ) {
		update_post_meta( $this->attachment_id, self::UPLOADED_KEY, $new_attachment_id );
	}

	/**
	 * Checks whether this attachment was uploaded before
	 *
	 * @return boolean
	 */
	public function is_uploaded() {
		return false !== get_post_meta( $this->attachment_id, self::UPLOADED_KEY, true );
	}

	/**
	 * Gets the ID of the VideoPress video attachment in case this attachment was uploaded before
	 *
	 * @return boolean|string False if value is absent. Post ID on success.
	 */
	public function get_uploaded_attachment_id() {
		return get_post_meta( $this->attachment_id, self::UPLOADED_KEY, true );
	}

	/**
	 * Retrieves the instance of the Tus_Client
	 *
	 * @return Tus_Client
	 */
	public function get_client() {
		if ( $this->client !== null ) {
			return $this->client;
		}
		$options      = array(
			'headers' => array(
				'x-videopress-upload-token' => $this->get_upload_token(),
			),
		);
		$endpoint     = sprintf( 'https://public-api.wordpress.com/rest/v1.1/video-uploads/%d', Jetpack_Options::get_option( 'id' ) );
		$client       = new \Automattic\Jetpack\VideoPress\Tus_Client( $endpoint, $options );
		$this->client = $client->setApiPath( '' )->setKey( $this->get_key() );

		$this->client->getCache()->setCacheDir( trailingslashit( sys_get_temp_dir() ) )->setCacheFile( $this->get_key() . '.tus.cache' );

		return $this->client;
	}

	/**
	 * Uploads a chunk of the file
	 *
	 * @return array With the status of the upload
	 */
	public function upload() {
		if ( $this->is_uploaded() ) {
			return $this->check_status();
		}
		try {
			$this->get_client()->file( $this->get_file_path(), $this->get_file_name() );

			$bytes_uploaded = $this->get_client()->upload( self::CHUNK_SIZE );

			if ( $bytes_uploaded === $this->get_file_size() ) {
				$this->mark_as_uploaded( $this->get_client()->get_uploaded_video_details()['media_id'] );
				return array(
					'status'           => 'complete',
					'bytes_uploaded'   => $bytes_uploaded,
					'upload_key'       => $this->get_key(),
					'uploaded_details' => $this->get_client()->get_uploaded_video_details(),
				);
			}

			return array(
				'status'         => 'uploading',
				'bytes_uploaded' => $bytes_uploaded,
				'upload_key'     => $this->get_key(),
			);
		} catch ( Upload_Exception | ConnectionException | FileException | TusException $e ) { // phpcs:ignore PHPCompatibility.ControlStructures.NewMultiCatch.Found
			return array(
				'status'         => 'error',
				'bytes_uploaded' => -1,
				'upload_key'     => $this->get_key(),
				'error'          => $e->getMessage(),
			);
		}
	}

	/**
	 * Checks the status of the upload of this attachment
	 *
	 * @return array
	 */
	public function check_status() {

		if ( $this->is_uploaded() ) {
			return array(
				'status'           => 'uploaded',
				'upload_key'       => $this->get_key(),
				'uploaded_post_id' => $this->get_uploaded_attachment_id(),
			);
		}

		try {
			$offset = $this->get_client()->getOffset();
			$status = false !== $offset ? 'resume' : 'new';
			$offset = false === $offset ? 0 : $offset;

			return array(
				'status'         => $status,
				'bytes_uploaded' => $offset,
				'upload_key'     => $this->get_key(),
			);
		} catch ( Upload_Exception | ConnectException $e ) { // phpcs:ignore PHPCompatibility.ControlStructures.NewMultiCatch.Found
			return array(
				'status'         => 'error',
				'bytes_uploaded' => -1,
			);
		} catch ( FileException $e ) {
			return array(
				'status'         => 'resume',
				'bytes_uploaded' => 0,
				'upload_key'     => '',
			);
		}
	}

}
