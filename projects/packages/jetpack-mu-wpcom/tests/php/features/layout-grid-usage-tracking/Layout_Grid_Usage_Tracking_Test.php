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
 */
#[CoversFunction( 'wpcom_layout_grid_usage_widget_value_contains_block' )]
#[CoversFunction( 'wpcom_layout_grid_usage_attribute_source' )]
#[CoversFunction( 'wpcom_layout_grid_usage_redact_paths' )]
#[CoversFunction( 'wpcom_layout_grid_usage_react_to_block_render' )]
class Layout_Grid_Usage_Tracking_Test extends \WorDBless\BaseTestCase {

	/**
	 * Reset the sentinel option before each test so render-backstop tests
	 * start from a known state.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION );
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
	 * Source attribution keeps frames whose file paths point under
	 * wp-content/plugins, wp-content/themes, or wp-content/mu-plugins and
	 * drops everything else (core, pluggable, internal callers).
	 *
	 * Indirect: we can't easily stage a real call stack containing those
	 * paths from a test, so this drives the underlying filter directly via
	 * the same regex.
	 */
	public function test_attribute_source_filter_keeps_only_extension_frames() {
		$frames   = array(
			'WP_Hook->apply_filters()',
			'do_action()',
			'/srv/htdocs/__wp__/wp-includes/post.php:1234',
			'/srv/htdocs/__wp__/wp-content/plugins/example/example.php:42',
			'/srv/htdocs/__wp__/wp-content/themes/twentytwentyfive/functions.php:88',
			'/srv/htdocs/__wp__/wp-content/mu-plugins/example.php:5',
		);
		$pattern  = '#/wp-content/(plugins|themes|mu-plugins)/#';
		$relevant = array_values(
			array_filter(
				$frames,
				static fn( $frame ) => (bool) preg_match( $pattern, $frame )
			)
		);
		$this->assertCount( 3, $relevant );
		$this->assertStringContainsString( '/plugins/example/', $relevant[0] );
		$this->assertStringContainsString( '/themes/twentytwentyfive/', $relevant[1] );
		$this->assertStringContainsString( '/mu-plugins/example.php', $relevant[2] );
	}

	/**
	 * Source attribution returns an array (possibly empty) and never fatals.
	 * In a test environment the only frames in the stack are PHPUnit /
	 * package internals, so the filter usually yields zero matches — we
	 * just assert the shape is correct.
	 */
	public function test_attribute_source_returns_array() {
		$result = wpcom_layout_grid_usage_attribute_source();
		$this->assertIsArray( $result );
		$this->assertLessThanOrEqual( 8, count( $result ) );
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
	 * unchanged on first invocation.
	 */
	public function test_render_backstop_sets_sentinel_and_returns_content() {
		$this->assertFalse( get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );

		$content = '<div class="wp-block-jetpack-layout-grid">hi</div>';
		$result  = wpcom_layout_grid_usage_react_to_block_render( $content, array() );

		$this->assertSame( $content, $result );
		$this->assertSame( 1, get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );
	}

	/**
	 * Render backstop is idempotent: once the sentinel is set, subsequent
	 * renders short-circuit before the log dispatch (and obviously still
	 * pass the content through unchanged).
	 */
	public function test_render_backstop_noops_when_sentinel_already_set() {
		update_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION, 1, false );

		$content = '<div class="wp-block-jetpack-layout-grid">hi</div>';
		$result  = wpcom_layout_grid_usage_react_to_block_render( $content, array() );

		$this->assertSame( $content, $result );
		$this->assertSame( 1, get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );
	}
}
