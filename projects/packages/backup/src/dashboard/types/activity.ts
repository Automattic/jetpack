export type ActivityKind = 'backup' | 'post' | 'upload' | 'plugin-update' | 'theme-update';

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
	isComplete: boolean;
};

export type NonBackupActivityItem = ActivityItemBase & {
	kind: Exclude< ActivityKind, 'backup' >;
};

export type ActivityItem = BackupActivityItem | NonBackupActivityItem;

export const isBackupItem = ( item: ActivityItem ): item is BackupActivityItem =>
	item.kind === 'backup';
