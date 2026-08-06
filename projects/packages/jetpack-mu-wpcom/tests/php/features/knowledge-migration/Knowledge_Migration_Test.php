<?php
/**
 * Tests for the legacy guideline to Knowledge migration.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Knowledge_Migration;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/knowledge-migration/class-legacy-guideline-rest-controller.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/knowledge-migration/class-knowledge-migration.php';

/**
 * Test the local Knowledge migration lifecycle.
 */
class Knowledge_Migration_Test extends \WorDBless\BaseTestCase {
	/**
	 * Migration state observed while a Knowledge post was being saved.
	 *
	 * @var array<string, int|string>|null
	 */
	private $state_during_save;

	/**
	 * Post IDs visible to the WorDBless WP_Query shim.
	 *
	 * @var int[]
	 */
	private $post_ids = array();

	/**
	 * Term slugs assigned to tracked posts, keyed by post ID and taxonomy.
	 *
	 * @var array<int, array<string, string[]>>
	 */
	private $object_terms = array();

	/**
	 * Post metadata visible to the WorDBless metadata shim.
	 *
	 * @var array<int, array<string, mixed>>
	 */
	private $post_meta = array();

	/**
	 * Prepare isolated storage registrations and state.
	 */
	public function set_up() {
		parent::set_up();

		$this->unregister_storage();
		delete_option( Knowledge_Migration::OPTION_NAME );
		delete_transient( 'jetpack_mu_wpcom_knowledge_migration_lock' );
		wp_clear_scheduled_hook( Knowledge_Migration::CRON_HOOK );
		wp_set_current_user( 0 );
		$this->state_during_save = null;
		$this->post_ids          = array();
		$this->object_terms      = array();
		$this->post_meta         = array();
		add_action( 'wp_after_insert_post', array( $this, 'track_post' ), 10, 1 );
		add_action( 'added_post_meta', array( $this, 'track_post_meta' ), 10, 4 );
		add_action( 'updated_post_meta', array( $this, 'track_post_meta' ), 10, 4 );
		add_filter( 'posts_pre_query', array( $this, 'filter_posts_query' ), 10, 2 );
		add_filter( 'get_object_terms', array( $this, 'filter_object_terms' ), 999, 4 );
		add_filter( 'wp_get_object_terms', array( $this, 'filter_wp_get_object_terms' ), 999, 4 );
		add_filter( 'get_post_metadata', array( $this, 'filter_post_metadata' ), 10, 5 );

		Knowledge_Migration::register_legacy_storage();
		$this->register_knowledge_storage();

		if ( ! isset( get_registered_settings()[ Knowledge_Migration::OPTION_NAME ] ) ) {
			Knowledge_Migration::register_migration_setting();
		}
	}

	/**
	 * Remove global registrations and scheduled work.
	 */
	public function tear_down() {
		remove_action( 'save_post_wp_knowledge', array( $this, 'capture_migration_state' ) );
		remove_action( 'wp_after_insert_post', array( $this, 'track_post' ), 10 );
		remove_action( 'added_post_meta', array( $this, 'track_post_meta' ), 10 );
		remove_action( 'updated_post_meta', array( $this, 'track_post_meta' ), 10 );
		remove_filter( 'posts_pre_query', array( $this, 'filter_posts_query' ), 10 );
		remove_filter( 'get_object_terms', array( $this, 'filter_object_terms' ), 999 );
		remove_filter( 'wp_get_object_terms', array( $this, 'filter_wp_get_object_terms' ), 999 );
		remove_filter( 'get_post_metadata', array( $this, 'filter_post_metadata' ), 10 );
		delete_option( Knowledge_Migration::OPTION_NAME );
		delete_transient( 'jetpack_mu_wpcom_knowledge_migration_lock' );
		wp_clear_scheduled_hook( Knowledge_Migration::CRON_HOOK );
		wp_set_current_user( 0 );
		$this->unregister_storage();

		parent::tear_down();
	}

	/**
	 * Legacy storage stays registered after migration completion.
	 */
	public function test_legacy_storage_registration_is_independent_of_migration_state() {
		update_option( Knowledge_Migration::OPTION_NAME, $this->state( 'complete' ) );
		$this->unregister_legacy_storage();

		Knowledge_Migration::register_legacy_storage();

		$guideline = get_post_type_object( 'wp_guideline' );
		$content   = get_post_type_object( 'wp_content_guideline' );
		$taxonomy  = get_taxonomy( 'wp_guideline_type' );

		$this->assertNotNull( $guideline );
		$this->assertTrue( $guideline->show_in_rest );
		$this->assertSame( 'guidelines', $guideline->rest_base );
		$this->assertNotNull( $content );
		$this->assertTrue( $content->show_in_rest );
		$this->assertSame( 'content-guidelines', $content->rest_base );
		$this->assertNotNull( $taxonomy );
		$this->assertTrue( $taxonomy->show_in_rest );
		$this->assertSame( 'wp_guideline_type', $taxonomy->rest_base );
	}

	/**
	 * Legacy post contents require administrator authentication over REST.
	 */
	public function test_legacy_rest_collection_requires_an_administrator() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'wp_guideline',
				'post_status'  => 'publish',
				'post_title'   => 'Private legacy guideline',
				'post_content' => 'Private content',
			)
		);
		$this->assertIsInt( $post_id );

		do_action( 'rest_api_init' );
		$request = new WP_REST_Request( 'GET', '/wp/v2/guidelines' );
		$request->set_param( 'context', 'edit' );
		$anonymous = rest_do_request( $request );
		$this->assertSame( 401, $anonymous->get_status() );

		wp_set_current_user( $this->create_administrator() );
		$authorized = rest_do_request( $request );
		$this->assertSame( 200, $authorized->get_status() );
		$this->assertNotEmpty( $authorized->get_data() );
		$this->assertSame( $post_id, $authorized->get_data()[0]['id'] );
	}

	/**
	 * Migration state is readable and writable through core REST settings.
	 */
	public function test_migration_state_is_writable_through_rest_settings() {
		do_action( 'rest_api_init' );
		wp_set_current_user( $this->create_administrator() );

		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_body_params(
			array(
				Knowledge_Migration::OPTION_NAME => array(
					'version'      => 4,
					'status'       => 'started',
					'started_at'   => 123,
					'completed_at' => 0,
					'last_error'   => '',
				),
			)
		);
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 4, $response->get_data()[ Knowledge_Migration::OPTION_NAME ]['version'] );
		$this->assertSame( 'started', get_option( Knowledge_Migration::OPTION_NAME )['status'] );
	}

	/**
	 * An incomplete version schedules exactly one randomized cron event.
	 */
	public function test_incomplete_migration_schedules_only_one_event() {
		Knowledge_Migration::maybe_schedule_migration();

		$first = wp_next_scheduled( Knowledge_Migration::CRON_HOOK );
		$this->assertIsInt( $first );
		$this->assertSame( 'scheduled', get_option( Knowledge_Migration::OPTION_NAME )['status'] );
		$this->assertSame( Knowledge_Migration::MIGRATION_VERSION, get_option( Knowledge_Migration::OPTION_NAME )['version'] );

		Knowledge_Migration::maybe_schedule_migration();
		$this->assertSame( $first, wp_next_scheduled( Knowledge_Migration::CRON_HOOK ) );
	}

	/**
	 * A completed current version does not schedule another pass.
	 */
	public function test_completed_migration_does_not_schedule_event() {
		update_option( Knowledge_Migration::OPTION_NAME, $this->state( 'complete' ) );

		Knowledge_Migration::maybe_schedule_migration();

		$this->assertFalse( wp_next_scheduled( Knowledge_Migration::CRON_HOOK ) );
	}

	/**
	 * Sites without legacy records are marked as checked and complete.
	 */
	public function test_empty_site_is_marked_complete() {
		Knowledge_Migration::run_migration();

		$state = get_option( Knowledge_Migration::OPTION_NAME );
		$this->assertSame( 'complete', $state['status'] );
		$this->assertSame( Knowledge_Migration::MIGRATION_VERSION, $state['version'] );
		$this->assertGreaterThan( 0, $state['started_at'] );
		$this->assertGreaterThan( 0, $state['completed_at'] );
		$this->assertSame( '', $state['last_error'] );
	}

	/**
	 * Ordinary guidelines retain their ID and receive equivalent Knowledge terms.
	 */
	public function test_ordinary_guideline_is_converted_in_place() {
		$term = wp_insert_term( 'Instruction', 'wp_guideline_type', array( 'slug' => 'instruction' ) );
		$this->assertIsArray( $term );
		$post_id   = wp_insert_post(
			array(
				'post_type'    => 'wp_guideline',
				'post_status'  => 'private',
				'post_name'    => 'legacy-instruction',
				'post_title'   => 'Legacy instruction',
				'post_content' => 'Keep this content.',
			)
		);
		$set_terms = wp_set_object_terms( $post_id, 'instruction', 'wp_guideline_type' );
		$this->assertFalse( is_wp_error( $set_terms ) );
		$this->object_terms[ $post_id ]['wp_guideline_type'] = array( 'instruction' );
		add_action( 'save_post_wp_knowledge', array( $this, 'capture_migration_state' ) );
		$this->assertSame( 'private', get_post_status( $post_id ) );

		Knowledge_Migration::run_migration();

		$state = get_option( Knowledge_Migration::OPTION_NAME );
		$this->assertSame( 'complete', $state['status'], $state['last_error'] );
		$converted = get_post( $post_id );
		$this->assertSame( 'wp_knowledge', $converted->post_type );
		$this->assertSame( 'Keep this content.', $converted->post_content );
		$this->assertNotFalse( term_exists( 'instruction', 'wp_knowledge_type' ) );
		$this->assertSame( 'started', $this->state_during_save['status'] ?? null );
		$this->assertSame( 'complete', get_option( Knowledge_Migration::OPTION_NAME )['status'] );
	}

	/**
	 * An existing Knowledge slug wins and the superseded legacy row is retired.
	 */
	public function test_existing_knowledge_slug_retires_legacy_guideline() {
		$destination_id = wp_insert_post(
			array(
				'post_type'    => 'wp_knowledge',
				'post_status'  => 'publish',
				'post_name'    => 'same-slug',
				'post_content' => 'Current content.',
			)
		);
		$source_id      = wp_insert_post(
			array(
				'post_type'    => 'wp_guideline',
				'post_status'  => 'publish',
				'post_name'    => 'same-slug',
				'post_content' => 'Legacy content.',
			)
		);

		Knowledge_Migration::run_migration();

		$state = get_option( Knowledge_Migration::OPTION_NAME );
		$this->assertSame( 'complete', $state['status'], $state['last_error'] );
		$this->assertSame( 'trash', get_post_status( $source_id ) );
		$this->assertSame( 'Current content.', get_post( $destination_id )->post_content );
		$this->assertCount( 1, $this->get_knowledge_posts() );
	}

	/**
	 * Content singleton formats expand into scoped rows before sources are retired.
	 */
	public function test_content_guidelines_expand_with_transitional_format_precedence() {
		$old_id = wp_insert_post(
			array(
				'post_type'   => 'wp_content_guideline',
				'post_status' => 'publish',
				'post_author' => 12,
			)
		);
		update_post_meta( $old_id, '_content_guideline_site', 'Old site guidance.' );
		update_post_meta( $old_id, '_content_guideline_block_core_paragraph', 'Paragraph guidance.' );

		$content_term = wp_insert_term( 'Content', 'wp_guideline_type', array( 'slug' => 'content' ) );
		$this->assertIsArray( $content_term );
		$new_id    = wp_insert_post(
			array(
				'post_type'   => 'wp_guideline',
				'post_status' => 'private',
				'post_author' => 34,
				'post_title'  => 'Transitional content guidelines',
			)
		);
		$set_terms = wp_set_object_terms( $new_id, 'content', 'wp_guideline_type' );
		$this->assertFalse( is_wp_error( $set_terms ) );
		$this->object_terms[ $new_id ]['wp_guideline_type'] = array( 'content' );
		update_post_meta( $new_id, '_guideline_site', 'New site guidance.' );
		$this->assertSame( array( 'content' ), wp_get_object_terms( $new_id, 'wp_guideline_type', array( 'fields' => 'slugs' ) ) );

		Knowledge_Migration::run_migration();

		$state = get_option( Knowledge_Migration::OPTION_NAME );
		$this->assertSame( 'complete', $state['status'], $state['last_error'] );
		$site  = $this->find_knowledge_post( 'guideline-site' );
		$block = $this->find_knowledge_post( 'guideline-block-core_paragraph' );
		$this->assertNotNull( $site );
		$this->assertSame( 'New site guidance.', $site->post_content );
		$this->assertSame( 34, (int) $site->post_author );
		$this->assertNotNull( $block );
		$this->assertSame( 'Paragraph guidance.', $block->post_content );
		$this->assertSame( 'core/paragraph', $block->post_title );
		$this->assertNotFalse( term_exists( 'guideline', 'wp_knowledge_type' ) );
		$this->assertSame( 'trash', get_post_status( $old_id ) );
		$this->assertSame( 'trash', get_post_status( $new_id ) );

		$count = count( $this->get_knowledge_posts() );
		update_option( Knowledge_Migration::OPTION_NAME, $this->state( 'not_started', 0 ) );
		Knowledge_Migration::run_migration();
		$this->assertCount( $count, $this->get_knowledge_posts() );
	}

	/**
	 * A missing destination leaves an observable error and schedules a retry.
	 */
	public function test_missing_knowledge_storage_records_error_and_retry() {
		unregister_post_type( 'wp_knowledge' );
		unregister_taxonomy( 'wp_knowledge_type' );

		Knowledge_Migration::run_migration();

		$state = get_option( Knowledge_Migration::OPTION_NAME );
		$this->assertSame( 'error', $state['status'] );
		$this->assertStringContainsString( 'Knowledge storage is not registered', $state['last_error'] );
		$this->assertIsInt( wp_next_scheduled( Knowledge_Migration::CRON_HOOK ) );
	}

	/**
	 * Capture the migration state from inside a Knowledge save callback.
	 */
	public function capture_migration_state(): void {
		$this->state_during_save = get_option( Knowledge_Migration::OPTION_NAME );
	}

	/**
	 * Track posts created by both the test and the migrator.
	 *
	 * @param int $post_id Inserted post ID.
	 */
	public function track_post( int $post_id ): void {
		if ( ! in_array( $post_id, $this->post_ids, true ) ) {
			$this->post_ids[] = $post_id;
		}
	}

	/**
	 * Supply post queries from tracked objects because WorDBless does not run WP_Query.
	 *
	 * @param WP_Post[]|int[]|null $posts Existing short-circuit value.
	 * @param WP_Query             $query Query object.
	 * @return WP_Post[]|int[]|null
	 */
	public function filter_posts_query( $posts, WP_Query $query ) {
		$post_types  = (array) $query->get( 'post_type' );
		$known_types = array( 'wp_guideline', 'wp_content_guideline', 'wp_knowledge' );
		if ( empty( array_intersect( $post_types, $known_types ) ) ) {
			return $posts;
		}

		$statuses = (array) $query->get( 'post_status' );
		if ( empty( $statuses ) ) {
			$statuses = array( 'publish' );
		}
		$name    = (string) $query->get( 'name' );
		$matches = array();
		foreach ( $this->post_ids as $post_id ) {
			$post = get_post( $post_id );
			if ( ! $post instanceof WP_Post || ! in_array( $post->post_type, $post_types, true ) ) {
				continue;
			}
			if ( ! in_array( 'any', $statuses, true ) && ! in_array( $post->post_status, $statuses, true ) ) {
				continue;
			}
			if ( '' !== $name && $post->post_name !== $name ) {
				continue;
			}

			$matches[] = $post;
		}

		usort(
			$matches,
			static function ( WP_Post $left, WP_Post $right ): int {
				return $left->ID <=> $right->ID;
			}
		);

		$limit = (int) $query->get( 'posts_per_page' );
		if ( $limit > 0 ) {
			$matches = array_slice( $matches, 0, $limit );
		}

		$query->found_posts   = count( $matches );
		$query->max_num_pages = 1;
		if ( 'ids' === $query->get( 'fields' ) ) {
			return array_map(
				static function ( WP_Post $post ): int {
					return $post->ID;
				},
				$matches
			);
		}

		return $matches;
	}

	/**
	 * Supply object terms from tracked assignments.
	 *
	 * @param mixed    $terms       Terms returned by WorDBless.
	 * @param int[]    $object_ids  Object IDs.
	 * @param string[] $taxonomies  Taxonomies.
	 * @param array    $args        Query arguments.
	 * @return mixed
	 */
	public function filter_object_terms( $terms, array $object_ids, array $taxonomies, array $args ) {
		$slugs = array();
		foreach ( $object_ids as $object_id ) {
			foreach ( $taxonomies as $taxonomy ) {
				$slugs = array_merge( $slugs, $this->object_terms[ $object_id ][ $taxonomy ] ?? array() );
			}
		}

		if ( 'slugs' === ( $args['fields'] ?? 'all' ) ) {
			return $slugs;
		}

		$objects = array();
		foreach ( $object_ids as $object_id ) {
			foreach ( $taxonomies as $taxonomy ) {
				foreach ( $this->object_terms[ $object_id ][ $taxonomy ] ?? array() as $slug ) {
					$term = get_term_by( 'slug', $slug, $taxonomy );
					if ( ! $term instanceof WP_Term ) {
						$term_id = abs( crc32( $taxonomy . ':' . $slug ) );
						$term    = new WP_Term(
							(object) array(
								'term_id'          => $term_id,
								'name'             => ucfirst( $slug ),
								'slug'             => $slug,
								'term_group'       => 0,
								'term_taxonomy_id' => $term_id,
								'taxonomy'         => $taxonomy,
								'description'      => '',
								'parent'           => 0,
								'count'            => 1,
								'filter'           => 'raw',
							)
						);
					}
					$objects[] = $term;
				}
			}
		}

		switch ( $args['fields'] ?? 'all' ) {
			case 'ids':
			case 'tt_ids':
				return array_map(
					static function ( WP_Term $term ): int {
						return $term->term_id;
					},
					$objects
				);
			case 'names':
				return array_map(
					static function ( WP_Term $term ): string {
						return $term->name;
					},
					$objects
				);
			default:
				return $objects;
		}
	}

	/**
	 * Restore tracked slugs after WorDBless applies its final taxonomy shim.
	 *
	 * @param mixed  $terms       Terms returned by WorDBless.
	 * @param string $object_ids  Comma-separated object IDs.
	 * @param string $taxonomies  SQL-formatted taxonomy names.
	 * @param array  $args        Query arguments.
	 * @return mixed
	 */
	public function filter_wp_get_object_terms( $terms, string $object_ids, string $taxonomies, array $args ) {
		if ( 'slugs' !== ( $args['fields'] ?? 'all' ) ) {
			return $terms;
		}

		$slugs = array();
		foreach ( array_map( 'intval', explode( ',', $object_ids ) ) as $object_id ) {
			foreach ( $this->object_terms[ $object_id ] ?? array() as $assigned_slugs ) {
				$slugs = array_merge( $slugs, $assigned_slugs );
			}
		}

		return ! empty( $slugs ) ? $slugs : $terms;
	}

	/**
	 * Track added and updated post metadata.
	 *
	 * @param int    $meta_id    Metadata ID.
	 * @param int    $object_id  Post ID.
	 * @param string $meta_key   Metadata key.
	 * @param mixed  $meta_value Metadata value.
	 */
	public function track_post_meta( int $meta_id, int $object_id, string $meta_key, $meta_value ): void {
		unset( $meta_id );
		$this->post_meta[ $object_id ][ $meta_key ] = $meta_value;
	}

	/**
	 * Supply tracked metadata because WorDBless does not populate meta queries.
	 *
	 * @param mixed  $value     Existing short-circuit value.
	 * @param int    $object_id Post ID.
	 * @param string $meta_key  Metadata key.
	 * @param bool   $single    Whether one value was requested.
	 * @param string $meta_type Metadata type.
	 * @return mixed
	 */
	public function filter_post_metadata( $value, int $object_id, string $meta_key, bool $single, string $meta_type ) {
		if ( 'post' !== $meta_type || ! isset( $this->post_meta[ $object_id ] ) ) {
			return $value;
		}

		if ( '' === $meta_key ) {
			return array_map(
				static function ( $meta_value ): array {
					return array( $meta_value );
				},
				$this->post_meta[ $object_id ]
			);
		}

		if ( ! array_key_exists( $meta_key, $this->post_meta[ $object_id ] ) ) {
			return $single ? '' : array();
		}

		return $single
			? $this->post_meta[ $object_id ][ $meta_key ]
			: array( $this->post_meta[ $object_id ][ $meta_key ] );
	}

	/**
	 * Register a minimal destination matching Gutenberg's public storage shape.
	 */
	private function register_knowledge_storage(): void {
		register_post_type(
			'wp_knowledge', // phpcs:ignore WordPress.NamingConventions.ValidPostTypeSlug.ReservedPrefix -- Mirrors the Gutenberg destination post type.
			array(
				'public'   => false,
				'supports' => array( 'title', 'editor', 'author' ),
			)
		);
		register_taxonomy( 'wp_knowledge_type', 'wp_knowledge', array( 'public' => false ) );
	}

	/**
	 * Create an administrator and return its ID.
	 */
	private function create_administrator(): int {
		return wp_insert_user(
			array(
				'user_login' => 'knowledge_migration_admin_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'knowledge-migration-' . wp_rand() . '@example.com',
				'role'       => 'administrator',
			)
		);
	}

	/**
	 * Build a state option for a test.
	 *
	 * @param string $status  State status.
	 * @param int    $version State version.
	 * @return array<string, int|string>
	 */
	private function state( string $status, int $version = Knowledge_Migration::MIGRATION_VERSION ): array {
		return array(
			'version'      => $version,
			'status'       => $status,
			'started_at'   => 100,
			'completed_at' => 'complete' === $status ? 200 : 0,
			'last_error'   => '',
		);
	}

	/**
	 * Return all active Knowledge rows.
	 *
	 * @return WP_Post[]
	 */
	private function get_knowledge_posts(): array {
		return get_posts(
			array(
				'post_type'      => 'wp_knowledge',
				'post_status'    => array( 'publish', 'private', 'draft', 'pending', 'future' ),
				'posts_per_page' => -1,
			)
		);
	}

	/**
	 * Find an active Knowledge row by slug.
	 *
	 * @param string $slug Post slug.
	 */
	private function find_knowledge_post( string $slug ): ?WP_Post {
		$posts = get_posts(
			array(
				'post_type'      => 'wp_knowledge',
				'post_status'    => array( 'publish', 'private', 'draft', 'pending', 'future' ),
				'name'           => $slug,
				'posts_per_page' => 1,
			)
		);

		return ! empty( $posts ) ? $posts[0] : null;
	}

	/**
	 * Unregister all post types and taxonomies used by the feature tests.
	 */
	private function unregister_storage(): void {
		$this->unregister_legacy_storage();
		if ( post_type_exists( 'wp_knowledge' ) ) {
			unregister_post_type( 'wp_knowledge' );
		}
		if ( taxonomy_exists( 'wp_knowledge_type' ) ) {
			unregister_taxonomy( 'wp_knowledge_type' );
		}
	}

	/**
	 * Unregister only the compatibility storage.
	 */
	private function unregister_legacy_storage(): void {
		foreach ( array( 'wp_guideline', 'wp_content_guideline' ) as $post_type ) {
			if ( post_type_exists( $post_type ) ) {
				unregister_post_type( $post_type );
			}
		}
		if ( taxonomy_exists( 'wp_guideline_type' ) ) {
			unregister_taxonomy( 'wp_guideline_type' );
		}
	}
}
