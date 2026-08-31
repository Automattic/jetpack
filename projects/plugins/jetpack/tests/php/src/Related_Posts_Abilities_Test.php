<?php
/**
 * Tests for the Related_Posts_Abilities Registrar subclass.
 *
 * @package automattic/jetpack
 */

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

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$author_id     = $factory->user->create( array( 'role' => 'author' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public function set_up() {
		parent::set_up();

		$this->reset_registry_state();
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		$this->reset_registry_state();
		wp_set_current_user( 0 );

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

	public function test_related_posts_description_references_current_module_abilities() {
		$abilities   = Related_Posts_Abilities::get_abilities();
		$description = $abilities['jetpack-related-posts/get-related-posts']['description'];

		$this->assertStringContainsString( 'jetpack/get-modules', $description );
		$this->assertStringContainsString( 'jetpack/set-module-status', $description );
		$this->assertStringNotContainsString( 'jetpack-modules/', $description );
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
		wp_set_current_user( self::$admin_id );
		$post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$result  = Related_Posts_Abilities::get_related_posts( array( 'post_id' => $post_id ) );
		// Real ES backend is unavailable in test env; an empty array is the expected shape.
		$this->assertIsArray( $result );
	}

	public function test_get_related_posts_denies_user_who_cannot_edit_post() {
		$author_post_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$author_id,
			)
		);

		// Subscriber cannot edit any post.
		wp_set_current_user( self::$subscriber_id );
		$result = Related_Posts_Abilities::get_related_posts( array( 'post_id' => $author_post_id ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_related_posts_forbidden', $result->get_error_code() );
	}

	public function test_get_related_posts_summarizes_filtered_results() {
		wp_set_current_user( self::$admin_id );
		$source_id  = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$related_id = self::factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Synthetic Related',
			)
		);

		$callback = static function () use ( $related_id ) {
			return array(
				array(
					'id'      => $related_id,
					'url'     => 'https://example.test/synthetic',
					'title'   => 'Synthetic Related',
					'excerpt' => 'A synthetic excerpt.',
					'date'    => '2026-01-01',
					'format'  => 'standard',
				),
			);
		};
		add_filter( 'jetpack_relatedposts_returned_results', $callback );

		try {
			$result = Related_Posts_Abilities::get_related_posts( array( 'post_id' => $source_id ) );
		} finally {
			remove_filter( 'jetpack_relatedposts_returned_results', $callback );
		}

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$summary = $result[0];
		$this->assertSame( $related_id, $summary['id'] );
		$this->assertSame( 'https://example.test/synthetic', $summary['url'] );
		$this->assertSame( 'Synthetic Related', $summary['title'] );
		$this->assertSame( 'A synthetic excerpt.', $summary['excerpt'] );
		$this->assertSame( '2026-01-01', $summary['date'] );
		$this->assertSame( 'post', $summary['post_type'] );
		$this->assertSame( 'standard', $summary['format'] );
	}

	/**
	 * Capture the size arg the Related Posts backend receives, regardless of
	 * whether the ES backend returns anything. This exercises the clamp the
	 * execute callback applies before delegating to get_for_post_id().
	 *
	 * @param array $input Ability input.
	 * @return int|null Captured size, or null if the args filter did not fire.
	 */
	private function capture_size_arg( array $input ): ?int {
		$captured = null;
		$capture  = static function ( $args ) use ( &$captured ) {
			$captured = isset( $args['size'] ) ? (int) $args['size'] : null;
			return $args;
		};
		add_filter( 'jetpack_relatedposts_filter_args', $capture );
		try {
			Related_Posts_Abilities::get_related_posts( $input );
		} finally {
			remove_filter( 'jetpack_relatedposts_filter_args', $capture );
		}
		return $captured;
	}

	public function test_get_related_posts_respects_per_page_below_cap() {
		wp_set_current_user( self::$admin_id );
		$source_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		$captured = $this->capture_size_arg(
			array(
				'post_id'  => $source_id,
				'per_page' => 5,
			)
		);

		$this->assertSame( 5, $captured, 'per_page=5 must propagate to size=5 in the backend args.' );
	}

	public function test_get_related_posts_respects_per_page_at_cap() {
		wp_set_current_user( self::$admin_id );
		$source_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		$captured = $this->capture_size_arg(
			array(
				'post_id'  => $source_id,
				'per_page' => 20,
			)
		);

		$this->assertSame( 20, $captured, 'per_page=20 must propagate to size=20 in the backend args.' );
	}

	public function test_get_related_posts_schema_rejects_per_page_above_cap() {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		$this->trigger_registration();
		wp_set_current_user( self::$admin_id );
		$source_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		$ability = wp_get_ability( 'jetpack-related-posts/get-related-posts' );
		$this->assertNotNull( $ability );

		$result = $ability->execute(
			array(
				'post_id'  => $source_id,
				'per_page' => 21,
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result, 'per_page=21 must be rejected by schema validation.' );
		$this->assertSame( 'ability_invalid_input', $result->get_error_code() );
	}

	public function test_get_related_posts_schema_rejects_per_page_zero() {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		$this->trigger_registration();
		wp_set_current_user( self::$admin_id );
		$source_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		$ability = wp_get_ability( 'jetpack-related-posts/get-related-posts' );
		$this->assertNotNull( $ability );

		$result = $ability->execute(
			array(
				'post_id'  => $source_id,
				'per_page' => 0,
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result, 'per_page=0 must be rejected by schema validation.' );
		$this->assertSame( 'ability_invalid_input', $result->get_error_code() );
	}

	public function test_get_related_posts_defaults_when_per_page_omitted() {
		wp_set_current_user( self::$admin_id );
		$source_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		// When neither per_page nor size is supplied to the execute callback
		// directly, the existing default (3) wins so prior callers see no change.
		$captured = $this->capture_size_arg( array( 'post_id' => $source_id ) );

		$this->assertSame( 3, $captured, 'Omitted per_page must fall back to the legacy default of 3 so pre-existing callers see identical behavior.' );
	}

	public function test_get_related_posts_summary_format_is_null_when_missing() {
		wp_set_current_user( self::$admin_id );
		$source_id  = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$related_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		$callback = static function () use ( $related_id ) {
			return array(
				array(
					'id'    => $related_id,
					'url'   => 'https://example.test/no-format',
					'title' => 'No Format',
				),
			);
		};
		add_filter( 'jetpack_relatedposts_returned_results', $callback );

		try {
			$result = Related_Posts_Abilities::get_related_posts( array( 'post_id' => $source_id ) );
		} finally {
			remove_filter( 'jetpack_relatedposts_returned_results', $callback );
		}

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertNull( $result[0]['format'] );
		$this->assertSame( '', $result[0]['excerpt'] );
		$this->assertSame( '', $result[0]['date'] );
	}
}
