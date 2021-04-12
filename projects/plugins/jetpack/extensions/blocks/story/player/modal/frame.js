/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { ESCAPE } from '@wordpress/keycodes';
import { useFocusReturn, useFocusOnMount, useConstrainedTabbing } from '@wordpress/compose';

// TODO: replace with `import { useMergeRefs } from '@wordpress/compose';` when package is upgraded to ^3.24.4
import useMergeRefs from '../lib/use-merge-refs';

export default function ModalFrame( {
	overlayClassName,
	aria: { describedby, labelledby },
	contentLabel = null,
	focusOnMount = true,
	isOpened,
	children,
	className,
	role = 'dialog',
	style,
	shouldCloseOnEsc = true,
	onRequestClose,
} ) {
	if ( ! isOpened ) {
		return <>{ children }</>;
	}

	function handleEscapeKeyDown( event ) {
		if ( shouldCloseOnEsc && event.keyCode === ESCAPE ) {
			event.stopPropagation();
			if ( onRequestClose ) {
				onRequestClose( event );
			}
		}
	}
	const focusOnMountRef = useFocusOnMount( focusOnMount );
	const constrainedTabbingRef = useConstrainedTabbing();
	const focusReturnRef = useFocusReturn();

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ classnames( 'wp-story-modal-screen-overlay', overlayClassName ) }
			onKeyDown={ handleEscapeKeyDown }
		>
			<div
				className={ classnames(
					'wp-story-modal-frame-content',
					'wp-story-display-contents',
					className
				) }
				style={ style }
				ref={ useMergeRefs( [ constrainedTabbingRef, focusReturnRef, focusOnMountRef ] ) }
				role={ role }
				aria-label={ contentLabel }
				aria-labelledby={ contentLabel ? null : labelledby }
				aria-describedby={ describedby }
				tabIndex="-1"
			>
				{ children }
			</div>
		</div>
	);
}
