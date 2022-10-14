import {
	ContextualUpgradeTrigger,
	ThemeProvider,
	numberFormat,
} from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import React, { useState, useCallback, useMemo } from 'react';
import DonutMeterContainer from '../../donut-meter-container';
import PlanSummary from './plan-summary';

// import './plan-usage-section.scss';

const usageInfoFromAPIData = apiData => {
	// Transform the data as necessary.
	// Are there better defaults for the Max values?
	// Should we record, log, or otherwise surface potential errors here?
	return {
		recordCount: apiData?.currentUsage?.num_records || 0,
		recordMax: apiData?.currentPlan?.record_limit || 0,
		requestCount: apiData?.latestMonthRequests?.num_requests || 0,
		requestMax: apiData?.currentPlan.monthly_search_request_limit || 0,
	};
};

const upgradeMessageRecords = apiData => {
	// Return a valid message or null.
	const isRecordsScenario =
		apiData.currentUsage.upgrade_reason.records && ! apiData.currentUsage.upgrade_reason.requests;
	if ( ! isRecordsScenario ) {
		return null;
	}
	// Possible "near" messages here.
	// Interesting that the design for records differs from requests.
	// We only have the one message here vs three for requests.
	const messageNearLimit = __(
		'You’re close to exceeding the number of site records available on the free plan.',
		'jetpack-search-pkg'
	);
	// Possible "over" messages here.
	const messageOverLimitOne = __(
		'You’ve exceeded the number of site records available on the free plan.',
		'jetpack-search-pkg'
	);
	const messageOverLimitTwo = __(
		'You’ve exceeded the number of site records available on the free plan for two consecutive months.',
		'jetpack-search-pkg'
	);
	const messageOverLimitThree = __(
		'You’ve exceeded the number of site records available on the free plan for three consecutive months.',
		'jetpack-search-pkg'
	);
	// Note: The API doesn't give us enough data to make use of all the near cases.
	// Start by containing the index.
	let index = apiData.currentUsage.months_over_plan_records_limit;
	if ( index < 0 ) {
		index = 0;
	} else if ( index > 3 ) {
		index = 3;
	}
	// Pick the appropriate message.
	const message = [
		messageNearLimit,
		messageOverLimitOne,
		messageOverLimitTwo,
		messageOverLimitThree,
	][ index ];
	// Possible CTA messages here.
	const ctaUpgradeToAvoid = __(
		'Upgrade now to increase your monthly record limit and avoid interruption!',
		'jetpack-search-pkg'
	);
	const ctaUpgradeToContinue = __(
		'Upgrade now to continue using Jetpack Search.',
		'jetpack-search-pkg'
	);
	// Pick the appropriate CTA.
	let cta = ctaUpgradeToAvoid;
	if ( apiData.currentUsage.months_over_plan_records_limit >= 3 ) {
		cta = ctaUpgradeToContinue;
	}

	return { description: message, cta: cta };
};

const upgradeMessageRequests = apiData => {
	// Return a valid message or null.
	const isRequestsScenario =
		! apiData.currentUsage.upgrade_reason.records && apiData.currentUsage.upgrade_reason.requests;
	if ( ! isRequestsScenario ) {
		return null;
	}
	// Possible "near" messages here.
	// Interesting that the design for records differs from requests.
	// We have three message here vs one for records.
	const messageNearLimitOne = __(
		'You’re close to exceeding the number of search requests available on the free plan.',
		'jetpack-search-pkg'
	);
	const messageNearLimitTwo = __(
		'You’re close to exceeding the number of search requests available on the free plan for two consecutive months.',
		'jetpack-search-pkg'
	);
	const messageNearLimitThree = __(
		'You’re close to exceeding the number of search requests available on the free plan for three consecutive months.',
		'jetpack-search-pkg'
	);
	// Possible "over" messages here.
	const messageOverLimitOne = __(
		'You’ve exceeded the number of search requests available on the free plan.',
		'jetpack-search-pkg'
	);
	const messageOverLimitTwo = __(
		'You’ve exceeded the number of search requests available on the free plan for two consecutive months.',
		'jetpack-search-pkg'
	);
	const messageOverLimitThree = __(
		'You’ve exceeded the number of search requests available on the free plan for three consecutive months.',
		'jetpack-search-pkg'
	);
	// Note: The API doesn't give us enough data to determine the near cases.
	// Start by containing the index.
	let index = apiData.currentUsage.months_over_plan_requests_limit;
	if ( index < 0 ) {
		index = 0;
	} else if ( index > 3 ) {
		index = 3;
	}
	// Pick the appropriate message.
	const message = [
		messageNearLimitOne,
		messageOverLimitOne,
		messageOverLimitTwo,
		messageOverLimitThree,
		messageNearLimitTwo, // not used
		messageNearLimitThree, // not used
	][ index ];
	// Possible CTA messages here.
	const ctaUpgradeToAvoid = __(
		'Upgrade now to increase your monthly request limit and avoid interruption.',
		'jetpack-search-pkg'
	);
	const ctaUpgradeToContinue = __(
		'Upgrade now to contineu using Jetpack Search.',
		'jetpack-search-pkg'
	);
	// Pick the appropriate CTA.
	let cta = ctaUpgradeToAvoid;
	if ( apiData.currentUsage.months_over_plan_requests_limit >= 3 ) {
		cta = ctaUpgradeToContinue;
	}

	return { description: message, cta: cta };
};

const upgradeMessageNoOverage = () => {
	// Always returns a valid message.
	const message = __(
		'Do you want to increase your site records and search requests?.',
		'jetpack-search-pkg'
	);
	const cta = __( 'Upgrade now and avoid any future interruption!', 'jetpack-search-pkg' );
	return { description: message, cta: cta };
};

const upgradeMessageBoth = apiData => {
	// Return a valid message or null.
	const isBothScenario =
		apiData.currentUsage.upgrade_reason.records && apiData.currentUsage.upgrade_reason.requests;
	if ( ! isBothScenario ) {
		return null;
	}
	// Determine upgrade message.
	const messageNearLimit = __(
		'You’re close to exceeding the number of site records and search requests available for the free plan.',
		'jetpack-search-pkg'
	);
	const messageOverLimit = __(
		'You’ve exceeded the number of site records and search requests available for the free plan.',
		'jetpack-search-pkg'
	);
	// If the "months over" is zero, use the near messaging.
	let message = messageOverLimit;
	if ( apiData.currentUsage.months_over_plan_records_limit === 0 ) {
		message = messageNearLimit;
	}
	// Add the shared CTA.
	const sharedCTA = __(
		'Upgrade now to increase your limits and avoid interruption!',
		'jetpack-search-pkg'
	);
	return { description: message, cta: sharedCTA };
};

const upgradeMessageFromAPIData = apiData => {
	// What's the data we're working with?
	// apiData.currentUsage.must_upgrade
	// apiData.currentUsage.upgrade_reason.records
	// apiData.currentUsage.upgrade_reason.requests
	// apiData.currentUsage.months_over_plan_records_limit
	// apiData.currentUsage.months_over_plan_requests_limit
	if ( ! apiData.currentUsage.must_upgrade ) {
		return null;
	}
	// Handle both case.
	let message = upgradeMessageBoth( apiData );
	if ( message ) {
		return message;
	}
	// Handle Records overages.
	message = upgradeMessageRecords( apiData );
	if ( message ) {
		return message;
	}
	// Handle Requests overages.
	message = upgradeMessageRequests( apiData );
	if ( message ) {
		return message;
	}
	// Handle the default case.
	return upgradeMessageNoOverage();
};

// TODO: Remove this if no longer needed.
// Currently not called. Not removing yet, pending review of new CTA logic (which feels messy).
// eslint-disable-next-line no-unused-vars
const upgradeTypeFromAPIData = apiData => {
	// Determine if upgrade message is needed.
	if ( ! apiData.currentUsage.must_upgrade ) {
		return null;
	}

	// Determine appropriate upgrade message.
	let mustUpgradeReason = '';
	if ( apiData.currentUsage.upgrade_reason.requests ) {
		mustUpgradeReason = 'requests';
	}
	if ( apiData.currentUsage.upgrade_reason.records ) {
		mustUpgradeReason = mustUpgradeReason === 'requests' ? 'both' : 'records';
	}

	return mustUpgradeReason;
};

const PlanUsageSection = ( { isFreePlan, planInfo, sendPaidPlanToCart, isPlanJustUpgraded } ) => {
	// const upgradeType = upgradeTypeFromAPIData( planInfo );
	const upgradeMessage = isFreePlan ? upgradeMessageFromAPIData( planInfo ) : null;
	const usageInfo = usageInfoFromAPIData( planInfo );

	return (
		<div className="jp-search-dashboard-wrap jp-search-dashboard-meter-wrap">
			<div className="jp-search-dashboard-row">
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				<div className="jp-search-dashboard-meter-wrap__content lg-col-span-8 md-col-span-6 sm-col-span-4">
					<PlanSummary planInfo={ planInfo } />
					<UsageMeters usageInfo={ usageInfo } isPlanJustUpgraded={ isPlanJustUpgraded } />
					<UpgradeTrigger upgradeMessage={ upgradeMessage } ctaCallback={ sendPaidPlanToCart } />
					<AboutPlanLimits />
				</div>
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
			</div>
		</div>
	);
};

// TODO: Remove this if no longer needed.
// Currently not called. Not removing yet, pending review of new CTA logic (which feels messy).
// eslint-disable-next-line no-unused-vars
const getUpgradeMessages = () => {
	const upgradeMessages = {
		records: {
			description: __(
				"You’re close to exceeding this plan's number of records.",
				'jetpack-search-pkg'
			),
			cta: __(
				'Upgrade now to increase your monthly records limit and to avoid interruption!',
				'jetpack-search-pkg'
			),
		},
		requests: {
			description: __(
				"You’re close to exceeding this plan's number of requests.",
				'jetpack-search-pkg'
			),
			cta: __(
				'Upgrade now to increase your monthly requests limit and to avoid interruption!',
				'jetpack-search-pkg'
			),
		},
		both: {
			description: __(
				'You’re close to exceeding the number of records and search requests available in the free plan.',
				'jetpack-search-pkg'
			),
			cta: __(
				'Upgrade now to increase your limits and to avoid interruption!',
				'jetpack-search-pkg'
			),
		},
	};

	return upgradeMessages;
};

const UpgradeTrigger = ( { upgradeMessage, ctaCallback } ) => {
	// const upgradeMessage = type && getUpgradeMessages()[ type ];
	const triggerData = upgradeMessage && { ...upgradeMessage, onClick: ctaCallback };

	return (
		<>
			{ triggerData && (
				<ThemeProvider>
					<ContextualUpgradeTrigger { ...triggerData } />
				</ThemeProvider>
			) }
		</>
	);
};

const UsageMeters = ( { usageInfo, isPlanJustUpgraded } ) => {
	const [ currentTooltipIndex, setCurrentTooltipIndex ] = useState( 0 );
	const myStorage = window.localStorage;
	useMemo(
		() =>
			setCurrentTooltipIndex(
				myStorage.getItem( 'upgrade_tooltip_finished' ) ? 0 : +isPlanJustUpgraded
			),
		[ setCurrentTooltipIndex, myStorage, isPlanJustUpgraded ]
	);
	const setTooltipRead = useCallback( () => myStorage.setItem( 'upgrade_tooltip_finished', 1 ), [
		myStorage,
	] );
	const goToNext = useCallback( () => {
		setCurrentTooltipIndex( idx => {
			if ( idx >= 2 ) {
				setTooltipRead();
			}

			return idx + 1;
		} );
	}, [ setCurrentTooltipIndex, setTooltipRead ] );

	const tooltips = {
		record: {
			index: 1,
			title: __( 'Site records increased', 'jetpack-search-pkg' ),
			content: sprintf(
				// translators: %1$s: records limit
				__(
					'Thank you for upgrading! Now your visitors can search up to %1$s records.',
					'jetpack-search-pkg'
				),
				numberFormat( usageInfo.recordMax )
			),
			section: __( '1 of 2', 'jetpack-search-pkg' ),
			next: __( 'Next', 'jetpack-search-pkg' ),
			forceShow: currentTooltipIndex === 1,
			goToNext,
		},
		request: {
			index: 2,
			title: __( 'More search requests', 'jetpack-search-pkg' ),
			content: sprintf(
				// translators: %1$s: requests limit
				__(
					'Your search plugin now supports up to %1$s search requests per month.',
					'jetpack-search-pkg'
				),
				numberFormat( usageInfo.requestMax )
			),
			section: __( '2 of 2', 'jetpack-search-pkg' ),
			next: __( 'Finish', 'jetpack-search-pkg' ),
			forceShow: currentTooltipIndex === 2,
			goToNext,
		},
	};

	// TODO: Implement info icon callbacks.
	// Not clear if these are needed yet so for now, they're hidden.
	// const recordsIconClickedCallback = () => {};
	// const requestsIconClickedCallback = () => {};
	// TODO: Implement callback for the toggle details link.
	// No callback, no toggle.
	// const toggleDetailsClickedCallback = () => {};
	return (
		<div className="usage-meter-group">
			<DonutMeterContainer
				title={ __( 'Site records', 'jetpack-search-pkg' ) }
				current={ usageInfo.recordCount }
				limit={ usageInfo.recordMax }
				tooltip={ tooltips.record }
			/>
			<DonutMeterContainer
				title={ __( 'Search requests', 'jetpack-search-pkg' ) }
				current={ usageInfo.requestCount }
				limit={ usageInfo.requestMax }
				tooltip={ tooltips.request }
			/>
		</div>
	);
};

const AboutPlanLimits = () => {
	return (
		<div className="usage-meter-about">
			{ createInterpolateElement(
				__(
					'Tell me more about <jpPlanLimits>record indexing and request limits</jpPlanLimits>',
					'jetpack-search-pkg'
				),
				{
					jpPlanLimits: (
						<ExternalLink
							href="https://jetpack.com/support/search/"
							rel="noopener noreferrer"
							target="_blank"
							className="support-link"
						/>
					),
				}
			) }
		</div>
	);
};

export default PlanUsageSection;
