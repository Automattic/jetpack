import { ThemeProvider } from '@automattic/jetpack-components';
import { Modal, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useConnectInEditor } from '../../hooks/use-connect-in-editor';
import { useConnectService } from '../../hooks/use-connect-service';
import { useIsEditor } from '../../hooks/use-is-editor';
import { useUserCanShareConnection } from '../../hooks/use-user-can-share-connection';
import { store } from '../../social-store';
import { ConfirmationForm } from '../manage-connections-modal/confirmation-form';
import { ConnectForm } from '../services/connect-form';
import { SupportedService } from '../services/types';
import { useSupportedServices } from '../services/use-supported-services';
import styles from './style.module.scss';

/**
 * Account-type subtitle shown under each platform (matches the design).
 *
 * @param id - Service id.
 * @return The account-type label.
 */
function accountTypeLabel( id: string ): string {
	switch ( id ) {
		case 'facebook':
		case 'tumblr':
			return __( 'Page', 'jetpack-publicize-pkg' );
		case 'instagram-business':
			return __( 'Business', 'jetpack-publicize-pkg' );
		case 'linkedin':
			return __( 'Profile / Company', 'jetpack-publicize-pkg' );
		default:
			return __( 'Profile', 'jetpack-publicize-pkg' );
	}
}

type PlatformCardProps = {
	service: SupportedService;
	isConnecting: boolean;
	onSelect: ( service: SupportedService ) => void;
};

/**
 * A single platform card in the picker grid.
 *
 * @param props              - Component props.
 * @param props.service      - The service to render.
 * @param props.isConnecting - Whether this service is connecting.
 * @param props.onSelect     - Called with the service when the card is clicked.
 * @return The card.
 */
function PlatformCard( { service, isConnecting, onSelect }: PlatformCardProps ) {
	const handleClick = useCallback( () => onSelect( service ), [ onSelect, service ] );

	return (
		<button
			type="button"
			className={ styles.card }
			onClick={ handleClick }
			disabled={ isConnecting }
		>
			<span className={ styles.icon }>
				{ isConnecting ? <Spinner /> : <service.icon iconSize={ 40 } /> }
			</span>
			<span className={ styles.name }>{ service.label }</span>
			<span className={ styles.type }>{ accountTypeLabel( service.id ) }</span>
		</button>
	);
}

/**
 * The "Add a new account" flow. Self-contained: a platform-picker grid, the per-service credential
 * form for input-first services (Bluesky/Mastodon), and the post-redirect confirmation — none of
 * which touch the legacy connections modal. In the editor, picking a platform hands the connection
 * off to a new Social admin page tab; on the admin page it connects in place.
 *
 * @return The modal, or null when closed.
 */
export function AddAccountModal() {
	const isOpen = useSelect( select => select( store ).isAddAccountModalOpen(), [] );
	const keyringResult = useSelect( select => select( store ).getKeyringResult(), [] );
	const preselectService = useSelect( select => select( store ).getPreselectService(), [] );
	const connectingService = useSelect( select => select( store ).getConnectingService(), [] );

	const {
		closeAddAccountModal,
		setConnectingService,
		setPreselectService,
		setKeyringResult,
		setReconnectingAccount,
		setConnectSource,
	} = useDispatch( store );

	const supportedServices = useSupportedServices();
	const connectInEditor = useConnectInEditor();
	const connectService = useConnectService();
	const isEditor = useIsEditor();
	const canMarkAsShared = useUserCanShareConnection();

	const closeModal = useCallback( () => {
		setKeyringResult( null );
		setReconnectingAccount( undefined );
		setConnectSource( undefined );
		setConnectingService( undefined );
		setPreselectService( undefined );
		closeAddAccountModal();
	}, [
		closeAddAccountModal,
		setConnectSource,
		setConnectingService,
		setKeyringResult,
		setPreselectService,
		setReconnectingAccount,
	] );

	const backToGrid = useCallback( () => {
		setReconnectingAccount( undefined );
		setPreselectService( undefined );
	}, [ setPreselectService, setReconnectingAccount ] );

	const onSelectPlatform = useCallback(
		( service: SupportedService ) => {
			// Editor: hand the connection off to a new Social admin page tab.
			if ( isEditor ) {
				connectInEditor( service.id );
				return;
			}

			// Admin: input-first services collect credentials here; pure-OAuth services redirect now.
			if ( service.needsCustomInputs ) {
				setPreselectService( service.id );
				return;
			}

			// Spin the card while the connect URL is (re)fetched, then the tab redirects to auth.
			setConnectingService( service.id );
			connectService( service.id ).then( started => {
				if ( ! started ) {
					setConnectingService( undefined );
				}
			} );
		},
		[ connectInEditor, connectService, isEditor, setConnectingService, setPreselectService ]
	);

	if ( ! isOpen ) {
		return null;
	}

	const formService = ! keyringResult?.ID
		? supportedServices.find( service => service.id === preselectService )
		: undefined;

	const title = keyringResult?.ID
		? __( 'Connection confirmation', 'jetpack-publicize-pkg' )
		: __( 'Add a new account', 'jetpack-publicize-pkg' );

	let body: JSX.Element;
	if ( keyringResult?.ID ) {
		body = (
			<ConfirmationForm
				keyringResult={ keyringResult }
				onComplete={ closeModal }
				canMarkAsShared={ canMarkAsShared }
			/>
		);
	} else if ( formService ) {
		body = (
			<div className={ styles[ 'credential-form' ] }>
				<Button variant="minimal" size="compact" onClick={ backToGrid }>
					{ __( '← Back to all platforms', 'jetpack-publicize-pkg' ) }
				</Button>
				<h3 className={ styles[ 'form-heading' ] }>
					{ sprintf(
						/* translators: %s is a social network name, e.g. "Bluesky". */
						__( 'Connect your %s account', 'jetpack-publicize-pkg' ),
						formService.label
					) }
				</h3>
				<ConnectForm service={ formService } displayInputs />
			</div>
		);
	} else {
		body = (
			<>
				<p className={ styles.subtitle }>
					{ __( 'Select your account platform', 'jetpack-publicize-pkg' ) }
				</p>
				<ul className={ styles.grid }>
					{ supportedServices.map( service => (
						<li key={ service.id }>
							<PlatformCard
								service={ service }
								isConnecting={ connectingService === service.id }
								onSelect={ onSelectPlatform }
							/>
						</li>
					) ) }
				</ul>
			</>
		);
	}

	return (
		<ThemeProvider targetDom={ document.body }>
			<Modal className={ styles.modal } title={ title } onRequestClose={ closeModal }>
				{ body }
			</Modal>
		</ThemeProvider>
	);
}
