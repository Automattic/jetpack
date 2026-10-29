import { __ } from '@wordpress/i18n';
import { shield } from '@wordpress/icons';
import { Link, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import { recordEvent } from '../../data/tracks';
import type { ScanContext } from './types';

const onGetScan = () =>
	recordEvent( 'jetpack_protect_scan_settings_get_scan_link_click', { use_beacon: true } );

/**
 * The Settings tab's Scan card: links to the server credentials Auto-fix needs, where the host takes them, or to Scan without a plan.
 *
 * @param props       - The dashboard context.
 * @param props.state - The Scan section's state.
 * @return The card.
 */
export default function ScanSettingsCard( { state: scan }: ScanContext ) {
	if ( ! scan ) {
		return null;
	}

	let description: string;
	let link = '';
	if ( ! scan.hasPlan ) {
		description = __(
			'Your site is checked every day for known vulnerabilities in WordPress, plugins and themes. There’s nothing to set up.',
			'jetpack-protect-pkg'
		);
		link = __( 'Get Scan for daily malware scanning and one-click fixes', 'jetpack-protect-pkg' );
	} else if ( ! scan.url ) {
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
