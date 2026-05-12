<?php
/**
 * Tests for the Search_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-search
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Search\Abilities;

use Automattic\Jetpack\Search\AI_Answers;
use Automattic\Jetpack\Search\Module_Control;
use Automattic\Jetpack\Search\Options;
use Automattic\Jetpack\Search\Plan;
use Automattic\Jetpack\Search\Stats;
use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use PHPUnit\Framework\Attributes\CoversClass;
use WP_Error;

/**
 * Unit tests for Search_Abilities registration and execution.
 *
 * Run from projects/packages/search:
 *
 *   composer phpunit -- --filter Search_Abilities_Test
 *
 * @covers \Automattic\Jetpack\Search\Abilities\Search_Abilities
 */
#[CoversClass( Search_Abilities::class )]
class Search_Abilities_Test extends Search_TestCase {

	/**
	 * {@inheritDoc}
	 */
	public function setUp(): void {
		parent::setUp();

		// Most tests open the gate; the specific "disabled by default" test closes it explicitly.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Reset any hooks a prior test may have added for the Registrar lifecycle actions.
		remove_action( 'wp_abilities_api_categories_init', array( Search_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Search_Abilities::class, 'register_abilities' ) );
	}

	/**
	 * {@inheritDoc}
	 */
	public function tearDown(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'jetpack_search_abilities_module_control' );
		remove_all_filters( 'jetpack_search_abilities_plan' );
		remove_all_filters( 'jetpack_search_abilities_stats' );
		remove_all_filters( 'jetpack_search_ai_answers_enabled' );

		remove_action( 'wp_abilities_api_categories_init', array( Search_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Search_Abilities::class, 'register_abilities' ) );

		if ( function_exists( 'did_action' ) && did_action( 'wp_abilities_api_init' ) ) {
			$this->deregister_category_and_abilities();
		}

		parent::tearDown();
	}

	/**
	 * Remove our category + abilities from the registry so tests don't bleed.
	 */
	private function deregister_category_and_abilities(): void {
		if ( function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Search_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			if ( wp_has_ability_category( Search_Abilities::CATEGORY_SLUG ) ) {
				wp_unregister_ability_category( Search_Abilities::CATEGORY_SLUG );
			}
		}
	}

	/**
	 * Run a callable while the given Abilities API lifecycle action appears to be firing.
	 *
	 * Mirrors the helper in projects/packages/stats/tests/php/abilities/Stats_Abilities_Test.php.
	 *
	 * @param string   $action Action name to simulate.
	 * @param callable $fn     Callable to run while the action is "firing".
	 */
	private function with_simulated_action( string $action, callable $fn ): void {
		global $wp_current_filter;
		$wp_current_filter[] = $action;
		try {
			$fn();
		} finally {
			for ( $i = count( $wp_current_filter ) - 1; $i >= 0; $i-- ) {
				if ( $wp_current_filter[ $i ] === $action ) {
					array_splice( $wp_current_filter, $i, 1 );
					break;
				}
			}
		}
	}

	/**
	---------------------------------------------------------------------
	 * Abstract getters + spec sanity
	 * ---------------------------------------------------------------------
	 */
	public function test_category_slug_is_jetpack_search(): void {
		$this->assertSame( 'jetpack-search', Search_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = Search_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotSame( '', $def['label'] );
		$this->assertNotSame( '', $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = Search_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-search/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly(): void {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Search_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_spec_declares_annotations_permission_and_execute(): void {
		foreach ( Search_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'execute_callback', $spec, "Ability {$slug} missing execute_callback" );
			$this->assertIsCallable( $spec['execute_callback'], "Ability {$slug} execute_callback is not callable" );
			$this->assertArrayHasKey( 'permission_callback', $spec, "Ability {$slug} missing permission_callback" );
			$this->assertIsCallable( $spec['permission_callback'], "Ability {$slug} permission_callback is not callable" );
			$this->assertArrayHasKey( 'meta', $spec, "Ability {$slug} missing meta" );
			$this->assertArrayHasKey( 'annotations', $spec['meta'], "Ability {$slug} missing meta.annotations" );
			foreach ( array( 'readonly', 'destructive', 'idempotent' ) as $flag ) {
				$this->assertArrayHasKey( $flag, $spec['meta']['annotations'], "Ability {$slug} missing annotation {$flag}" );
				$this->assertIsBool( $spec['meta']['annotations'][ $flag ], "Ability {$slug} annotation {$flag} must be bool" );
			}
		}
	}

	public function test_all_three_abilities_are_readonly_and_non_destructive(): void {
		$expected_slugs = array(
			'jetpack-search/get-settings',
			'jetpack-search/get-stats',
			'jetpack-search/get-plan-info',
		);
		$abilities      = Search_Abilities::get_abilities();
		foreach ( $expected_slugs as $slug ) {
			$this->assertArrayHasKey( $slug, $abilities );
			$ann = $abilities[ $slug ]['meta']['annotations'];
			$this->assertTrue( $ann['readonly'], "{$slug} should be readonly" );
			$this->assertFalse( $ann['destructive'], "{$slug} should not be destructive" );
			$this->assertTrue( $ann['idempotent'], "{$slug} should be idempotent" );
		}
	}

	public function test_every_ability_opts_into_mcp_as_public_tool(): void {
		foreach ( Search_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertSame( true, $spec['meta']['mcp']['public'], "{$slug} must opt into MCP." );
			$this->assertSame( 'tool', $spec['meta']['mcp']['type'], "{$slug} must be exposed as an MCP tool." );
		}
	}

	public function test_no_writes_in_this_batch(): void {
		// Writes are intentionally deferred — guard against accidental write additions.
		foreach ( Search_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertTrue(
				$spec['meta']['annotations']['readonly'],
				"This batch should ship reads only — {$slug} is not readonly."
			);
		}
	}

	public function test_input_schemas_disallow_additional_properties(): void {
		foreach ( Search_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'input_schema', $spec, "Ability {$slug} missing input_schema" );
			$this->assertArrayHasKey( 'additionalProperties', $spec['input_schema'], "Ability {$slug} input_schema must set additionalProperties" );
			$this->assertFalse( $spec['input_schema']['additionalProperties'], "Ability {$slug} input_schema.additionalProperties must be false" );
		}
	}

	/**
	---------------------------------------------------------------------
	 * Registrar wiring
	 * ---------------------------------------------------------------------
	 */
	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Search_Abilities::init();

		$this->assertFalse(
			has_action(
				'wp_abilities_api_categories_init',
				array( Search_Abilities::class, 'register_category' )
			)
		);
		$this->assertFalse(
			has_action(
				'wp_abilities_api_init',
				array( Search_Abilities::class, 'register_abilities' )
			)
		);

		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true(): void {
		if ( did_action( 'wp_abilities_api_init' ) || did_action( 'wp_abilities_api_categories_init' ) ) {
			$this->markTestSkipped( 'Abilities API lifecycle already fired in this test run; late-load path covered elsewhere.' );
		}

		Search_Abilities::init();

		$this->assertNotFalse(
			has_action(
				'wp_abilities_api_categories_init',
				array( Search_Abilities::class, 'register_category' )
			)
		);
		$this->assertNotFalse(
			has_action(
				'wp_abilities_api_init',
				array( Search_Abilities::class, 'register_abilities' )
			)
		);
	}

	public function test_register_abilities_registers_every_slug_with_auto_injected_category(): void {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		$this->with_simulated_action(
			'wp_abilities_api_categories_init',
			static function () {
				Search_Abilities::register_category();
			}
		);
		$this->with_simulated_action(
			'wp_abilities_api_init',
			static function () {
				Search_Abilities::register_abilities();
			}
		);

		foreach ( array_keys( Search_Abilities::get_abilities() ) as $slug ) {
			$this->assertTrue( wp_has_ability( $slug ), "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected(): void {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				if ( 'ability' === $type ) {
					return 'jetpack-search/get-settings' === $slug;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->with_simulated_action(
			'wp_abilities_api_categories_init',
			static function () {
				Search_Abilities::register_category();
			}
		);
		$this->with_simulated_action(
			'wp_abilities_api_init',
			static function () {
				Search_Abilities::register_abilities();
			}
		);

		$this->assertTrue( wp_has_ability( 'jetpack-search/get-settings' ) );
		$this->assertFalse( wp_has_ability( 'jetpack-search/get-stats' ) );
		$this->assertFalse( wp_has_ability( 'jetpack-search/get-plan-info' ) );
	}

	/**
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */
	public function test_can_manage_search_allows_admin(): void {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Search_Abilities::can_manage_search() );
	}

	public function test_can_manage_search_denies_editor(): void {
		wp_set_current_user( $this->editor_id );
		$this->assertFalse( Search_Abilities::can_manage_search() );
	}

	public function test_can_manage_search_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Search_Abilities::can_manage_search() );
	}

	/**
	---------------------------------------------------------------------
	 * Execute callbacks — happy paths
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Stub Module_Control so abilities tests don't spin up its Plan/Connection
	 * dependencies. Real-subclass stub (PHPUnit `createStub`) so the
	 * `instanceof Module_Control` guard on the filter passes.
	 *
	 * @param bool $is_active                Return value of is_active().
	 * @param bool $is_instant_search_enabled Return value of is_instant_search_enabled().
	 */
	private function stub_module_control( bool $is_active, bool $is_instant_search_enabled ): void {
		$stub = $this->createStub( Module_Control::class );
		$stub->method( 'is_active' )->willReturn( $is_active );
		$stub->method( 'is_instant_search_enabled' )->willReturn( $is_instant_search_enabled );
		add_filter(
			'jetpack_search_abilities_module_control',
			static function () use ( $stub ) {
				return $stub;
			}
		);
	}

	/**
	 * Stub Plan with a fixed return value for get_plan_info().
	 *
	 * @param mixed $plan_info Return value for get_plan_info().
	 */
	private function stub_plan( $plan_info ): void {
		$stub = $this->createStub( Plan::class );
		$stub->method( 'get_plan_info' )->willReturn( $plan_info );
		add_filter(
			'jetpack_search_abilities_plan',
			static function () use ( $stub ) {
				return $stub;
			}
		);
	}

	/**
	 * Stub Stats with a fixed return value for get_stats_from_wpcom().
	 *
	 * @param mixed $response Return value for get_stats_from_wpcom().
	 */
	private function stub_stats( $response ): void {
		$stub = $this->createStub( Stats::class );
		$stub->method( 'get_stats_from_wpcom' )->willReturn( $response );
		add_filter(
			'jetpack_search_abilities_stats',
			static function () use ( $stub ) {
				return $stub;
			}
		);
	}

	public function test_get_settings_returns_documented_shape(): void {
		$this->stub_module_control( true, false );

		// Mark AI Answers as enabled via the filter the AI_Answers class itself respects.
		add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );

		// Stash a few customization options so get-settings reflects them.
		update_option( Options::OPTION_PREFIX . 'color_theme', 'dark' );
		update_option( Options::OPTION_PREFIX . 'enable_sort', '1' );
		update_option( Options::OPTION_PREFIX . 'inf_scroll', '0' );

		$result = Search_Abilities::get_settings();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'module_active', $result );
		$this->assertArrayHasKey( 'instant_search_enabled', $result );
		$this->assertArrayHasKey( 'supported_post_types', $result );
		$this->assertArrayHasKey( 'customizations', $result );
		$this->assertArrayHasKey( 'ai_answers_enabled', $result );

		$this->assertTrue( $result['module_active'] );
		$this->assertFalse( $result['instant_search_enabled'] );
		$this->assertTrue( $result['ai_answers_enabled'] );
		$this->assertIsArray( $result['supported_post_types'] );
		$this->assertIsArray( $result['customizations'] );

		// Customizations should reflect the options we wrote, with bools coerced.
		$this->assertSame( 'dark', $result['customizations']['color_theme'] );
		$this->assertTrue( $result['customizations']['enable_sort'] );
		$this->assertFalse( $result['customizations']['inf_scroll'] );

		// Excluded post types defaults to empty array (option is unset / blank).
		$this->assertSame( array(), $result['customizations']['excluded_post_types'] );
	}

	public function test_get_settings_excludes_post_types_listed_in_option(): void {
		$this->stub_module_control( false, false );

		// `page` is a default public, non-exclude_from_search post type.
		update_option( Options::OPTION_PREFIX . 'excluded_post_types', 'page' );

		$result = Search_Abilities::get_settings();

		$this->assertNotContains( 'page', $result['supported_post_types'] );
		$this->assertContains( 'post', $result['supported_post_types'] );
		$this->assertContains( 'page', $result['customizations']['excluded_post_types'] );
	}

	public function test_get_stats_returns_documented_shape_from_num_requests_3m(): void {
		$this->stub_stats(
			array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode(
					array(
						'plan_usage' => array(
							'num_requests_3m' => array(
								array(
									'num_requests' => 12345,
									'start_date'   => '2026-04-01',
									'end_date'     => '2026-04-30',
								),
							),
							'must_upgrade'    => true,
							'months_over_plan_records_limit' => 2,
						),
					),
					JSON_UNESCAPED_SLASHES
				),
			)
		);
		$this->stub_plan(
			array(
				'record_limit'            => 10000,
				'supports_instant_search' => true,
			)
		);

		$result = Search_Abilities::get_stats();

		$this->assertIsArray( $result );
		$this->assertSame( 12345, $result['requests_this_period'] );
		$this->assertSame( '2026-04-01', $result['period_start'] );
		$this->assertSame( '2026-04-30', $result['period_end'] );
		$this->assertSame( 10000, $result['plan_records_included'] );
		$this->assertTrue( $result['plan_overage'] );
		$this->assertSame( 2, $result['overage_count'] );
	}

	public function test_get_stats_returns_wp_error_when_remote_is_wp_error(): void {
		$this->stub_stats( new WP_Error( 'http_failure', 'boom' ) );

		$result = Search_Abilities::get_stats();
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_search_data_unavailable', $result->get_error_code() );
	}

	public function test_get_stats_returns_wp_error_when_remote_status_not_200(): void {
		$this->stub_stats(
			array(
				'response' => array( 'code' => 500 ),
				'body'     => wp_json_encode( array( 'error' => 'nope' ), JSON_UNESCAPED_SLASHES ),
			)
		);

		$result = Search_Abilities::get_stats();
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_search_data_unavailable', $result->get_error_code() );
	}

	public function test_get_plan_info_returns_documented_shape(): void {
		$this->stub_plan(
			array(
				'tier'                        => 'jetpack-search-tier-100',
				'supports_instant_search'     => true,
				'supports_ai_answers'         => false,
				'effective_subscription'      => array(
					'product_slug'      => 'jetpack_search',
					'bill_period'       => '365',
					'bill_period_label' => 'Yearly',
				),
				'default_upgrade_bill_period' => 'yearly',
			)
		);

		$result = Search_Abilities::get_plan_info();

		$this->assertIsArray( $result );
		$this->assertSame( 'jetpack-search-tier-100', $result['tier'] );
		$this->assertSame( 'jetpack_search', $result['plan_slug'] );
		$this->assertTrue( $result['supports_instant_search'] );
		$this->assertFalse( $result['supports_ai_answers'] );
		$this->assertSame( 'yearly', $result['billing_period'] );
	}

	public function test_get_plan_info_normalises_monthly_billing_from_days(): void {
		$this->stub_plan(
			array(
				'tier'                   => '',
				'effective_subscription' => array(
					'product_slug' => 'jetpack_search_monthly',
					'bill_period'  => '30',
				),
			)
		);

		$result = Search_Abilities::get_plan_info();
		$this->assertSame( 'monthly', $result['billing_period'] );
		$this->assertSame( '', $result['tier'] );
		$this->assertSame( 'jetpack_search_monthly', $result['plan_slug'] );
	}

	public function test_get_plan_info_returns_wp_error_when_plan_info_missing(): void {
		$this->stub_plan( false );

		$result = Search_Abilities::get_plan_info();
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_search_plan_data_unavailable', $result->get_error_code() );
	}

	public function test_ai_answers_supports_falls_back_to_filter(): void {
		$this->stub_plan( array() );
		add_filter( 'jetpack_search_ai_answers_enabled', '__return_true' );

		$result = Search_Abilities::get_plan_info();

		$this->assertIsArray( $result );
		$this->assertTrue( $result['supports_ai_answers'] );
	}

	/**
	 * Belt-and-suspenders: confirm AI_Answers and Stats classes exist so the
	 * filter pivots above match real production types.
	 */
	public function test_referenced_search_classes_exist(): void {
		$this->assertTrue( class_exists( AI_Answers::class ) );
		$this->assertTrue( class_exists( Plan::class ) );
		$this->assertTrue( class_exists( Stats::class ) );
	}
}
