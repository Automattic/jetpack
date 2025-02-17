import {
	getRedirectUrl,
	Text,
	ThemeProvider,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { ExternalLink, Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import clsx from 'clsx';
import { useUserCanShareConnection } from '../../hooks/use-user-can-share-connection';
import { store } from '../../social-store';
import { ServicesList } from '../services/services-list';
import { ConfirmationForm } from './confirmation-form';
import styles from './style.module.scss';

export const ManageConnectionsModal = () => {
	const { keyringResult } = useSelect( select => {
		const { getKeyringResult } = select( store );

		return {
			keyringResult: getKeyringResult(),
		};
	}, [] );

	const { setKeyringResult, closeConnectionsModal, setReconnectingAccount } = useDispatch( store );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const closeModal = useCallback( () => {
		setKeyringResult( null );
		setReconnectingAccount( undefined );
		closeConnectionsModal();
	}, [ closeConnectionsModal, setKeyringResult, setReconnectingAccount ] );

	const hasKeyringResult = Boolean( keyringResult?.ID );

	const title = hasKeyringResult
		? __( 'Connection confirmation', 'jetpack-publicize-components' )
		: _x( 'Manage Jetpack Social connections', '', 'jetpack-publicize-components' );

	const canMarkAsShared = useUserCanShareConnection();

	return (
		<Modal
			className={ clsx( styles.modal, {
				[ styles.small ]: isSmall,
			} ) }
			onRequestClose={ closeModal }
			title={ title }
		>
			{
				//Use IIFE to avoid nested ternary
				( () => {
					if ( hasKeyringResult ) {
						return (
							<ConfirmationForm
								keyringResult={ keyringResult }
								onComplete={ closeModal }
								canMarkAsShared={ canMarkAsShared }
							/>
						);
					}

					return (
						<>
							<ServicesList />
							<div className={ styles[ 'manual-share' ] }>
								<em>
									<Text>
										{ __(
											`Want to share to other networks? Use our Manual Sharing feature from the editor.`,
											'jetpack-publicize-components'
										) }
										&nbsp;
										<ExternalLink href={ getRedirectUrl( 'jetpack-social-manual-sharing-help' ) }>
											{ __( 'Learn more', 'jetpack-publicize-components' ) }
										</ExternalLink>
									</Text>
								</em>
							</div>
						</>
					);
				} )()
			}
		</Modal>
	);
};

/**
 * Themed Manage connections modal component.
 *
 * This component can be used to avoid dealing with modal state management.
 *
 * @return {import('react').ReactNode} - React element
 */
export function ThemedConnectionsModal() {
	const shouldModalBeOpen = useSelect( select => {
		return select( store ).isConnectionsModalOpen();
	}, [] );

	return (
		<ThemeProvider targetDom={ document.body }>
			{ shouldModalBeOpen ? <ManageConnectionsModal /> : null }
		</ThemeProvider>
	);
}
