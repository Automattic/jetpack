<?php
/**
 * VideoPress classification: site-local types, series, topics and people on video attachments.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_Post;
use WP_REST_Request;
use WP_REST_Server;
use WP_Term;

/**
 * Registers four taxonomies on VideoPress attachments and the REST contract that edits them.
 *
 * - videopress_type   Format of a recording ( Town Hall, Workshop ). Flat.
 * - videopress_series Recurring program or event. Hierarchical.
 * - videopress_topic  Subject matter. Flat.
 * - videopress_person People appearing in the recording. Flat; not WordPress accounts.
 *
 * Terms are not exposed through wp/v2: generic term counts include videos a
 * viewer may not see, so readers get counts derived from the channel's own
 * video list ( facets() ) and editors use the routes below.
 */
class Classification {

	const TYPE   = 'videopress_type';
	const SERIES = 'videopress_series';
	const TOPIC  = 'videopress_topic';
	const PERSON = 'videopress_person';

	/**
	 * Attachment meta holding the classification version, for conflict detection.
	 */
	const VERSION_META = '_videopress_classification_version';

	/**
	 * Object-cache group for the facet counts; keys carry the posts and terms last-changed stamps.
	 */
	const CACHE_GROUP = 'videopress_classification';

	/**
	 * Most terms one video may carry in one taxonomy.
	 */
	const MAX_TERMS_PER_TAXONOMY = 50;

	/**
	 * Whether init() already ran.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hook the taxonomies up. Safe to call from both the package initializer
	 * and the WordPress.com block bootstrap.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		if ( did_action( 'init' ) ) {
			self::register();
		} else {
			add_action( 'init', array( __CLASS__, 'register' ), 8 );
		}
		// WordPress.com globalizes taxonomies by default; these vocabularies belong to one site.
		add_filter( 'wpcom_is_globalized_taxonomy', array( __CLASS__, 'keep_local' ), 10, 2 );
	}

	/**
	 * Whether classification is enabled for this site.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Filters whether VideoPress classification ( types, series, topics, people ) is enabled.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Defaults to true.
		 */
		return (bool) apply_filters( 'videopress_classification_enabled', true );
	}

	/**
	 * The taxonomies, with their labels and shape.
	 *
	 * @return array<string, array{hierarchical: bool, label: string, singular: string, query_arg: string}>
	 */
	public static function taxonomies() {
		return array(
			self::TYPE   => array(
				'hierarchical' => false,
				'label'        => __( 'Video types', 'jetpack-videopress-pkg' ),
				'singular'     => __( 'Video type', 'jetpack-videopress-pkg' ),
				'query_arg'    => 'videos-type',
			),
			self::SERIES => array(
				'hierarchical' => true,
				'label'        => __( 'Series and events', 'jetpack-videopress-pkg' ),
				'singular'     => __( 'Series or event', 'jetpack-videopress-pkg' ),
				'query_arg'    => 'videos-series',
			),
			self::TOPIC  => array(
				'hierarchical' => false,
				'label'        => __( 'Topics', 'jetpack-videopress-pkg' ),
				'singular'     => __( 'Topic', 'jetpack-videopress-pkg' ),
				'query_arg'    => 'videos-topic',
			),
			self::PERSON => array(
				'hierarchical' => false,
				'label'        => __( 'People', 'jetpack-videopress-pkg' ),
				'singular'     => __( 'Person', 'jetpack-videopress-pkg' ),
				'query_arg'    => 'videos-person',
			),
		);
	}

	/**
	 * Whether a slug is one of the classification taxonomies.
	 *
	 * @param mixed $taxonomy Taxonomy slug.
	 * @return bool
	 */
	public static function is_taxonomy( $taxonomy ) {
		return is_string( $taxonomy ) && array_key_exists( $taxonomy, self::taxonomies() );
	}

	/**
	 * Register the taxonomies on attachments.
	 *
	 * @return void
	 */
	public static function register() {
		if ( ! self::is_enabled() ) {
			return;
		}
		foreach ( self::taxonomies() as $taxonomy => $shape ) {
			if ( taxonomy_exists( $taxonomy ) ) {
				continue;
			}
			register_taxonomy(
				$taxonomy,
				array( 'attachment' ),
				array(
					'labels'                => array(
						'name'          => $shape['label'],
						'singular_name' => $shape['singular'],
					),
					'hierarchical'          => $shape['hierarchical'],
					'public'                => false,
					'publicly_queryable'    => false,
					'show_ui'               => false,
					'show_in_rest'          => false,
					'show_tagcloud'         => false,
					'show_admin_column'     => false,
					'query_var'             => false,
					'rewrite'               => false,
					// Assignments are counted against inherit-status attachments.
					'update_count_callback' => '_update_generic_term_count',
					'capabilities'          => array(
						'manage_terms' => self::manage_capability(),
						'edit_terms'   => self::manage_capability(),
						'delete_terms' => self::manage_capability(),
						'assign_terms' => 'upload_files',
					),
				)
			);
		}
	}

	/**
	 * The capability that creates, renames and deletes terms.
	 *
	 * @return string
	 */
	public static function manage_capability() {
		/**
		 * Filters the capability needed to manage VideoPress classification terms.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $capability Defaults to manage_categories.
		 */
		return (string) apply_filters( 'videopress_classification_manage_capability', 'manage_categories' );
	}

	/**
	 * Keep the classification taxonomies out of WordPress.com's global terms.
	 *
	 * @param bool   $is_globalized Whether the taxonomy is globalized.
	 * @param string $taxonomy      Taxonomy slug.
	 * @return bool
	 */
	public static function keep_local( $is_globalized, $taxonomy ) {
		return self::is_taxonomy( $taxonomy ) ? false : $is_globalized;
	}

	/**
	 * A stamp that changes whenever a term or a term assignment changes.
	 *
	 * @return string
	 */
	public static function last_changed() {
		return wp_cache_get_last_changed( 'terms' );
	}

	/**
	 * The classification version of a video; bumped on every assignment change.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return int
	 */
	public static function version( $attachment_id ) {
		return max( 0, (int) get_post_meta( (int) $attachment_id, self::VERSION_META, true ) );
	}

	/**
	 * A term as returned by the API.
	 *
	 * @param WP_Term $term The term.
	 * @return array{id: int, name: string, slug: string, parent: int, taxonomy: string}
	 */
	public static function term_data( WP_Term $term ) {
		return array(
			'id'       => (int) $term->term_id,
			'name'     => html_entity_decode( $term->name, ENT_QUOTES ),
			'slug'     => $term->slug,
			'parent'   => (int) $term->parent,
			'taxonomy' => $term->taxonomy,
		);
	}

	/**
	 * A video's terms, keyed by taxonomy.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return array<string, array[]>
	 */
	public static function assignments( $attachment_id ) {
		$assignments = array_fill_keys( array_keys( self::taxonomies() ), array() );
		if ( ! self::is_enabled() ) {
			return $assignments;
		}
		foreach ( array_keys( $assignments ) as $taxonomy ) {
			$terms = taxonomy_exists( $taxonomy ) ? get_the_terms( (int) $attachment_id, $taxonomy ) : array();
			foreach ( is_array( $terms ) ? $terms : array() as $term ) {
				$assignments[ $taxonomy ][] = self::term_data( $term );
			}
			usort(
				$assignments[ $taxonomy ],
				function ( $a, $b ) {
					return strcasecmp( $a['name'], $b['name'] );
				}
			);
		}
		return $assignments;
	}

	/**
	 * Replace a video's assignments after validating the whole request.
	 *
	 * Taxonomies missing from $terms keep their assignments; an empty list clears one.
	 *
	 * @param int                  $attachment_id    Attachment ID of a VideoPress video on this site.
	 * @param array<string, int[]> $terms            Term IDs keyed by taxonomy.
	 * @param int|null             $expected_version The version the editor read; null skips the check.
	 * @return array|WP_Error The new assignments and version, or an error with nothing changed.
	 */
	public static function set_assignments( $attachment_id, $terms, $expected_version = null ) {
		$attachment_id = (int) $attachment_id;
		$validated     = self::validate_assignments( $attachment_id, $terms, $expected_version );
		if ( $validated instanceof WP_Error ) {
			return $validated;
		}

		foreach ( $validated as $taxonomy => $ids ) {
			$result = wp_set_object_terms( $attachment_id, $ids, $taxonomy, false );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}
		$version = self::version( $attachment_id ) + 1;
		update_post_meta( $attachment_id, self::VERSION_META, $version );

		return array(
			'terms'   => self::assignments( $attachment_id ),
			'version' => $version,
		);
	}

	/**
	 * Check a whole assignment request before anything is written.
	 *
	 * @param int      $attachment_id    Attachment ID.
	 * @param mixed    $terms            Term IDs keyed by taxonomy.
	 * @param int|null $expected_version Version precondition.
	 * @return array<string, int[]>|WP_Error Deduplicated term IDs keyed by taxonomy.
	 */
	public static function validate_assignments( $attachment_id, $terms, $expected_version = null ) {
		if ( ! self::is_enabled() ) {
			return new WP_Error( 'videopress_classification_disabled', __( 'Video classification is not enabled on this site.', 'jetpack-videopress-pkg' ), array( 'status' => 404 ) );
		}
		$post = get_post( $attachment_id );
		if ( ! $post instanceof WP_Post || '' === Channel::guid( $post ) ) {
			return new WP_Error( 'videopress_classification_not_found', __( 'This video does not belong to this site.', 'jetpack-videopress-pkg' ), array( 'status' => 404 ) );
		}
		if ( ! is_array( $terms ) ) {
			return new WP_Error( 'videopress_classification_invalid', __( 'Terms must be grouped by taxonomy.', 'jetpack-videopress-pkg' ), array( 'status' => 400 ) );
		}
		if ( null !== $expected_version && (int) $expected_version !== self::version( $post->ID ) ) {
			return new WP_Error(
				'videopress_classification_conflict',
				__( 'This video was classified by someone else in the meantime. Reload it and try again.', 'jetpack-videopress-pkg' ),
				array(
					'status'  => 409,
					'version' => self::version( $post->ID ),
				)
			);
		}

		$validated = array();
		foreach ( $terms as $taxonomy => $ids ) {
			if ( ! self::is_taxonomy( $taxonomy ) || ! taxonomy_exists( $taxonomy ) ) {
				/* translators: %s: a taxonomy slug. */
				return new WP_Error( 'videopress_classification_invalid', sprintf( __( 'Unknown classification: %s.', 'jetpack-videopress-pkg' ), (string) $taxonomy ), array( 'status' => 400 ) );
			}
			if ( ! is_array( $ids ) ) {
				return new WP_Error( 'videopress_classification_invalid', __( 'Terms must be lists of IDs.', 'jetpack-videopress-pkg' ), array( 'status' => 400 ) );
			}
			if ( ! self::can_assign( $post->ID, $taxonomy ) ) {
				return new WP_Error( 'videopress_classification_forbidden', __( 'You cannot classify this video.', 'jetpack-videopress-pkg' ), array( 'status' => rest_authorization_required_code() ) );
			}
			$clean = array();
			foreach ( $ids as $id ) {
				if ( ! ( is_int( $id ) || ( is_string( $id ) && ctype_digit( $id ) ) ) || (int) $id <= 0 ) {
					return new WP_Error( 'videopress_classification_invalid', __( 'Terms must be lists of IDs.', 'jetpack-videopress-pkg' ), array( 'status' => 400 ) );
				}
				$term = get_term( (int) $id, $taxonomy );
				if ( ! $term instanceof WP_Term ) {
					/* translators: 1: a term ID, 2: a taxonomy slug. */
					return new WP_Error( 'videopress_classification_invalid', sprintf( __( 'Term %1$d does not exist in %2$s.', 'jetpack-videopress-pkg' ), (int) $id, $taxonomy ), array( 'status' => 400 ) );
				}
				$clean[ (int) $id ] = (int) $id;
			}
			if ( count( $clean ) > self::MAX_TERMS_PER_TAXONOMY ) {
				return new WP_Error( 'videopress_classification_invalid', __( 'Too many terms for one video.', 'jetpack-videopress-pkg' ), array( 'status' => 400 ) );
			}
			$validated[ $taxonomy ] = array_values( $clean );
		}
		return $validated;
	}

	/**
	 * Whether the current user may change a video's terms in a taxonomy.
	 *
	 * @param int    $attachment_id Attachment ID.
	 * @param string $taxonomy      Taxonomy slug.
	 * @return bool
	 */
	public static function can_assign( $attachment_id, $taxonomy ) {
		$object = get_taxonomy( $taxonomy );
		return $object && current_user_can( 'edit_post', (int) $attachment_id ) && current_user_can( $object->cap->assign_terms );
	}

	/**
	 * A tax_query for selected terms: different taxonomies AND, values within one OR.
	 *
	 * @param array $selected Term slugs keyed by taxonomy, as lists or comma-separated strings.
	 * @return array Empty when nothing is selected.
	 */
	public static function tax_query( $selected ) {
		$clauses = array();
		foreach ( self::normalize_selection( $selected ) as $taxonomy => $slugs ) {
			$clauses[] = array(
				'taxonomy'         => $taxonomy,
				'field'            => 'slug',
				'terms'            => $slugs,
				'operator'         => 'IN',
				'include_children' => is_taxonomy_hierarchical( $taxonomy ),
			);
		}
		if ( ! $clauses ) {
			return array();
		}
		$clauses['relation'] = 'AND';
		return $clauses;
	}

	/**
	 * Keep only known taxonomies and well-formed slugs, sorted so equal selections share cache keys.
	 *
	 * @param mixed $selected Term slugs keyed by taxonomy.
	 * @return array<string, string[]>
	 */
	public static function normalize_selection( $selected ) {
		$clean = array();
		if ( ! is_array( $selected ) || ! self::is_enabled() ) {
			return $clean;
		}
		foreach ( self::taxonomies() as $taxonomy => $shape ) {
			if ( empty( $selected[ $taxonomy ] ) ) {
				continue;
			}
			$slugs = is_array( $selected[ $taxonomy ] ) ? $selected[ $taxonomy ] : explode( ',', (string) $selected[ $taxonomy ] );
			$slugs = array_values(
				array_unique(
					array_filter(
						array_map(
							function ( $slug ) {
								return is_string( $slug ) ? sanitize_title( $slug ) : '';
							},
							$slugs
						)
					)
				)
			);
			sort( $slugs );
			if ( $slugs ) {
				$clean[ $taxonomy ] = array_slice( $slugs, 0, self::MAX_TERMS_PER_TAXONOMY );
			}
		}
		return $clean;
	}

	/**
	 * Terms of one taxonomy that classify at least one video the channel lists, with
	 * counts of those videos only. Generic term counts would include hidden videos.
	 *
	 * @param string $taxonomy Taxonomy slug.
	 * @return array[] Term data plus count, by name.
	 */
	public static function facets( $taxonomy ) {
		if ( ! self::is_enabled() || ! self::is_taxonomy( $taxonomy ) || ! taxonomy_exists( $taxonomy ) ) {
			return array();
		}
		$key    = implode( ':', array( 'facets', $taxonomy, get_current_blog_id(), wp_cache_get_last_changed( 'posts' ), self::last_changed() ) );
		$cached = wp_cache_get( $key, self::CACHE_GROUP );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$ids    = array_column( Channel_Data::videos(), 'id' );
		$counts = array();
		$terms  = array();
		foreach ( array_chunk( $ids, 500 ) as $chunk ) {
			$found = wp_get_object_terms(
				$chunk,
				$taxonomy,
				array(
					'fields'                 => 'all_with_object_id',
					'update_term_meta_cache' => false,
				)
			);
			foreach ( is_array( $found ) ? $found : array() as $term ) {
				$terms[ $term->term_id ]  = $term;
				$counts[ $term->term_id ] = ( $counts[ $term->term_id ] ?? 0 ) + 1;
			}
		}

		$facets = array();
		foreach ( $terms as $id => $term ) {
			$facets[] = self::term_data( $term ) + array( 'count' => $counts[ $id ] );
		}
		usort(
			$facets,
			function ( $a, $b ) {
				return strcasecmp( $a['name'], $b['name'] );
			}
		);
		wp_cache_set( $key, $facets, self::CACHE_GROUP, DAY_IN_SECONDS );
		return $facets;
	}

	/**
	 * Register the REST routes, under Rest_Controller::REST_NAMESPACE.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		if ( ! self::is_enabled() ) {
			return;
		}
		$taxonomy_pattern = '(?P<taxonomy>' . implode( '|', array_keys( self::taxonomies() ) ) . ')';

		register_rest_route(
			Rest_Controller::REST_NAMESPACE,
			'/classification',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'rest_get_vocabularies' ),
				'permission_callback' => array( __CLASS__, 'rest_can_read_vocabularies' ),
			)
		);
		register_rest_route(
			Rest_Controller::REST_NAMESPACE,
			'/classification/' . $taxonomy_pattern,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'rest_get_terms' ),
					'permission_callback' => array( __CLASS__, 'rest_can_read_vocabularies' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'rest_create_term' ),
					'permission_callback' => array( __CLASS__, 'rest_can_manage_terms' ),
					'args'                => self::term_args( true ),
				),
			)
		);
		register_rest_route(
			Rest_Controller::REST_NAMESPACE,
			'/classification/' . $taxonomy_pattern . '/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'rest_update_term' ),
					'permission_callback' => array( __CLASS__, 'rest_can_manage_terms' ),
					'args'                => self::term_args( false ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'rest_delete_term' ),
					'permission_callback' => array( __CLASS__, 'rest_can_manage_terms' ),
				),
			)
		);
		register_rest_route(
			Rest_Controller::REST_NAMESPACE,
			'/videos/(?P<guid>[a-zA-Z0-9]{8})/classification',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'rest_get_video' ),
					'permission_callback' => array( __CLASS__, 'rest_can_edit_video' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'rest_update_video' ),
					'permission_callback' => array( __CLASS__, 'rest_can_edit_video' ),
					'args'                => array(
						'terms'   => array(
							'type'     => 'object',
							'required' => true,
						),
						'version' => array(
							'type'    => 'integer',
							'minimum' => 0,
						),
					),
				),
			)
		);
	}

	/**
	 * Arguments of the term create and update routes.
	 *
	 * @param bool $creating Whether the name is required.
	 * @return array
	 */
	private static function term_args( $creating ) {
		return array(
			'name'   => array(
				'type'              => 'string',
				'required'          => $creating,
				'minLength'         => 1,
				'maxLength'         => 200,
				'sanitize_callback' => 'sanitize_text_field',
			),
			'parent' => array(
				'type'    => 'integer',
				'minimum' => 0,
			),
		);
	}

	/**
	 * Uploaders read the vocabularies they assign from.
	 *
	 * @return bool
	 */
	public static function rest_can_read_vocabularies() {
		return current_user_can( 'upload_files' );
	}

	/**
	 * Managing terms needs the taxonomy's management capability.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return bool
	 */
	public static function rest_can_manage_terms( WP_REST_Request $request ) {
		$object = get_taxonomy( (string) $request['taxonomy'] );
		return $object && current_user_can( $object->cap->manage_terms );
	}

	/**
	 * Reading or editing a video's terms needs permission to edit that attachment.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return bool|WP_Error
	 */
	public static function rest_can_edit_video( WP_REST_Request $request ) {
		$id = Channel::attachment_id( (string) $request['guid'] );
		if ( ! $id ) {
			return new WP_Error( 'videopress_classification_not_found', __( 'This video does not belong to this site.', 'jetpack-videopress-pkg' ), array( 'status' => 404 ) );
		}
		return current_user_can( 'edit_post', $id );
	}

	/**
	 * GET /classification: every vocabulary with its terms.
	 *
	 * @return \WP_REST_Response
	 */
	public static function rest_get_vocabularies() {
		$vocabularies = array();
		foreach ( self::taxonomies() as $taxonomy => $shape ) {
			$vocabularies[] = array(
				'taxonomy'     => $taxonomy,
				'label'        => $shape['label'],
				'singular'     => $shape['singular'],
				'hierarchical' => $shape['hierarchical'],
				'canManage'    => current_user_can( get_taxonomy( $taxonomy )->cap->manage_terms ),
				'terms'        => self::all_terms( $taxonomy ),
			);
		}
		return rest_ensure_response( $vocabularies );
	}

	/**
	 * GET /classification/{taxonomy}.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function rest_get_terms( WP_REST_Request $request ) {
		return rest_ensure_response( self::all_terms( (string) $request['taxonomy'] ) );
	}

	/**
	 * Every term of a taxonomy, by name.
	 *
	 * @param string $taxonomy Taxonomy slug.
	 * @return array[]
	 */
	private static function all_terms( $taxonomy ) {
		$terms = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
				'orderby'    => 'name',
			)
		);
		return array_map( array( __CLASS__, 'term_data' ), is_array( $terms ) ? $terms : array() );
	}

	/**
	 * Check a parent term for a hierarchical taxonomy.
	 *
	 * @param string $taxonomy Taxonomy slug.
	 * @param mixed  $parent   Parent term ID.
	 * @param int    $term_id  The term being edited, if any.
	 * @return int|WP_Error
	 */
	private static function parent_id( $taxonomy, $parent, $term_id = 0 ) {
		$parent = (int) $parent;
		if ( ! $parent ) {
			return 0;
		}
		if ( ! is_taxonomy_hierarchical( $taxonomy ) ) {
			return new WP_Error( 'videopress_classification_invalid', __( 'This classification has no parent terms.', 'jetpack-videopress-pkg' ), array( 'status' => 400 ) );
		}
		if ( ! get_term( $parent, $taxonomy ) instanceof WP_Term || ( $term_id && ( $parent === $term_id || in_array( $parent, get_term_children( $term_id, $taxonomy ), true ) ) ) ) {
			return new WP_Error( 'videopress_classification_invalid', __( 'Invalid parent term.', 'jetpack-videopress-pkg' ), array( 'status' => 400 ) );
		}
		return $parent;
	}

	/**
	 * POST /classification/{taxonomy}: create a term.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function rest_create_term( WP_REST_Request $request ) {
		$taxonomy = (string) $request['taxonomy'];
		$parent   = self::parent_id( $taxonomy, $request['parent'] );
		if ( is_wp_error( $parent ) ) {
			return $parent;
		}
		$name = trim( (string) $request['name'] );
		if ( '' === $name ) {
			return new WP_Error( 'videopress_classification_invalid', __( 'A name is required.', 'jetpack-videopress-pkg' ), array( 'status' => 400 ) );
		}
		$result = wp_insert_term( $name, $taxonomy, array( 'parent' => $parent ) );
		if ( is_wp_error( $result ) ) {
			$result->add_data( array( 'status' => 'term_exists' === $result->get_error_code() ? 409 : 400 ) );
			return $result;
		}
		$response = rest_ensure_response( self::term_data( get_term( $result['term_id'], $taxonomy ) ) );
		$response->set_status( 201 );
		return $response;
	}

	/**
	 * POST /classification/{taxonomy}/{id}: rename or move a term.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function rest_update_term( WP_REST_Request $request ) {
		$taxonomy = (string) $request['taxonomy'];
		$term     = get_term( (int) $request['id'], $taxonomy );
		if ( ! $term instanceof WP_Term ) {
			return new WP_Error( 'videopress_classification_not_found', __( 'Term not found.', 'jetpack-videopress-pkg' ), array( 'status' => 404 ) );
		}
		$args = array();
		if ( null !== $request['name'] ) {
			$name = trim( (string) $request['name'] );
			if ( '' === $name ) {
				return new WP_Error( 'videopress_classification_invalid', __( 'A name is required.', 'jetpack-videopress-pkg' ), array( 'status' => 400 ) );
			}
			$args['name'] = $name;
		}
		if ( null !== $request['parent'] ) {
			$parent = self::parent_id( $taxonomy, $request['parent'], (int) $term->term_id );
			if ( is_wp_error( $parent ) ) {
				return $parent;
			}
			$args['parent'] = $parent;
		}
		$result = $args ? wp_update_term( $term->term_id, $taxonomy, $args ) : array( 'term_id' => $term->term_id );
		if ( is_wp_error( $result ) ) {
			$result->add_data( array( 'status' => 400 ) );
			return $result;
		}
		return rest_ensure_response( self::term_data( get_term( $result['term_id'], $taxonomy ) ) );
	}

	/**
	 * DELETE /classification/{taxonomy}/{id}.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function rest_delete_term( WP_REST_Request $request ) {
		$taxonomy = (string) $request['taxonomy'];
		$term     = get_term( (int) $request['id'], $taxonomy );
		if ( ! $term instanceof WP_Term ) {
			return new WP_Error( 'videopress_classification_not_found', __( 'Term not found.', 'jetpack-videopress-pkg' ), array( 'status' => 404 ) );
		}
		$result = wp_delete_term( $term->term_id, $taxonomy );
		if ( is_wp_error( $result ) || ! $result ) {
			return new WP_Error( 'videopress_classification_delete_failed', __( 'The term could not be deleted.', 'jetpack-videopress-pkg' ), array( 'status' => 500 ) );
		}
		return rest_ensure_response(
			array(
				'deleted' => true,
				'id'      => (int) $term->term_id,
			)
		);
	}

	/**
	 * GET /videos/{guid}/classification.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function rest_get_video( WP_REST_Request $request ) {
		$id = Channel::attachment_id( (string) $request['guid'] );
		return rest_ensure_response(
			array(
				'guid'    => (string) $request['guid'],
				'terms'   => self::assignments( $id ),
				'version' => self::version( $id ),
			)
		);
	}

	/**
	 * POST /videos/{guid}/classification: replace assignments atomically.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function rest_update_video( WP_REST_Request $request ) {
		$id      = Channel::attachment_id( (string) $request['guid'] );
		$version = $request->has_param( 'version' ) ? (int) $request['version'] : null;
		$result  = self::set_assignments( $id, $request['terms'], $version );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		return rest_ensure_response( array( 'guid' => (string) $request['guid'] ) + $result );
	}
}
