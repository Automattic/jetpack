import { Text, Button, getRedirectUrl, useBreakpointMatch } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { JETPACK_SCAN_SLUG } from '../../constants';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useOnboarding from '../../hooks/use-onboarding';

const useScanPopoverArgs = ( { anchors, totalSteps } ) => {
	const { adminUrl, siteSuffix } = window.jetpackProtectInitialState;
	const { incrementOnboardingStep, dismissOnboarding, defaultPopoverArgs } = useOnboarding();
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const { run } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN_SLUG,
		redirectUrl: adminUrl,
	} );
	const { recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_onboarding_get_scan_link_click', run );

	const handleDismiss = () => {
		API.scanOnboardingDismissed();
	};

	return {
		yourScanResults: {
			...defaultPopoverArgs,
			title: __( 'Your scan results', 'jetpack-protect' ),
			buttonContent: __( 'Next', 'jetpack-protect' ),
			anchor: anchors.yourScanResultsPopoverAnchor,
			onClick: () => incrementOnboardingStep( totalSteps ),
			position: 'middle top',
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
		},

		fixAllThreats: {
			...defaultPopoverArgs,
			title: __( 'Auto-fix with one click', 'jetpack-protect' ),
			buttonContent: __( 'Next', 'jetpack-protect' ),
			anchor: anchors.fixAllThreatsPopoverAnchor,
			onClick: () => incrementOnboardingStep( totalSteps ),
			position: isSm ? 'bottom right' : 'middle left',
			step: 2,
			totalSteps: totalSteps,
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
		},

		understandSeverity: {
			...defaultPopoverArgs,
			title: __( 'Understand severity', 'jetpack-protect' ),
			buttonContent: __( 'Next', 'jetpack-protect' ),
			anchor: anchors.understandSeverityPopoverAnchor,
			onClick: () => incrementOnboardingStep( totalSteps ),
			position: 'top middle',
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
		},

		dailyAutomatedScans: {
			...defaultPopoverArgs,
			title: __( 'Daily automated scans', 'jetpack-protect' ),
			buttonContent: __( 'Finish', 'jetpack-protect' ),
			anchor: anchors.dailyAutomatedScansPopoverAnchor,
			onClick: () => dismissOnboarding( handleDismiss ),
			position: 'middle right',
			step: 2,
			totalSteps: totalSteps,
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
		},

		dailyAndManualScans: {
			...defaultPopoverArgs,
			title: __( 'Daily & manual scanning', 'jetpack-protect' ),
			buttonContent: __( 'Finish', 'jetpack-protect' ),
			anchor: anchors.dailyAndManualScansPopoverAnchor,
			onClick: () => dismissOnboarding( handleDismiss ),
			position: isSm ? 'bottom left' : 'middle left',
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
		},
	};
};

export default useScanPopoverArgs;
