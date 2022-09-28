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
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { usePlan } from '../../hooks/use-plan';

const PricingPage = () => {
	const { siteSuffix, adminUri } = window.jetpackVideoPressInitialState;
	const { product } = usePlan();
	const { pricingForUi } = product;
	const { handleRegisterSite, userIsConnecting } = useConnection( { redirectUri: adminUri } );
	const [ isConnecting, setIsConnection ] = useState( false );

	const pricingItems = product.features.map( feature => ( { name: feature } ) );

	return (
		<PricingTable title={ product.description } items={ pricingItems }>
			<PricingTableColumn primary>
				<PricingTableHeader>
					<ProductPrice
						price={ pricingForUi.fullPrice }
						offPrice={ pricingForUi.discountPrice }
						promoLabel={ __( '50% off', 'jetpack-videopress-pkg' ) }
						leyend={ __( '/month, billed yearly', 'jetpack-videopress-pkg' ) }
						currency={ pricingForUi.currencyCode }
					/>
					<Button
						href={ getRedirectUrl( 'videopress-upgrade', {
							site: siteSuffix,
							query: 'redirect_to=' + window.location.href,
						} ) }
						fullWidth
						disabled={ isConnecting }
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
					<ProductPrice price={ 0 } leyend="" currency="USD" hidePriceFraction />
					<Button
						fullWidth
						variant="secondary"
						onClick={ () => {
							setIsConnection( true );
							handleRegisterSite();
						} }
						isLoading={ userIsConnecting || isConnecting }
						disabled={ userIsConnecting || isConnecting }
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
