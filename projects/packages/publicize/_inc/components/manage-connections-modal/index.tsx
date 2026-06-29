import { getRedirectUrl, Text, ThemeProvider } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import clsx from 'clsx';
import { useIsModernized } from '../../hooks/use-is-modernized';
import { useUserCanShareConnection } from '../../hooks/use-user-can-share-connection';
import { store } from '../../social-store';
import { ServicesList } from '../services/services-list';
import { ConfirmationForm } from './confirmation-form';
import { ModernManageConnectionsModal } from './index-modern';
import styles from './style.module.scss';

export const ManageConnectionsModal = () => {
	const { keyringResult } = useSelect( select => {
		const { getKeyringResult } = select( store );

		return {
			keyringResult: getKeyringResult(),
		};
	}, [] );

	const { setKeyringResult, closeConnectionsModal, setReconnectingAccount } = useDispatch( store );

	const isSmall = useViewportMatch( 'small', '<' );

	const closeModal = useCallback( () => {
		setKeyringResult( null );
		setReconnectingAccount( undefined );
		closeConnectionsModal();
	}, [ closeConnectionsModal, setKeyringResult, setReconnectingAccount ] );

	const hasKeyringResult = Boolean( keyringResult?.ID );

	const title = hasKeyringResult
		? __( 'Connection confirmation', 'jetpack-publicize-pkg' )
		: _x( 'Manage Jetpack Social connections', '', 'jetpack-publicize-pkg' );

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
											'jetpack-publicize-pkg'
										) }
										&nbsp;
										<Link
											openInNewTab
											href={ getRedirectUrl( 'jetpack-social-manual-sharing-help' ) }
										>
											{ __( 'Learn more', 'jetpack-publicize-pkg' ) }
										</Link>
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
	const isModernized = useIsModernized();
	const shouldModalBeOpen = useSelect( select => {
		return select( store ).isConnectionsModalOpen();
	}, [] );

	const Connections = isModernized ? ModernManageConnectionsModal : ManageConnectionsModal;

	return (
		<ThemeProvider targetDom={ document.body }>
			{ shouldModalBeOpen ? <Connections /> : null }
		</ThemeProvider>
	);
}
