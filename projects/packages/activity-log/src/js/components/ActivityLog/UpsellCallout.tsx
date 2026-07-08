/**
 * Free-tier upsell shown beneath the Activity Log table. Title, copy,
 * and illustration are a 1:1 port of Calypso's `ActivityLogsCallout`
 * (client/dashboard/sites/logs-activity/activity-logs-callout.tsx).
 * The CTA is wp-admin-native: it routes through Jetpack's standard
 * `useProductCheckoutWorkflow` into wordpress.com/checkout/{siteSuffix}/
 * {productSlug}?source=activity-log-page-purchase&redirect_to=<back>.
 *
 * Destination product: `jetpack_security_t1_yearly` — the Security
 * bundle unlocks 30 days of activity history (the cap documented on
 * cloud.jetpack.com/features/comparison).
 */
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { Button, __experimentalText as Text } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useCallback } from 'react';
import { useAnalytics } from '../../hooks/use-analytics';
import illustrationUrl from './activity-logs-callout-illustration.svg';
// Stylesheet is `@use`d from `src/js/style.scss` so the rules ride the
// main entry chunk instead of relying on a side-effect JS import.

const PRODUCT_SLUG = 'jetpack_security_t1_yearly';
const UPSELL_SOURCE = 'activity-log-page-purchase';

interface InitialStateWithNonce {
	nonces?: { refreshAccess?: string };
}

declare const JPACTIVITYLOG_INITIAL_STATE: InitialStateWithNonce | undefined;

/**
 * Compute the URL we want WordPress.com to send the user back to after
 * checkout. We stay on the Activity Log page but append
 * `refresh_access=1&_wpnonce=…`, which `Jetpack_Activity_Log::admin_init()`
 * detects to drop the paid-plan access cache — eliminating the 5-minute
 * "still showing the upsell after upgrade" window.
 *
 * @return Absolute URL to pass as `redirectUrl`.
 */
const buildPostCheckoutReturnUrl = (): string => {
	if ( typeof window === 'undefined' ) {
		return '';
	}
	const nonce =
		typeof JPACTIVITYLOG_INITIAL_STATE !== 'undefined'
			? JPACTIVITYLOG_INITIAL_STATE?.nonces?.refreshAccess
			: undefined;
	if ( ! nonce ) {
		return window.location.href;
	}
	return addQueryArgs( window.location.href, { refresh_access: '1', _wpnonce: nonce } );
};

/**
 * DataViews-adjacent upsell banner. Rendered as a sibling to the table
 * (not nested inside DataViews) so it sits below the locked view and
 * aligns with the page's AdminPage container.
 *
 * @return The callout element.
 */
export function UpsellCallout() {
	const { tracks } = useAnalytics();
	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: PRODUCT_SLUG,
		redirectUrl: buildPostCheckoutReturnUrl(),
		from: UPSELL_SOURCE,
	} );

	const onClickUpgrade = useCallback( () => {
		tracks.recordEvent( 'jetpack_activity_log_upsell_cta_click', {
			source: 'free_tier_callout',
		} );
		run();
	}, [ run, tracks ] );

	return (
		<div className="jp-activity-log__upsell-callout">
			<div className="jp-activity-log__upsell-callout-content">
				<h2 className="jp-activity-log__upsell-callout-title">
					{ __( 'Track every action with activity logs', 'jetpack-activity-log' ) }
				</h2>
				<Text as="p" variant="muted">
					{ __(
						'Debug issues faster with insights from a comprehensive audit log of all your site events.',
						'jetpack-activity-log'
					) }
				</Text>
				<Text as="p" variant="muted">
					{ __(
						'Upgrade to get complete activity history for the last 30 days, advanced filtering and date range selection. Available on the Jetpack Security and Complete plans.',
						'jetpack-activity-log'
					) }
				</Text>
				<Button
					variant="primary"
					onClick={ onClickUpgrade }
					isBusy={ hasCheckoutStarted }
					disabled={ hasCheckoutStarted }
				>
					{ __( 'Upgrade plan', 'jetpack-activity-log' ) }
				</Button>
			</div>
			<img
				className="jp-activity-log__upsell-callout-image"
				src={ illustrationUrl }
				alt=""
				role="presentation"
			/>
		</div>
	);
}
