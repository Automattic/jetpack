<?php
/**
 * Tests for the Memberships_Abilities Registrar subclass.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

require_once __DIR__ . '/../../../modules/memberships/abilities/class-memberships-abilities.php';

use Automattic\Jetpack\Plugin\Abilities\Memberships_Abilities;
use Automattic\Jetpack\WP_Abilities\Registrar;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Plugin\Abilities\Memberships_Abilities
 */
#[CoversClass( Memberships_Abilities::class )]
class Memberships_Abilities_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/** @var int */
	private $admin_id;

	/** @var int */
	private $author_id;

	/** @var int */
	private $subscriber_id;

	public function set_up() {
		parent::set_up();

		$this->admin_id      = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->author_id     = self::factory()->user->create( array( 'role' => 'author' ) );
		$this->subscriber_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );

		// Open the abilities gate by default; specific tests override.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		// Pretend Jetpack is connected with a valid site id so the network-side
		// abilities don't short-circuit on the not-connected guard.
		\Jetpack_Options::update_option( 'id', 12345 );
		add_filter( 'jetpack_is_connection_ready', '__return_true' );
	}

	public function tear_down() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_filter( 'jetpack_is_connection_ready', '__return_true' );
		remove_filter( 'jetpack_is_connection_ready', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'pre_http_request' );
		wp_set_current_user( 0 );

		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( Memberships_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( Memberships_Abilities::class, 'register_abilities' ) );

		if ( function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( Memberships_Abilities::get_abilities() ) as $slug ) {
				wp_unregister_ability( $slug );
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' ) ) {
			wp_unregister_ability_category( Memberships_Abilities::get_category_slug() );
		}

		parent::tear_down();
	}

	/**
	 * Mock the next outbound `wp_remote_*` request with a canned JSON payload.
	 *
	 * @param array $payload  Body, encoded as JSON.
	 * @param int   $status   HTTP status (default 200).
	 */
	private function mock_wpcom_response( array $payload, int $status = 200 ): void {
		add_filter(
			'pre_http_request',
			static function () use ( $payload, $status ) {
				return array(
					'response' => array( 'code' => $status ),
					'headers'  => array( 'content-type' => 'application/json' ),
					'body'     => wp_json_encode( $payload, JSON_UNESCAPED_SLASHES ),
				);
			}
		);
	}

	/**
	 * Mock the next outbound request with a WP_Error transport failure.
	 */
	private function mock_wpcom_transport_error(): void {
		add_filter(
			'pre_http_request',
			static function () {
				return new WP_Error( 'http_request_failed', 'Connection refused' );
			}
		);
	}

	/** Identity */
	public function test_category_slug_is_jetpack_memberships() {
		$this->assertSame( 'jetpack-memberships', Memberships_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = Memberships_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertNotEmpty( $def['label'] );
		$this->assertNotEmpty( $def['description'] );
	}

	public function test_abilities_map_is_namespaced() {
		$abilities = Memberships_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		$this->assertArrayHasKey( 'jetpack-memberships/list-plans', $abilities );
		$this->assertArrayHasKey( 'jetpack-memberships/list-subscribers', $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-memberships/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		foreach ( Memberships_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_reads_have_readonly_annotations() {
		$abilities = Memberships_Abilities::get_abilities();
		foreach ( $abilities as $slug => $spec ) {
			$annotations = $spec['meta']['annotations'];
			$this->assertTrue( $annotations['readonly'], "{$slug} is a read; readonly must be true." );
			$this->assertFalse( $annotations['destructive'], "{$slug} is a read; destructive must be false." );
			$this->assertTrue( $annotations['idempotent'], "{$slug} is a read; idempotent must be true." );
			$this->assertTrue( $spec['meta']['show_in_rest'] );
		}
	}

	/** Registrar wiring */
	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		Memberships_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Memberships_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Memberships_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		Memberships_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( Memberships_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( Memberships_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_ability_class_is_colocated_with_module() {
		$reflector = new \ReflectionClass( Memberships_Abilities::class );
		$path      = $reflector->getFileName();
		$this->assertStringContainsString(
			'/modules/memberships/',
			$path,
			'Module-backed abilities must live inside their module directory, not in src/abilities/.'
		);
		$this->assertStringNotContainsString(
			'/src/abilities/',
			$path,
			'Found a module-backed ability in the plugin-global src/abilities/ tree. Move it into modules/memberships/abilities/.'
		);
	}

	public function test_not_wired_from_class_jetpack_php() {
		$bootstrap = file_get_contents( JETPACK__PLUGIN_DIR . 'class.jetpack.php' );
		$this->assertStringNotContainsString(
			'Memberships_Abilities::init()',
			$bootstrap,
			'class.jetpack.php must not init a module-backed ability. Wire from modules/memberships/class-jetpack-memberships.php instead.'
		);
	}

	public function test_wired_from_memberships_module_loader() {
		$module = file_get_contents( JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php' );
		$this->assertStringContainsString(
			'Memberships_Abilities::init()',
			$module,
			'Memberships_Abilities must be initialized from modules/memberships/class-jetpack-memberships.php so registration follows module load.'
		);
	}

	/** Permissions */
	public function test_can_view_plans_allows_author() {
		// list-plans matches the wpcom edit_posts cap — authors qualify.
		wp_set_current_user( $this->author_id );
		$this->assertTrue( Memberships_Abilities::can_view_plans() );
	}

	public function test_can_view_plans_denies_subscriber() {
		wp_set_current_user( $this->subscriber_id );
		$this->assertFalse( Memberships_Abilities::can_view_plans() );
	}

	public function test_can_view_plans_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Memberships_Abilities::can_view_plans() );
	}

	public function test_can_view_subscribers_allows_admin() {
		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Memberships_Abilities::can_view_subscribers() );
	}

	public function test_can_view_subscribers_denies_author() {
		// list-subscribers is admin-only on wpcom — authors must NOT see it.
		wp_set_current_user( $this->author_id );
		$this->assertFalse( Memberships_Abilities::can_view_subscribers() );
	}

	public function test_can_view_subscribers_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( Memberships_Abilities::can_view_subscribers() );
	}

	/** Connection guard */
	public function test_list_plans_returns_wp_error_when_disconnected() {
		remove_filter( 'jetpack_is_connection_ready', '__return_true' );
		add_filter( 'jetpack_is_connection_ready', '__return_false' );

		$result = Memberships_Abilities::list_plans();
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_memberships_not_connected', $result->get_error_code() );
	}

	public function test_list_subscribers_returns_wp_error_when_disconnected() {
		remove_filter( 'jetpack_is_connection_ready', '__return_true' );
		add_filter( 'jetpack_is_connection_ready', '__return_false' );

		$result = Memberships_Abilities::list_subscribers();
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_memberships_not_connected', $result->get_error_code() );
	}

	/** Execute — list-plans happy path */
	public function test_list_plans_shapes_response_to_documented_keys() {
		$this->mock_wpcom_response(
			array(
				'products' => array(
					array(
						'id'                    => 7,
						'title'                 => 'Annual',
						'price'                 => 99.0,
						'currency'              => 'USD',
						'interval'              => '1 year',
						'status'                => 'active',
						'subscriber_count'      => 42,
						'connected_destination' => 'newsletter',
						'stripe_account_id'     => 'acct_secret', // upstream noise that must NOT leak.
					),
				),
			)
		);

		$result = Memberships_Abilities::list_plans();
		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );

		$plan = $result[0];
		$this->assertSame(
			array( 'id', 'title', 'price', 'currency', 'interval', 'active', 'subscriber_count', 'connected_destination' ),
			array_keys( $plan ),
			'Plan response must surface only the documented keys.'
		);
		$this->assertSame( 7, $plan['id'] );
		$this->assertSame( 'Annual', $plan['title'] );
		$this->assertSame( 99.0, $plan['price'] );
		$this->assertSame( 'USD', $plan['currency'] );
		$this->assertSame( '1 year', $plan['interval'] );
		$this->assertTrue( $plan['active'] );
		$this->assertSame( 42, $plan['subscriber_count'] );
		$this->assertSame( 'newsletter', $plan['connected_destination'] );
	}

	public function test_list_plans_with_unknown_plan_id_returns_empty_array() {
		// Consolidated-read contract: unknown id filters to an empty array,
		// not a WP_Error. The shape stays consistent with the happy path.
		$this->mock_wpcom_response(
			array(
				'products' => array(
					array(
						'id'     => 1,
						'title'  => 'Plan A',
						'status' => 'active',
					),
					array(
						'id'     => 2,
						'title'  => 'Plan B',
						'status' => 'inactive',
					),
				),
			)
		);

		$result = Memberships_Abilities::list_plans( array( 'plan_id' => 9999 ) );
		$this->assertIsArray( $result );
		$this->assertSame( array(), $result );
	}

	public function test_list_plans_with_known_plan_id_returns_single_match() {
		$this->mock_wpcom_response(
			array(
				'products' => array(
					array(
						'id'     => 1,
						'title'  => 'Plan A',
						'status' => 'active',
					),
					array(
						'id'     => 2,
						'title'  => 'Plan B',
						'status' => 'inactive',
					),
				),
			)
		);

		$result = Memberships_Abilities::list_plans( array( 'plan_id' => 2 ) );
		$this->assertCount( 1, $result );
		$this->assertSame( 2, $result[0]['id'] );
		$this->assertFalse( $result[0]['active'] );
	}

	public function test_list_plans_active_filter_returns_only_active() {
		$this->mock_wpcom_response(
			array(
				'products' => array(
					array(
						'id'     => 1,
						'status' => 'active',
					),
					array(
						'id'     => 2,
						'status' => 'inactive',
					),
					array(
						'id'     => 3,
						'status' => 'active',
					),
				),
			)
		);

		$result = Memberships_Abilities::list_plans( array( 'active' => true ) );
		$this->assertCount( 2, $result );
		foreach ( $result as $plan ) {
			$this->assertTrue( $plan['active'] );
		}
	}

	public function test_list_plans_caps_per_page_at_max() {
		// Per-page caller value above MAX_PER_PAGE must clamp; the slice should
		// never exceed MAX_PER_PAGE entries even when input asks for more.
		$products = array();
		for ( $i = 1; $i <= 150; $i++ ) {
			$products[] = array(
				'id'     => $i,
				'status' => 'active',
			);
		}
		$this->mock_wpcom_response( array( 'products' => $products ) );

		$result = Memberships_Abilities::list_plans( array( 'per_page' => 500 ) );
		$this->assertLessThanOrEqual( 100, count( $result ) );
	}

	public function test_list_plans_pagination_slices_results() {
		$products = array();
		for ( $i = 1; $i <= 25; $i++ ) {
			$products[] = array(
				'id'     => $i,
				'status' => 'active',
			);
		}
		$this->mock_wpcom_response( array( 'products' => $products ) );

		// per_page=10, page=2 → ids 11..20.
		$result = Memberships_Abilities::list_plans(
			array(
				'per_page' => 10,
				'page'     => 2,
			)
		);
		$this->assertCount( 10, $result );
		$this->assertSame( 11, $result[0]['id'] );
		$this->assertSame( 20, $result[9]['id'] );
	}

	public function test_list_plans_transport_error_returns_steering_wp_error() {
		$this->mock_wpcom_transport_error();
		$result = Memberships_Abilities::list_plans();
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_memberships_plans_unavailable', $result->get_error_code() );
	}

	public function test_list_plans_http_error_returns_steering_wp_error() {
		$this->mock_wpcom_response( array( 'message' => 'boom' ), 500 );
		$result = Memberships_Abilities::list_plans();
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_memberships_plans_unavailable', $result->get_error_code() );
	}

	public function test_list_plans_handles_empty_products_payload() {
		// Empty array, not WP_Error — consistent shape with happy path.
		$this->mock_wpcom_response( array( 'products' => array() ) );
		$result = Memberships_Abilities::list_plans();
		$this->assertSame( array(), $result );
	}

	/** Execute — list-subscribers happy path */
	public function test_list_subscribers_shapes_response_to_documented_keys() {
		$this->mock_wpcom_response(
			array(
				'subscribers' => array(
					array(
						'user_id'           => 42,
						'email_address'     => 'sub@example.test',
						'display_name'      => 'Pat Subscriber',
						'plan_id'           => 7,
						'status'            => 'active',
						'date_subscribed'   => '2026-01-01T00:00:00Z',
						'last_payment_date' => '2026-04-01T00:00:00Z',
						'card_last4'        => '4242', // upstream noise that must NOT leak.
					),
				),
			)
		);

		$result = Memberships_Abilities::list_subscribers();
		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );

		$sub = $result[0];
		$this->assertSame(
			array( 'id', 'email', 'display_name', 'plan_id', 'status', 'subscribed_at', 'last_payment_at' ),
			array_keys( $sub ),
			'Subscriber response must surface only the documented keys.'
		);
		$this->assertSame( 42, $sub['id'] );
		$this->assertSame( 'sub@example.test', $sub['email'] );
		$this->assertSame( 'Pat Subscriber', $sub['display_name'] );
		$this->assertSame( 7, $sub['plan_id'] );
		$this->assertSame( 'active', $sub['status'] );
		$this->assertSame( '2026-01-01T00:00:00Z', $sub['subscribed_at'] );
		$this->assertSame( '2026-04-01T00:00:00Z', $sub['last_payment_at'] );
	}

	public function test_list_subscribers_normalizes_non_active_status_to_cancelled() {
		$this->mock_wpcom_response(
			array(
				'subscribers' => array(
					array(
						'user_id' => 1,
						'status'  => 'inactive',
					),
					array(
						'user_id' => 2,
						'status'  => 'cancelled',
					),
					array(
						'user_id' => 3,
						'status'  => 'expired',
					),
				),
			)
		);

		$result = Memberships_Abilities::list_subscribers( array( 'status' => 'all' ) );
		$this->assertCount( 3, $result );
		foreach ( $result as $sub ) {
			$this->assertSame(
				'cancelled',
				$sub['status'],
				'Non-active upstream statuses must collapse to "cancelled" so the output enum stays tight.'
			);
		}
	}

	public function test_list_subscribers_handles_missing_subscribers_key() {
		$this->mock_wpcom_response( array() );
		$result = Memberships_Abilities::list_subscribers();
		$this->assertSame( array(), $result );
	}

	public function test_list_subscribers_transport_error_returns_steering_wp_error() {
		$this->mock_wpcom_transport_error();
		$result = Memberships_Abilities::list_subscribers();
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_memberships_subscribers_unavailable', $result->get_error_code() );
	}

	public function test_list_subscribers_http_error_returns_steering_wp_error() {
		$this->mock_wpcom_response( array( 'message' => 'boom' ), 502 );
		$result = Memberships_Abilities::list_subscribers();
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'jetpack_memberships_subscribers_unavailable', $result->get_error_code() );
	}

	/** Per-ability allow list filter */
	public function test_per_ability_allow_list_filter_blocks_individual_slugs() {
		if ( ! function_exists( 'wp_register_ability' ) || ! function_exists( 'wp_get_abilities' ) ) {
			$this->markTestSkipped( 'Abilities API not available.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) {
				if ( 'ability' === $type && str_starts_with( $slug, 'jetpack-memberships/' ) ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		Memberships_Abilities::register_abilities();

		$registered_slugs = array_map(
			static function ( $ability ) {
				return $ability->get_name();
			},
			wp_get_abilities()
		);
		foreach ( array_keys( Memberships_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotContains(
				$slug,
				$registered_slugs,
				"Ability {$slug} must be filtered out by jetpack_wp_abilities_should_register."
			);
		}
	}
}
