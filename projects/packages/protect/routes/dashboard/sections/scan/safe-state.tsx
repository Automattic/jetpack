import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { getCheckedCounts } from './labels';
import ScanButton, { getNextCheck, useHasPassed } from './scan-button';
import type { ScanState } from './types';

export const SafeShield = () => (
	<svg width="80" height="98" viewBox="0 0 123 150" aria-hidden="true" focusable="false">
		<path
			d="M61.365 0L0 27.273v40.909C0 106.023 26.182 141.409 61.365 150c35.183-8.591 61.365-43.977 61.365-81.818v-40.91L61.365 0z"
			fill="#069e08"
		/>
		<path d="M27.4 77.744l22.966 22.897 50.387-50.457" fill="none" stroke="#fff" strokeWidth="14" />
	</svg>
);

type Props = {
	scan: ScanState;
	isStarting: boolean;
	onScan: () => void;
};

/**
 * Shown in place of the vulnerability list when the last scan found nothing.
 *
 * @param props            - Component props.
 * @param props.scan       - The latest report.
 * @param props.isStarting - Whether a scan is being requested.
 * @param props.onScan     - Starts a scan.
 * @return The empty state.
 */
export default function SafeState( { scan, isStarting, onScan }: Props ) {
	const counts = getCheckedCounts( scan );
	const nextCheck = getNextCheck( scan.lastChecked );
	const nextScan = useHasPassed( nextCheck ) ? null : nextCheck;
	const nextScanDate = nextScan && dateI18n( 'M j, gA', nextScan );

	// The free check only compares versions with known vulnerabilities, so it can't call the site safe.
	const copy = scan.hasPlan
		? {
				title: __( 'Your site is safe right now', 'jetpack-protect-pkg' ),
				details: sprintf(
					/* translators: %1$s is a number of plugins, such as "23 plugins". %2$s is a number of themes, such as "5 themes". */
					__( 'No issues were found after scanning %1$s and %2$s.', 'jetpack-protect-pkg' ),
					counts.plugins,
					counts.themes
				),
				next: nextScanDate
					? sprintf(
							/* translators: %s is a date and time, such as "Sep 30, 9AM". */
							__( 'Next scan will happen automatically on %s.', 'jetpack-protect-pkg' ),
							nextScanDate
						)
					: __( 'Your site is scanned automatically every day.', 'jetpack-protect-pkg' ),
				button: __( 'Scan again now', 'jetpack-protect-pkg' ),
			}
		: {
				title: __( 'No known vulnerabilities found', 'jetpack-protect-pkg' ),
				details: sprintf(
					/* translators: %1$s is a number of plugins, such as "23 plugins". %2$s is a number of themes, such as "5 themes". */
					__(
						'None of your %1$s or %2$s has a known vulnerability. Your files aren’t checked for malware.',
						'jetpack-protect-pkg'
					),
					counts.plugins,
					counts.themes
				),
				next: nextScanDate
					? sprintf(
							/* translators: %s is a date and time, such as "Sep 30, 9AM". */
							__( 'Next check will happen automatically on %s.', 'jetpack-protect-pkg' ),
							nextScanDate
						)
					: __( 'Vulnerabilities are checked automatically every day.', 'jetpack-protect-pkg' ),
				button: __( 'Check again now', 'jetpack-protect-pkg' ),
			};

	return (
		<Stack className="jp-protect-safe" direction="column" align="center" gap="md">
			<SafeShield />
			<Text variant="heading-xl" render={ <h3 /> }>
				{ copy.title }
			</Text>
			<Text variant="body-lg" className="jp-protect-safe__details">
				{ copy.details }
				<br />
				{ copy.next }
			</Text>
			<ScanButton scan={ scan } isStarting={ isStarting } onScan={ onScan } label={ copy.button } />
		</Stack>
	);
}
