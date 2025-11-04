import type { FormResponse } from '../../../types';
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
};

/**
 * Store actions
 */
export type Registry = {
	dispatch: ( store: StoreDescriptor ) => {
		// Notices store actions
		createSuccessNotice: (
			message: string,
			options: { type?: string; id?: string; actions?: { label: string; onClick: () => void }[] }
		) => void;
		createErrorNotice: (
			message: string,
			options: { type?: string; id?: string; actions?: { label: string; onClick: () => void }[] }
		) => void;

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
	};
	select: ( store: StoreDescriptor ) => {
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
};

export type Action = {
	id: string;
	isPrimary: boolean;
	icon: React.ReactNode;
	label: string;
	modalHeader?: string;
	isEligible?: ( item: FormResponse ) => boolean;
	supportsBulk?: boolean;
	callback?: ( items: FormResponse[], { registry }: { registry: Registry } ) => Promise< void >;
};
