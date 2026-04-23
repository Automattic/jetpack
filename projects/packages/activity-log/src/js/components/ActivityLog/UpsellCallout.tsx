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
import illustrationUrl from './activity-logs-callout-illustration.svg';
import './upsell-callout.scss';

const PRODUCT_SLUG = 'jetpack_security_t1_yearly';
const UPSELL_SOURCE = 'activity-log-page-purchase';

/**
 * DataViews-adjacent upsell banner. Rendered as a sibling to the table
 * (not nested inside DataViews) so it sits below the locked view and
 * aligns with the page's AdminPage container.
 *
 * @return The callout element.
 */
export function UpsellCallout() {
	const redirectUrl = typeof window !== 'undefined' ? window.location.href : '';
	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: PRODUCT_SLUG,
		redirectUrl,
		from: UPSELL_SOURCE,
	} );

	return (
		<div className="jp-activity-log__upsell-callout">
			<img
				className="jp-activity-log__upsell-callout-image"
				src={ illustrationUrl }
				alt=""
				role="presentation"
			/>
			<div className="jp-activity-log__upsell-callout-content">
				<h2 className="jp-activity-log__upsell-callout-title">
					{ __( 'Track every action with Jetpack Activity Log', 'jetpack-activity-log' ) }
				</h2>
				<Text as="p" variant="muted">
					{ __(
						'Debug issues faster with insights from a comprehensive audit log of all your admin activities.',
						'jetpack-activity-log'
					) }
				</Text>
				<Text as="p" variant="muted">
					{ __(
						'With your free plan, you can see your 20 most recent events. Upgrade for 30 days of history, plus filtering and date range controls.',
						'jetpack-activity-log'
					) }
				</Text>
				<Text as="p" variant="muted">
					{ __( 'Available on the Jetpack Security and Complete plans.', 'jetpack-activity-log' ) }
				</Text>
				<Button
					variant="primary"
					onClick={ run }
					isBusy={ hasCheckoutStarted }
					disabled={ hasCheckoutStarted }
				>
					{ __( 'Upgrade', 'jetpack-activity-log' ) }
				</Button>
			</div>
		</div>
	);
}
