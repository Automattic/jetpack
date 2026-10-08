import { useCallback, useState } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight, plus } from '@wordpress/icons';
import { Button, Dialog, IconButton, Stack, Text } from '@wordpress/ui';
import { CustomServiceFields, EMPTY_CUSTOM_SERVICE, isComplete } from './custom-service-fields';
import { ServiceIcon } from './service-icon';
import type { CustomServiceFields as Fields, Service, ServiceRow } from '../types';
import type { FormEvent, JSX } from 'react';

const FORM_ID = 'jetpack-sharing-likes-custom-service';

/**
 * One service the row can add.
 *
 * @param props         - Props.
 * @param props.service - Service.
 * @param props.onAdd   - Adds it.
 * @return Button.
 */
function ServiceOption( {
	service,
	onAdd,
}: {
	service: Service;
	onAdd: ( id: string ) => void;
} ): JSX.Element {
	const add = useCallback( () => onAdd( service.id ), [ onAdd, service.id ] );

	return (
		<Button variant="outline" tone="neutral" onClick={ add }>
			<ServiceIcon service={ service } />
			{ service.name }
		</Button>
	);
}

/**
 * The services a row can add, one button each, then an optional custom-service step.
 *
 * @param props           - Props.
 * @param props.row       - Row the services go to.
 * @param props.title     - The row's own Add label.
 * @param props.available - Services the site does not use yet.
 * @param props.onAdd     - Adds a service at the end of the row.
 * @param props.onCreate  - Creates a custom service and adds it.
 * @param props.onClose   - Closes the dialog.
 * @return Dialog.
 */
export function AddServicesDialog( {
	row,
	title,
	available,
	onAdd,
	onCreate,
	onClose,
}: {
	row: ServiceRow;
	title: string;
	available: Service[];
	onAdd: ( id: string ) => void;
	onCreate: ( fields: Fields ) => Promise< boolean >;
	onClose: () => void;
} ): JSX.Element {
	const [ step, setStep ] = useState< 'pick' | 'custom' >( 'pick' );
	const [ fields, setFields ] = useState< Fields >( EMPTY_CUSTOM_SERVICE );
	const [ isSaving, setIsSaving ] = useState( false );

	const handleOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onClose();
			}
		},
		[ onClose ]
	);
	const showCustom = useCallback( () => setStep( 'custom' ), [] );
	const showPick = useCallback( () => setStep( 'pick' ), [] );
	const handleSubmit = useCallback(
		async ( event: FormEvent ) => {
			event.preventDefault();
			if ( ! isComplete( fields ) || isSaving ) {
				return;
			}
			setIsSaving( true );
			const created = await onCreate( fields );
			setIsSaving( false );
			if ( created ) {
				setFields( EMPTY_CUSTOM_SERVICE );
				setStep( 'pick' );
			}
		},
		[ fields, isSaving, onCreate ]
	);

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup size="medium">
				<Dialog.Header>
					{ step === 'custom' && (
						<IconButton
							icon={ isRTL() ? chevronRight : chevronLeft }
							label={ __( 'Back', 'jetpack-sharing-likes' ) }
							variant="minimal"
							tone="neutral"
							size="compact"
							onClick={ showPick }
						/>
					) }
					<Dialog.Title>
						{ step === 'custom' ? __( 'Add a custom service', 'jetpack-sharing-likes' ) : title }
					</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
				<Dialog.Content>
					{ step === 'pick' ? (
						<Stack direction="column" gap="lg">
							<Text render={ <p /> }>
								{ row === 'visible'
									? __(
											'Choose a service to add it at the end of your buttons.',
											'jetpack-sharing-likes'
										)
									: __(
											'Choose a service to add it behind the More button.',
											'jetpack-sharing-likes'
										) }
							</Text>
							<Stack direction="row" gap="sm" wrap="wrap">
								{ available.map( service => (
									<ServiceOption key={ service.id } service={ service } onAdd={ onAdd } />
								) ) }
								<Button variant="outline" tone="brand" onClick={ showCustom }>
									<Button.Icon icon={ plus } />
									{ __( 'Custom service', 'jetpack-sharing-likes' ) }
								</Button>
							</Stack>
						</Stack>
					) : (
						<form id={ FORM_ID } onSubmit={ handleSubmit }>
							<CustomServiceFields values={ fields } onChange={ setFields } />
						</form>
					) }
				</Dialog.Content>
				<Dialog.Footer>
					{ step === 'pick' ? (
						<Button onClick={ onClose }>{ __( 'Done', 'jetpack-sharing-likes' ) }</Button>
					) : (
						<Button
							type="submit"
							form={ FORM_ID }
							disabled={ ! isComplete( fields ) }
							loading={ isSaving }
						>
							{ __( 'Create and add', 'jetpack-sharing-likes' ) }
						</Button>
					) }
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
