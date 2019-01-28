<?php

namespace TestAttachmentFieldsVideoPress {
	/**
	 * Mocked function `video_get_info_by_blogpostid`
	 */
	function video_get_info_by_blogpostid( $blog_id, $post_id ) {
		return $post_id;
	}

	/**
	 * Mocked function `videopress_get_video_details`
	 */
	function videopress_get_video_details( $videopress_id ) {
		return array(
			'mocked_videopress_data' => $videopress_id,
		);
	}

	require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-jetpack-rest-testcase.php';
	require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-spy-rest-server.php';

	/**
	 * Tests that Attachments do have VideoPress data in REST API
	 * responses if the VideoPress Module is active.
	 *
	 * In this test environment, the VideoPress Module is not active so this class
	 * has hacks that load the VideoPress API code as if the VideoPress Module were active.
	 *
	 * @group videopress
	 * @group rest-api
	 */
	class Test_WPCOM_REST_API_V2_Attachment_VideoPress_Field extends \WP_Test_Jetpack_REST_Testcase {
		private $_backup_wp_rest_additional_fields;

		public function setUp() {
			// Backup this core global that WPCOM_REST_API_V2_Attachment_VideoPress_Field
			// changes via register_rest_field()
			$this->_backup_wp_rest_additional_fields = isset( $GLOBALS['wp_rest_additional_fields'] ) ? $GLOBALS['wp_rest_additional_fields'] : 'unset';

			// Normally, hooks are backed up for us by WP_UnitTestCase::setUp()
			// We have to load WPCOM_REST_API_V2_Attachment_VideoPress_Field before
			// WP_Test_Jetpack_REST_Testcase::setUp(), though, so that it is loaded prior to
			// WP_Test_Jetpack_REST_Testcase::setUp()'s `do_action( 'rest_api_init' )`.
			// Thus, the order would normally be:
			// 1. wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Attachment_VideoPress_Field' ) (calls `add_action( 'rest_api_init' )`)
			// 2. WP_Test_Jetpack_REST_Testcase::setUp() (calls `do_action( 'rest_api_init' )`)
			// 3. WP_UnitTestCase::setUp() (calls `WP_UnitTestCase::_backup_hooks()`).
			// and we end up incorrectly backing up the hooks we've changed via
			// WPCOM_REST_API_V2_Attachment_VideoPress_Field's `add_action( 'rest_api_init' )` call.
			// (We want to backup the "default" hooks prior to any changes these tests make.)
			//
			// Instead, we "manually" call WP_UnitTestCase::_backup_hooks() first:
			// 1. WP_UnitTestCase::_backup_hooks()
			// 2. wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Attachment_VideoPress_Field' ) (calls `add_action( 'rest_api_init' )`)
			// 3. WP_Test_Jetpack_REST_Testcase::setUp() (calls `do_action( 'rest_api_init' )`)
			// 4. WP_UnitTestCase::setUp() (is smart enough *not* to call `WP_UnitTestCase::_backup_hooks()` a second time).
			// and we are now correctly backing up the default hooks so that when we restore hooks
			// in WP_UnitTestCase::tearDown(), we correctly restore the hooks as they were prior to
			// WPCOM_REST_API_V2_Attachment_VideoPress_Field's `add_action( 'rest_api_init' )` call.
			$this->_backup_hooks();

			// The VideoPress data  field is loaded conditionally based on whether
			// the VideoPress Module is active.
			// The Module is not active in this test environment, so load it manually.
			// It might look like it would be simpler if we only did this once in
			// ::wpSetUpBeforeClass() instead of once for eeach test here in ::setUp().
			// If we did that, though, we'd lose (and break) WP_UnitTestCase's
			// hook backup/restore functionality (see comment on above line).
			wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Attachment_VideoPress_Field' );

			parent::setUp();
		}

		public function tearDown() {
			global $wpcom_rest_api_v2_plugins;

			parent::tearDown();

			// De-memoize wpcom_rest_api_v2_load_plugin()
			unset( $wpcom_rest_api_v2_plugins['WPCOM_REST_API_V2_Attachment_VideoPress_Field'] );

			// Restore this core global
			if ( 'unset' === $this->_backup_wp_rest_additional_fields ) {
				unset( $GLOBALS['wp_rest_additional_fields'] );
			} else {
				$GLOBALS['wp_rest_additional_fields'] = $this->_backup_wp_rest_additional_fields;
			}
		}

		public function test_register_field_attachment_videopress() {
			$request = new \WP_REST_Request( 'OPTIONS', '/wp/v2/media' );
			$response = $this->server->dispatch( $request );
			$data = $response->get_data();
			$schema = $data['schema'];

			$this->assertArrayHasKey( 'jetpack_videopress', $schema['properties'] );
		}

		public function test_response_attachment_videopress() {
			$attachment_id = $this->factory->attachment->create_upload_object( JETPACK__PLUGIN_DIR . 'tests/php/jetpack-icon.jpg', 0 );
			$request       = new \WP_REST_Request( 'GET', sprintf( '/wp/v2/media/%d', $attachment_id ) );
			$response      = $this->server->dispatch( $request );
			$data          = $response->get_data();

			$this->assertArrayHasKey( 'jetpack_videopress', $data );
			$this->assertInternalType( 'array', $data['jetpack_videopress'] );
			$this->assertSame( array(
				'mocked_videopress_data' => $attachment_id,
			), $data );
		}
	}
}
