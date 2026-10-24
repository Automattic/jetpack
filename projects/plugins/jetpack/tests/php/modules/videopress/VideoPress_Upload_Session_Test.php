<?php
/**
 * Attachment-first upload contracts using real WordPress attachments and fake remote HTTP.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\VideoPress\Attachment_Handler;
use Automattic\Jetpack\VideoPress\Upload_Session;
use Automattic\Jetpack\VideoPress\Uploader;
use Automattic\Jetpack\VideoPress\WPCOM_REST_API_V2_Endpoint_VideoPress;
use PHPUnit\Framework\Attributes\DataProvider;
use VideoPressUploader\Transient_Store;

class VideoPress_Upload_Session_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/** @var array Queued HTTP responses. */
	private $responses = array();
	/** @var array Observed requests. */
	private $requests = array();

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'test.secret' );
		$user_id = get_current_user_id();
		Jetpack_Options::update_option( 'master_user', $user_id );
		( new Tokens() )->update_user_token( $user_id, "key.private.$user_id", false );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		add_filter( 'pre_http_request', array( $this, 'remote_response' ), 10, 3 );
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'remote_response' ), 10 );
		Jetpack_Options::delete_option( 'id' );
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'master_user' );
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * Replace only the remote API; attachment allocation and metadata use WordPress and its test DB.
	 *
	 * @param mixed  $pre Existing result.
	 * @param array  $args HTTP arguments.
	 * @param string $url URL.
	 * @return array|WP_Error
	 */
	public function remote_response( $pre, $args, $url ) {
		$body             = is_string( $args['body'] ?? null ) ? json_decode( $args['body'], true ) : array();
		$this->requests[] = array(
			'url'    => $url,
			'body'   => $body,
			'method' => $args['method'],
		);
		$response         = array_shift( $this->responses );
		if ( null === $response ) {
			$this->fail( 'Unexpected HTTP request: ' . $url );
		}
		return is_callable( $response ) ? $response( $body, $args, $url ) : $response;
	}

	/**
	 * Build the HTTP envelope returned by the remote API.
	 *
	 * @param array $body JSON body.
	 * @param int   $status HTTP status.
	 * @return array
	 */
	private static function response( $body, $status = 200 ) {
		return array(
			'response' => array( 'code' => $status ),
			'headers'  => array(),
			'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
		);
	}

	/**
	 * Return an accepted token for the ID actually allocated by WordPress.
	 *
	 * @param array $body Token request.
	 * @return array
	 */
	private static function accepted( $body ) {
		return self::response(
			array(
				'post_id'      => $body['post_id'],
				'guid'         => 'Abcd1234',
				'upload_token' => 'upload-token',
			)
		);
	}

	/** Local allocation must make exactly the existing token request, without a minimum-ID preflight. */
	public function test_local_attachment_precedes_the_only_token_request() {
		$this->responses[] = function ( $body ) {
			$this->assertSame( 'attachment', get_post_type( $body['post_id'] ) );
			$this->assertSame( 'clip.mp4', get_post( $body['post_id'] )->post_title );
			return self::accepted( $body );
		};
		$result            = Upload_Session::start( 'clip.mp4' );
		$this->assertNotWPError( $result );
		$this->assertCount( 1, $this->requests );
		$this->assertSame( 'Abcd1234', Upload_Session::get( $result['post_id'] )['guid'] );
		$this->assertSame( '', get_post_meta( $result['post_id'], 'videopress_guid', true ) );
	}

	/** A confirmed collision replaces only our empty placeholder, preserving the original local media. */
	public function test_collision_allocates_above_the_minimum_and_preserves_the_source() {
		global $wpdb;
		$source            = self::factory()->attachment->create(
			array(
				'post_mime_type' => 'video/mp4',
				'post_title'     => 'Source',
				'post_excerpt'   => 'Caption',
			)
		);
		$minimum           = (int) $wpdb->get_var( "SELECT MAX(ID) FROM $wpdb->posts" ) + 100;
		$this->responses[] = self::response(
			array(
				'code'    => 'videopress_attachment_id_collision',
				'message' => 'Taken',
				'data'    => array( 'minimum_attachment_id' => $minimum ),
			),
			409
		);
		$this->responses[] = array( self::class, 'accepted' );
		$result            = Upload_Session::start( 'Source', $source );
		$this->assertNotWPError( $result );
		$this->assertGreaterThanOrEqual( $minimum, $result['post_id'] );
		$this->assertNull( get_post( $this->requests[0]['body']['post_id'] ) );
		$this->assertSame( 'Source', get_post( $source )->post_title );
		$this->assertSame( 'Caption', get_post( $result['post_id'] )->post_excerpt );
		$this->assertSame( $result['post_id'], (int) get_post_meta( $source, Upload_Session::SOURCE_META_KEY, true ) );
		$this->assertCount( 2, $this->requests );
	}

	/** Transport failures must retain the same attachment on retry. */
	public function test_uncertain_token_request_preserves_attachment_identity() {
		$this->responses[] = new WP_Error( 'http_request_failed', 'Timeout' );
		$error             = Upload_Session::start( 'clip.mp4' );
		$this->assertWPError( $error );
		$post_id = $error->get_error_data()['attachment_id'];
		$this->assertNotNull( get_post( $post_id ) );
		$this->responses[] = array( self::class, 'accepted' );
		$result            = Upload_Session::token( $post_id );
		$this->assertNotWPError( $result );
		$this->assertSame( $post_id, $result['post_id'] );
		$this->assertSame( $this->requests[0]['body'], $this->requests[1]['body'] );
	}

	/** Two overlapping requests cannot overwrite the GUID that already won the local binding. */
	public function test_concurrent_token_response_cannot_replace_the_saved_guid() {
		$this->responses[] = function ( $body ) {
			$this->responses[] = array( self::class, 'accepted' );
			$winner            = Upload_Session::token( $body['post_id'] );
			$this->assertNotWPError( $winner );
			return self::response(
				array(
					'post_id'      => $body['post_id'],
					'guid'         => 'Loser123',
					'upload_token' => 'loser-token',
				)
			);
		};
		$error             = Upload_Session::start( 'clip.mp4' );
		$this->assertWPError( $error );
		$this->assertSame( 'Abcd1234', Upload_Session::get( $error->get_error_data()['attachment_id'] )['guid'] );
	}

	/** Completion and native Media Library polling must work without receiving any XML-RPC callbacks. */
	public function test_completion_and_heartbeat_refresh_conversion_without_callbacks() {
		$this->responses[] = array( self::class, 'accepted' );
		$session           = Upload_Session::start( 'clip.mp4' );
		$this->assertNotWPError( $session );
		$id                = $session['post_id'];
		$this->responses[] = self::response(
			array(
				'post_id' => $id,
				'guid'    => 'Abcd1234',
				'state'   => 'done',
			)
		);
		$info              = array(
			'post_id'      => $id,
			'blog_id'      => 1234,
			'guid'         => 'Abcd1234',
			'width'        => 640,
			'height'       => 360,
			'original'     => 'https://example.com/clip.mp4',
			'files_status' => array( 'std' => array( 'mp4' => 'QUEUED' ) ),
		);
		$this->responses[] = self::response( $info );
		$this->assertTrue( Upload_Session::complete( $id ) );
		$this->assertSame( 'processing', get_post_meta( $id, 'videopress_status', true ) );
		$info['files_status']['std']['mp4'] = 'ERROR';
		$this->responses[]                  = self::response( $info );
		$response                           = Attachment_Handler::heartbeat_received( array(), array( 'videopress_processing_ids' => array( $id ) ) );
		$this->assertSame( 'failed', $response['videopress_processing_status'][ $id ] );
		$this->assertSame( 'Abcd1234', get_post_meta( $id, 'videopress_guid', true ) );
		$this->assertSame( 640, wp_get_attachment_metadata( $id )['width'] );
		$this->assertSame( 'https://example.com/clip.mp4', wp_get_attachment_metadata( $id )['original']['url'] );
	}

	/** A delayed collision cannot replace or delete an attachment that another request already bound. */
	public function test_delayed_collision_preserves_the_concurrent_winner() {
		$source            = self::factory()->attachment->create( array( 'post_mime_type' => 'video/mp4' ) );
		$this->responses[] = function ( $body ) {
			$this->responses[] = array( self::class, 'accepted' );
			$this->assertNotWPError( Upload_Session::token( $body['post_id'] ) );
			return self::response(
				array(
					'code' => 'videopress_attachment_id_collision',
					'data' => array( 'minimum_attachment_id' => $body['post_id'] + 100 ),
				),
				409
			);
		};
		$error             = Upload_Session::start( 'clip.mp4', $source );
		$this->assertWPError( $error );
		$id = $error->get_error_data()['attachment_id'];
		$this->assertNotNull( get_post( $id ) );
		$this->assertSame( 'Abcd1234', Upload_Session::get( $id )['guid'] );
		$this->assertSame( $id, (int) get_post_meta( $source, Upload_Session::SOURCE_META_KEY, true ) );
		$this->assertCount( 2, $this->requests );
	}

	/** Polling reconciles a finished upload even if the browser lost its completion response. */
	public function test_heartbeat_recovers_a_lost_completion_response() {
		$this->responses[] = array( self::class, 'accepted' );
		$session           = Upload_Session::start( 'clip.mp4' );
		$id                = $session['post_id'];
		$this->responses[] = self::response(
			array(
				'post_id' => $id,
				'guid'    => 'Abcd1234',
				'state'   => 'done',
			)
		);
		$this->responses[] = self::response(
			array(
				'post_id'      => $id,
				'blog_id'      => 1234,
				'guid'         => 'Abcd1234',
				'files_status' => array( 'std' => array( 'mp4' => 'DONE' ) ),
			)
		);
		$response          = Attachment_Handler::heartbeat_received( array(), array( 'videopress_processing_ids' => array( $id ) ) );
		$this->assertSame( 'complete', $response['videopress_processing_status'][ $id ] );
		$this->assertSame( 'Abcd1234', get_post_meta( $id, 'videopress_guid', true ) );
		$this->assertCount( 3, $this->requests );
	}

	/** Collision recovery stops after three attempts and preserves the last placeholder. */
	public function test_repeated_collisions_have_a_bounded_retry_count() {
		$collision       = static function ( $body ) {
			return self::response(
				array(
					'code' => 'videopress_attachment_id_collision',
					'data' => array( 'minimum_attachment_id' => $body['post_id'] + 100 ),
				),
				409
			);
		};
		$this->responses = array( $collision, $collision, $collision );
		$result          = Upload_Session::start( 'clip.mp4' );
		$this->assertWPError( $result );
		$this->assertSame( 'videopress_attachment_id_collision', $result->get_error_code() );
		$this->assertCount( 3, $this->requests );
		$last_id = $result->get_error_data()['attachment_id'];
		$this->assertSame( $this->requests[2]['body']['post_id'], $last_id );
		$this->assertNotNull( get_post( $last_id ) );
		$this->assertNull( get_post( $this->requests[0]['body']['post_id'] ) );
		$this->assertNull( get_post( $this->requests[1]['body']['post_id'] ) );
	}

	/** Lost completion responses must reconcile the old binding, never create another attachment. */
	public function test_expired_renewal_recovers_an_already_completed_upload() {
		$this->responses[] = array( self::class, 'accepted' );
		$session           = Upload_Session::start( 'clip.mp4' );
		$id                = $session['post_id'];
		$this->responses[] = self::response( array( 'code' => 'videopress_upload_cancelled' ), 410 );
		$this->responses[] = self::response(
			array(
				'post_id' => $id,
				'guid'    => 'Abcd1234',
				'state'   => 'done',
			)
		);
		$this->responses[] = self::response(
			array(
				'post_id'      => $id,
				'blog_id'      => 1234,
				'guid'         => 'Abcd1234',
				'files_status' => array( 'std' => array( 'mp4' => 'DONE' ) ),
			)
		);
		$result            = Upload_Session::token( $id );
		$this->assertSame(
			array(
				'complete' => true,
				'post_id'  => $id,
				'guid'     => 'Abcd1234',
			),
			$result
		);
		$this->assertSame(
			array(
				'post_id' => $id,
				'guid'    => 'Abcd1234',
			),
			$this->requests[1]['body']
		);
		$this->assertSame( 'complete', get_post_meta( $id, 'videopress_status', true ) );
		$this->assertCount( 4, $this->requests );
	}

	/** REST polling downloads the poster when no callback can create its local thumbnail. */
	public function test_rest_refresh_sideloads_the_poster() {
		$this->responses[] = array( self::class, 'accepted' );
		$session           = Upload_Session::start( 'clip.mp4' );
		$id                = $session['post_id'];
		$this->responses[] = self::response(
			array(
				'post_id' => $id,
				'guid'    => 'Abcd1234',
				'state'   => 'done',
			)
		);
		$this->responses[] = self::response(
			array(
				'post_id'      => $id,
				'blog_id'      => 1234,
				'guid'         => 'Abcd1234',
				'poster'       => 'https://example.com/poster.jpg',
				'files_status' => array( 'std' => array( 'mp4' => 'DONE' ) ),
			)
		);
		$this->responses[] = static function ( $body, $args ) {
			copy( dirname( __DIR__, 2 ) . '/files/jetpack.jpg', $args['filename'] );
			return array(
				'response' => array( 'code' => 200 ),
				'headers'  => array(),
				'body'     => '',
			);
		};
		$request           = new WP_REST_Request( 'GET', '/wp/v2/media/' . $id );
		$response          = Upload_Session::refresh_media_response( new WP_REST_Response( array( 'id' => $id ) ), rest_get_server(), $request );
		$this->assertSame( $id, $response->get_data()['id'] );
		$poster = (int) get_post_meta( $id, '_thumbnail_id', true );
		$this->assertGreaterThan( 0, $poster );
		$this->assertSame( 'image/jpeg', get_post_mime_type( $poster ) );
		$this->assertSame( 'complete', get_post_meta( $id, 'videopress_status', true ) );
	}

	/** REST retry must renew the attachment returned by a failed token request. */
	public function test_rest_retry_uses_the_preserved_attachment() {
		$user_id = get_current_user_id();
		Jetpack_Options::update_option( 'master_user', $user_id );
		( new Tokens() )->update_user_token( $user_id, "key.private.$user_id", false );
		$request = new WP_REST_Request( 'POST' );
		$request->set_param( 'filename', 'clip.mp4' );
		$this->responses[] = new WP_Error( 'http_request_failed', 'Timeout' );
		$error             = WPCOM_REST_API_V2_Endpoint_VideoPress::videopress_upload_jwt( $request );
		$this->assertWPError( $error );
		$id = $error->get_error_data()['attachment_id'];
		$request->set_param( 'attachment_id', $id );
		$this->responses[] = array( self::class, 'accepted' );
		$response          = WPCOM_REST_API_V2_Endpoint_VideoPress::videopress_upload_jwt( $request );
		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$this->assertSame( $id, $response->get_data()['post_id'] );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'author' ) ) );
		$denied = WPCOM_REST_API_V2_Endpoint_VideoPress::videopress_upload_jwt( $request );
		$this->assertWPError( $denied );
		$this->assertSame( 403, $denied->get_error_data()['status'] );
		$this->assertCount( 2, $this->requests );
	}

	/** A pre-upgrade transport remains legacy, and a transient HEAD cannot start another upload. */
	public function test_php_uploader_preserves_a_legacy_transport_across_a_failed_head() {
		$upload   = wp_upload_bits( 'legacy.mp4', null, str_repeat( 'x', 21 ) );
		$source   = wp_insert_attachment(
			array(
				'post_title'     => 'Legacy',
				'post_mime_type' => 'video/mp4',
			),
			$upload['file']
		);
		$target   = self::factory()->attachment->create( array( 'post_mime_type' => 'video/videopress' ) );
		$uploader = new Uploader( $source );
		$cache    = new Transient_Store( $uploader->get_key() );
		$location = 'https://example.com/uploads/legacy';
		$cache->set(
			$uploader->get_key(),
			array(
				'location'      => $location,
				'expires_at'    => gmdate( Transient_Store::RFC_7231, time() + 3600 ),
				'token_for_key' => 'key-token',
			)
		);
		$this->responses[] = self::response( array( 'upload_token' => 'legacy-token' ) );
		$this->responses[] = self::response( array(), 503 );
		$this->assertSame( 'error', $uploader->upload()['status'] );
		$this->assertSame( '', get_post_meta( $source, Upload_Session::SOURCE_META_KEY, true ) );
		$this->assertSame( $location, $cache->get( $uploader->get_key() )['location'] );
		$this->responses[] = array(
			'response' => array( 'code' => 200 ),
			'headers'  => array(
				'upload-offset'                => '21',
				'x-videopress-upload-guid'     => 'Abcd1234',
				'x-videopress-upload-media-id' => (string) $target,
				'x-videopress-upload-src-url'  => 'https://example.com/video.mp4',
			),
		);
		$result            = $uploader->upload();
		$this->assertSame( 'complete', $result['status'], wp_json_encode( $result, JSON_UNESCAPED_SLASHES ) );
		$this->assertSame( $target, (int) get_post_meta( $source, Uploader::UPLOADED_KEY, true ) );
		$this->assertSame( '', get_post_meta( $source, Upload_Session::SOURCE_META_KEY, true ) );
		$this->assertCount( 3, $this->requests );
	}

	/**
	 * TUS metadata must preserve raw titles and omit empty description/caption values.
	 *
	 * @dataProvider attachment_metadata
	 * @param string $description Description.
	 * @param string $caption Caption.
	 */
	#[DataProvider( 'attachment_metadata' )]
	public function test_upload_sends_attachment_meta_as_metadata( $description, $caption ) {
		$upload        = wp_upload_bits( 'sample-video.mp4', null, str_repeat( 'x', 21 ) );
		$attachment_id = wp_insert_attachment(
			array(
				'post_title'     => 'She said "hello"',
				'post_content'   => $description,
				'post_excerpt'   => $caption,
				'post_mime_type' => 'video/mp4',
			),
			$upload['file']
		);
		$metadata      = array();
		$http          = static function ( $pre, $args, $url ) use ( &$metadata ) {
			if ( str_contains( $url, 'videopress-upload-jwt' ) ) {
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => wp_json_encode( array( 'upload_token' => 'legacy-token' ), JSON_UNESCAPED_SLASHES ),
				);
			}
			if ( isset( $args['headers']['Upload-Metadata'] ) ) {
				foreach ( explode( ',', $args['headers']['Upload-Metadata'] ) as $pair ) {
					list( $key, $value ) = explode( ' ', $pair, 2 );
					$metadata[ $key ]    = base64_decode( $value ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Decode TUS metadata in a protocol fixture.
				}
				return array(
					'response' => array( 'code' => 201 ),
					'headers'  => array(
						'location'                      => 'https://example.com/uploads/key',
						'x-videopress-upload-key-token' => 'key-token',
					),
				);
			}
			return array(
				'response' => array( 'code' => 204 ),
				'headers'  => array( 'upload-offset' => '1' ),
			);
		};
		remove_filter( 'pre_http_request', array( $this, 'remote_response' ), 10 );
		add_filter( 'pre_http_request', $http, 10, 3 );
		try {
			$result = ( new Uploader( $attachment_id ) )->upload();
			$this->assertSame( 'uploading', $result['status'], wp_json_encode( $result, JSON_UNESCAPED_SLASHES ) );
			$this->assertSame( 'She said "hello"', $metadata['title'] );
			$this->assertSame( '' !== $description ? $description : null, $metadata['description'] ?? null );
			$this->assertSame( '' !== $caption ? $caption : null, $metadata['caption'] ?? null );
		} finally {
			remove_filter( 'pre_http_request', $http, 10 );
		}
	}

	/** @return array Metadata variants. */
	public static function attachment_metadata() {
		return array(
			'populated' => array( 'My video description', 'My video caption' ),
			'empty'     => array( '', '' ),
		);
	}
}
