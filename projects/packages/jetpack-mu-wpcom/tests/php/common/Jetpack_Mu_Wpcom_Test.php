<?php
/**
 * Tests for the Jetpack_Mu_Wpcom bootstrap.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Admin_UI\Admin_Shell;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

/**
 * Test class for Jetpack_Mu_Wpcom::init().
 */
class Jetpack_Mu_Wpcom_Test extends TestCase {

	/**
	 * The bootstrap's init() leaves notifications on off Atomic, and init() on Atomic turns them off.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_init_turns_threat_notifications_off_only_on_atomic() {
		$this->assertTrue( apply_filters( 'jetpack_protect_threat_notifications_enabled', true ) );

		// init() runs once per request, so let it run again as Atomic.
		unset( $GLOBALS['wp_actions']['jetpack_mu_wpcom_initialized'] );
		Constants::set_constant( 'IS_ATOMIC', true );
		Jetpack_Mu_Wpcom::init();

		$this->assertFalse( apply_filters( 'jetpack_protect_threat_notifications_enabled', true ) );
	}

	/**
	 * My Jetpack's plan links stay Jetpack's off Atomic; init() on Atomic sends them to WordPress.com, or hides the ones a site has no use for.
	 *
	 * @dataProvider provide_wpcom_plans
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param string $plan_slug    The site's WordPress.com plan.
	 * @param bool   $can_upgrade  Whether the site is offered the upgrade flow.
	 * @param bool   $can_manage   Whether the site is offered its WordPress.com purchases.
	 * @param array  $site_options Options to set on the site.
	 */
	#[DataProvider( 'provide_wpcom_plans' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_init_sends_my_jetpack_plan_links_to_wpcom_only_on_atomic( $plan_slug, $can_upgrade, $can_manage = true, $site_options = array() ) {
		$jetpack = array(
			'purchase' => '',
			'manage'   => '',
		);

		$GLOBALS['wpcom_get_site_purchases_test_value'] = array(
			(object) array(
				'product_slug' => $plan_slug,
				'product_type' => 'bundle',
			),
		);
		foreach ( $site_options as $option => $value ) {
			update_option( $option, $value );
		}
		$this->assertSame( $jetpack, apply_filters( 'jetpack_my_jetpack_plan_urls', $jetpack ) );

		unset( $GLOBALS['wp_actions']['jetpack_mu_wpcom_initialized'] );
		Constants::set_constant( 'IS_ATOMIC', true );
		Jetpack_Mu_Wpcom::init();

		$urls = apply_filters( 'jetpack_my_jetpack_plan_urls', $jetpack );
		$host = wp_parse_url( home_url(), PHP_URL_HOST );
		$this->assertSame( $can_manage ? 'https://wordpress.com/purchases/subscriptions/' . $host : false, $urls['manage'] );

		if ( ! $can_upgrade ) {
			$this->assertFalse( $urls['purchase'] );
			return;
		}

		$my_jetpack = admin_url( 'admin.php?page=my-jetpack' );
		parse_str( (string) wp_parse_url( $urls['purchase'], PHP_URL_QUERY ), $query );

		$this->assertStringStartsWith( 'https://wordpress.com/setup/plan-upgrade?', $urls['purchase'] );
		$this->assertSame(
			array(
				'siteSlug'    => $host,
				'back_to'     => $my_jetpack,
				'redirect_to' => $my_jetpack,
			),
			$query
		);
	}

	/**
	 * Data provider for test_init_sends_my_jetpack_plan_links_to_wpcom_only_on_atomic.
	 *
	 * @return array
	 */
	public static function provide_wpcom_plans() {
		return array(
			'Business'                    => array( 'business-bundle', true ),
			'Commerce'                    => array( 'ecommerce-bundle-2y', false ),
			'Woo Hosted Pro'              => array( 'woo_hosted_pro_plan_yearly', false ),
			// Slugs close to Commerce's keep the link.
			'a Commerce trial'            => array( 'ecommerce-trial-bundle-monthly', true ),
			'Woo Express'                 => array( 'wooexpress-medium-bundle-yearly', true ),
			'a staging site'              => array( 'business-bundle', false, false, array( 'wpcom_is_staging_site' => true ) ),
			'a fully managed agency site' => array( 'business-bundle', false, false, array( 'is_fully_managed_agency_site' => true ) ),
		);
	}

	/**
	 * Simple starts the admin shell and lists its flag; the bootstrap's init(), as off Simple, leaves both alone.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_init_starts_the_admin_shell_only_on_simple() {
		$this->assertFalse( has_action( 'plugins_loaded', array( Jetpack_Mu_Wpcom::class, 'load_admin_shell' ) ) );

		unset( $GLOBALS['wp_actions']['jetpack_mu_wpcom_initialized'] );
		define( 'IS_WPCOM', true );
		Jetpack_Mu_Wpcom::init();
		$this->assertSame( 10, has_action( 'plugins_loaded', array( Jetpack_Mu_Wpcom::class, 'load_admin_shell' ) ) );

		Jetpack_Mu_Wpcom::load_admin_shell();

		$this->assertNotNull( Feature_Flags::get( Admin_Shell::FLAG ) );
		$this->assertSame( 10, has_action( 'wp_ajax_' . Admin_Shell::GUEST_ACTION, array( Admin_Shell::class, 'ajax_guest_assets' ) ) );
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', array( Admin_Shell::class, 'setup' ) ) );
	}
}
