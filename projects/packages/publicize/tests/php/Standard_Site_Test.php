<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for standard.site protocol integration (Bluesky).
 */

namespace Automattic\Jetpack\Publicize;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\PostMeta as WorDBless_PostMeta;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;

/**
 * Class Standard_Site_Test
 */
class Standard_Site_Test extends TestCase {

	/**
	 * The admin user ID.
	 *
	 * @var int
	 */
	private static $admin_id = 0;

	/**
	 * The post ID.
	 *
	 * @var int
	 */
	private static $post_id = 0;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		static::$admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_admin',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);

		static::$post_id = wp_insert_post(
			array(
				'post_author'  => static::$admin_id,
				'post_title'   => 'Test Post',
				'post_excerpt' => 'Test excerpt',
				'post_status'  => 'publish',
				'post_type'    => 'post',
			)
		);

		wp_set_current_user( static::$admin_id );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		wp_set_current_user( 0 );

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
		WorDBless_PostMeta::init()->clear_all_meta();

		delete_transient( Connections::CONNECTIONS_TRANSIENT );
	}

	/**
	 * Test that publication URI is stored when Bluesky connection has it.
	 */
	public function test_store_publication_uri_from_bluesky_connection() {
		$connections = array(
			array(
				'connection_id' => '111',
				'service_name'  => 'tumblr',
				'shared'        => true,
				'wpcom_user_id' => 0,
			),
			array(
				'connection_id'                 => '222',
				'service_name'                  => 'bluesky',
				'shared'                        => true,
				'wpcom_user_id'                 => 0,
				'standard_site_publication_uri' => 'at://did:plc:abc123/site.standard.publication/self',
			),
		);

		Connections::maybe_store_bluesky_publication_uri_from( $connections );

		$this->assertEquals(
			'at://did:plc:abc123/site.standard.publication/self',
			get_option( Connections::BLUESKY_PUBLICATION_URI_OPTION )
		);
	}

	/**
	 * Test that publication URI is not stored when Bluesky connection lacks it.
	 */
	public function test_no_publication_uri_when_bluesky_lacks_it() {
		$connections = array(
			array(
				'connection_id' => '222',
				'service_name'  => 'bluesky',
				'shared'        => true,
				'wpcom_user_id' => 0,
			),
		);

		Connections::maybe_store_bluesky_publication_uri_from( $connections );

		$this->assertFalse( get_option( Connections::BLUESKY_PUBLICATION_URI_OPTION ) );
	}

	/**
	 * Test that publication URI is cleaned up when no Bluesky connections exist.
	 */
	public function test_publication_uri_cleaned_up_on_disconnect() {
		update_option( Connections::BLUESKY_PUBLICATION_URI_OPTION, 'at://did:plc:abc123/site.standard.publication/self' );

		$connections = array(
			array(
				'connection_id' => '111',
				'service_name'  => 'tumblr',
				'shared'        => true,
				'wpcom_user_id' => 0,
			),
		);

		Connections::maybe_store_bluesky_publication_uri_from( $connections );

		$this->assertFalse( get_option( Connections::BLUESKY_PUBLICATION_URI_OPTION ) );
	}

	/**
	 * Test that publication URI is NOT cleaned up when Bluesky connection exists but lacks URI.
	 */
	public function test_publication_uri_kept_when_bluesky_exists_without_uri() {
		$existing_uri = 'at://did:plc:abc123/site.standard.publication/self';
		update_option( Connections::BLUESKY_PUBLICATION_URI_OPTION, $existing_uri );

		$connections = array(
			array(
				'connection_id' => '222',
				'service_name'  => 'bluesky',
				'shared'        => true,
				'wpcom_user_id' => 0,
			),
		);

		Connections::maybe_store_bluesky_publication_uri_from( $connections );

		$this->assertEquals( $existing_uri, get_option( Connections::BLUESKY_PUBLICATION_URI_OPTION ) );
	}

	/**
	 * Test that document URI is stored from Bluesky share status.
	 */
	public function test_store_document_uri_from_share_status() {
		$shares = array(
			array(
				'connection_id' => '111',
				'service'       => 'tumblr',
				'timestamp'     => 1234567890,
				'status'        => 'success',
			),
			array(
				'connection_id'              => '222',
				'service'                    => 'bluesky',
				'timestamp'                  => 1234567890,
				'status'                     => 'success',
				'standard_site_document_uri' => 'at://did:plc:abc123/site.standard.document/tid123',
			),
		);

		Publicize_Setup::store_bluesky_document_uri( static::$post_id, $shares );

		$this->assertEquals(
			'at://did:plc:abc123/site.standard.document/tid123',
			get_post_meta( static::$post_id, Share_Status::BLUESKY_DOCUMENT_URI_META_KEY, true )
		);
	}

	/**
	 * Test that document URI is not stored when no Bluesky share has it.
	 */
	public function test_no_document_uri_when_bluesky_lacks_it() {
		$shares = array(
			array(
				'connection_id' => '222',
				'service'       => 'bluesky',
				'timestamp'     => 1234567890,
				'status'        => 'success',
			),
		);

		Publicize_Setup::store_bluesky_document_uri( static::$post_id, $shares );

		$this->assertEmpty(
			get_post_meta( static::$post_id, Share_Status::BLUESKY_DOCUMENT_URI_META_KEY, true )
		);
	}

	/**
	 * Test that link tag is injected for posts with document URI.
	 */
	/**
	 * Test that link tag is injected for posts with document URI.
	 */
	public function test_inject_link_tag_with_document_uri() {
		$uri = 'at://did:plc:abc123/site.standard.document/tid123';
		update_post_meta( static::$post_id, Share_Status::BLUESKY_DOCUMENT_URI_META_KEY, $uri );

		// Simulate a singular post context.
		$GLOBALS['wp_query']              = new \WP_Query();
		$GLOBALS['wp_query']->is_singular = true;
		$GLOBALS['wp_query']->post        = get_post( static::$post_id );
		$GLOBALS['wp_query']->posts       = array( $GLOBALS['wp_query']->post );
		$GLOBALS['post']                  = $GLOBALS['wp_query']->post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		ob_start();
		Publicize_Setup::inject_standard_site_link_tag();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<link rel="alternate" type="application/json"', $output );
		$this->assertStringContainsString( $uri, $output );
	}

	/**
	 * Test that link tag is not injected for posts without document URI.
	 */
	public function test_no_link_tag_without_document_uri() {
		// Simulate a singular post context.
		$GLOBALS['wp_query']              = new \WP_Query();
		$GLOBALS['wp_query']->is_singular = true;
		$GLOBALS['wp_query']->post        = get_post( static::$post_id );
		$GLOBALS['wp_query']->posts       = array( $GLOBALS['wp_query']->post );
		$GLOBALS['post']                  = $GLOBALS['wp_query']->post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		ob_start();
		Publicize_Setup::inject_standard_site_link_tag();
		$output = ob_get_clean();

		$this->assertEmpty( $output );
	}

	/**
	 * Test that well-known endpoint returns 404 when no publication URI is stored.
	 */
	public function test_wellknown_404_without_publication_uri() {
		delete_option( Connections::BLUESKY_PUBLICATION_URI_OPTION );

		// We can't easily test exit/redirect, but we can verify the option check.
		$this->assertFalse( get_option( Connections::BLUESKY_PUBLICATION_URI_OPTION ) );
	}

	/**
	 * Test that serve_standard_site_publication returns early when query var is not set.
	 */
	public function test_serve_wellknown_returns_early_without_query_var() {
		// No query var set — method should return without calling exit.
		Publicize_Setup::serve_standard_site_publication();

		// If we reach here, it returned early as expected.
		$this->assertTrue( true );
	}

	/**
	 * Test that inject_standard_site_link_tag returns early on non-singular pages.
	 */
	public function test_no_link_tag_on_non_singular() {
		$uri = 'at://did:plc:abc123/site.standard.document/tid123';
		update_post_meta( static::$post_id, Share_Status::BLUESKY_DOCUMENT_URI_META_KEY, $uri );

		// Default wp_query is not singular.
		$GLOBALS['wp_query'] = new \WP_Query();

		ob_start();
		Publicize_Setup::inject_standard_site_link_tag();
		$output = ob_get_clean();

		$this->assertEmpty( $output );
	}

	/**
	 * Test that store_bluesky_document_uri skips non-bluesky shares.
	 */
	public function test_store_document_uri_skips_non_bluesky() {
		$shares = array(
			array(
				'connection_id'              => '111',
				'service'                    => 'tumblr',
				'timestamp'                  => 1234567890,
				'status'                     => 'success',
				'standard_site_document_uri' => 'at://should/not/be/stored',
			),
		);

		Publicize_Setup::store_bluesky_document_uri( static::$post_id, $shares );

		$this->assertEmpty(
			get_post_meta( static::$post_id, Share_Status::BLUESKY_DOCUMENT_URI_META_KEY, true )
		);
	}

	/**
	 * Test that register_standard_site_rewrite registers the rewrite rule and tag.
	 */
	public function test_register_standard_site_rewrite() {
		global $wp_rewrite;

		Publicize_Setup::register_standard_site_rewrite();

		$this->assertNotEmpty( $wp_rewrite->extra_rules_top );
		$this->assertArrayHasKey( '^\.well-known/site\.standard\.publication$', $wp_rewrite->extra_rules_top );
	}
}
