import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dialog } from '@wordpress/ui';
import { CustomServiceFields, isComplete } from './custom-service-fields';
import type { CustomServiceFields as Fields, Service } from '../types';
import type { FormEvent, JSX } from 'react';

const FORM_ID = 'jetpack-sharing-likes-edit-service';

/**
 * Change a custom service's name, sharing URL or icon URL.
 *
 * @param props         - Props.
 * @param props.service - Custom service.
 * @param props.onSave  - Saves the fields, resolving to whether it went through.
 * @param props.onClose - Closes the dialog.
 * @return Dialog.
 */
export function EditCustomServiceDialog( {
	service,
	onSave,
	onClose,
}: {
	service: Service;
	onSave: ( fields: Fields ) => Promise< boolean >;
	onClose: () => void;
} ): JSX.Element {
	const [ fields, setFields ] = useState< Fields >( {
		name: service.name,
		url: service.url ?? '',
		icon: service.icon ?? '',
	} );
	const [ isSaving, setIsSaving ] = useState( false );

	const handleOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onClose();
			}
		},
		[ onClose ]
	);
	const handleSubmit = useCallback(
		async ( event: FormEvent ) => {
			event.preventDefault();
			if ( ! isComplete( fields ) || isSaving ) {
				return;
			}
			setIsSaving( true );
			const saved = await onSave( fields );
			setIsSaving( false );
			if ( saved ) {
				onClose();
			}
		},
		[ fields, isSaving, onClose, onSave ]
	);

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup size="medium">
				<Dialog.Header>
					<Dialog.Title>
						{ sprintf(
							/* translators: %s: custom sharing service name. */
							__( 'Edit %s', 'jetpack-sharing-likes' ),
							service.name
						) }
					</Dialog.Title>
					<Dialog.CloseIconButton />
				</Dialog.Header>
				<Dialog.Content>
					<form id={ FORM_ID } onSubmit={ handleSubmit }>
						<CustomServiceFields values={ fields } onChange={ setFields } />
					</form>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="outline" tone="neutral" onClick={ onClose }>
						{ __( 'Cancel', 'jetpack-sharing-likes' ) }
					</Button>
					<Button
						type="submit"
						form={ FORM_ID }
						disabled={ ! isComplete( fields ) }
						loading={ isSaving }
					>
						{ __( 'Save', 'jetpack-sharing-likes' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
