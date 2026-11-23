<?php
/**
 * Tests for the Stats_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats\Abilities;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Stats\Main;
use Automattic\Jetpack\Stats\Options;
use Automattic\Jetpack\Stats\Settings;
use Automattic\Jetpack\Stats\StatsBaseTestCase;
use Automattic\Jetpack\Stats\WPCOM_Stats;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Unit tests for Stats_Abilities registration and execution.
 *
 * Run from projects/packages/stats:
 *
 *   composer phpunit -- --filter Stats_Abilities_Test
 *
 * @covers \Automattic\Jetpack\Stats\Abilities\Stats_Abilities
 * @covers \Automattic\Jetpack\Stats\Settings
 */
#[CoversClass( Stats_Abilities::class )]
#[CoversClass( Settings::class )]
class Stats_Abilities_Test extends StatsBaseTestCase {

	/**
	 * The admin user id.
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * The subscriber user id.
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * The `email` figures of get-post-detail, other than `emailed`, for a post that was not sent or whose email stats are unknown.
	 */
	private const NO_EMAIL = array(
		'sent'   => null,
		'opens'  => array(
			'total'  => null,
			'unique' => null,
			'rate'   => null,
		),
		'clicks' => array(
			'total'  => null,
			'unique' => null,
			'rate'   => null,
		),
	);

	/**
	 * {@inheritDoc}
	 */
	protected function set_up() {
		parent::set_up();

		// Force Stats\Main to re-run its constructor each test. Main is a singleton —
		// its constructor adds the `map_meta_cap` filter that maps `view_stats` to
		// `read` for configured roles, but WorDBless's _restore_hooks() wipes all
		// filters back to the state captured before test #1. Without this reset,
		// only the first test sees the cap mapping.
		self::reset_static_property( Main::class, 'instance', null );
		Main::init();

		self::$admin_id      = wp_insert_user(
			array(
				'user_login' => 'stats_abilities_admin_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		self::$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'stats_abilities_sub_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);

		// Most tests open the gate; the specific "disabled by default" test closes it explicitly.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Reset any hooks a prior test may have added for the Registrar lifecycle actions.
		// We do NOT touch the Abilities registry here — accessing it via wp_has_ability()
		// would fire wp_abilities_api_init as a side effect (WP_Abilities_Registry::get_instance()
		// does do_action() on first call), breaking the init()-hooked-correctly assertions below.
		remove_action( 'wp_abilities_api_categories_init', array( Stats_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Stats_Abilities::class, 'register_abilities' ) );
	}

	/**
	 * {@inheritDoc}
	 */
	public function tear_down() {
		Constants::clear_single_constant( 'IS_WPCOM' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'jetpack_stats_abilities_wpcom_stats' );
		remove_action( 'wp_abilities_api_categories_init', array( Stats_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Stats_Abilities::class, 'register_abilities' ) );
		wp_set_current_user( 0 );

		// Only touch the registry if it has already been instantiated by something
		// in this test (e.g., register_abilities / wp_has_ability). Otherwise this
		// would force-instantiate it and fire wp_abilities_api_init as a side effect.
		if ( did_action( 'wp_abilities_api_init' ) ) {
			$this->deregister_category_and_abilities();
		}

		// Reset Options static cache so config-writes don't leak across tests.
		self::reset_static_property( Options::class, 'options', array() );

		parent::tear_down();
	}

	/**
	 * Remove our category + abilities from the registry so tests don't bleed.
	 */
	private function deregister_category_and_abilities(): void {
		if ( function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Stats_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			if ( wp_has_ability_category( Stats_Abilities::CATEGORY_SLUG ) ) {
				wp_unregister_ability_category( Stats_Abilities::CATEGORY_SLUG );
			}
		}
	}

	/**
	 * Assert a reader's result validates against the output schema it declares, as execute() checks it.
	 *
	 * @param string $slug   Ability slug.
	 * @param mixed  $result Result of the ability's execute callback.
	 */
	private function assert_matches_output_schema( string $slug, $result ): void {
		$schema = Stats_Abilities::get_abilities()[ $slug ]['output_schema'];
		$this->assertTrue( rest_validate_value_from_schema( $result, $schema, 'result' ) );
	}

	/**
	 * Run a callable while the given Abilities API lifecycle action appears to be firing.
	 *
	 * The Registrar guards its register_* methods with `doing_action()`. Pushing onto
	 * `$wp_current_filter` simulates that the action is currently running; we always
	 * pop the entry afterward so the simulated action doesn't leak into later tests
	 * (which would corrupt `current_filter()` / `doing_action()` state).
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
			// Defensive: pop only our own entry, in case the callback pushed/popped its own actions.
			for ( $i = count( $wp_current_filter ) - 1; $i >= 0; $i-- ) {
				if ( $wp_current_filter[ $i ] === $action ) {
					array_splice( $wp_current_filter, $i, 1 );
					break;
				}
			}
		}
	}

	public function test_category_slug_is_jetpack_stats(): void {
		$this->assertSame( 'jetpack-stats', Stats_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = Stats_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotSame( '', $def['label'] );
		$this->assertNotSame( '', $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = Stats_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-stats/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly(): void {
		// Registrar auto-injects category; specs that set it are redundant and drift.
		foreach ( Stats_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_spec_declares_annotations_permission_and_execute(): void {
		foreach ( Stats_Abilities::get_abilities() as $slug => $spec ) {
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

	public function test_read_abilities_declared_readonly_and_non_destructive(): void {
		foreach ( Stats_Abilities::get_abilities() as $slug => $spec ) {
			if ( 'jetpack-stats/update-settings' === $slug ) {
				continue;
			}
			$ann = $spec['meta']['annotations'];
			$this->assertTrue( $ann['readonly'], "{$slug} should be readonly" );
			$this->assertFalse( $ann['destructive'], "{$slug} should not be destructive" );
			$this->assertTrue( $ann['idempotent'], "{$slug} should be idempotent" );
		}
	}

	public function test_read_abilities_without_required_input_have_empty_object_default(): void {
		foreach ( Stats_Abilities::get_abilities() as $slug => $spec ) {
			$schema = $spec['input_schema'];
			if ( 'jetpack-stats/update-settings' === $slug || isset( $schema['required'] ) ) {
				continue;
			}

			$this->assertSame( 'object', $schema['type'], "{$slug} input must remain an object schema." );
			$this->assertArrayHasKey( 'default', $schema, "{$slug} must default missing tunnel input to an empty object." );
			$this->assertSame( array(), $schema['default'], "{$slug} must default missing tunnel input to an empty object." );
			$this->assertTrue( rest_validate_value_from_schema( $schema['default'], $schema, 'input' ), "{$slug} must accept its empty input default." );
		}
	}

	public function test_every_input_schema_rejects_unexpected_keys_and_avoids_empty_property_arrays(): void {
		foreach ( Stats_Abilities::get_abilities() as $slug => $spec ) {
			$result = rest_validate_value_from_schema( array( 'unexpected' => 1 ), $spec['input_schema'], 'input' );
			$this->assertInstanceOf( \WP_Error::class, $result, "{$slug} must reject an unexpected key." );
			$this->assertStringNotContainsString( '"properties":[]', wp_json_encode( $spec['input_schema'], JSON_UNESCAPED_SLASHES ), "{$slug} must not list properties as a JSON array." );
		}
	}

	public function test_every_ability_opts_into_mcp_as_public_tool(): void {
		foreach ( Stats_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'public', $spec['meta'], "{$slug} must declare meta.public." );
			$this->assertSame( true, $spec['meta']['public'], "{$slug} must be marked public." );
			$this->assertSame( true, $spec['meta']['show_in_rest'], "{$slug} must be exposed through the Abilities REST API." );
			$this->assertSame( true, $spec['meta']['mcp']['public'], "{$slug} must opt into MCP." );
			$this->assertSame( 'tool', $spec['meta']['mcp']['type'], "{$slug} must be exposed as an MCP tool." );
		}
	}

	public function test_update_settings_is_a_destructive_idempotent_write(): void {
		$abilities = Stats_Abilities::get_abilities();
		$ann       = $abilities['jetpack-stats/update-settings']['meta']['annotations'];
		$this->assertFalse( $ann['readonly'] );
		$this->assertTrue( $ann['destructive'], 'update-settings overwrites saved settings, so clients must confirm it' );
		$this->assertTrue( $ann['idempotent'] );
	}

	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Stats_Abilities::init();

		$this->assertFalse(
			has_action(
				'wp_abilities_api_categories_init',
				array( Stats_Abilities::class, 'register_category' )
			)
		);
		$this->assertFalse(
			has_action(
				'wp_abilities_api_init',
				array( Stats_Abilities::class, 'register_abilities' )
			)
		);

		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true(): void {
		Stats_Abilities::init();

		$this->assertNotFalse(
			has_action(
				'wp_abilities_api_categories_init',
				array( Stats_Abilities::class, 'register_category' )
			)
		);
		$this->assertNotFalse(
			has_action(
				'wp_abilities_api_init',
				array( Stats_Abilities::class, 'register_abilities' )
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
				Stats_Abilities::register_category();
			}
		);
		$this->with_simulated_action(
			'wp_abilities_api_init',
			static function () {
				Stats_Abilities::register_abilities();
			}
		);

		foreach ( array_keys( Stats_Abilities::get_abilities() ) as $slug ) {
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
				// Allow only the zero-arg overview; deny the rest.
				if ( 'ability' === $type ) {
					return 'jetpack-stats/get-site-overview' === $slug;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->with_simulated_action(
			'wp_abilities_api_categories_init',
			static function () {
				Stats_Abilities::register_category();
			}
		);
		$this->with_simulated_action(
			'wp_abilities_api_init',
			static function () {
				Stats_Abilities::register_abilities();
			}
		);

		$this->assertTrue( wp_has_ability( 'jetpack-stats/get-site-overview' ) );
		$this->assertFalse( wp_has_ability( 'jetpack-stats/get-top-content' ) );
		$this->assertFalse( wp_has_ability( 'jetpack-stats/update-settings' ) );
	}

	public function test_can_view_stats_allows_admin(): void {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( Stats_Abilities::can_view_stats() );
	}

	public function test_can_view_stats_denies_subscriber(): void {
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( Stats_Abilities::can_view_stats() );
	}

	public function test_can_view_stats_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Stats_Abilities::can_view_stats() );
	}

	public function test_can_manage_settings_allows_admin(): void {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( Stats_Abilities::can_manage_settings() );
	}

	public function test_can_manage_settings_denies_subscriber(): void {
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( Stats_Abilities::can_manage_settings() );
	}

	public function test_get_settings_denies_a_user_who_can_only_view_stats(): void {
		Options::set_options( array( 'roles' => array( 'administrator', 'editor' ) ) );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'stats_abilities_editor_' . wp_generate_password( 8, false ),
					'user_pass'  => 'pw',
					'role'       => 'editor',
				)
			)
		);
		$spec = Stats_Abilities::get_abilities()['jetpack-stats/get-settings'];

		$this->assertTrue( Stats_Abilities::can_view_stats() );
		$this->assertFalse( call_user_func( $spec['permission_callback'] ) );
	}

	public function test_get_site_overview_returns_composed_shape(): void {
		// An offset that puts the site on a different calendar day from UTC right now.
		$offset = (int) gmdate( 'G' ) >= 12 ? 13 : -12;
		$today  = gmdate( 'Y-m-d', time() + $offset * HOUR_IN_SECONDS );
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', $offset );
		// What a calendar plugin does to wp_date() output.
		add_filter(
			'wp_date',
			static function () {
				return '1405-07-20';
			}
		);
		$requests = $this->filter_wpcom_stats( self::overview_responses() );

		$result = Stats_Abilities::get_site_overview();
		$this->assert_matches_output_schema( 'jetpack-stats/get-site-overview', $result );

		$this->assertIsArray( $result );
		$this->assertSame(
			array(
				'unit'        => 'day',
				'quantity'    => 30,
				'date'        => $today,
				'stat_fields' => 'views,visitors',
			),
			$requests['get_visits']
		);
		$this->assertSame( $today, $requests['get_top_posts']['date'] );
		$this->assertSame( $today, $result['date'] );
		$this->assertSame( 120, $result['views_today'] );
		$this->assertSame( 90, $result['visitors_today'] );
		$this->assertSame( 10 + 20 + 30 + 40 + 50 + 60 + 120, $result['views_week'] );
		$this->assertSame( 1000 + 2000 + 10 + 20 + 30 + 40 + 50 + 60 + 120, $result['views_month'] );
		$this->assertArrayNotHasKey( 'streak', $result );
		$this->assertSame(
			array(
				'id'    => 7,
				'title' => "Tea & Crumpets\u{2019} Best",
				'views' => 42,
			),
			$result['top_post']
		);
		$this->assertSame(
			array(
				'name'  => 'wordpress.com',
				'views' => 60,
			),
			$result['top_referrer']
		);
		$this->assertFalse( $result['partial'] );
		$this->assertArrayNotHasKey( 'errors', $result );
	}

	/**
	 * Last day of the latest posting streak, relative to the site's today, and whether it is still current.
	 *
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function provide_streak_ends(): array {
		return array(
			'ended yesterday'    => array( '-1 day', true ),
			'ended two days ago' => array( '-2 days', false ),
		);
	}

	/**
	 * @dataProvider provide_streak_ends
	 *
	 * @param string $ago     Offset from today to the streak's last day.
	 * @param bool   $current Whether the streak still counts as current.
	 */
	#[DataProvider( 'provide_streak_ends' )]
	public function test_get_insights_finds_the_streaks_among_the_posting_days( string $ago, bool $current ): void {
		$end  = strtotime( current_time( 'Y-m-d' ) . ' ' . $ago );
		$data = array();
		// A three-day run ending `$ago`, and a four-day run before it.
		foreach ( array( 0, 1, 2, 10, 11, 12, 13 ) as $back ) {
			$data[ (string) ( new \DateTime( gmdate( 'Y-m-d', $end - $back * DAY_IN_SECONDS ) . ' 12:00', wp_timezone() ) )->getTimestamp() ] = 1;
		}
		$this->filter_wpcom_stats( array( 'get_streak' => array( 'data' => $data ) ) );

		$streak = Stats_Abilities::get_insights()['streak'];

		$this->assertSame( $current ? 3 : 0, $streak['current_length'] );
		$this->assertSame( 4, $streak['longest_length'] );
		$this->assertSame( gmdate( 'Y-m-d', $end - 13 * DAY_IN_SECONDS ), $streak['longest_start'] );
	}

	/**
	 * A failing overview sub-call, the `errors` entry it causes, and a field it leaves unknown.
	 *
	 * @return array<string, array{0: string, 1: mixed, 2: string, 3: string, 4: mixed}>
	 */
	public static function provide_failed_overview_subcalls(): array {
		$error = new \WP_Error( 'boom', 'nope' );

		return array(
			'visits'                  => array( 'get_visits', $error, 'visits', 'views_today', null ),
			'visits body is not JSON' => array( 'get_visits', null, 'visits', 'views_month', null ),
			'top posts'               => array( 'get_top_posts', $error, 'top_posts', 'top_post', null ),
			'referrers'               => array( 'get_referrers', $error, 'referrers', 'top_referrer', null ),
		);
	}

	/**
	 * @dataProvider provide_failed_overview_subcalls
	 *
	 * @param string $method      WPCOM_Stats method that fails.
	 * @param mixed  $response    What it returns instead of stats.
	 * @param string $tag         Expected `errors` entry.
	 * @param string $field       Overview field the sub-call feeds.
	 * @param mixed  $placeholder Expected value of that field.
	 */
	#[DataProvider( 'provide_failed_overview_subcalls' )]
	public function test_get_site_overview_flags_partial_when_one_subcall_fails( string $method, $response, string $tag, string $field, $placeholder ): void {
		$this->filter_wpcom_stats( array( $method => $response ) + self::overview_responses() );

		$result = Stats_Abilities::get_site_overview();
		$this->assert_matches_output_schema( 'jetpack-stats/get-site-overview', $result );

		$this->assertIsArray( $result );
		$this->assertTrue( $result['partial'] );
		$this->assertSame( array( $tag ), $result['errors'] );
		$this->assertSame( $placeholder, $result[ $field ] );
	}

	/**
	 * Every reader, and the WordPress.com calls it makes.
	 *
	 * @return array<string, array{0: string, 1: array, 2: string[]}>
	 */
	public static function provide_reader_calls(): array {
		return array(
			'overview'    => array( 'get_site_overview', array(), array_keys( self::overview_responses() ) ),
			'top content' => array( 'get_top_content', array( 'type' => 'posts' ), array( 'get_top_posts' ) ),
			'post views'  => array( 'get_post_views', array( 'post_id' => 'new' ), array( 'get_post_views' ) ),
			'visits'      => array( 'get_visits', array(), array( 'get_visits' ) ),
			'followers'   => array( 'get_followers', array( 'period' => 'month' ), array( 'get_followers', 'get_comment_followers', 'get_publicize_followers', 'get_subscriber_counts', 'get_subscriber_history' ) ),
			'author'      => array( 'get_author_views', array( 'author_id' => 7 ), array( 'get_author_views' ) ),
			'insights'    => array( 'get_insights', array(), array( 'get_stats', 'get_insights', 'get_highlights', 'get_streak', 'get_stats_usage' ) ),
			'emails'      => array( 'get_email_stats', array(), array( 'get_email_summary' ) ),
			'email'       => array( 'get_email_detail', array( 'post_id' => 'new' ), array( 'get_email_breakdown' ) ),
			'post detail' => array( 'get_post_detail', array( 'post_id' => 'new' ), array( 'get_post_views', 'get_post_likes', 'get_utm_views', 'get_email_breakdown' ) ),
			'video'       => array( 'get_video_stats', array( 'video_id' => 'new' ), array( 'get_video_details' ) ),
			'subscribers' => array( 'get_subscribers', array(), array( 'get_subscribers' ) ),
			'ads'         => array( 'get_ad_stats', array(), array( 'get_wordads_stats', 'get_wordads_earnings' ) ),
		);
	}

	/**
	 * A reader whose every WordPress.com call fails reports an error, never an empty report.
	 *
	 * @dataProvider provide_reader_calls
	 *
	 * @param string   $reader Stats_Abilities reader.
	 * @param array    $input  Its input.
	 * @param string[] $calls  The WPCOM_Stats methods it calls.
	 */
	#[DataProvider( 'provide_reader_calls' )]
	public function test_reader_reports_an_error_when_wordpress_com_answers_nothing( string $reader, array $input, array $calls ): void {
		if ( 'new' === ( $input['post_id'] ?? null ) ) {
			$input['post_id'] = wp_insert_post(
				array(
					'post_title'  => 'Hello',
					'post_status' => 'publish',
				)
			);
		}
		if ( 'new' === ( $input['video_id'] ?? null ) ) {
			$input['video_id'] = wp_insert_post( array( 'post_type' => 'attachment' ) );
		}
		$this->filter_wpcom_stats( array_fill_keys( $calls, new \WP_Error( 'wpcom_boom', 'nope' ) ) );

		$this->assertInstanceOf( \WP_Error::class, Stats_Abilities::$reader( $input ) );
	}

	/**
	 * @return array<string, array{0: string, 1: array, 2: string}>
	 */
	public static function provide_invalid_reader_input(): array {
		$bad_day = '2026-04-31';
		return array(
			'post views date'  => array(
				'get_post_views',
				array(
					'post_id' => 1,
					'date'    => $bad_day,
				),
				'jetpack_stats_invalid_date',
			),
			'visits date'      => array( 'get_visits', array( 'date' => $bad_day ), 'jetpack_stats_invalid_date' ),
			'visits compare'   => array( 'get_visits', array( 'compare' => 'last-decade' ), 'jetpack_stats_invalid_compare' ),
			'followers date'   => array(
				'get_followers',
				array(
					'period' => 'month',
					'date'   => $bad_day,
				),
				'jetpack_stats_invalid_date',
			),
			'author missing'   => array( 'get_author_views', array(), 'jetpack_stats_missing_author_id' ),
			'author date'      => array(
				'get_author_views',
				array(
					'author_id' => 7,
					'date'      => $bad_day,
				),
				'jetpack_stats_invalid_date',
			),
			'emails start'     => array( 'get_email_stats', array( 'start_date' => $bad_day ), 'jetpack_stats_invalid_date' ),
			'emails empty end' => array( 'get_email_stats', array( 'end_date' => '' ), 'jetpack_stats_invalid_date' ),
			'email missing'    => array( 'get_email_detail', array(), 'jetpack_stats_missing_post_id' ),
			'email no post'    => array( 'get_email_detail', array( 'post_id' => 999999 ), 'jetpack_stats_post_not_found' ),
			'detail missing'   => array( 'get_post_detail', array( 'post_id' => '0' ), 'jetpack_stats_missing_post_id' ),
			'detail no post'   => array( 'get_post_detail', array( 'post_id' => 999999 ), 'jetpack_stats_post_not_found' ),
			'detail private'   => array( 'get_post_detail', array( 'post_id' => 'private' ), 'jetpack_stats_post_not_found' ),
			'detail draft'     => array( 'get_post_detail', array( 'post_id' => 'draft' ), 'jetpack_stats_post_not_found' ),
			'video missing'    => array( 'get_video_stats', array( 'video_id' => 0 ), 'jetpack_stats_missing_video_id' ),
			'video date'       => array(
				'get_video_stats',
				array(
					'video_id' => 1,
					'date'     => $bad_day,
				),
				'jetpack_stats_invalid_date',
			),
			'video no video'   => array( 'get_video_stats', array( 'video_id' => 999999 ), 'jetpack_stats_video_not_found' ),
			'ads date'         => array( 'get_ad_stats', array( 'date' => $bad_day ), 'jetpack_stats_invalid_date' ),
		);
	}

	/**
	 * A reader refuses input it cannot answer for, instead of answering a different question.
	 *
	 * @dataProvider provide_invalid_reader_input
	 *
	 * @param string $reader Stats_Abilities reader.
	 * @param array  $input  Its input.
	 * @param string $code   The error code it returns.
	 */
	#[DataProvider( 'provide_invalid_reader_input' )]
	public function test_reader_refuses_invalid_input( string $reader, array $input, string $code ): void {
		// A post the subscriber cannot open on the site, named by its status.
		if ( in_array( $input['post_id'] ?? null, array( 'private', 'draft' ), true ) ) {
			$input['post_id'] = wp_insert_post(
				array(
					'post_title'  => 'Unannounced',
					'post_status' => $input['post_id'],
				)
			);
			wp_set_current_user( self::$subscriber_id );
		}
		$this->filter_wpcom_stats( array() );

		$result = Stats_Abilities::$reader( $input );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( $code, $result->get_error_code() );
	}

	public function test_get_top_content_rejects_missing_type(): void {
		$result = Stats_Abilities::get_top_content( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_missing_type', $result->get_error_code() );
	}

	public function test_get_top_content_posts_uniform_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_top_posts' => self::days_fixture(
					'postviews',
					array(
						array(
							'id'    => 1,
							'title' => 'Alpha',
							'views' => 100,
							'href'  => 'https://x/alpha',
						),
						array(
							'id'    => 2,
							'title' => 'Beta',
							'views' => 50,
							'href'  => 'https://x/beta',
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'posts',
				'date' => '2026-04-23',
				'max'  => 5,
			)
		);
		$this->assert_matches_output_schema( 'jetpack-stats/get-top-content', $result );

		$this->assertSame( 'posts', $result['type'] );
		$this->assertSame( 'day', $result['period'] );
		$this->assertSame( '2026-04-23', $result['date'] );
		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 1, $result['items'][0]['rank'] );
		$this->assertSame( 'Alpha', $result['items'][0]['label'] );
		$this->assertSame( 100, $result['items'][0]['value'] );
		$this->assertSame( 'https://x/alpha', $result['items'][0]['href'] );
		$this->assertSame( 1, $result['items'][0]['id'] );
		$this->assertSame( 2, $result['items'][1]['rank'] );
	}

	/**
	 * Responses to a `summarize=1` request, as WPCOM shapes them per endpoint.
	 *
	 * @return array<string, array{0: string, 1: string, 2: array}>
	 */
	public static function provide_summarized_top_content(): array {
		$rows = static function ( string $label_key, string $value_key ): array {
			return array(
				array(
					$label_key => 'Across the range',
					$value_key => 70,
				),
			);
		};
		$day  = self::days_fixture( 'postviews', array( array( 'title' => 'Only the first day' ) ) );

		return array(
			'posts'       => array( 'posts', 'get_top_posts', $day + array( 'summary' => array( 'postviews' => $rows( 'title', 'views' ) ) ) ),
			'video plays' => array(
				'video-plays',
				'get_video_plays',
				array(
					'days' => array(
						'2026-04-23' => array( 'plays' => array( array( 'title' => 'Only the first day' ) ) ),
						'summary'    => array( 'plays' => $rows( 'title', 'plays' ) ),
					),
				),
			),
		);
	}

	/**
	 * @dataProvider provide_summarized_top_content
	 *
	 * @param string $type     Content type.
	 * @param string $method   WPCOM_Stats method backing the type.
	 * @param array  $response Fixture response.
	 */
	#[DataProvider( 'provide_summarized_top_content' )]
	public function test_get_top_content_totals_every_period_when_num_is_above_one( string $type, string $method, array $response ): void {
		$requests = $this->filter_wpcom_stats( array( $method => $response ) );

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => $type,
				'num'  => 90,
			)
		);

		$this->assertSame( 90, $requests[ $method ]['num'] );
		$this->assertSame( 'day', $requests[ $method ]['period'] );
		$this->assertSame( current_time( 'Y-m-d' ), $requests[ $method ]['date'] );
		$this->assertSame( 1, $requests[ $method ]['summarize'] );
		$this->assertSame( 'Across the range', $result['items'][0]['label'] );
		$this->assertSame( 70, $result['items'][0]['value'] );
	}

	/**
	 * Periods and an end date, and the days WPCOM is asked to total.
	 *
	 * @return array<string, array{0: string, 1: int, 2: string, 3: string, 4: int}>
	 */
	public static function provide_summary_windows(): array {
		return array(
			// February 1 to April 30, 2026.
			'past months'          => array( 'month', 3, '2026-04-23', '2026-04-30', 28 + 31 + 30 ),
			// Monday March 30 to Sunday April 26, 2026.
			'past weeks'           => array( 'week', 4, '2026-04-23', '2026-04-26', 28 ),
			// January 1, 2024 to December 31, 2025.
			'past years'           => array( 'year', 2, '2025-06-01', '2025-12-31', 366 + 365 ),
			'days end on the date' => array( 'day', 7, '2026-04-23', '2026-04-23', 7 ),
		);
	}

	/**
	 * @dataProvider provide_summary_windows
	 *
	 * @param string $period   Requested period.
	 * @param int    $num      Requested number of periods.
	 * @param string $date     Requested date.
	 * @param string $end      Expected last day sent to WPCOM.
	 * @param int    $days     Expected number of days sent to WPCOM.
	 */
	#[DataProvider( 'provide_summary_windows' )]
	public function test_get_top_content_asks_for_the_days_the_periods_cover( string $period, int $num, string $date, string $end, int $days ): void {
		$requests = $this->filter_wpcom_stats( array( 'get_top_posts' => array( 'summary' => array( 'postviews' => array() ) ) ) );

		$result = Stats_Abilities::get_top_content(
			array(
				'type'   => 'posts',
				'period' => $period,
				'num'    => $num,
				'date'   => $date,
			)
		);

		$this->assertSame(
			array(
				'period'    => 'day',
				'date'      => $end,
				'max'       => 21,
				'num'       => $days,
				'summarize' => 1,
			),
			$requests['get_top_posts']
		);
		$this->assertSame( $period, $result['period'] );
		$this->assertSame( $num, $result['num'] );
		$this->assertSame( $date, $result['date'] );
	}

	public function test_get_top_content_does_not_count_days_after_today(): void {
		$today    = current_time( 'Y-m-d' );
		$requests = $this->filter_wpcom_stats( array( 'get_top_posts' => array( 'summary' => array( 'postviews' => array() ) ) ) );

		Stats_Abilities::get_top_content(
			array(
				'type'   => 'posts',
				'period' => 'year',
				'num'    => 2,
				'date'   => $today,
			)
		);

		$first = ( (int) substr( $today, 0, 4 ) - 1 ) . '-01-01';
		$this->assertSame( $today, $requests['get_top_posts']['date'] );
		$this->assertSame( (int) ( new \DateTimeImmutable( $first ) )->diff( new \DateTimeImmutable( $today ) )->days + 1, $requests['get_top_posts']['num'] );
	}

	public function test_get_top_content_search_terms_uniform_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_search_terms' => self::days_fixture(
					'search_terms',
					array(
						array(
							'term'  => 'jetpack',
							'views' => 20,
						),
						array(
							'term'  => 'stats',
							'views' => 7,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'search-terms',
				'date' => '2026-04-23',
			)
		);

		$this->assertSame( 'search-terms', $result['type'] );
		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'jetpack', $result['items'][0]['label'] );
		$this->assertSame( 20, $result['items'][0]['value'] );
		// No href for search terms.
		$this->assertArrayNotHasKey( 'href', $result['items'][0] );
	}

	public function test_get_top_content_countries_use_country_names_and_one_unknown_row(): void {
		$row = static function ( string $code, int $views ): array {
			return array(
				'country_code' => $code,
				'views'        => $views,
			);
		};
		$this->filter_wpcom_stats(
			array(
				'get_views_by_country' => array(
					'days'         => array(
						'2026-04-23' => array(
							'views' => array( $row( 'FR', 12 ), $row( 'DE', 9 ), $row( '-', 6 ), $row( 'AP', 5 ), $row( 'A1', 3 ) ),
						),
					),
					'country-info' => array(
						'FR' => array( 'country_full' => 'France' ),
						'DE' => array( 'country_full' => 'Germany' ),
						'AP' => array( 'country_full' => false ),
					),
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'countries',
				'date' => '2026-04-23',
				'max'  => 3,
			)
		);

		$this->assertSame(
			array( 'France', 'Unknown', 'Germany' ),
			array_column( $result['items'], 'label' )
		);
		$this->assertSame( array( 12, 6 + 5, 9 ), array_column( $result['items'], 'value' ) );
		// Folding left three items, but WordPress.com sent more rows than `max`, so more may exist.
		$this->assertTrue( $result['truncated'] );
	}

	public function test_get_top_content_tags_names_every_term_a_row_groups(): void {
		$term = static function ( string $type, string $name ): array {
			return array(
				'type' => $type,
				'name' => $name,
				'link' => 'https://x/' . $type . '/' . strtolower( $name ),
			);
		};
		$this->filter_wpcom_stats(
			array(
				'get_tags' => array(
					'date' => '2026-04-23',
					'tags' => array(
						array(
							'tags'  => array( $term( 'category', 'News' ) ),
							'views' => '18',
						),
						array(
							'tags'  => array( $term( 'tag', 'Announcements' ), $term( 'tag', 'Release' ) ),
							'views' => 7,
						),
					),
				),
			)
		);

		$result = Stats_Abilities::get_top_content( array( 'type' => 'tags' ) );
		$this->assert_matches_output_schema( 'jetpack-stats/get-top-content', $result );

		$this->assertSame(
			array(
				array(
					'rank'  => 1,
					'label' => 'News',
					'value' => 18,
					'href'  => 'https://x/category/news',
				),
				array(
					'rank'  => 2,
					'label' => 'Announcements, Release',
					'value' => 7,
				),
			),
			$result['items']
		);
	}

	/**
	 * A top-content type, the WPCOM response for it, and the items `expand=true, max=1` returns.
	 */
	public static function provide_expanded_rows(): array {
		$link = static function ( string $name, int $views, $children = null ): array {
			return array(
				'name'     => $name,
				'url'      => 'https://href.li/?https://' . $name,
				'views'    => $views,
				'children' => $children,
			);
		};
		$day  = static function ( array $block ): array {
			return array( 'days' => array( '2026-04-23' => $block ) );
		};
		return array(
			'referrers nest pages and keep each level to max' => array(
				'referrers',
				'get_referrers',
				$day(
					array(
						'groups' => array(
							array(
								'name'    => 'Search Engines',
								'total'   => 9,
								'results' => array( $link( 'google.com', 8, array( $link( 'google.com/a', 5 ), $link( 'google.com/b', 3 ) ) ), $link( 'bing.com', 1 ) ),
							),
							array(
								'name'    => 'Reader',
								'total'   => 4,
								'results' => array( 'views' => 4 ),
							),
						),
					)
				),
				array(
					array(
						'rank'     => 1,
						'label'    => 'Search Engines',
						'value'    => 9,
						'children' => array(
							array(
								'label'    => 'google.com',
								'value'    => 8,
								'href'     => 'https://google.com',
								'children' => array(
									array(
										'label' => 'google.com/a',
										'value' => 5,
										'href'  => 'https://google.com/a',
									),
								),
							),
						),
					),
				),
			),
			'clicks list the links under a domain' => array(
				'clicks',
				'get_clicks',
				$day( array( 'clicks' => array( $link( 'example.com', 3, array( $link( 'example.com/x', 2 ), $link( 'example.com/y', 1 ) ) ) ) ) ),
				array(
					array(
						'rank'     => 1,
						'label'    => 'example.com',
						'value'    => 3,
						'href'     => 'https://example.com',
						'children' => array(
							array(
								'label' => 'example.com/x',
								'value' => 2,
								'href'  => 'https://example.com/x',
							),
						),
					),
				),
			),
			'tags list each term without a value of its own' => array(
				'tags',
				'get_tags',
				array(
					'tags' => array(
						array(
							'tags'  => array(
								array(
									'type' => 'tag',
									'name' => 'Release',
									'link' => 'https://x/tag/release',
								),
								array(
									'type' => 'category',
									'name' => 'News',
									'link' => 'https://x/category/news',
								),
							),
							'views' => 7,
						),
					),
				),
				array(
					array(
						'rank'     => 1,
						'label'    => 'Release, News',
						'value'    => 7,
						'children' => array(
							array(
								'label' => 'Release',
								'href'  => 'https://x/tag/release',
								'type'  => 'tag',
							),
						),
					),
				),
			),
		);
	}

	/**
	 * @dataProvider provide_expanded_rows
	 *
	 * @param string $type     Top-content type.
	 * @param string $method   WPCOM_Stats method that serves it.
	 * @param array  $response WPCOM response.
	 * @param array  $items    Expected items.
	 */
	#[DataProvider( 'provide_expanded_rows' )]
	public function test_get_top_content_expand_returns_the_rows_each_item_groups( string $type, string $method, array $response, array $items ): void {
		$this->filter_wpcom_stats( array( $method => $response ) );

		$expanded = Stats_Abilities::get_top_content(
			array(
				'type'   => $type,
				'max'    => 1,
				'expand' => true,
			)
		);
		$this->assertSame( $items, $expanded['items'] );
		$this->assertArrayHasKey( 'children', $expanded['definitions'] );

		// Without expand, the same items carry no children.
		$plain = Stats_Abilities::get_top_content(
			array(
				'type' => $type,
				'max'  => 1,
			)
		);
		$this->assertSame( array( array_diff_key( $items[0], array( 'children' => 0 ) ) ), $plain['items'] );
		$this->assertArrayNotHasKey( 'children', $plain['definitions'] );
	}

	/**
	 * Cap, requested row count, and whether rows were left out.
	 */
	public static function provide_max_caps(): array {
		return array(
			'cap below the rows'  => array( 2, 3, 2, true ),
			'cap equals the rows' => array( 3, 4, 3, false ),
			'max=0 returns all'   => array( 0, 0, 3, false ),
		);
	}

	/**
	 * @dataProvider provide_max_caps
	 *
	 * @param int  $max       Requested cap.
	 * @param int  $requested Rows asked of WPCOM.
	 * @param int  $count     Items returned.
	 * @param bool $truncated Expected truncated flag.
	 */
	#[DataProvider( 'provide_max_caps' )]
	public function test_get_top_content_caps_items_and_flags_truncation( int $max, int $requested, int $count, bool $truncated ): void {
		$rows     = array(
			array(
				'title' => 'A',
				'views' => 3,
			),
			array(
				'title' => 'B',
				'views' => 2,
			),
			array(
				'title' => 'C',
				'views' => 1,
			),
		);
		$requests = $this->filter_wpcom_stats(
			array(
				// WPCOM returns at most the rows asked for, and every row for max=0.
				'get_top_posts' => self::days_fixture( 'postviews', 0 === $requested ? $rows : array_slice( $rows, 0, $requested ) ),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'posts',
				'max'  => $max,
			)
		);

		$this->assertSame( $requested, $requests['get_top_posts']['max'] );
		$this->assertCount( $count, $result['items'] );
		$this->assertSame( $max, $result['max'] );
		$this->assertSame( $truncated, $result['truncated'] );
	}

	public function test_get_top_content_referrers_normalizes_groups_shape(): void {
		// Regression guard: WPCOM `stats/referrers` keys per-day data under `groups`,
		// not `referrers`. The mapping must read from `groups -> name/total/url?`.
		$this->filter_wpcom_stats(
			array(
				'get_referrers' => self::days_fixture(
					'groups',
					array(
						array(
							'name'  => 'wordpress.com',
							'url'   => 'https://wordpress.com',
							'total' => 60,
						),
						array(
							'name'  => 'Search Engines',
							'total' => 25,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'referrers',
				'date' => '2026-04-23',
			)
		);

		$this->assertSame( 'referrers', $result['type'] );
		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'wordpress.com', $result['items'][0]['label'] );
		$this->assertSame( 60, $result['items'][0]['value'] );
		$this->assertSame( 'https://wordpress.com', $result['items'][0]['href'] );
		$this->assertSame( 'Search Engines', $result['items'][1]['label'] );
		$this->assertSame( 25, $result['items'][1]['value'] );
		$this->assertArrayNotHasKey( 'href', $result['items'][1] );
	}

	public function test_get_top_content_clicks_uniform_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_clicks' => self::days_fixture(
					'clicks',
					array(
						array(
							'name'  => 'Docs',
							'url'   => 'https://docs.example/x',
							'views' => 9,
						),
						array(
							// No `name` — normalization should fall back to `url`.
							'url'   => 'https://example.com/y',
							'views' => 3,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'clicks',
				'date' => '2026-04-23',
			)
		);

		$this->assertSame( 'clicks', $result['type'] );
		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'Docs', $result['items'][0]['label'] );
		$this->assertSame( 9, $result['items'][0]['value'] );
		$this->assertSame( 'https://docs.example/x', $result['items'][0]['href'] );
		$this->assertSame( 'https://example.com/y', $result['items'][1]['label'] );
		$this->assertSame( 'https://example.com/y', $result['items'][1]['href'] );
	}

	public function test_get_top_content_authors_uniform_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_top_authors' => self::days_fixture(
					'authors',
					array(
						array(
							'name'  => 'Ada',
							'views' => 80,
						),
						array(
							'name'  => 'Grace',
							'views' => 30,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'authors',
				'date' => '2026-04-23',
			)
		);

		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'Ada', $result['items'][0]['label'] );
		$this->assertSame( 80, $result['items'][0]['value'] );
		$this->assertArrayNotHasKey( 'href', $result['items'][0] );
	}

	public function test_get_top_content_downloads_uniform_shape(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->filter_wpcom_stats(
			array(
				'get_file_downloads' => self::days_fixture(
					'files',
					array(
						array(
							'filename'     => 'whitepaper.pdf',
							'relative_url' => '/downloads/whitepaper.pdf',
							'download_url' => 'https://x/downloads/whitepaper.pdf',
							'downloads'    => '42',
						),
						array(
							// No `filename` or `download_url` — normalization should fall back to relative_url.
							'relative_url' => '/downloads/spec.zip',
							'downloads'    => '7',
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'downloads',
				'date' => '2026-04-23',
			)
		);

		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'whitepaper.pdf', $result['items'][0]['label'] );
		$this->assertSame( 42, $result['items'][0]['value'] );
		$this->assertSame( 'https://x/downloads/whitepaper.pdf', $result['items'][0]['href'] );
		$this->assertSame( '/downloads/spec.zip', $result['items'][1]['label'] );
		$this->assertSame( 7, $result['items'][1]['value'] );
		$this->assertSame( '/downloads/spec.zip', $result['items'][1]['href'] );
	}

	public function test_get_top_content_downloads_is_refused_on_jetpack_sites_without_asking_wpcom(): void {
		$requests = $this->filter_wpcom_stats( array( 'get_file_downloads' => array() ) );

		$result = Stats_Abilities::get_top_content( array( 'type' => 'downloads' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_invalid_type', $result->get_error_code() );
		$this->assertArrayNotHasKey( 'get_file_downloads', $requests );
	}

	public function test_get_top_content_video_plays_uniform_shape(): void {
		$this->filter_wpcom_stats(
			array(
				'get_video_plays' => self::days_fixture(
					'plays',
					array(
						array(
							'post_id' => 34,
							'title'   => 'Launch demo',
							'plays'   => 200,
						),
						array(
							'title' => 'Tutorial',
							'plays' => 75,
						),
					)
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'video-plays',
				'date' => '2026-04-23',
			)
		);

		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 'Launch demo', $result['items'][0]['label'] );
		$this->assertSame( 200, $result['items'][0]['value'] );
		$this->assertSame( 34, $result['items'][0]['id'] );
		$this->assertArrayNotHasKey( 'href', $result['items'][0] );
	}

	public function test_get_video_stats_reads_one_video_over_time(): void {
		$video_id = wp_insert_post(
			array(
				'post_type'  => 'attachment',
				'post_title' => 'Launch demo',
			)
		);
		$requests = $this->filter_wpcom_stats(
			array(
				'get_video_details' => array(
					'fields'       => array( 'period', 'plays' ),
					'data'         => array( array( '2026-03-01', 141 ), array( '2026-04-01', 81 ) ),
					'total'        => array( 'plays' => 222 ),
					'pages_detail' => array(
						array(
							'url'     => 'https://example.com/launch',
							'post_id' => 41,
							'title'   => 'Launch &amp; demo',
						),
						array(
							'url'     => 'https://elsewhere.example/embed',
							'post_id' => null,
							'title'   => null,
						),
					),
				),
			)
		);

		$result = Stats_Abilities::get_video_stats(
			array(
				'video_id' => (string) $video_id,
				'period'   => 'month',
				'num'      => 2,
				'date'     => '2026-04-23',
			)
		);

		$this->assert_matches_output_schema( 'jetpack-stats/get-video-stats', $result );
		$this->assertSame(
			array(
				$video_id,
				array(
					'statType' => 'plays',
					'period'   => 'month',
					'num'      => 2,
					'date'     => '2026-04-23',
				),
			),
			$requests['get_video_details']
		);
		$this->assertSame( 'Launch demo', $result['title'] );
		$this->assertSame( 222, $result['total_plays'] );
		$this->assertSame(
			array(
				'date'  => '2026-04-01',
				'plays' => 81,
			),
			$result['series'][1]
		);
		$this->assertSame( 'Launch & demo', $result['pages'][0]['title'] );
		$this->assertNull( $result['pages'][1]['post_id'] );
	}

	public function test_get_post_views_rejects_missing_post_id(): void {
		$result = Stats_Abilities::get_post_views( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_missing_post_id', $result->get_error_code() );
	}

	public function test_get_post_views_rejects_post_id_zero(): void {
		// Regression guard: post ID 0 is not a legal post; but our validation uses `> 0`, not `empty()`,
		// which means a future ID-like value of string "0" behaves deterministically (also rejected
		// by the positive check, not accidentally by falsy coercion).
		$result = Stats_Abilities::get_post_views( array( 'post_id' => '0' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_missing_post_id', $result->get_error_code() );
	}

	public function test_get_post_views_rejects_non_numeric_post_id(): void {
		$result = Stats_Abilities::get_post_views( array( 'post_id' => 'not-a-number' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_get_post_views_accepts_numeric_string(): void {
		$post_id = wp_insert_post( array( 'post_title' => 'Hello' ) );
		$this->filter_wpcom_stats(
			array(
				'get_post_views' => array(
					'views'  => 42,
					'fields' => array( 'period', 'views' ),
					'data'   => array(
						array( '2026-04-22', 20 ),
						array( '2026-04-23', 22 ),
					),
				),
			)
		);

		$result = Stats_Abilities::get_post_views(
			array(
				'post_id' => (string) $post_id,
				'num'     => 2,
				'date'    => '2026-04-23',
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( $post_id, $result['post_id'] );
		$this->assertSame( 42, $result['total_views'] );
		$this->assertCount( 2, $result['series'] );
		$this->assertSame(
			array(
				'date'  => '2026-04-22',
				'views' => 20,
			),
			$result['series'][0]
		);
	}

	/**
	 * Daily rows from WPCOM and the series each period should total them into.
	 *
	 * @return array<string, array{0: string, 1: array, 2: array}>
	 */
	public static function provide_post_view_periods(): array {
		$daily = array(
			array( '2026-08-31', 7 ), // Before every window below.
			array( '2026-09-27', 1 ), // Sunday: the week of Monday 2026-09-21.
			array( '2026-09-28', 2 ),
			array( '2026-10-04', 3 ),
			array( '2026-10-05', 4 ),
			array( '2026-10-08', 5 ),
		);
		$row   = static function ( string $date, int $views ): array {
			return array(
				'date'  => $date,
				'views' => $views,
			);
		};

		return array(
			'week'    => array( 'week', $daily, array( $row( '2026-09-14', 0 ), $row( '2026-09-21', 1 ), $row( '2026-09-28', 2 + 3 ), $row( '2026-10-05', 4 + 5 ) ) ),
			'month'   => array( 'month', $daily, array( $row( '2026-09-01', 1 + 2 ), $row( '2026-10-01', 3 + 4 + 5 ) ) ),
			'quarter' => array( 'quarter', $daily, array( $row( '2026-04-01', 0 ), $row( '2026-07-01', 7 + 1 + 2 ), $row( '2026-10-01', 3 + 4 + 5 ) ) ),
		);
	}

	/**
	 * @dataProvider provide_post_view_periods
	 *
	 * @param string $period   Requested period.
	 * @param array  $daily    WPCOM `data` rows.
	 * @param array  $expected Expected series.
	 */
	#[DataProvider( 'provide_post_view_periods' )]
	public function test_get_post_views_totals_days_into_the_requested_periods( string $period, array $daily, array $expected ): void {
		$post_id = wp_insert_post( array( 'post_title' => 'Hello' ) );
		$this->filter_wpcom_stats(
			array(
				'get_post_views' => array(
					'views' => 100,
					'data'  => $daily,
				),
			)
		);

		$result = Stats_Abilities::get_post_views(
			array(
				'post_id' => $post_id,
				'period'  => $period,
				'num'     => count( $expected ),
				'date'    => '2026-10-08',
			)
		);
		$this->assert_matches_output_schema( 'jetpack-stats/get-post-views', $result );

		$this->assertSame( $expected, $result['series'] );
	}

	public function test_get_post_views_reports_unknown_views_without_a_total(): void {
		$post_id = wp_insert_post( array( 'post_title' => 'Hello' ) );
		$this->filter_wpcom_stats( array( 'get_post_views' => array( 'data' => array() ) ) );

		$result = Stats_Abilities::get_post_views(
			array(
				'post_id' => $post_id,
				'num'     => 3,
			)
		);
		$this->assert_matches_output_schema( 'jetpack-stats/get-post-views', $result );

		$this->assertNull( $result['total_views'] );
		$this->assertSame( array( null, null, null ), array_column( $result['series'], 'views' ) );
	}

	public function test_get_post_views_reports_an_unknown_post_without_asking_wpcom(): void {
		$requests = $this->filter_wpcom_stats( array( 'get_post_views' => array() ) );

		$result = Stats_Abilities::get_post_views( array( 'post_id' => 99999999 ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_post_not_found', $result->get_error_code() );
		$this->assertArrayNotHasKey( 'get_post_views', $requests );
	}

	/**
	 * Dates that pass the input schema's pattern but name no real day.
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function provide_invalid_dates(): array {
		return array(
			'April 31'         => array( '2026-04-31' ),
			'trailing newline' => array( "2026-04-23\n" ),
		);
	}

	/**
	 * @dataProvider provide_invalid_dates
	 *
	 * @param string $date Requested date.
	 */
	#[DataProvider( 'provide_invalid_dates' )]
	public function test_get_top_content_rejects_an_invalid_date_instead_of_answering_for_today( string $date ): void {
		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'posts',
				'date' => $date,
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_invalid_date', $result->get_error_code() );
	}

	public function test_get_visits_normalizes_series_rows(): void {
		$requests = $this->filter_wpcom_stats(
			array(
				'get_visits' => array(
					'fields' => array( 'period', 'views', 'visitors' ),
					'data'   => array(
						// WPCOM labels each week with its Monday.
						array( '2026W04W13', 100, 70 ),
						array( '2026W04W20', 120, 90 ),
					),
				),
			)
		);

		$result = Stats_Abilities::get_visits(
			array(
				'period' => 'week',
				'num'    => 2,
			)
		);

		$this->assertSame(
			array(
				'unit'        => 'week',
				'quantity'    => 2,
				'date'        => $result['date'],
				'stat_fields' => 'views,visitors',
			),
			$requests['get_visits']
		);
		$this->assertSame( 'week', $result['period'] );
		$this->assertSame( 2, $result['num'] );
		$this->assertSame( array( 'views', 'visitors' ), $result['fields'] );
		$this->assertCount( 2, $result['series'] );
		$this->assertSame(
			array(
				'date'     => '2026-04-13',
				'views'    => 100,
				'visitors' => 70,
			),
			$result['series'][0]
		);
	}

	public function test_get_visits_reports_requested_fields_it_could_not_read_as_null(): void {
		// Every requested field is on every row, so the agent can iterate uniformly.
		$this->filter_wpcom_stats(
			array(
				'get_visits' => array(
					'fields' => array( 'period', 'views', 'comments' ),
					'data'   => array( array( '2026-04-23', 100, -1 ) ),
				),
			)
		);

		$result = Stats_Abilities::get_visits( array( 'fields' => array( 'views', 'likes', 'comments' ) ) );
		$this->assert_matches_output_schema( 'jetpack-stats/get-visits', $result );

		$this->assertSame( array( 'views', 'likes', 'comments' ), $result['fields'] );
		$this->assertSame( 100, $result['series'][0]['views'] );
		$this->assertNull( $result['series'][0]['likes'], 'A field WordPress.com did not send is unknown, not 0.' );
		$this->assertNull( $result['series'][0]['comments'], 'WordPress.com sends -1 when it could not count.' );
	}

	/**
	 * Visits windows and the end date each preset compares them with.
	 */
	public static function provide_compare_windows(): array {
		return array(
			'previous days'                  => array( 'day', 7, '2026-04-23', 'previous-period', '2026-04-16' ),
			'days rounded up to whole weeks' => array( 'day', 10, '2026-04-23', 'previous-period-match-day-of-week', '2026-04-09' ),
			'leap day a year earlier'        => array( 'day', 1, '2024-02-29', 'previous-year', '2023-02-28' ),
			'days 52 weeks earlier'          => array( 'day', 7, '2026-04-23', 'previous-year-match-day-of-week', '2025-04-24' ),
			'previous weeks'                 => array( 'week', 4, '2026-04-23', 'previous-period', '2026-03-26' ),
			'weeks a year earlier'           => array( 'week', 4, '2026-04-23', 'previous-year', '2025-04-24' ),
			'month to date'                  => array( 'month', 2, '2026-11-03', 'previous-period', '2026-09-03' ),
			'a 31st clamped to a 30th'       => array( 'month', 1, '2026-10-31', 'previous-period', '2026-09-30' ),
			'month end stays month end'      => array( 'month', 1, '2026-03-31', 'previous-period', '2026-02-28' ),
			'months a year earlier'          => array( 'month', 3, '2026-03-31', 'previous-year', '2025-03-31' ),
			'previous years'                 => array( 'year', 2, '2026-04-23', 'previous-period', '2024-04-23' ),
			'previous quarters'              => array( 'quarter', 2, '2026-11-18', 'previous-period', '2026-05-18' ),
			'quarter end stays quarter end'  => array( 'quarter', 1, '2026-12-31', 'previous-period', '2026-09-30' ),
			'quarters a year earlier'        => array( 'quarter', 4, '2026-11-18', 'previous-year', '2025-11-18' ),
		);
	}

	/**
	 * @dataProvider provide_compare_windows
	 *
	 * @param string $period  Requested period.
	 * @param int    $num     Requested number of periods.
	 * @param string $date    Requested date.
	 * @param string $preset  Comparison preset.
	 * @param string $compare Expected end date of the compared window.
	 */
	#[DataProvider( 'provide_compare_windows' )]
	public function test_get_visits_compares_the_window_the_preset_names( string $period, int $num, string $date, string $preset, string $compare ): void {
		$requests = $this->filter_wpcom_stats(
			array(
				'get_visits' => array(
					'fields' => array( 'period', 'views' ),
					'data'   => array( array( '2026-04-01', 5 ) ),
				),
			)
		);

		$result = Stats_Abilities::get_visits(
			array(
				'period'  => $period,
				'num'     => $num,
				'date'    => $date,
				'fields'  => array( 'views' ),
				'compare' => $preset,
			)
		);

		// The second read is the compared window: the same periods, ending earlier.
		$this->assertSame(
			array(
				'date'        => $compare,
				'unit'        => $period,
				'quantity'    => $num,
				'stat_fields' => 'views',
			),
			$requests['get_visits']
		);
		$this->assertSame( $preset, $result['comparison']['preset'] );
		$this->assertSame( $compare, $result['comparison']['date'] );
		$this->assertSame( $result['series'], $result['comparison']['series'] );
		$this->assertArrayHasKey( 'comparison', $result['definitions'] );
	}

	public function test_get_visits_flags_a_comparison_it_could_not_read(): void {
		$stub = $this->createStub( WPCOM_Stats::class );
		$stub->method( 'get_visits' )->willReturnOnConsecutiveCalls(
			array(
				'fields' => array( 'period', 'views' ),
				'data'   => array( array( '2026-04-01', 5 ) ),
			),
			new \WP_Error( 'boom', 'bad' )
		);
		add_filter(
			'jetpack_stats_abilities_wpcom_stats',
			static function () use ( $stub ) {
				return $stub;
			}
		);

		$result = Stats_Abilities::get_visits(
			array(
				'date'    => '2026-04-01',
				'fields'  => array( 'views' ),
				'compare' => 'previous-period',
			)
		);

		$this->assertSame(
			array(
				array(
					'date'  => '2026-04-01',
					'views' => 5,
				),
			),
			$result['series']
		);
		$this->assertNull( $result['comparison']['series'] );
		$this->assertTrue( $result['partial'] );
		$this->assertSame( array( 'comparison' ), $result['errors'] );
	}

	public function test_get_visits_refuses_to_line_up_months_or_years_by_weekday(): void {
		$this->filter_wpcom_stats( array( 'get_visits' => array() ) );

		foreach ( array( 'month', 'quarter', 'year' ) as $period ) {
			$result = Stats_Abilities::get_visits(
				array(
					'period'  => $period,
					'compare' => 'previous-year-match-day-of-week',
				)
			);
			$this->assertInstanceOf( \WP_Error::class, $result );
			$this->assertSame( 'jetpack_stats_invalid_compare', $result->get_error_code() );
		}
	}

	public function test_get_site_overview_compares_each_figure_with_its_shifted_window(): void {
		$utc   = new \DateTimeZone( 'UTC' );
		$today = \DateTimeImmutable::createFromFormat( '!Y-m-d', current_time( 'Y-m-d' ), $utc );
		$data  = array();
		// 90 days ending today, each with views equal to how many days ago it was.
		for ( $ago = 89; $ago >= 0; $ago-- ) {
			if ( 45 === $ago ) {
				continue; // A day WordPress.com did not report, inside the compared 30 days.
			}
			$data[] = array( $today->modify( "-{$ago} days" )->format( 'Y-m-d' ), $ago, 1 );
		}
		$requests = $this->filter_wpcom_stats(
			array(
				'get_visits' => array(
					'fields' => array( 'period', 'views', 'visitors' ),
					'data'   => $data,
				),
			) + self::overview_responses()
		);

		$result = Stats_Abilities::get_site_overview( array( 'compare' => 'previous-period' ) );

		$day = function ( int $ago ) use ( $today ) {
			return $today->modify( "-{$ago} days" )->format( 'Y-m-d' );
		};
		// One read from the first compared day (59 days ago) to the last (yesterday).
		$this->assertSame( 59, $requests['get_visits']['quantity'] );
		$this->assertSame( $day( 1 ), $requests['get_visits']['date'] );
		$this->assertSame(
			array(
				'preset'         => 'previous-period',
				'views_today'    => 1,
				'visitors_today' => 1,
				'views_week'     => 7 + 8 + 9 + 10 + 11 + 12 + 13,
				'views_month'    => null,
				'windows'        => array(
					'today' => array(
						'from' => $day( 1 ),
						'to'   => $day( 1 ),
					),
					'week'  => array(
						'from' => $day( 13 ),
						'to'   => $day( 7 ),
					),
					'month' => array(
						'from' => $day( 59 ),
						'to'   => $day( 30 ),
					),
				),
			),
			$result['comparison']
		);
		$this->assertArrayHasKey( 'comparison', $result['definitions'] );
	}

	public function test_get_followers_composes_its_subcalls(): void {
		$requests = $this->filter_wpcom_stats(
			array(
				'get_followers'           => array(
					'page'        => 1,
					'pages'       => 35,
					'total'       => 35,
					'total_email' => 10,
					'total_wpcom' => 25,
					'subscribers' => array(
						array(
							'ID'              => 111,
							'label'           => 'reader@example.com',
							'date_subscribed' => '2026-04-20T18:53:05+00:00',
						),
					),
				),
				'get_comment_followers'   => array(
					'page'  => 1,
					'pages' => 1,
					'total' => 2,
					'posts' => array(
						array(
							'id'        => 0,
							'followers' => 20,
						),
						array(
							'id'        => 41,
							'title'     => 'Launch',
							'followers' => '10',
						),
					),
				),
				'get_publicize_followers' => array(
					'services' => array(
						array(
							'service'   => 'twitter',
							'followers' => 300,
						),
						array(
							'service'   => 'facebook',
							'followers' => 80,
						),
					),
				),
				'get_subscriber_counts'   => array( 'counts' => array( 'paid_subscribers' => 3 ) ),
				// WordPress.com lists the newest period first.
				'get_subscriber_history'  => array(
					'fields' => array( 'period', 'subscribers', 'subscribers_change' ),
					'data'   => array( array( '2026-04-01', 35, 2 ), 'malformed', array( '2026-03-01', 33, -1 ) ),
				),
			)
		);

		$result = Stats_Abilities::get_followers(
			array(
				'period' => 'month',
				'num'    => 2,
				'date'   => '2026-04-20',
			)
		);
		$this->assert_matches_output_schema( 'jetpack-stats/get-followers', $result );

		$this->assertSame(
			array(
				'unit'     => 'month',
				'quantity' => 2,
				'date'     => '2026-04-20',
			),
			$requests['get_subscriber_history']
		);
		$this->assertSame(
			array(
				array(
					'date'        => '2026-03-01',
					'subscribers' => 33,
					'change'      => -1,
				),
				array(
					'date'        => '2026-04-01',
					'subscribers' => 35,
					'change'      => 2,
				),
			),
			$result['series']
		);
		$this->assertSame( 3, $result['paid'] );

		$this->assertSame( 10, $result['email'] );
		$this->assertSame( 25, $result['wpcom'] );
		$this->assertSame( 20, $result['comment'] );
		$this->assertSame( '{"twitter":300,"facebook":80}', wp_json_encode( $result['publicize'], JSON_UNESCAPED_SLASHES ) );
		$this->assertSame( 10 + 25 + 20 + 300 + 80, $result['total'] );
		$this->assertFalse( $result['partial'] );
	}

	/**
	 * A comment-follower count that failed, or whose "All Posts" row is beyond the first page, is not a confirmed 0.
	 *
	 * @return array
	 */
	public static function provide_unknown_comment_followers(): array {
		return array(
			'sub-call failed'               => array( new \WP_Error( 'boom', 'bad' ) ),
			'All Posts row on a later page' => array(
				array(
					'pages' => 130,
					'posts' => array(
						array(
							'id'        => 41,
							'followers' => 90,
						),
					),
				),
			),
		);
	}

	/**
	 * @dataProvider provide_unknown_comment_followers
	 *
	 * @param array|\WP_Error $comment_followers Comment-followers sub-call result.
	 */
	#[DataProvider( 'provide_unknown_comment_followers' )]
	public function test_get_followers_flags_unknown_comment_followers( $comment_followers ): void {
		$this->filter_wpcom_stats(
			array(
				'get_followers'           => array(
					'total_email' => 5,
					'total_wpcom' => 10,
				),
				'get_comment_followers'   => $comment_followers,
				'get_publicize_followers' => array( 'services' => array() ),
				'get_subscriber_counts'   => array( 'counts' => array( 'paid_subscribers' => 0 ) ),
			)
		);

		$result = Stats_Abilities::get_followers();
		$this->assert_matches_output_schema( 'jetpack-stats/get-followers', $result );

		$this->assertTrue( $result['partial'] );
		$this->assertSame( array( 'comment_followers' ), $result['errors'] );
		$this->assertNull( $result['comment'] );
		$this->assertNull( $result['total'], 'A total over an unknown count is unknown.' );
		$this->assertSame( 5, $result['email'] );
		$this->assertSame( '{}', wp_json_encode( $result['publicize'], JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * The top-content types that read a report other than a `days` list, and the items each reports.
	 *
	 * @return array
	 */
	public static function provide_report_types(): array {
		return array(
			'regions name the country'                => array(
				array( 'type' => 'regions' ),
				'get_views_by_location',
				array(
					'days' => array(
						'2026-04-23' => array(
							'views' => array(
								array(
									'location'     => 'Texas',
									'views'        => 9,
									'country_code' => 'US',
								),
							),
						),
					),
				),
				array(
					array(
						'rank'    => 1,
						'label'   => 'Texas',
						'value'   => 9,
						'country' => 'US',
					),
				),
			),
			'browsers rank a value map'               => array(
				array( 'type' => 'browsers' ),
				'get_device_views',
				array(
					'top_values' => array(
						'chrome'  => 30,
						'firefox' => 4,
					),
				),
				array(
					array(
						'rank'  => 1,
						'label' => 'chrome',
						'value' => 30,
					),
					array(
						'rank'  => 2,
						'label' => 'firefox',
						'value' => 4,
					),
				),
			),
			'a device report without values is empty' => array(
				array( 'type' => 'platforms' ),
				'get_device_views',
				array(),
				array(),
			),
			'screen sizes are whole percents'         => array(
				array( 'type' => 'screen-sizes' ),
				'get_device_views',
				array( 'top_values' => array( 'desktop' => 61.6 ) ),
				array(
					array(
						'rank'  => 1,
						'label' => 'desktop',
						'value' => 62,
					),
				),
			),
			'utm combinations read as their values'   => array(
				array( 'type' => 'utm' ),
				'get_utm_views',
				array( 'top_utm_values' => array( '["google","cpc"]' => 12 ) ),
				array(
					array(
						'rank'  => 1,
						'label' => 'google / cpc',
						'value' => 12,
					),
				),
			),
			'commenters count comments'               => array(
				array( 'type' => 'commenters' ),
				'get_top_comments',
				array(
					'authors' => array(
						array(
							'name'     => 'Ada',
							'comments' => '7',
						),
					),
				),
				array(
					array(
						'rank'  => 1,
						'label' => 'Ada',
						'value' => 7,
					),
				),
			),
			'commented posts link to the post'        => array(
				array( 'type' => 'commented-posts' ),
				'get_top_comments',
				array(
					'posts' => array(
						array(
							'name'     => 'Launch',
							'link'     => 'https://example.com/launch',
							'id'       => 41,
							'comments' => 5,
						),
					),
				),
				array(
					array(
						'rank'  => 1,
						'label' => 'Launch',
						'value' => 5,
						'href'  => 'https://example.com/launch',
						'id'    => 41,
					),
				),
			),
			'authors carry their ID and their posts'  => array(
				array(
					'type'   => 'authors',
					'expand' => true,
				),
				'get_top_authors',
				self::days_fixture(
					'authors',
					array(
						array(
							'name'      => 'Ada',
							'views'     => 11,
							'author_id' => 7,
							'posts'     => array(
								array(
									'title' => 'Launch',
									'url'   => 'https://example.com/?p=41',
									'views' => 10,
								),
							),
						),
					)
				),
				array(
					array(
						'rank'     => 1,
						'label'    => 'Ada',
						'value'    => 11,
						'id'       => 7,
						'children' => array(
							array(
								'label' => 'Launch',
								'value' => 10,
								'href'  => 'https://example.com/?p=41',
							),
						),
					),
				),
			),
		);
	}

	/**
	 * @dataProvider provide_report_types
	 *
	 * @param array  $input    get-top-content input.
	 * @param string $method   WPCOM_Stats method the type reads.
	 * @param array  $response What that method returns.
	 * @param array  $items    Expected items.
	 */
	#[DataProvider( 'provide_report_types' )]
	public function test_get_top_content_projects_each_report_into_items( array $input, string $method, array $response, array $items ): void {
		$this->filter_wpcom_stats( array( $method => $response ) );

		$result = Stats_Abilities::get_top_content( $input + array( 'date' => '2026-04-23' ) );

		$this->assert_matches_output_schema( 'jetpack-stats/get-top-content', $result );
		$this->assertSame( $items, $result['items'] );
		$this->assertNotContains( '', $result['definitions'] );
	}

	public function test_get_top_content_expand_lists_the_posts_each_utm_value_sent_views_to(): void {
		$requests = $this->filter_wpcom_stats(
			array(
				'get_utm_views'     => array(
					'top_utm_values' => array(
						'["guides","email"]'       => 249,
						'["google","paid_search"]' => 81,
					),
				),
				'get_utm_top_posts' => array(
					'top_posts' => array(
						array(
							'id'    => 89335,
							'href'  => 'https://example.com/chores/',
							'title' => 'Four Website Chores',
							'views' => 108,
						),
					),
				),
			)
		);

		$result = Stats_Abilities::get_top_content(
			array(
				'type'   => 'utm',
				'date'   => '2026-11-18',
				'max'    => 1,
				'expand' => true,
			)
		);
		$this->assert_matches_output_schema( 'jetpack-stats/get-top-content', $result );

		// The value is passed back exactly as WordPress.com keyed it, over the same days.
		$this->assertSame(
			array(
				'utm_source,utm_medium',
				'["guides","email"]',
				array(
					'max'  => 1,
					'date' => '2026-11-18',
					'days' => 1,
				),
			),
			$requests['get_utm_top_posts']
		);
		$this->assertSame(
			array(
				array(
					'rank'     => 1,
					'label'    => 'guides / email',
					'value'    => 249,
					'children' => array(
						array(
							'label' => 'Four Website Chores',
							'value' => 108,
							'href'  => 'https://example.com/chores/',
							'id'    => 89335,
						),
					),
				),
			),
			$result['items']
		);
		$this->assertArrayHasKey( 'children', $result['definitions'] );

		// A value whose posts cannot be read keeps its row and flags the gap.
		$this->filter_wpcom_stats(
			array(
				'get_utm_views'     => array( 'top_utm_values' => array( 'email' => 5 ) ),
				'get_utm_top_posts' => new \WP_Error( 'boom', 'bad' ),
			)
		);
		$failed = Stats_Abilities::get_top_content(
			array(
				'type'      => 'utm',
				'utm_param' => 'utm_source',
				'expand'    => true,
			)
		);
		$this->assertSame( 5, $failed['items'][0]['value'] );
		$this->assertArrayNotHasKey( 'children', $failed['items'][0] );
		$this->assertTrue( $failed['partial'] );
		$this->assertSame( array( 'children' ), $failed['errors'] );

		// One read per value keeps an expanded UTM list short.
		$this->assertSame(
			'jetpack_stats_invalid_max',
			Stats_Abilities::get_top_content(
				array(
					'type'   => 'utm',
					'max'    => 0,
					'expand' => true,
				)
			)->get_error_code()
		);
	}

	public function test_get_top_content_asks_device_and_utm_reports_for_days_ending_on_a_date(): void {
		$requests = $this->filter_wpcom_stats(
			array(
				'get_device_views' => array( 'top_values' => array() ),
				'get_utm_views'    => array( 'top_utm_values' => array() ),
			)
		);

		Stats_Abilities::get_top_content(
			array(
				'type'   => 'platforms',
				'period' => 'week',
				'num'    => 2,
				'date'   => '2026-04-15',
				'max'    => 5,
			)
		);
		$result = Stats_Abilities::get_top_content(
			array(
				'type'      => 'utm',
				'utm_param' => 'utm_campaign',
				'date'      => '2026-04-15',
			)
		);

		// Two weeks from Monday 2026-04-06 to Sunday 2026-04-19, and the extra row that shows a cut.
		$this->assertSame(
			array(
				'platform',
				array(
					'date' => '2026-04-19',
					'days' => 14,
					'max'  => 6,
				),
			),
			$requests['get_device_views']
		);
		$this->assertSame( 'utm_campaign', $requests['get_utm_views'][0] );
		$this->assertSame( 'utm_campaign', $result['utm_param'] );
	}

	public function test_get_top_content_flags_a_full_authors_list_as_truncated(): void {
		$authors = array();
		for ( $i = 1; $i <= Stats_Abilities::TOP_AUTHORS_LIMIT; $i++ ) {
			$authors[] = array(
				'name'  => "Author {$i}",
				'views' => 100 - $i,
			);
		}
		$this->filter_wpcom_stats( array( 'get_top_authors' => self::days_fixture( 'authors', $authors ) ) );

		$result = Stats_Abilities::get_top_content(
			array(
				'type' => 'authors',
				'date' => '2026-04-23',
				'max'  => 0,
			)
		);

		$this->assertCount( Stats_Abilities::TOP_AUTHORS_LIMIT, $result['items'] );
		$this->assertTrue( $result['truncated'] );
	}

	public function test_get_author_views_reports_the_author_window(): void {
		$requests = $this->filter_wpcom_stats(
			array(
				'get_author_views' => array(
					'views'              => 112,
					'likes'              => 20,
					'comments'           => 1,
					'fields'             => array( 'period', 'views' ),
					'data'               => array( array( '2026-04-22', 100 ), array( '2026-04-23', 12 ) ),
					'author'             => array( 'name' => 'Ada &amp; Co' ),
					'content_counts'     => array( 'post' => 194 ),
					'first_content_date' => '2010-05-03 21:00:40',
				),
			)
		);

		$result = Stats_Abilities::get_author_views(
			array(
				'author_id' => 7,
				'num'       => 2,
				'date'      => '2026-04-23',
			)
		);

		$this->assert_matches_output_schema( 'jetpack-stats/get-author-views', $result );
		$this->assertSame(
			array(
				7,
				array(
					'period' => 'day',
					'date'   => '2026-04-23',
					'num'    => 2,
				),
			),
			$requests['get_author_views']
		);
		$this->assertSame(
			array(
				'id'   => 7,
				'name' => 'Ada & Co',
			),
			$result['author']
		);
		$this->assertSame( array( 112, 20, 1 ), array( $result['views'], $result['likes'], $result['comments'] ) );
		$this->assertSame(
			array(
				array(
					'date'  => '2026-04-22',
					'views' => 100,
				),
				array(
					'date'  => '2026-04-23',
					'views' => 12,
				),
			),
			$result['series']
		);
		$this->assertSame( '{"post":194}', wp_json_encode( $result['content_counts'], JSON_UNESCAPED_SLASHES ) );
	}

	public function test_get_insights_composes_the_insights_page(): void {
		$this->filter_wpcom_stats(
			array(
				'get_stats'       => array(
					'stats' => array(
						'views'                => 1000,
						'visitors'             => 300,
						'posts'                => 12,
						'comments'             => 40,
						'shares'               => 2,
						'views_best_day'       => '2024-06-12',
						'views_best_day_total' => 90,
					),
				),
				'get_insights'    => array(
					'highest_hour'         => 14,
					'highest_hour_percent' => 7.34,
					'highest_day_of_week'  => 1,
					'highest_day_percent'  => 20.88,
					'years'                => array(
						array(
							'year'           => '2026',
							'total_posts'    => 4,
							'total_words'    => 900,
							'total_likes'    => 8,
							'total_comments' => 3,
						),
					),
				),
				'get_highlights'  => array(
					'past_seven_days' => array(
						'range'    => array(
							'start' => '2026-04-16',
							'end'   => '2026-04-22',
						),
						'views'    => 70,
						'visitors' => 30,
						'likes'    => 5,
						'comments' => 1,
					),
				),
				'get_streak'      => new \WP_Error( 'boom', 'bad' ),
				'get_stats_usage' => array(
					'current_usage' => array(
						'current_start' => '2026-04-12',
						'next_start'    => '2026-05-12',
						'views_count'   => 530,
					),
					'views_limit'   => 10000,
					'current_tier'  => array( 'slug' => 'jetpack_stats_pwyw' ),
				),
			)
		);

		$result = Stats_Abilities::get_insights();

		$this->assert_matches_output_schema( 'jetpack-stats/get-insights', $result );
		$this->assertSame( 1000, $result['all_time']['views'] );
		$this->assertSame( '2024-06-12', $result['all_time']['best_day'] );
		$this->assertSame( 'Tuesday', $result['busiest']['day_of_week'] );
		$this->assertSame( 7.3, $result['busiest']['hour_percent'] );
		$this->assertSame( 70, $result['recent']['last_7_days']['views'] );
		$this->assertSame( '2026', $result['years'][0]['year'] );
		$this->assertSame( 10000, $result['plan_usage']['views_limit'] );
		$this->assertNull( $result['streak'] );
		$this->assertSame( array( 'streak' ), $result['errors'] );
	}

	public function test_get_email_stats_maps_posts_and_window(): void {
		$requests = $this->filter_wpcom_stats(
			array(
				'get_email_summary' => array(
					'start_date' => '2026-04-01',
					'end_date'   => '2026-04-23',
					'posts'      => array(
						array(
							'id'            => 41,
							'title'         => 'Launch',
							'href'          => 'https://example.com/launch',
							'date'          => '2026-04-02 10:00:00',
							'total_sends'   => 200,
							'opens'         => 90,
							'unique_opens'  => 80,
							'opens_rate'    => 40,
							'clicks'        => 12,
							'unique_clicks' => 10,
							'clicks_rate'   => 5,
						),
					),
				),
			)
		);

		$result = Stats_Abilities::get_email_stats(
			array(
				'sort'       => 'opens',
				'max'        => 5,
				'start_date' => '2026-04-01',
			)
		);

		$this->assert_matches_output_schema( 'jetpack-stats/get-email-stats', $result );
		$this->assertSame(
			array(
				'quantity'   => 5,
				'sort_field' => 'opens',
				'sort_order' => 'desc',
				'start_date' => '2026-04-01',
			),
			$requests['get_email_summary']
		);
		$this->assertSame( 200, $result['posts'][0]['sent'] );
		$this->assertSame( 40.0, $result['posts'][0]['open_rate'] );
		$this->assertArrayHasKey( 'email_window', $result['definitions'] );
	}

	public function test_get_email_detail_breaks_one_email_down(): void {
		$post_id   = wp_insert_post( array( 'post_title' => 'Launch' ) );
		$responses = array(
			'opens/rate'               => array(
				'total_sends'  => 200,
				'unique_opens' => 80,
				'total_opens'  => 90,
				'opens_rate'   => 0.4,
			),
			'opens/client'             => array(
				'clients' => array(
					'data' => array( array( 'Other', '10' ), array( 'Gmail', '80' ) ),
				),
			),
			'opens/country'            => array(
				'countries'      => array(
					'data' => array( array( 'US', '60' ), array( 'BR', '20' ), array( 'A1', '10' ) ),
				),
				'countries-info' => array(
					'US' => array( 'country_full' => 'United States' ),
					'BR' => array( 'country_full' => 'Brazil' ),
				),
			),
			'opens/device'             => new \WP_Error( 'boom', 'nope' ),
			'clicks/link'              => array(
				'links' => array(
					'data' => array( array( 'user_link', '9' ), array( 'post-url', '4' ), array( 'remove-subscription', '1' ) ),
				),
			),
			'clicks/user-content-link' => array(
				'user-content-links' => array(
					'data' => array( array( 'https://example.com/shop', '9' ) ),
				),
			),
		);
		$stub      = $this->createStub( WPCOM_Stats::class );
		$stub->method( 'get_email_breakdown' )->willReturnCallback(
			static function ( $post, $stat, $field ) use ( $post_id, $responses ) {
				return $post === $post_id ? ( $responses[ "$stat/$field" ] ?? array() ) : new \WP_Error( 'wrong_post', 'nope' );
			}
		);
		add_filter(
			'jetpack_stats_abilities_wpcom_stats',
			static function () use ( $stub ) {
				return $stub;
			}
		);

		$result = Stats_Abilities::get_email_detail(
			array(
				'post_id' => (string) $post_id,
				'max'     => 2,
			)
		);

		$this->assert_matches_output_schema( 'jetpack-stats/get-email-detail', $result );
		$this->assertSame( 200, $result['sent'] );
		$this->assertSame( 40.0, $result['opens']['rate'] );
		$this->assertSame(
			array(
				array(
					'label' => 'Gmail',
					'value' => 80,
				),
				array(
					'label' => 'Other',
					'value' => 10,
				),
			),
			$result['opens']['by_client']
		);
		$this->assertSame( array( 'United States', 'Brazil' ), array_column( $result['opens']['by_country'], 'label' ) );
		$this->assertSame( array( 'https://example.com/shop', 'Post title' ), array_column( $result['clicks']['by_link'], 'label' ) );
		$this->assertNull( $result['opens']['by_device'] );
		$this->assertSame( array( 'opens/device' ), $result['errors'] );
	}

	public function test_get_post_detail_reports_one_post(): void {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Launch &amp; more',
				'post_status' => 'publish',
			)
		);
		// WorDBless stores no comments, so serve the newest approved ones the way the query would.
		$asked = new \ArrayObject();
		add_filter(
			'comments_pre_query',
			static function ( $comments, $query ) use ( $asked ) {
				$asked->exchangeArray( $query->query_vars );
				return array_map(
					static function ( $text ) {
						return new \WP_Comment(
							(object) array(
								'comment_ID'      => 1,
								'comment_author'  => 'Reader',
								'comment_content' => "<p>$text</p>",
								'comment_date'    => '2026-11-03 10:00:00',
							)
						);
					},
					array( 'Third', 'Second <b>reply</b> ' . str_repeat( 'word ', 30 ) )
				);
			},
			10,
			2
		);
		add_filter(
			'get_comments_number',
			static function () {
				return '3';
			}
		);
		$this->stub_post_detail_stats( 200 );

		$result = Stats_Abilities::get_post_detail(
			array(
				'post_id' => (string) $post_id,
				'max'     => 2,
			)
		);

		$this->assert_matches_output_schema( 'jetpack-stats/get-post-detail', $result );
		$this->assertSame( 'Launch & more', $result['post']['title'] );
		$this->assertSame( 4029, $result['views'] );
		$this->assertSame( 3, $result['likes']['total'] );
		$this->assertSame( array( 'Ana & Bo', 'Cy' ), array_column( $result['likes']['recent'], 'name' ) );
		// The total and the list count the same things: approved comments of every type.
		$this->assertSame( 3, $result['comments']['total'] );
		$this->assertSame( array( $post_id, 'approve', 2, '' ), array( $asked['post_id'], $asked['status'], $asked['number'], $asked['type'] ) );
		$this->assertSame( array( 'Third', 'Second reply ' . trim( str_repeat( 'word ', 28 ) ) . '…' ), array_column( $result['comments']['recent'], 'excerpt' ) );
		$this->assertSame(
			array(
				array(
					'label' => 'guides / email',
					'value' => 109,
				),
			),
			$result['utm']
		);
		$this->assertSame(
			array(
				'emailed' => true,
				'sent'    => 200,
				'opens'   => array(
					'total'  => 90,
					'unique' => 80,
					'rate'   => 40.0,
				),
				'clicks'  => array(
					'total'  => 12,
					'unique' => 10,
					'rate'   => 5.0,
				),
			),
			$result['email']
		);
		$this->assertFalse( $result['partial'] );
	}

	/**
	 * Email figures for a post nobody was sent, or whose email stats could not be read.
	 */
	public static function provide_unknown_email(): array {
		return array(
			'never sent' => array( 0, false, array() ),
			'unreadable' => array( null, null, array( 'email' ) ),
		);
	}

	/**
	 * A post nobody was sent reads as never emailed, and unreadable email stats as unknown, never as an email with no opens.
	 *
	 * @dataProvider provide_unknown_email
	 *
	 * @param int|null  $sends   Subscribers WPCOM says the post went to, or null when it refuses.
	 * @param bool|null $emailed The `email.emailed` this gives.
	 * @param string[]  $errors  The errors reported.
	 */
	#[DataProvider( 'provide_unknown_email' )]
	public function test_get_post_detail_leaves_email_figures_null_unless_it_was_sent( ?int $sends, ?bool $emailed, array $errors ): void {
		$this->stub_post_detail_stats( $sends );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Hello',
				'post_status' => 'publish',
			)
		);

		$result = Stats_Abilities::get_post_detail( array( 'post_id' => $post_id ) );

		$this->assertSame( array( 'emailed' => $emailed ) + self::NO_EMAIL, $result['email'] );
		$this->assertSame( $errors, $result['errors'] ?? array() );
	}

	public function test_get_post_detail_asks_nothing_about_email_for_a_page(): void {
		// Someone who can open a private page on the site can read its report.
		wp_set_current_user( self::$admin_id );
		$page_id = wp_insert_post(
			array(
				'post_title'  => 'Members',
				'post_type'   => 'page',
				'post_status' => 'private',
			)
		);
		$calls   = $this->stub_post_detail_stats( 200 );

		$page = Stats_Abilities::get_post_detail(
			array(
				'post_id'   => $page_id,
				'utm_param' => 'utm_campaign',
			)
		);

		// A refused UTM read leaves the rest of the report.
		$this->assertSame( array( 'utm' ), $calls->getArrayCopy() );
		$this->assertSame( array( 'emailed' => false ) + self::NO_EMAIL, $page['email'] );
		$this->assertNull( $page['utm'] );
		$this->assertSame( array( 'utm' ), $page['errors'] );
		$this->assertSame( 4029, $page['views'] );
	}

	/**
	 * Serve get-post-detail's WPCOM reads: the post's views, likes and UTM values, and an email sent to `$sends` people.
	 *
	 * UTM answers only for an all-time read grouped by source and medium, as a plan without UTM refuses the rest.
	 *
	 * @param int|null $sends Subscribers the post went to, or null to refuse the email reads.
	 * @return \ArrayObject The UTM and email reads made, in order.
	 */
	private function stub_post_detail_stats( ?int $sends ): \ArrayObject {
		$calls = new \ArrayObject();
		$stub  = $this->createStub( WPCOM_Stats::class );
		$stub->method( 'get_post_views' )->willReturn( array( 'views' => 4029 ) );
		$stub->method( 'get_post_likes' )->willReturn(
			array(
				'found' => 3,
				'likes' => array( array( 'name' => 'Ana &amp; Bo' ), array( 'name' => 'Cy' ), array( 'name' => 'Di' ) ),
			)
		);
		$stub->method( 'get_utm_views' )->willReturnCallback(
			static function ( $param, $args ) use ( $calls ) {
				$calls[] = 'utm';
				return 'utm_source,utm_medium' === $param && -1 === $args['days'] ? array( 'top_utm_values' => array( '["guides","email"]' => 109 ) ) : new \WP_Error( 'stats_error', 'No UTM on this plan' );
			}
		);
		$stub->method( 'get_email_breakdown' )->willReturnCallback(
			static function ( $post, $stat ) use ( $sends, $calls ) {
				$calls[] = "email/$stat";
				if ( null === $sends ) {
					return new \WP_Error( 'stats_error', 'Unavailable' );
				}
				return 'opens' === $stat
					? array(
						'total_sends'  => $sends,
						'total_opens'  => $sends ? 90 : 0,
						'unique_opens' => $sends ? 80 : 0,
						'opens_rate'   => $sends ? 0.4 : 0,
					)
					: array(
						'total_clicks'  => $sends ? 12 : 0,
						'unique_clicks' => $sends ? 10 : 0,
						'clicks_rate'   => $sends ? 0.05 : 0,
					);
			}
		);
		add_filter(
			'jetpack_stats_abilities_wpcom_stats',
			static function () use ( $stub ) {
				return $stub;
			}
		);

		return $calls;
	}

	public function test_get_insights_reads_a_year_of_posts_for_the_streak_and_calendar(): void {
		update_option( 'timezone_string', 'America/New_York' );
		$today    = current_time( 'Y-m-d' );
		$day      = gmdate( 'Y-m-d', strtotime( $today . ' -3 days' ) );
		$at       = static function ( string $time ) use ( $day ): string {
			return (string) ( new \DateTime( "$day $time", wp_timezone() ) )->getTimestamp();
		};
		$requests = $this->filter_wpcom_stats(
			array(
				'get_streak' => array(
					'streak' => array(),
					'data'   => array(
						$at( '00:30' ) => 1,
						$at( '23:30' ) => 2,
					),
				),
			)
		);

		$result = Stats_Abilities::get_insights();

		$this->assertSame(
			array(
				'startDate' => gmdate( 'Y-m-d', strtotime( $today . ' -1 year +1 day' ) ),
				'endDate'   => $today,
				'max'       => Stats_Abilities::STREAK_MAX_POSTS,
			),
			$requests['get_streak']
		);
		$this->assertSame(
			array(
				array(
					'date'  => $day,
					'posts' => 3,
				),
			),
			$result['calendar']['days']
		);
	}

	public function test_get_subscribers_lists_a_page_for_site_managers_only(): void {
		$requests = $this->filter_wpcom_stats(
			array(
				'get_subscribers' => array(
					'total'       => 601,
					'pages'       => 301,
					'subscribers' => array(
						array(
							'user_id'             => 0,
							'subscription_id'     => 951,
							'email_address'       => 'ada@example.com',
							'display_name'        => 'Ada',
							'date_subscribed'     => '2026-04-02T15:26:56+00:00',
							'is_email_subscriber' => true,
							'subscription_status' => 'Subscribed',
						),
					),
				),
			)
		);

		$result = Stats_Abilities::get_subscribers(
			array(
				'per_page' => 2,
				'filter'   => 'paid',
				'search'   => ' ada ',
			)
		);

		$this->assert_matches_output_schema( 'jetpack-stats/get-subscribers', $result );
		$this->assertSame( 'paid', $requests['get_subscribers']['filter'] );
		$this->assertSame( 'ada', $requests['get_subscribers']['search'] );
		$this->assertSame( 601, $result['total'] );
		$this->assertNull( $result['subscribers'][0]['user_id'] );
		$this->assertSame( 'ada@example.com', $result['subscribers'][0]['email'] );

		$permission = Stats_Abilities::get_abilities()['jetpack-stats/get-subscribers']['permission_callback'];
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( $permission() );
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( $permission() );
	}

	public function test_get_ad_stats_reports_series_and_monthly_earnings(): void {
		$this->filter_wpcom_stats(
			array(
				'get_wordads_stats'    => array(
					'fields' => array( 'period', 'impressions', 'revenue', 'cpm' ),
					'data'   => array( 'malformed', array( '2026-04-01', 1000, 1.234, 1.23 ) ),
				),
				'get_wordads_earnings' => array(
					'earnings' => array(
						'total_earnings'    => '12.50',
						'total_amount_owed' => '2.50',
						'wordads'           => array(
							'2026-03' => array(
								'amount' => 2,
								'status' => 0,
							),
							'2026-02' => array(
								'amount' => 10,
								'status' => 1,
							),
						),
						'adjustment'        => array(
							'2026-03' => array(
								'amount' => 0.5,
								'status' => 0,
							),
						),
					),
				),
			)
		);

		$result = Stats_Abilities::get_ad_stats( array( 'period' => 'month' ) );

		$this->assert_matches_output_schema( 'jetpack-stats/get-ad-stats', $result );
		$this->assertSame( 1.23, $result['series'][0]['revenue'] );
		$this->assertSame( 12.5, $result['earnings']['total'] );
		$this->assertSame(
			array(
				array(
					'month'  => '2026-03',
					'amount' => 2.5,
					'paid'   => false,
				),
				array(
					'month'  => '2026-02',
					'amount' => 10.0,
					'paid'   => true,
				),
			),
			$result['earnings']['months']
		);
		$this->assertFalse( $result['partial'] );

		$permission = Stats_Abilities::get_abilities()['jetpack-stats/get-ad-stats']['permission_callback'];
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( $permission() );
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( $permission() );
	}

	public function test_every_reader_names_the_site_it_read(): void {
		\Jetpack_Options::update_option( 'id', 1234 );
		$post_id = wp_insert_post( array( 'post_title' => 'Hello' ) );
		$this->filter_wpcom_stats(
			self::overview_responses() + array(
				'get_post_views'          => array( 'views' => 5 ),
				'get_followers'           => array(
					'total_email' => 1,
					'total_wpcom' => 2,
				),
				'get_comment_followers'   => array(),
				'get_publicize_followers' => array(),
				'get_subscriber_counts'   => array( 'counts' => array( 'paid_subscribers' => 0 ) ),
			)
		);
		$site = array(
			'id'  => 1234,
			'url' => home_url(),
		);

		$this->assertSame( $site, Stats_Abilities::get_site_overview()['site'] );
		$this->assertSame( $site, Stats_Abilities::get_top_content( array( 'type' => 'posts' ) )['site'] );
		$this->assertSame( $site, Stats_Abilities::get_post_views( array( 'post_id' => $post_id ) )['site'] );
		$this->assertSame( $site, Stats_Abilities::get_visits()['site'] );
		$this->assertSame( $site, Stats_Abilities::get_followers()['site'] );
	}

	public function test_every_reader_defines_the_metrics_it_returns(): void {
		$post_id = wp_insert_post( array( 'post_title' => 'Hello' ) );
		$this->filter_wpcom_stats(
			self::overview_responses() + array(
				'get_clicks'              => self::days_fixture( 'clicks', array() ),
				'get_post_views'          => array( 'views' => 5 ),
				'get_followers'           => array(
					'total_email' => 1,
					'total_wpcom' => 2,
				),
				'get_comment_followers'   => array(),
				'get_publicize_followers' => array(),
				'get_subscriber_counts'   => array( 'counts' => array( 'paid_subscribers' => 0 ) ),
			)
		);

		$readers = array(
			'overview'         => array( Stats_Abilities::get_site_overview(), array( 'date', 'views', 'visitors', 'views_today', 'visitors_today', 'views_week', 'views_month', 'top_post', 'top_referrer' ) ),
			'top posts'        => array( Stats_Abilities::get_top_content( array( 'type' => 'posts' ) ), array( 'value', 'items', 'views' ) ),
			// Clicks are not views, so views is not defined for them.
			'top clicks'       => array( Stats_Abilities::get_top_content( array( 'type' => 'clicks' ) ), array( 'value', 'items' ) ),
			'post views'       => array( Stats_Abilities::get_post_views( array( 'post_id' => $post_id ) ), array( 'views', 'series', 'total_views' ) ),
			'visits by fields' => array( Stats_Abilities::get_visits( array( 'fields' => array( 'likes', 'views' ) ) ), array( 'views', 'likes', 'series' ) ),
			'followers'        => array( Stats_Abilities::get_followers(), array( 'total', 'email', 'wpcom', 'comment', 'publicize', 'paid' ) ),
		);
		foreach ( $readers as $reader => list( $result, $terms ) ) {
			$this->assertEqualsCanonicalizing( $terms, array_keys( $result['definitions'] ), $reader );
			$this->assertNotContains( '', $result['definitions'], $reader );
		}
	}

	public function test_get_settings_returns_whitelisted_fields_only(): void {
		$result = Stats_Abilities::get_settings();

		$this->assertIsArray( $result );
		$this->assertSame(
			array( 'admin_bar', 'roles', 'count_roles', 'do_not_track' ),
			array_keys( $result )
		);
		// Internal keys must NOT leak.
		$this->assertArrayNotHasKey( 'blog_id', $result );
		$this->assertArrayNotHasKey( 'version', $result );
		$this->assertArrayNotHasKey( 'notices', $result );
	}

	public function test_get_settings_classifies_types_from_options_defaults(): void {
		// Regression guard: the snapshot derives bool/array typing from
		// Options::get_defaults() rather than a duplicated allow-list, so a new
		// option type added in Options must propagate here without code changes.
		$result = Stats_Abilities::get_settings();

		$this->assertIsBool( $result['admin_bar'] );
		$this->assertIsBool( $result['do_not_track'] );
		$this->assertIsArray( $result['roles'] );
		$this->assertIsArray( $result['count_roles'] );
	}

	public function test_update_settings_rejects_empty_input(): void {
		$result = Stats_Abilities::update_settings( array() );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_missing_setting_field', $result->get_error_code() );
	}

	public function test_update_settings_rejects_unknown_role(): void {
		$result = Stats_Abilities::update_settings( array( 'roles' => array( 'robot' ) ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_invalid_role', $result->get_error_code() );
	}

	public function test_update_settings_accepts_a_saved_role_the_site_no_longer_has(): void {
		Options::set_options( array( 'roles' => array( 'administrator', 'shop_manager' ) ) );

		$result = Stats_Abilities::update_settings( array( 'roles' => array( 'administrator', 'shop_manager', 'editor' ) ) );

		$this->assertIsArray( $result );
		$this->assertSame( array( 'administrator', 'shop_manager', 'editor' ), Options::get_option( 'roles' ) );
	}

	public function test_settings_update_refuses_a_key_outside_the_settings_list_instead_of_saving_it(): void {
		$result = Settings::update( array( 'enable_odyssey_stats' => false ), array( 'enable_odyssey_stats' ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_unknown_setting', $result->get_error_code() );
		$this->assertTrue( Options::get_option( 'enable_odyssey_stats' ) );
	}

	public function test_update_settings_refuses_roles_given_as_a_string_instead_of_emptying_them(): void {
		$result = Stats_Abilities::update_settings( array( 'roles' => 'editor' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_invalid_roles', $result->get_error_code() );
	}

	public function test_update_settings_saves_the_counted_roles(): void {
		$result = Stats_Abilities::update_settings( array( 'count_roles' => array( 'editor', 'author' ) ) );

		$this->assertSame( array( 'editor', 'author' ), $result['settings']['count_roles'] );
		$this->assertSame( array( 'editor', 'author' ), Options::get_option( 'count_roles' ) );
	}

	public function test_update_settings_refuses_an_empty_roles_list(): void {
		$result = Stats_Abilities::update_settings( array( 'roles' => array() ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_invalid_roles', $result->get_error_code() );
	}

	public function test_update_settings_keeps_administrator_in_roles_so_admins_are_not_locked_out(): void {
		$result = Stats_Abilities::update_settings( array( 'roles' => array( 'editor' ) ) );

		$this->assertSame( array( 'administrator', 'editor' ), $result['settings']['roles'] );
		$this->assertSame( array( 'administrator', 'editor' ), Options::get_option( 'roles' ) );
	}

	public function test_update_settings_changes_admin_bar(): void {
		$before = Stats_Abilities::get_settings();
		$this->assertTrue( $before['admin_bar'] );

		$result = Stats_Abilities::update_settings( array( 'admin_bar' => false ) );

		$this->assertIsArray( $result );
		$this->assertTrue( $result['changed'] );
		$this->assertFalse( $result['settings']['admin_bar'] );
	}

	public function test_update_settings_refuses_a_save_that_did_not_persist(): void {
		$keep_stored = static function ( $value, $old_value ) {
			return $old_value;
		};
		add_filter( 'pre_update_option_stats_options', $keep_stored, 10, 2 );

		$result = Stats_Abilities::update_settings( array( 'admin_bar' => false ) );
		remove_filter( 'pre_update_option_stats_options', $keep_stored, 10 );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_stats_save_failed', $result->get_error_code() );
	}

	public function test_update_settings_is_idempotent_for_current_state(): void {
		$before = Stats_Abilities::get_settings();
		$result = Stats_Abilities::update_settings( array( 'admin_bar' => $before['admin_bar'] ) );
		$this->assertFalse( $result['changed'], 'Desired == current must be a no-op.' );
	}

	public function test_update_settings_accepts_empty_count_roles(): void {
		$result = Stats_Abilities::update_settings( array( 'count_roles' => array() ) );
		$this->assertIsArray( $result );
		$this->assertSame( array(), $result['settings']['count_roles'] );
	}

	public function test_update_settings_preserves_unrelated_option_keys(): void {
		// Seed an unrelated internal key.
		update_option(
			'stats_options',
			array(
				'admin_bar' => true,
				'roles'     => array( 'administrator' ),
				'notices'   => array( 'do_not_clobber' => 1 ),
				'version'   => Main::STATS_VERSION,
			)
		);
		// Force-reset the static cache so the next get_options() re-reads.
		self::reset_static_property( Options::class, 'options', array() );

		Stats_Abilities::update_settings( array( 'admin_bar' => false ) );

		$this->assertSame(
			array( 'do_not_clobber' => 1 ),
			Options::get_option( 'notices' ),
			'update-settings must not blow away unrelated internal option keys.'
		);
	}

	/**
	 * Build a single-day WPCOM `stats/<endpoint>` fixture.
	 *
	 * Most top-content endpoints share the shape `days -> <date> -> <list_key> -> [rows]`;
	 * this helper keeps the fixture wiring uniform and out of each test body.
	 *
	 * @param string $list_key Per-day list key (e.g. `postviews`, `groups`, `clicks`).
	 * @param array  $rows     Row dictionaries.
	 * @param string $date     Day key (defaults to the canonical fixture date).
	 * @return array
	 */
	private static function days_fixture( string $list_key, array $rows, string $date = '2026-04-23' ): array {
		return array(
			'days' => array(
				$date => array( $list_key => $rows ),
			),
		);
	}

	/**
	 * Reset a class's static property (defeats inter-test caches).
	 *
	 * @param string $class Fully qualified class name.
	 * @param string $prop  Property name.
	 * @param mixed  $value New value.
	 */
	private static function reset_static_property( string $class, string $prop, $value ): void {
		$ref      = new \ReflectionClass( $class );
		$property = $ref->getProperty( $prop );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $value );
	}

	/**
	 * WPCOM responses behind a healthy get-site-overview, keyed by WPCOM_Stats method.
	 *
	 * @return array
	 */
	private static function overview_responses(): array {
		return array(
			// Nine days, oldest first: the week is the last seven, the month all nine.
			'get_visits'    => array(
				'fields' => array( 'period', 'views', 'visitors' ),
				'data'   => array(
					array( '2026-04-15', 1000, 800 ),
					array( '2026-04-16', 2000, 1500 ),
					array( '2026-04-17', 10, 8 ),
					array( '2026-04-18', 20, 15 ),
					array( '2026-04-19', 30, 25 ),
					array( '2026-04-20', 40, 30 ),
					array( '2026-04-21', 50, 40 ),
					array( '2026-04-22', 60, 45 ),
					array( '2026-04-23', 120, 90 ),
				),
			),
			'get_top_posts' => self::days_fixture(
				'postviews',
				array(
					array(
						'id'    => 0,
						'title' => 'Home page / Archives',
						'views' => 300,
						'type'  => 'homepage',
					),
					array(
						'id'    => 7,
						'title' => 'Tea &amp; Crumpets&#8217; Best',
						'views' => 42,
						'href'  => 'https://x/tea',
					),
				)
			),
			'get_referrers' => self::days_fixture(
				'groups',
				array(
					array(
						'name'  => 'wordpress.com',
						'total' => 60,
					),
				)
			),
		);
	}

	/**
	 * Install a filter that makes the abilities class use a stubbed WPCOM_Stats.
	 *
	 * @param array $method_returns Map of WPCOM_Stats method => return value.
	 * @return \ArrayObject What each called method received, keyed by method: its query args, or its whole argument list when the first names what to read (a post, an author, a device property).
	 */
	private function filter_wpcom_stats( array $method_returns ): \ArrayObject {
		$requests = new \ArrayObject();
		$stub     = $this->createStub( WPCOM_Stats::class );
		foreach ( $method_returns as $method => $value ) {
			$stub->method( $method )->willReturnCallback(
				static function ( ...$args ) use ( $requests, $method, $value ) {
					$requests[ $method ] = isset( $args[0] ) && ! is_array( $args[0] ) ? $args : ( $args[0] ?? null );
					return $value;
				}
			);
		}

		add_filter(
			'jetpack_stats_abilities_wpcom_stats',
			static function () use ( $stub ) {
				return $stub;
			}
		);

		return $requests;
	}
}
