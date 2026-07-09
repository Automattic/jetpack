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
 * @covers ::wpcom_layout_grid_usage_classify_origin
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
#[CoversFunction( 'wpcom_layout_grid_usage_classify_origin' )]
#[CoversFunction( 'wpcom_layout_grid_usage_log_observation' )]
class Layout_Grid_Usage_Tracking_Test extends \WorDBless\BaseTestCase {

	const LAYOUT_GRID = '<!-- wp:jetpack/layout-grid --><div></div><!-- /wp:jetpack/layout-grid -->';
	const PARAGRAPH   = '<!-- wp:paragraph --><p>hi</p><!-- /wp:paragraph -->';
	const SELF_FILE   = '/srv/htdocs/__wp__/wp-content/mu-plugins/jetpack-mu-wpcom/src/features/layout-grid-usage-tracking/layout-grid-usage-tracking.php';

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
		// No user, no import/cron/cli constants in the test process → the insert
		// surfaces classify as `programmatic`. Pinned here so origin assertions
		// don't depend on a user another test may have left set.
		wp_set_current_user( 0 );
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
	 * Spy filter — records the candidate `$extra` and passes through the
	 * incoming `$enabled` (false in tests, set by the module-load filter).
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
	 * Build an in-memory `WP_Post` for the handler's `post_content` scan.
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
	 * Build a `widget_block` option value with one widget carrying `$content`.
	 *
	 * @param string|null $content
	 * @return array
	 */
	private function widget_with( $content ) {
		return array( '1' => array( 'content' => $content ) );
	}

	/**
	 * Widget content scan: true only for entries whose `content` carries the
	 * layout-grid block; false for every other shape.
	 */
	public function test_widget_value_contains_block_detects_layout_grid_only() {
		$this->assertTrue(
			wpcom_layout_grid_usage_widget_value_contains_block(
				array(
					'42' => array( 'content' => self::PARAGRAPH ),
					'77' => array( 'content' => self::LAYOUT_GRID ),
				)
			)
		);

		$negatives = array(
			'other blocks only'        => array(
				'1' => array( 'content' => self::PARAGRAPH ),
				'2' => array( 'content' => '<!-- wp:heading --><h2>x</h2><!-- /wp:heading -->' ),
			),
			'missing option (false)'   => false,
			'null option'              => null,
			'empty string'             => '',
			'widget without content'   => array( '1' => array( 'foo' => 'bar' ) ),
			'widget with null content' => $this->widget_with( null ),
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
		$skips = array(
			'not array'        => 'not-a-frame',
			'missing file'     => array( 'function' => 'foo' ),
			'non-string file'  => array(
				'file' => 42,
				'line' => 1,
			),
			'self frame'       => array(
				'file' => self::SELF_FILE,
				'line' => 99,
			),
			'core wp-includes' => array(
				'file' => '/srv/htdocs/__wp__/wp-includes/post.php',
				'line' => 1234,
			),
		);
		foreach ( $skips as $label => $frame ) {
			$this->assertNull(
				wpcom_layout_grid_usage_format_attribution_frame( $frame, self::SELF_FILE ),
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
				"{$file}:{$line}",
				wpcom_layout_grid_usage_format_attribution_frame(
					array(
						'file' => $file,
						'line' => $line,
					),
					self::SELF_FILE
				)
			);
		}

		// Missing `line` field falls back to 0 rather than tripping a notice.
		$this->assertSame(
			'/srv/htdocs/__wp__/wp-content/plugins/example/example.php:0',
			wpcom_layout_grid_usage_format_attribution_frame(
				array( 'file' => '/srv/htdocs/__wp__/wp-content/plugins/example/example.php' ),
				self::SELF_FILE
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
		$with    = $this->make_post( self::LAYOUT_GRID, 'page' );
		$without = $this->make_post( self::PARAGRAPH );

		// Happy: new insert (no $post_before).
		wpcom_layout_grid_usage_react_to_post_insert( 0, $with, false, null );
		$this->assertSame(
			array(
				array(
					'surface'   => 'post_insert',
					'post_type' => 'page',
					'origin'    => 'programmatic',
				),
			),
			$this->observations
		);

		// Happy: update where the prior version lacked the block.
		$this->observations = array();
		wpcom_layout_grid_usage_react_to_post_insert( 0, $this->make_post( self::LAYOUT_GRID ), true, $without );
		$this->assertSame(
			array(
				array(
					'surface'   => 'post_insert',
					'post_type' => 'post',
					'origin'    => 'programmatic',
				),
			),
			$this->observations
		);

		// Set up a revision for the revisions-skip case.
		$parent = wp_insert_post(
			array(
				'post_status'  => 'publish',
				'post_type'    => 'post',
				'post_title'   => 'parent',
				'post_content' => self::LAYOUT_GRID,
			),
			true
		);
		$this->assertIsInt( $parent );
		$revision_id = _wp_put_post_revision( $parent );
		$this->assertIsInt( $revision_id );

		$skips = array(
			'no block in new post'    => array( 0, $without, false, null ),
			'prior version had block' => array( 0, $this->make_post( self::LAYOUT_GRID ), true, $this->make_post( self::LAYOUT_GRID ) ),
			'non-WP_Post: null'       => array( 0, null, false, null ),
			'non-WP_Post: string'     => array( 0, 'not-a-post', false, null ),
			'revision'                => array( $revision_id, get_post( $revision_id ), false, null ),
		);
		foreach ( $skips as $label => $args ) {
			$this->observations = array();
			wpcom_layout_grid_usage_react_to_post_insert( ...$args );
			$this->assertSame( array(), $this->observations, "expected no observation for: {$label}" );
		}
	}

	/**
	 * Widget handlers log first-landings and skip every other shape.
	 */
	public function test_react_to_widget_handlers_log_only_on_first_landing() {
		// Add: initial value has the block.
		wpcom_layout_grid_usage_react_to_widget_block_added( 'widget_block', $this->widget_with( self::LAYOUT_GRID ) );
		$this->assertSame(
			array(
				array(
					'surface' => 'widget_add',
					'origin'  => 'programmatic',
				),
			),
			$this->observations
		);

		// Update: new has, old didn't.
		$this->observations = array();
		wpcom_layout_grid_usage_react_to_widget_block_updated( $this->widget_with( self::PARAGRAPH ), $this->widget_with( self::LAYOUT_GRID ) );
		$this->assertSame(
			array(
				array(
					'surface' => 'widget_update',
					'origin'  => 'programmatic',
				),
			),
			$this->observations
		);

		// Each skip case must leave the observations array empty.
		$skips = array(
			'add: no block in initial' => fn() => wpcom_layout_grid_usage_react_to_widget_block_added( 'widget_block', $this->widget_with( self::PARAGRAPH ) ),
			'update: old already had'  => fn() => wpcom_layout_grid_usage_react_to_widget_block_updated( $this->widget_with( self::LAYOUT_GRID ), $this->widget_with( self::LAYOUT_GRID ) ),
			'update: new lacks block'  => fn() => wpcom_layout_grid_usage_react_to_widget_block_updated( $this->widget_with( self::LAYOUT_GRID ), $this->widget_with( self::PARAGRAPH ) ),
		);
		foreach ( $skips as $label => $invoke ) {
			$this->observations = array();
			$invoke();
			$this->assertSame( array(), $this->observations, "expected no observation for: {$label}" );
		}
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
		$this->assertSame(
			array(
				array(
					'surface' => 'render',
					'origin'  => 'render',
				),
			),
			$this->observations
		);
		$this->assertFalse( get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );

		// Pre-seed a non-default value (catches accidental overwrites that
		// `=== 1` checks would miss); the second render must leave it alone.
		update_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION, 7, false );
		$this->observations = array();
		$this->assertSame( $content, wpcom_layout_grid_usage_react_to_block_render( $content, array() ) );
		$this->assertSame( array(), $this->observations, 'sentinel-set render must not reach the dispatcher' );
		$this->assertSame( 7, get_option( WPCOM_LAYOUT_GRID_USAGE_SEEN_OPTION ) );
	}

	/**
	 * Context gate: `should_log_in_context` is read-only, `mark_context_seen`
	 * writes only the active context's transient, and import wins at both ends.
	 */
	public function test_context_gate_is_split_read_then_write_with_import_precedence() {
		// Read pass-through outside import/cron, and never mutates state.
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( false, false ) );
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( true, false ) );
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( false, true ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ) );
		$this->assertFalse( get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ) );

		// Pre-set transient affects only its own context; import wins on collision.
		set_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT, 1, DAY_IN_SECONDS );
		$this->assertFalse( wpcom_layout_grid_usage_should_log_in_context( true, false ) );
		$this->assertTrue( wpcom_layout_grid_usage_should_log_in_context( false, true ) );
		$this->assertFalse( wpcom_layout_grid_usage_should_log_in_context( true, true ) );
		delete_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT );

		// Each call to mark_context_seen sets only the active context's transient.
		$writes = array(
			'no context'         => array( array( false, false ), false, false ),
			'import only'        => array( array( true, false ), true, false ),
			'cron only'          => array( array( false, true ), false, true ),
			'both (import wins)' => array( array( true, true ), true, false ),
		);
		foreach ( $writes as $label => $case ) {
			delete_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT );
			delete_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT );

			list( $args, $expect_import, $expect_cron ) = $case;
			wpcom_layout_grid_usage_mark_context_seen( ...$args );

			$this->assertSame(
				$expect_import ? 1 : false,
				get_transient( WPCOM_LAYOUT_GRID_USAGE_IMPORT_TRANSIENT ),
				"import transient for: {$label}"
			);
			$this->assertSame(
				$expect_cron ? 1 : false,
				get_transient( WPCOM_LAYOUT_GRID_USAGE_CRON_TRANSIENT ),
				"cron transient for: {$label}"
			);
		}
	}

	/**
	 * Origin classification: a request with a logged-in user and none of the
	 * batch / transport contexts reads as `editor`; with no user it falls
	 * through to `programmatic`. The context-driven branches (migration, import,
	 * xmlrpc, cli, cron, rest, ajax) aren't exercised here — they hinge on
	 * request constants or the wpcomsh migration helper, neither of which can be
	 * toggled without leaking into the rest of the phpunit process.
	 */
	public function test_classify_origin_separates_editor_from_programmatic() {
		wp_set_current_user( 0 );
		$this->assertSame( 'programmatic', wpcom_layout_grid_usage_classify_origin() );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'grid-editor',
				'user_pass'  => 'x',
				'role'       => 'editor',
			)
		);
		$this->assertIsInt( $user_id );
		wp_set_current_user( $user_id );
		$this->assertSame( 'editor', wpcom_layout_grid_usage_classify_origin() );

		// Restore the no-user default for any later test in this instance.
		wp_set_current_user( 0 );
	}
}
