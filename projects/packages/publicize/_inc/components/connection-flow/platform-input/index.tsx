import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useId, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Dialog, InputControl, Notice, Stack, Text } from '@wordpress/ui';
import { store } from '../../../social-store';
import { getConnectFields, getConnectIntro } from '../../services/connect-fields';
import { getBlueskyHandleHint } from '../../services/connect-input-validation';
import { useConnectInputValidation } from '../../services/use-connect-input-validation';
import { useRequestAccess } from '../../services/use-request-access';
import { useService } from '../../services/use-service';
import styles from './style.module.scss';
import type { ConnectionService } from '../../../types';
import type { ConnectInputValues } from '../../services/connect-input-validation';
import type { ChangeEvent, FormEvent } from 'react';

/**
 * The input step of the connection flow, for the services needing credentials
 * before their connect popup can open (Bluesky, Mastodon). Values live in the
 * store so stepping back to the picker does not wipe them; submitting opens the
 * popup via `useRequestAccess` and advances to `authorizing`.
 *
 * @return {import('react').ReactNode} The platform input step.
 */
export function PlatformInput() {
	const formId = useId();

	const { serviceId, storedValues, reconnectingAccount } = useSelect( select => {
		const { getConnectionFlowSelectedServiceId, getConnectionFlowInputs, getReconnectingAccount } =
			select( store );

		return {
			serviceId: getConnectionFlowSelectedServiceId() as ConnectionService[ 'id' ],
			storedValues: getConnectionFlowInputs(),
			reconnectingAccount: getReconnectingAccount(),
		};
	}, [] );

	const {
		setConnectionFlowInput,
		goToNextStep,
		abandonAuthorization,
		cancelConnectionFlow,
		fetchKeyringResult,
		setKeyringResult,
		completeReconnect,
	} = useDispatch( store );

	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const [ submitError, setSubmitError ] = useState< string | null >( null );

	const getService = useService();
	const service = getService( serviceId );

	const isReconnecting = Boolean( serviceId && reconnectingAccount?.service_name === serviceId );

	const fields = useMemo( () => getConnectFields( serviceId ), [ serviceId ] );

	// The account handle goes in the service's first field (`instance` for
	// Mastodon, `handle` for Bluesky); a reconnect starts from it, typed wins.
	const values = useMemo< ConnectInputValues >( () => {
		const handleField = fields[ 0 ]?.name;
		const defaults =
			isReconnecting && handleField ? { [ handleField ]: reconnectingAccount.external_handle } : {};

		return { ...defaults, ...storedValues };
	}, [ fields, isReconnecting, reconnectingAccount, storedValues ] );

	const validateInputs = useConnectInputValidation();
	const { error } = validateInputs( serviceId, values, { allowDuplicate: isReconnecting } );

	const onConfirm = useCallback(
		async ( requestId: string ) => {
			const result = await fetchKeyringResult( requestId );

			/* An in-place reconnect is already handled; otherwise surface the
			   result, which moves the flow on to its confirmation step. */
			const handled = await completeReconnect( result );

			if ( ! handled && result?.ID ) {
				setKeyringResult( result );
			}
		},
		[ completeReconnect, fetchKeyringResult, setKeyringResult ]
	);

	const requestAccess = useRequestAccess( { service, onConfirm } );

	const onSubmit = useCallback(
		async ( event: FormEvent ) => {
			event.preventDefault();
			// Prevent Jetpack settings from being submitted
			event.stopPropagation();

			if ( error ) {
				return;
			}

			setIsSubmitting( true );
			setSubmitError( null );

			const formData = new FormData();

			for ( const [ key, value ] of Object.entries( values ) ) {
				formData.set( key, value );
			}

			const opened = await requestAccess( formData, {
				refresh: isReconnecting,
				// An abandoned attempt drops back here, with the values intact.
				onAbort: abandonAuthorization,
				// Surface failures in the step; a global notice sits behind the modal.
				onError: setSubmitError,
			} );

			setIsSubmitting( false );

			if ( opened ) {
				goToNextStep();
			}
		},
		[ abandonAuthorization, error, goToNextStep, isReconnecting, requestAccess, values ]
	);

	const onChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			setSubmitError( null );
			setConnectionFlowInput( event.target.name, event.target.value );
		},
		[ setConnectionFlowInput ]
	);

	if ( ! fields.length ) {
		return null;
	}

	const intro = getConnectIntro( serviceId );

	return (
		<>
			<Stack direction="column" gap="lg" render={ <form id={ formId } onSubmit={ onSubmit } /> }>
				{ intro ? (
					<Text variant="body-md" render={ <p className={ styles.intro } /> }>
						{ intro }
					</Text>
				) : null }

				{ fields.map( field => {
					const value = values[ field.name ] ?? '';
					const hint =
						'bluesky' === serviceId && 'handle' === field.name
							? getBlueskyHandleHint( value )
							: null;

					return (
						<InputControl
							key={ field.name }
							name={ field.name }
							type={ field.type }
							value={ value }
							onChange={ onChange }
							label={ field.label }
							placeholder={ field.placeholder }
							description={ field.description }
							details={ hint ? <span className={ styles.hint }>{ hint }</span> : field.details }
							autoComplete="off"
							autoCapitalize="off"
							autoCorrect="off"
							spellCheck="false"
						/>
					);
				} ) }

				{ /* Duplicates are called out while typing — unlike a malformed handle,
				     the field alone cannot explain the refusal. A submit failure (e.g.
				     a blocked popup) shows here too, since it has no field to attach to. */ }
				{ ( 'duplicate' === error?.code || submitError ) && (
					<Notice.Root intent="error">
						<Notice.Description>{ submitError ?? error?.message }</Notice.Description>
					</Notice.Root>
				) }
			</Stack>

			<Dialog.Footer>
				<Button
					variant="minimal"
					onClick={ cancelConnectionFlow }
					disabled={ isSubmitting }
					type="button"
				>
					{ __( 'Cancel', 'jetpack-publicize-pkg' ) }
				</Button>
				<Button
					type="submit"
					form={ formId }
					disabled={ Boolean( error ) || isSubmitting }
					loading={ isSubmitting }
				>
					{ __( 'Submit', 'jetpack-publicize-pkg' ) }
				</Button>
			</Dialog.Footer>
		</>
	);
}
