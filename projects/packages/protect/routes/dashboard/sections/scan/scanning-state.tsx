import { __, sprintf } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { getCheckedCounts } from './labels';
import type { ScanState } from './types';

type Props = {
	scan: ScanState;
	/** Offered once polling has given up, to check on the scan again. */
	onCheckAgain?: () => void;
	isChecking: boolean;
};

/**
 * Shown while a scan runs: a progress bar and what is being checked.
 *
 * @param props              - Component props.
 * @param props.scan         - The latest report.
 * @param props.onCheckAgain - Checks on the scan again, once polling has stopped.
 * @param props.isChecking   - Whether that check is running.
 * @return The scanning state.
 */
export default function ScanningState( { scan, onCheckAgain, isChecking }: Props ) {
	const { plugins: pluginsText, themes: themesText } = getCheckedCounts( scan );
	const progress =
		typeof scan.progress === 'number' && scan.progress > 0 ? scan.progress : undefined;

	return (
		<Stack className="jp-protect-scanning" direction="column" align="center" gap="md">
			<Text variant="body-lg" render={ <h3 className="jp-protect-scanning__title" /> }>
				{ __( 'Scanning…', 'jetpack-protect-pkg' ) }
			</Text>
			<div
				className={ `jp-protect-scanning__bar${ progress === undefined ? ' is-indeterminate' : '' }` }
				role="progressbar"
				aria-label={ __( 'Scan progress', 'jetpack-protect-pkg' ) }
				aria-valuemin={ 0 }
				aria-valuemax={ 100 }
				aria-valuenow={ progress }
			>
				<span
					className="jp-protect-scanning__fill"
					style={ progress === undefined ? undefined : { inlineSize: `${ progress }%` } }
				/>
			</div>
			<Text variant="body-sm" className="jp-protect-card__muted">
				{ scan.hasPlan
					? sprintf(
							/* translators: %1$s is a number of plugins, such as "23 plugins". %2$s is a number of themes, such as "5 themes". */
							__( 'Checking %1$s, %2$s and your site’s files for threats.', 'jetpack-protect-pkg' ),
							pluginsText,
							themesText
						)
					: sprintf(
							/* translators: %1$s is a number of plugins, such as "23 plugins". %2$s is a number of themes, such as "5 themes". */
							__( 'Checking %1$s and %2$s for vulnerabilities.', 'jetpack-protect-pkg' ),
							pluginsText,
							themesText
						) }
				<br />
				{ __( 'You can leave this page — the scan carries on.', 'jetpack-protect-pkg' ) }
			</Text>
			{ onCheckAgain && (
				<Button variant="outline" onClick={ onCheckAgain } loading={ isChecking }>
					{ __( 'Check again', 'jetpack-protect-pkg' ) }
				</Button>
			) }
		</Stack>
	);
}
