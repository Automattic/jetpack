/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { useEffect } from 'preact/hooks';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';

const closeOnEscapeKey = callback => event => {
	event.key === 'Escape' && callback();
};

const onKeyPressHandler = event => {
	event.preventDefault();
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
			<div
				className="jetpack-instant-search__overlay-close"
				onClick={ closeOverlay }
				onKeyPress={ onKeyPressHandler }
				role="button"
				tabIndex="0"
			>
				<Gridicon icon="cross" size="24" />
			</div>
			{ children }
		</div>
	);
};

export default Overlay;
