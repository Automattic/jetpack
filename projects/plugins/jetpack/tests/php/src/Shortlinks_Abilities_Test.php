<?php
/**
 * Tests for the Shortlinks_Abilities Registrar subclass.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

use Automattic\Jetpack\Plugin\Abilities\Shortlinks_Abilities;
use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'modules/shortlinks/abilities/class-shortlinks-abilities.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Abilities\Shortlinks_Abilities
 */
#[CoversClass( Shortlinks_Abilities::class )]
class Shortlinks_Abilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/** @var int */
	private static $admin_id;

	/** @var int */
	private static $subscriber_id;

	/** @var int */
	private static $post_id;

	public function set_up() {
		parent::set_up();

		self::$admin_id      = wp_insert_user(
			array(
				'user_login' => 'shortlinks_admin_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'administrator',
			)
		);
		self::$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'shortlinks_sub_' . wp_generate_password( 8, false ),
				'user_pass'  => 'pw',
				'role'       => 'subscriber',
			)
		);
		self::$post_id       = self::factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Hello shortlinks',
			)
		);

		Jetpack_Options::update_option( 'id', 1234 );

		// Module file defines wpme_get_shortlink and registers the pre_get_shortlink filter.
		require_once JETPACK__PLUGIN_DIR . 'modules/shortlinks.php';

		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		Jetpack_Options::delete_option( 'id' );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	// -------------------- Abstract getters --------------------

	public function test_category_slug_is_plugin_scoped() {
		$this->assertSame( 'jetpack-shortlinks', Shortlinks_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = Shortlinks_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = Shortlinks_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-shortlinks/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		foreach ( Shortlinks_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_get_shortlinks_spec_is_readonly_and_idempotent() {
		$spec = Shortlinks_Abilities::get_abilities()['jetpack-shortlinks/get-shortlinks'];
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
		$this->assertTrue( $spec['meta']['show_in_rest'] );
	}

	// -------------------- Registrar wiring --------------------

	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Shortlinks_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Shortlinks_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Shortlinks_Abilities::class, 'register_abilities' ) )
		);

		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		Shortlinks_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Shortlinks_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Shortlinks_Abilities::class, 'register_abilities' ) )
		);
	}

	// -------------------- Module colocation (Case A) --------------------

	public function test_ability_class_is_colocated_with_module() {
		$reflector = new \ReflectionClass( Shortlinks_Abilities::class );
		$path      = $reflector->getFileName();
		$this->assertStringContainsString(
			'/modules/shortlinks/',
			$path,
			'Module-backed abilities must live inside their module directory.'
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
			'Shortlinks_Abilities::init()',
			$bootstrap,
			'class.jetpack.php must not init a module-backed ability. Wire from modules/shortlinks.php instead.'
		);
	}

	public function test_module_file_wires_init() {
		$module = file_get_contents( JETPACK__PLUGIN_DIR . 'modules/shortlinks.php' );
		$this->assertStringContainsString(
			'Shortlinks_Abilities::init()',
			$module,
			'modules/shortlinks.php must call Shortlinks_Abilities::init() so registration is gated by module activation.'
		);
	}

	// -------------------- Permission callbacks --------------------

	public function test_can_view_allows_authenticated_user() {
		wp_set_current_user( self::$subscriber_id );
		$this->assertTrue( Shortlinks_Abilities::can_view_shortlinks() );
	}

	public function test_can_view_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Shortlinks_Abilities::can_view_shortlinks() );
	}

	// -------------------- Execute callbacks --------------------

	public function test_get_shortlinks_returns_array() {
		wp_set_current_user( self::$admin_id );
		$result = Shortlinks_Abilities::get_shortlinks( array() );
		$this->assertIsArray( $result );
		$this->assertSame( array(), $result, 'Empty input returns an empty array.' );
	}

	public function test_get_shortlinks_returns_entry_for_known_post() {
		wp_set_current_user( self::$admin_id );
		$result = Shortlinks_Abilities::get_shortlinks( array( 'post_ids' => array( self::$post_id ) ) );

		$this->assertCount( 1, $result );
		$entry = $result[0];
		$this->assertSame( self::$post_id, $entry['post_id'] );
		$this->assertSame( 'Hello shortlinks', $entry['post_title'] );
		$this->assertSame( 'post', $entry['post_type'] );
		$this->assertStringStartsWith( 'https://wp.me/', $entry['shortlink'] );
		$this->assertNotEmpty( $entry['target_url'] );
	}

	public function test_get_shortlinks_with_include_blog_prepends_blog_entry() {
		wp_set_current_user( self::$admin_id );
		$result = Shortlinks_Abilities::get_shortlinks( array( 'include_blog' => true ) );

		$this->assertCount( 1, $result );
		$this->assertSame( 0, $result[0]['post_id'] );
		$this->assertSame( 'blog', $result[0]['post_type'] );
		$this->assertStringStartsWith( 'https://wp.me/', $result[0]['shortlink'] );
	}

	public function test_get_shortlinks_silently_omits_unknown_ids() {
		wp_set_current_user( self::$admin_id );
		$result = Shortlinks_Abilities::get_shortlinks( array( 'post_ids' => array( 999999999 ) ) );
		$this->assertSame( array(), $result, 'Unknown ids yield empty array, not WP_Error.' );
	}

	public function test_get_shortlinks_omits_unreadable_post_for_subscriber() {
		$private_id = self::factory()->post->create(
			array(
				'post_status' => 'private',
				'post_author' => self::$admin_id,
			)
		);

		wp_set_current_user( self::$subscriber_id );
		$result = Shortlinks_Abilities::get_shortlinks( array( 'post_ids' => array( $private_id ) ) );

		$this->assertSame( array(), $result, 'Subscribers cannot read private posts authored by another user.' );
	}

	public function test_get_shortlinks_caps_post_ids_at_max() {
		wp_set_current_user( self::$admin_id );
		$too_many = range( 1, Shortlinks_Abilities::MAX_POST_IDS + 50 );
		$result   = Shortlinks_Abilities::get_shortlinks( array( 'post_ids' => $too_many ) );

		$this->assertIsArray( $result );
		// Most ids point to non-existent posts, so we just confirm no WP_Error and no overflow surprise.
		$this->assertNotInstanceOf( \WP_Error::class, $result );
	}

	public function test_get_shortlinks_returns_error_when_blog_id_missing() {
		Jetpack_Options::delete_option( 'id' );

		wp_set_current_user( self::$admin_id );
		$result = Shortlinks_Abilities::get_shortlinks( array( 'post_ids' => array( self::$post_id ) ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_shortlinks_blog_id_unavailable', $result->get_error_code() );
	}
}
