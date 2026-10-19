<?php
/**
 * Tests for loading the canonical URLs module on Simple.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Canonical_Urls
 */
#[CoversClass( Canonical_Urls::class )]
class CanonicalUrlsTest extends TestCase {

	/**
	 * Start every test with the switch off and the loader unhooked.
	 */
	protected function setUp(): void {
		parent::setUp();
		delete_option( Canonical_Urls::OPTION );
		remove_action( 'after_setup_theme', array( Canonical_Urls::class, 'load_module' ) );
	}

	/**
	 * Undo the option, hook and constants a test set.
	 */
	protected function tearDown(): void {
		delete_option( Canonical_Urls::OPTION );
		remove_action( 'after_setup_theme', array( Canonical_Urls::class, 'load_module' ) );
		Constants::clear_single_constant( 'IS_WPCOM' );
		Constants::clear_single_constant( 'JETPACK__PLUGIN_DIR' );
		parent::tearDown();
	}

	/**
	 * The module loads only on Simple with the switch on; other hosts load it as a module.
	 *
	 * @dataProvider provide_init_cases
	 * @param bool     $simple   Whether the site is WordPress.com Simple.
	 * @param int|null $enabled  Stored option value, or null when never saved.
	 * @param bool     $expected Whether the module loader is hooked.
	 */
	#[DataProvider( 'provide_init_cases' )]
	public function test_init_hooks_the_module_loader( $simple, $enabled, $expected ) {
		if ( $simple ) {
			Constants::set_constant( 'IS_WPCOM', true );
		}
		if ( null !== $enabled ) {
			update_option( Canonical_Urls::OPTION, $enabled );
		}

		Canonical_Urls::init();

		$this->assertSame( $expected, false !== has_action( 'after_setup_theme', array( Canonical_Urls::class, 'load_module' ) ) );
	}

	/**
	 * @return array<string, array{bool, int|null, bool}>
	 */
	public static function provide_init_cases() {
		return array(
			'Simple, switched on'               => array( true, 1, true ),
			'Simple, switched off'              => array( true, 0, false ),
			'Simple, never saved'               => array( true, null, false ),
			'Atomic or self-hosted, option set' => array( false, 1, false ),
		);
	}

	/**
	 * The loader requires the module file from the Jetpack plugin directory.
	 */
	public function test_load_module_requires_the_jetpack_module_file() {
		$plugin_dir = __DIR__ . '/files/jetpack-plugin/';
		Constants::set_constant( 'JETPACK__PLUGIN_DIR', $plugin_dir );

		Canonical_Urls::load_module();

		$this->assertContains( realpath( $plugin_dir . 'modules/canonical-urls.php' ), get_included_files() );
	}
}
