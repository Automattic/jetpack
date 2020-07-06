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

const Overlay = props => {
	const { children, closeOverlay, colorTheme, hasOverlayWidgets, isVisible, opacity } = props;
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
				hasOverlayWidgets ? '' : 'jetpack-instant-search__overlay--no-sidebar',
				isVisible ? '' : 'is-hidden',
			].join( ' ' ) }
			style={ { opacity: isVisible ? opacity / 100 : 0 } }
		>
			{ children }
		</div>
	);
};

export default Overlay;
