/**
 * External dependencies
 */
/**
 * Internal dependencies
 */
import useFocusHandler from '../hooks/use-focus-handler';
import useFocusTrap from '../hooks/use-focus-trap';
import useKeydownHandler from '../hooks/use-keydown-handler';
import type { FunctionComponent, MutableRefObject } from 'react';

interface Props {
	onMinimize: () => void;
	onDismiss: ( target: string ) => () => void;
	onNextStepProgression: () => void;
	onPreviousStepProgression: () => void;
	tourContainerRef: MutableRefObject< null | HTMLElement >;
	isMinimized: boolean;
}

const KeyboardNavigation: FunctionComponent< Props > = ( {
	onMinimize,
	onDismiss,
	onNextStepProgression,
	onPreviousStepProgression,
	tourContainerRef,
	isMinimized,
} ) => {
	/**
	 * Expand Tour Nav
	 * @return {null} This component is non-rendering.
	 */
	function ExpandedTourNav() {
		useKeydownHandler( {
			onEscape: onMinimize,
			onArrowRight: onNextStepProgression,
			onArrowLeft: onPreviousStepProgression,
			tourContainerRef,
		} );
		useFocusTrap( tourContainerRef );

		return null;
	}

	/**
	 * Minimize Tour Nav
	 * @return {null} This component is non-rendering.
	 */
	function MinimizedTourNav(): null {
		useKeydownHandler( { onEscape: onDismiss( 'esc-key-minimized' ), tourContainerRef } );

		return null;
	}

	const isTourFocused = useFocusHandler( tourContainerRef );

	if ( ! isTourFocused ) {
		return null;
	}

	return isMinimized ? <MinimizedTourNav /> : <ExpandedTourNav />;
};

export default KeyboardNavigation;
