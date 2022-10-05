import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import DonutMeterContainer from '../../donut-meter-container';

// import './plan-usage-section.scss';

// TODO: Replace local PlanSummary component with new component when ready.
const PlanUsageSection = props => {
	if ( ! props.isVisible ) {
		return null;
	}
	return (
		<div className="jp-search-dashboard-wrap jp-search-dashboard-meter-wrap">
			<div className="jp-search-dashboard-row">
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				<div className="jp-search-dashboard-meter-wrap__content lg-col-span-8 md-col-span-6 sm-col-span-4">
					<PlanSummary />
					<UsageMeters />
					<UsageMetersAbout />
				</div>
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
			</div>
		</div>
	);
};

const PlanSummary = () => {
	return (
		<h2>
			{ createInterpolateElement(
				sprintf(
					// translators: %1$s: usage period, %2$s: plan name
					__( 'Your usage <s>%1$s (%2$s)</s>', 'jetpack-search-pkg' ),
					'Sep 28-Oct 28',
					__( 'Free plan', 'jetpack-search-pkg' )
				),
				{
					s: <span />,
				}
			) }
		</h2>
	);
};

const UsageMeters = () => {
	return (
		<div className="usage-meter-group">
			<DonutMeterContainer
				title={ __( 'Site records', 'jetpack-search-pkg' ) }
				current={ 1250 }
				limit={ 5000 }
			/>
			<DonutMeterContainer
				title={ __( 'Search requests', 'jetpack-search-pkg' ) }
				current={ 125 }
				limit={ 500 }
			/>
		</div>
	);
};

const UsageMetersAbout = () => {
	return (
		<div className="usage-meter-about">
			{ createInterpolateElement(
				__( 'Tell me more about <u>record indexing and request limits</u>', 'jetpack-search-pkg' ),
				{
					u: <u />,
				}
			) }
		</div>
	);
};

export default PlanUsageSection;
