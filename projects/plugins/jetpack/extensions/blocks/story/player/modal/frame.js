import {
	useFocusReturn,
	useConstrainedTabbing,
	useFocusOnMount,
	useMergeRefs,
} from '@wordpress/compose';
import { ESCAPE, SPACE } from '@wordpress/keycodes';

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
