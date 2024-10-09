import { usePricing } from '$lib/stores/pricing';
import { useProduct } from '$lib/stores/product';
import {
	Button,
	Notice,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

type BoostPricingTableProps = {
	onPremiumCTA: () => void;
	onFreeCTA: () => void;
	chosenFreePlan: boolean;
	chosenPaidPlan: boolean;
};

type BoostPricingTablesFeaturesListProps = {
	feature: {
		included: boolean;
		description?: string;
		info?: {
			title?: string;
			content: string;
			class?: string;
		};
	};
};

const BoostPricingTablesFeaturesList = ( { feature }: BoostPricingTablesFeaturesListProps ) => {
	const { description, included, info } = feature;

	let labelText;
	if ( description ) {
		labelText = <strong>{ description }</strong>;
	}

	return (
		<PricingTableItem
			isIncluded={ included }
			label={ labelText }
			tooltipTitle={ info?.title }
			tooltipInfo={
				// eslint-disable-next-line react/no-danger
				info?.content ? <div dangerouslySetInnerHTML={ { __html: info?.content } } /> : null
			}
			tooltipClassName={ info?.class }
		/>
	);
};

export const BoostPricingTable = ( {
	onPremiumCTA,
	onFreeCTA,
	chosenFreePlan,
	chosenPaidPlan,
}: BoostPricingTableProps ) => {
	const pricing = usePricing();
	const product = useProduct();

	// If the first year discount ends, we want to show the default label.
	const legend = pricing?.isIntroductoryOffer
		? __( '/month for the first year, billed yearly', 'jetpack-boost' )
		: undefined;

	const isDiscounted = pricing?.priceBefore && pricing?.priceBefore > pricing?.priceAfter;
	const featuresByTier = product?.features_by_tier ?? [];

	return (
		<>
			{ ! pricing && (
				<Notice
					level="warning"
					hideCloseButton={ true }
					title={ __( 'Warning: There was a problem fetching pricing data', 'jetpack-boost' ) }
					children={ __(
						'Boost may not work as expected. Please check your site status and try again.',
						'jetpack-boost'
					) }
				></Notice>
			) }

			<PricingTable
				title={ __( 'The easiest speed optimization plugin for WordPress', 'jetpack-boost' ) }
				items={ featuresByTier.map( ( { name, info } ) => ( {
					name,
					tooltipTitle: info?.title,
					tooltipInfo: info?.content ? (
						// eslint-disable-next-line react/no-danger
						<div dangerouslySetInnerHTML={ { __html: info?.content } } />
					) : null,
					tooltipPlacement: 'bottom-start',
				} ) ) }
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
						...featuresByTier.map( ( tierFeature, mapIndex ) => (
							<BoostPricingTablesFeaturesList
								key={ mapIndex }
								feature={ tierFeature.tiers.upgraded }
							/>
						) ),
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
						...featuresByTier.map( ( { tiers }, index ) => (
							<BoostPricingTablesFeaturesList key={ index } feature={ tiers.free } />
						) ),
					] }
				</PricingTableColumn>
			</PricingTable>
		</>
	);
};
