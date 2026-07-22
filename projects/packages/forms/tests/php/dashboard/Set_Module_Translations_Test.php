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
	 * Skip on WordPress versions without the script-module translations API (< 7.0).
	 */
	public function set_up() {
		parent::set_up();

		if ( ! function_exists( 'wp_set_script_module_translations' ) ) {
			$this->markTestSkipped( 'Script module translations require WordPress 7.0 or newer.' );
		}
	}

	/**
	 * Remove registered filters and script modules after each test.
	 */
	public function tear_down() {
		remove_all_filters( self::WPADMIN_HOOK );
		remove_all_filters( self::STANDALONE_HOOK );

		foreach ( array( self::FORMS_MODULE, self::FORMS_MODULE_ROUTE, self::CORE_MODULE ) as $id ) {
			wp_deregister_script_module( $id );
		}

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
	 * The filter must be a pass-through and never mutate the dependency list.
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
		wp_register_script_module( self::FORMS_MODULE, 'https://example.org/content.js' );
		wp_register_script_module( self::CORE_MODULE, 'https://example.org/boot.js' );

		Dashboard::set_module_translations();

		apply_filters(
			self::WPADMIN_HOOK,
			array(
				array(
					'import' => 'dynamic',
					'id'     => self::FORMS_MODULE,
				),
				array(
					'import' => 'static',
					'id'     => self::CORE_MODULE,
				),
			)
		);

		$modules = wp_script_modules();

		$forms_module = $modules->get_registered( self::FORMS_MODULE );
		$this->assertSame(
			'jetpack-forms',
			$forms_module['textdomain'] ?? 'default',
			'Forms modules should be registered under the jetpack-forms text domain.'
		);

		$core_module = $modules->get_registered( self::CORE_MODULE );
		$this->assertNotSame(
			'jetpack-forms',
			$core_module['textdomain'] ?? 'default',
			'Core modules should keep the default text domain.'
		);
	}

	/**
	 * Non-array input and malformed dependency entries must be handled safely.
	 */
	public function test_malformed_and_non_array_dependencies_are_skipped() {
		wp_register_script_module( self::FORMS_MODULE, 'https://example.org/content.js' );

		Dashboard::set_module_translations();

		// A non-array value passes through untouched.
		$this->assertNull( apply_filters( self::WPADMIN_HOOK, null ) );

		// Malformed entries (missing / empty / non-string id) are skipped without
		// error, and the one valid Forms module is still registered.
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
					'id'     => self::FORMS_MODULE,
				),
			)
		);

		$forms_module = wp_script_modules()->get_registered( self::FORMS_MODULE );
		$this->assertSame( 'jetpack-forms', $forms_module['textdomain'] ?? 'default' );
	}
}
