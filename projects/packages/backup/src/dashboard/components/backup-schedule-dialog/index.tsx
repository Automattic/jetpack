import { getSettings } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dialog, Notice, SelectControl, Stack } from '@wordpress/ui';
import useAdminMenuWidth from '../../hooks/use-admin-menu-width';
import { scheduleOptions, type ScheduleOption } from '../../hooks/use-backup-schedule';
import { useUpdateBackupSchedule } from '../../hooks/use-update-backup-schedule';
import type { CSSProperties } from 'react';

type Props = {
	/** The hour WordPress.com currently starts the run, 0–23, in UTC. */
	scheduledHour: number;
	/** Who chose that hour, or null while it is WordPress.com's default. */
	scheduledBy: string | null;
	/** Called once the dialog should go, with true when the new hour was saved. */
	onClose: ( saved: boolean ) => void;
};

/**
 * The site's timezone as its settings name it, e.g. `America/Sao_Paulo` or `UTC+5:30`.
 *
 * @return The timezone label.
 */
function siteTimezoneLabel(): string {
	const { timezone } = getSettings();

	if ( timezone.string ) {
		return timezone.string;
	}

	return `UTC${ Number( timezone.offset ) >= 0 ? '+' : '' }${ timezone.offsetFormatted }`;
}

/**
 * Picks the hour of the day WordPress.com runs the site's daily full backup.
 *
 * @param props               - Component props.
 * @param props.scheduledHour - The current hour, in UTC.
 * @param props.scheduledBy   - Who set it, if anyone.
 * @param props.onClose       - Callback to close the dialog.
 * @return The rendered dialog.
 */
export default function BackupScheduleDialog( { scheduledHour, scheduledBy, onClose }: Props ) {
	const adminMenuWidth = useAdminMenuWidth();
	const items = useMemo( () => scheduleOptions(), [] );
	const [ selected, setSelected ] = useState< ScheduleOption | null >(
		() => items.find( item => item.value === String( scheduledHour ) ) ?? null
	);
	const { mutate, isPending, isError, error } = useUpdateBackupSchedule();

	const handleOpenChange = useCallback(
		( open: boolean ) => {
			// Held open mid-save, so a failure still has somewhere to be reported.
			if ( ! open && ! isPending ) {
				onClose( false );
			}
		},
		[ isPending, onClose ]
	);

	const handleSave = useCallback( () => {
		if ( selected ) {
			mutate( Number( selected.value ), { onSuccess: () => onClose( true ) } );
		}
	}, [ mutate, onClose, selected ] );

	const isUnchanged = ! selected || selected.value === String( scheduledHour );

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup
				size="small"
				className="jpb-menu-aware-dialog"
				style={ { '--jpb-admin-menu-width': `${ adminMenuWidth }px` } as CSSProperties }
			>
				<Dialog.Header>
					<Dialog.Title>{ __( 'Daily backup time', 'jetpack-backup-pkg' ) }</Dialog.Title>
					<Dialog.CloseIcon disabled={ isPending } />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="lg">
						<Dialog.Description>
							{ sprintf(
								/* translators: %s: the site's timezone, e.g. "America/Sao_Paulo" or "UTC+5:30". */
								__(
									"Choose when your daily full backup runs. Times are shown in your site's timezone (%s).",
									'jetpack-backup-pkg'
								),
								siteTimezoneLabel()
							) }
						</Dialog.Description>
						<SelectControl
							label={ __( 'Backup window', 'jetpack-backup-pkg' ) }
							items={ items }
							value={ selected }
							onValueChange={ setSelected }
							disabled={ isPending }
							description={
								scheduledBy
									? sprintf(
											/* translators: %s: display name of the person who chose the backup time. */
											__( 'Set by %s.', 'jetpack-backup-pkg' ),
											scheduledBy
										)
									: __( 'This is the default time.', 'jetpack-backup-pkg' )
							}
						/>
						{ isError && (
							<Notice.Root intent="error">
								<Notice.Description>{ error.message }</Notice.Description>
							</Notice.Root>
						) }
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					<Dialog.Action variant="outline" tone="neutral" disabled={ isPending }>
						{ __( 'Cancel', 'jetpack-backup-pkg' ) }
					</Dialog.Action>
					<Button
						onClick={ handleSave }
						disabled={ isUnchanged || isPending }
						loading={ isPending }
					>
						{ __( 'Save', 'jetpack-backup-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
