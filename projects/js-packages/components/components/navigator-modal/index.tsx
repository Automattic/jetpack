import { Modal, Navigator } from '@wordpress/components';
import clsx from 'clsx';
import { useContext } from 'react';
import { NavigatorModalContext } from './context.ts';
import { Screen } from './screen.tsx';
import './styles.scss';
import { SharedProps, TNavigatorModalContext } from './types.ts';

/**
 * Renders the internal NavigatorModal component.
 *
 * @param { SharedProps } props - Props
 *
 * @return Component
 */
function InternalNavigatorModal( { children, className }: SharedProps ) {
	const context = useContext( NavigatorModalContext );

	return (
		<Modal
			__experimentalHideHeader
			onRequestClose={ context.onClose }
			className={ clsx( 'jp-navigator-modal', className ) }
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
 * @param {SharedProps & TNavigatorModalContext} props - Props
 *
 * @return Component
 */
function NavigatorModalMain( {
	children,
	className,
	initialPath = '/',
	onClose,
	isDismissible = true,
}: SharedProps & TNavigatorModalContext ) {
	return (
		<NavigatorModalContext.Provider value={ { onClose, initialPath, isDismissible } }>
			<InternalNavigatorModal className={ className }>{ children }</InternalNavigatorModal>
		</NavigatorModalContext.Provider>
	);
}

export const NavigatorModal = Object.assign( NavigatorModalMain, {
	Screen: Object.assign( Screen, {
		displayName: 'NavigatorModal.Screen',
	} ),
} );
