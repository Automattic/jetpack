import {
	Button,
	getRedirectUrl,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
} from '@automattic/jetpack-components';
import { Snackbar } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const cssOptimizationContext = __(
	'Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as Critical CSS.',
	'jetpack-boost'
);

const deferJSContextTemplate = __(
	'Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly. Read more on <link>web.dev</link>.',
	'jetpack-boost'
);
const deferJSContext = createInterpolateElement( deferJSContextTemplate, {
	// eslint-disable-next-line jsx-a11y/anchor-has-content
	link: <a href={ getRedirectUrl( 'jetpack-boost-defer-js' ) } target="_blank" rel="noreferrer" />,
} );

const lazyLoadingContextTemplate = __(
	'Improve page loading speed by only loading images when they are required. Read more on <link>web.dev</link>.',
	'jetpack-boost'
);
const lazyLoadingContext = createInterpolateElement( lazyLoadingContextTemplate, {
	// eslint-disable-next-line jsx-a11y/anchor-has-content
	link: <a href={ getRedirectUrl( 'jetpack-boost-lazy-load' ) } target="_blank" rel="noreferrer" />,
} );

const supportContext = __(
	`Paid customers get dedicated email support from our world-class Happiness Engineers to help with any issue.<br><br>All other questions are handled by our team as quickly as we are able to go through the WordPress support forum.`,
	'jetpack-boost'
);

export const BoostPricingTable = ( {
	pricing,
	onPremiumCTA,
	onFreeCTA,
	chosenFreePlan,
	chosenPaidPlan,
	snackbarMessage,
	onSnackbarDismiss,
} ) => {
	// If the first year discount ends, we want to remove the label without updating the plugin.
	const promoLabel = pricing.yearly.isIntroductoryOffer
		? __( 'First Year Discount', 'jetpack-boost' )
		: '';

	const isDiscounted = pricing.yearly.priceBefore > pricing.yearly.priceAfter;

	return (
		<>
			{ snackbarMessage && (
				<Snackbar onDismiss={ () => onSnackbarDismiss() }>{ snackbarMessage }</Snackbar>
			) }
			<PricingTable
				title={ __( 'The easiest speed optimization plugin for WordPress', 'jetpack-boost' ) }
				items={ [
					{
						name: __( 'Optimize CSS Loading', 'jetpack-boost' ),
						tooltipInfo: cssOptimizationContext,
					},
					{
						name: __( 'Defer non-essential JavaScript', 'jetpack-boost' ),
						tooltipInfo: deferJSContext,
					},
					{
						name: __( 'Lazy image loading', 'jetpack-boost' ),
						tooltipInfo: lazyLoadingContext,
					},
					{
						name: __( 'Dedicated support', 'jetpack-boost' ),
						tooltipInfo: <span dangerouslySetInnerHTML={ { __html: supportContext } }></span>,
					},
				] }
			>
				<PricingTableColumn primary>
					<PricingTableHeader>
						<ProductPrice
							price={ pricing.yearly.priceBefore / 12 }
							offPrice={ isDiscounted ? pricing.yearly.priceAfter / 12 : null }
							currency={ pricing.yearly.currencyCode }
							hideDiscountLabel={ false }
							promoLabel={ promoLabel }
						/>
						<Button
							onClick={ onPremiumCTA }
							isLoading={ chosenPaidPlan }
							disabled={ chosenFreePlan || chosenPaidPlan }
							fullWidth
						>
							{ __( 'Get Boost', 'jetpack-boost' ) }
						</Button>
					</PricingTableHeader>
					<PricingTableItem
						isIncluded={ true }
						label={ __( 'Automatic Critical CSS Generation', 'jetpack-boost' ) }
					/>
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ true } />
				</PricingTableColumn>
				<PricingTableColumn>
					<PricingTableHeader>
						<ProductPrice
							price={ 0 }
							legend=""
							currency={ pricing.yearly.currencyCode }
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
					</PricingTableHeader>
					<PricingTableItem
						isIncluded={ false }
						label={ __( 'Manual Critical CSS Generation', 'jetpack-boost' ) }
					/>
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem isIncluded={ true } />
					<PricingTableItem
						isIncluded={ false }
						label={ __( 'No dedicated support', 'jetpack-boost' ) }
					/>
				</PricingTableColumn>
			</PricingTable>
		</>
	);
};
