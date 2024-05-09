import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { useCallback } from 'react';
import { requestExternalAccess } from '../../utils';
import styles from './style.module.scss';
import type { SupportedService } from './use-supported-services';

type ConnectFormProps = {
	service: SupportedService;
	isSmall?: boolean;
	onConfirm: ( data: unknown ) => void;
	onSubmit?: VoidFunction;
	displayInputs?: boolean;
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
	onConfirm,
	onSubmit,
	displayInputs,
}: ConnectFormProps ) {
	const onSubmitForm = useCallback(
		( event: React.FormEvent ) => {
			event.preventDefault();
			// Prevent Jetpack settings from being submitted
			event.stopPropagation();

			if ( onSubmit ) {
				return onSubmit();
			}
			const formData = new FormData( event.target as HTMLFormElement );
			const url = new URL( service.connect_URL );

			switch ( service.ID ) {
				case 'mastodon':
					url.searchParams.set( 'instance', formData.get( 'instance' ) as string );
					break;

				default:
					break;
			}

			requestExternalAccess( url.toString(), onConfirm );
		},
		[ onConfirm, onSubmit, service.ID, service.connect_URL ]
	);

	return (
		<form
			className={ classNames( styles[ 'connect-form' ], { [ styles.small ]: isSmall } ) }
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
			<Button variant="primary" type="submit" size={ isSmall ? 'small' : 'normal' }>
				{ __( 'Connect', 'jetpack' ) }
			</Button>
		</form>
	);
}
