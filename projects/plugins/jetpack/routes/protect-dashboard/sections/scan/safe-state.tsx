import { dateI18n } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import ScanButton, { getNextCheck, useHasPassed } from './scan-button';
import type { ScanState } from './types';

const SafeShield = () => (
	<svg width="80" height="96" viewBox="0 0 80 96" aria-hidden="true" focusable="false">
		<path
			d="M40 0L80 17.8V44.3C80 66.9 65.2 88.3 44.2 95A13.9 13.9 0 0 1 35.8 95C14.8 88.3 0 66.9 0 44.3V17.8Z"
			fill="#7bed5f"
		/>
		<path d="M0 17.8L40 96C37.2 96 35.8 95 35.8 95C14.8 88.3 0 66.9 0 44.3Z" fill="#5fcf4c" />
		<path
			d="M27 49L36 59L55 33"
			fill="none"
			stroke="#1e1e1e"
			strokeWidth="5"
			strokeLinecap="square"
		/>
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
	const pluginsChecked = scan.pluginsChecked ?? 0;
	const themesChecked = scan.themesChecked ?? 0;
	const nextCheck = getNextCheck( scan.lastChecked );
	const nextScan = useHasPassed( nextCheck ) ? null : nextCheck;

	return (
		<Stack className="jp-protect-safe" direction="column" align="center" gap="md">
			<SafeShield />
			<Text variant="heading-xl" render={ <h3 /> }>
				{ __( 'Your site is safe right now', 'jetpack' ) }
			</Text>
			<Text variant="body-lg" className="jp-protect-safe__details">
				{ sprintf(
					/* translators: %1$s is a number of plugins, such as "23 plugins". %2$s is a number of themes, such as "5 themes". */
					__( 'No issues were found after scanning %1$s and %2$s.', 'jetpack' ),
					sprintf(
						/* translators: %s is a number. */
						_n( '%s plugin', '%s plugins', pluginsChecked, 'jetpack' ),
						pluginsChecked.toLocaleString()
					),
					sprintf(
						/* translators: %s is a number. */
						_n( '%s theme', '%s themes', themesChecked, 'jetpack' ),
						themesChecked.toLocaleString()
					)
				) }
				<br />
				{ nextScan
					? sprintf(
							/* translators: %s is a date and time, such as "Sep 30, 9AM". */
							__( 'Next scan will happen automatically on %s.', 'jetpack' ),
							dateI18n( 'M j, gA', nextScan )
						)
					: __( 'Your site is scanned automatically every day.', 'jetpack' ) }
			</Text>
			<ScanButton
				scan={ scan }
				isStarting={ isStarting }
				onScan={ onScan }
				label={ __( 'Scan again now', 'jetpack' ) }
			/>
		</Stack>
	);
}
