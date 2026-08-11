import type { FormResponse } from '../../../types/index.ts';
import type { IconType } from '@wordpress/components';
import type { StoreDescriptor } from '@wordpress/data';

/**
 * Query parameters for the dashboard.
 */
export type QueryParams = {
	search?: string;
	parent?: string;
	source?: string;
	before?: string;
	after?: string;
	is_unread?: boolean;
	is_test?: boolean;
	per_page?: number;
	page?: number;
	status?: string;
};

/**
 * Notice options for createSuccessNotice and createErrorNotice
 */
export type NoticeOptions = {
	type?: string;
	id?: string;
	actions?: { label: string; onClick: () => void }[];
	icon?: React.ReactNode;
};

/**
 * Combined dispatch actions type
 */
export type DispatchActions = {
	// Notices store actions
	createSuccessNotice: ( message: string, options: NoticeOptions ) => void;
	createErrorNotice: ( message: string, options: NoticeOptions ) => void;
	createInfoNotice: ( message: string, options: NoticeOptions ) => void;
	removeNotice: ( id: string ) => void;

	// Core store actions
	saveEntityRecord: (
		kind: string,
		name: string,
		record: Record< string, unknown >
	) => Promise< void >;
	deleteEntityRecord: (
		kind: string,
		name: string,
		recordId: number,
		query?: Record< string, unknown >,
		options?: { throwOnError?: boolean }
	) => Promise< void >;
	editEntityRecord: (
		kind: string,
		name: string,
		recordId: number,
		edits: Record< string, unknown >
	) => Promise< void >;
	receiveEntityRecords: (
		kind: string,
		name: string,
		records: FormResponse[],
		query?: QueryParams,
		invalidateCache?: boolean
	) => void;
	invalidateResolution: ( selector: string, args: unknown[] ) => void;
	invalidateResolutionForStoreSelector: ( selector: string ) => void;

	// Dashboard store actions
	updateCountsOptimistically: (
		status: string,
		newStatus: string,
		count: number,
		queryParams?: QueryParams
	) => void;
	doBulkAction: ( ids: string[], action: string ) => Promise< void >;
	invalidateFilters: () => void;
	invalidateCounts: () => void;
	markRecordsAsInvalid: ( ids: number[] ) => void;
	setCurrentQuery: ( queryParams: QueryParams ) => void;
	addPendingAction: ( actionId: string ) => void;
	removePendingAction: ( actionId: string ) => void;
};

/**
 * Combined select actions type
 */
export type SelectActions = {
	// Dashboard store select actions
	getCurrentQuery: () => QueryParams;
	getTrashCount: ( queryParams: QueryParams ) => number;
	getSpamCount: ( queryParams: QueryParams ) => number;
	getInboxCount: ( queryParams: QueryParams ) => number;
	getCounts: () => { inbox: number; spam: number; trash: number };

	// Core store select actions
	getEntityRecord: (
		kind: string,
		name: string,
		recordId: number
	) => Record< string, unknown > | undefined;
	isResolving: ( selector: string, args: unknown[] ) => boolean;
};

export type ResolveSelectActions = {
	getEntityRecords: (
		kind: string,
		name: string,
		query?: QueryParams
	) => Promise< FormResponse[] | null >;
};

/**
 * Store actions
 */
export type Registry = {
	dispatch: ( store: StoreDescriptor ) => DispatchActions;
	select: ( store: StoreDescriptor ) => SelectActions;
	resolveSelect: ( store: StoreDescriptor ) => ResolveSelectActions;
};

/**
 * Outcome of an action, so callers can tell a successful run from a failed one.
 *
 * The status-changing actions already track this internally to decide which
 * optimistic updates to roll back; reporting it lets callers that keep the user
 * in place (e.g. the standalone single response page) avoid acting on a change
 * the server rejected. Callers that don't care — such as the responses list,
 * which relies on the notices and optimistic updates — can ignore it.
 */
export type ActionResult = {
	/** Number of items the server confirmed. */
	itemsUpdated: number;
	/** Number of items whose request failed. */
	numberOfErrors: number;
};

export type ActionCallback< Result extends ActionResult | void = ActionResult | void > = (
	items: FormResponse[],
	{ registry }: { registry: Registry },
	options?: { isUndo?: boolean; targetStatus?: 'publish' | 'spam' | 'trash' }
) => Promise< Result >;

export type Action = {
	id: string;
	isPrimary: boolean;
	icon: IconType;
	label: string;
	modalHeader?: string;
	isEligible?: ( item: FormResponse ) => boolean;
	supportsBulk?: boolean;
	callback?: ActionCallback;
};

/**
 * An action whose callback must report its outcome on every terminal path.
 *
 * Callers that keep the user in place decide what to do next from the returned
 * result — the single response page only repairs the store, or navigates away
 * after a delete, once the server has confirmed the change. Under the looser
 * `ActionResult | void` type, an action that grew a success path with a bare
 * `return` would silently be read as "did nothing", quietly reinstating the
 * field-flattening bug with no type error and no failing test. Requiring the
 * result here turns that into a compile error instead.
 *
 * `markAsRead` / `markAsUnread` deliberately keep the looser `Action` type: no
 * caller inspects their result, and they have bare returns today.
 */
export type ReportingAction = Omit< Action, 'callback' > & {
	callback: ActionCallback< ActionResult >;
};
