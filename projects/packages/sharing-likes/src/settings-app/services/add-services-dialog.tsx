import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight, plus } from '@wordpress/icons';
import { Button, Dialog, IconButton, Stack, Text } from '@wordpress/ui';
import { CustomServiceFields, EMPTY_CUSTOM_SERVICE, isComplete } from './custom-service-fields';
import { ServiceIcon } from './service-icon';
import type { CustomServiceFields as Fields, Service } from '../types';
import type { FormEvent, JSX } from 'react';

const FORM_ID = 'jetpack-sharing-likes-custom-service';

/**
 * One service the row can add.
 *
 * @param props         - Props.
 * @param props.service - Service.
 * @param props.index   - Position among the options.
 * @param props.onAdd   - Adds it.
 * @return Button.
 */
function ServiceOption( {
	service,
	index,
	onAdd,
}: {
	service: Service;
	index: number;
	onAdd: ( id: string, index: number ) => void;
} ): JSX.Element {
	const add = useCallback( () => onAdd( service.id, index ), [ index, onAdd, service.id ] );

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
 * @param props.title     - The row's own Add label.
 * @param props.intro     - Where the chosen service goes.
 * @param props.available - Services the site does not use yet.
 * @param props.onAdd     - Adds a service at the end of the row.
 * @param props.onCreate  - Creates a custom service and adds it.
 * @param props.onClose   - Closes the dialog.
 * @return Dialog.
 */
export function AddServicesDialog( {
	title,
	intro,
	available,
	onAdd,
	onCreate,
	onClose,
}: {
	title: string;
	intro: string;
	available: Service[];
	onAdd: ( id: string ) => void;
	onCreate: ( fields: Fields ) => Promise< boolean >;
	onClose: () => void;
} ): JSX.Element {
	const [ step, setStep ] = useState< 'pick' | 'custom' >( 'pick' );
	const [ fields, setFields ] = useState< Fields >( EMPTY_CUSTOM_SERVICE );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ focusAfter, setFocusAfter ] = useState< { id: string; index: number } | null >( null );
	const optionsRef = useRef< HTMLDivElement >( null );
	const formRef = useRef< HTMLFormElement >( null );
	const customButtonRef = useRef< HTMLButtonElement >( null );
	const switchedStep = useRef( false );

	const addOption = useCallback(
		( id: string, index: number ) => {
			setFocusAfter( { id, index } );
			onAdd( id );
		},
		[ onAdd ]
	);

	// The added service's button goes away with it: focus the one now in its place.
	useEffect( () => {
		if ( ! focusAfter || available.some( service => service.id === focusAfter.id ) ) {
			return;
		}
		const buttons = optionsRef.current?.querySelectorAll< HTMLButtonElement >( ':scope > button' );
		if ( buttons?.length ) {
			buttons[ Math.min( focusAfter.index, buttons.length - 1 ) ].focus();
		}
		setFocusAfter( null );
	}, [ available, focusAfter ] );

	const handleOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onClose();
			}
		},
		[ onClose ]
	);
	const showCustom = useCallback( () => {
		switchedStep.current = true;
		setStep( 'custom' );
	}, [] );
	const showPick = useCallback( () => {
		switchedStep.current = true;
		setStep( 'pick' );
	}, [] );

	// The button that switched steps goes away with its step: focus the start of the new one.
	useEffect( () => {
		if ( ! switchedStep.current ) {
			return;
		}
		switchedStep.current = false;
		if ( step === 'custom' ) {
			formRef.current?.querySelector( 'input' )?.focus();
		} else {
			customButtonRef.current?.focus();
		}
	}, [ step ] );
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
					<Dialog.CloseIconButton />
				</Dialog.Header>
				<Dialog.Content>
					{ step === 'pick' ? (
						<Stack direction="column" gap="lg">
							<Text render={ <p /> }>{ intro }</Text>
							<Stack direction="row" gap="sm" wrap="wrap" ref={ optionsRef }>
								{ available.map( ( service, index ) => (
									<ServiceOption
										key={ service.id }
										service={ service }
										index={ index }
										onAdd={ addOption }
									/>
								) ) }
								<Button
									ref={ customButtonRef }
									variant="outline"
									tone="brand"
									onClick={ showCustom }
								>
									<Button.Icon icon={ plus } />
									{ __( 'Custom service', 'jetpack-sharing-likes' ) }
								</Button>
							</Stack>
						</Stack>
					) : (
						<form id={ FORM_ID } ref={ formRef } onSubmit={ handleSubmit }>
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
