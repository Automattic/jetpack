<?php
/**
 * Tests for LCP_Storage class.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Lcp;

use Automattic\Jetpack_Boost\Lib\Storage_Post_Type;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\Lcp;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_Optimize_Bg_Image;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_Storage;
use WorDBless\BaseTestCase;

/**
 * Class LCP_Storage_Test
 */
class LCP_Storage_Test extends BaseTestCase {

	/**
	 * Set up test environment.
	 *
	 * WorDBless does not implement the SQL used by WP_Query post_name lookups,
	 * so emulate the one LCP_Storage makes.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'posts_pre_query', array( $this, 'emulate_name_query' ), 10, 2 );
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		remove_filter( 'posts_pre_query', array( $this, 'emulate_name_query' ), 10 );
		\WorDBless\Posts::init()->clear_all_posts();
		parent::tear_down();
	}

	/**
	 * Emulate Storage_Post_Type::get_post_by_name()'s single post_name lookup
	 * against the WorDBless in-memory post store.
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
		$name      = $query->get( 'name' );

		if ( 'jb_store_lcp' !== $post_type || ! $name ) {
			return $posts;
		}

		foreach ( \WorDBless\Posts::init()->posts as $id => $post ) {
			if ( $post->post_type === $post_type && $post->post_name === $name ) {
				return array( get_post( $id ) );
			}
		}

		return array();
	}

	/**
	 * The store vets payloads for PHP objects rather than shape, and the pre-fix REST
	 * hole could write jb_store_lcp exactly as it could jb_store_css, so a row can
	 * come back as a scalar into a foreach() in Lcp::filter_output().
	 */
	public function test_get_lcp_treats_a_wrong_shaped_payload_as_a_miss() {
		$key     = 'wrong_shape_probe';
		$storage = new LCP_Storage();

		wp_insert_post(
			array(
				'post_type'    => 'jb_store_lcp',
				'post_title'   => $key,
				'post_name'    => $key,
				'post_status'  => 'publish',
				'post_content' => base64_encode( // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
					maybe_serialize(
						array(
							'data'   => 'not-an-array',
							'expiry' => 0,
						)
					)
				),
			)
		);

		$this->assertFalse(
			$storage->get_lcp( $key ),
			'A payload that is not shaped like LCP data must be a miss.'
		);
	}

	/**
	 * The guard must not swallow the data it exists to protect.
	 */
	public function test_get_lcp_still_returns_well_shaped_payloads() {
		$key     = 'well_shaped_probe';
		$storage = new LCP_Storage();
		$data    = array(
			array(
				'success' => true,
				'type'    => 'img',
			),
		);

		$storage->store_lcp( $key, $data );
		delete_transient( 'jb_store_lcp_' . Storage_Post_Type::CACHE_VERSION . '_' . $key );

		$this->assertSame(
			$data,
			$storage->get_lcp( $key ),
			'Well-shaped LCP data must survive the shape check.'
		);
	}

	/**
	 * The top-level is_array() check is not the shape consumers need: every optimizer
	 * indexes straight into each record, and indexing into a string is an uncaught
	 * TypeError on PHP 8, raised from wp_head on an anonymous render.
	 */
	public function test_get_lcp_treats_a_scalar_record_as_a_miss() {
		$key     = 'scalar_record_probe';
		$storage = new LCP_Storage();

		$this->write_raw_lcp_entry( $key, array( 'not-a-record' ) );

		$this->assertFalse(
			$storage->get_lcp( $key ),
			'A list whose records are not arrays must be a miss, not a payload every consumer will index into.'
		);
	}

	/**
	 * The reproduced crash. An object-free, correctly listed, correctly recorded
	 * payload whose breakpoints field is a string passes every guard between the
	 * store and array_reverse(), because empty( 'not-an-array' ) is false.
	 *
	 * @see \Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_Optimize_Bg_Image::get_responsive_image_rules()
	 */
	public function test_a_string_breakpoints_field_cannot_reach_array_reverse() {
		// Complete enough to clear every guard between the entry point and
		// array_reverse(). Without all of them the assertion below passes whether or
		// not the fix is present.
		$record = array(
			'success'     => true,
			'type'        => Lcp::TYPE_BACKGROUND_IMAGE,
			'selector'    => '.hero',
			'url'         => home_url( '/hero.jpg' ),
			'breakpoints' => 'not-an-array',
		);

		$rules = $this->private_method( LCP_Optimize_Bg_Image::class, 'get_responsive_image_rules' );

		$this->assertSame(
			array(),
			$rules->invoke( new LCP_Optimize_Bg_Image( array( $record ) ), $record ),
			'A non-array breakpoints field must produce no rules, not a TypeError on the render path.'
		);
	}

	/**
	 * Resolve a private method so a test can invoke it.
	 *
	 * ReflectionMethod::setAccessible() is a no-op from PHP 8.1 and deprecated as of
	 * 8.5, where phpunit.11/12.xml.dist's failOnDeprecation turns calling it into a
	 * test failure.
	 *
	 * @param string $class  Class holding the method.
	 * @param string $method Method name.
	 *
	 * @return \ReflectionMethod
	 */
	private function private_method( $class, $method ) {
		$reflection = new \ReflectionMethod( $class, $method );

		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}

		return $reflection;
	}

	/**
	 * Write a cache row directly, bypassing store_lcp()'s own serialization.
	 *
	 * @param string $key   Cache key name.
	 * @param mixed  $value Payload to store under 'data'.
	 *
	 * @return void
	 */
	private function write_raw_lcp_entry( $key, $value ) {
		wp_insert_post(
			array(
				'post_type'    => 'jb_store_lcp',
				'post_title'   => $key,
				'post_name'    => $key,
				'post_status'  => 'publish',
				'post_content' => base64_encode( // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
					maybe_serialize(
						array(
							'data'   => $value,
							'expiry' => 0,
						)
					)
				),
			)
		);
	}
}
