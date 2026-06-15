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
	 * The Google-verification bootstrap exposes the connect URL + connection flag the
	 * React app expects, with the right types. Without the host plugin's Keyring/Manager
	 * classes present (the package test context) it degrades to an empty URL and not
	 * connected, so the UI falls back to manual entry.
	 */
	public function test_get_google_verify_data_shape() {
		$data = Initializer::get_google_verify_data();

		$this->assertArrayHasKey( 'connect_url', $data );
		$this->assertArrayHasKey( 'is_connected', $data );
		$this->assertIsString( $data['connect_url'] );
		$this->assertIsBool( $data['is_connected'] );
		$this->assertSame( '', $data['connect_url'] );
		$this->assertFalse( $data['is_connected'] );
	}

	/**
	 * The AI tab bootstrap exposes the enhancer shape the React app expects, with
	 * boolean availability/enabled. Without a plan-supporting environment the
	 * enhancer is unavailable.
	 */
	public function test_get_ai_data_shape() {
		// Force the enhancer feature filter off so availability is deterministic
		// regardless of whether Current_Plan happens to be loaded in the test
		// environment (availability is `filter_on && plan_supports`).
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );

		try {
			$ai = Initializer::get_ai_data();

			$this->assertArrayHasKey( 'enhancer', $ai );
			$this->assertArrayHasKey( 'available', $ai['enhancer'] );
			$this->assertArrayHasKey( 'enabled', $ai['enhancer'] );
			$this->assertIsBool( $ai['enhancer']['available'] );
			$this->assertIsBool( $ai['enhancer']['enabled'] );
			// With the feature filter forced off, the enhancer is never available.
			$this->assertFalse( $ai['enhancer']['available'] );
		} finally {
			remove_filter( 'ai_seo_enhancer_enabled', '__return_false' );
		}
	}
}
