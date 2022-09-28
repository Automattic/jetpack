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
/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';
import { usePlan } from '../../hooks/use-plan';

const PricingPage = () => {
	const { siteSuffix } = window.jetpackVideoPressInitialState;
	const { product } = usePlan();
	const { pricingForUi } = product;

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
					<Button fullWidth variant="secondary">
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
