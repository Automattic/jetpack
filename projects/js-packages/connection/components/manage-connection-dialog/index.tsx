/**
 * External dependencies
 */
import { isWoASite } from '@automattic/jetpack-script-data';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, Text } from '@wordpress/ui';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import useRestApiInit from '../../hooks/use-rest-api-init';
/**
 * Internal dependencies
 */
import DisconnectDialog from '../disconnect-dialog';
import DisconnectUserDialog from '../disconnect-user-dialog';
import SharedHelpFooter from '../shared/help-footer';
import ManageConnectionActionCard from '../shared/manage-connection-action-card';
import TransferConnectionOwnership from '../transfer-connection-ownership';
import type { ConnectionUserPermissions } from '../use-connection/types';
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
		permissions?: ConnectionUserPermissions;
	};
}

/** Which view the dialog is showing. */
type TransferView = 'choosing' | 'transferred';

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
	const [ isDisconnectUserDialogOpen, setIsDisconnectUserDialogOpen ] = useState( false );
	const [ transferView, setTransferView ] = useState< TransferView | null >( null );
	const [ isTransferring, setIsTransferring ] = useState( false );
	const headingRef = useRef< HTMLHeadingElement >( null );

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

	const handleDisconnectUser = useCallback( ( e?: MouseEvent< HTMLElement > ) => {
		e && e.preventDefault();
		setIsDisconnectUserDialogOpen( true );
	}, [] );

	const handleCloseDisconnectUserDialog = useCallback( () => {
		setIsDisconnectUserDialogOpen( false );
	}, [] );

	// A finished unlink leaves nothing to come back to, so close the action list behind it.
	const handleUnlinked = useCallback( () => {
		setIsDisconnectUserDialogOpen( false );
		onClose();
		onUnlinked();
	}, [ onClose, onUnlinked ] );

	const openTransferDialog = useCallback( ( e?: MouseEvent< HTMLElement > ) => {
		e && e.preventDefault();
		setTransferView( 'choosing' );
	}, [] );

	// Transferring is the way out of the owner-disconnect warning, so hand the user to
	// that flow rather than running a second copy of it inside the warning.
	const openTransferFromOwnerDialog = useCallback( () => {
		setIsDisconnectUserDialogOpen( false );
		setTransferView( 'choosing' );
	}, [] );

	const recordNewOwner = useCallback( () => {
		setTransferView( 'transferred' );
	}, [] );

	// Closing from anywhere starts the next open on the action list, so a finished
	// transfer cannot come back as the first thing the user sees.
	useEffect( () => {
		if ( ! isOpen ) {
			setTransferView( null );
			setIsTransferring( false );
		}
	}, [ isOpen ] );

	// Swapping the view removes whatever was focused, which otherwise drops focus to the
	// body and leaves a keyboard or screen reader user outside the dialog they are in.
	useEffect( () => {
		if ( isOpen ) {
			headingRef.current?.focus();
		}
	}, [ isOpen, transferView ] );

	// The dialog's own exit, which always closes it. It cannot read "Back": the step
	// has its own Back, and this does something else. Statements rather than a ternary
	// — the minifier folds two `__()` calls into one with a non-literal argument.
	let footerDismissLabel: string = __( 'Cancel', 'jetpack-connection-js' );
	if ( 'transferred' === transferView ) {
		footerDismissLabel = __( 'Close', 'jetpack-connection-js' );
	}

	const heading = transferView
		? __( 'Transfer connection ownership', 'jetpack-connection-js' )
		: title;

	return (
		<>
			{ isOpen && (
				<>
					<Modal
						title=""
						contentLabel={ heading }
						aria={ {
							labelledby: 'jp-connection__manage-dialog__heading',
						} }
						onRequestClose={ onClose }
						shouldCloseOnClickOutside={ 'transferred' === transferView }
						shouldCloseOnEsc={ 'transferred' === transferView }
						isDismissible={ false }
						className={ 'jp-connection__manage-dialog' }
					>
						<div className="jp-connection__manage-dialog__content">
							<h1 id="jp-connection__manage-dialog__heading" ref={ headingRef } tabIndex={ -1 }>
								{ heading }
							</h1>
							<Text className="jp-connection__manage-dialog__large-text">
								{ __(
									'At least one user must be connected for your Jetpack products to work properly.',
									'jetpack-connection-js'
								) }
							</Text>
							{ transferView && (
								<TransferConnectionOwnership
									apiRoot={ apiRoot }
									apiNonce={ apiNonce }
									onTransferred={ recordNewOwner }
									onBusyChange={ setIsTransferring }
									trackingContext={ context }
								/>
							) }
							{ ! transferView &&
								isCurrentUserAdmin &&
								connectedUser.currentUser?.isConnected &&
								connectedUser.currentUser?.isMaster && (
									<ManageConnectionActionCard
										title={ __( 'Transfer ownership to another admin', 'jetpack-connection-js' ) }
										onClick={ openTransferDialog }
										key="transfer"
										action="transfer"
										disabled={ isTransferring }
									/>
								) }
							{ ! transferView && connectedUser.currentUser?.isConnected && (
								<ManageConnectionActionCard
									title={ __( 'Disconnect my user account', 'jetpack-connection-js' ) }
									onClick={ handleDisconnectUser }
									key="unlink"
									action="unlink"
									disabled={ isTransferring }
								/>
							) }
							{ ! transferView && isCurrentUserAdmin && ! isWoASite() && (
								<ManageConnectionActionCard
									title={ __( 'Disconnect Jetpack', 'jetpack-connection-js' ) }
									onClick={ openDisconnectDialog }
									key="disconnect"
									action="disconnect"
									disabled={ isTransferring }
								/>
							) }
						</div>
						<HelpFooter
							onClose={ onClose }
							disabled={ isTransferring }
							dismissLabel={ footerDismissLabel }
						/>

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

						{ /* Mounted only while open, so a failed attempt cannot survive a reopen. */ }
						{ isDisconnectUserDialogOpen && (
							<DisconnectUserDialog
								isOpen
								onClose={ handleCloseDisconnectUserDialog }
								apiRoot={ apiRoot }
								apiNonce={ apiNonce }
								onUnlinked={ handleUnlinked }
								onTransferOwnership={ openTransferFromOwnerDialog }
								context={ context }
							/>
						) }
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
	/** Label for the dismiss button, which depends on where it takes the user. */
	dismissLabel: string;
}

const HelpFooter = ( { onClose, disabled, dismissLabel }: HelpFooterProps ) => {
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
					{ dismissLabel }
				</Button>
			</div>
		</div>
	);
};

export default ManageConnectionDialog;
