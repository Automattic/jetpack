import { Modal, Navigator } from '@wordpress/components';
import clsx from 'clsx';
import { useCallback, useContext } from 'react';
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
	const { onClose, initialPath } = useContext( NavigatorModalContext );

	// WordPress Modal's dismisser mechanism (ModalContext) calls onRequestClose()
	// without arguments when another non-nested Modal mounts. We guard against
	// this so that external modals (e.g. Image Studio) don't destroy this one.
	// User-initiated closes (Escape, close button) always pass an event.
	// The NavigatorModal's own Header/Footer close buttons call context.onClose
	// directly and are unaffected by this guard.
	const onRequestClose = useCallback(
		( event?: React.SyntheticEvent ) => {
			if ( event ) {
				onClose?.();
			}
		},
		[ onClose ]
	);

	return (
		<Modal
			__experimentalHideHeader
			onRequestClose={ onRequestClose }
			className={ clsx( 'jp-navigator-modal', className ) }
			{ ...props }
		>
			<Navigator initialPath={ initialPath } className="jp-navigator-modal__navigator">
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
