/**
 * External dependencies
 */
import {
	Drawer,
	Link,
	LinkButton,
	Notice,
	Stack,
	Text,
} from '@jetpack-premium-analytics/externals';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { DrawerGroup, PageDrawer } from '../page-drawer';
import {
	getOverLimitMessage,
	getPlanUpgradeUrl,
	PlanUsageMeter,
	usePlanUsage,
} from '../plan-usage';

export type UsageDrawerSource = 'menu' | 'url';

type UsageDrawerProps = {
	open: boolean;
	onClose: () => void;
	/** Where the reader opened the drawer from, reported with the opening. */
	source: UsageDrawerSource;
};

/**
 * The site's plan usage for the current billing cycle, in a drawer from the end of the page.
 *
 * @param props         - Component props.
 * @param props.open    - Whether the drawer is open.
 * @param props.onClose - Called once the reader dismisses the drawer.
 * @param props.source  - Where the reader opened the drawer from.
 * @return The drawer.
 */
export function UsageDrawer( { open, onClose, source }: UsageDrawerProps ) {
	return (
		<PageDrawer
			open={ open }
			onClose={ onClose }
			title={ __( 'Usage', 'jetpack-premium-analytics-pkg' ) }
		>
			<Drawer.Content>
				<UsageContent source={ source } />
			</Drawer.Content>
		</PageDrawer>
	);
}

function UsageContent( { source }: { source: UsageDrawerSource } ) {
	const trackEvent = useTrackEvent();
	const { data, isError, limit, overLimitMonths } = usePlanUsage();
	const upgradeHref = getPlanUpgradeUrl();

	// The content mounts with the drawer's popup, so this runs once per opening.
	useEffect( () => {
		trackEvent( 'jetpack_premium_analytics_usage_open', { source } );
	}, [ trackEvent, source ] );

	if ( ! data ) {
		return isError ? (
			<Notice.Root intent="error">
				<Notice.Description>
					{ __(
						"We couldn't load plan usage. Close this panel and try again.",
						'jetpack-premium-analytics-pkg'
					) }
				</Notice.Description>
			</Notice.Root>
		) : (
			<Spinner />
		);
	}

	return (
		<Stack direction="column" gap="2xl" align="start">
			<DrawerGroup title={ __( 'Your current plan', 'jetpack-premium-analytics-pkg' ) }>
				{ limit === null ? (
					<Text>
						{ __(
							"Plan usage isn't available for your current plan.",
							'jetpack-premium-analytics-pkg'
						) }
					</Text>
				) : (
					<>
						<PlanUsageMeter
							limit={ limit }
							usage={ data.current_usage?.views_count }
							daysToReset={ data.current_usage?.days_to_reset }
						/>
						{ !! overLimitMonths && (
							<Text render={ <strong /> }>{ getOverLimitMessage( overLimitMonths ) }</Text>
						) }
						<Text>
							{ __(
								"Billable views are your total views minus your two highest-traffic days each billing cycle, so big spikes won't count against your limit. You'll only need to upgrade if you exceed your limit for three cycles in a row.",
								'jetpack-premium-analytics-pkg'
							) }{ ' ' }
							<Link
								href="https://jetpack.com/support/jetpack-stats/free-or-paid/"
								openInNewTab
								onClick={ () => trackEvent( 'jetpack_premium_analytics_usage_learn_more_click' ) }
							>
								{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
							</Link>
						</Text>
					</>
				) }
			</DrawerGroup>
			{ limit !== null && upgradeHref && (
				<LinkButton
					variant="solid"
					href={ upgradeHref }
					onClick={ () => trackEvent( 'jetpack_premium_analytics_usage_upgrade_click' ) }
				>
					{ __( 'Upgrade', 'jetpack-premium-analytics-pkg' ) }
				</LinkButton>
			) }
		</Stack>
	);
}
