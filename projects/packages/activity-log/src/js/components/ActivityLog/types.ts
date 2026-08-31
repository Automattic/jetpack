import type { ActivityBlockContent } from './formatted-block/types';

export interface ActivityDescription {
	textDescription: string;
	items: ActivityBlockContent[];
}

export interface ActivityActorDetails {
	actorId?: string;
	actorAvatarUrl?: string;
	actorName?: string;
	actorRole?: string;
	actorType?: string;
	isCli?: boolean;
	isSupport?: boolean;
	isMcpAgent?: boolean;
	mcpClient?: string;
}

export interface ActivityMediaDetails {
	available: boolean;
	medium_url: string;
	name: string;
	thumbnail_url: string;
	type: string;
	url: string;
}

export interface Activity {
	activityDescription: ActivityDescription;
	activityIcon?: string;
	activityId: string;
	activityMedia: ActivityMediaDetails;
	activityName: string;
	activityObject?: ActivityLogObject;
	activityStatus: string;
	activityTitle: string;
	activityTs: number;
	activityUnparsedTs: string;
	activityActor: ActivityActorDetails;
	activityIsRewindable: boolean;
	rewindId?: string;
}

/**
 * Minimal shape from the WPCOM activity log endpoint. We only type the
 * fields the UI actually consumes; other fields flow through untyped.
 */
export interface ActivityNotificationRange {
	indices: [ number, number ];
	type?: string;
	url?: string;
	section?: string;
	intent?: string;
	activity?: string;
	id?: number | string;
	name?: string;
	site_id?: number | string;
	post_id?: number | string;
	site_slug?: string;
	slug?: string;
	version?: string;
	uri?: string;
	rewind_id?: string;
	published?: string;
	[ key: string ]: unknown;
}

export interface ActivityLogActor {
	id?: string;
	type?: 'Person' | 'Application' | 'Happiness Engineer';
	name?: string;
	role?: string;
	icon?: { type?: string; url?: string; width?: number; height?: number };
	is_cli?: boolean;
	is_happiness?: boolean;
	is_mcp_agent?: boolean;
	mcp_client?: string;
}

export interface ActivityLogEntryImage {
	available?: boolean;
	medium_url?: string;
	thumbnail_url?: string;
	type?: string;
	name?: string;
	url?: string;
}

export interface ActivityLogObject {
	type?: string;
	name?: string;
	object_id?: number | string;
	external_user_id?: number | string;
	wpcom_user_id?: number | string;
	[ key: string ]: unknown;
}

export interface ActivityLogEntry {
	activity_id: string;
	actor?: ActivityLogActor;
	content?: { text?: string; ranges?: ActivityNotificationRange[] };
	gridicon?: string;
	image?: ActivityLogEntryImage | null;
	name: string;
	is_rewindable?: boolean;
	object?: ActivityLogObject;
	published?: string;
	rewind_id?: string;
	status?: 'error' | 'info' | 'success' | 'warning' | null;
	summary: string;
}

export interface ActivityLogsData {
	activityLogs: ActivityLogEntry[];
	totalItems?: number;
	pages?: number;
	itemsPerPage?: number;
	totalPages?: number;
}

export interface ActivityLogGroupCountResponse {
	groups: Record< string, { name: string; count: number } >;
	totalItems?: number;
}

/**
 * Single entry in the /activity-log/actors response. `id` is the stable
 * identifier the client sends back as a filter value; the rest are
 * presentational. Mirrors the actor block on individual activity entries.
 */
export interface ActorSummary {
	id: string;
	type?: 'Person' | 'Application' | 'Happiness Engineer';
	name?: string;
	role?: string;
	icon?: { url?: string };
	is_cli?: boolean;
	is_happiness?: boolean;
	is_mcp_agent?: boolean;
	mcp_client?: string;
	count?: number;
}

export interface ActivityLogActorsResponse {
	actors: ActorSummary[];
	totalItems?: number;
}

export interface ActivityLogActorsParams {
	number?: number;
	after?: string;
	before?: string;
}

export interface ActivityLogParams {
	number?: number;
	page?: number;
	sort_order?: 'asc' | 'desc';
	after?: string;
	before?: string;
	group?: string[];
	not_group?: string[];
	text_search?: string;
	actor?: string[];
}
