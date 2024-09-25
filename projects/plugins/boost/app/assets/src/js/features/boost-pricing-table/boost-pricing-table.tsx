import { type PricingSchema, usePricing } from '$lib/stores/pricing';
import {
	Button,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	ProductPrice,
} from '@automattic/jetpack-components';
import { boostFeatureList } from './lib/features';
import { __ } from '@wordpress/i18n';

type BoostPricingTableProps = {
	pricing: PricingSchema;
	onPremiumCTA: () => void;
	onFreeCTA: () => void;
	chosenFreePlan: boolean;
	chosenPaidPlan: boolean;
};

export const BoostPricingTable = ( {
	onPremiumCTA,
	onFreeCTA,
	chosenFreePlan,
	chosenPaidPlan,
}: BoostPricingTableProps ) => {
	const pricing = usePricing();

	// If the first year discount ends, we want to show the default label.
	const legend = pricing?.isIntroductoryOffer
		? __( '/month for the first year, billed yearly', 'jetpack-boost' )
		: undefined;

	const isDiscounted = pricing?.priceBefore && pricing?.priceBefore > pricing?.priceAfter;

	return (
		<PricingTable
			title={ __( 'The easiest speed optimization plugin for WordPress', 'jetpack-boost' ) }
			items={ boostFeatureList.map( feature => feature.description ) }
		>
			<PricingTableColumn primary>
				{ [
					<PricingTableHeader key="premium-header">
						<ProductPrice
							price={ ( pricing?.priceBefore ?? 0 ) / 12 }
							offPrice={ isDiscounted ? ( pricing?.priceAfter ?? 0 ) / 12 : undefined }
							currency={ pricing?.currencyCode }
							hideDiscountLabel={ false }
							legend={ legend }
						/>
						<Button
							onClick={ onPremiumCTA }
							isLoading={ chosenPaidPlan }
							disabled={ chosenFreePlan || chosenPaidPlan }
							fullWidth
						>
							{ __( 'Get Boost', 'jetpack-boost' ) }
						</Button>
					</PricingTableHeader>,
					...boostFeatureList.map( feature => feature.premium ),
				] }
			</PricingTableColumn>
			<PricingTableColumn>
				{ [
					<PricingTableHeader key="free-header">
						<ProductPrice
							price={ 0 }
							legend=""
							currency={ pricing?.currencyCode }
							hidePriceFraction
						/>
						<Button
							onClick={ onFreeCTA }
							isLoading={ chosenFreePlan }
							disabled={ chosenFreePlan || chosenPaidPlan }
							fullWidth
							variant="secondary"
						>
							{ __( 'Start for free', 'jetpack-boost' ) }
						</Button>
					</PricingTableHeader>,
					...boostFeatureList.map( feature => feature.free ),
				] }
			</PricingTableColumn>
		</PricingTable>
	);
};
