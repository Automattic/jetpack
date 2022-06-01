import { store as blockEditorStore } from '@wordpress/block-editor';
import { Disabled, Placeholder, Spinner } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { select, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ProductManagementControls from '../../shared/components/product-management-controls';
import { PRODUCT_TYPE_SUBSCRIPTION } from '../../shared/components/product-management-controls/constants';
import { StripeNudge } from '../../shared/components/stripe-nudge';
import { store as membershipProductsStore } from '../../store/membership-products';
import Blocks from './_inc/blocks';
import Context from './_inc/context';
import './editor.scss';
import ViewSelector from './_inc/view-selector';

/**
 * Tab definitions
 *
 * If changing or adding tabs, the _TAB constants below might need changing too.
 *
 * @typedef { import('./tabs').Tab } Tab
 * @type { Tab[] }
 */
const tabs = [
	{
		id: 'premium',
		label: <span>{ __( 'Subscriber View', 'jetpack' ) }</span>,
		className: 'wp-premium-content-subscriber-view',
	},
	{
		id: 'wall',
		label: <span>{ __( 'Guest View', 'jetpack' ) }</span>,
		className: 'wp-premium-content-logged-out-view',
	},
];

const CONTENT_TAB = 0;
const WALL_TAB = 1;
const BLOCK_NAME = 'premium-content';
/**
 *
 * @typedef { import('react').MutableRefObject<?object> } ContainerRef
 */

/**
 * Block edit function
 *
 * @typedef { import('./').Attributes } Attributes
 * @typedef {object} OwnProps
 * @property { boolean } isSelected
 * @property { string } className
 * @property { string } clientId
 * @property { Attributes } attributes
 * @property { (attributes: object<Attributes>) => void } setAttributes
 * @typedef { OwnProps } Props
 * @param { Props } props
 */

function Edit( props ) {
	const [ selectedTab, selectTab ] = useState( tabs[ WALL_TAB ] );
	const { isPreview, selectedPlanId } = props.attributes;
	const { clientId, isSelected, className, setAttributes } = props;

	const setSelectedProductId = productId => setAttributes( { selectedPlanId: productId } );

	const { isApiLoading, selectedBlock } = useSelect( selector => ( {
		selectedBlock: selector( blockEditorStore ).getSelectedBlock(),
		isApiLoading: selector( membershipProductsStore ).isApiStateLoading(),
	} ) );

	useEffect( () => {
		if ( isSelected ) {
			return; // If this block is selected then leave the focused tab as it was.
		}

		if ( ! selectedBlock ) {
			return; // Sometimes there isn't a block selected, e.g. on page load.
		}

		const editorStore = select( blockEditorStore );

		// Confirm that the selected block is a descendant of this one.
		if ( ! editorStore.getBlockParents( selectedBlock.clientId ).includes( clientId ) ) {
			return;
		}

		if (
			'premium-content/logged-out-view' === selectedBlock.name ||
			editorStore.getBlockParentsByBlockName(
				selectedBlock.clientId,
				'premium-content/logged-out-view'
			).length
		) {
			selectTab( tabs[ WALL_TAB ] );
		} else {
			selectTab( tabs[ CONTENT_TAB ] );
		}
	}, [ clientId, isSelected, selectedBlock ] );

	const isSmallViewport = useViewportMatch( 'medium', '<' );

	return (
		<div className={ className }>
			{ ! isPreview && (
				<>
					{ isApiLoading && (
						<Placeholder
							icon="lock"
							label={ __( 'Premium Content', 'jetpack' ) }
							instructions={ __( 'Loading data…', 'jetpack' ) }
						>
							<Spinner />
						</Placeholder>
					) }
					<ProductManagementControls
						blockName={ BLOCK_NAME }
						clientId={ clientId }
						productType={ PRODUCT_TYPE_SUBSCRIPTION }
						selectedProductId={ selectedPlanId }
						setSelectedProductId={ setSelectedProductId }
					/>
					<ViewSelector
						options={ tabs }
						selectedOption={ selectedTab }
						selectAction={ selectTab }
						contractViewport={ isSmallViewport }
						label={ __( 'Change view', 'jetpack' ) }
					/>
				</>
			) }
			{ ! isApiLoading && (
				<>
					<StripeNudge blockName={ BLOCK_NAME } />
					<Context.Provider value={ { selectedTab } }>
						<Blocks />
					</Context.Provider>
				</>
			) }
		</div>
	);
}

export default function MaybeDisabledEdit( props ) {
	// The block transformations menu renders a block preview popover using real blocks
	// for transformation. The block previews do not play nicely with useEffect and
	// updating content after a resolved API call. To disarm the block preview, we can
	// check to see if the block is being rendered within a Disabled context, and set
	// the isPreview flag accordingly.
	return (
		<Disabled.Consumer>
			{ isDisabled => {
				return (
					<Edit
						{ ...props }
						attributes={ {
							...props.attributes,
							isPreview: isDisabled || props.attributes?.isPreview,
						} }
					/>
				);
			} }
		</Disabled.Consumer>
	);
}
