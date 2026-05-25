<?php
/**
 * Tests for the layout-grid usage tracking feature.
 *
 * Focused on the pure helpers (widget content check, source attribution
 * filter, path redaction) plus the render backstop's sentinel side-effect.
 * The actual logstash dispatch is best-effort plumbing — tested via real
 * deployment + Kibana verification rather than mocked here.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversFunction;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/layout-grid-usage-tracking/layout-grid-usage-tracking.php';

/**
 * @covers ::wpcom_layout_grid_usage_widget_value_contains_block
 * @covers ::wpcom_layout_grid_usage_attribute_source
 * @covers ::wpcom_layout_grid_usage_redact_paths
 * @covers ::wpcom_layout_grid_usage_react_to_block_render
 * @covers ::wpcom_layout_grid_usage_should_log_in_context
 */
#[CoversFunction( 'wpcom_layout_grid_usage_widget_value_contains_block' )]
#[CoversFunction( 'wpcom_layout_grid_usage_attribute_source' )]
#[CoversFunction( 'wpcom_layout_grid_usage_redact_paths' )]
#[CoversFunction( 'wpcom_layout_grid_usage_react_to_block_render' )]
#[CoversFunction( 'wpcom_layout_grid_usage_should_log_in_context' )]
class Layout_Grid_Usage_Tracking_Test extends \WorDBless\BaseTestCase {

	/**
	 * Reset the per-test sentinel state and short-circuit the logstash
	 * dispatch. Without the filter, the render backstop would fall through to
	 * `Jetpack_Mu_Wpcom::log2logstash()`, which can enqueue a real HTTP POST
	 * against `public-api.wordpress.com` on shutdown.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION );
		delete_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT );
		delete_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT );
		add_filter( 'wpcom_layout_grid_usage_log_enabled', '__return_false' );
	}

	/**
	 * Tear down the test-only logging filter so it doesn't leak across cases.
	 */
	public function tear_down() {
		remove_filter( 'wpcom_layout_grid_usage_log_enabled', '__return_false' );
		parent::tear_down();
	}

	/**
	 * Widget content scan returns true when any widget entry carries a
	 * layout-grid block in its `content` field.
	 */
	public function test_widget_value_contains_block_returns_true_for_layout_grid() {
		$value = array(
			'42' => array( 'content' => '<!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->' ),
			'77' => array( 'content' => '<!-- wp:jetpack/layout-grid --><div></div><!-- /wp:jetpack/layout-grid -->' ),
		);
		$this->assertTrue( wpcom_layout_grid_usage_widget_value_contains_block( $value ) );
	}

	/**
	 * Returns false when no widget entry has the block.
	 */
	public function test_widget_value_contains_block_returns_false_for_other_blocks() {
		$value = array(
			'1' => array( 'content' => '<!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->' ),
			'2' => array( 'content' => '<!-- wp:heading --><h2>x</h2><!-- /wp:heading -->' ),
		);
		$this->assertFalse( wpcom_layout_grid_usage_widget_value_contains_block( $value ) );
	}

	/**
	 * Returns false for non-array input (e.g. `false` from a missing option).
	 */
	public function test_widget_value_contains_block_returns_false_for_non_array() {
		$this->assertFalse( wpcom_layout_grid_usage_widget_value_contains_block( false ) );
		$this->assertFalse( wpcom_layout_grid_usage_widget_value_contains_block( null ) );
		$this->assertFalse( wpcom_layout_grid_usage_widget_value_contains_block( '' ) );
	}

	/**
	 * Returns false for a widget entry without a `content` field — guards
	 * against malformed option payloads.
	 */
	public function test_widget_value_contains_block_returns_false_for_widget_without_content() {
		$value = array(
			'1' => array( 'foo' => 'bar' ),
			'2' => array( 'content' => null ),
		);
		$this->assertFalse( wpcom_layout_grid_usage_widget_value_contains_block( $value ) );
	}

	/**
	 * Documents the regex the production helper applies to each frame's `file`
	 * field. Asserts exact equality (not contains-substring) so accidental
	 * widening of the filter is caught.
	 */
	public function test_attribute_source_filter_keeps_only_extension_frames() {
		$files    = array(
			'/srv/htdocs/__wp__/wp-includes/post.php',
			'/srv/htdocs/__wp__/wp-content/plugins/example/example.php',
			'/srv/htdocs/__wp__/wp-content/themes/twentytwentyfive/functions.php',
			'/srv/htdocs/__wp__/wp-content/mu-plugins/example.php',
		);
		$pattern  = '#/wp-content/(plugins|themes|mu-plugins)/#';
		$relevant = array_values(
			array_filter(
				$files,
				static fn( $file ) => (bool) preg_match( $pattern, $file )
			)
		);
		$this->assertSame(
			array(
				'/srv/htdocs/__wp__/wp-content/plugins/example/example.php',
				'/srv/htdocs/__wp__/wp-content/themes/twentytwentyfive/functions.php',
				'/srv/htdocs/__wp__/wp-content/mu-plugins/example.php',
			),
			$relevant
		);
	}

	/**
	 * Source attribution returns an array capped at 8 entries, and every entry
	 * must obey the `<file>:<line>` contract with `<file>` under an extension
	 * directory. In a PHPUnit context the production call stack normally has
	 * no extension frames, so the array is typically empty; when it isn't,
	 * each entry must satisfy the per-entry shape.
	 */
	public function test_attribute_source_returns_well_formed_entries() {
		$result = wpcom_layout_grid_usage_attribute_source();
		$this->assertIsArray( $result );
		$this->assertLessThanOrEqual( 8, count( $result ) );
		$tracker_file = Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/layout-grid-usage-tracking/layout-grid-usage-tracking.php';
		foreach ( $result as $entry ) {
			$this->assertIsString( $entry );
			$this->assertMatchesRegularExpression( '#^.+:\d+$#', $entry, 'each entry must be "<file>:<line>"' );
			$this->assertMatchesRegularExpression( '#/wp-content/(plugins|themes|mu-plugins)/#', $entry, 'each entry must be under an extension directory' );
			$this->assertStringNotContainsString( $tracker_file, $entry, 'self-frames must be skipped' );
		}
	}

	/**
	 * Path redaction swaps WP_CONTENT_DIR prefixes with `.../` in strings.
	 */
	public function test_redact_paths_strips_wp_content_dir() {
		$this->assertTrue( defined( 'WP_CONTENT_DIR' ) && '' !== WP_CONTENT_DIR );
		$input    = WP_CONTENT_DIR . '/plugins/example/example.php:42';
		$expected = '.../plugins/example/example.php:42';
		$this->assertSame( $expected, wpcom_layout_grid_usage_redact_paths( $input ) );
	}

	/**
	 * Path redaction swaps ABSPATH prefixes too — exercised for files outside
	 * wp-content (rare in our payloads but cheap to cover).
	 */
	public function test_redact_paths_strips_abspath() {
		$this->assertTrue( defined( 'ABSPATH' ) && '' !== ABSPATH );
		$input    = ABSPATH . 'wp-includes/post.php:99';
		$expected = '.../wp-includes/post.php:99';
		$this->assertSame( $expected, wpcom_layout_grid_usage_redact_paths( $input ) );
	}

	/**
	 * Path redaction recurses into nested arrays so the `trace` and
	 * `active_plugins` fields get the same treatment as top-level strings.
	 */
	public function test_redact_paths_recurses_into_arrays() {
		$input    = array(
			'trace'        => array(
				WP_CONTENT_DIR . '/plugins/a.php:1',
				WP_CONTENT_DIR . '/themes/b/functions.php:2',
			),
			'active_theme' => 'twentytwentyfive',
			'is_rest'      => true,
		);
		$expected = array(
			'trace'        => array(
				'.../plugins/a.php:1',
				'.../themes/b/functions.php:2',
			),
			'active_theme' => 'twentytwentyfive',
			'is_rest'      => true,
		);
		$this->assertSame( $expected, wpcom_layout_grid_usage_redact_paths( $input ) );
	}

	/**
	 * Render backstop sets the sentinel and returns the rendered content
	 * byte-for-byte unchanged on first invocation.
	 */
	public function test_render_backstop_sets_sentinel_on_first_render() {
		$this->assertFalse( get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );

		$content = '<div class="wp-block-jetpack-layout-grid">hi</div>';
		$result  = wpcom_layout_grid_usage_react_to_block_render( $content, array() );

		$this->assertSame( $content, $result );
		$this->assertSame( 1, get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );
	}

	/**
	 * Render backstop is idempotent: once the sentinel is set, subsequent
	 * renders return the content unchanged, leave the sentinel untouched, and
	 * never reach the dispatch path.
	 */
	public function test_render_backstop_noops_when_sentinel_already_set() {
		update_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION, 7, false );

		$content = '<div class="wp-block-jetpack-layout-grid">hi</div>';
		$result  = wpcom_layout_grid_usage_react_to_block_render( $content, array() );

		$this->assertSame( $content, $result );
		// The handler must not overwrite a pre-existing sentinel value.
		$this->assertSame( 7, get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );
	}

	/**
	 * Context gate is a no-op outside import and cron: returns true and
	 * leaves both transients untouched.
	 */
	public function test_should_log_in_context_passes_through_outside_import_and_cron() {
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( false, false ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );
	}

	/**
	 * Import context: first call returns true and sets the import transient
	 * (only); second call returns false and does not touch the cron transient.
	 */
	public function test_should_log_in_context_rate_limits_import() {
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( true, false ) );
		$this->assertSame( 1, get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );

		$this->assertFalse( wpcom_layout_grid_usage_should_log_in_context( true, false ) );
		$this->assertSame( 1, get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );
	}

	/**
	 * Cron context: first call returns true and sets the cron transient
	 * (only); second call returns false and does not touch the import
	 * transient.
	 */
	public function test_should_log_in_context_rate_limits_cron() {
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( false, true ) );
		$this->assertSame( 1, get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );

		$this->assertFalse( wpcom_layout_grid_usage_should_log_in_context( false, true ) );
		$this->assertSame( 1, get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
	}

	/**
	 * When both flags are set (cron-triggered import), import takes
	 * precedence: only the import transient is written.
	 */
	public function test_should_log_in_context_prefers_import_when_both_flags_set() {
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( true, true ) );
		$this->assertSame( 1, get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );
	}
}
