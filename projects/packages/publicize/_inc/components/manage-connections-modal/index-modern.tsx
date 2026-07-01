import { getRedirectUrl } from '@automattic/jetpack-components';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dialog, Link, Text, Tooltip } from '@wordpress/ui';
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

	// Hold each title in its own variable and select with the ternary afterwards.
	// Picking inline (`cond ? __( 'A' ) : __( 'B' )`) lets the minifier fold both
	// branches into a single `__( cond ? 'A' : 'B' )` call, which the i18n string
	// extraction can no longer read.
	const confirmationTitle = __( 'Connection confirmation', 'jetpack-publicize-pkg' );
	const manageTitle = __( 'Manage Jetpack Social connections', 'jetpack-publicize-pkg' );
	const title = hasKeyringResult ? confirmationTitle : manageTitle;

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
				 *
				 * Both non-`full` views also carry the admin-menu workaround so they
				 * don't tuck under the wp-admin sidebar: `services-list` (its
				 * horizontal half) and `menu-aware` (the confirmation view). See the
				 * workaround section in style-modern.module.scss.
				 */ }
				<Dialog.Popup
					size={ isSmall ? 'full' : 'large' }
					className={
						isSmall ? undefined : styles[ hasKeyringResult ? 'menu-aware' : 'services-list' ]
					}
				>
					<Dialog.Header className={ styles[ 'modal-header' ] }>
						<Dialog.Title>{ title }</Dialog.Title>
						<Dialog.CloseIcon />
					</Dialog.Header>
					{ hasKeyringResult ? (
						/*
						 * Wrap the confirmation form in `Dialog.Content` too, so it
						 * picks up the same body inset the services list gets
						 * (`0 24px 24px`). Rendered bare, the form ran edge-to-edge
						 * and the footer buttons sat flush against the popup bottom.
						 */
						<Dialog.Content>
							<ConfirmationForm
								keyringResult={ keyringResult }
								onComplete={ closeModal }
								canMarkAsShared={ canMarkAsShared }
							/>
						</Dialog.Content>
					) : (
						/*
						 * `Dialog.Content` is the library's scroll region (flex:1;
						 * min-block-size:0; overflow-block:auto), so when the pinned
						 * frame (`services-list`) is shorter than the content —
						 * e.g. an expanded disclosure row like the Instagram preview —
						 * the body scrolls inside the frame instead of clipping, and
						 * the header/footer stay pinned at the popup edges.
						 */
						<Dialog.Content className={ styles[ 'modal-content' ] }>
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
						</Dialog.Content>
					) }
				</Dialog.Popup>
			</Dialog.Root>
		</Tooltip.Provider>
	);
};
