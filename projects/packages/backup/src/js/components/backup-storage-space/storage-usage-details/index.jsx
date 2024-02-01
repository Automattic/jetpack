import './style.scss';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { STORE_ID } from '../../../store';
import StorageHelpPopover from '../storage-help-popover';
import { StorageUsageLevels } from '../storage-usage-levels';
import { useStorageUsageText } from './use-storage-usage-text';

const StorageUsageDetails = ( {
	storageUsed,
	storageLimit,
	lastBackupSize,
	planRetentionDays,
	usageLevel,
	onClickedPurchase,
} ) => {
	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug() );
	const usageText = useStorageUsageText( storageUsed, storageLimit );
	const daysOfBackupsSaved = useSelect( select => select( STORE_ID ).getDaysOfBackupsSaved() );

	let forecastInDays = 0;
	if ( storageLimit > 0 && lastBackupSize > 0 ) {
		forecastInDays = Math.floor( storageLimit / lastBackupSize );
	}

	const singularDaysOfBackupLabel = __( '<a>1 day of backups saved</a>', 'jetpack-backup-pkg' );
	const pluralDaysOfBackupLabel = sprintf(
		/* translators: %s: Number of days of backups saved. */
		__( '<a>%s days of backups saved</a>', 'jetpack-backup-pkg' ),
		daysOfBackupsSaved
	);

	return (
		<>
			<div className="backup-storage-space__meta">
				<div className="backup-storage-space__usage-text">
					{ usageText }
					{
						// Show popover only when usage level is normal, for other levels,
						// we already show separate message with CTA under progress bar
						forecastInDays < planRetentionDays && StorageUsageLevels.Normal === usageLevel && (
							<StorageHelpPopover
								className="backup-storage-space__help-popover"
								forecastInDays={ forecastInDays }
								onClickedPurchase={ onClickedPurchase }
							/>
						)
					}
				</div>
				<div className="backup-storage-space__retention">
					{ createInterpolateElement(
						daysOfBackupsSaved === 1 ? singularDaysOfBackupLabel : pluralDaysOfBackupLabel,
						{
							a: (
								<ExternalLink
									href={ getRedirectUrl( 'backup-plugin-storage-backups-saved', { site: domain } ) }
								/>
							),
						}
					) }
				</div>
			</div>
		</>
	);
};

export default StorageUsageDetails;
