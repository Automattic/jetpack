import { Modal, Navigator } from '@wordpress/components';
import clsx from 'clsx';
import { useContext } from 'react';
import { NavigatorModalContext } from './context.ts';
import { Screen } from './screen.tsx';
import './styles.scss';
import { TNavigatorModalContext } from './types.ts';

type ModalProps = React.ComponentProps< typeof Modal >;

// Omit onRequestClose since NavigatorModal uses onClose from TNavigatorModalContext instead
type NavigatorModalProps = Omit< ModalProps, 'onRequestClose' > & TNavigatorModalContext;

/**
 * Renders the internal NavigatorModal component.
 *
 * @param { ModalProps } props - Props
 *
 * @return Component
 */
function InternalNavigatorModal( {
	children,
	className,
	...props
}: Omit< ModalProps, 'onRequestClose' > ) {
	const context = useContext( NavigatorModalContext );

	return (
		<Modal
			__experimentalHideHeader
			onRequestClose={ context.onClose }
			className={ clsx( 'jp-navigator-modal', className ) }
			{ ...props }
		>
			<Navigator initialPath={ context.initialPath } className="jp-navigator-modal__navigator">
				{ children }
			</Navigator>
		</Modal>
	);
}

/**
 * Renders a modal with navigator capabilities.
 *
 * @param {NavigatorModalProps} props - Props
 *
 * @return Component
 */
function NavigatorModalMain( {
	children,
	className,
	initialPath = '/',
	onClose,
	isDismissible = true,
	...props
}: NavigatorModalProps ) {
	return (
		<NavigatorModalContext.Provider value={ { onClose, initialPath, isDismissible } }>
			<InternalNavigatorModal className={ className } { ...props }>
				{ children }
			</InternalNavigatorModal>
		</NavigatorModalContext.Provider>
	);
}

export const NavigatorModal = Object.assign( NavigatorModalMain, {
	Screen: Object.assign( Screen, {
		displayName: 'NavigatorModal.Screen',
	} ),
} );
