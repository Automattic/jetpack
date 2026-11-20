/**
 * Keeps Search blocks out of the legacy Overlay's widget area, where they cannot load.
 */
import { Warning, store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const isSearchBlock = name => name.startsWith( 'jetpack-search/' );

/**
 * The widget area block a client ID sits in, if the editor has one.
 *
 * @param {?string} clientId  - Block or insertion root client ID.
 * @param {object}  selectors - Block editor selectors.
 * @return {?object} The `core/widget-area` block, or undefined.
 */
function widgetAreaOf( clientId, selectors ) {
	if ( ! clientId ) {
		return undefined;
	}
	return [ clientId, ...selectors.getBlockParentsByBlockName( clientId, 'core/widget-area' ) ]
		.map( id => selectors.getBlock( id ) )
		.find( block => block?.name === 'core/widget-area' );
}

/**
 * Whether an insertion point sits in the given widget area.
 *
 * @param {string}  areaId       - Sidebar ID of the widget area.
 * @param {?string} rootClientId - Client ID the block would be inserted into.
 * @param {object}  selectors    - Block editor selectors bound to the inserting editor.
 * @return {boolean} True if the insertion point is in that widget area.
 */
function isInsertingInto( areaId, rootClientId, selectors ) {
	const widgetArea = widgetAreaOf( rootClientId, selectors );
	if ( widgetArea ) {
		return widgetArea.attributes?.id === areaId;
	}
	// The Customizer gives each sidebar its own editor with no widget-area block, and only the open section can insert.
	return window.wp?.customize?.section?.( `sidebar-widgets-${ areaId }` )?.expanded?.() === true;
}

/**
 * Whether a block sits in the given widget area.
 *
 * @param {string} areaId    - Sidebar ID of the widget area.
 * @param {string} clientId  - Client ID of the block.
 * @param {object} selectors - Block editor selectors.
 * @return {boolean} True if the block is in that widget area.
 */
function isPlacedIn( areaId, clientId, selectors ) {
	const widgetArea = widgetAreaOf( clientId, selectors );
	if ( widgetArea ) {
		return widgetArea.attributes?.id === areaId;
	}
	// The Customizer has no widget-area block, so match the block's widget against the sidebar's saved widget list.
	const topLevelClientId = selectors.getBlockParents( clientId )[ 0 ] ?? clientId;
	const widgetId = selectors.getBlockAttributes( topLevelClientId )?.__internalWidgetId;
	const areaWidgets = window.wp?.customize?.( `sidebars_widgets[${ areaId }]` )?.get?.();
	return Boolean( widgetId ) && Array.isArray( areaWidgets ) && areaWidgets.includes( widgetId );
}

/**
 * Stands in for a Search block that sits in the Overlay's widget area.
 *
 * @param {object} props          - Component props.
 * @param {string} props.clientId - Client ID of the block.
 * @return {Element} The warning.
 */
function OverlayWidgetAreaWarning( { clientId } ) {
	const { removeBlock } = useDispatch( blockEditorStore );
	return (
		<div { ...useBlockProps() }>
			<Warning
				actions={ [
					<Button
						key="remove"
						__next40pxDefaultSize
						variant="primary"
						onClick={ () => removeBlock( clientId ) }
					>
						{ __( 'Remove block', 'jetpack-search-pkg' ) }
					</Button>,
				] }
			>
				{ __(
					'Search blocks don’t work in the Jetpack Search Sidebar. Use the Search (Jetpack) widget here instead.',
					'jetpack-search-pkg'
				) }
			</Warning>
		</div>
	);
}

/**
 * Refuse Search blocks in the widget area's inserter, and flag any that arrive another way, such as by paste.
 *
 * @param {string} areaId - Sidebar ID of the widget area.
 */
export function registerOverlayWidgetAreaGuards( areaId ) {
	addFilter(
		'blockEditor.__unstableCanInsertBlockType',
		'jetpack-search/hide-from-overlay-widget-area',
		( canInsert, blockType, rootClientId, selectors ) =>
			canInsert &&
			! ( isSearchBlock( blockType.name ) && isInsertingInto( areaId, rootClientId, selectors ) )
	);

	const GuardedEdit = ( { BlockEdit, ...props } ) => {
		const isInArea = useSelect(
			select => isPlacedIn( areaId, props.clientId, select( blockEditorStore ) ),
			[ props.clientId ]
		);
		return isInArea ? (
			<OverlayWidgetAreaWarning clientId={ props.clientId } />
		) : (
			<BlockEdit { ...props } />
		);
	};

	addFilter(
		'editor.BlockEdit',
		'jetpack-search/warn-in-overlay-widget-area',
		BlockEdit => props =>
			isSearchBlock( props.name ) ? (
				<GuardedEdit BlockEdit={ BlockEdit } { ...props } />
			) : (
				<BlockEdit { ...props } />
			)
	);
}
