<?php
/**
 * Tests for Critical_CSS_Storage class.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use WorDBless\BaseTestCase;

/**
 * Class Critical_CSS_Storage_Test
 *
 * Verifies that generated Critical CSS survives a save/load round-trip intact,
 * including double quotes and inline SVG markup in CSS values.
 *
 * @see https://github.com/Automattic/jetpack/issues/42321
 */
class Critical_CSS_Storage_Test extends BaseTestCase {

	/**
	 * Set up test environment.
	 *
	 * WorDBless does not implement the SQL used by WP_Query post_name lookups,
	 * so emulate them from the WorDBless in-memory post store.
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
	 * Emulate WP_Query post_name lookups against the WorDBless post store.
	 *
	 * @param \WP_Post[]|null $posts Posts with which to short-circuit the query, or null.
	 * @param \WP_Query       $query The running query.
	 * @return \WP_Post[]|null
	 */
	public function emulate_name_query( $posts, $query ) {
		// Respect any earlier filter that already short-circuited the query.
		if ( null !== $posts ) {
			return $posts;
		}

		$name      = $query->get( 'name' );
		$post_type = $query->get( 'post_type' );

		if ( ! $name || ! $post_type ) {
			return $posts;
		}

		// Mirror get_post_by_name(), which restricts to published posts. Other
		// WP_Query semantics are intentionally not emulated here.
		$post_status = $query->get( 'post_status' );

		foreach ( \WorDBless\Posts::init()->posts as $id => $post ) {
			if ( $post->post_name === $name
				&& $post->post_type === $post_type
				&& ( ! $post_status || $post->post_status === $post_status ) ) {
				return array( get_post( $id ) );
			}
		}

		return array();
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
}
