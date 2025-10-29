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
};

/**
 * Store actions
 */
type Registry = {
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
			recordId: string,
			query: Record< string, unknown >,
			options?: { throwOnError?: boolean }
		) => Promise< void >;
		editEntityRecord: (
			kind: string,
			name: string,
			recordId: string,
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
		markRecordsAsInvalid: ( ids: string[] ) => void;
	};
	select: ( store: StoreDescriptor ) => {
		// Dashboard store select actions
		getCurrentQuery: () => QueryParams;

		// Core store select actions
		getEntityRecord: (
			kind: string,
			name: string,
			recordId: string
		) => Record< string, unknown > | undefined;
	};
};

type Item = {
	id: string;
	status: string;
	edit_form_url: string;
	is_unread: boolean;
};

export type Action = {
	id: string;
	isPrimary: boolean;
	icon: React.ReactNode;
	label: string;
	modalHeader?: string;
	isEligible?: ( item: Item ) => boolean;
	supportsBulk?: boolean;
	callback?: ( items: Item[], { registry }: { registry: Registry } ) => Promise< void >;
};
