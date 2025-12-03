import type { FormResponse } from '../../../types/index.ts';
import type { StoreDescriptor } from '@wordpress/data';

/**
 * Query parameters for the dashboard.
 */
export type QueryParams = {
	search?: string;
	parent?: string;
	before?: string;
	after?: string;
	is_unread?: boolean;
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
		query: Record< string, unknown >,
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

	// Dashboard store actions
	updateCountsOptimistically: (
		status: string,
		newStatus: string,
		count: number,
		queryParams: QueryParams
	) => void;
	doBulkAction: ( ids: string[], action: string ) => void;
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

	// Core store select actions
	getEntityRecord: (
		kind: string,
		name: string,
		recordId: number
	) => Record< string, unknown > | undefined;
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

export type Action = {
	id: string;
	isPrimary: boolean;
	icon: React.ReactNode;
	label: string;
	modalHeader?: string;
	isEligible?: ( item: FormResponse ) => boolean;
	supportsBulk?: boolean;
	callback?: (
		items: FormResponse[],
		{ registry }: { registry: Registry },
		options?: { isUndo?: boolean; targetStatus?: 'publish' | 'spam' | 'trash' }
	) => Promise< void >;
};
