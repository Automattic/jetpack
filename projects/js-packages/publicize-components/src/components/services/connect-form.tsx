import { Button } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback } from 'react';
import { store } from '../../social-store';
import { KeyringResult } from '../../social-store/types';
import { SupportedService } from '../services/use-supported-services';
import styles from './style.module.scss';
import { useRequestAccess } from './use-request-access';

type ConnectFormProps = {
	service: SupportedService;
	isSmall?: boolean;
	onSubmit?: VoidFunction;
	displayInputs?: boolean;
	hasConnections?: boolean;
	buttonLabel?: string;
};

/**
 * Connect form component
 *
 * @param {ConnectFormProps} props - Component props
 *
 * @returns {import('react').ReactNode} Connect form component
 */
export function ConnectForm( {
	service,
	isSmall,
	onSubmit,
	displayInputs,
	hasConnections,
	buttonLabel,
}: ConnectFormProps ) {
	const { setKeyringResult } = useDispatch( store );

	const { isConnectionsModalOpen } = useSelect( select => select( store ), [] );

	const onConfirm = useCallback(
		( result: KeyringResult ) => {
			// Set the keyring result only if the modal is open
			if ( isConnectionsModalOpen() ) {
				setKeyringResult( result );
			}
		},
		[ setKeyringResult, isConnectionsModalOpen ]
	);

	const requestAccess = useRequestAccess( {
		service,
		onConfirm,
	} );

	const onSubmitForm = useCallback(
		( event: React.FormEvent ) => {
			event.preventDefault();
			// Prevent Jetpack settings from being submitted
			event.stopPropagation();

			if ( onSubmit ) {
				return onSubmit();
			}

			const formData = new FormData( event.target as HTMLFormElement );
			requestAccess( formData );
		},
		[ onSubmit, requestAccess ]
	);

	return (
		<form
			className={ clsx( styles[ 'connect-form' ], { [ styles.small ]: isSmall } ) }
			onSubmit={ onSubmitForm }
		>
			{ displayInputs ? (
				<>
					{ 'mastodon' === service.ID ? (
						<input
							required
							type="text"
							name="instance"
							aria-label={ __( 'Mastodon username', 'jetpack' ) }
							placeholder={ '@mastodon@mastodon.social' }
						/>
					) : null }
				</>
			) : null }
			<Button
				variant={ hasConnections ? 'secondary' : 'primary' }
				type="submit"
				className={ styles[ 'connect-button' ] }
			>
				{ ( label => {
					if ( label ) {
						return label;
					}

					return hasConnections ? _x( 'Connect more', '', 'jetpack' ) : __( 'Connect', 'jetpack' );
				} )( buttonLabel ) }
			</Button>
		</form>
	);
}
