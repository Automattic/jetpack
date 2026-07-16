<?php
/**
 * Shared base for the package's test cases that touch site content or the
 * content-coverage cache.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\TestCase;

/**
 * Resets the posts tables and the coverage transient around every test — both
 * persist across tests (and across test *classes*) in the WorDBless database,
 * so content created or cached by one test would otherwise leak into the next.
 */
abstract class SeoTestCase extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		$this->reset_coverage_cache();
		$this->reset_content();
	}

	protected function tearDown(): void {
		$this->reset_content();
		$this->reset_coverage_cache();
		parent::tearDown();
	}

	/**
	 * Empty the posts tables. WorDBless keeps the SQLite database between tests, so
	 * content created by one test would otherwise be counted by the next.
	 */
	protected function reset_content() {
		global $wpdb;

		$wpdb->query( "DELETE FROM {$wpdb->postmeta}" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DELETE FROM {$wpdb->posts}" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		wp_cache_flush();
	}

	/**
	 * Drop the cached coverage counts.
	 */
	protected function reset_coverage_cache() {
		delete_transient( Content_Coverage::TRANSIENT );
	}

	/**
	 * Invoke one of a class's private statics.
	 *
	 * @param string $class Fully-qualified class name.
	 * @param string $name Method name.
	 * @param mixed  ...$args Arguments.
	 * @return mixed
	 */
	protected function invoke_private( $class, $name, ...$args ) {
		$method = new \ReflectionMethod( $class, $name );
		// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( null, ...$args );
	}

	/**
	 * A coverage payload with distinctive numbers, so a cached read is unmistakable:
	 * recomputing against the emptied test database can only ever produce zeros.
	 *
	 * @return array
	 */
	protected function seeded_coverage() {
		return array(
			'total'               => 41,
			'with_schema'         => 7,
			'with_title'          => 13,
			'with_description'    => 11,
			'with_search_visible' => 39,
		);
	}

	/**
	 * Publish a post with the given SEO meta.
	 *
	 * @param array  $meta      Meta keys to set.
	 * @param string $post_type Post type.
	 * @param string $status    Post status.
	 * @return int Post ID.
	 */
	protected function publish( $meta = array(), $post_type = 'post', $status = 'publish' ) {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test post',
				'post_status' => $status,
				'post_type'   => $post_type,
			)
		);

		foreach ( $meta as $key => $value ) {
			update_post_meta( $post_id, $key, $value );
		}

		return $post_id;
	}

	/**
	 * Add a postmeta row directly, so a post can end up with two rows for one key —
	 * which `update_post_meta()` would never produce, and which the counts must dedupe.
	 *
	 * @param int    $post_id Post to attach the row to.
	 * @param string $key     Meta key.
	 * @param string $value   Meta value.
	 * @return void
	 */
	protected function add_meta_row( $post_id, $key, $value ) {
		global $wpdb;

		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $post_id,
				'meta_key'   => $key,
				'meta_value' => $value,
			)
		);
	}
}
