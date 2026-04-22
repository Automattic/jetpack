// Realistic-looking fixtures for the Backup overview. Shapes match the
// types in `../types.ts` — edit these to explore design states that
// are hard to reproduce on a real site (long summaries, retention
// warnings, error actors, etc).
//
// Used only when `?jpb-mock=1` is present in the URL; stripped from
// production bundles via a runtime flag (no dead-code elimination is
// attempted — the fixtures are tiny compared to DataViews itself).

import type {
	ActivityLogEntry,
	ActivityLogResponse,
	BackupEntry,
	SiteRewindPoliciesResponse,
	SiteRewindSizeResponse,
} from '../types';

const jetpackActor: ActivityLogEntry[ 'actor' ] = {
	type: 'Application',
	name: 'Jetpack',
};

const adminActor: ActivityLogEntry[ 'actor' ] = {
	type: 'Person',
	name: 'Totoro',
	wpcom_user_id: 12345,
	role: 'administrator',
};

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.now();

const makeBackupEntry = (
	offsetDays: number,
	status: 'Full backup complete' | 'Backup and scan complete' = 'Backup and scan complete',
	stats = '4 plugins, 1 theme, 20 uploads, 4 posts, 1 page'
): ActivityLogEntry => {
	const published = new Date( now - offsetDays * DAY_MS ).toISOString();
	return {
		activity_id: `backup-${ offsetDays }`,
		actor: jetpackActor,
		content: { text: stats },
		type: 'Announce',
		gridicon: 'cloud',
		last_published: published,
		name: 'rewind__backup_complete_full',
		is_rewindable: true,
		object: {
			backup_type: 'complete',
			rewind_id: String( Math.floor( ( now - offsetDays * DAY_MS ) / 1000 ) ),
			backup_stats: stats,
			backup_period: Math.floor( ( now - offsetDays * DAY_MS ) / 1000 ),
		},
		published,
		rewind_id: String( Math.floor( ( now - offsetDays * DAY_MS ) / 1000 ) ),
		status: 'success',
		summary: status,
		streams: [],
	};
};

const mockActivityLogEntries: ActivityLogEntry[] = [
	makeBackupEntry( 0 ),
	{
		activity_id: 'upload-1',
		actor: adminActor,
		content: { text: 'cat.png' },
		type: 'Announce',
		gridicon: 'image',
		last_published: new Date( now - 0.3 * DAY_MS ).toISOString(),
		name: 'attachment__uploaded',
		is_rewindable: true,
		published: new Date( now - 0.3 * DAY_MS ).toISOString(),
		rewind_id: 'upload-1',
		status: 'info',
		summary: '1 image uploaded',
		streams: [],
	},
	{
		activity_id: 'post-1',
		actor: adminActor,
		content: { text: 'The Perks of Having a Cat' },
		type: 'Announce',
		gridicon: 'posts',
		last_published: new Date( now - 1 * DAY_MS ).toISOString(),
		name: 'post__published',
		is_rewindable: true,
		published: new Date( now - 1 * DAY_MS ).toISOString(),
		rewind_id: 'post-1',
		status: 'info',
		summary: 'Post published',
		streams: [],
	},
	makeBackupEntry( 1 ),
	makeBackupEntry( 2 ),
	makeBackupEntry( 3 ),
	{
		activity_id: 'plugin-update-1',
		actor: jetpackActor,
		content: { text: 'Jetpack 15.2' },
		type: 'Announce',
		gridicon: 'plugins',
		last_published: new Date( now - 3.9 * DAY_MS ).toISOString(),
		name: 'plugin__updated',
		is_rewindable: false,
		published: new Date( now - 3.9 * DAY_MS ).toISOString(),
		rewind_id: 'plugin-update-1',
		status: 'info',
		summary: 'Jetpack 15.2 plugin updated',
		streams: [],
	},
	makeBackupEntry( 4 ),
	makeBackupEntry( 5 ),
	makeBackupEntry( 6 ),
	makeBackupEntry( 7 ),
	makeBackupEntry( 8 ),
	makeBackupEntry( 9 ),
	makeBackupEntry( 10 ),
	makeBackupEntry( 11 ),
	makeBackupEntry( 12 ),
];

export const mockActivityLogResponse: ActivityLogResponse = {
	current: { orderedItems: mockActivityLogEntries },
	totalItems: mockActivityLogEntries.length,
	pages: 1,
	itemsPerPage: 100,
	totalPages: 1,
};

export const mockBackups: BackupEntry[] = [
	{
		id: 'mock-1',
		started: new Date( now - 5 * 60 * 1000 ).toISOString().replace( 'T', ' ' ).slice( 0, 19 ),
		last_updated: new Date( now - 5 * 60 * 1000 ).toISOString().replace( 'T', ' ' ).slice( 0, 19 ),
		status: 'finished',
		period: String( Math.floor( now / 1000 ) ),
		percent: '100',
		is_backup: '1',
		is_scan: '1',
	},
];

export const mockPolicies: SiteRewindPoliciesResponse = {
	policies: {
		activity_log_limit_days: 30,
		storage_limit_bytes: 10 * 1024 * 1024 * 1024,
	},
};

export const mockSize: SiteRewindSizeResponse = {
	ok: true,
	error: '',
	size: 1.2 * 1024 * 1024 * 1024,
	days_of_backups_saved: 30,
	days_of_backups_allowed: 30,
	min_days_of_backups_allowed: 7,
	last_backup_size: 180 * 1024 * 1024,
	last_backup_failed: false,
	retention_days: 30,
	backups_stopped: false,
};
