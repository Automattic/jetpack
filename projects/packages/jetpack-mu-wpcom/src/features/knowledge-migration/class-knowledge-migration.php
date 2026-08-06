<?php
/**
 * Local migration from legacy guideline storage to Knowledge.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Register legacy storage and migrate its active records locally.
 */
class Knowledge_Migration {
	/**
	 * Increment to deliberately run another migration pass on Atomic sites.
	 */
	public const MIGRATION_VERSION = 1;

	/**
	 * Public constants used by operational checks and tests.
	 */
	public const OPTION_NAME = 'jetpack_mu_wpcom_knowledge_migration';
	public const CRON_HOOK   = 'jetpack_mu_wpcom_knowledge_migration';

	/**
	 * Internal migration constants.
	 */
	private const LOCK_TRANSIENT  = 'jetpack_mu_wpcom_knowledge_migration_lock';
	private const LOCK_TTL        = 15 * MINUTE_IN_SECONDS;
	private const RETRY_DELAY     = DAY_IN_SECONDS;
	private const ACTIVE_STATUSES = array( 'publish', 'private', 'draft', 'pending', 'future' );

	/**
	 * Whether hooks have already been registered.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Register feature hooks.
	 */
	public static function init(): void {
		if ( self::$initialized ) {
			return;
		}

		self::$initialized = true;

		add_action( 'init', array( __CLASS__, 'register_legacy_storage' ), 9 );
		add_action( 'init', array( __CLASS__, 'register_migration_setting' ), 9 );
		add_action( 'init', array( __CLASS__, 'maybe_schedule_migration' ), 100 );
		add_action( self::CRON_HOOK, array( __CLASS__, 'run_migration' ) );
	}

	/**
	 * Register legacy post types and taxonomy independently of migration state.
	 */
	public static function register_legacy_storage(): void {
		if ( ! post_type_exists( 'wp_guideline' ) ) {
			register_post_type(
				'wp_guideline', // phpcs:ignore WordPress.NamingConventions.ValidPostTypeSlug.ReservedPrefix -- Historical Gutenberg post type being migrated.
				array(
					'label'                 => __( 'Guidelines', 'jetpack-mu-wpcom' ),
					'public'                => false,
					'publicly_queryable'    => false,
					'show_ui'               => false,
					'show_in_menu'          => false,
					'show_in_rest'          => true,
					'rest_base'             => 'guidelines',
					'rest_controller_class' => Legacy_Guideline_REST_Controller::class,
					'supports'              => array( 'title', 'editor', 'excerpt', 'author', 'custom-fields', 'revisions' ),
					'has_archive'           => false,
					'rewrite'               => false,
					'query_var'             => false,
					'can_export'            => true,
				)
			);
		}

		if ( ! taxonomy_exists( 'wp_guideline_type' ) ) {
			register_taxonomy(
				'wp_guideline_type',
				'wp_guideline',
				array(
					'label'              => __( 'Guideline Types', 'jetpack-mu-wpcom' ),
					'public'             => false,
					'publicly_queryable' => false,
					'hierarchical'       => true,
					'show_ui'            => false,
					'show_in_rest'       => true,
					'rest_base'          => 'wp_guideline_type',
					'show_in_nav_menus'  => false,
					'rewrite'            => false,
					'query_var'          => false,
				)
			);
		}

		if ( ! post_type_exists( 'wp_content_guideline' ) ) {
			register_post_type(
				'wp_content_guideline', // phpcs:ignore WordPress.NamingConventions.ValidPostTypeSlug.ReservedPrefix -- Historical Gutenberg post type being migrated.
				array(
					'label'                 => __( 'Content Guidelines', 'jetpack-mu-wpcom' ),
					'public'                => false,
					'publicly_queryable'    => false,
					'show_ui'               => false,
					'show_in_menu'          => false,
					'show_in_rest'          => true,
					'rest_base'             => 'content-guidelines',
					'rest_controller_class' => Legacy_Guideline_REST_Controller::class,
					'supports'              => array( 'title', 'author', 'custom-fields' ),
					'has_archive'           => false,
					'rewrite'               => false,
					'query_var'             => false,
				)
			);
		}
	}

	/**
	 * Register the writable migration state in the standard settings REST API.
	 */
	public static function register_migration_setting(): void {
		register_setting(
			'general',
			self::OPTION_NAME,
			array(
				'type'              => 'object',
				'description'       => __( 'State of the legacy guideline to Knowledge migration.', 'jetpack-mu-wpcom' ),
				'default'           => self::default_state(),
				'sanitize_callback' => array( __CLASS__, 'sanitize_state' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'                 => 'object',
						'additionalProperties' => false,
						'properties'           => array(
							'version'      => array(
								'type'    => 'integer',
								'default' => 0,
							),
							'status'       => array(
								'type'    => 'string',
								'enum'    => array( 'not_started', 'scheduled', 'started', 'complete', 'error' ),
								'default' => 'not_started',
							),
							'started_at'   => array(
								'type'    => 'integer',
								'default' => 0,
							),
							'completed_at' => array(
								'type'    => 'integer',
								'default' => 0,
							),
							'last_error'   => array(
								'type'    => 'string',
								'default' => '',
							),
						),
					),
				),
			)
		);
	}

	/**
	 * Sanitize migration state written locally or through REST.
	 *
	 * @param mixed $state Candidate state.
	 * @return array<string, int|string>
	 */
	public static function sanitize_state( $state ): array {
		$state          = is_array( $state ) ? $state : array();
		$valid_statuses = array( 'not_started', 'scheduled', 'started', 'complete', 'error' );
		$status         = isset( $state['status'] ) ? sanitize_key( (string) $state['status'] ) : 'not_started';

		if ( ! in_array( $status, $valid_statuses, true ) ) {
			$status = 'not_started';
		}

		return array(
			'version'      => isset( $state['version'] ) ? max( 0, (int) $state['version'] ) : 0,
			'status'       => $status,
			'started_at'   => isset( $state['started_at'] ) ? max( 0, (int) $state['started_at'] ) : 0,
			'completed_at' => isset( $state['completed_at'] ) ? max( 0, (int) $state['completed_at'] ) : 0,
			'last_error'   => isset( $state['last_error'] ) ? sanitize_text_field( (string) $state['last_error'] ) : '',
		);
	}

	/**
	 * Schedule a single migration pass when this version has not completed.
	 */
	public static function maybe_schedule_migration(): void {
		$state = self::get_state();
		if ( self::is_complete( $state ) || wp_next_scheduled( self::CRON_HOOK ) ) {
			return;
		}

		$scheduled = wp_schedule_single_event(
			time() + wp_rand( MINUTE_IN_SECONDS, DAY_IN_SECONDS ),
			self::CRON_HOOK,
			array(),
			true
		);

		if ( is_wp_error( $scheduled ) ) {
			self::update_state( 'error', $scheduled->get_error_message() );
			return;
		}

		self::update_state( 'scheduled' );
	}

	/**
	 * Run the local migration from WP-Cron.
	 */
	public static function run_migration(): void {
		if ( self::is_complete( self::get_state() ) ) {
			return;
		}

		if ( get_transient( self::LOCK_TRANSIENT ) ) {
			self::schedule_retry();
			return;
		}

		set_transient( self::LOCK_TRANSIENT, 1, self::LOCK_TTL );
		self::update_state( 'started' );

		try {
			$result = self::migrate();
			if ( is_wp_error( $result ) ) {
				self::update_state( 'error', $result->get_error_message() );
				self::schedule_retry();
				return;
			}

			self::update_state( 'complete' );
		} finally {
			delete_transient( self::LOCK_TRANSIENT );
		}
	}

	/**
	 * Migrate all active local legacy records.
	 *
	 * @return true|\WP_Error
	 */
	private static function migrate() {
		if ( ! post_type_exists( 'wp_guideline' ) || ! taxonomy_exists( 'wp_guideline_type' ) || ! post_type_exists( 'wp_content_guideline' ) ) {
			return new \WP_Error( 'legacy_storage_unavailable', 'Legacy guideline storage is not registered.' );
		}

		if ( ! post_type_exists( 'wp_knowledge' ) || ! taxonomy_exists( 'wp_knowledge_type' ) ) {
			return new \WP_Error( 'knowledge_storage_unavailable', 'Knowledge storage is not registered.' );
		}

		$legacy_posts  = self::get_active_posts( 'wp_guideline' );
		$content_posts = self::get_active_posts( 'wp_content_guideline' );

		foreach ( $legacy_posts as $source ) {
			$term_slugs = wp_get_object_terms( $source->ID, 'wp_guideline_type', array( 'fields' => 'slugs' ) );
			if ( is_wp_error( $term_slugs ) ) {
				return $term_slugs;
			}

			if ( in_array( 'content', $term_slugs, true ) ) {
				$content_posts[] = $source;
				continue;
			}

			$migrated = self::migrate_ordinary_post( $source );
			if ( is_wp_error( $migrated ) ) {
				return $migrated;
			}
		}

		foreach ( self::build_content_items( $content_posts ) as $item ) {
			$migrated = self::migrate_content_item( $item );
			if ( is_wp_error( $migrated ) ) {
				return $migrated;
			}
		}

		foreach ( $content_posts as $source ) {
			if ( ! wp_trash_post( $source->ID ) instanceof \WP_Post ) {
				return new \WP_Error( 'legacy_source_not_trashed', sprintf( 'Failed to trash legacy content guideline %d.', $source->ID ) );
			}
		}

		if ( self::has_active_legacy_posts() ) {
			return new \WP_Error( 'legacy_sources_remain', 'Active legacy guideline records remain after migration.' );
		}

		return true;
	}

	/**
	 * Migrate an ordinary guideline in place.
	 *
	 * @param \WP_Post $source Legacy post.
	 * @return true|\WP_Error
	 */
	private static function migrate_ordinary_post( \WP_Post $source ) {
		if ( self::find_knowledge_post( $source->post_name ) ) {
			return wp_trash_post( $source->ID ) instanceof \WP_Post
				? true
				: new \WP_Error( 'legacy_source_not_trashed', sprintf( 'Failed to trash superseded legacy guideline %d.', $source->ID ) );
		}

		$terms = wp_get_object_terms( $source->ID, 'wp_guideline_type' );
		if ( is_wp_error( $terms ) ) {
			return $terms;
		}
		if ( ! is_array( $terms ) ) {
			return new \WP_Error( 'legacy_terms_invalid', sprintf( 'Legacy guideline %d returned an invalid term result.', $source->ID ) );
		}

		$term_slugs = array();
		foreach ( $terms as $term ) {
			$ensured = self::ensure_knowledge_term( $term );
			if ( is_wp_error( $ensured ) ) {
				return $ensured;
			}
			$term_slugs[] = $term->slug;
		}

		$updated = wp_update_post(
			array(
				'ID'        => $source->ID,
				'post_type' => 'wp_knowledge',
			),
			true
		);
		if ( is_wp_error( $updated ) ) {
			return $updated;
		}

		$set_terms = wp_set_object_terms( $source->ID, $term_slugs, 'wp_knowledge_type' );
		if ( is_wp_error( $set_terms ) ) {
			return self::rollback_ordinary_post( $source->ID, $term_slugs, $set_terms );
		}

		$clear_terms = wp_set_object_terms( $source->ID, array(), 'wp_guideline_type' );
		if ( is_wp_error( $clear_terms ) ) {
			return self::rollback_ordinary_post( $source->ID, $term_slugs, $clear_terms );
		}

		$converted = get_post( $source->ID );
		if ( ! $converted instanceof \WP_Post || 'wp_knowledge' !== $converted->post_type ) {
			return self::rollback_ordinary_post(
				$source->ID,
				$term_slugs,
				new \WP_Error( 'post_type_conversion_failed', 'Post type conversion did not persist.' )
			);
		}

		return true;
	}

	/**
	 * Restore an ordinary legacy row after a partial conversion.
	 *
	 * @param int       $post_id    Post ID.
	 * @param string[]  $term_slugs Legacy term slugs.
	 * @param \WP_Error $error      Original error.
	 * @return \WP_Error
	 */
	private static function rollback_ordinary_post( int $post_id, array $term_slugs, \WP_Error $error ): \WP_Error {
		$rollback_errors = array();
		$updated         = wp_update_post(
			array(
				'ID'        => $post_id,
				'post_type' => 'wp_guideline',
			),
			true
		);
		if ( is_wp_error( $updated ) ) {
			$rollback_errors[] = $updated->get_error_message();
		}

		$restored = wp_set_object_terms( $post_id, $term_slugs, 'wp_guideline_type' );
		if ( is_wp_error( $restored ) ) {
			$rollback_errors[] = $restored->get_error_message();
		}

		$cleared = wp_set_object_terms( $post_id, array(), 'wp_knowledge_type' );
		if ( is_wp_error( $cleared ) ) {
			$rollback_errors[] = $cleared->get_error_message();
		}

		$message = $error->get_error_message();
		if ( ! empty( $rollback_errors ) ) {
			$message .= ' Rollback also failed: ' . implode( '; ', $rollback_errors );
		}

		return new \WP_Error( $error->get_error_code(), $message );
	}

	/**
	 * Create a scoped Knowledge row from legacy content-guideline metadata.
	 *
	 * @param array{slug:string,title:string,content:string,author:int} $item Content item.
	 * @return true|\WP_Error
	 */
	private static function migrate_content_item( array $item ) {
		if ( self::find_knowledge_post( $item['slug'] ) ) {
			return true;
		}

		$post_id = wp_insert_post(
			wp_slash(
				array(
					'post_type'    => 'wp_knowledge',
					'post_status'  => 'publish',
					'post_author'  => $item['author'],
					'post_title'   => $item['title'],
					'post_name'    => $item['slug'],
					'post_content' => $item['content'],
				)
			),
			true
		);
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		$term = term_exists( 'guideline', 'wp_knowledge_type' );
		if ( ! $term ) {
			$term = wp_insert_term( 'Guideline', 'wp_knowledge_type', array( 'slug' => 'guideline' ) );
		}
		if ( is_wp_error( $term ) ) {
			wp_delete_post( $post_id, true );
			return $term;
		}

		$set_terms = wp_set_object_terms( $post_id, 'guideline', 'wp_knowledge_type' );
		if ( is_wp_error( $set_terms ) ) {
			wp_delete_post( $post_id, true );
			return $set_terms;
		}

		return true;
	}

	/**
	 * Expand content singleton metadata into scoped Knowledge items.
	 *
	 * Transitional wp_guideline content posts take precedence over the older
	 * wp_content_guideline singleton when both contain the same scope.
	 *
	 * @param \WP_Post[] $posts Legacy content posts.
	 * @return array<int, array{slug:string,title:string,content:string,author:int}>
	 */
	private static function build_content_items( array $posts ): array {
		usort(
			$posts,
			static function ( \WP_Post $left, \WP_Post $right ): int {
				if ( $left->post_type !== $right->post_type ) {
					return 'wp_guideline' === $left->post_type ? -1 : 1;
				}

				return $right->ID <=> $left->ID;
			}
		);

		$items = array();
		foreach ( $posts as $post ) {
			$prefix       = 'wp_guideline' === $post->post_type ? '_guideline_' : '_content_guideline_';
			$block_prefix = $prefix . 'block_';
			$meta         = get_post_meta( $post->ID );

			foreach ( array( 'site', 'copy', 'images', 'additional' ) as $scope ) {
				$key     = $prefix . $scope;
				$content = isset( $meta[ $key ][0] ) ? self::decode_content_meta_value( $meta[ $key ][0] ) : '';
				$slug    = 'guideline-' . $scope;
				if ( '' !== trim( $content ) && ! isset( $items[ $slug ] ) ) {
					$items[ $slug ] = array(
						'slug'    => $slug,
						'title'   => ucfirst( $scope ),
						'content' => $content,
						'author'  => (int) $post->post_author,
					);
				}
			}

			foreach ( $meta as $key => $values ) {
				if ( ! str_starts_with( (string) $key, $block_prefix ) ) {
					continue;
				}

				$content = isset( $values[0] ) ? self::decode_content_meta_value( $values[0] ) : '';
				$block   = substr( (string) $key, strlen( $block_prefix ) );
				$slug    = 'guideline-block-' . $block;
				if ( '' !== trim( $content ) && '' !== $block && ! isset( $items[ $slug ] ) ) {
					$items[ $slug ] = array(
						'slug'    => $slug,
						'title'   => str_replace( '_', '/', $block ),
						'content' => $content,
						'author'  => (int) $post->post_author,
					);
				}
			}
		}

		return array_values( $items );
	}

	/**
	 * Decode only the serialized-string wrapper WordPress may add to string meta.
	 *
	 * @param mixed $value Raw metadata value.
	 * @return string
	 */
	private static function decode_content_meta_value( $value ): string {
		if ( ! is_string( $value ) ) {
			return '';
		}

		$trimmed = trim( $value );
		if ( ! str_starts_with( $trimmed, 's:' ) || ! is_serialized( $trimmed ) ) {
			return $value;
		}

		$decoded = unserialize( $trimmed, array( 'allowed_classes' => false ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize -- Only validated serialized strings are decoded and classes are disabled.
		return is_string( $decoded ) ? $decoded : $value;
	}

	/**
	 * Return active posts for one legacy type.
	 *
	 * @param string $post_type Post type.
	 * @return \WP_Post[]
	 */
	private static function get_active_posts( string $post_type ): array {
		return get_posts(
			array(
				'post_type'        => $post_type,
				'post_status'      => self::ACTIVE_STATUSES,
				'posts_per_page'   => -1,
				'orderby'          => 'ID',
				'order'            => 'ASC',
				'suppress_filters' => false,
			)
		);
	}

	/**
	 * Find an active Knowledge post by exact slug.
	 *
	 * @param string $slug Post slug.
	 * @return \WP_Post|null
	 */
	private static function find_knowledge_post( string $slug ): ?\WP_Post {
		$posts = get_posts(
			array(
				'name'           => $slug,
				'post_type'      => 'wp_knowledge',
				'post_status'    => self::ACTIVE_STATUSES,
				'posts_per_page' => 1,
			)
		);

		return ! empty( $posts ) ? $posts[0] : null;
	}

	/**
	 * Ensure a legacy type term exists in the Knowledge taxonomy.
	 *
	 * @param \WP_Term $source Legacy term.
	 * @return true|\WP_Error
	 */
	private static function ensure_knowledge_term( \WP_Term $source ) {
		if ( term_exists( $source->slug, 'wp_knowledge_type' ) ) {
			return true;
		}

		$created = wp_insert_term(
			$source->name,
			'wp_knowledge_type',
			array(
				'slug'        => $source->slug,
				'description' => $source->description,
			)
		);

		return is_wp_error( $created ) ? $created : true;
	}

	/**
	 * Whether active legacy records remain.
	 */
	private static function has_active_legacy_posts(): bool {
		foreach ( array( 'wp_guideline', 'wp_content_guideline' ) as $post_type ) {
			$posts = get_posts(
				array(
					'post_type'      => $post_type,
					'post_status'    => self::ACTIVE_STATUSES,
					'posts_per_page' => 1,
					'fields'         => 'ids',
				)
			);
			if ( ! empty( $posts ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Read and normalize the migration state option.
	 *
	 * @return array<string, int|string>
	 */
	private static function get_state(): array {
		return self::sanitize_state( get_option( self::OPTION_NAME, self::default_state() ) );
	}

	/**
	 * Return the initial migration state.
	 *
	 * @return array<string, int|string>
	 */
	private static function default_state(): array {
		return array(
			'version'      => 0,
			'status'       => 'not_started',
			'started_at'   => 0,
			'completed_at' => 0,
			'last_error'   => '',
		);
	}

	/**
	 * Whether the current migration version is complete.
	 *
	 * @param array<string, int|string> $state Migration state.
	 */
	private static function is_complete( array $state ): bool {
		return 'complete' === $state['status'] && (int) $state['version'] >= self::MIGRATION_VERSION;
	}

	/**
	 * Persist a migration state transition.
	 *
	 * @param string $status Migration status.
	 * @param string $error  Optional error message.
	 */
	private static function update_state( string $status, string $error = '' ): void {
		$previous = self::get_state();
		$now      = time();
		$state    = array(
			'version'      => self::MIGRATION_VERSION,
			'status'       => $status,
			'started_at'   => (int) $previous['started_at'],
			'completed_at' => 0,
			'last_error'   => $error,
		);

		if ( 'scheduled' === $status && (int) $previous['version'] !== self::MIGRATION_VERSION ) {
			$state['started_at'] = 0;
		}

		if ( 'started' === $status ) {
			$state['started_at'] = $now;
		}

		if ( 'complete' === $status ) {
			$state['completed_at'] = $now;
		}

		update_option( self::OPTION_NAME, $state, true );
	}

	/**
	 * Schedule a retry after a failed or overlapping run.
	 */
	private static function schedule_retry(): void {
		if ( wp_next_scheduled( self::CRON_HOOK ) ) {
			return;
		}

		wp_schedule_single_event( time() + self::RETRY_DELAY, self::CRON_HOOK );
	}
}
