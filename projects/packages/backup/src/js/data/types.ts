// Types ported verbatim from @automattic/api-core. Kept local to avoid
// pulling the whole api-core package — the shapes the Jetpack Backup
// overview depends on are small and stable.

export const BackupEntryErrorStatuses = {
	BACKUPS_DEACTIVATED: 'backups-deactivated',
	CREDENTIAL_ERROR: 'credential-error',
	ERROR_WILL_RETRY: 'error-will-retry',
	ERROR: 'error',
	HTTP_ONLY_ERROR: 'http-only-error',
	NO_CREDENTIALS_ATOMIC: 'no-credentials-atomic',
	NOT_ACCESSIBLE: 'not-accessible',
} as const;

export const BackupEntryStatuses = {
	STARTED: 'started',
	FINISHED: 'finished',
	...BackupEntryErrorStatuses,
} as const;

export type BackupEntryStatus = ( typeof BackupEntryStatuses )[ keyof typeof BackupEntryStatuses ];

export interface BackupEntry {
	id: string;
	started: string;
	last_updated: string;
	status: BackupEntryStatus;
	period: string;
	percent: string;
	discarded?: string;
	is_backup: string;
	is_scan: string;
}

export type ActivityStatus = 'error' | 'info' | 'success' | 'warning' | null;

export interface ActivityNotificationRange {
	id: string | number;
	parent?: string | null;
	indices: [ number, number ];
	style?: string;
	class?: string;
	section?: string;
	url?: string;
	type: string;
	intent?: string;
	site_id?: number;
	context?: string;
	root_id?: number;
	slug?: string;
	site_slug?: string;
	uri?: string;
}

export interface ActivityImage {
	type: 'Image';
	url: string;
	width?: number;
	height?: number;
}

export type ActivityLogActor = {
	type: 'Person' | 'Application' | 'Happiness Engineer';
	name: string;
	external_user_id?: number | string | null;
	wpcom_user_id?: number | null;
	role?: string;
	icon?: ActivityImage;
	is_cli?: boolean;
	is_happiness?: boolean;
	is_mcp_agent?: boolean;
	mcp_client?: string;
};

export interface ActivityLogEntry {
	activity_id: string;
	actor: ActivityLogActor;
	content: {
		text: string;
		ranges?: ActivityNotificationRange[];
	};
	type: 'Announce';
	gridicon: string;
	image?: {
		available: boolean;
		medium_url: string;
		thumbnail_url?: string;
		type?: string;
		name: string;
		url: string;
	};
	last_published: string;
	name: string;
	is_rewindable: boolean;
	object?: {
		backup_type?: string;
		rewind_id?: string;
		backup_stats?: string;
		backup_period?: number;
		backup_warnings?: string;
		backup_errors?: string;
		type?: string;
	};
	published: string;
	rewind_id: string;
	status: ActivityStatus;
	summary: string;
	streams: ActivityLogEntry[];
}

export interface ActivityLogResponse {
	current?: {
		orderedItems: ActivityLogEntry[];
	};
	totalItems: number;
	pages: number;
	itemsPerPage: number;
	totalPages: number;
}

export interface BackupPolicy {
	activity_log_limit_days: number;
	storage_limit_bytes: number;
}

export interface SiteRewindPoliciesResponse {
	policies: BackupPolicy | null;
}

export interface SiteRewindSizeResponse {
	ok: true;
	error: '';
	size: number;
	days_of_backups_saved: number;
	days_of_backups_allowed: number;
	min_days_of_backups_allowed: number;
	last_backup_size: number;
	last_backup_failed: string | false;
	retention_days: number;
	backups_stopped: boolean;
}

export interface JetpackBackupInitialState {
	API: {
		WP_API_root: string;
		WP_API_nonce: string;
		registrationNonce: string;
	};
	siteData: {
		id: number;
		title: string;
		adminUrl: string;
		gmtOffset: number;
		timezoneString: string;
		locale: string;
	};
	jetpackStatus: {
		calypsoSlug: string;
	};
	assets: {
		buildUrl: string;
	};
}
