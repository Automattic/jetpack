import { __ } from '@wordpress/i18n';
import { Notice, Spinner, Stack } from '@wordpress/ui';
import { useCallback } from 'react';
import { getPageData, getSectionState } from '../../data/state';
import { trackAdsEvent } from '../../data/tracking';
import { useSiteHasFeature } from '../../data/use-site-feature';
import { usePayout } from '../../data/use-wpcom-ads-settings';
import { useAdsAccount, useAdsActive, useAdsEarnings } from '../../data/wordads';
import EarningsCard from './earnings-card';
import PaymentsCard from './payments-card';
import { StartCard, UnsafeNotice, UpsellCard } from './status';
import './style.scss';

const trackUpgradeClick = () => trackAdsEvent( 'upgrade_click' );

/**
 * The Ads tab: whether the site can show ads, what they've earned, and the payouts.
 *
 * @param props         - Component props.
 * @param props.openTab - Opens another of the page's tabs.
 * @return The tab.
 */
export default function Ads( { openTab }: { openTab: ( next: string ) => void } ) {
	const cached = Boolean( getSectionState< { hasWordAds?: boolean } >( 'ads' )?.hasWordAds );
	const hasWordAds = useSiteHasFeature( 'wordads', cached );
	const { active, isError } = useAdsActive();
	const { data: account } = useAdsAccount();
	const earnings = useAdsEarnings();
	// A site that stopped showing ads can still be owed, so its history stays.
	const showEarnings = Boolean( active ) || ( earnings.data?.total ?? 0 ) > 0;
	const payout = usePayout( showEarnings );
	const { upgradeUrl } = getPageData();

	const onAddPaypal = useCallback( () => {
		trackAdsEvent( 'payout_click' );
		openTab( 'settings' );
	}, [ openTab ] );

	if ( isError ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __( 'Your Ads status could not be loaded. Please try again.', 'jetpack-monetize' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	if ( hasWordAds === undefined || active === undefined ) {
		return (
			<Stack direction="row" justify="center" className="jp-monetize-loading">
				<Spinner />
			</Stack>
		);
	}

	let start = null;
	if ( ! active ) {
		start = hasWordAds ? <StartCard openTab={ openTab } /> : <UpsellCard />;
	}

	return (
		<Stack direction="column" gap="2xl">
			<UnsafeNotice />
			{ active && ! hasWordAds && account?.status === 'ineligible' && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ __(
							'Your plan no longer includes ads, so your site has stopped earning ad revenue. Upgrade to start earning again.',
							'jetpack-monetize'
						) }
					</Notice.Description>
					{ upgradeUrl && (
						<Notice.Actions>
							<Notice.ActionLink href={ upgradeUrl } onClick={ trackUpgradeClick }>
								{ __( 'Upgrade', 'jetpack-monetize' ) }
							</Notice.ActionLink>
						</Notice.Actions>
					) }
				</Notice.Root>
			) }
			{ ( earnings.data?.owed ?? 0 ) > 0 && payout.data && ! payout.data.paypal && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ __(
							'Your ad earnings are held until you add a PayPal address for payouts.',
							'jetpack-monetize'
						) }
					</Notice.Description>
					<Notice.Actions>
						<Notice.ActionButton onClick={ onAddPaypal }>
							{ __( 'Add PayPal', 'jetpack-monetize' ) }
						</Notice.ActionButton>
					</Notice.Actions>
				</Notice.Root>
			) }
			{ start }
			{ showEarnings && (
				<>
					<EarningsCard earnings={ earnings.data } error={ earnings.error } />
					<PaymentsCard paypal={ payout.data?.paypal } />
				</>
			) }
		</Stack>
	);
}
