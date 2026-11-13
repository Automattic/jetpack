import { __ } from '@wordpress/i18n';

/**
 * One cycle reads as a single lapse; two or more escalates the wording, mirroring the Stats
 * "Plan usage" section.
 *
 * @param overLimitMonths - Number of recent billing cycles the site exceeded its limit.
 * @return The warning, or `undefined` when the site stayed within its limit.
 */
export function getOverLimitMessage(
	overLimitMonths: number | null | undefined
): string | undefined {
	if ( ! overLimitMonths ) {
		return undefined;
	}

	if ( overLimitMonths >= 2 ) {
		return __(
			"You've surpassed your limit for two consecutive periods already.",
			'jetpack-premium-analytics-pkg'
		);
	}

	return __( "You've surpassed your limit the past month.", 'jetpack-premium-analytics-pkg' );
}
