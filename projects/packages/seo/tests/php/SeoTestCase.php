<?php
/**
 * Shared base for the package's test cases that touch site content or the
 * content-coverage cache.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Current_Plan;
use PHPUnit\Framework\TestCase;

/**
 * Resets the posts tables and the coverage transient around every test — both
 * persist across tests (and across test *classes*) in the WorDBless database,
 * so content created or cached by one test would otherwise leak into the next.
 */
abstract class SeoTestCase extends TestCase {

	/**
	 * Short-circuit filter for the active plan option.
	 */
	const PLAN_FILTER = 'pre_option_' . Current_Plan::PLAN_OPTION;

	/**
	 * Priority for PLAN_FILTER; later than default so the test pin wins.
	 */
	const PLAN_FILTER_PRIORITY = 20;

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
	 * Undo a plan pin set by set_plan().
	 */
	protected static function reset_plan() {
		remove_all_filters( self::PLAN_FILTER, self::PLAN_FILTER_PRIORITY );
		self::reset_active_plan_cache();
	}

	/**
	 * Clear Current_Plan::get()'s request memo so pins don't leak between tests.
	 */
	protected static function reset_active_plan_cache() {
		$property = ( new \ReflectionClass( Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support. `setAccessible()` is
		// deprecated in 8.5 (a no-op since 8.1), so only call it where it's needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * Put the site on a given plan, via filter so the pin also wins over an
	 * environment's own pre_option short-circuit.
	 *
	 * @param string $product_slug Plan product slug.
	 */
	protected static function set_plan( $product_slug ) {
		remove_all_filters( self::PLAN_FILTER, self::PLAN_FILTER_PRIORITY );
		add_filter(
			self::PLAN_FILTER,
			static function () use ( $product_slug ) {
				return array( 'product_slug' => $product_slug );
			},
			self::PLAN_FILTER_PRIORITY
		);
		self::reset_active_plan_cache();
	}

	/**
	 * Force the seo-tools module on or off.
	 *
	 * Filtering is what `Modules::get_active()` applies last — after it
	 * intersects the stored option with the available modules — so this
	 * controls the input regardless of which modules the test context ships.
	 *
	 * @param bool $active Whether seo-tools should report active.
	 */
	protected static function set_seo_tools_active( $active ) {
		remove_all_filters( 'jetpack_active_modules' );
		add_filter(
			'jetpack_active_modules',
			static function ( $modules ) use ( $active ) {
				$modules = array_diff( (array) $modules, array( 'seo-tools' ) );
				if ( $active ) {
					$modules[] = 'seo-tools';
				}
				return array_values( $modules );
			}
		);
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
