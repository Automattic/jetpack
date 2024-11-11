import { getRedirectUrl, LoadingPlaceholder } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { FunctionComponent } from 'react';
import { useNextBackupSchedule } from '../hooks/scheduled-backups/use-next-backup-schedule';
import useAnalytics from '../hooks/useAnalytics';
import { STORE_ID } from '../store';

type Props = {
	siteId: number;
};

interface StoreSelectors {
	getCalypsoSlug: () => string;
}

const NextScheduledBackup: FunctionComponent< Props > = () => {
	const { tracks } = useAnalytics();

	const domain = useSelect( select => {
		const selectors: StoreSelectors = select( STORE_ID );
		return selectors.getCalypsoSlug();
	}, [] );

	const { hasLoaded, nextBackupDate, timeRange } = useNextBackupSchedule();

	const onModifyClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_schedule_modify_click' );
	}, [ tracks ] );

	if ( ! hasLoaded ) {
		return (
			<div className="backup__next-scheduled-time placeholder">
				<LoadingPlaceholder width="100%" height={ 20 } />
			</div>
		);
	}

	if ( ! nextBackupDate || ! timeRange ) {
		return null;
	}

	return (
		<div className="backup__next-scheduled-time">
			<span className="scheduled-backup__message">
				{ sprintf(
					/* translators: %1$s is the formatted date (e.g., Oct 22); %2$s is a time range, such as 10:00-10:59 AM. */
					__( 'Next full backup: %1$s, %2$s.', 'jetpack-backup-pkg' ),
					nextBackupDate.format( 'MMM D' ),
					timeRange
				) }
			</span>{ ' ' }
			<ExternalLink
				href={ getRedirectUrl( 'backup-plugin-schedule-time-setting', { site: domain } ) }
				className="scheduled-backup__action"
				onClick={ onModifyClick }
			>
				{ __( 'Modify', 'jetpack-backup-pkg' ) }
			</ExternalLink>
		</div>
	);
};

export default NextScheduledBackup;
