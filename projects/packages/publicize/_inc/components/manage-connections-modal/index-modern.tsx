import { getRedirectUrl } from '@automattic/jetpack-components';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Dialog, Link, Text, Tooltip } from '@wordpress/ui';
import { useUserCanShareConnection } from '../../hooks/use-user-can-share-connection';
import { store } from '../../social-store';
import { ModernServicesList } from '../services/services-list-modern';
import { ConfirmationForm } from './confirmation-form';
import styles from './style-modern.module.scss';

// Split the two titles into constants rather than picking them inline with a
// ternary: interpolating translatable strings inside JSX expressions can break
// the way our build extracts/bundles them for translation.
const CONFIRMATION_TITLE = () => __( 'Connection confirmation', 'jetpack-publicize-pkg' );
const MANAGE_TITLE = () => _x( 'Manage Jetpack Social connections', '', 'jetpack-publicize-pkg' );

export const ModernManageConnectionsModal = () => {
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

	// The modal only mounts while open, so any close intent (Esc, backdrop
	// click, close button) routes through here to tear down the store state.
	const onOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				closeModal();
			}
		},
		[ closeModal ]
	);

	const hasKeyringResult = Boolean( keyringResult?.ID );

	const title = hasKeyringResult ? CONFIRMATION_TITLE() : MANAGE_TITLE();

	const canMarkAsShared = useUserCanShareConnection();

	return (
		<Tooltip.Provider delay={ 0 }>
			<Dialog.Root open onOpenChange={ onOpenChange }>
				{ /*
				 * `large` (960px) replaces the previous custom 65rem width; on
				 * small viewports `full` gives the edge-to-edge treatment the
				 * legacy Modal had. While listing services we pin the frame to its
				 * full height (`services-list`): the Dialog is vertically centered,
				 * so a content-sized frame would shift its contents up/down as a
				 * disclosure row expands — pinning it makes the row scroll inside
				 * the popup instead. The short confirmation view keeps its natural
				 * height, and `full` already fills the viewport on mobile.
				 */ }
				<Dialog.Popup
					size={ isSmall ? 'full' : 'large' }
					className={ ! hasKeyringResult && ! isSmall ? styles[ 'services-list' ] : undefined }
				>
					<Dialog.Header>
						<Dialog.Title>{ title }</Dialog.Title>
						<Dialog.CloseIcon />
					</Dialog.Header>
					{ hasKeyringResult ? (
						<ConfirmationForm
							keyringResult={ keyringResult }
							onComplete={ closeModal }
							canMarkAsShared={ canMarkAsShared }
						/>
					) : (
						<>
							<ModernServicesList />
							<Text variant="body-sm" render={ <p className={ styles[ 'manual-share' ] } /> }>
								{ __(
									'Want to share to other networks? Use our Manual Sharing feature from the editor.',
									'jetpack-publicize-pkg'
								) }
								&nbsp;
								<Link openInNewTab href={ getRedirectUrl( 'jetpack-social-manual-sharing-help' ) }>
									{ __( 'Learn more', 'jetpack-publicize-pkg' ) }
								</Link>
							</Text>
						</>
					) }
				</Dialog.Popup>
			</Dialog.Root>
		</Tooltip.Provider>
	);
};
