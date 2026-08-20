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
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';

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
	const [ touched, setTouched ] = useState< Record< string, boolean > >( {} );

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

			try {
				const opened = await requestAccess( formData, {
					refresh: isReconnecting,
					// An abandoned attempt drops back here, with the values intact.
					onAbort: abandonAuthorization,
					// Surface failures in the step; a global notice sits behind the modal.
					onError: setSubmitError,
				} );

				if ( opened ) {
					goToNextStep();
				}
			} catch {
				setSubmitError(
					__(
						'Could not start the connection. Please refresh the page and try again.',
						'jetpack-publicize-pkg'
					)
				);
			} finally {
				setIsSubmitting( false );
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

	/*
	 * A field's own error only appears once the user has left it, so the message
	 * doesn't fight them while they are still typing the value out.
	 */
	const onBlur = useCallback( ( event: FocusEvent< HTMLInputElement > ) => {
		const { name } = event.target;
		setTouched( current => ( current[ name ] ? current : { ...current, [ name ]: true } ) );
	}, [] );

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
					/*
					 * What the user typed is wrong: say so under the field itself, but
					 * only after they've moved on from it. A duplicate account is not a
					 * field-level problem, so it goes to the notice below instead.
					 */
					const fieldError =
						'invalid' === error?.code && error.field === field.name && touched[ field.name ]
							? error.message
							: null;

					const value = values[ field.name ] ?? '';
					const hint =
						'bluesky' === serviceId && 'handle' === field.name
							? getBlueskyHandleHint( value )
							: null;

					const problem = fieldError ?? hint;

					return (
						<InputControl
							key={ field.name }
							name={ field.name }
							type={ field.type }
							value={ value }
							onChange={ onChange }
							onBlur={ onBlur }
							label={ field.label }
							placeholder={ field.placeholder }
							description={ field.description }
							details={
								problem ? <span className={ styles.hint }>{ problem }</span> : field.details
							}
							autoComplete="off"
							autoCapitalize="off"
							autoCorrect="off"
							spellCheck="false"
						/>
					);
				} ) }

				{ /* A duplicate account, and a submit failure such as a blocked popup,
				     have no single field to attach to. */ }
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
