<?php
namespace Automattic\Jetpack\WP_Build_Polyfills\Tests;

use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Tests for the WP_Build_Polyfills class.
 */
class WP_Build_Polyfills_Test extends BaseTestCase {

	/**
	 * Temporary build directory for fake asset files.
	 *
	 * @var ?string
	 */
	private $build_dir;

	/**
	 * Original wp_version value.
	 *
	 * @var string
	 */
	private $original_wp_version;

	/**
	 * Original wp_script_modules global.
	 *
	 * @var mixed
	 */
	private $original_wp_script_modules;

	/**
	 * Set up test fixtures.
	 *
	 * @before
	 * @throws \RuntimeException If a temporary directory cannot be created.
	 */
	#[Before]
	public function set_up() {
		parent::set_up();

		$this->build_dir = null;
		$base            = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'wp-build-polyfills-test-';
		for ( $i = 0; $i < 1000; $i++ ) {
			$tmpdir = $base . uniqid();
			// Atomic mkdir prevents symlink race (TOCTOU).
			if ( @mkdir( $tmpdir, 0700 ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				$this->build_dir = $tmpdir;
				break;
			}
		}
		if ( null === $this->build_dir ) {
			throw new \RuntimeException( 'Failed to create temporary directory' );
		}

		mkdir( $this->build_dir . '/scripts/notices', 0755, true );
		mkdir( $this->build_dir . '/scripts/private-apis', 0755, true );
		mkdir( $this->build_dir . '/scripts/theme', 0755, true );
		mkdir( $this->build_dir . '/modules/boot', 0755, true );
		mkdir( $this->build_dir . '/modules/route', 0755, true );
		mkdir( $this->build_dir . '/modules/a11y', 0755, true );

		$this->original_wp_version        = $GLOBALS['wp_version'];
		$this->original_wp_script_modules = $GLOBALS['wp_script_modules'] ?? null;
	}

	/**
	 * Tear down test fixtures.
	 *
	 * @after
	 */
	#[After]
	public function tear_down() {
		$GLOBALS['wp_version'] = $this->original_wp_version;
		if ( null === $this->original_wp_script_modules ) {
			unset( $GLOBALS['wp_script_modules'] );
		} else {
			$GLOBALS['wp_script_modules'] = $this->original_wp_script_modules;      }

		// Reset static state.
		$requested = new \ReflectionProperty( WP_Build_Polyfills::class, 'requested' );
		if ( PHP_VERSION_ID < 80100 ) {
			$requested->setAccessible( true );
		}
		$requested->setValue( null, array() );

		$hooked = new \ReflectionProperty( WP_Build_Polyfills::class, 'hooked' );
		if ( PHP_VERSION_ID < 80100 ) {
			$hooked->setAccessible( true );
		}
		$hooked->setValue( null, false );

		$threshold = new \ReflectionProperty( WP_Build_Polyfills::class, 'wp_version_threshold' );
		if ( PHP_VERSION_ID < 80100 ) {
			$threshold->setAccessible( true );
		}
		$threshold->setValue( null, '7.0' );

		$this->recursive_rmdir( $this->build_dir );

		parent::tear_down();
	}

	/**
	 * Create a fake asset file.
	 *
	 * @param string $path    Relative path within the build dir (e.g. "scripts/notices/index.asset.php").
	 * @param array  $deps    Dependencies array.
	 * @param string $version Version string.
	 * @param array  $extra   Extra keys to merge into the asset array.
	 */
	private function create_asset_file( $path, $deps = array(), $version = '1.0.0', $extra = array() ) {
		$data     = array_merge(
			array(
				'dependencies' => $deps,
				'version'      => $version,
			),
			$extra
		);
		$contents = '<?php return ' . var_export( $data, true ) . ";\n";
		file_put_contents( $this->build_dir . '/' . $path, $contents ); }

	/**
	 * Create a WP_Scripts instance with polyfill handles removed.
	 *
	 * WP_Scripts::__construct() fires wp_default_scripts which registers core
	 * scripts. We remove the three handles under test so tests start clean.
	 *
	 * @return \WP_Scripts
	 */
	private function create_clean_scripts() {
		$scripts = new \WP_Scripts();
		$scripts->remove( 'wp-notices' );
		$scripts->remove( 'wp-private-apis' );
		$scripts->remove( 'wp-theme' );
		return $scripts;
	}

	/**
	 * Request all available polyfills for a test consumer.
	 *
	 * Populates the static $requested property via reflection so
	 * register_scripts/register_modules will process all handles,
	 * without triggering the wp_default_scripts hook.
	 *
	 * @param string[] $polyfills Optional specific polyfills to request. Defaults to all.
	 */
	private function request_polyfills( $polyfills = null ) {
		if ( null === $polyfills ) {
			$polyfills = array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS );
		}

		// Directly set the $requested static property via reflection.
		$requested = new \ReflectionProperty( WP_Build_Polyfills::class, 'requested' );
		if ( PHP_VERSION_ID < 80100 ) {
			$requested->setAccessible( true );
		}
		$current = $requested->getValue();
		foreach ( $polyfills as $handle ) {
			if ( ! isset( $current[ $handle ] ) ) {
				$current[ $handle ] = array();
			}
			$current[ $handle ][] = 'test';
		}
		$requested->setValue( null, $current );
	}

	/**
	 * Invoke the private register_scripts method.
	 *
	 * @param \WP_Scripts $scripts              WP_Scripts instance.
	 * @param string      $wp_version_threshold WP version below which force-replacements apply.
	 */
	private function invoke_register_scripts( $scripts, $wp_version_threshold = '7.0' ) {
		$this->request_polyfills( WP_Build_Polyfills::SCRIPT_HANDLES );

		$method = new \ReflectionMethod( WP_Build_Polyfills::class, 'register_scripts' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$method->invoke( null, $scripts, $this->build_dir, __FILE__, $wp_version_threshold );
	}

	/**
	 * Invoke the private register_modules method.
	 */
	private function invoke_register_modules() {
		$this->request_polyfills( WP_Build_Polyfills::MODULE_IDS );

		$method = new \ReflectionMethod( WP_Build_Polyfills::class, 'register_modules' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$method->invoke( null, $this->build_dir, __FILE__ );
	}

	/**
	 * Check if a script module is registered.
	 *
	 * @param string $id Module ID.
	 * @return bool
	 */
	private function is_module_registered( $id ) {
		$registered = $this->get_registered_modules();
		return isset( $registered[ $id ] );
	}

	/**
	 * Get data for a registered module.
	 *
	 * @param string $id Module ID.
	 * @return array|null
	 */
	private function get_module_data( $id ) {
		$registered = $this->get_registered_modules();
		return $registered[ $id ] ?? null;
	}

	/**
	 * Get the private $registered property from WP_Script_Modules.
	 *
	 * @return array
	 */
	private function get_registered_modules() {
		$instance = wp_script_modules();
		$prop     = new \ReflectionProperty( $instance, 'registered' );
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		return $prop->getValue( $instance );
	}

	/**
	 * Recursively remove a directory.
	 *
	 * @param string $dir Directory path.
	 */
	private function recursive_rmdir( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return;
		}
		$items = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( $dir, \RecursiveDirectoryIterator::SKIP_DOTS ),
			\RecursiveIteratorIterator::CHILD_FIRST
		);
		foreach ( $items as $item ) {
			if ( $item->isDir() ) {
				rmdir( $item->getRealPath() );          } else {
				unlink( $item->getRealPath() );         }
		}
		rmdir( $dir );  }

	/**
	 * Test that all scripts are registered when all asset files exist.
	 */
	public function test_register_scripts_registers_all_when_asset_files_exist() {
		$this->create_asset_file( 'scripts/notices/index.asset.php' );
		$this->create_asset_file( 'scripts/private-apis/index.asset.php' );
		$this->create_asset_file( 'scripts/theme/index.asset.php' );

		$scripts = $this->create_clean_scripts();
		$this->invoke_register_scripts( $scripts );

		$this->assertNotFalse( $scripts->query( 'wp-notices', 'registered' ) );
		$this->assertNotFalse( $scripts->query( 'wp-private-apis', 'registered' ) );
		$this->assertNotFalse( $scripts->query( 'wp-theme', 'registered' ) );
	}

	/**
	 * Test that no scripts are registered when asset files are missing.
	 */
	public function test_register_scripts_skips_when_asset_files_missing() {
		$scripts = $this->create_clean_scripts();
		$this->invoke_register_scripts( $scripts );

		$this->assertFalse( $scripts->query( 'wp-notices', 'registered' ) );
		$this->assertFalse( $scripts->query( 'wp-private-apis', 'registered' ) );
		$this->assertFalse( $scripts->query( 'wp-theme', 'registered' ) );
	}

	/**
	 * Test that only scripts with asset files are registered.
	 */
	public function test_register_scripts_registers_only_scripts_with_asset_files() {
		$this->create_asset_file( 'scripts/notices/index.asset.php' );
		// No asset file for private-apis or theme.

		$scripts = $this->create_clean_scripts();
		$this->invoke_register_scripts( $scripts );

		$this->assertNotFalse( $scripts->query( 'wp-notices', 'registered' ) );
		$this->assertFalse( $scripts->query( 'wp-private-apis', 'registered' ) );
		$this->assertFalse( $scripts->query( 'wp-theme', 'registered' ) );
	}

	/**
	 * Test that wp-theme (non-force) keeps existing registration.
	 */
	public function test_register_scripts_skips_wp_theme_when_already_registered() {
		$this->create_asset_file( 'scripts/theme/index.asset.php', array(), '2.0.0' );

		$scripts = $this->create_clean_scripts();
		$scripts->add( 'wp-theme', 'https://example.com/original-theme.js', array(), '1.0.0-original' );

		$this->invoke_register_scripts( $scripts );

		$registered = $scripts->query( 'wp-theme', 'registered' );
		$this->assertNotFalse( $registered );
		$this->assertSame( '1.0.0-original', $registered->ver );
	}

	/**
	 * Test that wp-notices is force-replaced on WP < 7.0.
	 */
	public function test_register_scripts_force_replaces_wp_notices_on_old_wp() {
		$GLOBALS['wp_version'] = '6.9';
		$this->create_asset_file( 'scripts/notices/index.asset.php', array(), '9.9.9' );

		$scripts = $this->create_clean_scripts();
		$scripts->add( 'wp-notices', 'https://example.com/old-notices.js', array(), '1.0.0-old' );

		$this->invoke_register_scripts( $scripts );

		$registered = $scripts->query( 'wp-notices', 'registered' );
		$this->assertNotFalse( $registered );
		$this->assertSame( '9.9.9', $registered->ver );
	}

	/**
	 * Test that wp-private-apis is force-replaced on older WP versions.
	 */
	public function test_register_scripts_force_replaces_wp_private_apis_on_old_wp() {
		$GLOBALS['wp_version'] = '6.9';
		$this->create_asset_file( 'scripts/private-apis/index.asset.php', array(), '9.9.9' );

		$scripts = $this->create_clean_scripts();
		$scripts->add( 'wp-private-apis', 'https://example.com/old-private-apis.js', array(), '1.0.0-old' );

		$this->invoke_register_scripts( $scripts );

		$registered = $scripts->query( 'wp-private-apis', 'registered' );
		$this->assertNotFalse( $registered );
		$this->assertSame( '9.9.9', $registered->ver );
	}

	/**
	 * Test that wp-notices is not force-replaced on WP >= 7.0.
	 */
	public function test_register_scripts_does_not_force_replace_wp_notices_on_wp_7() {
		$GLOBALS['wp_version'] = '7.0';
		$this->create_asset_file( 'scripts/notices/index.asset.php', array(), '9.9.9' );

		$scripts = $this->create_clean_scripts();
		$scripts->add( 'wp-notices', 'https://example.com/core-notices.js', array(), '1.0.0-core' );

		$this->invoke_register_scripts( $scripts );

		$notices = $scripts->query( 'wp-notices', 'registered' );
		$this->assertSame( '1.0.0-core', $notices->ver );
	}

	/**
	 * Test that wp-private-apis is still force-replaced on WP 7.0.
	 */
	public function test_register_scripts_force_replaces_wp_private_apis_on_wp_7() {
		$GLOBALS['wp_version'] = '7.0';
		$this->create_asset_file( 'scripts/private-apis/index.asset.php', array(), '9.9.9' );

		$scripts = $this->create_clean_scripts();
		$scripts->add( 'wp-private-apis', 'https://example.com/core-private-apis.js', array(), '1.0.0-core' );

		$this->invoke_register_scripts( $scripts );

		$private_apis = $scripts->query( 'wp-private-apis', 'registered' );
		$this->assertSame( '9.9.9', $private_apis->ver );
	}

	/**
	 * Test that wp-private-apis is not force-replaced on WP >= 7.1.
	 */
	public function test_register_scripts_does_not_force_replace_wp_private_apis_on_wp_7_1() {
		$GLOBALS['wp_version'] = '7.1';
		$this->create_asset_file( 'scripts/private-apis/index.asset.php', array(), '9.9.9' );

		$scripts = $this->create_clean_scripts();
		$scripts->add( 'wp-private-apis', 'https://example.com/core-private-apis.js', array(), '1.0.0-core' );

		$this->invoke_register_scripts( $scripts );

		$private_apis = $scripts->query( 'wp-private-apis', 'registered' );
		$this->assertSame( '1.0.0-core', $private_apis->ver );
	}

	/**
	 * Test that old Gutenberg versions do not suppress private-apis replacement.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_register_scripts_force_replaces_wp_private_apis_with_old_gutenberg() {
		define( 'GUTENBERG_VERSION', '23.4.0' );

		$GLOBALS['wp_version'] = '7.0';
		$this->create_asset_file( 'scripts/private-apis/index.asset.php', array(), '9.9.9' );

		$scripts = $this->create_clean_scripts();
		$scripts->add( 'wp-private-apis', 'https://example.com/old-gutenberg-private-apis.js', array(), '1.0.0-gutenberg' );

		$this->invoke_register_scripts( $scripts );

		$private_apis = $scripts->query( 'wp-private-apis', 'registered' );
		$this->assertSame( '9.9.9', $private_apis->ver );
	}

	/**
	 * Test that new enough Gutenberg satisfies the private-apis allowlist.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_register_scripts_does_not_force_replace_wp_private_apis_with_supported_gutenberg() {
		define( 'GUTENBERG_VERSION', '23.5.0' );

		$GLOBALS['wp_version'] = '7.0';
		$this->create_asset_file( 'scripts/private-apis/index.asset.php', array(), '9.9.9' );

		$scripts = $this->create_clean_scripts();
		$scripts->add( 'wp-private-apis', 'https://example.com/new-gutenberg-private-apis.js', array(), '1.0.0-gutenberg' );

		$this->invoke_register_scripts( $scripts );

		$private_apis = $scripts->query( 'wp-private-apis', 'registered' );
		$this->assertSame( '1.0.0-gutenberg', $private_apis->ver );
	}

	/**
	 * Test that packages without a minimum Gutenberg version keep existing Gutenberg registrations.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_register_scripts_does_not_force_replace_wp_notices_with_active_gutenberg() {
		define( 'GUTENBERG_VERSION', '22.0.0' );

		$GLOBALS['wp_version'] = '6.9';
		$this->create_asset_file( 'scripts/notices/index.asset.php', array(), '9.9.9' );

		$scripts = $this->create_clean_scripts();
		$scripts->add( 'wp-notices', 'https://example.com/gutenberg-notices.js', array(), '1.0.0-gutenberg' );

		$this->invoke_register_scripts( $scripts );

		$notices = $scripts->query( 'wp-notices', 'registered' );
		$this->assertSame( '1.0.0-gutenberg', $notices->ver );
	}

	/**
	 * Test that an explicit higher threshold still applies to all force-replaced scripts.
	 */
	public function test_register_scripts_honors_higher_consumer_force_threshold() {
		$GLOBALS['wp_version'] = '7.0';
		$this->create_asset_file( 'scripts/notices/index.asset.php', array(), '9.9.9' );

		$scripts = $this->create_clean_scripts();
		$scripts->add( 'wp-notices', 'https://example.com/core-notices.js', array(), '1.0.0-core' );

		$this->invoke_register_scripts( $scripts, '7.1' );

		$notices = $scripts->query( 'wp-notices', 'registered' );
		$this->assertSame( '9.9.9', $notices->ver );
	}

	/**
	 * Test that force scripts register fine even when not pre-existing.
	 */
	public function test_register_scripts_force_registers_fresh_on_old_wp() {
		$GLOBALS['wp_version'] = '6.9';
		$this->create_asset_file( 'scripts/notices/index.asset.php', array(), '9.9.9' );
		$this->create_asset_file( 'scripts/private-apis/index.asset.php', array(), '8.8.8' );

		$scripts = $this->create_clean_scripts();
		$this->invoke_register_scripts( $scripts );

		$notices = $scripts->query( 'wp-notices', 'registered' );
		$this->assertNotFalse( $notices );
		$this->assertSame( '9.9.9', $notices->ver );

		$private_apis = $scripts->query( 'wp-private-apis', 'registered' );
		$this->assertNotFalse( $private_apis );
		$this->assertSame( '8.8.8', $private_apis->ver );
	}

	/**
	 * Test that dependencies from asset files are passed through correctly.
	 */
	public function test_register_scripts_has_correct_dependencies() {
		$this->create_asset_file( 'scripts/notices/index.asset.php', array( 'wp-element', 'wp-data' ) );

		$scripts = $this->create_clean_scripts();
		$this->invoke_register_scripts( $scripts );

		$registered = $scripts->query( 'wp-notices', 'registered' );
		$this->assertNotFalse( $registered );
		$this->assertSame( array( 'wp-element', 'wp-data' ), $registered->deps );
	}

	/**
	 * Test that all modules are registered when asset files exist.
	 */
	public function test_register_modules_registers_all_when_asset_files_exist() {
		// Reset the script modules global so we start fresh.
		$GLOBALS['wp_script_modules'] = new \WP_Script_Modules();
		$this->create_asset_file(
			'modules/boot/index.asset.php',
			array(),
			'1.0.0',
			array( 'module_dependencies' => array() )
		);
		$this->create_asset_file(
			'modules/route/index.asset.php',
			array(),
			'1.0.0',
			array( 'module_dependencies' => array() )
		);
		$this->create_asset_file(
			'modules/a11y/index.asset.php',
			array(),
			'1.0.0',
			array( 'module_dependencies' => array() )
		);

		$this->invoke_register_modules();

		$this->assertTrue( $this->is_module_registered( '@wordpress/boot' ) );
		$this->assertTrue( $this->is_module_registered( '@wordpress/route' ) );
		$this->assertTrue( $this->is_module_registered( '@wordpress/a11y' ) );
	}

	/**
	 * Test that no modules are registered when asset files are missing.
	 */
	public function test_register_modules_skips_when_asset_files_missing() {
		$GLOBALS['wp_script_modules'] = new \WP_Script_Modules();
		$this->invoke_register_modules();

		$this->assertFalse( $this->is_module_registered( '@wordpress/boot' ) );
		$this->assertFalse( $this->is_module_registered( '@wordpress/route' ) );
		$this->assertFalse( $this->is_module_registered( '@wordpress/a11y' ) );
	}

	/**
	 * Test that pre-registered modules are not replaced (first-wins semantics).
	 */
	public function test_register_modules_does_not_replace_existing() {
		$GLOBALS['wp_script_modules'] = new \WP_Script_Modules();
		// Pre-register @wordpress/boot.
		wp_register_script_module( '@wordpress/boot', 'https://example.com/core-boot.js', array(), '1.0.0-core' );

		$this->create_asset_file(
			'modules/boot/index.asset.php',
			array(),
			'9.9.9',
			array( 'module_dependencies' => array() )
		);

		$this->invoke_register_modules();

		$module = $this->get_module_data( '@wordpress/boot' );
		$this->assertNotNull( $module );
		$this->assertSame( '1.0.0-core', $module['version'] );
	}

	/**
	 * Test that register() hooks into wp_default_scripts at priority 20.
	 */
	public function test_register_hooks_into_wp_default_scripts() {
		// Remove any existing hooks so we can verify the exact priority.
		remove_all_filters( 'wp_default_scripts' );

		WP_Build_Polyfills::register( 'test-plugin', array( 'wp-notices' ) );

		global $wp_filter;
		$this->assertArrayHasKey( 'wp_default_scripts', $wp_filter );
		$this->assertArrayHasKey( 20, $wp_filter['wp_default_scripts']->callbacks );
	}

	/**
	 * Test that get_consumers returns the correct consumer map.
	 */
	public function test_get_consumers_tracks_polyfill_consumers() {
		WP_Build_Polyfills::register( 'plugin-a', array( 'wp-notices', '@wordpress/boot' ) );
		WP_Build_Polyfills::register( 'plugin-b', array( 'wp-notices', 'wp-theme' ) );

		$consumers = WP_Build_Polyfills::get_consumers();

		$this->assertSame( array( 'plugin-a', 'plugin-b' ), $consumers['wp-notices'] );
		$this->assertSame( array( 'plugin-a' ), $consumers['@wordpress/boot'] );
		$this->assertSame( array( 'plugin-b' ), $consumers['wp-theme'] );
		$this->assertArrayNotHasKey( 'wp-private-apis', $consumers );
	}

	/**
	 * Test that the built boot module asset file only contains script handles
	 * that are registered by WordPress Core or polyfilled by this package.
	 *
	 * This prevents silent runtime failures where WordPress skips printing
	 * the entire prerequisites script because a dependency handle is missing.
	 */
	public function test_boot_asset_has_no_unregistered_handles() {
		$asset_file = dirname( __DIR__, 2 ) . '/build/modules/boot/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			$this->markTestSkipped( 'Boot asset file not found — run `pnpm run build` first.' );
		}

		$asset = require $asset_file;
		$this->assertIsArray( $asset, 'Asset file should return an array.' );
		$this->assertArrayHasKey( 'dependencies', $asset, 'Asset file should have a dependencies key.' );

		// Script handles registered by WordPress Core (wp_default_scripts).
		$core_handles = array(
			'react',
			'react-dom',
			'react-jsx-runtime',
			'wp-a11y',
			'wp-api-fetch',
			'wp-blob',
			'wp-block-directory',
			'wp-block-editor',
			'wp-block-library',
			'wp-block-serialization-default-parser',
			'wp-blocks',
			'wp-commands',
			'wp-components',
			'wp-compose',
			'wp-core-data',
			'wp-customize-widgets',
			'wp-data',
			'wp-data-controls',
			'wp-date',
			'wp-deprecated',
			'wp-dom',
			'wp-dom-ready',
			'wp-edit-post',
			'wp-edit-site',
			'wp-edit-widgets',
			'wp-editor',
			'wp-element',
			'wp-escape-html',
			'wp-format-library',
			'wp-hooks',
			'wp-html-entities',
			'wp-i18n',
			'wp-is-shallow-equal',
			'wp-keyboard-shortcuts',
			'wp-keycodes',
			'wp-list-reusable-blocks',
			'wp-media-utils',
			'wp-notices',
			'wp-nux',
			'wp-plugins',
			'wp-preferences',
			'wp-preferences-persistence',
			'wp-primitives',
			'wp-priority-queue',
			'wp-private-apis',
			'wp-redux-routine',
			'wp-reusable-blocks',
			'wp-rich-text',
			'wp-server-side-render',
			'wp-shortcode',
			'wp-style-engine',
			'wp-token-list',
			'wp-url',
			'wp-viewport',
			'wp-warning',
			'wp-widgets',
			'wp-wordcount',
		);

		// Handles polyfilled by this package.
		$polyfill_handles = WP_Build_Polyfills::SCRIPT_HANDLES;

		$known_handles = array_merge( $core_handles, $polyfill_handles );

		$unknown = array_diff( $asset['dependencies'], $known_handles );
		if ( ! empty( $unknown ) ) {
			$this->fail(
				sprintf(
					"Boot module asset file contains unregistered script handle(s): %s.\n" .
					"This will cause a silent failure at runtime (blank page, no errors).\n" .
					'Add the corresponding @wordpress/* package to devDependencies in ' .
					'projects/packages/wp-build-polyfills/package.json so webpack bundles it.',
					implode( ', ', $unknown )
				)
			);
		}
	}

	/**
	 * Test that only requested polyfills are registered.
	 */
	public function test_register_scripts_only_registers_requested_handles() {
		$this->create_asset_file( 'scripts/notices/index.asset.php' );
		$this->create_asset_file( 'scripts/private-apis/index.asset.php' );
		$this->create_asset_file( 'scripts/theme/index.asset.php' );

		// Only request wp-notices.
		$this->request_polyfills( array( 'wp-notices' ) );

		$scripts = $this->create_clean_scripts();

		$method = new \ReflectionMethod( WP_Build_Polyfills::class, 'register_scripts' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$method->invoke( null, $scripts, $this->build_dir, __FILE__, '7.0' );

		$this->assertNotFalse( $scripts->query( 'wp-notices', 'registered' ) );
		$this->assertFalse( $scripts->query( 'wp-private-apis', 'registered' ) );
		$this->assertFalse( $scripts->query( 'wp-theme', 'registered' ) );
	}
}
