<?php
/**
 * Tests for the promos API.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once dirname( __DIR__, 2 ) . '/src/promos.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_promos
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_available_promos
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_promos_script_data
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_promo
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_promos_feature_flag
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_promos' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_promos_feature_flag' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_available_promos' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_promos_script_data' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_promo' )]
class Promos_Test extends BaseTestCase {

	/**
	 * Promos are offered to a user who can act on them, so these run as an administrator.
	 */
	public function set_up() {
		parent::set_up();

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'promo-admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);
	}

	/**
	 * Drop the flag, the filters and the registry the fixtures filled.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		unset( $_GET['page'], $GLOBALS['current_screen'] );
		remove_all_filters( 'jetpack_admin_js_script_data' );
		remove_all_filters( 'jetpack_show_promotions' );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . PROMO_FLAG );
		Feature_Flags::reset();

		foreach ( array( Promo_Registry::class, Dashboard_Section_Registry::class ) as $registry_class ) {
			$instance = new \ReflectionProperty( $registry_class, 'instance' );
			if ( PHP_VERSION_ID < 80100 ) {
				$instance->setAccessible( true );
			}
			$instance->setValue( null, null );
		}

		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );

		parent::tear_down();
	}

	/**
	 * Turns the flag on and registers one promo per args array, each keyed by its `slug`.
	 *
	 * @param array ...$promos Promo arguments, each with a `slug` key.
	 */
	private function register_fixture_promos( array ...$promos ) {
		add_filter( 'jetpack_feature_flag_enabled_' . PROMO_FLAG, '__return_true' );

		foreach ( $promos as $args ) {
			$slug = $args['slug'];
			unset( $args['slug'] );
			register_promo( $slug, $args + array( 'title' => 'Try Acme' ) );
		}
	}

	/**
	 * Slugs of the available promos, in order.
	 *
	 * @return string[]
	 */
	private function available_slugs() {
		return array_map(
			static function ( Promo $promo ) {
				return $promo->slug;
			},
			get_available_promos()
		);
	}

	public function test_a_user_without_the_capability_is_offered_nothing() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/offer',
				'placement'    => 'settings',
				'is_available' => true,
			)
		);

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'promo-editor',
					'user_pass'  => 'password',
					'role'       => 'editor',
				)
			)
		);

		$this->assertSame( array(), get_available_promos() );
	}

	public function test_a_promo_can_ask_for_a_capability_of_its_own() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/offer',
				'placement'    => 'settings',
				'capability'   => 'edit_posts',
				'is_available' => true,
			)
		);

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'promo-editor',
					'user_pass'  => 'password',
					'role'       => 'editor',
				)
			)
		);

		$this->assertSame( array( 'acme/offer' ), $this->available_slugs() );
	}

	public function test_no_promos_while_the_flag_is_off() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/offer',
				'placement'    => 'settings',
				'is_available' => true,
			)
		);
		remove_all_filters( 'jetpack_feature_flag_enabled_' . PROMO_FLAG );

		$this->assertSame( array(), get_available_promos() );
	}

	public function test_no_promos_when_show_promotions_is_false() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/offer',
				'placement'    => 'settings',
				'is_available' => true,
			)
		);
		add_filter( 'jetpack_show_promotions', '__return_false' );

		$this->assertSame( array(), get_available_promos() );
	}

	public function test_show_promotions_defaults_to_true() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/offer',
				'placement'    => 'settings',
				'is_available' => true,
			)
		);

		$this->assertSame( array( 'acme/offer' ), $this->available_slugs() );
	}

	public function test_a_promo_whose_rule_fails_is_not_returned() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/shown',
				'placement'    => 'settings',
				'is_available' => true,
			),
			array(
				'slug'         => 'acme/hidden',
				'placement'    => 'settings',
				'is_available' => '__return_false',
			),
			array(
				'slug'      => 'acme/ruleless',
				'placement' => 'settings',
			)
		);

		$this->assertSame( array( 'acme/shown' ), $this->available_slugs() );
	}

	public function test_promos_are_sorted_by_order_then_slug() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/late',
				'placement'    => 'settings',
				'order'        => 20,
				'is_available' => true,
			),
			array(
				'slug'         => 'acme/zeta',
				'placement'    => 'settings',
				'order'        => 10,
				'is_available' => true,
			),
			array(
				'slug'         => 'acme/alpha',
				'placement'    => 'settings',
				'order'        => 10,
				'is_available' => true,
			),
			array(
				'slug'         => 'acme/zzz-first',
				'placement'    => 'settings',
				'order'        => 5,
				'is_available' => true,
			)
		);

		$this->assertSame(
			array( 'acme/zzz-first', 'acme/alpha', 'acme/zeta', 'acme/late' ),
			$this->available_slugs()
		);
	}

	/**
	 * Serve the dashboard page.
	 */
	private function open_dashboard() {
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );
	}

	public function test_script_data_carries_the_promos_without_clobbering_siblings() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/offer',
				'placement'    => 'settings',
				'is_available' => true,
			)
		);
		$this->open_dashboard();

		$data = inject_promos_script_data( array( 'premium_analytics' => array( 'can_view_stats' => true ) ) );

		$this->assertTrue( $data['premium_analytics']['can_view_stats'] );
		$this->assertCount( 1, $data['premium_analytics']['promos'] );
		$this->assertSame( 'acme/offer', $data['premium_analytics']['promos'][0]['slug'] );
	}

	public function test_script_data_is_left_alone_off_the_dashboard() {
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/offer',
				'placement'    => 'settings',
				'is_available' => true,
			)
		);
		$_GET['page'] = 'jetpack';
		set_current_screen( 'toplevel_page_jetpack' );

		$data = array( 'other' => 1 );

		$this->assertSame( $data, inject_promos_script_data( $data ) );
	}

	public function test_configure_registers_the_injector_at_priority_20() {
		configure_promos();

		$this->assertSame( 20, has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_promos_script_data' ) );
	}

	public function test_the_flag_registers_off_by_default() {
		register_promos_feature_flag();

		$this->assertSame(
			array(
				'default'     => false,
				'description' => 'Show the promotions the Stats v2 options menu and Settings page offer.',
				'owner'       => 'jetpack-stats',
				'name'        => PROMO_FLAG,
			),
			Feature_Flags::all()[ PROMO_FLAG ] ?? null
		);
	}

	public function test_a_registered_promo_is_withheld_while_the_flag_is_unregistered() {
		Promo_Registry::get_instance()->register(
			'acme/offer',
			array(
				'placement'    => 'settings',
				'title'        => 'Try Acme',
				'is_available' => true,
			)
		);

		$this->assertSame( array(), get_available_promos() );
	}

	public function test_a_promos_rule_runs_once_however_many_callers_ask() {
		$calls = 0;
		$this->register_fixture_promos(
			array(
				'slug'         => 'acme/offer',
				'placement'    => 'settings',
				'is_available' => function () use ( &$calls ) {
					++$calls;
					return true;
				},
			)
		);

		$first  = $this->available_slugs();
		$second = $this->available_slugs();

		$this->assertSame( 1, $calls );
		$this->assertSame( $first, $second );
	}
}
