<?php
/**
 * Tests for the layout-grid usage tracking feature. A spy filter at
 * priority 11 records every `$extra` payload that reaches the dispatcher,
 * while the module-load `__return_false` at priority 10 blocks real dispatch
 * — tests assert what would have been logged without reaching
 * `Jetpack_Mu_Wpcom::log2logstash()`.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversFunction;

// Block real logstash dispatch for the entire phpunit process before the
// feature file is required. Installed once (not per-test) so the safety net
// also covers the bootstrap window and any cross-class test runs.
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
	 * Captured `$extra` payloads from `spy_observation()`.
	 *
	 * @var array<int, array>
	 */
	private $observations = array();

	/**
	 * Reset state and install the per-test spy at priority 11. The module-load
	 * `__return_false` at priority 10 stays installed.
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
	 * Drop the per-test spy so it doesn't leak across classes.
	 */
	public function tear_down() {
		remove_filter( 'wpcom_layout_grid_usage_log_enabled', array( $this, 'spy_observation' ), 11 );
		parent::tear_down();
	}

	/**
	 * Records the candidate `$extra` and passes the incoming `$enabled` through
	 * (which is `false` in tests, set by the module-load `__return_false`).
	 *
	 * @param bool  $enabled
	 * @param array $extra
	 * @return bool
	 */
	public function spy_observation( $enabled, $extra ) {
		$this->observations[] = $extra;
		return $enabled;
	}

	/**
	 * Build an in-memory `WP_Post`. Handlers scan `$post->post_content`
	 * directly, so we don't need to persist to the DB.
	 *
	 * @param string $content
	 * @param string $post_type
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
	 * Widget content scan: true only for entries whose `content` carries the
	 * layout-grid block; false for every other shape.
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
	 * Per-frame predicate: skip malformed/self/core frames, format extension
	 * frames as `<file>:<line>`. `attribute_source()` itself runs against the
	 * live PHPUnit stack (no extension frames), so this is the real coverage.
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
			'/srv/htdocs/__wp__/wp-content/plugins/example/example.php'   => 42,
			'/srv/htdocs/__wp__/wp-content/themes/twentytwentyfive/x.php' => 88,
			'/srv/htdocs/__wp__/wp-content/mu-plugins/other.php'          => 5,
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

		// Missing `line` field → 0.
		$this->assertSame(
			'/srv/htdocs/__wp__/wp-content/plugins/example/example.php:0',
			wpcom_layout_grid_usage_format_attribution_frame(
				array( 'file' => '/srv/htdocs/__wp__/wp-content/plugins/example/example.php' ),
				$self_file
			)
		);
	}

	/**
	 * Path redaction strips WP_CONTENT_DIR / ABSPATH prefixes and recurses
	 * into arrays.
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
	 * Post handler logs first-landings and skips every other shape: revisions,
	 * posts without the block, `$post_before` already had the block, non-WP_Post.
	 */
	public function test_react_to_post_insert_logs_only_on_first_landing() {
		// New insert (no $post_before).
		wpcom_layout_grid_usage_react_to_post_insert( 0, $this->make_post( self::WPCOM_LAYOUT_GRID_USAGE_MARKUP, 'page' ), false, null );
		$this->assertCount( 1, $this->observations );
		$this->assertSame( 'post_insert', $this->observations[0]['surface'] );
		$this->assertSame( 'page', $this->observations[0]['post_type'] );

		// Update where the prior version lacked the block.
		wpcom_layout_grid_usage_react_to_post_insert(
			0,
			$this->make_post( self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ),
			true,
			$this->make_post( self::PARAGRAPH_MARKUP )
		);
		$this->assertCount( 2, $this->observations );

		// Negatives must not add to the observation count.
		$count = count( $this->observations );

		// No block in the new post.
		wpcom_layout_grid_usage_react_to_post_insert( 0, $this->make_post( self::PARAGRAPH_MARKUP ), false, null );

		// $post_before already had the block.
		wpcom_layout_grid_usage_react_to_post_insert(
			0,
			$this->make_post( self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ),
			true,
			$this->make_post( self::WPCOM_LAYOUT_GRID_USAGE_MARKUP )
		);

		// Defensive: non-WP_Post inputs.
		wpcom_layout_grid_usage_react_to_post_insert( 0, null, false, null );
		wpcom_layout_grid_usage_react_to_post_insert( 0, 'not-a-post', false, null );

		// Revisions short-circuit before the block scan.
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

		$this->assertCount( $count, $this->observations );
	}

	/**
	 * Widget handlers log first-landings and skip every other shape: no block
	 * in the new value, or an update whose old value already had it.
	 */
	public function test_react_to_widget_handlers_log_only_on_first_landing() {
		// Add: initial value has the block.
		wpcom_layout_grid_usage_react_to_widget_block_added(
			'widget_block',
			array( '1' => array( 'content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ) )
		);
		$this->assertCount( 1, $this->observations );
		$this->assertSame( 'widget_add', $this->observations[0]['surface'] );

		// Update: new has, old didn't.
		wpcom_layout_grid_usage_react_to_widget_block_updated(
			array( '1' => array( 'content' => self::PARAGRAPH_MARKUP ) ),
			array( '1' => array( 'content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ) )
		);
		$this->assertCount( 2, $this->observations );
		$this->assertSame( 'widget_update', $this->observations[1]['surface'] );

		// Skips must not add to the count.
		$count = count( $this->observations );
		// Add: no layout-grid in the initial value.
		wpcom_layout_grid_usage_react_to_widget_block_added(
			'widget_block',
			array( '1' => array( 'content' => self::PARAGRAPH_MARKUP ) )
		);
		// Update: old already had it.
		wpcom_layout_grid_usage_react_to_widget_block_updated(
			array( '1' => array( 'content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ) ),
			array( '1' => array( 'content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ) )
		);
		// Update: new lacks the block.
		wpcom_layout_grid_usage_react_to_widget_block_updated(
			array( '1' => array( 'content' => self::WPCOM_LAYOUT_GRID_USAGE_MARKUP ) ),
			array( '1' => array( 'content' => self::PARAGRAPH_MARKUP ) )
		);
		$this->assertCount( $count, $this->observations );
	}

	/**
	 * Render backstop: spy sees the call, but a filter-blocked dispatch must
	 * NOT persist the sentinel (otherwise the backstop locks out for the blog
	 * forever, since the option has no TTL). Once the sentinel is set,
	 * subsequent renders short-circuit and leave its value alone.
	 */
	public function test_render_backstop_dispatch_gated_then_idempotent() {
		$content = '<div class="wp-block-jetpack-layout-grid">hi</div>';

		// Dispatch blocked → sentinel not persisted.
		$this->assertFalse( get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );
		$this->assertSame( $content, wpcom_layout_grid_usage_react_to_block_render( $content, array() ) );
		$this->assertCount( 1, $this->observations );
		$this->assertSame( 'render', $this->observations[0]['surface'] );
		$this->assertFalse( get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );

		// Pre-seed a non-default value (catches accidental overwrites that
		// `=== 1` checks would miss); the second render must leave it alone.
		update_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION, 7, false );
		$this->assertSame( $content, wpcom_layout_grid_usage_react_to_block_render( $content, array() ) );
		$this->assertCount( 1, $this->observations, 'sentinel-set render must not reach the dispatcher' );
		$this->assertSame( 7, get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );
	}

	/**
	 * Context gate: `should_log_in_context` is read-only, `mark_context_seen`
	 * writes only the active context's transient, and import wins at both ends.
	 */
	public function test_context_gate_is_split_read_then_write_with_import_precedence() {
		// Read: no transient set → pass-through.
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( false, false ) );
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( true, false ) );
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( false, true ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );

		// Read: pre-set transient affects only its own context; import wins on collision.
		set_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT, 1, DAY_IN_SECONDS );
		$this->assertFalse( wpcom_layout_grid_usage_should_log_in_context( true, false ) );
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( false, true ) );
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

		// Write: import wins on collision.
		delete_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT );
		wpcom_layout_grid_usage_mark_context_seen( true, true );
		$this->assertSame( 1, get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );
	}
}
