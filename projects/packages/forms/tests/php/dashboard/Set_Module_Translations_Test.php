<?php
/**
 * Unit tests for Automattic\Jetpack\Forms\Dashboard\Dashboard::set_module_translations().
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversMethod;
use WorDBless\BaseTestCase;

// Stub the WordPress 7.0 script-module translations API so the method runs and
// its calls are observable on the WordPress < 7.0 test environment.
require_once __DIR__ . '/stubs/wp-set-script-module-translations-global.php';
require_once __DIR__ . '/stubs/wp-set-script-module-translations-namespaced.php';

/**
 * Tests for the wp-build script-module translation registration.
 *
 * @covers Automattic\Jetpack\Forms\Dashboard\Dashboard::set_module_translations
 * @covers \Automattic\Jetpack\Forms\Dashboard\Dashboard
 */
#[CoversClass( Dashboard::class )]
#[CoversMethod( Dashboard::class, 'set_module_translations' )]
class Set_Module_Translations_Test extends BaseTestCase {

	/**
	 * Filter fired by the wp-admin-integrated responses page.
	 *
	 * @var string
	 */
	const WPADMIN_HOOK = 'jetpack-forms-responses-wp-admin_boot_dependencies';

	/**
	 * Filter fired by the standalone responses page.
	 *
	 * @var string
	 */
	const STANDALONE_HOOK = 'jetpack-forms-responses_boot_dependencies';

	/**
	 * A Forms-owned script module id.
	 *
	 * @var string
	 */
	const FORMS_MODULE = 'jetpack-forms/routes/responses/content';

	/**
	 * A second Forms-owned script module id.
	 *
	 * @var string
	 */
	const FORMS_MODULE_ROUTE = 'jetpack-forms/routes/responses/route';

	/**
	 * A core script module id that must be left untouched.
	 *
	 * @var string
	 */
	const CORE_MODULE = '@wordpress/boot';

	/**
	 * Reset the recorded calls before each test.
	 */
	public function set_up() {
		parent::set_up();
		$GLOBALS['jetpack_forms_smt_calls'] = array();
	}

	/**
	 * Remove registered filters and recorded calls after each test.
	 */
	public function tear_down() {
		remove_all_filters( self::WPADMIN_HOOK );
		remove_all_filters( self::STANDALONE_HOOK );
		remove_all_filters( 'load_script_textdomain_relative_path' );
		unset( $GLOBALS['jetpack_forms_smt_calls'] );
		parent::tear_down();
	}

	/**
	 * Both page variants should get the boot-dependencies filter registered.
	 */
	public function test_registers_boot_dependency_filters() {
		Dashboard::set_module_translations();

		$this->assertNotFalse(
			has_filter( self::WPADMIN_HOOK ),
			'The wp-admin-integrated boot_dependencies filter should be registered.'
		);
		$this->assertNotFalse(
			has_filter( self::STANDALONE_HOOK ),
			'The standalone boot_dependencies filter should be registered.'
		);
	}

	/**
	 * A Forms wp-build module path is rewritten to the classic dashboard bundle,
	 * so core resolves an existing language-pack JSON.
	 */
	public function test_rewrites_forms_module_translation_path() {
		Dashboard::set_module_translations();

		$module_path = 'jetpack_vendor/automattic/jetpack-forms/build/routes/responses/content.min.js';

		$this->assertSame(
			Dashboard::WPBUILD_TRANSLATION_REFERENCE,
			apply_filters( 'load_script_textdomain_relative_path', $module_path, 'https://example.org/' . $module_path, true )
		);
	}

	/**
	 * Non-Forms-module paths must pass through the relative-path filter unchanged.
	 */
	public function test_leaves_non_forms_paths_unchanged() {
		Dashboard::set_module_translations();

		$untouched = array(
			'build/index.js',
			// The classic dashboard bundle itself (dist/, not build/) must not be remapped.
			Dashboard::WPBUILD_TRANSLATION_REFERENCE,
			false,
		);

		foreach ( $untouched as $path ) {
			$this->assertSame(
				$path,
				apply_filters( 'load_script_textdomain_relative_path', $path, 'https://example.org/x.js', true )
			);
		}
	}

	/**
	 * The boot-dependencies filter must be a pass-through and never mutate the list.
	 */
	public function test_filter_returns_dependencies_unchanged() {
		Dashboard::set_module_translations();

		$deps = array(
			array(
				'import' => 'static',
				'id'     => self::CORE_MODULE,
			),
			array(
				'import' => 'dynamic',
				'id'     => self::FORMS_MODULE,
			),
		);

		$this->assertSame( $deps, apply_filters( self::WPADMIN_HOOK, $deps ) );
	}

	/**
	 * Only Forms-owned modules get the `jetpack-forms` text domain registered;
	 * core (`@wordpress/*`) modules are left on the default domain.
	 */
	public function test_only_jetpack_forms_modules_get_translations() {
		Dashboard::set_module_translations();

		apply_filters(
			self::WPADMIN_HOOK,
			array(
				array(
					'import' => 'static',
					'id'     => self::CORE_MODULE,
				),
				array(
					'import' => 'static',
					'id'     => '@wordpress/route',
				),
				array(
					'import' => 'dynamic',
					'id'     => self::FORMS_MODULE,
				),
				array(
					'import' => 'static',
					'id'     => self::FORMS_MODULE_ROUTE,
				),
			)
		);

		$ids = wp_list_pluck( $GLOBALS['jetpack_forms_smt_calls'], 'id' );

		$this->assertContains( self::FORMS_MODULE, $ids );
		$this->assertContains( self::FORMS_MODULE_ROUTE, $ids );
		$this->assertNotContains( self::CORE_MODULE, $ids );
		$this->assertNotContains( '@wordpress/route', $ids );

		foreach ( $GLOBALS['jetpack_forms_smt_calls'] as $call ) {
			$this->assertSame(
				'jetpack-forms',
				$call['domain'],
				'Forms modules should be registered under the jetpack-forms text domain.'
			);
		}
	}

	/**
	 * Non-array input and malformed dependency entries must be handled safely.
	 */
	public function test_malformed_and_non_array_dependencies_are_skipped() {
		Dashboard::set_module_translations();

		// A non-array value passes through untouched and records nothing.
		$this->assertNull( apply_filters( self::WPADMIN_HOOK, null ) );
		$this->assertSame( array(), $GLOBALS['jetpack_forms_smt_calls'] );

		// Entries without a usable string id are skipped.
		apply_filters(
			self::WPADMIN_HOOK,
			array(
				array( 'import' => 'static' ),
				array(
					'import' => 'static',
					'id'     => '',
				),
				array(
					'import' => 'static',
					'id'     => 123,
				),
				array(
					'import' => 'dynamic',
					'id'     => 'jetpack-forms/routes/forms/content',
				),
			)
		);

		$ids = wp_list_pluck( $GLOBALS['jetpack_forms_smt_calls'], 'id' );
		$this->assertSame( array( 'jetpack-forms/routes/forms/content' ), $ids );
	}
}
