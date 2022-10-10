import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';

// import './plan-summary.scss';

const planNameFromAPIData = apiData => {
	// Determine plan name for display.
	const planType = apiData?.tierSlug;
	const planName = planType
		? __( 'Paid Plan', 'jetpack-search-pkg' )
		: __( 'Free Plan', 'jetpack-search-pkg' );
	return planName;
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

const PlanSummary = ( { planInfo } ) => {
	const planName = planNameFromAPIData( planInfo );
	const displayPeriod = displayPeriodFromAPIData( planInfo );
	return (
		<h2>
			{ createInterpolateElement(
				sprintf(
					// translators: %1$s: usage period, %2$s: plan name
					__( 'Your usage <s>%1$s (%2$s)</s>', 'jetpack-search-pkg' ),
					displayPeriod,
					planName
				),
				{
					s: <span />,
				}
			) }
		</h2>
	);
};

export default PlanSummary;
