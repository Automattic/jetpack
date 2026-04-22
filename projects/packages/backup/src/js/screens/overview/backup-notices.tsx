/* eslint-disable react/jsx-no-bind */

import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink, Notice } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
import { useFormattedTime } from '../../data/use-formatted-time';
import type { BackupState } from '../../data/use-backup-state';
import type { FC } from 'react';

interface BackupNoticesProps {
	backupState: BackupState;
}

const BackupNotices: FC< BackupNoticesProps > = ( { backupState } ) => {
	const { status, backup } = backupState;
	const backupDate = useFormattedTime(
		backup?.started ? backup.started.replace( ' ', 'T' ) + 'Z' : '',
		{ timeStyle: 'short', lowercaseCalendarLabel: true }
	);
	const [ isDismissed, setIsDismissed ] = useState( false );

	useEffect( () => {
		if ( status === 'running' ) {
			setIsDismissed( false );
		}
	}, [ status ] );

	if ( status === 'enqueued' ) {
		return (
			<Notice status="info" isDismissible={ false }>
				<strong>{ __( 'Backup starting…', 'jetpack-backup-pkg' ) }</strong>{ ' ' }
				{ __( 'We’re preparing to make a backup of your site.', 'jetpack-backup-pkg' ) }
			</Notice>
		);
	}

	if ( status === 'running' ) {
		return (
			<Notice status="info" isDismissible={ false }>
				<strong>
					{ sprintf(
						/* translators: %s is the backup progress percentage. */
						__( 'Generating backup… (%s%% progress)', 'jetpack-backup-pkg' ),
						backup?.percent ?? '0'
					) }
				</strong>{ ' ' }
				{ sprintf(
					/* translators: %s is a date, like "today at 10:00". */
					__(
						'We’re making a backup of your site from %s. Sit back and relax—we’ll take care of this in the background.',
						'jetpack-backup-pkg'
					),
					backupDate
				) }
			</Notice>
		);
	}

	if ( status === 'success' && ! isDismissed ) {
		return (
			<Notice status="success" onRemove={ () => setIsDismissed( true ) }>
				<strong>{ __( 'Backup completed', 'jetpack-backup-pkg' ) }</strong>{ ' ' }
				{ __(
					'You’ll be able to access your new backup in just a few minutes.',
					'jetpack-backup-pkg'
				) }
			</Notice>
		);
	}

	if ( status === 'error' && ! isDismissed ) {
		return (
			<Notice
				status="error"
				onRemove={ () => setIsDismissed( true ) }
				actions={ [
					{
						label: __( 'Contact support', 'jetpack-backup-pkg' ),
						url: getRedirectUrl( 'jetpack-contact-support' ),
						variant: 'primary',
					},
				] }
			>
				<strong>{ __( 'Latest backup couldn’t be completed', 'jetpack-backup-pkg' ) }</strong>{ ' ' }
				{ createInterpolateElement(
					sprintf(
						/* translators: %s is a date, like "today at 10:00" */
						__(
							'We weren’t able to finish your backup from %s, but don’t worry—your existing data is safe. <external>Check our help guide</external> or contact support to get this resolved.',
							'jetpack-backup-pkg'
						),
						backupDate
					),
					{
						external: (
							<ExternalLink href={ getRedirectUrl( 'jetpack-support-backup' ) } children={ null } />
						),
					}
				) }
			</Notice>
		);
	}

	return null;
};

export default BackupNotices;
