<?php
/**
 * Tests for Critical_CSS_Storage class.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Storage_Post_Type;
use Automattic\Jetpack_Boost\Tests\Lib\Mocks\Boost_POI_Test_Gadget;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../mocks/class-boost-poi-test-gadget.php';

/**
 * Class Critical_CSS_Storage_Test
 *
 * Covers the save/load round-trip and the PHP Object Injection fix (CWE-502):
 * the cache post types deny all access, and get() refuses stored content that
 * declares a PHP object.
 *
 * @see https://github.com/Automattic/jetpack/issues/42321
 */
class Critical_CSS_Storage_Test extends BaseTestCase {

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		Boost_POI_Test_Gadget::$woken = false;

		add_filter( 'posts_pre_query', array( $this, 'emulate_name_query' ), 10, 2 );
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		// Unconditional, so a test that fails part-way cannot leave a user logged in
		// for every test after it.
		wp_set_current_user( 0 );

		remove_filter( 'posts_pre_query', array( $this, 'emulate_name_query' ), 10 );
		\WorDBless\Posts::init()->clear_all_posts();
		parent::tear_down();
	}

	/**
	 * Emulate get_post_by_name()'s post_name lookup against the WorDBless
	 * in-memory post store, which does not implement the SQL WP_Query uses.
	 *
	 * @param \WP_Post[]|null $posts Posts with which to short-circuit the query, or null.
	 * @param \WP_Query       $query The running query.
	 * @return \WP_Post[]|null
	 */
	public function emulate_name_query( $posts, $query ) {
		if ( null !== $posts ) {
			return $posts;
		}

		$post_type = $query->get( 'post_type' );

		if ( ! is_string( $post_type ) || 0 !== strpos( $post_type, 'jb_store_' ) ) {
			return $posts;
		}

		$name = $query->get( 'name' );

		$post_status = $query->get( 'post_status' );
		$post_status = empty( $post_status ) ? array( 'publish' ) : (array) $post_status;

		$matches = array();

		foreach ( \WorDBless\Posts::init()->posts as $id => $post ) {
			if ( $post->post_type !== $post_type ) {
				continue;
			}
			if ( $name && $post->post_name !== $name ) {
				continue;
			}
			if ( ! in_array( $post->post_status, $post_status, true ) ) {
				continue;
			}

			$matches[] = get_post( $id );

			if ( $name ) {
				break;
			}
		}

		return $matches;
	}

	/**
	 * The transient key get() reads and writes.
	 *
	 * @param string $key Cache key.
	 *
	 * @return string
	 */
	private static function transient_key( $key ) {
		return 'jb_store_css_' . Storage_Post_Type::CACHE_VERSION . '_' . $key;
	}

	/**
	 * Write a cache row directly, bypassing set()'s own encoding, to stand in for
	 * a write to the CPT that did not come from Boost.
	 *
	 * @param string $key      Cache key.
	 * @param mixed  $payload  Payload to encode into post_content.
	 * @param bool   $prefixed Write the current row-format prefix. False stands in for
	 *                         a row written before this release.
	 */
	private function write_raw_cache_entry( $key, $payload, $prefixed = true ) {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
		$this->write_raw_serialized_entry( $key, serialize( $payload ), $prefixed );
	}

	/**
	 * Write a cache row from an already-serialized string, for payload shapes PHP
	 * will not produce from a live value.
	 *
	 * @param string $key        Cache key.
	 * @param string $serialized Serialized payload to encode into post_content.
	 * @param bool   $prefixed   Write the current row-format prefix.
	 */
	private function write_raw_serialized_entry( $key, $serialized, $prefixed = true ) {
		$prefix = $prefixed ? Storage_Post_Type::CACHE_VERSION . ':' : '';

		wp_insert_post(
			array(
				'post_type'    => 'jb_store_css',
				'post_title'   => $key,
				'post_name'    => $key,
				'post_status'  => 'publish',
				// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				'post_content' => $prefix . base64_encode( $serialized ),
			)
		);
	}

	/**
	 * Test that double quotes and inline SVG markup in CSS values survive a
	 * save/load round-trip.
	 */
	public function test_store_css_round_trip_preserves_double_quotes_and_svg() {
		$css = '.test-svg-background { background-image: url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 8 8\'><circle cx=\'4\' cy=\'4\' r=\'4\' fill=\'%23f00\'/></svg>"); }';

		$storage = new Critical_CSS_Storage();
		$storage->store_css( 'core_front_page', $css );

		$result = $storage->get_css( array( 'core_front_page' ) );

		$this->assertIsArray( $result );
		$this->assertSame( 'core_front_page', $result['key'] );
		$this->assertSame( $css, $result['css'] );
	}

	/**
	 * Test that updating an existing entry does not corrupt double quotes.
	 */
	public function test_store_css_update_preserves_double_quotes() {
		$storage = new Critical_CSS_Storage();
		$storage->store_css( 'core_posts_page', '.a { content: "first"; }' );

		$css = '.quote::before { content: "\201C"; font-family: "Times New Roman", serif; }';
		$storage->store_css( 'core_posts_page', $css );

		$result = $storage->get_css( array( 'core_posts_page' ) );

		$this->assertIsArray( $result );
		$this->assertSame( $css, $result['css'] );
	}

	/**
	 * The access-control half of the PHP Object Injection fix. Both stores are
	 * covered: they share one class and one args array, but jb_store_lcp is half
	 * the production surface.
	 */
	public function test_cache_post_types_deny_all_mapped_capabilities() {
		foreach ( array( 'css', 'lcp' ) as $name ) {
			$storage = new Storage_Post_Type( $name );

			$slug = $storage->post_type_slug();
			$this->assertSame( 'jb_store_' . $name, $slug );

			$post_type = get_post_type_object( $slug );

			$this->assertNotNull( $post_type, "{$slug} post type should be registered." );
			$this->assertFalse( $post_type->show_in_rest, "{$slug} must not be exposed to the REST API." );

			foreach (
				array(
					'read',
					'create_posts',
					'edit_posts',
					'edit_others_posts',
					'edit_published_posts',
					'edit_private_posts',
					'publish_posts',
					'read_private_posts',
					'delete_posts',
					'delete_others_posts',
					'delete_published_posts',
					'delete_private_posts',
				) as $cap
			) {
				$this->assertSame(
					'do_not_allow',
					$post_type->cap->$cap,
					"{$slug} capability {$cap} must map to do_not_allow."
				);
			}
		}
	}

	/**
	 * The assertions above prove the strings reached the post type object; this
	 * proves WordPress's capability mapping refuses a real administrator.
	 */
	public function test_administrator_cannot_touch_cache_post_type_rows() {
		$stores = array();
		foreach ( array( 'css', 'lcp' ) as $store ) {
			$stores[ $store ] = new Storage_Post_Type( $store );
			$stores[ $store ]->set( 'cap_probe', array( 'css' => '.a {}' ) );
		}

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'boost_cap_probe_admin',
				'user_pass'  => wp_generate_password(),
				'user_email' => 'boost_cap_probe_admin@example.com',
				'role'       => 'administrator',
			)
		);
		$this->assertIsInt( $admin_id, 'Test administrator should have been created.' );
		wp_set_current_user( $admin_id );

		// Control: the same meta caps resolve to true for an ordinary post, so a
		// false below is the post type's policy and not an inert test harness.
		$ordinary = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_title'  => 'ordinary',
				'post_status' => 'publish',
			)
		);
		$this->assertTrue( current_user_can( 'edit_post', $ordinary ), 'Control: an administrator can edit an ordinary post.' );

		foreach ( $stores as $store => $storage ) {
			$row = $storage->get_post_by_name( 'cap_probe' );
			$this->assertNotFalse( $row, $store . ': Boost should still be able to write and read its own row.' );

			$caps = get_post_type_object( 'jb_store_' . $store )->cap;

			$this->assertFalse( current_user_can( $caps->create_posts ), $store . ': creating a cache row must be denied.' );
			$this->assertFalse( current_user_can( 'edit_post', $row->ID ), $store . ': editing a cache row must be denied.' );
			$this->assertFalse( current_user_can( 'delete_post', $row->ID ), $store . ': deleting a cache row must be denied.' );
			$this->assertFalse( current_user_can( 'read_post', $row->ID ), $store . ': reading a cache row must be denied.' );
		}
	}

	/**
	 * The stored-content half of the fix: a payload declaring an object is refused
	 * on its wire format, before unserialize() runs, so no object -- not even a
	 * __PHP_Incomplete_Class -- is ever instantiated from a cache row (CWE-502).
	 */
	public function test_get_rejects_cache_content_containing_an_object() {
		$key     = 'poi_probe';
		$storage = new Storage_Post_Type( 'css' );

		$this->write_raw_cache_entry(
			$key,
			array(
				'data'   => new Boost_POI_Test_Gadget(),
				'expiry' => 0,
			)
		);

		$result = $storage->get( $key, 'default_value' );

		$this->assertSame(
			'default_value',
			$result,
			'A payload containing an object must be rejected in favour of the default.'
		);

		$this->assertFalse(
			get_transient( self::transient_key( $key ) ),
			'A rejected payload must never reach the transient cache.'
		);

		$this->assertNotFalse(
			$storage->get_post_by_name( $key ),
			'The object check is inexact, so it refuses without deleting; the next set() overwrites the row.'
		);

		$this->assertFalse(
			Boost_POI_Test_Gadget::$woken,
			'__wakeup() must never fire; the gadget class must not be instantiated.'
		);
	}

	/**
	 * The object rejection must catch an object anywhere in the payload, not just
	 * at its top level.
	 */
	public function test_get_rejects_objects_nested_inside_the_payload() {
		$key     = 'poi_nested_probe';
		$storage = new Storage_Post_Type( 'css' );

		$this->write_raw_cache_entry(
			$key,
			array(
				'data'   => array(
					'css' => array( 'deep' => new Boost_POI_Test_Gadget() ),
				),
				'expiry' => 0,
			)
		);

		$result = $storage->get( $key, 'default_value' );

		$this->assertSame(
			'default_value',
			$result,
			'An object nested inside the payload must be rejected too.'
		);
		$this->assertFalse(
			get_transient( self::transient_key( $key ) ),
			'A rejected payload must never reach the transient cache.'
		);
	}

	/**
	 * The checks must not reject the ordinary array payloads that set() writes, which
	 * are what every Boost read depends on.
	 */
	public function test_get_still_returns_ordinary_array_payloads() {
		$key     = 'benign_probe';
		$storage = new Storage_Post_Type( 'css' );

		$storage->set( $key, array( 'css' => '.a {}' ) );
		delete_transient( self::transient_key( $key ) );

		$this->assertStringStartsWith(
			Storage_Post_Type::CACHE_VERSION . ':',
			$storage->get_post_by_name( $key )->post_content,
			'set() must write the row-format prefix.'
		);
		$this->assertSame(
			array( 'css' => '.a {}' ),
			$storage->get( $key, 'default_value' ),
			'A normal payload must survive the prefix and object checks.'
		);
	}

	/**
	 * The object-token pattern must not misfire on real Critical CSS, which is
	 * mostly braces and colons.
	 */
	public function test_get_still_returns_css_full_of_braces() {
		$key     = 'brace_heavy_probe';
		$storage = new Storage_Post_Type( 'css' );

		$css = str_repeat( '.a{color:red}', 500 ) . '.b:after{content:"' . str_repeat( '{', 500 ) . '"}';

		$storage->set( $key, array( 'css' => $css ) );
		delete_transient( self::transient_key( $key ) );

		$this->assertSame(
			array( 'css' => $css ),
			$storage->get( $key, 'default_value' ),
			'Braces inside the stored CSS are string content, not an object token.'
		);
	}

	/**
	 * A cached value is served before any of get()'s validation runs, so a transient
	 * written by a release predating that validation can only be avoided. The cache
	 * version in the transient key is what avoids it.
	 */
	public function test_get_ignores_a_transient_written_by_an_earlier_cache_version() {
		$key     = 'legacy_probe';
		$storage = new Storage_Post_Type( 'css' );

		// The key shape a pre-CACHE_VERSION release used.
		set_transient( 'jb_store_css_' . $key, 'value_from_the_vulnerable_version', HOUR_IN_SECONDS );

		$this->assertSame(
			'default_value',
			$storage->get( $key, 'default_value' ),
			'A transient from an earlier cache version must never be read back.'
		);
	}

	/**
	 * An 'E:' token builds an enum case whatever allowed_classes says, so for enums
	 * the wire-format check is the only guard there is.
	 */
	public function test_get_rejects_a_serialized_enum_token() {
		$key     = 'enum_probe';
		$storage = new Storage_Post_Type( 'css' );

		$token   = 'Boost_Absent_Attacker_Chosen:CASE_A';
		$payload = 'a:2:{s:4:"data";E:' . strlen( $token ) . ':"' . $token . '";s:6:"expiry";i:0;}';

		// Assert the pattern directly as well. Naming an absent class makes unserialize()
		// fail on its own, so the outcome below is the same with E: dropped from the
		// pattern, and narrowing it to [OC] would otherwise pass the whole suite.
		$this->assertSame(
			1,
			preg_match( Storage_Post_Type::OBJECT_TOKEN_PATTERN, $payload ),
			'The wire-format check must still recognise an E: enum token.'
		);

		$this->write_raw_serialized_entry( $key, $payload );

		$this->assertSame(
			'default_value',
			$storage->get( $key, 'default_value' ),
			'An enum token in the payload must never reach unserialize().'
		);
	}

	/**
	 * A row that claims to be serialized and will not deserialize is not one Boost
	 * can serve, whether it was truncated by a bad import or built by hand.
	 */
	public function test_get_refuses_a_payload_that_claims_to_be_serialized_and_is_not() {
		$key     = 'malformed_probe';
		$storage = new Storage_Post_Type( 'css' );

		// Passes is_serialized(); the declared string length is wrong.
		$this->write_raw_serialized_entry( $key, 'a:1:{s:4:"data";s:99:"short";}' );

		$this->assertSame(
			'default_value',
			$storage->get( $key, 'default_value' ),
			'A payload that will not deserialize must not be served.'
		);
		$this->assertNotFalse(
			$storage->get_post_by_name( $key ),
			'A truncated row and a crafted one look the same here, so neither is deleted.'
		);
	}

	/**
	 * A row written before this release carries no prefix. It is cache Boost itself
	 * wrote, so get() serves it: the prefix marks where the payload starts, it does
	 * not decide whether the row is safe. The row is left in place either way.
	 */
	public function test_get_serves_a_legitimate_row_without_the_current_format_prefix() {
		$key     = 'legacy_row_probe';
		$storage = new Storage_Post_Type( 'css' );

		$this->write_raw_cache_entry(
			$key,
			array(
				'data'   => array( 'css' => 'body{display:none}' ),
				'expiry' => 0,
			),
			false
		);

		$this->assertSame(
			array( 'css' => 'body{display:none}' ),
			$storage->get( $key, 'default_value' ),
			'A legitimate row from before the current format must still be served.'
		);
		$this->assertNotFalse(
			$storage->get_post_by_name( $key ),
			'Serving a legacy row must not delete it.'
		);
	}

	/**
	 * A row from before this release still runs through the object-token scan, so a
	 * payload planted while the post types were open is refused rather than served. It
	 * is left in place, like every other refused row; the next regeneration clears the
	 * whole store.
	 */
	public function test_get_refuses_but_keeps_an_unprefixed_row_containing_an_object() {
		$key     = 'legacy_object_probe';
		$storage = new Storage_Post_Type( 'css' );

		// An O: object token in a row with no format prefix.
		$this->write_raw_serialized_entry(
			$key,
			'a:2:{s:4:"data";O:8:"stdClass":0:{}s:6:"expiry";i:0;}',
			false
		);

		$this->assertSame(
			'default_value',
			$storage->get( $key, 'default_value' ),
			'An object payload must never be served, prefix or not.'
		);
		$this->assertNotFalse(
			$storage->get_post_by_name( $key ),
			'A refused row is left in place, not deleted.'
		);
		$this->assertFalse(
			get_transient( self::transient_key( $key ) ),
			'A refused row must not populate the transient cache.'
		);
	}

	/**
	 * 'b:0;' is serialize( false ), the one input for which a false return from
	 * unserialize() means success.
	 */
	public function test_get_does_not_treat_a_serialized_false_as_malformed() {
		$key     = 'serialized_false_probe';
		$storage = new Storage_Post_Type( 'css' );

		$this->write_raw_serialized_entry( $key, 'b:0;' );

		$this->assertSame(
			'default_value',
			$storage->get( $key, 'default_value' ),
			'A payload with no data key is a miss either way.'
		);
		$this->assertNotFalse(
			$storage->get_post_by_name( $key ),
			'serialize( false ) deserializes correctly, so the row must not be deleted as malformed.'
		);
	}

	/**
	 * The store vets payloads for objects but not for shape, so get_css() has to
	 * treat anything that is not Critical-CSS-shaped as a miss rather than a fatal.
	 */
	public function test_get_css_treats_a_wrong_shaped_payload_as_a_miss() {
		$key     = 'wrong_shape_probe';
		$storage = new Critical_CSS_Storage();

		$this->write_raw_cache_entry(
			$key,
			array(
				'data'   => 'not-an-array',
				'expiry' => 0,
			)
		);

		$this->assertFalse(
			$storage->get_css( array( $key ) ),
			'A payload that is not shaped like Critical CSS must be a miss, not a fatal.'
		);
	}

	/**
	 * The wrapper check alone is not enough: get_css()'s return value is concatenated
	 * into a <style> tag, where an array-valued leaf renders the literal string
	 * "Array" alongside a PHP notice.
	 */
	public function test_get_css_treats_a_non_string_css_leaf_as_a_miss() {
		$key     = 'array_leaf_probe';
		$storage = new Critical_CSS_Storage();

		$this->write_raw_cache_entry(
			$key,
			array(
				'data'   => array( 'css' => array( '.a {}' ) ),
				'expiry' => 0,
			)
		);

		$this->assertFalse(
			$storage->get_css( array( $key ) ),
			'Critical CSS that is not a string must be a miss, not a rendered "Array".'
		);
	}
}
