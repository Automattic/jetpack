/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __, _n, isRTL, sprintf } from '@wordpress/i18n';
import { chevronDownSmall, chevronLeftSmall, chevronRightSmall } from '@wordpress/icons';
import { Badge } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './dataviews-drilldown-table.module.scss';
import { processTreeRows } from './process-tree-rows';
import type { TreeRow } from './process-tree-rows';
import type { DataViewRenderFieldProps, Field, SupportedLayouts, View } from '@wordpress/dataviews';
import type { ComponentType, CSSProperties, ReactNode } from 'react';

const DEFAULT_PER_PAGE_SIZES = [ 10, 25, 50, 100 ];

type PaginationInfo = {
	totalItems: number;
	totalPages: number;
};

type TreeFieldRenderOptions< Item > = {
	field: Field< Item >;
	getItemId: ( item: Item ) => string;
	rowMetaById: ReadonlyMap< string, TreeRow< Item > >;
	expandedIds: ReadonlySet< string >;
	showHierarchyBadge: boolean;
	onToggle: ( id: string ) => void;
};

/**
 * `DataViews`' own `getItemId` prop is conditionally optional on `Item` having
 * an `id: string`, which TypeScript cannot discharge for an unresolved
 * generic. This table always requires `getItemId`, so erase the conditional
 * behind an alias that reflects that.
 */
const GenericDataViews = DataViews as unknown as < Item >( props: {
	view: View;
	onChangeView: ( view: View ) => void;
	fields: Field< Item >[];
	data: Item[];
	getItemId: ( item: Item ) => string;
	isLoading?: boolean;
	paginationInfo: PaginationInfo;
	defaultLayouts?: SupportedLayouts;
	empty?: ReactNode;
	searchLabel?: string;
	config?: { perPageSizes: number[] };
} ) => ReturnType< typeof DataViews >;

export interface DataViewsDrilldownTableProps< Item > {
	/** Flat rows: parents and children mixed; children carry a parent id. */
	data: Item[];
	/**
	 * DataViews field config. The first field in the view's field list gets
	 * the tree toggle and indentation rendered before its own content.
	 */
	fields: Field< Item >[];
	/** Stable id per row. */
	getItemId: ( item: Item ) => string;
	/** Returns the parent row id for child rows, undefined for parent rows. */
	getItemParentId: ( item: Item ) => string | number | null | undefined;
	/** Initial view overrides (default sort, visible fields, page size, ...). */
	initialView?: Partial< View >;
	/**
	 * Expand parent rows by default. Rows the user collapses manually stay
	 * collapsed across data changes.
	 */
	expandChildren?: boolean;
	/** Show a badge with the number of direct children on parent rows. */
	showHierarchyBadge?: boolean;
	/** Show DataViews' loading state. */
	isLoading?: boolean;
	/** Accessible label for the search input. */
	searchLabel?: string;
	/** Custom empty state. */
	empty?: ReactNode;
	/** Page size choices. */
	perPageSizes?: number[];
}

/**
 * Read a field value from an item, falling back to the item property that
 * matches the field id when the DataViews field does not define getValue.
 *
 * @param item  - The row item.
 * @param field - The DataViews field config.
 * @return The raw field value.
 */
function getFieldValue< Item >( item: Item, field: Field< Item > ): unknown {
	if ( field.getValue ) {
		return field.getValue( { item } );
	}

	return ( item as Record< string, unknown > )[ field.id ];
}

/**
 * Render a consumer field, using DataViews' default value fallback when the
 * field does not define a custom render component.
 *
 * @param props       - The DataViews render props.
 * @param renderField - The consumer field render component.
 * @param field       - The original DataViews field config.
 * @return The rendered field content.
 */
function renderFieldContent< Item >(
	props: DataViewRenderFieldProps< Item >,
	renderField: ComponentType< DataViewRenderFieldProps< Item > > | undefined,
	field: Field< Item >
): ReactNode {
	if ( renderField ) {
		const FieldRender = renderField;

		return <FieldRender { ...props } />;
	}

	return <>{ String( getFieldValue( props.item, field ) ?? '' ) }</>;
}

/**
 * Resolve the hierarchy toggle icon, matching the upstream DataViews tree
 * hierarchy: a small right chevron when collapsed (left in RTL), a small down
 * chevron when expanded.
 *
 * @param expanded - Whether the parent row is expanded.
 * @return The toggle icon.
 */
function getHierarchyIcon( expanded: boolean ): JSX.Element {
	if ( expanded ) {
		return chevronDownSmall;
	}

	return isRTL() ? chevronLeftSmall : chevronRightSmall;
}

/**
 * Create a DataViews field render component with tree affordances: a leading
 * expand/collapse chevron (or an alignment placeholder), depth indentation,
 * and an optional direct-child-count badge.
 *
 * @param options - The tree field render options.
 * @return A DataViews field render component.
 */
function createTreeFieldRender< Item >( options: TreeFieldRenderOptions< Item > ) {
	const { field, getItemId, rowMetaById, expandedIds, showHierarchyBadge, onToggle } = options;
	const renderField = field.render;

	/**
	 * Render one tree-aware field cell.
	 *
	 * @param props - The DataViews render props.
	 * @return The field cell.
	 */
	function TreeFieldRender( props: DataViewRenderFieldProps< Item > ): JSX.Element {
		const content = renderFieldContent( props, renderField, field );
		const id = getItemId( props.item );
		const row = rowMetaById.get( id );
		const depth = row?.depth ?? 0;
		const childCount = row?.childCount ?? 0;
		const expanded = expandedIds.has( id );
		const labelValue = String( getFieldValue( props.item, field ) ?? '' );
		const label = expanded
			? sprintf(
					/* translators: %s: the parent row label. */
					__( 'Collapse %s', 'jetpack-premium-analytics' ),
					labelValue
			  )
			: sprintf(
					/* translators: %s: the parent row label. */
					__( 'Expand %s', 'jetpack-premium-analytics' ),
					labelValue
			  );
		const cellStyle = {
			'--dataviews-drilldown-table-level': depth,
		} as CSSProperties;

		return (
			<span className={ styles.treeCell } style={ cellStyle }>
				{ childCount > 0 ? (
					<Button
						className={ styles.toggle }
						icon={ getHierarchyIcon( expanded ) }
						label={ label }
						aria-expanded={ expanded }
						onClick={ () => onToggle( id ) }
						size="small"
					/>
				) : (
					<span className={ styles.togglePlaceholder } aria-hidden="true" />
				) }
				<span className={ styles.treeCellContent }>{ content }</span>
				{ showHierarchyBadge && childCount > 0 && (
					<Badge
						intent="none"
						className={ styles.badge }
						aria-label={ sprintf(
							/* translators: %d: number of direct child rows. */
							_n( '%d child', '%d children', childCount, 'jetpack-premium-analytics' ),
							childCount
						) }
					>
						{ childCount.toString() }
					</Badge>
				) }
			</span>
		);
	}

	return TreeFieldRender;
}

/**
 * Render a controlled DataViews table over flat parent/child rows with tree
 * affordances on the first visible field, matching the upstream DataViews
 * tree hierarchy (WordPress/gutenberg#77905): a leading chevron toggles the
 * drill-down, child rows indent by depth, and search, filters, sorting, and
 * pagination keep DataViews' flat semantics.
 *
 * @param props                    - The component props.
 * @param props.data               - Flat rows: parents and children mixed.
 * @param props.fields             - The DataViews field config.
 * @param props.getItemId          - Resolves stable row ids.
 * @param props.getItemParentId    - Resolves parent ids for child rows.
 * @param props.initialView        - Initial view overrides.
 * @param props.expandChildren     - Expand parent rows by default.
 * @param props.showHierarchyBadge - Show direct-child-count badges.
 * @param props.isLoading          - Show DataViews' loading state.
 * @param props.searchLabel        - Accessible label for the search input.
 * @param props.empty              - Custom empty state.
 * @param props.perPageSizes       - Page size choices.
 * @return The DataViews drilldown.
 */
export function DataViewsDrilldownTable< Item >( {
	data,
	fields,
	getItemId,
	getItemParentId,
	initialView,
	expandChildren = false,
	showHierarchyBadge = true,
	isLoading = false,
	searchLabel,
	empty,
	perPageSizes = DEFAULT_PER_PAGE_SIZES,
}: DataViewsDrilldownTableProps< Item > ) {
	const [ view, setView ] = useState< View >(
		() =>
			( {
				type: 'table',
				page: 1,
				perPage: perPageSizes[ 0 ] ?? 10,
				search: '',
				fields: fields.map( field => field.id ),
				...initialView,
			} ) as View
	);
	const [ expandedIds, setExpandedIds ] = useState< Set< string > >( () => new Set() );
	const manuallyCollapsedIdsRef = useRef< Set< string > >( new Set() );

	const handleToggle = useCallback(
		( id: string ) => {
			setExpandedIds( currentExpandedIds => {
				const nextExpandedIds = new Set( currentExpandedIds );

				if ( nextExpandedIds.has( id ) ) {
					nextExpandedIds.delete( id );

					if ( expandChildren ) {
						manuallyCollapsedIdsRef.current.add( id );
					}
				} else {
					nextExpandedIds.add( id );
					manuallyCollapsedIdsRef.current.delete( id );
				}

				return nextExpandedIds;
			} );
		},
		[ expandChildren ]
	);

	const {
		rows,
		data: pageData,
		treeRows,
		paginationInfo,
	} = useMemo(
		() =>
			processTreeRows( data, view, expandedIds, {
				getItemId,
				getItemParentId,
				fields,
			} ),
		[ data, expandedIds, fields, getItemId, getItemParentId, view ]
	);

	// With expandChildren, newly appearing parent rows start expanded — except
	// the ones the user collapsed manually, which stay collapsed.
	useEffect( () => {
		if ( ! expandChildren ) {
			return;
		}

		setExpandedIds( currentExpandedIds => {
			const nextExpandedIds = new Set( currentExpandedIds );
			let hasChanges = false;

			for ( const treeRow of treeRows ) {
				if (
					treeRow.childCount &&
					! manuallyCollapsedIdsRef.current.has( treeRow.id ) &&
					! nextExpandedIds.has( treeRow.id )
				) {
					nextExpandedIds.add( treeRow.id );
					hasChanges = true;
				}
			}

			return hasChanges ? nextExpandedIds : currentExpandedIds;
		} );
	}, [ expandChildren, treeRows ] );

	const rowMetaById = useMemo( () => new Map( rows.map( row => [ row.id, row ] ) ), [ rows ] );

	const renderedFields = useMemo( () => {
		const treeFieldId = view.fields?.[ 0 ];

		if ( ! treeFieldId ) {
			return fields;
		}

		return fields.map( field => {
			if ( field.id !== treeFieldId ) {
				return field;
			}

			return {
				...field,
				render: createTreeFieldRender( {
					field,
					getItemId,
					rowMetaById,
					expandedIds,
					showHierarchyBadge,
					onToggle: handleToggle,
				} ),
			};
		} );
	}, [
		expandedIds,
		fields,
		getItemId,
		handleToggle,
		rowMetaById,
		showHierarchyBadge,
		view.fields,
	] );

	return (
		<div className={ styles.root }>
			<GenericDataViews< Item >
				view={ view }
				onChangeView={ setView }
				fields={ renderedFields }
				data={ pageData }
				getItemId={ getItemId }
				isLoading={ isLoading }
				paginationInfo={ paginationInfo }
				defaultLayouts={ { table: {} } }
				empty={ empty }
				searchLabel={ searchLabel }
				config={ { perPageSizes } }
			/>
		</div>
	);
}
