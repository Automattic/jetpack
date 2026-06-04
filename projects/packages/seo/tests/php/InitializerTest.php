<?php
/**
 * Tests for the Jetpack SEO Initializer.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Initializer
 */
#[CoversClass( Initializer::class )]
class InitializerTest extends TestCase {

	/**
	 * The Initializer class exists and exposes the expected menu slug.
	 */
	public function test_menu_slug_constant_is_defined() {
		$this->assertSame( 'jetpack-seo', Initializer::MENU_SLUG );
	}

	/**
	 * The package version constant is defined and non-empty.
	 */
	public function test_package_version_constant_is_defined() {
		$this->assertNotEmpty( Initializer::PACKAGE_VERSION );
	}

	/**
	 * The feature-flag filter name is the expected slug.
	 */
	public function test_feature_filter_constant_is_defined() {
		$this->assertSame( 'rsm_jetpack_seo', Initializer::FEATURE_FILTER );
	}

	/**
	 * The AI tab bootstrap exposes the enhancer shape the React app expects, with
	 * boolean availability/enabled. Without a plan-supporting environment the
	 * enhancer is unavailable.
	 */
	public function test_get_ai_data_shape() {
		$ai = Initializer::get_ai_data();

		$this->assertArrayHasKey( 'enhancer', $ai );
		$this->assertArrayHasKey( 'available', $ai['enhancer'] );
		$this->assertArrayHasKey( 'enabled', $ai['enhancer'] );
		$this->assertIsBool( $ai['enhancer']['available'] );
		$this->assertIsBool( $ai['enhancer']['enabled'] );
		// Current_Plan isn't present in the package test context, so the enhancer
		// can't be available regardless of the feature filter.
		$this->assertFalse( $ai['enhancer']['available'] );
	}
}
