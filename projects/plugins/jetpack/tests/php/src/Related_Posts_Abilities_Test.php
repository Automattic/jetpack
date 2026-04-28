<?php
/**
 * Tests for the Related_Posts_Abilities Registrar subclass.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

use Automattic\Jetpack\Plugin\Abilities\Related_Posts_Abilities;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'modules/related-posts/abilities/class-related-posts-abilities.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Abilities\Related_Posts_Abilities
 */
#[CoversClass( Related_Posts_Abilities::class )]
class Related_Posts_Abilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/** @var int */
	private static $admin_id;

	/** @var int */
	private static $author_id;

	/** @var int */
	private static $subscriber_id;

	/** @var array|null */
	private $saved_relatedposts_option;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$author_id     = $factory->user->create( array( 'role' => 'author' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public function set_up() {
		parent::set_up();

		$this->saved_relatedposts_option = Jetpack_Options::get_option( 'relatedposts', null );

		$this->reset_registry_state();
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		$this->reset_registry_state();
		wp_set_current_user( 0 );

		if ( null === $this->saved_relatedposts_option ) {
			Jetpack_Options::delete_option( 'relatedposts' );
		} else {
			Jetpack_Options::update_option( 'relatedposts', $this->saved_relatedposts_option );
		}

		parent::tear_down();
	}

	/**
	 * Wipe any registry state and persisted action callbacks left over from
	 * prior tests, so each test starts with a clean Abilities API surface.
	 */
	private function reset_registry_state() {
		if ( function_exists( 'wp_unregister_ability' ) && function_exists( 'wp_get_abilities' ) ) {
			$registered_slugs = array_keys( wp_get_abilities() );
			foreach ( array_keys( Related_Posts_Abilities::get_abilities() ) as $slug ) {
				if ( in_array( $slug, $registered_slugs, true ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' ) && function_exists( 'wp_get_ability_categories' ) ) {
			$category_slug = Related_Posts_Abilities::get_category_slug();
			if ( array_key_exists( $category_slug, wp_get_ability_categories() ) ) {
				wp_unregister_ability_category( $category_slug );
			}
		}
		remove_action( 'wp_abilities_api_categories_init', array( Related_Posts_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Related_Posts_Abilities::class, 'register_abilities' ) );
	}

	public function test_category_slug_is_plugin_scoped() {
		$this->assertSame( 'jetpack-related-posts', Related_Posts_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = Related_Posts_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = Related_Posts_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-related-posts/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		foreach ( Related_Posts_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Related_Posts_Abilities::init();

		$this->assertFalse(
			has_action( 'wp_abilities_api_categories_init', array( Related_Posts_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( 'wp_abilities_api_init', array( Related_Posts_Abilities::class, 'register_abilities' ) )
		);

		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		Related_Posts_Abilities::init();

		$this->assertNotFalse(
			has_action( 'wp_abilities_api_categories_init', array( Related_Posts_Abilities::class, 'register_category' ) )
				|| did_action( 'wp_abilities_api_categories_init' )
		);
	}

	public function test_ability_class_is_colocated_with_module() {
		$reflector = new \ReflectionClass( Related_Posts_Abilities::class );
		$path      = $reflector->getFileName();
		$this->assertStringContainsString(
			'/modules/related-posts/',
			$path,
			'Module-backed abilities must live inside their module directory, not in src/abilities/.'
		);
		$this->assertStringNotContainsString(
			'/src/abilities/',
			$path,
			'Found a module-backed ability in the plugin-global src/abilities/ tree.'
		);
	}

	public function test_not_wired_from_class_jetpack_php() {
		$bootstrap = file_get_contents( JETPACK__PLUGIN_DIR . 'class.jetpack.php' );
		$this->assertStringNotContainsString(
			'Related_Posts_Abilities::init()',
			$bootstrap,
			'class.jetpack.php must not init the module-backed ability. Wire from modules/related-posts.php.'
		);
	}

	/**
	 * Drive registration through the lifecycle actions so WordPress 6.9's
	 * doing-it-wrong check sees the callbacks fire inside the proper action.
	 */
	private function trigger_registration() {
		add_action( 'wp_abilities_api_categories_init', array( Related_Posts_Abilities::class, 'register_category' ) );
		add_action( 'wp_abilities_api_init', array( Related_Posts_Abilities::class, 'register_abilities' ) );
		do_action( 'wp_abilities_api_categories_init' );
		do_action( 'wp_abilities_api_init' );
		remove_action( 'wp_abilities_api_categories_init', array( Related_Posts_Abilities::class, 'register_category' ) );
		remove_action( 'wp_abilities_api_init', array( Related_Posts_Abilities::class, 'register_abilities' ) );
	}

	public function test_register_abilities_registers_every_slug() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		$this->trigger_registration();

		foreach ( array_keys( Related_Posts_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotNull( wp_get_ability( $slug ), "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
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

		$this->trigger_registration();

		$registered_slugs = array_keys( wp_get_abilities() );
		foreach ( array_keys( Related_Posts_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotContains( $slug, $registered_slugs, "Ability {$slug} must be filtered out." );
		}
	}

	public function test_register_abilities_injects_category_on_specs_that_omit_it() {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		$this->trigger_registration();

		foreach ( array_keys( Related_Posts_Abilities::get_abilities() ) as $slug ) {
			$ability = wp_get_ability( $slug );
			if ( null === $ability ) {
				continue;
			}
			$category = method_exists( $ability, 'get_category' ) ? $ability->get_category() : null;
			if ( null !== $category ) {
				$this->assertSame( 'jetpack-related-posts', $category, "Ability {$slug} should inherit the registrar's category." );
			}
		}
	}

	public function test_can_view_related_posts_allows_author() {
		wp_set_current_user( self::$author_id );
		$this->assertTrue( Related_Posts_Abilities::can_view_related_posts() );
	}

	public function test_can_view_related_posts_denies_subscriber() {
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( Related_Posts_Abilities::can_view_related_posts() );
	}

	public function test_can_view_related_posts_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Related_Posts_Abilities::can_view_related_posts() );
	}

	public function test_can_view_settings_allows_author() {
		wp_set_current_user( self::$author_id );
		$this->assertTrue( Related_Posts_Abilities::can_view_settings() );
	}

	public function test_can_manage_settings_denies_author() {
		wp_set_current_user( self::$author_id );
		$this->assertFalse( Related_Posts_Abilities::can_manage_settings() );
	}

	public function test_can_manage_settings_allows_admin() {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( Related_Posts_Abilities::can_manage_settings() );
	}

	public function test_get_settings_returns_normalized_shape() {
		$settings = Related_Posts_Abilities::get_settings();
		$this->assertIsArray( $settings );
		foreach ( array( 'enabled', 'show_headline', 'show_thumbnails', 'show_date', 'show_context', 'layout', 'headline', 'size' ) as $field ) {
			$this->assertArrayHasKey( $field, $settings, "Settings shape must include {$field}." );
		}
		$this->assertContains( $settings['layout'], array( 'grid', 'list' ) );
		$this->assertIsBool( $settings['enabled'] );
		$this->assertIsInt( $settings['size'] );
		$this->assertGreaterThanOrEqual( 1, $settings['size'] );
	}

	public function test_get_related_posts_rejects_missing_post_id() {
		$result = Related_Posts_Abilities::get_related_posts( array() );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_related_posts_missing_post_id', $result->get_error_code() );
	}

	public function test_get_related_posts_rejects_zero_post_id() {
		$result = Related_Posts_Abilities::get_related_posts( array( 'post_id' => 0 ) );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_related_posts_missing_post_id', $result->get_error_code() );
	}

	public function test_get_related_posts_rejects_unknown_post_id() {
		$result = Related_Posts_Abilities::get_related_posts( array( 'post_id' => 99999999 ) );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_related_posts_invalid_post_id', $result->get_error_code() );
	}

	public function test_get_related_posts_returns_array_for_real_post() {
		$post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$result  = Related_Posts_Abilities::get_related_posts( array( 'post_id' => $post_id ) );
		// Real ES backend is unavailable in test env; an empty array is the expected shape.
		$this->assertIsArray( $result );
	}

	public function test_update_settings_rejects_no_fields() {
		$result = Related_Posts_Abilities::update_settings( array() );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_related_posts_missing_field', $result->get_error_code() );
	}

	public function test_update_settings_rejects_only_unknown_fields() {
		$result = Related_Posts_Abilities::update_settings( array( 'bogus_field' => true ) );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_related_posts_missing_field', $result->get_error_code() );
	}

	public function test_update_settings_rejects_invalid_layout() {
		$result = Related_Posts_Abilities::update_settings( array( 'layout' => 'masonry' ) );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_related_posts_invalid_layout', $result->get_error_code() );
	}

	public function test_update_settings_rejects_size_out_of_range() {
		$result = Related_Posts_Abilities::update_settings( array( 'size' => 999 ) );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_related_posts_invalid_size', $result->get_error_code() );
	}

	public function test_update_settings_rejects_non_bool_enabled() {
		$result = Related_Posts_Abilities::update_settings( array( 'enabled' => 'yes' ) );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_related_posts_invalid_enabled', $result->get_error_code() );
	}

	public function test_update_settings_changes_when_value_differs() {
		$this->seed_default_settings();

		$result = Related_Posts_Abilities::update_settings( array( 'show_thumbnails' => true ) );

		$this->assertIsArray( $result );
		$this->assertTrue( $result['changed'] );
		$this->assertSame( array( 'show_thumbnails' ), $result['changed_fields'] );
		$this->assertTrue( $result['settings']['show_thumbnails'] );
	}

	public function test_update_settings_is_idempotent_when_values_match() {
		$this->seed_default_settings();

		$result = Related_Posts_Abilities::update_settings(
			array(
				'layout'          => 'grid',
				'show_thumbnails' => false,
			)
		);

		$this->assertIsArray( $result );
		$this->assertFalse( $result['changed'], 'No-op update must return changed=false.' );
		$this->assertSame( array(), $result['changed_fields'] );
	}

	private function seed_default_settings() {
		Jetpack_Options::update_option(
			'relatedposts',
			array(
				'enabled'         => true,
				'show_headline'   => true,
				'show_thumbnails' => false,
				'show_date'       => true,
				'show_context'    => true,
				'layout'          => 'grid',
				'headline'        => 'Related',
				'size'            => 3,
			)
		);
	}
}
