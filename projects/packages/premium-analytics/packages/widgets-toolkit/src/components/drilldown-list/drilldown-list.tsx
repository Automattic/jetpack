/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './drilldown-list.module.scss';
import { processDrilldownGroups } from './process-drilldown-groups';
import type { Field, SupportedLayouts, View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

const DEFAULT_PER_PAGE_SIZES = [ 10, 25, 50, 100 ];
const DEFAULT_LAYOUTS = { table: {} } satisfies SupportedLayouts;
const GROUP_TYPE_FIELD_ID = 'type';

/**
 * One child row inside a drilldown group.
 */
export interface DrilldownListChild {
	id: string;
	label: string;
	value: number;
	/**
	 * Renders the child label as an external link when present.
	 */
	href?: string;
}

/**
 * One grouped row with optional child rows.
 */
export interface DrilldownListGroup {
	id: string;
	label: string;
	value: number;
	children: DrilldownListChild[];
}

/**
 * Props for the reusable drilldown list.
 */
export interface DrilldownListProps {
	groups: DrilldownListGroup[];
	/**
	 * Column caption over the labels, e.g. "Archive pages", "Referrer".
	 */
	labelHeader: string;
	/**
	 * Column caption over the values, e.g. "Views".
	 */
	valueHeader: string;
	searchLabel?: string;
	/**
	 * Shown when no groups match.
	 */
	emptyLabel?: string;
	isLoading?: boolean;
	perPageSizes?: number[];
	/**
	 * Value formatter.
	 */
	formatValue?: ( value: number ) => string;
	/**
	 * Group ids expanded on mount.
	 */
	defaultExpandedIds?: string[];
	/**
	 * Optional filter choices for the hidden group type field.
	 */
	filterElements?: { value: string; label: string }[];
	/**
	 * Resolves a group to one of the optional filter values.
	 */
	getGroupFilterValue?: ( group: DrilldownListGroup ) => string;
}

/**
 * `DataViews`' own `getItemId` prop is conditionally optional on `Item` having
 * an `id: string`, which TypeScript cannot discharge for custom generic props.
 */
const GenericDataViews = DataViews as unknown as < Item >( props: {
	view: View;
	onChangeView: ( view: View ) => void;
	fields: Field< Item >[];
	data: Item[];
	getItemId: ( item: Item ) => string;
	isLoading?: boolean;
	paginationInfo: { totalItems: number; totalPages: number };
	defaultLayouts?: SupportedLayouts;
	config?: { perPageSizes: number[] };
	children?: ReactNode;
} ) => ReturnType< typeof DataViews >;

/**
 * Read the stable DataViews item id from a drilldown group.
 *
 * @param group - The drilldown group.
 * @return The group id.
 */
function getDrilldownGroupId( group: DrilldownListGroup ): string {
	return group.id;
}

/**
 * Format a value with the browser locale.
 *
 * @param value - The numeric value.
 * @return The formatted value.
 */
function formatDefaultValue( value: number ): string {
	return value.toLocaleString();
}

/**
 * Minimal DataViews field config for the drilldown context.
 *
 * @param labelHeader         - The label column caption.
 * @param valueHeader         - The value column caption.
 * @param filterElements      - Optional filter options for the hidden group type field.
 * @param getGroupFilterValue - Optional group filter value resolver.
 * @return The field config.
 */
function getDrilldownFields(
	labelHeader: string,
	valueHeader: string,
	filterElements?: { value: string; label: string }[],
	getGroupFilterValue?: ( group: DrilldownListGroup ) => string
): Field< DrilldownListGroup >[] {
	const fields: Field< DrilldownListGroup >[] = [
		{
			id: 'label',
			label: labelHeader,
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => [ item.label, ...item.children.map( child => child.label ) ],
		},
		{
			id: 'value',
			label: valueHeader,
			getValue: ( { item } ) => item.value,
		},
	];

	if ( filterElements && getGroupFilterValue ) {
		fields.push( {
			id: GROUP_TYPE_FIELD_ID,
			label: __( 'Type', 'jetpack-premium-analytics' ),
			enableHiding: false,
			elements: filterElements,
			filterBy: { operators: [ 'isAny' ] },
			getValue: ( { item } ) => getGroupFilterValue( item ),
		} );
	}

	return fields;
}

/**
 * Expand/collapse chevron for one drilldown group row.
 *
 * @param props          - The component props.
 * @param props.group    - The drilldown group.
 * @param props.expanded - Whether the group is expanded.
 * @param props.onToggle - Toggles a drilldown group by id.
 * @return The toggle button.
 */
function DrilldownGroupToggle( {
	group,
	expanded,
	onToggle,
}: {
	group: DrilldownListGroup;
	expanded: boolean;
	onToggle: ( groupId: string ) => void;
} ): JSX.Element {
	const handleToggle = useCallback( () => onToggle( group.id ), [ onToggle, group.id ] );
	const label = expanded
		? sprintf(
				/* translators: %s: the drilldown group name, e.g. "Search Engines". */
				__( 'Collapse %s', 'jetpack-premium-analytics' ),
				group.label
		  )
		: sprintf(
				/* translators: %s: the drilldown group name, e.g. "Search Engines". */
				__( 'Expand %s', 'jetpack-premium-analytics' ),
				group.label
		  );

	return (
		<Button
			className={ styles.toggleButton }
			icon={ expanded ? chevronUp : chevronDown }
			iconSize={ 16 }
			label={ label }
			aria-expanded={ expanded }
			onClick={ handleToggle }
			size="small"
			variant="tertiary"
		/>
	);
}

/**
 * One drilldown row.
 *
 * @param props             - The component props.
 * @param props.children    - The label cell content.
 * @param props.value       - The row value.
 * @param props.formatValue - Formats row values.
 * @param props.isChild     - Whether the row is an indented child row.
 * @return The row.
 */
function DrilldownRow( {
	children,
	value,
	formatValue,
	isChild = false,
}: {
	children: ReactNode;
	value: number;
	formatValue: ( value: number ) => string;
	isChild?: boolean;
} ): JSX.Element {
	return (
		<div role="row" className={ clsx( styles.row, isChild && styles.childRow ) }>
			<div role="cell" className={ styles.labelCell }>
				{ children }
			</div>
			<div role="cell" className={ styles.value }>
				{ formatValue( value ) }
			</div>
		</div>
	);
}

/**
 * Child row label, optionally rendered as an external link.
 *
 * @param props       - The component props.
 * @param props.child - The child row.
 * @return The child label.
 */
function DrilldownChildLabel( { child }: { child: DrilldownListChild } ): JSX.Element {
	if ( child.href ) {
		return (
			<a className={ styles.childLink } href={ child.href } target="_blank" rel="noreferrer">
				{ child.label }
			</a>
		);
	}

	return <span className={ styles.labelText }>{ child.label }</span>;
}

/**
 * Custom rows for DataViews free composition.
 *
 * @param props               - The component props.
 * @param props.groups        - The visible drilldown groups with children pre-filtered.
 * @param props.expandedIds   - Expanded drilldown group ids.
 * @param props.onToggleGroup - Toggles a drilldown group by id.
 * @param props.childCounts   - Child counts per group id from the full dataset.
 * @param props.isLoading     - Whether the list is loading.
 * @param props.labelHeader   - The label column caption.
 * @param props.valueHeader   - The value column caption.
 * @param props.emptyLabel    - Empty-state message.
 * @param props.formatValue   - Formats row values.
 * @return The drilldown list.
 */
function DrilldownRows( {
	groups,
	expandedIds,
	onToggleGroup,
	childCounts,
	isLoading,
	labelHeader,
	valueHeader,
	emptyLabel,
	formatValue,
}: {
	groups: DrilldownListGroup[];
	expandedIds: ReadonlySet< string >;
	onToggleGroup: ( groupId: string ) => void;
	childCounts: ReadonlyMap< string, number >;
	isLoading: boolean;
	labelHeader: string;
	valueHeader: string;
	emptyLabel: string;
	formatValue: ( value: number ) => string;
} ): JSX.Element {
	if ( ! groups.length && ! isLoading ) {
		return (
			<div role="table" aria-label={ labelHeader } className={ styles.list }>
				<div className={ styles.header } role="row">
					<div role="columnheader">{ labelHeader }</div>
					<div role="columnheader" className={ styles.valueHeader }>
						{ valueHeader }
					</div>
				</div>
				<div className={ styles.empty }>{ emptyLabel }</div>
			</div>
		);
	}

	return (
		<div
			role="table"
			aria-label={ labelHeader }
			className={ clsx( styles.list, isLoading && styles.isLoading ) }
		>
			<div className={ styles.header } role="row">
				<div role="columnheader">{ labelHeader }</div>
				<div role="columnheader" className={ styles.valueHeader }>
					{ valueHeader }
				</div>
			</div>
			{ groups.map( group => {
				const isExpanded = expandedIds.has( group.id ) || group.children.length > 0;
				const hasChildren = ( childCounts.get( group.id ) ?? 0 ) > 0;

				return (
					<div role="rowgroup" key={ group.id }>
						<DrilldownRow value={ group.value } formatValue={ formatValue }>
							<span className={ clsx( styles.labelText, styles.groupLabel ) }>{ group.label }</span>
							{ hasChildren ? (
								<DrilldownGroupToggle
									group={ group }
									expanded={ isExpanded }
									onToggle={ onToggleGroup }
								/>
							) : null }
						</DrilldownRow>
						{ group.children.map( child => (
							<DrilldownRow
								key={ child.id }
								value={ child.value }
								formatValue={ formatValue }
								isChild
							>
								<DrilldownChildLabel child={ child } />
							</DrilldownRow>
						) ) }
					</div>
				);
			} ) }
		</div>
	);
}

/**
 * Generic drill-down list using DataViews free composition.
 *
 * @param props                     - The component props.
 * @param props.groups              - The full drilldown groups.
 * @param props.labelHeader         - The label column caption.
 * @param props.valueHeader         - The value column caption.
 * @param props.searchLabel         - The search input label.
 * @param props.emptyLabel          - Empty-state message.
 * @param props.isLoading           - Whether the list is loading.
 * @param props.perPageSizes        - Available DataViews page sizes.
 * @param props.formatValue         - Formats row values.
 * @param props.defaultExpandedIds  - Group ids expanded on mount.
 * @param props.filterElements      - Optional filter options for the hidden group type field.
 * @param props.getGroupFilterValue - Optional group filter value resolver.
 * @return The drilldown list component.
 */
export function DrilldownList( {
	groups,
	labelHeader,
	valueHeader,
	searchLabel = __( 'Search', 'jetpack-premium-analytics' ),
	emptyLabel = __( 'No results found.', 'jetpack-premium-analytics' ),
	isLoading = false,
	perPageSizes = DEFAULT_PER_PAGE_SIZES,
	formatValue = formatDefaultValue,
	defaultExpandedIds = [],
	filterElements,
	getGroupFilterValue,
}: DrilldownListProps ): JSX.Element {
	const [ view, setView ] = useState< View >( () => ( {
		type: 'table',
		page: 1,
		perPage: perPageSizes[ 0 ] ?? DEFAULT_PER_PAGE_SIZES[ 0 ],
		search: '',
		fields: [ 'label', 'value' ],
	} ) );
	const [ expandedIds, setExpandedIds ] = useState< Set< string > >(
		() => new Set( defaultExpandedIds )
	);
	const fields = useMemo(
		() => getDrilldownFields( labelHeader, valueHeader, filterElements, getGroupFilterValue ),
		[ labelHeader, valueHeader, filterElements, getGroupFilterValue ]
	);
	const { groups: visibleGroups, paginationInfo } = useMemo(
		() => processDrilldownGroups( groups, view, expandedIds, getGroupFilterValue ),
		[ groups, view, expandedIds, getGroupFilterValue ]
	);
	const childCounts = useMemo(
		() => new Map( groups.map( group => [ group.id, group.children.length ] ) ),
		[ groups ]
	);
	const handleToggleGroup = useCallback( ( groupId: string ) => {
		setExpandedIds( current => {
			const next = new Set( current );

			if ( next.has( groupId ) ) {
				next.delete( groupId );
			} else {
				next.add( groupId );
			}

			return next;
		} );
	}, [] );

	return (
		<div className={ styles.root }>
			<GenericDataViews< DrilldownListGroup >
				view={ view }
				onChangeView={ setView }
				fields={ fields }
				data={ visibleGroups }
				getItemId={ getDrilldownGroupId }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ DEFAULT_LAYOUTS }
				config={ { perPageSizes } }
			>
				<div className={ styles.toolbar }>
					<div className={ styles.toolbarLeft }>
						<DataViews.Search label={ searchLabel } />
						<DataViews.FiltersToggle />
					</div>
					<div className={ styles.toolbarRight }>
						<DataViews.ViewConfig />
					</div>
				</div>
				<DataViews.FiltersToggled
					className={ clsx( 'dataviews-filters__container', styles.filtersToggled ) }
				/>
				<DrilldownRows
					groups={ visibleGroups }
					expandedIds={ expandedIds }
					onToggleGroup={ handleToggleGroup }
					childCounts={ childCounts }
					isLoading={ isLoading }
					labelHeader={ labelHeader }
					valueHeader={ valueHeader }
					emptyLabel={ emptyLabel }
					formatValue={ formatValue }
				/>
				<div className={ styles.pagination }>
					<DataViews.Pagination />
				</div>
			</GenericDataViews>
		</div>
	);
}
