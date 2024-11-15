import { Button, Text, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import usePlan from '../../hooks/use-plan';

const { siteSuffix } = window.jetpackProtectInitialState;

const scanResultsTitle = __( 'Your scan results', 'jetpack-protect' );
const scanResultsDescription = (
	<Text>
		{ __(
			'Navigate through the results of the scan on your WordPress installation, plugins, themes, and other files',
			'jetpack-protect'
		) }
	</Text>
);
const UpgradeButton = props => {
	const { upgradePlan } = usePlan();
	const { recordEvent } = useAnalyticsTracks();
	const getScan = useCallback( () => {
		recordEvent( 'jetpack_protect_onboarding_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

	return <Button variant="link" weight="regular" onClick={ getScan } { ...props } />;
};

export default [
	{
		id: 'free-scan-results',
		title: scanResultsTitle,
		description: scanResultsDescription,
	},
	{
		id: 'free-daily-scans',
		title: __( 'Daily automated scans', 'jetpack-protect' ),
		description: (
			<Text>
				{ createInterpolateElement(
					__(
						'We run daily automated scans. Do you want to be able to scan manually? <upgradeLink>Upgrade</upgradeLink>',
						'jetpack-protect'
					),
					{
						upgradeLink: <UpgradeButton />,
					}
				) }
			</Text>
		),
	},
	{
		id: 'paid-scan-results',
		title: scanResultsTitle,
		description: scanResultsDescription,
	},
	{
		id: 'paid-fix-all-threats',
		title: __( 'Auto-fix with one click', 'jetpack-protect' ),
		description: (
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
	{
		id: 'paid-understand-severity',
		title: __( 'Understand severity', 'jetpack-protect' ),
		description: (
			<Text>
				{ __(
					'Learn how critical these threats are for the security of your site by glancing at the severity labels.',
					'jetpack-protect'
				) }
			</Text>
		),
	},
	{
		id: 'paid-daily-and-manual-scans',
		title: __( 'Daily & manual scanning', 'jetpack-protect' ),
		description: (
			<Text>
				{ __(
					'We run daily automated scans but you can also run on-demand scans if you want to check the latest status.',
					'jetpack-protect'
				) }
			</Text>
		),
	},
];
