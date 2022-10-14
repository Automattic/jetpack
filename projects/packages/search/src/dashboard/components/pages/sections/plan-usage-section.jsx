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

const PlanUsageSection = ( { planInfo, sendPaidPlanToCart, isPlanJustUpgraded } ) => {
	const upgradeType = upgradeTypeFromAPIData( planInfo );
	const usageInfo = usageInfoFromAPIData( planInfo );

	return (
		<div className="jp-search-dashboard-wrap jp-search-dashboard-meter-wrap">
			<div className="jp-search-dashboard-row">
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				<div className="jp-search-dashboard-meter-wrap__content lg-col-span-8 md-col-span-6 sm-col-span-4">
					<PlanSummary planInfo={ planInfo } />
					<UsageMeters usageInfo={ usageInfo } isPlanJustUpgraded={ isPlanJustUpgraded } />
					<UpgradeTrigger type={ upgradeType } ctaCallback={ sendPaidPlanToCart } />
					<AboutPlanLimits />
				</div>
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
			</div>
		</div>
	);
};

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

const UpgradeTrigger = ( { type, ctaCallback } ) => {
	const upgradeMessage = type && getUpgradeMessages()[ type ];
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
