/**
 * External dependencies
 */
import {
	DataViews,
	Stack,
	type Action,
	type Field,
	type SupportedLayouts,
	type View,
} from '@jetpack-premium-analytics/externals';
import {
	WidgetRoot,
	WidgetState,
	usePaginatedView,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import { getDataViewsSource } from './sources';
import styles from './style.module.css';
import type { DataViewsSource } from './sources/types';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

export type DataViewsAttributes = {
	/** Name of the source the instance reads. */
	source?: string;
	/** The view the instance starts from. */
	view?: Partial< View >;
};

type DataViewsRenderAttributes = DataViewsAttributes & Partial< ReportParamsFieldAttributes >;

const PER_PAGE_SIZES = [ 10, 25, 50, 100 ];

const DEFAULT_LAYOUTS: SupportedLayouts = { table: {} };

/**
 * DataViews makes `getItemId` conditionally optional when an item has a string
 * `id`. This alias always requires it, so the generic contract stays stable.
 */
const GenericDataViews = DataViews as unknown as < Item >( props: {
	view: View;
	onChangeView: ( view: View ) => void;
	fields: Field< Item >[];
	data: Item[];
	getItemId: ( item: Item ) => string;
	paginationInfo: { totalItems: number; totalPages: number };
	defaultLayouts?: SupportedLayouts;
	actions?: Action< Item >[];
	search?: boolean;
	searchLabel?: string;
	config?: { perPageSizes: number[] };
} ) => ReturnType< typeof DataViews >;

type DataViewsTableProps< Item > = {
	source: DataViewsSource< Item >;
	initialView?: Partial< View >;
};

/**
 * The rows of a source as a searchable, sortable, paginated table.
 *
 * @param {DataViewsTableProps} props - The component props.
 * @return The table, or the state that stands in for it.
 */
function DataViewsTable< Item >( { source, initialView }: DataViewsTableProps< Item > ) {
	const { reportParams } = useWidgetRootContext();

	const [ pageItems, setPageItems ] = useState< Item[] >( [] );
	const { data, fields, actions, searchLabel, isLoading, isFetching, isError, error } =
		source.useRecords( { reportParams, pageItems } );

	const [ view, setView ] = useState< View >(
		() =>
			( {
				type: 'table',
				page: 1,
				perPage: PER_PAGE_SIZES[ 0 ],
				search: '',
				fields: fields.map( field => field.id ),
				...initialView,
			} ) as View
	);
	const page = usePaginatedView( data, view, fields, setView );

	useEffect( () => {
		// Keep the array when the rows are the same, or what a source loads for them loops this effect.
		setPageItems( previous =>
			previous.length === page.data.length &&
			previous.every( ( item, index ) => item === page.data[ index ] )
				? previous
				: page.data
		);
	}, [ page.data ] );

	return (
		<Stack direction="column">
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ data.length === 0 && isError }
				isEmpty={ data.length === 0 }
				error={ error }
			>
				<div className={ styles.root }>
					<GenericDataViews< Item >
						view={ page.view }
						onChangeView={ setView }
						fields={ fields }
						data={ page.data }
						getItemId={ source.getItemId }
						paginationInfo={ page.paginationInfo }
						defaultLayouts={ DEFAULT_LAYOUTS }
						actions={ actions }
						search={ fields.some( field => field.enableGlobalSearch ) }
						searchLabel={ searchLabel }
						config={ { perPageSizes: PER_PAGE_SIZES } }
					/>
				</div>
			</WidgetState>
		</Stack>
	);
}

/**
 * A wrapper of DataViews: the table of the source the instance names, in the view it carries.
 *
 * @param {WidgetRenderProps} props - The host's props.
 * @return The widget.
 */
export default function DataViewsWidget( {
	attributes = {},
}: WidgetRenderProps< DataViewsRenderAttributes > ) {
	const source = getDataViewsSource( attributes.source );

	return (
		<WidgetRoot attributes={ attributes }>
			{ source ? (
				<DataViewsTable
					key={ attributes.source }
					source={ source }
					initialView={ attributes.view }
				/>
			) : (
				<WidgetState isLoading={ false } isError={ false } isEmpty>
					{ null }
				</WidgetState>
			) }
		</WidgetRoot>
	);
}
