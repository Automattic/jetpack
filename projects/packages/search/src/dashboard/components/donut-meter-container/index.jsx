import { DonutMeter, Gridicon } from '@automattic/jetpack-components';
import React from 'react';

import './style.scss';

/**
 * Returns a DonutMeterContainer describing resource usage.
 *
 * @returns {React.Component} DonutMeterContainer component.
 */
function DonutMeterContainer() {
	// TODO: Remove local callback in favour of props.
	const onLinkClicked = () => {
		// eslint-disable-next-line no-console
		console.log( 'higher level callback...' );
	};
	return (
		<div className="donut-meter-container">
			<div className="donut-meter-wrapper">
				<DonutMeter />
			</div>
			<div className="donut-info-wrapper">
				<InfoPrimary />
				<InfoSecondary localizedMessage={ 'message' } linkClickedCallback={ onLinkClicked } />
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

const InfoSecondary = ( { localizedMessage, linkClickedCallback } ) => {
	// TODO: Localize linkText.
	const linkText = 'Show details';
	// Verify callback before usage.
	const haveCallback = typeof linkClickedCallback === 'function';
	// Our local callback to prevent refresh.
	const onLinkClicked = e => {
		e.preventDefault();
		// TODO: Remove logging.
		// eslint-disable-next-line no-console
		console.log( 'link clicked...' );
		linkClickedCallback();
	};
	return (
		<p className="donut-info-secondary">
			{ localizedMessage }{ ' ' }
			{ haveCallback && (
				<a href="#" onClick={ onLinkClicked }>
					{ linkText }
				</a>
			) }
		</p>
	);
};

export default DonutMeterContainer;
