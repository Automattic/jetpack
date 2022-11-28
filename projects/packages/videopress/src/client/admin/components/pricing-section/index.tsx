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
import { __, sprintf } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { usePlan } from '../../hooks/use-plan';

const PricingPage = ( { onRedirecting } ) => {
	const { siteSuffix, adminUri, registrationNonce } = window.jetpackVideoPressInitialState;
	const { siteProduct, productPrice } = usePlan();
	const { yearly: yearlyPrice } = productPrice;

	const { handleRegisterSite, userIsConnecting } = useConnection( {
		redirectUri: adminUri,
		from: 'jetpack-videopress',
		registrationNonce,
	} );
	const [ isConnecting, setIsConnecting ] = useState( false );

	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		siteSuffix,
		productSlug: yearlyPrice?.slug,
		redirectUrl: adminUri,
	} );

	const pricingItems = siteProduct.features.map( feature => ( { name: feature } ) );

	return (
		<PricingTable title={ siteProduct.description } items={ pricingItems }>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice
						offPrice={ yearlyPrice?.discount ? yearlyPrice.salePriceByMonth : null }
						price={ yearlyPrice.priceByMonth }
						promoLabel={
							yearlyPrice?.discount
								? sprintf(
										/* translators: placeholder is the number of videos */
										__( '%1$s%% off', 'jetpack-videopress-pkg' ),
										yearlyPrice.discount
								  )
								: null
						}
						legend={ __( '/month, billed yearly', 'jetpack-videopress-pkg' ) }
						currency={ yearlyPrice.currency }
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
					<ProductPrice price={ 0 } legend="" currency={ yearlyPrice.currency } hidePriceFraction />
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
