import type { ActivityItem, ActivityKind } from '../../types/activity';
import type { WpcomActivityEntry } from '../api/activity-log';

const GRIDICON_TO_KIND: Record< string, ActivityKind | null > = {
	cloud: 'backup',
	image: 'upload',
	post: 'post',
	plugins: 'plugin-update',
	color: 'theme-update',
};

/**
 * Convert a single WPCOM rewindable-activity entry into the UI's
 * `ActivityItem` shape. Returns null when the entry's gridicon doesn't
 * map to a kind we render.
 *
 * @param entry - WPCOM entry.
 * @return The mapped item, or null when the entry is filtered out.
 */
export function normalizeEntry( entry: WpcomActivityEntry ): ActivityItem | null {
	const kind = GRIDICON_TO_KIND[ entry.gridicon ];
	if ( ! kind ) {
		return null;
	}

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
			isComplete:
				entry.name === 'rewind__backup_complete_full' || entry.name === 'rewind__backup_complete',
		};
	}

	return {
		...base,
		kind,
	};
}

/**
 * Convert an array of WPCOM entries into UI `ActivityItem`s, filtering
 * out entries whose `gridicon` doesn't map to a known kind.
 *
 * @param entries - WPCOM entries (possibly empty).
 * @return Normalized items.
 */
export function normalizeActivityLog( entries: WpcomActivityEntry[] | undefined ): ActivityItem[] {
	if ( ! entries ) {
		return [];
	}
	return entries.map( normalizeEntry ).filter( ( item ): item is ActivityItem => item !== null );
}
