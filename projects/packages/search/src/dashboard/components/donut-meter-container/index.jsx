import { DonutMeter, Gridicon } from '@automattic/jetpack-components';
import React from 'react';

import './style.scss';

/**
 * Returns a DonutMeterContainer describing resource usage.
 *
 * @returns {React.Component} DonutMeterContainer component.
 */
function DonutMeterContainer() {
	return (
		<div className="donut-meter-container">
			<div className="donut-meter-wrapper">
				<DonutMeter />
			</div>
			<div className="donut-info-wrapper">
				<InfoPrimary />
				<InfoSecondary />
			</div>
		</div>
	);
}

const InfoPrimary = () => {
	return (
		<p className="donut-info-primary">
			Site records{ ' ' }
			<a href="#" className="info-icon-wrapper">
				<Gridicon className="" icon="info-outline" size={ 16 } />
			</a>
		</p>
	);
};

const InfoSecondary = () => {
	return (
		<p className="donut-info-secondary">
			212/500 <a href="#">Show details</a>
		</p>
	);
};

export default DonutMeterContainer;
