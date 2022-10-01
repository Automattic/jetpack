import { DonutMeter, Gridicon } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';

import './style.scss';

// Tackle numbers with commas.
const numberWithCommas = x => {
	return x.toString().replace( /\B(?=(\d{3})+(?!\d))/g, ',' );
};

/**
 * Returns a DonutMeterContainer describing resource usage.
 *
 * @param {object}prop - props to show usage info.
 * @param {number}prop.current - totalCount to the DonutMeter.
 * @param {number}prop.limit - segmentCount to the DonutMeter.
 * @param {string}prop.title - title to the DonutMeter.
 * @returns {React.Component} DonutMeterContainer component.
 */
const DonutMeterContainer = ( { current = 0, limit = 1, title } ) => {
	// TODO: Remove local callback in favour of props.
	const tempCallback = () => {
		// eslint-disable-next-line no-console
		console.log( 'higher level callback...' );
	};

	const usageInfo = numberWithCommas( current ) + '/' + numberWithCommas( limit );
	return (
		<div className="donut-meter-container">
			<div className="donut-meter-wrapper">
				<DonutMeter segmentCount={ current } totalCount={ limit } />
			</div>
			<div className="donut-info-wrapper">
				<InfoPrimary localizedMessage={ title } iconClickedCallback={ tempCallback } />
				<InfoSecondary localizedMessage={ usageInfo } linkClickedCallback={ tempCallback } />
			</div>
		</div>
	);
};

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
		<div className="donut-info-primary">
			{ localizedMessage }{ ' ' }
			{ haveCallback && (
				<a href="#" className="info-icon-wrapper" onClick={ onIconClicked }>
					<Gridicon className="" icon="info-outline" size={ 16 } />
				</a>
			) }
		</div>
	);
};

const InfoSecondary = ( { localizedMessage, linkClickedCallback } ) => {
	// Verify callback before usage.
	const haveCallback = typeof linkClickedCallback === 'function';
	// Package and forward click event.
	const onLinkClicked = e => {
		callbackForwarder( e, linkClickedCallback );
	};
	return (
		<div className="donut-info-secondary">
			{ localizedMessage }{ ' ' }
			{ haveCallback && (
				<a href="#" className="info-link" onClick={ onLinkClicked }>
					{ __( 'View details', 'jetpack-search-pkg' ) }
				</a>
			) }
		</div>
	);
};

export default DonutMeterContainer;
