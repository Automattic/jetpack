<?php
/**
 * Test class for wpcom-activity-log.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-activity-log/wpcom-activity-log.php';

/**
 * Class WPCOM_Activity_Log_Test
 */
class WPCOM_Activity_Log_Test extends \WorDBless\BaseTestCase {

	/**
	 * My Jetpack drops a replacement class that isn't a child of the one it registered, and says
	 * nothing when it does — the card would just keep reporting the module state.
	 */
	public function test_wpcom_class_is_a_my_jetpack_activity_log_product() {
		$this->assertTrue(
			is_subclass_of(
				'Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Activity_Log',
				'Automattic\Jetpack\My_Jetpack\Products\Activity_Log'
			)
		);
	}

	/**
	 * The point of the override: the card reads Active whatever the module option says.
	 */
	public function test_wpcom_class_reports_the_product_active() {
		\Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );

		$this->assertTrue( \Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Activity_Log::is_active() );
		$this->assertTrue( \Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Activity_Log::is_activated() );
	}

	/**
	 * The class name is a string on purpose: `::class` here would load the subclass before
	 * my-jetpack, which owns its parent, and fatal.
	 */
	public function test_filter_points_the_activity_log_card_at_the_wpcom_class() {
		$classes = wpcom_activity_log_product_class( array( 'activity-log' => 'Products\Activity_Log' ) );

		$this->assertSame(
			'Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Activity_Log',
			$classes['activity-log']
		);
	}

	/**
	 * Other products keep whatever class they were registered with.
	 */
	public function test_filter_leaves_the_other_products_alone() {
		$classes = wpcom_activity_log_product_class( array( 'stats' => 'Products\Stats' ) );

		$this->assertSame( 'Products\Stats', $classes['stats'] );
	}

	/**
	 * Nothing else here would fail if init() stopped wiring the filter, since the tests above
	 * call the callback directly.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_package_bootstrap_wires_the_product_class_on_atomic() {
		if ( ! defined( 'IS_ATOMIC' ) ) {
			define( 'IS_ATOMIC', true );
		}

		unset( $GLOBALS['wp_actions']['jetpack_mu_wpcom_initialized'] );
		Jetpack_Mu_Wpcom::init();

		$this->assertNotFalse(
			has_filter( 'my_jetpack_products_classes', 'wpcom_activity_log_product_class' ),
			'Jetpack_Mu_Wpcom::init() must register the product class override on Atomic.'
		);
	}

	/**
	 * The negative case is what keeps Simple and self-hosted sites on the stock product class,
	 * where the module state is the right answer.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_package_bootstrap_leaves_the_product_class_alone_without_atomic() {
		unset( $GLOBALS['wp_actions']['jetpack_mu_wpcom_initialized'] );
		Jetpack_Mu_Wpcom::init();

		$this->assertFalse(
			has_filter( 'my_jetpack_products_classes', 'wpcom_activity_log_product_class' ),
			'The product class override must not be registered off Atomic.'
		);
	}
}
