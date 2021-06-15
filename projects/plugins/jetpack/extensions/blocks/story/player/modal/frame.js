/**
 * WordPress dependencies
 */
import { ESCAPE, SPACE } from '@wordpress/keycodes';
import { useFocusReturn, useConstrainedTabbing, useFocusOnMount } from '@wordpress/compose';

// TODO: replace with `import { useMergeRefs } from '@wordpress/compose';` when package is upgraded to ^3.24.4
import useMergeRefs from '../lib/use-merge-refs';

export default function ModalFrame( {
	overlayClassName,
	children,
	className,
	focusOnMount,
	shouldCloseOnEsc = true,
	onRequestClose,
	onKeyDown,
	modalRef,
} ) {
	function handleKeyDown( event ) {
		if ( shouldCloseOnEsc && event.keyCode === ESCAPE ) {
			event.stopPropagation();
			if ( onRequestClose ) {
				onRequestClose( event );
			}
		}
		// Ignore events triggered by pressing on a button using the spacebar
		if (
			event.target &&
			event.target.tagName.toLowerCase() === 'button' &&
			event.keyCode === SPACE
		) {
			return;
		}
		onKeyDown && onKeyDown( event );
	}

	const focusOnMountRef = useFocusOnMount( focusOnMount );
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusReturnRef = useFocusReturn();

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div className={ overlayClassName } onKeyDown={ handleKeyDown }>
			<div
				className={ className }
				ref={ useMergeRefs( [ constrainedTabbingRef, focusReturnRef, focusOnMountRef, modalRef ] ) }
			>
				{ children }
			</div>
		</div>
	);
}
