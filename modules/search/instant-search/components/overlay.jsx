/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { useEffect } from 'preact/hooks';

/**
 * Internal dependencies
 */

const closeOnEscapeKey = callback => event => {
	event.key === 'Escape' && callback();
};

const Overlay = ( { children, closeOverlay, colorTheme, isVisible, opacity } ) => {
	useEffect( () => {
		window.addEventListener( 'keydown', closeOnEscapeKey( closeOverlay ) );
		return () => {
			// Cleanup after event
			window.removeEventListener( 'keydown', closeOnEscapeKey( closeOverlay ) );
		};
	}, [] );

	return (
		<div
			className={ [
				'jetpack-instant-search__overlay',
				`jetpack-instant-search__overlay--${ colorTheme }`,
				isVisible ? '' : 'is-hidden',
			].join( ' ' ) }
			style={ { opacity: opacity / 100 } }
		>
			{ children }
		</div>
	);
};

export default Overlay;
