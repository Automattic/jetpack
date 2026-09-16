import type { ConnectionOwner } from '../../types.ts';
import type { ReactElement } from 'react';

// Part of this hook's public result contract, so re-export it: the package
// barrel forwards this module's types to consumers.
export type { ConnectionOwner };

export interface ConnectionErrorData {
	action?: string;
	action_label?: string;
	action_variant?: 'primary' | 'secondary';
	action_url?: string;
	tracking_event?: string;
	secondary_action?: string;
	secondary_action_url?: string;
	secondary_action_label?: string;
	secondary_action_variant?: 'primary' | 'secondary';
	secondary_tracking_event?: string;
	/** When true, the notice appends a "Contact Jetpack Support" link, e.g. because a reconnect may not fix it. */
	support_link?: boolean;
	/**
	 * A presentational link the notice offers alongside (or instead of) the CTA,
	 * e.g. Site Health for a blocked-request error. Set server-side from
	 * `Error_Handler`'s `notice_link` display config.
	 */
	notice_link?: { label: string; url: string };
	[ key: string ]: unknown;
}

/**
 * Who a connection error is relevant to:
 * - `site`: blog-token / site-wide errors.
 * - `owner`: errors tied to the connection owner's user token.
 * - `user`: errors tied to another specific user's token.
 */
export type ConnectionErrorAudience = 'site' | 'owner' | 'user';

export interface ConnectionErrorObject {
	error_message: string;
	error_code?: string;
	user_id?: string;
	error_type?: string;
	error_data?: ConnectionErrorData;
	/** Optional audience metadata; readers must treat a missing value as site-wide. */
	audience?: ConnectionErrorAudience;
	[ key: string ]: unknown;
}

/**
 * The shape of connectionErrors from the store: a nested object keyed by error code, then user ID.
 */
export type ConnectionErrorMap = Record< string, Record< string, ConnectionErrorObject > >;

export interface Action {
	label: string;
	onClick: () => void;
	isLoading?: boolean;
	loadingText?: string;
	variant?: 'primary' | 'secondary';
}

/**
 * Initiates a connection restore (or reconnect when restore is not possible).
 * Returns the underlying API request promise.
 */
export type RestoreConnection = ( autoReconnectUser?: boolean ) => Promise< unknown >;

export interface ConnectionErrorProps {
	actionHandlers?: Record< string, ( error: ConnectionErrorObject ) => void >;
	trackingCallback?: ( ( event: string, data: object ) => void ) | null;
	customActions?:
		| ( (
				error: ConnectionErrorObject,
				helpers: {
					restoreConnection: RestoreConnection;
					isRestoringConnection: boolean;
				}
		  ) => Action[] )
		| null;
	/** Tracking event fired when the fallback "Restore Connection" CTA is clicked. */
	reconnectTrackingEvent?: string;
	/** Navigation handler for URL-based actions. Defaults to setting `window.location.href`. */
	navigate?: ( url: string ) => void;
	/** Optional feature-supplied context line rendered above the shared cause/action. */
	context?: string | ReactElement;
	/** Opt in to surfacing connection *health-check* failures. */
	includeHealthErrors?: boolean;
}

/**
 * Identity of the person looking at the notice, used to phrase an error's scope
 * from their point of view ("Your account" vs "Another user's account").
 */
export type ConnectionErrorViewer = {
	/** The viewer's local WordPress user ID, if known. */
	currentUserId?: number;
	/** Whether the viewer is the connection owner. */
	isOwner?: boolean;
	/** The connection owner's display name, if the viewer is allowed to see it. */
	ownerName?: string;
};

/**
 * One rendered detail line, standing for one or more errors.
 */
export type ConnectionErrorDetailLine = {
	/** Stable key for rendering. */
	key: string;
	/** The line to display. */
	text: string;
};

/**
 * A presentational link an error asks the notice to offer, alongside (or instead
 * of) its CTA. Declared server-side in `Error_Handler`'s display config — for
 * example the Site Health link on a blocked-request error, where Site Health
 * holds the diagnosis a reconnect cannot provide.
 */
export type ConnectionErrorNoticeLink = {
	/** The link text. */
	label: string;
	/** Where it points. */
	url: string;
};

/**
 * A set of errors that share one headline message.
 */
export type ConnectionErrorGroup = {
	/** The shared headline, rendered once for the whole group. */
	message: string;
	/** The errors it covers, each still carrying its own scope and code. */
	errors: ConnectionErrorObject[];
	/**
	 * The deduplicated scope lines to render beneath the headline. Empty when the
	 * title already names the scope, so it is never stated twice.
	 */
	detailLines: ConnectionErrorDetailLine[];
	/**
	 * Presentational links this group's errors ask for, e.g. Site Health for a
	 * blocked-request error. Rendered directly beneath this group, not pooled
	 * with other groups' links — with more than one error group on screen, a
	 * link floating after all of them reads as belonging to the wrong one (or to
	 * none in particular). Deduplicated by URL.
	 */
	noticeLinks: ConnectionErrorNoticeLink[];
};

/**
 * The return shape of `useConnectionErrorNotice` — the package's stable,
 * public data contract for connection-error consumers.
 */
export interface UseConnectionErrorNoticeResult {
	/**
	 * Whether there is an error worth surfacing to this viewer — true exactly when
	 * `displayableErrors` is non-empty, so a consumer gating its notice chrome on
	 * this never wraps an empty notice.
	 */
	hasConnectionError: boolean;
	/** The effective error's message, if any. */
	connectionErrorMessage: string | undefined;
	/** The full effective error object (with `error_type`, `error_data`, etc.). */
	connectionError: ConnectionErrorObject | undefined;
	/** All errors from the store, for advanced use cases. */
	connectionErrors: ConnectionErrorMap;
	/** Resolved, ready-to-render CTA actions for the effective error. */
	actions: Action[];
	/** Initiates a connection restore (or reconnect when restore is not possible). */
	restoreConnection: RestoreConnection;
	/** Whether a connection restore is currently in progress. */
	isRestoringConnection: boolean;
	/** The restore error message, if the last restore attempt failed. */
	restoreConnectionError: string | null;
	/** The connection owner of record. Derived server-side from the `master_user`. */
	connectionOwner: ConnectionOwner | null;
	/** Whether the current viewer is the owner of record. */
	isCurrentUserConnectionOwner: boolean;
	/**
	 * Every error worth showing this viewer: the store's map flattened, minus the
	 * ones belonging to other users. Empty when there is nothing to render.
	 */
	displayableErrors: ConnectionErrorObject[];
	/** The notice title: names the scope for a single error, counts them otherwise. */
	errorTitle: string;
	/**
	 * The displayable errors grouped by shared message, each group carrying its
	 * deduplicated scope lines. This is what a notice renders as its body.
	 */
	errorGroups: ConnectionErrorGroup[];
	/** Whether the notice should offer a "Contact Jetpack Support" link. */
	showSupportLink: boolean;
	/** Who the notice is being phrased for, as derived from the connection data. */
	viewer: ConnectionErrorViewer;
	/**
	 * The viewer's local WordPress user ID, so consumers can tell an error that is
	 * theirs from one belonging to another user without subscribing to the store
	 * a second time. Undefined when the connection data has not loaded.
	 */
	currentUserId: number | undefined;
}
