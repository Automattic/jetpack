import { ActionPopover } from '@automattic/jetpack-components';
import { useMemo, useEffect } from 'react';
import useOnboarding from '../../hooks/use-onboarding';
import useProtectData from '../../hooks/use-protect-data';
import useThreatsList from '../threats-list/use-threats-list';
import useScanPopoverArgs from './use-scan-popover-args';

const ScanOnboarding = ( { anchors } ) => {
	const { freeScanOnboardingDismissed, paidScanOnboardingDismissed } =
		window.jetpackProtectInitialState;
	const { hasRequiredPlan } = useProtectData();
	const { commonPopoverArgs, resetOnboardingOnAnchorRegeneration, getCurrentPopoverArgs } =
		useOnboarding();

	const { list } = useThreatsList();
	const fixableList = list.filter( obj => obj.fixable );

	const maxSteps = 4;
	const minSteps = 2;
	const alternateMaxSteps = 3;

	// Define logic for determining total steps
	const calculateTotalSteps = () => {
		if ( ! hasRequiredPlan || list.length === 0 ) {
			return minSteps;
		}
		if ( fixableList.length === 0 ) {
			return alternateMaxSteps;
		}
		return maxSteps;
	};

	const totalSteps = useMemo( calculateTotalSteps, [ hasRequiredPlan, list, fixableList ] );

	// Retrieve args defined for each popover
	const uniquePopoverArgs = useScanPopoverArgs( { anchors, totalSteps } );

	const scanOnboardingPopoverArgs = useMemo( () => {
		// Define logic for determining which popover args to use
		const scanOnboardingStepHandlers = {
			// Handle step 1
			1: () => {
				if (
					( ! hasRequiredPlan && ! freeScanOnboardingDismissed ) ||
					( hasRequiredPlan && ! paidScanOnboardingDismissed )
				) {
					return uniquePopoverArgs.yourScanResults;
				}
			},
			// Handle step 2
			2: () => {
				if ( ! hasRequiredPlan && ! freeScanOnboardingDismissed ) {
					return uniquePopoverArgs.dailyAutomatedScans;
				} else if ( ! paidScanOnboardingDismissed ) {
					if ( list.length === 0 ) {
						return uniquePopoverArgs.dailyAndManualScans;
					} else if ( fixableList.length === 0 ) {
						return uniquePopoverArgs.understandSeverity;
					}
					return uniquePopoverArgs.fixAllThreats;
				}
			},
			// Handle step 3
			3: () => {
				if ( hasRequiredPlan && ! paidScanOnboardingDismissed ) {
					return fixableList.length === 0
						? uniquePopoverArgs.dailyAndManualScans
						: uniquePopoverArgs.understandSeverity;
				}
			},
			// Handle step 4
			4: () => {
				if ( hasRequiredPlan && ! paidScanOnboardingDismissed ) {
					return uniquePopoverArgs.dailyAndManualScans;
				}
			},
		};

		return getCurrentPopoverArgs( scanOnboardingStepHandlers );
	}, [
		list,
		fixableList,
		getCurrentPopoverArgs,
		uniquePopoverArgs,
		freeScanOnboardingDismissed,
		paidScanOnboardingDismissed,
		hasRequiredPlan,
	] );

	// Reset onboarding when anchors reset before regenerating
	useEffect( () => {
		resetOnboardingOnAnchorRegeneration( anchors );
	}, [ anchors, resetOnboardingOnAnchorRegeneration ] );

	return <ActionPopover { ...{ ...scanOnboardingPopoverArgs, ...commonPopoverArgs } } />;
};

export default ScanOnboarding;
