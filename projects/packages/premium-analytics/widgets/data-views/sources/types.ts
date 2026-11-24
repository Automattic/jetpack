/**
 * External dependencies
 */
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { Action, Field } from '@jetpack-premium-analytics/externals';
import type { WidgetStateError } from '@jetpack-premium-analytics/widgets-toolkit';

export interface DataViewsSourceScope< Item > {
	/** The window of the surface the widget sits on. */
	reportParams: ReportParams;
	/** The rows on screen, for what a source loads row by row. */
	pageItems: Item[];
}

export interface DataViewsSourceRecords< Item > {
	/** Every row of the window: the widget searches, sorts and paginates them. */
	data: Item[];
	fields: Field< Item >[];
	actions?: Action< Item >[];
	searchLabel?: string;
	isLoading: boolean;
	isFetching?: boolean;
	isError: boolean;
	error?: WidgetStateError;
}

export interface DataViewsSource< Item > {
	/** Stable identifier for a row. */
	getItemId: ( item: Item ) => string;
	/** A hook: the widget calls it on every render. */
	useRecords: ( scope: DataViewsSourceScope< Item > ) => DataViewsSourceRecords< Item >;
}
