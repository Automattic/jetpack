<?php
/**
 * VideoPress Uploader
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use TusPhp\Exception\TusException;
use TusPhp\Exception\FileException;
use TusPhp\Exception\ConnectionException;

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

	const CHUNK_SIZE = 1000000;

	protected $client = null;

	public static function is_supported() {
		return true;
	}

	public function __construct( $attachment_id ) {
		$this->attachment_id = $attachment_id;
	}

	public function get_filename( $id ) {
		return get_attached_file( $this->attachment_id );
	}

	public function get_upload_token() {
		$blog_id  = Jetpack_Options::get_option('id');
		$endpoint = "sites/{$blog_id}/media/videopress-upload-jwt";
		$args     = array( 'method' => 'POST' );
		$result   = Client::wpcom_json_api_request_as_blog( $endpoint, 'v2', $args, null, 'wpcom' );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload JWT. Please try again later.', 'jetpack' ) ) );
			return;
		}

		$response = json_decode( $result['body'], true );

		if ( empty( $response['upload_token'] ) ) {
			wp_send_json_error( array( 'message' => __( 'Could not obtain a VideoPress upload JWT. Please try again later. (empty upload token)', 'jetpack' ) ) );
			return;
		}

		return $response['upload_token'];

	}

	public function get_key() {
		return sprintf( 's-%d-v-%d', Jetpack_Options::get_option('id'), $this->attachment_id );
	}

	public function mark_as_uploaded( $new_attachment_id ) {
		update_post_meta( $this->attachment_id, self::UPLOADED_KEY, $new_attachment_id );
	}

	public function is_uploaded() {
		return false !== get_post_meta( $this->attachment_id, self::UPLOADED_KEY, true );
	}

	public function get_uploaded_attachment_id() {
		return get_post_meta( $this->attachment_id, self::UPLOADED_KEY, true );
	}

	public function get_client() {
		if ( ! is_null( $this->client ) ) {
			return $this->client;
		}
		$options = array(
			'headers' => array(
				'x-videopress-upload-token' => $this->get_upload_token(),
			),
		);
		$endpoint = sprintf( 'https://public-api.wordpress.com/rest/v1.1/video-uploads/%d', Jetpack_Options::get_option('id') );
		$client = new \Automattic\Jetpack\VideoPress\Tus_Client( $endpoint, $options );
		$this->client = $client->setApiPath('')->setKey( $this->get_key() );

		$this->client->getCache()->setCacheDir( trailingslashit( sys_get_temp_dir() ) )->setCacheFile( $key . '.tus.cache' );
		return $this->client;
	}

	public function upload() {
		try {
			$this->get_client()->file( $this->get_file_path(), $this->get_filename() );

			$bytesUploaded = $client->upload( self::CHUNK_SIZE);

			return array(
				'status' => 'uploading',
				'bytes_uploaded' => $bytesUploaded,
				'upload_key' => $uploadKey
			);
		} catch (ConnectionException | FileException | TusException $e) {
			return array(
				'status' => 'error',
				'bytes_uploaded' => -1,
				'upload_key' => '',
				'error' => $e->getMessage(),
			);
		}
	}

	public function check_status() {

		try {
			$offset = $this->get_client()->getOffset();
			$status = false !== $offset ? 'resume' : 'new';
			$offset = false === $offset ? 0 : $offset;

			return array(
				'status' => $status,
				'bytes_uploaded' => $offset,
				'upload_key' => $uploadKey,
			);
		} catch (ConnectException $e) {
			return array(
				'status' => 'error',
				'bytes_uploaded' => -1,
			);
		} catch (FileException $e) {
			return array(
				'status' => 'resume',
				'bytes_uploaded' => 0,
				'upload_key' => '',
			);
		}
	}

}
