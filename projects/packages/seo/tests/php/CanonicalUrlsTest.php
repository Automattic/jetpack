<?php
/**
 * Tests for loading the canonical URLs module on Simple.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
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

	/**
	 * @dataProvider provide_output_plan_cases
	 * @param string $host     Hosting platform.
	 * @param bool   $entitled Whether advanced SEO is supported.
	 * @param bool   $expected Whether the loaded module should emit a tag.
	 * @param bool   $available Whether the SEO product is available.
	 */
	#[DataProvider( 'provide_output_plan_cases' )]
	public function test_loaded_module_checks_current_plan( $host, $entitled, $expected, $available ) {
		require_once __DIR__ . '/../../../../plugins/jetpack/modules/canonical-urls.php';

		if ( 'simple' === $host ) {
			Constants::set_constant( 'IS_WPCOM', true );
		} elseif ( 'atomic' === $host ) {
			Constants::set_constant( 'ATOMIC_SITE_ID', 1 );
			Constants::set_constant( 'ATOMIC_CLIENT_ID', 1 );
			Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', 'wpcomsh/wpcomsh.php' );
		}
		\Automattic\Jetpack\Status\Cache::clear();
		\Wpcom_Test_Features::$known    = array( 'advanced-seo', 'seo-admin-ui' );
		\Wpcom_Test_Features::$entitled = $entitled ? array( 'advanced-seo' ) : array();
		$feature_filter                 = $available ? '__return_true' : '__return_false';
		$plan_caches                    = array();
		foreach ( array(
			'active_plan_cache'             => array( 'features' => array( 'active' => array() ) ),
			'simple_site_specific_features' => array( get_current_blog_id() => array( 'active_only' => array( 'active' => array() ) ) ),
		) as $name => $value ) {
			$property = new \ReflectionProperty( Current_Plan::class, $name );
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$plan_caches[] = array( $property, $property->getValue() );
			$property->setValue( null, $value );
		}
		add_filter( Initializer::FEATURE_FILTER, $feature_filter );
		$url = static function () {
			return 'https://example.com/author/test/';
		};
		add_filter( 'jetpack_canonical_url', $url );
		update_option( Canonical_Urls::OPTION, 1 );

		try {
			ob_start();
			\jetpack_canonical_urls_output_tag();
			$output = ob_get_clean();

			$this->assertSame( $expected, false !== strpos( $output, 'rel="canonical"' ) );
			$this->assertSame( 1, (int) get_option( Canonical_Urls::OPTION ) );
		} finally {
			foreach ( $plan_caches as list( $property, $value ) ) {
				$property->setValue( null, $value );
			}
			remove_filter( Initializer::FEATURE_FILTER, $feature_filter );
			remove_filter( 'jetpack_canonical_url', $url );
			remove_action( 'wp_head', 'jetpack_canonical_urls_output_tag' );
			foreach ( array( 'ATOMIC_SITE_ID', 'ATOMIC_CLIENT_ID', 'WPCOMSH__PLUGIN_FILE' ) as $constant ) {
				Constants::clear_single_constant( $constant );
			}
			\Automattic\Jetpack\Status\Cache::clear();
			\Wpcom_Test_Features::reset();
		}
	}

	/**
	 * @return array<string, array{string, bool, bool, bool}>
	 */
	public static function provide_output_plan_cases() {
		return array(
			'Simple below Premium'       => array( 'simple', false, false, true ),
			'Simple eligible'            => array( 'simple', true, true, true ),
			'Atomic below Premium'       => array( 'atomic', false, false, true ),
			'Atomic eligible'            => array( 'atomic', true, true, true ),
			'self-hosted free'           => array( 'self-hosted', false, true, true ),
			'Simple before availability' => array( 'simple', false, true, false ),
			'Atomic before availability' => array( 'atomic', false, true, false ),
		);
	}
}
