import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { GIGABYTE, TERABYTE } from '../../data/storage-units';
import { useAnalytics } from '../../hooks/use-analytics';
import { useRetentionReturn, type RetentionReturn } from '../../hooks/use-retention-return';
import BackupRetentionDialog from '../backup-retention-dialog';
import StorageHelpPopover from './help-popover';

/**
 * The usage reading, as one plain sentence.
 *
 * @param storageUsed  - Bytes in use.
 * @param storageLimit - The plan's limit in bytes.
 * @return The sentence.
 */
function usageText( storageUsed: number, storageLimit: number ): string {
	const usedGigabytes = storageUsed / GIGABYTE;

	// Keep both placeholders positional: `@tannin/sprintf` reads `%1.1f` as a width,
	// and a reordering translation then transposes the figures.

	if ( storageLimit < TERABYTE ) {
		// translators: Must use unit abbreviation; describes used vs available storage amounts (e.g. Using 20.0GB of 30GB storage space). %1$.1f: numeric amount of disk space used, %2$f: numeric amount of disk space available.
		const inGigabytes = __( 'Using %1$.1fGB of %2$fGB storage space', 'jetpack-backup-pkg' );
		return sprintf( inGigabytes, usedGigabytes, storageLimit / GIGABYTE );
	}

	// translators: Must use unit abbreviation; describes used vs available storage amounts (e.g. Using 20GB of 1TB storage space). %1$d: numeric amount of disk space used, %2$d: numeric amount of disk space available.
	const inTerabytes = __( 'Using %1$dGB of %2$dTB storage space', 'jetpack-backup-pkg' );
	return sprintf( inTerabytes, usedGigabytes, storageLimit / TERABYTE );
}

/**
 * The "N days of backups saved" label, still carrying its `<a>` markup.
 *
 * Two singular `__()` msgids rather than one `_n()` pair, which is what
 * legacy ships. `_n()` would be the better i18n — it is the only form
 * that serves a language with more than two plural rules — but it is a
 * different GlotPress entry from either of these, so adopting it here
 * would throw away every existing translation of a string the flag-off
 * dashboard is still rendering today. Worth revisiting once legacy's copy
 * is gone and both can change together.
 *
 * Note the ternary picks between two already-extracted `const`s rather
 * than wrapping the `__()` call itself. Put the choice inside the call and
 * the minifier factors it out; the text-domain scanner then finds no
 * literal to extract and drops both msgids without saying so.
 *
 * @param days - Days of backups WordPress.com is actually holding.
 * @return The label, for `createInterpolateElement`.
 */
function daysOfBackupsLabel( days: number ): string {
	const singular = __( '<a>1 day of backups saved</a>', 'jetpack-backup-pkg' );
	/* translators: %s: Number of days of backups saved. */
	const plural = __( '<a>%s days of backups saved</a>', 'jetpack-backup-pkg' );

	// Stringified for the `%s` the msgid spells, which `sprintf` types as
	// taking a string. It would coerce the number itself, but only after
	// the type-level parse of the format string has already rejected it.
	return days === 1 ? singular : sprintf( plural, String( days ) );
}

type Props = {
	storageUsed: number;
	storageLimit: number;
	daysOfBackupsSaved: number | null;
	/** The retention in force, or null when unreported. */
	retentionDays: number | null;
	/** Bytes the last full backup took, or null when unreported. */
	lastBackupSize: number | null;
	/**
	 * Days of full backups the limit would hold, or null when that is not worth
	 * explaining. The section decides — see `helpForecast` in `index.tsx`.
	 */
	helpForecastInDays: number | null;
};

/**
 * The two readings that sit beneath the storage meter.
 *
 * The bar says how full; these say how full *of what*, and how much
 * history that has bought — which is the figure someone weighing an
 * upgrade actually needs.
 *
 * Presentational, like `meter.tsx`: everything arrives as a prop, read
 * once by the section from `useStorageUsage()`. Rendered only by that
 * section's `hasUsableFigures` branch, so both byte figures are known
 * numbers by the time they get here and neither needs re-testing.
 *
 * The exceptions to "presentational" are the help popover and the retention dialog, which
 * bring their own data and sit beside the readings they explain or change.
 *
 * @param props                    - Component props.
 * @param props.storageUsed        - Bytes of backup storage in use.
 * @param props.storageLimit       - The plan's storage limit in bytes.
 * @param props.daysOfBackupsSaved - Days of history held, or null when unreported.
 * @param props.retentionDays      - The retention in force, or null when unreported.
 * @param props.lastBackupSize     - The last backup's size in bytes, or null when unreported.
 * @param props.helpForecastInDays - Days of backups the limit holds, or null for no popover.
 * @return The rendered readings.
 */
export default function StorageUsageDetails( {
	storageUsed,
	storageLimit,
	daysOfBackupsSaved,
	retentionDays,
	lastBackupSize,
	helpForecastInDays,
}: Props ) {
	const { tracks } = useAnalytics();
	const returned = useRetentionReturn();
	// Checkout's choice opens the dialog once; the button opens it on the current setting.
	const [ dialog, setDialog ] = useState< Partial< RetentionReturn > | null >( returned );
	const [ announcement, setAnnouncement ] = useState( '' );

	const onRetentionClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_storage_retention_modify_click' );
		setAnnouncement( '' );
		setDialog( {} );
	}, [ tracks ] );

	const onDialogClose = useCallback( ( saved: boolean ) => {
		setDialog( null );
		if ( saved ) {
			setAnnouncement( __( 'Backup retention changed.', 'jetpack-backup-pkg' ) );
		}
	}, [] );

	const hasExtras = helpForecastInDays !== null || daysOfBackupsSaved !== null;

	return (
		<Stack className="jpb-storage-space__label" direction="column" gap="xs" align="start">
			<Text variant="body-sm" className="jpb-text-muted">
				{ usageText( storageUsed, storageLimit ) }
			</Text>
			{ /* A second line only when something fills it, so no empty gap. */ }
			{ hasExtras && (
				<Stack
					className="jpb-storage-space__extras"
					direction="row"
					wrap="wrap"
					gap="md"
					align="center"
				>
					{ /* Omitted, not "0 days", when WordPress.com sends no count. */ }
					{ daysOfBackupsSaved !== null && (
						<Text variant="body-sm" className="jpb-storage-space__days">
							{ createInterpolateElement( daysOfBackupsLabel( daysOfBackupsSaved ), {
								a: (
									<Link
										render={ <button type="button" /> }
										tone="neutral"
										className="jpb-link-button"
										aria-haspopup="dialog"
										onClick={ onRetentionClick }
									/>
								),
							} ) }
						</Text>
					) }
					{ helpForecastInDays !== null && (
						<StorageHelpPopover
							forecastInDays={ helpForecastInDays }
							storageUsed={ storageUsed }
							storageLimit={ storageLimit }
						/>
					) }
				</Stack>
			) }
			<span className="jpb-visually-hidden" role="status" aria-live="polite">
				{ announcement }
			</span>
			{ dialog && (
				<BackupRetentionDialog
					currentDays={ retentionDays }
					storageLimit={ storageLimit }
					lastBackupSize={ lastBackupSize }
					initialDays={ dialog.days }
					storagePurchased={ dialog.storagePurchased }
					onClose={ onDialogClose }
				/>
			) }
		</Stack>
	);
}
