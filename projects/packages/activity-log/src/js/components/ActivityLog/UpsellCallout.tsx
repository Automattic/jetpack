/**
 * Free-tier purchase callout beneath the Activity Log table.
 */
// Deep import (not the package barrel): wp-build's esbuild bundles the whole
// re-export graph of a barrel, and the connection barrel pulls in the
// disconnect-dialog's `.jpg` imports, which esbuild has no loader for.
import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import { Button, __experimentalText as Text } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useCallback } from 'react';
import { config } from '../../config';
import { useAnalytics } from '../../hooks/use-analytics';
import illustrationUrl from './activity-logs-callout-illustration';
// Stylesheet is `@use`d from `src/js/style.scss` so the rules ride the
// main entry chunk instead of relying on a side-effect JS import.

const PRODUCT_SLUG = 'jetpack_security_t1_yearly';
const UPSELL_SOURCE = 'activity-log-page-purchase';

interface InitialStateWithNonce {
	nonces?: { refreshAccess?: string };
	upgrade?: { slug: string; title: string; wpcom_product_slug: string } | null;
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

type UpgradeButtonProps = {
	productSlug: string;
	onClick: () => void;
};

/**
 * Jetpack product checkout. Kept out of the Simple path: the workflow registers
 * an unconnected site before checkout, and Simple sites have no Jetpack connection.
 *
 * @param props             - Component props.
 * @param props.productSlug - Available Jetpack bundle.
 * @param props.onClick     - Called before checkout starts.
 * @return The upgrade button.
 */
function JetpackCheckoutButton( { productSlug, onClick }: UpgradeButtonProps ) {
	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug,
		redirectUrl: buildPostCheckoutReturnUrl(),
		from: UPSELL_SOURCE,
	} );

	const onClickUpgrade = useCallback( () => {
		onClick();
		run();
	}, [ onClick, run ] );

	return (
		<Button
			variant="primary"
			onClick={ onClickUpgrade }
			isBusy={ hasCheckoutStarted }
			disabled={ hasCheckoutStarted }
		>
			{ __( 'Upgrade plan', 'jetpack-activity-log' ) }
		</Button>
	);
}

/**
 * DataViews-adjacent upsell banner. Rendered as a sibling to the table
 * (not nested inside DataViews) so it sits below the locked view and
 * aligns with the page's AdminPage container.
 *
 * @return The callout element.
 */
export function UpsellCallout() {
	const { tracks } = useAnalytics();
	const { wpcomUpgradeUrl } = config;
	const initialState =
		typeof JPACTIVITYLOG_INITIAL_STATE !== 'undefined' ? JPACTIVITYLOG_INITIAL_STATE : undefined;
	const offer =
		initialState && 'upgrade' in initialState
			? initialState.upgrade
			: { slug: 'security', title: 'Jetpack Security', wpcom_product_slug: PRODUCT_SLUG };

	const recordUpgradeClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_activity_log_upsell_cta_click', {
			source: 'free_tier_callout',
		} );
	}, [ tracks ] );

	if ( ! wpcomUpgradeUrl && ! offer ) {
		return null;
	}

	let description: string = __(
		'Upgrade to get complete activity history for the last 30 days, advanced filtering and date range selection. Available on the Jetpack Security and Complete plans.',
		'jetpack-activity-log'
	);
	if ( wpcomUpgradeUrl ) {
		description = __(
			'Upgrade to get complete activity history for the last 30 days, advanced filtering and date range selection. Available on WordPress.com paid plans.',
			'jetpack-activity-log'
		);
	} else if ( offer && offer.slug !== 'security' ) {
		description = sprintf(
			/* translators: %s is the name of an available Jetpack bundle. */
			__(
				'Upgrade to %s for at least 30 days of activity history, advanced filtering and date range selection.',
				'jetpack-activity-log'
			),
			offer.title
		);
	}

	const card = (
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
					{ description }
				</Text>
				{ wpcomUpgradeUrl ? (
					<Button variant="primary" href={ wpcomUpgradeUrl } onClick={ recordUpgradeClick }>
						{ __( 'Upgrade plan', 'jetpack-activity-log' ) }
					</Button>
				) : (
					<JetpackCheckoutButton
						productSlug={ offer?.wpcom_product_slug ?? PRODUCT_SLUG }
						onClick={ recordUpgradeClick }
					/>
				) }
			</div>
			<img
				className="jp-activity-log__upsell-callout-image"
				src={ illustrationUrl }
				alt=""
				role="presentation"
			/>
		</div>
	);

	return wpcomUpgradeUrl ? (
		<div className="jp-activity-log__upsell-callout-overlay">{ card }</div>
	) : (
		card
	);
}
