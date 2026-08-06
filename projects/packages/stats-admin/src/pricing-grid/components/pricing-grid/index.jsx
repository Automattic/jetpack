import {
	AdminPage,
	PricingTable,
	PricingTableColumn,
	PricingTableHeader,
	PricingTableItem,
	ProductPrice,
} from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import useStatsCheckoutWorkflow from '../../hooks/use-stats-checkout-workflow';
import './style.scss';

/* global JP_STATS_PRICING_GRID_INITIAL_STATE */

/**
 * The Stats pricing grid component.
 * Shows a 2-card table: Free and Paid options for new installations.
 *
 * @return {object} The pricing grid element.
 */
export default function PricingGrid() {
	const state =
		typeof JP_STATS_PRICING_GRID_INITIAL_STATE !== 'undefined'
			? JP_STATS_PRICING_GRID_INITIAL_STATE
			: {};

	// Free tier: use the checkout workflow to buy the free product.
	const { run: checkoutFree, hasCheckoutStarted: freeCheckoutStarted } = useStatsCheckoutWorkflow( {
		productSlug: state.freeProductSlug || 'jetpack_stats_free_yearly',
		redirectUrl: 'admin.php?page=stats',
		siteSuffix: state.siteSuffix,
		adminUrl: state.adminUrl,
	} );

	// Paid tier: link to the purchase page (no checkout hook needed).
	const paidPurchaseUrl = state.paidPurchaseUrl || '#';

	return (
		<AdminPage
			title={ __( 'Jetpack Stats', 'jetpack-stats-admin' ) }
			subTitle={ __(
				'Clear, concise, and actionable analysis of your site performance.',
				'jetpack-stats-admin'
			) }
			classname="jp-stats-pricing-grid__page"
		>
			<div className="jp-stats-pricing-grid">
				<PricingTable
					title={ __( 'Choose your Stats plan', 'jetpack-stats-admin' ) }
					items={ [
						{ name: __( 'Real-time data on visitors', 'jetpack-stats-admin' ) },
						{ name: __( 'Traffic stats and trends for posts and pages', 'jetpack-stats-admin' ) },
						{ name: __( 'Detailed statistics about referral links', 'jetpack-stats-admin' ) },
						{ name: __( 'GDPR compliant', 'jetpack-stats-admin' ) },
					] }
				>
					{ /* Free tier column */ }
					<PricingTableColumn>
						<PricingTableHeader>
							<h3>{ __( 'Jetpack Stats', 'jetpack-stats-admin' ) }</h3>
							<ProductPrice price={ 0 } legend="" currency="USD" hidePriceFraction />
							<Button
								onClick={ checkoutFree }
								isLoading={ freeCheckoutStarted }
								disabled={ freeCheckoutStarted }
								className="jp-stats-pricing-grid__button"
								variant="primary"
							>
								{ __( 'Start for free', 'jetpack-stats-admin' ) }
							</Button>
						</PricingTableHeader>
						<PricingTableItem isIncluded />
						<PricingTableItem isIncluded />
						<PricingTableItem isIncluded />
						<PricingTableItem isIncluded />
					</PricingTableColumn>

					{ /* Paid tier column */ }
					<PricingTableColumn primary>
						<PricingTableHeader>
							<h3>{ __( 'Jetpack Stats Professional', 'jetpack-stats-admin' ) }</h3>
							<ProductPrice
								price={ 99 }
								promoLabel={ __( 'per year', 'jetpack-stats-admin' ) }
								currency="USD"
							/>
							<Button
								href={ paidPurchaseUrl }
								className="jp-stats-pricing-grid__button"
								variant="primary"
							>
								{ __( 'Get Paid Stats', 'jetpack-stats-admin' ) }
							</Button>
						</PricingTableHeader>
						<PricingTableItem
							isIncluded
							label={ __( 'Everything in Free', 'jetpack-stats-admin' ) }
						/>
						<PricingTableItem
							isIncluded
							label={ __( 'Everything in Free', 'jetpack-stats-admin' ) }
						/>
						<PricingTableItem
							isIncluded
							label={ __(
								'UTM tracking, device stats, region & city locations',
								'jetpack-stats-admin'
							) }
						/>
						<PricingTableItem
							isIncluded
							label={ __( 'Priority support', 'jetpack-stats-admin' ) }
						/>
					</PricingTableColumn>
				</PricingTable>
			</div>
		</AdminPage>
	);
}
