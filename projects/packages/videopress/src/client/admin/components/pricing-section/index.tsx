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

const PricingPage = () => {
	const { siteSuffix, adminUri } = window.jetpackVideoPressInitialState;
	const { siteProduct, product } = usePlan();
	const { pricingForUi } = siteProduct;
	const { registrationNonce } = window.jetpackVideoPressInitialState;
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
		pricingForUi.fullPrice = product.cost;
		pricingForUi.discountPrice = product.introductoryOffer.costPerInterval;
		pricingForUi.currencyCode = product.currencyCode;
	}

	return (
		<PricingTable title={ siteProduct.description } items={ pricingItems }>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice
						price={ pricingForUi.fullPrice }
						offPrice={ pricingForUi.discountPrice }
						promoLabel={ __( '50% off', 'jetpack-videopress-pkg' ) }
						legend={ __( '/month, billed yearly', 'jetpack-videopress-pkg' ) }
						currency={ pricingForUi.currencyCode }
					/>
					<Button
						onClick={ run }
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
