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
	const tempCallback = () => {
		// eslint-disable-next-line no-console
		console.log( 'higher level callback...' );
	};
	return (
		<div className="donut-meter-container">
			<div className="donut-meter-wrapper">
				<DonutMeter />
			</div>
			<div className="donut-info-wrapper">
				<InfoPrimary localizedMessage={ 'Title message' } iconClickedCallback={ tempCallback } />
				<InfoSecondary localizedMessage={ 'message' } linkClickedCallback={ tempCallback } />
			</div>
		</div>
	);
}

// Prevents event from firing and forwards to caller.
const callbackForwarder = ( event, callback ) => {
	event.preventDefault();
	callback();
};

const InfoPrimary = ( { localizedMessage, iconClickedCallback } ) => {
	// Verify callback before usage.
	const haveCallback = typeof iconClickedCallback === 'function';
	// Package and forward click event.
	const onIconClicked = e => {
		callbackForwarder( e, iconClickedCallback );
	};
	return (
		<p className="donut-info-primary">
			{ localizedMessage }{ ' ' }
			{ haveCallback && (
				<a href="#" className="info-icon-wrapper" onClick={ onIconClicked }>
					<Gridicon className="" icon="info-outline" size={ 16 } />
				</a>
			) }
		</p>
	);
};

const InfoSecondary = ( { localizedMessage, linkClickedCallback } ) => {
	// TODO: Localize linkText.
	const linkText = 'Show details';
	// Verify callback before usage.
	const haveCallback = typeof linkClickedCallback === 'function';
	// Package and forward click event.
	const onLinkClicked = e => {
		callbackForwarder( e, linkClickedCallback );
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
