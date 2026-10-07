import { __ } from '@wordpress/i18n';
import { Skeleton } from '@wordpress/ui';
import { StorageUsageLevels } from '../../data/storage-usage-levels';
import { useStorageNoticeDismissal, useStorageUsage } from '../../hooks/use-storage-usage';
import StorageAddonUpsell from './addon-upsell';
import StorageMeter from './meter';
import StorageUsageDetails from './usage-details';
import './style.scss';
import type { StorageUsageLevelName } from '../../data/storage-usage-levels';
import type { ReactNode } from 'react';

/**
 * The forecast worth putting behind an info button, or null for none.
 *
 * Legacy's gate, in one place instead of split between the parent and the popover's own
 * early return.
 *
 * The `Normal` check is why this and the upsell never appear together: above `Normal`
 * the section is already saying storage is running out. The comparison is against what
 * the *plan* promises rather than the retention in force — if the site holds fewer days
 * than the plan offers, the limit is what is deciding.
 *
 * @param usageLevel        - Derived level, or null when it could not be computed.
 * @param forecastInDays    - Days of full backups the limit would hold, or null.
 * @param planRetentionDays - Days the plan promises, or null when unreported.
 * @return The forecast to show, or null.
 */
function helpForecast(
	usageLevel: StorageUsageLevelName | null,
	forecastInDays: number | null,
	planRetentionDays: number | null
): number | null {
	if ( usageLevel !== StorageUsageLevels.Normal ) {
		return null;
	}

	if ( forecastInDays === null || planRetentionDays === null ) {
		return null;
	}

	// A forecast of zero is a real answer — a site whose last backup exceeds its whole
	// limit — but not one an info button beside a calm meter can usefully explain.
	return forecastInDays > 0 && forecastInDays < planRetentionDays ? forecastInDays : null;
}

type Props = {
	/** Rendered at the row's end, e.g. the next scheduled backup. */
	trailing?: ReactNode;
};

/**
 * The Overview screen's storage row: usage, a thin meter and a trailing slot.
 *
 * With no usable figures the row is just the trailing slot. The help popover shows only
 * at `Normal`, because above it the notice from `StorageNotice` already says storage is
 * running out.
 *
 * @param props          - Component props.
 * @param props.trailing - Content for the row's end.
 * @return The row, or null when there is nothing to show.
 */
export default function StorageSpace( { trailing }: Props ) {
	const usage = useStorageUsage();

	// Hold the row's height while the requests are in flight, so the list below does not
	// jump when they land.
	if ( usage.isLoading ) {
		return (
			<section className="jpb-storage-space" aria-hidden="true">
				<Skeleton className="jpb-storage-space__details-placeholder" />
				<Skeleton className="jpb-storage-meter__placeholder" />
			</section>
		);
	}

	if ( ! usage.hasUsableFigures ) {
		return trailing ? <div className="jpb-storage-space">{ trailing }</div> : null;
	}

	return (
		<section
			className="jpb-storage-space"
			aria-label={ __( 'Backup storage', 'jetpack-backup-pkg' ) }
		>
			<StorageUsageDetails
				storageUsed={ usage.storageUsed }
				storageLimit={ usage.storageLimit }
				daysOfBackupsSaved={ usage.daysOfBackupsSaved }
				retentionDays={ usage.retentionDays }
				lastBackupSize={ usage.lastBackupSize }
				helpForecastInDays={ helpForecast(
					usage.usageLevel,
					usage.forecastInDays,
					usage.planRetentionDays
				) }
			/>
			<StorageMeter
				storageUsed={ usage.storageUsed }
				storageLimit={ usage.storageLimit }
				usageLevel={ usage.usageLevel }
			/>
			{ trailing }
		</section>
	);
}

/**
 * The notice for a site whose storage is above `Normal`, for the top of the page.
 *
 * Warning and Critical can be dismissed, and a worse level shows again. Full and
 * BackupsDiscarded cannot.
 *
 * @return The notice, or null.
 */
export function StorageNotice() {
	const usage = useStorageUsage();
	const { isDismissible, isDismissed, dismiss } = useStorageNoticeDismissal( usage.usageLevel );

	if (
		! usage.hasUsableFigures ||
		usage.usageLevel === null ||
		usage.usageLevel === StorageUsageLevels.Normal ||
		isDismissed
	) {
		return null;
	}

	return (
		<StorageAddonUpsell
			usageLevel={ usage.usageLevel }
			storageUsed={ usage.storageUsed }
			storageLimit={ usage.storageLimit }
			daysOfBackupsSaved={ usage.daysOfBackupsSaved }
			minDaysOfBackupsAllowed={ usage.minDaysOfBackupsAllowed }
			onDismiss={ isDismissible ? dismiss : undefined }
		/>
	);
}
