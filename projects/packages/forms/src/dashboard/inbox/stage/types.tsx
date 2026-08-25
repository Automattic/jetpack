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
		// Collection queries carry keys beyond the dashboard's own filters (e.g.
		// `include`, `fields_format`), so this is wider than `QueryParams`.
		query?: QueryParams | Record< string, unknown >,
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
	isDestructive?: boolean;
	callback?: ActionCallback;
};

/**
 * An action whose callback is expected to report its outcome on every terminal path.
 *
 * Callers that keep the user in place gate on the result, so a success path that
 * forgot to return one reads as "did nothing" — the repair is skipped and the badge
 * goes stale.
 *
 * This documents intent more than it enforces it. The shared tsconfig sets
 * `strict: false`, so with `strictNullChecks` off a callback that returns a result
 * on some paths and falls through on another still satisfies this type; only a
 * callback whose every path is void is rejected. Enabling `strictNullChecks` +
 * `noImplicitReturns` for this package would close the gap.
 *
 * `markAsRead` / `markAsUnread` keep the looser `Action`: nothing inspects their
 * result.
 */
export type ReportingAction = Omit< Action, 'callback' > & {
	callback: ActionCallback< ActionResult >;
};
