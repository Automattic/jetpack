<?php
/**
 * Regression tests for post meta handling in the Import package's post endpoint.
 *
 * These live here rather than in projects/packages/import because that package's suite runs
 * without WordPress, and a meta round trip needs a real one.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Import\Endpoints\Post as Import_Post_Endpoint;

/**
 * Verifies that imported post meta can never be restored as a PHP object.
 */
class Import_Post_Meta_Object_Injection_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Post the meta gets attached to.
	 *
	 * @var int
	 */
	private $post_id;

	/**
	 * Skip when the import package is not loaded, and set up an importing user.
	 */
	public function set_up() {
		parent::set_up();

		if ( ! class_exists( Import_Post_Endpoint::class ) ) {
			$this->markTestSkipped( 'The jetpack-import package is not loaded in this build.' );
		}

		// process_post_meta() itself does no capability check -- the route's permission_callback
		// does -- but run as an administrator so the test mirrors the real caller.
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$this->post_id = self::factory()->post->create();
	}

	/**
	 * Runs a meta payload through the real endpoint method.
	 *
	 * @param array $meta Meta key => value map, exactly as it arrives in the REST body.
	 * @return void
	 */
	private function import_meta( array $meta ) {
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/import/posts' );
		$request->set_param( 'meta', $meta );

		( new Import_Post_Endpoint() )->process_post_meta( $this->post_id, $request );
	}

	/**
	 * A serialized object in a meta value must not survive as an object.
	 *
	 * Asserted after a full storage round trip, since an object handed to add_post_meta() is
	 * rebuilt on every later read.
	 */
	public function test_object_payload_is_not_stored_as_object() {
		$payload = 'O:8:"stdClass":1:{s:8:"filename";s:10:"/tmp/pwned";}';

		// A payload whose declared string lengths are wrong does not decode at all, which would
		// make every assertion below pass against unpatched code. Pin that it is really an object.
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize -- checking the fixture, not untrusted input.
		$this->assertInstanceOf( stdClass::class, unserialize( $payload ), 'Fixture must decode to an object.' );

		$this->import_meta( array( 'evil_meta' => $payload ) );

		$stored = get_post_meta( $this->post_id, 'evil_meta', true );

		$this->assertNotInstanceOf( stdClass::class, $stored );
		$this->assertNotInstanceOf( '__PHP_Incomplete_Class', $stored, 'Disallowing classes alone still yields an object.' );
		$this->assertFalse( is_object( $stored ), 'Imported meta was restored as a live PHP object.' );
	}

	/**
	 * An object nested inside an otherwise legitimate array must be dropped, siblings kept.
	 */
	public function test_nested_object_is_dropped_but_siblings_survive() {
		$payload = 'a:2:{s:4:"safe";s:2:"ok";s:3:"bad";O:8:"stdClass":0:{}}';

		$this->import_meta( array( 'mixed_meta' => $payload ) );

		$stored = get_post_meta( $this->post_id, 'mixed_meta', true );

		$this->assertIsArray( $stored );
		$this->assertSame( 'ok', $stored['safe'] );
		$this->assertFalse( is_object( $stored['bad'] ), 'A nested object survived the import.' );
	}

	/**
	 * The regression guard: a legitimately serialized array must round-trip unchanged.
	 *
	 * Shaped like _wp_attachment_metadata, which is the most common serialized meta an import
	 * actually carries.
	 */
	public function test_legitimate_serialized_array_round_trips_unchanged() {
		$original = array(
			'width'  => 1200,
			'height' => 800,
			'file'   => '2026/08/example.jpg',
			'sizes'  => array(
				'thumbnail' => array(
					'file'   => 'example-150x150.jpg',
					'width'  => 150,
					'height' => 150,
				),
			),
		);

		$this->import_meta( array( '_wp_attachment_metadata' => serialize( $original ) ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize -- building test input.

		$this->assertSame( $original, get_post_meta( $this->post_id, '_wp_attachment_metadata', true ) );
	}

	/**
	 * A plain, non-serialized scalar must pass through untouched.
	 */
	public function test_plain_scalar_passes_through() {
		$this->import_meta( array( 'plain_meta' => 'just a string' ) );

		$this->assertSame( 'just a string', get_post_meta( $this->post_id, 'plain_meta', true ) );
	}
}
