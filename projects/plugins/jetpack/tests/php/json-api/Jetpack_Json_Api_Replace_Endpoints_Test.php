<?php
/**
 * Tests for the plugins/replace and themes/replace JSON API endpoints.
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests for the plugins/replace and themes/replace JSON API endpoints.
 *
 * @covers \Jetpack_JSON_API_Plugins_Replace_Endpoint
 * @covers \Jetpack_JSON_API_Themes_Replace_Endpoint
 */
#[CoversClass( Jetpack_JSON_API_Plugins_Replace_Endpoint::class )]
#[CoversClass( Jetpack_JSON_API_Themes_Replace_Endpoint::class )]
class Jetpack_Json_Api_Replace_Endpoints_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	private static $user_id;
	private static $other_user_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$user_id       = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$other_user_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public function set_up() {
		parent::set_up();
		$_SERVER['REQUEST_METHOD'] = 'POST';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
		wp_set_current_user( self::$user_id );
	}

	/**
	 * Build a minimal endpoint instance for direct method testing.
	 *
	 * @param string $class Endpoint class name.
	 * @return object
	 */
	private function make_endpoint( $class ) {
		return new $class(
			array(
				'description'    => '',
				'group'          => '__do_not_document',
				'stat'           => 'test',
				'method'         => 'POST',
				'path'           => '/sites/%s/plugins/replace',
				'path_labels'    => array( '$site' => '(int|string) Site' ),
				'request_format' => array( 'zip' => '(array)' ),
			)
		);
	}

	/**
	 * Invoke the protected validate_attachment_ownership() method.
	 *
	 * @param object $endpoint      Endpoint instance.
	 * @param int    $attachment_id Attachment ID to validate.
	 * @return true|WP_Error
	 */
	private function invoke_ownership_check( $endpoint, $attachment_id ) {
		$class  = new ReflectionClass( $endpoint );
		$method = $class->getMethod( 'validate_attachment_ownership' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( $endpoint, $attachment_id );
	}

	/**
	 * Invoke the protected validate_call() method. Used to exercise the
	 * cross-user attachment-deletion guard without bootstrapping the full API
	 * dispatcher.
	 *
	 * @param object $endpoint     Endpoint instance.
	 * @param array  $capabilities Capability list to pass to validate_call.
	 * @return bool|WP_Error
	 */
	private function invoke_validate_call( $endpoint, $capabilities ) {
		$class  = new ReflectionClass( $endpoint );
		$method = $class->getMethod( 'validate_call' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( $endpoint, 0, $capabilities, true );
	}

	private function create_attachment( $author_id ) {
		return self::factory()->attachment->create_object(
			array(
				'file'           => 'test-plugin.zip',
				'post_parent'    => 0,
				'post_mime_type' => 'application/zip',
				'post_type'      => 'attachment',
				'post_author'    => $author_id,
			)
		);
	}

	/**
	 * Attachment post with no _wp_attached_file meta. Causes get_attached_file()
	 * to return false.
	 */
	private function create_fileless_attachment( $author_id ) {
		$attachment_id = $this->create_attachment( $author_id );
		delete_post_meta( $attachment_id, '_wp_attached_file' );
		return $attachment_id;
	}

	public function test_plugins_replace_endpoint_extends_new_endpoint() {
		$this->assertTrue(
			is_subclass_of(
				Jetpack_JSON_API_Plugins_Replace_Endpoint::class,
				Jetpack_JSON_API_Plugins_New_Endpoint::class
			)
		);
	}

	public function test_themes_replace_endpoint_extends_new_endpoint() {
		$this->assertTrue(
			is_subclass_of(
				Jetpack_JSON_API_Themes_Replace_Endpoint::class,
				Jetpack_JSON_API_Themes_New_Endpoint::class
			)
		);
	}

	public function test_plugins_replace_requires_install_and_update_caps() {
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Plugins_Replace_Endpoint::class );
		$class    = new ReflectionClass( $endpoint );
		$property = $class->getProperty( 'needed_capabilities' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$this->assertSame( array( 'install_plugins', 'update_plugins' ), $property->getValue( $endpoint ) );
	}

	public function test_themes_replace_requires_install_and_update_caps() {
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Themes_Replace_Endpoint::class );
		$class    = new ReflectionClass( $endpoint );
		$property = $class->getProperty( 'needed_capabilities' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$this->assertSame( array( 'install_themes', 'update_themes' ), $property->getValue( $endpoint ) );
	}

	public function test_plugins_ownership_check_rejects_missing_post() {
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Plugins_Replace_Endpoint::class );
		$result   = $this->invoke_ownership_check( $endpoint, 99999999 );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_attachment', $result->get_error_code() );
	}

	public function test_plugins_ownership_check_rejects_non_attachment() {
		$post_id  = self::factory()->post->create( array( 'post_author' => self::$user_id ) );
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Plugins_Replace_Endpoint::class );
		$result   = $this->invoke_ownership_check( $endpoint, $post_id );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_attachment', $result->get_error_code() );
	}

	public function test_plugins_ownership_check_rejects_other_users_attachment() {
		$attachment_id = $this->create_attachment( self::$other_user_id );
		$endpoint      = $this->make_endpoint( Jetpack_JSON_API_Plugins_Replace_Endpoint::class );
		$result        = $this->invoke_ownership_check( $endpoint, $attachment_id );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'attachment_not_owned', $result->get_error_code() );
	}

	public function test_plugins_ownership_check_accepts_owned_attachment() {
		$attachment_id = $this->create_attachment( self::$user_id );
		$endpoint      = $this->make_endpoint( Jetpack_JSON_API_Plugins_Replace_Endpoint::class );
		$result        = $this->invoke_ownership_check( $endpoint, $attachment_id );
		$this->assertTrue( $result );
	}

	public function test_themes_ownership_check_rejects_missing_post() {
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Themes_Replace_Endpoint::class );
		$result   = $this->invoke_ownership_check( $endpoint, 99999999 );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_attachment', $result->get_error_code() );
	}

	public function test_themes_ownership_check_rejects_non_attachment() {
		$post_id  = self::factory()->post->create( array( 'post_author' => self::$user_id ) );
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Themes_Replace_Endpoint::class );
		$result   = $this->invoke_ownership_check( $endpoint, $post_id );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_attachment', $result->get_error_code() );
	}

	public function test_themes_ownership_check_rejects_other_users_attachment() {
		$attachment_id = $this->create_attachment( self::$other_user_id );
		$endpoint      = $this->make_endpoint( Jetpack_JSON_API_Themes_Replace_Endpoint::class );
		$result        = $this->invoke_ownership_check( $endpoint, $attachment_id );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'attachment_not_owned', $result->get_error_code() );
	}

	public function test_themes_ownership_check_accepts_owned_attachment() {
		$attachment_id = $this->create_attachment( self::$user_id );
		$endpoint      = $this->make_endpoint( Jetpack_JSON_API_Themes_Replace_Endpoint::class );
		$result        = $this->invoke_ownership_check( $endpoint, $attachment_id );
		$this->assertTrue( $result );
	}

	/**
	 * CHARACTERIZATION TEST — pins the current behavior, does NOT endorse it
	 * as universally safe.
	 *
	 * When there is no current user (site-auth path) the ownership check is
	 * skipped: a system-authored attachment (post_author=0) passes. This is
	 * only safe because the wpcom upload forwarder is expected to vouch for
	 * the caller and create the attachment as part of the same request. If
	 * that wpcom-side contract ever breaks, skipping the check becomes
	 * install-anything for any trusted site credential. See the class-level
	 * docblock "Authentication trust model" section on both replace endpoints.
	 */
	public function test_ownership_check_passes_for_site_auth_with_system_attachment() {
		wp_set_current_user( 0 );
		$attachment_id = $this->create_attachment( 0 );

		$plugins_endpoint = $this->make_endpoint( Jetpack_JSON_API_Plugins_Replace_Endpoint::class );
		$this->assertTrue( $this->invoke_ownership_check( $plugins_endpoint, $attachment_id ) );

		$themes_endpoint = $this->make_endpoint( Jetpack_JSON_API_Themes_Replace_Endpoint::class );
		$this->assertTrue( $this->invoke_ownership_check( $themes_endpoint, $attachment_id ) );
	}

	/**
	 * Asymmetry worth pinning down: a logged-in user plus a post_author=0
	 * attachment currently fails the ownership check. If the wpcom forwarder
	 * ever stamps post_author=0 while running under a mapped user, legitimate
	 * user-auth calls would get blocked here.
	 */
	public function test_ownership_check_rejects_system_attachment_for_logged_in_user() {
		$attachment_id = $this->create_attachment( 0 );
		$endpoint      = $this->make_endpoint( Jetpack_JSON_API_Plugins_Replace_Endpoint::class );
		$result        = $this->invoke_ownership_check( $endpoint, $attachment_id );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'attachment_not_owned', $result->get_error_code() );
	}

	public function test_plugins_install_deletes_attachment_when_file_missing() {
		$attachment_id = $this->create_fileless_attachment( self::$user_id );
		$endpoint      = new Jetpack_JSON_API_Plugins_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => $attachment_id ) ),
				'slug' => 'test-slug',
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'local-file-does-not-exist', $result->get_error_code() );
		$this->assertNull( get_post( $attachment_id ), 'Attachment should have been deleted on missing-file path.' );
	}

	public function test_themes_install_deletes_attachment_when_file_missing() {
		$attachment_id = $this->create_fileless_attachment( self::$user_id );
		$endpoint      = new Jetpack_JSON_API_Themes_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => $attachment_id ) ),
				'slug' => 'test-slug',
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'local-file-does-not-exist', $result->get_error_code() );
		$this->assertNull( get_post( $attachment_id ), 'Attachment should have been deleted on missing-file path.' );
	}

	public function test_plugins_install_preserves_attachment_when_ownership_fails() {
		$attachment_id = $this->create_attachment( self::$other_user_id );
		$endpoint      = new Jetpack_JSON_API_Plugins_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => $attachment_id ) ),
				'slug' => 'test-slug',
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'attachment_not_owned', $result->get_error_code() );
		$this->assertNotNull( get_post( $attachment_id ), 'Attachment must survive an ownership failure.' );
	}

	public function test_themes_install_preserves_attachment_when_ownership_fails() {
		$attachment_id = $this->create_attachment( self::$other_user_id );
		$endpoint      = new Jetpack_JSON_API_Themes_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => $attachment_id ) ),
				'slug' => 'test-slug',
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'attachment_not_owned', $result->get_error_code() );
		$this->assertNotNull( get_post( $attachment_id ), 'Attachment must survive an ownership failure.' );
	}

	/**
	 * The cross-user attachment-deletion guard. The parent endpoint's validate_call
	 * deletes the attachment on cap-check failure without ownership verification;
	 * the trait's validate_call must short-circuit on ownership failure BEFORE
	 * parent::validate_call runs, so another user's attachment is never deleted as
	 * a side effect of a cap check failing.
	 */
	public function test_plugins_validate_call_rejects_other_users_attachment_without_deleting_it() {
		$attachment_id = $this->create_attachment( self::$other_user_id );
		$endpoint      = new Jetpack_JSON_API_Plugins_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => $attachment_id ) ) )
		);

		$result = $this->invoke_validate_call( $endpoint, array( 'install_plugins', 'update_plugins' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'attachment_not_owned', $result->get_error_code() );
		$this->assertNotNull( get_post( $attachment_id ), 'Cross-user attachment must not be deleted on validate_call rejection.' );
	}

	public function test_themes_validate_call_rejects_other_users_attachment_without_deleting_it() {
		$attachment_id = $this->create_attachment( self::$other_user_id );
		$endpoint      = new Jetpack_JSON_API_Themes_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => $attachment_id ) ) )
		);

		$result = $this->invoke_validate_call( $endpoint, array( 'install_themes', 'update_themes' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'attachment_not_owned', $result->get_error_code() );
		$this->assertNotNull( get_post( $attachment_id ), 'Cross-user attachment must not be deleted on validate_call rejection.' );
	}

	public function test_plugins_validate_call_rejects_invalid_attachment_id() {
		$endpoint = new Jetpack_JSON_API_Plugins_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => 99999999 ) ) )
		);

		$result = $this->invoke_validate_call( $endpoint, array( 'install_plugins', 'update_plugins' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_attachment', $result->get_error_code() );
	}

	public function test_plugins_install_rejects_missing_zip_param() {
		$endpoint = new Jetpack_JSON_API_Plugins_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array()
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'no_plugin_installed', $result->get_error_code() );
	}

	public function test_themes_install_rejects_missing_zip_param() {
		$endpoint = new Jetpack_JSON_API_Themes_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array()
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'no_theme_installed', $result->get_error_code() );
	}

	public function test_plugins_install_rejects_non_scalar_id() {
		$endpoint = new Jetpack_JSON_API_Plugins_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => array( 'nested' => 'oops' ) ) ),
				'slug' => 'test-slug',
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'no_plugin_installed', $result->get_error_code() );
	}

	public function test_themes_install_rejects_non_scalar_id() {
		$endpoint = new Jetpack_JSON_API_Themes_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => array( 'nested' => 'oops' ) ) ),
				'slug' => 'test-slug',
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'no_theme_installed', $result->get_error_code() );
	}

	public function test_plugins_install_rejects_missing_slug() {
		$attachment_id = $this->create_attachment( self::$user_id );
		$endpoint      = new Jetpack_JSON_API_Plugins_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => $attachment_id ) ) )
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'missing_slug', $result->get_error_code() );
		$this->assertNotNull( get_post( $attachment_id ), 'Attachment must survive a missing-slug rejection.' );
	}

	public function test_themes_install_rejects_missing_slug() {
		$attachment_id = $this->create_attachment( self::$user_id );
		$endpoint      = new Jetpack_JSON_API_Themes_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array( 'zip' => array( array( 'id' => $attachment_id ) ) )
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'missing_slug', $result->get_error_code() );
	}

	public function test_plugins_install_rejects_non_zip_mime() {
		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => 'evil.jpg',
				'post_parent'    => 0,
				'post_mime_type' => 'image/jpeg',
				'post_type'      => 'attachment',
				'post_author'    => self::$user_id,
			)
		);
		$endpoint      = new Jetpack_JSON_API_Plugins_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => $attachment_id ) ),
				'slug' => 'test-slug',
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_attachment_mime', $result->get_error_code() );
		$this->assertNull( get_post( $attachment_id ), 'Non-zip attachment should be cleaned up.' );
	}

	public function test_themes_install_rejects_non_zip_mime() {
		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => 'evil.jpg',
				'post_parent'    => 0,
				'post_mime_type' => 'image/jpeg',
				'post_type'      => 'attachment',
				'post_author'    => self::$user_id,
			)
		);
		$endpoint      = new Jetpack_JSON_API_Themes_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => $attachment_id ) ),
				'slug' => 'test-slug',
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_attachment_mime', $result->get_error_code() );
	}

	public function test_plugins_install_rejects_non_zip_extension() {
		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => 'evil.jpg.txt',
				'post_parent'    => 0,
				'post_mime_type' => 'application/zip',
				'post_type'      => 'attachment',
				'post_author'    => self::$user_id,
			)
		);
		$endpoint      = new Jetpack_JSON_API_Plugins_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => $attachment_id ) ),
				'slug' => 'test-slug',
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_attachment_extension', $result->get_error_code() );
		$this->assertNull( get_post( $attachment_id ), 'Non-.zip attachment should be cleaned up.' );
	}

	public function test_themes_install_rejects_non_zip_extension() {
		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => 'evil.jpg.txt',
				'post_parent'    => 0,
				'post_mime_type' => 'application/zip',
				'post_type'      => 'attachment',
				'post_author'    => self::$user_id,
			)
		);
		$endpoint      = new Jetpack_JSON_API_Themes_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => $attachment_id ) ),
				'slug' => 'test-slug',
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'invalid_attachment_extension', $result->get_error_code() );
		$this->assertNull( get_post( $attachment_id ), 'Non-.zip attachment should be cleaned up.' );
	}

	public function test_plugins_sanitize_upgrader_error_collapses_unknown_codes() {
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Plugins_Replace_Endpoint::class );
		$class    = new ReflectionClass( $endpoint );
		$method   = $class->getMethod( 'sanitize_upgrader_error' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$leaky  = new WP_Error( 'mysterious_failure', 'Internal path /var/www/html/wp-content/plugins leaked' );
		$result = $method->invoke( $endpoint, $leaky );

		$this->assertSame( 'install_failed', $result->get_error_code() );
		$this->assertStringNotContainsString( '/var/www', $result->get_error_message() );
	}

	public function test_plugins_sanitize_upgrader_error_preserves_known_codes() {
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Plugins_Replace_Endpoint::class );
		$class    = new ReflectionClass( $endpoint );
		$method   = $class->getMethod( 'sanitize_upgrader_error' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$known  = new WP_Error( 'incompatible_archive', 'path leak /tmp/x' );
		$result = $method->invoke( $endpoint, $known );

		$this->assertSame( 'incompatible_archive', $result->get_error_code() );
		$this->assertStringNotContainsString( '/tmp/x', $result->get_error_message() );
	}

	/**
	 * Version-compatibility codes are user-actionable and MUST surface.
	 */
	public function test_plugins_sanitize_upgrader_error_preserves_version_codes() {
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Plugins_Replace_Endpoint::class );
		$class    = new ReflectionClass( $endpoint );
		$method   = $class->getMethod( 'sanitize_upgrader_error' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		foreach ( array( 'incompatible_php_required_version', 'incompatible_wp_required_version' ) as $code ) {
			$result = $method->invoke( $endpoint, new WP_Error( $code, 'whatever' ) );
			$this->assertSame( $code, $result->get_error_code(), "Code $code must be preserved." );
		}
	}

	public function test_themes_sanitize_upgrader_error_collapses_unknown_codes() {
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Themes_Replace_Endpoint::class );
		$class    = new ReflectionClass( $endpoint );
		$method   = $class->getMethod( 'sanitize_upgrader_error' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$leaky  = new WP_Error( 'mysterious_failure', 'Internal path /var/www/html/wp-content/themes leaked' );
		$result = $method->invoke( $endpoint, $leaky );

		$this->assertSame( 'install_failed', $result->get_error_code() );
		$this->assertStringNotContainsString( '/var/www', $result->get_error_message() );
	}

	public function test_themes_sanitize_upgrader_error_preserves_known_codes() {
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Themes_Replace_Endpoint::class );
		$class    = new ReflectionClass( $endpoint );
		$method   = $class->getMethod( 'sanitize_upgrader_error' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$known  = new WP_Error( 'incompatible_archive_theme_no_style', 'path leak /tmp/x' );
		$result = $method->invoke( $endpoint, $known );

		$this->assertSame( 'incompatible_archive_theme_no_style', $result->get_error_code() );
		$this->assertStringNotContainsString( '/tmp/x', $result->get_error_message() );
	}

	public function test_plugins_sanitize_upgrader_error_collapses_empty_code() {
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Plugins_Replace_Endpoint::class );
		$class    = new ReflectionClass( $endpoint );
		$method   = $class->getMethod( 'sanitize_upgrader_error' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $endpoint, new WP_Error() );

		$this->assertSame( 'install_failed', $result->get_error_code() );
	}

	public function test_themes_sanitize_upgrader_error_collapses_empty_code() {
		$endpoint = $this->make_endpoint( Jetpack_JSON_API_Themes_Replace_Endpoint::class );
		$class    = new ReflectionClass( $endpoint );
		$method   = $class->getMethod( 'sanitize_upgrader_error' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $endpoint, new WP_Error() );

		$this->assertSame( 'install_failed', $result->get_error_code() );
	}

	/**
	 * @dataProvider provide_invalid_slugs
	 */
	#[DataProvider( 'provide_invalid_slugs' )]
	public function test_plugins_install_rejects_invalid_slug( $invalid_slug ) {
		$attachment_id = $this->create_attachment( self::$user_id );
		$endpoint      = new Jetpack_JSON_API_Plugins_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => $attachment_id ) ),
				'slug' => $invalid_slug,
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'missing_slug', $result->get_error_code() );
	}

	public static function provide_invalid_slugs() {
		return array(
			'empty string'       => array( '' ),
			'single dot'         => array( '.' ),
			'double dot'         => array( '..' ),
			'leading dot'        => array( '.hidden' ),
			'double dot middle'  => array( 'foo..bar' ),
			'slash'              => array( '..//..' ),
			'whitespace only'    => array( '   ' ),
			'leading hyphen'     => array( '-akismet' ),
			'leading underscore' => array( '_akismet' ),
			'path traversal'     => array( '../../etc/passwd' ),
			'non-ascii'          => array( 'akîsmet' ),
			'non-scalar'         => array( array( 'nested' ) ),
		);
	}

	/**
	 * @dataProvider provide_invalid_slugs
	 */
	#[DataProvider( 'provide_invalid_slugs' )]
	public function test_themes_install_rejects_invalid_slug( $invalid_slug ) {
		$attachment_id = $this->create_attachment( self::$user_id );
		$endpoint      = new Jetpack_JSON_API_Themes_Replace_Endpoint_Test_Stub(
			$this->endpoint_args(),
			array(
				'zip'  => array( array( 'id' => $attachment_id ) ),
				'slug' => $invalid_slug,
			)
		);

		$result = $endpoint->install();

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'missing_slug', $result->get_error_code() );
	}

	/**
	 * Shared registration args for stub-driven install() tests.
	 *
	 * @return array
	 */
	private function endpoint_args() {
		return array(
			'description'    => '',
			'group'          => '__do_not_document',
			'stat'           => 'test',
			'method'         => 'POST',
			'path'           => '/sites/%s/plugins/replace',
			'path_labels'    => array( '$site' => '(int|string) Site' ),
			'request_format' => array( 'zip' => '(array)' ),
		);
	}
}

/**
 * Test stub that stubs input() to return a fixed payload, avoiding the need to
 * bootstrap a full API request. Used for exercising install()'s early-return
 * paths in isolation.
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_JSON_API_Plugins_Replace_Endpoint_Test_Stub extends Jetpack_JSON_API_Plugins_Replace_Endpoint {
	private $stub_input;

	public function __construct( $args, $input ) {
		parent::__construct( $args );
		$this->stub_input = $input;
	}

	public function input( $return_default_values = true, $cast_and_filter = true ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->stub_input;
	}
}

/**
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_JSON_API_Themes_Replace_Endpoint_Test_Stub extends Jetpack_JSON_API_Themes_Replace_Endpoint {
	private $stub_input;

	public function __construct( $args, $input ) {
		parent::__construct( $args );
		$this->stub_input = $input;
	}

	public function input( $return_default_values = true, $cast_and_filter = true ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->stub_input;
	}
}
