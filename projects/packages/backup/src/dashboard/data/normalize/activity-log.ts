import type { ActivityItem, ActivityKind } from '../../types/activity';
import type { WpcomActivityEntry } from '../api/activity-log';

/**
 * WPCOM gridicon → UI kind. These are the gridicon names the live
 * rewindable feed actually sends — verified against a 200-entry sample,
 * not inferred. Two of them are easy to get wrong: WPCOM sends the
 * plurals `posts` and `themes`, not `post` and `color`.
 *
 * Anything absent from this map renders as `other` rather than being
 * dropped; see `ActivityKind`.
 */
const GRIDICON_TO_KIND: Record< string, ActivityKind > = {
	cloud: 'backup',
	image: 'upload',
	posts: 'post',
	plugins: 'plugin-update',
	themes: 'theme-update',
};

/**
 * Convert a single WPCOM rewindable-activity entry into the UI's
 * `ActivityItem` shape.
 *
 * Every entry maps to something: an unrecognized gridicon becomes the
 * generic `other` kind. Returning null here would drop the row, hiding site
 * activity the server did send and counted in `totalItems`.
 *
 * @param entry - WPCOM entry.
 * @return The mapped item.
 */
export function normalizeEntry( entry: WpcomActivityEntry ): ActivityItem {
	const kind = GRIDICON_TO_KIND[ entry.gridicon ] ?? 'other';

	const actor = entry.actor ?? { type: 'Application', name: 'Jetpack' };
	const base = {
		id: entry.activity_id,
		title: entry.summary,
		publishedAt: entry.published,
		actor: {
			type: actor.type === 'Person' ? ( 'Person' as const ) : ( 'Application' as const ),
			name: actor.name,
		},
		summary: entry.content?.text ?? undefined,
	};

	if ( kind === 'backup' ) {
		return {
			...base,
			kind: 'backup',
			rewindId: entry.rewind_id ?? entry.activity_id,
			// `content.text` is the human-readable summary
			// ("44 plugins, 23 themes, 1562 uploads…"). WPCOM also ships
			// `object.backup_stats`, but in production that field is a
			// stringified JSON blob, not a friendly string — rendering
			// it verbatim dumps raw JSON into the UI.
			stats: entry.content?.text ?? '',
		};
	}

	return {
		...base,
		kind,
	};
}

/**
 * Convert an array of WPCOM entries into UI `ActivityItem`s.
 *
 * Length-preserving: one item out per entry in, so the rendered row
 * count always matches what the server said it sent.
 *
 * @param entries - WPCOM entries (possibly empty).
 * @return Normalized items.
 */
export function normalizeActivityLog( entries: WpcomActivityEntry[] | undefined ): ActivityItem[] {
	if ( ! entries ) {
		return [];
	}
	return entries.map( normalizeEntry );
}
