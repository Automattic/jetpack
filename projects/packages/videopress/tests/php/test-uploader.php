<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests the Legacy Jetpack_XMLRPC_Server class.
 *
 * @package jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_Error;

/**
 * Class to test the legacy Jetpack_XMLRPC_Server class.
 */
class Test_Uploader extends BaseTestCase {

	/**
	 * Creates a new upload
	 *
	 * @param string  $file Path to a file.
	 * @param boolean $force_mime The mime type to force the attachment to be. Default is false which will read the mime from the file.
	 * @param integer $parent Post ID the attachment should be attached to.
	 * @return int The attachment ID.
	 */
	public function create_upload_object( $file, $force_mime = false, $parent = 0 ) {
		$contents = file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$upload   = wp_upload_bits( basename( $file ), null, $contents );

		if ( $force_mime ) {
			$type = $force_mime;
		} else {
			$type = '';
			if ( ! empty( $upload['type'] ) ) {
				$type = $upload['type'];
			} else {
				$mime = wp_check_filetype( $upload['file'], null );
				if ( $mime ) {
					$type = $mime['type'];
				}
			}
		}

		$attachment = array(
			'post_title'     => basename( $upload['file'] ),
			'post_content'   => '',
			'post_type'      => 'attachment',
			'post_parent'    => $parent,
			'post_mime_type' => $type,
			'guid'           => $upload['url'],
		);

		// Save the data
		$id = wp_insert_attachment( $attachment, $upload['file'], $parent );
		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );

		return $id;
	}

	/**
	 * Set up before each test
	 *
	 * @before
	 */
	protected function set_up() {
		parent::setUp();
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		$user_id = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'user_email' => 'admin@admin.com',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $user_id );

		// Mock connection
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );
		( new Tokens() )->update_user_token( $user_id, sprintf( '%s.%s.%d', 'key', 'private', $user_id ), false );

		$this->valid_attachment_id = $this->create_upload_object( __DIR__ . '/assets/sample-video.mp4', 'video/mp4' );

	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		Constants::clear_constants();
	}

	/**
	 * Data provider for test_get_upload_token
	 *
	 * @return array
	 */
	public function get_upload_token_data() {
		return array(
			'error response' => array(
				'error',
				null,
				true,
			),
			'empty response' => array(
				'empty',
				null,
				true,
			),
			'valid response' => array(
				'valid',
				'asd123qwe',
				false,
			),
		);
	}

	/**
	 * Returns a WP Error object
	 *
	 * @return WP_Error
	 */
	public function return_wp_error() {
		return new WP_Error( 'error' );
	}

	/**
	 * Returns a mock http response with a valid response for upload token.
	 *
	 * @return array
	 */
	public function return_valid_response() {
		return array( 'body' => wp_json_encode( array( 'upload_token' => 'asd123qwe' ) ) );
	}

	/**
	 * Returns a mock http response with an empty body
	 *
	 * @return array
	 */
	public function return_empty_response() {
		return array( 'body' => '' );
	}

	/**
	 * Tests the get_upload_token method
	 *
	 * @param string      $response_from_server The mock response we want from the server. valid, empty or error.
	 * @param string|null $expected The expected output of the method.
	 * @param bool        $throw Whether we expect the method to throw an exception.
	 * @dataProvider get_upload_token_data
	 */
	public function test_get_upload_token( $response_from_server, $expected, $throw ) {
		if ( 'valid' === $response_from_server ) {
			$callback = array( $this, 'return_valid_response' );
		} elseif ( 'empty' === $response_from_server ) {
			$callback = array( $this, 'return_empty_response' );
		} elseif ( 'error' === $response_from_server ) {
			$callback = array( $this, 'return_wp_error' );
		}
		$u = new Uploader( $this->valid_attachment_id );
		if ( $throw ) {
			$this->expectException( __NAMESPACE__ . '\Upload_Exception' );
		}
		add_filter( 'pre_http_request', $callback );
		$response = $u->get_upload_token();
		remove_filter( 'pre_http_request', $callback );
		$this->assertSame( $expected, $response );
	}

	/**
	 * Tests the get_upload_token method
	 */
	public function test_get_upload_token_disconnected() {
		\Jetpack_Options::delete_option( 'id' );
		$u = new Uploader( $this->valid_attachment_id );
		$this->expectException( __NAMESPACE__ . '\Upload_Exception' );
		add_filter( 'pre_http_request', array( $this, 'return_wp_error' ) );
		$u->get_upload_token();
		remove_filter( 'pre_http_request', array( $this, 'return_wp_error' ) );
	}
}
