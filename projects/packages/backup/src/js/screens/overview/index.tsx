import { BoundedLayout } from '@automattic/jetpack-components';
import { Card, CardBody } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useActivityLog } from '../../data/use-activity-log';
import { useBackupState } from '../../data/use-backup-state';
import { useDateRange } from '../../data/use-date-range';
import { useSiteData } from '../../data/use-site-data';
import { useSetHeaderActions } from '../../header-actions-context';
import BackupDetails from './backup-details';
import BackupNotices from './backup-notices';
import BackupNowButton from './backup-now-button';
import BackupsList from './backups-list';
import DateRangePicker from './date-range-picker';
import styles from './style.module.scss';
import type { ActivityLogEntry } from '../../data/types';
import type { FC } from 'react';

const OverviewScreen: FC = () => {
	const { timezoneString, gmtOffset } = useSiteData();
	const [ searchParams, setSearchParams ] = useSearchParams();
	const rewindIdParam = searchParams.get( 'rewindId' );

	const { dateRange, setDateRange } = useDateRange( { defaultDays: 30 } );
	const backupState = useBackupState();
	const { activityLog, isLoadingActivityLog } = useActivityLog( {
		dateRange,
		timezoneString: timezoneString || undefined,
		gmtOffset,
	} );

	const [ selectedBackup, setSelectedBackupInState ] = useState< ActivityLogEntry | null >( null );

	// Sync rewindId query param → selection. When the param names a backup
	// we have in the fetched set, select it. When no param is present we
	// default to the first entry so the details pane isn't empty.
	useEffect( () => {
		if ( rewindIdParam ) {
			const targetBackup = activityLog.find( item => item.rewind_id === rewindIdParam ) ?? null;
			if ( targetBackup ) {
				setSelectedBackupInState( targetBackup );
				return;
			}
		}
		const firstBackup = activityLog[ 0 ] ?? null;
		setSelectedBackupInState( rewindIdParam ? null : firstBackup );
	}, [ rewindIdParam, activityLog ] );

	const handleSelectBackup = useCallback(
		( backup: ActivityLogEntry | null ) => {
			setSearchParams(
				prev => {
					const next = new URLSearchParams( prev );
					if ( backup?.rewind_id ) {
						next.set( 'rewindId', backup.rewind_id );
					} else {
						next.delete( 'rewindId' );
					}
					return next;
				},
				{ replace: true }
			);
			setSelectedBackupInState( backup );
		},
		[ setSearchParams ]
	);

	const handleDateRangeChange = useCallback(
		( next: Parameters< typeof setDateRange >[ 0 ] ) => {
			setDateRange( next );
			handleSelectBackup( null );
		},
		[ setDateRange, handleSelectBackup ]
	);

	// Register DateRangePicker + BackupNowButton in the AdminPage header.
	const setHeaderActions = useSetHeaderActions();
	const headerActions = useMemo(
		() => (
			<div className={ styles.headerActions }>
				<DateRangePicker dateRange={ dateRange } onChange={ handleDateRangeChange } />
				<BackupNowButton backupState={ backupState } />
			</div>
		),
		[ dateRange, handleDateRangeChange, backupState ]
	);
	useEffect( () => {
		setHeaderActions( headerActions );
		return () => setHeaderActions( null );
	}, [ setHeaderActions, headerActions ] );

	return (
		<BoundedLayout width="wide" className={ styles.overview }>
			<BackupNotices backupState={ backupState } />
			<div className={ styles.grid }>
				<BackupsList
					activityLog={ activityLog }
					isLoadingActivityLog={ isLoadingActivityLog }
					selectedBackup={ selectedBackup }
					onSelectBackup={ handleSelectBackup }
					dateRange={ dateRange }
				/>
				{ selectedBackup ? (
					<BackupDetails backup={ selectedBackup } />
				) : (
					<Card>
						<CardBody className={ styles.detailsPlaceholder }>{ null }</CardBody>
					</Card>
				) }
			</div>
		</BoundedLayout>
	);
};

export default OverviewScreen;
