import { useState, useEffect, useCallback } from '@wordpress/element';

const hasFocus = () => document?.hasFocus() ?? false;

/**
 * Hook that returns whether the page has focus or not.
 *
 * @param {boolean} runOnRender - Whether to run the callback on render.
 * @returns {boolean} Whether the page has focus or not.
 */
const usePageHasFocus = ( runOnRender = false ) => {
	const [ focused, setFocused ] = useState( hasFocus );
	const onPageFocus = useCallback( () => setFocused( true ), [] );
	const onPageLeave = useCallback( () => setFocused( false ), [] );

	useEffect( () => {
		if ( runOnRender ) {
			setFocused( hasFocus() );
		}
		window.addEventListener( 'focus', onPageFocus );
		window.addEventListener( 'blur', onPageLeave );

		return () => {
			window.removeEventListener( 'focus', onPageFocus );
			window.removeEventListener( 'blur', onPageLeave );
		};
	}, [ onPageFocus, onPageLeave, runOnRender ] );

	return focused;
};

export default usePageHasFocus;
