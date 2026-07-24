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
	 * `videopress_privacy_setting`: restrict by privacy (0/1/2). Off-Simple this
	 *                               is a comma list; on Simple it's a single
	 *                               DataViews `is` code, resolved via the videos table
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

		/*
		 * Normalize the privacy filter to a single code. The dashboard's DataViews
		 * control uses the `is` operator, so it sends one value: 0 = public,
		 * 1 = private, 2 = site-default. Anything else (empty, malformed, a stray
		 * comma list) means "no privacy filter".
		 */
		$privacy = null;
		if ( isset( $request['videopress_privacy_setting'] ) ) {
			$raw = trim( (string) $request['videopress_privacy_setting'] );
			if ( '0' === $raw || '1' === $raw || '2' === $raw ) {
				$privacy = (int) $raw;
			}
		}

		/*
		 * Resolve the (type, privacy) pair into a single WP_Query ID-set
		 * constraint. This reproduces the old client-side matchesClientSideFilters
		 * exactly — including its treatment of a "local" (non-VideoPress) video as
		 * public + site-default: locals carry no videos-table privacy row, so they
		 * surface under the Public and Site-default filters and never under
		 * Private. See wpcom_privacy_type_plan().
		 */
		list( $mode, $set ) = $this->wpcom_privacy_type_plan(
			isset( $request['videopress_has_guid'] ),
			isset( $request['no_videopress'] ),
			$privacy
		);

		$ids = in_array( $mode, array( 'in', 'not_in' ), true )
			? $this->get_wpcom_videopress_post_ids( $set )
			: array();

		return $this->apply_wpcom_id_constraint( $args, $mode, $ids );
	}

	/**
	 * Apply a resolved (mode, ids) constraint to WP_Query args, composing with
	 * any include/exclude constraints core already mapped onto post__in /
	 * post__not_in (the REST `include`/`exclude` params) rather than clobbering
	 * them. WP_Query ignores post__not_in whenever post__in is present, so
	 * whenever this method *introduces* a post__in where none existed, a
	 * pre-existing exclusion (which WOULD have been honored) is folded into it
	 * by subtraction. A request carrying both include and exclude keeps core's
	 * own precedence (include wins, exclude is dropped), matching what the
	 * off-Simple meta_query path yields.
	 *
	 * Pure (args in, args out) so the composition rules are unit-testable
	 * off-platform; only the resolution of $ids touches wpcom.
	 *
	 * @param array  $args The WP_Query args.
	 * @param string $mode How to apply the set: 'in' | 'not_in' | 'empty' | 'none'.
	 * @param int[]  $ids  The resolved ID set for 'in'/'not_in'.
	 * @return array The args with the constraint applied.
	 */
	private function apply_wpcom_id_constraint( $args, $mode, $ids ) {
		// WP_Query normalizes these lists with absint; mirror it so the
		// composition operates on the values that would actually be queried.
		$existing_in     = isset( $args['post__in'] ) ? array_map( 'absint', (array) $args['post__in'] ) : array();
		$existing_not_in = isset( $args['post__not_in'] ) ? array_map( 'absint', (array) $args['post__not_in'] ) : array();

		switch ( $mode ) {
			case 'in':
				// Intersect with a pre-existing include list rather than clobber
				// it. WP_Query silently skips an empty post__in, so an empty
				// result must fall back to a sentinel that matches no attachment
				// (post ID 0 never exists) — otherwise it would leak the library.
				if ( array() !== $existing_in ) {
					// Include + exclude together: core drops the exclude, keep
					// that precedence and intersect the include list only.
					$ids = array_values( array_intersect( $existing_in, $ids ) );
				} elseif ( array() !== $existing_not_in ) {
					// A lone exclude WOULD have been honored by WP_Query, but the
					// post__in set here would make it ignored — fold it in by
					// subtraction and drop the now-dead arg.
					$ids = array_values( array_diff( $ids, $existing_not_in ) );
					unset( $args['post__not_in'] );
				}
				$args['post__in'] = array() === $ids ? array( 0 ) : $ids;
				break;

			case 'not_in':
				// An empty exclude-set excludes nothing; leave the args untouched.
				if ( array() === $ids ) {
					break;
				}
				if ( array() !== $existing_in ) {
					// post__not_in would be ignored next to post__in — express the
					// exclusion by subtracting from the include list instead.
					$kept             = array_values( array_diff( $existing_in, $ids ) );
					$args['post__in'] = array() === $kept ? array( 0 ) : $kept;
					break;
				}
				$args['post__not_in'] = array_values( array_unique( array_merge( $existing_not_in, $ids ) ) );
				break;

			case 'empty':
				// The requested combination can't match anything (e.g. local +
				// private). A pre-existing include intersected with the empty set
				// is still empty, so the match-nothing sentinel stands either way.
				$args['post__in'] = array( 0 );
				break;

			case 'none':
			default:
				// No type or privacy narrowing — the browse default stands.
				break;
		}

		return $args;
	}

	/**
	 * Map a (type, privacy) filter pair to a single WP_Query ID-set constraint,
	 * reproducing the old client-side matchesClientSideFilters exactly.
	 *
	 * The library holds two kinds of video attachment: L = local (not a member of
	 * wpcom's `videos` table) and V = VideoPress (a member). The old client filter
	 * treated every local video as public + site-default (is_private defaulted to
	 * false, privacy to 'site-default'), so locals appeared under the Public and
	 * Site-default privacy views and never under Private. This mapping preserves
	 * that parity: privacy is resolved across the whole video library, not just V.
	 *
	 * Over the site's video/* attachments, the V sub-sets are:
	 *   Vall  — all (non-soft-deleted) videos-table members.
	 *   Vpriv — effectively private: setting 1, or (setting 2 / absent) on a private site.
	 *   Vpub  — effectively public: setting 0, or (setting 2 / absent) on a public site.
	 *   Vsd   — stored site-default: setting 2 or absent.
	 *   Vexpl — an explicit setting: setting IN (0,1).
	 *
	 * Returns [ $mode, $set ], where $mode is how to apply the set and $set names it:
	 *   'none'   / null  — no constraint (show everything).
	 *   'in'     / <set> — post__in     = <set>.
	 *   'not_in' / <set> — post__not_in = <set>.
	 *   'empty'  / null  — match nothing.
	 *
	 * Pure and independent of the resolved site privacy — only the *contents* of
	 * each named set depend on it (see get_wpcom_videopress_post_ids()) — so this
	 * is exhaustively unit-testable off-platform.
	 *
	 * @param bool     $has_guid Type filter = VideoPress (videos-table members only).
	 * @param bool     $no_vp    Type filter = local (exclude videos-table members).
	 * @param int|null $privacy  Single privacy code (0/1/2), or null for no privacy filter.
	 * @return array{0:string,1:string|null} [ $mode, $set ].
	 */
	private function wpcom_privacy_type_plan( $has_guid, $no_vp, $privacy ) {
		// Strict comparisons throughout: a switch would match `case 0` for a null
		// $privacy (PHP's loose null == 0), collapsing "no privacy filter" into
		// the Public view.
		if ( $has_guid ) {
			// Type = VideoPress: always restrict to videos-table members, then
			// narrow to the effective/stored privacy set when asked.
			if ( 1 === $privacy ) {
				return array( 'in', 'priv' );
			}
			if ( 0 === $privacy ) {
				return array( 'in', 'pub' );
			}
			if ( 2 === $privacy ) {
				return array( 'in', 'sd' );
			}
			return array( 'in', 'all' );
		}

		if ( $no_vp ) {
			// Type = local: exclude every videos-table member. Locals are all
			// public + site-default and never private, so only the Private view is
			// empty; the rest just return L.
			if ( 1 === $privacy ) {
				return array( 'empty', null );
			}
			return array( 'not_in', 'all' );
		}

		// No type filter: privacy applies across the whole video library.
		if ( 1 === $privacy ) {
			// Vpriv only — locals are never private.
			return array( 'in', 'priv' );
		}
		if ( 0 === $privacy ) {
			// L ∪ Vpub — everything except the effectively-private videos.
			return array( 'not_in', 'priv' );
		}
		if ( 2 === $privacy ) {
			// L ∪ Vsd — everything except videos with an explicit setting.
			return array( 'not_in', 'expl' );
		}
		return array( 'none', null );
	}

	/**
	 * List this blog's VideoPress attachment post IDs from wpcom's global
	 * `videos` table, optionally narrowed to a named privacy set.
	 *
	 * Membership in the `videos` table — not postmeta or the mime type — is what
	 * distinguishes a VideoPress video from a local one on Simple. Soft-deleted
	 * rows (a `video_meta` row with meta_key 'deleted_at') are always excluded,
	 * matching every canonical wpcom query over these tables
	 * (e.g. helpers.php:videopress_get_jetpack_storage_used()).
	 *
	 * The named sets mirror wpcom_privacy_type_plan():
	 *   'all'  — every member, no privacy predicate (Vall).
	 *   'priv' — effectively private (Vpriv).
	 *   'pub'  — effectively public (Vpub).
	 *   'sd'   — stored site-default (Vsd).
	 *   'expl' — an explicit privacy_setting IN (0,1) (Vexpl); absent meta does
	 *            NOT qualify, since a missing row is stored site-default.
	 *
	 * The literal meta_key strings map to wpcom's VIDEOPRESS_META_KEYS constants:
	 * 'deleted_at' = DELETED_AT, 'privacy_setting' = PRIVACY_SETTING. The privacy
	 * integers map to VIDEOPRESS_PRIVACY: 0 = IS_PUBLIC, 1 = IS_PRIVATE,
	 * 2 = SITE_DEFAULT. They're inlined as literals rather than referencing those
	 * classes, which aren't present off-platform; this method is only ever called
	 * from the IS_WPCOM-guarded branch above.
	 *
	 * @param string $set Named privacy set: 'all'|'priv'|'pub'|'sd'|'expl'.
	 * @return int[] Attachment post IDs.
	 */
	private function get_wpcom_videopress_post_ids( $set = 'all' ) {
		global $wpdb;

		$privacy_join  = '';
		$privacy_where = '';
		$prepare_args  = array( get_current_blog_id() );

		if ( 'all' !== $set ) {
			if ( 'expl' === $set ) {
				// Videos with an explicit setting only. A missing privacy_setting
				// row is stored site-default, so absent meta does NOT qualify.
				$values   = array( 0, 1 );
				$inc_null = false;
			} else {
				$site_is_private = Data::get_videopress_videos_private_for_site();
				switch ( $set ) {
					case 'priv':
						$code = 1;
						break;
					case 'pub':
						$code = 0;
						break;
					case 'sd':
					default:
						$code = 2;
						break;
				}
				list( $values, $inc_null ) = $this->wpcom_privacy_value_set( $code, $site_is_private );
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
	 * Translate a requested privacy code into the concrete set of stored
	 * `privacy_setting` values — plus whether an absent meta row qualifies —
	 * that reproduce, for VideoPress videos, the same effective visibility the
	 * client's old matchesClientSideFilters computed for them.
	 *
	 * Effective visibility is private when the stored setting is 1 (IS_PRIVATE),
	 * or when the setting is 2 (SITE_DEFAULT) or the meta row is absent AND the
	 * site default is private. A missing privacy_setting row defaults to
	 * SITE_DEFAULT. The 'site-default' request (2) matches the *stored* setting
	 * (2 or absent) regardless of the resolved site privacy, mirroring the
	 * client's `site-default` branch on item.privacy.
	 *
	 * This resolves the Vpriv (code 1), Vpub (code 0) and Vsd (code 2) sets used
	 * by get_wpcom_videopress_post_ids(). Local (non-videos-table) videos carry no
	 * row here; the caller folds them back into the Public and Site-default views
	 * via post__not_in, restoring the old client filter's parity.
	 *
	 * Pure (no wpcom globals) so it's unit-testable off-platform.
	 *
	 * @param int  $code            Requested privacy code: 0 public, 1 private, 2 site-default.
	 * @param bool $site_is_private Whether the site default resolves to private.
	 * @return array{0:int[],1:bool} [ acceptable stored privacy_setting values, whether absent meta qualifies ].
	 */
	private function wpcom_privacy_value_set( $code, $site_is_private ) {
		switch ( (int) $code ) {
			case 1: // Private -- wpcom constant IS_PRIVATE. Site-default and
				// absent-meta videos resolve to private on a private site.
				return $site_is_private ? array( array( 1, 2 ), true ) : array( array( 1 ), false );
			case 0: // Public -- wpcom constant IS_PUBLIC. Site-default and
				// absent-meta videos resolve to public on a public site.
				return $site_is_private ? array( array( 0 ), false ) : array( array( 0, 2 ), true );
			case 2: // Site default (SITE_DEFAULT) — match the stored setting,
			default: // not the resolved visibility.
				return array( array( 2 ), true );
		}
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
