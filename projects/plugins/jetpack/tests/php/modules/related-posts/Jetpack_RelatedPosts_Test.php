<?php

require __DIR__ . '/../../../../modules/related-posts.php';

class Jetpack_RelatedPosts_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		Jetpack_RelatedPosts_Module::instance()->action_on_load();
		add_filter( 'jetpack_relatedposts_filter_options', '__return_null' );
	}

	/**
	 * Tear down.
	 *
	 * Reset the singleton's cached options so option state does not leak between
	 * tests (get_options() caches the first computed value on the instance).
	 */
	public function tear_down() {
		$options = new ReflectionProperty( Jetpack_RelatedPosts::class, 'options' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$options->setAccessible( true );
		}
		$options->setValue( Jetpack_RelatedPosts::init(), null );

		parent::tear_down();
	}

	/**
	 * The Related Posts block renders through its own block callback, independently
	 * of the module's front-end asset gate (enabled_for_request()). Rendering the
	 * block must therefore enqueue its own stylesheet, otherwise the block appears
	 * as unstyled HTML in any context the gate skips — most notably a Related Posts
	 * block placed on a page while using a classic theme.
	 *
	 * Regression test for the "block CSS not enqueued on the frontend" bug. The fix
	 * must live on the block render path and must NOT widen enabled_for_request(),
	 * which would re-introduce #39783 (related posts auto-appended to classic-theme
	 * pages).
	 */
	public function test_render_block_enqueues_frontend_style() {
		$related_posts = Jetpack_RelatedPosts::init();

		// render_block() bails unless it is handling a front-end request.
		add_filter( 'jetpack_is_frontend', '__return_true' );

		// Use the module's real default options (enabled, size 3) instead of the
		// null options the shared set_up injects.
		remove_filter( 'jetpack_relatedposts_filter_options', '__return_null' );

		// Never hit the WordPress.com API during the test...
		add_filter(
			'pre_http_request',
			static function () {
				return new WP_Error( 'no_http_in_tests', 'HTTP disabled in tests' );
			}
		);

		// ...and inject a related post so the block produces markup.
		add_filter(
			'jetpack_relatedposts_returned_results',
			static function () {
				return array(
					array(
						'title' => 'A related post',
						'url'   => 'https://example.org/related-post/',
						'rel'   => '',
					),
				);
			}
		);

		// A singular post for render_block() to build against (it uses get_the_ID()).
		$post_id         = self::factory()->post->create();
		$GLOBALS['post'] = get_post( $post_id );

		// Sanity check: the stylesheet is not already enqueued.
		wp_dequeue_style( 'jetpack_related-posts' );
		$this->assertFalse( wp_style_is( 'jetpack_related-posts', 'enqueued' ) );

		// isServerRendered mirrors the get_server_rendered_html() path: calling
		// render_block() directly never registers a block, so block supports must
		// be skipped (otherwise WP_Block_Supports::apply_block_supports() reads an
		// offset on a null block_to_render and warns). The enqueue under test runs
		// before that branch, so this does not affect what we are asserting.
		$output = $related_posts->render_block(
			array(
				'isServerRendered'  => true,
				'displayThumbnails' => false,
				'displayDate'       => false,
			),
			''
		);

		$this->assertStringContainsString( 'jp-relatedposts-i2', $output, 'The block should render its markup.' );
		$this->assertTrue(
			wp_style_is( 'jetpack_related-posts', 'enqueued' ),
			'Rendering the Related Posts block should enqueue its stylesheet.'
		);

		// The block path only needs the stylesheet; the async script is intentionally
		// not enqueued here (enqueue_assets( false, true )).
		$this->assertFalse(
			wp_script_is( 'jetpack_related-posts', 'enqueued' ),
			'Rendering the Related Posts block should not enqueue the async script.'
		);
	}

	/**
	 * The stylesheet must only be enqueued when the block actually outputs markup.
	 * render_block() returns an empty string before the enqueue when there are no
	 * related posts, so rendering an empty block must not leave the stylesheet on
	 * the page.
	 */
	public function test_render_block_without_results_does_not_enqueue_style() {
		$related_posts = Jetpack_RelatedPosts::init();

		// render_block() bails unless it is handling a front-end request.
		add_filter( 'jetpack_is_frontend', '__return_true' );

		// Use the module's real default options (enabled, size 3) instead of the
		// null options the shared set_up injects.
		remove_filter( 'jetpack_relatedposts_filter_options', '__return_null' );

		// Never hit the WordPress.com API during the test...
		add_filter(
			'pre_http_request',
			static function () {
				return new WP_Error( 'no_http_in_tests', 'HTTP disabled in tests' );
			}
		);

		// ...and force an empty result set so the block renders nothing.
		add_filter( 'jetpack_relatedposts_returned_results', '__return_empty_array' );

		// A singular post for render_block() to build against (it uses get_the_ID()).
		$post_id         = self::factory()->post->create();
		$GLOBALS['post'] = get_post( $post_id );

		// Ensure a clean baseline: the stylesheet is not already enqueued.
		wp_dequeue_style( 'jetpack_related-posts' );
		$this->assertFalse( wp_style_is( 'jetpack_related-posts', 'enqueued' ) );

		$output = $related_posts->render_block(
			array(
				'displayThumbnails' => false,
				'displayDate'       => false,
			),
			''
		);

		$this->assertSame( '', $output, 'The block should render nothing when there are no related posts.' );
		$this->assertFalse(
			wp_style_is( 'jetpack_related-posts', 'enqueued' ),
			'The Related Posts block should not enqueue its stylesheet when it renders nothing.'
		);
	}

	/**
	 * Verify that 'enabled' remains the same if it's true.
	 *
	 * @since  4.7.0
	 */
	public function test_options_ok() {
		$options_after_parse = array(
			'enabled'         => true,
			'show_headline'   => true,
			'show_thumbnails' => true,
			'show_date'       => true,
			'show_context'    => true,
			'layout'          => 'grid',
			'headline'        => 'Related',
			'size'            => null,
		);
		$options             = $options_after_parse;

		$this->assertEquals( $options_after_parse, Jetpack_RelatedPosts::init()->parse_options( $options ) );
	}

	/**
	 * Verify that if 'enabled' is somehow not passed to saving request, it's set to true.
	 *
	 * @since  4.7.0
	 */
	public function test_options_enabled_true_if_not_set() {
		$options_after_parse = array(
			// The option 'enabled' isn't passed if it's saved in Customizer
			'show_headline'   => true,
			'show_thumbnails' => true,
			'show_date'       => true,
			'show_context'    => true,
			'layout'          => 'grid',
			'headline'        => 'Related',
			'size'            => null,
		);
		$options             = $options_after_parse;

		// Must be true after saving in Customizer
		$options_after_parse['enabled'] = true;

		$this->assertEquals( $options_after_parse, Jetpack_RelatedPosts::init()->parse_options( $options ) );
	}

	/**
	 * Verify that 'enabled' is set to true if one of the keys saved by Customizer are passed.
	 *
	 * @since  4.7.0
	 */
	public function test_options_enabled_false_if_has_customizer_key() {
		$options_after_parse = array(
			'enabled'         => true,
			'show_headline'   => false,
			'show_thumbnails' => false,
			'show_date'       => true,
			'show_context'    => false,
			'layout'          => 'grid',
			'headline'        => 'Related',
			'size'            => null,
		);

		$this->assertEquals(
			$options_after_parse,
			Jetpack_RelatedPosts::init()->parse_options(
				array(
					'enabled'   => false,
					'show_date' => true,
				)
			)
		);

		$options_after_parse['show_date'] = false;
		$this->assertEquals(
			$options_after_parse,
			Jetpack_RelatedPosts::init()->parse_options(
				array(
					'show_date' => false,
				)
			)
		);
	}

	/**
	 * Verify that 'enabled' can be saved as false if it's explicitly set to false.
	 *
	 * @since  4.7.0
	 */
	public function test_options_enabled_false_if_not_customizer_key() {
		$options = array(
			'enabled'         => false, // set to false
			'show_headline'   => true,
			'show_thumbnails' => true,
			'size'            => null,
		);

		// When enabled is false, the other options are cleared.
		$empty_options = array(
			'enabled' => false,
			'size'    => null,
		);

		$this->assertEquals( $empty_options, Jetpack_RelatedPosts::init()->parse_options( $options ) );
	}
}
