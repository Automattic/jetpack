<?php
/**
 * Tests for the widget type registry hydration and the registration action.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/widget-modules.php';
require_once __DIR__ . '/../../src/widget-types.php';
require_once __DIR__ . '/../../src/default-dashboard-sections.php';
require_once __DIR__ . '/fixtures/widget-modules-manifest.php';
require_once __DIR__ . '/traits/trait-widget-manifest-fixture.php';

/**
 * Tests for the widget type registry hydration and the registration action.
 *
 * @covers \Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_widget_type
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_widget_types
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_widget_types_from_manifest
 */
#[CoversClass( Widget_Type_Registry::class )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_widget_type' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_widget_types_from_manifest' )]
class Widget_Type_Registry_Test extends BaseTestCase {
	use Widget_Manifest_Fixture_Trait;

	const MANIFEST_WIDGET = 'test/manifest-widget';

	/**
	 * Registration action callback registered by a test.
	 *
	 * @var callable|null
	 */
	private $registration_callback = null;

	/**
	 * _doing_it_wrong() method names captured during a test.
	 *
	 * @var string[]
	 */
	private $doing_it_wrong = array();

	/**
	 * Stage one manifest candidate on a fresh main instance.
	 */
	public function set_up() {
		parent::set_up();

		$this->reset_registry();

		$GLOBALS['jpa_test_widget_manifest'] = array(
			array(
				'name'          => self::MANIFEST_WIDGET,
				'render_module' => 'test/manifest/render',
				'widget_module' => 'test/manifest/widget',
				'title'         => 'Manifest widget',
			),
		);
	}

	/**
	 * Reset the shared registry state between tests.
	 */
	public function tear_down() {
		if ( null !== $this->registration_callback ) {
			remove_action( Widget_Type_Registry::REGISTER_ACTION, $this->registration_callback );
			$this->registration_callback = null;
		}

		// A test may unhook the package's own registrant; the file-scope hook is not re-run.
		if ( false === has_action( Widget_Type_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_widget_types' ) ) {
			add_action( Widget_Type_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_widget_types' );
		}

		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );
		unset( $GLOBALS['jpa_test_widget_manifest'] );

		$this->reset_registry();

		parent::tear_down();
	}

	/**
	 * Drop the main instance so the next read hydrates again.
	 *
	 * @return void
	 */
	private function reset_registry() {
		$instance = new \ReflectionProperty( Widget_Type_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
	}

	/**
	 * Capture _doing_it_wrong() calls without tripping the suite's failOnWarning gate.
	 *
	 * @return void
	 */
	private function capture_doing_it_wrong() {
		$this->doing_it_wrong = array();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			function ( $function_name ) {
				$this->doing_it_wrong[] = $function_name;
			}
		);
	}

	/**
	 * Hook a registration action callback for the duration of the test.
	 *
	 * @param callable $callback Callback receiving the registry.
	 * @return void
	 */
	private function on_registry_hydration( callable $callback ) {
		$this->registration_callback = $callback;
		add_action( Widget_Type_Registry::REGISTER_ACTION, $callback, 20 );
	}

	/**
	 * The first read hydrates the registry with the manifest widgets.
	 */
	public function test_first_read_hydrates_the_registry_from_the_manifest() {
		$this->assertFalse( Widget_Type_Registry::get_instance()->is_registered( self::MANIFEST_WIDGET ) );

		$registered = get_registered_widget_types();

		$this->assertArrayHasKey( self::MANIFEST_WIDGET, $registered );
		$this->assertSame( 'test/manifest/render', $registered[ self::MANIFEST_WIDGET ]->render_module );
		$this->assertSame( 'jetpack-premium-analytics-pkg', $registered[ self::MANIFEST_WIDGET ]->textdomain );
		$this->assertNull( $registered[ self::MANIFEST_WIDGET ]->i18n_manifest );
	}

	/**
	 * The registration action fires once, hands over the registry, and tolerates a
	 * registrant that reads the registry from inside the callback.
	 */
	public function test_registration_action_fires_once_with_the_registry() {
		$calls = array();

		$this->on_registry_hydration(
			static function ( $registry ) use ( &$calls ) {
				$calls[] = $registry;
				$registry->get_all_registered();
				register_widget_type( 'plugin/widget', array( 'render_module' => 'plugin/render' ) );
			}
		);

		get_registered_widget_types();
		$registered = get_registered_widget_types();

		$this->assertSame( array( Widget_Type_Registry::get_instance() ), $calls );
		$this->assertArrayHasKey( 'plugin/widget', $registered );
		$this->assertArrayHasKey( self::MANIFEST_WIDGET, $registered );
	}

	/**
	 * A widget type registered on the action reaches both readers like a manifest one.
	 */
	public function test_widget_type_registered_on_the_action_reaches_both_readers() {
		$this->on_registry_hydration(
			static function () {
				register_widget_type(
					'plugin/widget',
					array(
						'render_module' => 'plugin/render',
						'widget_module' => 'plugin/widget-module',
					)
				);
			}
		);

		$records = array();
		$deps    = array();
		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_fixture_widget_manifest' ) );
		try {
			$records = get_widget_modules_response()->get_data();
			$deps    = add_widget_modules_to_boot_deps( array() );
		} finally {
			remove_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_fixture_widget_manifest' ) );
		}

		$names = array_column( $records, 'name' );
		$this->assertContains( 'plugin/widget', $names );
		$this->assertContains( self::MANIFEST_WIDGET, $names );
		$this->assertContains(
			array(
				'import' => 'dynamic',
				'id'     => 'plugin/render',
			),
			$deps
		);
		$this->assertContains(
			array(
				'import' => 'dynamic',
				'id'     => 'plugin/widget-module',
			),
			$deps
		);
	}

	/**
	 * A widget type registered before the first read survives hydration.
	 */
	public function test_widget_type_registered_before_hydration_survives_it() {
		$this->assertInstanceOf(
			Widget_Type::class,
			register_widget_type( 'early/widget', array( 'render_module' => 'early/render' ) )
		);

		$registered = get_registered_widget_types();

		$this->assertArrayHasKey( 'early/widget', $registered );
		$this->assertArrayHasKey( self::MANIFEST_WIDGET, $registered );
	}

	/**
	 * The manifest registers into the registry the action hands over, not only the main instance.
	 */
	public function test_manifest_registers_into_the_hydrating_registry() {
		$registry = new Widget_Type_Registry();

		$this->assertInstanceOf( Widget_Type::class, $registry->get_registered( self::MANIFEST_WIDGET ) );
		$this->assertFalse( Widget_Type_Registry::get_instance()->is_registered( self::MANIFEST_WIDGET ) );
	}

	/**
	 * A read before init is a _doing_it_wrong() that skips the action and leaves the latch open.
	 */
	public function test_read_before_init_does_not_hydrate_the_registry() {
		global $wp_actions;
		$init_runs = $wp_actions['init'] ?? null;
		unset( $wp_actions['init'] );
		$this->capture_doing_it_wrong();

		try {
			$early = get_registered_widget_types();
		} finally {
			if ( null !== $init_runs ) {
				$wp_actions['init'] = $init_runs;
			}
		}

		$this->assertSame( array(), $early );
		$this->assertSame( array( Widget_Type_Registry::class . '::ensure_hydrated' ), $this->doing_it_wrong );
		$this->assertArrayHasKey( self::MANIFEST_WIDGET, get_registered_widget_types() );
	}

	/**
	 * The helper registers on the main instance and keeps the registry's validations.
	 */
	public function test_register_widget_type_rejects_an_unnamespaced_name() {
		$this->capture_doing_it_wrong();

		$this->assertFalse( register_widget_type( 'widget' ) );
		$this->assertSame( array( Widget_Type_Registry::class . '::register' ), $this->doing_it_wrong );
		$this->assertFalse( Widget_Type_Registry::get_instance()->is_registered( 'widget' ) );
	}

	/**
	 * A plugin's manifest registers with its own text domain, unless a candidate declares one.
	 */
	public function test_manifest_helper_translates_with_the_given_textdomain() {
		$calls    = array();
		$callback = static function ( $translation, $text, $context, $domain ) use ( &$calls ) {
			$calls[] = array( $text, $context, $domain );
			return $translation;
		};
		add_filter( 'gettext_with_context', $callback, 10, 4 );

		try {
			register_widget_types_from_manifest(
				array(
					array(
						'name'          => 'plugin/first',
						'render_module' => 'plugin/first/render',
						'title'         => 'First',
					),
					array(
						'name'          => 'plugin/second',
						'render_module' => 'plugin/second/render',
						'title'         => 'Second',
						'textdomain'    => 'second-domain',
					),
				),
				array( 'textdomain' => 'plugin-domain' )
			);
		} finally {
			remove_filter( 'gettext_with_context', $callback );
		}

		$this->assertContains( array( 'First', 'widget title', 'plugin-domain' ), $calls );
		$this->assertContains( array( 'Second', 'widget title', 'second-domain' ), $calls );
		$this->assertSame( 'First', Widget_Type_Registry::get_instance()->get_registered( 'plugin/first' )->title );
	}

	/**
	 * The catalog location travels with the type: the registrant's defaults fill what a candidate
	 * does not declare, so the client knows which domain and manifest each bundle's strings live in.
	 */
	public function test_manifest_helper_stamps_the_catalog_location_onto_the_type() {
		register_widget_types_from_manifest(
			array(
				array(
					'name'          => 'plugin/first',
					'render_module' => 'plugin/first/render',
				),
				array(
					'name'          => 'plugin/second',
					'render_module' => 'plugin/second/render',
					'textdomain'    => 'second-domain',
					'i18n_manifest' => 'https://example.org/second/build/i18n-manifest.json',
				),
			),
			array(
				'textdomain'    => 'plugin-domain',
				'i18n_manifest' => 'https://example.org/plugin/build/i18n-manifest.json',
			)
		);

		$registry = Widget_Type_Registry::get_instance();
		$this->assertSame( 'plugin-domain', $registry->get_registered( 'plugin/first' )->textdomain );
		$this->assertSame( 'https://example.org/plugin/build/i18n-manifest.json', $registry->get_registered( 'plugin/first' )->i18n_manifest );
		$this->assertSame( 'second-domain', $registry->get_registered( 'plugin/second' )->textdomain );
		$this->assertSame( 'https://example.org/second/build/i18n-manifest.json', $registry->get_registered( 'plugin/second' )->i18n_manifest );
	}

	/**
	 * A plugin's manifest goes through the registry-time filter like the package's.
	 */
	public function test_manifest_helper_applies_the_registry_time_filter() {
		$drop_second = static function ( $widgets ) {
			return array_values(
				array_filter(
					$widgets,
					static function ( $widget ) {
						return 'plugin/second' !== ( $widget['name'] ?? '' );
					}
				)
			);
		};
		add_filter( REGISTRABLE_WIDGET_TYPES_FILTER, $drop_second );

		try {
			register_widget_types_from_manifest(
				array(
					array( 'name' => 'plugin/first' ),
					array( 'name' => 'plugin/second' ),
					array( 'render_module' => 'plugin/unnamed/render' ),
				)
			);
		} finally {
			remove_filter( REGISTRABLE_WIDGET_TYPES_FILTER, $drop_second );
		}

		$registry = Widget_Type_Registry::get_instance();
		$this->assertTrue( $registry->is_registered( 'plugin/first' ) );
		$this->assertFalse( $registry->is_registered( 'plugin/second' ) );
	}

	/**
	 * The helper writes into the registry it is given, and sanitizes on the way in.
	 */
	public function test_manifest_helper_registers_into_the_given_registry() {
		$registry = new Widget_Type_Registry();

		register_widget_types_from_manifest(
			array(
				array(
					'name' => 'plugin/first',
					'help' => array( 'content' => 'Read <em onclick="alert(1)">this</em> <u>carefully</u>.<script src="https://example.com/x.js"></script>' ),
					'icon' => 'Not/Valid',
				),
			),
			array(),
			$registry
		);

		$widget_type = $registry->get_registered( 'plugin/first' );
		$this->assertInstanceOf( Widget_Type::class, $widget_type );
		$this->assertSame( array( 'content' => 'Read <em>this</em> carefully.' ), $widget_type->help );
		$this->assertNull( $widget_type->icon );
		$this->assertFalse( Widget_Type_Registry::get_instance()->is_registered( 'plugin/first' ) );
	}

	/**
	 * Calling the package's registrant twice registers each manifest widget once.
	 */
	public function test_register_widget_types_skips_registered_names() {
		register_widget_types();

		$this->capture_doing_it_wrong();
		register_widget_types();

		$this->assertSame( array(), $this->doing_it_wrong );
		$this->assertArrayHasKey( self::MANIFEST_WIDGET, get_registered_widget_types() );
	}

	/**
	 * A former name resolves to the current type, without showing up as a type of its own.
	 */
	public function test_former_names_resolve_to_the_current_type() {
		register_widget_type(
			'videopress/top-videos',
			array(
				'render_module' => 'videopress/render',
				'former_names'  => array( 'jpa/videopress' ),
			)
		);

		$registry = Widget_Type_Registry::get_instance();
		$this->assertSame( 'videopress/top-videos', $registry->resolve_name( 'jpa/videopress' ) );
		$this->assertSame( 'jpa/clicks', $registry->resolve_name( 'jpa/clicks' ) );
		$this->assertSame( 'videopress/top-videos', $registry->get_registered( 'jpa/videopress' )->name );
		$this->assertFalse( $registry->is_registered( 'jpa/videopress' ) );
		$this->assertArrayNotHasKey( 'jpa/videopress', get_registered_widget_types() );
	}

	/**
	 * A former name another type holds, or a name someone claims as former, is refused.
	 */
	public function test_former_names_cannot_collide_with_registered_or_claimed_names() {
		register_widget_type( 'plugin/taken', array( 'render_module' => 'plugin/taken/render' ) );
		register_widget_type( 'plugin/current', array( 'former_names' => array( 'plugin/old' ) ) );
		$this->capture_doing_it_wrong();

		$this->assertFalse( register_widget_type( 'plugin/other', array( 'former_names' => array( 'plugin/taken' ) ) ) );
		$this->assertFalse( register_widget_type( 'plugin/another', array( 'former_names' => array( 'plugin/old' ) ) ) );
		$this->assertFalse( register_widget_type( 'plugin/old' ) );
		$this->assertFalse( register_widget_type( 'plugin/shouty', array( 'former_names' => array( 'Plugin/Old' ) ) ) );
		$this->assertFalse( register_widget_type( 'plugin/numeric', array( 'former_names' => array( 42 ) ) ) );
		$this->assertFalse( register_widget_type( 'plugin/scalar', array( 'former_names' => 'plugin/old-scalar' ) ) );

		$this->assertSame(
			array(
				Widget_Type_Registry::class . '::former_names_are_free',
				Widget_Type_Registry::class . '::former_names_are_free',
				Widget_Type_Registry::class . '::register',
				Widget_Type_Registry::class . '::former_names_are_free',
				Widget_Type_Registry::class . '::former_names_are_free',
				Widget_Type_Registry::class . '::former_names_are_free',
			),
			$this->doing_it_wrong
		);
		$this->assertSame( 'plugin/current', Widget_Type_Registry::get_instance()->resolve_name( 'plugin/old' ) );
	}

	/**
	 * Unregistering a type releases its former names.
	 */
	public function test_unregister_releases_the_former_names() {
		$registry = Widget_Type_Registry::get_instance();
		$registry->register( 'plugin/current', array( 'former_names' => array( 'plugin/old' ) ) );

		$registry->unregister( 'plugin/current' );

		$this->assertSame( 'plugin/old', $registry->resolve_name( 'plugin/old' ) );
		$this->assertInstanceOf( Widget_Type::class, $registry->register( 'plugin/old' ) );
	}

	/**
	 * The registry stores former names as a list of distinct names, whatever shape the caller passed:
	 * a keyed array would reach the client as an object.
	 */
	public function test_register_normalizes_the_former_names_into_a_list() {
		$registry = Widget_Type_Registry::get_instance();

		$keyed = $registry->register( 'plugin/keyed', array( 'former_names' => array_unique( array( 'plugin/old', 'plugin/old', 'plugin/older' ) ) ) );
		$this->assertSame( array( 'plugin/old', 'plugin/older' ), $keyed->former_names );
		$this->assertSame( 'plugin/keyed', $registry->resolve_name( 'plugin/older' ) );

		$this->assertNull( $registry->register( 'plugin/none', array( 'former_names' => array() ) )->former_names );

		$instance = new Widget_Type( 'plugin/instance', array( 'former_names' => array( 3 => 'plugin/third' ) ) );
		$this->assertSame( array( 'plugin/third' ), $registry->register( $instance )->former_names );
	}

	/**
	 * The manifest helper takes former names from the candidate, or from the registrant's map.
	 */
	public function test_manifest_helper_stamps_the_former_names_onto_the_type() {
		register_widget_types_from_manifest(
			array(
				array(
					'name'          => 'plugin/first',
					'render_module' => 'plugin/first/render',
				),
				array(
					'name'          => 'plugin/second',
					'render_module' => 'plugin/second/render',
					'former_names'  => array( 'jpa/second', 'jpa/second' ),
				),
			),
			array(
				'former_names' => array(
					'plugin/first'  => array( 'jpa/first' ),
					'plugin/second' => array( 'jpa/ignored' ),
				),
			)
		);

		$registry = Widget_Type_Registry::get_instance();
		$this->assertSame( array( 'jpa/first' ), $registry->get_registered( 'plugin/first' )->former_names );
		$this->assertSame( array( 'jpa/second' ), $registry->get_registered( 'plugin/second' )->former_names );
		$this->assertSame( 'plugin/second', $registry->resolve_name( 'jpa/second' ) );
		$this->assertSame( 'jpa/ignored', $registry->resolve_name( 'jpa/ignored' ) );
	}
}
