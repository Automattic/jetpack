import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';

// import './plan-summary.scss';

const PlanSummary = props => {
	// TODO: Pull values from props.
	const planName = 'Free or Paid?!';
	const displayPeriod = 'Sep 28-Oct 28';
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
