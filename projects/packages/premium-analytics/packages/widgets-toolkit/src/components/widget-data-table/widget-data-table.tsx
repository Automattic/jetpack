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
import { usePaginatedView } from '@jetpack-premium-analytics/ui';
import { Button } from '@wordpress/components';
import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
/**
 * Internal dependencies
 */
import { WidgetState, resolveWidgetStateError, type WidgetStateError } from '../widget-state';
import './style.scss';
import styles from './style.module.scss';
import type { WidgetStatus } from '../../types';

const PER_PAGE = 10;

const DEFAULT_LAYOUTS: SupportedLayouts = { table: {} };

const SORT_ARROWS = { asc: '↑', desc: '↓' } as const;

export type WidgetDataTableProps< Item > = {
	/**
	 * Every row of the report: the table searches, sorts and paginates them.
	 */
	data: Item[];
	/**
	 * DataViews field definitions. One with `enableGlobalSearch` turns the search on, and a
	 * sortable one sorts from its header.
	 */
	fields: Field< Item >[];
	/**
	 * Stable identifier for a row.
	 */
	getItemId: ( item: Item ) => string;
	/**
	 * Request state, from the widget's data hook.
	 */
	status: WidgetStatus;
	/**
	 * Error copy and actions, as `describeError()` builds them. Omit for the generic
	 * message with a Retry bound to `status.refetch`.
	 */
	error?: WidgetStateError;
	/**
	 * The view the table starts from: title and media fields, columns, sort, page size.
	 */
	initialView?: Partial< View >;
	/**
	 * Row actions; each one's `isEligible` decides which rows offer it.
	 */
	actions?: Action< Item >[];
	/**
	 * Accessible label for the search input.
	 */
	searchLabel?: string;
	/**
	 * Called with the rows on screen each time they change, for what a widget loads row by row.
	 */
	onChangePageItems?: ( items: Item[] ) => void;
};

/**
 * A records table widget body: Core DataViews over the rows of a report, searched, sorted and
 * paginated in the client, with the loading, error and empty states.
 *
 * @param {WidgetDataTableProps} props - The component props.
 * @return {JSX.Element} The table, or the state that stands in for it.
 */
export function WidgetDataTable< Item >( props: WidgetDataTableProps< Item > ): JSX.Element {
	// DataViews types `getItemId` by the row type, which stays open in a generic component.
	const {
		data,
		fields,
		getItemId,
		status,
		error,
		initialView,
		actions,
		searchLabel,
		onChangePageItems,
	} = props as unknown as WidgetDataTableProps< unknown >;
	const { isLoading, isFetching, isError, refetch } = status;

	const [ view, setView ] = useState< View >(
		() =>
			( {
				type: 'table',
				page: 1,
				perPage: PER_PAGE,
				search: '',
				fields: fields.map( field => field.id ),
				...initialView,
				layout: { ...initialView?.layout, enableMoving: false },
			} ) as View
	);
	const page = usePaginatedView( data, view, fields, setView );

	const shownItems = useRef< unknown[] >( [] );
	useEffect( () => {
		const shown = shownItems.current;
		// Report the rows only when they change, or what a widget loads for them loops this effect.
		if (
			shown.length === page.data.length &&
			shown.every( ( item, index ) => item === page.data[ index ] )
		) {
			return;
		}

		shownItems.current = page.data;
		onChangePageItems?.( page.data );
	}, [ onChangePageItems, page.data ] );

	// DataViews draws a menu on a column that can sort, hide or filter: its copy of the fields
	// can do none, and a sortable column brings a header button that toggles the direction.
	const tableFields = useMemo(
		() =>
			fields.map( ( field ): Field< unknown > => {
				const header = field.header || field.label || field.id;
				const sort = page.view.sort;
				const isSorted = sort?.field === field.id;

				return {
					...field,
					enableSorting: false,
					enableHiding: false,
					filterBy: false,
					header:
						field.enableSorting === false ? (
							header
						) : (
							<Button
								size="compact"
								variant="tertiary"
								className="dataviews-view-table-header-button"
								onClick={ () =>
									setView( {
										...page.view,
										sort: {
											field: field.id,
											direction: isSorted && sort?.direction === 'desc' ? 'asc' : 'desc',
										},
									} )
								}
							>
								{ header }
								{ isSorted && sort && (
									<span aria-hidden="true">{ SORT_ARROWS[ sort.direction ] }</span>
								) }
							</Button>
						),
				};
			} ),
		[ fields, page.view ]
	);

	const errorState = useMemo( () => resolveWidgetStateError( error, refetch ), [ error, refetch ] );
	const isSearchable = fields.some( field => field.enableGlobalSearch );
	const hasPagination = page.paginationInfo.totalPages > 1;

	return (
		<Stack direction="column" className={ styles.container }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ data.length === 0 && !! isError }
				isEmpty={ data.length === 0 }
				error={ errorState }
			>
				<DataViews
					view={ page.view }
					onChangeView={ setView }
					fields={ tableFields }
					data={ page.data }
					getItemId={ getItemId }
					paginationInfo={ page.paginationInfo }
					defaultLayouts={ DEFAULT_LAYOUTS }
					actions={ actions }
				>
					<DataViews.Layout />

					{ ( isSearchable || hasPagination ) && (
						<Stack
							className={ styles[ 'custom-footer' ] }
							justify={ isSearchable ? 'space-between' : 'end' }
							align="center"
						>
							{ isSearchable && <DataViews.Search label={ searchLabel } /> }
							<DataViews.Pagination />
						</Stack>
					) }
				</DataViews>
			</WidgetState>
		</Stack>
	);
}
