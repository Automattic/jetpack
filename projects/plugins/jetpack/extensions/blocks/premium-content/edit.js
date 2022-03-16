/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { Disabled, Placeholder, Spinner } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { select, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Blocks from './_inc/blocks';
import Context from './_inc/context';
import './editor.scss';
import ViewSelector from './_inc/view-selector';
import ProductManagementControls from '../../shared/components/product-management-controls';
import {
	API_STATE_LOADING,
	API_STATE_CONNECTED,
} from '../../shared/components/product-management-controls/constants';
import useProducts from '../../shared/components/product-management-controls/use-products';
import StripeConnectToolbarButton from '../../shared/components/stripe-connect-toolbar-button';

/**
 * @typedef { import('./plan').Plan } Plan
 */

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
	const [ selectedInnerBlock, hasSelectedInnerBlock ] = useState( false );
	const { isPreview } = props.attributes;
	const { clientId } = props;

	const setSelectedProductId = productId => props.setAttributes( { selectedPlanId: productId } );
	const { apiState, connectUrl, shouldUpgrade } = useProducts( setSelectedProductId );

	//We would like to hide the tabs and controls when user clicks outside the premium content block
	/**
	 * @type { ContainerRef }
	 */
	const wrapperRef = useRef( null );
	useOutsideAlerter( wrapperRef, hasSelectedInnerBlock );

	const { isSelected, className } = props;

	const selectedBlock = useSelect( selector => selector( 'core/block-editor' ).getSelectedBlock() );

	useEffect( () => {
		if ( isSelected ) {
			return; // If this block is selected then leave the focused tab as it was.
		}

		if ( ! selectedBlock ) {
			return; // Sometimes there isn't a block selected, e.g. on page load.
		}

		const editorStore = select( 'core/block-editor' );

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

	const shouldShowConnectButton = () =>
		! shouldUpgrade && apiState !== API_STATE_CONNECTED && connectUrl;

	const isSmallViewport = useViewportMatch( 'medium', '<' );

	if ( apiState === API_STATE_LOADING && ! isPreview ) {
		return (
			<div className={ className } ref={ wrapperRef }>
				<Placeholder
					icon="lock"
					label={ __( 'Premium Content', 'jetpack' ) }
					instructions={ __( 'Loading data…', 'jetpack' ) }
				>
					<Spinner />
				</Placeholder>
			</div>
		);
	}

	return (
		<>
			{ shouldShowConnectButton() && (
				<BlockControls group="block">
					<StripeConnectToolbarButton blockName="premium-content" connectUrl={ connectUrl } />
				</BlockControls>
			) }

			<ViewSelector
				options={ tabs }
				selectedOption={ selectedTab }
				selectAction={ selectTab }
				contractViewport={ isSmallViewport }
				label={ __( 'Change view', 'jetpack' ) }
			/>

			<div className={ className } ref={ wrapperRef }>
				<ProductManagementControls
					allowCreateOneTimeInterval={ false }
					isVisible={ ( isSelected || selectedInnerBlock ) && apiState === API_STATE_CONNECTED }
					selectedProductId={ props.attributes.selectedPlanId }
					setSelectedProductId={ setSelectedProductId }
				/>

				<Context.Provider
					value={ {
						selectedTab,
					} }
				>
					<Blocks />
				</Context.Provider>
			</div>
		</>
	);
}

/**
 * Hook that alerts clicks outside of the passed ref
 *
 * @param { ContainerRef } ref - container ref
 * @param { (clickedInside: boolean) => void } callback - callback function
 */
function useOutsideAlerter( ref, callback ) {
	/**
	 * Alert if clicked on outside of element
	 *
	 * @param {object} event - click event
	 */
	function handleClickOutside( event ) {
		if (
			ref.current &&
			event.target &&
			// eslint-disable-next-line no-undef
			event.target instanceof Node &&
			! ref.current.contains( event.target )
		) {
			callback( false );
		} else {
			callback( true );
		}
	}

	useEffect( () => {
		// Bind the event listener
		document.addEventListener( 'mousedown', handleClickOutside );
		return () => {
			// Unbind the event listener on clean up
			document.removeEventListener( 'mousedown', handleClickOutside );
		};
	} );
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
