import { DonutMeter, Gridicon } from '@automattic/jetpack-components';
import React from 'react';

import './style.scss';

/**
 * Returns a DonutMeterContainer describing resource usage.
 *
 * @returns {React.Component} notice box component.
 */
function DonutMeterContainer() {
	return (
		<div className="donut-meter-container">
			<div className="donut-meter-wrapper">
				<DonutMeter />
			</div>
			<div className="donut-info-wrapper">
				<p className="donut-info-primary">
					Site records{ ' ' }
					<a href="#" className="info-icon-wrapper">
						<Gridicon className="" icon="info-outline" size={ 16 } />
					</a>
				</p>
				<p className="donut-info-secondary">
					212/500 <a href="#">Show details</a>
				</p>
			</div>
		</div>
	);
}

export default DonutMeterContainer;
