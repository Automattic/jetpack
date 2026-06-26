<?php

use Automattic\Jetpack\Blocks;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Jetpack_Gutenberg
 */
#[CoversClass( Jetpack_Gutenberg::class )]
class Jetpack_Gutenberg_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public $master_user_id = false;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		if ( ! function_exists( 'register_block_type' ) ) {
			$this->markTestSkipped( 'register_block_type not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
		}

		if ( ! class_exists( 'WP_Block_Type_Registry' ) ) {
			$this->markTestSkipped( 'WP_Block_Type_Registry not available' );
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
		}
		// Create a user and set it up as current.
		$this->master_user_id = self::factory()->user->create( array( 'user_login' => 'current_master' ) );
		// Mock a connection
		Jetpack_Options::update_option( 'master_user', $this->master_user_id );
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asd.asd.1' );
		Jetpack::activate_default_modules();

		add_filter( 'jetpack_set_available_extensions', array( __CLASS__, 'get_extensions_whitelist' ) );
		delete_option( 'jetpack_excluded_extensions' );

		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		}

		// These action causing issues in tests in WPCOM context. Since we are not using any real block here,
		// and we are testing block availability with block stubs - we are safe to remove these actions for these tests.
		remove_all_actions( 'jetpack_register_gutenberg_extensions' );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		parent::tear_down();

		Jetpack_Gutenberg::reset();
		remove_filter( 'jetpack_set_available_extensions', array( __CLASS__, 'get_extensions_whitelist' ) );

		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			remove_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		}

		if ( $this->master_user_id ) {
			Jetpack_Options::delete_option( array( 'master_user', 'user_tokens' ) );
			wp_delete_user( $this->master_user_id );
		}

		if ( class_exists( 'WP_Block_Type_Registry' ) ) {
			$blocks = WP_Block_Type_Registry::get_instance()->get_all_registered();
			foreach ( $blocks as $block_name => $block ) {
				if ( wp_startswith( $block_name, 'jetpack/' ) ) {
					unregister_block_type( $block_name );
				}
			}
		}
	}

	public static function get_extensions_whitelist() {
		return array(
			// Our Blocks :)
			'apple',
			'banana',
			'coconut',
			'grape',
			// Our Plugins :)
			'onion',
			'potato',
			'tomato',
		);
	}

	/**
	 * This test will throw an exception/fail if blocks register twice upon repeat calls to get_availability()
	 */
	public function test_does_calling_get_availability_twice_result_in_notice() {
		add_action( 'jetpack_register_gutenberg_extensions', array( $this, 'register_block' ) );
		Jetpack_Gutenberg::get_availability();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Calling this twice is precisely the purpose of the test.
		Jetpack_Gutenberg::get_availability();
		$result = remove_action( 'jetpack_register_gutenberg_extensions', array( $this, 'register_block' ) );
		$this->assertTrue( $result );
	}

	public function register_block() {
		Blocks::jetpack_register_block( 'jetpack/apple' );
	}

	public function test_registered_block_is_available() {
		Blocks::jetpack_register_block( 'jetpack/apple' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertTrue( $availability['apple']['available'] );
	}

	public function test_registered_block_is_not_available() {
		Jetpack_Gutenberg::set_extension_unavailable( 'banana', 'bar' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertFalse( $availability['banana']['available'], 'banana is available!' );
		$this->assertEquals( 'bar', $availability['banana']['unavailable_reason'], 'unavailable_reason is not "bar"' );
	}

	public function test_registered_block_is_not_available_when_not_defined_in_whitelist() {
		Blocks::jetpack_register_block( 'jetpack/durian' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertArrayNotHasKey( 'durian', $availability, 'durian is available!' );
	}

	public function test_block_is_not_available_when_not_registered_returns_missing_module() {
		$availability = Jetpack_Gutenberg::get_availability();

		// 'unavailable_reason' should be 'missing_module' if the block wasn't registered
		$this->assertFalse( $availability['grape']['available'], 'Availability is not false exists' );
		$this->assertEquals( 'missing_module', $availability['grape']['unavailable_reason'], 'unavailable_reason is not "missing_module"' );
	}

	/** Plugins **/
	public function test_registered_plugin_is_available() {
		Jetpack_Gutenberg::set_extension_available( 'jetpack/onion' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertTrue( $availability['onion']['available'] );
	}

	public function test_registered_plugin_is_not_available() {
		Jetpack_Gutenberg::set_extension_unavailable( 'potato', 'bar' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertFalse( $availability['potato']['available'], 'potato is available!' );
		$this->assertEquals( 'bar', $availability['potato']['unavailable_reason'], 'unavailable_reason is not "bar"' );
	}

	public function test_registered_plugin_is_not_available_when_not_defined_in_whitelist() {
		Jetpack_Gutenberg::set_extension_available( 'jetpack/parsnip' );
		$availability = Jetpack_Gutenberg::get_availability();
		$this->assertArrayNotHasKey( 'parsnip', $availability, 'parsnip is available!' );
	}

	public function test_plugin_is_not_available_when_not_registered_returns_missing_module() {
		$availability = Jetpack_Gutenberg::get_availability();

		// 'unavailable_reason' should be 'missing_module' if the block wasn't registered
		$this->assertFalse( $availability['tomato']['available'], 'Availability is not false exists' );
		$this->assertEquals( 'missing_module', $availability['tomato']['unavailable_reason'], 'unavailable_reason is not "missing_module"' );
	}

	public function test_get_available_extensions() {
		$extensions = Jetpack_Gutenberg::get_available_extensions( $this->get_extensions_whitelist() );
		$this->assertIsArray( $extensions );
		$this->assertNotEmpty( $extensions );
		$this->assertContains( 'onion', $extensions );

		update_option( 'jetpack_excluded_extensions', array( 'onion' ) );

		$extensions = Jetpack_Gutenberg::get_available_extensions( $this->get_extensions_whitelist() );
		$this->assertIsArray( $extensions );
		$this->assertNotEmpty( $extensions );
		$this->assertNotContains( 'onion', $extensions );
	}

	public function test_returns_false_if_core_wp_version_less_than_minimum() {
		$version_gated = Jetpack_Gutenberg::is_gutenberg_version_available(
			array(
				'wp'        => '999999',
				'gutenberg' => '999999',
			),
			'gated_block'
		);
		$this->assertFalse( $version_gated );
	}

	/**
	 * Tests whether the environment has the minimum Gutenberg/WordPress installation needed by a block
	 */
	public function test_returns_true_if_gutenberg_or_core_wp_version_greater_or_equal_to_minimum() {
		$version_gated = Jetpack_Gutenberg::is_gutenberg_version_available(
			array(
				'wp'        => '1',
				'gutenberg' => '1',
			),
			'ungated_block'
		);
		$this->assertTrue( $version_gated );
	}

	/**
	 * Test that known invalid urls are normalized during validation.
	 *
	 * @dataProvider provider_invalid_urls
	 *
	 * @param string $url       Original URL.
	 * @param object $assertion Assertion on the result.
	 */
	#[DataProvider( 'provider_invalid_urls' )]
	public function test_validate_normalizes_invalid_domain_url( $url, $assertion ) {
		$allowed_hosts = array( 'calendar.google.com' );

		$url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed_hosts );

		$this->assertThat( $url, $assertion );
	}

	/**
	 * Provides Original URL and Expected Validated URL values.
	 *
	 * @return array Array of Test Data
	 */
	public static function provider_invalid_urls() {
		return array(
			array(
				'https://calendar.google.com#@evil.com',
				self::equalTo( 'https://calendar.google.com/#%40evil.com' ),
			),
			array(
				'https://foo@evil.com:80@calendar.google.com',
				self::equalTo( 'https://calendar.google.com/' ),
			),
			array(
				'https://foo@127.0.0.1 @calendar.google.com',
				// The fix for https://bugs.php.net/bug.php?id=77423 changed the behavior here.
				// It's included in PHP 8.0.1, 7.4.14, 7.3.26, and distros might have backported it to
				// out-of-support versions too, so just expect either option.
				self::logicalOr( self::isFalse(), self::equalTo( 'https://calendar.google.com/' ) ),
			),
			array(
				'https://calendar.google.com/\xFF\x2E\xFF\x2E/passwd',
				self::equalTo( 'https://calendar.google.com/\xFF\x2E\xFF\x2E/passwd' ),
			),
		);
	}

	/**
	 * Tests whether a third-party domain can be used in a block.
	 */
	public function test_validate_block_embed_third_party_url() {
		$url           = 'https://example.org';
		$allowed_hosts = array( 'wordpress.com' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed_hosts );

		$this->assertFalse( $validated_url );
	}

	/**
	 * Tests whether a random string (not a URL) can be used in a block.
	 */
	public function test_validate_block_embed_string() {
		$url           = 'apple';
		$allowed_hosts = array( 'wordpress.com' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed_hosts );

		$this->assertFalse( $validated_url );
	}

	/**
	 * Tests whether a schemeless URL can be used in a block.
	 */
	public function test_validate_block_embed_scheme() {
		$url           = 'wordpress.com';
		$allowed_hosts = array( 'wordpress.com' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed_hosts );

		$this->assertFalse( $validated_url );
	}

	/**
	 * Tests whether a URL belonging to a whitelisted list can be used in a block.
	 */
	public function test_validate_block_embed_url() {
		$url           = 'https://wordpress.com/tos/';
		$allowed_hosts = array( 'wordpress.com' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed_hosts );

		$this->assertEquals( $url, $validated_url );
	}

	/**
	 * Tests whether a URL matches a specific regex.
	 */
	public function test_validate_block_embed_regex() {
		$url     = 'https://wordpress.com/tos/';
		$allowed = array( '#^https?:\/\/(www.)?wordpress\.com(\/)?([^\/]+)?(\/)?$#' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed, true );

		$this->assertEquals( $url, $validated_url );
	}

	/**
	 * Tests whether a URL does not match a specific regex.
	 */
	public function test_validate_block_embed_regex_mismatch() {
		$url     = 'https://www.facebook.com/WordPresscom/';
		$allowed = array( '#^https?:\/\/(www.)?wordpress\.com(\/)?([^\/]+)?(\/)?$#' );

		$validated_url = Jetpack_Gutenberg::validate_block_embed_url( $url, $allowed, true );

		$this->assertFalse( $validated_url );
	}

	/**
	 * Test that get_block_name_from_path_convention() provides the same results as get_block_name()
	 * for all blocks registered by load_independent_blocks().
	 */
	public function test_get_block_name_from_path_convention_matches_get_block_name() {
		$extensions = Jetpack_Gutenberg::get_available_extensions();
		$this->assertIsArray( $extensions );

		foreach ( $extensions as $extension ) {
			$dirname         = 'blocks';
			$path            = __DIR__ . "/../../../extensions/{$dirname}/{$extension}";
			$block_json_file = "{$path}/block.json";

			if ( file_exists( $path ) && file_exists( $block_json_file ) ) {
				// Get the block name using the path name convention method
				$conventional_name = Blocks::get_block_name_from_path_convention( $path );

				// Get the block name using the existing method
				$block_type    = Blocks::get_path_to_block_metadata( $path );
				$existing_name = Blocks::get_block_name( $block_type );

				// Assert that both methods return the same result
				$this->assertEquals(
					$existing_name,
					$conventional_name,
					"Block name mismatch for {$extension} in {$dirname} directory"
				);
			}
		}
	}

	/**
	 * Test setting and getting a JS loading strategy for a block.
	 */
	public function test_set_and_get_block_js_loading_strategy() {
		$block_name = 'test-block';
		$strategy   = array( 'strategy' => 'defer' );

		// Set the strategy
		Jetpack_Gutenberg::set_block_js_loading_strategy( $block_name, $strategy );

		// Get the strategy and verify it matches
		$retrieved_strategy = Jetpack_Gutenberg::get_block_js_loading_strategy( $block_name );
		$this->assertEquals( $strategy, $retrieved_strategy );
	}

	/**
	 * Test that getting a JS loading strategy for a non-existent block returns false.
	 */
	public function test_get_block_js_loading_strategy_returns_false_for_nonexistent_block() {
		$block_name = 'nonexistent-block';

		$strategy = Jetpack_Gutenberg::get_block_js_loading_strategy( $block_name );
		$this->assertEquals(
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			),
			$strategy
		);
	}

	/**
	 * Test setting a boolean JS loading strategy for a block.
	 */
	public function test_set_block_js_loading_strategy_with_boolean() {
		$block_name = 'boolean-strategy-block';
		$strategy   = true;

		// Set the strategy
		Jetpack_Gutenberg::set_block_js_loading_strategy( $block_name, $strategy );

		// Get the strategy and verify it matches
		$retrieved_strategy = Jetpack_Gutenberg::get_block_js_loading_strategy( $block_name );
		$this->assertEquals( $strategy, $retrieved_strategy );
	}

	/**
	 * Test setting multiple JS loading strategies for different blocks.
	 */
	public function test_set_multiple_block_js_loading_strategies() {
		$strategies = array(
			'block-one'   => array( 'strategy' => 'defer' ),
			'block-two'   => array( 'strategy' => 'async' ),
			'block-three' => true,
			'block-four'  => false,
		);

		// Set all strategies
		foreach ( $strategies as $block_name => $strategy ) {
			Jetpack_Gutenberg::set_block_js_loading_strategy( $block_name, $strategy );
		}

		// Verify all strategies are retrieved correctly
		foreach ( $strategies as $block_name => $expected_strategy ) {
			$retrieved_strategy = Jetpack_Gutenberg::get_block_js_loading_strategy( $block_name );
			$this->assertEquals( $expected_strategy, $retrieved_strategy, "Strategy mismatch for block: {$block_name}" );
		}
	}

	/**
	 * Test overwriting an existing JS loading strategy for a block.
	 */
	public function test_overwrite_block_js_loading_strategy() {
		$block_name       = 'overwrite-test-block';
		$initial_strategy = array( 'strategy' => 'defer' );
		$new_strategy     = array( 'strategy' => 'async' );

		// Set initial strategy
		Jetpack_Gutenberg::set_block_js_loading_strategy( $block_name, $initial_strategy );
		$retrieved_strategy = Jetpack_Gutenberg::get_block_js_loading_strategy( $block_name );
		$this->assertEquals( $initial_strategy, $retrieved_strategy );

		// Overwrite with new strategy
		Jetpack_Gutenberg::set_block_js_loading_strategy( $block_name, $new_strategy );
		$retrieved_strategy = Jetpack_Gutenberg::get_block_js_loading_strategy( $block_name );
		$this->assertEquals( $new_strategy, $retrieved_strategy );
	}
	/**
	 * Test that the reset method clears JS loading strategies.
	 */
	public function test_reset_clears_js_loading_strategies() {
		$block_name = 'reset-test-block';
		$strategy   = array( 'strategy' => 'defer' );

		// Set a strategy
		Jetpack_Gutenberg::set_block_js_loading_strategy( $block_name, $strategy );

		// Verify it's set
		$retrieved_strategy = Jetpack_Gutenberg::get_block_js_loading_strategy( $block_name );
		$this->assertEquals( $strategy, $retrieved_strategy );

		// Reset the class
		Jetpack_Gutenberg::reset();

		// Verify the strategy is cleared
		$retrieved_strategy = Jetpack_Gutenberg::get_block_js_loading_strategy( $block_name );
		$this->assertEquals(
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			),
			$retrieved_strategy
		);
	}

	/**
	 * Invoke the private static Jetpack_Gutenberg::is_block_editor_context().
	 *
	 * @return bool
	 */
	private function invoke_is_block_editor_context() {
		$method = new ReflectionMethod( Jetpack_Gutenberg::class, 'is_block_editor_context' );
		// setAccessible() is a no-op (and deprecated) since PHP 8.1; only needed for older versions.
		// @todo Remove this guard once we no longer need to support PHP < 8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return (bool) $method->invoke( null );
	}

	/**
	 * Set the private static Jetpack_Gutenberg::$deferred_blocks map.
	 *
	 * @param array $value Value to set.
	 */
	private function set_deferred_blocks( $value ) {
		$prop = new ReflectionProperty( Jetpack_Gutenberg::class, 'deferred_blocks' );
		// setAccessible() is a no-op (and deprecated) since PHP 8.1; only needed for older versions.
		// @todo Remove this guard once we no longer need to support PHP < 8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( null, $value );
	}

	/**
	 * Read the private static Jetpack_Gutenberg::$deferred_blocks map.
	 *
	 * @return array
	 */
	private function get_deferred_blocks() {
		$prop = new ReflectionProperty( Jetpack_Gutenberg::class, 'deferred_blocks' );
		// setAccessible() is a no-op (and deprecated) since PHP 8.1; only needed for older versions.
		// @todo Remove this guard once we no longer need to support PHP < 8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		return (array) $prop->getValue();
	}

	/**
	 * Set the private static Jetpack_Gutenberg::$lazy_blocks list.
	 *
	 * @param array $value Value to set.
	 */
	private function set_lazy_blocks( $value ) {
		$prop = new ReflectionProperty( Jetpack_Gutenberg::class, 'lazy_blocks' );
		// setAccessible() is a no-op (and deprecated) since PHP 8.1; only needed for older versions.
		// @todo Remove this guard once we no longer need to support PHP < 8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( null, $value );
	}

	/**
	 * Read the private static Jetpack_Gutenberg::$lazy_blocks list.
	 *
	 * @return string[]
	 */
	private function get_lazy_blocks() {
		$prop = new ReflectionProperty( Jetpack_Gutenberg::class, 'lazy_blocks' );
		// setAccessible() is a no-op (and deprecated) since PHP 8.1; only needed for older versions.
		// @todo Remove this guard once we no longer need to support PHP < 8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		return (array) $prop->getValue();
	}

	/**
	 * Invoke the private static Jetpack_Gutenberg::load_and_register_deferred_block().
	 *
	 * @param string $feature Block feature name.
	 */
	private function invoke_load_and_register_deferred_block( $feature ) {
		$method = new ReflectionMethod( Jetpack_Gutenberg::class, 'load_and_register_deferred_block' );
		// setAccessible() is a no-op (and deprecated) since PHP 8.1; only needed for older versions.
		// @todo Remove this guard once we no longer need to support PHP < 8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$method->invoke( null, $feature );
	}

	/**
	 * Create a throwaway lazy block fixture under extensions/blocks.
	 *
	 * @param string $feature       Block feature name.
	 * @param string $render_output Optional render output.
	 *
	 * @return array Fixture paths.
	 */
	private function create_lazy_fixture_block( $feature, $render_output = '' ) {
		$dir      = JETPACK__PLUGIN_DIR . 'extensions/blocks/' . $feature;
		$file     = $dir . '/' . $feature . '.php';
		$function = 'jetpack_test_render_' . str_replace( '-', '_', $feature );
		wp_mkdir_p( $dir );

		$render_function = '';
		$render_callback = '';
		if ( '' !== $render_output ) {
			$render_function = "if ( ! function_exists( '{$function}' ) ) { function {$function}() { return " . var_export( $render_output, true ) . "; } }\n";
			$render_callback = "'render_callback' => '{$function}',";
		}

		file_put_contents(
			$file,
			"<?php\n{$render_function}add_action( 'init', function () { register_block_type( 'jetpack/{$feature}', array( {$render_callback} ) ); } );\n"
		);

		return array(
			'dir'  => $dir,
			'file' => $file,
		);
	}

	/**
	 * Remove a throwaway lazy block fixture.
	 *
	 * @param string $feature Block feature name.
	 * @param array  $fixture Fixture paths from create_lazy_fixture_block().
	 */
	private function remove_lazy_fixture_block( $feature, $fixture ) {
		if ( Blocks::is_registered( 'jetpack/' . $feature ) ) {
			unregister_block_type( 'jetpack/' . $feature );
		}
		if ( file_exists( $fixture['file'] ) ) {
			unlink( $fixture['file'] );
		}
		if ( is_dir( $fixture['dir'] ) ) {
			rmdir( $fixture['dir'] );
		}
	}

	/**
	 * Non-web contexts (empty REQUEST_URI: WP-CLI, test runs) load blocks eagerly.
	 */
	public function test_is_block_editor_context_is_true_without_request_uri() {
		$saved = $_SERVER['REQUEST_URI'] ?? null;
		unset( $_SERVER['REQUEST_URI'] );
		$this->assertTrue( $this->invoke_is_block_editor_context() );
		if ( null !== $saved ) {
			$_SERVER['REQUEST_URI'] = $saved;
		}
	}

	/**
	 * A plain front-end page request is not a block-editor context.
	 */
	public function test_is_block_editor_context_is_false_for_frontend_request() {
		$saved                  = $_SERVER['REQUEST_URI'] ?? null;
		$_SERVER['REQUEST_URI'] = '/sample-page/';
		$this->assertFalse( $this->invoke_is_block_editor_context() );
		$_SERVER['REQUEST_URI'] = $saved;
	}

	/**
	 * A pretty-permalink REST request is detected from the URL path.
	 */
	public function test_is_block_editor_context_is_true_for_rest_url() {
		$saved                  = $_SERVER['REQUEST_URI'] ?? null;
		$_SERVER['REQUEST_URI'] = '/' . rest_get_url_prefix() . '/wp/v2/block-types';
		$this->assertTrue( $this->invoke_is_block_editor_context() );
		$_SERVER['REQUEST_URI'] = $saved;
	}

	/**
	 * An index-permalink REST request (/index.php/wp-json/...) is detected.
	 */
	public function test_is_block_editor_context_is_true_for_index_permalink_rest_url() {
		$saved                  = $_SERVER['REQUEST_URI'] ?? null;
		$_SERVER['REQUEST_URI'] = '/index.php/' . rest_get_url_prefix() . '/wp/v2/block-types';
		$this->assertTrue( $this->invoke_is_block_editor_context() );
		$_SERVER['REQUEST_URI'] = $saved;
	}

	/**
	 * A plain-permalink REST request is detected from the rest_route query var.
	 */
	public function test_is_block_editor_context_is_true_for_rest_route_query() {
		$saved                  = $_SERVER['REQUEST_URI'] ?? null;
		$_SERVER['REQUEST_URI'] = '/?rest_route=/wp/v2/block-types';
		$this->assertTrue( $this->invoke_is_block_editor_context() );
		$_SERVER['REQUEST_URI'] = $saved;
	}

	/**
	 * A front-end URL that merely carries the REST prefix in a query value is NOT a
	 * REST request.
	 */
	public function test_is_block_editor_context_is_false_when_prefix_only_in_query() {
		$saved                  = $_SERVER['REQUEST_URI'] ?? null;
		$_SERVER['REQUEST_URI'] = '/?redirect=/' . rest_get_url_prefix() . '/wp/v2/posts';
		$this->assertFalse( $this->invoke_is_block_editor_context() );
		$_SERVER['REQUEST_URI'] = $saved;
	}

	/**
	 * Lazy block allowlist entries must remain pure display blocks.
	 *
	 * @dataProvider provider_lazy_blocks
	 *
	 * @param string $feature Block feature name.
	 */
	#[DataProvider( 'provider_lazy_blocks' )]
	public function test_lazy_block_allowlist_entry_stays_pure( $feature ) {
		$dir    = JETPACK__PLUGIN_DIR . "extensions/blocks/{$feature}";
		$file   = "{$dir}/{$feature}.php";
		$source = file_exists( $file ) ? file_get_contents( $file ) : '';

		$this->assertFileExists( $file, "Lazy block {$feature} must have a matching registration file." );
		$this->assertSame(
			'jetpack/' . $feature,
			Blocks::get_block_name_from_path_convention( $dir ),
			"Lazy block {$feature} must register the block name matching its directory."
		);
		$this->assertSame(
			1,
			substr_count( $source, 'Blocks::jetpack_register_block' ),
			"Lazy block {$feature} must call Blocks::jetpack_register_block() exactly once."
		);
		$this->assertSame(
			1,
			preg_match_all( '/add_action\s*\(\s*[\'"]init[\'"]/', $source ),
			"Lazy block {$feature} must add exactly one init registration callback."
		);
		$this->assertSame(
			0,
			preg_match( '/jetpack_register_block\s*\(\s*[\'"](?!jetpack\/' . preg_quote( $feature, '/' ) . '[\'"])/', $source ),
			"Lazy block {$feature} must not explicitly register a differently named block."
		);
		$this->assertStringNotContainsString( 'render_email_callback', $source, "Lazy block {$feature} must not register an e-mail renderer." );
		$this->assertStringNotContainsString( 'plan_check', $source, "Lazy block {$feature} must not use plan_check availability wrapping." );
		$this->assertStringNotContainsString( 'register_rest_route', $source, "Lazy block {$feature} must not register REST routes." );
		$this->assertStringNotContainsString( 'register_post_meta', $source, "Lazy block {$feature} must not register post meta." );
	}

	/**
	 * Data provider for test_lazy_block_allowlist_entry_stays_pure.
	 *
	 * @return array[]
	 */
	public static function provider_lazy_blocks() {
		$prop = new ReflectionProperty( Jetpack_Gutenberg::class, 'lazy_blocks' );
		// setAccessible() is a no-op (and deprecated) since PHP 8.1; only needed for older versions.
		// @todo Remove this guard once we no longer need to support PHP < 8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}

		$data = array();
		foreach ( (array) $prop->getValue() as $feature ) {
			$data[ $feature ] = array( $feature );
		}
		return $data;
	}

	/**
	 * A non-null pre-render value is left untouched and no registration is attempted.
	 */
	public function test_lazy_register_respects_existing_pre_render() {
		$this->set_deferred_blocks( array( 'business-hours' => true ) );
		$result = Jetpack_Gutenberg::lazy_register_deferred_block( 'already-rendered', array( 'blockName' => 'jetpack/business-hours' ) );
		$this->assertSame( 'already-rendered', $result );
		// The block was not consumed because we short-circuited before touching it.
		$this->assertArrayHasKey( 'business-hours', $this->get_deferred_blocks() );
	}

	/**
	 * Blocks outside the jetpack namespace are ignored.
	 */
	public function test_lazy_register_ignores_non_jetpack_blocks() {
		$this->set_deferred_blocks( array( 'business-hours' => true ) );
		$result = Jetpack_Gutenberg::lazy_register_deferred_block( null, array( 'blockName' => 'core/paragraph' ) );
		$this->assertNull( $result );
		$this->assertArrayHasKey( 'business-hours', $this->get_deferred_blocks() );
	}

	/**
	 * Jetpack blocks that were not deferred are ignored.
	 */
	public function test_lazy_register_ignores_non_deferred_jetpack_blocks() {
		$this->set_deferred_blocks( array( 'business-hours' => true ) );
		$result = Jetpack_Gutenberg::lazy_register_deferred_block( null, array( 'blockName' => 'jetpack/contact-form' ) );
		$this->assertNull( $result );
		$this->assertArrayHasKey( 'business-hours', $this->get_deferred_blocks() );
	}

	/**
	 * A deferred block is only attempted once, so a repeated block on the page does
	 * not re-run the include/registration logic.
	 */
	public function test_lazy_register_attempts_a_deferred_block_only_once() {
		$feature = 'zz-lazy-once-fixture';
		$fixture = $this->create_lazy_fixture_block( $feature );

		try {
			$this->set_deferred_blocks( array( $feature => true ) );
			$result = Jetpack_Gutenberg::lazy_register_deferred_block( null, array( 'blockName' => 'jetpack/' . $feature ) );
			$this->assertNull( $result );
			$this->assertArrayNotHasKey( $feature, $this->get_deferred_blocks(), 'Deferred block should be removed after a single attempt.' );
			$this->assertTrue( Blocks::is_registered( 'jetpack/' . $feature ), 'Deferred block should be registered by the lazy loader.' );
		} finally {
			$this->remove_lazy_fixture_block( $feature, $fixture );
		}
	}

	/**
	 * A deferred block nested inside a (non-Jetpack) parent is registered from the
	 * top-level subtree walk, before the inner WP_Block would be constructed.
	 */
	public function test_lazy_register_walks_inner_blocks() {
		$feature = 'zz-lazy-inner-fixture';
		$fixture = $this->create_lazy_fixture_block( $feature );

		try {
			$this->set_deferred_blocks( array( $feature => true ) );
			$parsed = array(
				'blockName'   => 'core/group',
				'innerBlocks' => array(
					array(
						'blockName'   => 'core/columns',
						'innerBlocks' => array(
							array(
								'blockName'   => 'jetpack/' . $feature,
								'innerBlocks' => array(),
							),
						),
					),
				),
			);
			$result = Jetpack_Gutenberg::lazy_register_deferred_block( null, $parsed );
			$this->assertNull( $result );
			$this->assertArrayNotHasKey( $feature, $this->get_deferred_blocks(), 'Nested deferred block should be reached by the subtree walk.' );
			$this->assertTrue( Blocks::is_registered( 'jetpack/' . $feature ), 'Nested deferred block should be registered by the lazy loader.' );
		} finally {
			$this->remove_lazy_fixture_block( $feature, $fixture );
		}
	}

	/**
	 * A deferred block inside a synced pattern (core/block) is reached by resolving the
	 * reusable-block reference, since core only parses that content at render time.
	 */
	public function test_lazy_register_resolves_synced_pattern_reference() {
		$feature = 'zz-lazy-pattern-fixture';
		$fixture = $this->create_lazy_fixture_block( $feature );
		$ref_id  = self::factory()->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:jetpack/' . $feature . ' /-->',
			)
		);

		try {
			$this->set_deferred_blocks( array( $feature => true ) );
			$parsed = array(
				'blockName'   => 'core/block',
				'attrs'       => array( 'ref' => $ref_id ),
				'innerBlocks' => array(),
			);
			$result = Jetpack_Gutenberg::lazy_register_deferred_block( null, $parsed );
			$this->assertNull( $result );
			$this->assertArrayNotHasKey( $feature, $this->get_deferred_blocks(), 'Deferred block inside a synced pattern should be reached via its ref.' );
			$this->assertTrue( Blocks::is_registered( 'jetpack/' . $feature ), 'Deferred block inside a synced pattern should be registered by the lazy loader.' );
		} finally {
			wp_delete_post( $ref_id, true );
			$this->remove_lazy_fixture_block( $feature, $fixture );
		}
	}

	/**
	 * Inner-block invocations (non-null parent) are ignored; the top-level walk owns the tree.
	 */
	public function test_lazy_register_ignores_inner_block_invocations() {
		$this->set_deferred_blocks( array( 'does-not-exist' => true ) );
		$parent = new WP_Block( array( 'blockName' => 'core/group' ) );
		$result = Jetpack_Gutenberg::lazy_register_deferred_block( null, array( 'blockName' => 'jetpack/does-not-exist' ), $parent );
		$this->assertNull( $result );
		$this->assertArrayHasKey( 'does-not-exist', $this->get_deferred_blocks(), 'Inner-block invocation should not consume the deferred block.' );
	}

	/**
	 * A deferred block file is included and the `init` callback it registers runs,
	 * even though `init` has already fired by the time the block renders.
	 *
	 * Uses a throwaway fixture block (unique name, never pre-included) so the
	 * include + $wp_filter['init'] capture/run path is exercised end-to-end.
	 */
	public function test_load_and_register_runs_deferred_block_init_callback() {
		$feature = 'zz-lazy-fixture';
		$dir     = JETPACK__PLUGIN_DIR . 'extensions/blocks/' . $feature;
		$file    = $dir . '/' . $feature . '.php';
		wp_mkdir_p( $dir );
		file_put_contents(
			$file,
			"<?php add_action( 'init', function () { register_block_type( 'jetpack/zz-lazy-fixture' ); } );\n"
		);

		try {
			$this->assertFalse( Blocks::is_registered( 'jetpack/zz-lazy-fixture' ), 'Fixture block should start unregistered.' );

			$this->invoke_load_and_register_deferred_block( $feature );

			$this->assertTrue(
				Blocks::is_registered( 'jetpack/zz-lazy-fixture' ),
				'The deferred block file should be included and its init callback run.'
			);
		} finally {
			if ( Blocks::is_registered( 'jetpack/zz-lazy-fixture' ) ) {
				unregister_block_type( 'jetpack/zz-lazy-fixture' );
			}
			if ( file_exists( $file ) ) {
				unlink( $file );
			}
			if ( is_dir( $dir ) ) {
				rmdir( $dir );
			}
		}
	}

	/**
	 * The do_blocks() function drives the real pre_render_block -> include -> init-replay path.
	 */
	public function test_do_blocks_lazy_registers_deferred_block_on_frontend() {
		$feature       = 'zz-lazy-do-blocks-fixture';
		$render_output = 'lazy fixture output';
		$fixture       = $this->create_lazy_fixture_block( $feature, $render_output );
		$original_lazy = $this->get_lazy_blocks();
		$saved_uri     = $_SERVER['REQUEST_URI'] ?? null;

		$lazy_filter = static function () use ( $feature ) {
			return array( $feature );
		};

		add_filter( 'jetpack_offline_mode', '__return_true' );
		add_filter( 'jetpack_gutenberg', '__return_true' );
		add_filter( 'jetpack_set_available_extensions', $lazy_filter, 99 );
		$this->set_lazy_blocks( array( $feature ) );
		$_SERVER['REQUEST_URI'] = '/sample-page/';
		Jetpack_Gutenberg::reset();

		try {
			Jetpack_Gutenberg::load_independent_blocks();
			$this->assertFalse( Blocks::is_registered( 'jetpack/' . $feature ), 'Fixture block should be deferred before rendering.' );

			$output = do_blocks( '<!-- wp:jetpack/' . $feature . ' /-->' );

			$this->assertSame( $render_output, $output );
			$this->assertTrue( Blocks::is_registered( 'jetpack/' . $feature ), 'Fixture block should be registered during do_blocks().' );
		} finally {
			remove_filter( 'pre_render_block', array( 'Jetpack_Gutenberg', 'lazy_register_deferred_block' ), 10 );
			remove_filter( 'jetpack_set_available_extensions', $lazy_filter, 99 );
			remove_filter( 'jetpack_offline_mode', '__return_true' );
			remove_filter( 'jetpack_gutenberg', '__return_true' );
			$this->set_lazy_blocks( $original_lazy );
			Jetpack_Gutenberg::reset();
			if ( null !== $saved_uri ) {
				$_SERVER['REQUEST_URI'] = $saved_uri;
			} else {
				unset( $_SERVER['REQUEST_URI'] );
			}
			$this->remove_lazy_fixture_block( $feature, $fixture );
		}
	}

	/**
	 * The lazy loader must replay priority-9 init callbacks, such as related-posts.
	 */
	public function test_do_blocks_lazy_registers_related_posts_priority_9_callback() {
		$feature       = 'related-posts';
		$original_lazy = $this->get_lazy_blocks();
		$saved_user_id = get_current_user_id();
		$saved_uri     = $_SERVER['REQUEST_URI'] ?? null;

		$lazy_filter             = static function () use ( $feature ) {
			return array( $feature );
		};
		$active_modules_filter   = static function ( $active_modules ) use ( $feature ) {
			$active_modules[] = $feature;
			return $active_modules;
		};
		$activate_modules_filter = static function ( $allcaps ) {
			$allcaps['jetpack_activate_modules'] = true;
			return $allcaps;
		};

		wp_set_current_user( $this->master_user_id );
		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		add_filter( 'jetpack_active_modules', $active_modules_filter );
		add_filter( 'user_has_cap', $activate_modules_filter );
		add_filter( 'jetpack_offline_mode', '__return_false', 1000 );
		add_filter( 'jetpack_gutenberg', '__return_true' );
		add_filter( 'jetpack_set_available_extensions', $lazy_filter, 99 );
		$this->set_lazy_blocks( array( $feature ) );
		$_SERVER['REQUEST_URI'] = '/sample-page/';
		Jetpack_Gutenberg::reset();

		try {
			Jetpack_Gutenberg::load_independent_blocks();
			$this->assertFalse( Blocks::is_registered( 'jetpack/related-posts' ), 'Related Posts should be deferred before rendering.' );

			do_blocks( '<!-- wp:jetpack/related-posts /-->' );

			$this->assertTrue( Blocks::is_registered( 'jetpack/related-posts' ), 'Related Posts should be registered during do_blocks().' );
		} finally {
			remove_filter( 'pre_render_block', array( 'Jetpack_Gutenberg', 'lazy_register_deferred_block' ), 10 );
			remove_filter( 'jetpack_set_available_extensions', $lazy_filter, 99 );
			remove_filter( 'jetpack_offline_mode', '__return_false', 1000 );
			remove_filter( 'jetpack_gutenberg', '__return_true' );
			remove_filter( 'user_has_cap', $activate_modules_filter );
			remove_filter( 'jetpack_active_modules', $active_modules_filter );
			remove_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
			if ( Blocks::is_registered( 'jetpack/related-posts' ) ) {
				unregister_block_type( 'jetpack/related-posts' );
			}
			$this->set_lazy_blocks( $original_lazy );
			Jetpack_Gutenberg::reset();
			wp_set_current_user( $saved_user_id );
			if ( null !== $saved_uri ) {
				$_SERVER['REQUEST_URI'] = $saved_uri;
			} else {
				unset( $_SERVER['REQUEST_URI'] );
			}
		}
	}

	/**
	 * Missing deferred block files are loud in debug mode.
	 */
	public function test_load_and_register_warns_when_deferred_block_file_is_missing() {
		if ( ! ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ) {
			$this->markTestSkipped( 'WP_DEBUG is not enabled.' );
		}

		$captured = null;
		$listener = function ( $function, $message, $version ) use ( &$captured ) {
			if ( 'Jetpack_Gutenberg::warn_about_deferred_block_registration_failure' === $function ) {
				$captured = compact( 'message', 'version' );
			}
		};

		add_action( 'doing_it_wrong_run', $listener, 10, 3 );
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		try {
			$this->setExpectedIncorrectUsage( 'Jetpack_Gutenberg::warn_about_deferred_block_registration_failure' );
			$this->invoke_load_and_register_deferred_block( 'zz-lazy-missing-fixture' );
			$this->assertIsArray( $captured, 'Expected _doing_it_wrong() to fire for a missing deferred block file.' );
			$this->assertStringContainsString( 'missing block registration file', $captured['message'] );
		} finally {
			remove_action( 'doing_it_wrong_run', $listener, 10 );
			remove_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		}
	}

	/**
	 * On a plain front-end request, load_independent_blocks() defers a lazy block
	 * instead of loading it, and registers the just-in-time pre_render_block handler.
	 */
	public function test_load_independent_blocks_defers_lazy_blocks_on_frontend() {
		$saved_uri              = $_SERVER['REQUEST_URI'] ?? null;
		$_SERVER['REQUEST_URI'] = '/sample-page/';

		$lazy_filter = static function () {
			return array( 'business-hours' );
		};
		add_filter( 'jetpack_offline_mode', '__return_true' );
		add_filter( 'jetpack_gutenberg', '__return_true' );
		add_filter( 'jetpack_set_available_extensions', $lazy_filter, 99 );
		Jetpack_Gutenberg::reset();

		try {
			Jetpack_Gutenberg::load_independent_blocks();

			$this->assertArrayHasKey(
				'business-hours',
				$this->get_deferred_blocks(),
				'A lazy block should be deferred on a front-end request.'
			);
			$this->assertNotFalse(
				has_filter( 'pre_render_block', array( 'Jetpack_Gutenberg', 'lazy_register_deferred_block' ) ),
				'The just-in-time registration filter should be added when blocks are deferred.'
			);
		} finally {
			remove_filter( 'pre_render_block', array( 'Jetpack_Gutenberg', 'lazy_register_deferred_block' ), 10 );
			remove_filter( 'jetpack_set_available_extensions', $lazy_filter, 99 );
			remove_filter( 'jetpack_offline_mode', '__return_true' );
			remove_filter( 'jetpack_gutenberg', '__return_true' );
			Jetpack_Gutenberg::reset();
			if ( null !== $saved_uri ) {
				$_SERVER['REQUEST_URI'] = $saved_uri;
			} else {
				unset( $_SERVER['REQUEST_URI'] );
			}
		}
	}

	/**
	 * The front-end editor-extension gate must treat REST requests (both the
	 * rewritten /wp-json/ form and the plain-permalink ?rest_route= form) as
	 * editor context, and plain front-end page views as not. A regression here
	 * silently changes which extension PHP loads on the front end.
	 *
	 * @dataProvider provider_is_block_editor_context_request_uri
	 *
	 * @param string $request_uri The REQUEST_URI to simulate.
	 * @param bool   $expected    Expected is_block_editor_context() result.
	 */
	#[DataProvider( 'provider_is_block_editor_context_request_uri' )]
	public function test_is_block_editor_context_detects_rest_from_request_uri( $request_uri, $expected ) {
		$method = new ReflectionMethod( Jetpack_Gutenberg::class, 'is_block_editor_context' );
		// setAccessible() is a no-op (and deprecated) since PHP 8.1; only needed for older versions.
		// @todo Remove this guard once we no longer need to support PHP < 8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$had_uri  = isset( $_SERVER['REQUEST_URI'] );
		$original = $had_uri ? $_SERVER['REQUEST_URI'] : null;

		$_SERVER['REQUEST_URI'] = $request_uri;
		try {
			$this->assertSame( $expected, $method->invoke( null ) );
		} finally {
			if ( $had_uri ) {
				$_SERVER['REQUEST_URI'] = $original;
			} else {
				unset( $_SERVER['REQUEST_URI'] );
			}
		}
	}

	/**
	 * Data provider for test_is_block_editor_context_detects_rest_from_request_uri.
	 *
	 * @return array[]
	 */
	public static function provider_is_block_editor_context_request_uri() {
		return array(
			'rewritten REST request'          => array( '/wp-json/wp/v2/posts', true ),
			'plain-permalink REST request'    => array( '/index.php?rest_route=/wp/v2/posts', true ),
			'front-end single post'           => array( '/2026/06/22/hello-world/', false ),
			'front-end home'                  => array( '/', false ),
			'prefix only in a query value'    => array( '/some-page/?redirect=/wp-json/foo', false ),
			'prefix as a deeper path segment' => array( '/docs/wp-json/example/', false ),
		);
	}
}
