import { Text, Button, getRedirectUrl, useBreakpointMatch } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMemo, useCallback } from 'react';
import API from '../../api';
import useThreatsList from '../../components/threats-list/use-threats-list';
import { JETPACK_SCAN_SLUG } from '../../constants';
import { STORE_ID } from '../../state/store';
import useAnalyticsTracks from '../use-analytics-tracks';
import useProtectData from '../use-protect-data';
import useDynamicRefs from './use-dynamic-refs';

const useOnboarding = () => {
	const { setOnboardingStep } = useDispatch( STORE_ID );
	const onboardingStep = useSelect( select => select( STORE_ID ).getOnboardingStep() );

	const { adminUrl, siteSuffix, freeOnboardingDismissed, paidOnboardingDismissed } =
		window.jetpackProtectInitialState;
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const { hasRequiredPlan } = useProtectData();
	const { getRef, anchors } = useDynamicRefs();

	const { list } = useThreatsList();
	const fixableList = list.filter( obj => obj.fixable );

	const { run } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN_SLUG,
		redirectUrl: adminUrl,
	} );
	const { recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_onboarding_get_scan_link_click', run );

	const incrementOnboardingStep = useCallback( () => {
		if ( onboardingStep === 4 ) {
			setOnboardingStep( null );
			return;
		}
		setOnboardingStep( onboardingStep + 1 );
	}, [ onboardingStep, setOnboardingStep ] );

	const closeOnboarding = useCallback( () => {
		setOnboardingStep( null );
	}, [ setOnboardingStep ] );

	const dismissOnboarding = useCallback( () => {
		API.protectOnboardingDismissed();
		setOnboardingStep( null );
	}, [ setOnboardingStep ] );

	const calculateTotalSteps = () => {
		if ( ! hasRequiredPlan || list.length === 0 ) {
			return 2;
		}
		if ( fixableList.length === 0 ) {
			return 3;
		}
		return 4;
	};

	const totalSteps = useMemo( calculateTotalSteps, [ hasRequiredPlan, list, fixableList ] );

	// Define a helper function with common properties hardcoded
	const createPopoverArgs = ( {
		title,
		buttonContent,
		anchor,
		onClick,
		position,
		step,
		children,
	} ) => ( {
		title,
		buttonContent,
		anchor,
		onClose: closeOnboarding,
		onClick,
		noArrow: false,
		position,
		offset: 15,
		step,
		totalSteps: totalSteps,
		children,
	} );

	const yourScanResultsPopoverArgs = createPopoverArgs( {
		title: __( 'Your scan results', 'jetpack-protect' ),
		buttonContent: __( 'Next', 'jetpack-protect' ),
		anchor: anchors.yourScanResultsPopoverAnchor,
		onClick: incrementOnboardingStep,
		position: 'middle top',
		step: 1,
		children: (
			<Text>
				{ __(
					'Navigate through the results of the scan on your WordPress installation, plugins, themes and other files',
					'jetpack-protect'
				) }
			</Text>
		),
	} );

	const fixAllThreatsPopoverArgs = createPopoverArgs( {
		title: __( 'Auto-fix with one click', 'jetpack-protect' ),
		buttonContent: __( 'Next', 'jetpack-protect' ),
		anchor: anchors.fixAllThreatsPopoverAnchor,
		onClick: incrementOnboardingStep,
		position: isSm ? 'bottom right' : 'middle left',
		step: 2,
		children: (
			<Text>
				{ __(
					'Jetpack Protect offers one-click fixes for most threats. Press this button to be safe again.',
					'jetpack-protect'
				) }
				<br />
				<br />
				{ createInterpolateElement(
					__(
						"Note that you'll have to <credentialsLink>input your server credentials</credentialsLink> first.",
						'jetpack-protect'
					),
					{
						credentialsLink: (
							<Button
								variant="link"
								weight="regular"
								href={ getRedirectUrl( 'jetpack-settings-security-credentials', {
									site: siteSuffix,
								} ) }
							/>
						),
					}
				) }
			</Text>
		),
	} );

	const dailyAutomatedScansPopoverArgs = createPopoverArgs( {
		title: __( 'Daily automated scans', 'jetpack-protect' ),
		buttonContent: __( 'Finish', 'jetpack-protect' ),
		anchor: anchors.dailyAutomatedScansPopoverAnchor,
		onClick: dismissOnboarding,
		position: 'middle right',
		step: 2,
		children: (
			<Text>
				{ createInterpolateElement(
					__(
						'We run daily automated scans. Do you want ot be able to scan manually? <upgradeLink>Upgrade</upgradeLink>',
						'jetpack-protect'
					),
					{
						upgradeLink: <Button variant="link" weight="regular" onClick={ getScan } />,
					}
				) }
			</Text>
		),
	} );

	const understandSeverityPopoverArgs = createPopoverArgs( {
		title: __( 'Understand severity', 'jetpack-protect' ),
		buttonContent: __( 'Next', 'jetpack-protect' ),
		anchor: anchors.understandSeverityPopoverAnchor,
		onClick: incrementOnboardingStep,
		position: 'top middle',
		step: totalSteps - 1,
		children: (
			<Text>
				{ __(
					'Learn how critical these threats are for the security of your site by glancing at the severity labels.',
					'jetpack-protect'
				) }
			</Text>
		),
	} );

	const dailyAndManualScansPopoverArgs = createPopoverArgs( {
		title: __( 'Daily & manual scanning', 'jetpack-protect' ),
		buttonContent: __( 'Finish', 'jetpack-protect' ),
		anchor: anchors.dailyAndManualScansPopoverAnchor,
		onClick: dismissOnboarding,
		position: isSm ? 'bottom left' : 'middle left',
		step: totalSteps,
		children: (
			<Text>
				{ __(
					'We run daily automated scans but you can also run on-demand scans if you want to check the latest status.',
					'jetpack-protect'
				) }
			</Text>
		),
	} );

	const handleOnboardingStepOne = () => {
		if (
			( ! hasRequiredPlan && ! freeOnboardingDismissed ) ||
			( hasRequiredPlan && ! paidOnboardingDismissed )
		) {
			return yourScanResultsPopoverArgs;
		}
	};

	const handleOnboardingStepTwo = () => {
		if ( ! hasRequiredPlan && ! freeOnboardingDismissed ) {
			return dailyAutomatedScansPopoverArgs;
		} else if ( ! paidOnboardingDismissed ) {
			if ( list.length === 0 ) {
				return dailyAndManualScansPopoverArgs;
			} else if ( fixableList.length === 0 ) {
				return understandSeverityPopoverArgs;
			}
			return fixAllThreatsPopoverArgs;
		}
	};

	const handleOnboardingStepThree = () => {
		if ( hasRequiredPlan && ! paidOnboardingDismissed ) {
			return fixableList.length === 0
				? dailyAndManualScansPopoverArgs
				: understandSeverityPopoverArgs;
		}
	};

	const handleOnboardingStepFour = () => {
		if ( hasRequiredPlan && ! paidOnboardingDismissed ) {
			return dailyAndManualScansPopoverArgs;
		}
	};

	const onboardingStepHandlers = {
		1: handleOnboardingStepOne,
		2: handleOnboardingStepTwo,
		3: handleOnboardingStepThree,
		4: handleOnboardingStepFour,
	};

	const onboardingPopoverArgs = useMemo( () => {
		const handler = onboardingStepHandlers[ onboardingStep ];
		return handler ? handler() : null;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ list, onboardingStep, freeOnboardingDismissed, paidOnboardingDismissed, hasRequiredPlan ] );

	return {
		anchors,
		onboardingPopoverArgs,
		closeOnboarding,
		getRef,
	};
};

export default useOnboarding;
