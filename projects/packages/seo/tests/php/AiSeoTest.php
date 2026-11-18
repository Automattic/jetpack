<?php
/**
 * Tests for AI SEO availability and entitlement checks.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\SEO\Ai_Seo
 */
#[CoversClass( Ai_Seo::class )]
class AiSeoTest extends SeoTestCase {

	/**
	 * Reset the option, filters and plan pin every test touches.
	 */
	protected function tearDown(): void {
		delete_option( 'ai_seo_enhancer_enabled' );
		remove_all_filters( 'ai_seo_enhancer_enabled' );
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( 'jetpack_disable_seo_tools' );

		self::reset_plan();

		parent::tearDown();
	}

	/**
	 * Every term satisfied: available.
	 */
	public function test_is_available_when_all_inputs_true() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );

		$this->assertTrue( Ai_Seo::is_available() );
	}

	/**
	 * The feature filter vetoes on its own.
	 */
	public function test_is_not_available_when_filter_off() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );

		$this->assertFalse( Ai_Seo::is_available() );
	}

	/**
	 * The seo-tools module vetoes on its own.
	 */
	public function test_is_not_available_when_seo_tools_module_inactive() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( false );

		$this->assertFalse( Ai_Seo::is_available() );
	}

	public function test_manual_seo_on_a_free_plan_does_not_unlock_ai() {
		self::set_plan( 'jetpack_free' );
		self::set_seo_tools_active( true );

		$this->assertTrue( \Automattic\Jetpack\Current_Plan::supports( 'advanced-seo' ) );
		$this->assertFalse( Ai_Seo::is_available() );
	}

	/**
	 * A conflicting SEO plugin (jetpack_disable_seo_tools) vetoes on its own.
	 */
	public function test_is_not_available_when_seo_tools_are_disabled_by_filter() {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );

		$this->assertFalse( Ai_Seo::is_available() );
	}

	/**
	 * @dataProvider provide_feature_entitlements
	 * @param string[] $features Granted WordPress.com features.
	 * @param bool     $expected Whether AI metadata is available.
	 */
	#[DataProvider( 'provide_feature_entitlements' )]
	public function test_hosted_entitlement_matches_metadata_abilities( $features, $expected ) {
		self::set_plan( 'jetpack_business' );
		self::set_seo_tools_active( true );
		\Wpcom_Test_Features::$known    = array( 'advanced-seo', 'ai-seo-enhancer' );
		\Wpcom_Test_Features::$entitled = $features;

		try {
			$this->assertSame( $expected, Ai_Seo::is_available() );
			$this->assertSame( $expected, Ai_Seo::has_reachable_surface() );
		} finally {
			\Wpcom_Test_Features::reset();
		}
	}

	public static function provide_feature_entitlements() {
		return array(
			'neither entitlement' => array( array(), false ),
			'manual SEO only'     => array( array( 'advanced-seo' ), false ),
			'enhancer only'       => array( array( 'ai-seo-enhancer' ), true ),
			'both entitlements'   => array( array( 'advanced-seo', 'ai-seo-enhancer' ), true ),
		);
	}
}
