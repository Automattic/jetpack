import {
	Dialog,
	VisuallyHidden,
	getWpCompatOverlaySlot,
	useEnableWpCompatOverlaySlot,
} from '@wordpress/ui';
import { useCallback, useRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';

type DialogOpenChange = NonNullable< ComponentProps< typeof Dialog.Root >[ 'onOpenChange' ] >;

interface ConnectionDialogBaseProps {
	/** Whether the dialog is open. */
	isOpen?: boolean;
	/** Callback fired when the dialog asks to close. */
	onClose: VoidFunction;
	/** Whether pressing Escape dismisses the dialog. */
	dismissOnEscape?: boolean;
	/** Class name applied to the dialog popup. */
	className?: string;
	/** The dialog body. */
	children?: ReactNode;
}

/**
 * The title is set exactly one way, enforced by the type:
 *
 * `hasOwnTitle`: the body renders its own `ConnectionDialogTitle`, which
 * supplies the accessible name. `title` is then neither needed nor allowed.
 * Otherwise `title` is required, and rendered for assistive technology only,
 * so the dialog keeps a stable accessible name regardless of which step the
 * body is showing.
 */
export type ConnectionDialogProps = ConnectionDialogBaseProps &
	( { hasOwnTitle: true; title?: never } | { hasOwnTitle?: false; title: string } );

/**
 * Shared `@wordpress/ui` Dialog scaffolding for the connection dialogs.
 *
 * Centralises the dismissal policy the connection dialogs share: they are
 * modal, cannot be dismissed by clicking the backdrop, and (by default) ignore
 * Escape, so leaving is an explicit choice made through a footer action.
 *
 * @param {ConnectionDialogProps} props - The component props.
 * @return {import('react').ReactNode} - The ConnectionDialog component.
 */
const ConnectionDialog = ( {
	isOpen,
	onClose,
	title,
	hasOwnTitle = false,
	dismissOnEscape = false,
	className,
	children,
}: ConnectionDialogProps ) => {
	// `Dialog` portals to `<body>` with no z-index of its own, which leaves it
	// below wp-admin chrome such as the admin menu. The compat overlay slot is
	// the package's own answer to that.
	useEnableWpCompatOverlaySlot();

	// wp-admin screens are dense with links, and Base UI focuses the first
	// tabbable element on open — which lands on whatever link happens to come
	// first in the body. Focus the popup instead, as the old Modal did.
	const popupRef = useRef< HTMLDivElement >( null );

	const handleOpenChange = useCallback< DialogOpenChange >(
		( open, eventDetails ) => {
			if ( open ) {
				return;
			}

			if ( ! dismissOnEscape && eventDetails.reason === 'escape-key' ) {
				// Leave the dialog open, and let the keydown reach listeners
				// further up the tree (the disconnect step tracks its own).
				eventDetails.cancel();
				eventDetails.allowPropagation();
				return;
			}

			onClose();
		},
		[ dismissOnEscape, onClose ]
	);

	return (
		<Dialog.Root open={ !! isOpen } onOpenChange={ handleOpenChange } disablePointerDismissal>
			{ /* `stretch` drops the preset max-width so the dialog stylesheets keep owning the sizing. */ }
			<Dialog.Popup
				ref={ popupRef }
				initialFocus={ popupRef }
				portal={ <Dialog.Portal container={ getWpCompatOverlaySlot() } /> }
				className={ className }
				size="stretch"
			>
				{ ! hasOwnTitle && <VisuallyHidden render={ <Dialog.Title /> }>{ title }</VisuallyHidden> }
				{ children }
			</Dialog.Popup>
		</Dialog.Root>
	);
};

export interface ConnectionDialogTitleProps {
	/** The heading id, for consumers that reference it from other markup. */
	id?: string;
	/** Class name applied to the heading. */
	className?: string;
	/** The heading content. */
	children?: ReactNode;
}

/**
 * The visible dialog heading, doubling as the dialog's accessible name.
 *
 * Renders as an `<h1>` to preserve the heading level the connection dialogs
 * used before the `Modal` migration.
 *
 * @param {ConnectionDialogTitleProps} props - The component props.
 * @return {import('react').ReactNode} - The ConnectionDialogTitle component.
 */
export const ConnectionDialogTitle = ( { children, ...props }: ConnectionDialogTitleProps ) => (
	<Dialog.Title render={ <h1 /> } { ...props }>
		{ children }
	</Dialog.Title>
);

export default ConnectionDialog;
