import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { AlertDialog, Button, LinkButton, Stack, Text } from '@wordpress/ui';
import { getSoftwareActionLabels, getThreatLabel } from './labels';
import type { ScanThreat } from './types';
import type { RenderModalProps } from '@wordpress/dataviews';

/**
 * What deleting a theme does, for the confirmation.
 *
 * @param threat - A threat in an unused theme.
 * @return The message.
 */
function getDeleteThemeMessage( threat: ScanThreat ): string {
	return sprintf(
		/* translators: %s is a theme name, such as "Twenty Twenty". */
		__(
			'%s isn’t your active theme or its parent, so deleting it doesn’t change your site. Its files are removed and can’t be restored.',
			'jetpack-protect-pkg'
		),
		threat.extension?.name || getThreatLabel( threat ).subject
	);
}

/**
 * Go to WordPress's delete link, keeping the confirmation busy until the page changes.
 *
 * @param url - The delete link.
 * @return A promise that never settles.
 */
const goToDelete = ( url: string ) => new Promise< never >( () => window.location.assign( url ) );

/**
 * Delete an unused plugin or theme. WordPress confirms plugin deletions itself; themes are confirmed here.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @return The control, or null when the software can't be deleted.
 */
export function DeleteSoftwareButton( { threat }: { threat: ScanThreat } ) {
	const url = threat.extension?.actions?.delete;
	const label = getSoftwareActionLabels( threat ).delete;
	const onConfirm = useCallback( () => ( url ? goToDelete( url ) : undefined ), [ url ] );
	if ( ! url ) {
		return null;
	}
	if ( threat.extension?.type !== 'themes' ) {
		return (
			<LinkButton href={ url } variant="outline" tone="neutral" size="compact">
				{ label }
			</LinkButton>
		);
	}
	return (
		<AlertDialog.Root onConfirm={ onConfirm }>
			<AlertDialog.Trigger render={ <Button variant="outline" tone="neutral" size="compact" /> }>
				{ label }
			</AlertDialog.Trigger>
			<AlertDialog.Popup
				intent="irreversible"
				title={ __( 'Delete theme?', 'jetpack-protect-pkg' ) }
				description={ getDeleteThemeMessage( threat ) }
				confirmButtonText={ label }
			/>
		</AlertDialog.Root>
	);
}

/**
 * The row action's confirmation for deleting an unused theme.
 *
 * @param props            - DataViews modal props.
 * @param props.items      - The threat, as a one-item list.
 * @param props.closeModal - Closes the confirmation.
 * @return The confirmation.
 */
export function DeleteThemeModal( { items, closeModal }: RenderModalProps< ScanThreat > ) {
	const [ threat ] = items;
	const url = threat?.extension?.actions?.delete;
	const onDelete = useCallback( () => url && window.location.assign( url ), [ url ] );
	if ( ! threat || ! url ) {
		return null;
	}
	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md">{ getDeleteThemeMessage( threat ) }</Text>
			<Stack direction="row" gap="sm" justify="end">
				<Button variant="minimal" tone="neutral" onClick={ closeModal }>
					{ __( 'Cancel', 'jetpack-protect-pkg' ) }
				</Button>
				<Button onClick={ onDelete }>{ getSoftwareActionLabels( threat ).delete }</Button>
			</Stack>
		</Stack>
	);
}
