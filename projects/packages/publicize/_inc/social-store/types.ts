import { ConnectionService } from '../types';
import { AttachedMedia, MediaSourceValue, SHARING_ACTIVITY_TABS } from '../utils';

export type ConnectionStatus = 'ok' | 'broken' | 'must_reauth';

/**
 * Connection object in the block editor
 */
export interface EditorConnection {
	enabled: boolean;
	// Customization fields
	message?: string;
	attached_media?: Array< AttachedMedia >;
	media_source?: MediaSourceValue;
}

export type Connection = Partial< EditorConnection > & {
	connection_id: string;
	display_name: string;
	external_handle: string;
	external_id: string;
	profile_link: string;
	profile_picture: string;
	service_label: string;
	service_name: ConnectionService[ 'id' ];
	shared: boolean;
	status: ConnectionStatus;
	template?: string;
	wpcom_user_id: number;
};

export type KeyringResponse = {
	code: 'success' | ( string & {} );
	data: KeyringResult | null;
};

export type ConnectionData = {
	connections: Connection[];
	deletingConnections?: Array< number | string >;
	updatingConnections?: Array< number | string >;
	reconnectingAccount?: Connection;
	keyringResult?: KeyringResult;
	/**
	 * Whether the keyring result for an auth_flow=v2 connect request is being fetched.
	 */
	fetchingKeyringResult?: boolean;
	abortControllers?: Record< string, Array< AbortController > >;
	isConnectionsModalOpen?: boolean;
};

export type JetpackSettings = {
	showNudge?: boolean;
};

export type ShareStatusItem = Pick< Connection, 'profile_link' | 'profile_picture' > & {
	connection_id: number;
	status: 'success' | 'failure';
	message: string;
	timestamp: number;
	service: string;
	external_name: string;
	external_id: string;
};

export type PostShareStatus = {
	shares: Array< ShareStatusItem >;
	done?: boolean;
	/**
	 * Whether an API request is in flight.
	 */
	loading?: boolean;

	/**
	 * Whether the polling is in progress, which includes
	 * - the API request wait time
	 * - the polling interval/delay
	 */
	polling?: boolean;
};

export type ShareStatus = {
	[ PostId: number ]: PostShareStatus;
};

export type SharePost = {
	isSharingCurrentPost?: boolean;
};

export type ScheduledShares = {
	isScheduling?: boolean;
};

export type UnifiedModalData = {
	sharingActivity?: {
		initialTab?: ( typeof SHARING_ACTIVITY_TABS )[ keyof typeof SHARING_ACTIVITY_TABS ];
	};
	socialPreview?: {
		initialTab?: string;
	};
};

export type UnifiedModalState = {
	isOpen?: boolean;
	initialPath?: string;
	isScreenLocked?: boolean;
	data?: UnifiedModalData;
};

export type RenderCount = { [ Key in 'social-preview' | 'edit-template' ]?: number };

/**
 * One rendered batch, indexed by per-connection result. The batch is wrapped in
 * a `RenderedMessageEntry` and keyed in `RenderedMessages` by
 * `${postId}|${hashRenderItems(items)}` so each unique input shape gets its
 * own slot — reverting to a previously-seen shape reads back the original
 * response without refetching.
 */
export type RenderedMessageBatch = {
	[ ConnectionId: string ]: {
		rendered_message?: string;
		error?: { code: string; message: string };
	};
};

/**
 * Per-cache-key entry. `isLoading` is set true by the resolver before the fetch
 * fires and cleared on either success (with `items` populated) or failure
 * (preserving any prior `items`).
 */
export type RenderedMessageEntry = {
	isLoading: boolean;
	items?: RenderedMessageBatch;
};

export type RenderedMessages = {
	[ Key: string ]: RenderedMessageEntry;
};

/**
 * One row in the per-day referrer payload. Shape mirrors what the
 * `stats-app/sites/{id}/stats/referrers` endpoint returns: a `name`
 * (display label), an optional `url` (when the row is a direct
 * referrer rather than a group container), and `total` (the count).
 * Field name is `total` (not `views`) — confirmed by the regression
 * guard in `Stats_Abilities_Test::test_get_top_content_referrers_normalizes_groups_shape`.
 */
export type TrafficReferrerRow = {
	name?: string;
	url?: string;
	total?: number;
	results?: TrafficReferrerRow[];
};

/**
 * Per-day referrer payload. `groups` carries the referrer rows we
 * bucket into per-service series; the timestamp is the local date
 * string the endpoint emits (e.g. `2026-05-15`).
 */
export type TrafficReferrerDay = {
	groups?: TrafficReferrerRow[];
	other_views?: number;
	total_views?: number;
};

export type TrafficInterval = 7 | 30 | 90;

export type TrafficStatsState = {
	interval: TrafficInterval;
	byInterval?: Partial<
		Record<
			TrafficInterval,
			{ loading?: boolean; error?: boolean; days?: Record< string, TrafficReferrerDay > }
		>
	>;
};

export type SocialStoreState = {
	connectionData: ConnectionData;
	shareStatus?: ShareStatus;
	sharePost?: SharePost;
	scheduledShares?: ScheduledShares;
	unifiedModal?: UnifiedModalState;
	renderCount?: RenderCount;
	renderedMessages?: RenderedMessages;
	trafficStats?: TrafficStatsState;
};

export interface KeyringAdditionalUser {
	external_ID: string;
	external_name: string;
	external_profile_picture: string;
}

export interface KeyringResult extends KeyringAdditionalUser {
	ID: number;
	additional_external_users: Array< KeyringAdditionalUser >;
	external_display: string;
	label: string;
	service: string;
	status: ConnectionStatus;
	show_linkedin_warning?: boolean;
}

export type SocialImageGeneratorConfig = {
	enabled: boolean;
	template?: string;
	default_image_id?: number;
	font?: string;
};

export type UtmSettingsConfig = {
	enabled: boolean;
};

export type SocialNotesConfig = {
	append_link: boolean;
	link_format: 'full_url' | 'shortlink' | 'permashortcitation';
};

export type SocialNotesSettings = {
	enabled: boolean;
	config: SocialNotesConfig;
};

export type SocialModuleSettings = {
	publicize: boolean;
};

export type SocialSettingsFields = {
	jetpack_social_image_generator_settings: SocialImageGeneratorConfig;
	jetpack_social_utm_settings: UtmSettingsConfig;
	[ 'jetpack-social-note' ]: boolean;
	jetpack_social_notes_config: SocialNotesConfig;
	[ 'jetpack-social_show_pricing_page' ]: boolean;
	jetpack_social_message_template: string;
};

export type ScheduledShare = {
	id: number;
	blog_id: number;
	connection_id: number;
	message: string;
	post_id: number;
	timestamp: number;
	wpcom_user_id: number;
};

export type SocialImageFontOption = {
	id: string;
	label: string;
};
