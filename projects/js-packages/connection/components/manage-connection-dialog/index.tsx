/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { getScriptData, isWoASite } from '@automattic/jetpack-script-data';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, Text } from '@wordpress/ui';
import { useCallback, useState, useMemo } from 'react';
import useRestApiInit from '../../hooks/use-rest-api-init';
/**
 * Internal dependencies
 */
import ConnectionErrorNotice from '../connection-error-notice';
import DisconnectDialog from '../disconnect-dialog';
import OwnerDisconnectDialog from '../owner-disconnect-dialog';
import SharedHelpFooter from '../shared/help-footer';
import ManageConnectionActionCard from '../shared/manage-connection-action-card';
import type { MouseEvent } from 'react';
import './style.scss';

interface ManageConnectionUser {
	/** The currently logged-in user's connection details. */
	currentUser?: {
		/** The user's WordPress.com ID. */
		id?: number;
		/** The user's WordPress.com login. */
		username?: string;
		/** Whether the user is connected to WordPress.com. */
		isConnected?: boolean;
		/** Whether the user is the connection owner. */
		isMaster?: boolean;
		/** The user's capabilities. */
		permissions?: {
			manage_options?: boolean;
		};
	};
}

interface ManageConnectionDialogProps {
	/** The modal title. */
	title?: string;
	/** API root URL, required. */
	apiRoot: string;
	/** API Nonce, required. */
	apiNonce: string;
	/** Plugins that are using the Jetpack connection. */
	connectedPlugins?: Array< { name: string; slug: string } >;
	/** The callback to be called upon disconnection success. */
	onDisconnected?: () => void;
	/** The callback to be called upon user unlink success. */
	onUnlinked: () => void;
	/** The context in which this component is being used. */
	context?: string;
	/** An object representing the connected user. */
	connectedUser?: ManageConnectionUser;
	/** ID of the currently connected site. */
	connectedSiteId?: number;
	/** Whether or not the dialog modal should be open. */
	isOpen?: boolean;
	/** Callback function for when the modal closes. */
	onClose: () => void;
}

/**
 * The RNA Manage Connection Dialog component.
 *
 * @param {ManageConnectionDialogProps} props -- The properties.
 * @return {import('react').ReactNode} The `ManageConnectionDialog` component.
 */
const ManageConnectionDialog = ( {
	title = __( 'Manage your Jetpack connection', 'jetpack-connection-js' ),
	apiRoot,
	apiNonce,
	connectedPlugins,
	onDisconnected,
	onUnlinked,
	context = 'jetpack-dashboard',
	connectedUser = {}, // Pass empty object to avoid undefined errors.
	connectedSiteId,
	isOpen = false,
	onClose,
}: ManageConnectionDialogProps ) => {
	const [ isDisconnectDialogOpen, setIsDisconnectDialogOpen ] = useState( false );
	const [ isDisconnectingUser, setIsDisconnectingUser ] = useState( false );
	const [ unlinkError, setUnlinkError ] = useState( '' );
	const [ isOwnerDisconnectDialogOpen, setIsOwnerDisconnectDialogOpen ] = useState( false );

	/**
	 * Initialize the REST API.
	 */
	useRestApiInit( apiRoot, apiNonce );

	/**
	 * Open the Disconnect Dialog.
	 */
	const openDisconnectDialog = useCallback(
		( e?: MouseEvent< HTMLElement > ) => {
			e && e.preventDefault();
			setIsDisconnectDialogOpen( true );
		},
		[ setIsDisconnectDialogOpen ]
	);

	/**
	 * Close the Disconnect Dialog.
	 */
	const closeDisconnectDialog = useCallback(
		( e?: MouseEvent< HTMLElement > ) => {
			e && e.preventDefault();
			setIsDisconnectDialogOpen( false );
		},
		[ setIsDisconnectDialogOpen ]
	);

	const isCurrentUserAdmin = useMemo( () => {
		return !! connectedUser.currentUser?.permissions?.manage_options;
	}, [ connectedUser.currentUser ] );

	// Map the connected user into the shape DisconnectDialog expects. Memoized so a
	// fresh object literal each render doesn't re-fire the dialog's analytics effect.
	const disconnectDialogUser = useMemo(
		() => ( {
			ID: connectedUser.currentUser?.id,
			login: connectedUser.currentUser?.username,
		} ),
		[ connectedUser.currentUser?.id, connectedUser.currentUser?.username ]
	);

	const _disconnectUser = useCallback( () => {
		// Not connected to WPCOM? bail.
		if ( ! connectedUser.currentUser?.isConnected ) {
			return;
		}

		setIsDisconnectingUser( true );
		setUnlinkError( '' );

		restApi
			// Passing true to unlink will force the user disconnection
			// This is needed for an admin to disconnect themselves
			.unlinkUser( isCurrentUserAdmin )
			.then( () => {
				setIsDisconnectingUser( false );
				onClose();
				onUnlinked();
			} )
			.catch( () => {
				let errorMessage: string = __(
					'There was some trouble disconnecting your user account, your Jetpack plugin(s) may be outdated. Please visit your plugins page and make sure all Jetpack plugins are updated.',
					'jetpack-connection-js'
				);
				if ( ! isCurrentUserAdmin ) {
					errorMessage = __(
						'There was some trouble disconnecting your user account, your Jetpack plugin(s) may be outdated. Please ask a site admin to update Jetpack',
						'jetpack-connection-js'
					);
				}
				setUnlinkError( errorMessage );
				setIsDisconnectingUser( false );
			} );
	}, [
		setIsDisconnectingUser,
		setUnlinkError,
		isCurrentUserAdmin,
		onUnlinked,
		onClose,
		connectedUser,
	] );

	const handleDisconnectUser = useCallback(
		( e?: MouseEvent< HTMLElement > ) => {
			e && e.preventDefault();

			// If user is connection owner, show warning modal instead of disconnecting
			if ( connectedUser.currentUser?.isMaster ) {
				setIsOwnerDisconnectDialogOpen( true );
				return;
			}

			// Existing disconnect logic for non-owners
			jetpackAnalytics.tracks.recordEvent(
				'jetpack_manage_connection_dialog_disconnect_user_click',
				{ context: context }
			);
			_disconnectUser();
		},
		[ _disconnectUser, context, connectedUser ]
	);

	const isControlsDisabled = useMemo( () => {
		return isDisconnectingUser;
	}, [ isDisconnectingUser ] );

	// This is silly, but it's an optimizer workaround
	const disconnectingText = __( 'Disconnecting…', 'jetpack-connection-js' );

	const handleCloseOwnerDialog = useCallback( () => {
		setIsOwnerDisconnectDialogOpen( false );
	}, [ setIsOwnerDisconnectDialogOpen ] );

	return (
		<>
			{ isOpen && (
				<>
					<Modal
						title=""
						contentLabel={ title }
						aria={ {
							labelledby: 'jp-connection__manage-dialog__heading',
						} }
						onRequestClose={ onClose }
						shouldCloseOnClickOutside={ false }
						shouldCloseOnEsc={ false }
						isDismissible={ false }
						className={ 'jp-connection__manage-dialog' }
					>
						<div className="jp-connection__manage-dialog__content">
							<h1 id="jp-connection__manage-dialog__heading">{ title }</h1>
							<Text className="jp-connection__manage-dialog__large-text">
								{ __(
									'At least one user must be connected for your Jetpack products to work properly.',
									'jetpack-connection-js'
								) }
							</Text>
							{ isCurrentUserAdmin &&
								connectedUser.currentUser?.isConnected &&
								connectedUser.currentUser?.isMaster && (
									<ManageConnectionActionCard
										title={ __( 'Transfer ownership to another admin', 'jetpack-connection-js' ) }
										link={ getRedirectUrl( 'calypso-settings-manage-connection', {
											site: getScriptData()?.site?.suffix,
										} ) }
										isExternal={ true }
										key="transfer"
										action="transfer"
										disabled={ isControlsDisabled }
									/>
								) }
							{ connectedUser.currentUser?.isConnected && (
								<>
									{ '' !== unlinkError && <ConnectionErrorNotice message={ unlinkError } /> }
									<ManageConnectionActionCard
										title={
											isDisconnectingUser
												? disconnectingText
												: __( 'Disconnect my user account', 'jetpack-connection-js' )
										}
										onClick={ handleDisconnectUser }
										key="unlink"
										action="unlink"
										disabled={ isControlsDisabled }
									/>
								</>
							) }
							{ isCurrentUserAdmin && ! isWoASite() && (
								<ManageConnectionActionCard
									title={ __( 'Disconnect Jetpack', 'jetpack-connection-js' ) }
									onClick={ openDisconnectDialog }
									key="disconnect"
									action="disconnect"
									disabled={ isControlsDisabled }
								/>
							) }
						</div>
						<HelpFooter onClose={ onClose } disabled={ isControlsDisabled } />

						<DisconnectDialog
							apiRoot={ apiRoot }
							apiNonce={ apiNonce }
							onDisconnected={ onDisconnected }
							connectedPlugins={ connectedPlugins }
							connectedSiteId={ connectedSiteId }
							connectedUser={ disconnectDialogUser }
							isOpen={ isDisconnectDialogOpen }
							onClose={ closeDisconnectDialog }
							context={ context }
						/>

						<OwnerDisconnectDialog
							isOpen={ isOwnerDisconnectDialogOpen }
							onClose={ handleCloseOwnerDialog }
							apiRoot={ apiRoot }
							apiNonce={ apiNonce }
							onDisconnected={ onDisconnected }
							onUnlinked={ onUnlinked }
						/>
					</Modal>
				</>
			) }
		</>
	);
};

interface HelpFooterProps {
	/** Callback function for when the cancel button is clicked. */
	onClose: () => void;
	/** Whether the cancel button is disabled. */
	disabled?: boolean;
}

const HelpFooter = ( { onClose, disabled }: HelpFooterProps ) => {
	return (
		<div className="jp-row jp-connection__manage-dialog__actions">
			<div className="jp-connection__manage-dialog__text-wrap lg-col-span-9 md-col-span-7 sm-col-span-3">
				{ /* TODO add click tracks */ }
				<SharedHelpFooter namespace="jp-connection__manage-dialog" />
			</div>
			<div className="jp-connection__manage-dialog__button-wrap lg-col-span-3 md-col-span-1 sm-col-span-1">
				<Button
					variant="outline"
					onClick={ onClose }
					className="jp-connection__manage-dialog__btn-dismiss"
					disabled={ disabled }
				>
					{ __( 'Cancel', 'jetpack-connection-js' ) }
				</Button>
			</div>
		</div>
	);
};

export default ManageConnectionDialog;
