<?php
/**
 * Unit tests for the Social_Settings_Abilities Registrar subclass.
 *
 * @package automattic/jetpack-publicize
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Publicize\Abilities;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Settings as Social_Settings;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Publicize\Abilities\Social_Settings_Abilities
 */
#[CoversClass( Social_Settings_Abilities::class )]
class Social_Settings_Abilities_Test extends BaseTestCase {

	/** @var int */
	private $admin_id;

	/** @var int */
	private $subscriber_id;

	/**
	 * Spin up users and open the rollout gate. Specific tests opt out.
	 */
	public function setUp(): void {
		parent::setUp();

		// `build_settings_snapshot()` calls `is_sig_available()`, which reads
		// the request-scoped `Current_Plan` cache. Clear it so this test neither
		// reads a plan cached by earlier tests nor leaks its own cached plan
		// into later tests (e.g. Social_Image_Generator_Settings_Test).
		self::reset_active_plan_cache();

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'social_ability_admin_' . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'social_ability_sub_' . wp_generate_password( 6, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);

		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// In a real Jetpack plugin install `class_exists( 'Jetpack' )` makes the
		// publicize module discoverable; in the standalone Social plugin
		// `Jetpack_Social::social_filter_available_modules()` registers it as an
		// available standalone module. The publicize package test env has
		// neither, so mirror the standalone-plugin filter here — otherwise
		// `Modules::is_active( 'publicize' )` (availability-filtered) can never
		// report true even after the module is activated.
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'mock_publicize_available' ) );
	}

	/**
	 * Mirror Jetpack_Social::social_filter_available_modules() so the publicize
	 * module counts as available in the package test environment.
	 *
	 * @param array $modules Available standalone module slugs.
	 * @return array
	 */
	public function mock_publicize_available( $modules ): array {
		return array_merge( array( 'publicize' ), (array) $modules );
	}

	/**
	 * Drop hooks, abilities, and stored settings between tests.
	 */
	public function tearDown(): void {
		wp_set_current_user( 0 );

		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'mock_publicize_available' ) );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );

		delete_option( Social_Settings::OPTION_PREFIX . Social_Settings::MESSAGE_TEMPLATE );
		delete_option( Social_Settings::OPTION_PREFIX . Social_Settings::IMAGE_GENERATOR_SETTINGS );
		delete_option( Social_Settings::OPTION_PREFIX . Social_Settings::UTM_SETTINGS );
		delete_option( Social_Settings::JETPACK_SOCIAL_NOTE_CPT_ENABLED );
		delete_option( Social_Settings::NOTES_FLUSH_REWRITE_RULES_FLUSHED );
		delete_option( 'jetpack_active_modules' );

		$this->deregister_social_abilities();

		// Clear the Current_Plan cache so a plan resolved during this test does
		// not bleed into other tests.
		self::reset_active_plan_cache();

		parent::tearDown();
	}

	/**
	 * Force the next `Current_Plan::get()` to re-read from the option store.
	 */
	private static function reset_active_plan_cache(): void {
		$reflection = new \ReflectionClass( Current_Plan::class );
		$property   = $reflection->getProperty( 'active_plan_cache' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * Remove ability + category registrations so the next test starts clean.
	 */
	private function deregister_social_abilities(): void {
		if ( function_exists( 'wp_has_ability' ) && function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Social_Settings_Abilities::get_abilities() ) as $slug ) {
				if ( wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_has_ability_category' ) && function_exists( 'wp_unregister_ability_category' ) ) {
			$slug = Social_Settings_Abilities::get_category_slug();
			if ( wp_has_ability_category( $slug ) ) {
				wp_unregister_ability_category( $slug );
			}
		}
	}

	/**
	 * Simulate the `wp_abilities_api_categories_init` action being mid-flight
	 * so direct calls to `register_category()` from a "did_action" branch are
	 * exercised correctly.
	 */
	private function simulate_doing_categories_init(): void {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_categories_init';
	}

	/**
	 * Simulate the `wp_abilities_api_init` action being mid-flight.
	 */
	private function simulate_doing_abilities_init(): void {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_init';
	}

	/** -------------------- Abstract getters -------------------- */
	public function test_category_slug_is_jetpack_social(): void {
		$this->assertSame( 'jetpack-social', Social_Settings_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description(): void {
		$def = Social_Settings_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotEmpty( $def['label'] );
		$this->assertNotEmpty( $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced(): void {
		$abilities = Social_Settings_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-social/', $slug );
		}
	}

	public function test_expected_ability_slugs_are_present(): void {
		$slugs = array_keys( Social_Settings_Abilities::get_abilities() );
		foreach ( array( 'jetpack-social/get-settings', 'jetpack-social/update-settings' ) as $expected ) {
			$this->assertContains( $expected, $slugs );
		}
	}

	public function test_no_spec_sets_category_explicitly(): void {
		// Registrar auto-injects category; specs that set it are redundant and drift-prone.
		foreach ( Social_Settings_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_every_ability_has_strict_input_schema(): void {
		foreach ( Social_Settings_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'input_schema', $spec, "Ability {$slug} missing input_schema." );
			$this->assertSame( 'object', $spec['input_schema']['type'] ?? null );
			$this->assertSame(
				false,
				$spec['input_schema']['additionalProperties'] ?? null,
				"Ability {$slug} must set additionalProperties=false."
			);
		}
	}

	public function test_annotations_match_read_vs_write_contract(): void {
		$abilities = Social_Settings_Abilities::get_abilities();

		$read = $abilities['jetpack-social/get-settings']['meta']['annotations'];
		$this->assertTrue( $read['readonly'] );
		$this->assertFalse( $read['destructive'] );
		$this->assertTrue( $read['idempotent'] );

		$write = $abilities['jetpack-social/update-settings']['meta']['annotations'];
		$this->assertFalse( $write['readonly'] );
		$this->assertFalse( $write['destructive'] );
		$this->assertTrue( $write['idempotent'], 'update-settings must report idempotent — re-applying desired==current is a no-op.' );
	}

	public function test_every_spec_declares_callbacks_and_show_in_rest(): void {
		foreach ( Social_Settings_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'execute_callback', $spec, "Ability {$slug} missing execute_callback" );
			$this->assertIsCallable( $spec['execute_callback'], "Ability {$slug} execute_callback is not callable" );
			$this->assertArrayHasKey( 'permission_callback', $spec, "Ability {$slug} missing permission_callback" );
			$this->assertIsCallable( $spec['permission_callback'], "Ability {$slug} permission_callback is not callable" );
			$this->assertTrue( $spec['meta']['show_in_rest'] ?? false, "Ability {$slug} must opt into REST." );
		}
	}

	/** -------------------- Registrar wiring -------------------- */
	public function test_init_registers_nothing_when_gate_filter_is_false(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Social_Settings_Abilities::init();

		$this->assertFalse(
			has_action( 'wp_abilities_api_categories_init', array( Social_Settings_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( 'wp_abilities_api_init', array( Social_Settings_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true(): void {
		Social_Settings_Abilities::init();

		$this->assertNotFalse(
			has_action( 'wp_abilities_api_categories_init', array( Social_Settings_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( 'wp_abilities_api_init', array( Social_Settings_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_register_abilities_registers_every_slug(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this test environment.' );
		}

		$this->simulate_doing_categories_init();
		Social_Settings_Abilities::register_category();

		$this->simulate_doing_abilities_init();
		Social_Settings_Abilities::register_abilities();

		$registered = array_map(
			static function ( $a ) {
				return $a->get_name();
			},
			array_filter(
				wp_get_abilities(),
				static function ( $a ) {
					return 0 === strpos( $a->get_name(), 'jetpack-social/' );
				}
			)
		);

		foreach ( array_keys( Social_Settings_Abilities::get_abilities() ) as $slug ) {
			$this->assertContains( $slug, $registered, "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected(): void {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_has_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this test environment.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				unset( $slug );
				if ( 'ability' === $type ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->simulate_doing_categories_init();
		Social_Settings_Abilities::register_category();
		$this->simulate_doing_abilities_init();
		Social_Settings_Abilities::register_abilities();

		foreach ( array_keys( Social_Settings_Abilities::get_abilities() ) as $slug ) {
			$this->assertFalse( wp_has_ability( $slug ), "Ability {$slug} must be filtered out." );
		}
	}

	/** -------------------- Permission callbacks -------------------- */
	public function test_can_manage_settings_requires_manage_options_cap(): void {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Social_Settings_Abilities::can_manage_settings() );

		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Social_Settings_Abilities::can_manage_settings() );
	}

	/** -------------------- get-settings -------------------- */
	public function test_get_settings_returns_canonical_snapshot_defaults(): void {
		$settings = Social_Settings_Abilities::get_settings();

		$this->assertIsArray( $settings );
		$this->assertArrayHasKey( 'auto_share_enabled', $settings );
		$this->assertArrayHasKey( 'share_message_template', $settings );
		$this->assertArrayHasKey( 'image_generator_enabled', $settings );
		$this->assertArrayHasKey( 'image_generator_template', $settings );
		$this->assertArrayHasKey( 'utm_enabled', $settings );
		$this->assertArrayHasKey( 'social_notes_enabled', $settings );
		$this->assertArrayHasKey( 'supports', $settings );

		// Default values: publicize module not active, options unset.
		$this->assertFalse( $settings['auto_share_enabled'] );
		$this->assertSame( Social_Settings::DEFAULT_MESSAGE_TEMPLATE, $settings['share_message_template'] );
		$this->assertFalse( $settings['image_generator_enabled'] );
		$this->assertFalse( $settings['utm_enabled'] );
		$this->assertFalse( $settings['social_notes_enabled'] );

		$this->assertIsArray( $settings['supports'] );
		$this->assertArrayHasKey( 'image_generator', $settings['supports'] );
		$this->assertArrayHasKey( 'utm', $settings['supports'] );
		$this->assertArrayHasKey( 'social_notes', $settings['supports'] );
	}

	public function test_get_settings_reflects_stored_options(): void {
		update_option(
			Social_Settings::OPTION_PREFIX . Social_Settings::MESSAGE_TEMPLATE,
			'Hi {title} {url}'
		);
		update_option(
			Social_Settings::OPTION_PREFIX . Social_Settings::IMAGE_GENERATOR_SETTINGS,
			array(
				'enabled'  => true,
				'template' => 'edge_to_edge_text',
			)
		);
		update_option(
			Social_Settings::OPTION_PREFIX . Social_Settings::UTM_SETTINGS,
			array( 'enabled' => true )
		);
		update_option( Social_Settings::JETPACK_SOCIAL_NOTE_CPT_ENABLED, true );

		$settings = Social_Settings_Abilities::get_settings();

		$this->assertSame( 'Hi {title} {url}', $settings['share_message_template'] );
		$this->assertTrue( $settings['image_generator_enabled'] );
		$this->assertSame( 'edge_to_edge_text', $settings['image_generator_template'] );
		$this->assertTrue( $settings['utm_enabled'] );
		$this->assertTrue( $settings['social_notes_enabled'] );
	}

	/** -------------------- update-settings: idempotency -------------------- */
	public function test_update_settings_no_op_when_input_empty(): void {
		$result = Social_Settings_Abilities::update_settings( array() );

		$this->assertIsArray( $result );
		$this->assertFalse( $result['changed'] );
		$this->assertSame( array(), $result['changed_fields'] );
		$this->assertArrayHasKey( 'settings', $result );
	}

	public function test_update_settings_no_op_when_desired_equals_current(): void {
		// Seed state to match the desired payload.
		update_option(
			Social_Settings::OPTION_PREFIX . Social_Settings::MESSAGE_TEMPLATE,
			'Already set {title}'
		);
		update_option(
			Social_Settings::OPTION_PREFIX . Social_Settings::IMAGE_GENERATOR_SETTINGS,
			array(
				'enabled'  => false,
				'template' => 'edge_to_edge_text',
			)
		);
		update_option(
			Social_Settings::OPTION_PREFIX . Social_Settings::UTM_SETTINGS,
			array( 'enabled' => false )
		);
		update_option( Social_Settings::JETPACK_SOCIAL_NOTE_CPT_ENABLED, false );

		$result = Social_Settings_Abilities::update_settings(
			array(
				'share_message_template'   => 'Already set {title}',
				'image_generator_enabled'  => false,
				'image_generator_template' => 'edge_to_edge_text',
				'utm_enabled'              => false,
				'social_notes_enabled'     => false,
			)
		);

		$this->assertFalse( $result['changed'] );
		$this->assertSame( array(), $result['changed_fields'] );
	}

	/** -------------------- update-settings: real changes -------------------- */
	public function test_update_settings_updates_share_message_template(): void {
		$result = Social_Settings_Abilities::update_settings(
			array( 'share_message_template' => 'Read {title}: {url}' )
		);

		$this->assertTrue( $result['changed'] );
		$this->assertContains( 'share_message_template', $result['changed_fields'] );
		$this->assertSame( 'Read {title}: {url}', $result['settings']['share_message_template'] );
		$this->assertSame(
			'Read {title}: {url}',
			get_option( Social_Settings::OPTION_PREFIX . Social_Settings::MESSAGE_TEMPLATE )
		);
	}

	public function test_update_settings_sanitizes_share_message_template_length(): void {
		$long_input = str_repeat( 'a', Social_Settings::MESSAGE_TEMPLATE_MAX_LENGTH + 50 );

		$result = Social_Settings_Abilities::update_settings(
			array( 'share_message_template' => $long_input )
		);

		$this->assertTrue( $result['changed'] );
		$this->assertSame(
			Social_Settings::MESSAGE_TEMPLATE_MAX_LENGTH,
			mb_strlen( $result['settings']['share_message_template'], 'UTF-8' )
		);
	}

	public function test_update_settings_updates_image_generator_enabled(): void {
		$result = Social_Settings_Abilities::update_settings(
			array( 'image_generator_enabled' => true )
		);

		$this->assertTrue( $result['changed'] );
		$this->assertContains( 'image_generator_enabled', $result['changed_fields'] );
		$this->assertTrue( $result['settings']['image_generator_enabled'] );

		$stored = get_option( Social_Settings::OPTION_PREFIX . Social_Settings::IMAGE_GENERATOR_SETTINGS );
		$this->assertTrue( $stored['enabled'] );
	}

	public function test_update_settings_updates_image_generator_template(): void {
		// Use a non-default template slug so the desired-vs-current diff is real.
		$result = Social_Settings_Abilities::update_settings(
			array( 'image_generator_template' => 'edge_to_edge_text' )
		);

		$this->assertTrue( $result['changed'] );
		$this->assertContains( 'image_generator_template', $result['changed_fields'] );
		$this->assertSame( 'edge_to_edge_text', $result['settings']['image_generator_template'] );

		$stored = get_option( Social_Settings::OPTION_PREFIX . Social_Settings::IMAGE_GENERATOR_SETTINGS );
		$this->assertSame( 'edge_to_edge_text', $stored['template'] );
	}

	public function test_update_settings_updates_utm_enabled(): void {
		$result = Social_Settings_Abilities::update_settings(
			array( 'utm_enabled' => true )
		);

		$this->assertTrue( $result['changed'] );
		$this->assertContains( 'utm_enabled', $result['changed_fields'] );
		$this->assertTrue( $result['settings']['utm_enabled'] );

		$stored = get_option( Social_Settings::OPTION_PREFIX . Social_Settings::UTM_SETTINGS );
		$this->assertTrue( $stored['enabled'] );
	}

	public function test_update_settings_updates_social_notes_enabled(): void {
		// Seed the flush flag to confirm update_settings clears it.
		update_option( Social_Settings::NOTES_FLUSH_REWRITE_RULES_FLUSHED, '1' );

		$result = Social_Settings_Abilities::update_settings(
			array( 'social_notes_enabled' => true )
		);

		$this->assertTrue( $result['changed'] );
		$this->assertContains( 'social_notes_enabled', $result['changed_fields'] );
		$this->assertTrue( $result['settings']['social_notes_enabled'] );
		$this->assertTrue( (bool) get_option( Social_Settings::JETPACK_SOCIAL_NOTE_CPT_ENABLED ) );
		$this->assertFalse(
			get_option( Social_Settings::NOTES_FLUSH_REWRITE_RULES_FLUSHED ),
			'Toggling social notes should clear the rewrite-rules-flushed flag.'
		);
	}

	public function test_update_settings_rejects_non_string_image_generator_template(): void {
		$result = Social_Settings_Abilities::update_settings(
			array( 'image_generator_template' => 12345 )
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_social_invalid_image_generator_template', $result->get_error_code() );
	}

	public function test_update_settings_auto_share_enabled_toggles_publicize_module(): void {
		$modules = new Modules();
		$this->assertFalse( $modules->is_active( 'publicize' ) );

		$result = Social_Settings_Abilities::update_settings(
			array( 'auto_share_enabled' => true )
		);

		$this->assertTrue( $result['changed'] );
		$this->assertContains( 'auto_share_enabled', $result['changed_fields'] );
		$this->assertTrue( $result['settings']['auto_share_enabled'] );
		$this->assertTrue( ( new Modules() )->is_active( 'publicize' ) );

		// Re-apply: idempotent.
		$result_again = Social_Settings_Abilities::update_settings(
			array( 'auto_share_enabled' => true )
		);
		$this->assertFalse( $result_again['changed'] );
		$this->assertSame( array(), $result_again['changed_fields'] );
	}

	public function test_update_settings_multi_field_call_reports_all_changes(): void {
		$result = Social_Settings_Abilities::update_settings(
			array(
				'share_message_template' => 'Hello',
				'utm_enabled'            => true,
			)
		);

		$this->assertTrue( $result['changed'] );
		$this->assertContains( 'share_message_template', $result['changed_fields'] );
		$this->assertContains( 'utm_enabled', $result['changed_fields'] );
		$this->assertCount( 2, $result['changed_fields'] );
	}

	public function test_update_settings_ignores_unknown_fields(): void {
		$result = Social_Settings_Abilities::update_settings(
			array(
				'totally_made_up' => 'x',
			)
		);

		$this->assertFalse( $result['changed'] );
		$this->assertSame( array(), $result['changed_fields'] );
	}
}
