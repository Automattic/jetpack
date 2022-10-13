import {
	DonutMeter,
	Gridicon,
	numberFormat,
	IconTooltip,
	Button,
	ThemeProvider,
} from '@automattic/jetpack-components';
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
 * @param {object} props.tooltip - tooltip data
 * @returns {React.Component} DonutMeterContainer component
 */
const DonutMeterContainer = ( {
	current = 0,
	limit = 1,
	title,
	tooltip,
	iconClickedCallback,
	linkClickedCallback,
} ) => {
	// Special case for "unlimited" requests, which has a limit of 64-bit PHP_INT_MAX.
	const isUnlimitedRequests = limit > 1e18;
	const localizedUnlimited = __( 'Unlimited', 'jetpack-search-pkg' );
	const usageInfo = isUnlimitedRequests
		? `0/${ localizedUnlimited }`
		: formatNumberWithSeparators( current ) + '/' + formatNumberWithSeparators( limit );
	const displayCurrent = isUnlimitedRequests ? 1 : current;
	const displayLimit = isUnlimitedRequests ? 1 : limit;

	const tooltipArgs = {
		shadowAnchor: true,
		title: tooltip.title,
		placement: 'top',
		forceShow: tooltip.forceShow,
	};

	return (
		<ThemeProvider>
			<div className="donut-meter-container">
				<div className="donut-meter-wrapper">
					<DonutMeter segmentCount={ displayCurrent } totalCount={ displayLimit } />
					<div className="upgrade-tooltip-shadow-anchor">
						<IconTooltip { ...tooltipArgs }>
							<>
								<div>{ tooltip.content }</div>
								<div className="upgrade-tooltip-actions">
									<span>{ tooltip.section }</span>
									<Button onClick={ tooltip.goToNext }>{ tooltip.next }</Button>
								</div>
							</>
						</IconTooltip>
					</div>
				</div>
				<div className="donut-info-wrapper">
					<InfoPrimary localizedMessage={ title } iconClickedCallback={ iconClickedCallback } />
					<InfoSecondary
						localizedMessage={ usageInfo }
						linkClickedCallback={ linkClickedCallback }
					/>
				</div>
			</div>
		</ThemeProvider>
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
