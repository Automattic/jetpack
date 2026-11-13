import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { shield } from '@wordpress/icons';
import { Link, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import SettingToggle from '../../components/settings/setting-toggle';
import { recordEvent } from '../../data/tracks';
import { editScan, refreshScan } from './store';
import type { ScanContext } from './types';
import type { ProtectSettingsData } from '../../data/use-protect-settings';

/** Matches `Protect_Status::CHECKS_OPTION_NAME`. */
const CHECKS_SETTING = 'jetpack_protect_vulnerability_checks';

const onGetScan = () =>
	recordEvent( 'jetpack_protect_scan_settings_get_scan_link_click', { use_beacon: true } );

/**
 * Settings whose save also re-reads the Scan report, so the Overview card follows the toggle.
 *
 * @param settings - Jetpack settings and their save function.
 * @return The wrapped settings.
 */
function useChecksToggleData( settings: ProtectSettingsData ): ProtectSettingsData {
	const { save } = settings;
	return useMemo(
		() => ( {
			...settings,
			save: async ( patch, path ) => {
				const saved = await save( patch, path );
				if ( saved ) {
					const checksEnabled = Boolean( patch[ CHECKS_SETTING ] );
					editScan( scan => ( { ...scan, checksEnabled } ) );
					await refreshScan();
				}
				return saved;
			},
		} ),
		[ settings, save ]
	);
}

/**
 * The Settings tab's Scan card: the free daily check's toggle and a link to Scan without a plan, otherwise the server credentials Auto-fix needs.
 *
 * @param props          - The dashboard context.
 * @param props.state    - The Scan section's state.
 * @param props.settings - Jetpack settings and their save function.
 * @return The card.
 */
export default function ScanSettingsCard( { state: scan, settings }: ScanContext ) {
	const checksData = useChecksToggleData( settings );
	if ( ! scan ) {
		return null;
	}

	let description: string;
	let link = '';
	if ( ! scan.hasPlan ) {
		description = __(
			'Jetpack checks WordPress, your plugins and themes against a database of known vulnerabilities.',
			'jetpack-protect-pkg'
		);
		link = __( 'Get Scan for daily malware scanning and one-click fixes', 'jetpack-protect-pkg' );
	} else if ( scan.needsCredentials === false ) {
		description = __( 'Scan checks your site for malware every day.', 'jetpack-protect-pkg' );
	} else if ( scan.hasCredentials === false ) {
		description = __(
			'Scan checks your site for malware every day. Auto-fix needs your server credentials to repair threats.',
			'jetpack-protect-pkg'
		);
		link = __( 'Add server credentials', 'jetpack-protect-pkg' );
	} else {
		// Null means no report to go by, so don't claim credentials are on file.
		description = scan.hasCredentials
			? __(
					'Scan checks your site for malware every day. Auto-fix uses your server credentials to repair threats.',
					'jetpack-protect-pkg'
				)
			: __(
					'Scan checks your site for malware every day. Auto-fix uses server credentials to repair threats.',
					'jetpack-protect-pkg'
				);
		link = __( 'Manage server credentials', 'jetpack-protect-pkg' );
	}

	return (
		<ProtectCard icon={ shield } title={ __( 'Scan', 'jetpack-protect-pkg' ) }>
			<CardRow>
				<Stack direction="column" gap="sm">
					<Text variant="body-md">{ description }</Text>
					{ ! scan.hasPlan && (
						<SettingToggle
							data={ checksData }
							name={ CHECKS_SETTING }
							label={ __( 'Check for vulnerabilities every day', 'jetpack-protect-pkg' ) }
							help={ __(
								'Turn this off if another security plugin already checks for vulnerabilities. The firewall and login protection keep running.',
								'jetpack-protect-pkg'
							) }
							disabled={ ! settings.isLoaded }
						/>
					) }
					{ link && (
						<Link
							href={ scan.url }
							openInNewTab={ scan.hasPlan }
							onClick={ scan.hasPlan ? undefined : onGetScan }
						>
							{ link }
						</Link>
					) }
				</Stack>
			</CardRow>
		</ProtectCard>
	);
}
