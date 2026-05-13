<?php
/**
 * Tests for the Image_CDN_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-image-cdn
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Image_CDN\Abilities;

use Automattic\Jetpack\Image_CDN\Image_CDN;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Unit tests for Image_CDN_Abilities registration and execution.
 *
 * Run from projects/packages/image-cdn:
 *
 *   composer phpunit -- --filter Image_CDN_Abilities_Test
 */
class Image_CDN_Abilities_Test extends BaseTestCase {

	/**
	 * Admin user ID (manage_options).
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * Subscriber user ID (no manage_options).
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * {@inheritDoc}
	 */
	public function set_up() {
		parent::set_up();

		self::$admin_id      = wp_insert_user(
			array(
				'user_login' => 'image_cdn_abilities_admin_' . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		self::$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'image_cdn_abilities_sub_' . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);

		// Open the rollout gate for every test except the one that explicitly closes it.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Reset hooks the Registrar may have added during a prior test.
		remove_action( 'wp_abilities_api_categories_init', array( Image_CDN_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Image_CDN_Abilities::class, 'register_abilities' ) );
	}

	/**
	 * {@inheritDoc}
	 */
	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'jetpack_photon_domain' );
		remove_action( 'wp_abilities_api_categories_init', array( Image_CDN_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Image_CDN_Abilities::class, 'register_abilities' ) );
		wp_set_current_user( 0 );

		if ( did_action( 'wp_abilities_api_init' ) ) {
			$this->deregister_category_and_abilities();
		}

		parent::tear_down();
	}

	/**
	 * Remove our category + abilities from the registry so tests don't bleed.
	 */
	private function deregister_category_and_abilities(): void {
		if ( function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Image_CDN_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			if ( wp_has_ability_category( Image_CDN_Abilities::CATEGORY_SLUG ) ) {
				wp_unregister_ability_category( Image_CDN_Abilities::CATEGORY_SLUG );
			}
		}
	}

	/**
	 * Simulate that the given Abilities API lifecycle action is firing.
	 *
	 * @param string $action Action name to simulate.
	 */
	private function simulate_doing_action( string $action ): void {
		global $wp_current_filter;
		$wp_current_filter[] = $action;
	}

	/**
	 * --------------------------------------------------------------------
	 * Abstract getters.
	 * --------------------------------------------------------------------
	 */
	public function test_category_slug_is_jetpack_image_cdn(): void {
		$this->assertSame( 'jetpack-image-cdn', Image_CDN_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = Image_CDN_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotSame( '', $def['label'] );
		$this->assertNotSame( '', $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = Image_CDN_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-image-cdn/', $slug );
		}
	}

	public function test_get_status_is_registered(): void {
		$abilities = Image_CDN_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-image-cdn/get-status', $abilities );
	}

	public function test_no_spec_sets_category_explicitly(): void {
		foreach ( Image_CDN_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_spec_declares_annotations_permission_and_execute(): void {
		foreach ( Image_CDN_Abilities::get_abilities() as $slug => $spec ) {
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

	public function test_get_status_is_readonly_idempotent_non_destructive(): void {
		$spec = Image_CDN_Abilities::get_abilities()['jetpack-image-cdn/get-status'];
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	/**
	 * --------------------------------------------------------------------
	 * Registrar wiring.
	 * --------------------------------------------------------------------
	 */
	public function test_init_with_rollout_disabled_registers_nothing(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		try {
			Image_CDN_Abilities::init();

			$this->assertFalse(
				has_action(
					'wp_abilities_api_categories_init',
					array( Image_CDN_Abilities::class, 'register_category' )
				),
				'No category hook should be added when the rollout filter is false.'
			);
			$this->assertFalse(
				has_action(
					'wp_abilities_api_init',
					array( Image_CDN_Abilities::class, 'register_abilities' )
				),
				'No abilities hook should be added when the rollout filter is false.'
			);
		} finally {
			remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		}
	}

	public function test_init_with_rollout_enabled_hooks_both_lifecycle_actions(): void {
		Image_CDN_Abilities::init();

		$this->assertNotFalse(
			has_action(
				'wp_abilities_api_categories_init',
				array( Image_CDN_Abilities::class, 'register_category' )
			),
			'Category init hook must be added when the rollout filter is true.'
		);
		$this->assertNotFalse(
			has_action(
				'wp_abilities_api_init',
				array( Image_CDN_Abilities::class, 'register_abilities' )
			),
			'Abilities init hook must be added when the rollout filter is true.'
		);
	}

	public function test_register_abilities_skips_when_should_register_filter_returns_false(): void {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available' );
			return;
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			function ( $enabled, $type, $slug ) {
				if ( 'ability' === $type && 'jetpack-image-cdn/get-status' === $slug ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->simulate_doing_action( 'wp_abilities_api_init' );
		Image_CDN_Abilities::register_abilities();

		$this->assertFalse(
			wp_has_ability( 'jetpack-image-cdn/get-status' ),
			'should_register filter returning false must skip ability registration.'
		);
	}

	public function test_register_abilities_registers_get_status_with_category_injected(): void {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available' );
			return;
		}

		$this->simulate_doing_action( 'wp_abilities_api_categories_init' );
		Image_CDN_Abilities::register_category();

		$this->simulate_doing_action( 'wp_abilities_api_init' );
		Image_CDN_Abilities::register_abilities();

		$ability = wp_get_ability( 'jetpack-image-cdn/get-status' );
		$this->assertNotNull( $ability, 'get-status ability should be registered.' );
	}

	/**
	 * --------------------------------------------------------------------
	 * Permission callback.
	 * --------------------------------------------------------------------
	 */
	public function test_can_view_status_allows_admin(): void {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( Image_CDN_Abilities::can_view_status() );
	}

	public function test_can_view_status_denies_subscriber(): void {
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( Image_CDN_Abilities::can_view_status() );
	}

	public function test_can_view_status_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( Image_CDN_Abilities::can_view_status() );
	}

	/**
	 * --------------------------------------------------------------------
	 * Execute callback — get-status.
	 * --------------------------------------------------------------------
	 */
	public function test_get_status_returns_documented_shape(): void {
		$result = Image_CDN_Abilities::get_status();

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'active', $result );
		$this->assertIsBool( $result['active'] );

		$this->assertArrayHasKey( 'settings', $result );
		$this->assertIsArray( $result['settings'] );
		foreach ( array( 'quality', 'formats', 'srcset_enabled', 'cdn_domain' ) as $key ) {
			$this->assertArrayHasKey( $key, $result['settings'], "settings.{$key} must be present" );
		}
		$this->assertIsBool( $result['settings']['srcset_enabled'] );
		$this->assertIsString( $result['settings']['cdn_domain'] );
		// `quality` and `formats` are unknown at the package layer.
		$this->assertNull( $result['settings']['quality'] );
		$this->assertNull( $result['settings']['formats'] );

		$this->assertArrayHasKey( 'supported_mime_types', $result );
		$this->assertIsArray( $result['supported_mime_types'] );
		$this->assertNotEmpty( $result['supported_mime_types'] );
	}

	public function test_get_status_active_reflects_image_cdn_state(): void {
		// `Image_CDN::is_enabled()` is true once `instance()` has run; calling
		// it explicitly here pins the activation flag so the assertion is
		// independent of test-order side effects.
		Image_CDN::instance();

		$result = Image_CDN_Abilities::get_status();
		$this->assertTrue( $result['active'] );
		$this->assertTrue( $result['settings']['srcset_enabled'] );
	}

	public function test_get_status_uses_default_cdn_domain_when_no_filter_set(): void {
		$result = Image_CDN_Abilities::get_status();
		$this->assertSame( 'https://i0.wp.com', $result['settings']['cdn_domain'] );
	}

	public function test_get_status_honors_jetpack_photon_domain_filter(): void {
		add_filter(
			'jetpack_photon_domain',
			static function () {
				return 'https://cdn.example.com';
			}
		);

		$result = Image_CDN_Abilities::get_status();
		$this->assertSame( 'https://cdn.example.com', $result['settings']['cdn_domain'] );
	}

	public function test_get_status_falls_back_to_default_when_filter_returns_empty_string(): void {
		add_filter(
			'jetpack_photon_domain',
			static function () {
				return '';
			}
		);

		$result = Image_CDN_Abilities::get_status();
		$this->assertSame( 'https://i0.wp.com', $result['settings']['cdn_domain'] );
	}

	public function test_get_status_supported_mime_types_are_deduplicated(): void {
		$result = Image_CDN_Abilities::get_status();
		$mimes  = $result['supported_mime_types'];

		// `jpg` and `jpeg` both map to image/jpeg; the response must not list it twice.
		$this->assertSame( array_unique( $mimes ), $mimes );
		$this->assertContains( 'image/jpeg', $mimes );
		$this->assertContains( 'image/png', $mimes );
		$this->assertContains( 'image/gif', $mimes );
		$this->assertContains( 'image/webp', $mimes );
		$this->assertContains( 'image/heic', $mimes );
	}

	public function test_get_status_ignores_input(): void {
		// Zero-arg ability — any input must be tolerated and discarded.
		$result_a = Image_CDN_Abilities::get_status( null );
		$result_b = Image_CDN_Abilities::get_status( array( 'foo' => 'bar' ) );

		$this->assertSame( $result_a, $result_b );
	}
}
