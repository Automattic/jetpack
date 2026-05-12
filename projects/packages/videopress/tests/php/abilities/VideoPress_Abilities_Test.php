<?php
/**
 * Unit tests for Jetpack VideoPress Abilities.
 *
 * @package automattic/jetpack-videopress
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9. The class guards function_exists() so the package is safe on older WP. @todo Remove this line when the minimum supported WordPress version is 6.9.

namespace Automattic\Jetpack\VideoPress\Abilities;

use Automattic\Jetpack\VideoPress\Data;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WorDBless\BaseTestCase;

/**
 * Unit tests for VideoPress_Abilities registration and execution.
 *
 * To run this test from the projects/packages/videopress directory:
 *
 *   composer phpunit -- --filter VideoPress_Abilities_Test
 */
class VideoPress_Abilities_Test extends BaseTestCase {

	/**
	 * Administrator user id (can upload_files).
	 *
	 * @var int
	 */
	private $admin_user_id;

	/**
	 * Subscriber user id (cannot upload_files).
	 *
	 * @var int
	 */
	private $subscriber_user_id;

	/**
	 * Set up the test environment.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();
		do_action( 'rest_api_init' );

		$this->admin_user_id = wp_insert_user(
			array(
				'user_login' => 'vp_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_user_id = wp_insert_user(
			array(
				'user_login' => 'vp_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Tear down the test environment.
	 */
	public function tearDown(): void {
		global $wp_rest_server;
		$wp_rest_server = null;
		wp_set_current_user( 0 );

		// Reset the abilities registry between tests so back-to-back
		// `register_*()` calls don't trigger "already registered" notices.
		if ( function_exists( 'wp_unregister_ability' ) ) {
			foreach ( array_keys( VideoPress_Abilities::get_abilities() ) as $slug ) {
				if ( function_exists( 'wp_has_ability' ) && wp_has_ability( $slug ) ) {
					wp_unregister_ability( $slug );
				}
			}
		}
		if ( function_exists( 'wp_unregister_ability_category' )
			&& function_exists( 'wp_has_ability_category' )
			&& wp_has_ability_category( VideoPress_Abilities::CATEGORY_SLUG )
		) {
			wp_unregister_ability_category( VideoPress_Abilities::CATEGORY_SLUG );
		}

		parent::tearDown();
	}

	/**
	 * Simulate `wp_abilities_api_categories_init` having fired so the
	 * Registrar's `did_action()` branch takes the synchronous registration
	 * path during tests.
	 */
	private function simulate_doing_categories_init_action(): void {
		global $wp_current_filter;
		$wp_current_filter[] = Registrar::CATEGORIES_INIT_ACTION;
	}

	/**
	 * Simulate `wp_abilities_api_init` having fired.
	 */
	private function simulate_doing_abilities_init_action(): void {
		global $wp_current_filter;
		$wp_current_filter[] = Registrar::ABILITIES_INIT_ACTION;
	}

	/**
	 * Skip the test if the WP 6.9+ Abilities API isn't available in the test
	 * environment. The class still loads — only the live-registration tests
	 * need the runtime.
	 */
	private function skip_when_abilities_api_missing(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available in this test environment.' );
		}
	}

	/*
	---------------------------------------------------------------------
	 * Registrar wiring
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Gate filter defaulting to false must short-circuit init() — nothing
	 * hooks, nothing registers.
	 */
	public function test_init_registers_nothing_when_rollout_filter_is_disabled(): void {
		$this->skip_when_abilities_api_missing();

		// Capture every category and ability the test environment registers
		// before our init() runs, so we can isolate "did init() add ours?"
		// from the WP-core abilities/categories that already exist.
		$baseline_abilities = function_exists( 'wp_get_abilities' )
			? array_keys( wp_get_abilities() )
			: array();

		add_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		try {
			VideoPress_Abilities::init();

			// Trigger the lifecycle actions only if they haven't already been
			// fired, to confirm init() did not hook anything into them.
			if ( ! did_action( Registrar::ABILITIES_INIT_ACTION ) ) {
				do_action( Registrar::ABILITIES_INIT_ACTION );
			}

			$after_abilities = function_exists( 'wp_get_abilities' )
				? array_keys( wp_get_abilities() )
				: array();
			$added           = array_diff( $after_abilities, $baseline_abilities );

			$this->assertEmpty(
				array_filter(
					$added,
					static fn ( $slug ) => 0 === strpos( $slug, VideoPress_Abilities::CATEGORY_SLUG . '/' )
				),
				'VideoPress abilities must not register while the rollout filter is disabled.'
			);
			$this->assertFalse(
				wp_has_ability_category( VideoPress_Abilities::CATEGORY_SLUG ),
				'Category must not register while the rollout filter is disabled.'
			);
		} finally {
			remove_filter( 'jetpack_wp_abilities_enabled', '__return_false' );
		}
	}

	/**
	 * Filter enabled + Abilities API ready: the category and every ability
	 * register and the category slug is auto-injected onto each spec.
	 */
	public function test_init_registers_category_and_abilities_when_enabled(): void {
		$this->skip_when_abilities_api_missing();

		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		try {
			$this->simulate_doing_categories_init_action();
			VideoPress_Abilities::register_category();

			$this->simulate_doing_abilities_init_action();
			VideoPress_Abilities::register_abilities();

			$this->assertTrue(
				wp_has_ability_category( VideoPress_Abilities::CATEGORY_SLUG ),
				'VideoPress category should be registered.'
			);

			$expected = array(
				'jetpack-videopress/list-videos',
				'jetpack-videopress/get-storage-quota',
				'jetpack-videopress/get-upload-token',
			);
			foreach ( $expected as $slug ) {
				$ability = wp_get_ability( $slug );
				$this->assertNotNull( $ability, "Ability $slug must register." );
			}
		} finally {
			remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		}
	}

	/**
	 * The per-ability `jetpack_wp_abilities_should_register` filter returning
	 * false for a specific slug must skip only that ability — siblings still
	 * register.
	 */
	public function test_per_ability_filter_can_disable_a_single_ability(): void {
		$this->skip_when_abilities_api_missing();

		$skip = static function ( $enabled, $type, $slug ) {
			if ( 'ability' === $type && 'jetpack-videopress/get-upload-token' === $slug ) {
				return false;
			}
			return $enabled;
		};
		add_filter( 'jetpack_wp_abilities_should_register', $skip, 10, 3 );

		try {
			$this->simulate_doing_categories_init_action();
			VideoPress_Abilities::register_category();

			$this->simulate_doing_abilities_init_action();
			VideoPress_Abilities::register_abilities();

			$this->assertNotNull(
				wp_get_ability( 'jetpack-videopress/list-videos' ),
				'list-videos must still register when only upload-token is skipped.'
			);
			$this->assertFalse(
				wp_has_ability( 'jetpack-videopress/get-upload-token' ),
				'get-upload-token must not register when the per-ability filter returns false.'
			);
		} finally {
			remove_filter( 'jetpack_wp_abilities_should_register', $skip, 10 );
		}
	}

	/**
	 * Abilities omit `category` in their specs — the Registrar must inject
	 * the subclass's slug so the dashboard groups them under jetpack-videopress.
	 */
	public function test_category_is_auto_injected_into_each_spec(): void {
		$abilities = VideoPress_Abilities::get_abilities();
		$this->assertNotEmpty( $abilities );
		foreach ( $abilities as $slug => $spec ) {
			$this->assertArrayNotHasKey(
				'category',
				$spec,
				"Spec for $slug must omit 'category' so Registrar injects the slug."
			);
		}
	}

	/*
	---------------------------------------------------------------------
	 * Abstract getters
	 * ---------------------------------------------------------------------
	 */

	public function test_get_category_slug_returns_jetpack_videopress(): void {
		$this->assertSame( 'jetpack-videopress', VideoPress_Abilities::get_category_slug() );
	}

	public function test_get_category_definition_returns_label_and_description(): void {
		$def = VideoPress_Abilities::get_category_definition();
		$this->assertArrayHasKey( 'label', $def );
		$this->assertArrayHasKey( 'description', $def );
		$this->assertIsString( $def['label'] );
		$this->assertNotEmpty( $def['description'] );
	}

	public function test_get_abilities_returns_expected_slugs(): void {
		$abilities = VideoPress_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-videopress/list-videos', $abilities );
		$this->assertArrayHasKey( 'jetpack-videopress/get-storage-quota', $abilities );
		$this->assertArrayHasKey( 'jetpack-videopress/get-upload-token', $abilities );
	}

	/*
	---------------------------------------------------------------------
	 * Permission callback
	 * ---------------------------------------------------------------------
	 */

	public function test_can_upload_files_allows_admin(): void {
		wp_set_current_user( $this->admin_user_id );
		$this->assertTrue( VideoPress_Abilities::can_upload_files() );
	}

	public function test_can_upload_files_denies_subscriber(): void {
		wp_set_current_user( $this->subscriber_user_id );
		$this->assertFalse( VideoPress_Abilities::can_upload_files() );
	}

	public function test_can_upload_files_denies_anonymous(): void {
		wp_set_current_user( 0 );
		$this->assertFalse( VideoPress_Abilities::can_upload_files() );
	}

	/*
	---------------------------------------------------------------------
	 * Execute: list-videos
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Happy path: list-videos returns the documented compact shape for a
	 * VideoPress attachment. Exercised via the `media_id` filter, which goes
	 * through the same `summarize_attachment` projection the list query
	 * uses; the consolidated-read contract guarantees the two code paths
	 * return entries shaped identically.
	 */
	public function test_list_videos_returns_compact_shape_for_videopress_attachment(): void {
		wp_set_current_user( $this->admin_user_id );

		$attachment_id = $this->make_videopress_attachment( 'My Test Video' );

		$result = VideoPress_Abilities::list_videos( array( 'media_id' => $attachment_id ) );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$found = $result[0];

		// Documented shape — every key must be present.
		foreach (
			array(
				'media_id',
				'guid',
				'title',
				'url',
				'poster',
				'privacy',
				'rating',
				'duration_ms',
				'width',
				'height',
				'uploaded_at',
				'thumbnail_status',
				'processing_status',
			) as $key
		) {
			$this->assertArrayHasKey( $key, $found, "Entry missing key '$key'." );
		}

		$this->assertSame( $attachment_id, $found['media_id'] );
		$this->assertIsString( $found['title'] );
		$this->assertContains(
			$found['privacy'],
			array( 'public', 'private', 'site-default' ),
			'privacy must be one of the three documented labels.'
		);
	}

	/**
	 * `media_id` filter with an unknown id must return an empty array — not a
	 * WP_Error — per the consolidated-read contract.
	 */
	public function test_list_videos_with_unknown_media_id_returns_empty_array(): void {
		wp_set_current_user( $this->admin_user_id );

		$result = VideoPress_Abilities::list_videos( array( 'media_id' => 9999999 ) );

		$this->assertIsArray( $result );
		$this->assertSame( array(), $result );
	}

	/**
	 * `media_id` filter with the literal string `'0'` is treated as an unknown
	 * id (regression guard against `empty('0')` returning true).
	 */
	public function test_list_videos_with_string_zero_media_id_returns_empty_array(): void {
		wp_set_current_user( $this->admin_user_id );

		// Negative ids and 0 collapse to empty.
		$this->assertSame( array(), VideoPress_Abilities::list_videos( array( 'media_id' => '0' ) ) );
	}

	/**
	 * `media_id` filter for an existing VideoPress attachment returns a
	 * 1-element array with the same shape as the list response.
	 */
	public function test_list_videos_with_known_media_id_returns_single_element_array(): void {
		wp_set_current_user( $this->admin_user_id );

		$attachment_id = $this->make_videopress_attachment( 'Single video' );

		$result = VideoPress_Abilities::list_videos( array( 'media_id' => $attachment_id ) );

		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertSame( $attachment_id, $result[0]['media_id'] );
	}

	/**
	 * `media_id` pointing at a non-VideoPress attachment (regular media)
	 * returns an empty array — we don't want callers seeing "other media"
	 * objects bleed into the VideoPress surface.
	 */
	public function test_list_videos_with_non_videopress_media_id_returns_empty_array(): void {
		wp_set_current_user( $this->admin_user_id );

		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_title'     => 'plain image',
				'post_status'    => 'inherit',
				'post_mime_type' => 'image/png',
			)
		);

		$result = VideoPress_Abilities::list_videos( array( 'media_id' => $attachment_id ) );
		$this->assertSame( array(), $result );
	}

	/**
	 * `per_page` above the cap must be clamped — even if the schema's
	 * maximum is bypassed by a non-validating caller.
	 */
	public function test_list_videos_clamps_per_page_at_100(): void {
		wp_set_current_user( $this->admin_user_id );

		// Capture the per_page that reaches /wp/v2/media so we can assert the
		// clamp without inserting 1000 attachments.
		$captured = null;
		$capture  = static function ( $result, $server, $request ) use ( &$captured ) {
			if ( '/wp/v2/media' === $request->get_route() ) {
				$captured = $request->get_param( 'per_page' );
			}
			return $result;
		};
		add_filter( 'rest_pre_dispatch', $capture, 10, 3 );

		try {
			VideoPress_Abilities::list_videos( array( 'per_page' => 5000 ) );
		} finally {
			remove_filter( 'rest_pre_dispatch', $capture, 10 );
		}

		$this->assertSame( VideoPress_Abilities::MAX_PER_PAGE, $captured );
	}

	/*
	---------------------------------------------------------------------
	 * Execute: get-storage-quota
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Happy path: get-storage-quota returns the documented shape with sane
	 * defaults when no plan/features are known.
	 */
	public function test_get_storage_quota_returns_documented_shape(): void {
		wp_set_current_user( $this->admin_user_id );

		$result = VideoPress_Abilities::get_storage_quota();

		$this->assertIsArray( $result );
		foreach ( array( 'used_bytes', 'quota_bytes', 'percent_used', 'plan_class', 'can_upload' ) as $key ) {
			$this->assertArrayHasKey( $key, $result, "Quota missing key '$key'." );
		}
		$this->assertIsInt( $result['used_bytes'] );
		$this->assertIsBool( $result['can_upload'] );
		$this->assertIsString( $result['plan_class'] );
		$this->assertContains(
			$result['plan_class'],
			array( 'free', 'videopress-1tb', 'videopress-unlimited' ),
			'plan_class must be one of the documented enum values.'
		);
	}

	/*
	---------------------------------------------------------------------
	 * Execute: get-upload-token
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Without a connected owner the ability must return WP_Error with the
	 * documented `videopress_not_connected` code so the agent knows what to
	 * fix.
	 */
	public function test_get_upload_token_returns_wp_error_when_not_connected(): void {
		wp_set_current_user( $this->admin_user_id );

		// `Data::has_connected_owner()` returns false by default in WorDBless,
		// since no Jetpack connection exists.
		$result = VideoPress_Abilities::get_upload_token();

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'videopress_not_connected', $result->get_error_code() );
	}

	/*
	---------------------------------------------------------------------
	 * Schema sanity
	 * ---------------------------------------------------------------------
	 */

	public function test_list_videos_schema_clamps_per_page_at_100_in_schema(): void {
		$abilities = VideoPress_Abilities::get_abilities();
		$schema    = $abilities['jetpack-videopress/list-videos']['input_schema'];
		$this->assertSame(
			100,
			$schema['properties']['per_page']['maximum'],
			'list-videos input_schema must cap per_page at 100.'
		);
		$this->assertFalse( $schema['additionalProperties'] );
	}

	public function test_each_ability_declares_annotations(): void {
		$abilities = VideoPress_Abilities::get_abilities();
		foreach ( $abilities as $slug => $spec ) {
			$this->assertArrayHasKey( 'meta', $spec, "$slug must declare meta." );
			$this->assertArrayHasKey( 'annotations', $spec['meta'], "$slug must declare meta.annotations." );
			foreach ( array( 'readonly', 'destructive', 'idempotent' ) as $annotation ) {
				$this->assertArrayHasKey(
					$annotation,
					$spec['meta']['annotations'],
					"$slug missing annotations.$annotation."
				);
				$this->assertIsBool(
					$spec['meta']['annotations'][ $annotation ],
					"$slug annotation $annotation must be a bool."
				);
			}
		}
	}

	public function test_upload_token_annotated_not_readonly_and_not_idempotent(): void {
		$abilities  = VideoPress_Abilities::get_abilities();
		$annotations = $abilities['jetpack-videopress/get-upload-token']['meta']['annotations'];
		$this->assertFalse( $annotations['readonly'], 'Minting a token is not a pure read.' );
		$this->assertFalse( $annotations['destructive'], 'Minting a token does not delete state.' );
		$this->assertFalse( $annotations['idempotent'], 'Each call mints a fresh token.' );
	}

	/*
	---------------------------------------------------------------------
	 * Fixtures
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Create a VideoPress attachment fixture with a `jetpack_videopress`
	 * field shaped like the dashboard expects.
	 *
	 * @param string $title Post title.
	 * @return int Attachment id.
	 */
	private function make_videopress_attachment( string $title ): int {
		// The REST attachments controller filters orphan attachments by their
		// (missing) parent's visibility; pin a published post as the parent so
		// the test fixture survives the controller's parent_status filter.
		$parent_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_title'  => $title . ' parent',
				'post_status' => 'publish',
			)
		);

		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_parent'    => $parent_id,
				'post_title'     => $title,
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
			)
		);
		update_post_meta( $attachment_id, 'videopress_guid', 'abcd1234' );
		update_post_meta( $attachment_id, 'videopress_privacy_setting', 0 );
		update_post_meta( $attachment_id, 'videopress_rating', 'G' );

		return (int) $attachment_id;
	}
}
