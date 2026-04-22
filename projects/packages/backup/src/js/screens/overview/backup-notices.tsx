import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { Notice } from '@wordpress/ui';
import { useCallback, useEffect, useState } from 'react';
import { useFormattedTime } from '../../data/use-formatted-time';
import type { BackupState } from '../../data/use-backup-state';
import type { FC } from 'react';

interface BackupNoticesProps {
	backupState: BackupState;
}

// We use the design-system Notice from `@wordpress/ui`, but we avoid
// `Notice.CloseIcon` specifically. That subcomponent wraps an
// `IconButton`, which pulls in `Tooltip`, which pulls in
// `@wordpress/theme` — and `@wordpress/theme` is guarded by
// `__dangerousOptInToUnstableAPIsOnlyForCoreModules`, so it throws in
// plugin land. Using `@wordpress/components` `Button` for the dismiss
// affordance keeps the rest of the new Notice without that dependency.

const BackupNotices: FC< BackupNoticesProps > = ( { backupState } ) => {
	const { status, backup } = backupState;
	const backupDate = useFormattedTime(
		backup?.started ? backup.started.replace( ' ', 'T' ) + 'Z' : '',
		{ timeStyle: 'short', lowercaseCalendarLabel: true }
	);
	const [ isDismissed, setIsDismissed ] = useState( false );

	useEffect( () => {
		// Reset dismissal when a new backup starts so progress keeps
		// showing even after the user dismissed the previous success.
		if ( status === 'running' ) {
			setIsDismissed( false );
		}
	}, [ status ] );

	const dismiss = useCallback( () => setIsDismissed( true ), [] );

	const closeButton = (
		<Button
			size="small"
			variant="tertiary"
			icon={ closeSmall }
			label={ __( 'Dismiss this notice', 'jetpack-backup-pkg' ) }
			onClick={ dismiss }
		/>
	);

	if ( status === 'enqueued' ) {
		return (
			<Notice.Root intent="info">
				<Notice.Title>{ __( 'Backup starting…', 'jetpack-backup-pkg' ) }</Notice.Title>
				<Notice.Description>
					{ __( 'We’re preparing to make a backup of your site.', 'jetpack-backup-pkg' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	if ( status === 'running' ) {
		return (
			<Notice.Root intent="info">
				<Notice.Title>
					{ sprintf(
						/* translators: %s is the backup progress percentage. */
						__( 'Generating backup… (%s%% progress)', 'jetpack-backup-pkg' ),
						backup?.percent ?? '0'
					) }
				</Notice.Title>
				<Notice.Description>
					{ sprintf(
						/* translators: %s is a date, like "today at 10:00". */
						__(
							'We’re making a backup of your site from %s. Sit back and relax—we’ll take care of this in the background.',
							'jetpack-backup-pkg'
						),
						backupDate
					) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	if ( status === 'success' && ! isDismissed ) {
		return (
			<Notice.Root intent="success">
				<Notice.Title>{ __( 'Backup completed', 'jetpack-backup-pkg' ) }</Notice.Title>
				<Notice.Description>
					{ __(
						'You’ll be able to access your new backup in just a few minutes.',
						'jetpack-backup-pkg'
					) }
				</Notice.Description>
				<Notice.Actions>{ closeButton }</Notice.Actions>
			</Notice.Root>
		);
	}

	if ( status === 'error' && ! isDismissed ) {
		return (
			<Notice.Root intent="error">
				<Notice.Title>
					{ __( 'Latest backup couldn’t be completed', 'jetpack-backup-pkg' ) }
				</Notice.Title>
				<Notice.Description>
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
								<Notice.ActionLink
									href={ getRedirectUrl( 'jetpack-support-backup' ) }
									target="_blank"
									children={ null }
								/>
							),
						}
					) }
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton
						variant="primary"
						href={ getRedirectUrl( 'jetpack-contact-support' ) }
					>
						{ __( 'Contact support', 'jetpack-backup-pkg' ) }
					</Notice.ActionButton>
					{ closeButton }
				</Notice.Actions>
			</Notice.Root>
		);
	}

	return null;
};

export default BackupNotices;
