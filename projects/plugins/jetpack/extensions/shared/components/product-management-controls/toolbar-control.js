/**
 * External dependencies
 */
import formatCurrency from '@automattic/format-currency';

/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { ExternalLink, MenuGroup, MenuItem, ToolbarDropdownMenu } from '@wordpress/components';
import { useSelect, dispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { check, update, warning } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useOpenBlockSidebar from './use-open-block-sidebar';
import { getMessageByProductType } from './utils';
import { store as membershipProductsStore } from '../../../store/membership-products';

/**
 * Check if it's in the context of the customizer.
 *
 * @returns {boolean} if we are in the context of Customizer.
 */
function isInCustomizer() {
	return 'function' === typeof window?.wp?.customize;
}

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

function NewProduct( { onClose, productType } ) {
	const siteSlug = useSelect( select => select( membershipProductsStore ).getSiteSlug() );
	const openBlockSidebar = useOpenBlockSidebar();

	const isPublishOpen = useSelect(
		select => select( 'core/edit-post' ).isPublishSidebarOpened(),
		[]
	);

	if ( isInCustomizer() ) {
		return (
			<MenuItem>
				{ siteSlug && (
					<ExternalLink href={ `https://wordpress.com/earn/payments-plans/${ siteSlug }` }>
						{ getMessageByProductType( 'add a new product', productType ) }
					</ExternalLink>
				) }
			</MenuItem>
		);
	}

	const handleClick = event => {
		event.preventDefault();
		openBlockSidebar();

		// We need to close the publish sidebar when the user tries to add a new subscription otherwise the block panel is not visible.
		isPublishOpen && dispatch( 'core/edit-post' ).closePublishSidebar();

		setTimeout( () => {
			const input = document.getElementById( 'new-product-title' );
			if ( input !== null ) {
				//Focus on the new product title input
				input.focus();
			}
		}, 100 );
		onClose();
	};

	return (
		<MenuItem onClick={ handleClick }>
			{ getMessageByProductType( 'add a new product', productType ) }
		</MenuItem>
	);
}

export default function ProductManagementToolbarControl( {
	products,
	productType,
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
		productDescription = getMessageByProductType( 'product not found', productType );
		subscriptionIcon = warning;
	}

	return (
		<BlockControls __experimentalShareWithChildBlocks group="block">
			<ToolbarDropdownMenu
				className="product-management-control-toolbar__dropdown-button"
				icon={ subscriptionIcon }
				label={ getMessageByProductType( 'select a product', productType ) }
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
							<NewProduct onClose={ onClose } productType={ productType } />
						</MenuGroup>
					</>
				) }
			</ToolbarDropdownMenu>
		</BlockControls>
	);
}
