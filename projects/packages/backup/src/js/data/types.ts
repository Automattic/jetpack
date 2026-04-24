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

// File-browser types — ported verbatim from Calypso's
// `client/my-sites/backup/backup-contents-page/file-browser/types.ts`.

export type FileBrowserNodeType =
	| 'file'
	| 'dir'
	| 'wordpress'
	| 'table'
	| 'theme'
	| 'plugin'
	| 'archive';

export type FileType =
	| 'dir'
	| 'image'
	| 'text'
	| 'plugin'
	| 'theme'
	| 'table'
	| 'audio'
	| 'video'
	| 'fonts'
	| 'translations'
	| 'code'
	| 'wordpress'
	| 'archive'
	| 'other';

export interface FileBrowserItem {
	id?: string;
	name: string;
	type: FileType;
	hasChildren: boolean;
	period?: string;
	sort?: number;
	rowCount?: number;
	children?: FileBrowserItem[];
	extensionVersion?: string;
	manifestPath?: string;
	extensionType?: string;
	totalItems?: number;
	path?: string;
}

export interface BackupLsResponse {
	ok: boolean;
	error: string;
	contents: BackupLsResponseContents;
}

export interface BackupLsResponseContents {
	[ key: string ]: {
		id?: string;
		type: FileBrowserNodeType;
		has_children: boolean;
		period?: string;
		sort?: number;
		manifest_path?: string;
		label?: string;
		row_count?: number;
		extension_version?: string;
		total_items?: number;
	};
}

export interface BackupPathInfoResponse {
	download_url?: string;
	mtime?: number;
	size?: number;
	hash?: string;
	data_type?: number;
	manifest_filter?: string;
	error?: string;
}

export interface FileBrowserItemInfo {
	downloadUrl?: string;
	mtime?: number;
	size?: number;
	hash?: string;
	dataType?: number;
	manifestFilter?: string;
}

export interface BackupItemUrl {
	url: string;
}

export type FileBrowserCheckState = 'checked' | 'unchecked' | 'mixed';

export interface FileBrowserNode {
	id: string;
	path: string;
	type: FileBrowserNodeType;
	ancestors: string[];
	checkState: FileBrowserCheckState;
	childrenLoaded: boolean;
	children: FileBrowserNode[];
	totalItems: number;
}

export interface FileBrowserCheckListInfo {
	id: string;
	path: string;
	type?: FileBrowserNodeType;
}

export interface FileBrowserNodeCheckList {
	totalItems: number;
	includeList: FileBrowserCheckListInfo[];
	excludeList: FileBrowserCheckListInfo[];
}

export interface FileBrowserState {
	rootNode: FileBrowserNode;
}

export interface FileBrowserStateActions {
	getNode: ( path: string, rewindId: number ) => FileBrowserNode | null;
	getCheckList: ( rewindId: number ) => FileBrowserNodeCheckList;
	getSelectedList: ( rewindId: number ) => FileBrowserCheckListInfo[];
	setNodeCheckState: (
		nodePath: string,
		checkState: FileBrowserCheckState,
		rewindId: number
	) => void;
	addChildNodes: ( parentPath: string, childrenPaths: FileBrowserItem[], rewindId: number ) => void;
}

// Download-flow types — ported verbatim from Calypso's
// `@automattic/api-core/site-backup-download/types.ts`.

export interface DownloadConfig {
	themes?: boolean;
	plugins?: boolean;
	roots?: boolean;
	contents?: boolean;
	sqls?: boolean;
	uploads?: boolean;
}

export interface DownloadError {
	code: string;
	message: string;
}

export interface DownloadProgress {
	download_id: number;
	rewind_id: string;
	backup_point: string;
	started_at: string;
	progress: number;
	download_count: number;
	valid_until: string;
	url: string;
	bytes: number;
	bytes_formatted: string;
	error?: DownloadError;
}

export interface DownloadStatusResponse {
	downloadId: number;
	rewindId: string;
	backupPoint: string;
	startedAt: string;
	progress: number;
	downloadCount: number;
	validUntil: string;
	url: string;
	bytes: number;
	bytesFormatted: string;
	code: string;
	message: string;
}

export interface PrepareBackupDownloadResponse {
	ok: boolean;
	key: string;
}

export interface BackupDownloadStatusResponse {
	ok: boolean;
	status: string;
	download_id: string;
	token: string;
	url: string;
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
