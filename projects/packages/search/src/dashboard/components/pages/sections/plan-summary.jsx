import { __ } from '@wordpress/i18n';
import React from 'react';

const getPlanName = isFreePlan => {
	// Determine plan name for display.
	const paidText = __( 'Upgraded', 'jetpack-search-pkg' );
	const freeText = __( 'Free plan', 'jetpack-search-pkg' );
	return isFreePlan ? freeText : paidText;
};

const displayPeriodFromAPIData = apiData => {
	const startDate = new Date( apiData.latestMonthRequests.start_date );
	const endDate = new Date( apiData.latestMonthRequests.end_date );

	// Date formatted as: MMM DD
	// Example: Feb 02
	const localeOptions = {
		month: 'short',
		day: '2-digit',
	};

	// Leave the locale as `undefined` to apply the browser host locale.
	const startDateText = startDate.toLocaleDateString( undefined, localeOptions );
	const endDateText = endDate.toLocaleDateString( undefined, localeOptions );

	return `${ startDateText } - ${ endDateText }`;
};

const PlanSummary = ( { isFreePlan, planInfo } ) => {
	return (
		<h2>
			{
				// translators: Header for section showing search records and requests usage.
				__( 'Your usage', 'jetpack-search-pkg' )
			}{ ' ' }
			<span>
				{ displayPeriodFromAPIData( planInfo ) } ({ getPlanName( isFreePlan ) })
			</span>
		</h2>
	);
};

export default PlanSummary;
