<?php
/**
 * Tests for the layout-grid usage tracking feature.
 *
 * Drives the detector handlers and supporting helpers directly. A spy filter
 * at priority 11 records every `$extra` payload that reaches the dispatcher,
 * so tests assert what would have been logged without ever reaching
 * `Jetpack_Mu_Wpcom::log2logstash()` — the module-load `__return_false`
 * filter at priority 10 still blocks dispatch, the spy just observes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversFunction;

// Disable real logstash dispatch for the entire phpunit process before the
// feature file is required — otherwise the hooks it registers at load time
// (if `Host::is_woa_site()` ever returns true in CI) could fire from any
// test that inserts a post / saves a widget, and `log_observation()` would
// reach `Jetpack_Mu_Wpcom::log2logstash()` and its shutdown HTTP POST to
// `public-api.wordpress.com`. Installed once at module load (not per-test)
// so it survives across test classes and the bootstrap/inter-test windows.
add_filter( 'wpcom_layout_grid_usage_log_enabled', '__return_false' );

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/layout-grid-usage-tracking/layout-grid-usage-tracking.php';

/**
 * @covers ::wpcom_layout_grid_usage_widget_value_contains_block
 * @covers ::wpcom_layout_grid_usage_attribute_source
 * @covers ::wpcom_layout_grid_usage_format_attribution_frame
 * @covers ::wpcom_layout_grid_usage_redact_paths
 * @covers ::wpcom_layout_grid_usage_react_to_post_insert
 * @covers ::wpcom_layout_grid_usage_react_to_widget_block_added
 * @covers ::wpcom_layout_grid_usage_react_to_widget_block_updated
 * @covers ::wpcom_layout_grid_usage_react_to_block_render
 * @covers ::wpcom_layout_grid_usage_should_log_in_context
 * @covers ::wpcom_layout_grid_usage_mark_context_seen
 * @covers ::wpcom_layout_grid_usage_context_transient_key
 * @covers ::wpcom_layout_grid_usage_log_observation
 */
#[CoversFunction( 'wpcom_layout_grid_usage_widget_value_contains_block' )]
#[CoversFunction( 'wpcom_layout_grid_usage_attribute_source' )]
#[CoversFunction( 'wpcom_layout_grid_usage_format_attribution_frame' )]
#[CoversFunction( 'wpcom_layout_grid_usage_redact_paths' )]
#[CoversFunction( 'wpcom_layout_grid_usage_react_to_post_insert' )]
#[CoversFunction( 'wpcom_layout_grid_usage_react_to_widget_block_added' )]
#[CoversFunction( 'wpcom_layout_grid_usage_react_to_widget_block_updated' )]
#[CoversFunction( 'wpcom_layout_grid_usage_react_to_block_render' )]
#[CoversFunction( 'wpcom_layout_grid_usage_should_log_in_context' )]
#[CoversFunction( 'wpcom_layout_grid_usage_mark_context_seen' )]
#[CoversFunction( 'wpcom_layout_grid_usage_context_transient_key' )]
#[CoversFunction( 'wpcom_layout_grid_usage_log_observation' )]
class Layout_Grid_Usage_Tracking_Test extends \WorDBless\BaseTestCase {

	const WPCOM_LAYOUT_GRID_USAGE_MARKUP = '<!-- wp:jetpack/layout-grid --><div></div><!-- /wp:jetpack/layout-grid -->';
	const PARAGRAPH_MARKUP               = '<!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->';

	/**
	 * Captured `$extra` payloads from every `wpcom_layout_grid_usage_log_enabled` filter
	 * invocation during the current test.
	 *
	 * @var array<int, array>
	 */
	private $observations = array();

	/**
	 * Reset per-test sentinel state and install the observation spy. The
	 * module-load `__return_false` at priority 10 stays in place; the spy is
	 * additive at priority 11 and captures but does not unblock.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION );
		delete_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT );
		delete_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT );
		$this->observations = array();
		add_filter( 'wpcom_layout_grid_usage_log_enabled', array( $this, 'spy_observation' ), 11, 2 );
	}

	/**
	 * Remove the per-test spy so its registration doesn't leak across classes.
	 * The module-load `__return_false` at priority 10 stays installed.
	 */
	public function tear_down() {
		remove_filter( 'wpcom_layout_grid_usage_log_enabled', array( $this, 'spy_observation' ), 11 );
		parent::tear_down();
	}

	/**
	 * Observation spy. Records every dispatch attempt; passes through the
	 * incoming `$enabled` (false in tests, thanks to `__return_false` at 10).
	 *
	 * @param bool  $enabled Whether the dispatcher will proceed.
	 * @param array $extra   Surface-specific payload.
	 * @return bool
	 */
	public function spy_observation( $enabled, $extra ) {
		$this->observations[] = $extra;
		return $enabled;
	}

	/**
	 * Build a minimal `WP_Post` instance with the given content. We don't
	 * persist to the DB — handlers pass `$post->post_content` to `has_block`
	 * directly, so an in-memory instance is enough.
	 *
	 * @param string $content   Post content (block markup).
	 * @param string $post_type Defaults to `'post'`.
	 * @return \WP_Post
	 */
	private function make_post( $content, $post_type = 'post' ) {
		return new \WP_Post(
			(object) array(
				'ID'           => 0,
				'post_type'    => $post_type,
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);
	}

	/**
	 * Widget content scan returns true only when a widget entry's `content`
	 * field carries the layout-grid block; every other shape (other blocks,
	 * non-array option values, malformed widget entries) returns false.
	 */
	public function test_widget_value_contains_block_detects_layout_grid_only() {
		$this->assertTrue(
			wpcom_layout_grid_usage_widget_value_contains_block(
				array(
					'42' => array( 'content' => self::PARAGRAPH_MARKUP ),
					'77' => array( 'content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ),
				)
			)
		);

		$negatives = array(
			'other blocks only'        => array(
				'1' => array( 'content' => self::PARAGRAPH_MARKUP ),
				'2' => array( 'content' => '<!-- wp:heading --><h2>x</h2><!-- /wp:heading -->' ),
			),
			'missing option (false)'   => false,
			'null option'              => null,
			'empty string'             => '',
			'widget without content'   => array( '1' => array( 'foo' => 'bar' ) ),
			'widget with null content' => array( '1' => array( 'content' => null ) ),
		);
		foreach ( $negatives as $label => $value ) {
			$this->assertFalse(
				wpcom_layout_grid_usage_widget_value_contains_block( $value ),
				"expected false for: {$label}"
			);
		}
	}

	/**
	 * The per-frame predicate skips malformed frames, the tracker's own
	 * frames, and frames outside `wp-content/(plugins|themes|mu-plugins)/`,
	 * and renders survivors as `<file>:<line>`. This is the real coverage
	 * for the regex + self-skip behavior — `attribute_source()` itself runs
	 * against the live PHPUnit stack which has no extension frames.
	 */
	public function test_format_attribution_frame_filters_and_formats_correctly() {
		$self_file = '/srv/htdocs/__wp__/wp-content/mu-plugins/jetpack-mu-wpcom/src/features/layout-grid-usage-tracking/layout-grid-usage-tracking.php';

		$skips = array(
			'malformed (not array)'       => 'not-a-frame',
			'malformed (missing file)'    => array( 'function' => 'foo' ),
			'malformed (file is not str)' => array(
				'file' => 42,
				'line' => 1,
			),
			'self frame'                  => array(
				'file' => $self_file,
				'line' => 99,
			),
			'core wp-includes frame'      => array(
				'file' => '/srv/htdocs/__wp__/wp-includes/post.php',
				'line' => 1234,
			),
		);
		foreach ( $skips as $label => $frame ) {
			$this->assertNull(
				wpcom_layout_grid_usage_format_attribution_frame( $frame, $self_file ),
				"expected null for: {$label}"
			);
		}

		$keeps = array(
			'/srv/htdocs/__wp__/wp-content/plugins/example/example.php'      => 42,
			'/srv/htdocs/__wp__/wp-content/themes/twentytwentyfive/x.php'    => 88,
			'/srv/htdocs/__wp__/wp-content/mu-plugins/other.php'             => 5,
		);
		foreach ( $keeps as $file => $line ) {
			$this->assertSame(
				$file . ':' . $line,
				wpcom_layout_grid_usage_format_attribution_frame(
					array(
						'file' => $file,
						'line' => $line,
					),
					$self_file
				)
			);
		}

		// Missing `line` field falls back to 0.
		$this->assertSame(
			'/srv/htdocs/__wp__/wp-content/plugins/example/example.php:0',
			wpcom_layout_grid_usage_format_attribution_frame(
				array( 'file' => '/srv/htdocs/__wp__/wp-content/plugins/example/example.php' ),
				$self_file
			)
		);
	}

	/**
	 * Path redaction strips WP_CONTENT_DIR and ABSPATH prefixes, recurses
	 * into nested arrays, and leaves non-string scalars unchanged.
	 */
	public function test_redact_paths_strips_install_paths_recursively() {
		$this->assertTrue( defined( 'WP_CONTENT_DIR' ) && '' !== WP_CONTENT_DIR );
		$this->assertTrue( defined( 'ABSPATH' ) && '' !== ABSPATH );

		$input    = array(
			'trace'        => array(
				WP_CONTENT_DIR . '/plugins/a.php:1',
				WP_CONTENT_DIR . '/themes/b/functions.php:2',
				ABSPATH . 'wp-includes/post.php:99',
			),
			'active_theme' => 'twentytwentyfive',
			'is_rest'      => true,
		);
		$expected = array(
			'trace'        => array(
				'.../plugins/a.php:1',
				'.../themes/b/functions.php:2',
				'.../wp-includes/post.php:99',
			),
			'active_theme' => 'twentytwentyfive',
			'is_rest'      => true,
		);
		$this->assertSame( $expected, wpcom_layout_grid_usage_redact_paths( $input ) );
	}

	/**
	 * `react_to_post_insert` logs on first-landing (new insert, or an update
	 * whose previous version lacked the block) and short-circuits on every
	 * other shape: revisions, posts without the block, updates where
	 * `$post_before` already had the block, and non-WP_Post args.
	 */
	public function test_react_to_post_insert_logs_only_on_first_landing() {
		// Happy: new insert (no $post_before).
		wpcom_layout_grid_usage_react_to_post_insert( 0, $this->make_post( self::WPCOM_LAYOUT_GRID_USAGE_MARKUP, 'page' ), false, null );
		$this->assertCount( 1, $this->observations );
		$this->assertSame( 'post_insert', $this->observations[0]['surface'] );
		$this->assertSame( 'page', $this->observations[0]['post_type'] );

		// Happy: update where the previous version lacked the block.
		wpcom_layout_grid_usage_react_to_post_insert(
			0,
			$this->make_post( self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ),
			true,
			$this->make_post( self::PARAGRAPH_MARKUP )
		);
		$this->assertCount( 2, $this->observations );

		// Negatives — each must not capture an additional observation.
		$negative_count = count( $this->observations );

		// Skip: post without the block.
		wpcom_layout_grid_usage_react_to_post_insert( 0, $this->make_post( self::PARAGRAPH_MARKUP ), false, null );

		// Skip: update where $post_before already had the block.
		wpcom_layout_grid_usage_react_to_post_insert(
			0,
			$this->make_post( self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ),
			true,
			$this->make_post( self::WPCOM_LAYOUT_GRID_USAGE_MARKUP )
		);

		// Skip: non-WP_Post arguments (defensive).
		wpcom_layout_grid_usage_react_to_post_insert( 0, null, false, null );
		wpcom_layout_grid_usage_react_to_post_insert( 0, 'not-a-post', false, null );

		// Skip: revisions short-circuit before the block scan even runs.
		$parent = wp_insert_post(
			array(
				'post_status'  => 'publish',
				'post_type'    => 'post',
				'post_title'   => 'parent',
				'post_content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP,
			),
			true
		);
		$this->assertIsInt( $parent );
		$revision_id = _wp_put_post_revision( $parent );
		$this->assertIsInt( $revision_id );
		wpcom_layout_grid_usage_react_to_post_insert( $revision_id, get_post( $revision_id ), false, null );

		$this->assertCount( $negative_count, $this->observations );
	}

	/**
	 * The widget detectors log on first-landing for both option add and
	 * option update, and short-circuit on every other shape: no layout-grid
	 * in the new value, or an update whose old value already had the block.
	 */
	public function test_react_to_widget_handlers_log_only_on_first_landing() {
		// Happy: add fires when the initial value contains the block.
		wpcom_layout_grid_usage_react_to_widget_block_added(
			'widget_block',
			array( '1' => array( 'content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ) )
		);
		$this->assertCount( 1, $this->observations );
		$this->assertSame( 'widget_add', $this->observations[0]['surface'] );

		// Happy: update fires when the new value has the block and the old didn't.
		wpcom_layout_grid_usage_react_to_widget_block_updated(
			array( '1' => array( 'content' => self::PARAGRAPH_MARKUP ) ),
			array( '1' => array( 'content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ) )
		);
		$this->assertCount( 2, $this->observations );
		$this->assertSame( 'widget_update', $this->observations[1]['surface'] );

		// Skip: add with no layout-grid in the initial value.
		$count = count( $this->observations );
		wpcom_layout_grid_usage_react_to_widget_block_added(
			'widget_block',
			array( '1' => array( 'content' => self::PARAGRAPH_MARKUP ) )
		);
		// Skip: update where the old value already had the block.
		wpcom_layout_grid_usage_react_to_widget_block_updated(
			array( '1' => array( 'content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ) ),
			array( '1' => array( 'content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ) )
		);
		// Skip: update where the new value lacks the block.
		wpcom_layout_grid_usage_react_to_widget_block_updated(
			array( '1' => array( 'content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ) ),
			array( '1' => array( 'content' => self::PARAGRAPH_MARKUP ) )
		);
		$this->assertCount( $count, $this->observations );
	}

	/**
	 * Render backstop captures the observation on first invocation but does
	 * NOT persist the sentinel when the dispatch attempt was blocked — this
	 * is the bugfix: a filter-blocked render must leave the backstop
	 * reversible, otherwise the sentinel would lock the blog out of
	 * attribution forever once the filter is removed. Then verifies the
	 * idempotency property: once the sentinel IS set, subsequent renders
	 * short-circuit before the dispatcher, leaving the existing value alone.
	 */
	public function test_render_backstop_dispatch_gated_then_idempotent() {
		$content = '<div class="wp-block-jetpack-layout-grid">hi</div>';

		// First invocation: spy sees the call, but the module-load filter
		// blocks dispatch (`log_observation` returns false), so the sentinel
		// is NOT persisted — the backstop stays reversible.
		$this->assertFalse( get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );
		$this->assertSame( $content, wpcom_layout_grid_usage_react_to_block_render( $content, array() ) );
		$this->assertCount( 1, $this->observations );
		$this->assertSame( 'render', $this->observations[0]['surface'] );
		$this->assertFalse( get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );

		// Pre-seed a non-default sentinel to catch accidental overwrites: a
		// subsequent render must short-circuit and leave the value untouched.
		update_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION, 7, false );
		$this->assertSame( $content, wpcom_layout_grid_usage_react_to_block_render( $content, array() ) );
		$this->assertCount( 1, $this->observations, 'no new observation when sentinel already set' );
		$this->assertSame( 7, get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );
	}

	/**
	 * The split context gate is read-only and write-only respectively:
	 * `should_log_in_context` never mutates state, `mark_context_seen` writes
	 * only the active context's transient, and import takes precedence at
	 * both ends when both flags are set.
	 */
	public function test_context_gate_is_split_read_then_write_with_import_precedence() {
		// Read-only: no transient set, pass-through everywhere.
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( false, false ) );
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( true, false ) );
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( false, true ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );

		// Read-only: pre-set transients only affect their own context.
		set_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT, 1, DAY_IN_SECONDS );
		$this->assertFalse( wpcom_layout_grid_usage_should_log_in_context( true, false ) );
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( false, true ) );
		// Precedence: import wins when both flags are set.
		$this->assertFalse( wpcom_layout_grid_usage_should_log_in_context( true, true ) );
		delete_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT );

		// Write: each call sets only the active context's transient.
		wpcom_layout_grid_usage_mark_context_seen( false, false );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );

		wpcom_layout_grid_usage_mark_context_seen( true, false );
		$this->assertSame( 1, get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );

		delete_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT );
		wpcom_layout_grid_usage_mark_context_seen( false, true );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertSame( 1, get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );

		// Precedence: import wins on the write side too.
		delete_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT );
		wpcom_layout_grid_usage_mark_context_seen( true, true );
		$this->assertSame( 1, get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );
	}
}
