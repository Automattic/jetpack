import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement, type Element } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { STORE_NAME } from '../store/index.ts';
/**
 * Types
 */
import type { Selectors } from '../store/types.ts';

const useFairUsageNoticeMessage = (): Element => {
	const { usagePeriod } = useSelect( select => {
		const selectors: Selectors = select( STORE_NAME );
		return {
			usagePeriod: selectors.getAiAssistantFeature().nextTier,
		};
	}, [] );
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
			'jetpack-ai-client'
		);

		if ( ! resetDateString ) {
			return fairUsageMessage;
		}

		// Translators: %s is the date when the requests will reset.
		const dateMessage = __( 'Requests will reset on %s.', 'jetpack-ai-client' );
		const formattedDateMessage = sprintf( dateMessage, resetDateString );

		return `${ fairUsageMessage } ${ formattedDateMessage }`;
	};

	const nextUsagePeriodStartDateString = getFormattedUsagePeriodStartDate( usagePeriod );

	// Get the proper template based on the presence of the next usage period start date.
	const fairUsageNoticeMessage = getFairUsageNoticeMessage( nextUsagePeriodStartDateString );

	const upgradeInfoUrl = getRedirectUrl( 'ai-logo-generator-fair-usage-policy', {
		anchor: 'jetpack-ai-usage-limit',
	} );

	const fairUsageNoticeMessageElement = createInterpolateElement( fairUsageNoticeMessage, {
		link: <a href={ upgradeInfoUrl } target="_blank" rel="noreferrer" />,
	} );

	return fairUsageNoticeMessageElement;
};

export default useFairUsageNoticeMessage;
