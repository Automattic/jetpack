<?php
/**
 * Tests for the WordPress.com Simple Premium Analytics bootstrap gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Tests for Premium Analytics Simple loading.
 */
class Wpcom_Simple_Premium_Analytics_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_premium_analytics_enabled' );
		unregister_setting( 'general', 'jetpack_premium_analytics_enabled' );
		delete_option( 'jetpack_premium_analytics_enabled' );
		\Mockery::close();

		parent::tear_down();
	}

	/**
	 * The package bootstrap has to actually wire the sticker up.
	 *
	 * Every other test here registers the filter by hand, so only this one fails if init() stops.
	 * The bootstrap already ran init() without IS_WPCOM, so this clears the did_action() guard and
	 * re-runs it with the constant defined, in its own process.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_package_bootstrap_wires_the_sticker() {
		if ( ! defined( 'IS_WPCOM' ) ) {
			define( 'IS_WPCOM', true );
		}

		unset( $GLOBALS['wp_actions']['jetpack_mu_wpcom_initialized'] );
		Jetpack_Mu_Wpcom::init();

		$this->assertNotFalse(
			has_filter( 'jetpack_premium_analytics_enabled', array( Jetpack_Mu_Wpcom::class, 'enable_wpcom_simple_premium_analytics_for_sticker' ) ),
			'Jetpack_Mu_Wpcom::init() must register the sticker on jetpack_premium_analytics_enabled.'
		);
	}

	/**
	 * The Simple bootstrap gate is disabled by default.
	 */
	public function test_wpcom_simple_premium_analytics_gate_is_off_by_default() {
		$this->assertFalse( Jetpack_Mu_Wpcom::should_load_wpcom_simple_premium_analytics() );
	}

	/**
	 * The Simple loader returns before bootstrapping Premium Analytics when gated off.
	 */
	public function test_wpcom_simple_premium_analytics_loader_returns_when_gate_is_disabled() {
		Jetpack_Mu_Wpcom::load_wpcom_simple_premium_analytics();

		$this->assertFalse( class_exists( \Automattic\Jetpack\PremiumAnalytics\Analytics::class, false ) );
	}

	/**
	 * The Simple loader boots Premium Analytics when the rollout gate is enabled.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_wpcom_simple_premium_analytics_loader_boots_premium_analytics_when_enabled() {
		add_filter( 'jetpack_premium_analytics_enabled', '__return_true' );

		\Mockery::mock( 'alias:' . \Automattic\Jetpack\PremiumAnalytics\Analytics::class )
			->shouldReceive( 'init_wpcom_simple' )
			->once()
			->with(
				\Mockery::on(
					function ( $options ) {
						// The label has to arrive as a closure - a string would mean we
						// translated it on plugins_loaded, before the textdomain loads.
						$menu_title = $options['menu_title'] ?? null;

						return $menu_title instanceof \Closure && 'Stats v2' === $menu_title();
					}
				)
			);

		Jetpack_Mu_Wpcom::load_wpcom_simple_premium_analytics();

		$this->addToAssertionCount( 1 );
	}

	/**
	 * The shared filter connected sites use reaches Simple too.
	 */
	public function test_wpcom_simple_premium_analytics_gate_can_be_enabled_by_the_shared_filter() {
		add_filter( 'jetpack_premium_analytics_enabled', '__return_true' );

		$this->assertTrue( Jetpack_Mu_Wpcom::should_load_wpcom_simple_premium_analytics() );
	}

	/**
	 * The Simple bootstrap gate can be enabled by the customer's own opt-in option.
	 */
	public function test_wpcom_simple_premium_analytics_gate_can_be_enabled_by_option() {
		update_option( 'jetpack_premium_analytics_enabled', 1 );

		$this->assertTrue( Jetpack_Mu_Wpcom::should_load_wpcom_simple_premium_analytics() );
	}

	/**
	 * The sticker wins over a site that has opted out, matching Atomic.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_wpcom_simple_premium_analytics_sticker_wins_over_a_falsy_option() {
		if ( ! defined( 'IS_WPCOM' ) ) {
			define( 'IS_WPCOM', true );
		}

		eval( 'function has_blog_sticker( $sticker, $blog_id ) { return $sticker === "jetpack-premium-analytics" && $blog_id > 0; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval
		add_filter( 'jetpack_premium_analytics_enabled', array( Jetpack_Mu_Wpcom::class, 'enable_wpcom_simple_premium_analytics_for_sticker' ) );
		update_option( 'jetpack_premium_analytics_enabled', 0 );

		$this->assertTrue( Jetpack_Mu_Wpcom::should_load_wpcom_simple_premium_analytics() );
	}

	/**
	 * The sticker only ever adds: off-platform the opt-in passes straight through, both ways.
	 *
	 * IS_WPCOM and IS_ATOMIC are undefined in this process, so get_wpcom_blog_id() is falsy and the
	 * blog_id guard returns before any sticker lookup.
	 */
	public function test_wpcom_simple_premium_analytics_sticker_filter_passes_the_opt_in_through() {
		$this->assertFalse( Jetpack_Mu_Wpcom::enable_wpcom_simple_premium_analytics_for_sticker( false ) );
		$this->assertTrue( Jetpack_Mu_Wpcom::enable_wpcom_simple_premium_analytics_for_sticker( true ) );
	}

	/**
	 * The option filter overrides the stored value in either direction.
	 *
	 * @param bool $option   Stored option value.
	 * @param bool $filtered What the filter returns.
	 * @param bool $expected Expected answer.
	 * @dataProvider provide_option_filter_overrides
	 */
	#[DataProvider( 'provide_option_filter_overrides' )]
	public function test_wpcom_simple_premium_analytics_gate_option_filter_overrides( $option, $filtered, $expected ) {
		update_option( 'jetpack_premium_analytics_enabled', $option ? 1 : 0 );
		add_filter( 'jetpack_premium_analytics_enabled', fn () => $filtered );

		$this->assertSame( $expected, Jetpack_Mu_Wpcom::should_load_wpcom_simple_premium_analytics() );
	}

	/**
	 * Data for test_wpcom_simple_premium_analytics_gate_option_filter_overrides.
	 *
	 * @return array
	 */
	public static function provide_option_filter_overrides() {
		return array(
			'filter turns it on'  => array( false, true, true ),
			'filter turns it off' => array( true, false, false ),
		);
	}

	/**
	 * The sticker turns the dashboard on, the way wpcomsh does for Atomic.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_wpcom_simple_premium_analytics_gate_can_be_enabled_by_sticker() {
		if ( ! defined( 'IS_WPCOM' ) ) {
			define( 'IS_WPCOM', true );
		}

		eval( 'function has_blog_sticker( $sticker, $blog_id ) { return $sticker === "jetpack-premium-analytics" && $blog_id > 0; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval
		add_filter( 'jetpack_premium_analytics_enabled', array( Jetpack_Mu_Wpcom::class, 'enable_wpcom_simple_premium_analytics_for_sticker' ) );

		$this->assertTrue( Jetpack_Mu_Wpcom::should_load_wpcom_simple_premium_analytics() );
	}

	/**
	 * The opt-in is exposed with the rollout gate off — it is one of the things that opens that
	 * gate, so registering it behind the gate would leave nothing able to open it.
	 */
	public function test_wpcom_simple_premium_analytics_enablement_setting_is_registered_when_gate_is_disabled() {
		$this->assertFalse( Jetpack_Mu_Wpcom::should_load_wpcom_simple_premium_analytics() );

		Jetpack_Mu_Wpcom::load_wpcom_simple_premium_analytics_enablement_setting();

		$this->assertArrayHasKey( 'jetpack_premium_analytics_enabled', get_registered_settings() );
	}
}
