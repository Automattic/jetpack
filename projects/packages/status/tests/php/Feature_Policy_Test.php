<?php
/**
 * Tests for Automattic\Jetpack\Feature_Policy.
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack;

use Brain\Monkey;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Feature_Policy test suite.
 *
 * @covers \Automattic\Jetpack\Feature_Policy
 */
#[CoversClass( Feature_Policy::class )]
class Feature_Policy_Test extends TestCase {

	/**
	 * Test setup.
	 */
	public function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		/*
		 * Brain Monkey leaves these two undefined, and once one test defines one it stays defined
		 * for the process. Stubbing both here keeps every test in the class on the same path.
		 */
		Functions\when( 'esc_html' )->returnArg();
		Functions\when( '_doing_it_wrong' )->justReturn( null );
	}

	/**
	 * Test teardown.
	 */
	public function tearDown(): void {
		Feature_Policy::reset();
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Stubs the policy filter's return value.
	 *
	 * @param mixed $policy The policy a host would return.
	 */
	private function set_policy( $policy ) {
		Filters\expectApplied( Feature_Policy::FILTER )->andReturn( $policy );
	}

	/**
	 * Unknown values and malformed entries are dropped rather than guessed at.
	 */
	public function test_get_policy_keeps_only_valid_values() {
		$this->set_policy(
			array(
				'stats'   => array(
					'activation' => 'forced-on',
					'visibility' => 'hidden',
				),
				'monitor' => array(
					'activation' => 'always',
					'visibility' => 'visible',
				),
				'search'  => 'hidden',
				0         => array( 'activation' => 'forced-off' ),
			)
		);

		$this->assertSame(
			array(
				'stats'   => array(
					'activation' => 'forced-on',
					'visibility' => 'hidden',
				),
				'monitor' => array(
					'activation' => null,
					'visibility' => 'visible',
				),
			),
			Feature_Policy::get_policy()
		);
	}

	/**
	 * A filter returning something other than a map yields no policy.
	 */
	public function test_get_policy_ignores_non_array_return() {
		$this->set_policy( false );

		$this->assertSame( array(), Feature_Policy::get_policy() );
	}

	/**
	 * Forced states change the active list; default states don't.
	 */
	public function test_filter_active_modules_applies_forced_states_only() {
		$this->set_policy(
			array(
				'stats'         => array( 'activation' => 'forced-on' ),
				'contact-form'  => array( 'activation' => 'forced-off' ),
				'related-posts' => array( 'activation' => 'default-on' ),
				'sso'           => array( 'activation' => 'default-off' ),
			)
		);

		$this->assertSame(
			array( 'sso', 'stats' ),
			Feature_Policy::filter_active_modules( array( 'contact-form', 'sso' ) )
		);
	}

	/**
	 * Default-on only adds modules the caller could activate; default-off and forced-off remove.
	 */
	public function test_filter_default_modules_respects_availability() {
		$this->set_policy(
			array(
				'related-posts' => array( 'activation' => 'default-on' ),
				'not-available' => array( 'activation' => 'default-on' ),
				'sso'           => array( 'activation' => 'default-off' ),
				'stats'         => array( 'activation' => 'forced-off' ),
			)
		);
		Filters\expectApplied( 'jetpack_get_available_standalone_modules' )
			->with( array(), false, null )
			->andReturn( array( 'related-posts', 'sso', 'stats' ) );

		$this->assertSame(
			array( 'related-posts' ),
			Feature_Policy::filter_default_modules( array( 'sso', 'stats' ), false, false, false, null )
		);
	}

	/**
	 * Visibility from the policy overrides the incoming map, and unset slugs are left alone.
	 */
	public function test_filter_visibility_sets_policy_states() {
		$this->set_policy(
			array(
				'search' => array( 'visibility' => 'hidden' ),
				'boost'  => array( 'visibility' => 'visible' ),
				'stats'  => array( 'activation' => 'forced-on' ),
			)
		);

		$this->assertSame(
			array(
				'boost'  => 'visible',
				'backup' => 'hidden',
				'search' => 'hidden',
			),
			Feature_Policy::filter_visibility(
				array(
					'boost'  => 'hidden',
					'backup' => 'hidden',
				)
			)
		);
	}

	/**
	 * A menu item is matched by the key it declared.
	 */
	public function test_filter_menu_visibility_matches_by_item_key() {
		$this->set_policy( array( 'jetpack-search' => array( 'visibility' => 'hidden' ) ) );

		$this->assertSame(
			array(
				'jetpack-search' => 'hidden',
				'my-jetpack'     => 'default',
			),
			Feature_Policy::filter_menu_visibility(
				array(
					'jetpack-search' => 'default',
					'my-jetpack'     => 'default',
				),
				array(
					array(
						'menu_slug' => 'jetpack-search-page',
						'args'      => array( 'key' => 'jetpack-search' ),
					),
					array( 'menu_slug' => 'my-jetpack' ),
				)
			)
		);
	}

	/**
	 * With no declared key, the menu slug is the name a host uses.
	 */
	public function test_filter_menu_visibility_matches_by_menu_slug() {
		$this->set_policy( array( 'my-jetpack' => array( 'visibility' => 'hidden' ) ) );

		$this->assertSame(
			array( 'my-jetpack' => 'hidden' ),
			Feature_Policy::filter_menu_visibility(
				array( 'my-jetpack' => 'default' ),
				array( array( 'menu_slug' => 'my-jetpack' ) )
			)
		);
	}

	/**
	 * A product slug reaches the item that declared it as its gate.
	 */
	public function test_filter_menu_visibility_matches_by_product() {
		$this->set_policy( array( 'search' => array( 'visibility' => 'hidden' ) ) );

		$this->assertSame(
			array( 'jetpack-search' => 'hidden' ),
			Feature_Policy::filter_menu_visibility(
				array( 'jetpack-search' => 'default' ),
				array(
					array(
						'menu_slug' => 'jetpack-search',
						'args'      => array(
							'key'     => 'jetpack-search',
							'product' => 'search',
						),
					),
				)
			)
		);
	}

	/**
	 * A module slug reaches the item that declared it as its gate.
	 */
	public function test_filter_menu_visibility_matches_by_module() {
		$this->set_policy( array( 'stats' => array( 'visibility' => 'visible' ) ) );

		$this->assertSame(
			array( 'jetpack-stats' => 'visible' ),
			Feature_Policy::filter_menu_visibility(
				array( 'jetpack-stats' => 'default' ),
				array(
					array(
						'menu_slug' => 'jetpack-stats',
						'args'      => array(
							'key'    => 'jetpack-stats',
							'module' => 'stats',
						),
					),
				)
			)
		);
	}

	/**
	 * A policy slug that names no item leaves the map as it found it.
	 */
	public function test_filter_menu_visibility_ignores_slugs_matching_nothing() {
		$this->set_policy(
			array(
				'not-an-item' => array( 'visibility' => 'hidden' ),
				'stats'       => array( 'activation' => 'forced-on' ),
			)
		);

		$this->assertSame(
			array( 'jetpack-stats' => 'default' ),
			Feature_Policy::filter_menu_visibility(
				array( 'jetpack-stats' => 'default' ),
				array(
					array(
						'menu_slug' => 'jetpack-stats',
						'args'      => array(
							'key'    => 'jetpack-stats',
							'module' => 'stats',
						),
					),
				)
			)
		);
	}

	/**
	 * Items of the wrong shape are skipped rather than fatal.
	 */
	public function test_filter_menu_visibility_tolerates_malformed_items() {
		$this->set_policy( array( 'my-jetpack' => array( 'visibility' => 'hidden' ) ) );

		$this->assertSame(
			array( 'my-jetpack' => 'hidden' ),
			Feature_Policy::filter_menu_visibility(
				array(),
				array(
					'not an item',
					array( 'args' => 'not an array' ),
					array( 'menu_slug' => 123 ),
					array( 'menu_slug' => 'my-jetpack' ),
				)
			)
		);
	}

	/**
	 * Either argument not being an array leaves the map alone.
	 *
	 * @param mixed $value What a misbehaving callback handed over instead of an array.
	 *
	 * @dataProvider non_array_values
	 */
	#[DataProvider( 'non_array_values' )]
	public function test_filter_menu_visibility_passes_non_array_arguments_through( $value ) {
		$this->assertSame( $value, Feature_Policy::filter_menu_visibility( $value, array() ) );
		$this->assertSame( array( 'a' => 'default' ), Feature_Policy::filter_menu_visibility( array( 'a' => 'default' ), $value ) );
	}

	/**
	 * Values a filter might hand back instead of an array.
	 *
	 * @return array
	 */
	public static function non_array_values() {
		return array(
			'null'   => array( null ),
			'false'  => array( false ),
			'string' => array( 'hidden' ),
		);
	}

	/**
	 * A forced-on slug this site has no module for is reported, and a real one is not.
	 */
	public function test_forced_on_slug_without_a_module_warns() {
		$warnings = array();
		Functions\when( '_doing_it_wrong' )->alias(
			function ( $function_name, $message ) use ( &$warnings ) {
				$warnings[] = $function_name . ': ' . $message;
			}
		);
		$this->set_policy(
			array(
				'stats'   => array( 'activation' => 'forced-on' ),
				'stasts'  => array( 'activation' => 'forced-on' ),
				'monitor' => array( 'activation' => 'forced-off' ),
			)
		);
		Filters\expectApplied( 'jetpack_get_available_standalone_modules' )
			->with( array(), null, null )
			->andReturn( array( 'stats', 'monitor' ) );

		$this->assertSame( array( 'stats', 'stasts' ), Feature_Policy::filter_active_modules( array() ) );
		$reported = implode( "\n", $warnings );
		$this->assertCount( 1, $warnings, 'Only the slug with no module should be reported.' );
		$this->assertStringStartsWith( Feature_Policy::FILTER . ': ', $reported );
		$this->assertStringContainsString( 'stasts', $reported );
	}

	/**
	 * `is_module_active()` runs this on every call, so a bad slug is reported once per request.
	 */
	public function test_forced_on_slug_without_a_module_warns_once() {
		$warnings = 0;
		Functions\when( '_doing_it_wrong' )->alias(
			function () use ( &$warnings ) {
				++$warnings;
			}
		);
		$this->set_policy( array( 'stasts' => array( 'activation' => 'forced-on' ) ) );
		Filters\expectApplied( 'jetpack_get_available_standalone_modules' )->andReturn( array( 'stats' ) );

		Feature_Policy::filter_active_modules( array() );
		Feature_Policy::filter_active_modules( array( 'stats' ) );

		$this->assertSame( 1, $warnings );
	}

	/**
	 * The bridge stays off until something registers a policy.
	 */
	public function test_ensure_hooks_waits_for_a_policy() {
		Feature_Policy::ensure_hooks();
		$this->assertFalse( Filters\has( 'jetpack_active_modules', array( Feature_Policy::class, 'filter_active_modules' ) ) );

		add_filter( Feature_Policy::FILTER, '__return_empty_array' );
		Feature_Policy::ensure_hooks();

		$this->assertSame( PHP_INT_MAX, Filters\has( 'jetpack_active_modules', array( Feature_Policy::class, 'filter_active_modules' ) ) );
		$this->assertSame( PHP_INT_MAX, Filters\has( 'jetpack_get_default_modules', array( Feature_Policy::class, 'filter_default_modules' ) ) );
		$this->assertSame( PHP_INT_MAX, Filters\has( 'jetpack_my_jetpack_feature_visibility', array( Feature_Policy::class, 'filter_visibility' ) ) );
		$this->assertSame( PHP_INT_MAX, Filters\has( 'jetpack_admin_menu_visibility', array( Feature_Policy::class, 'filter_menu_visibility' ) ) );
	}
}
