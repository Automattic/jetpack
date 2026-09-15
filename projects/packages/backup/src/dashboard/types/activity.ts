/**
 * `other` is the catch-all for any WPCOM gridicon we don't map to a
 * specific kind. WPCOM's rewindable feed spans more event families than
 * the five we render icons for (`video`, `cog`, `plans`, and — on the
 * parent activity endpoint — `notice`, `lock`, `checkmark`), and that
 * set grows without notice. Dropping the unrecognized ones hid 27% of
 * this site's activity, so unknown maps here instead.
 *
 * `restore` is the exception: no gridicon produces it. A restore is not a
 * restore point, so those rows are merged in from `GET /jetpack/v4/restores`.
 */
export type ActivityKind =
	| 'backup'
	| 'restore'
	| 'post'
	| 'upload'
	| 'plugin-update'
	| 'theme-update'
	| 'other';

export type ActivityActor = {
	type: 'Application' | 'Person';
	name: string;
};

export type ActivityItemBase = {
	id: string;
	title: string;
	publishedAt: string;
	actor: ActivityActor;
	summary?: string;
};

export type BackupActivityItem = ActivityItemBase & {
	kind: 'backup';
	rewindId: string;
	stats: string;
};

export type NonBackupActivityItem = ActivityItemBase & {
	kind: Exclude< ActivityKind, 'backup' >;
};

export type ActivityItem = BackupActivityItem | NonBackupActivityItem;

export const isBackupItem = ( item: ActivityItem ): item is BackupActivityItem =>
	item.kind === 'backup';
