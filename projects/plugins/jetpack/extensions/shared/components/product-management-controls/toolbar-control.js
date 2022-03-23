/**
 * External dependencies
 */
import formatCurrency from '@automattic/format-currency';

/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { MenuGroup, MenuItem, ToolbarDropdownMenu } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editPostStore } from '@wordpress/edit-post';
import { __, sprintf } from '@wordpress/i18n';
import { check, update, warning } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as membershipProductsStore } from '../../../store/membership-products';

function getProductDescription( product ) {
	const { currency, interval, price } = product;
	const amount = formatCurrency( parseFloat( price ), currency );
	switch ( interval ) {
		case '1 month':
			return sprintf(
				// translators: %s: amount
				__( '%s / month', 'jetpack' ),
				amount
			);
		case '1 year':
			return sprintf(
				// translators: %s: amount
				__( '%s / year', 'jetpack' ),
				amount
			);
		case 'one-time':
			return amount;
	}
	return sprintf(
		// translators: %s: amount, plan interval
		__( '%1$s / %2$s', 'jetpack' ),
		amount,
		interval
	);
}

function Product( { onClose, product, selectedProductId, setSelectedProductId } ) {
	const { id, title } = product;
	const isSelected = selectedProductId && selectedProductId === id;
	const icon = isSelected ? check : undefined;
	const productDescription = product ? ' ' + getProductDescription( product ) : null;

	const handleClick = event => {
		event.preventDefault();
		setSelectedProductId( id );
		onClose();
	};

	return (
		<MenuItem icon={ icon } onClick={ handleClick } selected={ isSelected } value={ id }>
			{ title } : { productDescription }
		</MenuItem>
	);
}

function NewProduct( { onClose } ) {
	const isEditorSidebarOpened = useSelect( select =>
		select( editPostStore ).isEditorSidebarOpened()
	);
	const { openGeneralSidebar } = useDispatch( editPostStore );

	const handleClick = event => {
		event.preventDefault();
		// Open the sidebar if not open
		if ( ! isEditorSidebarOpened ) {
			openGeneralSidebar( 'edit-post/block' );
		}
		const input = document.getElementById( 'new-product-title' );
		if ( input !== null ) {
			//Focus on the new product title input
			input.focus();
		}
		onClose();
	};

	return <MenuItem onClick={ handleClick }>{ __( 'Add a new subscription', 'jetpack' ) }</MenuItem>;
}

export default function ProductManagementToolbarControl( {
	products,
	selectedProductId,
	setSelectedProductId,
} ) {
	const selectedProduct = useSelect( select =>
		select( membershipProductsStore ).getProduct( selectedProductId )
	);

	let productDescription = null;
	let subscriptionIcon = update;

	if ( selectedProduct ) {
		productDescription = getProductDescription( selectedProduct );
	}
	if ( selectedProductId && ! selectedProduct ) {
		productDescription = __( 'Subscription not found', 'jetpack' );
		subscriptionIcon = warning;
	}

	return (
		<BlockControls group="block">
			<ToolbarDropdownMenu
				className="product-management-control-toolbar__dropdown-button"
				icon={ subscriptionIcon }
				label={ __( 'Select a plan', 'jetpack' ) }
				text={ productDescription }
			>
				{ ( { onClose } ) => (
					<>
						<MenuGroup>
							{ products.map( product => (
								<Product
									key={ product.id }
									onClose={ onClose }
									product={ product }
									selectedProductId={ selectedProductId }
									setSelectedProductId={ setSelectedProductId }
								/>
							) ) }
						</MenuGroup>
						<MenuGroup>
							<NewProduct onClose={ onClose } />
						</MenuGroup>
					</>
				) }
			</ToolbarDropdownMenu>
		</BlockControls>
	);
}
