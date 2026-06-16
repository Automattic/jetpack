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

	/**
	 * The site-identity bootstrap (used by the Settings search/social previews)
	 * exposes title, url, icon and image, all as strings. With no site icon or
	 * custom logo in the test environment the image falls back to the (empty)
	 * icon.
	 */
	public function test_get_site_data_shape() {
		$site = Initializer::get_site_data();

		$this->assertArrayHasKey( 'title', $site );
		$this->assertArrayHasKey( 'url', $site );
		$this->assertArrayHasKey( 'icon', $site );
		$this->assertArrayHasKey( 'image', $site );
		$this->assertIsString( $site['title'] );
		$this->assertIsString( $site['url'] );
		$this->assertIsString( $site['icon'] );
		$this->assertIsString( $site['image'] );
	}

	/**
	 * On self-hosted sites, discoverability is driven by the durable cohort option:
	 * hidden when absent (the non-disruptive default) or empty, visible when set.
	 */
	public function test_is_seo_surface_visible_reads_cohort_option_on_self_hosted() {
		delete_option( Initializer::VISIBILITY_OPTION );
		$this->assertFalse( Initializer::is_seo_surface_visible() );

		update_option( Initializer::VISIBILITY_OPTION, '1' );
		$this->assertTrue( Initializer::is_seo_surface_visible() );

		update_option( Initializer::VISIBILITY_OPTION, '' );
		$this->assertFalse( Initializer::is_seo_surface_visible() );

		delete_option( Initializer::VISIBILITY_OPTION );
	}

	/**
	 * WordPress.com sites (here: Simple, via the IS_WPCOM constant) are always
	 * discoverable, bypassing the cohort option entirely.
	 */
	public function test_is_seo_surface_visible_always_true_on_wpcom() {
		delete_option( Initializer::VISIBILITY_OPTION ); // Hidden for self-hosted...
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );

		try {
			$this->assertTrue( Initializer::is_seo_surface_visible() );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}
}
