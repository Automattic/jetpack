import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { close as closeIcon, Icon } from '@wordpress/icons';
import { STORE_ID } from '../../state/store';
import IgnoreThreatModal from '../ignore-threat-modal';
import styles from './styles.module.scss';

const MODAL_COMPONENTS = {
	IGNORE_THREAT: IgnoreThreatModal,
};

const Modal = () => {
	const modalType = useSelect( select => select( STORE_ID ).getModalType() );
	const modalProps = useSelect( select => select( STORE_ID ).getModalProps() );
	const { setModal } = useDispatch( STORE_ID );

	if ( ! modalType ) {
		return null;
	}

	const handleCloseClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const ModalComponent = MODAL_COMPONENTS[ modalType ];

	return (
		<div className={ styles.modal }>
			<div className={ styles.modal__window }>
				<button
					onClick={ handleCloseClick() }
					className={ styles.modal__close }
					title={ __( 'Close Modal Window', 'jetpack-protect' ) }
				>
					<Icon
						icon={ closeIcon }
						size={ 24 }
						className={ styles.modal__close__icon }
						aria-label={ __( 'Close Modal Window', 'jetpack-protect' ) }
					/>
				</button>
				<ModalComponent { ...modalProps } />
			</div>
		</div>
	);
};

export default Modal;
