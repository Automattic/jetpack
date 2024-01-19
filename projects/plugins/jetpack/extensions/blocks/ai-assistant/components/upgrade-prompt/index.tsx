/*
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import debugFactory from 'debug';
import React, { useCallback } from 'react';
/*
 * Internal dependencies
 */
import { Nudge } from '../../../../shared/components/upgrade-nudge';
import { PLAN_TYPE_TIERED, usePlanType } from '../../../../shared/use-plan-type';
import useAICheckout from '../../hooks/use-ai-checkout';
import useAiFeature from '../../hooks/use-ai-feature';
import { canUserPurchasePlan } from '../../lib/connection';
import './style.scss';

type UpgradePromptProps = {
	placement?: string;
};

const debug = debugFactory( 'jetpack-ai-assistant:upgrade-prompt' );
/**
 * The default upgrade prompt for the AI Assistant block, containing the Upgrade button and linking
 * to the checkout page or the Jetpack AI interstitial page.
 *
 * @param {UpgradePromptProps} props - Component props.
 * @returns {React.ReactNode} the Nudge component with the prompt.
 */
const DefaultUpgradePrompt = ( { placement = null }: UpgradePromptProps ): React.ReactNode => {
	const { checkoutUrl, autosaveAndRedirect, isRedirecting } = useAICheckout();
	const canUpgrade = canUserPurchasePlan();
	const {
		nextTier,
		tierPlansEnabled,
		currentTier,
		requestsCount: allTimeRequestsCount,
		usagePeriod,
	} = useAiFeature();

	const planType = usePlanType( currentTier );
	const requestsCount =
		planType === PLAN_TYPE_TIERED ? usagePeriod?.requestsCount : allTimeRequestsCount;

	const { tracks } = useAnalytics();

	const handleUpgradeClick = useCallback(
		event => {
			debug( 'upgrade', placement );
			tracks.recordEvent( 'jetpack_ai_upgrade_button', {
				current_tier_slug: currentTier?.slug,
				requests_count: requestsCount,
				placement: placement,
			} );
			autosaveAndRedirect( event );
		},
		[ autosaveAndRedirect, currentTier, requestsCount, tracks, placement ]
	);

	if ( ! canUpgrade ) {
		return (
			<Nudge
				showButton={ false }
				className={ 'jetpack-ai-upgrade-banner' }
				description={ createInterpolateElement(
					__(
						'Congratulations on exploring Jetpack AI and reaching the free requests limit! <strong>Reach out to the site administrator to upgrade and keep using Jetpack AI.</strong>',
						'jetpack'
					),
					{
						strong: <strong />,
					}
				) }
				visible={ true }
				align={ null }
				title={ null }
				context={ null }
			/>
		);
	}

	if ( tierPlansEnabled ) {
		if ( ! nextTier ) {
			const contactHref = getRedirectUrl( 'jetpack-ai-tiers-more-requests-contact' );
			return (
				<Nudge
					buttonText={ __( 'Contact Us', 'jetpack' ) }
					description={ __(
						'You have reached the request limit for your current plan.',
						'jetpack'
					) }
					className={ 'jetpack-ai-upgrade-banner' }
					checkoutUrl={ contactHref }
					visible={ true }
					align={ null }
					title={ null }
					context={ null }
				/>
			);
		}
		return (
			<Nudge
				buttonText={ sprintf(
					/* Translators: number of requests */
					__( 'Upgrade to %d requests', 'jetpack' ),
					nextTier.limit
				) }
				checkoutUrl={ checkoutUrl }
				className={ 'jetpack-ai-upgrade-banner' }
				description={ createInterpolateElement(
					sprintf(
						/* Translators: number of requests */
						__(
							'You have reached the requests limit for your current plan. <strong>Upgrade now to increase your requests limit to %d.</strong>',
							'jetpack'
						),
						nextTier.limit
					),
					{
						strong: <strong />,
					}
				) }
				goToCheckoutPage={ handleUpgradeClick }
				isRedirecting={ isRedirecting }
				visible={ true }
				align={ 'center' }
				title={ null }
				context={ null }
			/>
		);
	}

	return (
		<Nudge
			buttonText={ 'Upgrade' }
			checkoutUrl={ checkoutUrl }
			className={ 'jetpack-ai-upgrade-banner' }
			description={ createInterpolateElement(
				__(
					'Congratulations on exploring Jetpack AI and reaching the free requests limit! <strong>Upgrade now to keep using it.</strong>',
					'jetpack'
				),
				{
					strong: <strong />,
				}
			) }
			goToCheckoutPage={ autosaveAndRedirect }
			isRedirecting={ isRedirecting }
			visible={ true }
			align={ null }
			title={ null }
			context={ null }
		/>
	);
};

/**
 * The VIP upgrade prompt, with a single text message recommending that the user reach
 * out to their VIP account team.
 *
 * @returns {React.ReactNode} the Nudge component with the prompt.
 */
const VIPUpgradePrompt = (): React.ReactNode => {
	return (
		<Nudge
			buttonText={ null }
			checkoutUrl={ null }
			className={ 'jetpack-ai-upgrade-banner' }
			description={ createInterpolateElement(
				__(
					"You've reached the Jetpack AI rate limit. <strong>Please reach out to your VIP account team.</strong>",
					'jetpack'
				),
				{
					strong: <strong />,
				}
			) }
			goToCheckoutPage={ null }
			isRedirecting={ null }
			visible={ true }
			align={ null }
			title={ null }
			context={ null }
		/>
	);
};

const UpgradePrompt = props => {
	const { upgradeType } = useAiFeature();

	// If the user is on a VIP site, show the VIP upgrade prompt.
	if ( upgradeType === 'vip' ) {
		return VIPUpgradePrompt();
	}

	return DefaultUpgradePrompt( props );
};

export default UpgradePrompt;
