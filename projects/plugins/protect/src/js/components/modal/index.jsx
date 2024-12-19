import { __ } from '@wordpress/i18n';
import { close as closeIcon, Icon } from '@wordpress/icons';
import useModal from '../../hooks/use-modal';
import StandaloneModeModal from '../standalone-mode-modal';
import styles from './styles.module.scss';

const MODAL_COMPONENTS = {
	STANDALONE_MODE: StandaloneModeModal,
};

const Modal = () => {
	const { modal, setModal } = useModal();

	if ( ! modal.type ) {
		return null;
	}

	const handleCloseClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const ModalComponent = MODAL_COMPONENTS[ modal.type ];

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
				<ModalComponent { ...modal.props } />
			</div>
		</div>
	);
};

export default Modal;
