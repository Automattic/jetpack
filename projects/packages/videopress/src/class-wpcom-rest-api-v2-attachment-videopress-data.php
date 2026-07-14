<?php
/**
 * Extend the REST API functionality for VideoPress users.
 *
 * @package automattic/jetpack-videopress
 * @since-jetpack 7.1.0
 * @since 0.3.1
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use WP_Post;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Add per-attachment VideoPress data.
 *
 * { # Attachment Object
 *   ...
 *   jetpack_videopress: (object) VideoPress data
 *   ...
 * }
 *
 * @since 7.1.0
 *
 * @phan-constructor-used-for-side-effects
 */
class WPCOM_REST_API_V2_Attachment_VideoPress_Data {
	/**
	 * The REST Object Type to which the jetpack_videopress field will be added.
	 *
	 * @var string
	 */
	protected $object_type = 'attachment';

	/**
	 * The name of the REST API field to add.
	 *
	 * @var string $field_name
	 */
	protected $field_name = 'jetpack_videopress';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_fields' ) );

		// Registered unconditionally: on WPCOM the filter handles the
		// `videopress_only_videos` param (mime-based, see below); everywhere
		// else it handles the meta-query-backed VideoPress filters.
		add_action( 'rest_api_init', array( $this, 'add_jetpack_videopress_custom_query_filters' ) );

		// do this again later to collect any CPTs that get registered later.
		add_action( 'restapi_theme_init', array( $this, 'register_fields' ), 20 );
	}

	/**
	 * Registers the jetpack_videopress field and adds a filter to remove it for attachments that are not videos.
	 */
	public function register_fields() {
		global $wp_rest_additional_fields;

		if ( ! empty( $wp_rest_additional_fields[ $this->object_type ][ $this->field_name ] ) ) {
			return;
		}

		register_rest_field(
			$this->object_type,
			$this->field_name,
			array(
				'get_callback'    => array( $this, 'get' ),
				'update_callback' => null,
				'schema'          => $this->get_schema(),
			)
		);

		add_filter( 'rest_prepare_attachment', array( $this, 'remove_field_for_non_videos' ), 10, 2 );
	}

	/**
	 * Adds the custom query filters
	 */
	public function add_jetpack_videopress_custom_query_filters() {
		add_filter( 'rest_attachment_query', array( $this, 'filter_attachments_by_jetpack_videopress_fields' ), 999, 2 );
	}

	/**
	 * Filter request args to handle the custom VideoPress query filters
	 *
	 * Possible filters:
	 *
	 * `no_videopress`: the returned attachments should not be VideoPress videos
	 *                  (off-Simple: no videopress_guid meta; on Simple: not a
	 *                  member of wpcom's videos table)
	 * `videopress_has_guid`: (WPCOM only) restrict results to VideoPress videos
	 *                        (members of wpcom's videos table)
	 * `videopress_only_videos`: (WPCOM only) restrict results to video attachments
	 * `videopress_privacy_setting`: restrict by privacy (0/1/2, comma-separated);
	 *                               honored on Simple via the videos table too
	 *
	 * @param array           $args The original list of args before the filtering.
	 * @param WP_REST_Request $request The original request data.
	 */
	public function filter_attachments_by_jetpack_videopress_fields( $args, $request ) {

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return $this->filter_attachments_by_jetpack_videopress_fields_wpcom( $args, $request );
		}

		if ( ! isset( $args['meta_query'] ) || ! is_array( $args['meta_query'] ) ) {
			$args['meta_query'] = array();
		}

		/* To ignore all VideoPress videos, select only attachments without videopress_guid meta field */
		if ( isset( $request['no_videopress'] ) ) {
			$args['meta_query'][] = array(
				'key'     => 'videopress_guid',
				'compare' => 'NOT EXISTS',
			);
		}

		/*
		 * Hide local attachments that have already been uploaded to VideoPress.
		 * Such "zombie" locals carry a `_videopress_uploaded_id` meta pointing
		 * at their VideoPress sibling attachment; the sibling is the row the
		 * dashboard should surface.
		 */
		if ( isset( $request['videopress_hide_already_uploaded'] ) ) {
			$args['meta_query'][] = array(
				'key'     => Uploader::UPLOADED_KEY,
				'compare' => 'NOT EXISTS',
			);
		}

		/* Filter using privacy setting meta key */
		if ( isset( $request['videopress_privacy_setting'] ) ) {
			$videopress_privacy_setting = sanitize_text_field( $request['videopress_privacy_setting'] );

			/* Allows the filtering to happens using a list of privacy settings separated by comma */
			$videopress_privacy_setting_list = explode( ',', $videopress_privacy_setting );

			$site_default_is_private = Data::get_videopress_videos_private_for_site();

			if ( $site_default_is_private ) {
				/**
				 * If the search is looking for private videos and the site default is private,
				 * the site default setting should be included on the search.
				 */
				if ( in_array( strval( \VIDEOPRESS_PRIVACY::IS_PRIVATE ), $videopress_privacy_setting_list, true ) ) {
					$videopress_privacy_setting_list[] = \VIDEOPRESS_PRIVACY::SITE_DEFAULT;
				}
			} else { // phpcs:ignore Universal.ControlStructures.DisallowLonelyIf.Found
				/**
				 * If the search is looking for public videos and the site default is public,
				 * the site default setting should be included on the search.
				 */
				if ( in_array( strval( \VIDEOPRESS_PRIVACY::IS_PUBLIC ), $videopress_privacy_setting_list, true ) ) {
					$videopress_privacy_setting_list[] = \VIDEOPRESS_PRIVACY::SITE_DEFAULT;
				}
			}

			$args['meta_query'][] = array(
				'key'     => 'videopress_privacy_setting',
				'value'   => $videopress_privacy_setting_list,
				'compare' => 'IN',
			);
		}

		/* Filter using rating meta key */
		if ( isset( $request['videopress_rating'] ) ) {
			$videopress_rating = sanitize_text_field( $request['videopress_rating'] );

			/* Allows the filtering to happens using a list of ratings separated by comma */
			$videopress_rating_list = explode( ',', $videopress_rating );

			$args['meta_query'][] = array(
				'key'     => 'videopress_rating',
				'value'   => $videopress_rating_list,
				'compare' => 'IN',
			);
		}

		return $args;
	}

	/**
	 * WordPress.com Simple variant of the VideoPress query filters.
	 *
	 * On Simple a VideoPress attachment keeps its ORIGINAL mime (video/mp4, …),
	 * never video/videopress, and its privacy/type data live in wpcom's global
	 * `videos`/`video_meta` tables rather than postmeta. So every filter here is
	 * expressed as a WP_Query ID-set constraint (post__in / post__not_in) resolved
	 * from those tables, which keeps found_posts — and therefore the X-WP-Total /
	 * X-WP-TotalPages headers — exact (no client-side truncation).
	 *
	 * Only reached when IS_WPCOM is defined and true, where the `videos` tables
	 * and video_is_private_wpcom_blog() exist.
	 *
	 * @param array           $args    The original WP_Query args.
	 * @param WP_REST_Request $request The REST request.
	 * @return array The filtered WP_Query args.
	 */
	private function filter_attachments_by_jetpack_videopress_fields_wpcom( $args, $request ) {
		/*
		 * Browse default: the `media_type` param is rejected on WPCOM and
		 * `mime_type=video/*` doesn't narrow the query, so the dashboard sends
		 * `videopress_only_videos`. The bare major type makes WP_Query match
		 * `post_mime_type LIKE 'video/%'`. Always sent so the grid shows every
		 * video; the ID-set constraints below narrow it further when a type or
		 * privacy filter is active.
		 */
		if ( isset( $request['videopress_only_videos'] ) ) {
			$args['post_mime_type'] = 'video';
		}

		$post_in     = null; // int[]|null — restrict results to these attachment IDs.
		$post_not_in = null; // int[]|null — exclude these attachment IDs.

		/*
		 * Privacy filter → restrict to the VideoPress videos whose *effective*
		 * visibility matches (see wpcom_privacy_value_set()).
		 *
		 * DELIBERATE BEHAVIOR CHANGE vs the old client filter: this applies to
		 * VideoPress videos only. The old matchesClientSideFilters treated a
		 * "local" (non-VideoPress) video as public + site-default — its is_private
		 * defaulted to false and its privacy to 'site-default' — so it surfaced
		 * under the Public and Site-default filters. Local videos carry no
		 * videos-table privacy row, so here they're excluded from every
		 * privacy-filtered view. Privacy is a VideoPress concept and a Simple site
		 * holding non-VideoPress videos is rare; the Private filter is unchanged
		 * (local videos were never private). See PR #50410 discussion.
		 */
		if ( isset( $request['videopress_privacy_setting'] ) ) {
			$requested_privacy = array_map(
				'intval',
				array_filter( explode( ',', (string) $request['videopress_privacy_setting'] ), 'is_numeric' )
			);
			// A malformed/empty value narrows nothing — don't accidentally
			// restrict the grid to videos-table members.
			if ( ! empty( $requested_privacy ) ) {
				$privacy_ids = $this->get_wpcom_videopress_post_ids( $requested_privacy );
				$post_in     = null === $post_in ? $privacy_ids : array_values( array_intersect( $post_in, $privacy_ids ) );
			}
		}

		/*
		 * Type filter. `videopress_has_guid` restricts to videos-table members;
		 * `no_videopress` excludes them (the "local", non-VideoPress videos).
		 * Both replace the postmeta-backed logic used off-Simple.
		 */
		if ( isset( $request['videopress_has_guid'] ) ) {
			$vp_ids  = $this->get_wpcom_videopress_post_ids();
			$post_in = null === $post_in ? $vp_ids : array_values( array_intersect( $post_in, $vp_ids ) );
		} elseif ( isset( $request['no_videopress'] ) ) {
			$post_not_in = $this->get_wpcom_videopress_post_ids();
		}

		/*
		 * A restrict-set combined with an exclude-set (e.g. a privacy filter plus
		 * type=local) can't be expressed with both post__in and post__not_in —
		 * WP_Query doesn't support the pair — so collapse to a single post__in
		 * difference. In practice this combination is empty: local videos have no
		 * videos-table privacy row, so they're never in the privacy set.
		 */
		if ( null !== $post_in && null !== $post_not_in ) {
			$post_in     = array_values( array_diff( $post_in, $post_not_in ) );
			$post_not_in = null;
		}

		if ( null !== $post_in ) {
			// WP_Query silently ignores an empty post__in, so a filter that
			// matched nothing must fall back to a sentinel that matches no
			// attachment (post ID 0 never exists) — otherwise it would leak the
			// whole library.
			$args['post__in'] = array() === $post_in ? array( 0 ) : $post_in;
		}
		if ( null !== $post_not_in && array() !== $post_not_in ) {
			$args['post__not_in'] = $post_not_in;
		}

		return $args;
	}

	/**
	 * List this blog's VideoPress attachment post IDs from wpcom's global
	 * `videos` table, optionally narrowed to an effective-visibility set.
	 *
	 * Membership in the `videos` table — not postmeta or the mime type — is what
	 * distinguishes a VideoPress video from a local one on Simple. Soft-deleted
	 * rows (a `video_meta` row with meta_key 'deleted_at') are always excluded,
	 * matching every canonical wpcom query over these tables
	 * (e.g. helpers.php:videopress_get_jetpack_storage_used()).
	 *
	 * The literal meta_key strings map to wpcom's VIDEOPRESS_META_KEYS constants:
	 * 'deleted_at' = DELETED_AT, 'privacy_setting' = PRIVACY_SETTING. The privacy
	 * integers map to VIDEOPRESS_PRIVACY: 0 = IS_PUBLIC, 1 = IS_PRIVATE,
	 * 2 = SITE_DEFAULT. They're inlined as literals rather than referencing those
	 * classes, which aren't present off-platform; this method is only ever called
	 * from the IS_WPCOM-guarded branch above.
	 *
	 * @param int[] $requested_privacy Privacy codes to filter by (0/1/2). Empty
	 *                                 for no privacy predicate (all members).
	 * @return int[] Attachment post IDs.
	 */
	private function get_wpcom_videopress_post_ids( $requested_privacy = array() ) {
		global $wpdb;

		$privacy_join  = '';
		$privacy_where = '';
		$prepare_args  = array( get_current_blog_id() );

		if ( ! empty( $requested_privacy ) ) {
			$site_is_private           = Data::get_videopress_videos_private_for_site();
			list( $values, $inc_null ) = $this->wpcom_privacy_value_set( $requested_privacy, $site_is_private );

			// A privacy filter that admits no stored value and no absent-meta row
			// matches nothing; short-circuit before touching the database.
			if ( array() === $values && ! $inc_null ) {
				return array();
			}

			$privacy_join = 'LEFT OUTER JOIN video_meta AS privacy ON privacy.guid = videos.guid AND privacy.meta_key = \'privacy_setting\'';

			$clauses = array();
			if ( array() !== $values ) {
				$placeholders = implode( ', ', array_fill( 0, count( $values ), '%d' ) );
				$clauses[]    = "privacy.meta_value IN ( {$placeholders} )";
				$prepare_args = array_merge( $prepare_args, $values );
			}
			if ( $inc_null ) {
				// No stored privacy_setting row → the video defaults to SITE_DEFAULT.
				$clauses[] = 'ISNULL( privacy.meta_value )';
			}
			$privacy_where = 'AND ( ' . implode( ' OR ', $clauses ) . ' )';
		}

		/*
		 * $privacy_join / $privacy_where are assembled above from literal SQL
		 * fragments and %d placeholders only — never from request input — and every
		 * value is bound through $wpdb->prepare() via $prepare_args. The
		 * InterpolatedNotPrepared sniff can't see that the interpolated pieces are
		 * constant, so disable it (with the direct-query / no-caching sniffs — this
		 * is a short-lived, per-request video-id lookup) across the multi-line query.
		 */
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
		$ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT videos.post_id
				FROM videos
				LEFT OUTER JOIN video_meta AS delete_key ON delete_key.guid = videos.guid AND delete_key.meta_key = 'deleted_at'
				{$privacy_join}
				WHERE videos.blog_id = %d
					AND ISNULL( delete_key.meta_value )
					{$privacy_where}",
				$prepare_args
			)
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber

		return array_map( 'intval', (array) $ids );
	}

	/**
	 * Translate requested privacy codes into the concrete set of stored
	 * `privacy_setting` values — plus whether an absent meta row qualifies —
	 * that reproduce, for VideoPress videos, the same effective visibility the
	 * client's old matchesClientSideFilters computed for them. (Local, non-
	 * videos-table videos are excluded from privacy views by the caller — see
	 * the note there.)
	 *
	 * Effective visibility is private when the stored setting is 1 (IS_PRIVATE),
	 * or when the setting is 2 (SITE_DEFAULT) or the meta row is absent AND the
	 * site default is private. A missing privacy_setting row defaults to
	 * SITE_DEFAULT. The 'site-default' request (2) matches the *stored* setting
	 * (2 or absent) regardless of the resolved site privacy, mirroring the
	 * client's `site-default` branch on item.privacy.
	 *
	 * Pure (no wpcom globals) so it's unit-testable off-platform.
	 *
	 * @param int[] $requested       Requested privacy codes: 0 public, 1 private, 2 site-default.
	 * @param bool  $site_is_private Whether the site default resolves to private.
	 * @return array{0:int[],1:bool} [ acceptable stored privacy_setting values, whether absent meta qualifies ].
	 */
	private function wpcom_privacy_value_set( array $requested, $site_is_private ) {
		$values   = array();
		$inc_null = false;

		foreach ( $requested as $code ) {
			switch ( (int) $code ) {
				case 1: // Private -- wpcom constant IS_PRIVATE.
					$values[] = 1;
					if ( $site_is_private ) {
						// Site-default and absent-meta videos resolve to private.
						$values[] = 2;
						$inc_null = true;
					}
					break;
				case 0: // Public -- wpcom constant IS_PUBLIC.
					$values[] = 0;
					if ( ! $site_is_private ) {
						// Site-default and absent-meta videos resolve to public.
						$values[] = 2;
						$inc_null = true;
					}
					break;
				case 2: // Site default (SITE_DEFAULT) — match the stored setting, not the resolved visibility.
					$values[] = 2;
					$inc_null = true;
					break;
			}
		}

		return array( array_values( array_unique( $values ) ), $inc_null );
	}

	/**
	 * Defines data structure and what elements are visible in which contexts
	 */
	public function get_schema() {
		return array(
			'$schema'     => 'http://json-schema.org/draft-04/schema#',
			'title'       => $this->field_name,
			'type'        => 'object',
			'context'     => array( 'view', 'edit' ),
			'readonly'    => true,
			'description' => __( 'VideoPress Data', 'jetpack-videopress-pkg' ),
		);
	}

	/**
	 * Getter: Retrieve current VideoPress data for a given attachment.
	 *
	 * @param array           $attachment Response from the attachment endpoint.
	 * @param WP_REST_Request $request Request to the attachment endpoint.
	 *
	 * @return array
	 */
	public function get( $attachment, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! isset( $attachment['id'] ) ) {
			return array();
		}

		$blog_id = Jetpack_Connection::get_site_id();
		if ( ! is_int( $blog_id ) ) {
			return array();
		}

		$videopress = $this->get_videopress_data( (int) $attachment['id'], $blog_id );

		if ( ! $videopress ) {
			return array();
		}

		return $videopress;
	}

	/**
	 * Gets the VideoPress GUID for a given attachment.
	 *
	 * This is pulled out into a separate method to support unit test mocking.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @param int $blog_id Blog ID.
	 *
	 * @return array
	 */
	public function get_videopress_data( $attachment_id, $blog_id ) {
		$info = video_get_info_by_blogpostid( $blog_id, $attachment_id );
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$title       = video_get_title( $blog_id, $attachment_id );
			$description = video_get_description( $blog_id, $attachment_id );

			$video_attachment = get_blog_post( $blog_id, $attachment_id );
			if ( null === $video_attachment ) {
				$caption = '';
			} else {
				$caption = $video_attachment->post_excerpt;
			}
		} else {
			$title       = $info->title;
			$description = $info->description;
			$caption     = $info->caption;
		}

		$video_privacy_setting    = ! isset( $info->privacy_setting ) ? \VIDEOPRESS_PRIVACY::SITE_DEFAULT : intval( $info->privacy_setting );
		$private_enabled_for_site = Data::get_videopress_videos_private_for_site();
		$is_private               = $this->video_is_private( $video_privacy_setting, $private_enabled_for_site );

		// The video needs a playback token if it's private for any reason (video privacy setting or site default privacy setting)
		$video_needs_playback_token = $is_private;

		return array(
			'title'                    => $title,
			'description'              => $description,
			'caption'                  => $caption,
			'guid'                     => $info->guid ?? null,
			'rating'                   => $info->rating ?? null,
			'allow_download'           =>
				isset( $info->allow_download ) && $info->allow_download ? 1 : 0,
			'display_embed'            =>
				isset( $info->display_embed ) && $info->display_embed ? 1 : 0,
			'privacy_setting'          => $video_privacy_setting,
			'needs_playback_token'     => $video_needs_playback_token,
			'is_private'               => $is_private,
			'private_enabled_for_site' => $private_enabled_for_site,
		);
	}

	/**
	 * Checks if the given attachment is a video.
	 *
	 * @param object $attachment The attachment object.
	 *
	 * @return false|int
	 */
	public function is_video( $attachment ) {
		return isset( $attachment->post_mime_type ) && wp_startswith( $attachment->post_mime_type, 'video/' );
	}

	/**
	 * Removes the jetpack_videopress field from the response if the
	 * given attachment is not a video.
	 *
	 * @param WP_REST_Response $response Response from the attachment endpoint.
	 * @param WP_Post          $attachment The original attachment object.
	 *
	 * @return mixed
	 */
	public function remove_field_for_non_videos( $response, $attachment ) {
		if ( ! $this->is_video( $attachment ) ) {
			unset( $response->data[ $this->field_name ] );
		}

		return $response;
	}

	/**
	 * Determines if a video is private based on the video privacy
	 * setting and the site default privacy setting.
	 *
	 * @param int  $video_privacy_setting The privacy setting for the video.
	 * @param bool $private_enabled_for_site Flag stating if the default video privacy is private.
	 *
	 * @return bool
	 */
	private function video_is_private( $video_privacy_setting, $private_enabled_for_site ) {
		if ( $video_privacy_setting === \VIDEOPRESS_PRIVACY::IS_PUBLIC ) {
			return false;
		}
		if ( $video_privacy_setting === \VIDEOPRESS_PRIVACY::IS_PRIVATE ) {
			return true;
		}

		return $private_enabled_for_site;
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( 'Automattic\Jetpack\VideoPress\WPCOM_REST_API_V2_Attachment_VideoPress_Data' );
}
