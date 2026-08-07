import {
	AdminPage,
	AdminSectionHero,
	Button,
	Col,
	Container,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
	ThemeProvider,
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

/* global JP_STATS_PRICING_GRID_INITIAL_STATE */

const pricingTableArgs = {
	title: __( 'Choose your Stats plan', 'jetpack-stats-admin' ),
	items: [
		{ name: __( 'UTM tracking', 'jetpack-stats-admin' ) },
		{ name: __( 'Device stats', 'jetpack-stats-admin' ) },
		{ name: __( 'Locations', 'jetpack-stats-admin' ) },
		{ name: __( 'Priority support', 'jetpack-stats-admin' ) },
		{ name: __( 'Views and visitors', 'jetpack-stats-admin' ) },
		{ name: __( 'Top posts and pages', 'jetpack-stats-admin' ) },
		{ name: __( 'Referrers and clicks', 'jetpack-stats-admin' ) },
		{ name: __( 'Search terms', 'jetpack-stats-admin' ) },
		{ name: __( 'Authors', 'jetpack-stats-admin' ) },
		{ name: __( 'Downloads and video plays', 'jetpack-stats-admin' ) },
		{ name: __( 'Insights and subscribers', 'jetpack-stats-admin' ) },
		{ name: __( 'Full history', 'jetpack-stats-admin' ) },
		{ name: __( 'GDPR-compliant', 'jetpack-stats-admin' ) },
	],
};

// Rows shared by both plans, after the four paid differentiators above.
const SHARED_FEATURES_COUNT = pricingTableArgs.items.length - 4;

/**
 * The Stats pricing grid: a Paid / Free plan choice for new installations
 * without a plan. Copy follows the STATS-366 grid spec; the layout reuses
 * the same pricing table as the Jetpack Search upsell page.
 *
 * @return {object} The pricing grid element.
 */
export default function PricingGrid() {
	const state =
		typeof JP_STATS_PRICING_GRID_INITIAL_STATE !== 'undefined'
			? JP_STATS_PRICING_GRID_INITIAL_STATE
			: {};

	const currency = state.paidPricing?.currency || 'USD';
	const monthlyPrice = state.paidPricing?.yearlyCost ? state.paidPricing.yearlyCost / 12 : null;

	return (
		<AdminPage
			title={ __( 'Jetpack Stats', 'jetpack-stats-admin' ) }
			subTitle={ __(
				'Clear, concise, and actionable analysis of your site performance.',
				'jetpack-stats-admin'
			) }
		>
			<AdminSectionHero>
				<Container horizontalSpacing={ 8 }>
					<Col lg={ 12 } md={ 12 } sm={ 12 }>
						<ThemeProvider>
							<PricingTable { ...pricingTableArgs }>
								<PricingTableColumn primary>
									<PricingTableHeader>
										{ monthlyPrice !== null && (
											<ProductPrice
												price={ monthlyPrice }
												currency={ currency }
												legend={ __(
													'per month, from 10k monthly views, billed yearly',
													'jetpack-stats-admin'
												) }
											/>
										) }
										<Button href={ state.paidPurchaseUrl || '#' } fullWidth>
											{ __( 'Get Paid Stats', 'jetpack-stats-admin' ) }
										</Button>
									</PricingTableHeader>
									<PricingTableItem
										isIncluded
										label={ <strong>{ __( 'Included', 'jetpack-stats-admin' ) }</strong> }
									/>
									<PricingTableItem
										isIncluded
										label={ <strong>{ __( 'Included', 'jetpack-stats-admin' ) }</strong> }
									/>
									<PricingTableItem
										isIncluded
										label={ <strong>{ __( 'Region and city', 'jetpack-stats-admin' ) }</strong> }
									/>
									<PricingTableItem
										isIncluded
										label={ <strong>{ __( 'Included', 'jetpack-stats-admin' ) }</strong> }
									/>
									{ Array.from( { length: SHARED_FEATURES_COUNT }, ( _, index ) => (
										<PricingTableItem key={ index } isIncluded />
									) ) }
								</PricingTableColumn>
								<PricingTableColumn>
									<PricingTableHeader>
										<ProductPrice price={ 0 } legend="" currency={ currency } hidePriceFraction />
										<Button href={ state.freeStatsUrl || '#' } variant="secondary" fullWidth>
											{ __( 'Start for free', 'jetpack-stats-admin' ) }
										</Button>
									</PricingTableHeader>
									<PricingTableItem isIncluded={ false } />
									<PricingTableItem isIncluded={ false } />
									<PricingTableItem
										isIncluded
										label={ __( 'Country-level', 'jetpack-stats-admin' ) }
									/>
									<PricingTableItem isIncluded={ false } />
									{ Array.from( { length: SHARED_FEATURES_COUNT }, ( _, index ) => (
										<PricingTableItem key={ index } isIncluded />
									) ) }
								</PricingTableColumn>
							</PricingTable>
						</ThemeProvider>
					</Col>
				</Container>
			</AdminSectionHero>
		</AdminPage>
	);
}
