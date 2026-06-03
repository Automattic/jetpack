<?php
/**
 * Tests for the Newsletter_Abilities Registrar subclass.
 *
 * @package automattic/jetpack
 */

require_once __DIR__ . '/../../../../modules/subscriptions/abilities/class-newsletter-abilities.php';

use Automattic\Jetpack\Plugin\Abilities\Newsletter_Abilities;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Plugin\Abilities\Newsletter_Abilities
 */
#[CoversClass( Newsletter_Abilities::class )]
class Newsletter_Abilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/** @var int */
	private $admin_id;

	/** @var int */
	private $subscriber_id;

	public function set_up() {
		parent::set_up();

		// Use the test factory so users live within the per-test transaction and
		// stale IDs from earlier tests do not leak into wp_set_current_user.
		$this->admin_id      = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->subscriber_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );

		// Open the gate by default; individual tests override.
		// Hooks added here are reverted when WP_UnitTestCase rolls the
		// per-test transaction back, so no manual remove_filter in tear_down.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	public function test_category_slug_is_jetpack_newsletter() {
		$this->assertSame( 'jetpack-newsletter', Newsletter_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = Newsletter_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotEmpty( $def['label'] );
		$this->assertNotEmpty( $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = Newsletter_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		$this->assertArrayHasKey( 'jetpack-newsletter/get-settings', $abilities );
		$this->assertArrayHasKey( 'jetpack-newsletter/update-settings', $abilities );
		$this->assertArrayHasKey( 'jetpack-newsletter/get-subscriber-stats', $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-newsletter/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		// Registrar auto-injects category; specs that set it duplicate info that drifts.
		foreach ( Newsletter_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_read_and_write_have_distinct_annotations() {
		$abilities = Newsletter_Abilities::get_abilities();

		$read = $abilities['jetpack-newsletter/get-settings']['meta']['annotations'];
		$this->assertTrue( $read['readonly'] );
		$this->assertFalse( $read['destructive'] );
		$this->assertTrue( $read['idempotent'] );

		$write = $abilities['jetpack-newsletter/update-settings']['meta']['annotations'];
		$this->assertFalse( $write['readonly'] );
		$this->assertFalse( $write['destructive'] );
		$this->assertTrue( $write['idempotent'] );

		$stats = $abilities['jetpack-newsletter/get-subscriber-stats']['meta']['annotations'];
		$this->assertTrue( $stats['readonly'] );
		$this->assertFalse( $stats['destructive'] );
		$this->assertTrue( $stats['idempotent'] );
	}

	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Newsletter_Abilities::init();

		$this->assertFalse(
			has_action( 'wp_abilities_api_categories_init', array( Newsletter_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( 'wp_abilities_api_init', array( Newsletter_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		Newsletter_Abilities::init();

		$this->assertNotFalse(
			has_action( 'wp_abilities_api_categories_init', array( Newsletter_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( 'wp_abilities_api_init', array( Newsletter_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_ability_class_is_colocated_with_module() {
		$reflector = new \ReflectionClass( Newsletter_Abilities::class );
		$path      = $reflector->getFileName();
		$this->assertStringContainsString(
			'/modules/subscriptions/',
			$path,
			'Module-backed abilities must live inside their module directory, not in src/abilities/.'
		);
		$this->assertStringNotContainsString(
			'/src/abilities/',
			$path,
			'Found a module-backed ability in the plugin-global src/abilities/ tree. Move it into modules/subscriptions/abilities/.'
		);
	}

	public function test_not_wired_from_class_jetpack_php() {
		$bootstrap = file_get_contents( JETPACK__PLUGIN_DIR . 'class.jetpack.php' );
		$this->assertStringNotContainsString(
			'Newsletter_Abilities::init()',
			$bootstrap,
			'class.jetpack.php must not init a module-backed ability. Wire from modules/subscriptions.php instead.'
		);
	}

	public function test_wired_from_subscriptions_module_file() {
		$module = file_get_contents( JETPACK__PLUGIN_DIR . 'modules/subscriptions.php' );
		$this->assertStringContainsString(
			'Newsletter_Abilities::init()',
			$module,
			'Newsletter_Abilities must be initialized from modules/subscriptions.php so registration is gated by module activation.'
		);
	}

	public function test_can_view_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Newsletter_Abilities::can_view_settings() );
	}

	public function test_can_view_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Newsletter_Abilities::can_view_settings() );
	}

	public function test_can_view_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Newsletter_Abilities::can_view_settings() );
	}

	public function test_can_manage_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Newsletter_Abilities::can_manage_settings() );
	}

	public function test_can_manage_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Newsletter_Abilities::can_manage_settings() );
	}

	public function test_get_settings_returns_all_fields() {
		$result = Newsletter_Abilities::get_settings();
		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'subscribe_post_end_enabled', $result );
		$this->assertArrayHasKey( 'subscribe_comments_enabled', $result );
		$this->assertArrayHasKey( 'notify_admin_on_subscribe', $result );
		$this->assertArrayHasKey( 'reply_to', $result );
		$this->assertArrayHasKey( 'from_name', $result );
	}

	public function test_get_settings_reflects_stored_options() {
		update_option( 'stb_enabled', 0 );
		update_option( 'social_notifications_subscribe', 'off' );
		update_option( 'jetpack_subscriptions_reply_to', 'author' );
		update_option( 'jetpack_subscriptions_from_name', 'My Sender' );

		$result = Newsletter_Abilities::get_settings();
		$this->assertFalse( $result['subscribe_post_end_enabled'] );
		$this->assertFalse( $result['notify_admin_on_subscribe'] );
		$this->assertSame( 'author', $result['reply_to'] );
		$this->assertSame( 'My Sender', $result['from_name'] );
	}

	public function test_update_settings_with_empty_input_is_noop() {
		$result = Newsletter_Abilities::update_settings( array() );
		$this->assertIsArray( $result );
		$this->assertSame( array(), $result['changed'] );
		$this->assertArrayHasKey( 'settings', $result );
	}

	public function test_update_settings_writes_only_changed_fields() {
		update_option( 'jetpack_subscriptions_reply_to', 'comment' );
		update_option( 'jetpack_subscriptions_from_name', 'Old Name' );

		$result = Newsletter_Abilities::update_settings(
			array(
				'reply_to'  => 'author',
				'from_name' => 'Old Name', // unchanged
			)
		);

		$this->assertSame( array( 'reply_to' ), $result['changed'] );
		$this->assertSame( 'author', $result['settings']['reply_to'] );
		$this->assertSame( 'Old Name', $result['settings']['from_name'] );
		$this->assertSame( 'author', get_option( 'jetpack_subscriptions_reply_to' ) );
	}

	public function test_update_settings_is_idempotent() {
		Newsletter_Abilities::update_settings( array( 'reply_to' => 'no-reply' ) );
		$second = Newsletter_Abilities::update_settings( array( 'reply_to' => 'no-reply' ) );

		$this->assertSame( array(), $second['changed'], 'Second call with the same desired state must be a no-op.' );
		$this->assertSame( 'no-reply', $second['settings']['reply_to'] );
	}

	public function test_update_settings_translates_booleans_to_storage_form() {
		Newsletter_Abilities::update_settings(
			array(
				'subscribe_post_end_enabled' => false,
				'notify_admin_on_subscribe'  => false,
			)
		);

		// Booleans persist as 1/0 for stb_enabled, 'on'/'off' for social_notifications_subscribe.
		$this->assertSame( '0', (string) get_option( 'stb_enabled' ) );
		$this->assertSame( 'off', get_option( 'social_notifications_subscribe' ) );

		// And the public response casts them back to bool.
		$result = Newsletter_Abilities::get_settings();
		$this->assertFalse( $result['subscribe_post_end_enabled'] );
		$this->assertFalse( $result['notify_admin_on_subscribe'] );
	}

	public function test_update_settings_rejects_invalid_reply_to() {
		$result = Newsletter_Abilities::update_settings( array( 'reply_to' => 'bogus' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_newsletter_invalid_reply_to', $result->get_error_code() );
	}

	public function test_update_settings_rejects_non_boolean_for_boolean_field() {
		$result = Newsletter_Abilities::update_settings( array( 'subscribe_post_end_enabled' => 'yes' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_newsletter_invalid_subscribe_post_end_enabled', $result->get_error_code() );
	}

	public function test_update_settings_does_not_partial_write_on_validation_error() {
		// from_name is valid; reply_to is invalid → expect the whole call to fail with no writes.
		$before_from_name = get_option( 'jetpack_subscriptions_from_name', '' );

		$result = Newsletter_Abilities::update_settings(
			array(
				'from_name' => 'Should Not Persist',
				'reply_to'  => 'bogus',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame(
			$before_from_name,
			get_option( 'jetpack_subscriptions_from_name', '' ),
			'Validation errors must short-circuit before any update_option call.'
		);
	}

	public function test_update_settings_sanitizes_from_name() {
		Newsletter_Abilities::update_settings(
			array(
				'from_name' => "  My  <script>x</script> Sender  \n",
			)
		);

		// sanitize_text_field strips tags, collapses whitespace, trims.
		$stored = get_option( 'jetpack_subscriptions_from_name' );
		$this->assertStringNotContainsString( '<script>', $stored );
		$this->assertStringNotContainsString( "\n", $stored );
	}

	public function test_update_settings_rejects_non_string_from_name() {
		$result = Newsletter_Abilities::update_settings( array( 'from_name' => 12345 ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_newsletter_invalid_from_name', $result->get_error_code() );
	}

	public function test_update_settings_rejects_oversized_from_name() {
		// from_name caps at 200 characters; the schema advertises it and the
		// callback enforces it so direct PHP callers can't bypass the limit.
		$result = Newsletter_Abilities::update_settings(
			array( 'from_name' => str_repeat( 'a', 201 ) )
		);
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_newsletter_invalid_from_name', $result->get_error_code() );
	}

	public function test_update_settings_rejects_non_boolean_for_subscribe_comments_enabled() {
		$result = Newsletter_Abilities::update_settings( array( 'subscribe_comments_enabled' => 1 ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_newsletter_invalid_subscribe_comments_enabled', $result->get_error_code() );
	}

	public function test_update_settings_rejects_non_boolean_for_notify_admin_on_subscribe() {
		$result = Newsletter_Abilities::update_settings( array( 'notify_admin_on_subscribe' => 'on' ) );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_newsletter_invalid_notify_admin_on_subscribe', $result->get_error_code() );
	}

	public function test_per_ability_allow_list_filter_blocks_individual_slugs() {
		// Verify the shared `jetpack_wp_abilities_should_register` filter can
		// gate this class's slugs the same way it gates any other Registrar.
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				if ( 'ability' === $type && str_starts_with( $slug, 'jetpack-newsletter/' ) ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		Newsletter_Abilities::register_abilities();

		// Compare against the full registry rather than calling wp_get_ability()
		// per slug — the latter emits a `_doing_it_wrong` notice for missing
		// slugs, which the test environment converts into a failure.
		$registered_slugs = array_map(
			static function ( $ability ) {
				return $ability->get_name();
			},
			wp_get_abilities()
		);
		foreach ( array_keys( Newsletter_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotContains(
				$slug,
				$registered_slugs,
				"Ability {$slug} must be filtered out by jetpack_wp_abilities_should_register."
			);
		}
	}

	public function test_get_subscriber_stats_returns_cached_response_without_remote_call() {
		// Pre-seed the transient so the callback's short-circuit returns it
		// without hitting wpcom or any class_exists/connection check.
		set_transient(
			'jetpack_newsletter_subscriber_stats',
			array(
				'all'   => 1234,
				'email' => 1000,
				'paid'  => 234,
			),
			HOUR_IN_SECONDS
		);

		$result = Newsletter_Abilities::get_subscriber_stats();
		$this->assertIsArray( $result );
		$this->assertSame( 1234, $result['all'] );
		$this->assertSame( 1000, $result['email'] );
		$this->assertSame( 234, $result['paid'] );

		delete_transient( 'jetpack_newsletter_subscriber_stats' );
	}

	public function test_get_subscriber_stats_returns_wp_error_when_disconnected() {
		// No cached stats and Jetpack reports as disconnected — must surface a
		// jetpack_newsletter_not_connected error so the agent stops calling.
		delete_transient( 'jetpack_newsletter_subscriber_stats' );
		add_filter( 'jetpack_is_connection_ready', '__return_false' );

		$result = Newsletter_Abilities::get_subscriber_stats();

		remove_filter( 'jetpack_is_connection_ready', '__return_false' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_newsletter_not_connected', $result->get_error_code() );
	}

	public function test_every_ability_opts_into_mcp_as_public_tool() {
		foreach ( Newsletter_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'mcp', $spec['meta'], "{$slug} must publish meta.mcp." );
			$this->assertTrue( $spec['meta']['mcp']['public'], "{$slug} must opt into MCP." );
			$this->assertSame( 'tool', $spec['meta']['mcp']['type'], "{$slug} must be exposed as an MCP tool." );
		}
	}
}
