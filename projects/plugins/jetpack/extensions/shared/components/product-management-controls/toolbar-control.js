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
	const { selectedProductIds, setSelectedProductIds } = useProductManagementContext();

	const { id, title } = product;
	const isSelected = selectedProductIds && selectedProductIds.includes( id );
	const icon = isSelected ? check : undefined;
	const productDescription = product ? ' ' + getProductDescription( product ) : null;

	const handleClick = event => {
		event.preventDefault();
		const selected = isSelected
			? selectedProductIds.filter( productId => productId !== id )
			: [ ...selectedProductIds, id ];
		setSelectedProductIds( selected );
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
						href={ `https://wordpress.com/earn/payments/${ siteSlug }#add-new-payment-plan` }
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
	const { products, productType, selectedProductIds } = useProductManagementContext();

	const { selectedProducts } = useSelect( select => {
		const { getSelectedProducts } = select( membershipProductsStore );
		return {
			selectedProducts: getSelectedProducts( selectedProductIds ),
		};
	} );

	let productDescription = null;
	let subscriptionIcon = update;

	if ( selectedProducts.length > 1 ) {
		productDescription = __( 'Multiple products selected', 'jetpack' );
	} else if ( selectedProducts.length === 1 ) {
		productDescription = getProductDescription( selectedProducts[ 0 ] );
	}

	if ( selectedProducts.length !== selectedProducts.length ) {
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
						{
							<MenuGroup>
								<NewProduct onClose={ onClose } />
							</MenuGroup>
						}
					</>
				) }
			</ToolbarDropdownMenu>
		</BlockControls>
	);
}
