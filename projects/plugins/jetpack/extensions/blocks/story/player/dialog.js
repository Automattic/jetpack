/**
 * WordPress dependencies
 */
import {
	createElement,
	useCallback,
	useEffect,
	useRef,
} from '@wordpress/element';
import { IsolatedEventContainer, withConstrainedTabbing } from '@wordpress/components';
import { ESCAPE } from '@wordpress/keycodes';

export default withConstrainedTabbing(
	( {
		aria: { describedby, labelledby },
		className,
		contentLabel = null,
		focusOnMount = true,
		isOpened,
		children,
		onRequestClose,
		role = 'dialog',
		shouldCloseOnEsc = true,
	} ) => {
		const dialogRef = useRef();

		const onKeyDown = useCallback( event => {
			if ( event.keyCode === ESCAPE && shouldCloseOnEsc ) {
				event.stopPropagation();
				onRequestClose( event );
			}
		} );

		useEffect( () => {
			if ( focusOnMount && dialogRef.current ) {
				dialogRef.current.focus();
			}
		} );

		if ( ! isOpened ) {
			return <>{ children }</>;
		}

		return (
			<IsolatedEventContainer className={ className } onKeyDown={ onKeyDown }>
				<div
					className="wp-story-dialog wp-story-display-contents"
					ref={ dialogRef }
					role={ role }
					aria-label={ contentLabel }
					aria-labelledby={ contentLabel ? null : labelledby }
					aria-describedby={ describedby }
					tabIndex="-1"
				>
					{ children }
				</div>
			</IsolatedEventContainer>
		);
	}
);
