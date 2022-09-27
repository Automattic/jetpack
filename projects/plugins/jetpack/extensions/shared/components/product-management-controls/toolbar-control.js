import formatCurrency from '@automattic/format-currency';
import { BlockControls } from '@wordpress/block-editor';
import { ExternalLink, MenuGroup, MenuItem, ToolbarDropdownMenu } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { check, update, warning } from '@wordpress/icons';
import { store as membershipProductsStore } from '../../../store/membership-products';
import { CUSTOMIZER_EDITOR, getEditorType } from '../../get-editor-type';
import { useProductManagementContext } from './context';
import useOpenBlockSidebar from './use-open-block-sidebar';
import { getMessageByProductType } from './utils';

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

function Product( { onClose, product } ) {
	const { selectedProductId, setSelectedProductId } = useProductManagementContext();

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
	const { clientId, productType } = useProductManagementContext();
	const siteSlug = useSelect( select => select( membershipProductsStore ).getSiteSlug() );
	const openBlockSidebar = useOpenBlockSidebar( clientId );

	if ( CUSTOMIZER_EDITOR === getEditorType() ) {
		return (
			<MenuItem>
				{ siteSlug && (
					<ExternalLink
						href={ `https://wordpress.com/earn/payments-plans/${ siteSlug }#add-newsletter-payment-plan` }
					>
						{ getMessageByProductType( 'add a new product', productType ) }
					</ExternalLink>
				) }
			</MenuItem>
		);
	}

	const handleClick = event => {
		event.preventDefault();
		openBlockSidebar();

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

export default function ProductManagementToolbarControl() {
	const { products, productType, selectedProductId } = useProductManagementContext();

	const { selectedProduct, shouldUpgrade } = useSelect( select => {
		const { getProduct, getShouldUpgrade } = select( membershipProductsStore );
		return {
			selectedProduct: getProduct( selectedProductId ),
			shouldUpgrade: getShouldUpgrade(),
		};
	} );

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
								<Product key={ product.id } onClose={ onClose } product={ product } />
							) ) }
						</MenuGroup>
						{ ! shouldUpgrade && (
							<MenuGroup>
								<NewProduct onClose={ onClose } />
							</MenuGroup>
						) }
					</>
				) }
			</ToolbarDropdownMenu>
		</BlockControls>
	);
}
