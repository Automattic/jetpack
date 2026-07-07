<?php
/**
 * Tests for the WordPress.com Simple Premium Analytics bootstrap gate.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
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
		remove_all_filters( 'jetpack_premium_analytics_wpcom_simple_enabled' );

		parent::tear_down();
	}

	/**
	 * The Simple bootstrap gate is disabled by default.
	 */
	public function test_wpcom_simple_premium_analytics_gate_is_off_by_default() {
		$this->assertFalse( Jetpack_Mu_Wpcom::should_load_wpcom_simple_premium_analytics() );
	}

	/**
	 * The Simple bootstrap gate can be enabled for a staged site.
	 */
	public function test_wpcom_simple_premium_analytics_gate_can_be_enabled_by_filter() {
		add_filter( 'jetpack_premium_analytics_wpcom_simple_enabled', '__return_true' );

		$this->assertTrue( Jetpack_Mu_Wpcom::should_load_wpcom_simple_premium_analytics() );
	}

	/**
	 * The Simple bootstrap gate can be enabled by the rollout sticker.
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

		$this->assertTrue( Jetpack_Mu_Wpcom::should_load_wpcom_simple_premium_analytics() );
	}
}
