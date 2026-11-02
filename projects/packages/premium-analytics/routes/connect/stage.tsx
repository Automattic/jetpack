/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	useStatsYearlyProduct,
} from '@jetpack-premium-analytics/data';
import { Button, JetpackFooter, Notice } from '@jetpack-premium-analytics/externals';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { PricingGrid } from './components/pricing-grid';
import { usePlanChoice } from './use-plan-choice';
import './style.scss';

/**
 * The Stats page with the offline-mode notice, or with the plan choice and the last registration error.
 *
 * @return The stage content.
 */
function PlanChoice() {
	const trackEvent = useTrackEvent();
	const { choose, pendingPlan, error, isOfflineMode, siteSuffix } = usePlanChoice();
	const { data: product, isPending } = useStatsYearlyProduct();

	useEffect( () => {
		trackEvent(
			isOfflineMode
				? 'jetpack_premium_analytics_pre_connection_offline_notice_view'
				: 'jetpack_premium_analytics_pricing_grid_view',
			{ site_suffix: siteSuffix }
		);
	}, [ trackEvent, isOfflineMode, siteSuffix ] );

	const chooseExisting = useCallback( () => choose( 'existing' ), [ choose ] );

	let content;

	if ( isOfflineMode ) {
		content = (
			<Notice.Root intent="warning" className="jetpack-premium-analytics-connect-stage__notice">
				<Notice.Description>
					{ __(
						'This site is in offline mode, so it cannot be connected to WordPress.com. Stats will be available once the site is publicly reachable.',
						'jetpack-premium-analytics-pkg'
					) }
				</Notice.Description>
			</Notice.Root>
		);
	} else {
		content = (
			<>
				{ error && (
					<Notice.Root intent="error" className="jetpack-premium-analytics-connect-stage__notice">
						<Notice.Description>{ error }</Notice.Description>
					</Notice.Root>
				) }
				<PricingGrid
					yearlyPrice={ product?.cost }
					currencyCode={ product?.currency_code }
					isPriceLoading={ isPending }
					pendingPlan={ pendingPlan }
					onChoose={ choose }
				/>
			</>
		);
	}

	return (
		<Page
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs isRoot /> }
			actions={
				isOfflineMode ? null : (
					<Button
						variant="outline"
						size="compact"
						disabled={ pendingPlan !== null }
						loading={ pendingPlan === 'existing' }
						onClick={ chooseExisting }
					>
						{ __( 'I already have a plan', 'jetpack-premium-analytics-pkg' ) }
					</Button>
				)
			}
		>
			<div className="jetpack-premium-analytics-connect-stage__content">
				<div className="jetpack-premium-analytics-connect-stage__body">{ content }</div>
				<JetpackFooter />
			</div>
		</Page>
	);
}

/**
 * Connect route stage: the Stats plan choice, which connects the site.
 *
 * Reached only while the site is not connected; the guard in `route.tsx` sends a connected site to the dashboard.
 *
 * @return The connect stage.
 */
export const stage = () => (
	<AnalyticsQueryClientProvider>
		<PlanChoice />
	</AnalyticsQueryClientProvider>
);
