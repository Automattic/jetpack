import { ThemeProvider } from '@automattic/jetpack-components';
import { Modal, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useConnectInEditor } from '../../hooks/use-connect-in-editor';
import { useIsEditor } from '../../hooks/use-is-editor';
import { store } from '../../social-store';
import { startServiceConnect } from '../../utils';
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
 * The "Add a new account" platform-picker grid (editor). Picking a platform opens the connect flow
 * on the Social admin page in a new tab.
 *
 * @return The modal, or null when closed.
 */
export function AddAccountModal() {
	const isOpen = useSelect( select => select( store ).isAddAccountModalOpen(), [] );
	const connectingService = useSelect( select => select( store ).getConnectingService(), [] );

	const { closeAddAccountModal, setConnectingService, setPreselectService, openConnectionsModal } =
		useDispatch( store );
	const supportedServices = useSupportedServices();
	const connectInEditor = useConnectInEditor();
	const isEditor = useIsEditor();

	const closeModal = useCallback( () => {
		setConnectingService( undefined );
		closeAddAccountModal();
	}, [ closeAddAccountModal, setConnectingService ] );

	const onSelectPlatform = useCallback(
		( service: SupportedService ) => {
			// Editor: hand the connection off to a new Social admin page tab.
			if ( isEditor ) {
				connectInEditor( service.id );
				return;
			}

			// Admin: input-first services collect credentials in the connections modal; pure-OAuth
			// services redirect straight away.
			if ( service.needsCustomInputs ) {
				setPreselectService( service.id );
				closeAddAccountModal();
				openConnectionsModal();
				return;
			}

			if ( service.url ) {
				startServiceConnect( service.url, service.id );
			}
		},
		[ closeAddAccountModal, connectInEditor, isEditor, openConnectionsModal, setPreselectService ]
	);

	if ( ! isOpen ) {
		return null;
	}

	return (
		<ThemeProvider targetDom={ document.body }>
			<Modal
				className={ styles.modal }
				title={ __( 'Add a new account', 'jetpack-publicize-pkg' ) }
				onRequestClose={ closeModal }
			>
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
			</Modal>
		</ThemeProvider>
	);
}
