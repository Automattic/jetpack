/*
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Notice } from '@wordpress/components';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import debugFactory from 'debug';
/*
 * Internal dependencies
 */
import { Nudge as StandardNudge } from '../../../../shared/components/upgrade-nudge';
import useAICheckout from '../../hooks/use-ai-checkout';
import useAiFeature from '../../hooks/use-ai-feature';
import { canUserPurchasePlan } from '../../lib/connection';
import { LightNudge } from './light-nudge';
import type { ReactElement } from 'react';
import './style.scss';

type QuotaExceededMessageProps = {
	placement?: string;
	description?: string;
	useLightNudge?: boolean;
};

const debug = debugFactory( 'jetpack-ai-assistant:upgrade-prompt' );

/**
 * The fair usage notice message for the AI Assistant block.
 * @return {ReactElement} the fair usage notice message, with the proper link and date.
 */
const useFairUsageNoticeMessage = () => {
	const { usagePeriod } = useAiFeature();

	const getFormattedUsagePeriodStartDate = planUsagePeriod => {
		if ( ! planUsagePeriod?.nextStart ) {
			return null;
		}

		const nextUsagePeriodStartDate = new Date( planUsagePeriod.nextStart );
		return (
			nextUsagePeriodStartDate.toLocaleString( 'default', { month: 'long' } ) +
			' ' +
			nextUsagePeriodStartDate.getDate()
		);
	};

	const getFairUsageNoticeMessage = resetDateString => {
		const fairUsageMessage = __(
			"You've reached this month's request limit, per our <link>fair usage policy</link>.",
			'jetpack'
		);

		if ( ! resetDateString ) {
			return fairUsageMessage;
		}

		// Translators: %s is the date when the requests will reset.
		const dateMessage = __( 'Requests will reset on %s.', 'jetpack' );
		const formattedDateMessage = sprintf( dateMessage, resetDateString );

		return `${ fairUsageMessage } ${ formattedDateMessage }`;
	};

	const nextUsagePeriodStartDateString = getFormattedUsagePeriodStartDate( usagePeriod );

	// Get the proper template based on the presence of the next usage period start date.
	const fairUsageNoticeMessage = getFairUsageNoticeMessage( nextUsagePeriodStartDateString );

	const fairUsageNoticeMessageElement = createInterpolateElement( fairUsageNoticeMessage, {
		link: (
			<a
				href="https://jetpack.com/redirect/?source=ai-assistant-fair-usage-policy"
				target="_blank"
				rel="noreferrer"
			/>
		),
	} );

	return fairUsageNoticeMessageElement;
};

/**
 * The default upgrade prompt for the AI Assistant block, containing the Upgrade button and linking
 * to the checkout page or the Jetpack AI interstitial page.
 *
 * @param {QuotaExceededMessageProps} props - Component props.
 * @return {ReactElement} the Nudge component with the prompt.
 */
const DefaultUpgradePrompt = ( {
	placement = null,
	description = null,
	useLightNudge = false,
}: QuotaExceededMessageProps ): ReactElement => {
	const Nudge = useLightNudge ? LightNudge : StandardNudge;

	const { checkoutUrl } = useAICheckout();
	const canUpgrade = canUserPurchasePlan();
	const { nextTier, tierPlansEnabled, currentTier, requestsCount } = useAiFeature();

	const { tracks } = useAnalytics();

	const handleUpgradeClick = useCallback( () => {
		debug( 'upgrade', placement );
		tracks.recordEvent( 'jetpack_ai_upgrade_button', {
			current_tier_slug: currentTier?.slug,
			requests_count: requestsCount,
			placement: placement,
		} );
	}, [ currentTier, requestsCount, tracks, placement ] );

	const handleContactUsClick = useCallback( () => {
		debug( 'contact us', placement );
		tracks.recordEvent( 'jetpack_ai_upgrade_contact_us', {
			placement: placement,
		} );
	}, [ tracks, placement ] );

	if ( ! canUpgrade ) {
		const cantUpgradeDescription = createInterpolateElement(
			__(
				'Congratulations on exploring Jetpack AI and reaching the free requests limit! <strong>Reach out to the site administrator to upgrade and keep using Jetpack AI.</strong>',
				'jetpack'
			),
			{
				strong: <strong />,
			}
		);

		return (
			<Nudge
				showButton={ false }
				className={ 'jetpack-ai-upgrade-banner' }
				description={ description || cantUpgradeDescription }
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
			const contactUsDescription = __(
				'You have reached the request limit for your current plan.',
				'jetpack'
			);

			return (
				<Nudge
					buttonText={ __( 'Contact Us', 'jetpack' ) }
					description={ description || contactUsDescription }
					className={ 'jetpack-ai-upgrade-banner' }
					checkoutUrl={ contactHref }
					visible={ true }
					align={ null }
					title={ null }
					context={ null }
					goToCheckoutPage={ handleContactUsClick }
					target="_blank"
				/>
			);
		}

		const upgradeDescription = createInterpolateElement(
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
		);

		return (
			<Nudge
				buttonText={ sprintf(
					/* Translators: number of requests */
					__( 'Upgrade to %d requests', 'jetpack' ),
					nextTier.limit
				) }
				checkoutUrl={ checkoutUrl }
				className={ 'jetpack-ai-upgrade-banner' }
				description={ description || upgradeDescription }
				goToCheckoutPage={ handleUpgradeClick }
				visible={ true }
				align={ 'center' }
				title={ null }
				context={ null }
				target="_blank"
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
			goToCheckoutPage={ handleUpgradeClick }
			visible={ true }
			align={ null }
			title={ null }
			context={ null }
			target="_blank"
		/>
	);
};

/**
 * The VIP upgrade prompt, with a single text message recommending that the user reach
 * out to their VIP account team.
 *
 * @param {object}  props               - Component props.
 * @param {string}  props.description   - The description to display in the prompt.
 * @param {boolean} props.useLightNudge - Wheter to use the light variant of the nudge, or the standard one.
 * @return {ReactElement} the Nudge component with the prompt.
 */
const VIPUpgradePrompt = ( {
	description = null,
	useLightNudge = false,
}: {
	description?: string;
	useLightNudge?: boolean;
} ): ReactElement => {
	const Nudge = useLightNudge ? LightNudge : StandardNudge;
	const vipDescription = createInterpolateElement(
		__(
			"You've reached the Jetpack AI rate limit. <strong>Please reach out to your VIP account team.</strong>",
			'jetpack'
		),
		{
			strong: <strong />,
		}
	);

	return (
		<Nudge
			buttonText={ null }
			checkoutUrl={ null }
			className={ 'jetpack-ai-upgrade-banner' }
			description={ description || vipDescription }
			goToCheckoutPage={ null }
			isRedirecting={ null }
			visible={ true }
			align={ null }
			title={ null }
			context={ null }
		/>
	);
};

type FairUsageNoticeProps = {
	variant?: 'error' | 'muted';
};

/**
 * The fair usage notice component.
 * @param {FairUsageNoticeProps}         props         - Fair usage notice component props.
 * @param {FairUsageNoticeProps.variant} props.variant - The variant of the notice to render.
 * @return {ReactElement} the Notice component with the fair usage message.
 */
export const FairUsageNotice = ( { variant = 'error' }: FairUsageNoticeProps ) => {
	const useFairUsageNoticeMessageElement = useFairUsageNoticeMessage();

	if ( variant === 'muted' ) {
		return (
			<span className="jetpack-ai-fair-usage-notice-muted-variant">
				{ useFairUsageNoticeMessageElement }
			</span>
		);
	}

	if ( variant === 'error' ) {
		return (
			<Notice status="error" isDismissible={ false } className="jetpack-ai-fair-usage-notice">
				{ useFairUsageNoticeMessageElement }
			</Notice>
		);
	}

	return null;
};

const QuotaExceededMessage = props => {
	const { upgradeType, currentTier } = useAiFeature();

	// Return notice component for the fair usage limit message, on unlimited plans.
	if ( currentTier?.value === 1 ) {
		return <FairUsageNotice />;
	}

	// If the user is on a VIP site, show the VIP upgrade prompt.
	if ( upgradeType === 'vip' ) {
		return VIPUpgradePrompt( {
			description: props.description,
			useLightNudge: props?.useLightNudge,
		} );
	}

	return DefaultUpgradePrompt( props );
};

export default QuotaExceededMessage;
