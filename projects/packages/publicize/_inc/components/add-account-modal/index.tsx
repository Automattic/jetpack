import { ThemeProvider } from '@automattic/jetpack-components';
import { Modal, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useConnectInEditor } from '../../hooks/use-connect-in-editor';
import { store } from '../../social-store';
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
	onSelect: ( serviceId: string ) => void;
};

/**
 * A single platform card in the picker grid.
 *
 * @param props              - Component props.
 * @param props.service      - The service to render.
 * @param props.isConnecting - Whether this service is connecting.
 * @param props.onSelect     - Called with the service id when the card is clicked.
 * @return The card.
 */
function PlatformCard( { service, isConnecting, onSelect }: PlatformCardProps ) {
	const handleClick = useCallback( () => onSelect( service.id ), [ onSelect, service.id ] );

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

	const { closeAddAccountModal, setConnectingService } = useDispatch( store );
	const supportedServices = useSupportedServices();
	const connectInEditor = useConnectInEditor();

	const closeModal = useCallback( () => {
		setConnectingService( undefined );
		closeAddAccountModal();
	}, [ closeAddAccountModal, setConnectingService ] );

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
								onSelect={ connectInEditor }
							/>
						</li>
					) ) }
				</ul>
			</Modal>
		</ThemeProvider>
	);
}
