import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { AlertDialog, Button, Notice, Stack, Text } from '@wordpress/ui';
import { getSoftwareActionLabels, getThreatLabel } from './labels';
import { THREAT_PARAM, useScan, useSearchParam } from './store';
import { deleteSoftware } from './threat-actions';
import type { ScanThreat } from './types';
import type { RenderModalProps } from '@wordpress/dataviews';

/**
 * The confirmation's title: "Delete plugin?" or "Delete theme?".
 *
 * @param threat - A threat in an inactive plugin or an unused theme.
 * @return The title.
 */
export function getDeleteTitle( threat: ScanThreat ): string {
	return threat.extension?.type === 'themes'
		? __( 'Delete theme?', 'jetpack-protect-pkg' )
		: __( 'Delete plugin?', 'jetpack-protect-pkg' );
}

/**
 * What deleting the software does, for the confirmation.
 *
 * @param threat - A threat in an inactive plugin or an unused theme.
 * @return The message.
 */
function getDeleteMessage( threat: ScanThreat ): string {
	const name = threat.extension?.name || getThreatLabel( threat ).subject;
	return threat.extension?.type === 'themes'
		? sprintf(
				/* translators: %s is a theme name, such as "Twenty Twenty". */
				__(
					'%s isn’t your active theme or its parent, so deleting it doesn’t change your site. Its files are removed and can’t be restored.',
					'jetpack-protect-pkg'
				),
				name
			)
		: sprintf(
				/* translators: %s is a plugin name, such as "Contact Form 7". */
				__(
					'%s isn’t active, so deleting it doesn’t change your site. Its files are removed and can’t be restored.',
					'jetpack-protect-pkg'
				),
				name
			);
}

/**
 * Delete the software, then close the inspector if its threat went with it.
 *
 * @param threat - The threat.
 * @return Deletes, resolving to `{ error }` when it failed, as AlertDialog's onConfirm takes.
 */
function useDeleteSoftware( threat: ScanThreat | undefined ) {
	const [ selected, setThreat ] = useSearchParam( THREAT_PARAM );
	const scan = useScan();
	return useCallback( async () => {
		const error = threat ? await deleteSoftware( threat ) : null;
		if ( error ) {
			return { error };
		}
		const open = [ ...( scan?.threats ?? [] ), ...( scan?.ignored ?? [] ) ].find(
			item => String( item.id ) === selected
		);
		const isOpenThreatDeleted =
			open?.extension?.type === threat?.extension?.type &&
			open?.extension?.slug === threat?.extension?.slug;
		if ( open && isOpenThreatDeleted ) {
			setThreat();
		}
	}, [ threat, selected, scan, setThreat ] );
}

/**
 * Delete an inactive plugin or an unused theme in place, after a confirmation.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @return The control, or null when the software can't be deleted.
 */
export function DeleteSoftwareButton( { threat }: { threat: ScanThreat } ) {
	const onConfirm = useDeleteSoftware( threat );
	if ( ! threat.extension?.actions?.delete ) {
		return null;
	}
	const label = getSoftwareActionLabels( threat ).delete;
	return (
		<AlertDialog.Root onConfirm={ onConfirm }>
			<AlertDialog.Trigger render={ <Button variant="outline" tone="neutral" size="compact" /> }>
				{ label }
			</AlertDialog.Trigger>
			<AlertDialog.Popup
				intent="irreversible"
				title={ getDeleteTitle( threat ) }
				description={ getDeleteMessage( threat ) }
				confirmButtonText={ label }
			/>
		</AlertDialog.Root>
	);
}

/**
 * The row action's confirmation for deleting an inactive plugin or an unused theme.
 *
 * @param props            - DataViews modal props.
 * @param props.items      - The threat, as a one-item list.
 * @param props.closeModal - Closes the confirmation.
 * @return The confirmation.
 */
export function DeleteSoftwareModal( { items, closeModal }: RenderModalProps< ScanThreat > ) {
	const [ threat ] = items;
	const remove = useDeleteSoftware( threat );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const onDelete = useCallback( async () => {
		setIsDeleting( true );
		setError( null );
		const failure = await remove();
		setIsDeleting( false );
		if ( failure ) {
			setError( failure.error );
		} else {
			closeModal?.();
		}
	}, [ remove, closeModal ] );
	if ( ! threat?.extension?.actions?.delete ) {
		return null;
	}
	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md">{ getDeleteMessage( threat ) }</Text>
			{ error && (
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			) }
			<Stack direction="row" gap="sm" justify="end">
				<Button variant="minimal" tone="neutral" onClick={ closeModal } disabled={ isDeleting }>
					{ __( 'Cancel', 'jetpack-protect-pkg' ) }
				</Button>
				<Button onClick={ onDelete } loading={ isDeleting } disabled={ isDeleting }>
					{ getSoftwareActionLabels( threat ).delete }
				</Button>
			</Stack>
		</Stack>
	);
}
