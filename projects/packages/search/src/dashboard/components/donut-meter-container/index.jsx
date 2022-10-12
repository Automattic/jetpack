import { DonutMeter, Gridicon, numberFormat } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';

import './style.scss';

// Format numbers with separators.
const formatNumberWithSeparators = x => {
	return numberFormat( x );
};

/**
 * Returns a DonutMeterContainer describing resource usage.
 *
 * @param {object} props - Props
 * @param {number} props.current - totalCount to the DonutMeter
 * @param {number} props.limit - segmentCount to the DonutMeter
 * @param {string} props.title - title to the DonutMeter
 * @param {Function} props.iconClickedCallback - handler for click on "info" icon
 * @param {Function} props.linkClickedCallback - handler for click on "details" link
 * @returns {React.Component} DonutMeterContainer component
 */
const DonutMeterContainer = ( {
	current = 0,
	limit = 1,
	title,
	iconClickedCallback,
	linkClickedCallback,
} ) => {
	// Special case for "unlimited" requests.
	const isUnlimitedRequests = limit === 9223372036854776000;
	const usageInfo = isUnlimitedRequests
		? '0/Unlimited'
		: formatNumberWithSeparators( current ) + '/' + formatNumberWithSeparators( limit );
	const displayCurrent = isUnlimitedRequests ? 1 : current;
	const displayLimit = isUnlimitedRequests ? 1 : limit;
	return (
		<div className="donut-meter-container">
			<div className="donut-meter-wrapper">
				<DonutMeter segmentCount={ displayCurrent } totalCount={ displayLimit } />
			</div>
			<div className="donut-info-wrapper">
				<InfoPrimary localizedMessage={ title } iconClickedCallback={ iconClickedCallback } />
				<InfoSecondary localizedMessage={ usageInfo } linkClickedCallback={ linkClickedCallback } />
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
