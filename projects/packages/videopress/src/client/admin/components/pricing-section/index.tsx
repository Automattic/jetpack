/**
 * External dependencies
 */
import {
	Button,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
} from '@automattic/jetpack-components';
import { useConnection, useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { usePlan } from '../../hooks/use-plan';

const PricingPage = ( { onRedirecting } ) => {
	const { siteSuffix, adminUri, registrationNonce } = window.jetpackVideoPressInitialState;
	const { siteProduct, product } = usePlan();
	const { productPrice } = product;
	const { pricingForUi } = siteProduct;
	const { handleRegisterSite, userIsConnecting } = useConnection( {
		redirectUri: adminUri,
		from: 'jetpack-videopress',
		registrationNonce,
	} );
	const [ isConnecting, setIsConnecting ] = useState( false );

	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		siteSuffix,
		productSlug: product.productSlug,
		redirectUrl: adminUri,
	} );

	const pricingItems = siteProduct.features.map( feature => ( { name: feature } ) );

	/*
	 * Fallback to the product price if the site product price is not available.
	 * This can happen when the site is not connected yet.
	 */
	if ( ! pricingForUi?.fullPrice ) {
		if ( productPrice ) {
			pricingForUi.fullPrice = productPrice.monthly.price;
			pricingForUi.discountPrice = productPrice.yearly.priceByMonth;
			pricingForUi.currencyCode = product.currencyCode;
		} else {
			// Let's hard code these values for now,
			// in case the data is still cached.
			pricingForUi.fullPrice = 20;
			pricingForUi.discountPrice = 10;
			pricingForUi.currencyCode = product.currencyCode;
		}
	}

	return (
		<PricingTable title={ siteProduct.description } items={ pricingItems }>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice
						price={ pricingForUi.fullPrice }
						offPrice={ pricingForUi.discountPrice }
						legend={ __( '/month, billed yearly', 'jetpack-videopress-pkg' ) }
						currency={ pricingForUi.currencyCode }
					/>
					<Button
						onClick={ () => {
							onRedirecting?.();
							run();
						} }
						isLoading={ hasCheckoutStarted }
						fullWidth
						disabled={ isConnecting || hasCheckoutStarted || userIsConnecting }
					>
						{ __( 'Get VideoPress', 'jetpack-videopress-pkg' ) }
					</Button>
				</PricingTableHeader>
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ true } />
			</PricingTableColumn>
			<PricingTableColumn>
				<PricingTableHeader>
					<ProductPrice
						price={ 0 }
						legend=""
						currency={ pricingForUi.currencyCode }
						hidePriceFraction
					/>
					<Button
						fullWidth
						variant="secondary"
						onClick={ () => {
							setIsConnecting( true );
							handleRegisterSite();
							onRedirecting?.();
						} }
						isLoading={ userIsConnecting || isConnecting }
						disabled={ userIsConnecting || isConnecting || hasCheckoutStarted }
					>
						{ __( 'Start for free', 'jetpack-videopress-pkg' ) }
					</Button>
				</PricingTableHeader>
				<PricingTableItem
					isIncluded={ false }
					label={ <strong>{ __( 'Upload one video', 'jetpack-videopress-pkg' ) }</strong> }
				/>
				<PricingTableItem isIncluded={ true } />
				<PricingTableItem isIncluded={ false } />
				<PricingTableItem isIncluded={ false } />
			</PricingTableColumn>
		</PricingTable>
	);
};

export default PricingPage;
