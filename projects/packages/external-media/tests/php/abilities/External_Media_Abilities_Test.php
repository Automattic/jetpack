<?php
/**
 * Unit tests for Jetpack External Media Abilities.
 *
 * @package automattic/jetpack-external-media
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\External_Media\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * @coversDefaultClass \Automattic\Jetpack\External_Media\Abilities\External_Media_Abilities
 */
class External_Media_Abilities_Test extends BaseTestCase {

	/**
	 * Administrator user id (has upload_files).
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * Subscriber user id (no upload_files).
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * Whether stub routes have been registered.
	 *
	 * @var bool
	 */
	private $rest_stub_registered = false;

	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();
		global $wp_rest_server;

		$wp_rest_server = new \WP_REST_Server();
		do_action( 'rest_api_init' );

		self::$admin_id = wp_insert_user(
			array(
				'user_login' => 'external_media_admin_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'admin_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'administrator',
			)
		);

		self::$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'external_media_sub_' . wp_generate_password( 8, false, false ),
				'user_pass'  => 'pw',
				'user_email' => 'sub_' . wp_generate_password( 6, false, false ) . '@example.test',
				'role'       => 'subscriber',
			)
		);

		// Default: open the rollout gate for most cases.
		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
	}

	/**
	 * Tear down.
	 */
	public function tearDown(): void {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		remove_all_filters( 'jetpack_wp_abilities_should_register' );
		remove_all_filters( 'jetpack_external_media_resolve_item' );
		remove_action( Registrar::CATEGORIES_INIT_ACTION, array( External_Media_Abilities::class, 'register_category' ) );
		remove_action( Registrar::ABILITIES_INIT_ACTION, array( External_Media_Abilities::class, 'register_abilities' ) );

		// Reset registry between tests where possible.
		if ( function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( External_Media_Abilities::get_abilities() ) as $slug ) {
				wp_unregister_ability( $slug );
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' ) ) {
			wp_unregister_ability_category( External_Media_Abilities::get_category_slug() );
		}

		wp_set_current_user( 0 );

		parent::tearDown();
	}

	/**
	 * Hook the registrar callbacks and fire the API lifecycle actions so
	 * registrations happen inside the action callstack.
	 */
	private function fire_abilities_lifecycle(): void {
		add_action( Registrar::CATEGORIES_INIT_ACTION, array( External_Media_Abilities::class, 'register_category' ) );
		add_action( Registrar::ABILITIES_INIT_ACTION, array( External_Media_Abilities::class, 'register_abilities' ) );
		do_action( Registrar::CATEGORIES_INIT_ACTION );
		do_action( Registrar::ABILITIES_INIT_ACTION );
	}

	/**
	 * Register a fake `wpcom/v2/external-media/*` REST controller for the
	 * test process so search and import dispatch land somewhere predictable
	 * instead of returning rest_no_route. Stubbed per-test.
	 *
	 * @param callable|null $list_callback Optional override for `/list/<service>`.
	 * @param callable|null $copy_callback Optional override for `/copy/<service>`.
	 */
	private function register_rest_stub( $list_callback = null, $copy_callback = null ): void {
		if ( $this->rest_stub_registered ) {
			return;
		}
		$this->rest_stub_registered = true;

		register_rest_route(
			'wpcom/v2',
			'/external-media/list/(?P<service>google_photos|openverse|pexels)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => $list_callback ?: array( $this, 'default_list_callback' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			'wpcom/v2',
			'/external-media/copy/(?P<service>google_photos|openverse|pexels)',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => $copy_callback ?: array( $this, 'default_copy_callback' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Default test stub for `/list/<service>` — returns two synthetic items.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return array
	 */
	public function default_list_callback( $request ) {
		$search = $request->get_param( 'search' );
		// If the caller asks for an exact id, return a single matching item so
		// `resolve_media_item()` succeeds for import tests.
		if ( 'item-42' === $search ) {
			return array(
				'media' => array(
					array(
						'ID'        => 'item-42',
						'URL'       => 'https://example.test/photo-42.jpg',
						'title'     => 'Photo 42',
						'caption'   => 'A test photo',
						'author'    => 'Tester',
						'link'      => 'https://example.test/photos/42',
						'license'   => 'CC0',
						'width'     => 1200,
						'height'    => 800,
						'thumbnails' => array(
							'medium' => 'https://example.test/photo-42-thumb.jpg',
						),
					),
				),
			);
		}

		return array(
			'media' => array(
				array(
					'ID'         => 'item-1',
					'URL'        => 'https://example.test/photo-1.jpg',
					'title'      => 'Photo One',
					'caption'    => '',
					'author'     => 'Alice',
					'link'       => 'https://example.test/photos/1',
					'license'    => 'CC0',
					'width'      => 800,
					'height'     => 600,
					'thumbnails' => array(
						'medium' => 'https://example.test/photo-1-thumb.jpg',
					),
				),
				array(
					'ID'         => 'item-2',
					'URL'        => 'https://example.test/photo-2.jpg',
					'title'      => 'Photo Two',
					'caption'    => '',
					'author'     => 'Bob',
					'link'       => 'https://example.test/photos/2',
					'license'    => 'CC0',
					'width'      => 1024,
					'height'     => 768,
					'thumbnails' => array(
						'medium' => 'https://example.test/photo-2-thumb.jpg',
					),
				),
			),
		);
	}

	/**
	 * Default test stub for `/copy/<service>` — returns a fabricated attachment record.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return array
	 */
	public function default_copy_callback( $request ) {
		$media = $request->get_param( 'media' );
		$item  = is_array( $media ) ? reset( $media ) : array();
		$title = isset( $item['title'] ) ? $item['title'] : '';

		// Simulate the controller's response: array of per-item results, each
		// with `id` and `url`.
		return array(
			array(
				'id'      => 9001,
				'url'     => 'https://example.test/wp-content/uploads/photo.jpg',
				'caption' => '',
				'alt'     => $title,
				'type'    => 'image',
			),
		);
	}

	// -------------------- Abstract getters --------------------

	public function test_category_slug_is_plugin_scoped() {
		$this->assertSame( 'jetpack-external-media', External_Media_Abilities::get_category_slug() );
	}

	public function test_category_definition_has_label_and_description() {
		$def = External_Media_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertIsString( $def['label'] );
		$this->assertIsString( $def['description'] );
	}

	public function test_abilities_map_is_non_empty_and_namespaced() {
		$abilities = External_Media_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( array_keys( $abilities ) as $slug ) {
			$this->assertStringStartsWith( 'jetpack-external-media/', $slug );
		}
	}

	public function test_no_spec_sets_category_explicitly() {
		foreach ( External_Media_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Ability {$slug} should not set its own category — Registrar injects it."
			);
		}
	}

	public function test_surface_exposes_expected_abilities() {
		$abilities = External_Media_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-external-media/list-providers', $abilities );
		$this->assertArrayHasKey( 'jetpack-external-media/search-media', $abilities );
		$this->assertArrayHasKey( 'jetpack-external-media/import-media', $abilities );
	}

	public function test_list_providers_is_annotated_readonly_idempotent() {
		$spec = External_Media_Abilities::get_abilities()['jetpack-external-media/list-providers'];
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_search_media_is_annotated_readonly_idempotent() {
		$spec = External_Media_Abilities::get_abilities()['jetpack-external-media/search-media'];
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertTrue( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_import_media_is_annotated_non_readonly_non_idempotent() {
		$spec = External_Media_Abilities::get_abilities()['jetpack-external-media/import-media'];
		$this->assertFalse( $spec['meta']['annotations']['readonly'] );
		$this->assertFalse( $spec['meta']['annotations']['destructive'] );
		$this->assertFalse( $spec['meta']['annotations']['idempotent'] );
	}

	public function test_every_spec_has_input_schema_with_additional_properties_false() {
		foreach ( External_Media_Abilities::get_abilities() as $slug => $spec ) {
			$this->assertArrayHasKey( 'input_schema', $spec, "Ability {$slug} should declare input_schema." );
			$this->assertSame(
				false,
				$spec['input_schema']['additionalProperties'] ?? null,
				"Ability {$slug} input_schema should set additionalProperties to false."
			);
		}
	}

	// -------------------- Registrar wiring --------------------

	public function test_init_registers_nothing_when_gate_filter_is_false() {
		remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );

		External_Media_Abilities::init();

		$this->assertFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( External_Media_Abilities::class, 'register_category' ) )
		);
		$this->assertFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( External_Media_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_init_hooks_lifecycle_actions_when_gate_is_true() {
		External_Media_Abilities::init();

		$this->assertNotFalse(
			has_action( Registrar::CATEGORIES_INIT_ACTION, array( External_Media_Abilities::class, 'register_category' ) )
		);
		$this->assertNotFalse(
			has_action( Registrar::ABILITIES_INIT_ACTION, array( External_Media_Abilities::class, 'register_abilities' ) )
		);
	}

	public function test_register_abilities_registers_every_slug() {
		if ( ! function_exists( 'wp_get_abilities' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		$registered_slugs = array();
		foreach ( wp_get_abilities() as $ability ) {
			$name = $ability->get_name();
			if ( str_starts_with( $name, 'jetpack-external-media/' ) ) {
				$registered_slugs[] = $name;
			}
		}

		foreach ( array_keys( External_Media_Abilities::get_abilities() ) as $slug ) {
			$this->assertContains( $slug, $registered_slugs, "Ability {$slug} should be registered." );
		}
	}

	public function test_per_ability_allow_list_filter_is_respected() {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		add_filter(
			'jetpack_wp_abilities_should_register',
			static function ( $enabled, $type, $slug ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Filter signature requires this parameter even when we don't branch on it.
				if ( 'ability' === $type ) {
					return false;
				}
				return $enabled;
			},
			10,
			3
		);

		$this->fire_abilities_lifecycle();

		$registered_slugs = array_map(
			static function ( $a ) {
				return $a->get_name();
			},
			wp_get_abilities()
		);
		foreach ( array_keys( External_Media_Abilities::get_abilities() ) as $slug ) {
			$this->assertNotContains( $slug, $registered_slugs, "Ability {$slug} must be filtered out." );
		}
	}

	public function test_register_abilities_auto_injects_category() {
		if ( ! function_exists( 'wp_get_ability' ) || ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this WP version.' );
		}

		$this->fire_abilities_lifecycle();

		foreach ( array_keys( External_Media_Abilities::get_abilities() ) as $slug ) {
			$registered = wp_get_ability( $slug );
			$this->assertNotNull( $registered, "Ability {$slug} should be registered." );
			$this->assertSame(
				'jetpack-external-media',
				$registered->get_category(),
				"Ability {$slug} should have category auto-injected."
			);
		}
	}

	// -------------------- Permission callbacks --------------------

	public function test_can_upload_files_allows_admin() {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( External_Media_Abilities::can_upload_files() );
	}

	public function test_can_upload_files_denies_subscriber() {
		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( External_Media_Abilities::can_upload_files() );
	}

	public function test_can_upload_files_denies_anonymous() {
		wp_set_current_user( 0 );
		$this->assertFalse( External_Media_Abilities::can_upload_files() );
	}

	// -------------------- Execute: list_providers --------------------

	public function test_list_providers_returns_uniform_shape_for_each_provider() {
		wp_set_current_user( self::$admin_id );

		$result = External_Media_Abilities::list_providers();

		$this->assertIsArray( $result );
		$this->assertSame( array( 'google_photos', 'pexels', 'openverse' ), array_column( $result, 'slug' ) );
		foreach ( $result as $entry ) {
			$this->assertArrayHasKey( 'slug', $entry );
			$this->assertArrayHasKey( 'name', $entry );
			$this->assertArrayHasKey( 'requires_auth', $entry );
			$this->assertArrayHasKey( 'connected', $entry );
			$this->assertArrayHasKey( 'supports_search', $entry );
			$this->assertArrayHasKey( 'supports_import', $entry );
			$this->assertIsBool( $entry['requires_auth'] );
			$this->assertIsBool( $entry['connected'] );
			$this->assertTrue( $entry['supports_search'] );
			$this->assertTrue( $entry['supports_import'] );
		}
	}

	public function test_list_providers_marks_public_providers_as_connected() {
		wp_set_current_user( self::$admin_id );

		$result = External_Media_Abilities::list_providers();
		$by_slug = array();
		foreach ( $result as $entry ) {
			$by_slug[ $entry['slug'] ] = $entry;
		}

		$this->assertFalse( $by_slug['pexels']['requires_auth'] );
		$this->assertTrue( $by_slug['pexels']['connected'] );
		$this->assertFalse( $by_slug['openverse']['requires_auth'] );
		$this->assertTrue( $by_slug['openverse']['connected'] );
		$this->assertTrue( $by_slug['google_photos']['requires_auth'] );
	}

	// -------------------- Execute: search_media --------------------

	public function test_search_media_rejects_unknown_provider() {
		wp_set_current_user( self::$admin_id );

		$result = External_Media_Abilities::search_media(
			array(
				'provider' => 'flickr',
				'query'    => 'cats',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_external_media_invalid_provider', $result->get_error_code() );
	}

	public function test_search_media_rejects_missing_provider() {
		wp_set_current_user( self::$admin_id );
		$result = External_Media_Abilities::search_media( array( 'query' => 'cats' ) );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_external_media_invalid_provider', $result->get_error_code() );
	}

	public function test_search_media_rejects_empty_query() {
		wp_set_current_user( self::$admin_id );

		$result = External_Media_Abilities::search_media(
			array(
				'provider' => 'pexels',
				'query'    => '',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_external_media_missing_query', $result->get_error_code() );
	}

	public function test_search_media_returns_normalized_items_when_route_responds() {
		wp_set_current_user( self::$admin_id );
		$this->register_rest_stub();

		$result = External_Media_Abilities::search_media(
			array(
				'provider' => 'pexels',
				'query'    => 'cats',
			)
		);

		$this->assertIsArray( $result );
		$this->assertNotEmpty( $result );
		$first = $result[0];
		$this->assertSame( 'item-1', $first['id'] );
		$this->assertSame( 'Photo One', $first['title'] );
		$this->assertSame( 'https://example.test/photo-1.jpg', $first['full_url'] );
		$this->assertSame( 'https://example.test/photo-1-thumb.jpg', $first['thumbnail'] );
		$this->assertSame( 'Alice', $first['author'] );
		$this->assertSame( 'CC0', $first['license'] );
		$this->assertSame( 800, $first['width'] );
		$this->assertSame( 600, $first['height'] );
		// Every result must contain the full uniform shape, even when source
		// keys are missing.
		foreach ( array( 'id', 'title', 'thumbnail', 'full_url', 'author', 'source_url', 'license', 'width', 'height' ) as $key ) {
			$this->assertArrayHasKey( $key, $first );
		}
	}

	public function test_search_media_returns_error_when_route_unavailable() {
		wp_set_current_user( self::$admin_id );
		// No stub registered — `rest_do_request` will surface rest_no_route.

		$result = External_Media_Abilities::search_media(
			array(
				'provider' => 'pexels',
				'query'    => 'cats',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
	}

	// -------------------- Execute: import_media --------------------

	public function test_import_media_rejects_unknown_provider() {
		wp_set_current_user( self::$admin_id );

		$result = External_Media_Abilities::import_media(
			array(
				'provider' => 'flickr',
				'id'       => 'item-42',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_external_media_invalid_provider', $result->get_error_code() );
	}

	public function test_import_media_rejects_missing_id() {
		wp_set_current_user( self::$admin_id );

		$result = External_Media_Abilities::import_media( array( 'provider' => 'pexels' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_external_media_missing_id', $result->get_error_code() );
	}

	public function test_import_media_rejects_empty_id_string() {
		wp_set_current_user( self::$admin_id );

		$result = External_Media_Abilities::import_media(
			array(
				'provider' => 'pexels',
				'id'       => '',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_external_media_missing_id', $result->get_error_code() );
	}

	public function test_import_media_accepts_literal_zero_id() {
		// Regression guard: the literal string '0' is a valid id and must not
		// be rejected by `empty()`-style checks. With a resolver filter we
		// short-circuit the REST lookup so we don't depend on stub matching.
		wp_set_current_user( self::$admin_id );
		$this->register_rest_stub();

		add_filter(
			'jetpack_external_media_resolve_item',
			static function ( $resolved, $provider, $id ) {
				if ( '0' === $id ) {
					return array(
						'url'   => 'https://example.test/photo-zero.jpg',
						'name'  => 'photo-zero.jpg',
						'title' => 'Zero',
					);
				}
				return $resolved;
			},
			10,
			3
		);

		$result = External_Media_Abilities::import_media(
			array(
				'provider' => 'pexels',
				'id'       => '0',
			)
		);

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertIsArray( $result );
		$this->assertSame( 9001, $result['attachment_id'] );
	}

	public function test_import_media_returns_attachment_record_on_success() {
		wp_set_current_user( self::$admin_id );
		$this->register_rest_stub();

		$result = External_Media_Abilities::import_media(
			array(
				'provider' => 'pexels',
				'id'       => 'item-42',
			)
		);

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertIsArray( $result );
		$this->assertSame( 9001, $result['attachment_id'] );
		$this->assertSame( 'https://example.test/wp-content/uploads/photo.jpg', $result['attachment_url'] );
		$this->assertSame(
			array(
				'provider'  => 'pexels',
				'source_id' => 'item-42',
			),
			$result['source']
		);
	}

	public function test_import_media_uses_resolver_filter_to_short_circuit_lookup() {
		wp_set_current_user( self::$admin_id );
		$this->register_rest_stub();

		add_filter(
			'jetpack_external_media_resolve_item',
			static function () {
				return array(
					'url'     => 'https://example.test/direct.jpg',
					'name'    => 'direct.jpg',
					'title'   => 'Direct',
					'caption' => 'Bypass',
				);
			}
		);

		$result = External_Media_Abilities::import_media(
			array(
				'provider' => 'pexels',
				'id'       => 'whatever',
			)
		);

		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( 9001, $result['attachment_id'] );
	}

	public function test_import_media_returns_not_found_when_id_unknown() {
		wp_set_current_user( self::$admin_id );
		$this->register_rest_stub();

		$result = External_Media_Abilities::import_media(
			array(
				'provider' => 'pexels',
				'id'       => 'unknown-id',
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_external_media_not_found', $result->get_error_code() );
	}
}
