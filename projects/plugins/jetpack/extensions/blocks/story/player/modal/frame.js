/**
 * WordPress dependencies
 */
import { ESCAPE } from '@wordpress/keycodes';
import { useFocusReturn, useConstrainedTabbing } from '@wordpress/compose';

// TODO: replace with `import { useMergeRefs } from '@wordpress/compose';` when package is upgraded to ^3.24.4
import useMergeRefs from '../lib/use-merge-refs';

export default function ModalFrame( {
	overlayClassName,
	children,
	className,
	shouldCloseOnEsc = true,
	onRequestClose,
	onKeyDown,
} ) {
	function handleKeyDown( event ) {
		if ( shouldCloseOnEsc && event.keyCode === ESCAPE ) {
			event.stopPropagation();
			if ( onRequestClose ) {
				onRequestClose( event );
			}
		}
		onKeyDown && onKeyDown( event );
	}

	const constrainedTabbingRef = useConstrainedTabbing();
	const focusReturnRef = useFocusReturn();

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div className={ overlayClassName } onKeyDown={ handleKeyDown }>
			<div
				className={ className }
				ref={ useMergeRefs( [ constrainedTabbingRef, focusReturnRef ] ) }
			>
				{ children }
			</div>
		</div>
	);
}
