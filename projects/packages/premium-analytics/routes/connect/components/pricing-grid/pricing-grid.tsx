/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import Button from '@automattic/jetpack-components/button';
import PricingTable, {
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
} from '@automattic/jetpack-components/pricing-table';
import ProductPrice from '@automattic/jetpack-components/product-price';
import { Skeleton } from '@jetpack-premium-analytics/externals';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';
import type { Plan } from '../../use-plan-choice';

type PlanValue = {
	isIncluded: boolean;
	/** Replaces the table's Included / Not included text. */
	label?: string;
};

type Feature = {
	name: string;
	paid: PlanValue;
	free: PlanValue;
};

type PricingGridProps = {
	/** Yearly price of the paid plan; the paid column shows no price without it. */
	yearlyPrice?: number | null;
	/** Both columns show no price without it, so nobody sees a currency they are not billed in. */
	currencyCode?: string;
	/** Whether the price is still on its way; the empty price slots pulse meanwhile. */
	isPriceLoading: boolean;
	/** The choice whose registration is in flight; every button waits for it. */
	pendingPlan: Plan | null;
	onChoose: ( plan: Exclude< Plan, 'existing' > ) => void;
};

/**
 * The paid plan's differentiators lead; the rest are in both plans.
 *
 * @return The feature rows, in display order.
 */
function getFeatures(): Feature[] {
	const shared = ( name: string ): Feature => ( {
		name,
		paid: { isIncluded: true },
		free: { isIncluded: true },
	} );

	return [
		{
			name: __( 'UTM tracking', 'jetpack-premium-analytics-pkg' ),
			paid: { isIncluded: true },
			free: { isIncluded: false },
		},
		{
			name: __( 'Device stats', 'jetpack-premium-analytics-pkg' ),
			paid: { isIncluded: true },
			free: { isIncluded: false },
		},
		{
			name: __( 'Locations', 'jetpack-premium-analytics-pkg' ),
			paid: { isIncluded: true, label: __( 'Region and city', 'jetpack-premium-analytics-pkg' ) },
			free: { isIncluded: true, label: __( 'Country-level', 'jetpack-premium-analytics-pkg' ) },
		},
		{
			name: __( 'Priority support', 'jetpack-premium-analytics-pkg' ),
			paid: { isIncluded: true },
			free: { isIncluded: false },
		},
		shared( __( 'Views and visitors', 'jetpack-premium-analytics-pkg' ) ),
		shared( __( 'Top posts and pages', 'jetpack-premium-analytics-pkg' ) ),
		shared( __( 'Referrers and clicks', 'jetpack-premium-analytics-pkg' ) ),
		shared( __( 'Search terms', 'jetpack-premium-analytics-pkg' ) ),
		shared( __( 'Authors', 'jetpack-premium-analytics-pkg' ) ),
		shared( __( 'Downloads and video plays', 'jetpack-premium-analytics-pkg' ) ),
		shared( __( 'Insights and subscribers', 'jetpack-premium-analytics-pkg' ) ),
		shared( __( 'Full history', 'jetpack-premium-analytics-pkg' ) ),
		shared( __( 'GDPR-compliant', 'jetpack-premium-analytics-pkg' ) ),
	];
}

/**
 * One plan's cells, in the feature order the table's first column lists.
 *
 * @param features - The feature rows.
 * @param plan     - The plan's column.
 * @return The table items.
 */
function renderItems( features: Feature[], plan: 'paid' | 'free' ) {
	return features.map( feature => (
		<PricingTableItem
			key={ feature.name }
			isIncluded={ feature[ plan ].isIncluded }
			label={ feature[ plan ].label }
		/>
	) );
}

/**
 * Holds the space of the price it stands in for, so both columns' buttons stay in line whether or not a price arrives.
 *
 * @param props           - Component props.
 * @param props.legend    - The legend the price would show, which sets how many lines it takes.
 * @param props.isLoading - Whether the price is still on its way.
 * @return The placeholder.
 */
function PricePlaceholder( { legend, isLoading }: { legend: string; isLoading: boolean } ) {
	return (
		<div
			className="jetpack-premium-analytics-pricing-grid__price-placeholder"
			aria-busy={ isLoading || undefined }
		>
			<div aria-hidden="true" className="jetpack-premium-analytics-pricing-grid__price-reserve">
				<ProductPrice price={ 0 } currency="USD" legend={ legend } />
			</div>
			{ isLoading && <Skeleton className="jetpack-premium-analytics-pricing-grid__price-pulse" /> }
		</div>
	);
}

/**
 * The Stats plan choice a site sees before it is connected to WordPress.com, on the pricing table the other Jetpack products use.
 *
 * @param props                - Component props.
 * @param props.yearlyPrice    - Yearly price of the paid plan.
 * @param props.currencyCode   - Currency of that price.
 * @param props.isPriceLoading - Whether the price is still on its way.
 * @param props.pendingPlan    - The choice in flight, if any.
 * @param props.onChoose       - Called with the plan the visitor picks.
 * @return The pricing grid.
 */
export function PricingGrid( {
	yearlyPrice,
	currencyCode,
	isPriceLoading,
	pendingPlan,
	onChoose,
}: PricingGridProps ) {
	const isBusy = pendingPlan !== null;
	const features = getFeatures();
	const choosePaid = useCallback( () => onChoose( 'paid' ), [ onChoose ] );
	const chooseFree = useCallback( () => onChoose( 'free' ), [ onChoose ] );
	const paidLegend = __(
		'per month, from 10k monthly views, billed yearly',
		'jetpack-premium-analytics-pkg'
	);

	return (
		// Scopes the `--jp-*` tokens the Jetpack components read to the table, leaving the dashboard theme alone.
		<ThemeProvider>
			<PricingTable
				title={ __( 'Choose your Stats plan', 'jetpack-premium-analytics-pkg' ) }
				items={ features.map( ( { name } ) => ( { name } ) ) }
			>
				<PricingTableColumn primary>
					{ [
						<PricingTableHeader key="header">
							{ yearlyPrice && currencyCode ? (
								<ProductPrice
									price={ yearlyPrice / 12 }
									currency={ currencyCode }
									legend={ paidLegend }
								/>
							) : (
								<PricePlaceholder legend={ paidLegend } isLoading={ isPriceLoading } />
							) }
							<Button
								fullWidth
								disabled={ isBusy }
								isLoading={ pendingPlan === 'paid' }
								onClick={ choosePaid }
							>
								{ __( 'Get Paid Stats', 'jetpack-premium-analytics-pkg' ) }
							</Button>
						</PricingTableHeader>,
						...renderItems( features, 'paid' ),
					] }
				</PricingTableColumn>
				<PricingTableColumn>
					{ [
						<PricingTableHeader key="header">
							{ currencyCode ? (
								<ProductPrice price={ 0 } legend="" currency={ currencyCode } hidePriceFraction />
							) : (
								<PricePlaceholder legend="" isLoading={ isPriceLoading } />
							) }
							<Button
								fullWidth
								variant="secondary"
								disabled={ isBusy }
								isLoading={ pendingPlan === 'free' }
								onClick={ chooseFree }
							>
								{ __( 'Start for free', 'jetpack-premium-analytics-pkg' ) }
							</Button>
						</PricingTableHeader>,
						...renderItems( features, 'free' ),
					] }
				</PricingTableColumn>
			</PricingTable>
		</ThemeProvider>
	);
}
