<?php
/**
 * Tests for the VideoPress XMLRPC class.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\BeforeClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WorDBless\Posts;

/**
 * Class to test the VideoPress XMLRPC class.
 */
class XMLRPC_Test extends BaseTestCase {
	/** @var int The connected copy creator. */
	private $author_id;

	/** Authenticate callbacks as a connected author. */
	public function setUp(): void {
		parent::setUp();
		$this->author_id = wp_insert_user(
			array(
				'user_login' => 'video-copy-author',
				'user_pass'  => 'password',
				'role'       => 'author',
			)
		);
		XMLRPC::init()->xmlrpc_methods( array(), array(), new \WP_User( $this->author_id ) );
	}

	/** Clear the callback signer between tests. */
	public function tearDown(): void {
		XMLRPC::init()->xmlrpc_methods( array(), array(), new \WP_User( 0 ) );
		wp_set_current_user( 0 );
		delete_transient( 'videopress_get_post_id_by_guid_source12' );
		wp_cache_delete( 'get_post_by_guid_source12', 'videopress' );
		parent::tearDown();
	}

	/**
	 * @dataProvider copy_authorization_roles
	 * @param string $role The connected creator's role, or empty for no user.
	 * @param bool   $owns_source Whether the creator owns the source attachment.
	 * @param bool   $expected Whether the copy is permitted.
	 */
	#[DataProvider( 'copy_authorization_roles' )]
	public function test_copy_preflight_requires_upload_and_source_edit_permissions( $role, $owns_source, $expected ) {
		$actor   = $role ? wp_insert_user(
			array(
				'user_login' => 'copy-permission-actor',
				'user_pass'  => 'password',
				'role'       => $role,
			)
		) : 0;
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
				'post_author'    => $owns_source ? $actor : $this->author_id,
			)
		);
		// WorDBless does not emulate the resolver's meta query.
		set_transient( 'videopress_get_post_id_by_guid_source12', $post_id, HOUR_IN_SECONDS );
		XMLRPC::init()->xmlrpc_methods( array(), array(), new \WP_User( $actor ) );
		wp_set_current_user( $this->author_id );
		$result = XMLRPC::init()->authorize_videopress_copy( 'source12' );
		if ( $expected ) {
			$this->assertSame(
				array(
					'authorized' => true,
					'guid'       => 'source12',
				),
				$result
			);
		} else {
			$this->assertArrayHasKey( 'videopress_copy_forbidden', $result['errors'] );
		}
		$this->assertCount( 1, Posts::init()->posts );
	}

	/** @return array Creator permissions on the source attachment. */
	public static function copy_authorization_roles() {
		return array(
			'Owner author'      => array( 'author', true, true ),
			'Other author'      => array( 'author', false, false ),
			'Editor'            => array( 'editor', false, true ),
			'Subscriber owner'  => array( 'subscriber', true, false ),
			'Contributor owner' => array( 'contributor', true, false ),
			'No signer'         => array( '', false, false ),
		);
	}

	/** Malformed or unmapped sources cannot be authorized. */
	public function test_copy_preflight_rejects_unknown_sources() {
		$this->assertArrayHasKey( 'videopress_copy_forbidden', XMLRPC::init()->authorize_videopress_copy( 'invalid' )['errors'] );
		$this->assertArrayHasKey( 'videopress_copy_forbidden', XMLRPC::init()->authorize_videopress_copy( 'unknown1' )['errors'] );
		$this->assertEmpty( Posts::init()->posts );
	}

	/**
	 * Sets up the test environment before the class tests begin.
	 *
	 * @beforeClass
	 */
	#[BeforeClass]
	public static function set_up_class() {
		require_once __DIR__ . '/../../src/utility-functions.php';
		Posts::init();
	}

	/**
	 * The media item title, description and caption supplied by the uploader are applied to the
	 * created attachment.
	 */
	public function test_create_media_item_uses_supplied_meta() {
		$media = array(
			array(
				'url'         => 'https://videopress.com/v/original-file-name.mp4',
				'title'       => 'Edited Library Title',
				'description' => 'Edited library description',
				'caption'     => 'Edited library caption',
			),
		);

		$post = XMLRPC::init()->create_media_item( $media )['media'][0]['post'];

		$this->assertSame( 'Edited Library Title', $post->post_title );
		$this->assertSame( 'Edited library description', $post->post_content );
		$this->assertSame( 'Edited library caption', $post->post_excerpt );
	}

	/**
	 * A supplied title of "0" is treated as a real title, not as a missing value.
	 */
	public function test_create_media_item_keeps_zero_string_title() {
		$media = array(
			array(
				'url'   => 'https://videopress.com/v/original-file-name.mp4',
				'title' => '0',
			),
		);

		$this->assertSame( '0', XMLRPC::init()->create_media_item( $media )['media'][0]['post']->post_title );
	}

	/**
	 * When no title is supplied, the attachment falls back to a title derived from the file name.
	 */
	public function test_create_media_item_falls_back_to_file_name() {
		$media = array(
			array(
				'url' => 'https://videopress.com/v/original-file-name.mp4',
			),
		);

		$result = XMLRPC::init()->create_media_item( $media );

		$this->assertSame( sanitize_title( 'original-file-name.mp4' ), $result['media'][0]['post']->post_title );
	}

	/**
	 * Copy retries return the same attachment without resetting its completed metadata.
	 */
	public function test_copy_request_reuses_the_attachment() {
		$request_id = 'source12:32457391-3ebf-4c67-ac58-a34dd71399bf';
		$media      = array(
			array(
				'title'                      => 'New video',
				'videopress_copy_request_id' => $request_id,
			),
		);
		$first      = XMLRPC::init()->create_videopress_copy( $media );
		$post_id    = $first['media'][0]['post']->ID;
		$metadata   = array(
			'videopress' => array(
				'guid'     => 'newcopy1',
				'finished' => true,
			),
		);
		wp_update_attachment_metadata( $post_id, $metadata );
		$second = XMLRPC::init()->create_videopress_copy( $media );

		$this->assertSame( $post_id, $second['media'][0]['post']->ID );
		$this->assertSame( $request_id, $second['media'][0]['videopress_copy_request_id_ack'] );
		$this->assertSame( $request_id, get_post_meta( $post_id, '_videopress_copy_request_id', true ) );
		$this->assertSame( $metadata, wp_get_attachment_metadata( $post_id ) );
	}

	/** New copies belong to the authenticated creator, independently of the ambient current user. */
	public function test_copy_attachment_belongs_to_its_connected_creator() {
		$other_id = wp_insert_user(
			array(
				'user_login' => 'other-copy-author',
				'user_pass'  => 'password',
				'role'       => 'author',
			)
		);
		wp_set_current_user( $other_id );
		$result = XMLRPC::init()->create_videopress_copy(
			array(
				array(
					'title'                      => 'Copied by the connected author',
					'videopress_copy_request_id' => 'source12:32457391-3ebf-4c67-ac58-a34dd71399b4',
					'post_author'                => $other_id,
				),
			)
		);
		$post   = $result['media'][0]['post'];
		$this->assertSame( $this->author_id, (int) $post->post_author );
		$this->assertTrue( user_can( $this->author_id, 'edit_post', $post->ID ) );
		$this->assertFalse( user_can( $other_id, 'edit_post', $post->ID ) );
	}

	/**
	 * @dataProvider unauthorized_copy_users
	 * @param string $role The callback signer's role, or empty for no user.
	 */
	#[DataProvider( 'unauthorized_copy_users' )]
	public function test_copy_requires_an_authenticated_uploader( $role ) {
		$user_id = $role ? wp_insert_user(
			array(
				'user_login' => 'copy-subscriber',
				'user_pass'  => 'password',
				'role'       => $role,
			)
		) : 0;
		XMLRPC::init()->xmlrpc_methods( array(), array(), new \WP_User( $user_id ) );
		$request_id = 'source12:32457391-3ebf-4c67-ac58-a34dd71399b5';
		$result     = XMLRPC::init()->create_videopress_copy( array( array( 'videopress_copy_request_id' => $request_id ) ) );
		$this->assertArrayHasKey( 'videopress_copy_forbidden', $result['errors'] );
		$this->assertFalse( get_option( 'videopress_copy_attachment_' . hash( 'sha256', $request_id ) ) );
		$this->assertEmpty( Posts::init()->posts );
	}

	/** @return array Signers that cannot create attachments. */
	public static function unauthorized_copy_users() {
		return array(
			'No connected user' => array( '' ),
			'Subscriber'        => array( 'subscriber' ),
		);
	}

	/**
	 * An in-flight or uncertain creation is never replaced by a duplicate attachment.
	 */
	public function test_copy_request_keeps_an_uncertain_reservation() {
		$request_id = 'source12:32457391-3ebf-4c67-ac58-a34dd71399b0';
		$option     = 'videopress_copy_attachment_' . hash( 'sha256', $request_id );
		add_option( $option, 0, '', false );
		$result = XMLRPC::init()->create_videopress_copy( array( array( 'videopress_copy_request_id' => $request_id ) ) );

		$this->assertArrayHasKey( 'videopress_copy_attachment_pending', $result['errors'] );
		$this->assertSame( 0, (int) get_option( $option ) );
	}

	/**
	 * A deleted copy is not recreated by replaying an old request.
	 */
	public function test_copy_request_does_not_recreate_a_deleted_attachment() {
		$request_id = 'source12:32457391-3ebf-4c67-ac58-a34dd71399b1';
		$media      = array(
			array(
				'title'                      => 'New video',
				'videopress_copy_request_id' => $request_id,
			),
		);
		$first      = XMLRPC::init()->create_videopress_copy( $media );
		wp_delete_post( $first['media'][0]['post']->ID, true );
		$second = XMLRPC::init()->create_videopress_copy( $media );

		$this->assertArrayHasKey( 'videopress_copy_attachment_unavailable', $second['errors'] );
	}

	/**
	 * Malformed copy identifiers are rejected before creating a media item.
	 */
	public function test_copy_request_rejects_an_invalid_identifier() {
		$result = XMLRPC::init()->create_videopress_copy( array( array( 'videopress_copy_request_id' => '../../invalid' ) ) );

		$this->assertArrayHasKey( 'videopress_copy_invalid_request', $result['errors'] );
	}

	/**
	 * The copy-only method rejects ordinary uploads before creating an attachment.
	 */
	public function test_copy_method_requires_its_idempotency_identifier() {
		$result = XMLRPC::init()->create_videopress_copy( array( array( 'title' => 'Incomplete copy request' ) ) );

		$this->assertArrayHasKey( 'videopress_copy_invalid_request', $result['errors'] );
	}

	/**
	 * The dedicated XML-RPC method preserves existing registrations and rejects incomplete copies.
	 */
	public function test_copy_method_is_registered() {
		$existing = array( 'existing.method' => '__return_true' );
		$methods  = XMLRPC::init()->xmlrpc_methods( $existing, array(), new \WP_User( 0 ) );

		$this->assertSame( $existing['existing.method'], $methods['existing.method'] );
		$this->assertIsCallable( $methods['jetpack.createVideoPressCopy'] );
		$this->assertIsCallable( $methods['jetpack.authorizeVideoPressCopy'] );
		$result = call_user_func( $methods['jetpack.createVideoPressCopy'], array() );
		$this->assertArrayHasKey( 'videopress_copy_invalid_request', $result['errors'] );
		$this->assertEmpty( Posts::init()->posts );
	}

	/**
	 * A failed insert keeps its reservation so a retry cannot allocate another attachment.
	 */
	public function test_copy_request_keeps_reservation_when_insertion_fails() {
		$request_id = 'source12:32457391-3ebf-4c67-ac58-a34dd71399b2';
		$option     = 'videopress_copy_attachment_' . hash( 'sha256', $request_id );
		$media      = array(
			array(
				'title'                      => 'New video',
				'videopress_copy_request_id' => $request_id,
			),
		);
		$result     = array();
		add_filter( 'wp_insert_post_empty_content', '__return_true' );
		try {
			$result = XMLRPC::init()->create_videopress_copy( $media );
		} finally {
			remove_filter( 'wp_insert_post_empty_content', '__return_true' );
		}

		$this->assertArrayHasKey( 'videopress_copy_attachment_failed', $result['errors'] );
		$this->assertArrayNotHasKey( 'media', $result );
		$this->assertSame( 0, (int) get_option( $option ) );
		$retry = XMLRPC::init()->create_videopress_copy( $media );
		$this->assertArrayHasKey( 'videopress_copy_attachment_pending', $retry['errors'] );
		$this->assertEmpty( Posts::init()->posts );
	}

	/**
	 * A created attachment without a committed checkpoint is never acknowledged or duplicated.
	 *
	 * @dataProvider copy_checkpoint_failures
	 * @param string $failure The checkpoint write that fails.
	 */
	#[DataProvider( 'copy_checkpoint_failures' )]
	public function test_copy_request_keeps_reservation_when_checkpoint_fails( $failure ) {
		$request_id    = 'source12:32457391-3ebf-4c67-ac58-a34dd71399b3';
		$option        = 'videopress_copy_attachment_' . hash( 'sha256', $request_id );
		$media         = array(
			array(
				'title'                      => 'New video',
				'videopress_copy_request_id' => $request_id,
			),
		);
		$attachment_id = 0;
		$on_attachment = static function ( $post_id ) use ( &$attachment_id, $failure ) {
			$attachment_id = $post_id;
			if ( 'metadata' === $failure ) {
				add_post_meta( $post_id, '_videopress_copy_request_id', 'another-request', true );
			}
		};
		$on_option     = static function ( $value, $old_value ) use ( $failure ) {
			return 'option' === $failure ? $old_value : $value;
		};
		add_action( 'add_attachment', $on_attachment );
		add_filter( 'pre_update_option_' . $option, $on_option, 10, 2 );
		$result = array();
		try {
			$result = XMLRPC::init()->create_videopress_copy( $media );
		} finally {
			remove_action( 'add_attachment', $on_attachment );
			remove_filter( 'pre_update_option_' . $option, $on_option );
		}

		$this->assertArrayHasKey( 'videopress_copy_attachment_failed', $result['errors'] );
		$this->assertArrayNotHasKey( 'media', $result );
		$this->assertSame( 0, (int) get_option( $option ) );
		$this->assertSame( 'attachment', get_post_type( $attachment_id ) );
		$this->assertSame( 'metadata' === $failure ? 'another-request' : $request_id, get_post_meta( $attachment_id, '_videopress_copy_request_id', true ) );
		$retry = XMLRPC::init()->create_videopress_copy( $media );
		$this->assertArrayHasKey( 'videopress_copy_attachment_pending', $retry['errors'] );
		$this->assertCount( 1, Posts::init()->posts );
	}

	/** @return array Checkpoint failure cases. */
	public static function copy_checkpoint_failures() {
		return array(
			'Conflicting attachment metadata' => array( 'metadata' ),
			'Failed reservation update'       => array( 'option' ),
		);
	}
}
