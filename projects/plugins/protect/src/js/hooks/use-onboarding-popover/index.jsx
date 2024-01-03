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

const useOnboardingPopover = () => {
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

	const incrementOnboardingPopoverStep = useCallback( () => {
		if ( onboardingStep === 4 ) {
			setOnboardingStep( null );
			return;
		}
		setOnboardingStep( onboardingStep + 1 );
	}, [ onboardingStep, setOnboardingStep ] );

	const closeOnboardingPopover = useCallback( () => {
		setOnboardingStep( null );
	}, [ setOnboardingStep ] );

	const dismissOnboardingPopover = useCallback( () => {
		API.protectOnboardingDismissed();
		setOnboardingStep( null );
	}, [ setOnboardingStep ] );

	let totalSteps;

	if ( ! hasRequiredPlan || list.length === 0 ) {
		totalSteps = 2;
	} else if ( fixableList.length === 0 ) {
		totalSteps = 3;
	} else {
		totalSteps = 4;
	}

	const yourScanResultsPopoverArgs = {
		title: __( 'Your scan results', 'jetpack-protect' ),
		buttonContent: __( 'Next', 'jetpack-protect' ),
		anchor: anchors.anchor1,
		onClose: closeOnboardingPopover,
		onClick: incrementOnboardingPopoverStep,
		noArrow: false,
		position: 'middle top',
		offset: 15,
		step: 1,
		totalSteps: totalSteps,
		children: (
			<Text>
				{ __(
					'Navigate through the results of the scan on your WordPress installation, plugins, themes and other files',
					'jetpack-protect'
				) }
			</Text>
		),
	};

	const fixAllThreatsPopoverArgs = {
		title: __( 'Auto-fix with one click', 'jetpack-protect' ),
		buttonContent: __( 'Next', 'jetpack-protect' ),
		anchor: anchors.anchor2,
		onClose: closeOnboardingPopover,
		onClick: incrementOnboardingPopoverStep,
		noArrow: false,
		position: isSm ? 'bottom right' : 'middle left',
		offset: 15,
		step: 2,
		totalSteps: 4,
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
	};

	const dailyAutomatedScansPopoverArgs = {
		title: __( 'Daily automated scans', 'jetpack-protect' ),
		buttonContent: __( 'Finish', 'jetpack-protect' ),
		anchor: anchors.anchor2a,
		onClose: closeOnboardingPopover,
		onClick: dismissOnboardingPopover,
		noArrow: false,
		position: 'middle right',
		offset: 15,
		step: 2,
		totalSteps: 2,
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
	};

	const understandSeverityPopoverArgs = {
		title: __( 'Understand severity', 'jetpack-protect' ),
		buttonContent: __( 'Next', 'jetpack-protect' ),
		anchor: anchors.anchor3,
		onClose: closeOnboardingPopover,
		onClick: incrementOnboardingPopoverStep,
		noArrow: false,
		position: 'top middle',
		offset: 15,
		step: totalSteps - 1,
		totalSteps: totalSteps,
		children: (
			<Text>
				{ __(
					'Learn how critical these threats are for the security of your site by glancing at the severity labels.',
					'jetpack-protect'
				) }
			</Text>
		),
	};

	const dailyAndManualScansPopoverArgs = {
		title: __( 'Daily & manual scanning', 'jetpack-protect' ),
		buttonContent: __( 'Finish', 'jetpack-protect' ),
		onClose: closeOnboardingPopover,
		onClick: dismissOnboardingPopover,
		noArrow: false,
		position: isSm ? 'bottom left' : 'middle left',
		offset: 15,
		step: totalSteps,
		totalSteps: totalSteps,
		children: (
			<Text>
				{ __(
					'We run daily automated scans but you can also run on-demand scans if you want to check the latest status.',
					'jetpack-protect'
				) }
			</Text>
		),
	};

	const onboardingPopoverArgs = useMemo( () => {
		if ( freeOnboardingDismissed && paidOnboardingDismissed ) {
			return null;
		}

		switch ( onboardingStep ) {
			case 1:
				if (
					( ! hasRequiredPlan && ! freeOnboardingDismissed ) ||
					( hasRequiredPlan && ! paidOnboardingDismissed )
				) {
					return yourScanResultsPopoverArgs;
				}
				break;

			case 2:
				if ( ! hasRequiredPlan && ! freeOnboardingDismissed ) {
					return dailyAutomatedScansPopoverArgs;
				} else if ( ! paidOnboardingDismissed ) {
					if ( list.length === 0 ) {
						return { ...dailyAndManualScansPopoverArgs, anchor: anchors.anchor2b };
					} else if ( fixableList.length === 0 ) {
						return understandSeverityPopoverArgs;
					}
					return fixAllThreatsPopoverArgs;
				}
				break;

			case 3:
				if ( hasRequiredPlan && ! paidOnboardingDismissed ) {
					return fixableList.length === 0
						? { ...dailyAndManualScansPopoverArgs, anchor: anchors.anchor4 }
						: understandSeverityPopoverArgs;
				}
				break;

			case 4:
				if ( hasRequiredPlan && ! paidOnboardingDismissed ) {
					return { ...dailyAndManualScansPopoverArgs, anchor: anchors.anchor4 };
				}
				break;

			default:
				return null;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		list,
		onboardingStep,
		freeOnboardingDismissed,
		paidOnboardingDismissed,
		hasRequiredPlan,
		anchors,
	] );

	return {
		anchors,
		onboardingPopoverArgs,
		closeOnboardingPopover,
		getRef,
	};
};

export default useOnboardingPopover;
