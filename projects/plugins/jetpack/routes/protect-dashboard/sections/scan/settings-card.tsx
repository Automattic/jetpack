import { __ } from '@wordpress/i18n';
import { bug } from '@wordpress/icons';
import { Link, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import type { DashboardContext } from '../types';
import type { ScanState } from './types';

/**
 * The Settings tab's Scan card: Scan has nothing to set here, so it explains and links out.
 *
 * @param props       - The dashboard context.
 * @param props.state - The Scan section's state.
 * @return The card.
 */
export default function ScanSettingsCard( { state }: DashboardContext ) {
	if ( ! state ) {
		return null;
	}
	const scan = state as ScanState;

	return (
		<ProtectCard icon={ bug } title={ __( 'Scan', 'jetpack' ) }>
			<CardRow>
				<Stack direction="column" gap="sm">
					<Text variant="body-md">
						{ scan.hasPlan
							? __(
									'Scan checks your site for malware every day. Threat alerts and scan settings are managed on Jetpack.com.',
									'jetpack'
								)
							: __(
									'Your site is checked every day for known vulnerabilities in WordPress, plugins and themes. There’s nothing to set up.',
									'jetpack'
								) }
					</Text>
					<Link href={ scan.url } openInNewTab={ scan.hasPlan }>
						{ scan.hasPlan
							? __( 'Manage Scan settings', 'jetpack' )
							: __( 'Get Scan for daily malware scanning and one-click fixes', 'jetpack' ) }
					</Link>
				</Stack>
			</CardRow>
		</ProtectCard>
	);
}
