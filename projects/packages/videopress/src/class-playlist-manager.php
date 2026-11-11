<?php
/**
 * Playlist management for the VideoPress dashboard.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_Post;
use WP_Query;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Lists, creates, edits and deletes the site's playlists.
 *
 * A playlist is a Video Playlist block in a post, so every change rewrites
 * that block in its post: Playlist_Index picks published changes up from the
 * post save. Playlists in unpublished posts ( drafts, pending, scheduled,
 * private ) aren't indexed; they are read straight from their posts so the
 * dashboard can list the ones it creates before they go live.
 */
class Playlist_Manager {

	/**
	 * Route base under Rest_Controller::REST_NAMESPACE.
	 *
	 * @var string
	 */
	const ROUTE = '/playlists';

	/**
	 * Accepted playlist keys, as sanitize_key() leaves them.
	 *
	 * @var string
	 */
	const KEY_PATTERN = '[a-z0-9_\-]+';

	/**
	 * Fields the list can be sorted by.
	 *
	 * @var string[]
	 */
	const ORDERBY = array( 'updated', 'title', 'videos' );

	/**
	 * Post statuses a listed playlist can have, `publish` first.
	 *
	 * @var string[]
	 */
	const STATUSES = array( 'publish', 'future', 'draft', 'pending', 'private' );

	/**
	 * Statuses a playlist can be switched to from the dashboard.
	 *
	 * @var string[]
	 */
	const SETTABLE_STATUSES = array( 'publish', 'draft' );

	/**
	 * Post types a new playlist can be created in.
	 *
	 * @var string[]
	 */
	const CREATABLE_POST_TYPES = array( 'page', 'post' );

	/**
	 * Most unpublished posts read per request.
	 *
	 * @var int
	 */
	const UNPUBLISHED_LIMIT = 200;

	/**
	 * The block's display and playback attributes the dashboard edits, as
	 * block.json declares them ( Playlist_Manager_Test keeps the two in step ).
	 *
	 * @var array[]
	 */
	const SETTINGS = array(
		'showPlaylistTitle'    => array(
			'type'    => 'boolean',
			'default' => true,
		),
		'layout'               => array(
			'type'    => 'string',
			'enum'    => array( 'side-rail', 'grid', 'strip' ),
			'default' => 'side-rail',
		),
		'darkPlayer'           => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'showPlayer'           => array(
			'type'    => 'boolean',
			'default' => true,
		),
		'entryClickAction'     => array(
			'type'    => 'string',
			'enum'    => array( 'new-tab', 'show-player' ),
			'default' => 'new-tab',
		),
		'autoplayNext'         => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'muteByDefault'        => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'loopPlaylist'         => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'showThumbnail'        => array(
			'type'    => 'boolean',
			'default' => true,
		),
		'showTitle'            => array(
			'type'    => 'boolean',
			'default' => true,
		),
		'showResolution'       => array(
			'type'    => 'boolean',
			'default' => true,
		),
		'showDuration'         => array(
			'type'    => 'boolean',
			'default' => true,
		),
		'showPositionNumber'   => array(
			'type'    => 'boolean',
			'default' => false,
		),
		'showTotalRuntime'     => array(
			'type'    => 'boolean',
			'default' => true,
		),
		'entryTitleFontFamily' => array(
			'type'    => 'string',
			'default' => '',
		),
	);

	/**
	 * Register the playlist routes.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		register_rest_route(
			Rest_Controller::REST_NAMESPACE,
			self::ROUTE,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'rest_list_playlists' ),
					'permission_callback' => array( Rest_Controller::class, 'permissions_callback' ),
					'args'                => array(
						'page'     => array(
							'type'    => 'integer',
							'default' => 1,
							'minimum' => 1,
						),
						'per_page' => array(
							'type'    => 'integer',
							'default' => 12,
							'minimum' => 1,
							'maximum' => 100,
						),
						'search'   => array(
							'type'    => 'string',
							'default' => '',
						),
						'orderby'  => array(
							'type'    => 'string',
							'default' => 'updated',
							'enum'    => self::ORDERBY,
						),
						'order'    => array(
							'type'    => 'string',
							'default' => 'desc',
							'enum'    => array( 'asc', 'desc' ),
						),
						'status'   => array(
							'type'    => 'array',
							'items'   => array(
								'type' => 'string',
								'enum' => self::STATUSES,
							),
							'default' => array(),
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'rest_create_playlist' ),
					'permission_callback' => array( Rest_Controller::class, 'permissions_callback' ),
					'args'                => array_merge(
						self::playlist_args(),
						array(
							'postType' => array(
								'type'    => 'string',
								'enum'    => self::CREATABLE_POST_TYPES,
								'default' => 'page',
							),
							'status'   => array(
								'type'    => 'string',
								'enum'    => self::SETTABLE_STATUSES,
								'default' => 'draft',
							),
						)
					),
				),
			)
		);

		register_rest_route(
			Rest_Controller::REST_NAMESPACE,
			self::ROUTE . '/(?P<key>' . self::KEY_PATTERN . ')',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'rest_get_playlist' ),
					'permission_callback' => array( Rest_Controller::class, 'permissions_callback' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'rest_update_playlist' ),
					'permission_callback' => array( __CLASS__, 'edit_permissions_callback' ),
					'args'                => array_merge(
						self::playlist_args(),
						array(
							'status' => array(
								'type' => 'string',
								'enum' => self::SETTABLE_STATUSES,
							),
						)
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'rest_delete_playlist' ),
					'permission_callback' => array( __CLASS__, 'edit_permissions_callback' ),
				),
			)
		);
	}

	/**
	 * Arguments shared by the create and update routes.
	 *
	 * @return array
	 */
	private static function playlist_args() {
		$settings = array();
		foreach ( self::SETTINGS as $name => $schema ) {
			unset( $schema['default'] );
			$settings[ $name ] = $schema;
		}

		return array(
			'title'       => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'description' => array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_textarea_field',
			),
			'videos'      => array(
				'type'  => 'array',
				'items' => array(
					'type'       => 'object',
					'properties' => array(
						'guid'       => array(
							'type'     => 'string',
							'pattern'  => '^[a-zA-Z0-9]{8}$',
							'required' => true,
						),
						'durationMs' => array(
							'type'    => 'integer',
							'minimum' => 0,
						),
						'height'     => array(
							'type'    => 'integer',
							'minimum' => 0,
						),
					),
				),
			),
			'settings'    => array(
				'type'                 => 'object',
				'properties'           => $settings,
				'additionalProperties' => false,
			),
		);
	}

	/**
	 * Changing a playlist needs the dashboard capability and the right to edit its post.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return bool
	 */
	public static function edit_permissions_callback( WP_REST_Request $request ) {
		if ( ! Rest_Controller::permissions_callback() ) {
			return false;
		}

		$record = self::find_record( (string) $request['key'] );

		// Unknown keys fall through to the callback, which answers 404.
		return null === $record || current_user_can( 'edit_post', $record['post_id'] );
	}

	/**
	 * Kept for callers of the first version of the routes.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return bool
	 */
	public static function update_permissions_callback( WP_REST_Request $request ) {
		return self::edit_permissions_callback( $request );
	}

	/**
	 * List the site's playlists, a page at a time.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return WP_REST_Response
	 */
	public static function rest_list_playlists( WP_REST_Request $request ) {
		$result = self::query(
			array(
				'page'     => (int) $request['page'],
				'per_page' => (int) $request['per_page'],
				'search'   => (string) $request['search'],
				'orderby'  => (string) $request['orderby'],
				'order'    => (string) $request['order'],
				'status'   => (array) $request['status'],
			)
		);

		$response = rest_ensure_response( array_map( array( __CLASS__, 'prepare_item' ), $result['items'] ) );
		$response->header( 'X-WP-Total', (string) $result['total'] );
		$response->header( 'X-WP-TotalPages', (string) $result['total_pages'] );

		return $response;
	}

	/**
	 * Get one playlist.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function rest_get_playlist( WP_REST_Request $request ) {
		$record = self::find_record( (string) $request['key'] );
		if ( ! $record ) {
			return self::not_found();
		}

		return rest_ensure_response( self::prepare_item( $record ) );
	}

	/**
	 * Create a playlist in a new post.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function rest_create_playlist( WP_REST_Request $request ) {
		$record = self::create(
			array_merge(
				self::changes_from_request( $request ),
				array(
					'post_type' => (string) $request['postType'],
					'status'    => (string) $request['status'],
				)
			)
		);
		if ( is_wp_error( $record ) ) {
			return $record;
		}

		$response = rest_ensure_response( self::prepare_item( $record ) );
		$response->set_status( 201 );

		return $response;
	}

	/**
	 * Update a playlist's details, videos, settings or post status.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function rest_update_playlist( WP_REST_Request $request ) {
		$changes = self::changes_from_request( $request );
		if ( $request->has_param( 'status' ) ) {
			$changes['status'] = (string) $request->get_param( 'status' );
		}

		$record = self::update( (string) $request['key'], $changes );
		if ( is_wp_error( $record ) ) {
			return $record;
		}

		return rest_ensure_response( self::prepare_item( $record ) );
	}

	/**
	 * Delete a playlist.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function rest_delete_playlist( WP_REST_Request $request ) {
		$result = self::delete( (string) $request['key'] );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( $result );
	}

	/**
	 * The playlist changes a request carries.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return array Any of `title`, `description`, `videos` and `settings`.
	 */
	private static function changes_from_request( WP_REST_Request $request ) {
		$changes = array();
		foreach ( array( 'title', 'description', 'videos', 'settings' ) as $field ) {
			if ( $request->has_param( $field ) ) {
				$changes[ $field ] = $request->get_param( $field );
			}
		}

		return $changes;
	}

	/**
	 * Filter, sort and paginate the playlists.
	 *
	 * @param array $args {
	 *     Query arguments.
	 *
	 *     @type int      $page     1-based page.
	 *     @type int      $per_page Playlists per page.
	 *     @type string   $search   Text matched against titles and descriptions.
	 *     @type string   $orderby  One of ORDERBY.
	 *     @type string   $order    `asc` or `desc`.
	 *     @type string[] $status   Post statuses to keep; empty keeps all.
	 * }
	 * @return array{items: array[], total: int, total_pages: int}
	 */
	public static function query( array $args ) {
		$page     = max( 1, (int) ( $args['page'] ?? 1 ) );
		$per_page = max( 1, (int) ( $args['per_page'] ?? 12 ) );
		$search   = trim( (string) ( $args['search'] ?? '' ) );
		$orderby  = in_array( $args['orderby'] ?? '', self::ORDERBY, true ) ? $args['orderby'] : 'updated';
		$order    = 'asc' === ( $args['order'] ?? 'desc' ) ? 'asc' : 'desc';
		$statuses = array_values( array_intersect( (array) ( $args['status'] ?? array() ), self::STATUSES ) );

		$playlists = array_values( self::records() );

		if ( $statuses ) {
			$playlists = array_values(
				array_filter(
					$playlists,
					function ( $playlist ) use ( $statuses ) {
						return in_array( $playlist['status'], $statuses, true );
					}
				)
			);
		}

		if ( '' !== $search ) {
			$playlists = array_values(
				array_filter(
					$playlists,
					function ( $playlist ) use ( $search ) {
						return false !== stripos( $playlist['title'], $search )
							|| false !== stripos( $playlist['description'], $search );
					}
				)
			);
		}

		usort(
			$playlists,
			function ( $a, $b ) use ( $orderby, $order ) {
				switch ( $orderby ) {
					case 'title':
						$cmp = strcasecmp( $a['title'], $b['title'] );
						break;
					case 'videos':
						$cmp = count( $a['videos'] ) - count( $b['videos'] );
						break;
					default:
						$cmp = $a['updated'] - $b['updated'];
				}
				if ( 0 === $cmp ) {
					return strcmp( $a['key'], $b['key'] );
				}
				return 'asc' === $order ? $cmp : -$cmp;
			}
		);

		$total = count( $playlists );

		return array(
			'items'       => array_slice( $playlists, ( $page - 1 ) * $per_page, $per_page ),
			'total'       => $total,
			'total_pages' => (int) ceil( $total / $per_page ),
		);
	}

	/**
	 * Create a playlist: a new post holding one Video Playlist block.
	 *
	 * @param array $args Any of `title`, `description`, `videos` and `settings`,
	 *                    plus the new post's `post_type` and `status`.
	 * @return array|WP_Error The new record.
	 */
	public static function create( array $args ) {
		$post_type = in_array( $args['post_type'] ?? '', self::CREATABLE_POST_TYPES, true ) ? $args['post_type'] : 'page';
		$status    = in_array( $args['status'] ?? '', self::SETTABLE_STATUSES, true ) ? $args['status'] : 'draft';
		$type      = get_post_type_object( $post_type );

		if ( ! $type || ! current_user_can( $type->cap->create_posts ) ) {
			return new WP_Error(
				'videopress_playlist_cannot_create',
				__( 'You aren’t allowed to create playlists.', 'jetpack-videopress-pkg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		if ( 'publish' === $status && ! current_user_can( $type->cap->publish_posts ) ) {
			return self::cannot_publish();
		}

		$title = isset( $args['title'] ) && is_string( $args['title'] ) ? $args['title'] : '';
		$block = self::apply_changes(
			array(
				'blockName'    => Playlist_Index::BLOCK_NAME,
				'attrs'        => array( 'playlistId' => wp_generate_uuid4() ),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			),
			array_merge(
				array( 'title' => $title ),
				array_intersect_key( $args, array_flip( array( 'description', 'videos', 'settings' ) ) )
			)
		);

		$post_id = wp_insert_post(
			wp_slash(
				array(
					'post_type'    => $post_type,
					'post_status'  => $status,
					'post_title'   => '' !== $title ? $title : __( 'Untitled playlist', 'jetpack-videopress-pkg' ),
					'post_content' => serialize_block( $block ),
				)
			),
			true
		);
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		$record = self::record_for_block( $post_id, array( 0 ) );

		return $record ? $record : self::not_found();
	}

	/**
	 * Rewrite a playlist's block in its post, and optionally its post's status.
	 *
	 * @param string $key     Playlist key.
	 * @param array  $changes Any of `title`, `description`, `videos`, `settings` and `status`.
	 * @return array|WP_Error The updated record.
	 */
	public static function update( $key, array $changes ) {
		$target = self::locate( $key );
		if ( is_wp_error( $target ) ) {
			return $target;
		}
		list( $post, $blocks, $path ) = $target;

		if ( isset( $changes['videos'] ) && Series_Playlist_Adapter::is_series_block( self::block_at( $blocks, $path )['attrs'] ?? array() ) ) {
			return new WP_Error(
				'videopress_playlist_series_videos',
				__( 'This playlist shows a series. Add videos to the series instead.', 'jetpack-videopress-pkg' ),
				array( 'status' => 400 )
			);
		}

		$postarr = array(
			'ID'           => $post->ID,
			'post_content' => serialize_blocks( self::change_block_at( $blocks, $path, $changes ) ),
		);

		// A post named after its playlist, as the ones the dashboard creates are, follows a rename.
		$old_title = self::block_at( $blocks, $path )['attrs']['playlistTitle'] ?? '';
		if ( isset( $changes['title'] ) && is_string( $changes['title'] ) && '' !== trim( $changes['title'] )
			&& $changes['title'] !== $old_title && $post->post_title === $old_title ) {
			$postarr['post_title'] = $changes['title'];
		}

		$status = $changes['status'] ?? null;
		if ( is_string( $status ) && in_array( $status, self::SETTABLE_STATUSES, true ) && $status !== $post->post_status ) {
			$type = get_post_type_object( $post->post_type );
			if ( 'publish' === $status && ( ! $type || ! current_user_can( $type->cap->publish_posts ) ) ) {
				return self::cannot_publish();
			}
			$postarr['post_status'] = $status;
		}

		$updated = wp_update_post( wp_slash( $postarr ), true );
		if ( is_wp_error( $updated ) ) {
			return $updated;
		}

		$saved = self::record_for_block( $post->ID, $path );

		return $saved ? $saved : self::not_found();
	}

	/**
	 * Delete a playlist: remove its block, and trash the post when nothing else is left in it.
	 *
	 * @param string $key Playlist key.
	 * @return array|WP_Error `deleted`, whether the post went to the trash, and the playlist as it was.
	 */
	public static function delete( $key ) {
		$record = self::find_record( $key );
		$target = self::locate( $key );
		if ( ! $record || is_wp_error( $target ) ) {
			return $record ? $target : self::not_found();
		}
		list( $post, $blocks, $path ) = $target;

		$previous = self::prepare_item( $record );
		$content  = serialize_blocks( self::remove_block_at( $blocks, $path ) );

		if ( '' === trim( $content ) ) {
			if ( ! current_user_can( 'delete_post', $post->ID ) ) {
				return new WP_Error(
					'videopress_playlist_cannot_delete',
					__( 'You aren’t allowed to delete the post this playlist is in.', 'jetpack-videopress-pkg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
			if ( ! wp_trash_post( $post->ID ) ) {
				return new WP_Error(
					'videopress_playlist_delete_failed',
					__( 'The playlist could not be deleted.', 'jetpack-videopress-pkg' ),
					array( 'status' => 500 )
				);
			}

			return array(
				'deleted'     => true,
				'postTrashed' => true,
				'previous'    => $previous,
			);
		}

		$updated = wp_update_post(
			wp_slash(
				array(
					'ID'           => $post->ID,
					'post_content' => $content,
				)
			),
			true
		);
		if ( is_wp_error( $updated ) ) {
			return $updated;
		}

		return array(
			'deleted'     => true,
			'postTrashed' => false,
			'previous'    => $previous,
		);
	}

	/**
	 * Find a playlist's post, its parsed blocks and the path to its block.
	 *
	 * @param string $key Playlist key.
	 * @return array|WP_Error [ WP_Post, blocks, path ].
	 */
	private static function locate( $key ) {
		$record = self::find_record( $key );
		if ( ! $record ) {
			return self::not_found();
		}

		$post = get_post( $record['post_id'] );
		if ( ! $post instanceof WP_Post ) {
			return self::not_found();
		}

		if ( ! function_exists( 'wp_check_post_lock' ) ) {
			require_once ABSPATH . 'wp-admin/includes/post.php';
		}
		if ( wp_check_post_lock( $post->ID ) ) {
			return new WP_Error(
				'videopress_playlist_post_locked',
				__( 'Someone is editing the post this playlist is in. Try again once they are done.', 'jetpack-videopress-pkg' ),
				array( 'status' => 409 )
			);
		}

		$blocks = parse_blocks( $post->post_content );
		$path   = self::find_block_path( $blocks, $record['key'], $post->ID );
		if ( null === $path ) {
			return self::not_found();
		}

		return array( $post, $blocks, $path );
	}

	/**
	 * Apply playlist changes to the block a path leads to.
	 *
	 * @param array $blocks  Parsed blocks.
	 * @param int[] $path    Indexes leading to the block through `innerBlocks`.
	 * @param array $changes Any of `title`, `description`, `videos` and `settings`.
	 * @return array The blocks, with that one changed.
	 */
	private static function change_block_at( array $blocks, array $path, array $changes ) {
		$index = array_shift( $path );

		if ( $path ) {
			$blocks[ $index ]['innerBlocks'] = self::change_block_at( $blocks[ $index ]['innerBlocks'], $path, $changes );
		} else {
			$blocks[ $index ] = self::apply_changes( $blocks[ $index ], $changes );
		}

		return $blocks;
	}

	/**
	 * Remove the block a path leads to, with its slot in the parent's inner content.
	 *
	 * @param array $blocks Parsed blocks.
	 * @param int[] $path   Indexes leading to the block through `innerBlocks`.
	 * @return array The blocks without that one.
	 */
	private static function remove_block_at( array $blocks, array $path ) {
		$index = array_shift( $path );

		if ( $path ) {
			$parent      = $blocks[ $index ];
			$child_index = $path[0];
			if ( 1 === count( $path ) ) {
				$parent['innerContent'] = self::without_inner_slot( $parent['innerContent'] ?? array(), $child_index );
			}
			$parent['innerBlocks'] = self::remove_block_at( $parent['innerBlocks'], $path );
			$blocks[ $index ]      = $parent;

			return $blocks;
		}

		array_splice( $blocks, $index, 1 );

		// Drop the whitespace that separated the block from its neighbour, so no blank gap is left.
		foreach ( array( $index - 1, $index ) as $neighbour ) {
			if ( isset( $blocks[ $neighbour ] ) && self::is_whitespace_block( $blocks[ $neighbour ] ) ) {
				array_splice( $blocks, $neighbour, 1 );
				break;
			}
		}

		return array_values( $blocks );
	}

	/**
	 * Whether a parsed block is the whitespace parse_blocks() keeps between blocks.
	 *
	 * @param array $block Parsed block.
	 * @return bool
	 */
	private static function is_whitespace_block( array $block ) {
		return null === ( $block['blockName'] ?? null ) && '' === trim( (string) ( $block['innerHTML'] ?? '' ) );
	}

	/**
	 * Drop the n-th inner block placeholder from a block's inner content.
	 *
	 * @param array $inner_content Inner content: strings and null placeholders.
	 * @param int   $n             Index of the inner block.
	 * @return array
	 */
	private static function without_inner_slot( array $inner_content, $n ) {
		$seen = -1;
		foreach ( $inner_content as $i => $chunk ) {
			if ( null === $chunk && ++$seen === $n ) {
				array_splice( $inner_content, $i, 1 );
				break;
			}
		}

		return $inner_content;
	}

	/**
	 * Apply playlist changes to a parsed Video Playlist block.
	 *
	 * The heading inner block mirrors the title, so it is kept in step with
	 * `playlistTitle` and `showPlaylistTitle` the way the block editor does.
	 *
	 * @param array $block   Parsed block.
	 * @param array $changes Any of `title`, `description`, `videos` and `settings`.
	 * @return array The block with the changes applied.
	 */
	public static function apply_changes( array $block, array $changes ) {
		$attrs = isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();

		if ( isset( $changes['title'] ) && is_string( $changes['title'] ) ) {
			$attrs['playlistTitle'] = $changes['title'];
		}

		if ( isset( $changes['description'] ) && is_string( $changes['description'] ) ) {
			$attrs['playlistDescription'] = $changes['description'];
		}

		if ( isset( $changes['videos'] ) && is_array( $changes['videos'] ) ) {
			// Stored the way the block editor stores them: unknown metadata is left out.
			$attrs['videos'] = array_map(
				function ( $entry ) {
					return array_filter(
						array(
							'guid'       => $entry['guid'],
							'durationMs' => $entry['durationMs'],
							'height'     => $entry['height'],
						)
					);
				},
				Initializer::sanitize_playlist_entries( $changes['videos'] )
			);
		}

		if ( isset( $changes['settings'] ) && is_array( $changes['settings'] ) ) {
			foreach ( self::sanitize_settings( $changes['settings'] ) as $name => $value ) {
				// The block editor leaves defaults out of the markup; so does this.
				if ( self::SETTINGS[ $name ]['default'] === $value ) {
					unset( $attrs[ $name ] );
				} else {
					$attrs[ $name ] = $value;
				}
			}
		}

		$block['attrs'] = $attrs;

		return self::sync_heading( $block );
	}

	/**
	 * Keep only known settings with valid values.
	 *
	 * @param array $settings Raw settings.
	 * @return array
	 */
	public static function sanitize_settings( array $settings ) {
		$clean = array();

		foreach ( self::SETTINGS as $name => $schema ) {
			if ( ! array_key_exists( $name, $settings ) ) {
				continue;
			}
			$value = $settings[ $name ];

			if ( 'boolean' === $schema['type'] ) {
				if ( is_bool( $value ) ) {
					$clean[ $name ] = $value;
				}
				continue;
			}

			if ( ! is_string( $value ) ) {
				continue;
			}
			if ( isset( $schema['enum'] ) ) {
				if ( in_array( $value, $schema['enum'], true ) ) {
					$clean[ $name ] = $value;
				}
				continue;
			}
			// The only free-form setting is a font-family preset slug.
			$clean[ $name ] = sanitize_key( $value );
		}

		return $clean;
	}

	/**
	 * A playlist block's settings, defaults filled in.
	 *
	 * @param array $attrs Block attributes.
	 * @return array
	 */
	public static function settings_from_attrs( array $attrs ) {
		$settings = array();
		foreach ( self::SETTINGS as $name => $schema ) {
			$settings[ $name ] = $schema['default'];
		}

		return array_merge( $settings, self::sanitize_settings( $attrs ) );
	}

	/**
	 * Keep the heading inner block in step with the title, as the block editor's template does:
	 * a level-2 heading holding the title while `showPlaylistTitle` is on, none otherwise.
	 *
	 * @param array $block Parsed Video Playlist block.
	 * @return array
	 */
	private static function sync_heading( array $block ) {
		$attrs    = $block['attrs'];
		$show     = ! isset( $attrs['showPlaylistTitle'] ) || false !== $attrs['showPlaylistTitle'];
		$title    = isset( $attrs['playlistTitle'] ) && is_string( $attrs['playlistTitle'] ) ? $attrs['playlistTitle'] : '';
		$existing = $block['innerBlocks'][0] ?? null;

		if ( ! $show ) {
			$block['innerBlocks']  = array();
			$block['innerHTML']    = '';
			$block['innerContent'] = array();

			return $block;
		}

		if ( is_array( $existing ) && 'core/heading' === ( $existing['blockName'] ?? null ) ) {
			if ( self::heading_text( $existing ) !== $title ) {
				$block['innerBlocks'][0] = self::with_heading_text( $existing, $title );
			}

			return $block;
		}

		$html                  = '<h2 class="wp-block-heading">' . esc_html( $title ) . '</h2>';
		$block['innerBlocks']  = array(
			array(
				'blockName'    => 'core/heading',
				'attrs'        => array(),
				'innerBlocks'  => array(),
				'innerHTML'    => $html,
				'innerContent' => array( $html ),
			),
		);
		$block['innerHTML']    = "\n\n";
		$block['innerContent'] = array( "\n", null, "\n" );

		return $block;
	}

	/**
	 * The plain text of a parsed core/heading block.
	 *
	 * @param array $heading Parsed heading block.
	 * @return string
	 */
	private static function heading_text( array $heading ) {
		return html_entity_decode( wp_strip_all_tags( (string) ( $heading['innerHTML'] ?? '' ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	}

	/**
	 * Replace the text of a parsed core/heading block.
	 *
	 * @param array  $heading Parsed heading block.
	 * @param string $text    New plain-text heading.
	 * @return array
	 */
	private static function with_heading_text( array $heading, $text ) {
		$replace = function ( $html ) use ( $text ) {
			return is_string( $html )
				? preg_replace_callback(
					'/^(\s*<h[1-6]\b[^>]*>).*(<\/h[1-6]>\s*)$/s',
					function ( $matches ) use ( $text ) {
						return $matches[1] . esc_html( $text ) . $matches[2];
					},
					$html
				)
				: $html;
		};

		$heading['innerHTML']    = $replace( $heading['innerHTML'] ?? '' );
		$heading['innerContent'] = array_map( $replace, $heading['innerContent'] ?? array() );

		return $heading;
	}

	/**
	 * Locate the Video Playlist block a key names, mirroring how Playlist_Index keys them.
	 *
	 * @param array  $blocks  Parsed blocks of the post.
	 * @param string $key     Playlist key.
	 * @param int    $post_id Post the blocks belong to.
	 * @return int[]|null Indexes leading to the block through `innerBlocks`, or null.
	 */
	public static function find_block_path( array $blocks, $key, $post_id ) {
		$found = null;

		foreach ( self::playlist_block_paths( $blocks ) as $ordinal => $path ) {
			$own_key = self::block_key( self::block_at( $blocks, $path ), $post_id, $ordinal );

			// The index suffixes a key another post already owns with this post's id.
			// When a key repeats within the post, the index keeps the last block.
			if ( $own_key === $key || $own_key . '-' . $post_id === $key ) {
				$found = $path;
			}
		}

		return $found;
	}

	/**
	 * The block a path leads to.
	 *
	 * @param array $blocks Parsed blocks.
	 * @param int[] $path   Indexes leading to the block through `innerBlocks`.
	 * @return array
	 */
	private static function block_at( array $blocks, array $path ) {
		$block = $blocks[ $path[0] ];
		foreach ( array_slice( $path, 1 ) as $index ) {
			$block = $block['innerBlocks'][ $index ];
		}

		return $block;
	}

	/**
	 * A playlist block's key before collisions with other posts are resolved.
	 *
	 * @param array $block   Parsed block.
	 * @param int   $post_id Post the block belongs to.
	 * @param int   $ordinal 0-based position among the post's playlist blocks.
	 * @return string
	 */
	private static function block_key( array $block, $post_id, $ordinal ) {
		$key = isset( $block['attrs']['playlistId'] ) && is_string( $block['attrs']['playlistId'] )
			? sanitize_key( $block['attrs']['playlistId'] )
			: '';

		return '' !== $key ? $key : $post_id . '-' . ( $ordinal + 1 );
	}

	/**
	 * Paths to every Video Playlist block that is a playlist of its own ( see Playlist_Index::is_playlist() ), in document order.
	 *
	 * @param array $blocks Parsed blocks.
	 * @param int[] $prefix Path of the parent block.
	 * @return int[][]
	 */
	private static function playlist_block_paths( array $blocks, array $prefix = array() ) {
		$paths = array();

		foreach ( $blocks as $index => $block ) {
			$name = $block['blockName'] ?? null;
			if ( in_array( $name, Playlist_Index::DYNAMIC_PLAYLIST_BLOCKS, true ) ) {
				continue;
			}

			$path = array_merge( $prefix, array( $index ) );
			if ( Playlist_Index::BLOCK_NAME === $name && Playlist_Index::is_playlist( is_array( $block['attrs'] ?? null ) ? $block['attrs'] : array() ) ) {
				$paths[] = $path;
			}

			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
				$paths = array_merge( $paths, self::playlist_block_paths( $block['innerBlocks'], $path ) );
			}
		}

		return $paths;
	}

	/**
	 * Every playlist the dashboard lists, keyed by playlist key: the published
	 * ones from the index, then those in unpublished posts the user can edit.
	 *
	 * @return array[] Records as Channel::playlists() lists them, plus `status`.
	 */
	public static function records() {
		$records = array();
		foreach ( Channel::playlists() as $playlist ) {
			$playlist['status']          = 'publish';
			$records[ $playlist['key'] ] = $playlist;
		}

		foreach ( self::unpublished_posts() as $post ) {
			if ( ! current_user_can( 'edit_post', $post->ID ) ) {
				continue;
			}
			foreach ( Playlist_Index::extract_records( $post ) as $key => $record ) {
				$key = (string) $key;
				if ( isset( $records[ $key ] ) ) {
					$key .= '-' . $post->ID;
				}
				$records[ $key ] = array_merge(
					$record,
					array(
						'key'     => $key,
						'status'  => $post->post_status,
						'updated' => self::modified_time( $post ),
					)
				);
			}
		}

		return $records;
	}

	/**
	 * Unpublished posts that hold a Video Playlist block, most recently modified first.
	 *
	 * @return WP_Post[]
	 */
	private static function unpublished_posts() {
		$add_content_clause = function ( $where ) {
			global $wpdb;

			return $where . $wpdb->prepare(
				" AND {$wpdb->posts}.post_content LIKE %s",
				'%' . $wpdb->esc_like( '<!-- wp:' . Playlist_Index::BLOCK_NAME ) . '%'
			);
		};

		add_filter( 'posts_where', $add_content_clause );
		$query = new WP_Query(
			array(
				'post_type'              => self::post_types(),
				'post_status'            => array_values( array_diff( self::STATUSES, array( 'publish' ) ) ),
				'posts_per_page'         => self::UNPUBLISHED_LIMIT,
				'orderby'                => 'modified',
				'order'                  => 'DESC',
				'no_found_rows'          => true,
				'ignore_sticky_posts'    => true,
				'suppress_filters'       => false,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);
		remove_filter( 'posts_where', $add_content_clause );

		return array_values(
			array_filter(
				$query->posts,
				function ( $post ) {
					return $post instanceof WP_Post;
				}
			)
		);
	}

	/**
	 * Post types that hold playlists, as Playlist_Index indexes them.
	 *
	 * @return string[]
	 */
	private static function post_types() {
		return array_values(
			array_filter(
				get_post_types( array( 'public' => true ) ),
				function ( $post_type ) {
					return 'attachment' !== $post_type;
				}
			)
		);
	}

	/**
	 * When a post was last modified, as a Unix timestamp.
	 *
	 * A draft that was never updated has no GMT modified time, so fall back to the local one.
	 *
	 * @param WP_Post $post Post.
	 * @return int
	 */
	private static function modified_time( WP_Post $post ) {
		if ( '0000-00-00 00:00:00' !== $post->post_modified_gmt ) {
			return (int) strtotime( $post->post_modified_gmt . ' UTC' );
		}

		return (int) strtotime( get_gmt_from_date( $post->post_modified ) . ' UTC' );
	}

	/**
	 * Look a playlist up by key.
	 *
	 * @param string $key Playlist key.
	 * @return array|null
	 */
	public static function find_record( $key ) {
		$records = self::records();

		return $records[ $key ] ?? null;
	}

	/**
	 * The record of the playlist block at a path in a post, whatever its key turned out to be.
	 *
	 * @param int   $post_id Post id.
	 * @param int[] $path    Indexes leading to the block through `innerBlocks`.
	 * @return array|null
	 */
	private static function record_for_block( $post_id, array $path ) {
		$post = get_post( $post_id );
		if ( ! $post instanceof WP_Post ) {
			return null;
		}
		$blocks = parse_blocks( $post->post_content );

		foreach ( self::records() as $record ) {
			if ( (int) $record['post_id'] === (int) $post_id && self::find_block_path( $blocks, $record['key'], $post_id ) === $path ) {
				return $record;
			}
		}

		return null;
	}

	/**
	 * The attributes of a record's block, read from its post.
	 *
	 * @param array $record Playlist record.
	 * @return array
	 */
	private static function block_attrs( array $record ) {
		$post = get_post( $record['post_id'] );
		if ( ! $post instanceof WP_Post ) {
			return array();
		}

		$blocks = parse_blocks( $post->post_content );
		$path   = self::find_block_path( $blocks, $record['key'], $post->ID );
		if ( null === $path ) {
			return array();
		}
		$attrs = self::block_at( $blocks, $path )['attrs'] ?? array();

		return is_array( $attrs ) ? $attrs : array();
	}

	/**
	 * Shape a playlist record for the REST response.
	 *
	 * @param array $record Record as records() lists it.
	 * @return array
	 */
	public static function prepare_item( array $record ) {
		$post    = get_post( $record['post_id'] );
		$videos  = array_map(
			function ( $entry ) {
				return array(
					'guid'       => $entry['guid'],
					'durationMs' => $entry['durationMs'],
					'height'     => $entry['height'],
				);
			},
			$record['videos']
		);
		$is_post = $post instanceof WP_Post;
		$status  = $record['status'] ?? ( $is_post ? $post->post_status : 'publish' );
		$type    = $is_post ? get_post_type_object( $post->post_type ) : null;

		if ( 'publish' === $status ) {
			$url = Channel::is_enabled() ? Channel::playlist_url( $record['key'] ) : ( $is_post ? (string) get_permalink( $post ) : '' );
		} else {
			$url = $is_post ? (string) get_preview_post_link( $post ) : '';
		}

		return array(
			'key'         => $record['key'],
			'type'        => Series_Playlist_Adapter::is_series_record( $record ) ? Series_Playlist_Adapter::TYPE : 'own',
			'series'      => absint( $record['series'] ?? 0 ),
			'title'       => $record['title'],
			'description' => $record['description'],
			'videos'      => $videos,
			'videoCount'  => count( $videos ),
			'durationMs'  => array_sum( array_column( $videos, 'durationMs' ) ),
			'updated'     => gmdate( 'c', $record['updated'] ?? ( $is_post ? self::modified_time( $post ) : 0 ) ),
			'status'      => $status,
			'settings'    => self::settings_from_attrs( self::block_attrs( $record ) ),
			'post'        => array(
				'id'        => (int) $record['post_id'],
				'title'     => $is_post ? html_entity_decode( get_the_title( $post ), ENT_QUOTES, get_bloginfo( 'charset' ) ) : '',
				'type'      => $is_post ? $post->post_type : '',
				'typeLabel' => $type ? $type->labels->singular_name : '',
				'editUrl'   => $is_post ? (string) get_edit_post_link( $post, 'raw' ) : '',
			),
			'url'         => $url,
			'canEdit'     => $is_post && current_user_can( 'edit_post', $post->ID ),
			'canPublish'  => $type && current_user_can( $type->cap->publish_posts ),
		);
	}

	/**
	 * The error for publishing without the capability.
	 *
	 * @return WP_Error
	 */
	private static function cannot_publish() {
		return new WP_Error(
			'videopress_playlist_cannot_publish',
			__( 'You aren’t allowed to publish this playlist.', 'jetpack-videopress-pkg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * The not-found error shared by every playlist route.
	 *
	 * @return WP_Error
	 */
	private static function not_found() {
		return new WP_Error(
			'videopress_playlist_not_found',
			__( 'Playlist not found.', 'jetpack-videopress-pkg' ),
			array( 'status' => 404 )
		);
	}
}
