import type { ActivityItem } from '../types/activity';

const BASE_DATE = new Date( '2026-05-15T12:26:00.000Z' );
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const at = ( daysAgo: number, hoursAgo = 0 ): string =>
	new Date( BASE_DATE.getTime() - daysAgo * DAY_MS - hoursAgo * HOUR_MS ).toISOString();

const jetpack = { type: 'Application' as const, name: 'Jetpack' };
const totoro = { type: 'Person' as const, name: 'Totoro' };

const backup = ( offsetDays: number ): ActivityItem => ( {
	id: `backup-${ offsetDays }`,
	kind: 'backup',
	title: 'Backup and scan complete by Jetpack',
	publishedAt: at( offsetDays ),
	actor: jetpack,
	summary: '4 plugins, 1 theme, 20 uploads, 4 posts, 1 page',
	rewindId: String( Math.floor( ( BASE_DATE.getTime() - offsetDays * DAY_MS ) / 1000 ) ),
	stats: '4 plugins, 1 theme, 20 uploads, 4 posts, 1 page',
	isComplete: true,
} );

export const MOCK_ACTIVITY_LOG: ActivityItem[] = [
	backup( 0 ),
	{
		id: 'upload-1',
		kind: 'upload',
		title: '1 image uploaded by Totoro',
		publishedAt: at( 0.95 ),
		actor: totoro,
		summary: 'cat.png',
	},
	{
		id: 'post-1',
		kind: 'post',
		title: 'Post published by Totoro',
		publishedAt: at( 1 ),
		actor: totoro,
		summary: 'The Perks of Having a Cat',
	},
	backup( 1 ),
	backup( 2 ),
	backup( 3 ),
	{
		id: 'plugin-1',
		kind: 'plugin-update',
		title: 'Jetpack 15.2 plugin updated by Jetpack',
		publishedAt: at( 4, 10 ),
		actor: jetpack,
		summary: 'Jetpack 15.2',
	},
	backup( 4 ),
	backup( 5 ),
	backup( 6 ),
	backup( 7 ),
	backup( 8 ),
	backup( 9 ),
	{
		id: 'theme-1',
		kind: 'theme-update',
		title: 'Twenty Twenty-Five theme updated by Totoro',
		publishedAt: at( 10, 6 ),
		actor: totoro,
		summary: 'Twenty Twenty-Five 1.2',
	},
	backup( 10 ),
	backup( 11 ),
	backup( 12 ),
	backup( 13 ),
	backup( 14 ),
];

/**
 * Look up an activity item by the id used in the URL's `?selected=` param.
 *
 * Backup items match on `rewindId`; non-backup items match on `id`.
 *
 * @param id - Selection id from the URL.
 * @return The matching activity item, or `null` if no row matches.
 */
export function findActivityById( id: string ): ActivityItem | null {
	return (
		MOCK_ACTIVITY_LOG.find( item =>
			item.kind === 'backup' ? item.rewindId === id : item.id === id
		) ?? null
	);
}
