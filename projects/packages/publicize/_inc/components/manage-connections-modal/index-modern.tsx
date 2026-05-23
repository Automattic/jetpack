import { getRedirectUrl, useBreakpointMatch } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Link, Text, Tooltip } from '@wordpress/ui';
import clsx from 'clsx';
import { useUserCanShareConnection } from '../../hooks/use-user-can-share-connection';
import { store } from '../../social-store';
import { ModernServicesList } from '../services/services-list-modern';
import { ConfirmationForm } from './confirmation-form';
import styles from './style-modern.module.scss';

export const ModernManageConnectionsModal = () => {
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
		? __( 'Connection confirmation', 'jetpack-publicize-pkg' )
		: _x( 'Manage Jetpack Social connections', '', 'jetpack-publicize-pkg' );

	const canMarkAsShared = useUserCanShareConnection();

	return (
		<Tooltip.Provider delay={ 0 }>
			<Modal
				className={ clsx( styles.modal, {
					[ styles.small ]: isSmall,
					// Pin the frame to its max height while listing services so
					// expanding a disclosure row scrolls inside the modal instead
					// of resizing (and re-centering) the whole frame. The short
					// confirmation view keeps its natural, content-sized height.
					[ styles[ 'services-list' ] ]: ! hasKeyringResult,
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
								<ModernServicesList />
								<Text variant="body-sm" render={ <p className={ styles[ 'manual-share' ] } /> }>
									{ __(
										'Want to share to other networks? Use our Manual Sharing feature from the editor.',
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
							</>
						);
					} )()
				}
			</Modal>
		</Tooltip.Provider>
	);
};
