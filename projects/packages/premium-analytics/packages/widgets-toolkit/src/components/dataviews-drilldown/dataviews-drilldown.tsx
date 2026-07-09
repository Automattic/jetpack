/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './dataviews-drilldown.module.scss';
import { processTreeRows } from './process-tree-rows';
import type { DataViewRenderFieldProps, Field, SupportedLayouts, View } from '@wordpress/dataviews';
import type { ComponentType, ReactNode } from 'react';

const DEFAULT_PER_PAGE_SIZES = [ 10, 25, 50, 100 ];

type PaginationInfo = {
	totalItems: number;
	totalPages: number;
};

type TreeFieldRenderOptions< Item > = {
	field: Field< Item >;
	hasChildren: ( item: Item ) => boolean;
	isChild: ( item: Item ) => boolean;
	isExpanded: ( item: Item ) => boolean;
	onToggle: ( item: Item ) => void;
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

export interface DataViewsDrilldownProps< Item > {
	/** Flat rows: parents and children mixed; children carry a parent id. */
	data: Item[];
	/**
	 * DataViews field config. The first field in the view's field list gets
	 * tree affordances wrapped around its own render.
	 */
	fields: Field< Item >[];
	/** Stable id per row. */
	getItemId: ( item: Item ) => string;
	/** Returns the parent row id for child rows, undefined for parent rows. */
	getItemParentId: ( item: Item ) => string | undefined;
	/** Initial view overrides (default sort, visible fields, page size, ...). */
	initialView?: Partial< View >;
	/** Parent ids expanded on mount. */
	defaultExpandedIds?: string[];
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
 * Resolve a plain text label for the tree toggle's accessible name.
 *
 * @param item  - The row item.
 * @param field - The tree field config.
 * @return The label text.
 */
function getToggleLabelValue< Item >( item: Item, field: Field< Item > ): string {
	return String( getFieldValue( item, field ) ?? '' );
}

/**
 * Render the expand/collapse toggle for a parent tree row.
 *
 * @param props           - The component props.
 * @param props.item      - The row item.
 * @param props.field     - The tree field config.
 * @param props.expanded  - Whether the parent row is expanded.
 * @param props.onToggle  - Toggles the parent row.
 * @param props.className - Optional class name.
 * @return The toggle button.
 */
function TreeToggle< Item >( {
	item,
	field,
	expanded,
	onToggle,
	className,
}: {
	item: Item;
	field: Field< Item >;
	expanded: boolean;
	onToggle: ( item: Item ) => void;
	className?: string;
} ): JSX.Element {
	const handleToggle = useCallback( () => onToggle( item ), [ item, onToggle ] );
	const labelValue = getToggleLabelValue( item, field );
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

	return (
		<Button
			className={ className }
			size="small"
			iconSize={ 16 }
			icon={ expanded ? chevronUp : chevronDown }
			label={ label }
			aria-expanded={ expanded }
			onClick={ handleToggle }
		/>
	);
}

/**
 * Create a DataViews field render component with tree affordances.
 *
 * @param options - The tree field render options.
 * @return A DataViews field render component.
 */
function createTreeFieldRender< Item >( options: TreeFieldRenderOptions< Item > ) {
	const { field, hasChildren, isChild, isExpanded, onToggle } = options;
	const renderField = field.render;

	/**
	 * Render one tree-aware field cell.
	 *
	 * @param props - The DataViews render props.
	 * @return The field cell.
	 */
	function TreeFieldRender( props: DataViewRenderFieldProps< Item > ): JSX.Element {
		const content = renderFieldContent( props, renderField, field );

		if ( isChild( props.item ) ) {
			return <span className={ styles.child }>{ content }</span>;
		}

		if ( ! hasChildren( props.item ) ) {
			return <>{ content }</>;
		}

		return (
			<span className={ styles.parent }>
				<span className={ styles.parentContent }>{ content }</span>
				<TreeToggle
					item={ props.item }
					field={ field }
					expanded={ isExpanded( props.item ) }
					onToggle={ onToggle }
					className={ styles.toggle }
				/>
			</span>
		);
	}

	return TreeFieldRender;
}

/**
 * Render a controlled DataViews table over flat parent/child rows with generic
 * tree affordances on the first visible field.
 *
 * @param props                    - The component props.
 * @param props.data               - Flat rows: parents and children mixed.
 * @param props.fields             - The DataViews field config.
 * @param props.getItemId          - Resolves stable row ids.
 * @param props.getItemParentId    - Resolves parent ids for child rows.
 * @param props.initialView        - Initial view overrides.
 * @param props.defaultExpandedIds - Parent ids expanded on mount.
 * @param props.isLoading          - Show DataViews' loading state.
 * @param props.searchLabel        - Accessible label for the search input.
 * @param props.empty              - Custom empty state.
 * @param props.perPageSizes       - Page size choices.
 * @return The DataViews drilldown.
 */
export function DataViewsDrilldown< Item >( {
	data,
	fields,
	getItemId,
	getItemParentId,
	initialView,
	defaultExpandedIds = [],
	isLoading = false,
	searchLabel,
	empty,
	perPageSizes = DEFAULT_PER_PAGE_SIZES,
}: DataViewsDrilldownProps< Item > ) {
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
	const [ expandedIds, setExpandedIds ] = useState< Set< string > >(
		() => new Set( defaultExpandedIds )
	);

	const childParentIds = useMemo( () => {
		const parentIds = new Set< string >();

		for ( const item of data ) {
			const parentId = getItemParentId( item );

			if ( parentId !== undefined ) {
				parentIds.add( parentId );
			}
		}

		return parentIds;
	}, [ data, getItemParentId ] );

	const handleToggle = useCallback(
		( item: Item ) => {
			const id = getItemId( item );

			setExpandedIds( currentExpandedIds => {
				const nextExpandedIds = new Set( currentExpandedIds );

				if ( nextExpandedIds.has( id ) ) {
					nextExpandedIds.delete( id );
				} else {
					nextExpandedIds.add( id );
				}

				return nextExpandedIds;
			} );
		},
		[ getItemId ]
	);

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
					hasChildren: item => childParentIds.has( getItemId( item ) ),
					isChild: item => getItemParentId( item ) !== undefined,
					isExpanded: item => expandedIds.has( getItemId( item ) ),
					onToggle: handleToggle,
				} ),
			};
		} );
	}, [
		childParentIds,
		expandedIds,
		fields,
		getItemId,
		getItemParentId,
		handleToggle,
		view.fields,
	] );

	const { data: pageItems, paginationInfo } = useMemo(
		() =>
			processTreeRows( data, view, expandedIds, {
				getItemId,
				getItemParentId,
				fields,
			} ),
		[ data, expandedIds, fields, getItemId, getItemParentId, view ]
	);

	return (
		<div className={ styles.root }>
			<GenericDataViews< Item >
				view={ view }
				onChangeView={ setView }
				fields={ renderedFields }
				data={ pageItems }
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
