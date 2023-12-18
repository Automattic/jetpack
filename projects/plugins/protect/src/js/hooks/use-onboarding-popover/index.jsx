import { Text, Button, getRedirectUrl, useBreakpointMatch } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useMemo, useCallback, useRef, createRef } from 'react';
import API from '../../api';
import useThreatsList from '../../components/threats-list/use-threats-list';
import { JETPACK_SCAN_SLUG } from '../../constants';
import useAnalyticsTracks from '../use-analytics-tracks';
import useProtectData from '../use-protect-data';

const useOnboardingPopover = () => {
	const { adminUrl, siteSuffix, freeOnboardingDismissed, paidOnboardingDismissed } =
		window.jetpackProtectInitialState;
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const { hasRequiredPlan } = useProtectData();

	const { list } = useThreatsList();
	const fixableList = list.filter( obj => obj.fixable );

	const { run } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN_SLUG,
		redirectUrl: adminUrl,
	} );
	const { recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_onboarding_get_scan_link_click', run );

	const refs = useRef( {} ).current;

	const [ onboardingPopoverArgs, setOnboardingPopoverArgs ] = useState( null );
	const [ onboardingStep, setOnboardingStep ] = useState( 1 );
	const [ anchors, setAnchors ] = useState( {} );

	const totalSteps = useMemo( () => {
		if ( ! hasRequiredPlan || list.length === 0 ) {
			return 2;
		} else if ( fixableList.length === 0 ) {
			return 3;
		}

		return 4;
	}, [ hasRequiredPlan, list, fixableList ] );

	const incrementOnboardingPopoverStep = useCallback( () => {
		if ( onboardingStep === 4 ) {
			setOnboardingStep( null );
			return;
		}
		setOnboardingStep( onboardingStep + 1 );
	}, [ onboardingStep ] );

	const closeOnboardingPopover = useCallback( () => {
		setOnboardingStep( null );
	}, [] );

	const dismissOnboardingPopover = useCallback( () => {
		API.protectOnboardingDismissed();
		setOnboardingStep( null );
	}, [] );

	const getRef = useCallback(
		key => {
			if ( ! refs[ key ] ) {
				refs[ key ] = createRef();
			}
			return refs[ key ];
		},
		[ refs ]
	);

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

	useEffect( () => {
		const getOnboardingPopoverArgs = () => {
			// No popovers if both free and paid onboarding have been dismissed
			if ( freeOnboardingDismissed && paidOnboardingDismissed ) {
				return null;
			}

			switch ( onboardingStep ) {
				case 1:
					// Show yourScanResultsPopoverArgs only if the respective onboarding is not dismissed
					if ( ! hasRequiredPlan && ! freeOnboardingDismissed ) {
						return yourScanResultsPopoverArgs;
					}
					if ( hasRequiredPlan && ! paidOnboardingDismissed ) {
						return yourScanResultsPopoverArgs;
					}
					break;

				case 2:
					if ( ! hasRequiredPlan ) {
						if ( ! freeOnboardingDismissed ) {
							return dailyAutomatedScansPopoverArgs;
						}
					} else {
						if ( paidOnboardingDismissed ) {
							return null;
						}

						if ( list.length === 0 ) {
							return { ...dailyAndManualScansPopoverArgs, anchor: anchors.anchor2b };
						}
						if ( fixableList.length === 0 ) {
							return understandSeverityPopoverArgs;
						}
						return fixAllThreatsPopoverArgs;
					}
					break;

				case 3:
					if ( hasRequiredPlan && ! paidOnboardingDismissed ) {
						if ( fixableList.length === 0 ) {
							return { ...dailyAndManualScansPopoverArgs, anchor: anchors.anchor4 };
						}
						return understandSeverityPopoverArgs;
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
		};

		setOnboardingPopoverArgs( getOnboardingPopoverArgs() );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		onboardingStep,
		freeOnboardingDismissed,
		paidOnboardingDismissed,
		hasRequiredPlan,
		anchors,
	] );

	useEffect( () => {
		const updatedAnchors = Object.keys( refs ).reduce( ( acc, key ) => {
			acc[ key ] = refs[ key ].current;
			return acc;
		}, {} );

		setAnchors( prevAnchors => ( {
			...prevAnchors,
			...updatedAnchors,
		} ) );
	}, [ refs, setAnchors ] );

	return {
		anchors,
		onboardingPopoverArgs,
		closeOnboardingPopover,
		getRef,
	};
};

export default useOnboardingPopover;
