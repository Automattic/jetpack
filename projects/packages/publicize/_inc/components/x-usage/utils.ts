import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { date, getDate, humanTimeDiff } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { hasSocialPaidFeatures } from '../../utils/script-data';
import styles from './styles.module.scss';

/**
 * Get the CSS modifier class name for the progress bar based on usage state.
 *
 * @param {boolean} isAtLimit   - Whether usage is at the limit.
 * @param {boolean} isNearLimit - Whether usage is near the limit (80%+).
 * @return The CSS class name string.
 */
export function getProgressBarClassName( isAtLimit: boolean, isNearLimit: boolean ) {
	if ( isAtLimit ) {
		return styles[ 'x-usage-progress-at-limit' ];
	}
	if ( isNearLimit ) {
		return styles[ 'x-usage-progress-warning' ];
	}
	return '';
}

/**
 * Get the upgrade URL for the Jetpack Social plan.
 *
 * @return The upgrade URL.
 */
export function getUpgradeUrl() {
	return getRedirectUrl( 'jetpack-social-basic-plan-block-editor', {
		site: getSiteFragment() || '',
		query: 'redirect_to=' + encodeURIComponent( window.location.href ),
	} );
}

/**
 * Get the current period identifier in yyyy-mm format, using the site timezone.
 *
 * @return The current period string.
 */
export function getCurrentPeriod() {
	return date( 'Y-m' );
}

/**
 * Get the period identifier for a given unix timestamp.
 *
 * @param {number} timestamp - Unix timestamp in seconds.
 * @return The period string ('yyyy-mm' for paid plans, 'free' for free plans).
 */
export function getPeriodForTimestamp( timestamp: number ): string {
	return hasSocialPaidFeatures() ? date( 'Y-m', new Date( timestamp * 1000 ) ) : 'free';
}

/**
 * Get a human-readable reset date string for the next billing period.
 *
 * @return The formatted reset date string (e.g., "May 1 (12 days)").
 */
export function getResetDate() {
	const now = getDate();
	const nextMonth = getDate( date( 'Y-m-01', now ) );
	nextMonth.setMonth( nextMonth.getMonth() + 1 );

	const resetDate = date( 'F j', nextMonth );
	const timeLeft = humanTimeDiff( nextMonth, now );

	return sprintf(
		/* translators: %1$s: date (e.g., "May 1"), %2$s: human-readable time until reset (e.g., "in 12 days") */
		__( '%1$s (%2$s)', 'jetpack-publicize-pkg' ),
		resetDate,
		timeLeft
	);
}
