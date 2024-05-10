import { Button, useGlobalNotices } from '@automattic/jetpack-components';
import {
	BaseControl,
	FlexBlock,
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { store as socialStore } from '../../../social-store';
import { KeyringResult } from '../../../social-store/types';
import { useSupportedServices } from '../use-supported-services';
import styles from './style.module.scss';

type ConfirmationFormProps = {
	keyringResult: KeyringResult;
	onComplete: VoidFunction;
};

/**
 * Connection confirmation component
 *
 * @param {ConfirmationFormProps} props - Component props
 *
 * @returns {import('react').ReactNode} Connection confirmation component
 */
export function ConfirmationForm( { keyringResult, onComplete }: ConfirmationFormProps ) {
	const supportedServices = useSupportedServices();
	const { existingConnections, isCreatingConnection } = useSelect( select => {
		const store = select( socialStore );

		return {
			existingConnections: store.getConnections(),
			isCreatingConnection: store.isCreatingConnection(),
		};
	}, [] );

	const { createErrorNotice } = useGlobalNotices();

	const service = supportedServices.find(
		supportedService => supportedService.ID === keyringResult.service
	);
	const isAlreadyConnected = useCallback(
		( externalID: string ) => {
			return existingConnections.some(
				connection =>
					connection.service_name === service?.ID && connection.external_id === externalID
			);
		},
		[ existingConnections, service.ID ]
	);

	const accountOptions = useMemo( () => {
		const options: Array< { label: string; value: string; profile_picture?: string } > = [];

		// Better safe than sorry
		if ( ! service ) {
			return options;
		}

		// If user account is supported, add it to the list
		if ( ! service.external_users_only ) {
			options.push( {
				label: keyringResult.external_display,
				value: keyringResult.external_ID,
				profile_picture: keyringResult.external_profile_picture,
			} );
		}

		if (
			service.multiple_external_user_ID_support &&
			keyringResult.additional_external_users?.length
		) {
			for ( const user of keyringResult.additional_external_users ) {
				options.push( {
					label: user.external_name,
					value: user.external_ID,
					profile_picture: user.external_profile_picture,
				} );
			}
		}

		return options;
	}, [ keyringResult, service ] );

	const { createConnection } = useDispatch( socialStore );

	const onConfirm = useCallback(
		async ( event: React.FormEvent ) => {
			event.preventDefault();
			// Prevent Jetpack settings from being submitted
			event.stopPropagation();

			const form = event.target as HTMLFormElement;
			const formData = new FormData( form );

			const external_user_ID = formData.get( 'external_user_ID' ).toString();

			if ( isAlreadyConnected( external_user_ID ) ) {
				createErrorNotice( __( 'This account is already connected.', 'jetpack' ) );
				return;
			}

			const data = {
				external_user_ID: service.multiple_external_user_ID_support ? external_user_ID : undefined,
				keyring_connection_ID: keyringResult.ID,
				shared: formData.get( 'shared' ) === '1' ? true : undefined,
			};

			await createConnection( data );

			onComplete();
		},
		[
			createConnection,
			createErrorNotice,
			isAlreadyConnected,
			keyringResult.ID,
			onComplete,
			service.multiple_external_user_ID_support,
		]
	);

	if ( ! accountOptions.length ) {
		// TODO Make this more useful. For example, in case of Instagram, we could show a message that only Instagra business accounts are supported.
		return <div>{ __( 'No accounts/pages found.', 'jetpack' ) }</div>;
	}

	return (
		<section className={ styles.confirmation }>
			<p>
				{ __(
					`Select the account you'd like to connect. All your new blog posts will be automatically shared to this account. You'll be able to change this option in the editor sidebar when you're writing a post.`,
					'jetpack'
				) }
			</p>
			<form className={ styles.form } onSubmit={ onConfirm }>
				{
					//
					/**
					 * It is such a shame that we can't use any of the form components from @wordpress/components here.
					 * Because of the way the components are designed, we can't use them in an uncontrolled way.
					 * Every component is forced be used only in controlled mode.
					 *
					 * @see https://github.com/WordPress/gutenberg/issues/57004
					 */
				 }
				<div className={ styles[ 'accounts-list' ] }>
					{ accountOptions.map( ( option, index ) => {
						const alreadyConnected = isAlreadyConnected( option.value );
						return (
							<label
								key={ option.value }
								className={ styles[ 'account-label' ] }
								aria-disabled={ alreadyConnected }
								aria-required
							>
								<input
									type="radio"
									name="external_user_ID"
									value={ option.value }
									defaultChecked={ index === 0 && ! alreadyConnected }
									className={ styles[ 'account-input' ] }
									disabled={ alreadyConnected }
									required
								/>
								{ option.profile_picture ? (
									<img
										className={ styles[ 'propfile-pic' ] }
										src={ option.profile_picture }
										alt={ option.label }
									/>
								) : null }
								{ option.label }&nbsp;
								{ alreadyConnected ? __( '(Already connected)', 'jetpack' ) : '' }
							</label>
						);
					} ) }
				</div>

				<BaseControl
					id="mark-connection-as-shared"
					help={ __(
						'If enabled, the connection will be available to all administrators, editors, and authors.',
						'jetpack'
					) }
				>
					<HStack justify="flex-start" spacing={ 3 }>
						<span>
							<input type="checkbox" id="mark-connection-as-shared" name="shared" value="1" />
						</span>
						<FlexBlock as="label" htmlFor="mark-connection-as-shared">
							{ __( 'Mark the connection as shared', 'jetpack' ) }
						</FlexBlock>
					</HStack>
				</BaseControl>

				<input type="hidden" name="keyring_connection_ID" value={ keyringResult.ID } />

				<div className={ styles[ 'submit-wrap' ] }>
					<Button variant="secondary" onClick={ onComplete }>
						{ __( 'Cancel', 'jetpack' ) }
					</Button>
					<Button
						type="submit"
						disabled={ isCreatingConnection }
						isLoading={ isCreatingConnection }
					>
						{ isCreatingConnection
							? _x( 'Connecting…', 'Connecting a social media account', 'jetpack' )
							: __( 'Confirm', 'jetpack' ) }
					</Button>
				</div>
			</form>
		</section>
	);
}
